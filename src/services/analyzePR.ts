// src/services/analyzePR.ts

import { fetchPRData } from "../lib/github";
import { extractTicketIds, summarizeFiles } from "../lib/parser";
import { fetchJiraTickets, formatJiraContext } from "../lib/jira";
import { getSlackContext } from "../lib/slack";
import { analyzeWithLLM } from "../lib/llm";
import { AnalysisSchema } from "../schemas/analysis.schema";
import {
  getCache,
  setCache,
  deleteCache,
} from "../lib/cache";

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

    const { pr, commits, files } = await fetchPRData(
      prUrl,
      token
    );

    console.log(
      `[DevDox] PR fetched successfully (${commits.length} commits, ${files.length} files)`
    );

    // ── PARSE TICKETS ────────────────────────────────────
    const ticketIds = extractTicketIds(
      pr.title + " " + (pr.body || "")
    );

    console.log(
      `[DevDox] Found ${ticketIds.length} linked ticket IDs`
    );

    const fileSummaries = summarizeFiles(files);

    // ── FETCH CONTEXT ────────────────────────────────────
    console.log("[DevDox] Fetching Jira + Slack context...");

    const [jiraTickets, slackMessages] = await Promise.all([
      fetchJiraTickets(ticketIds),
      getSlackContext(ticketIds, pr.title),
    ]);

    console.log(
      `[DevDox] Context loaded (${jiraTickets.length} Jira tickets, ${slackMessages.length} Slack messages)`
    );

    const jiraContext = formatJiraContext(jiraTickets);

    // ── LLM ANALYSIS ─────────────────────────────────────
    console.log("[DevDox] Sending PR to LLM...");

    const result = await analyzeWithLLM({
      prTitle: pr.title,
      prBody: pr.body || "",
      commits: commits.map((c) => c.commit.message),
      files: fileSummaries,
      jira: jiraContext,
      slack: slackMessages,
    });

    console.log("[DevDox] LLM analysis complete");

    // ── VALIDATION ───────────────────────────────────────
    console.log("[DevDox] Validating analysis schema...");

    const parsed = AnalysisSchema.parse(result);

    console.log("[DevDox] Schema validation passed");

    // ── CACHE RESULT ─────────────────────────────────────
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