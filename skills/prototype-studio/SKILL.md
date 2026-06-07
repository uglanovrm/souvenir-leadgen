---
name: prototype-studio
description: Use when implementing logo parsing, PSD source handling, runtime mockup packs, template selection, sharp rendering, QC scoring, and commercial prototype approval.
---

# Prototype Studio Skill

## Principle

Do not generate cheap-looking mockups by simply pasting a logo onto an image.

Generate commercial prototypes using:

- certified runtime templates;
- safe area;
- placement rules;
- masks;
- shadow/highlight layers;
- logo variants;
- QC scoring;
- human approval.

## PSD policy

PSD files are allowed as design source assets only.

Do not use PSD as runtime renderer in MVP.

Runtime mockup pack:

- source.psd, optional archival;
- preview.jpg;
- base.png;
- mask.png;
- shadow.png;
- highlight.png;
- displacement.png, optional;
- template.json.

## Logo quality checks

Score logo by:

- file type;
- resolution;
- aspect ratio;
- alpha/transparency;
- contrast;
- background cleanliness;
- source reliability.

Score thresholds:

- 85–100: auto-render allowed;
- 70–84: render with warning;
- 50–69: human review required;
- below 50: request better logo.

## Prototype QC

Check:

- logo too small;
- logo too large;
- safe area overflow;
- low contrast;
- missing watermark;
- wrong technology;
- poor template match;
- duplicate visuals.

Only approved prototype_renders can appear in final offer.
