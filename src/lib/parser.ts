// src/lib/parser.ts

// Extract ticket IDs like JIRA-123, LIN-456, GH-789
export function extractTicketIds(text: string): string[] {
  const regex = /\b([A-Z]+-\d+)\b/g;
  return [...new Set(text.match(regex) || [])];
}

// Summarize changed files for LLM context
export function summarizeFiles(files: { filename: string; status: string; changes: number }[]): string[] {
  return files.map((f) => `${f.status}: ${f.filename} (+${f.changes} changes)`);
}