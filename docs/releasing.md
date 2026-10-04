# Releasing and repository settings

## Cutting a release

1. Add a section `## X.Y.Z (date): name` to the top of [CHANGELOG.md](../CHANGELOG.md), with **For learners**, **For maintainers**, **Breaking changes**, **Progress data** and **Curriculum**.
2. Set `version` in `package.json`. Run `npm run check` and `npm run test:e2e`, then commit and push.
3. When the **Validate and deploy** run is green, tag and publish:

```bash
git tag -a vX.Y.Z -m "X.Y.Z" && git push origin vX.Y.Z
node tools/release-notes.js X.Y.Z > notes.md
gh release create vX.Y.Z --title "X.Y.Z: name" --notes-file notes.md --verify-tag
```

## Existing releases

Each tag points at the commit where that release was complete:

| Tag | Commit | Name |
|---|---|---|
| v2.0.0 | `a7326a1` | The fellowship release |
| v2.1.0 | `31bb04b` | The BI Developer Toolkit |
| v2.2.0 | `714bd06` | Trustworthy progress (includes the move to `site/` and gated deploys) |
| v2.3.0 | `ba4b554` | A new identity and a simpler map |
| v2.4.0 | `069d696` | Readable without JavaScript, findable |
| v2.5.0 | `33629cc` | Tested in a real browser |
| v2.6.0 | `a720aac` | Operations |
| v2.6.1 | the commit that bumps `package.json` to 2.6.1 | The Power BI Fellowship (rename) |

## Repository settings (one time)

**About** (description, website and topics):

```bash
gh repo edit sudhanshumukherjeexx/power-bi \
  --description "Open-source Power BI fellowship: hands-on skills, real BI tickets, incidents, performance debugging, deployment, Fabric and architecture." \
  --homepage "https://sudhanshumukherjeexx.github.io/power-bi/" \
  --add-topic power-bi --add-topic business-intelligence --add-topic dax --add-topic power-query \
  --add-topic microsoft-fabric --add-topic sql --add-topic data-modeling --add-topic bi-developer \
  --add-topic analytics-engineering --add-topic education --add-topic open-source
```

**Social preview:** GitHub's API can't set this. Go to **Settings → General → Social preview → Edit → Upload an image**, and choose [docs/social-preview.png](social-preview.png) (1280×640). It's regenerated with `node tools/render-og.js`.

**Labels** used by the automations (created automatically on first use, or now):

```bash
gh label create content-review --color D9A514 --description "Fast-moving content past its review date"
gh label create content-gap --color 426A9A --description "Something a learner searched for and didn't find"
gh label create dependencies --color 5C626D --description "Dependabot updates"
```

**Pages:** Settings → Pages → Source must be **GitHub Actions** (see [deployment.md](deployment.md)).
