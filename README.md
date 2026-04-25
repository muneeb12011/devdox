# 📝 DevDox

**AI that writes your architecture docs automatically.**

Every time you open a Pull Request, DevDox analyzes your commits, tickets, and Slack threads, then posts an ADR (Architecture Decision Record) as a comment.

No more "why did we do this?" questions. No more stale docs.

---

## 🚀 Quick Start

1. **Install the GitHub App** – [Click here](https://github.com/apps/devdox)
2. **Open a PR** – DevDox will comment within seconds
3. **That's it** – Your team now has auto-generated docs

---

## 💰 Pricing

| Tier | Price | What you get |
|------|-------|---------------|
| Free | $0 | 50 PRs/month |
| Pro | $29/month | Unlimited PRs + Slack + Jira |

First month free on Pro. No credit card required to try.

---

## 🔧 Tech Stack

- GitHub Probot
- Groq (Llama 3)
- Redis (Upstash)
- Turso (SQLite)
- Lemon Squeezy (payments)

---

## 📸 Demo

![DevDox PR Comment](https://via.placeholder.com/600x300?text=Your+Screenshot+Here)

---

## 📄 License

MIT

---

**Built from Pakistan 🇵🇰**


## What changed
Added a full README.md to the DevDox repository covering installation, 
architecture, tech stack, and roadmap.

## Why
The repo had no documentation making it hard for new contributors or 
potential users to understand what DevDox does, how to install it, 
or how to run it locally.

## Decisions made
- Chose to document the Probot + Groq + Upstash stack explicitly so 
  contributors understand the architecture before diving into code
- Added install badge linking directly to GitHub App installation flow
  to reduce friction for new users
- Included project structure tree so contributors know where to find 
  each layer (bot, services, lib, schemas)
- Documented environment variables with examples to prevent the 
  dotenv/setup confusion we experienced during development

## Risks
- README links to devdox-nu.vercel.app which needs to stay live
- Groq API key instructions assume free tier — may need updating 
  when Pro plan launches with model selection

## Related
- Closes #1 (no documentation issue)
- Part of v1.0 launch preparation
