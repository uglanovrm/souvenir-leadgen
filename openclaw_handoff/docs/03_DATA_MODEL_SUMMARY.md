# Data Model Summary

## Core tables

- profiles
- organizations
- contacts
- campaigns
- campaign_leads
- product_packages
- product_items
- portfolio_assets
- mockup_template_sources
- mockup_templates
- brand_assets
- brand_asset_variants
- offers
- offer_assets
- prototype_briefs
- prototype_renders
- jobs
- messages
- deals
- commissions
- audit_events
- settings

## Storage buckets

- portfolio-assets
- company-logos
- mockup-sources
- mockup-templates
- generated-mockups
- offer-exports
- imports

## Important status fields

### offers.status

- draft
- generated
- review
- approved
- prepared
- sent
- replied
- won
- lost

### prototype_renders.status

- generated
- approved
- rejected
- needs_review

### brand_assets.status

- candidate
- approved
- rejected
- needs_review

### jobs.status

- queued
- running
- succeeded
- failed
- cancelled
