# Architecture v0.1

## Runtime diagram

Browser / Next.js UI
→ Supabase Auth
→ Supabase Postgres
→ Supabase Storage

Local TypeScript Worker
→ Supabase jobs table
→ Supabase Storage
→ LM Studio local API
→ sharp renderer
→ generated artifacts

## Data ownership

Supabase is the source of truth.

Local worker is not the source of truth. It only processes queued jobs and writes results back.

## Core modules

### Web app

- dashboard;
- campaigns;
- leads;
- catalog;
- assets;
- prototype studio;
- offers;
- deals;
- settings.

### Worker

Job types:

- lead.import;
- lead.classify;
- lead.score;
- offer.generate;
- prototype.create_brief;
- prototype.render;
- prototype.qc;
- offer.render_html;
- offer.render_pdf;
- message.prepare.

### Supabase

- Auth;
- Postgres;
- RLS;
- Storage;
- Edge Functions only for light webhooks/send later.

## Worker polling strategy

Worker periodically selects jobs:

- status = queued;
- locked_until is null or expired;
- attempts < max_attempts.

It locks the job, processes it, then sets:

- succeeded with result;
- failed with error;
- queued again for retry.

## Environment variables

Frontend-safe:

- NEXT_PUBLIC_SUPABASE_URL;
- NEXT_PUBLIC_SUPABASE_ANON_KEY.

Server/worker-only:

- SUPABASE_SERVICE_ROLE_KEY;
- LMSTUDIO_BASE_URL;
- LMSTUDIO_MODEL;
- WORKER_ID;
- EMAIL_PROVIDER_KEY, optional later.

Never expose service role key to frontend.
