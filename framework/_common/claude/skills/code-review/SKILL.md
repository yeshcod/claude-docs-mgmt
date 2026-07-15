---
name: code-review
description: Full-stack code review generating a refactoring plan. Analyzes frontend, backend, and data layer for code reuse, dead code, spaghetti patterns, and maintainability.
user-invocable: true
---

# /code-review — Code Review & Refactoring Plan

Review a target (a diff, a module, or the whole codebase) and generate an actionable refactoring plan.

## Usage
```
/code-review                — review the current working diff
/code-review <path|module>  — review a specific area
```

Related entry point: `/audit` runs the same code-quality lens across the whole project on a schedule and also covers security + design. `/code-review` is the on-demand, scoped version — reach for it when reviewing work in flight. Don't run both on the same delta.

## Goals

The review optimizes for:
- **Code reuse** — eliminate duplication, extract shared utilities/hooks/components
- **Simplicity** — no over-engineering, no unnecessary abstractions
- **No spaghetti** — clear data flow, minimal coupling between modules
- **No dead code** — remove unused exports, unreachable branches, commented-out code
- **Maintainability** — consistent patterns, clear naming, predictable structure

`.claude/docs/code-standards.md` is the rulebook these goals come from — cite its section numbers in findings rather than asserting taste.

## Review Process

Read `.claude/docs/code-standards.md` and `CLAUDE.md` first — a "violation" of a convention the project deliberately chose is not a finding. Then dispatch parallel `Explore` agents across the layers below (cap: 3 per batch) so analysis of independent areas runs concurrently.

### Phase 1: Presentation / UI layer
1. **Component duplication** — repeated layouts, table configs, modal patterns that shared components already cover.
2. **Shared-abstraction adoption** — is the project's existing component/hook layer used consistently, or bypassed with hand-rolled copies?
3. **State-logic reuse** — inline state+effect patterns that duplicate an existing hook or store selector.
4. **Config consistency** — per-screen config/schema definitions: are types, labels, and validation rules consistent across siblings?
5. **Styling drift** — repeated inline styles that belong in a class or token; hardcoded values where a design token exists.
6. **Data-access boundaries** — API calls made from components instead of the project's sanctioned data layer.

### Phase 2: Server / API layer
1. **Handler duplication** — which handlers add real logic vs re-implement the generic path? What belongs in shared middleware?
2. **Model/schema consistency** — timestamps, soft-delete, refs, naming; missing indexes on frequently queried fields.
3. **Route organization** — orphan routes (registered, no handler), models with no route, inconsistent route shapes across siblings.
4. **Middleware** — duplicated auth/validation logic that should be one chain.
5. **Dead code** — unused handlers, models, utilities.

### Phase 3: Data layer
1. **Reference integrity** — relations pointing at models/tables that no longer exist.
2. **Missing indexes** — fields used in queries/filters without index support.
3. **Schema bloat** — fields never read, or always null.
4. **Normalization** — data duplicated across collections/tables that should be a reference.

### Phase 4: Cross-cutting concerns
1. **Client–server alignment** — form fields vs model fields; response shape vs consumer expectations.
2. **Naming consistency** — entity names across routes, models, screens, configs.
3. **Error handling** — inconsistent patterns (try/catch vs .catch vs unhandled); one error shape per module.
4. **Constants** — magic strings/numbers that belong in a constants module.

## Output Format

Generate a structured plan with priorities:

```markdown
# Refactoring Plan — [Date]

## Summary
[2-3 sentence overview of codebase health and top issues]

## P0 — Bugs & Dead Code
[Items to fix immediately: bugs, dead code, broken refs]

## P1 — Code Reuse
[Duplication that should be extracted into shared utilities/components/hooks]

## P2 — Simplification
[Over-engineered patterns, unnecessary abstractions, spaghetti to untangle]

## P3 — Consistency
[Naming, patterns, conventions that vary across the codebase]

## P4 — Polish
[Nice-to-have improvements: better types, cleaner imports, etc.]

Each item:
### [N]. [Short title]
- **Files**: [list of affected files]
- **Problem**: [what's wrong]
- **Fix**: [concrete action to take]
- **Effort**: S / M / L
```

## Important

- Be specific — reference exact file paths and line numbers
- Be practical — only suggest changes that improve maintainability
- Don't over-engineer — if 3 lines of duplicated code work fine, leave them (see code-standards: three-callsite rule)
- Respect existing patterns documented in `CLAUDE.md` and the `.claude/docs/*` references
- This skill produces a **plan**, not edits. To execute an item, hand it to `/refactor` — which carries its own test + review gates.
