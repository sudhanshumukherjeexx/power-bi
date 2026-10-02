# Report and model deprecation checklist

**Use it** before retiring a report, semantic model, dataflow or workspace. **Readers:** the owner, the BI lead, the people who used it. Retirement is reversible until the last step.

## Decide

- [ ] Usage checked over at least 90 days (and a full quarter-end for finance content).
- [ ] Owner and recent viewers identified and contacted.
- [ ] Replacement identified (a certified model, another report), or a reason why none is needed.
- [ ] Downstream dependencies checked with lineage: reports, dashboards, dataflows, Excel workbooks, subscriptions, exports.

## Announce

- [ ] Date, reason and replacement sent to users at least two weeks ahead.
- [ ] A banner on the content itself announcing the date.

## Retire

- [ ] Access removed, or the content moved to an archive workspace for a grace period of <30 to 90 days>.
- [ ] Refresh schedules and subscriptions turned off.
- [ ] Backup kept (PBIP in Git, or an exported file) with the retirement record.

## Delete

- [ ] Grace period passed with no valid objections.
- [ ] Deleted; inventory updated; the retirement recorded in the governance log.
