---
{
  "id": "fabric-architecture",
  "title": "Which Fabric architecture should I choose?",
  "summary": "Where analytical data should live (Lakehouse, Warehouse, Eventhouse or existing SQL), how it gets there, how the semantic layer reads it, and five reference architectures from a small team to real-time.",
  "door": "reference",
  "group": "Platform",
  "kind": "decision",
  "order": 5,
  "stages": ["senior", "engineer", "architect"],
  "skills": ["fabric", "architecture", "warehousing"],
  "tools": ["fabric", "sql"],
  "problems": ["architecture", "fabric-connect", "model-design"],
  "certs": ["dp600"],
  "keywords": ["onelake", "lakehouse", "warehouse", "eventhouse", "delta", "shortcuts", "mirroring", "dataflow gen2", "pipelines", "notebooks", "direct lake", "direct lake on onelake", "direct lake on sql", "fallback", "medallion", "bronze silver gold", "capacity", "f64"],
  "lessons": ["fab-onelake", "fab-directlake", "fab-pipelines", "a-fabric"],
  "scenarios": ["s09", "s10"],
  "templates": ["adr"],
  "verified": { "date": "2026-10-02", "review_after_days": 90 },
  "refs": [
    { "t": "Fabric decision guide: choose a data store", "u": "https://learn.microsoft.com/en-us/fabric/fundamentals/decision-guide-data-store", "src": "official" },
    { "t": "OneLake overview", "u": "https://learn.microsoft.com/en-us/fabric/onelake/onelake-overview", "src": "official" },
    { "t": "Direct Lake overview", "u": "https://learn.microsoft.com/en-us/fabric/fundamentals/direct-lake-overview", "src": "official" },
    { "t": "OneLake shortcuts", "u": "https://learn.microsoft.com/en-us/fabric/onelake/onelake-shortcuts", "src": "official" },
    { "t": "Mirroring in Fabric", "u": "https://learn.microsoft.com/en-us/fabric/mirroring/overview", "src": "official" },
    { "t": "Medallion lakehouse architecture", "u": "https://learn.microsoft.com/en-us/fabric/onelake/onelake-medallion-lakehouse-architecture", "src": "official" }
  ]
}
---
## Start with the decision, not the product

Fabric gives you several places to put analytical data, all stored in OneLake as Delta tables (Eventhouse uses its own format and can make tables available in OneLake). The right choice depends on **who builds it, in what language, and how fresh it must be**:

```tree
Where should my analytical data live?
  The team writes T-SQL, needs multi-table transactions, and thinks in tables and stored procedures?
    → Warehouse
  The team uses Spark or Python, data arrives as files, or there are semi-structured and unstructured sources?
    → Lakehouse (with its read-only SQL analytics endpoint for SQL users)
  Data is events or telemetry, queried within seconds, often with time-series questions?
    → Eventhouse (KQL)
  A well-run SQL Server or Azure SQL warehouse already exists and works?
    → Keep it. Mirror it into OneLake only if you need Direct Lake or to combine it with other Fabric data
  Data lives in another cloud store and must not be copied?
    → OneLake shortcuts to ADLS Gen2, Amazon S3 and other supported sources
```

Most enterprise designs end up with a Lakehouse for raw and cleaned data and either a Warehouse or a "gold" Lakehouse for the dimensional model that semantic models read.

## Storage

| Item | What it is | Write with | Read with |
|---|---|---|---|
| **OneLake** | One logical data lake per tenant; every Fabric item stores its data here | Each item's engine | Any Fabric engine, and ADLS-compatible APIs |
| **Lakehouse** | Files and Delta tables, plus an automatic SQL analytics endpoint | Spark, Dataflow Gen2, pipelines | Spark, SQL (read-only through the endpoint), Direct Lake |
| **Warehouse** | Relational warehouse with full T-SQL DDL and DML | T-SQL, pipelines, Dataflow Gen2 | T-SQL, Direct Lake, Spark (read) |
| **Eventhouse** | KQL databases for streaming and time-series data | Eventstreams, ingestion APIs | KQL, Real-Time dashboards, OneLake availability |
| **Delta** | The open table format (Parquet plus a transaction log) behind Lakehouse and Warehouse tables | | |
| **Shortcuts** | Pointers to data in other OneLake locations or external stores, without copying | | Like local tables |

## Ingestion

| Tool | Best for |
|---|---|
| **Mirroring** | Near real-time replication of supported operational databases into OneLake (for example Azure SQL, Snowflake, Cosmos DB and SQL Server through a gateway) with no pipelines to maintain |
| **Pipelines** | Orchestration: copy activities, scheduling, dependencies, calling notebooks and stored procedures |
| **Dataflow Gen2** | Low-code Power Query transformations, writing to a Lakehouse or Warehouse; the natural step up from Power Query in a model |
| **Notebooks** | Spark (PySpark, Spark SQL) for large-scale or complex transformation and data engineering |
| **Shortcuts** | Making data available without moving it |

The medallion pattern (bronze raw, silver cleaned, gold modelled) is a sensible default for organising those steps. It is a convention, not a feature, so keep the layers your team can actually maintain.

## Semantic layer

| Mode | How it reads data | Choose it when |
|---|---|---|
| **Import** | Copies data into the model at refresh | Small to large models, any source, fastest queries, data can be minutes to hours old |
| **DirectQuery** | Sends queries to the source per visual | Data must be current to the second, or is too big to import, and the source is fast |
| **Direct Lake on OneLake** | Reads Delta tables from OneLake directly into the VertiPaq engine; can combine tables from several Fabric items | Data is already in Fabric as Delta; you want import-like speed without scheduled copies |
| **Direct Lake on SQL endpoint** | Reads Delta tables through one Lakehouse's or Warehouse's SQL analytics endpoint | You need to use SQL views, or want automatic fallback to DirectQuery |
| **Composite** | Mixes storage modes in one model | Aggregations in Import over a DirectQuery detail table, or a local model extending a shared one |

> **Warning:** The two Direct Lake variants behave differently. **Direct Lake on OneLake doesn't fall back to DirectQuery**: if a query can't be answered in Direct Lake it errors rather than silently becoming slow. **Direct Lake on SQL endpoint can fall back to DirectQuery** (for example when it reads a SQL view, when SQL-endpoint security applies, or when a table exceeds capacity guardrails), and the `DirectLakeBehavior` property controls whether that's allowed. Know which one your model uses before you promise performance. The [Direct Lake in depth](fabric.html#fab-directlake) topic has hands-on exercises.

## Reference architectures

### Small team, Power BI only

```diagram
 Sources ──► Power Query in each model ──► Import semantic models ──► Reports & apps
   (SQL, files, SaaS)        (Pro or PPU workspaces, gateway for on-premises sources)
```

No Fabric capacity needed. Upgrade when the same cleaning logic is copied into several models, or a model hits size and refresh limits.

### Enterprise BI on Fabric

```diagram
 Sources ──► Pipelines / Mirroring ──► Lakehouse (bronze, silver) ──► Warehouse or gold Lakehouse
                                                                          │ star schema
                                                                          ▼
                                    Certified Direct Lake or Import semantic models ──► Reports & apps
```

One certified model per business domain; reports connect to it with live connections.

### Lakehouse-centric

Spark-heavy teams land everything in Lakehouses and build gold Delta tables with notebooks; analysts query through the SQL analytics endpoint; semantic models use Direct Lake on OneLake.

### Warehouse-centric

SQL teams load staging tables with pipelines and transform with stored procedures in a Warehouse. It's the closest to a classic SQL Server warehouse, with T-SQL skills reused directly.

### Real-time analytics

```diagram
 Event sources ──► Eventstream ──► Eventhouse (KQL) ──► Real-Time dashboards / alerts
                                         │ OneLake availability
                                         ▼
                                Lakehouse / semantic model for historical reporting
```

## Capacity and licensing basics

- Fabric items need a Fabric capacity (F SKUs) or a trial. Power BI-only workloads can still run on Pro or Premium Per User.
- Viewers without a Pro or PPU licence can consume content only in workspaces on F64 or larger capacities (or P SKUs).
- Everything on a capacity shares its compute: one heavy notebook or refresh can throttle reports. Watch the [Fabric Capacity Metrics app](https://learn.microsoft.com/en-us/fabric/enterprise/metrics-app) and see the [production runbook](toolkit/production-runbook.html#capacity-overloaded).

## Write the decision down

Whatever you choose, record the context, options, decision and the trigger to revisit it in an [architecture decision record](templates.html#tpl-adr). [Sprint 09](experience/s09-fabric-migration-decision.html) is a full Fabric migration decision to practise on, and the [decision library](toolkit/decision-library.html#lakehouse-vs-warehouse) compares the common pairs.
