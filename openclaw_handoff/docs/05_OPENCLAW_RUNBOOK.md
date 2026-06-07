# OpenClaw Runbook

## Recommended session flow

1. Start with repository root as working directory.
2. Paste `docs/00_MASTER_PROMPT_OPENCLAW.md`.
3. Tell OpenClaw to read `openclaw/PROJECT_CONTEXT.md` and `openclaw/CODING_RULES.md`.
4. Give exactly one issue from `tasks/`.
5. Ask for a plan before edits.
6. Approve the plan.
7. Let Codex implement.
8. Review diff.
9. Run tests.
10. Commit.

## Command template

```text
Use the project context and coding rules.
Implement tasks/ISSUE-XXX_NAME.md.
Do not work on any other issue.
Before editing, summarize plan and files likely to change.
After editing, run the listed checks and produce a concise handoff.
```

## Review checklist

- Did it edit unrelated files?
- Did it add secrets?
- Did it add migrations for schema changes?
- Did it bypass RLS?
- Did it create unstable AI assumptions?
- Did it respect human approval?
- Does it run on M1 without heavy services?

## Parallelism rule

On MacBook Air M1:

- one active coding task;
- optionally one read-only review;
- LM Studio only when needed;
- no multiple heavy agents.
