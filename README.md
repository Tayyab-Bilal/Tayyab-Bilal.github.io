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
assets/blog/<slug>/ slide images for each post (WebP)
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

1. Copy `blog/_template.html` to `blog/<slug>.html` and fill in the commented spots (title, date, summary, text, slide alts, references, LinkedIn URL). Replace every `SLUG`.
2. Convert slides to WebP (1080 wide, quality 80) and put them in `assets/blog/<slug>/slide-1.webp` and so on:
   ```bash
   python3 -c "from PIL import Image;import sys;[Image.open(f).convert('RGB').resize((1080,round(Image.open(f).height*1080/Image.open(f).width))).save(f.rsplit('.',1)[0]+'.webp','WEBP',quality=80) for f in sys.argv[1:]]" slide-*.png
   ```
3. Add one `<li>` entry at the top of the list in `blog/index.html`. Also update the two entries in the "Latest writing" section of `index.html` if it is now one of the 2 newest.
4. Sitemap: there is none yet. If one is added, add `https://tayyab-bilal.github.io/blog/<slug>.html`.
5. Do not link the showcase repos from posts.

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

- [ ] Put the real LinkedIn post URLs in blog/grep-first.html and blog/no-code-sandbox.html (search for `TODO linkedin post url`).
- [ ] Optional: Bolt AI mode (free, Cloudflare Workers AI, no key, no card):
      `cd worker && npx wrangler login && npx wrangler deploy`, then put the printed workers.dev URL
      in the `bolt-api` meta tag of index.html and work.html. Over the free daily allowance it just fails
      and Bolt answers from grep instead.
- [ ] Optional: custom domain. Add a `CNAME` file with the domain and set the DNS records GitHub Pages lists.
