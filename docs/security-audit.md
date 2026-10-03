# Security audit

Static site on GitHub Pages: no server, no accounts, no cookies, no third-party scripts. Written 2 October 2026 against commit `1e4b620`.

## Threat model

The only attacker-controlled input that reaches learner state is a **progress file**. Someone shares a "my progress" JSON, or a learner downloads one from a forum, and imports it. Everything else is either built from this repository (reviewed and tested in CI) or typed by the learner into their own browser.

Assets worth protecting:

- The learner's existing progress, which is often weeks of work and can't be recovered if overwritten.
- The integrity of the page: no script execution, no HTML injection, no redirect to another origin.

## Findings

| # | Finding | Where | Severity |
|---|---|---|---|
| S1 | **Imported `last.href` becomes a link.** `home.js` writes `main.last.href` into `<a href>` after HTML escaping only. A file with `"href": "javascript:alert(document.domain)"` produces a working script link behind the **Continue** button. HTML escaping is not URL sanitisation. | `site.js` import, `home.js` | **High** |
| S2 | **Imported `diag.rec.href` becomes a link** on the home page. Same issue as S1. | `home.js` | **High** |
| S3 | **Imported objects are stored without validation.** `importProgress` checks `app` and `version`, then saves `p.data[key]` as is. Unknown keys, wrong types, huge strings and nested junk all persist. A bad file can break pages for that learner (for example, `xp` as an array, or `srs` entries with string boxes). | `site.js` | **Medium** |
| S4 | **No backup before replacing progress.** One `confirm()` with the export date, then an overwrite. A mistaken import can't be undone. | `site.js` | **Medium** |
| S5 | **External links:** all 195 `target="_blank"` links in the static HTML, and every one the scripts render, carry `rel="noopener"` (checked during this audit). No test enforces it yet; Phase 1 adds one. | `md.js`, `build-toolkit.js`, scripts | Low, already handled |
| S6 | **Dynamic HTML is escaped** via `PBI.esc` / `esc` in every renderer that was inspected (`course.js`, `xp.js`, `progresspage.js`, `home.js`, `tkhub.js`). The content is repository-controlled. Import validation (S3) removes the remaining path for hostile strings. | various | Low |
| S7 | **No Content Security Policy.** GitHub Pages can't set headers, so a CSP would have to be a `<meta>` tag. The site has inline scripts (theme bootstrap, page scripts in `flashcards.html`, `glossary.html`, `cheatsheet.html`) and loads Google Fonts. A meta CSP needs those inline scripts moved to files or hashed. | all pages | Low (defence in depth) |
| S8 | **Google Fonts are third-party requests.** They leak the visitor's IP address to Google and break the font offline until cached. Self-hosting IBM Plex subsets fixes both. | `partials.js` head | Low (privacy) |
| S9 | **The service worker caches only same-origin GET requests** and Google Fonts. It doesn't cache cross-origin script, and nothing it caches is learner data. | `sw.js` | None |
| S10 | **CI downloads `html-validate@9` unpinned through `npx --yes`** on every run. A compromised release would run in CI with a read-only token. Actions are pinned to major tags, not SHAs. | `validate.yml` | Low (supply chain) |

## Fixes in 2.2.0 (Phase 1)

- **`PBI.safeHref(value)`** accepts only a relative same-origin route: an optional `experience/` or `toolkit/` folder, a `[a-z0-9-]+.html` page, and an optional `#fragment` of safe characters. It rejects everything else, including `javascript:`, `data:`, `http(s):`, `//`, backslashes and `..`. It's applied **on import, on write (`PBI.touch`) and on read (`home.js`)**, so a value already in storage from before the fix can't produce a script link either.
- **`PBI.sanitizeProgress(payload)`** reconstructs the main and cards stores from a whitelist:
  1. `app` must be `power-bi-holy-grail`, and the payload version must be 1–3;
  2. every known field has a type, pattern, enum, range or length limit;
  3. unknown fields at any level are dropped (and counted, so the dialog can say "12 unknown entries ignored");
  4. ids are checked against the curriculum (topics, scenarios, rubric criteria, deliverables) when that data is loaded on the page, and against strict patterns otherwise;
  5. strings are length-capped (notes 20,000 characters, titles 200);
  6. any structural failure rejects the whole file, and nothing is written.
- **Pre-import backup.** Before replacing, both stores are copied to `pbi-holy-grail-backup-v1` with a timestamp. **Progress → Restore the previous progress** puts them back.
- **Comparison dialog.** A native `<dialog>` shows the import file's export date and counts (assignments, quiz answers, scenarios, flashcards reviewed) beside the current browser's, with **Replace** and **Cancel**. There's no Merge: there's no safe, predictable rule for merging two `xp` records or two SRS histories.
- Tests in `tests/progress-import.test.js` run the sanitiser in Node against hostile fixtures (script URLs, prototype-pollution keys, wrong types, oversized strings, unknown fields, wrong app id, future version) and assert the output.

## Later phases

- **CSP (Phase 6):** move the three inline page scripts into files, then add `<meta http-equiv="Content-Security-Policy" content="default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'sha256-…'; connect-src 'self'; base-uri 'self'; form-action 'none'">` with the theme bootstrap hashed. `frame-ancestors` is ignored in meta tags, so clickjacking protection isn't possible on GitHub Pages. That's acceptable, because there is no state-changing action a framed page could be tricked into that the learner can't undo.
- **Fonts (done in Phase 2):** IBM Plex Sans (400, 400 italic, 500, 600, 700) and Plex Mono (400, 500) are self-hosted as Latin `woff2` subsets in `site/assets/fonts/` (148 KB in total), with the OFL licence beside them, and precached by the service worker. The site makes no third-party requests, so S8 is closed. `tests/design.test.js` fails if a font CDN reappears.
- **CI (Phase 6):** move `html-validate`, Playwright and axe-core to pinned `devDependencies` with a committed lockfile, run `npm ci`, and enable Dependabot for npm and GitHub Actions.
