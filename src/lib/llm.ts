// src/lib/llm.ts
import axios from "axios";
import pRetry, { AbortError } from "p-retry";

interface LLMInput {
  prTitle: string;
  prBody: string;
  commits: string[];
  files: string[];
  jira: string[];
  slack: string[];
}

export async function analyzeWithLLM(input: LLMInput) {
  const prompt = `You are a senior staff engineer writing Architecture Decision Records.

Extract the REAL reasoning ("why") behind this PR from the inputs below.
Use Jira ticket details and Slack discussions as primary context for the "why".

PR TITLE: ${input.prTitle}

PR DESCRIPTION:
${input.prBody || "No description provided."}

COMMITS:
${input.commits.slice(0, 20).join("\n") || "No commits."}

FILES CHANGED:
${input.files.slice(0, 20).join("\n") || "No files."}

JIRA TICKETS:
${input.jira.join("\n\n") || "No Jira tickets linked."}

SLACK DISCUSSIONS:
${input.slack.join("\n") || "No Slack context found."}

OUTPUT RULES:
- Return ONLY raw JSON, no markdown, no backticks, no extra text
- decisions: array of plain strings (max 5 items, each under 20 words)
- risks: array of plain strings (max 5 items, each under 20 words)
- summary: one sentence under 30 words
- suggestedADR: full markdown ADR with sections: Problem, Decision, Context, Consequences, Status

EXACT FORMAT:
{
  "summary": "one sentence describing what changed",
  "decisions": ["decision one", "decision two"],
  "risks": ["risk one", "risk two"],
  "suggestedADR": "# ADR\\n\\n## Problem\\n..."
}`;

  return pRetry(
    async () => {
      let res;
      try {
        res = await axios.post(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            model: "llama-3.1-8b-instant",
            max_tokens: 2000,
            temperature: 0.1,
            messages: [
              {
                role: "system",
                content: "You are a JSON-only API. Output only valid raw JSON. Never use markdown backticks.",
              },
              { role: "user", content: prompt },
            ],
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
              "content-type": "application/json",
            },
            timeout: 30000,
          }
        );
      } catch (err: any) {
        const status = err.response?.status;
        const data = err.response?.data;
        console.error("[LLM] Groq API error:", status, JSON.stringify(data));

        if (status === 400 || status === 401 || status === 403) {
          throw new AbortError(`Groq fatal error ${status}: ${data?.error?.message}`);
        }
        throw err;
      }

      const content = res.data.choices[0].message.content;

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in LLM response");

      let parsed: any;
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch {
        throw new Error("LLM returned invalid JSON");
      }

      const flatten = (arr: any[]): string[] =>
        (arr || []).map((item) => {
          if (typeof item === "string") return item;
          if (typeof item === "object" && item !== null) return Object.values(item).join(" — ");
          return String(item);
        });

      return {
        summary: String(parsed.summary ?? "No summary provided"),
        decisions: flatten(parsed.decisions ?? []),
        risks: flatten(parsed.risks ?? []),
        suggestedADR: String(parsed.suggestedADR ?? "No ADR generated"),
      };
    },
    {
      retries: 3,
      minTimeout: 1000,
      maxTimeout: 10000,
      onFailedAttempt: (err: any) => {
        console.error(`[LLM] Attempt ${err.attemptNumber} failed (${err.retriesLeft} left): ${err.message}`);
      },
    }
  );
}