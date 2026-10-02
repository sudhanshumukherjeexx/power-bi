---
{
  "id": "ship-like-software",
  "title": "Ship Power BI like software",
  "summary": "PBIX vs PBIP, the PBIP folder, TMDL, Git, branches, pull requests and code review, deployment pipelines, Dev/Test/Prod, parameters and rules, rollback, hotfixes and CI/CD with fabric-cicd, with starter files to download.",
  "door": "tools",
  "group": "Engineering",
  "kind": "guide",
  "order": 3,
  "stages": ["senior", "engineer", "architect"],
  "skills": ["deployment", "automation", "testing"],
  "tools": ["git", "vscode", "deployment-pipelines", "fabric-cicd", "python", "alm-toolkit"],
  "problems": ["deployment"],
  "certs": ["dp600"],
  "keywords": ["pbip", "pbir", "tmdl", "git integration", "branch", "pull request", "code review", "deployment pipelines", "deployment rules", "dev test prod", "rollback", "hotfix", "ci/cd", "github actions", "azure devops", "fabric-cicd", "release notes", ".gitignore"],
  "lessons": ["a-deploy", "qa-ops"],
  "scenarios": ["s06", "s07", "d03", "d04"],
  "templates": ["pull-request", "release-notes", "deployment-checklist"],
  "files": [
    { "name": "pbip.gitignore", "title": ".gitignore for PBIP repositories" },
    { "name": "deploy.py", "title": "fabric-cicd deployment script" },
    { "name": "parameter.yml", "title": "fabric-cicd environment parameters" },
    { "name": "deploy-pbip.yml", "title": "GitHub Actions workflow" },
    { "name": "branching-guide.md", "title": "Branching guide" }
  ],
  "verified": { "date": "2026-10-02", "review_after_days": 120 },
  "refs": [
    { "t": "Power BI Desktop projects (PBIP)", "u": "https://learn.microsoft.com/en-us/power-bi/developer/projects/projects-overview", "src": "official" },
    { "t": "Deploy PBIP using fabric-cicd", "u": "https://learn.microsoft.com/en-us/power-bi/developer/projects/projects-deploy-fabric-cicd", "src": "official" },
    { "t": "Fabric Git integration", "u": "https://learn.microsoft.com/en-us/fabric/cicd/git-integration/intro-to-git-integration", "src": "official" },
    { "t": "Deployment pipelines", "u": "https://learn.microsoft.com/en-us/fabric/cicd/deployment-pipelines/intro-to-deployment-pipelines", "src": "official" },
    { "t": "TMDL overview", "u": "https://learn.microsoft.com/en-us/analysis-services/tmdl/tmdl-overview", "src": "official" },
    { "t": "fabric-cicd documentation", "u": "https://microsoft.github.io/fabric-cicd/latest/", "src": "official" }
  ]
}
---
## Why treat a report like software

A PBIX file on a shared drive has no history, no review and no safe way for two people to work on it. When something breaks in Production, nobody can say what changed. Software teams solved this decades ago with source control, review, automated checks and repeatable deployments. Power BI now supports all of them.

## PBIX vs PBIP

| | PBIX | PBIP (Power BI project) |
|---|---|---|
| Format | One binary file | A folder of text files |
| Diff and review | No | Yes: every measure and visual change is a readable diff |
| Two people at once | Last save wins | Merge in Git |
| Data | Stored in the file | Not committed (cache stays local) |
| Best for | Personal analysis, sharing a one-off | Anything a team maintains |

Save as PBIP from Desktop: **File → Save as → Power BI project (.pbip)**.

## Inside a PBIP project

```diagram
Sales.pbip
Sales.SemanticModel/
    definition.pbism
    definition/
        model.tmdl            model properties
        relationships.tmdl
        tables/
            FactSales.tmdl    columns, measures, partitions (the M query)
            DimDate.tmdl
        roles/                RLS roles
    .pbi/localSettings.json   per user: never commit
    .pbi/cache.abf            the data: never commit
Sales.Report/
    definition.pbir           which semantic model the report uses
    definition/pages/…        one folder per page, one file per visual (PBIR format)
```

**TMDL** (Tabular Model Definition Language) is the model as readable text. A measure looks like this:

```text
measure 'Net Sales' =
        SUMX ( FactSales, FactSales[Quantity] * FactSales[UnitPrice] * ( 1 - FactSales[Discount] ) )
    formatString: \$#,0.00
    displayFolder: Sales
```

**PBIR**, the default report format for new projects, stores each page and visual as its own JSON file, so two people editing different pages don't conflict.

## Git fundamentals for BI developers

```bash
git clone https://github.com/<your-org>/sales-bi.git
git switch -c feature/BI-1103-revenue-measure   # one branch per ticket
# open Sales.pbip in Desktop, change, save, close Desktop
git status                                      # what changed
git diff                                        # how it changed
git add Sales.SemanticModel
git commit -m "BI-1103: certified Revenue excludes returns and test orders"
git push -u origin feature/BI-1103-revenue-measure
```

Download the [.gitignore for PBIP](toolkit/files/pbip.gitignore) so per-user files and data caches never reach the repository, and the [branching guide](toolkit/files/branching-guide.md).

## Branches, pull requests and code review

- **Branches:** `main` = Production, `dev` = Development, a short-lived `feature/…` branch per ticket, `hotfix/…` for incidents.
- **Pull requests:** every change reaches `dev` and `main` through a PR with a [description](templates.html#tpl-pull-request): what, why, how tested, risk, rollback.
- **Review for:** correct numbers (did they reconcile?), measure logic and naming, relationship and RLS changes (these are high-risk), hidden or removed fields that reports use, performance (new high-cardinality columns), and anything that touches Production data sources.

Practise reviewing in the [pull request drill](experience/d03-pull-request-review.html) and resolving conflicts in [Sprint 06](experience/s06-pbip-merge-conflict.html).

## Dev, Test and Prod

| Stage | Who uses it | Data |
|---|---|---|
| Development | Developers | Dev or a small sample |
| Test | Testers and business UAT | Production-like (masked if sensitive) |
| Production | Everyone else | Production |

The same content must point at different sources in each stage. Use **parameters** in Power Query for server and database names, and:

- with **deployment pipelines**, set **deployment rules** (parameter rules and data source rules) on the target stage;
- with **fabric-cicd**, list each environment's values in [parameter.yml](toolkit/files/parameter.yml).

## Deployment pipelines

Fabric deployment pipelines copy content between workspaces assigned to stages, compare stages, and apply rules. Good habits:

1. Deploy to Test, run the checks, get sign-off, then deploy to Production.
2. Set rules once per stage and check them after every new data source.
3. After deploying, open one known number in the target stage. [Sprint 07](experience/s07-test-prod-deployment-failure.html) is what happens when nobody does.
4. Use the [deployment checklist](templates.html#tpl-deployment-checklist).

## CI/CD

With PBIP in Git, a pipeline can deploy what was merged, so Production always matches `main`. Microsoft's documented route is **fabric-cicd**, a Microsoft-backed open-source Python library:

1. `pip install fabric-cicd`.
2. A [deployment script](toolkit/files/deploy.py) builds a `FabricWorkspace` for the target workspace and environment and calls `publish_all_items`.
3. [parameter.yml](toolkit/files/parameter.yml) swaps environment-specific values (servers, lakehouse IDs) at deploy time.
4. A [GitHub Actions workflow](toolkit/files/deploy-pbip.yml) maps the branch to the workspace, signs in as a service principal and runs the script. Azure DevOps works the same way.

Prerequisites: a service principal with Contributor on the target workspaces, the tenant setting that allows service principals to call Fabric public APIs, and data source credentials configured once in the Service after the first deployment.

Add checks before deploy: Best Practice Analyzer rules, a test that the model loads, and tests that query known numbers (see [refresh tests and regression](testing.html#qa-ops)).

## Release notes

Users should never discover a change by noticing a number moved. Every Production release gets [release notes](templates.html#tpl-release-notes): what changed for users, any number that will differ and why, and who to ask.

## Rollback

Rollback must be boring:

- Tag each Production release. Rolling back = redeploy the previous tag through the same pipeline.
- Changes that alter data (a new partition scheme, a dropped column) may need a refresh after rollback; say so in the PR.
- If you can't roll back a change, it needs a Test run that mirrors Production and an explicit sign-off.

## Hotfixes

When Production is wrong now:

1. **Mitigate first:** roll back, or hide the broken page and tell users.
2. Branch `hotfix/INC-…` from `main`, make the smallest fix, get a fast review from one other person, deploy through the pipeline.
3. Merge the hotfix back into `dev` so it isn't lost in the next release.
4. Write the [postmortem](templates.html#tpl-postmortem).

The [hotfix or rollback drill](experience/d04-hotfix-or-rollback.html) practises the decision.
