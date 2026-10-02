# RLS / OLS test matrix

**Use it** for every model with row-level or object-level security, on every release. **Readers:** your reviewer, Compliance.

## Template

```markdown
| User | Group / role | Should see | Must not see | Sensitive objects visible? | Test query | Expected | Actual | Pass |
|------|--------------|------------|--------------|----------------------------|------------|----------|--------|------|
| <a real user per role> | | <regions, rows> | | <tables/columns> | <DAX query> | <totals> | | |
| <a user in no role> | none | nothing | everything | no | | access denied | | |
```

Run each row with **View as** (Desktop or Service) or a DAX query executed as that user. Record totals, not just "looks right".

## Example (Northwind, INC-2031)

| User | Role | Should see | Must not see | Payroll? | Expected payroll | Pass |
|------|------|------------|--------------|----------|------------------|------|
| dana.whitfield@ | Regional Manager | West | other regions | yes | West only | ✓ |
| bea.lindqvist@ | Sales Rep | East | other regions | no (OLS) | table not available | ✓ |
| nina.kowalski@ | Finance | all | none | yes | company total | ✓ |
| new.starter@ | none | nothing | everything | no | access denied | ✓ |

## What good looks like

- [ ] At least one real user per role, plus a user in no role, plus a user in two roles.
- [ ] Expected values are numbers computed independently, not copied from the report.
- [ ] Includes tools that bypass the report: Analyze in Excel, Explore data, a new report on the model.
- [ ] Runs on every release; failures block deployment.
