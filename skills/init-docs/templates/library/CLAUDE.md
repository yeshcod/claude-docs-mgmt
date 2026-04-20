# {{PROJECT_NAME}} — Project Memory

{{PROJECT_TAGLINE}}.

**Language / runtime**: {{STACK_LANGUAGE}}.
**Package manager / distribution**: {{STACK_PACKAGE_MANAGER}}.

---

## Critical Rules (live — violate these and things break)

1. **Public API is semver-governed** — any breaking change requires a major version bump. See `.claude/docs/api-surface.md` for what counts as public.
2. **No side-effects on import** — libraries must not read env vars, open sockets, or mutate globals at module-load time.
3. **Every exported symbol has a test** — CI enforces via coverage threshold or explicit map.
4. **Orchestrator/Claude NEVER publishes** to npm/PyPI/crates.io and NEVER commits code. SRE / CI owns releases.
5. **Changelog is mandatory** — every PR must append to `CHANGELOG.md` (or Keep-a-Changelog equivalent).

---

## Documentation Maintenance (CRITICAL)

Every decision that changes the library MUST land in the right document in the same session.

| Change | Target |
|---|---|
| New exported function / class / type | `.claude/docs/api-surface.md` |
| Breaking change | `.claude/docs/api-surface.md` + new ADR explaining why |
| Internal architecture | `.claude/docs/architecture.md` |
| Release process / CI change | `.claude/docs/release.md` |
| Architectural decision | new `.claude/docs/adr/ADR-NNN-*.md` |
| Bug fix | `BUGS.md` FIXED + regression TC |
| Removed / renamed export | `.claude/docs/changelog.md` (user-facing changelog too) |
| New test case | `TEST_CASES.md` |

Run `/docs-sync` before `/clear` or `/compact`.

---

## Where to look

| Need | File |
|---|---|
| **Process** — DoD, test rules | `@.claude/docs/processes.md` |
| **Architecture** — internal layout | `@.claude/docs/architecture.md` |
| **API surface** — public exports | `@.claude/docs/api-surface.md` |
| **Release** — versioning, publish, CI | `@.claude/docs/release.md` |
| **Decisions** — ADRs | `.claude/docs/adr/` |
| **History** — internal changelog | `.claude/docs/changelog.md` |
| **Live bugs** | `BUGS.md` |
| **Test cases** | `TEST_CASES.md` |

---

@.claude/docs/processes.md
@.claude/docs/architecture.md
@.claude/docs/api-surface.md
@.claude/docs/release.md
