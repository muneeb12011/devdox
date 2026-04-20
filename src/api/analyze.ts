// src/api/analyze.ts
import { analyzePR } from "../services/analyzePR";

export default async function handler(req: any, res: any) {
  try {
    const { prUrl } = req.body;

    if (!prUrl) {
      return res.status(400).json({ error: "Missing PR URL" });
    }

    const result = await analyzePR(prUrl);

    return res.status(200).json(result);
  } catch (err: any) {
    console.error(err);

    return res.status(500).json({
      error: "Analysis failed",
      message: err.message,
    });
  }
}