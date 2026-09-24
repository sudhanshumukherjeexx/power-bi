# Power BI Holy Grail

A practical path from Power BI beginner to 5-year senior. It is a static website with no build step and no backend, so it runs as-is on GitHub Pages.

| Page | What it is |
|---|---|
| `index.html` | The course: 3 levels, 17 topics, 73 hands-on assignments with worked solutions, 90 interview questions, 68 assessment items, career paths, certification map, starter project, datasets |
| `flashcards.html` | 188 interview flashcards with spaced repetition and a timed mock interview. Works without Power BI. |
| `glossary.html` | 139 plain-English definitions. Dotted-underlined terms across the site open them in place. |
| `cheatsheet.html` | Printable cheat sheets, one per level, about two A4 pages each (Print → Save as PDF) |
| `data/` | The 14 practice datasets as CSV files (see `data/README.md`) |
| `starter/northwind-starter.zip` | A Power BI Project (PBIP) with the 12 clean tables loaded and related |

Everything works on phones, iPhone and iPad. The site can be installed as an app and works offline after the first visit. Progress is stored in the browser and can be moved between devices with **Export progress / Import progress**.

## Publish on GitHub Pages

1. Push this folder to a GitHub repository (for example `power-bi`).
2. On GitHub, open **Settings → Pages**.
3. Under **Build and deployment**, choose **Source: Deploy from a branch**, then **Branch: `main`** and **folder: `/ (root)`**. Click **Save**.
4. After a minute the site is live at `https://<your-user>.github.io/<repo>/`.

`.nojekyll` is included so GitHub serves every file as-is. All links are relative, so the site works under any repository name, and on a custom domain.

## Preview locally

Open `index.html` directly in a browser. Everything works except installing the app and offline mode, which need `http(s)`. To test those too, serve the folder:

```sh
npx http-server -p 8080     # or: python -m http.server 8080
```

## Project structure

```
index.html  flashcards.html  glossary.html  cheatsheet.html  404.html
manifest.webmanifest  sw.js  .nojekyll
assets/
  css/site.css          shared components (search, glossary pop-ups, solutions, paths)
  js/content.js         SINGLE SOURCE of the course: datasets (DS), roadmap, LEVELS (topics, assignments, interview Qs, assessments)
  js/solutions.js       worked solutions, keyed by assignment id (e.g. "b-dax-0")
  js/cards.js           plain-English flashcard deck (the topic deck is built from LEVELS)
  js/glossary.js        glossary terms
  js/paths.js           career paths and certification maps
  js/site.js            shared runtime: storage, spaced repetition, readiness, search, pop-ups, export/import, offline
  icons/                app icons
data/                   generated CSVs + README
starter/                generated starter project (zip)
tools/
  export-data.js        regenerates data/*.csv from content.js
  build-starter.js      generates the starter PBIP (TMDL) project
```

## Updating content

* **Course text, datasets, interview questions:** edit `assets/js/content.js`. The course, the flashcards' topic deck and search all read from it.
* **After changing a dataset:** run `node tools/export-data.js` so the CSV files match the site again, then rebuild the starter (below).
* **Worked solutions:** edit `assets/js/solutions.js`. The key is `<topicId>-<assignmentIndex>`.
* **Rebuilding the starter zip:**
  ```sh
  node tools/build-starter.js build/northwind-starter
  # copy the 12 CSVs it loads into build/northwind-starter/data/, then zip the folder:
  #   Windows:  cd build && tar -a -c -f ../starter/northwind-starter.zip northwind-starter
  ```
* **After any release:** bump `VERSION` in `sw.js` (e.g. `pbi-holy-grail-v2`) so installed copies drop their old offline cache. Pages are fetched network-first, so online visitors see changes straight away regardless.

## Storage keys

Progress lives in `localStorage` under `pbi-holy-grail-v1` (ticks, quiz answers, theme, chosen path, unlocked solutions) and `pbi-holy-grail-cards-v1` (flashcard schedule). Export/Import writes both to one JSON file.

Northwind Outdoors is a fictional company. All data is synthetic and generated deterministically.
