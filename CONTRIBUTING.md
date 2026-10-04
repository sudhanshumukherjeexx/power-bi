# Contributing

Thanks for helping. This project is used by people teaching themselves Power BI, so correctness matters more than volume. One wrong expected result costs a learner an evening.

## Quick start

You need Node.js 22.5 or later (for the built-in SQLite used by the SQL tests). The website has no runtime dependencies. The development tools (Playwright, axe-core, html-validate) are pinned in `package.json` and `package-lock.json`.

```bash
npm ci                              # install the pinned dev tools (once)
npm run data                        # regenerate site/data/ from the seeded generators (only if you changed a generator)
npm run build                       # regenerate the site files in site/ from content/
npm test                            # content, scoring, import safety, leaks, links, SQL… (Node only, a few seconds)
npm run validate:html               # HTML validity
npx playwright install chromium     # once, for the browser tests
npm run test:e2e                    # journeys, accessibility (axe) and responsive layout in a real browser
npm run serve                       # preview at http://localhost:4173/power-bi/, served like GitHub Pages
```

If you already have Edge or Chrome, you can skip the Chromium download: `PW_CHANNEL=msedge npm run test:e2e`. Browser tests live in `tests/e2e/`. A failing run leaves screenshots and a trace in `test-results/`, which you can open with `npx playwright show-trace`.

The repository has three parts: `content/` is what you edit, `site/` is the website GitHub Pages publishes, and `tools/` turns one into the other. On every push to `main`, GitHub Actions runs all the checks and publishes `site/` only if they pass.

## How the project is organised

### Source: edit these

| Path | What it is |
|---|---|
| `content/skills/`, `content/solutions/` | Skill Mode levels and tracks: topics, assignments, quizzes and worked solutions (JSON). |
| `content/experience/` | Experience Mode scenarios and their model answers. |
| `content/toolkit/` | The BI Developer Toolkit: `index.json` (doors and tags) and one Markdown guide per file in `guides/`, plus downloads in `files/`. |
| `content/resources/` | The external resource catalog shown in the Toolkit Library, under topics and on scenario pages. |
| `content/templates/` | Professional templates (Markdown) and their index. |
| `content/flashcards/`, `content/glossary/`, `content/certifications/`, `content/career-paths/`, `content/datasets/` | Flashcards, glossary, versioned exam outlines, career paths, dataset descriptions. |
| `content/*.json` | Stages, skills, goals, personas, diagnostic and site settings. |
| `content/schema/` | JSON Schemas for the content files. VS Code validates against them automatically via `$schema`. |
| Hand-written pages (in `site/`) | `index.html`, `learn.html`, `experience.html`, `progress.html`, `diagnostic.html`, `templates.html`, `flashcards.html`, `glossary.html`, `cheatsheet.html`, `404.html`. Edit them directly; the build only rewrites the navigation between `<!--nav:…-->` and `<!--/nav-->`. |
| Hand-written scripts | `site/assets/js/`: `store.js` (progress schema, migration, import validation, mastery and readiness; no DOM, tested in Node), `site.js` (shared helpers, search, export and import), `progress.js` (every score and its evidence type), `course.js`, `levelpage.js`, `learn.js`, `home.js`, `diagnostic.js`, `progresspage.js`, `xp.js`, `xphub.js`, `tplpage.js`, `tkhub.js`, `tkguide.js`. |
| `site/assets/css/` | `tokens.css` (the only place colours, type, radii and shadows are defined), then `site.css`, `pages.css`, `app.css`. |
| `tools/lib/icons.js` | The line-icon set. The build writes it to `site/assets/icons/icons.svg`; draw an icon with `<svg class="ic" aria-hidden="true"><use href="assets/icons/icons.svg#name"/></svg>`. |
| `site/assets/fonts/`, `site/assets/icons/` (app icons), `site/manifest.webmanifest` | Self-hosted IBM Plex (Latin subset, licence in `OFL.txt`), app icons and the app manifest. |
| `tools/` | The build (`build.js` and `tools/lib/`), data generators, starter-project builder, enterprise data generator. |
| `tests/` | Everything CI runs (`node tests/run.js`), plus the external link checker. |
| `docs/` | Project documentation; see [docs/README.md](docs/README.md). |
| `.github/workflows/validate.yml` | CI: runs every check on pushes and pull requests, and publishes `site/` to GitHub Pages after a passing push to `main`. |

### Generated: never edit by hand

These live in `site/`, are built from the source above, and are committed, so the site also opens straight from the folder with no build step. Generated files start with a `GENERATED` banner, and CI fails if one is out of date: change the source and run `npm run build`.

| Path | Built from |
|---|---|
| `site/assets/js/` (every other script: `content.js`, `tracks.js`, `solutions*.js`, `experience.js`, `xp/`, `toolkit.js`, `external.js`, `search-index.js`, …) | `content/` |
| `site/` level and track pages (`beginner.html` … `advanced.html`, `sql.html` … `modern.html`) and `resources.html` (the Toolkit Library) | `content/skills/`, by `tools/lib/build-pages.js` |
| `site/experience/*.html` | `content/experience/` |
| `site/toolkit.html`, `site/toolkit/` (hub, door pages, guide pages, `.md` and file downloads) | `content/toolkit/` |
| `site/templates/*.md` (downloads) | `content/templates/` |
| `site/data/` | Seeded generators in `tools/generate-data.js` (`npm run data`) |
| `site/starter/northwind-starter.zip` | `tools/build-starter.js` |
| `site/assets/icons/icons.svg` | `tools/lib/icons.js` |
| `site/sw.js` | The offline cache list and version, from every file above |

## Adding or fixing Skill Mode content

Topics live in `content/skills/<level-or-track>/<topic>.json`; solutions in `content/solutions/<topic>.json`.

### IDs and progress

- **Assignment IDs are positional.** `b-pq-0` is the first assignment of topic `b-pq`. Learners' progress is stored by these IDs.
- **Only append.** Never reorder or delete assignments, interview questions or assessment items.
- **Don't change wording without care.** Flashcard progress is keyed by a hash of the interview question text, and `tests/curriculum/legacy-pins.json` will fail if you change it. If a change is really needed, update the pin in the same PR and say why.
- **Every assignment needs a worked solution** with the same ID.

### Guidance levels

Each assignment has `guidance`:

- **A** guided steps (`steps`)
- **B** an objective with requirements (`brief` + `req`)
- **C** a problem to diagnose (`brief`)
- **D** an ambiguous decision (`brief`)

Higher levels and tracks should lean towards C and D.

### Numbers must be checkable

- **Levels:** any number in an expected result or a solution `check` needs a claim in `tests/curriculum/assertions.json`. That claim names a fact computed from the CSVs in `tests/curriculum/facts.js`. CI fails if the text and the data disagree.
- **Tracks and Experience Mode:** write numbers as placeholders such as `{{q1_2026_gross|money0}}`. They are filled at build time from `tools/lib/company-facts.js` (plus `scenario-facts.js` and `track-facts.js`). Never type a number from the data by hand.
- **SQL solutions:** add `"dialect": "portable"` and an `"expect": {"cols": [...], "rows": [[...]]}` block. CI runs the query in SQLite against the generated data and compares the output.

### Fast-moving facts

Any topic about Fabric, Service features, licensing or certifications needs `verified: { date, context, review_after_days }` and official `refs`.

1. Check the claim against Microsoft Learn on the day you write it.
2. Put the documentation page date in `context`.
3. CI warns when the review date has passed.

## Adding an Experience Mode scenario

1. Create `content/experience/<id>-<slug>/scenario.json` and `solution.json`.
   - **IDs:** `sNN` for sprints, `dNN` for drills. See the schemas.
   - **The brief must not contain the answer.** Root causes go only in `solution.json`. A test checks this.
2. Put evidence files in `site/data/experience/<id>/`, preferably generated in `tools/lib/scenario-files.js`, with facts in `tools/lib/scenario-facts.js`.
3. Use the recurring people in `content/personas.json`, and keep the story consistent with earlier scenarios. Check dates, names and which decisions have already been made.
4. **Rubric:** weights sum to 100.
5. **Hints:** at least three for sprints; they narrow where to look and never give the answer.
6. **Content:** every scenario says why a real company would care (`impact`), and every solution has the four-level review (junior, competent, senior, architect).

## Adding or fixing a Toolkit guide

The BI Developer Toolkit (`toolkit.html`) is built from `content/toolkit/`:

- `index.json` holds the six doors and the tag lists (tools and problems) the hub filters by.
- `guides/<id>.md` is one guide: JSON front matter between `---` lines, then Markdown. The build renders it to `toolkit/<id>.html`.

1. **Front matter:** `id` (same as the file name), `title`, `summary` (the problem it solves), `door`, `kind`, and `verified.date`. Tag it with `stages`, `skills`, `tools`, `problems` and `certs` so search and filters find it. Link `lessons`, `scenarios` and `templates` by ID; the build fails if an ID doesn't exist.
2. **References:** each entry in `refs` has a title, an `https` URL and a source tier (`official`, `specialist`, `community`, `third-party` or `book`). Mark paid resources with `"paid": true`. No tracking parameters.
3. **Markdown:** write links to site pages from the site root (`beginner.html#b-pq`, `toolkit/dax-debugging.html`). Fenced `tree` blocks become decision trees, `- [ ]` lists become checklists that remember ticks, and `> **Warning:**` (or Note, Tip, Senior, Rule) becomes a callout.
4. **Macros:** `::: datasets`, `::: track-files`, `::: templates`, `::: scenarios` and `::: cert-chain <cert-id>` insert tables generated from the course data, so they never go stale.
5. **Facts:** state only what you checked against the cited source, and update `verified` when you re-check. `npm run links:external` checks every external link.

## Certification outlines

`content/certifications/*.json` holds versioned outlines with `effective` dates. When Microsoft publishes a new outline:

1. Add a new version; don't overwrite the old one.
2. Map skills to topics.
3. Update `verified`.

## Design rules

The visual identity is Graphite × Warm Ivory × Grail Gold, set in IBM Plex. `tests/design.test.js` enforces the mechanical parts.

- **Tokens only.** Use the variables in `tokens.css` (`--surface-1`, `--text-secondary`, `--border`, `--gold-line`…). Never write a hex colour in a component. Old names such as `--panel` and `--ink` still work as aliases until 2.4.0.
- **Gold has four jobs:** the primary action, the current location, progress, and important insight. Fills use `--grail-gold` with `--on-gold` text. A line or outline that is the only indicator (current tab, focus) uses `--gold-line`, which keeps 3:1 contrast. Don't use gold for decoration.
- **Topic colour is an accent:** a dot (`.tag.sql`), a 3px rule or a hairline border, never a fill behind text.
- **The rule motif:** a 2px gold line with a mono caption (`.note-rule`, callouts, *Expected result*) marks insight. Keep it rare enough to mean something.
- **Shape:** radii are 4px (controls), 6px (surfaces), 8px (major cards) and 999px (tags). Shadows are only for overlays (`--shadow-overlay`) and hover. Separate things with background, border and space.
- **Cards are for objects:** scenarios, tickets, datasets, modules. Don't put cards inside cards.
- **Identifiers** (BI-1042, INC-2044, ADR-007, SEV2) are set in Plex Mono.
- **Experience Mode is operational:** a graphite ticket panel, mono ids and timestamps, and severity as text. Skill Mode stays editorial.
- **Navigation:** five destinations (Learn, Experience, Interview, Toolkit, Progress). Under 860px wide, Progress moves into **More** with Glossary, Library, Templates and export/import (`MORE` in `tools/lib/partials.js`). Don't add a top-level item. Find it a home in the Toolkit or under More.
- **The Library** is the Toolkit door whose `href` is `resources.html` (`content/toolkit/index.json`). A door with `href` opens that page instead of a generated door page and holds no guides.
- **Focus mode:** while a scenario is open (taken and not finished), `xp.js` adds `body.xpfocus`, which hides the main navigation and shows "← Exit scenario". Keep anything you add to a scenario page usable without the global navigation.
- **Icons** come from the sprite, sit next to a text label, and are `aria-hidden`. No emoji in UI chrome. Scenario dialogue may use them.
- **Contrast:** text is 4.5:1 or more on every surface in both themes. Check new colour pairs before using them.

## What may be static (search engines and readers without JavaScript)

Level pages, track pages, scenarios, the Library and the glossary are rendered into HTML at build time (`tools/lib/static-render.js`), and their scripts then replace the static version. Static HTML is public, so it may contain only what a learner sees **before acting**: assignments, briefs, messages, tasks, deliverables, evidence names, interview *questions* and quiz *options*. Never put hints, rubric criteria, retrospective questions, model answers, interview answers, quiz explanations or worked solutions in it. `tests/leaks.test.js` fails the build if you do.

The sitemap and `robots.txt` are generated (`tools/lib/build-seo.js`). Every page needs a unique `<title>` and a description of 50+ characters. To change the social preview image, edit `tools/og/og.html` and run `node tools/render-og.js`.

## Style

- **Plain English**, short sentences, British or American spelling consistently within a file.
- **No marketing language.** Don't promise that a website replaces years of experience.
- **Names:** fictional people and companies only. Never real customer data.
- **Accessibility:** alt text for images, no meaning conveyed by colour alone, keyboard-usable controls.

## Pull requests

- One topic or scenario per PR where possible.
- Run `npm run check` before pushing; CI runs the same checks plus HTML validation.
- Fill in the PR template, including how you verified any product facts.

By contributing you agree that your contribution is licensed under the MIT License, and you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).
