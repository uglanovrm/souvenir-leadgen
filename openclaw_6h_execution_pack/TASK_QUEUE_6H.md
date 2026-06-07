# 6-hour task queue

## Goal

Deliver the most valuable working foundation possible in 6 hours without breaking safety constraints.

## Timebox plan

### Hour 0-1: Foundation
- Bootstrap monorepo.
- Add scripts.
- Add README and env example.
- Confirm dev app starts.

### Hour 1-2: Supabase base
- Add schema migration.
- Add RLS baseline.
- Add storage bucket migration/notes.
- Add seed data if practical.

### Hour 2-3: UI base + catalog
- Add auth-aware layout.
- Add product catalog CRUD.
- Add portfolio asset library skeleton.

### Hour 3-4: Leads + jobs
- Add campaigns.
- Add CSV import skeleton.
- Add jobs table integration.
- Add local worker polling loop.

### Hour 4-5: AI + scoring
- Add LM Studio provider interface.
- Add mock provider fallback.
- Add scoring v1.
- Add offer generator v1 using catalog constraints.

### Hour 5-6: Prototype Studio foundation + hardening
- Add PSD source library metadata.
- Add runtime mockup pack model/UI skeleton.
- Add logo upload/scoring foundation if possible.
- Run checks.
- Write report.

## Priority decision rule

A working vertical slice beats many half-finished modules.

If behind schedule, skip visual polish and finish:

1. schema;
2. catalog;
3. leads;
4. scoring;
5. offer draft;
6. worker;
7. report.
