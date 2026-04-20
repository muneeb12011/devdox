// src/lib/github.ts
import { Octokit } from "@octokit/rest";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

export async function fetchPRData(prUrl: string) {
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