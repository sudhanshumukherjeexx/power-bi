# Migration plan: from course site to BI apprenticeship simulator

Status: all phases (0–8) complete (2026-10-01). See [qa-report.md](qa-report.md) for verification. It builds on [current-architecture.md](current-architecture.md).

## Principles

- **Static site, no client framework.** GitHub Pages still serves the branch root.
  - A zero-dependency Node build turns `content/` into the JavaScript bundles the pages already load. The generated files are committed.
  - Deploys therefore need no build step, opening files directly (`file://`) still works, and CI fails when a generated file is out of date.
- **Nothing a learner has today breaks:**
  - **URLs:** existing ones keep working.
  - **Progress:** existing progress keys are migrated in place.
  - **Assignment IDs:** these stay index-based, so new items are only ever appended.
- **Every number is checkable.**
  - Datasets come from seeded generators.
  - Expected-result claims are tied to computed values by tests.
  - Scenario figures are computed from the generated data at build time and substituted into the text.
- **Simple outside, deep inside.**
  - The homepage offers three doors: Learn, Practise real work, Prepare for interviews.
  - Complexity lives inside the scenarios, not in the navigation.

## Target architecture

```text
content/                        source of truth (JSON, reviewed in PRs)
  schema/                       JSON Schemas (editor validation and CI)
  skills/<module>/_module.json  level or track metadata
  skills/<module>/<topic>.json  topic: assignments, interview, assessment, why, refs, verified
  solutions/<topic>.json        worked solutions (answer keys kept apart from the tasks)
  experience/<scenario>/scenario.json, solution.json
  flashcards/concepts.json   glossary/glossary.json   career-paths/roles.json
  certifications/pl-300.json dp-600.json (versioned skill outlines)
  stages.json  skills.json  personas.json  diagnostic.json
  datasets/datasets.json        dataset metadata and profile assertions
  templates/*.md                professional artifact templates
data/                           generated CSVs (small, course pack)
data/experience/                generated evidence for scenarios (company pack)
tools/
  build.js                      content/ → assets/js/*.js, generated pages, sw.js precache list
  generate-data.js              seeded generators → data/*.csv (course and experience packs)
  generate-enterprise-data.js   1e5 … 5e7 rows, streamed, seeded, configurable defects
  build-starter.js              starter PBIP (unchanged)
tests/
  run.js                        runs every check below; non-zero exit on failure
  schemas/  datasets/  curriculum/  links/  lib/
.github/workflows/validate.yml  build --check, tests, HTML validation
```

### Generated runtime bundles

All live in `assets/js/`.

| File | Globals | Loaded by |
|---|---|---|
| `content.js` | `DS`, `toCSV`, `ROAD`, `LEVELS` (unchanged contract) | course pages, flashcards, glossary, cheatsheet |
| `tracks.js` | `TRACKS` | track pages, learn hub, flashcards |
| `solutions.js` | `SOLUTIONS` (levels and tracks) | course pages |
| `meta.js` | `STAGES`, `SKILLS`, `CERTS`, `ROLES`, `SCENARIO_INDEX`, `TEMPLATES`, `PERSONAS` | every page |
| `experience.js` | `SCENARIOS` (briefs, evidence, hints, rubric; no answers) | experience pages |
| `xp/<id>.js` | `XP_SOLUTION[id]` | lazy-loaded only when the learner asks |
| `search-index.js` | `SEARCH_INDEX` | lazy-loaded on first search |
| `cards.js`, `glossary.js`, `paths.js` | unchanged contracts | unchanged |

## Information architecture

| URL | Role |
|---|---|
| `/` (`index.html`) | Entrance. New users see a headline, one primary and one secondary action, and a "what are you trying to become" question. Returning users also see Continue, progress, due cards and stage. Old `index.html#…` deep links redirect to the level, Resources or Learn page that now holds that section. |
| `learn.html` | Skill Mode hub: levels, tracks, career paths, certifications. |
| `beginner/intermediate/advanced.html` | Unchanged URLs. These are now generated from one template. |
| `sql`, `warehousing`, `testing`, `automation`, `governance`, `fabric`, `modern` `.html` | New Skill Mode tracks, built from the same template. |
| `experience.html` | Experience Mode: stages, sprints, drills, decision log. |
| `experience/<scenario>.html` | One page per scenario, with title and description for SEO. |
| `diagnostic.html` | Entry assessment and a recommended starting point. |
| `progress.html` | Competency matrix, portfolio, certification readiness, decision log, export/import. |
| `templates.html` | Professional artifact templates with examples and rubrics. |
| `flashcards`, `glossary`, `cheatsheet`, `resources` `.html` | Unchanged URLs, extended. |

## Progress schema v2

- The same two `localStorage` keys stay. On load, `pbi-holy-grail-v1` gains `schemaVersion: 2` and these fields:
  - `goal`
  - `diag {answers, rec, at}`
  - `xp {scenarioId: {status, started, hints[], solution, deliverables{}, rubric{}, decision, done}}`
  - `last {href, title, at}` (for "continue")
- The v1 fields (`done`, `quiz`, `sol`, `theme`, `path`, `navOpen`) are untouched.
- Export files are written as `version: 2`. Import accepts version 1 and version 2 and migrates after loading.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Moving content into JSON changes what learners see | A one-off extractor plus a deep-equality test against the old bundle (git `2d8ce83`) before any content edits. |
| Index-based IDs orphan progress | Schema and tests forbid removing or reordering assignments; new ones are appended. A test pins the count of legacy items per topic. |
| Edited flashcard text resets review history | The six corrected expected results live on assignments, not cards. Card question text is pinned by a test hash list. |
| Offline users get stale or partial files | The build writes the `sw.js` precache list and a content-hash `VERSION`. |
| Old `index.html#topic` links break | A redirect shim on the new homepage. |
| Fabric and certification facts drift | `verified` metadata on every fast-moving topic, a stale-content warning in CI, and versioned certification outlines. |
| Scenario numbers drift from data | Numbers are computed at build time from the generated data and substituted into the text, so they never appear as hand-typed literals. |
| Heavier pages | Search index and scenario solutions lazy-load, and each page loads only its bundles. |

## Phases

| Phase | What | Exit test |
|---|---|---|
| 0 | Audit and this plan | — |
| 1 | `content/`, build, generators, tests, CI | Generated bundles deep-equal the old ones, and all tests pass |
| 2 | Fix contradictions, add curriculum assertions, versioned certifications, Fabric refresh, positioning copy | Assertions pass; each of the six contradictions has a test |
| 3 | Stages, competency, homepage, learn hub, diagnostic, progress v2 | Migration test with a v1 export; UI flows in headless Edge |
| 4 | Scenario engine and first three sprints | Scenario flow tested end to end |
| 5 | Sprints 4–10, drills, change requests | Scenario figures verified against data |
| 6 | SQL, warehousing, testing, automation, governance, Fabric, modern tracks; templates; enterprise generator | SQL answers executed against SQLite in CI |
| 7 | LICENSE, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, CHANGELOG, issue and PR templates | — |
| 8 | Content, responsive, accessibility, offline and migration QA | Recorded in `docs/qa-report.md` |

## Behaviour that must be preserved

- **URLs:**
  - every existing page URL;
  - `#topic`, `#topic:asg:n`, `#ds-X`, `#card=`, `#deck=`, `#mock` and glossary slugs.
- **Progress:**
  - both `localStorage` keys and their v1 fields;
  - export files from version 1 still import.
- **Flashcards:**
  - card IDs (question hashes);
  - Leitner intervals;
  - mock interview and print.
- **Solutions:** the gate: hidden until the assignment is ticked or the learner explicitly reveals it.
- **Glossary:** auto-linking, popover and phone bottom sheet.
- **Interface:**
  - theme switch at top right, defaulting to the OS setting;
  - `/` and Ctrl+K search;
  - offline/PWA install;
  - phone and iPad layouts.
- **Starter project:** `starter/northwind-starter.zip` and `DataFolder` behaviour.
