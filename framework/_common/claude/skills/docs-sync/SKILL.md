---
name: docs-sync
description: Reconcile docs with what actually changed this session — route changes to their target docs, audit for drift, capture learnings. Run before /clear or /compact.
user-invocable: true
---

# /docs-sync — Documentation Reconcile Pass

Check whether the docs still describe reality, fix them where they don't, and capture what this session learned before the context goes away.

This is the automation behind the **Documentation Maintenance Rule** enforcement line in `.claude/docs/processes.md` ("before closing a session, verify doc updates exist for every non-trivial change").

## Usage
```
/docs-sync          — reconcile docs against this session's changes
/docs-sync audit    — drift audit only (no routing of session changes)
```

Run it **before `/clear` or `/compact`**, and before handing a branch to the `sre` agent. After a compact or clear, the session's reasoning is gone and only the diff remains — routing changes to docs is far more expensive from a cold read.

## Process

### Phase 1: Establish what changed

Determine the session's real surface area — don't rely on memory of the conversation:

```
git status --porcelain
git diff --stat
git log --oneline <base>..HEAD    # if commits landed this session
```

Ignore the framework's own runtime artefacts — `.claude/sessions/`, `.claude/learned/`, `.claude/state/` are written by hooks every turn and are never doc-drift signals.

For each remaining changed file, classify it against the decision → target-doc mapping in `.claude/docs/processes.md` → **Documentation Maintenance Rule**. That table is the source of truth; do not re-derive the mapping here. Typical routing:

| What changed in the diff | Target doc |
|---|---|
| New model/entity or a field on one | `.claude/docs/entities.md` |
| New endpoint / route | `.claude/docs/entities.md` + `TEST_CASES.md` |
| New service, permission rule | `.claude/docs/backend.md` |
| New frontend convention / gotcha | `.claude/docs/frontend-gotchas.md` |
| New design token / visual rule | `.claude/docs/ui-design-system.md` |
| CI / deploy / migration change | `.claude/docs/deploy.md` |
| An architectural choice ("X because Y, not Z") | new `.claude/docs/adr/ADR-NNN-*.md` |
| Domain term or workflow clarified | `.claude/docs/domain/{glossary,workflows}.md` |
| Bug fixed | `BUGS.md` FIXED + regression TC |
| Feature removed / migration completed / rename | `.claude/docs/changelog.md` |
| A rule that spans files | relevant doc + `CLAUDE.md` Critical Rules |

### Phase 2: Route the gaps

For every change with no corresponding doc update, write it — in the same session, per the Documentation Maintenance Rule. Report each one as `<changed thing> → <doc updated>` so the user can see the routing decisions, not just a count.

Two judgement calls worth making explicitly:
- **A decision with no code** still lands (an ADR for a choice made, a `ROADMAP.md` line for something deliberately deferred, a `BUGS.md` entry for something noticed but not fixed). Sessions lose these first.
- **A trivial change routes nowhere.** A typo fix or a formatting pass has no doc consequence. Don't manufacture entries — noise costs more than a missing line about nothing.

### Phase 3: Drift audit

Audit the docs against the "What NOT to write in docs" rules in `.claude/docs/processes.md`. Flag:
- **Code-derivable content** — file listings, function signatures, directory trees. It rots the moment code moves; delete it and point at the code.
- **Point-in-time counts** — "42 tests", "13 entities", "3 services". Describe the shape, not the snapshot.
- **Duplication across docs** — the same rule stated in two places drifts into two contradicting rules. Pick one home, link from the others.
- **Stale references** — links to renamed/deleted files, docs describing removed features, examples using retired routes.

This audit is for **drift, not style**. Code-standards violations are review's job, not this pass's (`.claude/docs/code-standards.md` → "How this file gets enforced").

### Phase 4: Capture learnings

Before the context is discarded:
- Non-obvious behaviour discovered while debugging → the relevant `.claude/docs/*`, next to the rule it qualifies.
- A pitfall worth not repeating → `.claude/learned/`.
- Current state of the world / what's in flight → `.claude/memory/current.md` + `.claude/memory/todo-status.md`.

Prefer the durable doc over the memory file when a learning is a rule rather than a status — memory is for "where we are", docs are for "how this works".

### Phase 5: Report

```markdown
## docs-sync — YYYY-MM-DD

**Routed**: N changes → M docs
- <changed thing> → <doc>

**Drift fixed**: N
- <doc>: <what was stale>

**Captured**: <learnings / memory updates>

**No doc needed**: <trivial changes, with a one-line why>

**Gate**: clean / dirty (see below)
```

## The pre-compact gate

`.claude/hooks/pre-compact.js` blocks a **manual** `/compact` when the git tree is dirty and `.claude/docs/` exists (runtime artefacts under `.claude/{sessions,learned,state}/` are excluded). Automatic compaction is never blocked.

**Be precise about what clears it: the gate keys on a clean tree, not on this skill having run.** Running `/docs-sync` writes docs, which leaves the tree *dirtier*, not cleaner. So finishing this pass does not by itself unblock `/compact`. The two honest exits:

1. **Commit the work** — hand the branch to the `sre` agent (Claude never commits; see `.claude/docs/processes.md` → Always-on rules). A clean tree passes the gate.
2. **One-shot bypass** — when work is legitimately still in flight and the context must be compacted now:
   ```
   touch .claude/.docs-sync-skip && /compact
   ```
   The marker is consumed on the next manual compact — it bypasses once, not permanently.

Use the bypass after actually doing the pass, not instead of it. The gate exists to make the reconcile happen while the reasoning is still in context; a reflexive `touch` defeats the only mechanism the framework has for that.

## Rules
- **Route by the mapping table, not by instinct** — `processes.md` owns it; this skill applies it.
- **Same session, or it doesn't happen.** The rule is same-session on purpose.
- **Fix drift you find, don't just list it** — a report of stale docs that stays stale is a slower way of leaving them stale.
- **Never delete a test case** — mark `[OBSOLETE]` with a replacement link (Test Case Registry Rule).
- **This skill writes docs, never code.** A doc that has to describe broken behaviour is signalling a bug — file it in `BUGS.md` and leave the code alone.
- **Never commit.** The `sre` agent owns commits, including doc-only ones.
