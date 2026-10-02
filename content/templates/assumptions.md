# Assumptions log

**Use it** whenever you have to keep moving without an answer. **Readers:** the requester and your reviewer. Assumptions are fine; hidden assumptions are not.

## Template

```markdown
| # | Assumption | Why I assumed it | Impact if wrong | Who confirms | Status |
|---|------------|------------------|-----------------|--------------|--------|
| A1 | | | <which numbers move, roughly how much> | | Open / Confirmed / Rejected |
```

## Example (Northwind, BI-1042)

| # | Assumption | Why | Impact if wrong | Who confirms | Status |
|---|------------|-----|-----------------|--------------|--------|
| A1 | Cancelled orders are excluded | They never shipped or were paid | Q1 gross changes by {{s01_bridge_cancel|moneyk}} | Jordan | Confirmed |
| A2 | The test customer's orders are not real | Name says so; no payments | Q1 gross changes by {{s01_bridge_test|moneyk}} | Kenji | Confirmed |
| A3 | Duplicated (OrderID, LineNo) rows are export errors | Kenji mentioned a re-run | March gross changes by {{s01_bridge_dup|moneyk}} | Kenji | Confirmed |
| A4 | EUR converted at the monthly average rate | Only rate available | Small, Europe only | Finance | Open |

## What good looks like

- [ ] Each assumption has a quantified impact, so readers know which ones matter.
- [ ] Each has a named person to confirm it, and a status that is kept up to date.
- [ ] The log travels with the report (README or a documentation page), not only in your notes.
