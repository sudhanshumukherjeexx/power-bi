---
{
  "id": "career-toolkit",
  "title": "Career toolkit",
  "summary": "The Power BI role map (analyst, BI developer, analytics engineer, senior, BI engineer, Fabric analytics engineer, architect, lead): what each does, skills, tools, portfolio and interview expectations, plus resume bullets, a portfolio guide and STAR stories for BI incidents.",
  "door": "career",
  "kind": "career",
  "order": 1,
  "stages": ["analyst", "developer", "senior", "engineer", "architect"],
  "skills": ["communication", "architecture"],
  "tools": ["git"],
  "problems": ["career", "interview"],
  "keywords": ["career", "roles", "job titles", "data analyst vs bi developer", "analytics engineer", "senior bi developer", "bi engineer", "fabric analytics engineer", "bi architect", "bi lead", "resume", "cv", "portfolio", "github portfolio", "star stories", "interview storytelling", "promotion"],
  "lessons": ["a-gov"],
  "scenarios": ["d08", "s10"],
  "verified": { "date": "2026-10-02", "review_after_days": 365 },
  "refs": [
    { "t": "Microsoft Learn: Power BI Data Analyst career path", "u": "https://learn.microsoft.com/en-us/credentials/certifications/data-analyst-associate/", "src": "official" },
    { "t": "Microsoft Learn: Fabric Analytics Engineer certification", "u": "https://learn.microsoft.com/en-us/credentials/certifications/fabric-analytics-engineer-associate/", "src": "official" }
  ]
}
---
## The role map

Titles vary wildly between companies; responsibilities don't. Read the job description for what you'd **own**, not the title.

| Role | What they actually do | Core skills and tools | Portfolio should show | Interviews test |
|---|---|---|---|---|
| **Data Analyst** | Answers business questions with reports; cleans data; explains findings | Power Query, star schema basics, everyday DAX, visuals, Excel, some SQL | Two or three reports built from messy data, with the question each answers | Building a measure live, explaining a chart, a cleaning exercise |
| **BI Developer** | Builds and maintains semantic models and reports others rely on | Modeling, intermediate DAX, RLS, Service, deployment basics, SQL | A model with documented measures, RLS and tests; a before/after performance fix | Filter context, relationships, RLS, debugging a wrong number |
| **Analytics Engineer** | Builds the transformed, tested data layer under the models | SQL, dbt-style transformation, warehousing, testing, Git | A transformation pipeline with tests and documentation | SQL, dimensional modeling, data quality, version control |
| **Senior BI Developer** | Owns a domain's models end to end; reviews others' work; handles incidents | Advanced DAX, performance, composite models, deployment, stakeholder management | A certified-style model, a postmortem, a code review | Performance diagnosis, design trade-offs, an incident story |
| **BI Engineer** | Automates and operates the platform: CI/CD, APIs, monitoring | PBIP, Git, pipelines, REST APIs, XMLA, PowerShell or Python | A repository with CI/CD, an inventory script, tests that run in CI | Automation design, deployment failures, security of service principals |
| **Fabric Analytics Engineer** | Designs and builds analytics solutions across Fabric | Lakehouse, Warehouse, Direct Lake, pipelines, semantic models, DP-600 skills | An end-to-end Fabric solution with a written architecture decision | Store choice, Direct Lake, governance, performance |
| **BI Architect** | Designs the platform and the target architecture; sets standards | Architecture, governance, security, capacity, cost, communication | Architecture decision records and a target-state design | Trade-offs under constraints, migration plans, saying no well |
| **BI Lead** | Leads the team and the BI function; owns adoption and outcomes | Prioritisation, governance, hiring, stakeholder management | Evidence of outcomes: adoption, fewer incidents, decisions made | Leadership scenarios, conflict, strategy, measuring success |

The [career paths](learn.html#paths) map these roles to the lessons, and the professional stages on your [progress page](progress.html) track what you've shown.

## What changes with seniority

| From → to | What changes |
|---|---|
| Analyst → Developer | From "my report" to "a model other people build on". Correctness, reuse and documentation start to matter more than polish |
| Developer → Senior | From doing tickets to owning outcomes: you're the one called when it breaks, you review others' work, you push back on bad requests |
| Senior → Engineer or Architect | From one model to the platform: automation, standards, architecture, cost |
| Architect → Lead | From decisions to people: hiring, priorities, adoption, saying no to the right things |

## Resume bullets that work

Lead with the outcome, quantify it, name the technique:

- "Reduced executive dashboard load time from 18 s to 2.4 s by removing a bidirectional many-to-many relationship and rewriting three iterator measures; verified with DAX Studio Server Timings."
- "Built a certified sales semantic model that replaced three conflicting Revenue definitions; reconciled to the general ledger to the cent and adopted by 14 reports."
- "Introduced PBIP, Git and a deployment pipeline with automated post-deployment checks; deployment incidents fell from four per quarter to none."
- "Designed dynamic RLS for 40 regional managers from an HR mapping table, with a test matrix run every release."

Avoid: "Responsible for Power BI reports", "Used DAX", lists of every visual type.

## Portfolio guide

A hiring manager spends a few minutes on your portfolio. Make each project answer: **what was the question, what was messy, what did you decide and why, how do you know the numbers are right?**

1. Two or three projects, not ten. Depth beats breadth.
2. Use this course's Experience Mode deliverables: they're realistic and you can show the reasoning, not just the screenshot.
3. Show artifacts: a KPI dictionary, an ADR, a postmortem. Few candidates do, and they're what seniors produce.
4. Never publish employer data. Northwind and the enterprise generator exist so you don't have to.

## GitHub portfolio structure

```diagram
my-bi-portfolio/
  README.md                       who you are, the projects, how to open them
  01-executive-sales/
    README.md                     the question, the mess, decisions, validation, screenshots
    Sales.pbip  Sales.SemanticModel/  Sales.Report/
    docs/kpi-dictionary.md  docs/validation.md
  02-performance-fix/
    README.md                     before/after numbers and what changed
    docs/performance-report.md
  03-fabric-architecture/
    docs/adr-001-target-platform.md
```

## Interview storytelling

Interviewers remember stories, not lists. Use **STAR**: Situation, Task, Action, Result, and add what you learned.

### How to explain a BI project in two minutes

1. **The business problem** (one sentence, in business terms).
2. **What made it hard** (messy data, conflicting definitions, performance, security).
3. **Two decisions you made, and the alternatives you rejected.**
4. **How you proved it was right** (reconciliation, tests, UAT).
5. **The outcome,** with a number.

### STAR stories for BI incidents

Prepare one story for each of these; Experience Mode gives you material for all of them:

| Story | Practise with |
|---|---|
| A number was wrong and you found out why | [Finance disputes the dashboard](experience/s02-finance-disputes-revenue.html) |
| Something you built was slow and you fixed it | [Monday performance incident](experience/s04-monday-performance-incident.html) |
| A production incident you handled | [CFO refresh outage](experience/s08-cfo-refresh-outage.html) |
| You disagreed with a stakeholder | [Change requests](experience/d06-change-requests.html) |
| You explained something technical to a non-technical audience | [Explain it twice](experience/d08-explain-it-twice.html) |
| A design decision with trade-offs | [Fabric migration decision](experience/s09-fabric-migration-decision.html) |
