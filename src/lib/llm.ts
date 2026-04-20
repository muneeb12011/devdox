// src/lib/llm.ts
import axios from "axios";
import pRetry from "p-retry";

export async function analyzeWithLLM(input: {
  prTitle: string;
  prBody: string;
  commits: string[];
  slack: string[];
}) {
  const prompt = `
You are a senior staff engineer writing Architecture Decision Records.

Extract the REAL reasoning ("why") behind this PR from messy inputs.

INPUT:
PR TITLE: ${input.prTitle}

PR DESCRIPTION:
${input.prBody}

COMMITS:
${input.commits.join("\n")}

TEAM DISCUSSIONS:
${input.slack.join("\n")}

OUTPUT JSON ONLY — no markdown, no backticks, just raw JSON:
{
  "summary": "1 sentence WHAT changed",
  "decisions": ["key technical decisions"],
  "risks": ["possible risks"],
  "suggestedADR": "full markdown ADR"
}

Be brutally concise. Infer missing reasoning intelligently.
`;

  return pRetry(
    async () => {
      const res = await axios.post(
        "https://api.anthropic.com/v1/messages",
        {
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1024,
          messages: [{ role: "user", content: prompt }],
        },
        {
          headers: {
            "x-api-key": process.env.ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
          },
        }
      );

      const content = res.data.content[0].text;

      const clean = content.replace(/```json|```/g, "").trim();
      return JSON.parse(clean);
    },
    {
      retries: 3,
    }
  );
}