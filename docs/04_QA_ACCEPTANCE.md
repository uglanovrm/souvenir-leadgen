# QA and Acceptance Checklist

## General

- App starts locally.
- Environment validation catches missing keys.
- Supabase connection works.
- No secrets in git.
- RLS enabled.

## Catalog

- User can create package.
- User can edit package.
- Package can be disabled.
- Offer generator only uses active packages.

## Assets

- Portfolio images upload to Storage.
- Metadata saved in DB.
- Asset can be marked allowed_for_offer.

## Leads

- CSV import works.
- Duplicates are skipped/merged.
- Campaign can contain leads.
- Lead score has breakdown.

## Offer generation

- Offer context uses only DB data.
- LM Studio output validated by zod.
- Offer draft contains warnings for missing data.
- Offer status transitions are valid.

## Prototype Studio

- Logo upload works.
- Logo quality score is calculated.
- Low-quality logo blocks auto-render.
- Mockup template has safe area and placement.
- Rendered mockup has watermark.
- QC score is calculated.
- Rejected mockups do not appear in final offer.

## Sending / message prep

- Unapproved offer cannot be prepared for sending.
- Message prepare creates draft/prepared row.
- Automatic send is disabled without legal basis.
- Audit event is created.

## Deals

- Deal can be created from offer.
- Commission calculates from rule.
- Agent sees own commission.
