# ISSUE-010 Lead scoring v1

## Goal

Implement deterministic lead scoring for campaign candidates.

## Scope

Score factors:

- industry fit;
- has website;
- has logo;
- has contact;
- geo fit;
- portfolio fit;
- not previously contacted;
- penalties.

## Acceptance criteria

- Each campaign_lead has score and breakdown.
- Top 5–10 view exists.
- Score explanation is visible.
- Stop-list or blocked status prevents send eligibility.
