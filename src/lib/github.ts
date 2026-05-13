import { Octokit } from "@octokit/rest";

export async function fetchPRData(prUrl: string, token?: string) {
  const { Octokit } = await import("@octokit/rest");
  const octokit = new Octokit({
    auth: token || process.env.GITHUB_TOKEN,
  });

  const match = prUrl.match(/github\.com\/(.+?)\/(.+?)\/pull\/(\d+)/);
  if (!match) throw new Error(`Invalid PR URL: ${prUrl}`);
  const [, owner, repo, pull_number] = match;

  const [pr, commits, files] = await Promise.all([
    octokit.pulls.get({ owner, repo, pull_number: Number(pull_number) }),
    octokit.pulls.listCommits({ owner, repo, pull_number: Number(pull_number), per_page: 50 }),
    octokit.pulls.listFiles({ owner, repo, pull_number: Number(pull_number), per_page: 50 }),
  ]);

  return {
    owner,
    repo,
    pull_number: Number(pull_number),
    pr: pr.data,
    commits: commits.data,
    files: files.data,
  };
}