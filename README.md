# DevDox

Auto-generates Architecture Decision Records on every pull request.

## What it does

DevDox listens for opened pull requests, analyzes the diff, commits, and any linked
Jira/Linear tickets, then generates a structured ADR explaining the reasoning behind
the change — not just what changed, but why.

## Installation

1. Install the GitHub App on your repository
2. Open a pull request
3. DevDox comments with an ADR and commits it to `docs/decisions/`

## Configuration

DevDox skips PRs that look like minor changes (typo fixes, chores, drafts) by default.
Add `[force-adr]` to your PR description to override, or `[skip-docs]` to opt out entirely.

## License

MIT
