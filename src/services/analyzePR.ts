// src/services/analyzePR.ts
import { fetchPRData } from "../lib/github";
import { extractTicketIds, extractLinearIds, summarizeFiles } from "../lib/parser";
import { fetchJiraTickets, formatJiraContext } from "../lib/jira";
import { fetchLinearIssues, formatLinearContext } from "../lib/linear";
import { getSlackContext } from "../lib/slack";
import { analyzeWithLLM } from "../lib/llm";
import { checkIfTrivial, buildMinimalAnalysis } from "../lib/triviaCheck";
import { AnalysisSchema } from "../schemas/analysis.schema";
import { getCache, setCache, deleteCache } from "../lib/cache";

export async function analyzePR(
  prUrl: string,
  token?: string,
  forceRefresh = false
) {
  const cacheKey = `pr:${prUrl}`;

  try {
    // ── CACHE ─────────────────────────────────────────────
    if (!forceRefresh) {
      const cached = await getCache(cacheKey);

      if (cached) {
        console.log(`[DevDox] Cache hit for ${prUrl}`);
        return cached;
      }
    } else {
      console.log(`[DevDox] Force refresh enabled`);
      await deleteCache(cacheKey);
    }

    // ── FETCH PR DATA ─────────────────────────────────────
    console.log(`[DevDox] Fetching PR data for ${prUrl}`);

    const { pr, commits, files } = await fetchPRData(prUrl, token);

    console.log(
      `[DevDox] PR fetched successfully (${commits.length} commits, ${files.length} files)`
    );

    // ── PARSE TICKETS ─────────────────────────────────────
    const prText = pr.title + " " + (pr.body || "");
    const jiraIds = extractTicketIds(prText);
    const linearIds = extractLinearIds(prText);
    const fileSummaries = summarizeFiles(files);

    console.log(
      `[DevDox] Found ${jiraIds.length} Jira IDs, ${linearIds.length} Linear IDs`
    );

    // ── FETCH CONTEXT ─────────────────────────────────────
    console.log("[DevDox] Fetching Jira + Linear + Slack context...");

    const [jiraTickets, linearIssues, slackMessages] = await Promise.all([
      fetchJiraTickets(jiraIds),
      fetchLinearIssues(linearIds),
      getSlackContext([...jiraIds, ...linearIds], pr.title),
    ]);

    console.log(
      `[DevDox] Context loaded (${jiraTickets.length} Jira, ${linearIssues.length} Linear, ${slackMessages.length} Slack)`
    );

    const jiraContext = formatJiraContext(jiraTickets);
    const linearContext = formatLinearContext(linearIssues);

    // ── TRIVIAL PR CHECK ───────────────────────────────────
    // NEW: Skip the LLM entirely if there's no real signal to reason about.
    // Prevents hallucinated risks/consequences on docs-only, zero-context PRs.
    // `files` here is the raw octokit.pulls.listFiles response array —
    // confirmed shape: { filename, status, changes, ... }.
    const trivialCheck = checkIfTrivial({
      prTitle: pr.title,
      prBody: pr.body || "",
      files: files.map((f: any) => ({
        filename: f.filename,
        status: f.status,
        changes: f.changes,
      })),
      commits: commits.map((c: any) => c.commit.message),
      hasTicketContext: jiraTickets.length > 0 || linearIssues.length > 0,
      hasSlack: slackMessages.length > 0,
    });

    if (trivialCheck.isTrivial) {
      console.log(
        `[DevDox] PR classified as trivial — skipping LLM call. Reason: ${trivialCheck.reason}`
      );

      const minimal = buildMinimalAnalysis({
        prTitle: pr.title,
        reason: trivialCheck.reason,
      });

      const parsedMinimal = AnalysisSchema.parse(minimal);

      await setCache(cacheKey, parsedMinimal, 3600);

      console.log("[DevDox] Minimal analysis cached (no LLM call made)");

      return parsedMinimal;
    }

    // ── LLM ANALYSIS ─────────────────────────────────────
    console.log("[DevDox] Sending PR to LLM...");

    const result = await analyzeWithLLM({
      prTitle: pr.title,
      prBody: pr.body || "",
      commits: commits.map((c: any) => c.commit.message),
      files: fileSummaries,
      jira: jiraContext,
      linear: linearContext,
      slack: slackMessages,
    });

    console.log("[DevDox] LLM analysis complete");

    // ── VALIDATION ────────────────────────────────────────
    console.log("[DevDox] Validating analysis schema...");

    const parsed = AnalysisSchema.parse(result);

    console.log("[DevDox] Schema validation passed");

    // ── CACHE RESULT ──────────────────────────────────────
    await setCache(cacheKey, parsed, 3600);

    console.log("[DevDox] Analysis cached successfully");

    return parsed;
  } catch (err: any) {
    console.error(
      "[DevDox] analyzePR failed:",
      err?.response?.data || err?.message || err
    );

    throw err;
  }
}