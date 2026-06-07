# Souvenir Lead-Gen Offer System

Production-oriented MVP foundation for a local souvenir-production lead-gen workflow.

## Stack

- Next.js + TypeScript web app in `apps/web`
- Supabase-first backend and migrations in `supabase/`
- Local TypeScript worker in `packages/worker`
- Shared zod schemas and domain types in `packages/shared`
- LM Studio provider interface for local LLM calls
- Runtime mockup packs for Prototype Studio

## Constraints

- No paid APIs.
- No secrets committed.
- No automatic cold outreach.
- No real emails or messages sent by the app.
- No FastAPI, Redis, Celery, MinIO, or Kubernetes.

## Setup

```bash
corepack pnpm install
cp .env.example .env.local
corepack pnpm dev
```

Run the local worker:

```bash
corepack pnpm worker
```

Run checks:

```bash
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
```

## Project Materials

- `docs/` contains architecture, QA, and runbook notes.
- `tasks/` contains the implementation backlog.
- `openclaw_handoff/` preserves the original handoff package.
- `openclaw_6h_execution_pack/` preserves the autonomous execution package.
