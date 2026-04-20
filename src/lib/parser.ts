// src/lib/parser.ts

export function extractTicketIds(text: string): string[] {
  const regex = /([A-Z]+-\d+)/g;
  return text.match(regex) || [];
}

// Simulated Slack context (replace later with real API)
export async function getSlackContext(_: string[]) {
  return [
    "We chose Redis because of latency issues in Postgres",
    "This might break legacy auth flow",
  ];
}