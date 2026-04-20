---
name: init-docs
description: Bootstrap documentation framework for a new project. Asks for a profile (fullstack-web, backend-only, library, mobile), project name, and stack details. Copies matching templates into the project root and .claude/docs/, renders placeholders, registers hooks. Creates CLAUDE.md, BUGS.md, TEST_CASES.md, ROADMAP.md + .claude/docs/* scaffolded for the chosen profile. Use in a fresh repo or an existing repo without docs framework.
user-invocable: true
---

# /init-docs — Bootstrap documentation framework

Scaffold `.claude/docs/` + root-level docs for a new project, choosing one of four profiles. Renders templates with the project's stack info so you have stack-aware skeletons from day one.

## Usage

```
/init-docs                    — interactive (asks profile + stack)
/init-docs fullstack-web      — profile preselected, asks stack
/init-docs backend-only
/init-docs library
/init-docs mobile
/init-docs --dry-run          — prints what would be created, writes nothing
```

## Profiles

| Profile | Description | Root docs | `.claude/docs/` adds |
|---|---|---|---|
| `fullstack-web` | Client + server app with UI. Like a SaaS product. | `CLAUDE.md`, `BUGS.md`, `TEST_CASES.md`, `ROADMAP.md` | `architecture`, `entities`, `frontend-gotchas`, `backend`, `ui-design-system`, `deploy`, `domain/glossary`, `domain/workflows`, `changelog`, `processes`, ADR + PRD templates |
| `backend-only` | API / service / worker. No UI. | same | `architecture`, `entities`, `backend`, `deploy`, `domain/glossary`, `changelog`, `processes` |
| `library` | Reusable package (npm, pip, cargo, etc.). | same | `architecture`, `api-surface`, `release`, `changelog`, `processes` |
| `mobile` | iOS / Android / React Native / Flutter app. | same | `architecture`, `entities`, `frontend-gotchas` (platform quirks), `backend`, `ui-design-system`, `release`, `domain/glossary`, `changelog`, `processes` |

## Workflow

### Phase 1 — Preflight

1. **Refuse if already bootstrapped**: if `.claude/docs/processes.md` OR `CLAUDE.md` already exists at the project root, stop and ask the user to confirm overwrite. Default: abort. The user likely doesn't want to clobber real docs.
2. **Detect git root**: `git rev-parse --show-toplevel`. If outside a git repo, warn + ask whether to proceed anyway (project root = current dir).

### Phase 2 — Gather inputs

Ask the user (in one block, not one-by-one) for:

- **Profile** — fullstack-web / backend-only / library / mobile (or use the arg if passed).
- **Project name** — human-readable, e.g. `Acme ERP`, `Foo API`, `bar-utils`.
- **Short tagline** — one sentence, e.g. "Influencer marketing ERP" or "HTTP utilities for Node".
- **Stack details** — profile-specific:
  - `fullstack-web`: frontend framework + lang, backend framework + lang, DB, deploy target. Example: `React 18 + TypeScript + Vite / Node.js 20 + Express + Mongoose / MongoDB 7 / Docker + Fly.io`.
  - `backend-only`: backend framework + lang, DB, deploy target.
  - `library`: language, package manager, distribution (npm / PyPI / crates.io), runtime version baseline.
  - `mobile`: platform (iOS / Android / RN / Flutter), lang, backend (if any), deploy (App Store / Play / TestFlight).

All fields feed placeholders in the templates.

### Phase 3 — Render + copy

Source: `${CLAUDE_PLUGIN_ROOT}/skills/init-docs/templates/<profile>/`.

For each template file:
1. Read the template.
2. Substitute placeholders:
   - `{{PROJECT_NAME}}` → project name
   - `{{PROJECT_TAGLINE}}` → tagline
   - `{{STACK_SUMMARY}}` → one-liner (e.g. `React + Vite + Ant Design / Node.js + Express + MongoDB`)
   - `{{STACK_FRONTEND}}` / `{{STACK_BACKEND}}` / `{{STACK_DB}}` / `{{STACK_DEPLOY}}` / `{{STACK_LANGUAGE}}` / `{{STACK_PLATFORM}}` / `{{STACK_PACKAGE_MANAGER}}` — whichever apply to the profile
   - `{{CURRENT_DATE}}` → YYYY-MM-DD
   - `{{YEAR}}` → YYYY
3. Write to the corresponding path under the project root (strip the `templates/<profile>/` prefix).

Also copy files from `templates/_common/` (shared ADR + PRD templates). These go into `.claude/docs/adr/` and `.claude/docs/prd/` regardless of profile.

### Phase 4 — Hooks + gitignore

1. Merge `.claude/settings.json` — add profile-appropriate hooks:
   - All profiles: deny-`.env` edit hook, deny git-commit/push hook (SRE owns commits — optional, remove if user disagrees).
   - `fullstack-web` + `mobile`: UI edit → QA reminder hook, design-system check hook.
   - `backend-only` + `fullstack-web`: backend-edit → test-exists-reminder hook.
   - `library`: no extra hooks.
   If `.claude/settings.json` already exists, merge non-destructively — preserve user additions.
2. Append to `.gitignore` (create if missing):
   ```
   # claude-docs-mgmt
   .claude/.docs-sync-skip
   .claude/reports/
   .claude/prototypes/
   .claude/plans/
   .claude/worktrees/
   ```

### Phase 5 — Report

Print a summary:

```
init-docs — bootstrapped <profile> framework for <project name>

Created:
  CLAUDE.md
  BUGS.md
  TEST_CASES.md
  ROADMAP.md
  .claude/docs/processes.md
  .claude/docs/architecture.md
  <... full list ...>
  .claude/docs/adr/ADR-000-template.md
  .claude/docs/prd/_template.md
  .claude/settings.json (merged)
  .gitignore (appended)

Next steps:
  1. Fill in CLAUDE.md Critical Rules (the template has placeholders).
  2. Customize .claude/docs/processes.md Documentation Maintenance Rule table — /docs-sync reads it.
  3. First ADR: decide what architectural choices are worth recording.
  4. Wire CI if you want — examples in .claude/docs/deploy.md (if profile included it).
  5. Commit the scaffold: git add . && git commit -m "docs: bootstrap claude-docs-mgmt framework (<profile>)"
```

## Rules & guardrails

- **Never overwrite silently.** Phase 1 refuses if docs exist.
- **Merge settings.json non-destructively.** Use `jq`-style merge; never clobber the user's existing hooks.
- **No binary templates.** All templates are markdown or JSON. Keep them readable.
- **Placeholder discipline.** Every `{{PLACEHOLDER}}` must be substituted. After rendering, grep the output for `{{` and fail loudly if any remain.
- **Idempotent-ish.** Running `/init-docs` twice in the same profile should be a no-op (with a warning from Phase 1). Switching profiles mid-project is explicitly not supported — the user must manually migrate.
