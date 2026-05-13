// src/lib/jira.ts
import axios from "axios";

interface JiraTicket {
  id: string;
  summary: string;
  description: string;
  status: string;
  priority: string;
  comments: string[];
}

function getJiraClient() {
  const baseUrl = process.env.JIRA_BASE_URL;
  const email = process.env.JIRA_EMAIL;
  const token = process.env.JIRA_API_TOKEN;

  if (!baseUrl || !email || !token) return null;

  return axios.create({
    baseURL: `${baseUrl}/rest/api/3`,
    auth: { username: email, password: token },
    headers: { "Accept": "application/json" },
    timeout: 10000,
  });
}

export async function fetchJiraTicket(ticketId: string): Promise<JiraTicket | null> {
  const client = getJiraClient();
  if (!client) {
    console.log("[Jira] Skipping — JIRA_BASE_URL/EMAIL/API_TOKEN not configured");
    return null;
  }

  try {
    const { data } = await client.get(`/issue/${ticketId}`, {
      params: { fields: "summary,description,status,priority,comment" },
    });

    const fields = data.fields;

    // Extract plain text from Atlassian Document Format (ADF)
    const descriptionText = extractADFText(fields.description);

    const comments: string[] = (fields.comment?.comments || [])
      .slice(0, 5) // only last 5 comments
      .map((c: any) => extractADFText(c.body))
      .filter(Boolean);

    return {
      id: ticketId,
      summary: fields.summary || "",
      description: descriptionText,
      status: fields.status?.name || "Unknown",
      priority: fields.priority?.name || "Unknown",
      comments,
    };
  } catch (err: any) {
    const status = err.response?.status;
    if (status === 404) {
      console.log(`[Jira] Ticket ${ticketId} not found`);
    } else if (status === 401) {
      console.error("[Jira] Auth failed — check JIRA_EMAIL and JIRA_API_TOKEN");
    } else {
      console.error(`[Jira] Error fetching ${ticketId}:`, err.message);
    }
    return null;
  }
}

export async function fetchJiraTickets(ticketIds: string[]): Promise<JiraTicket[]> {
  if (ticketIds.length === 0) return [];

  const results = await Promise.allSettled(
    ticketIds.map((id) => fetchJiraTicket(id))
  );

  return results
    .filter((r): r is PromiseFulfilledResult<JiraTicket> => r.status === "fulfilled" && r.value !== null)
    .map((r) => r.value);
}

export function formatJiraContext(tickets: JiraTicket[]): string[] {
  if (tickets.length === 0) return [];

  return tickets.map((t) => {
    const lines = [
      `[${t.id}] ${t.summary} (${t.status} · ${t.priority})`,
      t.description ? `Description: ${t.description.slice(0, 300)}` : "",
      t.comments.length > 0 ? `Comments: ${t.comments.slice(0, 3).join(" | ")}` : "",
    ].filter(Boolean);

    return lines.join("\n");
  });
}

// Recursively extract plain text from Atlassian Document Format (ADF)
function extractADFText(node: any): string {
  if (!node) return "";
  if (typeof node === "string") return node;
  if (node.type === "text") return node.text || "";
  if (node.content && Array.isArray(node.content)) {
    return node.content.map(extractADFText).join(" ").trim();
  }
  return "";
}