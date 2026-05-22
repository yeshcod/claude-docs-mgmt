# {{PROJECT_NAME}} — Live Bug Log

Source of truth for known bugs. Two sections: `Open` (active) and `Fixed` (resolved with root cause + lesson learned).

## ID format

`BUG-YYYY-MM-DD-NN` for user-reported bugs, `AUDIT-YYYY-MM-DD-NN` for findings from `/audit` or similar, `FOLLOWUP-YYYY-MM-DD-N` for deliberate follow-ups spun out of shipped work, `FIXED-YYYY-MM-DD-NN` once moved to Fixed.

## Severity

- **Critical** — production down, data loss, security breach.
- **High** — feature broken, affects all users, no workaround.
- **Medium** — feature degraded, affects some users, workaround exists.
- **Low** — cosmetic, edge case, affects no users in practice.

---

## Open

<!-- Newest on top. Template:

### BUG-{{CURRENT_DATE}}-01 — <short title>
**Severity**: Critical / High / Medium / Low
**Reported by**: <name>
**Found in**: <version / date>
**Repro**:
1. <step>
2. <step>
**Expected**: <what should happen>
**Actual**: <what happens>
**Related TC**: TC-XXX-NNN (or "needs new TC")
**Notes**: <investigation so far>

-->

_(No open bugs yet.)_

---

## Fixed

<!-- Newest on top. Template:

### FIXED-{{CURRENT_DATE}}-01 — <short title>
**Severity when found**: Critical / High / Medium / Low
**Commit**: <SHA or "pending">
**Root cause**: <1-2 sentences>
**Lesson learned**: <what will prevent this class of bug next time>
**Regression TC**: TC-XXX-NNN in `TEST_CASES.md` / `test-cases/<section>.md`
**File:line**: <where the fix lives>

-->

_(No fixed bugs yet.)_
