# Production Plan v0.1

## Target MVP outcome

A user can:

1. log in;
2. create product packages;
3. upload portfolio photos;
4. create mockup templates from runtime packs;
5. import leads from CSV;
6. create a campaign;
7. score leads and select top 5–10;
8. generate an offer draft;
9. upload/select company logo;
10. render 3–5 commercial prototype mockups;
11. approve prototypes and offer;
12. prepare a message/PDF/HTML offer;
13. track deal stage and commission.

## Release phases

### Phase 0 — Foundation

- Monorepo.
- Supabase connection.
- Environment validation.
- Basic UI shell.
- Local worker stub.

### Phase 1 — Domain database

- Organizations.
- Contacts.
- Campaigns.
- Product packages.
- Portfolio assets.
- Mockup templates.
- Offers.
- Jobs.
- Deals.
- Commissions.
- Audit events.

### Phase 2 — Catalog and assets

- Product package CRUD.
- Portfolio photo upload and tagging.
- Avito link setting.

### Phase 3 — Leads and campaigns

- CSV import.
- Deduplication.
- Campaign builder.
- Rule-based scoring.
- Top candidates view.

### Phase 4 — AI offer generation

- LM Studio client.
- Structured JSON output.
- Offer context assembler.
- Offer draft generator.
- Offer Studio UI.

### Phase 5 — Prototype Studio

- Manual logo upload.
- Logo quality scoring.
- PSD source library.
- Runtime mockup pack manager.
- Template selector.
- sharp renderer.
- Rule-based QC.
- Approval UI.

### Phase 6 — Offer assembly and sending prep

- HTML offer preview.
- PDF export.
- Message prepare.
- Manual send/legal gate.

### Phase 7 — Deals and commissions

- Deal pipeline.
- Commission rules.
- Agent report.
- Producer report.

## Production definition

MVP can be considered production-ready when:

- RLS is active for all core tables;
- Storage bucket access is controlled;
- service role key is worker-only;
- jobs are idempotent or safely retryable;
- generated offers require approval;
- mockups require approval;
- all sends/messages are audited;
- seed data can bootstrap a demo;
- setup docs are reproducible;
- app runs on current hardware without heavy background load.
