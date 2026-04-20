# Entities — {{PROJECT_NAME}}

Every entity (model / table / resource) documented here: fields, endpoints, workflows, invariants.

## Summary table

| Name | Route | Description |
|---|---|---|
| _(add rows as entities are created)_ | | |

## Template for a new entity

```
### <Name> (`/<route>`)
- **Fields**: <field> (type, constraints), ...
- **Status enum** (if applicable): <values>, default <value>.
- **Indexes**: { <field>: 1 }, ...
- **Endpoints**:
  - `GET /api/<route>` — list (paginated).
  - `GET /api/<route>/:id` — read.
  - `POST /api/<route>` — create.
  - `PATCH /api/<route>/:id` — update.
  - `DELETE /api/<route>/:id` — soft-delete.
  - `<CUSTOM>` — <custom endpoint purpose>.
- **Permissions**: <who can do what>.
- **Workflow** (if applicable): <state → state → state>.
- **Invariants** (things that MUST hold): <rule>.
- **Related entities**: <refs to other entities>.
```

<!-- Real entities go below. Keep each <=50 lines — push implementation detail into code. -->
