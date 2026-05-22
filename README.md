# claude-docs-mgmt

**Set-and-forget docs + memory framework for Claude Code projects.**
Hook-driven, zero dependencies, copied into your repo by an install
script. No plugin marketplace, no slash commands — everything runs
through hooks the moment you open Claude Code in the project.

> **Breaking change in 1.0.0.** This used to be a Claude Code plugin with
> `/init-docs` and `/docs-sync` slash commands. It is now a vendored
> framework you copy into your repo. The plugin format is gone. If you
> were on 0.x, see [Migration from 0.x](#migration-from-0x) below.

## What you get

After running `install.js` against your project:

```
<your project>/
├── CLAUDE.md                    # orientation, Critical Rules, pointers
├── BUGS.md                      # Open / Fixed (ID format, severity, templates)
├── TEST_CASES.md                # TC registry (P0/P1/P2, AUTO-BE/AUTO-FE/MANUAL)
├── ROADMAP.md                   # waves, parallel tracks, WONTFIX
├── test-cases/                  # per-feature manual test case files
└── .claude/
    ├── settings.json            # hook bindings
    ├── hooks/                   # 7 Node 18+ scripts, zero deps
    │   ├── _shared.js           # parseTranscript, detectPitfalls, etc.
    │   ├── session-start.js     # inject context, recurring-pitfall alerts, reflect reminder
    │   ├── session-end.js       # final snapshot, prune to newest 30
    │   ├── pre-compact.js       # snapshot + pitfall detect + dirty-tree gate
    │   ├── pre-tool-use.js      # block secret-file edits + catastrophic rm
    │   ├── post-tool-use.js     # project-specific nudges (you customise)
    │   └── user-prompt-submit.js # mid-session checkpoint every 20 msgs + memory-sync
    ├── docs/                    # the documentation framework
    │   ├── processes.md         # ★ how we work — Documentation Maintenance Rule, DoD, two-mode dev
    │   ├── code-standards.md    # ★ what we write — modularity, atomicity, TDD, anti-overengineering
    │   ├── architecture.md, entities.md, backend.md, ... (profile-dependent)
    │   ├── changelog.md
    │   ├── adr/                 # Architecture Decision Records (template + index)
    │   ├── prd/                 # Product Requirements Docs (template + index)
    │   └── domain/              # glossary, workflows
    ├── memory/                  # active project memory
    │   ├── MEMORY.md            # pointer-only index (≤200 lines)
    │   ├── current.md           # what we're doing right now (injected by session-start)
    │   └── todo-status.md       # open / done checklist
    ├── sessions/                # auto-captured by hooks (every 20 msgs, on compact, on session end)
    ├── learned/                 # auto-pitfall-YYYYMMDD.md from error→fix patterns
    └── state/                   # runtime state for hooks (gitignored)
```

Plus an appended `.gitignore` snippet that excludes `.claude/state/*.json`
and the one-shot `.claude/.docs-sync-skip` marker.

## Install

```bash
# 1. Clone the framework somewhere
git clone https://github.com/yeshcod/claude-docs-mgmt.git ~/code/claude-docs-mgmt

# 2. Run the installer pointed at your project
cd ~/code/your-project
node ~/code/claude-docs-mgmt/install.js

# Options:
#   --profile fullstack-web (default) | backend-only | library | mobile
#   --target /path/to/project           # default: cwd
#   --project-name "Acme ERP"           # override auto-detect (basename / package.json / git remote)
#   --force                             # overwrite existing files (default: skip)
#   --dry-run                           # print what would happen
#   --help
```

Then restart Claude Code in that project so hooks pick up.

## How it works — hooks, not commands

All automation runs through Claude Code's hook system. You never type a
slash command for docs / memory work.

| Event | Hook | What it does |
|---|---|---|
| `SessionStart` | `session-start.js` | Injects `memory/current.md`, pending handoffs, the newest session snapshot, recent pitfalls, recurring-pitfall alerts ("you hit this 3+ days running — promote to a CLAUDE.md rule"), reflect reminder, docs-framework presence. |
| `UserPromptSubmit` | `user-prompt-submit.js` | Every 20 messages: mid-session checkpoint into `sessions/`. Also surfaces `MEMORY.md` diffs and new handoffs to the assistant. |
| `PreToolUse` (Edit/Write/Bash) | `pre-tool-use.js` | Blocks edits to secret-looking files (`.env`, `*.pem`, `*credentials*`). Blocks catastrophic `rm -rf /`, `rm -rf ~`, `rm -rf /etc` etc. — narrowly, no false positives on `rm -rf /tmp/x`. |
| `PostToolUse` (Edit/Write) | `post-tool-use.js` | **You customise this file** with per-path nudges for your project layout. The default is silent. |
| `PreCompact` | `pre-compact.js` | Snapshot + pitfall detection. If `/compact` is manual AND tree is dirty AND `.claude/docs/` exists → blocks with instructions to run a docs-sync routing pass first. Bypass: `touch .claude/.docs-sync-skip`. |
| `Stop` / `SessionEnd` | `session-end.js` | Final session snapshot, prune `sessions/*-session.md` to newest 30. |

State lives in:

- `sessions/<date>-<id>-{session,compact,checkpoint}.md` — what happened.
- `sessions/project-index.md` — auto-maintained index of session files by project.
- `learned/auto-pitfall-YYYYMMDD.md` — patterns the hooks detected (retry ≥5×, error-then-fix, user-correction).
- `state/checkpoint.json`, `state/memory-sync.json`, `state/handoff-read.json` — runtime state, gitignored.

## What you write yourself

The hooks capture what happens; the docs framework is where you (and
the assistant) curate the durable knowledge. Three files do the most
work:

1. **`CLAUDE.md`** — under 250 lines. Critical Rules, architectural
   decisions, pointers into `.claude/docs/`. Open this first.
2. **`.claude/docs/processes.md`** — Documentation Maintenance Rule
   table (where each kind of learning goes), Definition of Done, two-mode
   dev process. The assistant reads this to route session learnings into
   the right docs.
3. **`.claude/docs/code-standards.md`** — 10 sections of opinionated
   defaults (project cleanliness, modularity, atomicity, reusability vs
   premature abstraction, naming, error handling, comments, TDD,
   refactor discipline, anti-overengineering). Trim what your team
   doesn't agree with.

## Profiles

| Profile | Adds (on top of the `_common` baseline) |
|---|---|
| `fullstack-web` (default) | `architecture`, `entities`, `frontend-gotchas`, `backend`, `ui-design-system`, `deploy`, `domain/glossary`, `domain/workflows` |
| `backend-only` | `architecture`, `entities`, `backend`, `deploy`, `domain/glossary` |
| `library` | `architecture`, `api-surface`, `release` |
| `mobile` | `architecture`, `entities`, `frontend-gotchas` (platform quirks), `backend` (if any), `ui-design-system`, `release`, `domain/glossary`, `domain/workflows` |

Switching profile after install means a follow-up `--force --profile <other>`
run + manual cleanup of stale docs the new profile doesn't include. There's
no migration helper.

## Philosophy

- **Docs live close to code.** `.claude/docs/*` is in git, edited
  alongside features, reviewed in PRs.
- **Single home per rule.** Duplication kills trust. The Documentation
  Maintenance Rule in `processes.md` enforces it.
- **No point-in-time counts.** Describe the shape, not the snapshot.
- **Code-derivable ≠ doc.** If `grep` answers it, don't write it down.
- **Memory ≠ project docs.** User-level preferences belong in
  `~/.claude/projects/<project>/memory/`. Project-level facts belong in
  this repo's `.claude/`.
- **Process and code-style live separately.** `processes.md` is about
  *how we work*; `code-standards.md` is about *what we write*. Mixing
  them rots both.
- **Ship opinions, not blanks.** The templates have real defaults.
  Trim what you don't agree with — but you don't start from a blank
  file.
- **No plugin, no slash commands, no Python.** Everything is in your
  repo, runs through Claude Code's native hooks, requires only Node 18+.

## Customising

- **`.claude/hooks/post-tool-use.js`** — the file most worth editing.
  Add per-path nudges so the assistant remembers adjacent checks ("DB
  schema changed → run a migration", "infra changed → deploy steps").
- **`.claude/docs/processes.md`** — adjust the Documentation Maintenance
  Rule table to your file layout.
- **`.claude/docs/code-standards.md`** — trim or amend the 10 sections
  to match what your team actually agrees on.
- **`.claude/settings.json`** — add more hooks if you want (linter,
  formatter on save, etc.) without touching this framework.

## Migration from 0.x

If you previously ran `/plugin install claude-docs-mgmt@...`:

1. `/plugin uninstall claude-docs-mgmt` in Claude Code.
2. Clone this repo somewhere (`~/code/claude-docs-mgmt`).
3. Run `node install.js --target /path/to/your-project --force` — overwrites
   the old templates with the new hook-driven framework.
4. Restart Claude Code.

The `processes.md`, `code-standards.md`, and root-level docs (`CLAUDE.md`,
`BUGS.md`, `TEST_CASES.md`, `ROADMAP.md`) are compatible with what 0.x
created — the install will just refresh them. New files: `.claude/hooks/*`,
`.claude/memory/*`, `.claude/sessions/`, `.claude/learned/`,
`.claude/state/`, `.claude/settings.json`.

## License

MIT. See [LICENSE](LICENSE).
