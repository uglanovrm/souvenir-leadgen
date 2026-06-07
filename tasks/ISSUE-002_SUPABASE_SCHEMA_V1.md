# ISSUE-002 Supabase schema v1

## Goal

Create the initial Supabase database schema for the MVP.

## Scope

Create migration for:

- profiles;
- organizations;
- contacts;
- campaigns;
- campaign_leads;
- product_packages;
- product_items;
- portfolio_assets;
- mockup_template_sources;
- mockup_templates;
- brand_assets;
- brand_asset_variants;
- offers;
- offer_assets;
- prototype_briefs;
- prototype_renders;
- jobs;
- messages;
- deals;
- commissions;
- audit_events;
- settings.

## Acceptance criteria

- Migration applies cleanly.
- Primary keys and foreign keys exist.
- Common indexes exist.
- RLS enabled on app tables.
- Seed file creates demo package, demo campaign, demo mockup template metadata.

## Test commands

```bash
supabase db reset
```
