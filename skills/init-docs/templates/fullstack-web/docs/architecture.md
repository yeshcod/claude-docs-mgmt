# Architecture — {{PROJECT_NAME}}

## Stack
- **Frontend**: {{STACK_FRONTEND}}.
- **Backend**: {{STACK_BACKEND}}.
- **Database**: {{STACK_DB}}.
- **Deploy**: {{STACK_DEPLOY}}.

## Layout

<!-- Fill in as the project grows. Typical sections:
  - Directory structure (top-level only; deeper is code-derivable)
  - Module boundaries (what talks to what)
  - Shared utilities / components
  - Dependency graph notes (where cycles are tempting — avoid)
-->

```
<project-root>
├── frontend/        # <framework> app
├── backend/         # API server
├── scripts/         # dev + deploy scripts
└── .claude/         # project docs + hooks + skills
```

## Modules

### Frontend
<!-- Key modules + a sentence on each. Only record non-obvious ones. -->

### Backend
<!-- Key modules + a sentence on each. -->

## Data flow

<!-- Sketch the request lifecycle: request → auth → permissions → controller → model → DB → response. Include the places hooks or side-effects fire. -->

## Cross-cutting concerns

- **Auth** — <session / JWT / OAuth>. Where it plugs in.
- **Permissions / RBAC** — <model>. Where enforced.
- **Logging** — <library / format / destinations>.
- **Errors** — <how they propagate, where they're caught>.
- **Background jobs** — <if any>.
