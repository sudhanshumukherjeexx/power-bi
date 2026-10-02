# Power BI production runbook

What to do, in order, when production breaks: refresh failures, offline gateways, expired credentials, slow models, stale apps, access problems, wrong RLS, changed sources, overloaded capacity and rollbacks.

From the BI Developer Toolkit: https://sudhanshumukherjeexx.github.io/power-bi/toolkit/production-runbook.html

## During any incident

1. **Assess impact in one sentence:** who can't do what, since when, and is any number they can see wrong? Wrong numbers that people act on are worse than an outage.
2. **Set the severity** (example scale: Sev 1 = executives or customers see wrong data or a critical report is down; Sev 2 = a team is blocked; Sev 3 = degraded, with a workaround).
3. **Communicate early:** a short status update to affected users before you know the cause ("We know the Sales report hasn't refreshed since 06:00. Next update at 09:30.").
4. **Mitigate before you fix:** roll back, show the last good data with a banner, or hide the broken page.
5. **Keep a timeline** as you go; it becomes the [incident report](https://sudhanshumukherjeexx.github.io/power-bi/templates.html#tpl-incident-report) and the [postmortem](https://sudhanshumukherjeexx.github.io/power-bi/templates.html#tpl-postmortem).

[Sprint 08](https://sudhanshumukherjeexx.github.io/power-bi/experience/s08-cfo-refresh-outage.html) is a complete incident to practise on.

## Refresh failed

1. Open the semantic model's **refresh history** and read the full error (expand details; copy the activity and request IDs).
2. Classify it with the [error decoder](https://sudhanshumukherjeexx.github.io/power-bi/toolkit/error-decoder.html#refresh): credentials, gateway, source schema, memory, timeout or dynamic source.
3. If users need data now and the previous refresh was good, tell them the data is as of the last success; don't let them assume it's current.
4. Fix and run an on-demand refresh; watch it complete.
5. If the schedule was disabled after repeated failures, re-enable it.
6. Make sure failure notifications go to a monitored group or channel, and consider automated checks ([refresh automation](https://sudhanshumukherjeexx.github.io/power-bi/automation.html#api-refresh)).

## Gateway offline

1. In **Manage connections and gateways**, check the cluster's status and which members are offline.
2. On the gateway machine: is it running, is the gateway service started, did Windows update restart it, did the service account password change?
3. Run the gateway's network diagnostics; check for new firewall or proxy rules.
4. Restart the gateway service; if other cluster members are healthy, traffic moves to them.
5. Prevent it: at least two members per cluster, patching one at a time, gateway updates on a schedule, CPU and memory monitoring. Size for concurrency, refresh volume, DirectQuery and RLS load ([sizing guidance](https://learn.microsoft.com/en-us/power-bi/guidance/gateway-onprem-sizing)).

## Credentials expired

1. The error names the data source. Find which models and connections use it (lineage view, or the scanner API inventory).
2. Update the credentials on the connection (gateway connection or cloud connection), then refresh.
3. Prevent it: no personal accounts for production sources; service accounts or service principals with an owner, a documented expiry, and a calendar reminder before it expires.

## Semantic model slow

1. Is it slow for everyone or for some users? Some users only: RLS rules making queries heavier, or their region's data volume.
2. Is it slow at specific times? Check the capacity first (below).
3. Reproduce with Performance Analyzer and DAX Studio, then follow the [Performance Clinic](https://sudhanshumukherjeexx.github.io/power-bi/toolkit/performance-clinic.html).
4. If a recent deployment caused it, roll back while you investigate.

## App content stale

The report in the workspace is right but users see the old version in the app:

1. Publishing to the workspace doesn't update the app: **Update app** is a separate step.
2. Check the app's audiences include the content and the people.
3. If the report is right but the numbers are old, it's a refresh problem, not an app problem.
4. Add "update the app" to the [deployment checklist](https://sudhanshumukherjeexx.github.io/power-bi/templates.html#tpl-deployment-checklist).

## User can't see the report

Check, in order, and stop at the first gap:

| Layer | Question |
|---|---|
| Licence | Does the user have Pro or PPU, or is the content on F64+ or P capacity for free viewers? |
| App | Is the user (or a group they're in) in the app audience that includes this report? |
| Workspace | Do they have a workspace role, if that's how access is given? |
| Item | Was the report shared directly, and with what permissions? |
| Semantic model | Does a report in another workspace need Build permission on the model? |
| RLS | Is the user in a role, and does the role return rows for them? |
| Sensitivity and policies | Does a label or conditional access policy block them? |

See [why can this user see this row](https://sudhanshumukherjeexx.github.io/power-bi/toolkit/security-field-guide.html#why-can-this-user-see-this-row) for the RLS half.

## RLS incorrect

1. Treat users seeing data they shouldn't as a **security incident** (Sev 1): restrict access first (remove the user from the role or the app, or unpublish the page), then investigate.
2. Reproduce with **Test as role** / **View as** for the specific user.
3. Check role membership, overlapping roles (union of permissions), the mapping table's contents, and relationship direction from the security table.
4. Add the case to the [RLS test matrix](https://sudhanshumukherjeexx.github.io/power-bi/templates.html#tpl-rls-test-matrix) so it's tested every release. [Sprint 03](https://sudhanshumukherjeexx.github.io/power-bi/experience/s03-payroll-security-incident.html) is this incident.

## Data source changed

1. The error is usually "column not found" or a type conversion failure; occasionally the refresh succeeds but numbers change because a column's meaning changed.
2. Compare the source schema with what the model expects; ask the source owner what changed and why.
3. Fix the query defensively ([schema drift](https://sudhanshumukherjeexx.github.io/power-bi/toolkit/power-query-field-guide.html#schema-drift)), refresh, and reconcile one number with the source.
4. Agree a [data contract](https://sudhanshumukherjeexx.github.io/power-bi/templates.html#tpl-data-contract) with notice periods for future changes.

## Capacity overloaded

1. Open the Capacity Metrics app: is the capacity throttling (interactive delays or rejections), and since when?
2. Find the top consumers by CU: one refresh, a notebook, a runaway report, a DirectQuery model hammered at 9:00?
3. Short term: move or reschedule the heaviest background jobs, pause non-critical items, or temporarily scale the capacity if your organisation allows it.
4. Long term: optimise the top consumers, separate workloads onto different capacities (for example production reports vs data engineering), and set alerts before throttling starts.
5. Escalate with numbers: "Item X used Y% of the capacity between 08:00 and 10:00 on three days this week" gets action; "Power BI is slow" doesn't.

## Need rollback

1. Decide quickly: is the new release causing wrong data or an outage, and is there no small, safe fix? Then roll back.
2. Redeploy the previous release (previous Git tag through the pipeline, or redeploy from the previous stage in deployment pipelines).
3. Refresh if the rollback changes the model's structure; check one known number.
4. Tell users what happened and that the previous version is back.
5. Follow up with a fix through the normal path and a postmortem. Practise the call in the [hotfix or rollback drill](https://sudhanshumukherjeexx.github.io/power-bi/experience/d04-hotfix-or-rollback.html).
