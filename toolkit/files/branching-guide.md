# Branching guide for a Power BI project (PBIP) repository

## Branches

| Branch | Deploys to | Who merges |
|---|---|---|
| `main` | Production workspace | Lead, after review and a green pipeline |
| `dev` | Development (or Test) workspace | Any developer, after review |
| `feature/<ticket>-<short-name>` | Nowhere; your own Desktop | You |
| `hotfix/<incident>` | Production, via `main`, then merged back to `dev` | Lead, with the incident lead |

## Rules

1. One ticket, one branch, one pull request. Small PRs get real reviews.
2. Open Desktop on the PBIP, change, save, **close Desktop**, then commit. Never commit `.pbi/localSettings.json` or `.pbi/cache.abf`.
3. Pull `dev` into your branch before opening a PR; resolve conflicts in the TMDL text and reopen in Desktop to check the model still loads.
4. The PR description says what changed, why, how you tested it (numbers before and after), the risk and the rollback.
5. Nobody edits Production directly. A hotfix is still a branch, a PR and a pipeline run, just a faster one.
6. Tag every Production release (`v2026.10.02`) so rollback means "redeploy the previous tag".
