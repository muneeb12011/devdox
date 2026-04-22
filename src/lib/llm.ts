import axios from "axios";

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

  const res = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      contents: [{ parts: [{ text: prompt }] }],
    },
    {
      headers: { "content-type": "application/json" },
    }
  );

  const content = res.data.candidates[0].content.parts[0].text;
  const clean = content.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}