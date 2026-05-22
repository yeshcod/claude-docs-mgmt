# Architectural Decision Records (ADRs)

Short, dated records of architectural choices and their rationale. One file per decision.

## Naming

`ADR-NNN-slug.md` — `NNN` is a zero-padded sequence (`001`, `002`, ...). `slug` is 3-5 hyphenated words, lowercase.

## When to write an ADR

- We chose X over Y, and the reason isn't obvious from the code.
- We adopted a convention or rule that future contributors must follow.
- We made a trade-off that will surprise someone reading the code cold.

Do NOT write an ADR for:
- Implementation details (belongs in inline comments or the relevant doc).
- Library selection without rationale (just update the dependency doc).
- Short-term workarounds (note in the affected code with a TODO).

## Index

<!-- Add one line per ADR as they're created. -->

- [ADR-000 template](ADR-000-template.md) — not a real ADR, the template for new ones.
