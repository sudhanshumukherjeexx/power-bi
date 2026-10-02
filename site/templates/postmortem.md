# Blameless postmortem

**Use it** within a week of any SEV1 or SEV2, and for any SEV3 that keeps coming back. **Readers:** the team and the people affected.

## Template

```markdown
# Postmortem: <incident ID and title>
Date: <date>   Facilitator: <name>   Attendees: <names>

## Summary
<Three sentences: what happened, impact, what we're changing.>

## What went well
- …

## What went wrong
- …

## Why it happened (5 whys or causal chain)
1. <symptom> because …
2. … because …

## Why it wasn't caught earlier
<Missing test, alert, review, contract.>

## Actions
| Action | Type (prevent / detect / mitigate) | Owner | Due | Done |
|--------|-------------------------------------|-------|-----|------|
```

## Blameless means

Describe what people did and what the system allowed, not who was careless. "The change process didn't require BI approval for view changes" leads to a fix; "Kenji broke the view" leads to people hiding mistakes.

## What good looks like

- [ ] Every action has an owner, a due date and a type.
- [ ] At least one action improves detection, not only prevention.
- [ ] Actions are tracked to completion and reviewed at the next postmortem.
