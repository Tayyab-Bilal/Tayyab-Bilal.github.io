# portfolio-site

Personal site for Tayyab Bilal. Plain HTML, CSS and a small vanilla JS file. No framework, no build step.

```
index.html          the main page
work.html           work-with-me page for freelance clients
assets/style.css    styles (dark default, light mode)
assets/main.js      theme toggle, copy button, approval-gate demo
assets/pet.js       Bolt, the cursor-following pet and its ask-me chat
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

- [ ] Replace the LinkedIn activity link in the Writing section with the direct URL of the grep-first post (26 Oct 2026).
- [ ] Optional: Bolt AI mode (free, Cloudflare Workers AI, no key, no card):
      `cd worker && npx wrangler login && npx wrangler deploy`, then put the printed workers.dev URL
      in the `bolt-api` meta tag of index.html and work.html. Over the free daily allowance it just fails
      and Bolt answers from grep instead.
- [ ] Optional: custom domain. Add a `CNAME` file with the domain and set the DNS records GitHub Pages lists.
