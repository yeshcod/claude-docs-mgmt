---
name: refactor
description: Safe refactoring with full agent pipeline — plan, implement, test, review
user-invocable: true
---

# /refactor — Safe Refactoring Pipeline

Refactor code with full quality gates: plan → implement → test → review.

## Usage
```
/refactor <target>      — refactor a specific file, module, or pattern
/refactor <description> — describe what to refactor
```

Examples:
```
/refactor <state-layer path>     — migrate to the current state library idiom
/refactor upload middleware      — consolidate 3 upload variants into one
/refactor <god-component>        — extract reusable hooks
```

## Process

### Phase 1: Analysis (tech-lead agent)
```
Analyze the refactoring target. Read all relevant code and:
1. Identify what needs to change and why
2. Map all files that reference the target (grep for imports, usage)
3. Assess risk: how many files affected, is there test coverage?
4. Design the refactoring approach — step by step
5. Identify what tests need updating

Output: refactoring plan with tasks, risks, and rollback strategy.
```
**[USER APPROVAL GATE]** — present plan, get approval before proceeding.

### Phase 2: Implementation (backend-engineer / frontend-engineer)
Based on the tech lead's plan:
- Backend changes → `backend-engineer` agent
- Frontend changes → `frontend-engineer` agent
- Both → run in parallel if independent, sequential if dependent

Each agent MUST:
- Read existing code before modifying
- Follow conventions in `CLAUDE.md` and `.claude/docs/code-standards.md`
- Not introduce new patterns without justification

### Phase 3: Testing (qa-automation + qa-manual, parallel)
- **qa-automation**: run `{{TEST_CMD}}`. If tests fail, fix them.
- **qa-manual** (if frontend changed): verify no visual regressions on affected pages.

### Phase 4: Review (security-reviewer + tech-lead, parallel)
- **security-reviewer**: check refactored code for new vulnerabilities
- **tech-lead**: verify the refactoring achieved its goals, no new tech debt introduced

### Phase 5: Report
Present to user:
- What was refactored
- Files changed (before/after summary)
- Test results
- Review findings
- Any follow-up items

**[USER APPROVAL GATE]** — user decides whether to deploy. Deploy + commit go through the `sre` agent.

## Rules
- Never refactor and add features simultaneously
- Keep refactoring scope tight — one concern at a time
- If refactoring reveals bugs, log them separately (`BUGS.md`), don't fix in the same pass
- Always verify tests pass before presenting to user
- Rollback plan must exist before implementation begins
- Refactor commits stay separate from behaviour-change commits
