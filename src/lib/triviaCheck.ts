// Exposed for future config support — allows overriding the line-change
// threshold per-repo once .devdox.yml lands.
export function getLineChangeThreshold(): number {
  return LINE_CHANGE_THRESHOLD;
}

// src/lib/triviaCheck.ts
//
// Decides whether a PR has enough real signal (tickets, meaningful code changes,
// team discussion) to justify an LLM call, or whether it's low-signal enough
// (docs-only, config-only, tiny diffs) that generating a "principal engineer"
// narrative would just invite hallucination.
//
// When a PR is classified as trivial, callers should skip analyzeWithLLM
// entirely and use buildMinimalAnalysis() instead — zero hallucination risk,
// zero API cost, zero latency.
//
// Verified against:
//   - octokit.pulls.listFiles response shape (filename, status, changes)
//   - AnalysisSchema (empty arrays allowed for decisions/risks)

interface FileChange {
  filename: string;
  status: string; // "added" | "modified" | "removed" | "renamed" etc.
  changes: number; // total lines changed (additions + deletions)
}

interface TrivialCheckInput {
  prTitle: string;
  prBody: string;
  files: FileChange[];
  commits: string[];
  hasTicketContext: boolean; // jira.length > 0 || linear.length > 0
  hasSlack: boolean;
}

export interface TrivialCheckResult {
  isTrivial: boolean;
  reason: string;
}

// File patterns that indicate a docs/config-only change with no runtime impact.
const NON_CODE_PATTERNS: RegExp[] = [
  /\.md$/i,
  /\.mdx$/i,
  /^docs\//i,
  /^\.github\/(ISSUE_TEMPLATE|PULL_REQUEST_TEMPLATE)/i,
  /^LICENSE$/i,
  /^CHANGELOG/i,
  /\.gitignore$/i,
  /\.editorconfig$/i,
  /^\.vscode\//i,
];

// Config-only patterns — small tweaks that rarely carry architectural weight
// on their own, unless combined with actual source changes.
const CONFIG_ONLY_PATTERNS: RegExp[] = [
  /package-lock\.json$/i,
  /yarn\.lock$/i,
  /pnpm-lock\.yaml$/i,
  /\.env\.example$/i,
];

const MIN_FILES_FOR_SIGNAL = 2;
const MIN_COMMITS_FOR_SIGNAL = 1;
// Above this many total changed lines, treat the PR as substantial even
// if it's a single file — a 400-line rewrite of one file is not trivial.
const LINE_CHANGE_THRESHOLD = 50;

function isNonCodeFile(filename: string): boolean {
  return (
    NON_CODE_PATTERNS.some((p) => p.test(filename)) ||
    CONFIG_ONLY_PATTERNS.some((p) => p.test(filename))
  );
}

/**
 * Determines whether a PR is "trivial" — meaning there isn't enough
 * real signal (code changes, tickets, discussion) to responsibly ask
 * an LLM to write an architectural narrative about it.
 */
export function checkIfTrivial(input: TrivialCheckInput): TrivialCheckResult {
  const { files, commits, hasTicketContext, hasSlack } = input;

  // Strong signal always overrides — never skip the LLM if there's a
  // linked ticket or real team discussion, regardless of file count.
  if (hasTicketContext || hasSlack) {
    return {
      isTrivial: false,
      reason: "Has ticket or Slack context — real signal present",
    };
  }

  // No files reported at all — nothing to reason about.
  if (!files || files.length === 0) {
    return {
      isTrivial: true,
      reason: "No file changes detected",
    };
  }

  const totalLineChanges = files.reduce(
    (sum, f) => sum + (f.changes || 0),
    0
  );

  // A large diff is never trivial, even in one file or with no ticket —
  // e.g. a 400-line rewrite deserves a real ADR attempt.
  if (totalLineChanges > LINE_CHANGE_THRESHOLD) {
    return {
      isTrivial: false,
      reason: `Substantial diff (${totalLineChanges} total line changes)`,
    };
  }

  const allFilesNonCode = files.every((f) => isNonCodeFile(f.filename));

  if (allFilesNonCode) {
    return {
      isTrivial: true,
      reason: "All changed files are docs/config-only (no source code touched)",
    };
  }

  // Small diff, no ticket/discussion context, few commits, and under the
  // line-change threshold — not enough material for a grounded narrative.
  if (
    files.length < MIN_FILES_FOR_SIGNAL &&
    commits.length <= MIN_COMMITS_FOR_SIGNAL
  ) {
    return {
      isTrivial: true,
      reason: `Small diff (${files.length} file(s), ${commits.length} commit(s), ${totalLineChanges} line changes) with no ticket or discussion context`,
    };
  }

  return {
    isTrivial: false,
    reason: "Sufficient signal for LLM analysis",
  };
}

/**
 * Builds a templated minimal analysis for trivial PRs — matches
 * AnalysisSchema exactly (empty arrays are valid for decisions/risks).
 */
export function buildMinimalAnalysis(input: {
  prTitle: string;
  reason: string;
}) {
  return {
    summary: `Minor change: ${input.prTitle}`,
    decisions: [] as string[],
    risks: [] as string[],
    suggestedADR: [
      "## Problem",
      "",
      "No significant architectural problem identified — this change is minor in scope.",
      "",
      "## Context",
      "",
      `DevDox classified this PR as low-signal (${input.reason}) and skipped full LLM analysis to avoid speculative content.`,
      "",
      "## Decision",
      "",
      "No architectural decision was required for this change.",
      "",
      "## Alternatives Considered",
      "",
      "Not applicable — this change did not involve an architectural choice.",
      "",
      "## Consequences",
      "",
      "No significant consequences; this is a minor, low-risk change with no expected runtime impact.",
      "",
      "## Status",
      "",
      "Accepted",
    ].join("\n"),
  };
}
