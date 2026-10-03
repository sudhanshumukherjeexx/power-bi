# Design audit

Written 2 October 2026 against commit `1e4b620`, before the Graphite × Warm Ivory × Grail Gold identity.

## Stylesheets

| File | Size | Loaded by | Role |
|---|---|---|---|
| `assets/css/pages.css` | 13.6 KB | every page except Flashcards, Glossary, Cheat sheet and 404 | **design tokens**, base elements, level-page layout |
| `assets/css/site.css` | 13.9 KB | every page | search, glossary pop-ups, readiness, solutions, paths, certification map |
| `assets/css/app.css` | 35.7 KB | every page | navigation, home, hubs, progress, Experience Mode, Toolkit, catalog |
| inline `<style>` | 13.5 / 5.2 / 6.2 / 1.1 KB | Flashcards, Glossary, Cheat sheet, 404 | **each redefines the whole token set** |

The token set (`--bg`, `--panel`, `--ink`, `--line`, `--yellow`…) is defined **five times**: `pages.css` plus the four inline blocks. A colour change has to be made in five places, and the copies have already drifted (404 has no `--line-2`, Cheat sheet has its own `--sql` values). Apart from the token blocks, only `.jump`, `.vh` and `[id]` are defined in more than one file.

## Tokens today

| Group | Tokens | Notes |
|---|---|---|
| Surfaces | `--bg #EEF1F5`, `--panel #FFF`, `--panel-2 #F6F8FA` | cool blue-grey, typical "admin portal" |
| Text | `--ink #1B2430`, `--ink-2 #4A5568`, `--ink-3 #7A8594` | `--ink-3` on `--bg` is 3.3:1 (fails AA for body text) |
| Lines | `--line #D9DEE6`, `--line-2 #C4CBD6` | |
| Brand | `--yellow #F2C811` (Power BI yellow), `--yellow-ink #7A6200`, `--yellow-soft #FFF3BF`, `--hl-ink #B38B00` | 69 uses of `var(--yellow)`: buttons, active nav, progress bars, focus rings, borders, skip link, callouts, chips |
| Status | `--ok`, `--ok-soft`, `--bad`, `--bad-soft` | no warning or info tokens; warnings reuse `--adv` (orange level colour) |
| Levels | `--beg` blue, `--int` purple, `--adv` orange | reused as status colours |
| Tracks | `--sql`, `--dw`, `--qa`, `--api`, `--gov`, `--fab`, `--mod` | seven saturated hues |
| Shape | `--radius 6px`, `--shadow` (two-layer) | |
| Type | IBM Plex Sans, IBM Plex Mono (Google Fonts) | |

**62 distinct hex colours** appear across the CSS. Most are tokens, but there are about 15 one-off literals (`#12171E` hard-coded on tags in dark mode, `#1B2430` in the skip link, and others).

**13 different border radii:** 2, 3, 4, 6, 8, 10, 12 and 14px, 50%, 999px, plus four asymmetric variants. The most common are 8px (34 uses) and 10px (21).

**15 box-shadows**, including on static cards (`.mcard`, `.tile` hover, `.continue`).

## Components

- **Cards everywhere:** `.mcard` (hub cards with a coloured top border), `.tile` (home and progress stats), `.continue`, `.xpcard`, `.tkdoor`, `.dscards`, `.xcat`, `.empty`. Progress has tiles inside sections, and certifications have bars inside cards inside a grid.
- **Topic colour at full saturation:** track tags (`.tag.sql` etc.) are solid colour fills with white text. Hub cards use the track colour as a 4px top border plus a coloured tag. On Learn, eleven differently coloured cards compete.
- **Chips:** `.chip`, `.guide`, `.verified`, `.tier`, `.tkk`, `.srch-type` are six pill styles with slightly different padding, radius and font.
- **Emoji as icons:** 🧩 📖 🎯 🛠 📦 📄 🖨 ⏱ in the Toolkit doors, Resources, the cheat sheet and the template pages. Emoji inside scenario chat messages (😅 🙏 🤞) are dialogue, not UI, and stay.
- **SVG icons** exist for search and the theme switch only (stroke 2, 20px).
- **No "insight" motif.** `.setup` (a yellow left border) and `.callout` both point at the vertical-line idea, but in different widths and colours.

## Navigation map

```
Header (every page): brand · Learn · Practice · Interview · Toolkit · Progress · Resources · [search] [theme]
Footer: Progress · Toolkit · Resources · Glossary · Templates · GitHub · Export · Import · Install

Home ─┬─ Learn (learn.html) ── levels (3) · tracks (8) · certification map · career paths · diagnostic
      ├─ Practice (experience.html) ── 18 scenarios by stage ── experience/<slug>.html
      ├─ Interview (flashcards.html) ── concept deck · topic deck · mock interview
      ├─ Toolkit (toolkit.html) ── 6 doors ── 30 guides (toolkit/<id>.html)
      ├─ Progress (progress.html)
      └─ Resources (resources.html) ── study tools · glossary · templates · cheat sheets · external catalog
                                       · starter · datasets · track files · enterprise pack
Unlisted in nav: glossary.html, cheatsheet.html, templates.html, diagnostic.html
```

At 390px the six labels share one row at 0.84rem with 2px of padding. They fit, but the targets are about 36px tall and "Resources" sits at the edge.

## Toolkit vs Resources overlap

| Content | Resources | Toolkit | Verdict |
|---|---|---|---|
| Templates (26) | section, links to `templates.html` | **Templates** door + `templates-library` guide | duplicate |
| Course datasets, track files, enterprise pack, starter PBIP | sections | **Datasets & Labs** door + `practice-lab` guide | duplicate |
| External resources catalog (118) | section with filters | `trusted-sources`, `bookshelf`; results in the hub search | overlapping |
| Glossary, cheat sheets | sections | listed in the hub search only | Toolkit has no door for them |
| Study tools (flashcards, mock interview, diagnostic) | section | **Career & Certification** door (interview center) | overlapping; also the Interview tab |
| Certifications | – | `certification-center` | Toolkit only |

**Conclusion:** Resources is a second index of material the Toolkit already owns, so the user has to guess which one to open. Option A from the brief applies: **Resources moves into the Toolkit** as a **Library** door (glossary, cheat sheets, external catalog, datasets and downloads). `resources.html` stays as a URL and keeps its content, but it leaves the top navigation and redirects its section anchors into the Toolkit. No content is deleted.

## Subtraction candidates

| Where | What | Action |
|---|---|---|
| Home (returning) | four stat tiles plus Continue plus the goal route plus discovery | Continue first; due cards and current focus as one line; discovery collapsed |
| Progress | stage list, competency, scenarios, portfolio, decisions, modules, certs, card tiles | keep the sections but drop the tiles; explanations go behind disclosure |
| Learn | eleven coloured cards | neutral rows with a 3px topic accent |
| Level pages | readiness pill, guide letter chip, verified chip, time and dataset on every assignment | keep; reduce colour only |
| Footer | five links plus three buttons | keep (export and import must stay reachable everywhere) |
| Hubs | `.mcard` coloured top borders and shadows | border only |

## Accessibility notes

- Skip link, `main` focus, `aria-current` nav, search dialog focus trap, tabs with roving tabindex in scenarios, reduced-motion overrides and theme `role="switch"` all exist.
- `--ink-3` (#7A8594) on `--bg` is 3.3:1, under the 4.5:1 needed for body text. It's used for small mono labels, which makes that worse.
- Yellow `#F2C811` on white is 1.6:1. It's used as a fill (with dark text), which is fine, but also for the active-nav underline and focus outlines, where it's the only indicator. That fails WCAG 1.4.11 (non-text contrast, 3:1).
- Status chips (`.chip.ok`, `.verified.due`) rely on colour plus text. Progress bars rely on width plus a text percentage. Both are fine.
- No automated browser accessibility testing exists. `html-validate` checks markup only.

## Target identity

Graphite × Warm Ivory × Grail Gold, with tokens exactly as in the implementation plan, after contrast checks. Gold marks primary actions, the current location, progress and insight, and nothing else. Topic colours shrink to a dot or a 3px accent. Radii: 4px controls, 6px surfaces, 8px major cards, 999px pills. Shadows: overlays and hover only. The vertical gold rule (`.rule-note`) is the signature, used for *Why this matters*, *Production note* and stage labels. Technical ids (BI-1042, INC-2044, ADR-007, SEV2) are always set in Plex Mono.
