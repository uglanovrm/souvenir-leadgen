# ISSUE-004 Auth and roles

## Goal

Implement user profiles and role-aware UI access.

## Scope

Roles:

- admin;
- producer;
- agent;
- manager.

Implement:

- profile creation hook or setup flow;
- auth guard;
- role-aware sidebar;
- helper functions for permissions.

## Acceptance criteria

- Unauthenticated users cannot access app pages.
- Role is loaded from profile.
- Sidebar reflects role.
- RLS policies align with role model.
