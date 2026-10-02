# Release notes and migration plan

**Use it** when users will notice a change: new or renamed measures, moved reports, retired content, changed numbers. **Readers:** report users and their managers.

## Template

```markdown
# <Release / migration name> · <date>

## What changes for you
- <In user terms: "Revenue on the Sales Overview now matches the board pack.">

## Numbers that will move, and why
| Measure | Old value (period) | New value | Why |
|---------|--------------------|-----------|-----|

## Plan
| Step | Date | What happens | Check | Rollback |
|------|------|--------------|-------|----------|

## Who to ask
<name, channel>
```

## Retirement steps (for retiring content)

1. Check lineage, subscriptions, dashboards, paginated reports and Excel connections.
2. Notify owner and recent viewers with the replacement and dates.
3. Banner on the report; move subscriptions and tiles.
4. Read-only for 30 days.
5. Archive; delete after 90 days.

## What good looks like

- [ ] Users learn about changed numbers before they see them.
- [ ] Every step has a check and a rollback.
- [ ] Old and new values are shown side by side for anything that moves.
