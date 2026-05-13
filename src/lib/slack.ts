// src/lib/slack.ts
import axios from "axios";

interface SlackMessage {
  text: string;
  user: string;
  ts: string;
}

function getSlackClient() {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) return null;

  return axios.create({
    baseURL: "https://slack.com/api",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    timeout: 10000,
  });
}

export async function searchSlackThreads(queries: string[]): Promise<string[]> {
  const client = getSlackClient();
  if (!client) {
    console.log("[Slack] Skipping — SLACK_BOT_TOKEN not configured");
    return [];
  }

  if (queries.length === 0) return [];

  const results: string[] = [];

  for (const query of queries.slice(0, 3)) {
    try {
      const { data } = await client.get("/search.messages", {
        params: {
          query,
          count: 5,
          sort: "timestamp",
          sort_dir: "desc",
        },
      });

      if (!data.ok) {
        console.error(`[Slack] search.messages error: ${data.error}`);
        continue;
      }

      const messages: SlackMessage[] = (data.messages?.matches || []).map((m: any) => ({
        text: m.text,
        user: m.username || m.user || "unknown",
        ts: m.ts,
      }));

      for (const msg of messages) {
        const cleaned = msg.text
          .replace(/<[^>]+>/g, "") // strip Slack markup
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 200);

        if (cleaned) results.push(`[Slack] ${msg.user}: ${cleaned}`);
      }
    } catch (err: any) {
      console.error(`[Slack] Error searching "${query}":`, err.message);
    }
  }

  return results;
}

export async function getSlackContext(ticketIds: string[], prTitle?: string): Promise<string[]> {
  const queries: string[] = [];

  // Search by each ticket ID
  for (const id of ticketIds) queries.push(id);

  // Also search by PR title keywords if no tickets
  if (queries.length === 0 && prTitle) {
    const keywords = prTitle
      .replace(/[^a-zA-Z0-9 ]/g, " ")
      .split(" ")
      .filter((w) => w.length > 4)
      .slice(0, 3)
      .join(" ");
    if (keywords) queries.push(keywords);
  }

  return searchSlackThreads(queries);
}