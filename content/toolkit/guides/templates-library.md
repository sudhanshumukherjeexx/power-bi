---
{
  "id": "templates-library",
  "title": "Professional templates library",
  "summary": "Twenty-six documents BI teams actually produce, from requirements and KPI definitions to ADRs, RLS matrices, runbooks, postmortems and COE charters, each with an example, where it's used, and a Markdown download.",
  "door": "templates",
  "kind": "library",
  "order": 1,
  "stages": ["analyst", "developer", "senior", "engineer", "architect"],
  "skills": ["communication", "testing", "governance", "deployment", "architecture"],
  "tools": [],
  "problems": ["metric-disagreement", "deployment", "governance", "model-design"],
  "keywords": ["templates", "documents", "requirements document", "kpi definition", "data dictionary", "source to target", "model design", "adr", "rls matrix", "validation plan", "uat", "performance benchmark", "deployment checklist", "release notes", "runbook", "incident report", "rca", "postmortem", "pr template", "code review", "ownership matrix", "raci", "deprecation", "capacity review", "coe charter"],
  "templates": ["requirements", "kpi-dictionary", "adr", "postmortem"],
  "verified": { "date": "2026-10-02", "review_after_days": 365 },
  "refs": []
}
---
## Why templates

Most of a senior BI developer's influence happens in documents, not in DAX: the requirements that stop the wrong report being built, the KPI definition that ends an argument, the ADR that explains a decision two years later, the postmortem that stops an incident happening twice. These templates are short on purpose, and each has a worked Northwind example.

Every Experience Mode scenario asks you to produce one or more of them; the "Used in" links take you to those scenarios.

## When to use which

| You are… | Produce |
|---|---|
| Starting from a vague request | Requirements and open questions, assumptions log |
| Ending an argument about a number | KPI dictionary, validation and reconciliation |
| Designing or documenting a model | Model design document, data dictionary, source-to-target mapping |
| Making a decision someone will question later | Architecture decision record (ADR) |
| Securing a model | RLS / OLS test matrix |
| Proving it works | Validation plan, UAT plan, performance before/after report |
| Shipping | Pull request description, code review checklist, deployment checklist, release notes |
| Operating | Runbook, incident report, blameless postmortem, capacity review |
| Governing | Ownership matrix (RACI), workspace naming standard, certification checklist, deprecation checklist, governance assessment, COE charter, data contract |

## All templates

::: templates

## Make them yours

Download the Markdown, put it in your team's wiki or repository, and change it: add your company's fields, remove what you never use. A template that matches how your team works will be used; a perfect one that doesn't won't. The printable [checklists](toolkit/checklists.html) complement these documents.
