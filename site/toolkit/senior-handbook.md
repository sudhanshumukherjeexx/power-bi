# The senior developer handbook

Things worth knowing before you become senior: what to do before touching a model, changing a KPI, optimising, publishing, deploying or deleting, and how to behave during incidents, disagreements, code reviews and architecture decisions.

From the BI Developer Toolkit: https://sudhanshumukherjeexx.github.io/power-bi/toolkit/senior-handbook.html

## What senior means

Seniority isn't years or DAX tricks. It's judgement: knowing which questions to ask before acting, which risks matter, and when to say no. Every habit below exists because someone learned it the hard way.

## Before touching a model

- Who uses it? Check lineage and usage before you change anything others depend on.
- What's the grain of each fact? Write it down if nobody has.
- Is it in Git? If not, take a copy before your first change.
- Which numbers will move? If you can't say, you don't understand the change yet.

## Before changing a KPI

- Who owns the definition? Get their agreement in writing.
- Who will see a different number tomorrow? Tell them before, not after.
- Keep the old and new numbers side by side for at least one period, and explain the difference in one sentence.
- Update the [KPI dictionary](https://sudhanshumukherjeexx.github.io/power-bi/templates.html#tpl-kpi-dictionary).

## Before optimising

- Measure first. Know where the time goes.
- Ask whether it matters: a 50 ms measure on a page that takes 8 s isn't the problem.
- Change one thing at a time, and keep the before and after.

## Before publishing

- Reconcile at least one number with the source, and say how in the release notes.
- Look at it as the least technical person who will use it.
- Check what happens with no data, one value, and all values selected.

## Before deploying

- Has someone else reviewed it?
- Do you know how to roll back, and have you tried?
- Is anyone presenting from this report today? Don't deploy an hour before the board meeting.

## Before deleting

- Check lineage, usage and subscriptions; announce; archive; then delete.
- "Nobody uses it" is a hypothesis. Quarter-end reports look unused for 11 weeks.

## During an incident

- Mitigate first, diagnose second.
- One person leads; everyone else feeds them information.
- Communicate early and on a schedule, even when the update is "still investigating".
- Never guess the cause in public. "We're investigating" beats a wrong answer you have to retract.
- Afterwards: a blameless [postmortem](https://sudhanshumukherjeexx.github.io/power-bi/templates.html#tpl-postmortem) that asks why it wasn't caught, not who did it.

## During stakeholder disagreement

- Get the disagreement into numbers: "Finance's figure is $1.2M, ours is $1.35M, the difference is returns and test orders."
- Separate the definition (a business decision) from the calculation (your job).
- Escalate to the definition owner, with options, not complaints.
- Write the decision down. Practise in [Finance disputes the dashboard](https://sudhanshumukherjeexx.github.io/power-bi/experience/s02-finance-disputes-revenue.html).

## During code review

- Review the change, not the person. Ask questions rather than give orders: "What happens at the total here?"
- Block on correctness, security and production risk; suggest on style.
- Approve quickly when it's good. Slow reviews teach people to make big, risky PRs.
- When you're reviewed, thank people for findings. Every bug they catch is one users don't see.

## During architecture decisions

- Write the options down, including "do nothing".
- Weigh them against the constraints you actually have (skills, budget, timeline), not the ones you'd like.
- Decide, record it in an [ADR](https://sudhanshumukherjeexx.github.io/power-bi/templates.html#tpl-adr) with the trigger to revisit, and move on. A good decision on time beats a perfect one too late.
- Be explicit about what you're trading away.

## The habits that compound

- Leave every model a little better documented than you found it.
- Automate the second time you do something manually, not the tenth.
- Teach: the fastest way to become senior is to make others better.
