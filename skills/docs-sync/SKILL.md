---
name: docs-sync
description: Session-end documentation audit. Scans the session, maps changes to the project's Documentation Maintenance Rule (from .claude/docs/processes.md if present, else default), audits docs quality across .claude/docs/*, BUGS.md, TEST_CASES.md, ROADMAP.md, CLAUDE.md + MEMORY.md, proposes a diff, applies after approval. Run before /clear or /compact, or any time docs feel drifted. Universal — works in any project.
user-invocable: true
---

# /docs-sync — Documentation Sync & Audit (universal)

Capture session learnings into project documentation before context is lost to `/clear` or `/compact`, and audit existing docs for drift, duplication, and stale facts.

**Never commits.** This skill edits local markdown only. Commits are the user's / SRE's / CI's job.

## Usage

```
/docs-sync              — full run (reflect → map → audit → diff → apply after approval)
/docs-sync dry-run      — reflect + map + audit only, print diff, do NOT write
/docs-sync quick        — session-capture only (skip quality audit of existing docs)
/docs-sync audit        — quality audit only (skip session capture)
```

## Doc surface

The skill inspects and may edit the following (read what exists, skip what doesn't):

**Root-level** (project root):
- `CLAUDE.md` — project-wide context & Critical Rules. Terse by design.
- `BUGS.md` — Open / Fixed bug log.
- `TEST_CASES.md` — test-case registry (flat file OR index into `test-cases/` folder).
- `ROADMAP.md` — wave plan, WONTFIX.
- `README.md` — user-facing; rarely updated; flag only if clearly out of date.

**`.claude/docs/`** (if present):
- `processes.md` — development process + Documentation Maintenance Rule table (authoritative mapping).
- Typical files: `architecture.md`, `entities.md`, `frontend-gotchas.md`, `backend.md`, `ui-design-system.md`, `deploy.md`, `changelog.md`, `api-surface.md`, `release.md` — whatever the project has.
- `adr/ADR-NNN-*.md` — architectural decision records (append-only).
- `prd/YYYY-MM-DD-*.md` — archived PRDs (append-only).
- `domain/*.md` — glossary, workflows, money-flow, etc.

**Test cases**: `test-cases/*.md` (section files) + `test-cases/change-log.md` if the project uses a folder structure.

**Memory**: `~/.claude/projects/<slug>/memory/` where `<slug>` is the Claude Code session-derived slug (typically `-Users-<user>-path-to-project`). Contains `MEMORY.md` index + individual memory files.

**Out of scope**: code, package manifests, `.claude/reports/`, `.claude/prototypes/`, `.claude/plans/`.

## Workflow

### Phase 1 — Session reflection

Build a structured session summary by answering each question. Keep this internal (assistant reasoning) — do NOT dump it into chat.

1. **What code changed?** Run `git status --porcelain` and `git diff --stat HEAD`. Also scan the current conversation for edits that were later reverted or discussed but not written.
2. **What decisions were made?** Scan messages for "we decided", "rule", "going forward", "never", "always", "instead", "because", "from now on". Each is a candidate for ADR / gotchas doc / process rule.
3. **What bugs were found or fixed?** Check if `BUGS.md` entries were touched or if user reported a bug not yet captured.
4. **What new entities / fields / endpoints / public APIs were added?** Look at diffs in `models/`, `controllers/`, `routes/`, `api/`, or the equivalent in the project's layout.
5. **What gotchas were discovered?** Silent-fail behavior, framework quirks, test-setup oddities, integration edge cases — these go in the gotchas doc for the relevant layer.
6. **What was removed or deprecated?** → `changelog.md`.
7. **What migrations / schema changes were added?** → the deploy/migration doc, or the domain-of-change doc. Do NOT list migration filenames — those are `ls`-able.

### Phase 2 — Map to target doc

**Priority 1**: Read the project's `.claude/docs/processes.md` if it exists. Extract the "Documentation Maintenance Rule" section — a table mapping decision type to target doc. Use that table verbatim.

**Priority 2 (fallback)** when `processes.md` is absent or has no such table:

| From Phase 1 | → Target |
|---|---|
| New/changed entity, field, endpoint, public API | `.claude/docs/entities.md` or `.claude/docs/api-surface.md` |
| Frontend / client-side gotcha | `.claude/docs/frontend-gotchas.md` |
| Backend service / permission / middleware rule | `.claude/docs/backend.md` |
| UI design token / visual rule | `.claude/docs/ui-design-system.md` |
| CI / deploy / release change | `.claude/docs/deploy.md` or `.claude/docs/release.md` |
| Architectural decision ("we chose X because Y") | NEW `.claude/docs/adr/ADR-NNN-*.md` |
| Domain term / concept | `.claude/docs/domain/glossary.md` |
| Business workflow / lifecycle | `.claude/docs/domain/workflows.md` |
| Finalized PRD | NEW `.claude/docs/prd/YYYY-MM-DD-*.md` |
| Cross-cutting Critical Rule (breaks things if violated) | `CLAUDE.md` Critical Rules + home doc |
| Bug fixed in session | `BUGS.md` (Open→Fixed) + regression TC |
| User-reported bug (not yet fixed) | `BUGS.md` Open + repro TC |
| New test case | `TEST_CASES.md` or matching `test-cases/*.md` section |
| Removed feature / completed migration / finished rename | `.claude/docs/changelog.md` (append-only) |
| Wave planning / WONTFIX | `ROADMAP.md` |
| Session-level learnings about user/project/feedback | memory system (NOT project docs) |

**One home per rule.** If a change fits two buckets, the authoritative version goes in the lower-level doc (most specific); the other gets a one-line cross-reference. Never duplicate body text.

### Phase 3 — Quality audit (skip for `quick` mode)

Checks across the doc surface. Report findings inline with the diff.

1. **Stale point-in-time facts** — grep for numbers that look like counts or dates. Verify:
   - Test count claims: compare vs `find <test-dir> -name '*.test.*' | wc -l`.
   - Migration count claims: flag any. Migrations are `ls`-able — shape, not snapshot.
   - "recently" / "last week" / "this month" — replace with absolute date.
2. **Duplicate rules** — grep top-level headings + key phrases across files. If the same rule lives in two places, keep the detailed version, replace the other with a pointer.
3. **Broken references** — find every `@.claude/docs/X.md` / relative link. Verify target exists.
4. **Orphan ADRs / PRDs** — ADR file exists but not referenced from any other doc. Flag for the user to decide (might be standalone on purpose).
5. **Code-derivable content** — flag lists that just duplicate code (file paths, function signatures, enum values, row counts).
6. **MEMORY.md index hygiene** — for each `*.md` in the memory dir except `MEMORY.md`, check there's a pointer in `MEMORY.md`. For each pointer, check the file exists.
7. **Stale memories** — memories with last-modified > 6 months. List for user confirmation; do NOT delete automatically.
8. **CLAUDE.md length** — if > 250 lines, flag. It's loaded into every conversation; brevity matters. Recommend moving detail into `.claude/docs/*`.
9. **BUGS.md Open aging** — bugs open > 30 days without owner/status notes. Flag for triage.

### Phase 4 — Propose the diff

Print a compact plan to chat, grouped by target file. Format:

```
docs-sync plan — <1-line session summary>

Session capture (Phases 1→2):
  entities.md           +N lines   — <what & why>
  frontend-gotchas.md   +N lines   — <what & why>
  BUGS.md               Open→Fixed — <ID>, commit pending
  test-cases/XX.md      +N TCs     — <IDs>
  changelog.md          +N lines   — <removed/renamed>
  NEW adr/ADR-NNN-xxx.md           — <decision>

Quality audit (Phase 3):
  ⚠ <file>:<line>  — <issue>
  ℹ <file>          — <note, non-blocking>

Memory proposals:
  UPDATE  <file>.md  — <change>
  NEW     <file>.md  — <topic>

Apply all? [y / n / edit]
```

User responds:
- `y` — apply everything.
- `n` — abort, no writes.
- `edit` — step through item-by-item, user accepts/rejects each.

### Phase 5 — Apply

For each approved item:
1. Use `Edit` (preferred) or `Write` (for brand-new ADR / PRD / memory files).
2. After edits: update `MEMORY.md` index if any memory file was created / renamed / removed.
3. Print one-line summary: `wrote N edits + M new files; K audit issues resolved; P pending user decisions`.
4. Leave working tree dirty. Do NOT commit.
5. If a bug-fix Fixed entry needs a commit SHA, leave `commit: pending` — it will be backfilled when the commit lands.

## Rules & guardrails

- **Never fabricate content.** If Phase 1 surfaced no concrete learning for a doc, do not write filler. Empty sections are fine.
- **One home per rule.** Pointer-only elsewhere.
- **No point-in-time counts.** Shape, not snapshot. Covered in Phase 3 audit.
- **Additive only for field removals.** Log in `changelog.md`; don't rewrite history in `entities.md`.
- **Never touch git state, deploy scripts, or CI config.** Markdown only.
- **User memory is separate** from project docs. Facts about the user → `~/.claude/projects/<slug>/memory/`. Facts about the project → `.claude/docs/`.
- **Respect CLAUDE.md brevity.** Additions to `CLAUDE.md` are Critical Rules only (things that break production if violated). Everything else → `.claude/docs/*`.
- **Respect the no-unsolicited-hints rule** if the project has one (common in UI-focused projects): when updating frontend docs, don't add explanatory copy to forms themselves — only to the doc.
