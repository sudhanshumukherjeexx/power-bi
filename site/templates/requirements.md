# Requirements and open questions

**Use it** before building anything that someone else will rely on. **Readers:** the requester, your lead, whoever reviews the report.

## Template

```markdown
# <Request title> (<ticket id>)

## The question
<The business question in one sentence, in the requester's words.>
<The decision it supports, and who makes it.>

## Definitions (agreed or assumed)
| Term | Definition in numbers | Agreed by | Date |
|------|-----------------------|-----------|------|
| Revenue | <after discount? after returns? which date? currency?> | | |

## Scope
- Grain: <one row per …>
- Period: <from / to, which calendar>
- Audience and security: <who sees what>
- Freshness: <how old may the data be, and why>
- Reconciles to: <authoritative source and tolerance>

## Open questions
| # | Question | Who answers | Default if no answer by <date> |
|---|----------|-------------|--------------------------------|

## Out of scope
- <what you will deliberately not do now>
```

## Example (Northwind, BI-1042)

| Term | Definition in numbers | Agreed by | Date |
|------|-----------------------|-----------|------|
| Gross Sales | Qty × unit price × (1 − discount), completed orders, by order date, in USD at the order month's rate | Jordan (email) | 11 Apr 2026 |
| Net Sales | Gross Sales − refunds on those orders | Jordan (email) | 11 Apr 2026 |

| # | Question | Who answers | Default |
|---|----------|-------------|---------|
| 1 | Should staff purchases count as sales? | Jordan | Yes (as today), flagged |
| 2 | Compare with last year by order date or posting date? | Jordan, Finance | Order date |

## What good looks like

- [ ] Every key word (revenue, margin, active, real time) has a definition in numbers.
- [ ] The decision the output supports is written down.
- [ ] Each open question has an owner and a default with a date.
- [ ] Security and freshness are stated, not assumed.
- [ ] Out of scope is explicit, so the request can't grow silently.
