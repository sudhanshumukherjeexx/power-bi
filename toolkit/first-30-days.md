# Your first 30 days as a BI developer

A week-by-week plan for a new BI job: understand the environment, then the models and their owners, ship small changes, and own something by the end of the month, with the questions to ask.

From the BI Developer Toolkit: https://sudhanshumukherjeexx.github.io/power-bi/toolkit/first-30-days.html

## The goal

In 30 days nobody expects you to fix the platform. They expect you to understand it, earn trust with small correct changes, and take ownership of one thing. Write down what you learn as you go: your notes become the onboarding guide the next person wishes existed.

## Days 1–5: understand the environment

- Get access: workspaces (as a Contributor in Dev, Viewer elsewhere), Git repositories, source databases (read-only), the ticket system, the team channel.
- Find the map: which workspaces exist, which semantic models are certified, which reports executives open every Monday.
- Sit with users of the most important report and watch how they actually use it.
- Read the last three incidents and their postmortems, if they exist.
- Ship nothing yet. Ask a lot.

## Week 2: understand the models and their owners

- Open the main models in Desktop (or from Git): grain of each fact, relationships, RLS roles, the measures everyone uses.
- Find who owns each key definition (Revenue, Customer, Headcount). If nobody does, note it: that's a finding, not your job to fix this week.
- Trace one number from a report back to the source system.
- Learn the deployment path: how does a change get from someone's laptop to Production?

## Week 3: ship small changes

- Take two or three small tickets: a new measure, a fix to a visual, a description added.
- Follow the team's process exactly (branch, PR, review, deployment), even if you'd do it differently. Earn the right to change the process.
- Reconcile every number you touch and say so in the PR.

## Week 4: own something

- Volunteer to own one thing: a model's documentation, the refresh monitoring, a report's next release.
- Write one useful document: a runbook for a failure you saw, an ownership matrix, or the onboarding notes you've been keeping.
- Book a short review with your manager: what you've learned, what surprised you, what you'd like to own next.

## Questions to ask

| Ask | Why it matters |
|---|---|
| Where do the data sources live, and who owns each? | You'll need them for every "the number is wrong" question |
| Who owns the definition of Revenue (and the other key metrics)? | Disagreements end with the owner, not with you |
| How is production deployed? Is there Git, a pipeline, a checklist? | So you don't break it in week two |
| How are incidents handled, and who is on call? | So you know what to do when it breaks at 7 a.m. |
| Who approves RLS changes and access requests? | Security changes need the right approver |
| Which workspaces are production? Which are sandboxes? | So you don't edit Production by accident |
| Where is the gateway, and who administers it? | Refresh failures often end there |
| Which models are certified, and what's the bar? | Build on them instead of creating another copy |
| What's the one report that must never be wrong? | Prioritise your understanding accordingly |

## Avoid

- Rebuilding something in week one because "it's badly designed". It may be badly designed for reasons you don't know yet.
- Making changes directly in Production, however small.
- Saying yes to every request: write it down, ask about priority, and confirm with your manager.
