# Architecture — {{PROJECT_NAME}}

## Stack
- **Backend**: {{STACK_BACKEND}}.
- **Database**: {{STACK_DB}}.
- **Deploy**: {{STACK_DEPLOY}}.

## Layout

```
<project-root>
├── src/             # application code
├── tests/           # automated tests
├── scripts/         # dev + deploy + migration scripts
└── .claude/         # project docs + hooks + skills
```

## Modules

<!-- Key modules + a sentence on each. Only record non-obvious ones. Examples:
  - `src/routes/` — HTTP entry points; one file per resource.
  - `src/controllers/` — business logic; receive validated input, return domain objects.
  - `src/models/` — ORM models / DB schemas.
  - `src/services/` — cross-cutting business services (email, notifications, billing).
  - `src/middlewares/` — auth, request validation, rate limiting, error handling.
-->

## Request lifecycle

`request → auth middleware → permission check → route handler → controller → service → model → DB → response`.

Side-effects (logs, notifications, queued jobs) fire after DB commit. Failed side-effects do NOT roll back the primary write — they're logged and retried out-of-band.

## Cross-cutting concerns

- **Auth** — <mechanism>. Issued at <endpoint>, validated by <middleware>.
- **Permissions / RBAC** — <model>. Enforced by `requirePermission(entity, action)`.
- **Logging** — <library / format / destination>.
- **Errors** — propagated to an error-handler middleware; never swallow silently.
- **Background jobs** — <queue / runner>.
