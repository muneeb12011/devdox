// src/services/analyzePR.ts
import { fetchPRData } from "../lib/github";
import { extractTicketIds, summarizeFiles } from "../lib/parser";
import { fetchJiraTickets, formatJiraContext } from "../lib/jira";
import { getSlackContext } from "../lib/slack";
import { analyzeWithLLM } from "../lib/llm";
import { AnalysisSchema } from "../schemas/analysis.schema";
import { getCache, setCache, deleteCache } from "../lib/cache";

export async function analyzePR(prUrl: string, token?: string, forceRefresh = false) {
  const cacheKey = `pr:${prUrl}`;

  if (!forceRefresh) {
    const cached = await getCache(cacheKey);
    if (cached) {
      console.log(`[DevDox] Cache hit for ${prUrl}`);
      return cached;
    }
  } else {
    await deleteCache(cacheKey);
  }

  console.log(`[DevDox] Fetching PR data for ${prUrl}`);
  const { pr, commits, files } = await fetchPRData(prUrl, token);

  const ticketIds = extractTicketIds(pr.title + " " + (pr.body || ""));
  const fileSummaries = summarizeFiles(files);

  // Fetch Jira and Slack context in parallel
  const [jiraTickets, slackMessages] = await Promise.all([
    fetchJiraTickets(ticketIds),
    getSlackContext(ticketIds, pr.title),
  ]);

  const jiraContext = formatJiraContext(jiraTickets);

  console.log(
    `[DevDox] Analyzing: ${commits.length} commits, ${files.length} files, ` +
    `${jiraTickets.length} Jira tickets, ${slackMessages.length} Slack messages`
  );

  const result = await analyzeWithLLM({
    prTitle: pr.title,
    prBody: pr.body || "",
    commits: commits.map((c) => c.commit.message),
    files: fileSummaries,
    jira: jiraContext,
    slack: slackMessages,
  });

  const parsed = AnalysisSchema.parse(result);

  await setCache(cacheKey, parsed, 3600);

  return parsed;
}