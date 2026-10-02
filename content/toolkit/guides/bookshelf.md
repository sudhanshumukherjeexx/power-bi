---
{
  "id": "bookshelf",
  "title": "The bookshelf",
  "summary": "Six books worth owning, not forty: dimensional modeling, DAX mastery, DAX performance, DAX patterns, data visualisation and T-SQL, each tagged by stage.",
  "door": "career",
  "kind": "library",
  "order": 6,
  "stages": ["analyst", "developer", "senior", "engineer", "architect"],
  "skills": ["dax", "modeling", "warehousing", "visuals", "sql", "performance"],
  "tools": [],
  "problems": ["career"],
  "keywords": ["books", "reading list", "definitive guide to dax", "optimizing dax", "dax patterns", "kimball", "data warehouse toolkit", "storytelling with data", "t-sql fundamentals"],
  "verified": { "date": "2026-10-02", "review_after_days": 365 },
  "refs": [
    { "t": "SQLBI books", "u": "https://www.sqlbi.com/books/", "src": "book", "paid": true },
    { "t": "DAX Patterns (online, free to read)", "u": "https://www.daxpatterns.com/", "src": "specialist" },
    { "t": "Kimball Group", "u": "https://www.kimballgroup.com/", "src": "specialist" },
    { "t": "Storytelling with Data", "u": "https://www.storytellingwithdata.com/", "src": "book", "paid": true }
  ]
}
---
## Why so few

Every book here earns its place by being the reference for its subject. Read one properly rather than skimming ten.

| Area | Book | Why | Stage |
|---|---|---|---|
| Dimensional modeling | *The Data Warehouse Toolkit*, Ralph Kimball and Margy Ross | The source of facts, dimensions, grain and slowly changing dimensions. Everything in Power BI modeling builds on it | Developer → Architect |
| DAX mastery | *The Definitive Guide to DAX*, Third Edition, Marco Russo and Alberto Ferrari | How DAX really works: contexts, context transition, table functions. The book you'll reread | Developer → Senior |
| DAX performance | *Optimizing DAX*, Second Edition, Marco Russo and Alberto Ferrari | The storage engine, formula engine, query plans and how to make measures fast | Senior → Engineer |
| DAX problems | *DAX Patterns*, Second Edition, Marco Russo and Alberto Ferrari | Ready-made solutions to business problems; also free to read at [daxpatterns.com](https://www.daxpatterns.com/) | Developer → Senior |
| Data visualisation | *Storytelling with Data*, Cole Nussbaumer Knaflic | Choosing visuals, removing clutter, focusing attention: report design that works | Analyst → Senior |
| SQL | *T-SQL Fundamentals*, Itzik Ben-Gan | Thinking in sets, window functions and query logic, from the authority on T-SQL | Analyst → Engineer |

Editions are as listed by the publishers in October 2026; check [SQLBI's book list](https://www.sqlbi.com/books/) for the current DAX editions.

## Reading order

- **Starting out:** *Storytelling with Data*, then the first half of *The Definitive Guide to DAX* alongside the Beginner and Intermediate levels.
- **Becoming senior:** *The Data Warehouse Toolkit* (the first chapters cover most of what you need), the rest of *The Definitive Guide to DAX*, then *Optimizing DAX*.
- **Engineering and architecture:** *T-SQL Fundamentals* if SQL isn't already second nature, and the Kimball design tips for edge cases.

## Free alternatives

If a book isn't in your budget: [DAX Patterns](https://www.daxpatterns.com/) online, [DAX Guide](https://dax.guide/), Microsoft's [star schema guidance](https://learn.microsoft.com/en-us/power-bi/guidance/star-schema), and the [trusted sources](toolkit/trusted-sources.html) page cover much of the same ground.
