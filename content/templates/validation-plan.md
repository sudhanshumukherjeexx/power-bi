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
| Raw export, Q1 2026 | {{s01_raw_lines|int}} | {{s01_raw|money0}} |
| − lines exported twice | −{{s01_dup_lines|int}} | {{s01_bridge_dup|money0}} |
| − cancelled orders | −{{s01_cancel_lines|int}} | {{s01_bridge_cancel|money0}} |
| − test account | −{{s01_test_lines|int}} | {{s01_bridge_test|money0}} |
| = Gross Sales | {{s01_clean_lines|int}} | {{q1_2026_gross|money0}} |

## What good looks like

- [ ] Adjustments sum to the difference exactly. A residual means an undiscovered cause.
- [ ] Tests are re-runnable (DAX queries, SQL, or Power Query steps), not screenshots.
- [ ] Regression proves that unrelated numbers didn't move.
- [ ] Someone other than the author signs off.
