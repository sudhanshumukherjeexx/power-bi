# Privacy

Power BI Holy Grail has no accounts, no server and no cookies. Your progress (ticks, quiz answers, scenario notes, ratings, flashcard history) is stored **only in your browser**, and leaves it only when you export a file yourself.

## What is never collected

- Your progress, answers, notes, ratings, decisions or flashcard history
- The contents of a progress file you import or export
- What you type into search boxes
- Your name, email address or any other identifier

None of these ever appear in a page address, so none of them can reach any analytics service.

## Page-view counts

The site uses **Cloudflare Web Analytics** to count page views, so it's clear which lessons, scenarios and guides people actually use. You can switch it off for your browser under **Progress → Privacy**. How it works:

- **What Cloudflare receives:** the page that was loaded, the referring site, the browser and device type, and the country (derived from the IP address, which Cloudflare doesn't store as part of the analytics). It's cookieless and aggregate, with no cross-site tracking. See [Cloudflare's privacy approach](https://www.cloudflare.com/web-analytics/).
- **Page loads only:** in-page navigation isn't tracked (`spa: false`).
- **It doesn't load at all:**
  - if your browser sends **Do Not Track** or **Global Privacy Control**;
  - if you turn it off under **Progress → Privacy**;
  - on any page whose address contains a search;
  - on local previews.
- **Only Cloudflare's beacon host is added** to the site's Content Security Policy. No other third party can load.

It is controlled by `analytics.token` in `content/site.json`. Clearing the token switches it off for everyone, and then no page loads anything from Cloudflare.

## Telling us what's missing

When a search finds nothing, the site offers a **Suggest this for the site** link. It opens a prefilled GitHub issue with your search, which you can edit or discard. Nothing is sent unless you submit it on GitHub, under your GitHub account. These issues (title "Content gap: …") are how missing topics are found. There is no hidden collection of searches.

## For the maintainer: switching analytics on

1. In the Cloudflare dashboard, go to **Analytics & Logs → Web Analytics → Add a site**, enter `sudhanshumukherjeexx.github.io`, and copy the token from the JavaScript snippet (the 32-character value of `"token"`). You don't need to move DNS. The token is public, not a secret.
2. Put it in `content/site.json` under `analytics.token`, then run `npm run build`. The build adds the loader to every page and allows Cloudflare's two hosts in the Content Security Policy.
3. `npm run check` and the browser tests must pass. `tests/analytics.test.js` checks the opt-outs.
4. Commit and push. Clearing the token switches everything off again.
