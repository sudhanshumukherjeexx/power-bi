# Runbook

**Use it** for every failure that has happened once and could happen again. **Readers:** whoever is on call at 6am, possibly not you.

## Template

```markdown
# Runbook: <symptom, as the user or alert describes it>
Applies to: <models, workspaces>   Owner: <team>   Last tested: <date>

## 1. Assess impact first (5 minutes)
- What data is affected, and since when? Is the last good refresh still usable?
- Who is affected, and is there a deadline (meeting, close, payroll)?
- Severity: SEV1 / SEV2 / SEV3 / SEV4 → update cadence.

## 2. Diagnose
| Check | Where | What it tells you |
|-------|-------|-------------------|
| Refresh history and error details | Service → model → Refresh history | which table and source failed |
| Gateway status | Manage connections and gateways | infrastructure vs data problem |
| Change calendar | <link> | what changed upstream overnight |
| Credentials | Connection settings | expired or rotated |

## 3. Mitigate (safe, reversible)
<steps>

## 4. Fix permanently
<steps, via the normal release process>

## 5. Communicate
Templates for first update, progress update, resolution.
```

## What good looks like

- [ ] Starts with impact, not with fixing.
- [ ] Someone unfamiliar with the model can follow it.
- [ ] It's tested: someone actually followed it in a drill.
