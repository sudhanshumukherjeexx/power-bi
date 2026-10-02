---
{
  "id": "governance-lead",
  "title": "Governance and the BI lead",
  "summary": "Workspace strategy, naming, ownership, certification, stewardship, content lifecycle, retirement, self-service vs managed vs enterprise BI, the Center of Excellence and governance maturity, built on Microsoft's Fabric adoption roadmap.",
  "door": "patterns",
  "group": "Security and governance",
  "kind": "guide",
  "order": 10,
  "stages": ["senior", "architect"],
  "skills": ["governance", "architecture", "communication"],
  "tools": ["service", "fabric", "rest-api"],
  "problems": ["governance", "metric-disagreement", "architecture"],
  "keywords": ["governance", "workspace strategy", "naming conventions", "ownership", "certification", "endorsement", "promoted", "data stewardship", "content lifecycle", "retirement", "self-service", "managed self-service", "enterprise bi", "center of excellence", "coe", "maturity", "adoption roadmap", "domains", "raci"],
  "lessons": ["a-gov", "gov-workspace", "gov-monitor"],
  "scenarios": ["s10", "d05", "d07", "s05"],
  "templates": ["ownership-matrix", "workspace-naming-standard", "certification-checklist", "governance-assessment", "coe-charter", "deprecation-checklist"],
  "download": true,
  "verified": { "date": "2026-10-02", "review_after_days": 365 },
  "refs": [
    { "t": "Microsoft Fabric adoption roadmap", "u": "https://learn.microsoft.com/en-us/power-bi/guidance/fabric-adoption-roadmap", "src": "official" },
    { "t": "Adoption roadmap: Center of Excellence", "u": "https://learn.microsoft.com/en-us/power-bi/guidance/fabric-adoption-roadmap-center-of-excellence", "src": "official" },
    { "t": "Adoption roadmap: content ownership and management", "u": "https://learn.microsoft.com/en-us/power-bi/guidance/fabric-adoption-roadmap-content-ownership-and-management", "src": "official" },
    { "t": "Power BI implementation planning", "u": "https://learn.microsoft.com/en-us/power-bi/guidance/powerbi-implementation-planning-introduction", "src": "official" },
    { "t": "Endorsement overview", "u": "https://learn.microsoft.com/en-us/fabric/governance/endorsement-overview", "src": "official" },
    { "t": "Fabric domains", "u": "https://learn.microsoft.com/en-us/fabric/governance/domains", "src": "official" }
  ]
}
---
## What governance is for

Governance isn't a 40-page framework. It's the smallest set of roles, rules and habits that lets people trust the numbers, find the right content, and build their own reports without creating chaos. Microsoft's [Fabric adoption roadmap](https://learn.microsoft.com/en-us/power-bi/guidance/fabric-adoption-roadmap) is the authoritative foundation; this page is the practical summary.

> **Rule:** Make the governed path the easiest path. If the certified model is harder to use than exporting to Excel, people will export to Excel.

## Workspace strategy

| Pattern | When |
|---|---|
| By domain and stage: `Sales Analytics [Dev]`, `[Test]`, prod | Content managed by a BI team with deployment pipelines |
| Data workspaces separate from report workspaces | Shared semantic models consumed by many report authors |
| Personal and team sandboxes | Self-service exploration, with no expectation of support |

Group workspaces into **domains** (Sales, Finance, Operations) so ownership and discovery follow the business.

## Naming conventions

Consistent names make inventories, lineage and scripts work. Agree patterns for workspaces, semantic models, reports, apps and security groups, and publish them. Download the [workspace naming standard](templates.html#tpl-workspace-naming-standard).

## Ownership models

| Model | Who builds | Who owns data definitions |
|---|---|---|
| **Business-led self-service** | Business analysts | The business unit |
| **Managed self-service** | BI team builds certified models; business builds reports on them | BI team with business data owners |
| **Enterprise BI** | Central BI team builds models and reports | Central team with data owners |

Most organisations mix all three. Write down who owns each certified model and each key definition (Revenue, Customer, Headcount) in an [ownership matrix](templates.html#tpl-ownership-matrix).

## Semantic model certification

- **Promoted:** the owner says "this is ready to use". Anyone with write access can promote.
- **Certified:** an authorised reviewer says "this meets the organisation's standards". Only people allowed by the admin can certify.

Write the bar for certification down and apply it every time: owner, descriptions, tests, refresh monitoring, RLS tested, documented definitions. Use the [certification checklist](templates.html#tpl-certification-checklist).

## Data stewardship

A data steward for each domain answers "what does this field mean?" and "is this number right?", approves definition changes, and is the person a developer asks before changing a KPI. Without stewards, every disagreement escalates to the BI team.

## Content lifecycle and report retirement

Content has a lifecycle: create, publish, promote or certify, maintain, retire. Retirement is the step everyone skips:

1. **Find candidates:** no views in 90 days, superseded by certified content, no owner ([find stale content](toolkit/automate-power-bi.html#find-stale-content)).
2. **Contact owners and recent viewers;** many "unused" reports are used quarterly.
3. **Announce** the date and the replacement.
4. **Remove access or move to an archive workspace** for a grace period.
5. **Delete** after the grace period, keeping a backup (PBIP in Git, or an export).

The [deprecation checklist](templates.html#tpl-deprecation-checklist) and the [report retirement drill](experience/d05-report-retirement.html) walk through it.

## Self-service, managed self-service and enterprise BI

Self-service is a feature, not a failure. The goal is to channel it: give authors certified models (Build permission), training and templates, and keep enterprise BI for the content that must be right for everyone. Monitor with usage metrics and the activity log, not with bans.

## Center of Excellence

A COE is the small team that makes BI succeed across the organisation. Microsoft's guidance describes typical COE responsibilities including training and enablement, documentation and templates, governance, user support, architecture and platform oversight. A COE doesn't build everything; it makes everyone else better at building. Start with a [COE charter](templates.html#tpl-coe-charter) that names its mission, scope, people and the few metrics it will report.

## Governance maturity

Assess where you are before planning where to go. The roadmap's maturity levels run from initial (no consistent practice) through repeatable and defined to capable and efficient. Use the [governance assessment](templates.html#tpl-governance-assessment) and practise in the [governance maturity drill](experience/d07-governance-maturity.html).

## The BI lead's first quarter

1. **Inventory** what exists (workspaces, models, reports, owners, usage): [Sprint 10](experience/s10-bi-architecture-review.html) is this exercise.
2. **Pick the three definitions** that cause the most arguments and certify one model for them.
3. **Name owners** for every certified model and every workspace with production content.
4. **Publish the few rules** (naming, certification bar, where to ask for help) on one page.
5. **Retire** the obvious dead content, announced and reversible.
6. **Report** progress with numbers: certified-model usage up, duplicate models down, incidents down.
