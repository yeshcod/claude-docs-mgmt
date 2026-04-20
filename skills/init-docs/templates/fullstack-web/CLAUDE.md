# {{PROJECT_NAME}} — Project Memory

{{PROJECT_TAGLINE}}.

**Stack**: {{STACK_SUMMARY}}. Run `npm run dev` (or equivalent) in both `/frontend` and `/backend` (adjust per your layout).

---

## Critical Rules (live — violate these and things break)

<!--
  Critical Rules are the <=10 things that, if violated, break production or create silent data loss. Keep this list SHORT.
  Examples to include or replace:
    1. RBAC is fail-closed — new entity/model MUST be added to the permissions allowlist.
    2. Migrations are additive only — never drop/rename fields; breaks rollback. Must be idempotent.
    3. Tests updated with every backend code change.
    4. Orchestrator/Claude NEVER runs deploy commands (ssh, pm2, scp, rsync) and NEVER commits code. SRE (or CI) owns all deploy + commit.
    5. No new `X` without matching `Y` (framework-specific gotcha — fill in).
-->

1. **<Rule 1>** — <one-sentence why>. See `.claude/docs/<doc>.md`.
2. **<Rule 2>** — ...
3. **Migrations are additive only** — never drop/rename fields; breaks rollback. Must be idempotent.
4. **Tests updated with every backend code change** — CI enforces.
5. **Orchestrator/Claude NEVER runs deploy commands** (ssh, pm2, scp, rsync) and **NEVER commits code**. SRE / CI owns deploy + commit.

---

## Documentation Maintenance (CRITICAL)

Every decision that changes the project MUST land in the right document in the same session. See `.claude/docs/processes.md` → Documentation Maintenance Rule for the full mapping. Short version:

| Change | Target |
|---|---|
| New entity / field | `.claude/docs/entities.md` |
| New frontend gotcha / rule | `.claude/docs/frontend-gotchas.md` |
| New backend service / permission rule | `.claude/docs/backend.md` |
| New UI/design token | `.claude/docs/ui-design-system.md` |
| CI / deploy / migration-runner | `.claude/docs/deploy.md` |
| Architectural decision | new `.claude/docs/adr/ADR-NNN-*.md` |
| Domain term / concept | `.claude/docs/domain/glossary.md` |
| Business workflow / lifecycle | `.claude/docs/domain/workflows.md` |
| Finalized PRD | new `.claude/docs/prd/YYYY-MM-DD-*.md` |
| Bug fix | `BUGS.md` FIXED + regression TC in `TEST_CASES.md` |
| Removed feature / completed migration | `.claude/docs/changelog.md` |
| New test case | `TEST_CASES.md` |

Run `/docs-sync` before `/clear` or `/compact` to capture session learnings and audit docs.

---

## Where to look

| Need | File |
|---|---|
| **Process** — Definition of Done, two modes, TC registry | `@.claude/docs/processes.md` |
| **Architecture** — layout, modules, patterns | `@.claude/docs/architecture.md` |
| **Entities** — models + fields + endpoints + workflows | `@.claude/docs/entities.md` |
| **Frontend gotchas** — framework quirks, request helpers | `@.claude/docs/frontend-gotchas.md` |
| **Backend** — services, permissions, testing | `@.claude/docs/backend.md` |
| **UI design system** — tokens, rules | `@.claude/docs/ui-design-system.md` |
| **Deploy** — CI, migrations, hooks | `@.claude/docs/deploy.md` |
| **Domain** — glossary, workflows | `.claude/docs/domain/` |
| **Decisions** — ADRs | `.claude/docs/adr/` |
| **PRDs** — archived requirements | `.claude/docs/prd/` |
| **History** — removed features, migrations | `.claude/docs/changelog.md` |
| **Live bugs** | `BUGS.md` |
| **Test cases** | `TEST_CASES.md` |

The `@` prefix marks files eagerly loaded into context. Non-prefixed paths are references read on-demand.

---

## How we work (short version)

**Small task** (bug, 1–3 files, tweak) → Claude edits directly. Frontend change → manual QA. Backend change → run tests. Update docs. Ask user before deploy.

**Large task** (new feature, 4+ files) → agent pipeline: BA → UX + tech-lead → DB + backend + frontend → QA → security + tech-lead → acceptance → SRE.

---

@.claude/docs/processes.md
@.claude/docs/architecture.md
@.claude/docs/entities.md
@.claude/docs/frontend-gotchas.md
@.claude/docs/backend.md
@.claude/docs/ui-design-system.md
@.claude/docs/deploy.md
