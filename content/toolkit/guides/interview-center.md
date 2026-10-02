---
{
  "id": "interview-center",
  "title": "Interview centre: weak answers vs senior answers",
  "summary": "What interviewers expect at each level, the six kinds of question you'll meet, and side-by-side weak and senior answers to the questions that separate candidates.",
  "door": "career",
  "kind": "career",
  "order": 4,
  "stages": ["analyst", "developer", "senior", "engineer", "architect"],
  "skills": ["dax", "modeling", "performance", "security", "communication", "architecture"],
  "tools": [],
  "problems": ["interview", "career"],
  "keywords": ["interview questions", "interview prep", "senior answer", "bidirectional filtering", "calculated column vs measure", "import vs directquery", "star schema", "rls", "slow report", "behavioural", "stakeholder", "scenario questions", "mock interview"],
  "lessons": ["b-dax", "i-model", "a-perf", "i-rls", "a-gov"],
  "scenarios": ["d08", "s04"],
  "verified": { "date": "2026-10-02", "review_after_days": 365 },
  "refs": []
}
---
## Use this with the flashcards

The [interview flashcards](flashcards.html) give you hundreds of questions with spaced repetition and a timed [mock interview](flashcards.html#mock). This page is about the difference between a correct answer and a **senior** answer: the same facts, plus trade-offs, failure modes and judgement.

## What each level is tested on

| Level | Expect | They're really asking |
|---|---|---|
| Analyst | Building a measure, cleaning data, choosing a visual | Can you produce a correct report? |
| BI Developer | Filter context, relationships, RLS, debugging a wrong number | Can we trust what you build? |
| Senior | Performance diagnosis, design trade-offs, incidents, reviewing others | Can you own a domain and handle it when it breaks? |
| BI Engineer | Deployment, automation, APIs, Git, service principals | Can you make this repeatable and safe? |
| Architect / Lead | Platform choices, governance, cost, migrations, people | Can you make decisions others will live with? |

## Six kinds of question

| Type | Example | A strong answer… |
|---|---|---|
| **Concept** | "What's context transition?" | Defines it, shows a one-line example, says when it bites |
| **Debugging** | "The total is wrong but the rows are right. Why?" | Lists likely causes in order and how to tell them apart |
| **Scenario** | "A manager can see another region's data. What do you do?" | Contains first, then diagnoses, then prevents |
| **Architecture** | "Import, DirectQuery or Direct Lake for 2 billion rows?" | Asks about constraints, compares options, recommends with conditions |
| **Behavioural** | "Tell me about a mistake you made." | A specific story (STAR), owns it, shows what changed after |
| **Stakeholder** | "Finance says your number is wrong." | Reconciles before arguing, separates definition from calculation |

## Weak vs senior answers

### Why would you avoid bi-directional filtering?

> **Weak:** "Because it's bad practice."

> **Senior:** "It makes filter propagation ambiguous: with several bidirectional paths, the engine may have to choose one, and results can change when someone adds a relationship. It makes every query do more work, so it's slower on large models. And it's harder to maintain and to secure, because filters can flow from a fact back into dimensions in ways nobody intended, including around RLS. Alternatives are `CROSSFILTER` in the one measure that needs it, or a bridge table pattern. I'd accept it for a genuine many-to-many through a small bridge table, documented in the relationship's description."

### Calculated column or measure?

> **Weak:** "Measures are better."

> **Senior:** "It depends on whether I need to slice by the value or aggregate it. If it's a property of a row I filter or group by, it's a column, ideally built in Power Query or SQL so it compresses well and doesn't use DAX at refresh. If it's a number that must respond to filters, it's a measure. Columns cost memory, measures cost query time; I check VertiPaq Analyzer when a column is high-cardinality."

### Import or DirectQuery?

> **Weak:** "Import is faster."

> **Senior:** "Import is the default because it's fastest and supports everything, as long as the data fits and hours-old data is acceptable. DirectQuery when data must be live or is too large, and only if the source can handle the query load; I'd add aggregation tables so most visuals don't hit the source. If the data is already in Fabric as Delta, Direct Lake gives near-Import speed without scheduled copies, but I'd check which Direct Lake variant, because only the SQL endpoint one falls back to DirectQuery."

### Why a star schema?

> **Weak:** "It's best practice."

> **Senior:** "Dimensions filter facts in one direction through one-to-many relationships, which is exactly what the engine is optimised for: simple filter propagation, good compression, simple DAX. It also gives business users an obvious model: things you slice by, and things you measure. Flat tables duplicate attributes and can't hold a second fact at a different grain; snowflakes add relationships and usually tempt people into bidirectional filters."

### The report is slow. What do you do?

> **Weak:** "Reduce the number of visuals."

> **Senior:** "First I find what's slow: Performance Analyzer tells me whether it's one visual's DAX or rendering across the page. If it's DAX, I take the query to DAX Studio, check Server Timings for formula-engine time, the number of storage-engine queries and callbacks, and fix the measure or the model. If it's the model, VertiPaq Analyzer shows high-cardinality columns. If it's only slow at 9 a.m., I look at the capacity. I'd record a baseline and the after, so I can prove the fix."

### How do you test RLS?

> **Weak:** "I use View as role."

> **Senior:** "View as for each role and representative user, but also as a real Viewer in the Service, because workspace Contributors and above aren't restricted. I test users in two roles (union), users in no role, all-access users, totals for restricted users, and tables not related to the security table, which RLS doesn't filter. The results go in a test matrix that's re-run every release, because RLS breaks silently when someone changes a relationship."

### Finance says your revenue number is wrong.

> **Weak:** "I'd check my DAX."

> **Senior:** "I'd first get their number and how it's calculated, then reconcile: is the difference timing (order date vs posting date), scope (returns, test orders, staff purchases), currency, or a real bug like duplicate rows? I'd quantify each part of the difference. If it's a definition question, the owner decides, not me; I'd present the options with the numbers and record the decision in the KPI dictionary."

### Tell me about a mistake you made.

> **Weak:** "I'm a perfectionist, so I don't really make mistakes."

> **Senior:** A specific story: "I deployed a measure change that excluded returns without telling Sales; their commission numbers moved overnight. I rolled it back the same morning, then re-released it with release notes and a side-by-side for one month. Since then every KPI change goes out with notes and an owner's sign-off."

## Practise out loud

Read a question, answer it aloud in under two minutes, then compare. The [mock interview](flashcards.html#mock) times you; Experience Mode's [Explain it twice](experience/d08-explain-it-twice.html) drill practises the same idea for a technical and a business audience.
