# OpenClaw 6-hour execution pack

This pack is designed to be dropped into the `souvenir-leadgen` repository alongside the previously generated handoff package.

Use `START_HERE_6H.md` first.

The main file to paste into OpenClaw is:

- `OPENCLAW_6H_AUTONOMOUS_PROMPT.md`

The pack tells OpenClaw to:

- work unattended;
- follow the existing project docs and tasks;
- avoid dangerous architecture drift;
- commit after each safe increment;
- write `PROGRESS_LOG.md` and `OPENCLAW_6H_REPORT.md`;
- stop before secrets, paid APIs, real outreach, or unsafe production actions.
