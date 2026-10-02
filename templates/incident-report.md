# Incident report

**Use it** while an incident is happening and immediately after. **Readers:** stakeholders, your lead, Compliance where relevant.

## Template

```markdown
# <Incident ID>: <one-line description>
Severity: SEV<n>   Status: investigating | mitigated | resolved   Owner: <name>

Start time: <when it started, not when it was noticed>
Detected: <when and how (alert, user, monitoring)>
Users affected: <who and how many>
Business impact: <decisions, deadlines, data exposure>

## Timeline
| Time | Event | Who |
|------|-------|-----|

## Root cause
<What caused it, with evidence.>

## Immediate mitigation
<What stopped the impact, and when.>

## Permanent remediation
<What fixes it for good, and when it ships.>

## Preventive actions
| Action | Owner | Due |
|--------|-------|-----|

## Communication log
| Time | To | Message |
|------|----|---------|
```

## Severity guide

| Level | Meaning | First update |
|-------|---------|--------------|
| SEV1 | Wrong or missing numbers for executives, close or regulators; confirmed data exposure | 15 min |
| SEV2 | Key report wrong or down for a department; security weakened | 1 hour |
| SEV3 | Degraded, workaround exists | same day |
| SEV4 | Cosmetic or one user | next sprint |

## What good looks like

- [ ] Start time and detection time are both recorded (the gap is a finding).
- [ ] Updates went out on schedule, even with no news.
- [ ] Impact is stated in business terms.
