---
name: develop
description: Orchestrate full development cycle with agent team — from requirements to deploy
user-invocable: true
---

# /develop — Full Development Cycle Orchestrator

Orchestrates a team of specialized agents to take a feature request from idea to production.

## Usage
```
/develop <feature description>
```

## When to use `/develop`

`/develop` is the **large-task pipeline**. Use it for: new features, new entities, multi-entity workflows, schema-breaking changes, anything touching 4+ files.

For **small tasks** (bug fixes, 1–3 file changes, config tweaks, field additions, copy changes) — do NOT invoke `/develop`. Edit directly, run tests, ask the user before deploy. See `.claude/docs/processes.md` → Development Process for the small-task flow.

The small/large split is a single source of truth defined in `.claude/docs/processes.md`. If in doubt: ask the user.

## NEVER Rules (Hard Constraints)

When `/develop` IS invoked, the orchestrator MUST follow these at all times:
- **NEVER edit code or files directly** — always delegate to the appropriate agent
- **NEVER run deployment commands** (ssh, git push, deploy scripts, process-manager commands) — the `sre` agent handles ALL deployment
- **NEVER skip any of the 7 phases** — once inside `/develop`, all phases are mandatory
- **NEVER commit code** — the `sre` agent handles git commit/push
- **NEVER proceed past a gate without explicit user approval**

## Orchestrator Checklist

Before moving to each phase, verify:
- [ ] Previous phase completed by the assigned agent(s)
- [ ] User approved the output (at approval gates)
- [ ] No open bugs or review issues from prior phases

## Process

### Phase 1: Requirements (Business Analyst)

Launch the `business-analyst` agent to:
1. Analyze the feature request
2. Explore existing codebase for context
3. Ask clarifying questions to the user via AskUserQuestion
4. Produce a PRD with requirements, user stories, acceptance criteria
5. Save the PRD to `.claude/docs/prd/YYYY-MM-DD-<slug>.md`

**Wait for user approval of requirements before proceeding.**

### Phase 2: Design (UX Designer + Tech Lead — parallel)

Launch TWO agents in parallel:

1. **`ux-designer`** agent:
   - Review PRD
   - Propose UI/UX solution following existing patterns
   - **Build a clickable HTML prototype** at `.claude/prototypes/{feature-slug}/index.html`
   - Output: UI spec with layout, components, interactions + absolute path(s) to prototype HTML files
   - Skip prototype only for backend-only features (no UI changes)

2. **`tech-lead`** agent:
   - Review PRD
   - Design architecture (models, APIs, components)
   - Break into ordered tasks with dependencies
   - Identify risks and migration needs
   - Record any architectural choice as an ADR in `.claude/docs/adr/`
   - Output: technical plan with task breakdown

**Present both outputs to user. For UI changes, give the user the prototype path(s) to review in browser. Wait for approval of BOTH the prototype and the tech plan before proceeding to implementation.**

### Phase 3: Implementation (Frontend + Backend + DB — parallel where possible)

Based on the tech lead's task breakdown, launch agents in dependency order:

1. **`db-architect`** agent — schema changes, migration scripts
2. **`backend-engineer`** agent — models, controllers, routes
3. **`frontend-engineer`** agent — pages, components, config

Tasks without dependencies run in parallel. Tasks with dependencies run sequentially. Same-type sharding of a large group (e.g. a group with 5 independent tasks) launches multiple agents of that role with disjoint file scopes — each agent's prompt enumerates the exact files it owns, shards must not touch the same file.

After implementation, run `{{BUILD_CMD}}` to verify the frontend compiles.

### Phase 4: Testing — MANDATORY (QA Automation + QA Manual — parallel)

This phase cannot be skipped. Launch TWO agents in parallel:

1. **`qa-automation`** agent:
   - Write/update backend tests
   - Run `{{TEST_CMD}}` and fix failures
   - Output: test results (must be all green)

2. **`qa-manual`** agent (mandatory for any UI change):
   - Drive the running app with `{{QA_TOOL}}`
   - Walk through all test scenarios from acceptance criteria
   - Check for visual bugs, console errors, broken flows
   - Take screenshots of key states
   - Output: bug report (if any)

If bugs found → delegate fixes to the appropriate agent (`backend-engineer` or `frontend-engineer`), then re-test.

### Phase 5: Review — MANDATORY (Security + Tech Lead — parallel)

This phase cannot be skipped. Launch TWO agents in parallel:

1. **`security-reviewer`** agent:
   - Review all changed files for vulnerabilities
   - Check auth, permissions, injection, data exposure
   - Output: security report

2. **`tech-lead`** agent (review mode):
   - Code review: reuse, simplicity, no spaghetti
   - Integration check: all pieces fit together
   - Performance: N+1 queries, unnecessary re-renders
   - Verify doc updates landed per the Documentation Maintenance Rule
   - Output: review comments

If issues found → delegate fixes to the appropriate agent, then re-review.

**Re-review gate (CRITICAL)**: If any code changes land between Phase 5 signoff and SRE commit — whether from Phase 4 bug-fix iteration, Phase 6 user-directed tweaks, or late doc drift — the delta MUST go through security + tech-lead again before SRE. User approval of the feature does NOT substitute for code review. See `.claude/docs/processes.md` → "Re-review gate" for details.

### Phase 6: Acceptance Gate

Before deploy, present the result to the user:
- Show screenshots of key UI states (from QA Manual)
- Summarize what was built, changed, and tested
- List any known limitations or follow-ups

**Wait for explicit user approval ("deploy it", "looks good", "ship it") before proceeding to Phase 7.**

### Phase 7: Deploy (SRE)

The orchestrator NEVER runs deploy commands. Launch the **`sre`** agent to handle everything:
1. Run pre-deploy checklist
2. Git commit with a descriptive message (WHY, not WHAT)
3. Git push
4. Execute data migrations (if needed)
5. Build + release
6. Restart services (if needed)
7. Verify deployment (logs, smoke-test key endpoints, rollback if unhealthy)

## Important Rules

- **Orchestrator = Product Manager** — manages flow, delegates ALL work, never edits code or deploys
- **All 7 phases mandatory _inside `/develop`_** — once the skill is invoked, no shortcuts. If the task turns out to be small, exit `/develop` and edit directly rather than trimming phases.
- **User approval gates**: after Phase 1 (requirements), Phase 2 (design), and Phase 6 (acceptance)
- **Never skip testing** — both automated (`qa-automation`) and manual (`qa-manual`)
- **Never skip review** — both security (`security-reviewer`) and code (`tech-lead`)
- **SRE owns deployment** — git commit, git push, ssh, restarts — all done by the `sre` agent
- **Maximize parallelism — same-type sharding is MANDATORY, not optional.** Sequential runs of same-role work on independent files are a process violation. Independent agents run simultaneously (cap: 3 per batch). For large groups, launch 2–3 agents of the same role in parallel with **non-overlapping file scopes** in ONE message (multiple Agent tool uses in the same response — they then execute concurrently). Each agent's prompt must enumerate the exact files it owns, and shards must not touch the same file. Use the tech-lead's Phase 2 task breakdown to shard — it has already grouped by dependencies. Applies to `frontend-engineer`, `backend-engineer`, `qa-automation`, `db-architect`. Does NOT apply to single-deliverable roles (BA, tech-lead, SRE, security-reviewer).
- **Minimize context** — each agent gets only what it needs (PRD, tech plan, specific files)
- **Ask, don't assume** — when in doubt, ask the user via AskUserQuestion
