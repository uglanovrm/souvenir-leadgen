# ISSUE-003 Supabase Storage buckets

## Goal

Configure Storage buckets for assets and generated files.

## Scope

Create buckets:

- portfolio-assets;
- company-logos;
- mockup-sources;
- mockup-templates;
- generated-mockups;
- offer-exports;
- imports.

## Acceptance criteria

- Buckets are created via migration/seed/config where possible.
- Upload path conventions are documented.
- Private/public policy is specified.
- Frontend does not require service role for normal upload flows.
