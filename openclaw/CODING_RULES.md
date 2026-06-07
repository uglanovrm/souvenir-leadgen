# Coding Rules

1. Use TypeScript.
2. Validate environment variables.
3. Validate LLM outputs with zod.
4. Put shared schemas in packages/shared.
5. No secrets in repo.
6. Every Supabase schema change gets a migration.
7. Every important state transition gets audit_events.
8. Worker jobs must be retry-safe.
9. UI must show warnings, not hide them.
10. Do not implement auto-send until message prepare and approval are stable.
11. Keep code simple enough for MacBook Air M1.
12. Prefer deterministic rules over model guesses.
