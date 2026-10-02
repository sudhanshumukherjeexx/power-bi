# Validation and reconciliation

**Use it** before anyone else sees a number, and again after every change. **Readers:** your reviewer, Finance, auditors.

## Template

```markdown
# Validation: <report / model> (<date>)

## 1. Reconciliation: source to report
| Step | Rows | Amount | Note |
|------|------|--------|------|
| Raw source total | | | |
| − <adjustment> | | | <rule and reason> |
| = Reported total | | | |

## 2. Data tests
| Test | Expected | Actual | Pass |
|------|----------|--------|------|
| Key is unique (<columns>) | 0 duplicates | | |
| No orphan foreign keys | 0 | | |
| Row count vs source | equal | | |

## 3. Measure tests (known input → known output)
| Measure | Filter context | Expected | Actual | Pass |
|---------|----------------|----------|--------|------|

## 4. Regression (what must not change)
| Measure | Before | After | Pass |
|---------|--------|-------|------|

## Tolerance and sign-off
<tolerance> · Checked by <name> on <date>
```

## Example (Northwind, BI-1042)

| Step | Lines | USD |
|------|-------|-----|
| Raw export, Q1 2026 | 1,261 | $274,539 |
| − lines exported twice | −37 | −$4,372 |
| − cancelled orders | −35 | −$11,216 |
| − test account | −2 | −$4,200 |
| = Gross Sales | 1,187 | $254,751 |

## What good looks like

- [ ] Adjustments sum to the difference exactly. A residual means an undiscovered cause.
- [ ] Tests are re-runnable (DAX queries, SQL, or Power Query steps), not screenshots.
- [ ] Regression proves that unrelated numbers didn't move.
- [ ] Someone other than the author signs off.
