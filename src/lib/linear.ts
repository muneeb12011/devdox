// src/lib/linear.ts
import axios from "axios";

interface LinearIssue {
  id: string;
  identifier: string;
  title: string;
  description: string;
  state: string;
  priority: string;
  comments: string[];
}

function getLinearClient() {
  const token = process.env.LINEAR_API_KEY;
  if (!token) return null;

  return axios.create({
    baseURL: "https://api.linear.app/graphql",
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
    },
    timeout: 10000,
  });
}

export async function fetchLinearIssue(identifier: string): Promise<LinearIssue | null> {
  const client = getLinearClient();
  if (!client) {
    console.log("[Linear] Skipping — LINEAR_API_KEY not configured");
    return null;
  }

  const query = `
    query GetIssue($identifier: String!) {
      issue(id: $identifier) {
        id
        identifier
        title
        description
        state { name }
        priority
        comments {
          nodes {
            body
            user { name }
          }
        }
      }
    }
  `;

  try {
    const { data } = await client.post("", {
      query,
      variables: { identifier },
    });

    const issue = data?.data?.issue;
    if (!issue) {
      console.log(`[Linear] Issue ${identifier} not found`);
      return null;
    }

    const comments = (issue.comments?.nodes || [])
      .slice(0, 5)
      .map((c: any) => `${c.user?.name || "Unknown"}: ${c.body}`)
      .filter(Boolean);

    const priorityMap: Record<number, string> = {
      0: "No priority",
      1: "Urgent",
      2: "High",
      3: "Medium",
      4: "Low",
    };

    return {
      id: issue.id,
      identifier: issue.identifier,
      title: issue.title || "",
      description: issue.description || "",
      state: issue.state?.name || "Unknown",
      priority: priorityMap[issue.priority] || "Unknown",
      comments,
    };
  } catch (err: any) {
    const status = err.response?.status;
    if (status === 401) {
      console.error("[Linear] Auth failed — check LINEAR_API_KEY");
    } else {
      console.error(`[Linear] Error fetching ${identifier}:`, err.message);
    }
    return null;
  }
}

export async function fetchLinearIssues(identifiers: string[]): Promise<LinearIssue[]> {
  if (identifiers.length === 0) return [];

  const results = await Promise.allSettled(
    identifiers.map((id) => fetchLinearIssue(id))
  );

  return results
    .filter((r): r is PromiseFulfilledResult<LinearIssue> =>
      r.status === "fulfilled" && r.value !== null
    )
    .map((r) => r.value);
}

export function formatLinearContext(issues: LinearIssue[]): string[] {
  if (issues.length === 0) return [];

  return issues.map((issue) => {
    const lines = [
      `[${issue.identifier}] ${issue.title} (${issue.state} · ${issue.priority})`,
      issue.description ? `Description: ${issue.description.slice(0, 300)}` : "",
      issue.comments.length > 0
        ? `Comments: ${issue.comments.slice(0, 3).join(" | ")}`
        : "",
    ].filter(Boolean);

    return lines.join("\n");
  });
}