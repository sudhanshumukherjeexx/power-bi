# KPI dictionary

**Use it** for every measure that appears on a business-facing report. **Readers:** report users, analysts, auditors, the next developer.

## Template

```markdown
## <Measure name>
- **Definition (business):** <one sentence a non-specialist understands>
- **Formula:** <DAX or pseudo-formula>
- **Grain and date:** <which date drives it; additive or not>
- **Includes / excludes:** <channels, statuses, returns, currencies…>
- **Source:** <tables and system>
- **Owner (business):** <name, role>    **Owner (technical):** <team>
- **Use it for:** <decisions>    **Don't use it for:** <common misuse>
- **Reconciles to:** <authoritative figure and tolerance>
- **Changed:** <date: what changed and why>
```

## Example (Northwind)

## Net Revenue (ledger)
- **Definition:** revenue as recognised in the general ledger for the period.
- **Formula:** Ledger Sales − Ledger Returns − Shipping Refunds.
- **Grain and date:** order line; posting date for sales, return date for returns. Additive over time.
- **Includes / excludes:** excludes staff purchases (account 6950); EUR translated at the posting month's average rate.
- **Source:** FactSales, FactReturns (NorthwindDW).
- **Owner (business):** Sarah Chen, CFO. **Owner (technical):** BI team.
- **Use it for:** board pack, anything compared with Finance. **Don't use it for:** commissions (use Net Sales (orders)).
- **Reconciles to:** GL accounts 4000 + 4900 + 4910, to the dollar.

## What good looks like

- [ ] No two entries share a name; no entry is called just "Revenue".
- [ ] Each entry names the date it uses and what it excludes.
- [ ] A business owner, not just a developer, is named.
- [ ] The same text is in the measure's description in the model, so users see it in Power BI.
