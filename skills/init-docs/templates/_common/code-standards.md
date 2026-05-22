# Code Standards & Best Practices — {{PROJECT_NAME}}

The "how we write code" rulebook. Process is in `processes.md`; this file
is about the code itself. Everything here is enforceable in review — if
a diff violates one of these rules, point at the rule, not at preference.

## 1. Project cleanliness

- **One concern per file.** Don't grow a file past ~400 LOC if it's
  split-able by responsibility.
- **No "utils.ts" / "helpers.ts" / "misc/" dumping grounds.** If you
  need a helper, name it by what it does and put it next to its caller.
  Three helpers ≠ a `utils` module.
- **No commented-out code in commits.** If you'll need it later, git
  remembers. Commented blocks rot faster than active code.
- **No empty TODOs / FIXMEs.** Either file a `BUGS.md` entry, add to
  `ROADMAP.md`, or delete. A TODO without an owner is noise.
- **No dead code paths.** Delete unused exports, branches, parameters,
  imports the moment they become unused.
- **Generated / cache directories are gitignored.** Never commit
  `node_modules/`, `dist/`, `.next/`, `.turbo/`, `__pycache__/`,
  `target/`, build artifacts, IDE files, `.DS_Store`.
- **`.env` never committed.** `.env.example` is the contract. Real
  values live in deploy secrets.
- **`docs/` at repo root is for external-facing docs** (test cases,
  public READMEs). Internal docs live in `.claude/docs/`.

## 2. Modularity

- **A module exposes a small, intentional surface.** Default to
  `export` only what callers actually need. Internal helpers stay
  unexported.
- **Depend on abstractions at boundaries, on concretions inside.**
  Cross-module calls go through documented interfaces (function
  signatures, types). Inside a module, call concrete things directly.
- **No circular imports.** If module A imports from B and B imports
  from A, one of them needs to extract the shared piece into C.
- **A module should be deletable.** Renaming `featureX/` to
  `featureX.disabled/` shouldn't break unrelated code. If it does,
  the coupling is wrong.

## 3. Atomicity

- **One reason to change per file.** If you touch a file for two
  unrelated reasons in two consecutive PRs, it's two files.
- **Small, focused functions.** ~30 LOC is a comfortable ceiling for
  most function bodies. Past that, look for a sub-step to extract — but
  only if naming it adds clarity, not just lines.
- **One return type per function.** Don't return `Result | Error |
  null | undefined` — pick one error-handling shape and stick with it
  for the whole module.
- **Pure when possible.** If a function doesn't need I/O, don't give
  it I/O. Pure functions are testable, mockable, deletable.

## 4. Reusability vs premature abstraction

- **Three callsites is the rule of thumb.** First time: inline. Second
  time: notice the duplication, leave it. Third time: extract.
- **Three similar lines is better than a bad abstraction.** A wrong
  abstraction is more expensive than copy-paste. Don't generalise from
  two examples.
- **Don't design for hypothetical future requirements.** Build for what
  is, not what might be. Adding flexibility now usually adds
  complexity now and rarely matches the real need later.
- **Helpers stay local.** Move them to a shared file only when a second
  module actually imports them — not "in case someone needs it."
- **When extracting, name by behaviour, not by being.** `formatDate()`
  not `dateHelper()`. `validateUserInput()` not `userService()`.

## 5. Naming

- **What it does, not what it is.** `fetchUser` over `userService`.
  `parseCsv` over `csvUtils`. Names should answer "what happens when I
  call this" without reading the body.
- **Consistency across siblings.** If one route is `GET /users/:id`,
  the others are `GET /tickets/:id`, not `GET /ticket/by-id/:id`.
- **No abbreviations the team doesn't already use.** `usr`, `cfg`,
  `idx` are noise unless they're in the project's domain vocabulary
  (see `domain/glossary.md`).
- **Booleans are questions.** `isActive`, `hasPermission`, `shouldRetry`
  — not `active`, `permission`, `retry`.
- **No reserved-word collisions.** Avoid `Order`, `User`, `Type`,
  `Class` if your language treats them specially — name them with
  domain context (`PurchaseOrder`, `AppUser`).

## 6. Error handling & boundaries

- **Validate at system edges.** User input, HTTP request bodies,
  external API responses, file/DB reads — these get explicit validation
  (zod / pydantic / equivalent). Internal call sites trust types.
- **Don't catch what you can't handle.** A blanket `try/catch` that
  logs and continues is hiding bugs. Catch a specific error, fix or
  re-throw with context.
- **No fallbacks for "can't happen" cases.** If a value is unreachable,
  let the type system / assertion catch it. Don't add a default branch
  "just in case" — it dilutes intent.
- **Errors travel with context.** `throw new Error('failed')` is
  useless. `throw new Error('failed to load site ${slug}: ${reason}')`
  is actionable.
- **No silent swallows.** `catch {}` blocks need either a logged
  reason for ignoring or a comment explaining why silence is correct.

## 7. Comments

- **Default to no comments.** Well-named identifiers + clear structure
  beat comments. Removing a comment that just restates the code is a
  win.
- **Write a comment only when WHY is non-obvious.** Hidden constraints,
  subtle invariants, workarounds for specific bugs (link the bug),
  surprising behaviour. Anything that would make a cold reader pause.
- **Don't reference the current task in comments.** "Added for the
  X flow" / "used by Y" rots in 3 months. That belongs in the PR
  description.
- **TODO comments need a reference.** `// TODO(BUG-2026-01-12-03):
  retry with backoff` — anchored, traceable. Drifting TODOs are noise.
- **Multi-paragraph docstrings are usually wrong.** If a function
  needs 20 lines of doc, it probably needs to be split.

## 8. TDD discipline

- **Failing test first.** Write the assertion that proves what you want,
  watch it fail, then implement. The red-green discipline catches
  whole categories of "I thought this worked" bugs.
- **Tests live next to code.** `feature.test.ts` next to `feature.ts`
  in the same directory. E2E goes in a top-level `e2e/`.
- **One concept per test.** A test that asserts five things hides which
  one regressed when it fails. Split.
- **Test names describe behaviour, not implementation.** `creates a
  ticket with default status='queued'`, not `calls insertOne with
  status field`.
- **Tests are first-class code.** Same review bar, same naming
  discipline, no commented-out assertions.
- **Don't mock what you don't own.** Mocking the DB or the OS = you're
  testing the mock. Use a real test DB (transactional rollback per
  test) or an in-memory fake the project owns.
- **Coverage is a signal, not a goal.** 100% line coverage with bad
  assertions is worse than 70% with sharp ones.

## 9. Refactor discipline

- **Refactor in its own commit.** Mixing refactor and behaviour change
  in one diff makes both hard to review.
- **Tests stay green through every commit in a refactor.** No
  "refactor in flight, tests broken, will fix next commit." The branch
  is reviewable at any point.
- **Don't refactor unrelated code while fixing a bug.** Note it in
  `ROADMAP.md` or a follow-up issue; ship the bug fix narrow.
- **Backwards-compat hacks are not refactors.** Renaming `oldFoo` to
  `newFoo` while keeping `oldFoo` as a re-export is debt, not
  cleanup. Decide: rename and update callers, or don't rename.

## 10. Don't over-engineer

- **No abstractions without a second concrete use case.**
- **No config knobs without a second concrete consumer.** Flags / env
  vars / feature switches accumulate; each one is a permanent
  liability.
- **No half-finished implementations.** If a feature isn't done, hide
  it behind a flag and document the gap in `ROADMAP.md`. Don't merge
  "we'll come back to this" code unflagged.
- **No defensive code against impossible states.** Trust your types,
  your tests, and your invariants. Defensive checks at every layer
  obscure real intent.
- **Simpler shape first.** Reach for arrays before maps before classes
  before frameworks. Add structure only when the simpler shape can't
  carry the requirements.

## How this file gets enforced

- **PR self-check.** Before opening, scan the diff against this list.
  The reviewer assumes you did.
- **Review checklist.** During review, cite the section number —
  "section 4: this is a one-callsite abstraction, inline it" beats
  "I don't like this." Concrete > taste.
- **`/docs-sync` audit.** When run, it checks docs against
  code-derivable / point-in-time / duplication rules. Code-standards
  violations surface in review, not in the audit — the audit is for
  drift, not style.
- **CI.** Linter handles mechanical rules (naming, imports, dead
  code). The rest is human review.
