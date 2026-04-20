# {{PROJECT_NAME}} — Test Case Registry

Living test-case registry — single source of truth for what the system should do.

## Maintenance

- **New endpoint or workflow** → add TC (happy + ≥1 negative + ≥1 edge) in the same session.
- **Bug fix** → add a TC that would have caught the bug. Reference the BUGS.md ID (e.g. `Added after FIXED-YYYY-MM-DD-NN`).
- **Every TC has a status flag**: `[AUTO-BE]` / `[AUTO-FE]` / `[MANUAL]` / `[NOT_COVERED]` / `[OBSOLETE]`.
- **Never delete TCs** — mark `[OBSOLETE]` with reason and link to replacement.

## Format

```
TC-{ENTITY|FLOW}-{NNN}
  Priority: P0 / P1 / P2
  Type: Positive / Negative / Edge
  Steps: ...
  Expected: ...
  Status: [AUTO-BE] (file:testName) | [MANUAL] | [NOT_COVERED]
  Related code: path/to/file.ext:LN
```

## Sections

<!-- Pick one of two layouts:

  (A) Flat — this file holds all TCs. Good for small projects (<50 TCs).
  (B) Folder — split into test-cases/<section>.md per area. Good for larger projects.
       This file becomes an index pointing to test-cases/.

  The starter below assumes (A). If you switch to (B), move section contents
  into test-cases/ and replace them here with links.

-->

### TC-AUTH-001 (example — replace with real cases)
**Priority**: P0 **Type**: Positive
**Steps**: 1. POST /login with valid credentials → 2. expect 200 + cookie set.
**Expected**: Authenticated session cookie, redirect to home.
**Status**: [NOT_COVERED]
**Related code**: backend/src/routes/auth.js

### TC-AUTH-002 (example)
**Priority**: P0 **Type**: Negative
**Steps**: POST /login with wrong password → 403.
**Expected**: `{ message: 'Invalid credentials.' }`. Same response shape for unknown-email and wrong-password (anti-enumeration).
**Status**: [NOT_COVERED]
**Related code**: backend/src/routes/auth.js
