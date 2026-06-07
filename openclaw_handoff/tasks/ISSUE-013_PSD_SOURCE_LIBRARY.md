# ISSUE-013 PSD source library

## Goal

Store PSD mockup sources as design/master assets.

## Scope

- mockup_template_sources table integration;
- upload PSD to mockup-sources bucket;
- source metadata: author, license, notes, status;
- link source to runtime template.

## Out of scope

- Do not render PSD.
- Do not replace Smart Objects.
- Do not require Photoshop.

## Acceptance criteria

- User can upload source.psd.
- PSD has status draft/normalized/certified/rejected.
- Runtime template can reference PSD source.
