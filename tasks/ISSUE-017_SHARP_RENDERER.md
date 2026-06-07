# ISSUE-017 sharp renderer

## Goal

Render approved logo onto selected runtime mockup templates.

## Scope

- download base/template/logo from Supabase Storage;
- resize logo into safe area;
- apply placement/rotation;
- apply mask if present;
- apply shadow/highlight if present;
- add watermark;
- upload generated output;
- create prototype_renders row.

## Acceptance criteria

- 3–5 mockups can be generated for offer.
- Rendered images include watermark.
- Outputs are stored in generated-mockups bucket.
- Errors are captured in job error.
