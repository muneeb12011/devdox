"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeWithLLM = analyzeWithLLM;
const axios_1 = __importDefault(require("axios"));
const p_retry_1 = __importStar(require("p-retry"));
async function analyzeWithLLM(input) {
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
    return (0, p_retry_1.default)(async () => {
        let res;
        try {
            res = await axios_1.default.post("https://api.groq.com/openai/v1/chat/completions", {
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
            }, {
                headers: {
                    Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
                    "content-type": "application/json",
                },
            });
        }
        catch (err) {
            const status = err.response?.status;
            const data = err.response?.data;
            console.error("[LLM] Groq API error:", status, JSON.stringify(data));
            if (status === 400 || status === 401 || status === 403) {
                throw new p_retry_1.AbortError(`Groq fatal error ${status}: ${data?.error?.message}`);
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
        let parsed;
        try {
            parsed = JSON.parse(jsonMatch[0]);
        }
        catch (parseErr) {
            console.error("[LLM] JSON parse failed:", jsonMatch[0].substring(0, 300));
            throw new Error("LLM returned invalid JSON");
        }
        // Normalize decisions and risks — flatten objects to strings if Llama misbehaves
        const flatten = (arr) => arr.map((item) => {
            if (typeof item === "string")
                return item;
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
    }, {
        retries: 3,
        minTimeout: 1000,
        onFailedAttempt: (err) => {
            console.error(`[LLM] Attempt ${err.attemptNumber} failed. Retries left: ${err.retriesLeft} — ${err.message}`);
        },
    });
}
