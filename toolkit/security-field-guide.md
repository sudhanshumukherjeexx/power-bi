# BI security field guide

Workspace roles, Build and app permissions, sharing, static and dynamic RLS, OLS, sensitivity labels, tenant settings, export controls, service principals, guest users and least privilege, with an RLS testing checklist and a 'why can this user see this row?' guide.

From the BI Developer Toolkit: https://sudhanshumukherjeexx.github.io/power-bi/toolkit/security-field-guide.html

## The warning everyone learns the hard way

> **Warning:** RLS restricts data only for users with **Viewer** access to the workspace, or who get the content through an app or sharing. Workspace **Admins, Members and Contributors** can edit the semantic model, so RLS doesn't restrict them. Never test RLS from a developer's account, and never give people who must be restricted a Contributor role "so they can see the report".

## The layers of access

| Layer | Controls | Typical use |
|---|---|---|
| Tenant settings | What anyone in the organisation can do: export, publish to web, share externally, service principals, Copilot | Set by Fabric admins; least privilege by default |
| Workspace roles | Admin, Member, Contributor, Viewer on everything in a workspace | Developers get Contributor/Member; consumers ideally get nothing here and use an app |
| App permissions | Who sees which content in an app (audiences) | The normal way to distribute to consumers |
| Item sharing | Direct access to one report or model | Exceptions, not the norm |
| Build permission | Create new reports on a semantic model, analyse in Excel | Self-service authors on a certified model |
| RLS | Which rows a user sees | Region managers see their region |
| OLS | Which tables and columns a user sees at all | Hide salary columns from most roles |
| Sensitivity labels | Classification that travels with the content and exports | Confidential data stays labelled in Excel and PDF |
| Export controls | Whether data can leave Power BI (Excel, CSV, PDF, PowerPoint) | Restrict for sensitive models |

## Static and dynamic RLS

**Static:** one role per audience with a fixed filter, such as `[RegionName] = "West"`. Simple, but a new region means a new role.

**Dynamic:** one role whose filter looks up the signed-in user in a mapping table:

```dax
-- role filter on UserRegionMapping (related to DimRegion, which filters the facts)
[UserEmail] = USERPRINCIPALNAME ()
```

With a mapping table like the course's `UserRegionMapping`, a user with two rows sees two regions, and a user with an "ALL" access level needs a rule that returns true for every region. Build and test this in [Row-level security](https://sudhanshumukherjeexx.github.io/power-bi/intermediate.html#i-rls).

Things to know:

- `USERPRINCIPALNAME()` returns the UPN, which is not always the email address (guests and some organisations differ). Map what it actually returns.
- Roles are additive: a user in two roles sees the union.
- Filters propagate through relationships from the security table; check the direction reaches the facts.
- Members are assigned to roles in the Service (per semantic model), ideally as security groups, not individuals.

## Object-level security

OLS hides tables or columns from a role entirely: they don't appear in the field list and queries that reference them fail. Define it in Tabular Editor (or TMDL) on roles. Use it for columns like salary or national ID that most people must not know exist, and combine with RLS for rows.

## Sensitivity labels, tenant settings and exports

- **Labels** (from Microsoft Purview) classify content as, for example, Confidential; labels can be inherited downstream and travel with exports to Office files and PDF.
- **Tenant settings** decide whether export, publish to web, external sharing, service principals and other features are allowed, and for which security groups. Changes affect everyone: treat them like production changes.
- **Export controls:** decide per model whether summarised or underlying data can be exported; underlying-data export from a model with RLS still respects RLS, but data in Excel can then go anywhere.

Practise: [Sensitivity labels, OLS, export controls and tenant settings](https://sudhanshumukherjeexx.github.io/power-bi/governance.html#gov-protect).

## Service principals and guest users

- **Service principals** (app identities) are for automation. Allow only a security group of them in tenant settings, give each one workspace access only where it deploys or refreshes, store secrets in a vault and rotate them.
- **Guest users** (Microsoft Entra B2B) can be given access to content; check that tenant settings allow it, that RLS works with their UPN, and that labels and export settings suit external viewers.

## Least privilege

Default to the smallest access that lets someone do their job: Viewer through an app rather than a workspace role, Build only for authors, Contributor only for developers, Admin for two people per workspace. Review access quarterly; remove leavers through group membership, not by hunting individual shares.

## Why can this user see this row?

Work through these in order, for the specific user:

1. **Which access path?** App, workspace role, direct share or Build permission. If they have Admin, Member or Contributor on the workspace, RLS doesn't apply: that's your answer.
2. **Which roles are they in?** Including through groups. Two roles = union of both.
3. **What does `USERPRINCIPALNAME()` return for them?** Show it in a card under **View as**.
4. **What does the mapping table say for that value?** Duplicates, an "ALL" row, a stale entry after they moved team?
5. **Does the role's filter reach the table being shown?** Relationship direction, inactive relationships, or a table unrelated to the security table (which RLS therefore doesn't filter).
6. **Is the visual using a different model?** A report built on a copy of the model without the roles.

## RLS testing checklist

- [ ] Every role tested with **View as** for at least one representative user
- [ ] Tested as a real Viewer account in the Service, not as a workspace member
- [ ] A user in two roles sees exactly the union
- [ ] A user in no role sees nothing (or is denied)
- [ ] "ALL" access users see everything they should and nothing beyond it
- [ ] Totals and grand totals are correct for restricted users (no leakage through unrestricted tables)
- [ ] Tables not related to the security table are checked: do they leak?
- [ ] OLS-hidden columns can't be queried through Analyze in Excel or a new report
- [ ] Results recorded in the [RLS test matrix](https://sudhanshumukherjeexx.github.io/power-bi/templates.html#tpl-rls-test-matrix) and repeated every release

## Security matrix template

Keep one row per role and representative user: what they must see, what they must not see, the access path, and the last test result. That's the [RLS / OLS test matrix](https://sudhanshumukherjeexx.github.io/power-bi/templates.html#tpl-rls-test-matrix).

## Security architecture patterns

| Pattern | When |
|---|---|
| One certified model with dynamic RLS, consumed through apps | Most organisations; one model, many audiences |
| RLS + OLS on one model | Most users see some rows; few see sensitive columns |
| Separate models per legal entity or data residency | Legal or contractual separation that RLS can't prove |
| Aggregated public model + detailed restricted model | Broad audiences see summaries; a few see detail |

## Incident scenarios

A manager sees other regions' payroll: what do you do in the first hour? [Sprint 03](https://sudhanshumukherjeexx.github.io/power-bi/experience/s03-payroll-security-incident.html) is that incident, end to end. The short version: contain access first, confirm the scope from audit logs, fix and test, then write the [incident report](https://sudhanshumukherjeexx.github.io/power-bi/templates.html#tpl-incident-report) and tell the data owner.
