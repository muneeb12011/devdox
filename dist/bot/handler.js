"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handlePROpened = handlePROpened;
const rest_1 = require("@octokit/rest");
const auth_app_1 = require("@octokit/auth-app");
const analyzePR_1 = require("../services/analyzePR");
const formatter_1 = require("./formatter");
async function getInstallationAuth(installationId) {
    const rawKey = process.env.PRIVATE_KEY
        .replace(/\\n/g, "\n")
        .replace(/^"/, "")
        .replace(/"$/, "")
        .trim();
    const auth = (0, auth_app_1.createAppAuth)({
        appId: Number(process.env.APP_ID),
        privateKey: rawKey,
        installationId,
    });
    const { token } = await auth({ type: "installation" });
    return { octokit: new rest_1.Octokit({ auth: token }), token };
}
async function saveADRToRepo(octokit, owner, repo, pull_number, prTitle, adrContent) {
    const date = new Date().toISOString().split("T")[0];
    const slug = prTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 50);
    const path = `docs/decisions/${date}-${slug}-pr${pull_number}.md`;
    try {
        // Check if file exists
        let sha;
        try {
            const existing = await octokit.repos.getContent({ owner, repo, path });
            sha = existing.data.sha;
        }
        catch {
            // File doesn't exist yet — that's fine
        }
        await octokit.repos.createOrUpdateFileContents({
            owner,
            repo,
            path,
            message: `docs: add ADR for PR #${pull_number} [skip ci]`,
            content: Buffer.from(adrContent).toString("base64"),
            ...(sha ? { sha } : {}),
        });
        console.log(`[DevDox] ADR saved to ${path}`);
    }
    catch (err) {
        console.warn(`[DevDox] Could not save ADR to repo: ${err.message}`);
    }
}
async function handlePROpened({ payload }) {
    const pr = payload.pull_request;
    const owner = payload.repository.owner.login;
    const repo = payload.repository.name;
    const pull_number = pr.number;
    const prUrl = pr.html_url;
    const installationId = payload.installation?.id;
    console.log(`[DevDox] PR #${pull_number} opened in ${owner}/${repo}`);
    if (!installationId) {
        console.error("[DevDox] No installation ID in payload");
        return;
    }
    let octokit, token;
    try {
        const auth = await getInstallationAuth(installationId);
        octokit = auth.octokit;
        token = auth.token;
    }
    catch (err) {
        console.error("[DevDox] Auth failed:", err.message);
        return;
    }
    const thinkingComment = await octokit.issues.createComment({
        owner,
        repo,
        issue_number: pull_number,
        body: `## 🤖 DevDox is analyzing this PR...\n\n> Fetching commits, linked tickets, and discussions. ADR will appear here in ~15 seconds.`,
    });
    try {
        const result = await (0, analyzePR_1.analyzePR)(prUrl, token);
        const commentBody = (0, formatter_1.formatADRComment)(result, prUrl);
        await Promise.all([
            octokit.issues.updateComment({
                owner,
                repo,
                comment_id: thinkingComment.data.id,
                body: commentBody,
            }),
            saveADRToRepo(octokit, owner, repo, pull_number, pr.title, result.suggestedADR),
        ]);
        console.log(`[DevDox] ADR posted and saved for PR #${pull_number}`);
    }
    catch (err) {
        console.error(`[DevDox] Analysis failed for PR #${pull_number}:`, err.message);
        await octokit.issues.updateComment({
            owner,
            repo,
            comment_id: thinkingComment.data.id,
            body: `## 🤖 DevDox — Analysis Failed\n\n> ❌ ${err.message}\n\nPlease check your configuration or try again.`,
        });
    }
}
