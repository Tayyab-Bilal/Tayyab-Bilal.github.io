# portfolio-site

Personal site for Tayyab Bilal: https://tayyab-bilal.github.io
Plain HTML, CSS and vanilla JS. No framework, no build step, no npm dependencies.

## What it's made of

```
index.html          main page
work.html           work-with-me page for freelance clients
blog/               index.html (post list), one html per post, _template.html
assets/style.css    styles (dark default, light mode)
assets/main.js      theme toggle, copy button, approval-gate demo, dock
assets/pet.js       Bolt, the cursor-following pet and its ask-me chat
assets/bolt-lines.js  Bolt's offline answers (used when AI mode fails)
assets/blog.js      theme toggle for blog and work pages
assets/hit.js       visitor tracker beacon (see "Visitor tracker")
assets/blog/<slug>/ cover.webp (index card) and cover.png (og:image) per post
assets/og.png       link preview image; favicon.svg; run-states.svg
cv.pdf              CV download
worker/             Cloudflare Worker: Bolt AI mode + visitor tracker
  bolt-worker.js    the worker
  wrangler.toml     worker config (AI binding, D1 binding)
  migrations/       D1 table for the tracker
tools/visits.py     local visitor stats report
tests/              see "Tests"
```

## External services

| Service | Used for | Account | Cost |
|---|---|---|---|
| GitHub Pages | Hosts the static site from `main` of `Tayyab-Bilal/Tayyab-Bilal.github.io` | GitHub `Tayyab-Bilal` | Free (soft limit ~100 GB/month bandwidth, 1 GB site) |
| Cloudflare Workers | Runs `worker/bolt-worker.js` at https://bolt.tayyaib055766.workers.dev | Cloudflare, logged in as tayyaib055766@gmail.com | Free plan (100k requests/day) |
| Cloudflare Workers AI | Bolt's AI answers, model `@cf/mistralai/mistral-small-3.1-24b-instruct` (binding `AI`) | same | Free daily allowance; over it Bolt falls back to offline answers |
| Cloudflare D1 | Visitor tracker database `bolt-hits` (binding `DB`) | same | Free plan (5 GB, 100k writes/day) |
| Google Fonts | Fonts (fonts.googleapis.com, fonts.gstatic.com) | none | Free |

Outbound links only (no scripts loaded): GitHub, LinkedIn (`linkedin.com/in/tayyab-bilal-tdev`), and the sources cited in blog posts.

No cookies, no third-party analytics, no API keys in the site.

## Bolt (the chat pet)

- `assets/pet.js` sends `{ q, page: location.pathname }` to the worker URL in the `bolt-api` meta tag.
- The worker ("model proposes, code decides"):
  1. Only POST from allowed origins (the site, plus localhost:8765 for tests), JSON, body under 1 KB.
  2. Rate limits: 8/min per visitor, 60/min per worker instance.
  3. Page-aware: the page path is allowlisted (`pagePath`), the worker fetches that page from the site itself (cached 10 min), picks the top 3 passages (max 1500 chars) and answers from them.
  4. A validator checks every answer (page mode: at least 4 content words, at least 60% found in the passages, numbers must be backed). Rejected answers fall back to a fixed fact or a trimmed passage.
- If the worker is down or over the free allowance, Bolt answers offline from `bolt-lines.js`.

## Visitor tracker

Self-hosted, free, no cookies.

- `assets/hit.js` (loaded with `defer` on every page and in `_template.html`) sends a beacon to `POST /hit` on the worker on page load, and a second one with time on page on `pagehide`. It sends: path, referrer host (not when it's this site), browser language, screen width.
- The worker adds from Cloudflare's `request.cf`: country, EU flag, continent, region, city, postal code, timezone, network (ASN + name), Cloudflare data centre. From the user agent: device (mobile/tablet/desktop), browser, OS.
- Visitor id = SHA-256(IP + user agent + UTC date + `HIT_SALT` secret), first 16 hex chars. Counts unique visitors per day. The IP is never stored, and neither are latitude/longitude.
- Bots (bot, crawl, spider, preview, headless in the user agent) and unknown paths are ignored. A database error never breaks the page.
- Stored in D1 table `hits` (`worker/migrations/0001_hits.sql`). Page views have `dwell_ms` NULL; time-on-page rows have it set. Time on page is rough on phones.

Read the stats (run from `worker/` so wrangler finds the config):

```bash
cd worker && python3 ../tools/visits.py --remote
```

Prints the last 7 and 30 days: visits, unique visitors, top pages, referrers, countries, regions (Middle East grouped), cities, devices, networks, average time on page. `python3 tools/visits.py file.sqlite` reads a local SQLite copy.

### Go live (one time)

```bash
cd worker
npx wrangler d1 create bolt-hits                 # paste the database_id into wrangler.toml
npx wrangler d1 migrations apply bolt-hits --remote
npx wrangler secret put HIT_SALT                 # any long random string
npx wrangler deploy
```

Then commit and push the site so Pages serves `hit.js`.

## Preview locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Tests

```bash
node tests/gate-check.js       # approval-gate demo logic
node tests/bolt-grep.js        # Bolt offline answers
node tests/page-aware.mjs      # Bolt page-aware mode
node tests/worker-safety.mjs   # worker origin, size, rate limits, validator
node tests/hit.mjs             # visitor tracker
python3 tests/visits.py        # stats report
```

Web checks run headless only (`chromium.launch(channel="chrome", headless=True)` via `cd /tmp && uvx --from playwright python`).

## Deploying

- Site: push to `main`; GitHub Pages rebuilds in about a minute. Check with
  `curl -s https://api.github.com/repos/Tayyab-Bilal/Tayyab-Bilal.github.io/commits/<sha>/check-runs`.
- Commits: author `tayyab bilal <tayyaib055766@gmail.com>`, no co-author trailer. Push with `env -u GITHUB_TOKEN git push origin HEAD:main`.
- Worker: `cd worker && npx wrangler deploy`. This is a production change. If npx fails with ENOTEMPTY, delete the broken `~/.npm/_npx/<hash>` folder named in the error.

## How to add a blog post

Every post has two parts: the LinkedIn part and the blog part. The blog part is written first in the post's own folder, `portfolio/linkedin/posts/<drafts|posted>/NN-name/blog/` (`article.md`, `cover.html`, `cover.png`, `figures/*.svg`). Then it is copied here.

1. Write `article.md` in that folder: TL;DR, 3 to 5 sections, "What I'd tell you to do", References. 700 to 1100 words. Only facts already in the post and its sources.
2. Copy `blog/_template.html` to `blog/<slug>.html`. Fill the `FILL-IN` comments, replace `SLUG`, `TITLE` and dates, and paste in the figures (inline SVG from `figures/`), code, table. The template already loads `hit.js`.
3. Cover image, 1200x630, in the site theme (not a LinkedIn slide): copy `cover.html` from an existing post folder, change the title and motif, then
   ```bash
   cd /tmp && uvx --from playwright --with pillow python -c "
   from playwright.sync_api import sync_playwright;from PIL import Image
   with sync_playwright() as p:
       b=p.chromium.launch(channel='chrome',headless=True);pg=b.new_page(viewport={'width':1200,'height':630})
       pg.goto('file:///PATH/TO/blog/cover.html');pg.wait_for_timeout(1200);pg.screenshot(path='cover.png')
   im=Image.open('cover.png').convert('RGB');im.save('cover.webp','WEBP',quality=82)"
   ```
   Put `cover.png` and `cover.webp` in `assets/blog/<slug>/`.
4. Add one `<li>` at the top of the list in `blog/index.html`. Update "Latest writing" in `index.html` if it is now one of the 2 newest.
5. Add the new path to `pagePath` in `worker/bolt-worker.js` only if it doesn't match the existing `blog/<slug>` pattern (it normally does), so Bolt and the tracker accept it.
6. Check headless: light and dark, 1280 and 375 wide, no console errors, no sideways scroll. Then run the tests.
7. Do not link the showcase repos from posts. Say "built and tested", not "shipped", for agent kit work.

## TODO

- [ ] Put the real LinkedIn post URLs in blog/grep-first.html and blog/no-code-sandbox.html (search for `TODO swap for the exact LinkedIn post URL`).
- [ ] Bolt's facts still say current job is SWSAM; update when ready.
- [x] Tracker live (9 Nov 2026).
- [ ] Optional: custom domain (add a `CNAME` file and the DNS records GitHub Pages lists).
