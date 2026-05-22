# Deploy & Infrastructure — {{PROJECT_NAME}}

## Git
- Remote: `origin` → <URL>.
- Branch: `<default-branch>`.
- CI runs tests → deploys if green on every push.

## CI workflow

<!-- Describe the pipeline. Example:
  - `backend-test` — unit + integration
  - `frontend-test` — unit + build
  - `deploy` — needs both green, SSHes to prod, runs deploy.sh
-->

## Deploy pipeline

<!-- The steps, in order. Example:
  1. flock lock to prevent concurrent deploys
  2. git stash local changes
  3. git fetch && git checkout origin/<branch>
  4. install dependencies
  5. run migrations
  6. build
  7. reload (zero-downtime if possible)
  8. run smoke tests
  9. rollback on failure
-->

## Smoke tests

<!-- What a healthy deploy looks like. Example:
  - curl /api/health → expect 2xx
  - process manager reports 'online'
  - 3 retries with 2s delay
-->

## Rollback

<!-- Two flavors:
  - Code rollback: revert to LAST_GOOD SHA + re-deploy.
  - Data rollback: NOT AUTOMATIC because migrations are additive. Requires manual fix-forward.
-->

## Migrations

Rules:
- MUST be **idempotent** (safe to re-run).
- MUST be **additive** — never drop/rename fields. Breaks rollback.
- Naming: `migrate-YYYY-MM-DD-description.js` (or project convention).

### Local dev after `git pull`

Migrations typically run automatically in prod but NOT locally. After pulling new code, run the migration runner manually.

## Hooks (`.claude/settings.json`)

<!-- What each project-level hook does. Examples:
  - PostToolUse on Edit: prettier auto-format.
  - PostToolUse on frontend: QA reminder.
  - PostToolUse on backend: test-exists reminder.
  - PreToolUse on .env files: block (secrets).
  - PreToolUse on deploy commands: block (SRE owns deploy).
-->

## MCP servers

<!-- If `.mcp.json` is checked in, document what each server does and how to bootstrap.
  Example servers commonly used:
    - context7 — live library docs
    - mongodb — direct DB access for debugging
    - playwright — real-browser UI testing
-->
