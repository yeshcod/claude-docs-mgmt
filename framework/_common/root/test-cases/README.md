# Test Cases — {{PROJECT_NAME}}

Section files split by area. The root `TEST_CASES.md` is an index pointing here.

## How to add a new TC

1. Find the matching section file (or create `<N>-<area>.md` if none fits).
2. Append the TC at the bottom of the relevant section.
3. Use format:
   ```
   ### TC-<AREA>-<NNN>
   Priority: P0 / P1 / P2
   Type: Positive / Negative / Edge
   Steps: ...
   Expected: ...
   Status: [AUTO-BE] | [AUTO-FE] | [MANUAL] | [NOT_COVERED]
   Related code: path/to/file.ext:LN
   ```
4. If it's a bug-regression TC, reference the BUGS.md ID (`Added after FIXED-YYYY-MM-DD-NN`).
5. Update `change-log.md` with a one-line entry.

## Status flags

- `[AUTO-BE]` — backend automated test (cite file + test name).
- `[AUTO-FE]` — frontend automated test.
- `[MANUAL]` — covered by documented manual test plan, not automated.
- `[NOT_COVERED]` — known gap, should be automated.
- `[OBSOLETE]` — no longer relevant (keep the entry with reason + replacement link).

## Section index

<!-- List section files as they're created. Examples:

- [1-cross-entity-flows.md](1-cross-entity-flows.md) — end-to-end flows spanning multiple entities.
- [2-auth-sessions.md](2-auth-sessions.md) — login, logout, session lifecycle.
- [3-rbac.md](3-rbac.md) — permission matrix.

-->
