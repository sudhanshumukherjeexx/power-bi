# Semantic model certification checklist

**Use it** before certifying (endorsing) a semantic model, and at each annual re-certification. **Readers:** the model owner, the certifier, the data steward.

## Ownership

- [ ] Named technical owner and business owner (data steward); contact shown on the model.
- [ ] The model is in a production workspace with a deployment path from Git or a pipeline.

## Definitions

- [ ] Every business measure is in the KPI dictionary with an owner and a reconciliation rule.
- [ ] Measures reconcile to the authoritative source for the last closed period.
- [ ] Every visible field has a description.

## Quality

- [ ] Best Practice Analyzer passes the team's rule set.
- [ ] Tests (row counts, key integrity, known totals) run after every refresh.
- [ ] Refresh is scheduled, monitored, and sends failure notifications to a group.

## Security

- [ ] RLS and OLS documented and tested (RLS test matrix attached).
- [ ] Sensitivity label applied.
- [ ] Build permission granted to authors through a security group.

## Usability and performance

- [ ] Pages built on it meet the performance budget.
- [ ] Display folders and naming follow the standard.
- [ ] A short guide for report authors exists.

**Certified by:** <name> · **Date:** <date> · **Review again by:** <date>
