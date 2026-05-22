# Processes — {{PROJECT_NAME}}

Single source of truth for HOW we work. If anything about process or doc-maintenance is unclear, this file wins over agent prompts and skill docs.

> **Code style, modularity, TDD discipline, and project cleanliness** live in [code-standards.md](code-standards.md). This file is about *process* — how we work. That one is about *code* — what we write.

## Context Maintenance Rule (CRITICAL)

**Every 3–5 user requests/responses**, check whether context (`CLAUDE.md`, `BUGS.md`, `TEST_CASES.md`, `.claude/docs/*`) still matches what was just done. If anything changed, proactively offer to update — show a diff/summary of what would change before applying.

Triggers that force a context check:
- New endpoint/route added → update `entities.md` + add test cases
- Model field added/removed → update entity fields list + affected test cases
- Deploy/CI step changed → update `deploy.md`
- New convention or rule established → add to relevant doc (frontend-gotchas / backend / ui-design-system)
- Bug fix that reveals non-obvious behavior → document it + add negative/edge TC
- User reports a bug → add to BUGS.md Open + repro TC BEFORE writing the fix
- Domain decision made → add/update ADR

## Documentation Maintenance Rule (CRITICAL)

Every decision that changes the project MUST land in the right document in the same session. No exceptions.

| Decision / change | Target doc |
|---|---|
| New entity / new field on existing entity | `.claude/docs/entities.md` |
| New frontend convention or gotcha | `.claude/docs/frontend-gotchas.md` |
| New backend service / permission rule | `.claude/docs/backend.md` |
| New UI design token or visual rule | `.claude/docs/ui-design-system.md` |
| CI / deploy / migration-runner change | `.claude/docs/deploy.md` |
| Architectural decision ("we chose X because Y") | `.claude/docs/adr/ADR-NNN-*.md` (new file) |
| Domain concept clarified | `.claude/docs/domain/glossary.md` |
| Business workflow clarified | `.claude/docs/domain/workflows.md` |
| PRD finalized | `.claude/docs/prd/YYYY-MM-DD-*.md` (new file) |
| Bug fix | `BUGS.md` FIXED + regression TC in `TEST_CASES.md` |
| User-reported bug (before fix) | `BUGS.md` Open + repro TC |
| New test case | `TEST_CASES.md` |
| Removed feature / completed migration / rename | `.claude/docs/changelog.md` |
| Cross-cutting Critical Rule | relevant doc + `CLAUDE.md` Critical Rules |

**Enforcement**: before closing a session, verify doc updates exist for every non-trivial change. Use `/docs-sync` to automate this.

**What NOT to write in docs:**
- Anything derivable from code (file lists, function signatures).
- Point-in-time counts (test count, entity count). Shape, not snapshot.
- Duplicate information across docs — pick one home, link from others.
- Implementation details that belong in inline comments.

## Definition of Done (CRITICAL)

### Code
- [ ] Matches the acceptance criteria (positive TCs in `TEST_CASES.md`)
- [ ] No dead code; no TODO without issue/BUGS.md reference
- [ ] Follows project conventions

### Tests
**Backend**: unit + integration, fresh DB per run, happy + negative + edge, regression TC for bug fixes.
**Frontend**: unit + component tests for non-trivial state, build completes clean.

### Review
- [ ] Code review (integration, simplicity, reuse, doc drift)
- [ ] Security review (on any backend change)
- [ ] UX review (on any UI change)
- [ ] Manual QA walk-through (on any UI change)

### Documentation
- [ ] Relevant doc in `.claude/docs/` updated
- [ ] `BUGS.md` updated with FIXED entry if bug fix
- [ ] `TEST_CASES.md` updated
- [ ] ADR added if architectural decision was made

### Deployment
- [ ] Clear commit message (WHY, not WHAT)
- [ ] CI green before merge
- [ ] Smoke tests pass after deploy
- [ ] Rollback path mentally tested

## Test Case Registry Rule (CRITICAL)

1. New endpoint or workflow → MUST add TC entries (happy + ≥1 negative + ≥1 edge).
2. Bug fix → MUST add a TC that would have caught the bug. Reference the BUGS.md ID.
3. Every TC has a status flag: `[AUTO-BE]` / `[AUTO-FE]` / `[MANUAL]` / `[NOT_COVERED]`.
4. Never delete TCs — mark `[OBSOLETE]` with replacement link.

## Development Process — Two Modes

### Small tasks — direct edit
Criteria: bug fixes, 1–3 files, config tweaks, single-field additions.

Flow: edit → run tests → update docs → ask user before deploy.

### Large tasks — agent pipeline
Criteria: new features, new entities, multi-entity workflows, schema-breaking changes, 4+ files.

Flow: BA → UX + Tech-lead (parallel) → DB + Backend + Frontend → QA Auto + QA Manual (parallel) → Security + Tech-lead (parallel) → Acceptance → SRE.

### Always-on rules
- Orchestrator / Claude NEVER runs deploy commands. SRE owns deployment.
- Orchestrator / Claude NEVER commits code. SRE commits.
- Tests updated with every backend code change.
- QA Manual mandatory for any UI change.
- Parallelize independent agents (max 3 per batch). Same-type sharding is expected when a phase has ≥3 independent tasks fitting one role.
- Every agent MUST read existing code before writing — no hallucinated APIs.
