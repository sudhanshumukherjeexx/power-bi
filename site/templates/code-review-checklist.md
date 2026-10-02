# Code review checklist (Power BI)

**Use it** when reviewing a pull request that changes a semantic model or report. **Readers:** the reviewer and the author. Approve only when every box is ticked or the exception is written in the pull request.

## The pull request itself

- [ ] Says what changed, why (ticket), how it was tested, the risk and how to roll back.
- [ ] Is small enough to review properly; unrelated changes are split out.
- [ ] Doesn't commit `.pbi/localSettings.json`, `cache.abf`, PBIX files or secrets.

## Correctness

- [ ] Changed measures show numbers before and after for at least two filter combinations, reconciled to a source.
- [ ] Totals behave as intended (additive or not, on purpose).
- [ ] New relationships are one-to-many, single direction, on unique keys; exceptions explained.
- [ ] RLS and OLS changes come with an updated, passing RLS test matrix.

## Maintainability

- [ ] Names, display folders, descriptions and format strings follow the standard.
- [ ] DAX is formatted, uses variables, avoids repeated logic, uses DIVIDE.
- [ ] No hard-coded server names, paths, dates or user names.
- [ ] Best Practice Analyzer shows no new violations.

## Impact

- [ ] Renamed or removed fields: every report that uses them is updated, or the change is reverted.
- [ ] New high-cardinality columns are justified (model size checked).
- [ ] Performance of changed pages is within budget.
- [ ] Release notes drafted for user-visible changes.
