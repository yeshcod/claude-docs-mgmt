# Architecture — {{PROJECT_NAME}}

## Stack
- **Language**: {{STACK_LANGUAGE}}.
- **Package manager / distribution**: {{STACK_PACKAGE_MANAGER}}.
- **Runtime baseline**: <min supported version>.

## Layout

```
<project-root>
├── src/             # library source
├── tests/           # automated tests
├── examples/        # runnable examples for users (optional)
├── scripts/         # dev scripts (build, lint, release)
└── .claude/         # project docs + hooks + skills
```

## Module boundaries

<!-- Describe what's public vs internal. Example:

  - `src/index.ts`      — public barrel; re-exports everything users can import.
  - `src/internal/*`    — private; must NEVER be imported by users (no re-export).
  - `src/types.ts`      — public types, exported from barrel.
  - `src/errors.ts`     — custom error classes; exported.

-->

## Dependency policy

- **Runtime deps**: <list of hard dependencies + why each is needed>.
- **Peer deps**: <list + version ranges + why>.
- **Dev deps**: anything goes, but keep the list short.
- **No optional deps** — forces clarity for users.

## Build pipeline

<!-- Example: TypeScript → esbuild → dual ESM+CJS output → types.
     Keep this short — details live in build.config.ts / package.json. -->

## Invariants

- Public API is semver-governed. Any breaking change requires a major bump.
- No side-effects on import. Library is "bring your own runtime" — it should do nothing until the user calls an exported function.
- All public functions are pure OR explicitly documented as effectful.
