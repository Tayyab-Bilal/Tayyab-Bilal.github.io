# portfolio-site

Personal site for Tayyab Bilal. Plain HTML, CSS and a small vanilla JS file. No framework, no build step.

```
index.html          the main page
work.html           work-with-me page for freelance clients
blog/               index.html (post list), one html per post, _template.html
assets/style.css    styles (dark default, light mode)
assets/main.js      theme toggle, copy button, approval-gate demo
assets/pet.js       Bolt, the cursor-following pet and its ask-me chat
assets/blog.js      theme toggle for blog and work pages
assets/blog/<slug>/ cover.webp (index card) and cover.png (og:image) for each post
assets/og.png       link preview image
cv.pdf              CV download
worker/             optional Cloudflare Worker for Bolt's AI mode
tests/              node tests/gate-check.js, node tests/bolt-grep.js
```

## Preview locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

Opening `index.html` straight from disk (file://) also works.

Check the demo logic:

```bash
node tests/gate-check.js
```

## How to add a blog post

Every post has two parts: the LinkedIn part and the blog part. The blog part is written first in the post's own folder, `portfolio/linkedin/posts/<drafts|posted>/NN-name/blog/` (`article.md`, `cover.html`, `cover.png`, `figures/*.svg`). Then it is copied here.

1. Write `article.md` in that folder: TL;DR, 3 to 5 sections, "What I'd tell you to do", References. 700 to 1100 words. Only facts already in the post and its sources.
2. Copy `blog/_template.html` to `blog/<slug>.html`. Fill the `FILL-IN` comments, replace `SLUG`, `TITLE` and dates, and paste in the figures (inline SVG from `figures/`), code, table.
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
4. Add one `<li>` at the top of the list in `blog/index.html` (cover, title, date, reading time, summary). Update the two entries in "Latest writing" in `index.html` if it is now one of the 2 newest.
5. Sitemap: there is none yet. If one is added, add `https://tayyab-bilal.github.io/blog/<slug>.html`.
6. Check headless: light and dark, 1280 and 375 wide, no console errors, no sideways page scroll. Then `node tests/gate-check.js` and `node tests/bolt-grep.js`.
7. Do not link the showcase repos from posts. Say "built and tested", not "shipped", for agent kit work.

## Deploy to GitHub Pages (user site)

1. Create a public repo named `Tayyab-Bilal.github.io` under the Tayyab-Bilal account.
2. Add it as a remote and push this folder's `main` branch:
   ```bash
   git remote add origin git@github.com:Tayyab-Bilal/Tayyab-Bilal.github.io.git
   git push -u origin main
   ```
3. In the repo: Settings, Pages, Source "Deploy from a branch", branch `main`, folder `/ (root)`.
4. After a minute the site is live at https://tayyab-bilal.github.io/.

## TODO

- [ ] Put the real LinkedIn post URLs in blog/grep-first.html and blog/no-code-sandbox.html (search for `TODO swap for the exact LinkedIn post URL`).
- [ ] Optional: Bolt AI mode (free, Cloudflare Workers AI, no key, no card):
      `cd worker && npx wrangler login && npx wrangler deploy`, then put the printed workers.dev URL
      in the `bolt-api` meta tag of index.html and work.html. Over the free daily allowance it just fails
      and Bolt answers from grep instead.
- [ ] Optional: custom domain. Add a `CNAME` file with the domain and set the DNS records GitHub Pages lists.
