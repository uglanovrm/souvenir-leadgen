---
name: offer-domain
description: Use when implementing souvenir offer generation, product package matching, lead scoring, offer quality checks, and commercial proposal assembly.
---

# Offer Domain Skill

## Business domain

The product helps a local souvenir manufacturer and a lead-generation agent create personalized B2B commercial offers.

## Mandatory offer components

Every final offer must include:

- personalized text;
- selected product packages;
- real portfolio photos;
- Avito/rating link from settings;
- approved prototype mockups;
- CTA;
- disclaimer that prototypes are preliminary visualization.

## Hard rules

Never invent:

- prices;
- deadlines;
- discounts;
- available technologies;
- previous clients/cases;
- legal claims;
- guarantees.

Use only existing database records:

- product_packages;
- product_items;
- portfolio_assets;
- mockup_templates;
- settings.

If data is missing, add warnings instead of hallucinating.

## Approval rules

Offer can move to `approved` only if:

- text is reviewed;
- selected packages are valid;
- at least one portfolio asset is selected;
- Avito link exists or warning is accepted;
- mockups are approved or explicitly skipped with reason.

No sending without approval.
