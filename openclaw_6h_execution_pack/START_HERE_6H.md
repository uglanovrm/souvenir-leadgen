# OpenClaw 6-hour unattended execution pack

Use this when you want to leave OpenClaw/Codex working on the souvenir lead-gen project for a bounded 6-hour sprint.

## Before you leave

1. Plug in the MacBook charger.
2. Close heavy apps except OpenClaw/Codex, terminal, editor, Supabase, and LM Studio if needed.
3. Make sure the project directory contains the previous `openclaw_handoff` files:
   - `docs/00_MASTER_PROMPT_OPENCLAW.md`
   - `openclaw/PROJECT_CONTEXT.md`
   - `openclaw/CODING_RULES.md`
   - `tasks/ISSUE-001...ISSUE-020`
   - `skills/*/SKILL.md`
4. Start a clean git branch:

```bash
git status
git checkout -b feature/6h-openclaw-mvp || git checkout feature/6h-openclaw-mvp
```

5. Keep macOS awake:

```bash
caffeinate -dimsu & echo $! > .caffeinate.pid
```

6. Paste the full content of `OPENCLAW_6H_AUTONOMOUS_PROMPT.md` into OpenClaw.

## When you come back

```bash
git status
git log --oneline --decorate -20
cat OPENCLAW_6H_REPORT.md 2>/dev/null || true
cat PROGRESS_LOG.md 2>/dev/null || true
```

Stop caffeinate:

```bash
kill $(cat .caffeinate.pid) 2>/dev/null || true
rm -f .caffeinate.pid
```

Then run:

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
```

If Supabase local is configured:

```bash
supabase db reset
```

