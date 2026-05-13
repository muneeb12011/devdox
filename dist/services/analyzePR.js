"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzePR = analyzePR;
const github_1 = require("../lib/github");
const parser_1 = require("../lib/parser");
const llm_1 = require("../lib/llm");
const analysis_schema_1 = require("../schemas/analysis.schema");
const cache_1 = require("../lib/cache");
async function analyzePR(prUrl, token) {
    const cacheKey = `pr:${prUrl}`;
    const cached = await (0, cache_1.getCache)(cacheKey);
    if (cached)
        return cached;
    const { pr, commits } = await (0, github_1.fetchPRData)(prUrl, token);
    const ticketIds = (0, parser_1.extractTicketIds)(pr.title + " " + (pr.body || ""));
    const slackContext = await (0, parser_1.getSlackContext)(ticketIds);
    const result = await (0, llm_1.analyzeWithLLM)({
        prTitle: pr.title,
        prBody: pr.body || "",
        commits: commits.map((c) => c.commit.message),
        slack: slackContext,
    });
    const parsed = analysis_schema_1.AnalysisSchema.parse(result);
    await (0, cache_1.setCache)(cacheKey, parsed);
    return parsed;
}
