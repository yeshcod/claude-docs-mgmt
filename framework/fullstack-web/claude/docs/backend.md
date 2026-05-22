# Backend — {{PROJECT_NAME}}

Stack: {{STACK_BACKEND}} / {{STACK_DB}}.

## Security & Permissions

### Auth
- <Mechanism — JWT / session cookie / OAuth>.
- <Where issued, where validated, expiry policy>.

### Permissions / RBAC
- <Model — role-based / attribute-based / per-resource>.
- **Fail-closed rule**: unknown entity or missing permission row → reject, not allow. (Fill in enforcement location.)
- **Rule**: when adding a new model/entity, you MUST add it to the permissions allowlist AND seed rows for every role.

### Input validation
- Validator library: <Joi / zod / class-validator / ...>.
- Blocked field names (never accept from request body): `__proto__`, `constructor`, `prototype`, `password`, `__v`, `removed`.
- Query-string guards: sanitize `sortBy`, `filter`, `fields` against a regex allowlist.

### Login anti-enumeration
- Every failure path returns identical response shape + message. Do NOT leak "user not found" vs "wrong password".

### Cookies
- `sameSite: 'Strict'`, `httpOnly`, `secure` (when behind HTTPS proxy). Set on login, reset, logout.

### File upload
- Validate mimetype against an allowlist. Never accept `image/svg+xml` from untrusted sources (SVG can embed scripts → stored XSS).

## Notifications (if applicable)
<!-- Fill in if the project has notifications. Otherwise delete the section. -->

## Activity Log (if applicable)
<!-- Fill in if auditable actions are tracked. -->

## Testing

**Run tests**: `<command>`.

**Rules**:
- Endpoint / model change → add/update test in `<path>`.
- New entity → CRUD + permissions tests.
- Historical test-count snapshots belong in `changelog.md`, not in this file (shape not snapshot).

## Performance notes

- Index any field used in `sort` / `filter`.
- Paginate list endpoints — cap `items` (e.g. 1000).
- Date-range queries need a compound index `{<field>:1, removed:1}` to stay on IXSCAN.

## Common gotchas
<!-- Add as they surface. Examples:
  - ORM populate behavior: returns nested object but save requires _id string → normalize.
  - Query injection via qs-parsed objects: `?x[$ne]=foo` → reject via value-type guard.
  - Soft-delete bypass: always force `removed: false` at the baseQuery layer.
-->
