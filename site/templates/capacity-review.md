# Capacity review

**Use it** monthly for each Fabric or Premium capacity, and whenever users report slowness or throttling. **Readers:** capacity admins, the BI lead, workspace owners, whoever pays for the capacity.

## Template

**Capacity:** <name, SKU, region> · **Period:** <dates> · **Reviewer:** <name>

| Measure | This period | Previous | Comment |
|---|---|---|---|
| Peak utilisation (% of CU) | | | |
| Hours above 80% | | | |
| Interactive delay or rejection events | | | |
| Top 5 items by CU | | | |
| Failed or long refreshes | | | |
| Largest semantic models (memory) | | | |

## Questions

- [ ] What used the most compute, and is that the business's most important work?
- [ ] Are background jobs (refresh, notebooks, pipelines) scheduled away from report peaks?
- [ ] Which one optimisation would save the most CU, and who owns it?
- [ ] Should any workload move to a separate capacity?
- [ ] Is the SKU right-sized for the next quarter (growth, new projects)?

## Actions

| Action | Owner | Due | Expected saving |
|---|---|---|---|
| <action> | <name> | <date> | <CU or %> |
