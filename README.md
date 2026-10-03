# Power BI Holy Grail

**Not another Power BI tutorial.** A free, open-source apprenticeship: learn each skill hands-on, then practise the problems, failures and decisions BI developers usually meet only after years on the job.

**Start here: [sudhanshumukherjeexx.github.io/power-bi](https://sudhanshumukherjeexx.github.io/power-bi/)**

## Philosophy

You learn BI by solving realistic work, not by watching someone else do it. Every exercise starts from data and a question. Every number you're asked to produce can be checked, because it is computed from generated data and verified automatically. As you progress, you get less procedure and more ambiguity, as at work.

## Two modes

**Skill Mode** answers "how do I do this?"
- **Three levels:** Beginner, Intermediate and Advanced.
- **Seven tracks:** SQL for BI, data warehousing patterns, testing and validation, automation and APIs, governance, Microsoft Fabric, and modern Power BI features.
- **Every assignment** has an expected result you can check against the data, and a worked solution.
- **Guidance decreases** from A (guided steps) to B (objective), C (problem to diagnose) and D (ambiguous decision).

**Experience Mode** answers "can I recognise when this is needed, and handle it under real conditions?"

You join the BI team at Northwind Outdoors, a fictional retailer, and work through ten connected sprints and eight drills:

| | Scenario |
|---|---|
| 01 | An executive dashboard from a vague request and a messy export |
| 02 | Finance says your revenue is too high: reconcile it to the ledger |
| 03 | A manager can see other regions' payroll: a security incident |
| 04 | The executive page takes 18 seconds: diagnose with evidence |
| 05 | Three models, three "Revenue" measures: build one certified model |
| 06 | Two developers changed the same measure: a PBIP/TMDL merge conflict |
| 07 | Test is right, Production is wrong: a deployment failure |
| 08 | The board pack refresh failed at 06:17: incident and postmortem |
| 09 | Should we move to Fabric, and how? Write the architecture decision record |
| 10 | 80 reports, 19 models, no owner: an architecture review |

Each scenario gives you emails, tickets, chat messages, evidence files, progressive hints, a professional rubric, and a model answer that opens only when you ask. Your decisions are recorded, and later scenarios refer back to them.

## Professional stages

Data Analyst → BI Developer → Senior BI Developer → BI Engineer → BI Architect / Lead.

Stages are about responsibility, not years. Your progress page is a competency review: every number says whether it rests on **verified** evidence (first answers to multiple-choice questions), **self-assessed** evidence (ticked assignments and deliverables, your own rubric ratings) or **recall** (spaced-repetition flashcards), and explains how it was calculated. A stage is cleared only when its scenarios are finished *and* rated well, not merely ticked. It also shows the deliverables you've written (portfolio evidence) and weighted coverage and practice for PL-300 and DP-600.

## What else is inside

- **BI Developer Toolkit:** for when you're on the job. Troubleshooting trees ("What's broken?"), DAX, Power Query and SQL field guides, a performance clinic, a production runbook, an error decoder, architecture decisions, security and governance guides, checklists, automation samples, and career and certification guides. It has one search: "What are you trying to do?"
- **Interview flashcards** with spaced repetition and a timed mock interview. No Power BI needed, so they work on a phone.
- **Glossary** of plain-English definitions, linked from every lesson.
- **External resources:** a curated catalog of 118 official, specialist and community resources. Lessons and scenarios link to the ones relevant to them.
- **Cheat sheets**, printable, one per level.
- **Professional templates:** 26 documents BI teams actually write, from requirements and KPI definitions to ADRs, RLS matrices, runbooks, postmortems and a COE charter.
- **Datasets and a starter Power BI project (PBIP)**, plus a generator for 100 thousand to 50 million realistic rows.
- **Diagnostic** to find your starting point.

It works offline, installs as an app, and keeps your progress in your browser. Use **Export / Import progress** to move it between devices.

## Tools you'll need

- [Power BI Desktop](https://www.microsoft.com/power-platform/products/power-bi/desktop) (free). That is enough for most of the site.
- A free Power BI account for Service topics; [DAX Studio](https://daxstudio.org) and [Tabular Editor 2](https://github.com/TabularEditor/TabularEditor) (free) from Intermediate onwards.
- Any SQL engine for the SQL track: SQL Server Express or Developer, DuckDB or SQLite.
- A Microsoft Fabric trial for the Fabric topics. Where a feature needs a paid capacity (for example Copilot), the exercise says so and gives you a way to practise without it.

## Validation

Expected results are tested, not trusted:
- Every dataset is generated from a fixed seed, and its row counts, nulls, duplicates, foreign keys and planted defects are asserted.
- Every number quoted in an expected result or worked solution is either tied to a recomputed value or filled in from the generated data at build time.
- SQL answers are executed in CI against SQLite and compared with their expected output.
- Links, IDs, references, schemas, generated files and fast-moving product facts (with verification dates) are checked on every push.

## Run it locally and contribute

It's a static site with no dependencies. The website lives in `site/`, its source in `content/`, and the build in `tools/`. Run `npm run check` to build and test, and preview with any static server pointed at `site/` (for example `npx serve site`). Pushes to `main` are tested and published to GitHub Pages by GitHub Actions. See [CONTRIBUTING.md](CONTRIBUTING.md) to add a topic, a scenario or a fix.

## Disclaimer

No website can replace years of employment. This one puts you in front of the situations that usually take years to meet, deliberately and with feedback, so you recognise them when they happen for real. Certification and professional skill overlap but aren't the same; both are covered, separately.

Northwind Outdoors and everyone in it are fictional. All data is synthetic. Power BI, Microsoft Fabric and related names are trademarks of Microsoft; this project isn't affiliated with Microsoft.

[MIT License](LICENSE)
