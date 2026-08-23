// src/lib/llm.ts
import axios from "axios";
import pRetry, { AbortError } from "p-retry";

const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-20b";

interface LLMInput {
  prTitle: string;
  prBody: string;
  commits: string[];
  files: string[];
  jira: string[];
  linear: string[];
  slack: string[];
}

export async function analyzeWithLLM(input: LLMInput) {
  console.log("[LLM] Preparing prompt...");

  const hasTicketContext = input.jira.length > 0 || input.linear.length > 0;
  const hasSlack = input.slack.length > 0;

  const prompt = `You are a principal engineer writing a detailed, insightful Architecture Decision Record (ADR).

Your goal is to extract the REAL reasoning — the "why" — behind this pull request.
Do NOT describe what the code does. Explain WHY the team made these choices, what alternatives existed, and what the long-term consequences are.
${hasTicketContext ? "Ticket context (Jira/Linear) is your PRIMARY source for reasoning — use it heavily." : "No tickets linked. Infer reasoning carefully from commits and file changes."}
${hasSlack ? "Slack discussions contain real team decisions — extract concerns and rationale from them." : ""}

GROUNDING RULE (applies to every section below):
Every claim — decision, risk, or consequence — must be traceable to something in COMMITS, FILES CHANGED, or the ticket/Slack context provided. If you cannot point to specific evidence for a claim, do not include it. It is better to return fewer, well-grounded items than to pad output with generic or invented claims.

═══════════════════════════════════════════
PR INFORMATION
═══════════════════════════════════════════

TITLE: ${input.prTitle}

DESCRIPTION:
${input.prBody || "No description provided. Infer from commits and files."}

═══════════════════════════════════════════
CODE CHANGES
═══════════════════════════════════════════

COMMITS (${input.commits.length} total):
${input.commits.slice(0, 20).join("\n") || "No commits."}

FILES CHANGED (${input.files.length} total):
${input.files.slice(0, 30).join("\n") || "No files."}

═══════════════════════════════════════════
TICKET CONTEXT
═══════════════════════════════════════════

JIRA TICKETS:
${input.jira.join("\n\n") || "No Jira tickets linked."}

LINEAR ISSUES:
${input.linear.join("\n\n") || "No Linear issues linked."}

═══════════════════════════════════════════
TEAM DISCUSSIONS
═══════════════════════════════════════════

SLACK THREADS:
${input.slack.join("\n") || "No Slack context found."}

═══════════════════════════════════════════
OUTPUT REQUIREMENTS
═══════════════════════════════════════════

SUMMARY — 1 sentence, max 30 words:
  - State WHAT changed and WHY — not just "Updated X"
  - Example: "Migrated auth to installation tokens because personal tokens couldn't be scoped per-repo"

DECISIONS — 3 to 5 items:
  - Format each as: "Chose X over Y because Z"
  - Focus on architectural choices, not implementation details
  - Be specific — avoid vague statements like "improved performance"
  - If the PR is small and only supports 1-2 real decisions, return only those — do not stretch to fill 3

RISKS — 0 to 4 items:
  - Only include a risk if you can point to a specific file, commit, or ticket that supports it
  - Real risks only — not generic boilerplate like "may introduce bugs" or "could affect performance"
  - Include a mitigation where possible: "Risk: X — Mitigation: Y"
  - If this change has no meaningful risk (e.g., docs-only, config-only, comment changes), return an EMPTY ARRAY. Do NOT invent a risk to hit a quota.

SUGGESTED ADR — full markdown with ALL these sections:
  ## Problem
  What pain point, requirement, or failure drove this change?

  ## Context
  Background info, constraints, team/business context, prior state

  ## Decision
  The specific choices made and the reasoning behind each

  ## Alternatives Considered
  What else was evaluated, and why it was rejected. If nothing was evaluated (e.g., a straightforward docs addition), say so plainly instead of inventing alternatives.

  ## Consequences
  Positive outcomes, negative tradeoffs, future implications, what to watch for.
  If this change is low-risk or purely additive (e.g., documentation, formatting, config), state that plainly — e.g. "No significant consequences; this is an additive documentation change with no runtime impact."
  Do NOT speculate about unrelated systems (auth, database, infra, legacy flows) unless the diff actually touches files related to them.

  ## Status
  Accepted

OUTPUT RULES:
- Return ONLY raw JSON — no markdown fences, no backticks, no preamble, no explanation
- decisions and risks must be arrays of plain strings (risks may be an empty array)
- suggestedADR must be a single string with \\n for newlines

EXACT FORMAT:
{
  "summary": "one sentence — what changed and why",
  "decisions": [
    "Chose X over Y because Z",
    "Adopted X to solve Y",
    "Removed X in favor of Y to reduce Z"
  ],
  "risks": [
    "Risk: X may break Y — Mitigation: Z",
    "Risk: X requires manual Y — watch for Z"
  ],
  "suggestedADR": "## Problem\\n\\n...\\n\\n## Context\\n\\n...\\n\\n## Decision\\n\\n...\\n\\n## Alternatives Considered\\n\\n...\\n\\n## Consequences\\n\\n...\\n\\n## Status\\n\\nAccepted"
}`;

  return pRetry(
    async () => {
      console.log("[LLM] Sending request to Groq...");
      console.log("[LLM] Using model:", GROQ_MODEL);

      let res: any;

      try {
        res = await axios.post(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            model: GROQ_MODEL,
            temperature: 0.2,
            max_tokens: 3000,
            messages: [
              {
                role: "system",
                content:
                  "You are a JSON-only API that writes detailed, insightful Architecture Decision Records. Output only valid raw JSON. Never use markdown backticks. Never include preamble or explanation outside the JSON object.",
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
              "Content-Type": "application/json",
            },
            timeout: 30000,
          }
        );
      } catch (err: any) {
        const status = err.response?.status;
        const data = err.response?.data;

        console.error("[LLM] Groq API error:", status, JSON.stringify(data));

        if (status === 400 || status === 401 || status === 403 || status === 404) {
          throw new AbortError(
            `Groq fatal error ${status}: ${data?.error?.message || "Unknown error"}`
          );
        }

        throw err;
      }

      const content = res?.data?.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error("Groq returned empty response");
      }

      console.log("[LLM] Raw response received");

      const jsonMatch = content.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        console.error("[LLM] Invalid response:", content);
        throw new Error("No JSON found in LLM response");
      }

      let parsed: any;

      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch (err) {
        console.error("[LLM] Failed to parse JSON:", jsonMatch[0]);
        throw new Error("LLM returned invalid JSON");
      }

      const flatten = (arr: any[]): string[] =>
        (arr || []).map((item) => {
          if (typeof item === "string") return item;
          if (typeof item === "object" && item !== null)
            return Object.values(item).join(" — ");
          return String(item);
        });

      console.log("[LLM] Analysis parsed successfully");

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
        console.error(
          `[LLM] Attempt ${err.attemptNumber} failed (${err.retriesLeft} left): ${err.message}`
        );
      },
    }
  );
}