# {{PROJECT_NAME}} — Project Memory

{{PROJECT_TAGLINE}}.

**Platform**: {{STACK_PLATFORM}}.
**Stack**: {{STACK_SUMMARY}}.

---

## Critical Rules (live — violate these and things break)

1. **No hardcoded API endpoints** — read from env / build config. Hardcoded URLs break switching staging/prod.
2. **No secrets in the bundle** — signing keys, API keys, OAuth secrets belong on the server, not in the mobile binary.
3. **Offline is a state, not an error** — every network call must handle offline gracefully.
4. **Orchestrator/Claude NEVER submits to App Store / Play / TestFlight** and NEVER commits code. SRE / CI owns releases.
5. **Every platform-specific behavior is documented** in `frontend-gotchas.md` — iOS/Android divergence bites otherwise.

---

## Documentation Maintenance (CRITICAL)

| Change | Target |
|---|---|
| New screen / feature / user flow | `.claude/docs/entities.md` (if data-backed) + `.claude/docs/domain/workflows.md` |
| Platform-specific quirk (iOS vs Android, React Native vs native) | `.claude/docs/frontend-gotchas.md` |
| Backend integration change | `.claude/docs/backend.md` |
| UI design token / style | `.claude/docs/ui-design-system.md` |
| Release / CI / distribution | `.claude/docs/release.md` |
| Architectural decision | new `.claude/docs/adr/ADR-NNN-*.md` |
| Domain term | `.claude/docs/domain/glossary.md` |
| Bug fix | `BUGS.md` FIXED + regression TC |
| Removed feature | `.claude/docs/changelog.md` |
| New test case | `TEST_CASES.md` |

Run `/docs-sync` before `/clear` or `/compact`.

---

## Where to look

| Need | File |
|---|---|
| **Process** — DoD, two modes | `@.claude/docs/processes.md` |
| **Architecture** — app structure, state management | `@.claude/docs/architecture.md` |
| **Entities** — data models | `@.claude/docs/entities.md` |
| **Platform gotchas** — iOS/Android/RN/Flutter quirks | `@.claude/docs/frontend-gotchas.md` |
| **Backend integration** — API contracts, auth | `@.claude/docs/backend.md` |
| **UI design system** — tokens, theming, a11y | `@.claude/docs/ui-design-system.md` |
| **Release** — store submission, TestFlight, CodePush | `@.claude/docs/release.md` |
| **Domain** — glossary, workflows | `.claude/docs/domain/` |
| **Decisions** — ADRs | `.claude/docs/adr/` |
| **History** — changelog | `.claude/docs/changelog.md` |
| **Live bugs** | `BUGS.md` |
| **Test cases** | `TEST_CASES.md` |

---

@.claude/docs/processes.md
@.claude/docs/architecture.md
@.claude/docs/entities.md
@.claude/docs/frontend-gotchas.md
@.claude/docs/backend.md
@.claude/docs/ui-design-system.md
@.claude/docs/release.md
