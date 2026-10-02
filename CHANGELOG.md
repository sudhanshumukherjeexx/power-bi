# Changelog

## 2.1.0 (2026-10-02): the BI Developer Toolkit

### Added

- **BI Developer Toolkit:** a new Toolkit tab. Its hub shows six doors (Reference; Tools; Patterns & Playbooks; Datasets & Labs; Templates; Career & Certification) and a "What are you trying to do?" search. The search can be filtered by skill, stage, tool, problem and certification, and it suggests a path: where to start, the lesson, the tool, a scenario to practise on, the checklist and the reference.
- **Thirty guides.** Each guide shows the date it was checked against its sources, and labels every source as official, specialist, community or paid. The guides are:
  - DAX, Power Query and SQL field guides;
  - "What's broken?" troubleshooting trees and "My DAX is wrong";
  - a performance clinic and a production runbook;
  - an error decoder;
  - modeling patterns, an architecture decision library and Fabric architecture;
  - security and governance guides;
  - report design and best-practice libraries;
  - twelve printable checklists;
  - a professional toolbelt, automation samples, and "Ship Power BI like software";
  - a practice lab;
  - career guides: the role map, your first 30 days, a senior handbook, weak and senior interview answers, a certification navigator and a bookshelf;
  - trusted sources and a change radar.
- **External resources catalog:** 118 curated external resources in 26 categories (from Power BI foundations to governance, Fabric CI/CD and certification).
  - **Where to find it:** a searchable section on the Resources page, filterable by source and stage.
  - **What each entry records:** what it's useful for, whether the source is official, specialist, community or third-party, the stage it suits, whether it's paid, and the lessons and scenarios it supports.
  - **Where else it shows up:** the same entries appear under each topic's "Learn more", in a "Need more context?" panel on scenario pages, and in the Toolkit search.
  - **Checks:** the build rejects unknown lessons or scenarios, duplicate URLs and tracking parameters. Microsoft documentation makes up most of the list.
- **Ten new templates:**
  - data dictionary;
  - source-to-target mapping;
  - model design document;
  - code review checklist;
  - deprecation checklist;
  - capacity review;
  - workspace naming standard;
  - certification checklist;
  - governance assessment;
  - COE charter.
- **Downloads:** a PBIP `.gitignore`, a `fabric-cicd` deployment script with `parameter.yml`, a GitHub Actions workflow and a branching guide.
- **Tests:** a toolkit test suite (metadata, references, generated pages, search coverage). The guides are included in the stale-content check, and `toolkit/` is included in HTML validation.

### Fixed

- Two Experience Mode references pointed at Microsoft Learn pages that had moved.
- Tables in long guides and the certification navigator no longer need horizontal scrolling on desktop.

## 2.0.0 (2026-10-01): the apprenticeship release

### Added

- **Experience Mode:** ten connected sprints and eight drills at Northwind Outdoors. The sprints:
  - executive dashboard;
  - a Finance dispute;
  - a payroll security incident;
  - a slow executive page;
  - three competing Revenue models;
  - a PBIP merge conflict;
  - a Test/Prod deployment failure;
  - a failed refresh before a board meeting;
  - a Fabric migration decision (ADR);
  - an architecture review.
- **What each scenario includes:** an inbox and evidence files, progressive hints, a professional rubric, a model answer that loads only on request, a four-level review, and a retrospective. Architecture decisions are recorded, and later scenarios refer back to them.
- **Seven Skill Mode tracks:**
  - SQL for BI (answers executed in CI);
  - Data warehousing patterns;
  - Testing and validation;
  - Automation and APIs;
  - Governance;
  - Microsoft Fabric;
  - Modern Power BI features.
- **Professional stages:** Data Analyst → BI Developer → Senior → BI Engineer → Architect/Lead.
- **Progress:** a competency matrix computed from evidence, a portfolio of deliverables, a decision log, and certification readiness.
- **New pages:**
  - a new home page with goal-based routes;
  - a diagnostic that recommends a starting point;
  - a Learn hub;
  - a progress page;
  - 16 professional templates.
- **Certification maps:** versioned outlines with effective dates (PL-300 as of 2026-04-20; DP-600 before and from 2026-10-19).
- **Topic metadata:** "Why this matters", official references, and verification dates with stale-content warnings on fast-moving topics.
- **Search:** covers everything (levels, tracks, scenarios, templates, certification objectives), with type and level/track/stage filters. The index loads on first use.
- **Enterprise scale pack:** a seeded generator for 100k–50M rows with configurable, tested defects.
- **Engineering:**
  - all content moved to `content/` as JSON and Markdown with schemas;
  - a zero-dependency build;
  - seeded data generators;
  - tests for schemas, IDs, links, dataset profiles, curriculum claims, SQL answers, Experience Mode and generated files;
  - GitHub Actions CI.
- **Open-source files:** LICENSE (MIT), CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, issue and PR templates.

### Changed

- **Positioning:** the site no longer promises the equivalent of five years of experience. It practises the scenarios and decisions that usually take years to meet.
- **Expected results:** six contradicted the data. Fixed:
  - `b-pq-0` Qty nulls 2 → 3;
  - `b-dax-3` returns 6 → 7;
  - `b-model-2` 12 → 79 mismatched lines;
  - `b-dax-1` channel wording;
  - `a-dax-0` reorder alert products;
  - `i-pq-3` 99 of 100 rows get a rate.
  - Automated assertions also found and fixed a rounding error in `i-rls-2` ($1,967.55 → $1,967.54).
- **Direct Lake content:** now distinguishes Direct Lake on OneLake from Direct Lake on SQL analytics endpoint (fallback, views, security), checked against Microsoft Learn on 2026-10-01.
- **PBIP content:** reflects PBIR as the default report format.
- **The old all-in-one home page is retired.** Its content lives on the level, Learn and Resources pages, and old deep links (index.html with a topic, dataset or certification anchor) redirect to the right one. The years-based roadmap was dropped in favour of the professional stages.
- **The service worker's precache list and version** are generated from the files they cover.

### Migration

Progress saved by version 1 is migrated automatically (schema version 2), and version 1 export files still import.

## 1.0.0 (2026-09)

- Course site: three levels, 73 assignments with worked solutions, 188 flashcards with spaced repetition, glossary, cheat sheets, datasets, starter project, offline support.
