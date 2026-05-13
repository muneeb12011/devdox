"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalysisSchema = void 0;
// src/schemas/analysis.schema.ts
const zod_1 = require("zod");
exports.AnalysisSchema = zod_1.z.object({
    summary: zod_1.z.string(),
    decisions: zod_1.z.array(zod_1.z.string()),
    risks: zod_1.z.array(zod_1.z.string()),
    suggestedADR: zod_1.z.string(),
});
