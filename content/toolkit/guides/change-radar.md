---
{
  "id": "change-radar",
  "title": "Power BI and Fabric change radar",
  "summary": "Only the product and certification changes that change what a learner should know, each with the date it was checked and the lesson it affects.",
  "door": "reference",
  "group": "Updates",
  "kind": "radar",
  "order": 8,
  "stages": ["developer", "senior", "engineer", "architect"],
  "skills": ["fabric", "deployment", "performance"],
  "tools": ["dax-studio", "fabric", "fabric-cicd"],
  "problems": ["certification"],
  "certs": ["pl300", "dp600"],
  "keywords": ["what's new", "changes", "updates", "release", "dp-600 change", "pbir", "direct lake", "copilot", "delta analyzer", "fabric-cicd"],
  "lessons": ["fab-directlake", "a-deploy", "mod-copilot", "gov-protect"],
  "verified": { "date": "2026-10-02", "review_after_days": 60 },
  "refs": [
    { "t": "DP-600 study guide", "u": "https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/dp-600", "src": "official" },
    { "t": "PL-300 study guide", "u": "https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/pl-300", "src": "official" },
    { "t": "DAX Studio blog", "u": "https://daxstudio.org/blog/", "src": "specialist" },
    { "t": "Deploy PBIP using fabric-cicd", "u": "https://learn.microsoft.com/en-us/power-bi/developer/projects/projects-deploy-fabric-cicd", "src": "official" },
    { "t": "Direct Lake overview", "u": "https://learn.microsoft.com/en-us/fabric/fundamentals/direct-lake-overview", "src": "official" },
    { "t": "Power BI blog", "u": "https://powerbi.microsoft.com/en-us/blog/", "src": "official" }
  ]
}
---
## The rule for this page

Microsoft ships Power BI monthly and Fabric continuously. This page doesn't repeat the release notes. An item appears here only if the answer to **"does this change what our learner should know?"** is yes, and only after it has been checked against an official or primary source.

## October 2026

### DP-600 skills outline changes on 19 October 2026

- **What changed:** Microsoft's study guide lists skills measured as of 19 October 2026. The change log marks one skill group, "Query and analyze data", as a minor change; everything else is unchanged. The new outline also names choosing between **Direct Lake on OneLake and Direct Lake on SQL analytics endpoint** and configuring Direct Lake fallback and refresh behaviour.
- **Affects:** the [certification map](learn.html#certs) (shows the new outline) and [Direct Lake in depth](fabric.html#fab-directlake).
- **Checked:** 2 October 2026 against the [DP-600 study guide](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/dp-600).

## September 2026

### Microsoft documents PBIP deployment with fabric-cicd

- **What changed:** Microsoft Learn has a tutorial for deploying Power BI projects (PBIP) with `fabric-cicd`, the Microsoft-backed open-source Python library: `pip install fabric-cicd`, `FabricWorkspace` plus `publish_all_items`, environment values in `parameter.yml`, and GitHub Actions and Azure DevOps examples.
- **Affects:** [Ship Power BI like software](toolkit/ship-like-software.html#ci-cd) and [Deployment](advanced.html#a-deploy).
- **Checked:** 2 October 2026 against the [tutorial](https://learn.microsoft.com/en-us/power-bi/developer/projects/projects-deploy-fabric-cicd).

## August 2026

### DAX Studio 3.6: Delta Analyzer (preview)

- **What changed:** DAX Studio 3.6.0 (23 August 2026) added Delta Analyzer, a preview tool for inspecting the Delta table metadata behind Direct Lake models. 3.6.1 (5 September 2026) fixed OneLake path handling and Server Timings issues.
- **Affects:** [Direct Lake in depth](fabric.html#fab-directlake) and the [toolbelt](toolkit/toolbelt.html#dax-studio).
- **Checked:** 2 October 2026 against the [DAX Studio blog](https://daxstudio.org/blog/).

## Earlier and still important

These were verified when the course's Fabric and modern content was refreshed on 1 October 2026:

| Change | What to know | Lesson |
|---|---|---|
| Two kinds of Direct Lake | Direct Lake on OneLake has no DirectQuery fallback; Direct Lake on SQL endpoint can fall back, controlled by `DirectLakeBehavior` | [Direct Lake in depth](fabric.html#fab-directlake) |
| PBIR is the default report format | New PBIP reports save in the folder-based, Git-friendly PBIR format | [Deployment](advanced.html#a-deploy) |
| Tenant settings moved | Fabric admin tenant settings are found under the governance area of the admin experience | [Sensitivity labels and tenant settings](governance.html#gov-protect) |
| Copilot needs paid capacity | Copilot requires an F2+ or P1+ capacity; trial capacities and Pro or PPU alone are not enough | [Copilot workflows](modern.html#mod-copilot) |
| PL-300 outline | Skills measured as of 20 April 2026 | [Certification map](learn.html#certs) |

## How items get here

Anyone can propose one: [open an issue](https://github.com/sudhanshumukherjeexx/power-bi/issues) with the change, the official source, and which lesson it affects. The page's "checked" date and the course's stale-content check make sure the radar itself doesn't go stale.
