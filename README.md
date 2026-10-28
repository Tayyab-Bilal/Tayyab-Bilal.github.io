# portfolio-site

Personal site for Tayyab Bilal. Plain HTML, CSS and a small vanilla JS file. No framework, no build step.

```
index.html          the whole page
assets/style.css    styles (dark only)
assets/main.js      copy button + approval-gate demo
assets/*.svg        favicon and the four case-study diagrams
tests/gate-check.js checks the demo follows the agent-guardrails rules
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

## Diagrams

The SVGs are rendered with mermaid-cli (dark theme, Yaru blue colours) from the Mermaid diagrams in each repo's README. The approval-gate, agent-kit and three-hook diagrams are drawn top to bottom so they stay readable; the approval-gate and run-state ones are condensed versions.

## TODO

- [ ] Add `cv.pdf` to the root of this folder. The CV button links to it and is broken until then.
- [ ] Replace the LinkedIn activity link in the Writing section with the direct URL of the grep-first post (26 Oct 2026).
- [ ] Optional: an Open Graph preview image (`og:image`, 1200x630 PNG).
- [ ] Optional: custom domain. Add a `CNAME` file with the domain and set the DNS records GitHub Pages lists.
