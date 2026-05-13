import { getInstallationAuth, saveADRToRepo } from "./handler";
import { analyzePR } from "../services/analyzePR";
import { formatADRComment } from "./formatter";
import { AnalysisResult } from "../schemas/analysis.schema";
import { getCache } from "../lib/cache";

export async function handleCommentCreated({ payload }: { payload: any }) {
  const comment = payload.comment.body || "";
  const owner = payload.repository.owner.login;
  const repo = payload.repository.name;
  const issue_number = payload.issue.number;
  const installationId = payload.installation?.id;

  // Only respond to @devdox commands
  if (!comment.includes("@devdox")) return;
  // Don't respond to our own comments
  if (payload.comment.user.type === "Bot") return;
  if (!installationId) return;

  let octokit: any, token: string;
  try {
    const auth = await getInstallationAuth(installationId);
    octokit = auth.octokit;
    token = auth.token;
  } catch (err: any) {
    console.error("[DevDox] Auth failed in command handler:", err.message);
    return;
  }

  // ── @devdox regenerate ─────────────────────────────────────────
  if (comment.includes("@devdox regenerate")) {
    console.log(`[DevDox] Regenerate command on issue #${issue_number}`);

    const thinkingComment = await octokit.issues.createComment({
      owner, repo, issue_number,
      body: `## 🤖 DevDox is re-analyzing...\n\n> Regenerating ADR with fresh context. This takes ~15 seconds.`,
    });

    try {
      // Get PR URL from the issue
      const pr = await octokit.pulls.get({ owner, repo, pull_number: issue_number }).catch(() => null);
      if (!pr) {
        await octokit.issues.updateComment({
          owner, repo, comment_id: thinkingComment.data.id,
          body: `## 🤖 DevDox — Error\n\n> ❌ This command only works on Pull Requests, not regular issues.`,
        });
        return;
      }

      const prUrl = pr.data.html_url;
      const prTitle = pr.data.title;

      // Force fresh analysis by passing a cache-busting token
      const result = await analyzePR(prUrl, token, true) as AnalysisResult;
      const adrPath = await saveADRToRepo(octokit, owner, repo, issue_number, prTitle, result.suggestedADR);
      const commentBody = formatADRComment(
        result, prUrl,
        adrPath ? `https://github.com/${owner}/${repo}/blob/main/${adrPath}` : undefined
      );

      await octokit.issues.updateComment({
        owner, repo, comment_id: thinkingComment.data.id,
        body: commentBody,
      });

      console.log(`[DevDox] ✅ Regenerated ADR for PR #${issue_number}`);
    } catch (err: any) {
      await octokit.issues.updateComment({
        owner, repo, comment_id: thinkingComment.data.id,
        body: `## 🤖 DevDox — Regeneration Failed\n\n> ❌ ${err.message}`,
      }).catch(() => {});
    }
    return;
  }

  // ── @devdox status ─────────────────────────────────────────────
  if (comment.includes("@devdox status")) {
    const cacheKey = `processed:${owner}/${repo}:${issue_number}`;
    const processed = await getCache(cacheKey).catch(() => null);

    await octokit.issues.createComment({
      owner, repo, issue_number,
      body: `## 📊 DevDox Status

- **Repo:** \`${owner}/${repo}\`
- **This PR analyzed:** ${processed ? "✅ Yes" : "❌ Not yet"}
- **Bot version:** v1.0.0
- **ADR storage:** \`docs/decisions/\`

> 💡 Use \`@devdox regenerate\` to re-analyze this PR.
> 📖 [View all ADRs](https://github.com/${owner}/${repo}/tree/main/docs/decisions)`,
    }).catch(() => {});
    return;
  }

  // ── @devdox help ───────────────────────────────────────────────
  if (comment.includes("@devdox help") || comment.trim() === "@devdox") {
    await octokit.issues.createComment({
      owner, repo, issue_number,
      body: `## 🤖 DevDox Commands

| Command | Description |
|---------|-------------|
| \`@devdox regenerate\` | Re-analyze this PR and update the ADR |
| \`@devdox status\` | Show analysis status for this PR |
| \`@devdox help\` | Show this help message |

**PR Description flags:**
- \`[skip-docs]\` — Skip ADR generation for this PR
- \`[no-adr]\` — Same as skip-docs
- \`[force-adr]\` — Force ADR even on minor/WIP PRs

> Powered by [DevDox](https://devdox-nu.vercel.app)`,
    }).catch(() => {});
  }
}