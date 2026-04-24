import * as dotenv from "dotenv";
dotenv.config({ override: true });

import express from "express";
import { Webhooks, createNodeMiddleware } from "@octokit/webhooks";
import { handlePROpened } from "./handler";

const webhooks = new Webhooks({
  secret: process.env.WEBHOOK_SECRET!,
});

webhooks.on("pull_request.opened", async ({ payload }) => {
  await handlePROpened({ payload } as any);
});

webhooks.onError((error) => {
  console.error("[DevDox] Webhook error:", error.message);
});

const app = express();
app.use(createNodeMiddleware(webhooks, { path: "/api/github/webhooks" }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[DevDox] Listening on port ${PORT}`);
});