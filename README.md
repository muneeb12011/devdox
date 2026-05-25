<div align="center">

<br/>
sdad
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
[![Deployed on Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://devdox-nu.vercel.app)
[![Powered by Groq](https://img.shields.io/badge/Powered_by-Groq-F55036?style=for-the-badge)](https://groq.com)

</div>

---

## What is DevDox?

DevDox is a GitHub App that silently watches every pull request and generates a full **Architecture Decision Record (ADR)** — automatically.

No templates. No tickets. No standups. No excuses.

When a PR lands, DevDox reads the commits, diffs, and any linked Jira tickets, then uses an LLM to extract the *why* behind the change. The ADR appears in the PR thread and is committed to `docs/decisions/` in your repo — permanently archived.

```
PR opened
   ↓
DevDox reads commits + diffs + linked Jira ticket IDs
   ↓
Jira API fetches ticket context (summary, status, comments)
   ↓
LLM extracts the architectural intent
   ↓
ADR posted as PR comment  →  saved to docs/decisions/
```

---

## See It In Action

When you open a PR, DevDox posts this automatically:

```markdown
## 🏛 DevDox — Architecture Decision Record

### 📋 Summary
Fixed formatting issues in README.md to improve readability.

### 🧠 Key Decisions
- ✅ Use manual formatting instead of relying on auto-formatting tools
- ✅ Keep README structure consistent across sections

### 🚨 Risks
- ⚠️ Potential for inconsistent formatting if not consistently applied

### 📄 Full ADR

**Problem:** Auto-formatting tools were causing layout inconsistencies.

**Decision:** Switch to manual formatting for README.md to ensure
consistency and readability across all documentation sections.

**Consequences:** Better readability. Requires contributors to follow
the formatting guide manually.

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
| **2** | GitHub fires a webhook to DevDox on Vercel instantly |
| **3** | DevDox posts a "thinking..." placeholder comment |
| **4** | Commits, diffs, and linked ticket IDs are fetched in parallel |
| **5** | Jira API fetches ticket details if `JIRA-123` refs are found |
| **6** | Groq LLM (Llama 3.1) extracts the architectural reasoning |
| **7** | Structured ADR replaces the placeholder comment |
| **8** | ADR is committed to `docs/decisions/YYYY-MM-DD-title-prN.md` |
| **9** | Result is cached in Redis — sub-100ms on repeat requests |

---

## Features

- **Zero-config ADR generation** — install the app, open a PR, done
- **Auto-saved to your repo** — `docs/decisions/YYYY-MM-DD-pr-title-prN.md`
- **Jira integration** — fetches ticket summary, status, and comments when `JIRA-123` refs found in PR
- **Slack integration** — searches workspace for threads mentioning the PR or ticket (requires user token)
- **Parallel API fetching** — commits, diffs, files, and Jira fetched concurrently
- **Redis caching** — sub-100ms on repeated analysis of the same PR
- **Smart PR filtering** — skips WIP, draft, typo, chore PRs automatically
- **Force override** — add `[force-adr]` to any PR description to always generate an ADR
- **Opt-out support** — add `[skip-docs]` or `[no-adr]` to skip analysis
- **Idempotency** — duplicate webhooks are safely ignored
- **Fully serverless** — deployed on Vercel, no server to maintain
- **100% PR coverage** — every meaningful PR, every time

---

## Jira Integration

DevDox automatically detects Jira ticket references in your PR title or description (e.g. `JIRA-123`, `PROJ-456`) and fetches:

- Ticket summary and description
- Current status and priority
- Latest comments (up to 5)

This context is fed directly into the LLM so the ADR reflects the actual business reasoning behind the change — not just what the code does.

**Setup:** Add these to your environment variables:

```dotenv
JIRA_BASE_URL=https://yourcompany.atlassian.net
JIRA_EMAIL=you@company.com
JIRA_API_TOKEN=your_atlassian_api_token
```

If these aren't set, DevDox gracefully skips Jira and generates the ADR from commits and diffs alone.

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Hosting | [Vercel](https://vercel.com) Serverless | Zero infra, auto-scaling, 60s function timeout |
| GitHub App | [@octokit/webhooks](https://github.com/octokit/webhooks.js) | Native webhook handling with full type safety |
| LLM inference | [Groq](https://groq.com) (Llama 3.1) | Fast, cheap, high-quality structured output |
| Caching | [Upstash Redis](https://upstash.com) | Serverless Redis with HTTP API — no infra |
| Jira | [Atlassian REST API v3](https://developer.atlassian.com/cloud/jira/platform/rest/v3/) | Ticket context for richer ADRs |
| Slack | [Slack Web API](https://api.slack.com/web) | Thread search for discussion context |
| Auth | GitHub App installation tokens | Per-installation scoping, no PAT sharing |
| Schema validation | [Zod](https://zod.dev) | Runtime type safety on LLM output |
| Runtime | TypeScript + tsx | Fast iteration, full type safety |

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
5. Subscribe to events: `Pull request`, `Issue comment`
6. Click **Create GitHub App**
7. Generate and download the **private key** (`.pem` file)

### 3. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env`:

```dotenv
# GitHub App
APP_ID=your_app_id
WEBHOOK_SECRET=your_webhook_secret
PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIEo...\n-----END RSA PRIVATE KEY-----\n"
GITHUB_TOKEN=ghp_your_token

# LLM
GROQ_API_KEY=gsk_your_groq_key

# Redis (Upstash)
REDIS_URL=https://your-db.upstash.io
REDIS_TOKEN=your_upstash_token

# Jira (optional — skip if not using)
JIRA_BASE_URL=https://yourcompany.atlassian.net
JIRA_EMAIL=you@company.com
JIRA_API_TOKEN=your_atlassian_api_token

# Slack (optional — skip if not using)
SLACK_BOT_TOKEN=xoxb-your-token

# Local dev
WEBHOOK_PROXY_URL=https://smee.io/your-channel
DISABLE_WEBHOOK_PROXY=false
```

> **PRIVATE_KEY format:** Single line with literal `\n` between lines, wrapped in double quotes.

### 4. Run locally

Open two terminals:

```bash
# Terminal 1 — start the bot
npm run dev

# Terminal 2 — forward GitHub webhooks to localhost
npx smee-client -u https://smee.io/your-channel -t http://localhost:3000/api/github/webhooks
```

Open a PR on any repo where DevDox is installed. Add `[force-adr]` to the PR description to guarantee an ADR is generated.

---

## Deployment

DevDox is deployed as a Vercel serverless function. The webhook handler lives at `api/github/webhooks.ts` and is automatically compiled by Vercel.

```bash
npx vercel --prod
```

After deploying, update your GitHub App webhook URL to:
```
https://your-app.vercel.app/api/github/webhooks
```

---

## Project Structure

```
api/
└── github/
    └── webhooks.ts        # Vercel serverless webhook entry point
src/
├── bot/
│   ├── index.ts           # Express server (local dev only)
│   ├── handler.ts         # PR opened event — orchestrates the full flow
│   ├── formatter.ts       # Formats LLM output into the ADR comment
│   └── commands.ts        # Issue comment commands handler
├── services/
│   └── analyzePR.ts       # Pipeline: cache → fetch → Jira → Slack → LLM → validate
├── lib/
│   ├── github.ts          # Octokit API calls (parallel commit + diff + file fetch)
│   ├── llm.ts             # Groq inference (Llama 3.1)
│   ├── cache.ts           # Upstash Redis read/write helpers
│   ├── jira.ts            # Jira REST API v3 integration
│   ├── slack.ts           # Slack Web API search integration
│   └── parser.ts          # Ticket ID extraction (JIRA-123, LIN-456, etc.)
├── schemas/
│   └── analysis.schema.ts # Zod schema — validates and types LLM output
└── api/
    └── analyze.ts         # REST endpoint for manual re-analysis
```

---

## PR Flags

| Flag | Effect |
|------|--------|
| `[force-adr]` | Always generate ADR, even for minor PRs |
| `[skip-docs]` | Skip ADR generation for this PR |
| `[no-adr]` | Same as skip-docs |

---

## Troubleshooting

**Bot not commenting**
- Check Vercel logs → your project → **Logs** tab
- Make sure webhook URL in GitHub App settings points to `https://your-app.vercel.app/api/github/webhooks`
- Add `[force-adr]` to PR description to bypass the minor PR filter

**`Resource not accessible by integration` (403)**
- Go to [github.com/settings/apps](https://github.com/settings/apps) → **Permissions & events**
- Set **Contents** to **Read & Write** → save
- Go to [github.com/settings/installations](https://github.com/settings/installations) → **Configure** → accept updated permissions

**`WRONGPASS` Redis error**
- Add `{ override: true }` to `dotenv.config()` in `src/bot/index.ts`

**`Bad credentials` GitHub 401**
- Regenerate token at [github.com/settings/tokens](https://github.com/settings/tokens)

**Jira not fetching**
- Verify `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN` are set in Vercel environment variables
- Make sure PR title/description contains a valid ticket ID like `PROJ-123`

**Slack search failing (`not_allowed_token_type`)**
- The `search:read` scope requires a **user token** (`xoxp-`), not a bot token (`xoxb-`)
- Go to your Slack app → OAuth & Permissions → User Token Scopes → add `search:read` → reinstall

---

## Roadmap

- [x] Core ADR generation on PR open
- [x] Auto-save ADR to `docs/decisions/`
- [x] Redis caching with idempotency
- [x] GitHub App installation token auth
- [x] Parallel commit + diff + file fetching
- [x] Jira API integration (real ticket context)
- [x] Slack search integration
- [x] Deployed on Vercel (fully serverless)
- [x] Smart PR filtering + force-adr override
- [ ] Re-analyze on PR update (`pull_request.synchronize`)
- [ ] Linear API integration
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
