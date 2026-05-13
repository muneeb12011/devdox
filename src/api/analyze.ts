import { Request, Response } from "express";
import { analyzePR } from "../services/analyzePR";

export default async function handler(req: Request, res: Response) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prUrl, forceRefresh } = req.body;

  if (!prUrl || typeof prUrl !== "string") {
    return res.status(400).json({ error: "Missing or invalid prUrl" });
  }

  if (!prUrl.includes("github.com") || !prUrl.includes("/pull/")) {
    return res.status(400).json({ error: "Invalid GitHub PR URL" });
  }

  try {
    const result = await analyzePR(prUrl, undefined, forceRefresh === true);
    return res.status(200).json(result);
  } catch (err: any) {
    console.error("[API] Analysis failed:", err.message);
    return res.status(500).json({
      error: "Analysis failed",
      message: err.message,
    });
  }
}