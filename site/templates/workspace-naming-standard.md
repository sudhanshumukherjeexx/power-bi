# Workspace and content naming standard

**Use it** when creating any workspace, semantic model, report, app or security group. **Readers:** everyone who publishes content; admins and scripts that rely on names.

## Workspaces

`<Domain> <Purpose>` for Production, with the stage in brackets for the other stages:

| Example | Meaning |
|---|---|
| `Sales Analytics` | Production content for the Sales domain |
| `Sales Analytics [Test]` | Test stage of the same deployment pipeline |
| `Sales Analytics [Dev]` | Development stage |
| `Sales Data` | Shared semantic models and dataflows for Sales (no reports) |
| `Sandbox - <Team>` | Self-service exploration; no support, no certification |

## Items

| Item | Pattern | Example |
|---|---|---|
| Semantic model | `<Subject>` (no "Model", no version numbers) | `Sales`, `Finance Ledger` |
| Report | `<Subject> - <Audience or purpose>` | `Sales - Executive Summary` |
| App | `<Domain>` | `Sales` |
| Dataflow or pipeline | `<Source or subject> - <verb>` | `Orders - Load to Silver` |
| Security group | `PBI-<Domain>-<Role>` | `PBI-Sales-Viewers`, `PBI-Sales-Contributors` |

## Rules

- [ ] No personal names, dates or "v2", "final", "copy" in names; version history lives in Git.
- [ ] Production names never carry a stage suffix.
- [ ] Every workspace has a description with the owner and a contact.
