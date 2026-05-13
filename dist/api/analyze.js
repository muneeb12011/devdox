"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
// src/api/analyze.ts
const analyzePR_1 = require("../services/analyzePR");
async function handler(req, res) {
    try {
        const { prUrl } = req.body;
        if (!prUrl) {
            return res.status(400).json({ error: "Missing PR URL" });
        }
        const result = await (0, analyzePR_1.analyzePR)(prUrl);
        return res.status(200).json(result);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({
            error: "Analysis failed",
            message: err.message,
        });
    }
}
