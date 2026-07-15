---
name: audit
description: Full-project audit — security, code quality, design system compliance
user-invocable: true
---

# /audit — Full Project Audit

Run a comprehensive audit of the codebase across 3 dimensions: security, code quality, and design system compliance.

Static analysis by default — no build required. Related entry point: `/code-review` reviews a specific diff or module on demand; `/audit` sweeps the whole project on a schedule. Both produce a P0–P4 backlog; neither replaces the other.

## Usage
```
/audit           — full audit (all 3 phases)
/audit security  — security only
/audit quality   — code quality only
/audit design    — design system only
```

## Process

### Phase 1: Security Audit (security-reviewer agent)
Launch the `security-reviewer` agent with this prompt:
```
Perform a security audit of this project. Read the relevant `.claude/docs/*`
first (backend.md for the auth/permission model). Focus on:
1. All backend routes — verify auth middleware + permission checks
2. User input handling — check for injection (SQL/NoSQL/command), XSS
3. Session/token handling — verify httpOnly, expiry, secret strength
4. File upload — validate types, sizes, paths
5. Data exposure — check API responses for sensitive fields
6. Hardcoded secrets — scan for API keys, passwords, tokens

Check files changed in the last 30 days first:
  git log --since="30 days ago" --name-only --pretty=format:""
Then scan critical files: controllers, routes, middlewares.

Output: structured report with severity (Critical/High/Medium/Low) and fix
recommendations. Save to .claude/reports/security/YYYY-MM-DD.md
(relative to project root, tracked in git).
```

### Phase 2: Code Quality Review (tech-lead agent)
Launch the `tech-lead` agent with this prompt:
```
Perform a code quality review of this project, measured against
`.claude/docs/code-standards.md`. Focus on:
1. Code duplication — repeated patterns that should be extracted
2. Dead code — unused imports, functions, components, routes
3. Pattern violations — inconsistencies with conventions in CLAUDE.md
4. Missing tests — endpoints without test coverage
5. Performance — N+1 queries, unnecessary re-renders, missing indexes
6. Naming — inconsistent naming conventions

Check recent changes first, then scan for systemic issues.

Output: refactoring backlog with priorities (P0-P4). Save to
.claude/reports/quality/YYYY-MM-DD.md (relative to project root, tracked in git).
```

### Phase 3: Design System Check (design-system-guard agent)
Skip this phase for projects with no UI.

Launch the `design-system-guard` agent with this prompt:
```
Verify UI compliance with the design system defined in
`.claude/docs/ui-design-system.md` — that file is the source of truth;
the rules below are the project's current summary of it.

Routes/screens to check:
{{AUDIT_ROUTES}}

Rules to enforce:
{{DESIGN_RULES}}

For each route, report every violation with file:line and the rule it breaks.
Static analysis is sufficient; if a running app is available, screenshot the
key states as evidence.

Save report to .claude/reports/design/YYYY-MM-DD.md
(relative to project root, tracked in git).
```

> Fill `{{AUDIT_ROUTES}}` with the handful of routes that best cover the app's
> surface (a list view, a detail/document view, a form, a settings page), and
> `{{DESIGN_RULES}}` with the enforceable rules from `ui-design-system.md`
> (tokens vs hardcoded values, spacing scale, radius/shadow policy, icon
> policy, empty/loading/error states, a11y). Keep both lists short — an audit
> that checks 30 rules on 12 routes gets skimmed, not read.

### Phase 4: Consolidated Report
After the agents complete, compile a summary:

```markdown
# Audit Report — YYYY-MM-DD

## Security: X findings (Y critical, Z high)
[Key findings from Phase 1]

## Code Quality: X issues (Y P0, Z P1)
[Key findings from Phase 2]

## Design System: X violations
[Key findings from Phase 3]

## Recommended Actions (priority order)
1. ...
2. ...
```

## Rules
- Run phases 1 and 2 in parallel (independent)
- Phase 3 is independent too — run all three in one batch (cap: 3 agents)
- Always save reports to `.claude/reports/`
- Compare with previous reports if they exist to track progress

## Phase 5: Backlog Integration (CRITICAL — always run after phases 1–3)

After all audit phases complete, if ANY findings with severity ≥ Medium were found:

1. **Read** `BUGS.md` (at the project root — a relative path works in both local and cloud environments).
2. **Add new entries** under the `## Open` section for each finding:
   ```markdown
   ### AUDIT-YYYY-MM-DD-{NN} — {Short title}
   **Severity**: {Critical/High/Medium}
   **Source**: Audit {date}
   **Category**: Security / Code Quality / Design System
   **Finding**: {1-2 sentence description}
   **File**: {path:line}
   **Fix recommendation**: {brief}
   **Related TC**: {TC-XXX-NNN if exists, or "needs new TC"}
   ```
3. **Add corresponding TCs** to `TEST_CASES.md` for any finding that doesn't already have coverage (per the Test Case Registry Rule in `.claude/docs/processes.md`).
4. **Hand off to the `sre` agent to commit + push** the updated `BUGS.md` + `TEST_CASES.md` + reports. The orchestrator NEVER commits — that rule holds for audit output exactly as it does for feature code. Suggested message:
   ```
   docs(audit): audit YYYY-MM-DD — N findings (X critical, Y high, Z medium)
   ```

Low severity findings go to reports only (not `BUGS.md`) — they are tracked as recommendations, not action items.
