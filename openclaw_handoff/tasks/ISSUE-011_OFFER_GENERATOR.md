# ISSUE-011 Offer generator v1

## Goal

Generate structured offer drafts using DB context and LM Studio.

## Scope

- buildOfferContext function;
- offer.generate job;
- JSON schema for generated offer;
- selected package IDs;
- selected portfolio asset IDs;
- warnings;
- draft offer row.

## Acceptance criteria

- Offer is generated as draft.
- No invented prices/schedules.
- Missing Avito link produces warning.
- Output validates with zod.
