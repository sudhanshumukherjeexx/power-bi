# Changelog

## Unreleased

### Learner changes: one place for everything, and continuation first (Phase 3)

- **Resources is now the Library, inside the Toolkit.** The glossary, cheat sheets, external catalog, datasets, starter project and study tools are a seventh Toolkit door, so there is one place to look things up instead of two. `resources.html` still works and keeps all its content.
- **Five destinations:** Learn · Experience · Interview · Toolkit · Progress. "Practice" is now called **Experience**, the name the rest of the site uses.
- **Phones get a More menu** with Progress, Glossary, Library, Templates, and export/import. The header row no longer squeezes six labels into 390px. Every target is at least 44px, and the menu works with the keyboard (Enter opens it, Escape closes it and returns focus).
- **Returning home is continuation first:** one Continue card (the ticket id, stage and deliverables for a scenario, or readiness for a level), then one line with cards due, current stage, focus skill and portfolio evidence. Everything else folds under *Explore other paths*. First-time visitors see the same welcome as before.
- **Focus mode in scenarios:** once you take a ticket, the main navigation steps back and the header shows **← Exit scenario** and the ticket id.
- **Less dashboard:** the four stat tiles on the home page and the Experience hub are replaced by a single line each.

### Maintainer changes (Phase 3)

- `content/toolkit/index.json`: a door may have `href` (a page of the site) instead of guides. The Toolkit check rejects a door that has both.
- `tools/lib/partials.js`: `SECTIONS` (five), `ALIAS` (`resources` → `toolkit`), `MORE`, and `nav(active, r, page)` marks the current page inside More.
- The `hidden` attribute now always wins over component `display` rules.

### Learner changes: a new visual identity (Phase 2)

- **Graphite × Warm Ivory × Grail Gold.** Warm ivory surfaces and graphite text replace the blue-grey palette, and a true graphite dark theme replaces the inverted one. Grail Gold, which evolved from Power BI yellow, now marks only the primary action, where you are, progress and important insight.
- **Calmer pages.** Topic colours are now small dots and thin rules instead of solid blocks. Selected options are quiet underlines instead of gold slabs. Corners are tighter, and cards no longer cast shadows.
- **The Holy Grail rule:** a thin gold line with a small mono caption marks expected results, notes, warnings and setup instructions.
- **Experience Mode looks operational:** each ticket is a graphite panel with mono ids, outlined severity labels and timestamps, so a scenario reads as work, not a lesson.
- **Line icons** replace emoji in the interface: the Toolkit doors, study tools, home page and buttons.
- **New app icon:** graphite, with a gold rule.
- **Fonts load from the site itself.** IBM Plex is self-hosted, so it works offline from the first visit and no request goes to Google.
- **Contrast:** every text and indicator colour was checked in both themes. axe-core reports no contrast violations on the 14 main pages.

### Maintainer changes (Phase 2)

- `site/assets/css/tokens.css` is the single source for colours, type, radii, spacing and shadows. The five copies of the token set (in `pages.css` and inline in Flashcards, Glossary and Cheat sheet) are gone, and the old token names remain as aliases until 2.4.0.
- `tools/lib/icons.js` is the icon set. The build writes `site/assets/icons/icons.svg`, and pages use `<use href>`.
- `tests/design.test.js`: one token source, no font CDN, `tokens.css` loaded first, icons exist, no emoji in chrome, radii on the scale.
- CONTRIBUTING has a new **Design rules** section.

### Learner changes: trustworthy progress (2.2.0, Phase 1)

- **Every score says what it rests on.** Progress now separates *verified* evidence (your first answer to each multiple-choice question), *self-assessed* evidence (ticked assignments and deliverables, your own rubric ratings) and *recall* (flashcards). Each percentage on the progress page has a "How this is calculated" panel.
- **Only your first multiple-choice answer counts.** You can still change answers to learn, but readiness uses the first one.
- **One definition of flashcard mastery** everywhere: box 1 = 25%, 2 = 50%, 3 = 75%, 4 or more = 100%. "Mastered" now means box 4, which takes four correct recalls over at least 11 days. It used to mean box 3, and some scores counted a card seen correctly once as learned.
- **Professional stages need quality, not only completion.** Experience credit is now the average outcome of finished scenarios multiplied by the share finished. A stage is cleared when skill readiness reaches 70%, 70% of its scenarios are finished and their average outcome is 65% or more. Finishing scenarios with low ratings no longer moves you up.
- **Hints no longer lower your score.** A scenario shows an *outcome* (your rubric rating) and, separately, *independence* (−10 per hint, at most −40, and −30 for opening the model answer early). Only the outcome counts toward competency and stages.
- **Certification preparation** is weighted by Microsoft's published domain weights (midpoint of each range). It shows *curriculum coverage* and *practice* separately, and says plainly that neither predicts an exam result.
- **"Portfolio" is now "Portfolio evidence"**, and says that it lists deliverables you ticked rather than inspected files.
- **Safer import.** Imported progress files are validated field by field: unknown fields, wrong types, oversized text, unknown lessons or scenarios, and any non-internal link are dropped. Before anything is replaced, a dialog compares the file with this browser. Your current progress is kept as a backup, and **Progress → Restore previous progress** brings it back. Resetting also keeps a backup.

**Your numbers may drop after this update.** That's intended: stage and readiness figures now count only what the evidence supports.

### Maintainer changes

- `site/assets/js/store.js` (new, DOM-free) holds the progress schema, migration, safe internal links, mastery, readiness and import validation. Every page loads it before `site.js`.
- Progress schema 2 → 3 (adds `quizFirst`, seeded from `quiz`). Export file version 3, and import accepts versions 1–3. No field was removed or renamed.
- `tools/lib/cert-weights.js` normalises certification domain weights at build time (`wm`, `wn` in `CERTS`).
- New tests: `tests/scoring.test.js` and `tests/progress-import.test.js` (hostile import fixtures) run the shipped scripts in a Node VM (`tests/lib/browser-env.js`). The link test now fails any new-tab link without `rel="noopener"`.
- Audits and the plan for the next phases are in `docs/`: design, progress scoring, security, SEO and the implementation plan.

### Earlier unreleased changes

### Changed

- **Repository layout:** the published website moved into `site/`, so the repository root now holds only the project: `content/`, `site/`, `tools/`, `tests/`, `docs/` and the project files. Public URLs are unchanged.
- **Deployment:** GitHub Actions publishes `site/` to GitHub Pages after every push to `main`, but only when all checks pass, so a broken build can't go live. Pull requests run the same checks.

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
