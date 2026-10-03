# Implementation plan: trust, identity, discoverability

Plan for 2.2.0 onward. Written 2 October 2026 against commit `1e4b620`. The findings it acts on are in the four audits:

- [progress-scoring-audit.md](progress-scoring-audit.md): progress schema, every formula, findings, target scoring
- [security-audit.md](security-audit.md): threat model, import hardening, CSP, fonts, CI supply chain
- [seo-audit.md](seo-audit.md): what crawlers see, what must never be static
- [design-audit.md](design-audit.md): tokens, components, navigation, Toolkit vs Resources overlap, contrast

## What doesn't change

- **Architecture:** static files, the Node build, vanilla JS, `localStorage`, the service worker, fixed-seed data, CI validation. No framework and no server.
- **Content and data:** Northwind Outdoors, IBM Plex, light and dark themes.
- **Product model:** Skill Mode, Experience Mode and the Toolkit, kept distinct, with scenario answers loaded lazily.
- **Progress:** local, with export and import, and no sign-in.

## Target architecture

```
content/  ──build──▶  site/  (static HTML with real content + small vanilla scripts)
                        │
                        ├─ HTML: everything a learner sees before acting (SEO, no-JS, a11y)
                        ├─ JS:   progress, quizzes, reveals, scoring, notes (progressive enhancement)
                        └─ CSS:  tokens.css → base/components (one token source)

tests/
  node:    content, curriculum, data, links, SQL, toolkit, progress-import, scoring, leak checks
  browser: Playwright (Chromium in CI): journeys, axe, layout at 1440/1024/768/390
```

## CSS and token migration (Phase 2)

1. Create `assets/css/tokens.css`, the only place colours, radii, spacing, type and shadows are defined, for light, dark and system.
2. Remove the token blocks from `pages.css` and from the inline styles in Flashcards, Glossary, Cheat sheet and 404. Those pages load `tokens.css`.
3. Keep the **old token names as aliases** for one release (`--panel: var(--surface-1)`, `--ink: var(--text-primary)`, `--yellow: var(--grail-gold)`), so the 500-plus existing rules keep working while components move to the new names.
4. Palette, after contrast checks (`docs/design-audit.md`):

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | `#F7F7F4` | `#0D0F12` | page |
| `--surface-1/2/3` | `#FFFFFF` / `#FBFBF9` / `#F1F2EE` | `#15181D` / `#1B1F25` / `#20242B` | panels |
| `--text-primary` | `#16181D` | `#F3F4F2` | |
| `--text-secondary` | `#5C626D` (5.7:1) | `#A9AFB8` (8.1:1) | |
| `--text-muted` | **`#676D77`** (≥ 4.5:1 on every surface; was `#8A9099`, 3.0) | **`#858C97`** (≥ 4.5:1; was `#737A85`, 4.1) | |
| `--border` / `--border-strong` | `#E2E3DF` / `#CCCEC8` | `#292E35` / `#383E47` | separators |
| `--control-border` | `#8B9098` (3.2:1) | `#6B727D` | inputs, checkboxes (WCAG 1.4.11) |
| `--grail-gold` | `#D9A514` | `#E2B636` | fills with dark text (7.9:1) |
| `--grail-gold-ink` | **`#7D5D00`** (6.1:1) | `#E9C557` | gold text, active indicator, focus ring |
| `--grail-gold-soft` | `#FFF6D8` | `#302912` | insight backgrounds |
| `--success / --warning / --danger / --info` | `#3A7652` / **`#93640F`** / `#B4473C` / `#426A9A` | `#6FBF8E` / `#E0A84A` / `#EE8A7E` / `#86A9D6` | status, always with text |

5. Scales: radius `--r-1 4px` (controls), `--r-2 6px` (surfaces), `--r-3 8px` (major cards), `--r-pill 999px`. Spacing 4/8/12/16/24/32/48. Shadows only `--shadow-overlay` (dialogs, search, pop-ups) and `--shadow-hover`.
6. Topic colours: a dot, a 3px left accent or a hairline tag border. Never a fill behind text.
7. Icons: `assets/js/icons.js` (inline SVG strings, 1.75 stroke, `currentColor`, 18px) and a build helper with the same set for static HTML. Emoji in UI positions are replaced. Emoji in scenario dialogue stay.
8. Motif: `.note-rule` (2px gold left rule, mono uppercase label) for *Why this matters*, *Production note*, *Senior* and stage labels. It replaces `.setup` and the Toolkit callout variants.
9. Experience Mode: graphite header band, mono ids, a severity chip with text, an evidence list styled as a log, and a **Focus** layout that collapses the global nav into "← Exit scenario".

## Scoring migration (Phase 1)

Full detail is in [progress-scoring-audit.md](progress-scoring-audit.md#target-model-implemented-in-220). In short:

- **Mastery:** one `PBI.mastery()` (boxes 0/1/2/3/4+ → 0/25/50/75/100%).
- **Readiness:** one `PBI.readinessFrom()`.
- **Evidence:** verified (first MCQ answer), self-assessed (ticks, deliverables, rubric) and recall (cards), each shown separately.
- **Scenario:** quality (rubric) separate from independence (hints, early reveal).
- **Stage:** E = mean quality of completed scenarios × completion ratio. A stage is cleared at S ≥ 70%, completion ≥ 70% and quality ≥ 65%.
- **Certification:** midpoint-normalised domain weights, with *Curriculum coverage* and *Practice readiness* shown separately and no exam prediction.
- **Portfolio:** renamed *Portfolio evidence*.

## Progress-schema migration (Phase 1)

- `schemaVersion` 2 → 3: adds `quizFirst`, seeded from `quiz`. Nothing is removed or renamed.
- Export `version` 3. Import accepts versions 1–3, validates strictly (`PBI.sanitizeProgress`), backs up the current progress first, and shows a comparison dialog.
- New key `pbi-holy-grail-backup-v1`: `{at, main, cards}`. Restored from the progress page.

## Navigation (Phase 3)

| Width | Header |
|---|---|
| ≥ 861px | Learn · Experience · Interview · Toolkit · Progress, then search and theme |
| ≤ 860px | Learn · Experience · Interview · Toolkit · **More** (a disclosure menu: Progress, Glossary, Datasets, Templates, Export/Import) |

- "Practice" is renamed **Experience**, matching the product's name for it.
- **Resources leaves the header** and becomes the Toolkit's **Library** door. `resources.html` stays and keeps working, with an "is now part of the Toolkit" crumb.
- Scenario pages get a focus mode: the slim header shows "← Exit scenario", the ticket id and search.
- Returning home: one Continue card (sanitised href), then a single line ("6 cards due · Current focus: Performance · 4 deliverables in portfolio evidence"), then *Explore other paths* collapsed.

## Files to modify

`site/assets/js/site.js`, `progress.js`, `progresspage.js`, `home.js`, `course.js`, `xp.js`, `xphub.js`, `levelpage.js`; `site/flashcards.html`, `glossary.html`, `cheatsheet.html`, `404.html`, `index.html`, `learn.html`, `progress.html`, `experience.html`, `toolkit.html`; `site/assets/css/*.css`; `tools/lib/partials.js`, `build-pages.js`, `build-experience.js`, `build-toolkit.js`, `build-sw.js`, `build.js`, `load.js`; `content/certifications/*.json` (stored weights); `content/toolkit/index.json` (Library door); `tests/run.js`, `tests/links.test.js`; `.github/workflows/validate.yml`; `package.json`; `README.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, `SECURITY.md`, `docs/README.md`.

## Files to create

- **Phase 1:** `tests/progress-import.test.js`, `tests/scoring.test.js`, `tests/lib/browser-env.js` (a tiny `localStorage`/`document` shim so `site.js` and `progress.js` run in Node)
- **Phase 2:** `site/assets/css/tokens.css`, `site/assets/js/icons.js`, `site/assets/fonts/*` plus `OFL.txt`
- **Phase 4:** `tools/lib/build-seo.js` (sitemap, robots, JSON-LD), `tools/lib/static-render.js`, `site/sitemap.xml`, `site/robots.txt`, `site/assets/og/og-default.png`, `tests/leaks.test.js`
- **Phase 5:** `playwright.config.js`, `tests/e2e/*.spec.js`, `tests/e2e/fixtures/*`
- **Phase 6:** `package-lock.json`, `.github/dependabot.yml`, `.github/workflows/stale-content.yml`, `.github/CODEOWNERS`, `.sqlfluff`
- **Phase 7:** offline-download support in `sw.js` (message API) and `xp.js`

## Backward-compatibility risks

| Risk | Mitigation |
|---|---|
| Learners' displayed percentages drop (stage, readiness) | Intended. The changelog explains it, and each number gets a "how this is calculated" panel. |
| A v3 export imported into an older deployed site | The older importer rejects versions above 2 with a clear message. The site is only ever one version, so this only happens after a rollback. |
| Old bookmarks to `resources.html#…` | The page stays. The anchors keep resolving or redirect to the Toolkit Library. |
| CSS alias tokens hide unmigrated rules | Phase 2 finishes by searching for old token names. The aliases are removed in 2.3.0. |
| Static rendering leaks answers | `tests/leaks.test.js` fails the build. |
| Service worker serves stale CSS after the redesign | `VERSION` is a content hash, so any change invalidates the cache. |
| Playwright makes CI slow or flaky | Chromium only, with a fixed viewport list, no pixel-exact snapshots (only layout assertions: overflow, overlap, element boxes), and a 10-minute cap. |

## Rollback

Each phase is a separate commit (or pull request) on `main`, and deploys only if CI passes. To roll back a phase, run `git revert <commit>` and push. Progress data survives any rollback, because no field is removed or renamed. A v3 file only needs re-exporting if someone imports it into a rolled-back site.

## Phases

| Phase | Release | Contents | Needs your decision |
|---|---|---|---|
| 0 | – | these audits | – |
| 1 | 2.2.0 | import hardening, backup and compare, safe hrefs, mastery, evidence types, stage, cert, independence, portfolio naming | – |
| 2 | 2.3.0 | tokens, palette, radius, shadow, icons, motif, self-hosted fonts | – |
| 3 | 2.3.0 | Resources → Toolkit Library, mobile More menu, returning home, scenario focus, subtraction | – |
| 4 | 2.4.0 | static rendering, fallbacks, sitemap, robots, JSON-LD, OG image, leak test | – |
| 5 | 2.4.0 | Playwright journeys, axe, responsive layout checks | – |
| 6 | 2.4.0 | pinned dev deps, lockfile, Dependabot, stale-content issues, CODEOWNERS, SQLFluff, CSP | – |
| 7 | 2.5.0 | "Make available offline" for scenarios | – |
| 8 | – | privacy-respecting analytics | **Yes: whether to collect anything at all, and with which tool** |
| 9 | – | GitHub About, topics, social preview, releases and tags | **Yes: these publish to GitHub, and you run or approve them** |

Open content decision: scenario ticket `labels` (for example `performance, dax`) name the domain before the learner investigates. A real reporter would add labels, but they reduce the ambiguity the brief wants protected. The options are to keep them, to show them only after the learner opens the evidence, or to replace them with reporter-style labels (`executive`, `monday`).

## Definition of done (per phase)

- `npm run check` passes: data reproducible, build current, all Node tests pass.
- `html-validate` passes on every page.
- From Phase 5, Playwright and axe pass on the generated `site/`.
- The generated site has been served locally under `/power-bi/` and inspected at 1440 and 390px in light and dark, with no console errors.
- The changelog, contributing guide and these documents are updated.
- Nothing in the static HTML reveals a hint, rubric answer, retrospective question, model answer, correct option or worked solution.
