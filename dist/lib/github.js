"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchPRData = fetchPRData;
const rest_1 = require("@octokit/rest");
async function fetchPRData(prUrl, token) {
    const octokit = new rest_1.Octokit({
        auth: token || process.env.GITHUB_TOKEN,
    });
    const match = prUrl.match(/github\.com\/(.+?)\/(.+?)\/pull\/(\d+)/);
    if (!match)
        throw new Error(`Invalid PR URL: ${prUrl}`);
    const [, owner, repo, pull_number] = match;
    const [pr, commits, files] = await Promise.all([
        octokit.pulls.get({ owner, repo, pull_number: Number(pull_number) }),
        octokit.pulls.listCommits({ owner, repo, pull_number: Number(pull_number) }),
        octokit.pulls.listFiles({ owner, repo, pull_number: Number(pull_number) }),
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
