# ISSUE-008 Jobs table and local worker

## Goal

Implement the local worker job processing loop.

## Scope

- jobs table access helpers;
- worker polling loop;
- lock/lease mechanism;
- retry handling;
- status transitions;
- structured logging.

## Acceptance criteria

- Worker picks queued job.
- Worker sets running/succeeded/failed.
- Failed job stores error.
- Expired lock can be retried.
- Worker ID is visible in job row.

## Test commands

```bash
pnpm worker
```
