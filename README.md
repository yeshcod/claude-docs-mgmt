# claude-docs-mgmt

**Set-and-forget docs + memory framework for Claude Code projects.**
Vendored agents, skills, and hooks — zero dependencies, copied into your
repo by an install script. No plugin marketplace: everything lives in
your repo, in git, reviewable in PRs, and works the moment you open
Claude Code in the project.

Three layers, one install:

- **Hooks** run automatically — context injection, session capture,
  pitfall detection, secret-file guards. You never invoke them.
- **Agents** (`.claude/agents/`) are the specialist team the
  `processes.md` pipeline delegates to — BA, tech-lead, security, SRE, …
- **Skills** (`.claude/skills/`) are the entry points you *do* type —
  `/develop`, `/audit`, `/refactor`, `/code-review`, `/docs-sync`.

> **1.0.0 dropped the plugin format.** This used to be a Claude Code
> plugin installed from a marketplace. It is now a vendored framework you
> copy into your repo — that part hasn't changed and won't. If you were on
> 0.x, see [Migration from 0.x](#migration-from-0x) below.
>
> **1.1.0 adds the agent team and brings skills back as vendored files.**
> 1.0.0 removed the `/init-docs` and `/docs-sync` slash commands along with
> the plugin. Slash commands themselves were never the problem — the
> *marketplace* was. Skills now ship as plain files in your repo (so
> `/docs-sync` is back, alongside `/develop`, `/audit`, `/refactor`,
> `/code-review`), and the 11 agents they orchestrate ship with them.
> Additive and non-breaking: existing installs are untouched until you
> re-run the installer, which skips existing files unless `--force`.
>
> **1.2.0 makes "the SRE agent owns commits and deploys" enforceable.**
> Until now that rule was prose, and prose does not stop a `git commit`.
> [`delegation-guard.js`](#the-delegation-guard) blocks `git commit`,
> `git push`, `ssh`, `scp`, `rsync` and `pm2` everywhere except the `sre`
> agent — and it **ships registered and enabled**, because a guard you
> have to switch on is one more thing to forget. It is a *workflow* guard
> and [fails open](#the-delegation-guard) by design.
>
> *Upgrading from 1.1.0?* **Nothing changes for you until you opt in.**
> Re-running the installer copies the guard file in, but skips your
> existing `settings.json` — so the guard is never registered and stays
> **inert**. To actually enable it, add the one `PreToolUse` block from
> [Disabling](#the-delegation-guard) (read in reverse) to your
> `settings.json` by hand. Only fresh installs get it switched on.
>
> New to hooks — or wondering why a hook of yours never fires? The new
> [Writing hooks](#writing-hooks) section is the part worth reading.

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
    ├── agents/                  # ★ the specialist team (profile-dependent, 5–11 files)
    │   ├── business-analyst.md, tech-lead.md, security-reviewer.md
    │   ├── qa-automation.md, sre.md            # ← universal (every profile)
    │   ├── backend-engineer.md, db-architect.md
    │   └── frontend-engineer.md, ux-designer.md, design-system-guard.md, qa-manual.md
    ├── skills/                  # ★ the commands you type
    │   ├── develop/             # full pipeline: BA → UX + tech-lead → impl → QA → review → SRE
    │   ├── audit/               # security + quality + design, parallel
    │   ├── refactor/            # safe refactor pipeline
    │   ├── code-review/         # full-stack review → refactoring plan
    │   └── docs-sync/           # route session learnings into the right docs
    ├── hooks/                   # 8 Node 18+ scripts, zero deps
    │   ├── _shared.js           # parseTranscript, detectPitfalls, etc.
    │   ├── session-start.js     # inject context, recurring-pitfall alerts, reflect reminder
    │   ├── session-end.js       # final snapshot, prune to newest 30
    │   ├── pre-compact.js       # snapshot + pitfall detect + dirty-tree gate
    │   ├── pre-tool-use.js      # block secret-file edits + catastrophic rm
    │   ├── delegation-guard.js  # ★ enforce "sre owns commit/deploy" (tune or remove)
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

## How it works — hooks run themselves

The docs/memory automation runs through Claude Code's hook system. You
never type a command to get context injected, sessions captured, or
pitfalls detected — that layer is invisible and always on. (Skills, the
part you *do* type, are covered [below](#skills).)

| Event | Hook | What it does |
|---|---|---|
| `SessionStart` | `session-start.js` | Injects `memory/current.md`, pending handoffs, the newest session snapshot, recent pitfalls, recurring-pitfall alerts ("you hit this 3+ days running — promote to a CLAUDE.md rule"), reflect reminder, docs-framework presence. |
| `UserPromptSubmit` | `user-prompt-submit.js` | Every 20 messages: mid-session checkpoint into `sessions/`. Also surfaces `MEMORY.md` diffs and new handoffs to the assistant. |
| `PreToolUse` (Edit/Write/Bash) | `pre-tool-use.js` | Blocks edits to true secret files — dotenv, private keys (`*.pem`, `*.key`, `*.p12`, `id_rsa`), and secret *data* files (`credentials.yml`, `secrets.json`). Extension-aware, so real source like `PasswordModal.jsx` or `updatePassword.js` stays editable. Blocks catastrophic `rm -rf /`, `rm -rf ~`, `rm -rf /etc` — narrowly, no false positives on `rm -rf /tmp/x`. |
| `PreToolUse` (Bash) | `delegation-guard.js` | **Enforces `processes.md`: the `sre` agent owns commit + deploy.** Blocks `git commit`, `git push`, `ssh`, `scp`, `rsync`, `pm2` unless the caller is the `sre` subagent. Matches at command position, so `grep ssh notes.txt` is fine. [Tune or remove it →](#the-delegation-guard) |
| `PostToolUse` (Edit/Write) | `post-tool-use.js` | **You customise this file** with per-path nudges for your project layout. Ships one live example (`.claude/` config edited → restart to pick up). [How to write one that actually works →](#writing-hooks) |
| `PreCompact` | `pre-compact.js` | Snapshot + pitfall detection. If `/compact` is manual AND tree is dirty AND `.claude/docs/` exists → blocks with instructions to run a docs-sync routing pass first. Bypass: `touch .claude/.docs-sync-skip`. |
| `Stop` / `SessionEnd` | `session-end.js` | Final session snapshot, prune `sessions/*-session.md` to newest 30. |

State lives in:

- `sessions/<date>-<id>-{session,compact,checkpoint}.md` — what happened.
- `sessions/project-index.md` — auto-maintained index of session files by project.
- `learned/auto-pitfall-YYYYMMDD.md` — patterns the hooks detected (retry ≥5×, error-then-fix, user-correction).
- `state/checkpoint.json`, `state/memory-sync.json`, `state/handoff-read.json` — runtime state, gitignored.

## Writing hooks

Everything below was learned the hard way: this framework's own hooks were
**placebo for a long time** — registered, running, exiting 0, doing nothing.
They were written against environment variables that Claude Code does not
set. If your hook "silently does nothing", the answer is almost certainly
in this section.

### 1. The payload arrives on stdin, as JSON

There is **no `$CLAUDE_FILE_PATH`, no `$CLAUDE_TOOL_INPUT`, no
`$CLAUDE_COMMAND`.** A hook written against those reads an empty string,
matches nothing, and exits 0 — it looks like it works and never fires.
That single mistake is what made our nine hooks placebo.

The **only** environment variables Claude Code sets are:

| Var | Meaning |
|---|---|
| `CLAUDE_PROJECT_DIR` | Absolute path to the project root. The one you actually want. |
| `CLAUDE_PLUGIN_ROOT` | Plugin install dir (plugin-provided hooks only). |
| `CLAUDE_PLUGIN_DATA` | Plugin data dir. |
| `CLAUDE_EFFORT` | Current reasoning-effort setting. |
| `CLAUDE_CODE_REMOTE` | Set when running remotely. |
| `CLAUDE_CODE_BRIDGE_SESSION_ID` | Bridge session id. |

Everything else comes in on **stdin**. Read and parse it:

```js
const { readJsonStdin } = require('./_shared');   // handles the parse + fail-open
const input = await readJsonStdin();
const cmd = input.tool_input?.command;            // ← this is where the data lives
```

Observed keys on a **PreToolUse / Bash** payload:

```
session_id, transcript_path, cwd, prompt_id, permission_mode,
agent_id, agent_type, effort, hook_event_name,
tool_name, tool_input, tool_use_id
```

**PostToolUse** adds `tool_response` and `duration_ms`.

`tool_input` is the tool's own argument object — `{command}` for Bash,
`{file_path, old_string, new_string}` for Edit, and so on.

> Debugging tip: if you're unsure of a payload's shape, dump it —
> `require('fs').appendFileSync('/tmp/hook.json', JSON.stringify(input) + '\n')`
> — then trigger the tool once and read the file. Ten seconds, no guessing.

### 2. Blocking requires `exit 2`

| Exit code | Effect |
|---|---|
| `0` | Allow. stdout may carry a JSON envelope (see below). |
| `1` | **Non-blocking error.** Prints, then runs the command anyway. |
| `2` | **Block.** stderr is fed back to the model so it can self-correct. |

`exit 1` is the trap here: it looks like enforcement and isn't. If you mean
"stop", you must `exit 2` — and the stderr text should say what to do
instead, because the model reads it.

### 3. PostToolUse: stderr never reaches the model

A PostToolUse hook that writes to stderr and exits 0 reaches the
**transcript** but **never enters the model's context**. You can watch the
text appear in your terminal and still have the assistant behave as though
nothing was said — because, to the assistant, nothing was.

To actually nudge the model, print a JSON envelope on **stdout**:

```js
process.stdout.write(JSON.stringify({
  hookSpecificOutput: {
    hookEventName: 'PostToolUse',
    additionalContext: '- schema changed — run migrations + update entities.md.',
  },
}) + '\n');
process.exit(0);
```

`post-tool-use.js` ships an `emitContext()` helper that does exactly this —
use it rather than reaching for `console.error`. This matters because that
file is the one the framework explicitly invites you to customise; the
invitation used to lead straight into this trap.

### 4. Telling main-loop calls from subagent calls

The payload distinguishes who is calling:

| Key | Main loop | Subagent |
|---|---|---|
| `agent_id` | `null` | the agent's id |
| `agent_type` | `null` / absent | the agent's name, e.g. `"sre"` |

So `input.agent_type === 'sre'` is a reliable "this is the SRE agent"
check, and a missing `agent_type` means the orchestrator itself. That one
field is what makes role-based enforcement possible — it's how the
delegation guard exempts `sre` while blocking everyone else.

### The delegation guard

`processes.md` and `sre.md` both say the SRE agent owns commit, push, and
deploy, and that the orchestrator never commits. `delegation-guard.js` is
what makes that true instead of aspirational — **it ships registered and
enabled.**

**What it blocks** (only outside the `sre` agent):

| Default | Why |
|---|---|
| `git commit`, `git push` | The rule the framework already states. |
| `ssh`, `scp`, `rsync` | How a deploy reaches a server. |
| `pm2` | Stack-specific default — process management. |

Matching is at **command position**, so real work isn't disrupted:

| Command | Result |
|---|---|
| `git commit -m "x"` | blocked |
| `cd /x && git push` | blocked |
| `git -C /path commit` | blocked (leading flags handled) |
| `$(ssh host)`, `sudo pm2 restart` | blocked |
| `grep ssh notes.txt` | **allowed** |
| `echo 'git push'` | **allowed** |
| `cat ~/.ssh/config` | **allowed** |

**When it blocks**, the model is told to delegate via the Agent tool with
`subagent_type=sre` — so in practice the pipeline routes itself rather than
dead-ending.

**Tuning** — edit the `BLOCKED_COMMANDS` array at the top of
`.claude/hooks/delegation-guard.js`. `docker`, `kubectl`, `fly`, `vercel`
and `terraform` are listed there, commented out. Note that `docker` is also
an everyday *local-dev* command (`docker ps`, `compose up`) — enabling it
blocks more than deploys.

**Disabling** — delete the one block from `.claude/settings.json`:

```json
{ "matcher": "Bash", "hooks": [{ "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/delegation-guard.js\"" }] }
```

...or delete the file. Nothing else depends on it.

**It fails open, by design.** A malformed payload, a parse failure, a
non-Bash tool, an internal error — all exit 0 (allow). This is a *workflow*
guard, not a security boundary: a bug in it must never be able to wedge a
session. The actual security layer is `pre-tool-use.js` (secret files,
catastrophic `rm -rf`), which is separate and unaffected.

**Known limitation (accepted, fails safe):** a backtick counts as a
command-position opener — it has to, or `` `ssh host` `` would slip
through. The cost is that *prose* containing a backticked blocked command
inside a Bash argument gets blocked too:

```bash
echo "next step: run `git push` to ship"   # ← blocked, though it's just text
```

Write that text with the Write tool instead of passing it as a Bash
argument. The guard errs toward blocking, never toward missing — which is
the right side to err on for a guard you can't see working.

## Agent team

`processes.md` describes a development pipeline — BA writes the PRD, UX
and tech-lead work in parallel, engineers implement, QA verifies, security
reviews, SRE deploys. **Until 1.1.0 that pipeline was prose the framework
couldn't actually deliver**: the docs named roles that didn't exist, so
every phase collapsed back onto one generalist assistant. The agents are
what make it real — each is a subagent definition with its own system
prompt, tool access, and review bar.

| Agent | Role | Pipeline phase |
|---|---|---|
| `business-analyst` | Requirements, clarifying questions, PRD | 1 |
| `ux-designer` | UI/UX proposal + clickable prototype | 2 |
| `tech-lead` | Architecture, task breakdown, code review, ADRs | 2 + 5 |
| `db-architect` | Schema, indexes, migrations | 3 |
| `backend-engineer` | Models, controllers, routes | 3 |
| `frontend-engineer` | Pages, components, config | 3 |
| `qa-automation` | Automated tests | 4 |
| `qa-manual` | UI verification in a real browser | 4 |
| `security-reviewer` | OWASP Top 10, auth, permissions, data exposure | 5 |
| `design-system-guard` | Fast design-rule enforcement on frontend edits | on edit |
| `sre` | Deploy, migrations, rollback plan | 7 |

Five are **universal** — `business-analyst`, `tech-lead`,
`security-reviewer`, `qa-automation`, `sre`. The rest are installed only
where they make sense:

| Profile | Agents installed |
|---|---|
| `fullstack-web` | all 11 |
| `mobile` | all 11 |
| `backend-only` | 7 — universal + `backend-engineer`, `db-architect` |
| `library` | 5 — universal only |

The agent files live in a single source (`framework/_agents/`) and are
selected per profile at install time, not duplicated. They ship with the
same opinions as the docs — **`sre.md` owns commit/push/deploy, and the
orchestrator is told not to run those itself.** Read it before your first
deploy and adjust to your infrastructure.

## Skills

Skills are the entry points you type. They ship as plain files in your
repo (`.claude/skills/`) — no marketplace, no install step beyond the
copy, and you can edit them like any other file.

| Skill | What it does |
|---|---|
| `/develop <feature>` | Large-task orchestrator — runs the full 7-phase pipeline across the agent team, parallelising independent work. |
| `/audit` | Full-project audit: security + quality + design, three agents in parallel. Findings land in `BUGS.md` / `TEST_CASES.md`. |
| `/refactor <target>` | Safe refactoring pipeline — plan, implement, test, review. |
| `/code-review` | Full-stack review producing a refactoring plan. |
| `/docs-sync` | Routes session learnings into the right docs per the Documentation Maintenance Rule. |

Rule of thumb: **small task → edit directly; large task → `/develop`.**
`processes.md` defines the boundary and the Definition of Done both modes
have to satisfy.

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

The profile also selects the agent team — see [Agent team](#agent-team).
`_common` (hooks, skills, processes, code-standards, memory scaffolding)
is installed for every profile.

Switching profile after install means a follow-up `--force --profile <other>`
run + manual cleanup of stale docs and agents the new profile doesn't
include. There's no migration helper.

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
- **No plugin, no marketplace, no Python.** Everything — hooks, agents,
  skills — is a plain file in your repo, running on Claude Code's native
  primitives and requiring only Node 18+. Vendored beats installed: you
  can read it, diff it, edit it, and it can't change under you.
- **Documented process needs an executor.** A pipeline no agent can run is
  wishful prose. If the docs name a role, the framework ships that role.

## Customising

- **`.claude/hooks/post-tool-use.js`** — the file most worth editing.
  Add per-path nudges so the assistant remembers adjacent checks ("DB
  schema changed → run a migration", "infra changed → deploy steps").
  Read [Writing hooks](#writing-hooks) first — a nudge on stderr never
  reaches the model; it has to go out as `additionalContext` on stdout.
- **`.claude/hooks/delegation-guard.js`** — ships **enabled**: only the
  `sre` agent may run `git commit` / `git push` / `ssh` / `scp` / `rsync` /
  `pm2`. Tune `BLOCKED_COMMANDS` at the top of the file, or remove the one
  block from `settings.json` to switch it off. See
  [The delegation guard](#the-delegation-guard).
- **`.claude/docs/processes.md`** — adjust the Documentation Maintenance
  Rule table to your file layout.
- **`.claude/docs/code-standards.md`** — trim or amend the 10 sections
  to match what your team actually agrees on.
- **`.claude/agents/sre.md`** — ships with opinions about deploy safety
  and owns commit/push/deploy. Point it at your real infrastructure
  before the first deploy.
- **`.claude/agents/*.md`** — adjust each role's review bar, or delete
  the ones your team doesn't want. They're plain files.
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
`.claude/agents/*`, `.claude/skills/*`, `.claude/memory/*`,
`.claude/sessions/`, `.claude/learned/`, `.claude/state/`,
`.claude/settings.json`.

Coming from 1.0.0 instead? `node install.js --target /path/to/project`
adds the agents and skills without touching anything you've customised —
existing files are skipped unless you pass `--force`.

## License

MIT. See [LICENSE](LICENSE).
