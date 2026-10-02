---
{
  "id": "toolbelt",
  "title": "The BI developer's toolbelt",
  "summary": "Performance Analyzer, DAX query view, DAX Studio, VertiPaq Analyzer, Tabular Editor, Best Practice Analyzer, ALM Toolkit, SSMS, VS Code, Git and the Capacity Metrics app: what each is for, when you need it, when you don't, and a first exercise.",
  "door": "tools",
  "group": "Desktop and model tools",
  "kind": "tool",
  "order": 1,
  "stages": ["developer", "senior", "engineer", "architect"],
  "skills": ["performance", "modeling", "deployment", "dax"],
  "tools": ["performance-analyzer", "dax-query-view", "dax-studio", "vertipaq-analyzer", "tabular-editor", "bpa", "alm-toolkit", "ssms", "vscode", "git", "capacity-metrics"],
  "problems": ["slow-report", "memory", "deployment", "capacity"],
  "keywords": ["external tools", "which tool", "server timings", "query plan", "model size", "cardinality", "bpa rules", "schema compare", "xmla", "tmdl"],
  "lessons": ["a-perf", "api-xmla", "a-deploy"],
  "scenarios": ["s04", "s06"],
  "verified": { "date": "2026-10-02", "review_after_days": 180 },
  "refs": [
    { "t": "Performance Analyzer", "u": "https://learn.microsoft.com/en-us/power-bi/create-reports/performance-analyzer", "src": "official" },
    { "t": "DAX query view", "u": "https://learn.microsoft.com/en-us/power-bi/transform-model/dax-query-view", "src": "official" },
    { "t": "External tools in Power BI Desktop", "u": "https://learn.microsoft.com/en-us/power-bi/transform-model/desktop-external-tools", "src": "official" },
    { "t": "DAX Studio: Server Timings", "u": "https://daxstudio.org/docs/features/traces/server-timings-trace/", "src": "specialist" },
    { "t": "Tabular Editor: Best Practice Analyzer", "u": "https://docs.tabulareditor.com/features/using-bpa.html", "src": "specialist" },
    { "t": "Microsoft's BPA rules", "u": "https://github.com/microsoft/Analysis-Services/tree/master/BestPracticeRules", "src": "official", "note": "Rule file maintained in Microsoft's Analysis Services samples repository." },
    { "t": "ALM Toolkit", "u": "https://github.com/microsoft/Analysis-Services/blob/master/AlmToolkit/README.md", "src": "official" },
    { "t": "Fabric Capacity Metrics app", "u": "https://learn.microsoft.com/en-us/fabric/enterprise/metrics-app", "src": "official" },
    { "t": "Tabular Editor 3", "u": "https://tabulareditor.com/", "src": "third-party", "paid": true, "note": "Commercial edition; Tabular Editor 2 is free and open source." }
  ]
}
---
## At a glance

| Tool | What it is for | Stage | Cost |
|---|---|---|---|
| [Performance Analyzer](#performance-analyzer) | Find which visual is slow, and whether it's DAX or rendering | Developer | Built into Desktop |
| [DAX query view](#dax-query-view) | Run and test DAX queries; see the query a visual sends | Developer | Built into Desktop |
| [DAX Studio](#dax-studio) | Server Timings, query plans, model metrics, query benchmarking | Senior | Free |
| [VertiPaq Analyzer](#vertipaq-analyzer) | Model size, column cardinality, dictionary and relationship costs | Senior | Free (in DAX Studio and Tabular Editor) |
| [Tabular Editor](#tabular-editor) | Fast model editing, scripting, bulk changes, calculation groups | Senior | TE2 free; TE3 paid |
| [Best Practice Analyzer](#best-practice-analyzer) | Automated model-quality rules | Engineer | Free (in Tabular Editor) |
| [ALM Toolkit](#alm-toolkit) | Compare two models and deploy the differences | Engineer | Free |
| [SSMS](#ssms) | XMLA endpoint: scripts, partitions, traces, admin | Engineer | Free |
| [VS Code](#vs-code) | Edit PBIP, TMDL and JSON; Git; scripts | Engineer | Free |
| [Git](#git) | Version control for PBIP projects | Engineer | Free |
| [Fabric Capacity Metrics](#fabric-capacity-metrics) | Capacity usage, throttling, which item burnt the CU | Lead | Free app |

> **Rule:** Learn the built-in tools first. Desktop's Performance Analyzer and DAX query view answer most "why is this slow or wrong" questions before you install anything.

## Performance Analyzer

- **What it does:** records how long each visual takes, split into DAX query, visual display and other, and lets you copy the query.
- **When you need it:** a page is slow and you don't know which visual, or whether the time is in the query or the rendering.
- **When you don't:** the slowness is refresh, not report interaction.
- **First exercise:** View → Performance Analyzer → Start recording → Refresh visuals. Sort by duration; copy the slowest visual's query into DAX query view.
- **Real scenario:** [Sprint 04: the 18-second page](experience/s04-monday-performance-incident.html).

## DAX query view

- **What it does:** a query editor inside Desktop: write `EVALUATE` queries, define and test measures, and update the model from the query.
- **When you need it:** debugging a measure without a visual in the way; inspecting the query a visual generates; quick data checks.
- **When you don't:** you need engine-level timings (use DAX Studio).
- **First exercise:** `EVALUATE SUMMARIZECOLUMNS ( DimProduct[Category], "Sales", [Net Sales] )` and compare with the visual.

## DAX Studio

- **What it does:** connects to Desktop or the XMLA endpoint; runs queries with **Server Timings** (storage engine vs formula engine time, SE queries and cache hits) and **query plans**; includes VertiPaq Analyzer, export to files and benchmarking. Version 3.6 added a preview **Delta Analyzer** for the Delta metadata behind Direct Lake models.
- **When you need it:** a measure is slow and you need to know why (formula engine heavy, too many storage-engine queries, callbacks, large materialisations).
- **When you don't:** the problem is visual rendering or too many visuals.
- **First exercise:** paste a slow visual's query, turn on Server Timings, run it with a cleared cache, and read the split between FE and SE.
- **Docs:** [daxstudio.org](https://daxstudio.org/docs/intro/).

## VertiPaq Analyzer

- **What it does:** shows every table and column's size, cardinality, encoding and the cost of relationships and hierarchies (View Metrics in DAX Studio; also in Tabular Editor 3).
- **When you need it:** the model is big, refresh runs out of memory, or you are about to add a column and want to know what it costs.
- **When you don't:** small models that refresh comfortably.
- **First exercise:** View Metrics on any model; find the column with the highest cardinality and ask whether anyone needs it (timestamps with seconds, GUIDs and free-text columns usually top the list).

## Tabular Editor

- **What it does:** edits the model's metadata directly: measures, display folders, descriptions, calculation groups, perspectives, translations, partitions; C# scripts for bulk changes; works on PBIP/TMDL files, Desktop and the XMLA endpoint.
- **When you need it:** more than a handful of measures to create or change consistently; calculation groups; anything you'd otherwise click 200 times.
- **When you don't:** a one-off measure in a small model.
- **First exercise:** script "add a description to every measure that doesn't have one" and "move every measure starting with % into a Ratios folder".
- **Editions:** Tabular Editor 2 is free and open source; Tabular Editor 3 is commercial with a richer editor and VertiPaq Analyzer built in.

## Best Practice Analyzer

- **What it does:** runs rules over the model (naming, hidden keys, descriptions, data types, DAX anti-patterns, performance) and reports violations, some with automatic fixes.
- **When you need it:** more than one developer works on the model, or you want reviews to focus on logic instead of style.
- **When you don't:** never, really; but start with a small rule set so the results are read rather than ignored.
- **First exercise:** load [Microsoft's BPA rules](https://github.com/microsoft/Analysis-Services/tree/master/BestPracticeRules), run them on the starter model, and fix the top three categories. Then see the [best-practice library](toolkit/best-practices.html#automate-it-with-bpa).

## ALM Toolkit

- **What it does:** compares two semantic models (Desktop, PBIP, XMLA endpoint) object by object and deploys selected differences, metadata only, without overwriting data partitions.
- **When you need it:** promoting a measure change to a large Production model without a full redeploy and refresh; reviewing what changed between two versions.
- **When you don't:** your team deploys from Git with deployment pipelines or `fabric-cicd` and never edits Production directly.

## SSMS

- **What it does:** SQL Server Management Studio connects to the XMLA endpoint of a Premium or Fabric workspace: script the model as TMSL, process tables and partitions, run DMV queries, manage roles.
- **When you need it:** refreshing one partition, investigating a large model's partitions, scripting maintenance. Also your SQL source work.
- **When you don't:** routine development (Desktop and Tabular Editor are faster).
- **Practise:** [XMLA, TOM and TMSL](automation.html#api-xmla).

## VS Code

- **What it does:** a code editor for PBIP project folders: TMDL, report JSON (PBIR), deployment scripts and pipelines, with Git built in and a TMDL extension for syntax highlighting.
- **When you need it:** reviewing changes, resolving merge conflicts, editing many objects at once, writing automation.
- **When you don't:** designing visuals (that's Desktop's job).

## Git

- **What it does:** version control: history, branches, pull requests and the ability to undo. With PBIP, a model and a report are folders of text files, so Git works on them like on code.
- **When you need it:** from the moment a second person touches the model, or the first time you wish you could go back to Tuesday's version.
- **First exercise:** save the starter model as PBIP, commit, change one measure, and read the diff. Then do [Ship Power BI like software](toolkit/ship-like-software.html).

## Fabric Capacity Metrics

- **What it does:** a Microsoft app that shows capacity usage (CU) over time, by item and operation, including throttling and overages.
- **When you need it:** reports are slow for everyone at the same time of day; refreshes queue; users see throttling errors; you're sizing a capacity.
- **When you don't:** Pro or PPU workspaces without a capacity.
- **Real scenario:** the capacity section of the [production runbook](toolkit/production-runbook.html#capacity-overloaded).
