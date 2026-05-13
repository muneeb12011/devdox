"use strict";
// src/lib/parser.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractTicketIds = extractTicketIds;
exports.getSlackContext = getSlackContext;
function extractTicketIds(text) {
    const regex = /([A-Z]+-\d+)/g;
    return text.match(regex) || [];
}
// Simulated Slack context (replace later with real API)
async function getSlackContext(_) {
    return [
        "We chose Redis because of latency issues in Postgres",
        "This might break legacy auth flow",
    ];
}
