// src/lib/parser.ts

// Extract Jira ticket IDs like PROJ-123, JIRA-456
export function extractTicketIds(text: string): string[] {
  const regex = /\b([A-Z]+-\d+)\b/g;
  return [...new Set(text.match(regex) || [])];
}

// Extract Linear issue IDs like LIN-123, ENG-456, TEAM-789
export function extractLinearIds(text: string): string[] {
  const regex = /\b([A-Z]{2,5}-\d+)\b/g;
  const all = [...new Set(text.match(regex) || [])];
  // Linear team keys are 2-5 chars
  return all.filter((id) => {
    const prefix = id.split("-")[0];
    return prefix.length >= 2 && prefix.length <= 5;
  });
}

// Summarize changed files for LLM context
export function summarizeFiles(
  files: { filename: string; status: string; changes: number }[]
): string[] {
  return files.map(
    (f) => `${f.status}: ${f.filename} (+${f.changes} changes)`
  );
}