# Changelog

Each release lists changes **for learners**, **for maintainers**, **breaking changes**, **progress data** (anything that touches what's stored in your browser) and **curriculum**. Releases are tagged `vX.Y.Z` and published on GitHub. Release notes are generated from this file by `node tools/release-notes.js <version>`.

## 2.6.1 (2026-10-04): The Power BI Fellowship

### For learners

- **New name: The Power BI Fellowship** (formerly Power BI Holy Grail). The site, address, content and your progress are unchanged.
- "Apprenticeship" is now "fellowship" throughout. On a phone, the installed app is labelled **BI Fellowship**.

### For maintainers

- The name comes from `content/site.json` (`name`, `short`). Titles, the header, the footer, structured data, the manifest, the social images, the README screenshots and the starter project's README were updated and regenerated.
- **Deliberately unchanged:** the browser storage keys (`pbi-holy-grail-v1`, `-cards-v1`, `-backup-v1`), the export file id (`power-bi-holy-grail`), the service-worker cache prefix and the seed for the starter project's ids. Renaming them would lose learners' progress, break existing export files or change generated data. Comments in `site.js` and `store.js` say so. `docs/history/` keeps the old name, as records of their time.
- The npm package is now `power-bi-fellowship`. The repository and the site address stay `power-bi`.

### Breaking changes

None.

### Progress data

Unchanged. Existing progress and export files keep working.

### Curriculum

None.

## 2.6.0 (2026-10-04): operations

### For learners

- **SQL that runs where it says it runs.** Testing every example on SQL Server 2022 found four bugs: `LineNo` is a reserved word in T-SQL, so every query that used it unquoted failed on SQL Server (25 lines, including the `MERGE` example and the slow-query evidence file); the SCD type 2 solution used `CREATE TABLE … AS`, which SQL Server doesn't have; and the early-arriving-facts query aggregated over `EXISTS`, which SQL Server rejects. All four now give identical answers on SQLite and SQL Server. Every SQL example says where it runs (portable, SQLite or T-SQL).
- **Make a scenario available offline.** A button on each scenario saves its evidence files, model answer and deliverable templates on your device, and the scenario shows **Available offline**. The pages themselves work offline after your first visit; the site no longer claims more than that.
- **Tickets don't give the answer away.** Ticket labels are what a reporter would write (`#executive`, `#monday`, `#slow`), not the technical cause or the skill being tested. The skills a scenario practises appear when you finish it.
- **Stronger page security:** a Content Security Policy on every page means injected markup can't run script.
- **Telling us what's missing:** when a search finds nothing, you can suggest the topic in a prefilled GitHub issue (only if you choose to).
- **Privacy:** the site now counts anonymous page views with Cloudflare Web Analytics (cookieless, aggregate). It never loads under Do Not Track or Global Privacy Control, on pages with a search in the address, or if you turn it off under **Progress → Privacy**. See [PRIVACY.md](PRIVACY.md).

### For maintainers

- **GitHub Actions pinned to commit SHAs** and upgraded to their Node 24 releases (checkout v7, setup-node v7, setup-python v7, configure-pages v6, upload-pages-artifact v5, deploy-pages v5, upload-artifact v7). **Dependabot** covers npm, Actions and pip. **CODEOWNERS** is split by area.
- **SQL validation in three levels:** executed (SQLite), parsed (SQLFluff 4.4.0, new `sql` CI job that gates deploys) and SQL Server (`.github/workflows/sql-server.yml`, SQL Server 2022 CU27, `tools/sqlserver-check.js` with the pinned `mssql` driver). It compares every executed portable query's result on both engines. See [docs/sql-validation.md](docs/sql-validation.md).
- **Content review issues:** `.github/workflows/content-review.yml` opens, updates and closes one `content-review` issue per item past its review date (`tools/content-review.js`).
- **Content Security Policy** generated per page (`tools/lib/build-csp.js`) and verified by `tests/security.test.js` and `tests/e2e/security.spec.js`. The secret scanner covers tracked text files.
- **Offline:** the service worker keeps `pbi-offline-v1` across versions and falls back to it (`tests/e2e/offline.spec.js` runs the real service worker offline).
- **Analytics:** `site/assets/js/analytics.js` loads Cloudflare Web Analytics only with a token in `content/site.json` (now set), and never under Do Not Track, Global Privacy Control, an opt-out, a local preview or a search URL (`tests/analytics.test.js`).
- **Repository presentation:** README rewritten around screenshots (`tools/render-screenshots.js`), a GitHub social preview image, and release notes generated from this changelog (`tools/release-notes.js`).
- `.gitattributes` keeps text files LF everywhere, so the build is byte-identical on Windows and Linux.
- **Design-system debt paid:** a shared `base.css` replaces the copies of the base styles in Flashcards, Glossary and Cheat sheet (43 inline rules removed), and the 2.0 token names are retired (644 references migrated, aliases deleted). Pixel-compared on 26 pages at two widths and both themes: identical apart from Glossary and Cheat sheet section headings, which now use the design-system heading style.
- `tests/design.test.js` also guards the brand images (social preview, link preview, README screenshots) at their exact sizes.

### Breaking changes

None for learners. Contributors: the 2.0 token names (`--panel`, `--ink`, `--yellow`…) no longer exist; use the `tokens.css` names. Contributors: every SQL block must declare a dialect, and portable SQL must quote `"LineNo"`. The tests say where.

### Progress data

Unchanged (schema 3). Offline downloads live in the browser's Cache Storage, not in your progress, and aren't exported.

### Curriculum

SQL fixes in `dw-keys-0`, `dw-keys-2`, `sql-load-2`, `sql-tune-0`, `sql-window-0`, `qa-data-0`, `sql-load-0`, the SQL for BI guide and the slow-query evidence file. Ticket labels rewritten for all 18 scenarios.

## 2.5.0 (2026-10-03): tested in a real browser

### For learners

- **Flashcards:** a real **Show answer / Show question** button flips the card. The card is a labelled region instead of a button with buttons inside it, and the hidden face is `inert`, so focus can't land on content you can't see.
- **Skill Mode topic tabs** follow the tab pattern: the arrow keys, Home and End move between Assignments, Interview questions and Assessment.
- **Scrollable code and tables** that overflow can be scrolled with the keyboard. Short blocks add no extra tab stops.
- **Touch targets:** the Toolkit search button and every primary button are at least 44px tall on phones.

### For maintainers

- **Pinned dev dependencies** with a lockfile: `@playwright/test` 1.63.0, `@axe-core/playwright` 4.13.0, `html-validate` 9.7.1. There is still no runtime dependency.
- **`tests/e2e/`** (106 tests at release): critical journeys, axe-core on nine pages in both themes (serious or critical issues fail the build), keyboard paths, one `h1` per page, labelled fields, reduced motion, and layout assertions at 1440/1024/768/390px. Layout uses assertions, not pixel snapshots.
- **CI:** `npm ci`, and a new `browser` job that `deploy` waits for. The report is uploaded on failure. `npm run serve` previews like GitHub Pages.
- **Fixed:** the build was not byte-identical on Windows (CRLF working copies), which failed CI's "generated files are current" check. `.gitattributes` and a CR-insensitive cache version fix it.

### Breaking changes

None.

### Progress data

Unchanged (schema 3).

### Curriculum

None.

## 2.4.0 (2026-10-03): readable without JavaScript, findable

### For learners

- **Pages show their content before any script runs.** Level and track pages carry every assignment, interview question and quiz question. Scenarios carry the ticket, messages, tasks, deliverables and evidence list. The Library and glossary are complete too. Without JavaScript, the Beginner page went from about 95 words to about 3,000.
- **No answers leak.** Hints, rubrics, retrospectives, model answers, interview answers, quiz explanations and worked solutions never appear in the HTML. A test enforces this.
- **Honest fallbacks:** each page says exactly what needs JavaScript there.
- **Link previews:** a social image, Open Graph and Twitter tags on every page, and one canonical URL each.

### For maintainers

- `tools/lib/static-render.js`, `tools/lib/build-seo.js` (`sitemap.xml`, `robots.txt`), `tools/render-og.js` with `tools/og/og.html`.
- Structured data: `Course`, `LearningResource`, `TechArticle`, `BreadcrumbList`. Hand-written pages get the SEO block between `<!--seo-->` markers.
- `tests/leaks.test.js` (answer leaks, SEO completeness). `tests/build.test.js` validates JSON-LD.

### Breaking changes

None.

### Progress data

Unchanged.

### Curriculum

None.

## 2.3.0 (2026-10-03): a new identity and a simpler map

### For learners

- **Graphite × Warm Ivory × Grail Gold.** Warm ivory and graphite replace the blue-grey palette, with a true graphite dark theme. Gold marks only the primary action, where you are, progress and important insight.
- **Calmer pages:** topic colours are small dots, selected options are quiet underlines, corners are tighter, and cards have no shadows. A thin gold rule with a mono caption marks expected results, notes and setup.
- **Experience Mode looks operational:** graphite ticket panels, mono ids, outlined severity labels.
- **Line icons** replace interface emoji. There is a new graphite app icon, and IBM Plex is self-hosted, so there are no requests to Google.
- **One place for everything:** Resources is now the **Library**, a door of the Toolkit. `resources.html` keeps working.
- **Five destinations:** Learn · Experience · Interview · Toolkit · Progress ("Practice" is now Experience). **Phones get a More menu.**
- **Returning home is continuation first:** one Continue card and one line of what's due. **Focus mode** in scenarios.
- **Contrast** checked in both themes: no axe contrast violations on the main pages.

### For maintainers

- `site/assets/css/tokens.css` is the single token source. The old names stay as aliases for now. `tools/lib/icons.js` builds the icon sprite. `tests/design.test.js` enforces the design rules, and CONTRIBUTING has a **Design rules** section.
- Toolkit doors may have `href`. `partials.js` has `SECTIONS`, `ALIAS` and `MORE`. The `hidden` attribute always wins over component `display` rules.

### Breaking changes

`Resources` is no longer a top-level tab. Its page and anchors still work.

### Progress data

Unchanged.

### Curriculum

None.

## 2.2.0 (2026-10-02): trustworthy progress

### For learners

- **Every score says what it rests on:** *verified* (your first multiple-choice answer), *self-assessed* (ticks, deliverables, your rubric ratings) and *recall* (flashcards), each with a "How this is calculated" panel.
- **Only your first multiple-choice answer counts** toward readiness.
- **One definition of flashcard mastery:** box 1 = 25%, 2 = 50%, 3 = 75%, 4 or more = 100%. "Mastered" means box 4.
- **Professional stages need quality, not only completion:** experience credit is average outcome × share finished. A stage clears at 70% skill readiness, 70% of scenarios finished and a 65% average outcome.
- **Hints no longer lower your score.** Outcome and independence are shown separately.
- **Certification preparation** is weighted by Microsoft's domain weights, shown as curriculum coverage and practice. It is not an exam prediction.
- **"Portfolio" is now "Portfolio evidence".**
- **Safer import:** imported files are validated field by field, you compare them before replacing, and your current progress is kept as a backup (**Progress → Restore previous progress**).
- **The website moved into `site/`** and is deployed by GitHub Actions only after every check passes. Public URLs are unchanged.

**Your numbers may drop after this update.** That's intended: they now count only what the evidence supports.

### For maintainers

- `site/assets/js/store.js` (DOM-free schema, migration, safe links, mastery, readiness, import validation). `tools/lib/cert-weights.js`.
- `tests/scoring.test.js` and `tests/progress-import.test.js` (hostile fixtures) run the shipped scripts in a VM. New-tab links must have `rel="noopener"`.
- Audits and the implementation plan are in `docs/`.

### Breaking changes

The repository layout changed: the website is in `site/`. GitHub Pages must use **GitHub Actions** as its source (see `docs/deployment.md`).

### Progress data

Schema 2 → 3: adds `quizFirst`, seeded from `quiz`. Export file version 3, and import accepts versions 1–3. Nothing was removed or renamed. A backup key, `pbi-holy-grail-backup-v1`, was added.

### Curriculum

None.

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

## 2.0.0 (2026-10-01): the fellowship release

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
