// src/services/analyzePR.ts
import { fetchPRData } from "../lib/github";
import { extractTicketIds, getSlackContext } from "../lib/parser";
import { analyzeWithLLM } from "../lib/llm";
import { AnalysisSchema } from "../schemas/analysis.schema";
import { getCache, setCache } from "../lib/cache";

export async function analyzePR(prUrl: string) {
  const cacheKey = `pr:${prUrl}`;

  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const { pr, commits } = await fetchPRData(prUrl);

  const ticketIds = extractTicketIds(
    pr.title + " " + (pr.body || "")
  );

  const slackContext = await getSlackContext(ticketIds);

  const result = await analyzeWithLLM({
    prTitle: pr.title,
    prBody: pr.body || "",
    commits: commits.map((c) => c.commit.message),
    slack: slackContext,
  });

  const parsed = AnalysisSchema.parse(result);

  await setCache(cacheKey, parsed);

  return parsed;
}