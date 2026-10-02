# Deployment checklist

**Use it** every time content is promoted between environments (Dev → Test → Prod). **Readers:** whoever deploys, and the person on call afterwards.

## Before deploying

- [ ] The change was reviewed (pull request approved) and tested in Test.
- [ ] Every environment-specific parameter (server, database, URL, folder) has a rule or variable for the target stage.
- [ ] Data source connections in the target use service principals or service accounts, not personal credentials.
- [ ] No parameter value in the target contains "dev" or "test".
- [ ] Schema changes in sources are deployed first, and backward compatible.
- [ ] Rollback plan written (which version to redeploy, which source changes to revert).

## After deploying

- [ ] Refresh succeeded **without warnings**.
- [ ] Row counts and max dates match the source for the main fact tables.
- [ ] Three headline measures match Test for the same period (when both point at the same data).
- [ ] RLS matrix re-run if roles or relationships changed.
- [ ] Performance budget checked for changed pages.
- [ ] Release notes sent; stakeholders told.

## What good looks like

- [ ] Most checks are automated (REST API, XMLA queries, DAX query tests) and fail loudly.
- [ ] A deployment that skips the checklist is treated as an incident.
