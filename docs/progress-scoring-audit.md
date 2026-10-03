# Progress and scoring audit

Audit of every learner-facing number before the 2.2.0 "Trust and assessment" work. Written 2 October 2026 against commit `1e4b620`.

The question for each score: **what evidence produced this number, and does its name match that evidence?**

## Where progress lives

All progress is in the learner's browser (`localStorage`). There is no account and no server.

| Key | Owner | Contents |
|---|---|---|
| `pbi-holy-grail-v1` (main) | `site.js`, `course.js`, `xp.js`, `home.js`, `diagnostic.js` | see schema below |
| `pbi-holy-grail-cards-v1` (cards) | `flashcards.html`, `site.js` | `srs` (Leitner boxes) plus deck filters |
| `pbi-toolkit-checks-v1` | `tkguide.js` | Toolkit checklist ticks. Not exported. |

### Main store, schema v2

| Field | Shape | Written by | Kind of evidence |
|---|---|---|---|
| `done` | `{ "<topic>-<i>": bool }` | assignment checkbox | **self-assessed** |
| `quiz` | `{ "<topic>-q<i>": optionIndex }` | multiple-choice radio | **verified**, but see finding 2 |
| `sol` | `{ "<topic>-<i>": bool }` | "show the solution" | none (a reveal) |
| `navOpen`, `theme`, `path`, `goal` | UI state | various | none |
| `diag` | `{ ans, at, rec:{label, href, level, topic}, score }` | diagnostic | placement only |
| `xp` | `{ "<scenario>": { st, started, updated, done, doneAt, hints, sol, solEarly, del:{}, rub:{}, notes, dec:{} } }` | Experience Mode | `rub` and `del` are **self-assessed** |
| `seen` | `{ "<page>": date }` | `PBI.touch` | none (page visits never count) |
| `last` | `{ href, title, at }` | `PBI.touch`, `xp.js` | none; drives "Continue" |
| `schemaVersion` | `2` | `PBI.migrate` | |

### Cards store

`srs: { "<c|t><hash>": { b: box 0–5, d: next due date, n: reviews, l: last review } }`. Box intervals are 0, 1, 3, 7, 14 and 30 days. This is **recall evidence**: the learner grades their own recall, but repeated spaced success is still a meaningful signal.

## Formula inventory

| # | Score | Where | Formula today |
|---|---|---|---|
| F1 | Topic readiness (level pages) | `site.js` `PBI.readiness` | 50% assignments ticked + 25% MCQ correct + 25% topic cards with box ≥ 1 |
| F2 | Topic readiness (hubs, progress) | `progress.js` `P.readiness` | same formula, reimplemented against the compact outline in `meta.js` |
| F3 | Module readiness | `P.moduleReadiness` | unweighted mean of F2 over topics |
| F4 | Scenario score | `P.scenarioScore` | weighted rubric self-rating (0–4) × (1 − 5% per hint, max 20%) × (0.7 if solution opened early) |
| F5 | Competency per skill | `P.competency` | earned ÷ possible over: assignments (weight A 1, B 1.5, C 2, D 2.5), MCQ 0.3, cards 0.15 (half at box 1, full at box ≥ 3), scenarios 5 × F4 |
| F6 | Professional stage % | `P.stages` | mean(mean F2 of stage topics, **share of stage scenarios marked done**) |
| F7 | Current stage | `P.currentStage` | first stage under 60% |
| F8 | Certification readiness | `P.cert` | **unweighted** mean of area scores; area = mean F2 of mapped topics |
| F9 | Flashcard label "Mastered" | `PBI.SRS.label` | box ≥ 3 |
| F10 | Portfolio | `P.portfolio` | list of deliverables the learner ticked |
| F11 | Route step done | `P.stepDone` | module F3 ≥ 80%, scenario done, diagnostic taken, ≥ 20 cards reviewed, ≥ 3 scenarios done, or page seen |
| F12 | Home tiles | `home.js` | assignments done, scenarios done, cards due, F6 |

## Findings

1. **Stage Experience credit ignores quality (F6).** A scenario marked complete counts 100% toward the stage, even when every rubric criterion was rated 0. A learner can reach "Senior BI Developer 100%" without one credible deliverable. *Severity: high, the headline number is wrong.*
2. **Multiple-choice evidence isn't verified.** After answering, the page shows the right option and the radios stay enabled. Changing to the correct option overwrites `quiz[id]`, so readiness counts it as correct. The only verified evidence type in Skill Mode can be self-corrected. *Severity: high for trust.*
3. **Three definitions of flashcard mastery.** F1 and F2 count a card as learned at box ≥ 1 (seen correctly once). F5 gives half credit at box 1 and full at box ≥ 3. F9 calls box ≥ 3 "Mastered". The same card can be 100% learned on the level page and 50% in the competency matrix. *Severity: medium.*
4. **Readiness is implemented twice (F1, F2).** Same weights, two code paths over two data shapes. Any change has to be made twice, and drift is silent. *Severity: medium (maintenance).*
5. **Certification readiness is unweighted (F8).** PL-300's four domains are 25–30, 25–30, 25–30 and 15–20%. Averaging them equally overweights *Manage and secure* by about a third. The name "readiness" also implies an exam prediction, but the number is mostly self-ticked assignments. *Severity: medium.*
6. **Hints reduce competency (F4 → F5).** Each hint lowers the scenario score that feeds competency, and the copy says "it just takes 5% off". That teaches the learner that asking for help makes them worse at the skill. Hints measure independence, not outcome quality. *Severity: medium (behavioural).*
7. **No score says what kind of evidence it rests on.** The competency matrix lists counts, but a skill at 78% doesn't show whether that's verified answers or ticked boxes. Stage and certification percentages have no breakdown at all. *Severity: high for trust.*
8. **"Portfolio" overstates what is stored (F10).** It's a list of checkboxes the learner ticked. No artifact, reflection or file exists. *Severity: low (naming), but the name is a promise.*
9. **Scenario "score" mixes three things.** Self-rated quality, hint use and early reveal collapse into one percentage labelled "score", with no indication that it's self-assessed. *Severity: medium.*

## Target model (implemented in 2.2.0)

### One mastery function

`PBI.mastery(rec)`: box 0 or unseen = 0, box 1 = 0.25, box 2 = 0.5, box 3 = 0.75, box ≥ 4 = 1.0. "Mastered" means box ≥ 4, which is reached after four consecutive correct recalls spread over at least 11 days. Used by topic readiness, competency, certification practice and the flashcard labels.

### Three evidence types, always shown separately

| Type | Sources | Label in the UI |
|---|---|---|
| **Verified** | first answer to each multiple-choice question (`quizFirst`) | Verified |
| **Self-assessed** | assignment ticks, scenario deliverables, scenario rubric ratings | Self-assessed |
| **Recall** | flashcard boxes via `PBI.mastery` | Recall |

Multiple choice records the first answer in `quizFirst`. Later changes still update `quiz` (so the page shows the learner's current choice), but only the first answer counts as verified evidence. Progress saved before this change has no `quizFirst`; the current answer stands in for it, and the migration says so.

### Topic readiness (one implementation)

`PBI.readinessFrom({asg, done, mcq, ok, cards, mastery})` returns the composite (still 50/25/25, so pages don't jump) **and** the three parts. Both `PBI.readiness` and `P.readiness` adapt their data shape and call it.

### Scenario quality and independence

- **Quality** = weighted rubric self-rating (0–100%). This is the outcome, and the only scenario number that feeds competency and stages.
- **Independence** = 100% − 10 points per hint (max 40) − 30 points if the model answer was opened before finishing (floor 0). Shown beside quality, never multiplied into it.
- The UI shows *Technical outcome (self-assessed) 84% · Independence 70% · Hints used 2 · Solution revealed early: no*.

### Professional stage

- Skill readiness S = mean topic readiness for the stage.
- Experience E = mean quality of **completed** scenarios × completed ÷ total. Ten finished scenarios rated 0 give E = 0.
- Stage % = mean(S, E), shown with S, completion and quality beside it.
- A stage is **cleared** when S ≥ 70%, completion ≥ 70% of its scenarios (3 of 4, or 3 of 3), and average quality ≥ 65%. The current stage is the first one not cleared. The old rule (first stage under 60% composite) let completion alone carry a learner forward.

### Certification

- Each domain's published range is converted to its midpoint (25–30% → 27.5) and normalised across domains.
- **Curriculum coverage** = weighted share of mapped assignments ticked (self-assessed).
- **Practice readiness** = weighted mean of verified multiple-choice accuracy and recall mastery on mapped topics.
- The page doesn't show a single "certification readiness" number, and it says plainly that neither figure predicts an exam result.

### Competency matrix

Each skill shows the composite **and** three thin bars (verified, self-assessed, recall), each as earned ÷ possible within that type. Scenario evidence uses quality, not the hint-reduced score.

### Explanations

Every percentage on the progress page has an expandable "How this is calculated" that lists its inputs: counts, the evidence type and the formula in one sentence.

### Portfolio

Renamed **Portfolio evidence**, with the line "You ticked these deliverables as written. Nothing here was inspected." The schema reserves room for `{title, scenario, type, date, reflection}` per artifact, but adds no storage until there's a local-first design for files (IndexedDB is the likely route).

## Migration and compatibility

- `schemaVersion` 2 → 3. The migration adds `quizFirst` by copying `quiz` (documented as an approximation) and changes nothing else.
- Export payload `version` 3. Import accepts versions 1–3.
- No stored field is removed or renamed, so a learner who downgrades (rolls back the site) keeps everything.
- Displayed numbers change: stage percentages drop for learners who completed scenarios with low self-ratings, and topic readiness drops slightly where cards sit in box 1. That's intended, and the changelog says so.
