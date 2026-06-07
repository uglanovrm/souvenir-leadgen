# Master Prompt for OpenClaw / Codex

You are implementing a lean production MVP for a B2B lead-generation offer system for a local souvenir manufacturing business.

## Business goal

The system helps a manufacturer and a lead-generation agent find suitable B2B counterparties, prepare personalized commercial offers, generate branded prototype mockups with the client's logo, and manage deals and agent commissions.

## Current resources

- Hardware: MacBook Air M1 13.
- AI coding: OpenClaw + Codex.
- Backend platform: Supabase.
- Local AI: LM Studio + Gemma 12B.
- Development style: small tasks, one PR per issue, no overengineering.

## Architecture constraints

Use this stack for MVP:

- Frontend: Next.js + TypeScript + Tailwind + shadcn/ui.
- Backend: Supabase Auth, Postgres, Storage, RLS, Edge Functions only where necessary.
- Worker: local TypeScript worker polling Supabase `jobs` table.
- AI: LM Studio OpenAI-compatible local endpoint.
- Image processing: sharp.
- Mockups: PSD source files are allowed only as design sources; runtime rendering uses PNG/SVG/JSON mockup packs.
- Storage: Supabase Storage.
- PDF/export: HTML-first, then PDF via Playwright or print-friendly browser output.

Do not introduce without explicit approval:

- FastAPI;
- Redis;
- Celery;
- MinIO;
- Kubernetes;
- heavy scraping engine;
- direct PSD runtime renderer;
- fully automatic cold outreach.

## Product principle

The product is not a spam machine. It is a controlled offer factory.

Workflow:

Lead data/import
→ lead classification
→ scoring
→ top 5–10 candidates
→ offer generation
→ prototype generation
→ quality control
→ human approval
→ prepared message/send task
→ deal tracking
→ commission calculation

## Prototype Studio principle

Do not create low-quality mockups by just pasting a logo onto an image.

Use:

- certified mockup templates;
- safe areas;
- masks;
- logo quality scoring;
- rule-based QC;
- manual approval;
- commercial offer assembly.

PSD files are source/master assets only. Runtime mockup format:

- base.png;
- mask.png;
- shadow.png;
- highlight.png;
- preview.jpg;
- template.json.

## AI rules

The local LLM must never invent:

- prices;
- deadlines;
- production capabilities;
- discounts;
- previous case claims;
- legal conclusions.

All model outputs must be validated with zod. If JSON is invalid, retry once with a repair prompt. If still invalid, fail the job gracefully and show a warning in UI.

## Compliance rules

Do not implement unrestricted automatic sending. Sending must require:

- approved offer;
- approved prototypes;
- legal basis / manual action;
- audit log.

Without legal basis, create a manual contact task or prepared draft, not automatic outreach.

## Implementation rules

- One task = one coherent PR.
- Do not edit unrelated files.
- Add migrations for DB changes.
- Add RLS policies.
- Add types and zod schemas.
- Add seed/demo data where useful.
- Add acceptance checks in README or task output.
- Never commit `.env` or keys.
- Keep code simple enough to run on MacBook Air M1.

## First implementation path

1. Bootstrap monorepo.
2. Supabase schema v1.
3. Auth and roles.
4. Catalog and asset library.
5. Lead import and campaign builder.
6. Jobs table and local worker.
7. LM Studio client and structured JSON validation.
8. Lead scoring.
9. Offer generator.
10. Prototype Studio: logo upload, template manager, renderer, QC.
11. Offer preview/export.
12. Message prepare.
13. Deal and commission module.

## Output expected from every coding task

At the end of each task, provide:

- files changed;
- database migrations created;
- commands run;
- tests/checks performed;
- unresolved risks;
- next suggested issue.
