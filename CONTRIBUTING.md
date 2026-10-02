# Contributing

Thanks for helping. This project is used by people teaching themselves Power BI, so correctness matters more than volume. One wrong expected result costs a learner an evening.

## Quick start

You need Node.js 22.5 or later (for the built-in SQLite used by the SQL tests). There are no npm dependencies.

```bash
npm run data     # regenerate data/ from the seeded generators (only if you changed a generator)
npm run build    # regenerate the site files from content/
npm test         # run every check
```

Preview locally with any static server from the project root, for example `npx serve .` or `python -m http.server`, and open `/index.html`.

## How the project is organised

| Path | What it is |
|---|---|
| `content/` | **The source of truth.** All lessons, scenarios, flashcards, glossary, certifications and templates, as JSON or Markdown. Edit these. |
| `content/schema/` | JSON Schemas for the content files. VS Code validates against them automatically via `$schema`. |
| `assets/js/*.js`, `*.html` (most), `experience/`, `sw.js` | **Generated** by `tools/build.js`. Files say `GENERATED` at the top. Don't edit them by hand. |
| `data/` | CSVs generated from fixed seeds by `tools/generate-data.js` (course data, company pack, track files). |
| `tools/` | Build, data generators, starter-project builder, enterprise data generator. |
| `tests/` | Everything CI runs. |
| `docs/` | Architecture and migration notes. |

Hand-written pages (`index.html`, `learn.html`, `experience.html`, `progress.html`, `diagnostic.html`, `templates.html`, `flashcards.html`, `glossary.html`, `cheatsheet.html`, `course.html`) are edited directly. The build only rewrites the navigation between `<!--nav:…-->` and `<!--/nav-->`.

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
2. Put evidence files in `data/experience/<id>/`, preferably generated in `tools/lib/scenario-files.js`, with facts in `tools/lib/scenario-facts.js`.
3. Use the recurring people in `content/personas.json`, and keep the story consistent with earlier scenarios. Check dates, names and which decisions have already been made.
4. **Rubric:** weights sum to 100.
5. **Hints:** at least three for sprints; they narrow where to look and never give the answer.
6. **Content:** every scenario says why a real company would care (`impact`), and every solution has the four-level review (junior, competent, senior, architect).

## Certification outlines

`content/certifications/*.json` holds versioned outlines with `effective` dates. When Microsoft publishes a new outline:

1. Add a new version; don't overwrite the old one.
2. Map skills to topics.
3. Update `verified`.

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
