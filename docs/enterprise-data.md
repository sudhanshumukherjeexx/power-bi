# Enterprise scale pack

The course datasets have at most 100 rows each, so you can check results by eye. The company pack used by Experience Mode has a few thousand rows. Neither teaches what happens at scale, so this generator builds a large, realistic sales dataset on your own machine.

## Generate

You need Node.js 18 or later. From the project folder:

```bash
node tools/generate-enterprise-data.js --rows 1000000        # about 8 seconds, ~100 MB
node tools/generate-enterprise-data.js --scale 10m           # 100k | 1m | 10m | 50m
node tools/generate-enterprise-data.js --rows 2000000 --out C:\PowerBI\big --seed 7
```

The files go to `enterprise-data/`, which Git ignores. The same seed and size always produce identical files.

| File | Contents |
|---|---|
| `fact_sales.csv` | One row per order line: keys, order timestamp (to the second), order and load dates, channel, currency, quantity, price, discount, net amount in USD |
| `dim_customer.csv` | Customers. Purchases are heavily skewed: a few customers buy a lot |
| `customer_history.csv` | Customer attribute changes, as a source for an SCD type 2 dimension |
| `dim_product.csv`, `dim_date.csv`, `fx_rates.csv` | Products, a date table and monthly EUR/GBP rates |
| `manifest.json` | Row counts and the exact number of each injected defect |

## Defects you should find

The counts are set per million rows in `tools/enterprise.config.json` and are verified by `tests/enterprise.test.js`:

- exact duplicate rows
- null quantities
- customer keys that don't exist in `dim_customer`
- late-arriving rows, where the LoadDate is a week or more after the OrderDate
- a few future-dated orders

## What each size teaches

| Rows | Try this | What you'll learn |
|---|---|---|
| 100k | Import everything, including `OrderTimestamp` | Even small models show which columns cost memory (VertiPaq Analyzer) |
| 1M | Reproduce Sprint 04's slow measures | Formula-engine vs storage-engine bottlenecks become measurable |
| 10M | Remove `OrderTimestamp` and `SalesKey`, then compare model size; add an aggregation table | High-cardinality columns dominate size; aggregations change query plans |
| 50M | Incremental refresh by OrderDate; load into a Fabric lakehouse and build Direct Lake | Partitioning, refresh windows, and Direct Lake guardrails |

Scale changes design decisions. A calculated column that is harmless at 100 rows costs gigabytes at 50 million. A bi-directional relationship that is "fine" at 1,000 customers becomes a performance problem at 400,000.
