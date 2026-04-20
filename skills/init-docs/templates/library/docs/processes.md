# Processes — {{PROJECT_NAME}}

Single source of truth for how we develop this library.

## Documentation Maintenance Rule (CRITICAL)

Every decision that changes the library MUST land in the right document in the same session.

| Decision / change | Target doc |
|---|---|
| New exported symbol (function, class, type, constant) | `.claude/docs/api-surface.md` |
| Internal module change (not user-visible) | `.claude/docs/architecture.md` |
| Breaking change | `.claude/docs/api-surface.md` + NEW `.claude/docs/adr/ADR-NNN-*.md` |
| Release / publish / CI change | `.claude/docs/release.md` |
| Architectural decision | `.claude/docs/adr/ADR-NNN-*.md` (new file) |
| Bug fix | `BUGS.md` FIXED + regression TC |
| User-facing CHANGELOG entry | user-facing `CHANGELOG.md` (root) |
| Internal-only changelog | `.claude/docs/changelog.md` |
| New test case | `TEST_CASES.md` |
| PRD finalized | `.claude/docs/prd/YYYY-MM-DD-*.md` (new file) |

## Definition of Done

### Code
- [ ] Matches the spec / ADR.
- [ ] No public API added without a doc entry in `api-surface.md`.
- [ ] No side-effects on import.

### Tests
- [ ] Unit tests for every exported symbol.
- [ ] Edge cases: null / undefined / empty / overflow / concurrent.
- [ ] Coverage threshold held (if configured).

### Docs
- [ ] `api-surface.md` updated if public exports changed.
- [ ] User-facing `CHANGELOG.md` entry.
- [ ] ADR added for any architectural / breaking decision.

### Release
- [ ] Semver bump matches change type (major/minor/patch).
- [ ] Release-notes entry written.
- [ ] Tag created (SRE / CI — not Claude).

## Test Case Registry Rule

Same as other profiles:
- New public API → TC (happy + ≥1 negative + ≥1 edge).
- Bug fix → regression TC.
- Never delete TCs — `[OBSOLETE]` with replacement.

## Development Process

For a library, two modes usually collapse into one:
- **Small**: bug fix or small addition → edit + test + update `api-surface.md` + update `CHANGELOG.md` + ask before release.
- **Large** (breaking change, major refactor, new public subsystem): BA/spec → tech-lead ADR → implementation → QA → security (if relevant) → release.

### Always-on rules
- No publishing from local machines. CI releases.
- No edits to `CHANGELOG.md` in release commits — `CHANGELOG.md` is the source of truth for the release.
- Every breaking change requires an ADR explaining WHY, not just WHAT.
