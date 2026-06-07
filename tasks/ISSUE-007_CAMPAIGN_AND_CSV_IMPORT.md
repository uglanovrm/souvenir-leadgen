# ISSUE-007 Campaign builder and CSV import

## Goal

Allow user to create campaigns and import leads.

## Scope

- campaign create/edit;
- CSV upload to imports bucket;
- preview rows;
- column mapping;
- create organizations;
- create campaign_leads;
- deduplicate by inn, name, website.

## Acceptance criteria

- CSV import creates organizations and campaign leads.
- Duplicates are not duplicated.
- Import errors are visible.
- Campaign page lists imported leads.
