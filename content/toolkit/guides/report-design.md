---
{
  "id": "report-design",
  "title": "Report design library",
  "summary": "How to design executive, operational, analytical, detail, mobile, KPI scorecard, finance and sales reports, and the principles behind them: hierarchy, spacing, alignment, contrast, density, chart choice, accessibility, colour, titles, navigation and tooltips.",
  "door": "patterns",
  "group": "Design",
  "kind": "pattern",
  "order": 7,
  "stages": ["analyst", "developer", "senior"],
  "skills": ["visuals", "communication"],
  "tools": ["desktop"],
  "problems": ["report-design"],
  "certs": ["pl300"],
  "keywords": ["dashboard design", "layout", "visual hierarchy", "chart selection", "which chart", "accessibility", "colour", "color", "contrast", "titles", "navigation", "tooltips", "mobile layout", "executive dashboard", "kpi", "scorecard", "theme"],
  "lessons": ["b-viz", "i-viz", "mod-report"],
  "scenarios": ["s01", "d08"],
  "templates": ["requirements", "kpi-dictionary"],
  "download": true,
  "verified": { "date": "2026-10-02", "review_after_days": 365 },
  "refs": [
    { "t": "Tips for designing a great Power BI dashboard", "u": "https://learn.microsoft.com/en-us/power-bi/create-reports/service-dashboards-design-tips", "src": "official" },
    { "t": "Design Power BI reports for accessibility", "u": "https://learn.microsoft.com/en-us/power-bi/create-reports/desktop-accessibility-creating-reports", "src": "official" },
    { "t": "Visualization types in Power BI", "u": "https://learn.microsoft.com/en-us/power-bi/visuals/power-bi-visualization-types-for-reports-and-q-and-a", "src": "official" },
    { "t": "Report themes", "u": "https://learn.microsoft.com/en-us/power-bi/create-reports/desktop-report-themes", "src": "official" },
    { "t": "PowerBI.tips theme and layout tools", "u": "https://tools.powerbi.tips/themes/gallery", "src": "third-party", "note": "Third-party starting points for themes and layouts, not Microsoft guidance." }
  ]
}
---
## Start from the question, not the canvas

Before you place a visual, write down who reads the report, which decision it supports, and the three questions it must answer in the first ten seconds. That's what the [requirements template](templates.html#tpl-requirements) is for. A beautiful report that answers the wrong question is still the wrong report; [Sprint 01](experience/s01-executive-sales-dashboard.html) starts exactly here.

## Report types

| Type | Reader and question | Layout that works | Avoid |
|---|---|---|---|
| **Executive dashboard** | A leader: "Are we on track, and where should I look?" | 3–5 KPIs with target and trend across the top, one or two "why" visuals, no detail | Tables, more than one page of scrolling, unexplained abbreviations |
| **Operational dashboard** | A team: "What needs action today?" | Exceptions first (late orders, low stock), status colours, short refresh intervals | Year-to-date trends nobody acts on daily |
| **Analytical report** | An analyst: "Why did this happen?" | Slicers, drill-through, decomposition, a few linked visuals | Locking everything down; too many slicers on one page |
| **Detail report** | Anyone who must check rows: "Which exact orders?" | A table or paginated report with filters, export enabled | Charts; pretending a 10,000-row table is a dashboard |
| **Mobile report** | On the go: "One number, now" | The mobile layout: KPIs stacked vertically, one visual per screen | Shrinking the desktop page |
| **KPI scorecard** | Management: "Which goals are on or off track?" | KPI, target, status, owner, trend per row (or Metrics/goals) | Status colours without the rule that sets them |
| **Finance report** | Finance: "Does it tie to the ledger?" | Matrix with account hierarchy, period columns, variance, totals that reconcile | Rounded numbers that don't sum; missing currency labels |
| **Sales report** | Sales leaders and reps: "Who, what, where is growing?" | Trend vs target, top and bottom performers, region and product breakdowns, drill to customer | Rankings without context (size, prior period) |

## Principles

### Visual hierarchy

The most important number goes top-left (where readers start) and largest. Supporting visuals get smaller as they get more detailed. If everything is bold, nothing is.

### Spacing and alignment

Use a grid (for example 8 or 16 px units), equal gaps between visuals, and align edges. Misaligned visuals look like mistakes and make readers distrust the numbers.

### Contrast and colour

- One accent colour for "look here"; greys for everything else.
- Red and green only for bad and good, never as decoration, and never as the only signal (about 1 in 12 men have some colour-vision deficiency): add icons, labels or position.
- Text contrast of at least 4.5:1 against the background. Set the palette once in a [report theme](https://learn.microsoft.com/en-us/power-bi/create-reports/desktop-report-themes).

### Information density

Enough to answer the question, no more. If a visual doesn't change a decision, remove it. If readers need detail, give them drill-through, not a denser page.

### Chart selection

| To show | Use | Avoid |
|---|---|---|
| Change over time | Line chart (column chart for few periods) | Pie charts over time |
| Comparison across categories | Bar chart, sorted | 3D, unsorted bars |
| Part of a whole | Stacked bar, or a pie with 2–3 slices | Pies with many slices; donuts as decoration |
| Actual vs target | Bullet-style bar, KPI visual, variance column | Two unrelated gauges |
| Distribution | Histogram, box plot | Averages alone |
| Relationship between two measures | Scatter | Dual axes with unrelated scales |
| Exact values | Table or matrix | Charts with data labels on every point |

### Accessibility

Set **alt text** on visuals, a logical **tab order**, titles on every visual, sufficient contrast, and avoid conveying meaning by colour alone. Test with the keyboard and a screen reader ([Microsoft's accessibility guidance](https://learn.microsoft.com/en-us/power-bi/create-reports/desktop-accessibility-creating-reports); practise in [mobile layouts and accessibility](modern.html#mod-report)).

### Titles

A title should say what the reader should conclude, or at least exactly what is shown: "Net sales vs target, Q1 2026, by region" beats "Sales". Dynamic titles (a measure using `SELECTEDVALUE`) keep the title true when slicers change.

### Navigation

Few pages, each with one purpose. Use page navigator buttons or a consistent left menu; put the page's filters in the same place on every page; use drill-through for "show me the detail of this".

### Tooltips

Use report-page tooltips to answer the first follow-up question (trend for this region, top products for this month) instead of adding another visual to the page.

## Before you publish

Run the [before publishing a report](toolkit/checklists.html#before-publishing-a-report) checklist. For inspiration, third-party galleries such as [PowerBI.tips](https://tools.powerbi.tips/themes/gallery) have themes and layouts; treat them as starting points, not standards.
