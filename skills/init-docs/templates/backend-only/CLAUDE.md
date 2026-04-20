# {{PROJECT_NAME}} — Project Memory

{{PROJECT_TAGLINE}}.

**Stack**: {{STACK_SUMMARY}}. Run `<dev command>` to start locally.

---

## Critical Rules (live — violate these and things break)

<!--
  Critical Rules are the <=10 things that, if violated, break production or cause silent data loss.
  Typical examples for a backend service:
-->

1. **RBAC / auth is fail-closed** — new entity/endpoint MUST be added to the permissions allowlist.
2. **Migrations are additive only** — never drop/rename fields; breaks rollback. Must be idempotent.
3. **Tests updated with every code change** — CI enforces.
4. **Orchestrator/Claude NEVER runs deploy commands** and NEVER commits code. SRE / CI owns deploy + commit.
5. **<Project-specific rule>** — <one-sentence why>.

---

## Documentation Maintenance (CRITICAL)

Every decision that changes the project MUST land in the right document in the same session.

| Change | Target |
|---|---|
| New entity / endpoint / field | `.claude/docs/entities.md` |
| New backend service / permission / middleware rule | `.claude/docs/backend.md` |
| CI / deploy / migration change | `.claude/docs/deploy.md` |
| Architectural decision | new `.claude/docs/adr/ADR-NNN-*.md` |
| Domain term | `.claude/docs/domain/glossary.md` |
| Bug fix | `BUGS.md` FIXED + regression TC in `TEST_CASES.md` |
| Removed feature / completed migration | `.claude/docs/changelog.md` |
| New test case | `TEST_CASES.md` |

Run `/docs-sync` before `/clear` or `/compact`.

---

## Where to look

| Need | File |
|---|---|
| **Process** — Definition of Done, test rules | `@.claude/docs/processes.md` |
| **Architecture** — layout, modules | `@.claude/docs/architecture.md` |
| **Entities** — models + fields + endpoints | `@.claude/docs/entities.md` |
| **Backend** — auth, permissions, testing | `@.claude/docs/backend.md` |
| **Deploy** — CI, migrations | `@.claude/docs/deploy.md` |
| **Domain** — glossary | `.claude/docs/domain/` |
| **Decisions** — ADRs | `.claude/docs/adr/` |
| **History** — changelog | `.claude/docs/changelog.md` |
| **Live bugs** | `BUGS.md` |
| **Test cases** | `TEST_CASES.md` |

---

@.claude/docs/processes.md
@.claude/docs/architecture.md
@.claude/docs/entities.md
@.claude/docs/backend.md
@.claude/docs/deploy.md
