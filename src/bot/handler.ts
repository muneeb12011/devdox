import { Octokit } from "@octokit/rest";
import { createAppAuth } from "@octokit/auth-app";
import { analyzePR } from "../services/analyzePR";
import { formatADRComment } from "./formatter";
import { AnalysisResult } from "../schemas/analysis.schema";

async function getInstallationAuth(installationId: number) {
  const rawKey = process.env.PRIVATE_KEY!
    .replace(/\\n/g, "\n")
    .replace(/^"/, "")
    .replace(/"$/, "")
    .trim();

  const auth = createAppAuth({
    appId: Number(process.env.APP_ID!),
    privateKey: rawKey,
    installationId,
  });

  const { token } = await auth({ type: "installation" });
  return { octokit: new Octokit({ auth: token }), token };
}

export async function handlePROpened({ payload }: { payload: any }) {
  const pr = payload.pull_request;
  const owner = payload.repository.owner.login;
  const repo = payload.repository.name;
  const pull_number = pr.number;
  const prUrl = pr.html_url;
  const installationId = payload.installation.id;

  console.log(`[DevDox] PR opened: ${prUrl}`);

  const { octokit, token } = await getInstallationAuth(installationId);

  const thinkingComment = await octokit.issues.createComment({
    owner,
    repo,
    issue_number: pull_number,
    body: `## 🤖 DevDox is analyzing this PR...\n\n> Fetching commits, linked tickets, and discussions. ADR will appear here in ~15 seconds.`,
  });

  try {
    const result = await analyzePR(prUrl, token) as AnalysisResult;
    const commentBody = formatADRComment(result, prUrl);

    await octokit.issues.updateComment({
      owner,
      repo,
      comment_id: thinkingComment.data.id,
      body: commentBody,
    });

    console.log(`[DevDox] ADR posted for PR #${pull_number}`);
  } catch (err: any) {
    console.error(`[DevDox] Analysis failed: ${err.message}`);

    await octokit.issues.updateComment({
      owner,
      repo,
      comment_id: thinkingComment.data.id,
      body: `## 🤖 DevDox — Analysis Failed\n\n> ❌ ${err.message}\n\nPlease check your configuration or try again.`,
    });
  }
}