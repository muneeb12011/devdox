import * as dotenv from "dotenv";
dotenv.config({ override: true });

export { handlePROpened } from "./handler";
export { handleCommentCreated } from "./commands";
import express from "express";
import { Webhooks, createNodeMiddleware } from "@octokit/webhooks";
import { handlePROpened } from "./handler";
import { handleCommentCreated } from "./commands";

// ── VALIDATE REQUIRED ENV VARS ─────────────────────────────────
const REQUIRED_ENV = ["APP_ID", "PRIVATE_KEY", "WEBHOOK_SECRET", "GROQ_API_KEY", "REDIS_URL", "REDIS_TOKEN"];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`[DevDox] Missing required env vars: ${missing.join(", ")}`);
  process.exit(1);
}

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

const app = express();

app.get("/health", (_req, res) => {
  res.json({ status: "ok", version: "1.0.0", timestamp: new Date().toISOString() });
});

app.use(createNodeMiddleware(webhooks, { path: "/api/github/webhooks" }));

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(`[DevDox] 🚀 Listening on port ${PORT}`);
});