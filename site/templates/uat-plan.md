# UAT plan and log

**Use it** when business users test a report before go-live. **Readers:** testers, the requester, the developer.

## Template

```markdown
# UAT: <report> · round <n> · <dates>
Testers: <names>   Sign-off by: <name>

| ID | Test case | Steps | Expected | Actual | Evidence | Status | Owner | Notes |
|----|-----------|-------|----------|--------|----------|--------|-------|-------|
| UAT-001 | | | | | <screenshot / file> | Pass / Fail / Requirement mismatch / Test error | | |

Statuses
- Pass: behaves as specified.
- Fail (defect): doesn't behave as specified → fix.
- Requirement mismatch: behaves as specified, but the specification isn't what the tester needs → change request.
- Test error: the expected value was wrong.
```

## Example (Northwind, UAT-017)

| ID | Test case | Expected | Actual | Status | Notes |
|----|-----------|----------|--------|--------|-------|
| UAT-017 | Region totals match Excel | Excel by customer home region | Report by selling region | Requirement mismatch | Both reproduced from data; label clarified; home-region view added |

## What good looks like

- [ ] Every finding is classified (defect vs requirement mismatch vs test error) with evidence.
- [ ] Expected values come from the specification or an agreed source, not memory.
- [ ] Each failed case has an owner and a retest date.
- [ ] Sign-off is explicit and dated.
