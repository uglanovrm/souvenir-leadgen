# ISSUE-009 LM Studio client and zod validation

## Goal

Create local LLM client for structured JSON generation.

## Scope

- LM Studio OpenAI-compatible client;
- env validation;
- generateJson helper;
- zod schema validation;
- one repair retry;
- fixtures for dev/test.

## Acceptance criteria

- Client calls local LM Studio URL.
- Invalid JSON is rejected.
- Repair retry runs once.
- Caller receives typed result or clear error.
- App can run without LM Studio by failing AI jobs gracefully.
