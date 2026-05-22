# Business Workflows — {{PROJECT_NAME}}

End-to-end business processes. Each workflow shows: who triggers it, what happens step by step, which entities change state, what the side-effects are. Use plain language — this is for business context, not implementation detail.

## Template

```
## <Workflow name>

**Trigger**: <user role / event> → <action>.

**Participants**: <entities involved>.

**Steps**:
1. <actor> does <thing> → <entity> goes from `<state>` to `<state>`.
2. ...

**Side effects**:
- <notification sent / job queued / accrual recorded>.

**Error paths**:
- <what happens if X fails>.

**Reversibility**:
- <can this be undone? how?>.

**Related ADRs**: ADR-NNN.
```

<!-- Real workflows go below. Keep each <=60 lines. Anything longer → split into sub-workflows. -->
