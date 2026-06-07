# Review prompt after the 6-hour run

Paste this into OpenClaw/Codex when you return:

```text
Review the last 6-hour implementation against:

- docs/04_QA_ACCEPTANCE.md
- openclaw/CODING_RULES.md
- OPENCLAW_6H_REPORT.md
- PROGRESS_LOG.md

Do not edit files yet.

Return:
1. what works;
2. what is broken;
3. security/RLS risks;
4. overengineering;
5. missing tests;
6. whether any service role key or secret leaked;
7. whether any auto-outreach path exists;
8. exact next 5 fixes in priority order.
```
