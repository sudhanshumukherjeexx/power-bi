# Power BI error decoder

Common Power BI, Power Query, DAX, gateway, refresh, deployment, Fabric, REST API and capacity errors: what each means, the usual causes, how to diagnose and how to fix.

From the BI Developer Toolkit: https://sudhanshumukherjeexx.github.io/power-bi/toolkit/error-decoder.html

## How to use the decoder

Error text varies a little between Desktop, the Service and versions, so each entry gives the **key phrase** to search for rather than a claim about the exact wording. Every entry follows the same shape: what it means, common causes, how to diagnose, how to fix, and where to practise.

> **Tip:** Copy the full error, including the activity ID and request ID from the Service's error details. Support and your platform team need them; screenshots of half a message don't help anyone.

## Power Query

### "The column 'X' of the table wasn't found"

- **Means:** a step refers to a column the previous step no longer has.
- **Common causes:** the source renamed or dropped a column; a header row changed; promoted headers picked up a different row.
- **Diagnose:** click through the Applied Steps until the error appears; compare `Table.ColumnNames` of the source with what the step expects.
- **Fix:** select and rename columns with `MissingField.UseNull` or `MissingField.Ignore`; agree the schema with the source owner. See [schema drift](https://sudhanshumukherjeexx.github.io/power-bi/toolkit/power-query-field-guide.html#schema-drift).
- **Practise:** [Sprint 08 refresh outage](https://sudhanshumukherjeexx.github.io/power-bi/experience/s08-cfo-refresh-outage.html).

### "DataFormat.Error: We couldn't convert to Number" (or Date)

- **Means:** a type change hit a value that isn't a number or date in the expected format.
- **Common causes:** currency symbols, thousands separators, "N/A", dates in another locale, a total row at the bottom of an export.
- **Diagnose:** View → Column quality and Column distribution; `Table.SelectRowsWithErrors`.
- **Fix:** clean before typing (remove symbols, replace "N/A" with null), set the culture on the type change, remove junk rows on purpose. See [errors](https://sudhanshumukherjeexx.github.io/power-bi/toolkit/power-query-field-guide.html#errors).
- **Practise:** [Beginner Power Query](https://sudhanshumukherjeexx.github.io/power-bi/beginner.html#b-pq) with `RawOrdersExport`.

### "Expression.Error: The key didn't match any rows in the table"

- **Means:** a navigation step (`Source{[Name="Sheet1"]}[Data]`, a database table by name) found nothing.
- **Common causes:** a renamed sheet, table or database object; a different file with a different structure.
- **Fix:** navigate by a stable property, add a check that fails with a clear message, or agree naming with the file's owner.

### "Formula.Firewall: Query … references other queries or steps, so it may not directly access a data source"

- **Means:** the privacy firewall stopped data from one source being combined with another in a way that could leak it.
- **Common causes:** using a value from one source (a parameter table in Excel) to build a query against another (a SQL server); privacy levels not set.
- **Fix:** set privacy levels for each source; restructure so each query reads one source and a separate query combines them. See [combining sources safely](https://sudhanshumukherjeexx.github.io/power-bi/toolkit/power-query-field-guide.html#combining-sources-safely).

### "This dataset includes a dynamic data source" (the Service won't refresh)

- **Means:** the Service can't determine the data source before running the query, so it can't check credentials and won't schedule refresh.
- **Common causes:** a URL or connection string built by concatenating values from data.
- **Fix:** keep the base URL static in `Web.Contents` and pass the variable parts through `RelativePath` and `Query`. See [APIs and Web.Contents](https://sudhanshumukherjeexx.github.io/power-bi/toolkit/power-query-field-guide.html#apis-and-web-contents).

### "DataSource.Error: Web.Contents failed to get contents from … (4xx/5xx)"

- **Means:** the HTTP call failed. The status code says why: 401/403 credentials or permissions, 404 wrong path, 429 rate limited, 5xx the API is unhealthy.
- **Fix:** check the credential type on the data source, the path, and the API's paging and rate limits; add a retry policy upstream if the API is flaky. See [pagination](https://sudhanshumukherjeexx.github.io/power-bi/toolkit/power-query-field-guide.html#pagination).

## DAX and modeling

### "A table of multiple values was supplied where a single value was expected"

- **Means:** an expression that needs one value got a column with several (for example `VALUES` or a column reference in a measure).
- **Fix:** use `SELECTEDVALUE ( column, fallback )`, an aggregation (`MAX`, `SUM`), or iterate with `SUMX`/`MAXX`. Decide what the result should be when several values are visible.

### "A circular dependency was detected"

- **Means:** two objects depend on each other: a calculated column that refers to a measure that uses that column, or calculated columns on both sides of a relationship that reference each other.
- **Fix:** move the logic upstream, or rewrite so one of the two doesn't depend on the other (`ALLEXCEPT` and `RELATED` in calculated columns are frequent culprits).

### "The value for 'Column' cannot be determined… no current row"

- **Means:** a measure referenced a column directly, as if there were a current row. Measures have no row context.
- **Fix:** aggregate it (`SUM ( FactSales[Quantity] )`) or iterate (`SUMX ( FactSales, … )`). See [measures vs calculated columns](https://sudhanshumukherjeexx.github.io/power-bi/toolkit/dax-field-manual.html#measures-vs-calculated-columns).

### "You can't create a relationship between these two columns because one of the columns must have unique values"

- **Means:** neither side is unique, so a one-to-many relationship isn't possible.
- **Common causes:** duplicate keys in the dimension, blank keys, or two facts at different grains being related directly.
- **Fix:** fix the dimension's duplicates; relate facts through a shared dimension; resist many-to-many as a way to make the error go away. See [relationship not filtering](https://sudhanshumukherjeexx.github.io/power-bi/toolkit/dax-debugging.html#relationship-not-filtering).

### "Function 'CALCULATE' has been used in a True/False expression that is used as a table filter expression"

- **Means:** a boolean filter argument contains a measure or `CALCULATE`, which simple filter predicates don't allow.
- **Fix:** compute the value in a variable first, or use `FILTER ( ALL ( column ), condition )`.

### "Visual has exceeded the available resources"

- **Means:** the query for one visual used more memory or time than the capacity allows.
- **Common causes:** a table visual with high-cardinality columns and no filter; a measure that materialises huge intermediate tables; many-to-many or bi-directional filters exploding row counts.
- **Fix:** filter the visual, reduce columns, rewrite the measure (DAX Studio's Server Timings will show the materialisation). See [Performance Clinic](https://sudhanshumukherjeexx.github.io/power-bi/toolkit/performance-clinic.html#dax-performance).

### "The resultset of a query to external data source has exceeded the maximum allowed size of '1000000' rows"

- **Means:** a DirectQuery visual asked the source for more than a million rows of intermediate results.
- **Fix:** aggregate at the source, add filters, use aggregation tables, or switch the table to Import. See the [DirectQuery](https://sudhanshumukherjeexx.github.io/power-bi/toolkit/performance-clinic.html#directquery) section of the clinic.

## Refresh

### "Scheduled refresh has been disabled"

- **Means:** the Service turned off the schedule. It does this after repeated consecutive failures, and pauses schedules on models nobody has visited for a long time.
- **Fix:** fix the underlying failure first (refresh history has the error), then re-enable the schedule; set up failure notifications to a group, not one person.
- **Practise:** [Sprint 08](https://sudhanshumukherjeexx.github.io/power-bi/experience/s08-cfo-refresh-outage.html).

### "Resource Governing: This operation was canceled because there wasn't enough memory"

- **Means:** the refresh needed more memory than the capacity allows. Refresh can need roughly double the model's size while the new copy is built.
- **Fix:** remove unused columns and high-cardinality text, use incremental refresh, refresh tables or partitions separately (XMLA), or move to a larger capacity. See [model performance](https://sudhanshumukherjeexx.github.io/power-bi/toolkit/performance-clinic.html#model-performance).

### Refresh timed out

- **Means:** the refresh ran longer than the limit (shorter on shared capacity than on Premium or Fabric capacity).
- **Fix:** make queries fold, filter early, use incremental refresh, push heavy transformation upstream.

## Gateway and credentials

### "The credentials provided for the … source are invalid"

- **Means:** the stored credential no longer works: a password changed, an account was disabled, an OAuth token expired.
- **Fix:** update the credential on the semantic model's settings or the gateway connection; switch to a service account or service principal with a documented owner. See the [production runbook](https://sudhanshumukherjeexx.github.io/power-bi/toolkit/production-runbook.html#credentials-expired).

### Gateway offline or unreachable

- **Means:** the Service can't reach the on-premises data gateway.
- **Common causes:** the gateway machine is off, asleep or patched and not restarted; the service account's password changed; outbound network rules changed; the gateway version is too old.
- **Fix:** check the gateway's status in **Manage connections and gateways**, restart the gateway service, check outbound connectivity, keep gateways in a cluster of at least two members. See [gateway offline](https://sudhanshumukherjeexx.github.io/power-bi/toolkit/production-runbook.html#gateway-offline).

### "A network-related or instance-specific error occurred while establishing a connection to SQL Server"

- **Means:** the gateway (or Desktop) can't reach the database server.
- **Fix:** test from the gateway machine itself (not your laptop): server name, port, firewall, DNS, and whether the gateway service account can authenticate.

## Security and access

### A user gets "You don't have access" or sees an empty report

- **Means:** missing permission on the workspace, app, report or underlying semantic model (Build permission for a report in another workspace), or RLS returns no rows for them.
- **Diagnose:** check access in this order: app audience → workspace role → item sharing → semantic model permissions → RLS role membership. **Test as role** shows what RLS lets them see.
- **Fix:** see the [security field guide](https://sudhanshumukherjeexx.github.io/power-bi/toolkit/security-field-guide.html#why-can-this-user-see-this-row).

### RLS seems to do nothing

- **Means:** usually not an error at all: RLS doesn't restrict workspace Admins, Members or Contributors, only users with Viewer access (or app and share access).
- **Fix:** test with a Viewer account or **View as**; never judge RLS from a developer's account. See [RLS testing checklist](https://sudhanshumukherjeexx.github.io/power-bi/toolkit/security-field-guide.html#rls-testing-checklist).

## Deployment

### Report in Production shows Test data, or the wrong numbers after deployment

- **Means:** parameters or data source rules weren't applied to the target stage, or a report still points at the Test semantic model.
- **Fix:** set deployment rules (parameter and data source rules) for each stage, and add a post-deployment check that queries one known number. [Sprint 07](https://sudhanshumukherjeexx.github.io/power-bi/experience/s07-test-prod-deployment-failure.html) is this incident.

### PBIP or Git merge conflicts in TMDL or report JSON

- **Means:** two people changed the same object.
- **Fix:** resolve in the text files (TMDL is designed for it), reopen in Desktop to validate, and agree smaller, more frequent merges. [Sprint 06](https://sudhanshumukherjeexx.github.io/power-bi/experience/s06-pbip-merge-conflict.html) walks through one.

## Fabric and REST API

### 401 Unauthorized / 403 Forbidden from the Power BI or Fabric REST API

- **Means:** the token is invalid or for the wrong resource (401), or the identity isn't allowed (403).
- **Common causes:** wrong scope (`https://analysis.windows.net/powerbi/api/.default` for Power BI APIs); the tenant setting that lets service principals call the APIs is off or doesn't include the principal's security group; the service principal isn't a member of the workspace.
- **Fix:** check the tenant settings under the admin portal's developer settings and the workspace access list. See [automate Power BI](https://sudhanshumukherjeexx.github.io/power-bi/toolkit/automate-power-bi.html#authentication).

### 429 Too Many Requests

- **Means:** you hit an API rate limit.
- **Fix:** honour the `Retry-After` header, back off exponentially, batch requests, and use the admin scanner APIs for tenant-wide inventory instead of calling per item.

### Capacity throttling: interactive requests delayed or rejected

- **Means:** the capacity used more compute than it has over the smoothing window, so Fabric delays and then rejects work.
- **Diagnose:** the [Fabric Capacity Metrics app](https://learn.microsoft.com/en-us/fabric/enterprise/metrics-app): find the items and operations using the most CU, and when.
- **Fix:** see [capacity overloaded](https://sudhanshumukherjeexx.github.io/power-bi/toolkit/production-runbook.html#capacity-overloaded).

### Direct Lake model errors instead of falling back

- **Means:** a Direct Lake on OneLake model can't answer a query in Direct Lake (for example a guardrail is exceeded) and, by design, doesn't fall back to DirectQuery.
- **Fix:** check the table sizes against the capacity's guardrails, reduce row groups and columns, or reconsider the mode. See [Fabric architecture](https://sudhanshumukherjeexx.github.io/power-bi/toolkit/fabric-architecture.html#semantic-layer).
