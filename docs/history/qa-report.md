# QA report: 2.0.0

> **Historical record** from the 2.0.0 redesign (October 2026), kept for context. It is not updated as the project changes: for how the project works today, see [CONTRIBUTING.md](../../CONTRIBUTING.md).

Date: 2026-10-01. This covers phase 8 of the [migration plan](migration-plan.md).

## Automated checks

`npm run check` regenerates the data and the generated files, confirms that nothing changed, and then runs every test suite. Result: **6,664 checks passed, 0 failed, 0 warnings.**

| Suite | Checks | What it proves |
|---|---:|---|
| build | 167 | Generated bundles, pages, nav, search index and service worker are current |
| content | 2,182 | Every content file matches its schema; IDs are unique and references resolve |
| curriculum | 550 | Every number in an expected result or solution ties to a recomputed value. Legacy assignment and flashcard IDs are pinned |
| datasets | 282 | Row counts, nulls, duplicates, foreign keys and planted defects |
| enterprise | 7 | Enterprise generator: deterministic output and exact defect counts |
| experience | 562 | Scenario structure, figures and timeline order; no solution leaks into the inputs |
| links | 2,755 | Internal links and anchors on every page |
| sql | 115 | SQL answers executed against SQLite and compared with their expected output |
| stale | 44 | Fast-moving topics carry a verification date that is still within its window |

Also checked:
- **HTML:** `html-validate` reports no findings with the config in `.htmlvalidate.json`.
- **External links:** checked with `npm run links:external`, which is a manual run because it needs the network.

## End-to-end flows (headless Edge)

All 19 flows passed with no JavaScript exceptions:

1. **Migration:** a v1 progress blob and a v1 export file both migrate to schema v2 with nothing lost.
2. **Beginner:** chooses a goal on the home page, follows the route, ticks an assignment and reveals its solution.
3. **Experienced developer:** the diagnostic recommends a starting point that matches the answers.
4. **Interview prep:** filters flashcards to the tracks, and the mock interview runs.
5. **Returning learner:** the home page shows "continue where you left off" from the last activity.
6. **Scenario:** sprint 04 completed end to end, covering hints, a deliverable, the rubric, the score with the hint penalty, and the retrospective.
7. **Decision log:** an ADR recorded in sprint 09 appears in sprint 10 and on the progress page.
8. **Drills:** the interactive requirements and governance drills both work.
9. **Search:** type and level/track/stage filters work, and the index loads on first use.
10. **Offline:** after one visit, the service worker serves pages while offline.
11. **Old deep links:** links into the old home page (`index.html#b-pq`, `#ds-FactSales`, `#certs`) redirect to the level, Resources or Learn page that holds that section.

## Visual and responsive review

Screenshots at 1280 px (desktop) and 390 px (phone) of the home page, Learn, Progress, Diagnostic, Experience hub, a scenario, Templates, each level page and a track page. Two issues were fixed:

- **Experience hub cards:** they reused a `.top` class that collided with a header style. It is now `.xtop`.
- **Track switcher on phones:** the seven tracks wrapped into a tall column. It now scrolls horizontally (`.seg.scroll`).

## Accessibility

- **Keyboard:** every interactive element is a native button or link with an explicit `type`. Focus outlines are visible in both themes.
- **Navigation:** the current section is marked with `aria-current`, and breadcrumbs are labelled landmarks.
- **Motion:** respects `prefers-reduced-motion`.

## Known limits

- **SQL dialects:** only SQLite actually runs the SQL. Answers marked `tsql` are reviewed by hand, not executed.
- **Fabric and Copilot:** these exercises can't be run without a capacity. They use logs and screenshots-as-data instead.
- **Microsoft facts:** checked against Microsoft Learn on 2026-10-01. The stale suite flags them for re-checking when their window expires.
