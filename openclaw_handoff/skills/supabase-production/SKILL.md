---
name: supabase-production
description: Use when creating Supabase schema, RLS policies, migrations, storage buckets, Edge Functions, and production-safe Supabase access.
---

# Supabase Production Skill

## Rules

- Every DB change must be a migration.
- Enable RLS on application tables.
- Add indexes for foreign keys and common filters.
- Keep service role key worker-only.
- Do not expose service role key to frontend.
- Use Supabase anon key only where RLS protects access.
- Store large files in Storage, not DB.
- Use JSONB for flexible scoring and QC breakdowns.
- Add audit_events for important state changes.

## Storage buckets

Expected buckets:

- portfolio-assets;
- company-logos;
- mockup-sources;
- mockup-templates;
- generated-mockups;
- offer-exports;
- imports.

## RLS baseline

Profiles:

- user can read own profile;
- admin can read all.

Business data:

- admin and producer can access all;
- agent can access own campaigns/leads/offers/deals;
- service role worker can process jobs.

## Migrations

Migrations must be deterministic and idempotency-aware.
