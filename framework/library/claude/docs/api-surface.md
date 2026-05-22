# Public API Surface — {{PROJECT_NAME}}

Authoritative list of every public export. If it's not in this file, it's NOT public — users importing it do so at their own risk (and future majors can break them without notice).

## Rules

1. **Every public symbol is listed here.** If you add an export in `src/index.*`, add a row here in the same PR.
2. **Breaking changes require an ADR.** The ADR explains the motivation; the entry here records the change date + target version.
3. **Deprecations are announced**: mark the row as `Deprecated since vX.Y` and link the replacement. Keep the export for at least one minor version before removal.
4. **Version 0.x** is pre-stable — breaking changes can ship on any release. The rules above still apply to `api-surface.md` hygiene.

## Exports

| Symbol | Kind | Since | Status | Description |
|---|---|---|---|---|
| _(none yet)_ | | | | |

<!-- Kinds: function / class / type / interface / enum / const / default-export.
     Status: Stable / Experimental / Deprecated since vX.Y.
     Template row:

| `myFunction` | function | v0.1.0 | Stable | Does X with Y. Returns Z. See `src/my-function.ts`. |

-->

## Deprecated

<!-- Move rows here when deprecating. Keep the original row too so newcomers see the full picture. -->

_(none)_

## Breaking changes log

| Version | Date | Change | ADR |
|---|---|---|---|
| _(none)_ | | | |
