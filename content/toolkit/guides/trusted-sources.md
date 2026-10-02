---
{
  "id": "trusted-sources",
  "title": "Trusted external learning",
  "summary": "A short, deliberate list of places to learn from, in three tiers: authoritative, specialist and community. Quality over quantity.",
  "door": "reference",
  "group": "Where to learn more",
  "kind": "library",
  "order": 7,
  "stages": ["analyst", "developer", "senior", "engineer", "architect"],
  "skills": ["dax", "modeling", "performance", "fabric"],
  "tools": [],
  "problems": [],
  "keywords": ["learning resources", "where to learn", "sqlbi", "community", "forum", "microsoft learn", "blogs"],
  "verified": { "date": "2026-10-02", "review_after_days": 365 },
  "refs": [
    { "t": "Microsoft Learn: Power BI training", "u": "https://learn.microsoft.com/en-us/training/powerplatform/power-bi", "src": "official" },
    { "t": "Power BI documentation", "u": "https://learn.microsoft.com/en-us/power-bi/", "src": "official" },
    { "t": "Microsoft Fabric documentation", "u": "https://learn.microsoft.com/en-us/fabric/", "src": "official" },
    { "t": "SQLBI", "u": "https://www.sqlbi.com/", "src": "specialist" },
    { "t": "DAX Studio documentation", "u": "https://daxstudio.org/docs/intro/", "src": "specialist" },
    { "t": "Tabular Editor documentation", "u": "https://docs.tabulareditor.com/en/", "src": "specialist" },
    { "t": "Microsoft Fabric Community", "u": "https://community.fabric.microsoft.com/", "src": "community" }
  ]
}
---
## Why a short list

The Power BI internet is enormous and uneven: excellent material sits next to outdated advice that was right in 2018. A short list you trust beats a long list you have to evaluate every time. Everything below earned its place by being accurate, maintained and specific.

## Tier 1: authoritative

The source of truth for what a feature does, its limits and its licensing.

| Source | Use it for |
|---|---|
| [Power BI documentation](https://learn.microsoft.com/en-us/power-bi/) | Features, settings, limits, licensing |
| [Power BI guidance](https://learn.microsoft.com/en-us/power-bi/guidance/) | How Microsoft recommends you model, secure, size and govern |
| [Microsoft Fabric documentation](https://learn.microsoft.com/en-us/fabric/) | OneLake, Lakehouse, Warehouse, Direct Lake, capacities |
| [Microsoft Learn training](https://learn.microsoft.com/en-us/training/powerplatform/power-bi) | Free structured modules and the official exam study guides |
| [Power BI blog](https://powerbi.microsoft.com/en-us/blog/) | Monthly feature summaries: what changed this month |

## Tier 2: specialist

Deep, opinionated, technically rigorous. When docs say *what*, these explain *why* and *how well*.

| Source | Use it for |
|---|---|
| [SQLBI](https://www.sqlbi.com/) and [DAX Guide](https://dax.guide/) | DAX semantics, modeling and performance; the reference for how the engine really behaves |
| [DAX Patterns](https://www.daxpatterns.com/) | Ready-made business patterns (time intelligence, ABC, budget, new customers…) |
| [DAX Studio docs](https://daxstudio.org/docs/intro/) | Server Timings, query plans, VertiPaq Analyzer |
| [Tabular Editor docs](https://docs.tabulareditor.com/) | Model scripting, Best Practice Analyzer, TMDL workflows |

## Tier 3: community

Where you ask when you're stuck, and find the person who hit your exact error last year.

| Source | Use it for |
|---|---|
| [Microsoft Fabric Community](https://community.fabric.microsoft.com/) | Forums for Desktop, Power Query, Service, Report Server and developer questions; ideas and known issues |
| Local and virtual user groups | Real-world practice, people to learn from, your next job |

> **Tip:** Before posting a question, reproduce it on a tiny dataset (the course datasets are ideal), include the exact error and what you tried. You'll often solve it while writing the question.

## How to judge anything else

When you find a new article, video or course, ask:

1. **When was it written, and for which version?** Anything about Direct Lake, Copilot, PBIP, deployment or licensing older than a year needs checking.
2. **Does it say why, or only what?** Advice without reasoning can't be adapted to your case.
3. **Does it agree with Tier 1 on facts?** On opinions, specialists can (and do) disagree with Microsoft; on limits and features, the docs win.
4. **Is it selling something?** Fine, but weigh it.
