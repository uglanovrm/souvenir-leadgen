# ISSUE-015 Logo upload and quality scoring

## Goal

Allow manual company logo upload and deterministic quality scoring.

## Scope

- upload PNG/JPG/SVG to company-logos bucket;
- create brand_assets row;
- calculate width/height/aspect ratio;
- detect alpha where possible;
- approximate contrast/background quality;
- set quality_score and warnings;
- approve/reject logo.

## Acceptance criteria

- Organization can have multiple logo candidates.
- One logo can be approved.
- Low quality score shows warnings.
- Score below threshold blocks automatic render.
