<div align="center">

<br/>
sadas
```
██████╗ ███████╗██╗   ██╗██████╗  ██████╗ ██╗  ██╗
██╔══██╗██╔════╝██║   ██║██╔══██╗██╔═══██╗╚██╗██╔╝
██║  ██║█████╗  ██║   ██║██║  ██║██║   ██║ ╚███╔╝ 
██║  ██║██╔══╝  ╚██╗ ██╔╝██║  ██║██║   ██║ ██╔██╗ 
██████╔╝███████╗ ╚████╔╝ ██████╔╝╚██████╔╝██╔╝ ██╗
╚═════╝ ╚══════╝  ╚═══╝  ╚═════╝  ╚═════╝ ╚═╝  ╚═╝
```

**Architecture Decision Records, on autopilot.**

Every pull request. Zero effort. Zero meetings.

<br/>

[![Install on GitHub](https://img.shields.io/badge/⚡_Install_Free-0a0a0f?style=for-the-badge&logo=github&logoColor=white)](https://github.com/apps/devdox-ai/installations/new)
[![Live Demo](https://img.shields.io/badge/Live_Demo-c44b2b?style=for-the-badge)](https://devdox-nu.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-4a6741?style=for-the-badge)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Groq](https://img.shields.io/badge/Powered_by_Groq-F55036?style=for-the-badge)](https://groq.com)

</div>

---

## What is DevDox?

DevDox is a GitHub App that silently watches every pull request and generates a full **Architecture Decision Record (ADR)** — automatically.

No templates. No tickets. No standups. No excuses.

When a PR lands, DevDox reads the commits, diffs, and any linked tickets, then uses an LLM to extract the *why* behind the change. The ADR appears in the PR thread and is committed to `docs/decisions/` in your repo — permanently archived.

```
PR opened
   ↓
DevDox reads commits + diffs + linked ticket IDs
   ↓
LLM extracts the architectural intent
   ↓
ADR posted as PR comment  →  saved to docs/decisions/
```

---

## See It In Action

When you open a PR, DevDox posts this automatically:

```markdown
## 🤖 DevDox — Architecture Decision Record

### 📋 Summary
Migrated auth to GitHub App installation tokens for private repo access.

### 🧠 Key Decisions
- ✅ Use createAppAuth over personal access tokens
- ✅ Token passed through the analyzePR service layer
- ✅ Installation token refreshed per-request (1hr TTL)

### 🚨 Risks
- ⚠️ Installation tokens expire after 1 hour — refresh logic required
- ⚠️ App must have Contents: Read & Write permission to commit ADRs

### 📄 Full ADR
**Problem:** Hardcoded personal access tokens blocked access to private repos
and couldn't be scoped per-installation.

**Decision:** Replace GITHUB_TOKEN with GitHub App installation tokens
generated via createAppAuth. Token is generated fresh per PR event and
passed down through the handler → analyzePR → fetchPRData call chain.

**Consequences:** All API calls are now scoped to the installation.
ADR saved to docs/decisions/2026-04-24-auth-refactor-pr42.md

---
*Powered by DevDox · [Install on your repos](https://github.com/apps/devdox-ai)*
```

---

## Install in 60 Seconds

1. **[Click here to install DevDox →](https://github.com/apps/devdox-ai/installations/new)**
2. Select the repositories you want DevDox to watch
3. Open any pull request — your first ADR appears in ~15 seconds

No config files. No YAML. Nothing to configure.

---

## How It Works

| Step | What happens |
|------|-------------|
| **1** | PR is opened in your repo |
| **2** | GitHub fires a webhook to DevDox instantly |
| **3** | DevDox posts a "thinking..." placeholder comment |
| **4** | Commits, diffs, and linked ticket IDs are fetched in parallel |
| **5** | Groq LLM (Llama 3.1) extracts the architectural reasoning |
| **6** | Structured ADR replaces the placeholder comment |
| **7** | ADR is committed to `docs/decisions/YYYY-MM-DD-title-prN.md` |
| **8** | Result is cached in Redis — sub-100ms on repeat requests |

---

## Features

- **Zero-config ADR generation** — install the app, open a PR, done
- **Auto-saved to your repo** — `docs/decisions/YYYY-MM-DD-pr-title-prN.md`
- **Parallel API fetching** — commits, diffs, and files fetched concurrently
- **Redis caching** — sub-100ms on repeated analysis of the same PR
- **Ticket context aware** — parses `JIRA-123`, `LIN-456` refs from PR titles and bodies
- **Installation token auth** — properly scoped GitHub App auth, not personal tokens
- **100% PR coverage** — every PR, every time, no exceptions

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| GitHub App | [@octokit/webhooks](https://github.com/octokit/webhooks.js) | Native webhook handling with full type safety |
| LLM inference | [Groq](https://groq.com) (Llama 3.1) | Fast, cheap, high-quality structured output |
| Caching | [Upstash Redis](https://upstash.com) | Serverless Redis with HTTP API — no infra |
| Auth | GitHub App installation tokens | Per-installation scoping, no PAT sharing |
| Schema validation | [Zod](https://zod.dev) | Runtime type safety on LLM output |
| Runtime | TypeScript + tsx | Fast iteration, full type safety |
| Webhook proxy (dev) | [Smee.io](https://smee.io) | Local development with live GitHub webhooks |

---

## Local Development

### Prerequisites

- Node.js 18+
- npm
- [Upstash](https://upstash.com) account (free tier works)
- [Groq](https://console.groq.com) API key (free)

### 1. Clone and install

```bash
git clone https://github.com/muneeb12011/devdox.git
cd devdox
npm install
```

### 2. Create a GitHub App

1. Go to [github.com/settings/apps/new](https://github.com/settings/apps/new)
2. Set **Webhook URL** to your smee.io channel (create one at [smee.io](https://smee.io))
3. Set **Webhook secret** to any string
4. Set permissions:
   - **Contents**: Read & Write
   - **Pull requests**: Read & Write
   - **Issues**: Write
   - **Metadata**: Read (auto-selected)
5. Subscribe to events: `Pull request`
6. Click **Create GitHub App**
7. Generate and download the **private key** (`.pem` file)

### 3. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env`:

```dotenv
# GitHub App credentials
APP_ID=your_app_id
WEBHOOK_SECRET=your_webhook_secret
PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIEo...\n-----END RSA PRIVATE KEY-----\n"

# GitHub personal token (for local testing)
GITHUB_TOKEN=ghp_your_token

# LLM
GROQ_API_KEY=gsk_your_groq_key

# Redis
REDIS_URL=https://your-db.upstash.io
REDIS_TOKEN=your_upstash_token

# Webhook proxy
WEBHOOK_PROXY_URL=https://smee.io/your-channel
DISABLE_WEBHOOK_PROXY=false
```

> **PRIVATE_KEY format:** The key must be a single line with literal `\n` between lines, wrapped in double quotes. Open your `.pem` file and replace all real newlines with `\n`.

### 4. Run

Open two terminals:

```bash
# Terminal 1 — start the bot
npm run dev

# Terminal 2 — forward GitHub webhooks to localhost
smee -u https://smee.io/your-channel -t http://localhost:3000/api/github/webhooks
```

Install your GitHub App on a repo and open a pull request. The ADR will appear in ~15 seconds.

---

## Project Structure

```
src/
├── bot/
│   ├── index.ts           # Express server + webhook setup
│   ├── handler.ts         # PR opened event — orchestrates the full flow
│   └── formatter.ts       # Formats LLM output into the ADR comment
├── services/
│   └── analyzePR.ts       # Pipeline: cache check → fetch → LLM → validate → cache
├── lib/
│   ├── github.ts          # Octokit API calls (parallel commit + diff + file fetch)
│   ├── llm.ts             # Groq inference (Llama 3.1 70B)
│   ├── cache.ts           # Upstash Redis read/write helpers
│   └── parser.ts          # Ticket ID extraction (JIRA-123, LIN-456, etc.)
├── schemas/
│   └── analysis.schema.ts # Zod schema — validates and types LLM output
└── api/
    └── analyze.ts         # REST endpoint for manual re-analysis trigger
```

---

## Troubleshooting

**ADR comment not appearing**
- Confirm smee is running and forwarding to the correct port (`3000` by default)
- Verify `WEBHOOK_SECRET` in `.env` matches what you set in the GitHub App settings
- Check terminal for `[DevDox] PR #N opened in owner/repo`

**`Resource not accessible by integration` (403)**
- Go to [github.com/settings/apps](https://github.com/settings/apps) → your app → **Permissions & events**
- Set **Contents** to **Read & Write** → save changes
- Go to [github.com/settings/installations](https://github.com/settings/installations) → **Configure** → accept the updated permissions

**`WRONGPASS` Redis error**
- A system environment variable is overriding `.env`
- Add `{ override: true }` to your `dotenv.config()` call in `src/bot/index.ts`

**`Bad credentials` GitHub 401**
- Your `GITHUB_TOKEN` has expired — regenerate it at [github.com/settings/tokens](https://github.com/settings/tokens)
- Or use installation token auth (see `handler.ts` — `getInstallationAuth`)

---

## Roadmap

- [x] Core ADR generation on PR open
- [x] Auto-save ADR to `docs/decisions/`
- [x] Redis caching
- [x] GitHub App installation token auth
- [x] Parallel commit + diff + file fetching
- [ ] Re-analyze on PR update (`pull_request.synchronize`)
- [ ] Jira / Linear API integration for richer ticket context
- [ ] Slack thread ingestion
- [ ] Custom ADR templates per repo (`.devdox.yml`)
- [ ] Dashboard to browse all ADRs
- [ ] Payments via Lemon Squeezy

---

## Contributing

PRs welcome. Open an issue first to discuss what you'd like to change.

---

## License

MIT © [muneeb12011](https://github.com/muneeb12011)

---

<div align="center">
  <strong>Built by <a href="https://github.com/muneeb12011">muneeb12011</a></strong>
  &nbsp;·&nbsp;
  <a href="https://devdox-nu.vercel.app">devdox-nu.vercel.app</a>
  &nbsp;·&nbsp;
  <a href="https://github.com/apps/devdox-ai/installations/new">Install DevDox Free →</a>
</div>
