import { Octokit } from "@octokit/rest";
export async function fetchPRData(prUrl: string, token?: string) {
  console.log("[GitHub] Using token first 20:", (token || process.env.GITHUB_TOKEN)?.substring(0, 20));
  const octokit = new Octokit({
    auth: token || process.env.GITHUB_TOKEN,
  });
  const match = prUrl.match(/github.com\/(.+?)\/(.+?)\/pull\/(\d+)/);
  if (!match) throw new Error("Invalid PR URL");
  const [, owner, repo, pull_number] = match;
  const pr = await octokit.pulls.get({
    owner,
    repo,
    pull_number: Number(pull_number),
  });
  const commits = await octokit.pulls.listCommits({
    owner,
    repo,
    pull_number: Number(pull_number),
  });
  const files = await octokit.pulls.listFiles({
    owner,
    repo,
    pull_number: Number(pull_number),
  });
  return {
    owner,
    repo,
    pr: pr.data,
    commits: commits.data,
    files: files.data,
  };
}