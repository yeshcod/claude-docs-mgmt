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

Keep the check brief (1–2 sentences): "Context is current" OR "Context drift detected: X, Y, Z — update?". Don't ask if nothing meaningful changed.

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
| Forward-looking backlog / deferred item / WONTFIX | `ROADMAP.md` |
| Cross-cutting Critical Rule | relevant doc + `CLAUDE.md` Critical Rules |

**Enforcement**: before closing a session, verify doc updates exist for every non-trivial change. Use `/docs-sync` to automate this. Missing doc updates block the review gate — a change without its doc is not done.

**What NOT to write in docs:**
- Anything derivable from code (file lists, function signatures).
- Point-in-time counts (test count, entity count). Shape, not snapshot.
- Duplicate information across docs — pick one home, link from others.
- Implementation details that belong in inline comments.

## Definition of Done (CRITICAL)

Every feature, bug fix, or refactor MUST satisfy ALL items below before being considered done.

### Code
- [ ] Matches the acceptance criteria (positive TCs in `TEST_CASES.md`)
- [ ] No dead code; no TODO without issue/BUGS.md reference
- [ ] Follows project conventions (see `CLAUDE.md` Critical Rules + `.claude/docs/code-standards.md`)
- [ ] No hardcoded values where a design token or shared constant exists

### Tests (both tiers green)

**Backend** (`{{TEST_CMD}}`):
- [ ] Unit tests for pure logic (services, utilities, guards)
- [ ] Integration/E2E tests for the request → permission → handler → DB → response flow
- [ ] Fresh DB per run
- [ ] New tests exist for: new endpoint (happy + negative + edge), bug fix (regression TC), schema change

**Frontend** (`{{FE_TEST_CMD}}` + `{{BUILD_CMD}}`):
- [ ] Unit tests for pure logic (stores, formatters, helpers)
- [ ] Component tests for interactive components (forms, tables, hooks with non-trivial state)
- [ ] `{{BUILD_CMD}}` completes clean — **build failures count as test failures**
- [ ] Any new component with non-trivial state has ≥1 test

**Coverage:**
- [ ] `TEST_CASES.md` updated: happy + ≥1 negative + ≥1 edge for new features; regression TC for bug fixes
- [ ] ≥1 automated test per P0 TC
- [ ] No previously-green test now fails — BOTH suites

### Review
- [ ] Code review (integration, simplicity, reuse, doc drift)
- [ ] Security review (on any backend change): auth, permissions, injection, data exposure, error leaks
- [ ] UX review (on any UI change): design system compliance, states (loading/empty/error), a11y, responsive
- [ ] Manual QA walk-through (on any UI change)

### Documentation
- [ ] Relevant doc in `.claude/docs/` updated (see Documentation Maintenance Rule)
- [ ] `BUGS.md` updated with FIXED entry if bug fix (root cause + lesson + file:line)
- [ ] `TEST_CASES.md` updated per the Test Case Registry Rule
- [ ] ADR added if an architectural decision was made
- [ ] PRD archived if the change came through the large-task pipeline
- [ ] Inline comments for non-obvious logic only

### Deployment
- [ ] Clear commit message (WHY, not WHAT)
- [ ] Branch pushed
- [ ] CI green before merge
- [ ] Deploy verified: smoke tests pass, services healthy, no error spike
- [ ] Rollback path mentally tested: migrations additive, last-known-good revision recoverable

### User-reported bugs (strict)
- [ ] Added to `BUGS.md` Open WITH repro steps BEFORE any fix code
- [ ] Repro TC added to `TEST_CASES.md` (Negative or Edge)
- [ ] Fix commit references the `BUGS.md` ID
- [ ] After deploy + user confirmation → move the `BUGS.md` entry Open → Fixed with root cause + lesson
- [ ] TC marked automated with the test citation

### Regression discipline
- [ ] Before closing a session, review the session's commits — each has a clear reason
- [ ] Post-deploy hotfix → add its root-cause pattern to the relevant `.claude/docs/*` so the next session prevents it

## Test Case Registry Rule (CRITICAL)

1. New endpoint or workflow → MUST add TC entries (happy + ≥1 negative + ≥1 edge).
2. Bug fix → MUST add a TC that would have caught the bug. Reference the BUGS.md ID.
3. Every TC has a status flag: `[AUTO-BE]` / `[AUTO-FE]` / `[MANUAL]` / `[NOT_COVERED]`.
4. Never delete TCs — mark `[OBSOLETE]` with replacement link.

## Development Process — Two Modes

The mode is decided FIRST, before any code.

### Small tasks — direct edit
Criteria: bug fixes, 1–3 files, config tweaks, single-field additions, copy changes.

Flow: edit → frontend change? manual QA · backend change? run `{{TEST_CMD}}` → update docs → ask user before deploy → `sre` agent deploys.

### Large tasks — agent pipeline (`/develop`)
Criteria: new features, new entities, multi-entity workflows, schema-breaking changes, 4+ files.

Flow: BA → UX + Tech-lead (parallel) → DB + Backend + Frontend → QA Auto + QA Manual (parallel) → Security + Tech-lead (parallel) → Acceptance → SRE.

All phases are mandatory once `/develop` is invoked. If the task turns out to be small, exit the pipeline and edit directly rather than trimming phases.

## Team roles

| Agent | Role | Phase |
|---|---|---|
| `business-analyst` | Requirements, PRD, clarifying questions | 1 |
| `ux-designer` | UI/UX proposal + clickable HTML prototype | 2 |
| `tech-lead` | Architecture, task breakdown, code review, ADR | 2 + 5 |
| `db-architect` | Schema, indexes, migrations | 3 |
| `backend-engineer` | Models, controllers, routes | 3 |
| `frontend-engineer` | Pages, components, config | 3 |
| `qa-automation` | Automated tests | 4 |
| `qa-manual` | UI verification in a real browser via `{{QA_TOOL}}` | 4 |
| `security-reviewer` | OWASP Top 10, auth, permissions | 5 |
| `design-system-guard` | Fast design-system rule enforcement | on frontend edits |
| `sre` | Deploy, migrations, rollback plan, commits | 7 |

## Re-review gate after Phase 4 bug-fix iteration (CRITICAL)

If testing surfaces bugs and implementation agents fix them **after** the review phase (security + tech-lead) already ran, the **fixes MUST re-enter review before the SRE commit**. Do NOT let user approval ("it works now, ship it") bypass the review gate — **the user approves the feature, not the review**.

Rule: if ANY code changed after the review phase finished and before SRE handoff, re-run review (security + tech-lead in parallel) on the delta before deploy. Even a "small" bug fix can introduce new attack surface — a fix that auto-injects a field from the request body can open provenance spoofing while looking like a one-line cleanup.

How to apply:
- Keep an explicit checkpoint: "review signed off on delta SHA X". Any code change after that invalidates the checkpoint.
- Before launching SRE, verify: the latest diff == what review actually reviewed.
- If a delta exists → re-launch security-reviewer + tech-lead on **just the delta** (scoped prompt — don't re-review the whole cycle).
- ONLY after clean re-review → SRE.

This also applies to user-directed iterations during acceptance: "fix this one more thing" → the review cycle restarts for that change. No exceptions. If the user pushes back ("but it's tiny"), surface the gap up-front so they decide with full information.

## Always-on rules (both modes)

- Orchestrator / Claude NEVER runs deploy commands. SRE owns deployment.
- Orchestrator / Claude NEVER commits code. SRE commits.
- Tests updated with every backend code change.
- QA Manual mandatory for any UI change.
- Every agent MUST read existing code before writing — no hallucinated APIs.
- **Parallelize independent agents (max 3 per batch). Same-type sharding is MANDATORY, not optional** — sequential runs of same-role work on independent files are a **process violation**. When a phase has ≥3 independent tasks fitting one agent role (e.g. 5 frontend pages, 4 backend controllers, 6 test suites), launch 2–3 agents of that role in parallel against non-overlapping file scopes **in a single message** (multiple Agent tool uses in the same response, so they execute concurrently). Each shard's prompt MUST enumerate the exact files it owns; shards MUST NOT touch the same file. Cap per batch: 3. Use the tech-lead's task breakdown to shard by dependency group.
  - **Applies to**: `frontend-engineer`, `backend-engineer`, `qa-automation`, `db-architect` (when migrations are independent).
  - **Does NOT apply** to roles producing a single cohesive deliverable: BA (one PRD), tech-lead (one plan/review), SRE (one deploy), security-reviewer (one report).

## Continuous Quality

### On-demand skills
- `/develop <feature>` — large-task orchestrator (full pipeline, see Two Modes).
- `/audit` — full-project audit (security + quality + design), phases parallel. Findings ≥ Medium go to `BUGS.md`; missing coverage goes to `TEST_CASES.md`.
- `/code-review` — full-stack code review producing a P0–P4 refactoring plan.
- `/refactor <target>` — safe refactoring pipeline (plan → implement → test → review).
- `/docs-sync` — reconcile docs with what changed; run before `/clear` or `/compact`.

Optionally schedule `/audit` to run on a fixed cadence (we run it weekly). It executes its agents in parallel against a static checkout, saves reports to `.claude/reports/{security,quality,design}/YYYY-MM-DD.md`, files findings, and hands the commit to the `sre` agent.
