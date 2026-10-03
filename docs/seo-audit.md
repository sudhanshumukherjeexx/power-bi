# SEO and static-rendering audit

Written 2 October 2026 against commit `1e4b620`. Word counts are visible text with scripts removed, which is roughly what a crawler sees before running JavaScript.

## What a crawler sees today

| Page group | Pages | Visible words without JS | Canonical | Open Graph | `<noscript>` |
|---|---|---|---|---|---|
| Toolkit guides and doors | 36 | 150–2,000 (fully static) | yes | yes | no (not needed) |
| Home, Learn, Experience hub, Toolkit hub | 4 | 190–425 | yes | yes | no |
| Level and track pages (beginner … warehousing) | 11 | **~95** | yes | yes | "needs JavaScript to show the assignments" |
| Resources, Templates | 2 | **~90** | yes | yes | **the same assignments sentence (wrong page)** |
| Scenario pages | 18 | **~85** | yes | yes | "This scenario needs JavaScript" |
| Progress | 1 | 95 | yes | **no** | no |
| Diagnostic | 1 | **37** | yes | yes | no |
| Flashcards, Glossary, Cheat sheet | 3 | 330–1,840 | **no** | **no** | no |
| 404 | 1 | 75 | n/a | n/a | n/a |

There's no `sitemap.xml`, no `robots.txt` and no structured data. The Open Graph tags have no image.

## Gaps

1. **Skill pages render content only in JavaScript.** 151 assignments across 43 topics, with their business context, are invisible to non-rendering crawlers and to anyone with JS disabled. These are the pages most likely to match searches like "DAX CALCULATE exercise" or "Power Query unpivot practice".
2. **Scenario pages expose only the title and summary.** The brief, the ticket, the stakeholder messages and the deliverables are what the learner sees first and are safe to publish, but they're JS-only.
3. **The fallback text is wrong on Resources and Templates.** Both say the page "needs JavaScript to show the assignments". Neither has assignments.
4. **Three hand-written pages have no canonical or OG tags** (Flashcards, Glossary, Cheat sheet), and Progress has no OG tags.
5. **No sitemap or robots.txt.**
6. **No structured data.** Accurate candidates are `Course` (the site), `LearningResource` (level pages and scenarios), `TechArticle` (Toolkit guides) and `BreadcrumbList` (everything with breadcrumbs). `FAQPage` isn't accurate for anything here: interview questions are practice prompts, not FAQs, and Google restricts FAQ rich results anyway.
7. **No social image.** Shared links render without a preview.

## What must never be static

Static HTML is published to crawlers, caches and archives. It must contain only what a learner sees **before** they act:

| Static (safe) | Never static |
|---|---|
| scenario title, ticket id, severity, reporter, opened, due | model answer (`assets/js/xp/<id>.js`, lazy) |
| story, impact, stakeholder messages | hints |
| evidence **names and descriptions** (file links are already public in `data/experience/`) | rubric criteria and "what good looks like" |
| tasks and deliverables | retrospective questions (they reveal what mattered) |
| assignment title, business context, requirements, expected result | worked solutions (`solutions.js`, unlocked on tick or reveal) |
| interview questions | interview model answers |
| multiple-choice question and options | the correct option and the explanation |

Ticket `labels` (for example `performance, dax`) are part of the ticket and are already shown in the app. They're kept as is, because a real reporter adds labels too. Hiding them is a separate content decision, listed in the implementation plan.

## Plan (Phase 4)

- **Build-time rendering.** `build-pages.js` and `build-experience.js` render the static parts listed above into `<main>`. The page scripts then **replace** that markup with the interactive version, as they do today. The static markup uses the same headings and ids, so deep links work before and after hydration.
- **Accurate fallbacks.** Each page type gets its own `<noscript>`, saying what needs JavaScript there (progress, quizzes, revealing solutions) rather than claiming the content needs it.
- **`head()` everywhere.** The hand-written pages get canonical and OG tags injected by the build, between markers, as the navigation already is.
- **`sitemap.xml` and `robots.txt`**, generated from the page list. Lastmod comes from the content's `verified` date where there is one.
- **JSON-LD:** `Course` on the home page, `LearningResource` on level, track and scenario pages, `TechArticle` on Toolkit guides, and `BreadcrumbList` wherever breadcrumbs exist.
- **`og:image`:** one static 1200×630 PNG in the new identity, committed under `site/assets/og/`.
- **A test that fails the build** if any static HTML contains a hint, a rubric "good" string, a retrospective question, a model-answer summary, a correct-option marker or a worked solution. Leaks are caught by CI, not by review.

## Status after Phase 4

Measured on the generated site with JavaScript disabled (words of visible text in `<main>`):

| Page | Before | After |
|---|---|---|
| Beginner level | ~95 | 2,986 |
| SQL track | ~93 | 2,596 |
| Library (`resources.html`) | ~95 | 3,060 |
| Glossary | 330 | 4,345 |
| Scenario INC-2044 | ~86 | 520 |
| Drill REQ-301 | ~83 | 198 (the whole brief) |

- **Static rendering:** `tools/lib/static-render.js` renders level and track pages, scenario briefs, the Library and the glossary. The page scripts replace `<main>` on load, and the browser checks confirm one `h1`, no duplicate ids and the interactive controls present after hydration.
- **Leak test:** `tests/leaks.test.js` checks every generated page for scenario hints, rubric criteria, retrospective questions, model-answer sentences, interview answers, quiz explanations, worked solutions and answer-key attributes. Planting hints and quiz explanations into the renderer produced 148 failures, and removing them restored a clean run. Text a guided assignment already shows in its steps is public by design and isn't counted.
- **Head:** every page has exactly one canonical URL, Open Graph tags with an absolute `og:image` (1200×630, `tools/og/og.html`, rendered by `node tools/render-og.js`), a Twitter card and a description of 50+ characters. Hand-written pages get the same block between `<!--seo-->` markers at build time. No two pages share a `<title>`.
- **Structured data:** `Course` (home), `LearningResource` (levels, tracks, scenarios), `TechArticle` with `dateModified` from the verification date (Toolkit guides), and `BreadcrumbList` wherever there are breadcrumbs. The tests reject any other type.
- **Fallbacks:** each page type has its own `<noscript>` sentence saying what needs JavaScript there. The old "needs JavaScript to show the assignments" sentence is gone.
- **`sitemap.xml`:** 75 URLs, with `lastmod` from verification dates only. **`robots.txt`** is generated, but crawlers read it only at the host root (`sudhanshumukherjeexx.github.io/robots.txt`), so for this project site it is informational. Submit the sitemap in Google Search Console and Bing Webmaster Tools.

Not done: ticket `labels` are still shown. That's a content decision the maintainer hasn't made yet (see the implementation plan).
