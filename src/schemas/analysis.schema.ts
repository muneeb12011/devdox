// src/schemas/analysis.schema.ts
import { z } from "zod";

export const AnalysisSchema = z.object({
  summary: z.string(),
  decisions: z.array(z.string()),
  risks: z.array(z.string()),
  suggestedADR: z.string(),
});

export type AnalysisResult = z.infer<typeof AnalysisSchema>;