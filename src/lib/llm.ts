import axios from "axios";
import pRetry, { AbortError } from "p-retry";

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

OUTPUT RULES:
- Return ONLY raw JSON, no markdown, no backticks, no extra text
- decisions must be an array of plain strings, NOT objects
- risks must be an array of plain strings, NOT objects
- Keep each string under 20 words

EXACT OUTPUT FORMAT:
{
  "summary": "one sentence describing what changed",
  "decisions": ["decision one", "decision two"],
  "risks": ["risk one", "risk two"],
  "suggestedADR": "full markdown ADR text here"
}
`;

  return pRetry(
    async () => {
      let res;
      try {
        res = await axios.post(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            model: "llama-3.1-8b-instant",
            max_tokens: 1500,
            temperature: 0.1,
            messages: [
              {
                role: "system",
                content: "You are a JSON-only API. You never output markdown, backticks, or explanations. You output only valid raw JSON.",
              },
              {
                role: "user",
                content: prompt,
              },
            ],
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
              "content-type": "application/json",
            },
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
      console.log("[LLM] Raw response preview:", content.substring(0, 300));

      // Extract outermost JSON object
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error("[LLM] No JSON object found in response");
        throw new Error("No JSON found in LLM response");
      }

      let parsed: any;
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch (parseErr) {
        console.error("[LLM] JSON parse failed:", jsonMatch[0].substring(0, 300));
        throw new Error("LLM returned invalid JSON");
      }

      // Normalize decisions and risks — flatten objects to strings if Llama misbehaves
      const flatten = (arr: any[]): string[] =>
        arr.map((item) => {
          if (typeof item === "string") return item;
          if (typeof item === "object" && item !== null) {
            return Object.values(item).join(" — ");
          }
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
      onFailedAttempt: (err: any) => {
        console.error(`[LLM] Attempt ${err.attemptNumber} failed. Retries left: ${err.retriesLeft} — ${err.message}`);
      },
    }
  );
}