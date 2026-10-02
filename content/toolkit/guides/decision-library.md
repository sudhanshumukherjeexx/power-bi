---
{
  "id": "decision-library",
  "title": "Architecture decision library",
  "summary": "Quick, honest comparisons for the questions developers keep searching: Import vs DirectQuery vs Direct Lake, measure vs column, Power Query vs SQL, Lakehouse vs Warehouse, one model vs many, RLS vs separate models, PBIX vs PBIP and more.",
  "door": "patterns",
  "group": "Design",
  "kind": "decision",
  "order": 6,
  "stages": ["developer", "senior", "engineer", "architect"],
  "skills": ["architecture", "modeling", "fabric", "security", "deployment"],
  "tools": ["desktop", "fabric", "sql"],
  "problems": ["architecture", "model-design", "metric-disagreement"],
  "certs": ["pl300", "dp600"],
  "keywords": ["import vs directquery", "direct lake", "measure vs calculated column", "power query vs sql", "lakehouse vs warehouse", "dataflow vs pipeline", "one model or many", "rls vs separate models", "pbix vs pbip", "calculation groups", "shared semantic model", "live connection", "star vs snowflake", "trade-offs", "adr"],
  "lessons": ["a-composite", "fab-onelake", "fab-directlake", "a-gov", "dw-dims"],
  "scenarios": ["s05", "s09", "s10"],
  "templates": ["adr"],
  "download": true,
  "verified": { "date": "2026-10-02", "review_after_days": 180 },
  "refs": [
    { "t": "Semantic model modes in the Power BI service", "u": "https://learn.microsoft.com/en-us/power-bi/connect-data/service-dataset-modes-understand", "src": "official" },
    { "t": "Direct Lake overview", "u": "https://learn.microsoft.com/en-us/fabric/fundamentals/direct-lake-overview", "src": "official" },
    { "t": "Fabric decision guide: choose a data store", "u": "https://learn.microsoft.com/en-us/fabric/fundamentals/decision-guide-data-store", "src": "official" },
    { "t": "Fabric decision guide: copy activity, Dataflow or Spark", "u": "https://learn.microsoft.com/en-us/fabric/fundamentals/decision-guide-pipeline-dataflow-spark", "src": "official" },
    { "t": "Star schema guidance", "u": "https://learn.microsoft.com/en-us/power-bi/guidance/star-schema", "src": "official" }
  ]
}
---
## How to use these

None of these has an answer that is always right; each depends on data volume, freshness, skills, licensing and who maintains it. Each comparison gives the conditions for each option, the trade-offs, how it fails, and a sensible default. When the decision matters, write it down as an [ADR](templates.html#tpl-adr), including what would make you change your mind.

## Import vs DirectQuery vs Direct Lake

| | Import | DirectQuery | Direct Lake |
|---|---|---|---|
| Use when | Data fits in memory and minutes-to-hours latency is fine | Data must be current to the second, or is too big to import, and the source is fast | Data already lives in Fabric as Delta tables |
| Query speed | Fastest | Depends on the source | Close to Import |
| Freshness | As of last refresh | Live | As of the last Delta commit the model picked up |
| Fails when | The model outgrows capacity memory or refresh windows | The source is slow or busy; visuals exceed query limits | Tables exceed capacity guardrails (on OneLake: errors; on SQL endpoint: may fall back to DirectQuery) |
| DAX and modeling | Everything | Some limits, every measure becomes SQL | Most features; calculated columns and tables have limits |

**Default:** Import, until a requirement rules it out. Then Direct Lake if the data is in Fabric, DirectQuery (with aggregations) if it isn't. Practise: [Composite models and DirectQuery](advanced.html#a-composite), [Direct Lake in depth](fabric.html#fab-directlake).

## Measure vs calculated column

| Use a measure when | Use a calculated column when |
|---|---|
| The number is aggregated on a visual and must respond to filters | You need to slice, group or filter **by** the value, or use it as a relationship key |
| It's a ratio, a time comparison, a ranking | The value is a fixed property of the row (a band, a flag) |

- **Trade-off:** columns cost memory and refresh time; measures cost query time.
- **Failure mode:** calculated columns that use `CALCULATE` over the fact table (slow refresh, confusing context transition); measures that try to be columns (`SUMX` everywhere to fake row logic).
- **Default:** measure. If it must be a column, build it in Power Query or SQL instead of DAX.

## Power Query vs SQL

| Prefer Power Query when | Prefer SQL (or the warehouse) when |
|---|---|
| No warehouse exists, or the logic is specific to one model | The logic is shared by several models or tools |
| Sources are files, SharePoint or APIs | The data is big and lives in a database |
| The team is analysts without database access | Data engineers own the pipeline |

- **Failure mode:** heavy joins and aggregations in Power Query that don't fold, so refresh drags all rows across the network.
- **Default:** as far upstream as is practical. See the full [where-should-it-happen table](toolkit/sql-for-bi.html#where-should-this-transformation-happen).

## Lakehouse vs Warehouse

| Lakehouse | Warehouse |
|---|---|
| Spark, Python and notebooks; files plus Delta tables; semi-structured data | T-SQL end to end; multi-table transactions; stored procedures |
| Read via the SQL analytics endpoint (read-only T-SQL) | Full read/write T-SQL |
| Data engineers | SQL developers and BI engineers with a SQL background |

- **Trade-off:** both store Delta in OneLake and both serve Direct Lake; the difference is how you write and who writes.
- **Failure mode:** choosing by fashion rather than by team skills; building the gold layer in a tool nobody on the team can maintain.
- **Default:** follow the team's language. Many designs use a Lakehouse for bronze and silver and a Warehouse for gold. See [Fabric architecture](toolkit/fabric-architecture.html).

## Dataflow vs pipeline

| Dataflow Gen2 | Pipeline |
|---|---|
| Transform data with Power Query, low code | Orchestrate: copy data, run activities in order, schedule, branch, retry |
| Analysts and BI developers | Data engineers and BI engineers |

- **They aren't rivals:** a pipeline often runs a dataflow, a notebook and a stored procedure in sequence.
- **Failure mode:** a chain of dataflows calling dataflows with no orchestration, monitoring or retry.
- **Default:** pipeline for movement and orchestration, dataflow (or notebook, or SQL) for the transformation.

## One model vs multiple models

| One shared model | Several models |
|---|---|
| Many reports need the same definitions (Revenue, Customer) | Domains are unrelated, owned by different teams, or have very different security and refresh needs |
| You want one place to fix a definition | One model would be too big to refresh or understand |

- **Failure mode (too many):** three "Revenue" measures with three answers ([Sprint 05](experience/s05-one-revenue-semantic-model.html)). **Too few:** a 200-table model nobody can change safely.
- **Default:** one certified model per business domain; reports connect to it with live connections.

## RLS vs separate semantic models

| RLS in one model | Separate models per audience |
|---|---|
| Same structure, different rows per user | Different tables, columns or logic per audience, or a hard legal separation |
| Easier maintenance: one model | Simpler security reasoning; more copies to maintain |

- **Failure mode:** separate copies drift apart; RLS that nobody tests lets the wrong person see payroll ([Sprint 03](experience/s03-payroll-security-incident.html)).
- **Default:** RLS (and OLS for columns), with a test matrix run every release. Separate models only when the audience must not even see the model's structure or when the data is legally segregated.

## PBIX vs PBIP

- **PBIX:** personal analysis, one author, nothing to review.
- **PBIP:** anything a team maintains, anything in Git, anything deployed by a pipeline.
- **Default:** PBIP for shared content. See [Ship Power BI like software](toolkit/ship-like-software.html#pbix-vs-pbip).

## Calculation group vs separate measures

| Calculation group | Separate measures |
|---|---|
| The same transformation (YTD, PY, YoY %) applies to many base measures | Few measures, or each needs bespoke logic |
| Fewer objects to maintain | Simpler for report authors and Q&A-style tools to understand |

- **Failure mode:** calculation groups with complex precedence that nobody can debug; format strings forgotten so "YoY %" shows as currency.
- **Default:** calculation groups once you'd otherwise write the same time logic for more than a handful of measures.

## Shared semantic model vs a model inside each report

| Shared model, thin reports | Model inside the report file |
|---|---|
| Several reports, one definition, separate release cycles for model and reports | A one-off report or a prototype |
| Certified and endorsed content | Speed of building something once |

- **Failure mode:** every report file carries its own copy of the model, refreshes its own copy of the data, and drifts.
- **Default:** shared model with live-connected thin reports for anything that lasts.

## Star vs snowflake

| Star | Snowflake |
|---|---|
| Flattened dimensions: Category and SubCategory on `DimProduct` | Normalised dimension tables chained together |
| Simpler DAX, faster filters, fewer relationships | Matches some source systems; less duplication in the source |

- **Failure mode:** snowflakes with bidirectional relationships to make filters flow up the chain.
- **Default:** star in the semantic model. Normalise in the warehouse if you like; flatten before Power BI.
