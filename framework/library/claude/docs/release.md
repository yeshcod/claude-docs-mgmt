# Release Process — {{PROJECT_NAME}}

## Distribution

- **Registry**: {{STACK_PACKAGE_MANAGER}} (e.g. npm / PyPI / crates.io).
- **Package name**: `<name>`.

## Versioning

[Semver](https://semver.org/). `MAJOR.MINOR.PATCH`.
- **MAJOR** — any breaking change to the public API (see `api-surface.md`).
- **MINOR** — new functionality, backward-compatible.
- **PATCH** — bug fixes, backward-compatible.

Pre-stable `0.x`: breaking changes can ship on any release; still bump MINOR for features, PATCH for fixes.

## Release checklist

1. **Update** the user-facing `CHANGELOG.md` (Keep-a-Changelog format recommended).
2. **Verify** `api-surface.md` matches actual exports.
3. **Bump version** in package manifest.
4. **CI** runs tests on PR merge.
5. **Tag** `vX.Y.Z` pushed to origin.
6. **CI publish** job triggers on tag → builds → publishes to registry.
7. **Verify** a user can install the new version and the `CHANGELOG.md` is visible.

## CI publish workflow

<!-- Describe the CI job. Example:
  - Triggered by: git tag push matching `v*.*.*`.
  - Secrets needed: NPM_TOKEN (or equivalent).
  - Steps: checkout → install → test → build → publish → create GitHub release with changelog extract.
-->

## Rollback

Publishing is largely irreversible (registries discourage unpublishing). To "roll back":
1. **Yank** or deprecate the bad version (`npm deprecate <pkg>@<ver> "reason"`).
2. **Publish** a new patch version with the fix.
3. Communicate via GitHub issue / release notes.

## Release cadence

<!-- Project-specific: weekly / on-demand / aligned with upstream. Example:
  - Patches: as needed, usually same-day after bug report.
  - Minors: when 3+ user-visible additions queue up.
  - Majors: batched; no more than one per quarter.
-->
