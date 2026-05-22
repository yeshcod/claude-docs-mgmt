# claude-docs-mgmt

**Opinionated project framework for Claude Code.** Bootstraps a project's
docs, ships defaults for *how to write code*, audits docs for drift, and
gates `/compact` until your docs reflect the session.

Three components, two skills, one hook:

- **`/init-docs`** — bootstrap a new project. Asks for a profile
  (`fullstack-web` / `backend-only` / `library` / `mobile`) + stack
  details, renders templates: `CLAUDE.md`, `BUGS.md`, `TEST_CASES.md`,
  `ROADMAP.md`, `.claude/docs/processes.md`, `.claude/docs/code-standards.md`,
  `.claude/docs/{architecture,entities,backend,frontend-gotchas,…}.md`,
  ADR + PRD templates.
- **`/docs-sync`** — session-end audit. Scans `git status` + the
  conversation, routes new learnings into the right doc per the project's
  `processes.md`, audits existing docs for drift / duplication / stale
  point-in-time counts, proposes a diff, applies on approval.
- **PreCompact hook** — blocks `/compact` on a dirty tree when the
  project uses this framework, forcing a `/docs-sync` round-trip before
  context is lost.

What makes the framework opinionated: every project ships with
**`.claude/docs/code-standards.md`** — a 10-section rulebook covering
project cleanliness, modularity, atomicity, naming, TDD discipline,
error handling at boundaries, refactor discipline, and anti-overengineering.
Trim what you don't agree with after install, but you don't start from a
blank file.

## Install

```bash
# Via marketplace (recommended — easy update path)
/plugin marketplace add https://github.com/yeshcod/claude-docs-mgmt.git
/plugin install claude-docs-mgmt@claude-docs-mgmt

# Or directly (no marketplace tracking)
/plugin install https://github.com/yeshcod/claude-docs-mgmt.git
```

Restart Claude Code. `/init-docs` and `/docs-sync` become available
globally.

## How it works

### `/init-docs` (new project bootstrap)

Run in an empty repo or one without `.claude/docs/`. Workflow:

1. Asks profile (`fullstack-web` / `backend-only` / `library` / `mobile`),
   project name, short tagline, stack details.
2. Renders `templates/<profile>/` into the project root + `.claude/docs/`,
   substituting `{{PROJECT_NAME}}`, `{{STACK_FRONTEND}}`,
   `{{STACK_BACKEND}}`, `{{STACK_DB}}`, `{{STACK_DEPLOY}}`,
   `{{CURRENT_DATE}}`, etc.
3. Copies shared templates from `_common/` regardless of profile:
   - `code-standards.md` → `.claude/docs/code-standards.md`
   - ADR template + index → `.claude/docs/adr/`
   - PRD template + index → `.claude/docs/prd/`
4. Merges `.claude/settings.json` non-destructively with
   profile-appropriate hooks (deny-`.env`-edit, UI / backend edit
   reminders, etc).
5. Appends `.claude/.docs-sync-skip`, `.claude/reports/`,
   `.claude/prototypes/`, `.claude/plans/`, `.claude/worktrees/` to
   `.gitignore`.
6. Prints a summary + next steps.

After: you have a full scaffold ready to fill in. The PreCompact hook
from the plugin now protects this project.

### `/docs-sync` (session-end audit)

Run in a project that already has `.claude/docs/`. Workflow:

1. **Reflect** — scans `git status`, `git diff --stat HEAD`, and the
   conversation for: code changes, new decisions, bugs, new
   entities/endpoints/fields, gotchas, deprecated features, migrations.
2. **Map** — uses the project's `.claude/docs/processes.md` (specifically
   the *Documentation Maintenance Rule* table) to decide which file each
   learning belongs in. Falls back to a sensible default if `processes.md`
   is missing.
3. **Audit** — checks existing docs for: stale point-in-time counts,
   duplicated rules across files, broken cross-references, orphaned
   ADRs, code-derivable content that should be deleted, MEMORY.md index
   drift, CLAUDE.md length budget.
4. **Propose** — prints a compact diff plan grouped by target file.
5. **Apply** — writes only the approved edits. Never commits (your
   SRE / CI owns commits).

Modes: `/docs-sync` (full), `/docs-sync dry-run`, `/docs-sync quick`
(capture only, skip audit), `/docs-sync audit` (audit only).

### PreCompact hook

Fires before every `/compact`. Logic:

- If `.claude/.docs-sync-skip` marker exists → remove marker, allow compact.
- If `.claude/docs/` doesn't exist → allow compact (framework not
  installed here, don't interfere).
- If `git status --porcelain` is empty → allow compact.
- Otherwise → block compact with exit 2, print instructions to run
  `/docs-sync` first.

Escape hatch: `touch .claude/.docs-sync-skip && /compact` — one-shot
skip for cases where the dirty tree is unrelated WIP.

## What every project gets

| File | Purpose |
|---|---|
| `CLAUDE.md` | Critical Rules + Documentation Maintenance mini-table + "where to look" table + `@`-eager imports of the docs |
| `BUGS.md` | Open / Fixed sections, ID format, severity scale, templated repro / root-cause / lesson / regression-TC blocks |
| `TEST_CASES.md` | TC format with priority (P0/P1/P2), type (Positive/Negative/Edge), status (`[AUTO-BE]`/`[AUTO-FE]`/`[MANUAL]`/`[NOT_COVERED]`/`[OBSOLETE]`) |
| `ROADMAP.md` | Current state, waves, parallel tracks, WONTFIX |
| `.claude/docs/processes.md` | **How we work** — Context Maintenance Rule, Documentation Maintenance Rule table, Definition of Done checklist, TC registry rules, two-mode workflow (small=direct, large=BA→UX+TL→DB+BE+FE→QA→Sec+TL→Acceptance→SRE) |
| `.claude/docs/code-standards.md` | **What we write** — project cleanliness, modularity, atomicity, reusability vs premature abstraction, naming, error handling, comments, TDD discipline, refactor discipline, anti-overengineering |
| `.claude/docs/changelog.md` | Cross-cutting behaviour-affecting changes |
| `.claude/docs/adr/` | Architecture Decision Records — template + README + index |
| `.claude/docs/prd/` | Product Requirements Docs — template + README |
| `.claude/settings.json` | Profile-appropriate hooks (merged non-destructively) |

## Profile-specific additions

| Profile | Adds (under `.claude/docs/`) |
|---|---|
| `fullstack-web` | `architecture`, `entities`, `frontend-gotchas`, `backend`, `ui-design-system`, `deploy`, `domain/glossary`, `domain/workflows` + `test-cases/` skeleton |
| `backend-only` | `architecture`, `entities`, `backend`, `deploy`, `domain/glossary` + `test-cases/` skeleton |
| `library` | `architecture`, `api-surface`, `release` |
| `mobile` | `architecture`, `entities`, `frontend-gotchas` (platform quirks), `backend` (if any), `ui-design-system`, `release`, `domain/glossary` + `test-cases/` skeleton |

## Philosophy

- **Docs live close to code.** `.claude/docs/*` is checked in, edited
  alongside features, reviewed in PRs.
- **Single home per rule.** Duplication kills trust. `/docs-sync`
  enforces it.
- **No point-in-time counts.** Describe the shape, not the snapshot —
  it drifts. (No "we have 5 tables" — the count is in the code.)
- **Code-derivable ≠ doc.** If `grep` answers it, don't write it down.
- **Memory ≠ project docs.** Facts about the *user* belong in
  `~/.claude/projects/<project>/memory/`, NOT in `.claude/docs/`. Facts
  about the *project* belong here.
- **Additive only.** Fields and rules are marked dormant, not deleted.
  Preserves rollback and traceability.
- **Process and code-style live separately.** `processes.md` is about
  *how we work*; `code-standards.md` is about *what we write*. Mixing
  them rots both — a teammate skimming for "how do I write a test"
  shouldn't have to scroll past "how does PR review work."
- **Ship opinions, not blanks.** The templates have real defaults
  (modularity, TDD, anti-overengineering). They're meant to be amended,
  not stared at — your first PR after `/init-docs` should trim the
  rules you don't agree with.

## License

MIT. See [LICENSE](LICENSE).
