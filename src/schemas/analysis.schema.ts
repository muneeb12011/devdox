// src/schemas/analysis.schema.ts
import { z } from "zod";

export const AnalysisSchema = z.object({
  summary: z.string().min(1),
  decisions: z.array(z.string()).min(0),
  risks: z.array(z.string()).min(0),
  suggestedADR: z.string().min(1),
});

export type AnalysisResult = z.infer<typeof AnalysisSchema>;