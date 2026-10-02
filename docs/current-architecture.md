# Current architecture (audit, 2026-10-01)

This describes the site **before** the apprenticeship-simulator redesign (commit `2d8ce83`). It is the baseline the migration plan protects.

## 1. Runtime architecture

- A static site served by GitHub Pages from the `main` branch root. `.nojekyll` is present, so files are served as-is. There is no build step: every file in the repo is the deployed file.
- There are no frameworks and no npm dependencies. The only external request is to Google Fonts (IBM Plex Sans and IBM Plex Mono).
- Pages are plain HTML. Most page content is rendered at runtime by plain JavaScript reading global data objects.

| Page | Renders from | Script order |
|---|---|---|
| `index.html` | `LEVELS`, `ROAD`, `ROLES`, `CERTS`, `DS`. Long single page with a sidebar drawer. | content, solutions, paths, cards, glossary, site, course, inline |
| `beginner/intermediate/advanced/resources.html` | `levelpage.js`, chosen by `<body data-page>` | content, solutions, cards, glossary, site, course, levelpage |
| `flashcards.html` | `CONCEPTS` plus topic interview questions from `LEVELS` | content, cards, glossary, site, inline |
| `glossary.html` | `GLOSSARY` | content, glossary, site, inline |
| `cheatsheet.html` | Mostly static HTML, plus card/topic counts | content, cards, glossary, site, inline |
| `404.html` | Static page with a small inline script | inline |

### Shared modules

- **`assets/js/site.js`** exposes `window.PBI`:
  - storage helpers;
  - SRS (Leitner intervals of 0/1/3/7/14/30 days);
  - per-topic readiness;
  - the theme switch;
  - progress export and import;
  - glossary auto-linking and the popover;
  - the search palette (`/` or Ctrl+K);
  - the install prompt;
  - service-worker registration.
- **`assets/js/course.js`** exposes `Course`:
  - the course state;
  - topic rendering (assignment, interview and assessment tabs);
  - the worked-solution gate;
  - dataset tables;
  - deep links (`#topic:asg|int|ass:index`).

## 2. Content architecture

All content lives in JavaScript files that declare global constants.

| File | Global | Size | Contents |
|---|---|---|---|
| `assets/js/content.js` | `DS`, `ROAD`, `LEVELS`, `toCSV`, `rng` | 109 KB | 14 datasets (several generated with a seeded PRNG) and 3 levels × 17 topics. Each topic has `asg` (73 assignments: `t,time,ds,steps,exp`), `int` (90 questions: `q,a`) and `ass` (68 items: `type mcq/task, q, o, a, why/hint`). |
| `assets/js/solutions.js` | `SOLUTIONS` | 62 KB | 73 worked solutions keyed `topicId-index`. Each has `s` (steps), `code` (`[lang,title,src]`), `tbl`, `check` and `note`. |
| `assets/js/cards.js` | `CONCEPTS` | 42 KB | 98 concept flashcards `{c,l,q,a,x,t}` in 10 categories. |
| `assets/js/glossary.js` | `GLOSSARY` | 29 KB | 139 terms `{t,k,c,d,s,nolink}`. |
| `assets/js/paths.js` | `ROLES`, `CERTS` | 3 KB | 4 career paths and the 2 certification maps (one fixed version each). |

### IDs

- Topic IDs are a one-letter level prefix plus a slug, for example `b-pq` or `a-fabric`.
- Assignment IDs are `topicId-index` and question IDs are `topicId-q-index`. Both are **index-based**, so reordering an array would orphan saved progress.
- Flashcard IDs are `c`/`t` plus a djb2 hash of the question text, so editing a question resets its review history.

## 3. Progress and state model (browser `localStorage`)

| Key | Shape | Written by |
|---|---|---|
| `pbi-holy-grail-v1` | `{done:{asgId:bool}, quiz:{qId:optionIndex}, sol:{asgId:true}, theme, path, navOpen:{}}` | course pages and the theme switch |
| `pbi-holy-grail-cards-v1` | `{srs:{cardId:{b,d,n,l}}, ...flashcard UI prefs}` | flashcards, readiness |

- The cards key has a built-in migration from the first `known`/`again` format to `srs`.
- An export file is `{app:'power-bi-holy-grail', version:1, exported, data:{<key>:<object>}}`. Import replaces both keys and then reloads the page.
- Readiness per topic is 50% assignments ticked, 25% multiple-choice answers correct and 25% topic flashcards in box ≥ 1.

## 4. PWA architecture

- `manifest.webmanifest` sets start URL `./index.html`, scope `./`, and has three shortcuts.
- `sw.js` uses version `pbi-holy-grail-v2`:
  - It precaches a hard-coded `CORE` list of pages, CSS, JS, icons and 14 CSVs.
  - It fetches same-origin requests network-first, falling back to cache after 4 s. Successful responses are cached, except `.zip` files.
  - Google Fonts are cache-first.
  - A navigation with no cached copy falls back to `index.html`.
- **Contract:** every new page or asset must be added to `CORE`, and `VERSION` must be bumped. Without the bump, offline users keep stale files until the network-first fetch refreshes them.

## 5. Dataset structure

- **`data/*.csv`:** 14 files, exported from `DS` by `tools/export-data.js`, at most 100 rows each, all one fictional company (Northwind Outdoors, Jan–Mar 2026). `data/README.md` describes each file.
- **Deliberate defects:**
  - `RawOrdersExport`: header and total rows, mixed date formats, `$`/`USD`/`N/A`, a duplicate row, an empty column.
  - `ExchangeRates`: Monday-only rates.
  - `UserRegionMapping`: users mapped to more than one region and an `ALL` row.
  - `CustomerTargets`: many-to-many grain.
- **`starter/northwind-starter.zip`:** PBIP and TMDL with 12 tables and 11 relationships, built by `tools/build-starter.js`, with a `DataFolder` parameter.

## 6. Feature inventory

- **Skill content:** 3 levels, 17 topics, 73 assignments with expected results and worked solutions, 90 interview questions, 68 assessment items (multiple-choice and practical tasks).
- **Flashcards:** 188 cards (98 concept + 90 topic):
  - spaced repetition and a "due today" mode;
  - a timed mock interview;
  - filters;
  - print/PDF;
  - deep links `#card=`, `#deck=&cat=`, `#mock`.
- **Glossary:** 139 terms, auto-linked into lessons and shown in a popover (a bottom sheet on phones).
- **Cheat sheets:** printable, one per level.
- **Career paths:** 4 roles that highlight their core topics.
- **Certification map:** PL-300 and DP-600 skill areas mapped to topics, with readiness.
- **Search:** pages, topics, assignments, interview questions, assessments, flashcards, glossary and datasets.
- **Theme:** light/dark switch at top right, following the OS until the user changes it.
- **Platform:** responsive layout (phone, iPad, desktop), offline/installable PWA, progress export and import.

## 7. Problems and inconsistencies found

1. **Expected results contradict the data** in six assignments. The worked solutions already flag these. None of them is checked automatically.

   | Assignment | Text says | Data has |
   |---|---|---|
   | `b-pq-0` | Qty has 2 nulls | 3 |
   | `b-dax-3` | 6 return lines | 7 |
   | `b-model-2` | 12 lines differ by region | 79 |
   | `b-dax-1` | an order has one channel | orders span channels |
   | `a-dax-0` | kayaks/boards trigger the alert | products with reorder point 30 do |
   | `i-pq-3` | every row gets a rate | 99 of 100 do |

2. **No validation of any kind.** Nothing checks duplicate IDs, missing solutions, broken links, glossary references or dataset row counts. A typo in a content file can silently break a page.
3. **Content is code.** About 250 KB of hand-edited JavaScript literals. It is hard to review in a pull request and hard to contribute to.
4. **The positioning overclaims.** "Build the reflexes of a 5-year Power BI developer" and "beginner to 5-year senior" appear in the hero, the README, the meta descriptions and the manifest.
5. **Certification map is a single frozen version** with no verification date:
   - PL-300 was revised on 2026-04-20 and added DirectLake/Import choice, Copilot, visual calculations, personalization, accessibility and automatic page refresh.
   - DP-600 changes on 2026-10-19 and now distinguishes Direct Lake on OneLake from Direct Lake on SQL.
6. **Fabric content treats Direct Lake as one mode.** Current docs (2026-09-02) define two options:
   - *Direct Lake on OneLake*: multi-source, no DirectQuery fallback, can be combined with Import tables.
   - *Direct Lake on SQL endpoints*: single source, falls back to DirectQuery.
7. **The homepage is the whole curriculum**: 37 KB of HTML plus every topic rendered. That is heavy for a first visit and gives no "what next".
8. **Coverage gaps:**
   - learning is only skill-by-skill; there are no scenarios or work simulation;
   - no SQL, warehousing, testing or automation tracks;
   - governance and modern features are thin;
   - no requirements, UAT, incident or architecture-decision practice.
9. **Open-source hygiene:** no LICENSE, contributing guide, code of conduct, security policy, changelog, issue templates or CI.
10. **The service-worker `CORE` list is hand-maintained.** Every new file risks being missing offline.
