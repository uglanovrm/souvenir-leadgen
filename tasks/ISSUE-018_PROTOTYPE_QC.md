# ISSUE-018 Rule-based Prototype QC

## Goal

Score generated prototype renders before human approval.

## Scope

Checks:

- logo too small;
- logo too large;
- safe area overflow;
- missing watermark;
- low contrast approximation;
- template mismatch;
- duplicate product type.

## Acceptance criteria

- QC score is stored.
- QC issues are stored as JSON.
- Score below 55 sets status needs_review/rejected.
- Only approved renders can enter final offer.
