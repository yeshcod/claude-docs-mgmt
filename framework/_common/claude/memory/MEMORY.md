# Memory index

Pointer-only. Content lives in spoke files in this directory.
**Max 200 lines** (warn at 170). When the index gets long, prune
pointers to merged/archived content.

## Active

- [current.md](current.md) — what the assistant is doing right now;
  injected at session start.
- [todo-status.md](todo-status.md) — open / done checklist for the
  current focus area.

## Handoffs

(none active)

Handoff files follow `handoff-<topic>.md` — written at the end of a
session when work is incomplete and needs to be picked up later. They
disappear from this index once their content is folded into a doc or
the work is closed.

## Archive

(none)

When a spoke file is no longer load-bearing for ongoing work, move its
pointer to Archive instead of deleting — the file stays, the index just
de-emphasises it.
