# Deployment

The website is the `site/` folder. GitHub Actions publishes it to GitHub Pages at
<https://sudhanshumukherjeexx.github.io/power-bi/>, and URLs map one-to-one: `site/beginner.html` is served as
`…/power-bi/beginner.html`.

## How a change goes live

1. You push to `main`, or merge a pull request into it.
2. The **Validate and deploy** workflow (`.github/workflows/validate.yml`) runs the `validate` job:
   - the data generators and the build reproduce every committed file;
   - every test passes (content, curriculum, datasets, links, SQL, Experience Mode, Toolkit, catalog);
   - the HTML is valid.
3. If, and only if, `validate` passes, the `deploy` job uploads `site/` and publishes it. A failed check means the live site stays on the last good version.
4. Pull requests run `validate` only; they never deploy.

The workflow also runs weekly to flag content whose verification date has expired, and you can run it by hand from the **Actions** tab.

## One-time setup (already needed once, when the site moved into `site/`)

1. Open the repository on GitHub → **Settings** → **Pages**.
2. Under **Build and deployment** → **Source**, choose **GitHub Actions** (instead of "Deploy from a branch").
3. Push `main` (or open **Actions** → **Validate and deploy** → **Run workflow**).
4. Open **Actions** and wait for both jobs to turn green; the `deploy` job shows the site URL.

Do step 2 before the first push of the new layout. While the source is still "Deploy from a branch", GitHub would publish the repository root, which no longer contains the website.

## Previewing locally

```bash
npm run check                          # build and run every test
npx serve site                         # or: python -m http.server --directory site
```

Open the address it prints. The site uses relative links, so it works at any path.

## Rolling back

Every deploy comes from a commit on `main`. To go back, revert the bad commit (`git revert <commit>`) and push: the workflow validates and publishes the previous state. You can also re-run the **deploy** job of an earlier successful run from the Actions tab.

## If a deploy fails

- **`validate` failed:** open the job log; the failing check names the file and the problem. Fix it locally with `npm run check`, then push again.
- **`deploy` failed with a Pages error:** check that Settings → Pages → Source is **GitHub Actions**, and that the `github-pages` environment (Settings → Environments) has no protection rules blocking `main`.
