// src/lib/github.ts

import { Octokit } from "@octokit/rest";

export async function fetchPRData(
  prUrl: string,
  token?: string
) {
  console.log(`[DevDox] Fetching PR data: ${prUrl}`);

  const octokit = new Octokit({
    auth: token || process.env.GITHUB_TOKEN,
  });

  const match = prUrl.match(
    /github\.com\/(.+?)\/(.+?)\/pull\/(\d+)/
  );

  if (!match) {
    throw new Error(`Invalid PR URL: ${prUrl}`);
  }

  const [, owner, repo, pull_number] = match;

  console.log(
    `[DevDox] Parsed PR → owner=${owner}, repo=${repo}, pr=${pull_number}`
  );

  try {
    const [pr, commits, files] = await Promise.all([
      octokit.pulls.get({
        owner,
        repo,
        pull_number: Number(pull_number),
      }),

      octokit.pulls.listCommits({
        owner,
        repo,
        pull_number: Number(pull_number),
        per_page: 50,
      }),

      octokit.pulls.listFiles({
        owner,
        repo,
        pull_number: Number(pull_number),
        per_page: 50,
      }),
    ]);

    console.log(
      `[DevDox] GitHub fetch complete (${commits.data.length} commits, ${files.data.length} files)`
    );

    return {
      owner,
      repo,
      pull_number: Number(pull_number),
      pr: pr.data,
      commits: commits.data,
      files: files.data,
    };
  } catch (err: any) {
    console.error(
      "[DevDox] GitHub API fetch failed:",
      err?.response?.data || err?.message || err
    );

    throw err;
  }
}