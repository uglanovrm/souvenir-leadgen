# ISSUE-001 Bootstrap monorepo

## Goal

Create the initial production-ready repository skeleton.

## Scope

- pnpm workspace;
- apps/web Next.js app;
- worker TypeScript package;
- packages/shared;
- supabase/migrations;
- docs folder;
- .env.example;
- README setup instructions.

## Out of scope

- Supabase schema beyond placeholder;
- AI integration;
- mockup rendering.

## Acceptance criteria

- `pnpm install` works.
- `pnpm dev` starts web app.
- `pnpm worker` starts worker stub.
- `.env.example` has required variables.
- No secrets committed.

## Test commands

```bash
pnpm install
pnpm dev
pnpm worker
```
