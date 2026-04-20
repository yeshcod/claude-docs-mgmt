# Frontend Gotchas — {{PROJECT_NAME}}

Non-obvious rules that prevent recurring bugs. **Every rule here exists because the bug already bit us** — don't add speculative entries.

Stack: {{STACK_FRONTEND}}.

## Template for a new gotcha

```
## <Short rule in imperative form>
- One-sentence rule.
- Symptoms: <what goes wrong if violated>.
- Reason: <why the framework behaves this way>.
- How to apply: <where the rule kicks in>.
- Fixed in: <commit SHA or BUGS.md ID> (if this came from a real bug).
```

<!-- Real gotchas go below. Examples to seed (delete if not applicable):

## Form state: setFieldsValue may not trigger change events
- Some form libraries (Ant, Formik in certain modes) treat programmatic `setFieldsValue` as silent — consumers watching via onChange will NOT fire.
- Symptoms: "dirty" tracking breaks for tables / editable grids.
- How to apply: when mutating form fields programmatically, also call the dirty-marker manually OR watch via a hash-based effect.

## Date-library locale mutations are module-level globals
- Setting a default week-start or format at module scope mutates the library globally for every import in the bundle.
- Symptoms: a component silently flips from Sun-start to Mon-start when another component imports the mutating module.
- How to apply: prefer scoped plugins (dayjs `isoWeek`, Luxon locale-per-instance) over `updateLocale`.

-->
