# Pull request description

**Use it** for every change to a shared model or report. **Readers:** the reviewer now, and anyone reading `git log` later.

## Template

```markdown
## What
<The change in plain words: objects added, changed, renamed, removed.>

## Why
<Ticket, request or incident; the business reason.>

## How it was tested
- [ ] Opens and refreshes
- [ ] Values compared with main (which measures, which filters)
- [ ] BPA: <errors / warnings, explained>
- [ ] Security matrix re-run (if roles or relationships changed)
- [ ] Performance checked against the budget (if measures or model size changed)

## Risk
<What could break: downstream reports, Excel files, composite models, refresh time.>

## Rollback
<Revert this commit and redeploy / other steps.>
```

## Reviewing someone else's PR

Write each comment as: **where** (file and line), **what** (the problem), **why it matters** (wrong, slow, confusing or risky), **suggestion**. Mark which comments block the merge. Be specific, be kind, and offer to pair if the deadline is tight.

## What good looks like

- [ ] A reviewer can understand the change without opening Power BI.
- [ ] Renames list every reference that was updated.
- [ ] Tests are described with results, not "tested, looks fine".
- [ ] Rollback is one or two concrete steps.
