# What's broken?

Twelve decision trees for the problems BI developers search for most: wrong numbers and totals, failed refresh, slow reports, relationships, RLS, gateways, DirectQuery, deployments, Fabric connections, folding and memory.

From the BI Developer Toolkit: https://sudhanshumukherjeexx.github.io/power-bi/toolkit/whats-broken.html

## How to use these trees

Pick the symptom, follow the questions top to bottom, and stop at the first branch that matches. Each tree ends in an action and a link to the guide with the detail. If the problem affects users right now, start the [production runbook](https://sudhanshumukherjeexx.github.io/power-bi/toolkit/production-runbook.html) in parallel: mitigate first, diagnose second.

## My number is wrong

```tree
A number is wrong
  Do you know the right number, from the source, by hand?
    → No: get it first. Reconcile one cell with a SQL query or a filtered export.
  Is it wrong everywhere, including the total?
    → Duplicated rows (re-exports, bad merges), wrong types, wrong base measure. See "Inspect the base measure".
  Only for some members (one region, one month)?
    → Missing or mismatched keys for those members; currency or time-zone logic; late-arriving data.
  Did it change without anyone touching the report?
    → The data changed: check the refresh history and the source for re-loads, late corrections and schema changes.
  Only after a slicer?
    → The measure overrides the filter. See "Slicer changes it".
```

Detail: [My DAX is wrong](https://sudhanshumukherjeexx.github.io/power-bi/toolkit/dax-debugging.html#inspect-the-base-measure) · Practise: [Finance disputes the dashboard](https://sudhanshumukherjeexx.github.io/power-bi/experience/s02-finance-disputes-revenue.html)

## My total is wrong

```tree
The rows look right but the total doesn't
  Is the measure an average, ratio, distinct count, MAX or a balance?
    → The total isn't meant to be the sum of the rows. Decide what the business wants and code it with ISINSCOPE.
  Does the measure use IF, SELECTEDVALUE or HASONEVALUE?
    → At the total the condition evaluates differently. Iterate over the rows' grain with SUMX ( VALUES ( … ), [Measure] ).
  Is it a stock, balance or headcount summed over time?
    → Semi-additive: take the last date, not the sum.
```

Detail: [The total is wrong](https://sudhanshumukherjeexx.github.io/power-bi/toolkit/dax-debugging.html#the-total-is-wrong)

## My refresh failed

```tree
Refresh failed
  Read the error in refresh history first. Which kind?
    Credentials invalid or expired?
      → Update the credential; move to a service account or service principal with an owner.
    Gateway unreachable or offline?
      → Check gateway status, restart the service, check network; see "My gateway is offline".
    Column not found, conversion error?
      → The source schema changed. Fix the query; agree a data contract.
    Out of memory, timeout?
      → Model too big for the capacity or queries not folding. Remove columns, incremental refresh, fold.
    Dynamic data source?
      → Rewrite Web.Contents with a static base URL and RelativePath / Query.
  Did it fail once, or keep failing?
    → Repeated consecutive failures disable the schedule: fix, then re-enable it.
```

Detail: [Production runbook: refresh failed](https://sudhanshumukherjeexx.github.io/power-bi/toolkit/production-runbook.html#refresh-failed) · [Error decoder](https://sudhanshumukherjeexx.github.io/power-bi/toolkit/error-decoder.html#refresh) · Practise: [Sprint 08](https://sudhanshumukherjeexx.github.io/power-bi/experience/s08-cfo-refresh-outage.html)

## My report is slow

```tree
The report is slow
  Run Performance Analyzer. Where is the time?
    Mostly "DAX query" for one or two visuals?
      → DAX or model problem: DAX Studio Server Timings. See the Performance Clinic's DAX section.
    Mostly "Visual display" or "Other", spread across many visuals?
      → Too many visuals, heavy custom visuals, or high-cardinality slicers: simplify the page.
    Slow only in the Service, fine in Desktop?
      → Capacity load, gateway latency (DirectQuery), or RLS making queries heavier.
    Slow for everyone at the same time of day?
      → Capacity throttling: check the Capacity Metrics app.
```

Detail: [Performance Clinic](https://sudhanshumukherjeexx.github.io/power-bi/toolkit/performance-clinic.html) · Practise: [Sprint 04](https://sudhanshumukherjeexx.github.io/power-bi/experience/s04-monday-performance-incident.html)

## My relationship doesn't work

```tree
A dimension doesn't filter the facts
  Is the relationship active (solid line)?
    → Inactive: use USERELATIONSHIP in the measure, or make it active if it should be the default.
  Does the filter flow that way (one side to many side)?
    → Wrong direction: filter from the dimension, not from the fact. Avoid "Both" unless you can explain why.
  Do the key values match exactly?
    → Different types, trailing spaces, leading zeros: fix upstream.
  Are facts landing on the blank row?
    → Keys missing from the dimension: count them with an anti join and add the members.
```

Detail: [Relationship not filtering](https://sudhanshumukherjeexx.github.io/power-bi/toolkit/dax-debugging.html#relationship-not-filtering)

## My RLS doesn't work

```tree
RLS shows too much or too little
  Who are you testing as?
    → Workspace Admins, Members and Contributors aren't restricted by RLS. Test as a Viewer or with View as.
  Is the user (or their group) a member of a role in the Service?
    → Roles are defined in Desktop but members are assigned in the Service, per semantic model.
  Is the user in more than one role?
    → Roles are combined: the user sees the union of what each role allows.
  Does the rule filter the right table, and does that filter reach the facts?
    → Check relationship direction from the security table; a bidirectional filter may be needed for some dynamic patterns (with "apply security filter in both directions").
  Does USERPRINCIPALNAME() return what your mapping table contains?
    → Test it: a card with the measure USERPRINCIPALNAME() under View as. Guest users and email vs UPN differences are common.
```

Detail: [Security field guide](https://sudhanshumukherjeexx.github.io/power-bi/toolkit/security-field-guide.html#rls-testing-checklist) · Practise: [Sprint 03](https://sudhanshumukherjeexx.github.io/power-bi/experience/s03-payroll-security-incident.html)

## My gateway is offline

```tree
The gateway shows offline or can't be reached
  Is the gateway machine on and the gateway service running?
    → Start the machine and service; check it isn't sleeping or mid-patch.
  Did the gateway service account's password change?
    → Update it in the gateway configurator.
  Is outbound network access allowed (to Azure Relay / Service Bus endpoints)?
    → Run the network ports test in the gateway app; check firewall and proxy changes.
  Is it a single gateway?
    → Add a second member to the cluster so patching one doesn't stop refresh.
```

Detail: [Production runbook: gateway offline](https://sudhanshumukherjeexx.github.io/power-bi/toolkit/production-runbook.html#gateway-offline)

## My DirectQuery report is slow

```tree
DirectQuery visuals are slow
  Copy the SQL from Performance Analyzer and run it at the source. Is the source query slow?
    → Index, statistics, a view that pre-joins, or an aggregated table. Read the execution plan.
  Is the source fast but the visual slow?
    → Many visuals each sending queries, high-cardinality columns, complex measures that generate several queries, gateway latency.
  Do users only need summaries most of the time?
    → Aggregation tables in Import over the DirectQuery detail, or switch to Import or Direct Lake.
```

Detail: [Performance Clinic: DirectQuery](https://sudhanshumukherjeexx.github.io/power-bi/toolkit/performance-clinic.html#directquery) · [SQL for BI](https://sudhanshumukherjeexx.github.io/power-bi/toolkit/sql-for-bi.html#reading-an-execution-plan)

## My deployment broke

```tree
Something is wrong after a deployment
  Is the content pointing at the right data source for this stage?
    → Deployment rules or parameter.yml values missing for the target stage.
  Did the report rebind to the right semantic model?
    → Reports in Production must use the Production model, not Test.
  Did a measure, column or table get renamed or removed?
    → Reports that used it now show errors. Check with lineage or the report's fields before merging.
  Is it a permissions problem (users can't see it)?
    → The app wasn't updated, or the audience doesn't include them.
  Can you roll back?
    → Redeploy the previous release, then investigate.
```

Detail: [Ship like software: rollback](https://sudhanshumukherjeexx.github.io/power-bi/toolkit/ship-like-software.html#rollback) · Practise: [Sprint 07](https://sudhanshumukherjeexx.github.io/power-bi/experience/s07-test-prod-deployment-failure.html)

## My Fabric item can't connect

```tree
A Fabric item or model can't read data
  Is it a permissions problem?
    → The identity needs access to the workspace or the item (and to the source for shortcuts).
  Is the Lakehouse table actually a Delta table in the Tables area?
    → Files aren't tables until loaded or converted.
  Is it Direct Lake?
    → On OneLake: no fallback, so guardrail or permission problems show as errors. On SQL endpoint: check fallback settings and SQL-endpoint security.
  Is the source on-premises?
    → Needs a gateway connection for pipelines, Dataflow Gen2 and mirroring of SQL Server.
```

Detail: [Fabric architecture](https://sudhanshumukherjeexx.github.io/power-bi/toolkit/fabric-architecture.html#semantic-layer)

## Power Query won't fold

```tree
A query doesn't fold
  Which step is the first that doesn't fold (View Native Query greyed out)?
    → Move filters and column removal before it.
  Is it an index column, Table.Buffer, a custom function per row, or a merge with another source?
    → Do that work at the source (a view) or after the folding steps.
  Is incremental refresh involved?
    → The RangeStart/RangeEnd filter must fold, or every partition reads the whole table.
```

Detail: [Power Query field guide: query folding](https://sudhanshumukherjeexx.github.io/power-bi/toolkit/power-query-field-guide.html#query-folding)

## Power BI uses too much memory

```tree
The model is big or refresh runs out of memory
  Run VertiPaq Analyzer. What's biggest?
    High-cardinality columns (timestamps, IDs, free text)?
      → Remove them, split date and time, round, or move to a detail table in DirectQuery.
    Calculated columns and tables?
      → Compute upstream instead.
    Auto date/time tables everywhere?
      → Turn off Auto date/time and use one date table.
  Does it fail only during refresh?
    → Refresh needs room for the old and new copies: refresh fewer tables at once, use incremental refresh, or a bigger capacity.
```

Detail: [Performance Clinic: model performance](https://sudhanshumukherjeexx.github.io/power-bi/toolkit/performance-clinic.html#model-performance)
