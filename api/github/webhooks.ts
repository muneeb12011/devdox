// api/github/webhooks.ts
import * as dotenv from "dotenv";
dotenv.config({ override: true });

import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    return res.status(200).json({ status: "ok", version: "1.0.0", timestamp: new Date().toISOString() });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const signature = req.headers["x-hub-signature-256"] as string;
  const id = req.headers["x-github-delivery"] as string;
  const name = req.headers["x-github-event"] as string;

  if (!signature || !id || !name) {
    return res.status(400).json({ error: "Missing GitHub webhook headers" });
  }

  const body = await getRawBody(req);

  // Dynamic import to handle ESM packages in CommonJS context
  const { Webhooks } = await import("@octokit/webhooks");
  const { handlePROpened } = await import("../../src/bot/handler");
  const { handleCommentCreated } = await import("../../src/bot/commands");

  const webhooks = new Webhooks({ secret: process.env.WEBHOOK_SECRET! });

  webhooks.on("pull_request.opened", async ({ payload }) => {
    await handlePROpened({ payload } as any);
  });

  webhooks.on("issue_comment.created", async ({ payload }) => {
    await handleCommentCreated({ payload } as any);
  });

  webhooks.onError((error) => {
    console.error("[DevDox] Webhook error:", error.message);
  });

  try {
    const verified = await webhooks.verify(body.toString(), signature);
    if (!verified) {
      return res.status(401).json({ error: "Invalid signature" });
    }
  } catch {
    return res.status(401).json({ error: "Signature verification failed" });
  }

  // Respond to GitHub immediately
  res.status(200).json({ ok: true });

  // Process async after response
  try {
    await webhooks.receive({
      id,
      name: name as any,
      payload: JSON.parse(body.toString()),
    });
  } catch (err: any) {
    console.error("[DevDox] Processing error:", err.message);
  }
}

function getRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}