# Best-practice library

Opinionated, checkable standards for measure and table naming, display folders, descriptions, hidden keys, explicit measures, relationships, date tables, documentation, DAX formatting, workspaces and Git, and how to automate them with Best Practice Analyzer.

From the BI Developer Toolkit: https://sudhanshumukherjeexx.github.io/power-bi/toolkit/best-practices.html

## Why standards

Standards aren't about taste. They make a model readable by the next person (often you in six months), make review faster, and let tools check the boring things so humans can review the logic. Pick a standard, write it down, and automate it. The rules below are a good default; changing one is fine as long as the team changes it everywhere.

## Measure naming

- **Business names, title case, with spaces:** `Net Sales`, `Gross Margin %`, `Orders (Distinct)`. Not `TotalSalesAmt_v2`.
- **Units and transformations as suffixes:** `Net Sales PY`, `Net Sales YoY %`, `Net Sales YTD`.
- **No table prefixes** in measure names: measures live in a measure table or their home fact table, and the name must make sense on its own on a visual.
- **One meaning per name across the organisation:** if `Revenue` means net of returns in one model, it means that everywhere ([KPI dictionary](https://sudhanshumukherjeexx.github.io/power-bi/templates.html#tpl-kpi-dictionary)).

## Table and column naming

- Tables: `Sales`, `Customer`, `Date` for business users, or `FactSales` / `DimCustomer` if your team prefers to see roles. Pick one convention for the whole model.
- Columns users see: business names with spaces (`Order Date`, `Customer Segment`). Keys and technical columns keep their technical names and are hidden.
- No abbreviations users won't recognise.

## Display folders and descriptions

- Group measures in display folders by subject (`Sales`, `Margin`, `Time comparisons`), not by author or ticket.
- **Every measure and every visible column has a description**: what it means, what it includes and excludes. Descriptions show as tooltips in the field list and feed Copilot and Q&A.

## Hide keys, use explicit measures

- Hide every key and every column used only for relationships or sorting.
- Set **Summarize by: None** on numeric columns that shouldn't be summed (IDs, years, rates), or hide them and provide measures.
- Write explicit measures for every number on a visual; don't rely on implicit "Sum of Quantity". Explicit measures are required for calculation groups and give you one place to fix a definition.

## Relationship rules

- One-to-many, single direction, from dimension to fact.
- Integer surrogate keys where possible.
- Bidirectional, many-to-many and inactive relationships each have a description saying why.
- Never relate two fact tables directly.

## Date table standards

- One date table, marked as a date table, continuous days covering every fact date (whole years).
- Columns for Year, Quarter, Month (with a sort-by-month-number column), Week, fiscal periods, and flags such as `IsWorkingDay`.
- Auto date/time **off**.
- Role-playing dates handled with `USERELATIONSHIP` or explicit second date tables, never with auto date/time.

## Model documentation

Generate it from the model rather than writing it twice: descriptions in the model, the [data dictionary](https://sudhanshumukherjeexx.github.io/power-bi/templates.html#tpl-data-dictionary) exported from them, and the [model design document](https://sudhanshumukherjeexx.github.io/power-bi/templates.html#tpl-model-design) for the decisions (grain, sources, refresh, security) that the model can't hold.

## DAX formatting

- Format with [DAX Formatter](https://www.daxformatter.com/) or Tabular Editor's formatter; agree long-line or short-line style once.
- Variables for anything used twice and for every intermediate result worth debugging.
- `DIVIDE` instead of `/`; `REMOVEFILTERS` instead of `ALL` when you mean "remove filters"; column references fully qualified (`FactSales[Quantity]`), measure references unqualified (`[Net Sales]`).

## Workspace naming

`<Domain> <Purpose> [<Stage>]`, for example `Sales Analytics [Dev]`, `Sales Analytics [Test]`, `Sales Analytics`. Use a consistent pattern so lineage, deployment pipelines and scripts can rely on it. Download the [workspace naming standard](https://sudhanshumukherjeexx.github.io/power-bi/templates.html#tpl-workspace-naming-standard).

## Git standards

- Commit messages start with the ticket: `BI-1103: certified Revenue excludes returns`.
- One logical change per commit; never commit `.pbi/localSettings.json` or `cache.abf`.
- Branch per ticket, PR per branch, at least one reviewer for anything reaching `main` ([branching guide](https://sudhanshumukherjeexx.github.io/power-bi/toolkit/files/branching-guide.md)).

## Automate it with BPA

Tabular Editor's **Best Practice Analyzer** checks rules like these automatically: naming, descriptions, hidden keys, data types, DAX anti-patterns and performance smells. Start with [Microsoft's published rule set](https://github.com/microsoft/Analysis-Services/tree/master/BestPracticeRules), switch off rules your team has decided against, and add your own (for example "measures must have a display folder"). Run it before every PR, and in CI when the model is in PBIP, so standards are enforced by a tool and reviews can focus on logic.
