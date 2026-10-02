# Data contract

**Use it** between a source team and the BI team for every table or view a certified model depends on. **Readers:** both teams, and whoever approves changes.

## Template

```markdown
# Data contract: <source object> → <consumer>
Provider: <team, owner>   Consumer: <team, owner>   Version: <n>   Effective: <date>

## Schema
| Column | Type | Nullable | Meaning | Allowed values |
|--------|------|----------|---------|----------------|

## Semantics
- Grain: <one row per …>
- Keys: <unique key>
- Dates: <time zone, which event each date represents>

## Service levels
- Freshness: <data available by hh:mm, covering up to …>
- Quality checks: <uniqueness, nulls, referential integrity, row-count ranges>

## Change management
- Breaking changes (rename, remove, change type or meaning): <notice period>, with an alias or versioned object during the transition.
- Non-breaking changes (add column): <notice>.
- How to notify: <channel>; consumer must approve breaking changes.
```

## What good looks like

- [ ] Every column the model uses is listed with its meaning.
- [ ] Renames require notice and a compatibility period.
- [ ] Quality checks run automatically on the provider side.
