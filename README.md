# FLUX — AI-Native Resume Operating System

A production-grade, AI-native ATS resume optimization platform built as a single Next.js 15
application. Architected for clarity over complexity: one app, one database, one deployment.

> *"Architect your professional narrative."*

---

## Stack

| Layer | Choice |
|---|---|
| Framework | **Next.js 15** (App Router · React 19 · Turbopack) |
| Language | **TypeScript 5** (strict, `noUncheckedIndexedAccess`) |
| Styling | **Tailwind CSS 4** + custom MD3-style semantic palette |
| Database | **Neon Postgres** + **Drizzle ORM** |
| Auth | **better-auth** (email/password + optional Google OAuth) |
| AI | **Vercel AI SDK** + **LangGraph** + Anthropic (Sonnet / Haiku) |
| Cache / RL | **Upstash Redis** + sliding-window rate limit |
| Files | **Cloudinary** (avatars, exports — optional) |
| PDF | **@react-pdf/renderer** (server-rendered) |
| Tests | **Vitest** + **Playwright** |

## Architecture

```
src/
├── app/
│   ├── (app)/                 # authenticated shell (sidebar + topbar + footer)
│   │   ├── dashboard/         # Executive Dashboard
│   │   ├── editor/[id]/       # Strategic Resume Editor
│   │   ├── optimize/          # Strategic Optimization Workspace (LangGraph)
│   │   ├── portfolio/         # Executive Portfolio Gallery (templates + export)
│   │   ├── archive/
│   │   └── account/
│   ├── api/
│   │   ├── auth/[...all]/     # better-auth handler
│   │   ├── resumes/           # CRUD, score, optimize, export
│   │   └── ai/                # chat (streaming), rewrite
│   ├── sign-in/  sign-up/     # Executive Auth & Onboarding
│   ├── page.tsx               # landing
│   ├── error.tsx  not-found.tsx
│   └── layout.tsx + globals.css
├── components/
│   ├── ui/                    # primitives (button, card, input, badge, progress,
│   │                          # avatar, separator, skeleton, dialog, tabs,
│   │                          # editable, icon, toaster)
│   └── layout/                # sidebar, topbar, footer, theme-toggle
├── features/                  # feature-driven slices (server actions + UI)
│   ├── auth/   dashboard/   editor/   optimize/   portfolio/   resumes/
├── lib/
│   ├── ai/        # provider, prompts, schemas, LangGraph state machine
│   ├── ats/       # deterministic scoring engine
│   ├── auth/      # better-auth server + client + session helpers
│   ├── resume/    # types (zod), templates, server-rendered PDF
│   ├── env.ts     # zod-validated env
│   ├── logger.ts  # structured JSON logger
│   ├── cloudinary.ts
│   ├── redis.ts
│   └── utils.ts
├── db/
│   ├── client.ts  # neon-http drizzle, snake_case casing
│   ├── schema/    # auth, resumes, jobs, ai
│   ├── migrate.ts
│   └── migrations/
├── hooks/
└── middleware.ts  # auth-gated routes
```

## Quick start

```bash
pnpm install
cp .env.example .env.local       # fill in secrets
pnpm db:push                     # push schema to Neon
pnpm dev
```

Open http://localhost:3000.

Required env vars to actually run:
- `DATABASE_URL` (Neon — get one free at https://neon.tech)
- `BETTER_AUTH_SECRET` — `openssl rand -base64 32`
- `ANTHROPIC_API_KEY` (or `AI_GATEWAY_URL`) — for AI optimization

Optional (gracefully degrades):
- `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` — rate limiting & caching
- `CLOUDINARY_*` — for persisting exported PDFs
- `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` — Google sign-in

## The AI flow

`POST /api/resumes/:id/optimize` runs a **LangGraph** state machine:

```
START → analyze (JD)  →  rewrite (resume)  →  score (deterministic)  → END
```

- **analyze** — Anthropic extracts hardSkills / softSkills / responsibilities / seniority / domain.
- **rewrite** — Anthropic rewrites the resume to mirror target keywords (truthfully).
- **score** — A pure-TS scorer rates keyword match · quantification · formatting · readability.

Every run is recorded in `ai_runs` with model, tokens, latency, and graph state for observability.

## ATS scoring

`src/lib/ats/scorer.ts` is deterministic and dependency-free. It evaluates:

- **keywordMatch** — exact + bigram match against JD-derived keywords
- **quantification** — fraction of bullets containing $, %, time, or scale metrics
- **formatting** — completeness of contact info, sections, headline
- **readability** — sentence length sweet-spot + weak-verb penalty

Test it: `pnpm test`.

## Auth

- **better-auth** with Drizzle adapter
- 30-day sessions, 5-minute cookie cache for hot paths
- `middleware.ts` gates `/dashboard`, `/editor`, `/optimize`, `/portfolio`, `/account`, `/archive`
- Server-only `requireUser()` / `requireSession()` helpers

## Deployment

Deploy to **Vercel**. Edge-friendly database (Neon HTTP), serverless API routes, no workers.

```bash
vercel deploy
```

## Roadmap

- Editor.js block-based editor (current implementation uses a custom contentEditable wrapper)
- DOCX export
- Multi-template renderer (Boardroom Classic, Executive Minimal)
- Recruiter-facing share links with revocable tokens

---

Built with surgical precision. No microservices. No worker queues. No Kubernetes. Just one app.
# FLUX
