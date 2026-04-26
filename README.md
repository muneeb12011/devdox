# DevDox — ADRs on Autopilot

> Automatically generate Architecture Decision Records on every pull request.

[![Install on GitHub](https://img.shields.io/badge/Install%20on-GitHub-0a0a0f?style=for-the-badge&logo=github)](https://github.com/apps/devdox-ai/installations/new)
[![Live Demo](https://img.shields.io/badge/Live-Demo-c44b2b?style=for-the-badge)](https://devdox-nu.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-4a6741?style=for-the-badge)](LICENSE)

---

## What is DevDox?

DevDox is a GitHub App that watches every pull request and automatically generates a full **Architecture Decision Record (ADR)** — dropped right in the PR comment thread and committed to your repo.

No templates. No meetings. No excuses.

```
PR opened → DevDox reads commits + diffs + linked tickets
         → LLM extracts the "why" behind the change
         → ADR posted as PR comment
         → ADR saved to docs/decisions/
```

---

## Demo

When a PR is opened, DevDox posts this automatically:

```markdown
## 🤖 DevDox — Architecture Decision Record

### 📋 Summary
Migrated auth to GitHub App installation tokens for private repo access.

### 🧠 Key Decisions
- ✅ Use createAppAuth over personal access tokens
- ✅ Token passed through analyzePR service layer

### 🚨 Risks
- ⚠️ Installation tokens expire after 1 hour — refresh logic required

### 📄 Full ADR
...saved to docs/decisions/2026-04-24-auth-refactor-pr42.md
```

---

## Install in 60 seconds

[![Install DevDox](https://img.shields.io/badge/%E2%9A%A1%20Install%20DevDox%20Free-c44b2b?style=for-the-badge)](https://github.com/apps/devdox-ai/installations/new)

1. Click the button above
2. Select the repositories you want DevDox to watch
3. Open any pull request — your first ADR appears in ~15 seconds

---

## How it works

| Step | What happens |
|------|-------------|
| 1 | PR is opened in your repo |
| 2 | DevDox webhook fires instantly |
| 3 | Commits, diffs, and linked ticket IDs are fetched |
| 4 | LLM extracts the reasoning behind the change |
| 5 | Structured ADR posted as PR comment |
| 6 | ADR committed to `docs/decisions/` in your repo |

---

## Features

- **AI-powered ADR generation** — no prompting required
- **Auto-saved to your repo** — `docs/decisions/YYYY-MM-DD-pr-title-prN.md`
- **Redis-cached results** — sub-100ms on repeated analysis
- **Ticket context aware** — parses JIRA-123, LIN-456 from PR titles
- **Zero setup** — install the app, that's it
- **100% PR coverage** — every PR, no exceptions

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| GitHub App framework | Probot |
| Webhook proxy (dev) | Smee.io |
| LLM inference | Groq (Llama 3.1) |
| Caching | Upstash Redis |
| Auth | GitHub App installation tokens |
| Validation | Zod |
| Language | TypeScript |

---

## Local Development

### Prerequisites
- Node.js 18+
- pnpm or npm
- Upstash Redis account (free tier works)
- Groq API key (free)

### Setup

```bash
# Clone the repo
git clone https://github.com/muneeb12011/devdox.git
cd devdox

# Install dependencies
npm install

# Copy env template
cp .env.example .env
```

### Environment Variables

```dotenv
# GitHub App
APP_ID=your_app_id
PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n..."
WEBHOOK_SECRET=your_webhook_secret
WEBHOOK_PROXY_URL=https://smee.io/your-channel
GITHUB_TOKEN=ghp_your_token

# LLM
GROQ_API_KEY=your_groq_key

# Cache
REDIS_URL=https://your-db.upstash.io
REDIS_TOKEN=your_upstash_token
```

### Run

```bash
# Terminal 1 — start the bot
npm run dev

# Terminal 2 — forward webhooks
smee -u https://smee.io/your-channel -t http://localhost:3000/api/github/webhooks
```

Then open a PR on any repo where DevDox is installed.

---

## Project Structure

```
src/
├── bot/
│   ├── index.ts          # Express server + webhook handler setup
│   ├── handler.ts        # PR opened event handler
│   └── formatter.ts      # ADR comment formatter
├── services/
│   └── analyzePR.ts      # Main analysis orchestrator
├── lib/
│   ├── github.ts         # GitHub API calls (Octokit)
│   ├── llm.ts            # LLM inference (Groq)
│   ├── cache.ts          # Redis caching layer
│   └── parser.ts         # Ticket ID extraction
├── schemas/
│   └── analysis.schema.ts # Zod validation schemas
└── api/
    └── analyze.ts        # REST API endpoint
```

---

## Roadmap

- [x] Core ADR generation on PR open
- [x] Auto-save ADR to `docs/decisions/`
- [x] Redis caching
- [x] Installation token auth
- [ ] Re-analyze on PR update
- [ ] Jira / Linear API integration
- [ ] Slack thread ingestion
- [ ] Custom ADR templates
- [ ] Dashboard to view all ADRs
- [ ] Stripe / Lemon Squeezy payments

---

## Contributing

PRs welcome. Please open an issue first to discuss what you'd like to change.

---

## License

MIT © [muneeb12011](https://github.com/muneeb12011)

---

<div align="center">
  <strong>Built with ❤️ by <a href="https://github.com/muneeb12011">muneeb12011</a></strong>
  <br/>
  <a href="https://devdox-nu.vercel.app">devdox-nu.vercel.app</a>
</div>
