---
name: lmstudio-json
description: Use when implementing local LM Studio calls, structured JSON output, retries, prompt files, schema validation, and local LLM job processing.
---

# LM Studio JSON Skill

## Runtime

Use local LM Studio OpenAI-compatible API.

Environment variables:

- LMSTUDIO_BASE_URL, default http://localhost:1234/v1
- LMSTUDIO_MODEL

## Rules

- Validate all model responses with zod.
- Use strict JSON schemas.
- Retry once with a repair prompt if JSON is invalid.
- Persist raw model response only in debug/dev mode, never as final user-facing offer.
- Do not let model invent facts.
- Feed model structured context from DB.
- Keep prompts short enough for local Gemma 12B.

## Required outputs

Every AI job should return:

- structured result;
- warnings;
- confidence;
- explanation;
- source IDs used.

## Failure behavior

If LM Studio is unavailable:

- mark job failed;
- show actionable error;
- do not block the whole app;
- allow manual offer drafting.
