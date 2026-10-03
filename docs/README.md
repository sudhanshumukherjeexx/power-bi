# Documentation

How the project is organised and how to change it is in [CONTRIBUTING.md](../CONTRIBUTING.md). This folder holds the rest.

## Current

| Document | What it covers |
|---|---|
| [deployment.md](deployment.md) | How the site is tested and published to GitHub Pages, the one-time setup, local preview and rollback. |
| [implementation-plan.md](implementation-plan.md) | Plan for 2.2.0 onward: target architecture, token, scoring and schema migration, navigation, phases, risks, rollback, definition of done. |
| [progress-scoring-audit.md](progress-scoring-audit.md) | Every learner-facing number: where it's stored, its formula, what was wrong, and the evidence model that replaced it. |
| [security-audit.md](security-audit.md) | Threat model (imported progress files), findings, and the import hardening, CSP, font and CI supply-chain plans. |
| [seo-audit.md](seo-audit.md) | What crawlers see on each page type, what must never be rendered statically, and the static-rendering plan. |
| [design-audit.md](design-audit.md) | Tokens, components, navigation, Toolkit vs Resources overlap and contrast measurements before the redesign. |
| [enterprise-data.md](enterprise-data.md) | The enterprise-scale data generator: options, the defects it plants, and what each data size teaches. |

## History

Records of past decisions, kept for context. They describe the project at the time they were written and aren't updated.

| Document | What it covers |
|---|---|
| [history/current-architecture.md](history/current-architecture.md) | Audit of the original course site before the 2.0.0 redesign: structure, data flow, content problems found. |
| [history/migration-plan.md](history/migration-plan.md) | The 2.0.0 plan: target architecture, information architecture, progress schema v2, risks and phases (all complete). |
| [history/qa-report.md](history/qa-report.md) | Verification of the 2.0.0 release: test results, end-to-end flows, visual, accessibility and offline checks. |

Release-by-release changes are in [CHANGELOG.md](../CHANGELOG.md).
