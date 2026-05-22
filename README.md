# claude-docs-mgmt

Documentation framework + audit for Claude Code projects. Two skills, one hook:

- **`/docs-sync`** — session-end audit. Scans the current session, maps changes to your project's Documentation Maintenance Rule, audits existing docs for drift/duplication/stale facts, proposes a diff, applies after approval. Use before `/clear` or `/compact`.
- **`/init-docs`** — bootstrap a new project's doc framework. Four profiles (`fullstack-web`, `backend-only`, `library`, `mobile`), asks for project name + stack, copies + renders templates: `CLAUDE.md`, `BUGS.md`, `TEST_CASES.md`, `ROADMAP.md`, `.claude/docs/*`, ADR/PRD templates.
- **PreCompact hook** — blocks `/compact` on a dirty tree when the project uses this framework (detected via `.claude/docs/` existence), forcing a `/docs-sync` round-trip before context is lost.

## Install

```bash
# Via marketplace (recommended — easy update path)
/plugin marketplace add https://github.com/yeshcod/claude-docs-mgmt.git
/plugin install claude-docs-mgmt@claude-docs-mgmt

# Or directly (no marketplace tracking)
/plugin install https://github.com/yeshcod/claude-docs-mgmt.git
```

Restart Claude Code. The `/docs-sync` and `/init-docs` commands become available globally.

## How it works

### `/docs-sync` (session-end audit)

Run in a project that already has `.claude/docs/`. Workflow:

1. **Reflect** — scans `git status`, `git diff --stat HEAD`, and the conversation for: code changes, new decisions, bugs, new entities/endpoints/fields, gotchas, deprecated features, migrations.
2. **Map** — uses the project's `.claude/docs/processes.md` (specifically the Documentation Maintenance Rule table) to decide which file each learning belongs in. Falls back to a sensible default if `processes.md` is missing.
3. **Audit** — checks existing docs for: stale point-in-time counts, duplicated rules across files, broken cross-references, orphaned ADRs, code-derivable content that should be deleted, MEMORY.md index drift, CLAUDE.md length budget.
4. **Propose** — prints a compact diff plan grouped by target file.
5. **Apply** — writes only the approved edits. Never commits (your SRE / CI owns commits).

Modes: `/docs-sync` (full), `/docs-sync dry-run`, `/docs-sync quick` (capture only, skip audit), `/docs-sync audit` (audit only).

### `/init-docs` (new project bootstrap)

Run in an empty repo (or a repo that doesn't yet have `.claude/docs/`). Workflow:

1. Asks profile: `fullstack-web` / `backend-only` / `library` / `mobile`.
2. Asks project name + stack details (frontend framework, backend language/framework, database, deploy target, etc. — profile-specific).
3. Copies the matching `templates/<profile>/` tree into the project root, renders placeholders (`{{PROJECT_NAME}}`, `{{STACK_FRONTEND}}`, `{{STACK_BACKEND}}`, `{{STACK_DB}}`, `{{STACK_DEPLOY}}`, `{{CURRENT_DATE}}`).
4. Creates `.claude/settings.json` with profile-appropriate hooks (prettier auto-format, deploy-command block, etc.).
5. Creates `.gitignore` entries for `.claude/.docs-sync-skip`.

After: you have a full doc skeleton ready to fill in. The `PreCompact` hook from the plugin now protects this project.

### PreCompact hook

Fires before every `/compact`. Logic:
- If `.claude/.docs-sync-skip` marker exists in the project → remove marker, allow compact.
- If `.claude/docs/` doesn't exist in the project → allow compact (framework not installed here, don't interfere).
- If `git status --porcelain` is empty (clean tree) → allow compact.
- Otherwise → block compact with exit 2, print instructions to run `/docs-sync` first.

Escape hatch: `touch .claude/.docs-sync-skip && /compact` — one-shot skip for cases where the dirty tree is unrelated WIP.

## Profiles

All profiles include:
- **Root**: `CLAUDE.md`, `BUGS.md`, `TEST_CASES.md`, `ROADMAP.md`
- **`.claude/docs/`**: `processes.md` (how we work — Documentation Maintenance Rule, Definition of Done, two-mode dev process), `code-standards.md` (how we write code — modularity, atomicity, naming, TDD discipline, project cleanliness, anti-overengineering), `changelog.md`, `adr/` (ADR template + index), `prd/` (PRD template + index)

| Profile | Adds |
|---|---|
| `fullstack-web` | `architecture.md`, `entities.md`, `frontend-gotchas.md`, `backend.md`, `ui-design-system.md`, `deploy.md`, `domain/glossary.md`, `domain/workflows.md`, `test-cases/` skeleton |
| `backend-only` | `architecture.md`, `entities.md`, `backend.md`, `deploy.md`, `domain/glossary.md`, `test-cases/` skeleton |
| `library` | `architecture.md`, `api-surface.md`, `release.md` |
| `mobile` | `architecture.md`, `entities.md`, `frontend-gotchas.md` (platform quirks), `backend.md` (if any), `ui-design-system.md`, `release.md`, `domain/glossary.md`, `test-cases/` skeleton |

## Philosophy

- **Docs live close to code**. `.claude/docs/*` is checked in.
- **Single home per rule**. Duplication kills trust. `/docs-sync` enforces it.
- **No point-in-time counts**. Describe the shape, not the snapshot — it drifts.
- **Code-derivable ≠ doc**. If `grep` answers it, don't write it down.
- **Memory ≠ project docs**. Facts about the user belong in `~/.claude/projects/<project>/memory/`, NOT in `.claude/docs/`.
- **Additive only**. Fields/rules are marked dormant, not deleted. Preserves rollback.
- **Process and code-style live separately**. `processes.md` is about *how we work*; `code-standards.md` is about *what we write*. Mixing them rots both — a teammate skimming for "how do I write a test" shouldn't have to scroll past "how does PR review work."
- **Ship opinions, not blanks**. The templates have real defaults (modularity, TDD, anti-overengineering). They're meant to be amended, not stared at — your first PR after `/init-docs` should trim the rules you don't agree with.

## License

MIT. See [LICENSE](LICENSE).
