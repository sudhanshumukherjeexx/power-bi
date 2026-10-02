---
{
  "id": "checklists",
  "title": "Checklists for real work",
  "summary": "Twelve printable checklists you keep using at work: before publishing, before deploying, before creating a measure, model, performance and RLS reviews, gateway, refresh, Fabric architecture, code review, production readiness and incident response.",
  "door": "patterns",
  "group": "Checklists",
  "kind": "checklist",
  "order": 11,
  "stages": ["analyst", "developer", "senior", "engineer", "architect"],
  "skills": ["testing", "deployment", "security", "performance", "modeling", "governance"],
  "tools": ["desktop", "service", "gateway", "deployment-pipelines", "git"],
  "problems": ["deployment", "rls", "slow-report", "refresh-failed", "model-design", "gateway"],
  "keywords": ["checklist", "before publishing", "before deploying", "go live", "production readiness", "code review", "model review", "performance review", "rls review", "incident response", "printable"],
  "lessons": ["qa-model", "qa-security", "qa-ops", "a-deploy"],
  "scenarios": ["s07", "d02", "d03"],
  "templates": ["deployment-checklist", "code-review-checklist", "rls-test-matrix", "uat-plan"],
  "download": true,
  "verified": { "date": "2026-10-02", "review_after_days": 365 },
  "refs": [
    { "t": "Power BI implementation planning", "u": "https://learn.microsoft.com/en-us/power-bi/guidance/powerbi-implementation-planning-introduction", "src": "official" },
    { "t": "Deployment pipelines best practices", "u": "https://learn.microsoft.com/en-us/fabric/cicd/best-practices-cicd", "src": "official" }
  ]
}
---
## How to use these

Tick boxes as you go: your ticks are saved in this browser, so you can come back to a half-finished review. **Print** gives a clean copy, and **Download .md** gives you all twelve to paste into a ticket, a wiki or a pull request. Adapt them: a checklist your team actually uses beats a perfect one nobody opens.

## Before publishing a report

- [ ] The report answers the questions in the requirements, and the requester has seen it
- [ ] Every number reconciles with the source for at least one period ([validation plan](templates.html#tpl-validation-plan))
- [ ] Titles say what each visual shows, including period and units
- [ ] Filters and slicers have sensible defaults; no stray filters left from development
- [ ] Page navigation works; hidden helper pages are hidden
- [ ] Alt text, tab order and contrast checked
- [ ] Mobile layout set if people will open it on a phone
- [ ] Sensitivity label applied
- [ ] Refresh schedule and failure notifications configured
- [ ] It's in the right workspace and app audience, not shared from My workspace

## Before deploying to Production

- [ ] The change was reviewed (pull request approved)
- [ ] Tested in Test with production-like data, and UAT signed off where users are affected
- [ ] Deployment rules or parameters set for every data source in the target stage
- [ ] Renamed or removed fields checked against reports that use them
- [ ] RLS test matrix re-run if roles, relationships or the security table changed
- [ ] Release notes written and users told about any number that will change
- [ ] Rollback plan known (previous release tag or stage)
- [ ] After deploying: refresh succeeded, one known number checked in Production, app updated

## Before creating a measure

- [ ] Does a measure for this already exist (check the KPI dictionary and the certified model)?
- [ ] Is the definition agreed with the data owner, in writing?
- [ ] Is the grain clear: what happens at the total, and for periods with no data?
- [ ] Name, format string, display folder and description decided
- [ ] Expected values for at least two filter combinations written down before you write DAX

## Model review checklist

- [ ] Grain of every fact table documented
- [ ] Star schema: dimensions filter facts; no fact-to-fact relationships
- [ ] Relationships one-to-many, single direction; exceptions explained in descriptions
- [ ] One marked date table, continuous, covering all facts; auto date/time off
- [ ] Keys and technical columns hidden; Summarize by: None on non-additive numbers
- [ ] Every measure has a description, format and display folder
- [ ] No unused columns or tables; high-cardinality columns justified
- [ ] Calculated columns moved upstream where possible
- [ ] Best Practice Analyzer run; remaining warnings accepted on purpose
- [ ] RLS and OLS roles documented and tested

## Performance review checklist

- [ ] Baseline recorded (page load and slowest visual, cold cache) on the target capacity
- [ ] Performance Analyzer: time split into DAX vs display for the slowest visuals
- [ ] DAX Studio Server Timings for the slowest query: FE vs SE, number of SE queries, callbacks
- [ ] VertiPaq Analyzer: biggest tables and columns explained
- [ ] Visual count and slicer cardinality reasonable on each page
- [ ] DirectQuery: source queries and indexes checked; aggregations considered
- [ ] Fix measured with the same method; before and after in the [performance report](templates.html#tpl-performance-report)
- [ ] A regression check added (performance budget)

## RLS review checklist

- [ ] Roles and their filters listed with the business rule each implements
- [ ] Members assigned as security groups in the Service
- [ ] Tested with View as for each role and as a real Viewer account
- [ ] Multi-role users and "all access" users tested
- [ ] Unrelated tables checked for leaks; totals checked for restricted users
- [ ] OLS tested through Analyze in Excel or a new report
- [ ] Results recorded in the [RLS test matrix](templates.html#tpl-rls-test-matrix)

## Gateway checklist

- [ ] At least two gateway members in the cluster, on supported versions
- [ ] Gateway service account and data source credentials owned by a team, with expiry dates tracked
- [ ] Machines sized for refresh and DirectQuery concurrency; CPU and memory monitored
- [ ] Gateway admins are a group, not one person
- [ ] Update and patching schedule, one member at a time
- [ ] Network rules documented (outbound connectivity the gateway needs)

## Data refresh checklist

- [ ] Queries fold where they can; date filters fold for incremental refresh
- [ ] Refresh fits comfortably within the time limit and capacity memory
- [ ] Schedule avoids peak report usage and source maintenance windows
- [ ] Failure notifications go to a monitored group
- [ ] Credentials use service accounts or service principals, not personal accounts
- [ ] Schema changes from sources are caught with a clear error, not silent nulls
- [ ] Refresh duration trended; a sudden increase is investigated

## Fabric architecture checklist

- [ ] Store chosen by team skills and workload (Lakehouse, Warehouse, Eventhouse) and recorded in an ADR
- [ ] Layers (bronze, silver, gold or equivalent) defined, with owners
- [ ] Ingestion method per source (mirroring, pipelines, Dataflow Gen2, notebooks, shortcuts)
- [ ] Semantic model mode chosen: Import, DirectQuery, Direct Lake on OneLake or on SQL endpoint, with fallback behaviour understood
- [ ] Capacity sized and monitored; noisy workloads separated
- [ ] Workspaces, domains, Git integration and deployment approach decided
- [ ] Security model: workspace roles, item permissions, OneLake data access, RLS
- [ ] Cost and licensing reviewed (capacity size, Pro or PPU needs for viewers below F64)

## Code review checklist

- [ ] The PR says what changed, why, how it was tested, the risk and the rollback
- [ ] Numbers before and after are shown for any changed measure
- [ ] DAX is readable: variables, formatting, no repeated logic
- [ ] Naming and descriptions follow the standard
- [ ] Relationship, RLS and OLS changes get an extra look
- [ ] No hard-coded server names, paths or credentials
- [ ] No removed or renamed fields that reports depend on, or the reports are updated too
- [ ] `.pbi/localSettings.json` and `cache.abf` aren't in the commit

The printable version is the [code review checklist template](templates.html#tpl-code-review-checklist).

## Production readiness checklist

- [ ] Named owner and backup owner
- [ ] Certified or promoted as appropriate; description and contact on the item
- [ ] Refresh schedule, monitoring and failure notifications in place
- [ ] Runbook for known failures ([template](templates.html#tpl-runbook))
- [ ] Security reviewed and tested; sensitivity label applied
- [ ] Performance meets the agreed budget
- [ ] Users trained or given a short guide; support route known
- [ ] Deployment path from Git or pipeline documented

## Incident response checklist

- [ ] Impact assessed: who, what, since when, are wrong numbers visible?
- [ ] Severity set and an incident lead named
- [ ] First status update sent with the time of the next one
- [ ] Mitigation applied (rollback, banner, hide page, restrict access)
- [ ] Timeline kept as you go
- [ ] Root cause found and fixed through the normal (or hotfix) path
- [ ] Users told it's resolved, and what, if anything, they need to redo
- [ ] [Postmortem](templates.html#tpl-postmortem) written within a week, with actions and owners
