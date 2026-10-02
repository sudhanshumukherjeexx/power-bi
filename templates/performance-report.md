# Performance before/after report

**Use it** for any performance fix. **Readers:** your lead (engineering version) and the requester (one paragraph).

## Template

```markdown
# Performance: <page / model> (<ticket>)
Method: <cold cache? machine? capacity? tool versions?>

| Visual / query | Before ms | FE / SE | Root cause | Fix | After ms | Improvement |
|----------------|-----------|---------|------------|-----|----------|-------------|

Model: size before/after · refresh before/after
Regression: <how you proved results are identical>
Budget: <page < x s cold, visual < y s, model < z GB> → met / not met
```

## What good looks like

- [ ] Same method before and after (cold cache, same machine, same time of day).
- [ ] Each root cause is backed by a measurement (FE/SE split, SE query count, column size).
- [ ] Results are identical; the diff is attached.
- [ ] A budget exists afterwards, so the next change can be checked against it.
