# Architecture decision record (ADR)

**Use it** for any decision that is expensive to reverse: storage mode, model consolidation, platform, security design, workspace strategy. **Readers:** the architecture board today, and whoever asks "why did we do this?" in two years.

## Template

```markdown
# ADR-<nnn>: <decision title>
Status: proposed | accepted | superseded by ADR-<nnn>   Date: <date>   Deciders: <names>

## Context
<What forces a decision now. Facts and numbers, not opinions.>

## Constraints
- <skills, budget, deadlines, security, latency, source limits, licences>

## Options considered
### Option A: <name>
Pros: …   Cons: …   Cost: …   Risk: …
### Option B: <name>
…
### Option C: <name>
…

## Decision
<The option, in one sentence.>

## Consequences
<What becomes easier, what becomes harder, what changes for whom.>

## Risks and mitigations
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|

## Revisit trigger
<The measurable condition that should reopen this decision.>
```

## Example topics

- Import vs DirectQuery vs Direct Lake (on OneLake or on SQL endpoint) for the sales model
- One shared semantic model vs departmental models
- Lakehouse vs Warehouse for the gold layer
- RLS in one model vs separate models per audience
- Central vs domain workspaces
- Calculated column vs upstream transformation; Power Query vs SQL
- Capacity upgrade vs optimisation

## What good looks like

- [ ] Context has numbers; constraints are explicit and owned.
- [ ] At least three options, honestly described, including "do nothing" or "minimum change".
- [ ] One decision, with consequences for people, not only for technology.
- [ ] A revisit trigger someone can actually measure.
- [ ] Later decisions link back to it.
