# PRD — <feature name>

**Date**: {{CURRENT_DATE}}
**Author**: <name>
**Status**: Draft / In review / Approved / In progress / Shipped / Cancelled
**Target ship date**: <YYYY-MM-DD or "TBD">

## 1. Problem

What problem are we solving? Who has it? What's the current workaround? Keep this section to 3-5 sentences — if it's longer, the problem isn't clear yet.

## 2. Goals & non-goals

### Goals
- G1 — <measurable goal>
- G2 — ...

### Non-goals (explicitly out of scope)
- N1 — <thing we are NOT doing, to prevent scope creep>
- N2 — ...

## 3. Success criteria

How will we know this worked? Prefer measurable outcomes.
- <metric> reaches <value> within <timeframe>.
- <n> users complete <action> without error.

## 4. User stories / scenarios

### Happy path
- As a <role>, I want to <action> so that <outcome>.

### Edge cases
- What if <condition>? → Expected: <behavior>.

### Negative
- If <invalid input>, user sees <specific error>.

## 5. Functional requirements

- FR-1 — <requirement>. Testable: yes/no.
- FR-2 — ...

## 6. Non-functional requirements

- Performance — <latency / throughput bounds>.
- Security — <auth / authz / data-handling rules>.
- Compatibility — <browsers / OS / API versions>.

## 7. Design sketch

High-level approach. Link to the HTML prototype / Figma / diagram if one exists. Call out the architectural choices the eng team needs to agree on before building.

## 8. Risks & open questions

- R1 — <risk> → mitigation: <plan>.
- OQ-1 — <question we haven't answered yet>. Owner: <name>. Deadline: <date>.

## 9. Acceptance criteria

Checklist the PR / feature must satisfy before shipping:
- [ ] AC-1 — FR-1 is implemented and has ≥1 test.
- [ ] AC-2 — ...

## 10. Rollout plan

- Phase 1 — <internal / feature-flagged / small cohort>.
- Phase 2 — <wider rollout>.
- Rollback — <how to disable if something breaks>.
