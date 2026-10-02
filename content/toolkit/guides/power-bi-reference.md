---
{
  "id": "power-bi-reference",
  "title": "Power BI and Fabric documentation map",
  "summary": "Which official documentation answers which question, so you go straight to the authority instead of a five-year-old blog post.",
  "door": "reference",
  "group": "Official documentation",
  "kind": "reference",
  "order": 1,
  "stages": ["analyst", "developer", "senior", "engineer", "architect"],
  "skills": ["service", "modeling", "deployment", "automation"],
  "tools": ["desktop", "service", "rest-api", "fabric-api"],
  "problems": [],
  "keywords": ["documentation", "docs", "microsoft learn", "official", "guidance", "where to look"],
  "verified": { "date": "2026-10-02", "review_after_days": 180 },
  "refs": [
    { "t": "Power BI documentation", "u": "https://learn.microsoft.com/en-us/power-bi/", "src": "official" },
    { "t": "Power BI guidance", "u": "https://learn.microsoft.com/en-us/power-bi/guidance/", "src": "official" },
    { "t": "Power BI Desktop projects (PBIP)", "u": "https://learn.microsoft.com/en-us/power-bi/developer/projects/projects-overview", "src": "official" },
    { "t": "Power BI REST API reference", "u": "https://learn.microsoft.com/en-us/rest/api/power-bi/", "src": "official" },
    { "t": "Microsoft Fabric documentation", "u": "https://learn.microsoft.com/en-us/fabric/", "src": "official" },
    { "t": "Fabric REST API reference", "u": "https://learn.microsoft.com/en-us/rest/api/fabric/articles/", "src": "official" },
    { "t": "DAX reference", "u": "https://learn.microsoft.com/en-us/dax/", "src": "official" },
    { "t": "Power Query M reference", "u": "https://learn.microsoft.com/en-us/powerquery-m/", "src": "official" }
  ]
}
---
## How to use Microsoft's documentation

Microsoft Learn has two kinds of Power BI pages, and confusing them wastes time:

- **Product documentation** says *what a feature does and how to switch it on*. It is the authority on limits, licensing and settings.
- **Guidance** says *how to use features well*: star schemas, query folding, relationships, row-level security design, gateway sizing and adoption. When you are deciding how to build something rather than where a button is, start in guidance.

> **Tip:** Check the date at the top of a Learn page. Power BI ships monthly and Fabric faster, so a page updated this year beats any blog post about the same feature.

## Which page answers which question

| Your question | Go to | Stage |
|---|---|---|
| How do I connect to X, publish, share, set up refresh? | [Power BI documentation](https://learn.microsoft.com/en-us/power-bi/) | All |
| What is the right way to model, fold, secure or size this? | [Power BI guidance](https://learn.microsoft.com/en-us/power-bi/guidance/) | Developer+ |
| Why a star schema, and how? | [Understand star schema](https://learn.microsoft.com/en-us/power-bi/guidance/star-schema) | Developer |
| How do relationships really behave? | [Model relationships](https://learn.microsoft.com/en-us/power-bi/transform-model/desktop-relationships-understand) | Developer |
| Import, DirectQuery, Direct Lake or composite? | [Semantic model modes](https://learn.microsoft.com/en-us/power-bi/connect-data/service-dataset-modes-understand) | Developer |
| What does this DAX function do exactly? | [DAX reference](https://learn.microsoft.com/en-us/dax/) | All |
| What does this M function do exactly? | [Power Query M reference](https://learn.microsoft.com/en-us/powerquery-m/) | All |
| How do I put a model in Git? What is TMDL? | [Power BI Desktop projects](https://learn.microsoft.com/en-us/power-bi/developer/projects/projects-overview) | Engineer |
| How do I automate refresh, inventory or deployment? | [Power BI REST API](https://learn.microsoft.com/en-us/rest/api/power-bi/) and [Fabric REST API](https://learn.microsoft.com/en-us/rest/api/fabric/articles/) | Engineer |
| How does Fabric store and serve data? | [Microsoft Fabric documentation](https://learn.microsoft.com/en-us/fabric/) | Engineer+ |
| How should an organisation adopt and govern BI? | [Fabric adoption roadmap](https://learn.microsoft.com/en-us/power-bi/guidance/fabric-adoption-roadmap) | Lead |

## Guidance articles worth reading once, early

These change how you build, not just what you click:

1. [Understand star schema and the importance for Power BI](https://learn.microsoft.com/en-us/power-bi/guidance/star-schema). The single most important modeling article.
2. [Data reduction techniques for Import modeling](https://learn.microsoft.com/en-us/power-bi/guidance/import-modeling-data-reduction). Why your model is big and how to shrink it.
3. [Query folding guidance](https://learn.microsoft.com/en-us/power-bi/guidance/power-query-folding). Why refresh is slow.
4. [Bi-directional relationship guidance](https://learn.microsoft.com/en-us/power-bi/guidance/relationships-bidirectional-filtering). When "Both" is justified, and when it isn't.
5. [Row-level security guidance](https://learn.microsoft.com/en-us/power-bi/guidance/rls-guidance). Patterns and performance.
6. [Use variables to improve your DAX formulas](https://learn.microsoft.com/en-us/dax/best-practices/dax-variables).

## How the rest of this Toolkit uses the docs

Every Toolkit page links the official page that is the authority for its claims, labels specialist and community sources as such, and shows the date it was last checked. When this site and Microsoft disagree, Microsoft wins and the page here is a bug: [open an issue](https://github.com/sudhanshumukherjeexx/power-bi/issues).
