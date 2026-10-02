# Power Query field guide

The M you actually write at work, organised by job: tables, lists, joins, errors, functions, dates, folders, APIs, folding and performance, plus a troubleshooting matrix.

From the BI Developer Toolkit: https://sudhanshumukherjeexx.github.io/power-bi/toolkit/power-query-field-guide.html

## Troubleshooting matrix

Start here when something is wrong; the sections below explain each fix.

| Symptom | Likely cause | Start here |
|---|---|---|
| Refresh suddenly got slow | A step stopped folding, so every row now comes to the mashup engine | [Query folding](#query-folding) |
| "The column 'X' of the table wasn't found" | The source renamed or dropped a column (schema drift) | [Schema drift](#schema-drift) |
| An API returns exactly 100 or 1,000 rows | You read one page of a paged API | [Pagination](#pagination) |
| Combining a folder fails on some files | Files have different columns or headers | [Folder of files](#folder-of-files) |
| "This dataset includes a dynamic data source" in the Service | The URL is built from data, so the Service can't validate it | [APIs and Web.Contents](#apis-and-web-contents) |
| "Formula.Firewall: Query … references other queries or steps" | Privacy levels stop data from one source flowing into another | [Combining sources safely](#combining-sources-safely) |
| Memory or refresh time explodes after a merge | The merged table is re-read for every row, or a big table is buffered | [Performance](#performance) |
| Errors appear after changing a type | Some values don't convert; the error is per cell | [Errors](#errors) |

## The shape of a query

Every query is a `let … in` expression. Each step is a name bound to a value; the result is whatever follows `in`.

```m
let
    Source   = Csv.Document(File.Contents(DataFolder & "FactSales.csv"), [Delimiter = ",", Encoding = 65001]),
    Promoted = Table.PromoteHeaders(Source, [PromoteAllScalars = true]),
    Typed    = Table.TransformColumnTypes(Promoted, {{"OrderDate", type date}, {"Qty", Int64.Type}, {"UnitPrice", type number}}),
    Filtered = Table.SelectRows(Typed, each [Qty] <> 0)
in
    Filtered
```

The values you meet most:

| Value | Literal | Read a part |
|---|---|---|
| Record | `[Name = "Ada", Age = 36]` | `rec[Name]` |
| List | `{1, 2, 3}` | `list{0}` (zero-based) |
| Table | `#table({"A", "B"}, {{1, 2}})` | `tbl{0}` is the first row as a record; `tbl[A]` is a column as a list |
| Function | `(x) => x * 2` | `each [Qty] * 2` is shorthand for `(_) => _[Qty] * 2` |

> **Note:** M is case-sensitive. `Table.selectrows` is an error; `Table.SelectRows` works.

## Table operations

| Job | Function |
|---|---|
| Keep columns | `Table.SelectColumns(t, {"A", "B"}, MissingField.UseNull)` |
| Remove columns | `Table.RemoveColumns(t, {"Junk"}, MissingField.Ignore)` |
| Rename | `Table.RenameColumns(t, {{"Old", "New"}}, MissingField.Ignore)` |
| Change types | `Table.TransformColumnTypes(t, {{"Qty", Int64.Type}})` |
| Transform a column in place | `Table.TransformColumns(t, {{"Name", Text.Trim, type text}})` |
| Add a column | `Table.AddColumn(t, "Net", each [Qty] * [UnitPrice], type number)` |
| Filter rows | `Table.SelectRows(t, each [Region] = "West")` |
| Group | `Table.Group(t, {"Region"}, {{"Sales", each List.Sum([Net]), type number}})` |
| Unpivot | `Table.UnpivotOtherColumns(t, {"Product"}, "Month", "Value")` |
| Remove duplicates | `Table.Distinct(t, {"OrderID", "LineNo"})` |

Always give `Table.AddColumn` a type as its fourth argument. Untyped columns load as text or "any" and quietly break sorting, relationships and DAX.

## List operations

```m
List.Sum({1, 2, 3})                                  // 6
List.Transform({1, 2, 3}, each _ * 10)               // {10, 20, 30}
List.Select({1, 2, 3, 4}, each Number.IsEven(_))     // {2, 4}
List.Distinct(t[Region])                             // unique values of a column
List.Dates(#date(2026, 1, 1), 365, #duration(1, 0, 0, 0))
List.Generate(() => 1, each _ <= 5, each _ + 1)      // {1, 2, 3, 4, 5}
```

`List.Generate` is the loop of M: an initial state, a condition to continue, and a step. It is how you page through APIs (see [Pagination](#pagination)).

## Joins

Merge = join. Pick the join kind for the question, not by habit:

| Join kind | Keeps | Use it for |
|---|---|---|
| Left outer | every left row, matches from the right | Lookups (add a category to sales) |
| Inner | only rows that match | Restricting to known keys |
| Left anti | left rows with **no** match | Finding orphans: sales whose product isn't in DimProduct |
| Right anti | right rows with no match | Finding unused dimension members |
| Full outer | everything from both | Reconciling two systems |

```m
Merged   = Table.NestedJoin(Sales, {"ProductKey"}, Products, {"ProductKey"}, "P", JoinKind.LeftOuter),
Expanded = Table.ExpandTableColumn(Merged, "P", {"Category"}, {"Category"})
```

> **Warning:** A merge on a key that isn't unique on the right side duplicates left rows. Before merging, check `Table.RowCount(Products) = List.Count(List.Distinct(Products[ProductKey]))`.

Anti joins are the cheapest data-quality test you have: one merge tells you how many facts have no dimension row. The testing track's [data quality tests](https://sudhanshumukherjeexx.github.io/power-bi/testing.html#qa-data) are built on this idea.

## Append

`Table.Combine({Jan, Feb, Mar})` stacks tables. Columns are matched **by name**, not position; a column missing from one table becomes null for its rows. Rename to a common schema before appending, and add a `SourceFile` or `Period` column so you can trace rows back.

## Errors

Errors in Power Query are per cell, so one bad value doesn't stop the column loading but does leave an error in that cell, and refresh can fail on them.

```m
SafeQty = Table.AddColumn(t, "QtyClean", each try Number.From([Qty]) otherwise null, type nullable number),

// keep the reason, not just a null
Checked = Table.AddColumn(t, "QtyCheck", each
    let r = try Number.From([Qty])
    in if r[HasError] then "Bad: " & r[Error][Message] else "OK", type text)
```

- `try x otherwise y` returns `y` when `x` errors.
- `try x` alone returns a record with `HasError`, `Value` and `Error` (with `Reason`, `Message`, `Detail`).
- Find error rows before loading: **View → Column quality**, or `Table.SelectRowsWithErrors(t, {"Qty"})`.
- Remove them on purpose with `Table.RemoveRowsWithErrors`, never by accident.

## Functions and parameters

A custom function is a query whose value is a function. Write the logic once, call it per row or per file.

```m
// fnCleanPrice: "$1,299.00 USD" → 1299
(raw as nullable text) as nullable number =>
let
    stripped = if raw = null then null else Text.Remove(raw, {"$", ",", " "}),
    noCode   = if stripped = null then null else Text.Replace(stripped, "USD", ""),
    value    = try Number.From(noCode, "en-US") otherwise null
in
    value
```

Parameters (**Manage parameters**) hold values that differ by environment, such as a server name or folder path. Deployment pipelines and `fabric-cicd` can swap parameter values between Dev, Test and Prod; hard-coded paths can't be swapped.

## Dates

```m
// a calendar from the data's first to last date
let
    Start = List.Min(Sales[OrderDate]),
    End   = List.Max(Sales[OrderDate]),
    Days  = List.Dates(Start, Duration.Days(End - Start) + 1, #duration(1, 0, 0, 0)),
    T     = Table.FromList(Days, Splitter.SplitByNothing(), {"Date"}, null, ExtraValues.Error),
    Typed = Table.TransformColumnTypes(T, {{"Date", type date}}),
    Year  = Table.AddColumn(Typed, "Year", each Date.Year([Date]), Int64.Type),
    // fiscal year starting 1 July
    FY    = Table.AddColumn(Year, "FiscalYear", each Date.Year(Date.AddMonths([Date], 6)), Int64.Type)
in
    FY
```

Locale matters when converting text to dates: `Date.FromText("03/04/2026", [Culture = "en-GB"])` is 3 April; with `"en-US"` it is 4 March. Set the culture explicitly; never rely on the machine that happens to refresh.

## Folder of files

The **Folder** connector plus **Combine files** creates a sample query, a function and a combined query. It works when every file has the same columns. When they don't:

1. Normalise inside the function: promote headers, rename to a standard schema, select only the standard columns with `MissingField.UseNull`.
2. Add the file name as a column (it is already in the folder listing as `Name`) so you can trace a bad row to its file.
3. Filter the folder listing on `Extension` and on a naming pattern, so a stray `~$draft.xlsx` doesn't break refresh.

## APIs and Web.Contents

```m
let
    Base   = "https://api.example.com",
    Result = Json.Document(Web.Contents(Base, [
        RelativePath = "v1/orders",
        Query        = [from = "2026-01-01", page = "1"],
        Headers      = [Accept = "application/json"]
    ]))
in
    Result
```

Keep the base URL a constant and put everything that changes in `RelativePath` and `Query`. The Power BI Service validates data sources before refresh, and a URL concatenated from data (`"https://api.example.com/orders?page=" & Text.From(n)`) becomes a **dynamic data source** that the Service won't schedule. Never put a key or token in the query text: use the connector's credential dialog, or a gateway or Key Vault-backed connection.

## Pagination

Most APIs return a page at a time with a "next" link or a page number. Loop with `List.Generate` until the API says stop:

```m
let
    GetPage = (page as number) =>
        Json.Document(Web.Contents("https://api.example.com", [RelativePath = "v1/orders", Query = [page = Text.From(page), pageSize = "500"]])),
    Pages = List.Generate(
        () => [p = 1, r = GetPage(1)],
        each List.Count([r][data]) > 0,
        each [p = [p] + 1, r = GetPage([p] + 1)],
        each [r][data]),
    Rows  = List.Combine(Pages),
    T     = Table.FromRecords(Rows)
in
    T
```

If the API returns a `nextLink`, loop on that instead (`each [r][nextLink] <> null`), passing only the changing part through `RelativePath` or `Query`.

## Query folding

Folding means Power Query translates your steps into the source's language (usually SQL) so the source does the work. A refresh that folds reads only the rows and columns it needs; one that doesn't drags everything across the network first.

Check it: right-click a step → **View Native Query** (enabled means that step folds), or look at the folding indicators in the Applied Steps pane.

| Usually folds | Usually breaks folding |
|---|---|
| Select or remove columns, filter rows, rename, sort, group by, merges between tables in the same database, simple type changes | Adding an index column, `Table.Buffer`, custom M functions per row, merges across two different sources, many text transformations, anything after a step that already broke folding |

> **Rule:** Put the steps that fold first (filter and remove columns early) and the ones that can't fold last. Incremental refresh **needs** the date filter to fold, or every refresh reads the whole table.

## Combining sources safely

Privacy levels (Private, Organizational, Public) stop data from one source being sent to another. When a query mixes sources, Power Query may refuse with `Formula.Firewall`. Fix it by design, not by switching privacy off:

1. Set the right privacy level on each source (**File → Options → Data source settings**).
2. Separate "staging" queries that read one source each from the query that combines them.
3. Only use "Ignore privacy levels" for sources you'd happily send to each other anyway, and know that the Service enforces its own settings.

## Schema drift

Sources change: a column is renamed, a new one appears, a type changes. Defend at the edges:

- Select columns by name early with `MissingField.UseNull`, so a dropped column becomes null rather than a refresh failure.
- Rename with `MissingField.Ignore`.
- Type explicitly once, after selection.
- Add a test query that compares `Table.ColumnNames(Source)` with the list you expect and fails loudly with `error "Schema changed: …"` when they differ. A failed refresh with a clear message beats a successful one with wrong numbers.
- Agree the schema with the source owner in a [data contract](https://sudhanshumukherjeexx.github.io/power-bi/templates.html#tpl-data-contract).

## Performance

- **Reference, don't duplicate,** but know that each referencing query re-evaluates its source. A staging query referenced by five queries can be read five times.
- **`Table.Buffer`** holds a table in memory so it's read once. Use it on small lookup tables used repeatedly, never on a big fact table, and never before steps you want to fold.
- **Disable load** on staging queries that only feed others.
- **Remove columns early.** Every column you load costs memory in the model too.
- **Push heavy work upstream.** Aggregating 300 million rows belongs in SQL or a warehouse, not in the mashup engine (see [SQL for BI developers](https://sudhanshumukherjeexx.github.io/power-bi/toolkit/sql-for-bi.html#where-should-this-transformation-happen)).

## Dataflows: when the work belongs upstream

Use a Dataflow Gen2 (or a pipeline) instead of a query inside one semantic model when the same cleaned table feeds several models, when the transformation is expensive and should run once, or when another team owns the source logic. Keep presentation-only shaping in the model. The [Fabric architecture](https://sudhanshumukherjeexx.github.io/power-bi/toolkit/fabric-architecture.html) guide covers where each kind of work lives.
