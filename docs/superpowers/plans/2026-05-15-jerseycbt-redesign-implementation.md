# jerseycbt.com Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current single-page hand-coded `index.html` at `jerseycbt.com` with a conversion-focused multi-page Astro site (10 page-types, 6 condition sub-pages, Portuguese landing) deployed via GitHub Actions to GitHub Pages, hitting the v2 spec's success criteria (Lighthouse Perf ≥ 90 mobile, A11y ≥ 95, `/portugues` indexed, page-1 ranking for "CBT Jersey" within 6 months).

**Architecture:** Two parallel streams. **Build stream** (B1–B10) scaffolds Astro on a `redesign` branch, builds reusable components and integrations, leaves placeholder markdown in content collections so pages render. **Content stream** (C1–C5) drops the ~10,200 launch words into the markdown files the build stream already wired up. The two streams converge at **Launch (L)**, which merges `redesign` → `Master`, flips the GitHub Pages source, and runs post-cutover smoke checks. Old single-page site stays live on `Master` root until L1 cutover — fully reversible via the `pre-redesign` tag created in B1.

**Tech Stack:** Astro (latest) + `@astrojs/tailwind` (Tailwind CSS) + `@astrojs/sitemap` + `@astrojs/rss` + `@astrojs/mdx` (optional, for condition collections only if needed). GitHub Pages (custom domain `jerseycbt.com` via `/public/CNAME`). GitHub Actions deploy to `gh-pages` branch. Plausible Analytics. Formspree (contact form). Behold.so (Instagram). Calendly (two event types: free 15-min consultation + paid initial 50-min session at £100). Static-map → click-to-load Google Maps iframe.

---

## Stream model — why two streams

The v2 spec flags that the launch writing burden is ~10,200 words (6 conditions × ~1,000 + 3 articles × ~700 + Portuguese landing 600 + sitewide 1,500). **Writing is the bottleneck, not code.** The build stream produces a complete, deployable site that renders against *placeholder* markdown frontmatter + bodies. The content stream replaces placeholders in the same markdown files without touching code. The two streams share the content-collections schema defined in B6 but otherwise do not block each other.

**Build can ship before all content is written.** Launch acceptance criterion is: site builds + deploys + condition pages batch-1 (anxiety, depression, trauma-ptsd) written + 3 launch articles written + Portuguese landing written + site copy written. The remaining 3 condition pages (ocd, relationships, burnout) can ship as a follow-up commit within 30 days post-launch per the spec.

**Branch model:** All work happens on the `redesign` branch off `Master`. Build commits and content commits interleave on this branch. No PRs — Rodrigo is the sole reviewer; merge happens at Launch via fast-forward to `Master`.

---

## File structure

### New top-level files (Astro project root)

```
package.json                       # Astro + Tailwind + integrations deps
package-lock.json                  # npm lockfile (committed)
astro.config.mjs                   # Astro config (Tailwind, sitemap, MDX, site URL)
tailwind.config.mjs                # Tailwind config (design tokens from v2 spec)
tsconfig.json                      # Strict TS for Astro
.nvmrc                             # Node version pin (lts/iron i.e. 20)
.gitignore                         # Extended (node_modules, .astro/, dist/)
```

### `src/`

```
src/
├── content/
│   ├── config.ts                  # astro:content schemas for articles + conditions
│   ├── articles/
│   │   ├── cbt-vs-cat.md          # Launch article 1 (placeholder in build, prose in C2)
│   │   ├── how-long-cbt-anxiety.md
│   │   └── first-therapy-session.md
│   └── conditions/
│       ├── anxiety.md             # Each condition: frontmatter + 8-section body
│       ├── depression.md
│       ├── trauma-ptsd.md
│       ├── ocd.md
│       ├── relationships.md
│       └── burnout.md
├── layouts/
│   └── BaseLayout.astro           # <head>, JSON-LD, OG tags, fonts, Plausible script
├── components/
│   ├── Nav.astro
│   ├── Footer.astro
│   ├── Hero.astro                 # Generic hero (used by article/condition variants)
│   ├── ConversionHero.astro       # Home-only conversion-tuned hero
│   ├── StickyBookButton.astro     # Mobile-only sticky bottom CTA
│   ├── JsonLdSchema.astro         # LocalBusiness + MedicalBusiness JSON-LD
│   ├── TrustStrip.astro
│   ├── ConditionCard.astro
│   ├── ConditionPage.astro        # 8-section template for condition sub-pages
│   ├── CaseVignette.astro
│   ├── FAQ.astro
│   ├── ResourceLinks.astro
│   ├── ArticleCard.astro
│   ├── ArticlePage.astro
│   ├── InstagramGrid.astro        # Behold.so wrapper
│   ├── CalendlyEmbed.astro        # Inline iframe (lazy)
│   ├── CalendlyPopupButton.astro  # Modal trigger (lazy)
│   ├── ConsultationCTA.astro      # Preset: free 15-min event
│   ├── SessionCTA.astro           # Preset: paid initial 50-min event
│   ├── PriceTable.astro
│   ├── InsuranceLogos.astro
│   ├── ContactForm.astro          # Formspree
│   ├── GoogleMap.astro            # Static map → click-to-load iframe
│   ├── CTAButton.astro
│   └── LanguageNote.astro
├── pages/
│   ├── index.astro                # Home
│   ├── approach.astro
│   ├── what-i-treat/
│   │   ├── index.astro            # Conditions hub
│   │   └── [slug].astro           # Dynamic route → conditions collection
│   ├── about.astro
│   ├── articles/
│   │   ├── index.astro
│   │   ├── [slug].astro           # Dynamic route → articles collection
│   │   └── rss.xml.js             # RSS endpoint
│   ├── fees.astro
│   ├── book.astro
│   ├── contact.astro
│   ├── portugues.astro
│   ├── privacy.astro
│   └── terms.astro
├── styles/
│   └── global.css                 # Tailwind base + font-face + global resets
└── lib/
    ├── jsonld.ts                  # Build LocalBusiness + MedicalBusiness object
    └── lazyEmbed.ts               # Intersection-observer lazy-load helper (Calendly, Behold, Maps)
```

### `public/`

```
public/
├── CNAME                          # Contents: jerseycbt.com (moved from repo root)
├── robots.txt                     # Allow all; sitemap URL
├── favicon.svg
├── og-default.jpg                 # 1200×630 default OG image
└── images/
    ├── profile.jpg                # Compressed from existing 1.4MB → ≤ 200KB
    ├── practice-exterior.jpg      # If photographer shoot lands; else Unsplash fallback
    └── conditions/                # One hero image per condition page
        ├── anxiety.jpg
        ├── depression.jpg
        ├── trauma-ptsd.jpg
        ├── ocd.jpg
        ├── relationships.jpg
        └── burnout.jpg
```

### `.github/workflows/`

```
.github/workflows/deploy.yml       # Build Astro → push dist/ to gh-pages branch
```

### Repo-root files removed at cutover (recoverable via `pre-redesign` tag)

- `index.html` (old single-page)
- `profile.jpg` at root (replaced by `public/images/profile.jpg`)
- `robots.txt` at root (replaced by `public/robots.txt`)
- `sitemap.xml` at root (replaced by Astro's auto-generated `dist/sitemap-*.xml`)
- The root-level `CNAME` is *moved* to `public/CNAME` so it ends up in `dist/`

---

# BUILD STREAM

## Phase B1: Foundation — branch, Astro scaffold, CI

### Task B1.1: Create `redesign` branch and pre-cutover tag

**Files:**
- No file changes; git state only

- [ ] **Step 1: Tag the current Master tip as the rollback point**

```bash
git tag pre-redesign
git push origin pre-redesign
```

Expected: tag created locally and pushed to remote.

- [ ] **Step 2: Create and switch to the `redesign` branch**

```bash
git checkout -b redesign
```

Expected: `git status` shows `On branch redesign`.

- [ ] **Step 3: Push the empty branch to origin so CI can target it**

```bash
git push -u origin redesign
```

Expected: branch tracked at `origin/redesign`.

---

### Task B1.2: Scaffold the Astro project at repo root

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `.nvmrc`
- Create: `src/pages/index.astro` (Astro placeholder, will be rewritten in B7)
- Modify: `.gitignore` (add `node_modules/`, `dist/`, `.astro/`)

- [ ] **Step 1: Pin Node version**

Write `.nvmrc`:

```
20
```

- [ ] **Step 2: Initialise `package.json`**

```bash
npm init -y
```

Then edit the generated `package.json` to look like this (overwrites the default):

```json
{
  "name": "jerseycbt",
  "type": "module",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "astro": "astro"
  }
}
```

- [ ] **Step 3: Install Astro and core integrations**

```bash
npm install astro@latest
npm install @astrojs/tailwind tailwindcss @astrojs/sitemap @astrojs/rss
npm install -D typescript @types/node
```

Expected: `package.json` `dependencies` lists `astro`, `@astrojs/tailwind`, `tailwindcss`, `@astrojs/sitemap`, `@astrojs/rss`; `devDependencies` lists `typescript`, `@types/node`.

- [ ] **Step 4: Write `astro.config.mjs`**

```js
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://jerseycbt.com',
  integrations: [
    tailwind({ applyBaseStyles: false }),
    sitemap(),
  ],
  build: {
    inlineStylesheets: 'auto',
  },
});
```

- [ ] **Step 5: Write `tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": ["src/**/*", "astro.config.mjs"]
}
```

- [ ] **Step 6: Extend `.gitignore`**

Append to the existing `.gitignore`:

```
node_modules/
dist/
.astro/
.env
.env.local
```

- [ ] **Step 7: Create a placeholder `src/pages/index.astro`**

```astro
---
// Placeholder home — replaced in Phase B7.
---
<html lang="en">
  <head><title>jerseycbt — redesign in progress</title></head>
  <body><p>Build scaffold OK.</p></body>
</html>
```

- [ ] **Step 8: Run the dev server to verify scaffold**

```bash
npm run dev
```

Expected: Astro starts on `http://localhost:4321`, serving the placeholder. Stop with Ctrl-C after confirming.

- [ ] **Step 9: Run a production build to verify pipeline**

```bash
npm run build
```

Expected: `dist/index.html` produced; no errors. Inspect `dist/` exists.

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json astro.config.mjs tsconfig.json .nvmrc .gitignore src/pages/index.astro
git commit -m "build: scaffold Astro project with Tailwind + sitemap integrations"
```

---

### Task B1.3: Move `CNAME` into `public/` so build output preserves the custom domain

**Files:**
- Create: `public/CNAME`
- Delete (at cutover, not now): root `CNAME`

- [ ] **Step 1: Create `public/CNAME` with the domain**

```
jerseycbt.com
```

(Exact content — no trailing newline issues. Astro copies `public/` straight into `dist/`.)

- [ ] **Step 2: Verify the build copies CNAME**

```bash
npm run build
test -f dist/CNAME && echo "CNAME in dist OK"
```

Expected: `CNAME in dist OK`.

- [ ] **Step 3: Commit (do NOT delete root CNAME yet — old site still uses it)**

```bash
git add public/CNAME
git commit -m "build: add CNAME to public/ for redesign build output"
```

---

### Task B1.4: GitHub Actions deploy to `gh-pages` branch

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Write the deploy workflow**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - Master
  workflow_dispatch:

permissions:
  contents: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm

      - run: npm ci

      - run: npm run build

      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
          publish_branch: gh-pages
          cname: jerseycbt.com
```

**Note for engineer:** the workflow triggers on push to `Master` (capital M, default branch). It will not fire during `redesign` development. Cutover (Phase L) merges `redesign` → `Master`, which is the *first* time this workflow runs. Pre-cutover verification happens locally via `npm run build` + `npm run preview`.

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: add GitHub Actions workflow to deploy Astro build to gh-pages"
```

---

## Phase B2: Design tokens, fonts, base layout

### Task B2.1: Tailwind config with v2 spec design tokens

**Files:**
- Create: `tailwind.config.mjs`
- Create: `src/styles/global.css`
- Modify: `src/pages/index.astro` (temporary — pull in `global.css` to verify)

- [ ] **Step 1: Write `tailwind.config.mjs`**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}'],
  theme: {
    extend: {
      colors: {
        cream:        '#fbfaf7',
        'warm-black': '#1a1612',
        'muted-cream':'#ece9e2',
        'subtle-text':'#5a4f3c',
        'body-text':  '#2a2620',
      },
      fontFamily: {
        serif: ['Charter', 'Georgia', 'serif'],
        sans:  ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '1px',
      },
      letterSpacing: {
        trust: '0.12em',
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 2: Write `src/styles/global.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Charter is licensed via Bitstream; the safe public path is Georgia fallback.
   We do NOT self-host Charter (no commercial-use-cleared free version exists).
   Browsers without Charter installed render Georgia — which is the spec intent. */

html { background-color: #fbfaf7; color: #2a2620; }
body { font-family: ui-sans-serif, system-ui, sans-serif; }
h1, h2, h3, h4 { font-family: Charter, Georgia, serif; color: #1a1612; }
```

- [ ] **Step 3: Wire `global.css` into the placeholder home temporarily**

Edit `src/pages/index.astro`:

```astro
---
import '../styles/global.css';
---
<html lang="en">
  <head><title>jerseycbt — redesign in progress</title></head>
  <body>
    <h1 class="text-3xl">Headline renders in serif</h1>
    <p class="text-subtle-text">Body renders in sans, subtle-text token works.</p>
  </body>
</html>
```

- [ ] **Step 4: Run dev and visually verify tokens render**

```bash
npm run dev
```

Open `http://localhost:4321`. Expected: page background cream, headline serif (Georgia on systems without Charter), body sans, paragraph text in the brown `#5a4f3c`. Stop the server.

- [ ] **Step 5: Commit**

```bash
git add tailwind.config.mjs src/styles/global.css src/pages/index.astro
git commit -m "style: add Tailwind design tokens (cream, warm-black) and global typography"
```

---

### Task B2.2: BaseLayout with `<head>`, JSON-LD slot, Plausible script, OG tag scaffolding

**Files:**
- Create: `src/layouts/BaseLayout.astro`
- Modify: `src/pages/index.astro` (use the new layout)

- [ ] **Step 1: Write `src/layouts/BaseLayout.astro`**

```astro
---
import '../styles/global.css';
import JsonLdSchema from '../components/JsonLdSchema.astro';

interface Props {
  title: string;
  description: string;
  ogImage?: string;
  canonical?: string;
  lang?: string;
}

const {
  title,
  description,
  ogImage = '/og-default.jpg',
  canonical,
  lang = 'en',
} = Astro.props;

const canonicalUrl = canonical ?? new URL(Astro.url.pathname, Astro.site).toString();
const ogImageUrl = new URL(ogImage, Astro.site).toString();
---
<!DOCTYPE html>
<html lang={lang}>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonicalUrl} />

    <meta property="og:type" content="website" />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={canonicalUrl} />
    <meta property="og:image" content={ogImageUrl} />
    <meta name="twitter:card" content="summary_large_image" />

    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />

    <JsonLdSchema />

    <!-- Plausible analytics; no cookies, no consent banner required under UK GDPR -->
    <script defer data-domain="jerseycbt.com" src="https://plausible.io/js/script.js"></script>
  </head>
  <body class="bg-cream text-body-text">
    <slot />
  </body>
</html>
```

- [ ] **Step 2: Create the JsonLdSchema component stub (will be expanded in B5.1)**

Create `src/components/JsonLdSchema.astro`:

```astro
---
// Placeholder — full LocalBusiness + MedicalBusiness JSON-LD lands in Task B5.1.
---
<!-- json-ld placeholder -->
```

- [ ] **Step 3: Convert `src/pages/index.astro` to use BaseLayout**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout
  title="jerseycbt — redesign in progress"
  description="Scaffold check.">
  <main class="max-w-3xl mx-auto p-8">
    <h1 class="text-3xl">BaseLayout works</h1>
    <p>Visible at /.</p>
  </main>
</BaseLayout>
```

- [ ] **Step 4: Build, verify, and inspect `dist/index.html` for OG tags + Plausible script**

```bash
npm run build
grep -c 'plausible.io' dist/index.html
grep -c 'og:title' dist/index.html
```

Expected: each grep returns `1` (or higher).

- [ ] **Step 5: Commit**

```bash
git add src/layouts/BaseLayout.astro src/components/JsonLdSchema.astro src/pages/index.astro
git commit -m "build: BaseLayout with OG tags, canonical, JSON-LD slot, Plausible"
```

---

## Phase B3: Component primitives

### Task B3.1: `CTAButton` (base) + `ConsultationCTA` + `SessionCTA` presets

**Files:**
- Create: `src/components/CTAButton.astro`
- Create: `src/components/ConsultationCTA.astro`
- Create: `src/components/SessionCTA.astro`

- [ ] **Step 1: Write `CTAButton.astro` (base button — used by both popup-trigger and link variants)**

```astro
---
interface Props {
  href?: string;
  variant?: 'primary' | 'ghost' | 'popup-trigger';
  class?: string;
  ['data-calendly-url']?: string;
}

const { href, variant = 'primary', class: classProp = '', ...rest } = Astro.props;

const base = 'inline-block px-6 py-3 font-sans text-sm tracking-trust uppercase border transition-colors';
const variants = {
  primary: 'bg-warm-black text-cream border-warm-black hover:bg-body-text',
  ghost: 'bg-transparent text-warm-black border-warm-black hover:bg-warm-black hover:text-cream',
  'popup-trigger': 'bg-warm-black text-cream border-warm-black hover:bg-body-text cursor-pointer',
};

const className = `${base} ${variants[variant]} ${classProp}`;
---
{href ? (
  <a href={href} class={className} {...rest}><slot /></a>
) : (
  <button type="button" class={className} {...rest}><slot /></button>
)}
```

- [ ] **Step 2: Write `ConsultationCTA.astro` (the site-wide primary CTA — wraps `CalendlyPopupButton`)**

```astro
---
import CalendlyPopupButton from './CalendlyPopupButton.astro';

interface Props {
  label?: string;
  class?: string;
}

const {
  label = 'Book a free 15-min consultation',
  class: classProp = '',
} = Astro.props;

// Calendly free 15-min consultation event URL.
// TODO_RODRIGO: replace once Calendly admin creates the free-consult event.
const CALENDLY_URL = 'https://calendly.com/rodsil/free-consultation';
---
<CalendlyPopupButton url={CALENDLY_URL} class={classProp}>{label}</CalendlyPopupButton>
```

- [ ] **Step 3: Write `SessionCTA.astro` (secondary CTA — paid initial 50-min session at £100)**

```astro
---
import CalendlyPopupButton from './CalendlyPopupButton.astro';

interface Props {
  label?: string;
  class?: string;
}

const {
  label = 'Book your initial session (50 min, £100)',
  class: classProp = '',
} = Astro.props;

const CALENDLY_URL = 'https://calendly.com/rodsil/cbt-session';
---
<CalendlyPopupButton url={CALENDLY_URL} class={classProp}>{label}</CalendlyPopupButton>
```

- [ ] **Step 4: Commit (note `CalendlyPopupButton` does not exist yet — next task)**

```bash
git add src/components/CTAButton.astro src/components/ConsultationCTA.astro src/components/SessionCTA.astro
git commit -m "feat: CTAButton primitives + ConsultationCTA/SessionCTA presets"
```

(The site will not build yet because `CalendlyPopupButton` is referenced — that's fine; B4.1 fixes it. We commit now so the diff is reviewable.)

---

## Phase B4: Calendly integration (lazy-loaded)

### Task B4.1: `CalendlyPopupButton` (modal trigger, lazy-loaded widget)

**Files:**
- Create: `src/components/CalendlyPopupButton.astro`

- [ ] **Step 1: Write `CalendlyPopupButton.astro`**

```astro
---
interface Props {
  url: string;
  class?: string;
}
const { url, class: classProp = '' } = Astro.props;
---
<button
  type="button"
  class={`inline-block px-6 py-3 font-sans text-sm tracking-trust uppercase border bg-warm-black text-cream border-warm-black hover:bg-body-text transition-colors ${classProp}`}
  data-calendly-url={url}
  data-calendly-popup
>
  <slot />
</button>

<script>
  // Lazy-load Calendly widget assets on first click, then open popup.
  // Subsequent clicks skip the load.
  let loaded = false;

  function ensureCalendlyLoaded() {
    if (loaded) return Promise.resolve();
    loaded = true;
    return new Promise<void>((resolve) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://assets.calendly.com/assets/external/widget.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.async = true;
      script.onload = () => resolve();
      document.body.appendChild(script);
    });
  }

  document.addEventListener('click', async (e) => {
    const target = e.target as HTMLElement;
    const btn = target.closest('[data-calendly-popup]') as HTMLElement | null;
    if (!btn) return;
    e.preventDefault();
    const url = btn.getAttribute('data-calendly-url');
    if (!url) return;
    await ensureCalendlyLoaded();
    // @ts-expect-error Calendly attaches at runtime
    window.Calendly?.initPopupWidget({ url });
  });
</script>
```

- [ ] **Step 2: Build to verify nothing is broken**

```bash
npm run build
```

Expected: build succeeds. `CTAButton`/`ConsultationCTA`/`SessionCTA` chain now resolves.

- [ ] **Step 3: Commit**

```bash
git add src/components/CalendlyPopupButton.astro
git commit -m "feat: CalendlyPopupButton with lazy-loaded widget assets on first click"
```

---

### Task B4.2: `CalendlyEmbed` (inline iframe, lazy via IntersectionObserver)

**Files:**
- Create: `src/lib/lazyEmbed.ts`
- Create: `src/components/CalendlyEmbed.astro`

- [ ] **Step 1: Write `src/lib/lazyEmbed.ts` (shared utility for Calendly/Behold/Maps)**

```ts
export function observeAndLoad(el: HTMLElement, load: () => void) {
  if (!('IntersectionObserver' in window)) { load(); return; }
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        io.disconnect();
        load();
        return;
      }
    }
  }, { rootMargin: '200px' });
  io.observe(el);
}
```

- [ ] **Step 2: Write `src/components/CalendlyEmbed.astro`**

```astro
---
interface Props {
  url: string;
  eventType?: 'consultation' | 'session';
  height?: number;
}
const { url, height = 700 } = Astro.props;
---
<div
  data-calendly-inline
  data-calendly-url={url}
  style={`min-height:${height}px`}
  class="w-full bg-muted-cream"
>
  <noscript>
    <p class="p-6 text-subtle-text">
      JavaScript is required to load the booking widget. Email rod.gui.sil@gmail.com to book.
    </p>
  </noscript>
</div>

<script>
  import { observeAndLoad } from '../lib/lazyEmbed';

  document.querySelectorAll<HTMLElement>('[data-calendly-inline]').forEach((host) => {
    observeAndLoad(host, () => {
      const url = host.getAttribute('data-calendly-url');
      if (!url) return;
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://assets.calendly.com/assets/external/widget.css';
      document.head.appendChild(link);
      const script = document.createElement('script');
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.async = true;
      script.onload = () => {
        // @ts-expect-error Calendly attaches at runtime
        window.Calendly?.initInlineWidget({ url, parentElement: host });
      };
      document.body.appendChild(script);
    });
  });
</script>
```

- [ ] **Step 3: Build, then dev-server smoke-test the popup**

```bash
npm run build
npm run dev
```

Add a temporary test button on `index.astro`:

```astro
<ConsultationCTA />
```

Open `http://localhost:4321/`, click the button, confirm Calendly modal opens (or — if the URL isn't real yet — confirm the network tab shows `widget.js` loading on click and not on initial page load). Stop the server. Revert the test button addition before commit.

- [ ] **Step 4: Commit**

```bash
git add src/lib/lazyEmbed.ts src/components/CalendlyEmbed.astro
git commit -m "feat: CalendlyEmbed with IntersectionObserver lazy-load"
```

---

## Phase B5: SEO infrastructure

### Task B5.1: JSON-LD `LocalBusiness` + `MedicalBusiness` schema

**Files:**
- Create: `src/lib/jsonld.ts`
- Modify: `src/components/JsonLdSchema.astro`

- [ ] **Step 1: Write `src/lib/jsonld.ts`**

```ts
export const PRACTICE = {
  name: 'Rodrigo Silva — CBT & CAT Psychotherapy',
  legalName: 'Rodrigo Silva Psychotherapy',
  url: 'https://jerseycbt.com',
  email: 'rod.gui.sil@gmail.com',
  telephone: '+44-1534-XXXXXX', // TODO_RODRIGO: confirm public phone
  address: {
    streetAddress: 'House 3, 8 Lewis St',
    addressLocality: 'St Helier',
    addressRegion: 'Jersey',
    postalCode: 'JE2 3PB',
    addressCountry: 'JE',
  },
  geo: {
    latitude: 49.1830,   // TODO_RODRIGO: confirm via Google Maps coordinates
    longitude: -2.1095,
  },
  openingHours: 'Mo-Fr 09:00-18:00', // TODO_RODRIGO: confirm
  languages: ['English', 'Portuguese'],
  founderCredentials: [
    'BABCP Accredited #101239',
    'ACAT Accredited',
    'MSc, PgDip CBT',
    '21+ years in NHS and private practice',
  ],
  insuranceAccepted: ['AXA', 'Aviva', 'Vitality', 'Aetna'], // TODO_RODRIGO: confirm/update
} as const;

export function buildJsonLd() {
  const localBusiness = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: PRACTICE.name,
    legalName: PRACTICE.legalName,
    url: PRACTICE.url,
    email: PRACTICE.email,
    telephone: PRACTICE.telephone,
    address: { '@type': 'PostalAddress', ...PRACTICE.address },
    geo: { '@type': 'GeoCoordinates', ...PRACTICE.geo },
    openingHours: PRACTICE.openingHours,
    knowsLanguage: PRACTICE.languages,
  };

  const medicalBusiness = {
    '@context': 'https://schema.org',
    '@type': 'MedicalBusiness',
    name: PRACTICE.name,
    url: PRACTICE.url,
    medicalSpecialty: 'Psychiatric',
    availableService: [
      { '@type': 'MedicalTherapy', name: 'Cognitive Behavioural Therapy (CBT)' },
      { '@type': 'MedicalTherapy', name: 'Cognitive Analytic Therapy (CAT)' },
    ],
  };

  return [localBusiness, medicalBusiness];
}
```

- [ ] **Step 2: Replace `src/components/JsonLdSchema.astro` with the real component**

```astro
---
import { buildJsonLd } from '../lib/jsonld';
const ld = buildJsonLd();
---
{ld.map((schema) => (
  <script type="application/ld+json" set:html={JSON.stringify(schema)} />
))}
```

- [ ] **Step 3: Build and validate JSON-LD in the output**

```bash
npm run build
grep -o 'application/ld+json' dist/index.html | wc -l
```

Expected: `2` (two JSON-LD blocks).

- [ ] **Step 4: Validate against Google's Rich Results Test offline check**

Open `dist/index.html`, extract the two `<script type="application/ld+json">` blocks, paste each into <https://search.google.com/test/rich-results> (browser, manual). Confirm both validate with zero errors.

If validation fails, the most likely cause is a missing required field — fix in `src/lib/jsonld.ts` and rebuild.

- [ ] **Step 5: Commit**

```bash
git add src/lib/jsonld.ts src/components/JsonLdSchema.astro
git commit -m "feat: LocalBusiness + MedicalBusiness JSON-LD schema in <head>"
```

---

### Task B5.2: Robots, RSS endpoint, sitemap verification

**Files:**
- Create: `public/robots.txt`
- Create: `src/pages/articles/rss.xml.js`

- [ ] **Step 1: Write `public/robots.txt`**

```
User-agent: *
Allow: /

Sitemap: https://jerseycbt.com/sitemap-index.xml
```

- [ ] **Step 2: Write the RSS endpoint stub for `/articles`**

`src/pages/articles/rss.xml.js`:

```js
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const articles = await getCollection('articles');
  const sorted = articles.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
  return rss({
    title: 'jerseycbt — Articles',
    description: 'Notes on CBT, CAT, and the things that get in the way.',
    site: context.site,
    items: sorted.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: `/articles/${post.slug}/`,
    })),
  });
}
```

**Note for engineer:** this won't build successfully until B6.1 defines the `articles` collection schema. Build verification deferred until then.

- [ ] **Step 3: Commit**

```bash
git add public/robots.txt src/pages/articles/rss.xml.js
git commit -m "seo: robots.txt + RSS endpoint stub for /articles"
```

---

## Phase B6: Content collections schema + content templates

### Task B6.1: Define `articles` + `conditions` collection schemas

**Files:**
- Create: `src/content/config.ts`

- [ ] **Step 1: Write `src/content/config.ts`**

```ts
import { defineCollection, z } from 'astro:content';

const articles = defineCollection({
  type: 'content',
  schema: ({ image }) => z.object({
    title: z.string().max(70),
    description: z.string().max(160),
    date: z.date(),
    hero: image().optional(),
    tags: z.array(z.string()).default([]),
    target_keyword: z.string(),
    draft: z.boolean().default(false),
  }),
});

const conditions = defineCollection({
  type: 'content',
  schema: ({ image }) => z.object({
    condition: z.string(),
    slug: z.string(),
    description: z.string().max(160),
    target_keyword: z.string(),
    sessions_typical: z.string(),
    hero: image().optional(),
    symptoms: z.array(z.string()).min(3).max(8),
    resources: z.array(z.object({
      label: z.string(),
      url: z.string().url(),
    })).min(1),
    draft: z.boolean().default(false),
  }),
});

export const collections = { articles, conditions };
```

- [ ] **Step 2: Create placeholder content files so the schema can be validated by the build**

Create `src/content/articles/cbt-vs-cat.md`:

```markdown
---
title: "CBT vs CAT — which therapy is right for me"
description: "Placeholder description — replaced in C2.1."
date: 2026-06-01
tags: ["cbt", "cat", "treatment-choice"]
target_keyword: "cbt vs cat"
draft: true
---

Placeholder body. Real prose lands in C2.1.
```

Create the same skeleton with appropriate frontmatter for the other 2 articles (`how-long-cbt-anxiety.md`, `first-therapy-session.md`) and 6 conditions (`anxiety.md`, `depression.md`, `trauma-ptsd.md`, `ocd.md`, `relationships.md`, `burnout.md`). For each condition, supply the required fields with placeholder strings — the body is a single placeholder paragraph.

Example condition skeleton (`src/content/conditions/anxiety.md`):

```markdown
---
condition: "Anxiety & GAD"
slug: "anxiety"
description: "Placeholder description for anxiety condition page — replaced in C4.1."
target_keyword: "anxiety therapy jersey"
sessions_typical: "8-16"
symptoms:
  - "Constant worry that's hard to switch off"
  - "Sleep disruption from racing thoughts"
  - "Physical tension, restlessness"
  - "Avoidance of situations that trigger worry"
resources:
  - label: "NHS — Generalised anxiety disorder"
    url: "https://www.nhs.uk/mental-health/conditions/generalised-anxiety-disorder/"
  - label: "Mind — Self-help for anxiety"
    url: "https://www.mind.org.uk/information-support/types-of-mental-health-problems/anxiety-and-panic-attacks/"
draft: true
---

Placeholder. Real content in C4.1.
```

- [ ] **Step 3: Build to validate the schemas accept all 9 placeholder files**

```bash
npm run build
```

Expected: build succeeds. If validation fails, Astro prints exactly which file violates which schema field — fix and rebuild.

- [ ] **Step 4: Commit**

```bash
git add src/content/config.ts src/content/articles/ src/content/conditions/
git commit -m "feat: content-collections schemas for articles + conditions, placeholder bodies"
```

---

### Task B6.2: `ArticlePage.astro` and `[slug].astro` dynamic route for articles

**Files:**
- Create: `src/components/ArticlePage.astro`
- Create: `src/pages/articles/[slug].astro`

- [ ] **Step 1: Write `src/components/ArticlePage.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import ConsultationCTA from './ConsultationCTA.astro';
import Nav from './Nav.astro';
import Footer from './Footer.astro';
import StickyBookButton from './StickyBookButton.astro';

interface Props {
  title: string;
  description: string;
  date: Date;
  hero?: ImageMetadata;
}
const { title, description, date } = Astro.props;
---
<BaseLayout title={`${title} — jerseycbt`} description={description}>
  <Nav />
  <article class="max-w-2xl mx-auto px-6 py-12">
    <header class="mb-10">
      <p class="text-xs tracking-trust uppercase text-subtle-text mb-3">
        {date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
      </p>
      <h1 class="font-serif text-4xl md:text-5xl leading-tight">{title}</h1>
    </header>
    <div class="prose prose-lg prose-stone max-w-none">
      <slot />
    </div>
    <div class="mt-16 border-t border-muted-cream pt-10">
      <ConsultationCTA />
    </div>
  </article>
  <Footer />
  <StickyBookButton />
</BaseLayout>
```

- [ ] **Step 2: Write `src/pages/articles/[slug].astro`**

```astro
---
import { getCollection } from 'astro:content';
import ArticlePage from '../../components/ArticlePage.astro';

export async function getStaticPaths() {
  const articles = await getCollection('articles', ({ data }) => !data.draft);
  return articles.map((article) => ({
    params: { slug: article.slug },
    props: { article },
  }));
}

const { article } = Astro.props;
const { Content } = await article.render();
---
<ArticlePage
  title={article.data.title}
  description={article.data.description}
  date={article.data.date}>
  <Content />
</ArticlePage>
```

- [ ] **Step 3: Flip one article's `draft: true` → `draft: false` so it renders, then build**

Edit `src/content/articles/cbt-vs-cat.md`: change `draft: true` → `draft: false`.

```bash
npm run build
test -f dist/articles/cbt-vs-cat/index.html && echo "Article route OK"
```

Expected: `Article route OK`.

- [ ] **Step 4: Revert draft flag (we want placeholder articles invisible until content lands)**

Re-edit `src/content/articles/cbt-vs-cat.md`: `draft: false` → `draft: true`.

- [ ] **Step 5: Commit**

```bash
git add src/components/ArticlePage.astro src/pages/articles/'[slug].astro' src/content/articles/cbt-vs-cat.md
git commit -m "feat: ArticlePage layout + dynamic [slug] route"
```

---

### Task B6.3: `ConditionPage.astro` (8-section template) + `[slug].astro` for conditions

**Files:**
- Create: `src/components/ConditionPage.astro`
- Create: `src/components/CaseVignette.astro`
- Create: `src/components/FAQ.astro`
- Create: `src/components/ResourceLinks.astro`
- Create: `src/pages/what-i-treat/[slug].astro`

- [ ] **Step 1: Write `src/components/CaseVignette.astro`**

```astro
---
interface Props { title?: string; }
const { title = 'A typical course of treatment' } = Astro.props;
---
<aside class="my-12 p-8 bg-muted-cream border-l-2 border-warm-black">
  <p class="text-xs tracking-trust uppercase text-subtle-text mb-3">{title}</p>
  <div class="font-serif text-lg leading-relaxed">
    <slot />
  </div>
  <p class="text-xs text-subtle-text mt-4 italic">
    Composite, anonymised. Not based on any individual client.
  </p>
</aside>
```

- [ ] **Step 2: Write `src/components/FAQ.astro`**

```astro
---
interface Props { items: Array<{ q: string; a: string }>; }
const { items } = Astro.props;
---
<dl class="my-10 space-y-6">
  {items.map((item) => (
    <div>
      <dt class="font-serif text-xl">{item.q}</dt>
      <dd class="mt-2 text-body-text leading-relaxed">{item.a}</dd>
    </div>
  ))}
</dl>
```

- [ ] **Step 3: Write `src/components/ResourceLinks.astro`**

```astro
---
interface Props { resources: Array<{ label: string; url: string }>; }
const { resources } = Astro.props;
---
<section class="mt-12 pt-8 border-t border-muted-cream">
  <h2 class="font-serif text-2xl mb-4">Where to learn more</h2>
  <ul class="space-y-2">
    {resources.map((r) => (
      <li>
        <a href={r.url} rel="noopener noreferrer" target="_blank"
           class="text-warm-black underline decoration-subtle-text underline-offset-4">
          {r.label}
        </a>
      </li>
    ))}
  </ul>
</section>
```

- [ ] **Step 4: Write `src/components/ConditionPage.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Nav from './Nav.astro';
import Footer from './Footer.astro';
import StickyBookButton from './StickyBookButton.astro';
import ConsultationCTA from './ConsultationCTA.astro';
import ResourceLinks from './ResourceLinks.astro';

interface Props {
  condition: string;
  description: string;
  symptoms: string[];
  sessionsTypical: string;
  resources: Array<{ label: string; url: string }>;
}
const { condition, description, symptoms, sessionsTypical, resources } = Astro.props;
---
<BaseLayout
  title={`${condition} therapy in Jersey — CBT & CAT — jerseycbt`}
  description={description}>
  <Nav />
  <article class="max-w-2xl mx-auto px-6 py-12">
    <header class="mb-10">
      <p class="text-xs tracking-trust uppercase text-subtle-text mb-3">What I Treat</p>
      <h1 class="font-serif text-4xl md:text-5xl leading-tight">{condition}</h1>
      <p class="mt-4 text-lg text-subtle-text">{description}</p>
      <p class="mt-2 text-sm text-subtle-text">
        Typical course: <strong>{sessionsTypical}</strong> sessions
      </p>
    </header>

    <aside class="my-10 p-6 bg-muted-cream">
      <p class="text-xs tracking-trust uppercase text-subtle-text mb-3">Common signs</p>
      <ul class="list-disc pl-5 space-y-1">
        {symptoms.map((s) => <li>{s}</li>)}
      </ul>
    </aside>

    <div class="prose prose-lg prose-stone max-w-none">
      <slot />
    </div>

    <div class="my-12 text-center">
      <ConsultationCTA />
    </div>

    <ResourceLinks resources={resources} />
  </article>
  <Footer />
  <StickyBookButton />
</BaseLayout>
```

- [ ] **Step 5: Write `src/pages/what-i-treat/[slug].astro`**

```astro
---
import { getCollection } from 'astro:content';
import ConditionPage from '../../components/ConditionPage.astro';

export async function getStaticPaths() {
  const conditions = await getCollection('conditions', ({ data }) => !data.draft);
  return conditions.map((c) => ({
    params: { slug: c.data.slug },
    props: { condition: c },
  }));
}

const { condition } = Astro.props;
const { Content } = await condition.render();
const { data } = condition;
---
<ConditionPage
  condition={data.condition}
  description={data.description}
  symptoms={data.symptoms}
  sessionsTypical={data.sessions_typical}
  resources={data.resources}>
  <Content />
</ConditionPage>
```

- [ ] **Step 6: Flip `anxiety.md` draft → false, build, verify**

Edit `src/content/conditions/anxiety.md`: `draft: true` → `draft: false`.

```bash
npm run build
test -f dist/what-i-treat/anxiety/index.html && echo "Condition route OK"
```

Expected: `Condition route OK`.

- [ ] **Step 7: Revert draft flag**

Re-edit `src/content/conditions/anxiety.md`: `draft: false` → `draft: true`.

- [ ] **Step 8: Commit**

```bash
git add src/components/ConditionPage.astro src/components/CaseVignette.astro src/components/FAQ.astro src/components/ResourceLinks.astro src/pages/what-i-treat/'[slug].astro' src/content/conditions/anxiety.md
git commit -m "feat: ConditionPage 8-section template + dynamic [slug] route"
```

---

## Phase B7: Page implementations

### Task B7.1: `Nav.astro` and `Footer.astro` (used by every page)

**Files:**
- Create: `src/components/Nav.astro`
- Create: `src/components/Footer.astro`

- [ ] **Step 1: Write `Nav.astro`**

```astro
---
const links = [
  { href: '/approach',     label: 'Approach' },
  { href: '/what-i-treat', label: 'What I Treat' },
  { href: '/about',        label: 'About' },
  { href: '/articles',     label: 'Articles' },
  { href: '/fees',         label: 'Fees' },
  { href: '/contact',      label: 'Contact' },
];
const current = Astro.url.pathname;
---
<header class="border-b border-muted-cream bg-cream">
  <nav class="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
    <a href="/" class="font-serif text-xl text-warm-black">jerseycbt</a>
    <ul class="hidden md:flex gap-7 text-sm">
      {links.map((l) => (
        <li>
          <a href={l.href}
             class={`hover:text-warm-black transition-colors ${
               current.startsWith(l.href) ? 'text-warm-black' : 'text-subtle-text'
             }`}>
            {l.label}
          </a>
        </li>
      ))}
    </ul>
    <a href="/book"
       class="md:hidden text-sm tracking-trust uppercase text-warm-black border border-warm-black px-3 py-1">
      Book
    </a>
  </nav>
</header>
```

**Note:** Mobile nav is intentionally minimal — single "Book" link is the spec's mobile-first conversion discipline. A full mobile drawer is out of scope; visitors navigate via in-page CTAs and the footer.

- [ ] **Step 2: Write `Footer.astro`**

```astro
---
import { PRACTICE } from '../lib/jsonld';
---
<footer class="mt-24 bg-muted-cream text-subtle-text text-sm">
  <div class="max-w-5xl mx-auto px-6 py-12 grid gap-8 md:grid-cols-3">
    <div>
      <p class="font-serif text-warm-black text-lg mb-2">Rodrigo Silva</p>
      <p>CBT & CAT Psychotherapy</p>
      <p>{PRACTICE.address.streetAddress}<br />
         {PRACTICE.address.addressLocality}, {PRACTICE.address.addressRegion}<br />
         {PRACTICE.address.postalCode}</p>
    </div>
    <div>
      <p class="uppercase tracking-trust text-xs mb-2">Accreditations</p>
      <ul class="space-y-1">
        <li>BABCP Accredited #101239</li>
        <li>ACAT Accredited</li>
        <li>MSc, PgDip CBT</li>
      </ul>
    </div>
    <div>
      <p class="uppercase tracking-trust text-xs mb-2">Contact</p>
      <ul class="space-y-1">
        <li><a href="/book" class="underline">Book</a></li>
        <li><a href="/contact" class="underline">Contact</a></li>
        <li><a href="/portugues" class="underline">Português</a></li>
        <li><a href="/privacy" class="underline">Privacy</a></li>
        <li><a href="/terms" class="underline">Terms</a></li>
      </ul>
    </div>
  </div>
  <div class="border-t border-cream py-4 text-center text-xs">
    © {new Date().getFullYear()} Rodrigo Silva. All rights reserved.
  </div>
</footer>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Nav.astro src/components/Footer.astro
git commit -m "feat: global Nav and Footer with practice address site-wide"
```

---

### Task B7.2: `StickyBookButton.astro` (mobile-only sticky CTA)

**Files:**
- Create: `src/components/StickyBookButton.astro`

- [ ] **Step 1: Write `StickyBookButton.astro`**

```astro
---
// Mobile-only sticky bottom-screen CTA. Appears after scroll past hero;
// dismissible. Hidden ≥ md breakpoint.
---
<div
  id="sticky-book"
  class="md:hidden fixed bottom-0 inset-x-0 bg-warm-black text-cream
         flex items-center justify-between px-4 py-3 translate-y-full
         transition-transform duration-300 z-50"
>
  <a href="/book" class="text-sm tracking-trust uppercase flex-1">
    Book a free 15-min consultation
  </a>
  <button id="sticky-book-dismiss"
          aria-label="Dismiss"
          class="ml-3 text-cream/80 hover:text-cream text-xl leading-none">
    ×
  </button>
</div>

<script>
  const el = document.getElementById('sticky-book');
  const dismissBtn = document.getElementById('sticky-book-dismiss');
  if (el && dismissBtn) {
    const DISMISS_KEY = 'sticky-book-dismissed';
    if (sessionStorage.getItem(DISMISS_KEY) === '1') {
      el.remove();
    } else {
      const onScroll = () => {
        if (window.scrollY > window.innerHeight * 0.6) {
          el.classList.remove('translate-y-full');
        }
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      dismissBtn.addEventListener('click', () => {
        sessionStorage.setItem(DISMISS_KEY, '1');
        el.classList.add('translate-y-full');
        setTimeout(() => el.remove(), 300);
      });
    }
  }
</script>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/StickyBookButton.astro
git commit -m "feat: StickyBookButton — mobile sticky CTA after scroll past hero"
```

---

### Task B7.3: `ConversionHero.astro` and the Home page

**Files:**
- Create: `src/components/ConversionHero.astro`
- Create: `src/components/TrustStrip.astro`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Write `ConversionHero.astro`**

```astro
---
import ConsultationCTA from './ConsultationCTA.astro';

interface Props {
  eyebrow: string;
  headline: string;
  subhead: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}
const {
  eyebrow,
  headline,
  subhead,
  secondaryHref = '/approach',
  secondaryLabel = 'Or read about how I work',
} = Astro.props;
---
<section class="bg-cream">
  <div class="max-w-5xl mx-auto px-6 pt-16 pb-12 md:pt-24 md:pb-20
              grid md:grid-cols-[2fr_1fr] gap-10 items-center">
    <div>
      <p class="text-xs tracking-trust uppercase text-subtle-text">{eyebrow}</p>
      <h1 class="mt-4 font-serif text-3xl md:text-5xl leading-tight text-warm-black">
        {headline}
      </h1>
      <p class="mt-4 text-lg text-body-text max-w-prose">{subhead}</p>
      <div class="mt-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <ConsultationCTA />
        <a href={secondaryHref}
           class="text-sm text-subtle-text underline decoration-subtle-text underline-offset-4">
          {secondaryLabel} →
        </a>
      </div>
    </div>
    <div class="hidden md:block">
      <img src="/images/profile.jpg" alt="Rodrigo Silva, psychotherapist"
           class="w-full aspect-[4/5] object-cover" loading="eager" />
    </div>
  </div>
</section>
```

- [ ] **Step 2: Write `TrustStrip.astro`**

```astro
---
const items = [
  'BABCP Accredited #101239',
  'ACAT Accredited',
  '21+ years in practice',
  'NHS + private background',
];
---
<section class="bg-muted-cream border-y border-cream">
  <div class="max-w-5xl mx-auto px-6 py-5 flex flex-wrap gap-x-8 gap-y-2 justify-center
              text-xs tracking-trust uppercase text-subtle-text">
    {items.map((t) => <span>{t}</span>)}
  </div>
</section>
```

- [ ] **Step 3: Rewrite `src/pages/index.astro` as the real Home page**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Nav from '../components/Nav.astro';
import Footer from '../components/Footer.astro';
import ConversionHero from '../components/ConversionHero.astro';
import TrustStrip from '../components/TrustStrip.astro';
import ConsultationCTA from '../components/ConsultationCTA.astro';
import StickyBookButton from '../components/StickyBookButton.astro';
---
<BaseLayout
  title="CBT & CAT Psychotherapy in Jersey — Rodrigo Silva — jerseycbt"
  description="BABCP & ACAT accredited CBT/CAT psychotherapist in St Helier, Jersey. 21+ years' experience. In person or online. Free 15-min consultation.">
  <Nav />

  <ConversionHero
    eyebrow="CBT & CAT Psychotherapy · St Helier, Jersey · Online across UK and Europe"
    headline="Considered psychotherapy for anxiety, depression, trauma, and burnout."
    subhead="BABCP & ACAT accredited. 21+ years in NHS and private practice. In person in Jersey or online." />

  <TrustStrip />

  <!-- Approach teaser -->
  <section class="max-w-3xl mx-auto px-6 py-20">
    <p class="text-xs tracking-trust uppercase text-subtle-text">How I work</p>
    <h2 class="mt-2 font-serif text-3xl text-warm-black">
      {/* CONTENT_C1_HOME_APPROACH_INTRO */}
      Two evidence-based models, one practitioner.
    </h2>
    <p class="mt-4 text-body-text leading-relaxed">
      {/* CONTENT_C1_HOME_APPROACH_BODY — 80–120 words on CBT vs CAT, replaced in C1.1 */}
      Placeholder. CBT focuses on the patterns of thought and behaviour that maintain
      distress today. CAT looks at the relational patterns laid down earlier in life
      that keep showing up under stress. Most of my clients benefit from a blend.
    </p>
    <a href="/approach" class="mt-6 inline-block text-warm-black underline underline-offset-4">
      Read more about my approach →
    </a>
  </section>

  <!-- Conditions teaser -->
  <section class="bg-muted-cream py-20">
    <div class="max-w-3xl mx-auto px-6">
      <p class="text-xs tracking-trust uppercase text-subtle-text">What I treat</p>
      <h2 class="mt-2 font-serif text-3xl text-warm-black">
        {/* CONTENT_C1_HOME_CONDITIONS_INTRO */}
        Common reasons people come to see me.
      </h2>
      <ul class="mt-6 grid gap-3 sm:grid-cols-2 text-body-text">
        <li><a href="/what-i-treat/anxiety"        class="underline underline-offset-4">Anxiety & GAD</a></li>
        <li><a href="/what-i-treat/depression"     class="underline underline-offset-4">Depression</a></li>
        <li><a href="/what-i-treat/trauma-ptsd"    class="underline underline-offset-4">Trauma & PTSD</a></li>
        <li><a href="/what-i-treat/ocd"            class="underline underline-offset-4">OCD</a></li>
        <li><a href="/what-i-treat/relationships"  class="underline underline-offset-4">Relationships</a></li>
        <li><a href="/what-i-treat/burnout"        class="underline underline-offset-4">Burnout</a></li>
      </ul>
      <a href="/what-i-treat" class="mt-8 inline-block text-warm-black underline underline-offset-4">
        See the full list →
      </a>
    </div>
  </section>

  <!-- Closing CTA -->
  <section class="max-w-2xl mx-auto px-6 py-20 text-center">
    <p class="font-serif text-2xl text-warm-black">
      {/* CONTENT_C1_HOME_CLOSING — 25–40 words, replaced in C1.1 */}
      Not sure if therapy with me is the right fit? A free 15-min consultation
      is the easiest way to find out.
    </p>
    <div class="mt-6"><ConsultationCTA /></div>
  </section>

  <Footer />
  <StickyBookButton />
</BaseLayout>
```

- [ ] **Step 4: Build and visually verify**

```bash
npm run build
npm run preview
```

Open `http://localhost:4321/` and confirm: hero renders with CTA, trust strip below, two teaser sections, closing CTA, footer, sticky CTA appears on mobile breakpoint after scrolling past hero. Stop.

- [ ] **Step 5: Commit**

```bash
git add src/components/ConversionHero.astro src/components/TrustStrip.astro src/pages/index.astro
git commit -m "feat: Home page with ConversionHero, TrustStrip, condition teasers, closing CTA"
```

---

### Task B7.4: `/approach`, `/about`, `/articles` index, `/what-i-treat` index

**Files:**
- Create: `src/pages/approach.astro`
- Create: `src/pages/about.astro`
- Create: `src/pages/articles/index.astro`
- Create: `src/pages/what-i-treat/index.astro`
- Create: `src/components/LanguageNote.astro`
- Create: `src/components/ArticleCard.astro`
- Create: `src/components/ConditionCard.astro`

- [ ] **Step 1: Write `LanguageNote.astro`**

```astro
---
---
<aside class="mt-10 inline-block border border-muted-cream px-4 py-2 text-sm text-subtle-text">
  Sessions available in English and Portuguese. <a href="/portugues" class="underline">Mais em português →</a>
</aside>
```

- [ ] **Step 2: Write `ArticleCard.astro`**

```astro
---
interface Props {
  href: string;
  title: string;
  description: string;
  date: Date;
}
const { href, title, description, date } = Astro.props;
---
<a href={href} class="block py-6 border-b border-muted-cream group">
  <p class="text-xs tracking-trust uppercase text-subtle-text">
    {date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
  </p>
  <h3 class="mt-2 font-serif text-2xl text-warm-black group-hover:underline underline-offset-4">{title}</h3>
  <p class="mt-2 text-body-text">{description}</p>
</a>
```

- [ ] **Step 3: Write `ConditionCard.astro`**

```astro
---
interface Props { href: string; title: string; description: string; }
const { href, title, description } = Astro.props;
---
<a href={href} class="block p-6 border border-muted-cream hover:border-warm-black transition-colors">
  <h3 class="font-serif text-xl text-warm-black">{title}</h3>
  <p class="mt-2 text-body-text text-sm">{description}</p>
</a>
```

- [ ] **Step 4: Write `src/pages/approach.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Nav from '../components/Nav.astro';
import Footer from '../components/Footer.astro';
import ConsultationCTA from '../components/ConsultationCTA.astro';
import LanguageNote from '../components/LanguageNote.astro';
import StickyBookButton from '../components/StickyBookButton.astro';
---
<BaseLayout
  title="My approach — CBT vs CAT — jerseycbt"
  description="How I work: CBT for current patterns, CAT for relational ones. What to expect from sessions and how to know if we're a fit.">
  <Nav />
  <main class="max-w-2xl mx-auto px-6 py-16">
    <h1 class="font-serif text-4xl md:text-5xl text-warm-black">My approach</h1>

    <section class="prose prose-lg prose-stone max-w-none mt-10">
      {/* CONTENT_C1_APPROACH_BODY — ~400 words, replaced in C1.1 */}
      <p>Placeholder. Real prose lands in C1.1.</p>
      <h2>Two evidence-based models</h2>
      <p>Placeholder section on CBT.</p>
      <p>Placeholder section on CAT.</p>
      <h2>What sessions look like</h2>
      <p>Placeholder.</p>
      <h2>How to know if we're a fit</h2>
      <p>Placeholder.</p>
    </section>

    <LanguageNote />

    <div class="mt-12">
      <ConsultationCTA />
    </div>
  </main>
  <Footer />
  <StickyBookButton />
</BaseLayout>
```

- [ ] **Step 5: Write `src/pages/about.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Nav from '../components/Nav.astro';
import Footer from '../components/Footer.astro';
import ConsultationCTA from '../components/ConsultationCTA.astro';
import LanguageNote from '../components/LanguageNote.astro';
import StickyBookButton from '../components/StickyBookButton.astro';
---
<BaseLayout
  title="About Rodrigo Silva — jerseycbt"
  description="BABCP & ACAT accredited CBT/CAT psychotherapist in Jersey. 21+ years in NHS and private practice. MSc, PgDip CBT.">
  <Nav />
  <main class="max-w-2xl mx-auto px-6 py-16">
    <h1 class="font-serif text-4xl md:text-5xl text-warm-black">About</h1>
    <img src="/images/profile.jpg" alt="Rodrigo Silva" class="my-10 w-full aspect-[4/5] object-cover" />

    <section class="prose prose-lg prose-stone max-w-none">
      {/* CONTENT_C1_ABOUT_BODY — ~350 words, replaced in C1.1 */}
      <p>Placeholder. Real bio lands in C1.1.</p>
      <h2>Training and accreditations</h2>
      <ul>
        <li>BABCP Accredited (#101239)</li>
        <li>ACAT Accredited</li>
        <li>MSc Psychology</li>
        <li>PgDip Cognitive Behavioural Therapy</li>
      </ul>
      <h2>Experience</h2>
      <p>Placeholder.</p>
    </section>

    <LanguageNote />

    <div class="mt-12">
      <ConsultationCTA />
    </div>
  </main>
  <Footer />
  <StickyBookButton />
</BaseLayout>
```

- [ ] **Step 6: Write `src/pages/articles/index.astro`**

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import Nav from '../../components/Nav.astro';
import Footer from '../../components/Footer.astro';
import ArticleCard from '../../components/ArticleCard.astro';
import InstagramGrid from '../../components/InstagramGrid.astro';
import StickyBookButton from '../../components/StickyBookButton.astro';

const articles = (await getCollection('articles', ({ data }) => !data.draft))
  .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
---
<BaseLayout
  title="Articles — notes on CBT, CAT, and what gets in the way — jerseycbt"
  description="Short articles on CBT, CAT, anxiety, depression, trauma, and the practical questions clients bring to a first session.">
  <Nav />
  <main class="max-w-2xl mx-auto px-6 py-16">
    <h1 class="font-serif text-4xl md:text-5xl text-warm-black">Articles</h1>
    <p class="mt-4 text-subtle-text">
      Short, practical writing on CBT, CAT, and the questions that come up before a first session.
    </p>

    <section class="mt-12">
      {articles.length === 0 ? (
        <p class="text-subtle-text italic">First articles publishing soon.</p>
      ) : (
        articles.map((a) => (
          <ArticleCard
            href={`/articles/${a.slug}/`}
            title={a.data.title}
            description={a.data.description}
            date={a.data.date} />
        ))
      )}
    </section>

    <section class="mt-20">
      <h2 class="font-serif text-2xl text-warm-black">On Instagram</h2>
      <InstagramGrid />
    </section>
  </main>
  <Footer />
  <StickyBookButton />
</BaseLayout>
```

- [ ] **Step 7: Write `src/pages/what-i-treat/index.astro`**

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import Nav from '../../components/Nav.astro';
import Footer from '../../components/Footer.astro';
import ConditionCard from '../../components/ConditionCard.astro';
import ConsultationCTA from '../../components/ConsultationCTA.astro';
import StickyBookButton from '../../components/StickyBookButton.astro';

const conditions = (await getCollection('conditions', ({ data }) => !data.draft))
  .sort((a, b) => a.data.condition.localeCompare(b.data.condition));

const secondary = [
  'Anger management', 'Addictions', 'Sleep', 'Self-esteem',
  'Phobias', 'Grief', 'Personality patterns', 'Social anxiety',
  'Panic', 'Health anxiety',
];
---
<BaseLayout
  title="What I treat — CBT & CAT for anxiety, depression, trauma — jerseycbt"
  description="Conditions I commonly work with: anxiety, depression, trauma, OCD, relationship difficulties, burnout, and more. CBT or CAT, in Jersey or online.">
  <Nav />
  <main class="max-w-3xl mx-auto px-6 py-16">
    <h1 class="font-serif text-4xl md:text-5xl text-warm-black">What I treat</h1>
    <p class="mt-4 text-subtle-text">
      The six areas below get their own page with treatment specifics. I also work with the conditions listed at the bottom — please get in touch if yours isn't shown.
    </p>

    <section class="mt-12 grid gap-4 sm:grid-cols-2">
      {conditions.map((c) => (
        <ConditionCard
          href={`/what-i-treat/${c.data.slug}/`}
          title={c.data.condition}
          description={c.data.description} />
      ))}
    </section>

    <section class="mt-16">
      <h2 class="font-serif text-2xl text-warm-black">Other areas I work with</h2>
      <ul class="mt-4 grid gap-2 sm:grid-cols-2 text-body-text">
        {secondary.map((s) => <li>· {s}</li>)}
      </ul>
    </section>

    <div class="mt-16 text-center">
      <ConsultationCTA />
    </div>
  </main>
  <Footer />
  <StickyBookButton />
</BaseLayout>
```

- [ ] **Step 8: Commit**

```bash
git add src/components/LanguageNote.astro src/components/ArticleCard.astro src/components/ConditionCard.astro src/pages/approach.astro src/pages/about.astro src/pages/articles/index.astro src/pages/what-i-treat/index.astro
git commit -m "feat: /approach, /about, /articles index, /what-i-treat index"
```

---

### Task B7.5: `/fees`, `/book`, `/contact`, `/portugues`, `/privacy`, `/terms`

**Files:**
- Create: `src/components/PriceTable.astro`
- Create: `src/components/InsuranceLogos.astro`
- Create: `src/components/ContactForm.astro`
- Create: `src/components/GoogleMap.astro`
- Create: `src/components/InstagramGrid.astro`
- Create: `src/pages/fees.astro`
- Create: `src/pages/book.astro`
- Create: `src/pages/contact.astro`
- Create: `src/pages/portugues.astro`
- Create: `src/pages/privacy.astro`
- Create: `src/pages/terms.astro`

- [ ] **Step 1: Write `PriceTable.astro`**

```astro
---
const rows = [
  { service: 'Free 15-min consultation',     price: 'Free',  duration: 'Fit/screening call' },
  { service: 'Initial 50-min session',        price: '£100',  duration: 'First paid clinical session' },
  { service: 'Standard 50-min session',       price: '£100',  duration: 'Per session, ongoing' },
];
---
<table class="w-full mt-8 text-left border-collapse">
  <thead>
    <tr class="border-b border-warm-black text-xs tracking-trust uppercase text-subtle-text">
      <th class="py-3">Service</th>
      <th class="py-3 hidden sm:table-cell">Notes</th>
      <th class="py-3 text-right">Price</th>
    </tr>
  </thead>
  <tbody>
    {rows.map((r) => (
      <tr class="border-b border-muted-cream">
        <td class="py-4 font-serif text-warm-black">{r.service}</td>
        <td class="py-4 text-subtle-text text-sm hidden sm:table-cell">{r.duration}</td>
        <td class="py-4 text-right font-mono">{r.price}</td>
      </tr>
    ))}
  </tbody>
</table>
```

- [ ] **Step 2: Write `InsuranceLogos.astro`**

```astro
---
// TODO_RODRIGO: confirm/update insurance providers. Logos placed as plain text
// at launch; replace with image assets once Rodrigo provides them or licenses
// allow re-use.
const providers = ['AXA', 'Aviva', 'Vitality', 'Aetna'];
---
<section class="mt-12 p-6 bg-muted-cream">
  <p class="text-xs tracking-trust uppercase text-subtle-text mb-3">Accepted insurance</p>
  <ul class="flex flex-wrap gap-x-8 gap-y-2 text-warm-black font-serif text-lg">
    {providers.map((p) => <li>{p}</li>)}
  </ul>
</section>
```

- [ ] **Step 3: Write `ContactForm.astro`**

```astro
---
// TODO_RODRIGO: replace FORMSPREE_ENDPOINT with the actual Formspree form URL
// after creating the form in Formspree (https://formspree.io → New Form).
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/PLACEHOLDER';
---
<form action={FORMSPREE_ENDPOINT} method="POST" class="mt-8 space-y-5">
  <input type="text" name="_gotcha" tabindex="-1" autocomplete="off"
         class="absolute -left-[9999px] opacity-0" aria-hidden="true" />

  <label class="block">
    <span class="text-xs tracking-trust uppercase text-subtle-text">Your name</span>
    <input type="text" name="name" required
           class="mt-2 w-full border border-muted-cream bg-cream px-3 py-2 focus:border-warm-black outline-none" />
  </label>

  <label class="block">
    <span class="text-xs tracking-trust uppercase text-subtle-text">Email</span>
    <input type="email" name="email" required
           class="mt-2 w-full border border-muted-cream bg-cream px-3 py-2 focus:border-warm-black outline-none" />
  </label>

  <label class="block">
    <span class="text-xs tracking-trust uppercase text-subtle-text">Message</span>
    <textarea name="message" rows="5" required
              class="mt-2 w-full border border-muted-cream bg-cream px-3 py-2 focus:border-warm-black outline-none"></textarea>
  </label>

  <button type="submit"
          class="inline-block px-6 py-3 font-sans text-sm tracking-trust uppercase
                 border border-warm-black bg-warm-black text-cream hover:bg-body-text">
    Send message
  </button>
</form>
```

- [ ] **Step 4: Write `GoogleMap.astro` (static-image → click-to-load real map)**

```astro
---
import { PRACTICE } from '../lib/jsonld';
const { latitude, longitude } = PRACTICE.geo;
// TODO_RODRIGO: replace the static-image src with a Google Maps Static API URL
// (requires API key) OR keep this OpenStreetMap-style preview to avoid the key.
// For launch, we use a placeholder OpenStreetMap tile URL — no key needed, no
// session tracking concerns. Click-to-load swaps in the real Google Maps iframe.
const previewSrc = `https://staticmap.openstreetmap.de/staticmap.php?center=${latitude},${longitude}&zoom=15&size=600x300&markers=${latitude},${longitude},red-pushpin`;
const iframeSrc = `https://www.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`;
---
<div data-map-host class="relative mt-8 aspect-[2/1] w-full bg-muted-cream cursor-pointer overflow-hidden">
  <img src={previewSrc} alt="Map showing practice location"
       class="w-full h-full object-cover" loading="lazy" />
  <button type="button"
          class="absolute inset-0 w-full h-full flex items-center justify-center
                 bg-warm-black/50 text-cream text-sm tracking-trust uppercase"
          data-map-trigger
          data-iframe-src={iframeSrc}>
    Click to load interactive map
  </button>
</div>

<script>
  document.querySelectorAll<HTMLElement>('[data-map-trigger]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const host = btn.closest('[data-map-host]');
      if (!host) return;
      const src = btn.getAttribute('data-iframe-src');
      if (!src) return;
      host.innerHTML = `<iframe src="${src}" class="w-full h-full border-0" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`;
    });
  });
</script>
```

- [ ] **Step 5: Write `InstagramGrid.astro`**

```astro
---
// TODO_RODRIGO: replace BEHOLD_ID with the real Behold.so widget ID once
// configured at https://behold.so. The script tag below pulls in Behold's
// renderer which then mounts the grid in the <div data-behold-id>.
const BEHOLD_ID = 'PLACEHOLDER_BEHOLD_ID';
---
<div data-behold-id={BEHOLD_ID} class="my-8 min-h-[200px]"></div>
<script>
  const host = document.querySelector('[data-behold-id]');
  if (host) {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          observer.disconnect();
          const s = document.createElement('script');
          s.src = `https://w.behold.so/widget.js`;
          s.type = 'module';
          document.body.appendChild(s);
          return;
        }
      }
    }, { rootMargin: '200px' });
    observer.observe(host);
  }
</script>
```

- [ ] **Step 6: Write `src/pages/fees.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Nav from '../components/Nav.astro';
import Footer from '../components/Footer.astro';
import PriceTable from '../components/PriceTable.astro';
import InsuranceLogos from '../components/InsuranceLogos.astro';
import ConsultationCTA from '../components/ConsultationCTA.astro';
import SessionCTA from '../components/SessionCTA.astro';
import StickyBookButton from '../components/StickyBookButton.astro';
---
<BaseLayout
  title="Fees & insurance — jerseycbt"
  description="Standard session £100 in Jersey or online. Free 15-min consultation. AXA, Aviva, Vitality, Aetna accepted.">
  <Nav />
  <main class="max-w-2xl mx-auto px-6 py-16">
    <h1 class="font-serif text-4xl md:text-5xl text-warm-black">Fees</h1>
    <p class="mt-4 text-subtle-text">
      {/* CONTENT_C1_FEES_INTRO — short paragraph; replaced in C1.1 */}
      Transparent pricing. The free 15-min consultation is a fit call — no clinical advice, just a chance to see if how I work is right for what you're bringing.
    </p>

    <PriceTable />

    <section class="mt-12 prose prose-stone max-w-none">
      <h2>Typical course length</h2>
      <p>
        {/* CONTENT_C1_FEES_COURSE — ~80 words; replaced in C1.1 */}
        Placeholder. Most clients work with me for 8–16 sessions depending on what they're bringing.
      </p>
    </section>

    <InsuranceLogos />

    <div class="mt-12 flex flex-col sm:flex-row gap-4">
      <ConsultationCTA />
      <SessionCTA />
    </div>
  </main>
  <Footer />
  <StickyBookButton />
</BaseLayout>
```

- [ ] **Step 7: Write `src/pages/book.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Nav from '../components/Nav.astro';
import Footer from '../components/Footer.astro';
import CalendlyEmbed from '../components/CalendlyEmbed.astro';
import StickyBookButton from '../components/StickyBookButton.astro';

const CONSULT_URL = 'https://calendly.com/rodsil/free-consultation';
const SESSION_URL = 'https://calendly.com/rodsil/cbt-session';
---
<BaseLayout
  title="Book — jerseycbt"
  description="Book a free 15-min consultation or an initial 50-min session (£100). In person in Jersey or online.">
  <Nav />
  <main class="max-w-3xl mx-auto px-6 py-16">
    <h1 class="font-serif text-4xl md:text-5xl text-warm-black">Book</h1>

    <section class="mt-10">
      <h2 class="font-serif text-2xl text-warm-black">Free 15-min consultation</h2>
      <p class="mt-2 text-subtle-text">
        A fit / screening call — no clinical advice in the 15 minutes. We cover what you're bringing, whether CBT or CAT is likely a good fit, and how I work.
      </p>
      <CalendlyEmbed url={CONSULT_URL} />
    </section>

    <section class="mt-16">
      <h2 class="font-serif text-2xl text-warm-black">Initial 50-min session — £100</h2>
      <p class="mt-2 text-subtle-text">
        First paid clinical session. Standard ongoing sessions are also £100.
      </p>
      <CalendlyEmbed url={SESSION_URL} />
    </section>

    <p class="mt-12 text-sm text-subtle-text">
      If the booking widget doesn't load, email <a href="mailto:rod.gui.sil@gmail.com" class="underline">rod.gui.sil@gmail.com</a>.
    </p>
  </main>
  <Footer />
  <StickyBookButton />
</BaseLayout>
```

- [ ] **Step 8: Write `src/pages/contact.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Nav from '../components/Nav.astro';
import Footer from '../components/Footer.astro';
import ContactForm from '../components/ContactForm.astro';
import GoogleMap from '../components/GoogleMap.astro';
import StickyBookButton from '../components/StickyBookButton.astro';
import { PRACTICE } from '../lib/jsonld';
---
<BaseLayout
  title="Contact — jerseycbt"
  description="Get in touch — message form, email, or visit the practice in St Helier, Jersey.">
  <Nav />
  <main class="max-w-2xl mx-auto px-6 py-16">
    <h1 class="font-serif text-4xl md:text-5xl text-warm-black">Contact</h1>
    <p class="mt-4 text-subtle-text">
      Quickest way to start is to book a <a href="/book" class="underline">free 15-min consultation</a>. Otherwise:
    </p>

    <ContactForm />

    <section class="mt-12">
      <p class="text-xs tracking-trust uppercase text-subtle-text">Practice address</p>
      <p class="mt-2 font-serif text-warm-black">
        {PRACTICE.address.streetAddress}<br />
        {PRACTICE.address.addressLocality}, {PRACTICE.address.addressRegion}<br />
        {PRACTICE.address.postalCode}
      </p>
      <GoogleMap />
    </section>

    <p class="mt-8 text-sm text-subtle-text">
      Email <a href="mailto:rod.gui.sil@gmail.com" class="underline">rod.gui.sil@gmail.com</a>
    </p>
  </main>
  <Footer />
  <StickyBookButton />
</BaseLayout>
```

- [ ] **Step 9: Write `src/pages/portugues.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Nav from '../components/Nav.astro';
import Footer from '../components/Footer.astro';
import ConsultationCTA from '../components/ConsultationCTA.astro';
import StickyBookButton from '../components/StickyBookButton.astro';
---
<BaseLayout
  lang="pt"
  title="Psicoterapia em português — Jersey & online — jerseycbt"
  description="Psicoterapeuta acreditado (BABCP & ACAT) com sessões em inglês e português. Jersey ou online. Consulta gratuita de 15 minutos.">
  <Nav />
  <main class="max-w-2xl mx-auto px-6 py-16">
    <h1 class="font-serif text-4xl md:text-5xl text-warm-black">Psicoterapia em português</h1>

    <section class="prose prose-lg prose-stone max-w-none mt-10">
      {/* CONTENT_C3_PORTUGUES_BODY — ~600 words; replaced in C3.1 */}
      <p>Placeholder. Real Portuguese-language copy lands in C3.1.</p>
      <h2>Quem sou</h2>
      <p>Placeholder.</p>
      <h2>O que trato</h2>
      <p>Placeholder.</p>
      <h2>Como trabalho</h2>
      <p>Placeholder.</p>
      <h2>Línguas</h2>
      <p>Sessões em inglês (prática principal) e português (nativo).</p>
    </section>

    <div class="mt-12">
      <ConsultationCTA label="Agendar consulta gratuita de 15 minutos" />
    </div>
  </main>
  <Footer />
  <StickyBookButton />
</BaseLayout>
```

- [ ] **Step 10: Write `src/pages/privacy.astro` and `src/pages/terms.astro` placeholders**

`src/pages/privacy.astro`:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Nav from '../components/Nav.astro';
import Footer from '../components/Footer.astro';
---
<BaseLayout title="Privacy — jerseycbt" description="Privacy policy for jerseycbt.com.">
  <Nav />
  <main class="max-w-2xl mx-auto px-6 py-16 prose prose-stone max-w-none">
    <h1>Privacy</h1>
    {/* CONTENT_C1_PRIVACY — drafted in C1.1 from standard therapy templates */}
    <p>Placeholder. Real privacy policy lands in C1.1 using a standard UK therapy-practice template, reviewed before publish.</p>
  </main>
  <Footer />
</BaseLayout>
```

`src/pages/terms.astro`:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Nav from '../components/Nav.astro';
import Footer from '../components/Footer.astro';
---
<BaseLayout title="Terms — jerseycbt" description="Terms and conditions for jerseycbt.com.">
  <Nav />
  <main class="max-w-2xl mx-auto px-6 py-16 prose prose-stone max-w-none">
    <h1>Terms</h1>
    {/* CONTENT_C1_TERMS — drafted in C1.1 from standard therapy templates */}
    <p>Placeholder. Real terms land in C1.1 using a standard UK therapy-practice template, reviewed before publish.</p>
  </main>
  <Footer />
</BaseLayout>
```

- [ ] **Step 11: Build and click through every page in `npm run preview`**

```bash
npm run build
npm run preview
```

Visit each route:
- `/`
- `/approach`
- `/about`
- `/articles`
- `/what-i-treat`
- `/fees`
- `/book`
- `/contact`
- `/portugues`
- `/privacy`
- `/terms`

Expected: each page renders with Nav, content, Footer, no console errors. Stop the server.

- [ ] **Step 12: Commit**

```bash
git add src/components/PriceTable.astro src/components/InsuranceLogos.astro src/components/ContactForm.astro src/components/GoogleMap.astro src/components/InstagramGrid.astro src/pages/fees.astro src/pages/book.astro src/pages/contact.astro src/pages/portugues.astro src/pages/privacy.astro src/pages/terms.astro
git commit -m "feat: /fees, /book, /contact, /portugues, /privacy, /terms with integrations"
```

---

## Phase B8: Image pipeline and asset prep

### Task B8.1: Compress `profile.jpg` and move into `public/images/`

**Files:**
- Create: `public/images/profile.jpg` (compressed)
- Delete (at cutover): root `profile.jpg`

- [ ] **Step 1: Compress the existing `profile.jpg` (1.4 MB) to ≤ 200 KB**

```bash
mkdir -p public/images
```

Use any image tool. On Windows with `magick` (ImageMagick) installed:

```bash
magick profile.jpg -resize 800x1000^ -gravity center -extent 800x1000 -quality 78 -strip public/images/profile.jpg
```

If ImageMagick is not installed, use <https://squoosh.app> (drag-and-drop) — export at MozJPEG q=78, max dimension 800 px.

Verify size:

```bash
ls -lh public/images/profile.jpg
```

Expected: `< 200K`.

- [ ] **Step 2: Commit**

```bash
git add public/images/profile.jpg
git commit -m "asset: compressed profile.jpg into public/images (≤ 200KB)"
```

---

### Task B8.2: Default OG image and favicon

**Files:**
- Create: `public/og-default.jpg` (1200×630)
- Create: `public/favicon.svg`

- [ ] **Step 1: Create `public/og-default.jpg`**

Use a free image editor (Figma, Photopea, Squoosh) to make a 1200×630 jpg with the cream background, warm-black serif text "Rodrigo Silva — CBT & CAT — jerseycbt.com". Keep ≤ 100 KB. Drop at `public/og-default.jpg`.

If a final design isn't ready, use a temporary solid-color cream rectangle with text rendered via the Astro build (a future task) — for launch, a simple JPEG with the text suffices.

- [ ] **Step 2: Create `public/favicon.svg`**

Simple SVG:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" fill="#fbfaf7"/>
  <text x="16" y="22" text-anchor="middle" font-family="Georgia, serif"
        font-size="20" fill="#1a1612">j</text>
</svg>
```

- [ ] **Step 3: Build and verify both are referenced in the output**

```bash
npm run build
test -f dist/og-default.jpg && test -f dist/favicon.svg && echo "Assets OK"
grep 'og-default.jpg' dist/index.html >/dev/null && echo "OG ref OK"
```

Expected: `Assets OK` and `OG ref OK`.

- [ ] **Step 4: Commit**

```bash
git add public/og-default.jpg public/favicon.svg
git commit -m "asset: default OG image and favicon"
```

---

## Phase B9: Mobile polish, accessibility, performance verification

### Task B9.1: Per-page OG image overrides (where helpful)

**Files:**
- Modify: `src/components/ArticlePage.astro`, `src/components/ConditionPage.astro`

- [ ] **Step 1: Wire each article's `hero` image into the BaseLayout `ogImage` prop**

In `src/components/ArticlePage.astro`, accept the hero as a prop and forward to BaseLayout. (If the article has no hero, BaseLayout falls back to `/og-default.jpg`.)

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
// ...
interface Props {
  title: string;
  description: string;
  date: Date;
  hero?: { src: string; width: number; height: number } | undefined;
}
const { title, description, date, hero } = Astro.props;
---
<BaseLayout
  title={`${title} — jerseycbt`}
  description={description}
  ogImage={hero?.src}>
  <!-- rest unchanged -->
</BaseLayout>
```

Update `src/pages/articles/[slug].astro` to pass `article.data.hero` to `ArticlePage`.

- [ ] **Step 2: Apply the same pattern to `ConditionPage.astro` and `src/pages/what-i-treat/[slug].astro`**

- [ ] **Step 3: Build, then spot-check a built article page to confirm `og:image` uses the per-page hero when set**

```bash
npm run build
# After C2 writes the heroes, this can be re-verified:
# grep 'og:image' dist/articles/cbt-vs-cat/index.html
```

- [ ] **Step 4: Commit**

```bash
git add src/components/ArticlePage.astro src/components/ConditionPage.astro src/pages/articles/'[slug].astro' src/pages/what-i-treat/'[slug].astro'
git commit -m "seo: per-page OG image overrides from article/condition heroes"
```

---

### Task B9.2: Accessibility audit pass

**Files:** No file changes initially; fixes inline as audit surfaces them.

- [ ] **Step 1: Install `pa11y-ci` for automated A11y checks**

```bash
npm install -D pa11y-ci
```

- [ ] **Step 2: Add a `pa11yci` config**

Create `.pa11yci`:

```json
{
  "defaults": {
    "standard": "WCAG2AA",
    "timeout": 30000,
    "wait": 500
  },
  "urls": [
    "http://localhost:4321/",
    "http://localhost:4321/approach",
    "http://localhost:4321/about",
    "http://localhost:4321/articles",
    "http://localhost:4321/what-i-treat",
    "http://localhost:4321/fees",
    "http://localhost:4321/book",
    "http://localhost:4321/contact",
    "http://localhost:4321/portugues"
  ]
}
```

- [ ] **Step 3: Add an npm script to run the audit against the preview server**

In `package.json`, add to `scripts`:

```json
"a11y": "pa11y-ci"
```

- [ ] **Step 4: Run the audit**

```bash
npm run build
npm run preview &     # background; capture the PID if needed
sleep 3
npm run a11y
# stop preview server with Ctrl-C or kill the bg job
```

Expected: `0 errors` across all 9 URLs. If errors surface, the most common ones for a fresh build are:
- Missing `alt` on images → add `alt=""` for decorative, descriptive alt otherwise
- Insufficient color contrast on `text-subtle-text` body copy → check against `bg-cream` with a contrast checker (e.g., <https://webaim.org/resources/contrastchecker/>); `#5a4f3c` on `#fbfaf7` is 7.5:1 — passes AA, no change needed
- Form labels not associated → add `for`/`id` pairs where needed

Fix any issues inline and re-run until clean.

- [ ] **Step 5: Commit**

```bash
git add .pa11yci package.json package-lock.json
# plus any inline a11y fixes
git commit -m "test: pa11y-ci accessibility audit configured and passing"
```

---

### Task B9.3: Lighthouse performance verification (real-device mobile)

**Files:** None — this is a verification gate.

- [ ] **Step 1: Build and start preview server**

```bash
npm run build
npm run preview
```

- [ ] **Step 2: Use Chrome DevTools → Lighthouse, profile "Mobile" with "Simulated throttling"**

Run Lighthouse on:
- `http://localhost:4321/`
- `http://localhost:4321/what-i-treat/anxiety` (flip its draft to false temporarily if still drafted)
- `http://localhost:4321/articles/cbt-vs-cat` (flip its draft to false temporarily if still drafted)

Targets per v2 spec:
- Performance ≥ 90
- Accessibility ≥ 95
- SEO ≥ 95
- Best Practices ≥ 90

- [ ] **Step 3: If Performance < 90, common fixes**

Most likely culprits at this point:
- **Largest Contentful Paint**: hero image — confirm `loading="eager"` + the compressed `profile.jpg`. Consider replacing the desktop hero `<img>` with Astro's `<Image>` component (built-in) for automatic WebP + responsive `srcset`.
- **Total Blocking Time**: Plausible script — already `defer`, fine. Calendly only loads on click — fine.
- **Cumulative Layout Shift**: ensure `aspect-[4/5]` wrappers around hero image so the layout reserves space before image load.

If Astro `<Image>` is needed, replace `<img src="/images/profile.jpg">` with:

```astro
---
import { Image } from 'astro:assets';
import profileImg from '../../public/images/profile.jpg';
---
<Image src={profileImg} alt="Rodrigo Silva, psychotherapist" widths={[400, 800]} sizes="(max-width: 768px) 100vw, 400px" />
```

(Move `profile.jpg` to `src/assets/` if Astro's `<Image>` is used; `public/` images bypass the optimizer.)

- [ ] **Step 4: Run on a real device once dev preview is stable**

Tunnel the preview with `npx serve dist -l 4321` and `cloudflared tunnel --url http://localhost:4321` (or use the GitHub Pages URL after first CI deploy in B10). Open Lighthouse from Chrome on an iPhone or Android via remote debugging, profile against the device. Targets the same.

This is the v2 spec's mandated **"Lighthouse mobile run on a throttled-4G profile, not localhost; tested on at least one actual phone"** acceptance criterion.

- [ ] **Step 5: Record the Lighthouse run as a screenshot in the repo for posterity**

Save the desktop and mobile Lighthouse panels as screenshots in `docs/superpowers/lighthouse/`:

```bash
mkdir -p docs/superpowers/lighthouse
# save screenshots as e.g. 2026-MM-DD-home-mobile.png
```

- [ ] **Step 6: Commit (if any code/image changes were needed to hit the targets)**

```bash
git add .
git commit -m "perf: Lighthouse Performance ≥ 90 / A11y ≥ 95 on mobile"
```

---

## Phase B10: GitHub Pages source switch and pre-cutover smoke

### Task B10.1: Configure GitHub Pages source = `gh-pages` branch

**Files:** None — GitHub repo settings (manual step).

- [ ] **Step 1: In GitHub repo settings → Pages**

Set:
- **Source**: "Deploy from a branch"
- **Branch**: `gh-pages` / `(root)`

Save. (Until the first workflow run creates the `gh-pages` branch, this option may not be selectable; if so, defer this step to *after* the first Master push triggers the workflow.)

- [ ] **Step 2: Verify the current live site is still served from `Master` root**

Visit `https://jerseycbt.com` in a browser. Expected: the old `index.html` still loads. The redesign is invisible to visitors until cutover (Phase L).

---

### Task B10.2: Pre-cutover smoke — build, preview, link check

**Files:** None.

- [ ] **Step 1: Clean build from scratch**

```bash
rm -rf dist node_modules .astro
npm ci
npm run build
```

Expected: no errors, no warnings about missing content.

- [ ] **Step 2: Local link check**

```bash
npx linkinator dist --recurse --skip "calendly.com|behold.so|formspree.io|maps.google.com|plausible.io"
```

Expected: 0 broken internal links. The `--skip` flags exclude integrations we know require network/auth.

- [ ] **Step 3: Sitemap inspection**

```bash
test -f dist/sitemap-index.xml && echo "Sitemap OK"
cat dist/sitemap-0.xml | grep -c '<url>'
```

Expected: `Sitemap OK` and a URL count matching the number of non-draft pages (home + 6 non-draft pages on dev so far + any non-draft content collection entries).

- [ ] **Step 4: Commit anything outstanding**

```bash
git status
# If clean, proceed to content stream. If not, commit.
```

---

# CONTENT STREAM

> The content stream runs in parallel with the build stream once **B6.1** lands (the content-collections schema). Each task here produces prose against the placeholder markdown files that already exist. **Content tasks are word-budgeted, not time-budgeted** — a 1,000-word condition page is a multi-hour writing session, not a 5-minute step. Verify by word count + structure + voice, not by clock.

> **Voice notes (apply to everything):**
> - Second person ("you"), not clinical third person
> - Specific over general — "constant worry that's hard to switch off" not "anxious feelings"
> - No textbook DSM language — translate symptoms into how they feel day to day
> - Symmetric CBT-and-CAT framing on every condition page (locked decision A in v2 spec)
> - Show, don't oversell — confidence comes from accreditations + specificity, not adjectives
> - No direct testimonials in any form (BABCP/ACAT ethics)

## Phase C1: Sitewide copy (~1,500 words)

### Task C1.1: Home page copy

**Files:**
- Modify: `src/pages/index.astro` (replace the three `/* CONTENT_C1_HOME_* */` placeholders)

- [ ] **Step 1: Write `/* CONTENT_C1_HOME_APPROACH_INTRO */` — 1 line headline replacement (≤ 12 words)**

Replace the placeholder:

```
Two evidence-based models, one practitioner.
```

with a final version that pairs with the body paragraph below. Keep ≤ 12 words; serif headline; speaks to the CBT/CAT differentiator.

- [ ] **Step 2: Write `/* CONTENT_C1_HOME_APPROACH_BODY */` — 80–120 words on CBT vs CAT**

Address both models in roughly equal weight. End with a line that invites the reader to `/approach` for more.

- [ ] **Step 3: Write `/* CONTENT_C1_HOME_CONDITIONS_INTRO */` — 1 line headline (≤ 12 words)**

Replace `Common reasons people come to see me.` with a final version.

- [ ] **Step 4: Write `/* CONTENT_C1_HOME_CLOSING */` — 25–40 words closing reassurance**

Replace the placeholder with a final closing paragraph. Should make the free consultation feel like a low-stakes next step, without minimising what the visitor is going through.

- [ ] **Step 5: Build and visually verify on `npm run preview`**

```bash
npm run build && npm run preview
```

- [ ] **Step 6: Commit**

```bash
git add src/pages/index.astro
git commit -m "content: home page copy (approach intro/body, conditions intro, closing CTA)"
```

---

### Task C1.2: `/approach` body — ~400 words

**Files:**
- Modify: `src/pages/approach.astro` (replace `/* CONTENT_C1_APPROACH_BODY */` block)

- [ ] **Step 1: Draft the body in four H2 sections**

1. **Two evidence-based models** — 100 words covering both CBT and CAT, side by side. End with the rule of thumb for which clients tend to find each more useful.
2. **What sessions look like** — 100 words. Frequency, structure of a typical session, how the assessment phase differs from the working phase, between-session work.
3. **How to know if we're a fit** — 100 words. What kinds of problems I tend to be good at, what I refer on, when someone might be better served by a different model or modality.
4. **A note on language** — 100 words. Sessions in English (primary) and Portuguese (native). Then a link to `/portugues` for Portuguese-speaking readers.

- [ ] **Step 2: Paste into `src/pages/approach.astro`, removing the placeholder block**

- [ ] **Step 3: Build and verify, then commit**

```bash
npm run build
git add src/pages/approach.astro
git commit -m "content: /approach body — CBT/CAT, sessions, fit, language"
```

---

### Task C1.3: `/about` body — ~350 words

**Files:**
- Modify: `src/pages/about.astro`

- [ ] **Step 1: Draft three sections**

1. **Opening bio** — 150 words. First-person, who you are professionally, the through-line from NHS to private. Avoid full CV recitation — pick the formative experiences.
2. **Training and accreditations** — bullet list is fine; expanded version below the list as a short paragraph (50 words) on why those accreditations matter to clients (BABCP / ACAT public registers, complaint mechanisms, continuing supervision).
3. **Experience** — 150 words on the range of presentations and contexts you've worked in (NHS settings, private practice, online vs in-person), without naming employers if confidentiality is a concern.

- [ ] **Step 2: Paste, remove placeholder, build, commit**

```bash
npm run build
git add src/pages/about.astro
git commit -m "content: /about body — bio, accreditations, experience"
```

---

### Task C1.4: `/fees` copy

**Files:**
- Modify: `src/pages/fees.astro` (`/* CONTENT_C1_FEES_INTRO */`, `/* CONTENT_C1_FEES_COURSE */`)

- [ ] **Step 1: Replace intro — 40–60 words**

Frame the free 15-min consultation as a fit call (locked screening-only framing). State that £100 is the standard session rate for both initial and ongoing sessions.

- [ ] **Step 2: Replace `Typical course length` body — 80–120 words**

Discuss 8–16 sessions as the typical range, the factors that move it up or down (severity, goals, model used), and what "ending well" looks like (planned ending, not drop-off).

- [ ] **Step 3: Build, commit**

```bash
npm run build
git add src/pages/fees.astro
git commit -m "content: /fees intro and course-length explainer"
```

---

### Task C1.5: `/contact` micro-copy (optional polish)

**Files:**
- Modify: `src/pages/contact.astro`

- [ ] **Step 1: Polish the intro line and the form labels if they read clinically**

The default labels ("Your name", "Email", "Message") are fine. The intro line currently says: "Quickest way to start is to book a free 15-min consultation." Adjust voice as needed.

- [ ] **Step 2: Commit if changed**

```bash
git add src/pages/contact.astro
git commit -m "content: /contact micro-copy polish"
```

---

### Task C1.6: `/privacy` and `/terms` — drafted from standard therapy templates

**Files:**
- Modify: `src/pages/privacy.astro`, `src/pages/terms.astro`

- [ ] **Step 1: Use a UK-therapy-practice standard template for privacy policy**

References for Rodrigo:
- BACP example: <https://www.bacp.co.uk> (member resources)
- ICO guidance: <https://ico.org.uk/for-organisations/sme-web-hub/>

Required sections: data controller, what data we collect (contact form, booking via Calendly, analytics via Plausible — note Plausible is cookie-less), how we use it, third-party processors (Calendly, Formspree, Plausible, Behold, GitHub), retention, subject rights, contact for complaints.

- [ ] **Step 2: Use a standard template for terms**

Required sections: practice scope (not a crisis service), confidentiality limits (safeguarding, court orders), cancellation policy, fees, complaints (BABCP/ACAT routes).

- [ ] **Step 3: Rodrigo reviews both before publish**

This is the v2 spec's "drafted during implementation using standard therapy templates, reviewed by Rodrigo before publish" clause. Do not skip review.

- [ ] **Step 4: Commit**

```bash
git add src/pages/privacy.astro src/pages/terms.astro
git commit -m "content: /privacy and /terms — drafted from standard therapy templates"
```

---

## Phase C2: Launch articles (~2,100 words total)

### Task C2.1: Article 1 — "CBT vs CAT — which therapy is right for me"

**Files:**
- Modify: `src/content/articles/cbt-vs-cat.md`

- [ ] **Step 1: Replace frontmatter and body**

```markdown
---
title: "CBT vs CAT — which therapy is right for me"
description: "When CBT is the right call, when CAT is, and how a single practitioner uses both."
date: 2026-06-01
tags: ["cbt", "cat", "treatment-choice"]
target_keyword: "cbt vs cat"
draft: false
---

[Body — ~700 words, structured roughly as:]

## What CBT actually does

[~150 words. Concrete: identifies patterns of thought and behaviour that maintain a problem today, tests them in the world, replaces what doesn't work. Most useful for: specific, present-tense problems with clear triggers.]

## What CAT actually does

[~150 words. Maps the relational patterns laid down earlier in life that keep showing up under stress. Reformulation letter, recognising "reciprocal roles." Most useful for: longstanding patterns that resist the symptom-focused approach.]

## How to tell which is likely to be a better fit for you

[~200 words. Concrete decision-aiding questions: How long has this been going on? Does it show up in one situation or across many relationships? Have you tried CBT-style work before and felt it didn't reach the root? Have you tried open-ended exploratory therapy and felt it didn't change anything in your week?]

## When the answer is "both"

[~150 words. Many clients benefit from a blend — CBT-style skill-building in the first phase, CAT-style relational work where patterns are clearly relational. Argue for picking a practitioner trained in both rather than guessing which model.]

## Want help deciding?

[~50 words. Soft CTA — a free 15-min consultation is the easiest way to talk it through.]
```

- [ ] **Step 2: Build and visually verify the rendered article**

```bash
npm run build && npm run preview
```

Visit `/articles/cbt-vs-cat/`. Confirm formatting, headings render in serif, body in prose, CTA at the bottom.

- [ ] **Step 3: Commit**

```bash
git add src/content/articles/cbt-vs-cat.md
git commit -m "content: launch article — CBT vs CAT, which therapy is right for me"
```

---

### Task C2.2: Article 2 — "How long does CBT for anxiety take"

**Files:**
- Modify: `src/content/articles/how-long-cbt-anxiety.md`

- [ ] **Step 1: Replace frontmatter + body — ~700 words**

```markdown
---
title: "How long does CBT for anxiety take?"
description: "A working answer on the typical course length for CBT for generalised anxiety, and the factors that move it up or down."
date: 2026-06-15
tags: ["anxiety", "cbt", "treatment-length"]
target_keyword: "how long does cbt for anxiety take"
draft: false
---

[Body sections, ~700 words total:]

## The short answer

[~80 words. NICE / BABCP-aligned typical course is 8–16 sessions for moderate anxiety. Severe anxiety, comorbidity, or trauma-driven anxiety extends this.]

## What "a session" actually involves

[~150 words. 50 minutes, weekly typical, assessment phase (1–3 sessions), formulation, working phase, ending phase.]

## What moves the count up

[~150 words. Severity, comorbidity (depression, OCD, trauma), avoidance patterns that are hard to test in vivo, life crises during therapy.]

## What moves it down

[~150 words. Mild-to-moderate, clear focal problem, willingness to do between-session work, supportive context.]

## What to do if you're stuck around session 8 and not better

[~150 words. Honest conversation with your therapist about reformulation, the role of CAT for relational layers, when a different modality is the right call.]

## Want to talk through your case?

[~30 words. Free 15-min consult.]
```

- [ ] **Step 2: Build, verify, commit**

```bash
npm run build
git add src/content/articles/how-long-cbt-anxiety.md
git commit -m "content: launch article — how long does CBT for anxiety take"
```

---

### Task C2.3: Article 3 — "What happens in your first therapy session"

**Files:**
- Modify: `src/content/articles/first-therapy-session.md`

- [ ] **Step 1: Replace frontmatter + body — ~700 words**

```markdown
---
title: "What happens in your first therapy session"
description: "What to expect from your first session — practical, demystifying, no jargon."
date: 2026-06-30
tags: ["first-session", "what-to-expect", "cbt", "cat"]
target_keyword: "what happens in your first therapy session"
draft: false
---

[Body sections, ~700 words total:]

## Before the session

[~120 words. Practical: how to find the room (or set up the video link), what to bring, whether to write anything down, how to think about what you want to say.]

## The first few minutes

[~100 words. Settling in, confidentiality limits, fees, cancellation policy, signed paperwork if needed.]

## The bulk of the first session

[~250 words. Assessment phase: open question about what brought you in today, history of the presenting issue, what you've tried before, what has and hasn't helped. Not a clinical interview — more like a structured conversation. You don't have to tell your whole life story.]

## What I do at the end of the session

[~120 words. Initial formulation (working hypothesis, not a verdict), discussion of likely shape of treatment, agreement on whether to continue.]

## Things people often worry about

[~80 words. "Will I cry?" "Will you judge me?" "What if I don't know what to say?" — each answered honestly in one sentence.]

## Book your first session

[~30 words. Soft CTA to the free 15-min consult or initial session.]
```

- [ ] **Step 2: Build, verify, commit**

```bash
npm run build
git add src/content/articles/first-therapy-session.md
git commit -m "content: launch article — what happens in your first therapy session"
```

---

## Phase C3: Portuguese landing page (~600 words)

### Task C3.1: `/portugues` Portuguese-language copy

**Files:**
- Modify: `src/pages/portugues.astro` (replace `/* CONTENT_C3_PORTUGUES_BODY */`)

- [ ] **Step 1: Write the body in 5 H2 sections, in Portuguese**

1. **Quem sou** — 100 words. Rodrigo's bio in Portuguese; credentials translated; framing for the Portuguese-speaking client.
2. **O que trato** — 150 words. Conditions named in Portuguese (ansiedade, depressão, trauma e PTSD, OCD/TOC, dificuldades nos relacionamentos, burnout/esgotamento). Brief gloss on what CBT (TCC) and CAT mean in this market.
3. **Como trabalho** — 100 words. Sessions structure; "Sessions in person in Jersey or online across Portugal and Brazil."
4. **Línguas** — 80 words. Sessions in English (primary) and Portuguese (native). Reassurance for the Portuguese-speaking expat / online client.
5. **Onde aprender mais** — 100 words. Curated Portuguese-language mental health resources (or NHS / Mind in Portuguese where good Portuguese options aren't available), with a brief note in Portuguese.

Final CTA: "Agendar consulta gratuita de 15 minutos" — already wired in the page.

- [ ] **Step 2: Rodrigo (native PT speaker) reviews the translation himself**

This is not a step a non-native writer can verify. The implementation engineer cannot ship Portuguese copy without Rodrigo's review.

- [ ] **Step 3: Commit**

```bash
git add src/pages/portugues.astro
git commit -m "content: /portugues — ~600 words Portuguese landing page"
```

---

## Phase C4: Condition pages, batch 1 (anxiety, depression, trauma-ptsd) — ~3,000 words

> Each condition page follows the 8-section body structure from the v2 spec:
> 1. What it is
> 2. What it feels like day to day
> 3. Why it happens
> 4. How CBT works with this
> 5. How CAT works with this — and when CAT vs CBT
> 6. What treatment looks like
> 7. Common questions (3–5 FAQs)
> 8. CTA (rendered by template, not by the markdown body)
>
> Plus one `<CaseVignette>` and one `<FAQ items={...}>` embedded in the body.
>
> `<ResourceLinks>` is rendered automatically by `ConditionPage.astro` from frontmatter — body does not need to repeat resources.

### Task C4.1: Anxiety condition page (~1,000 words)

**Files:**
- Modify: `src/content/conditions/anxiety.md`

- [ ] **Step 1: Replace frontmatter (already mostly correct from B6.1) — flip `draft: false`**

- [ ] **Step 2: Write the 8-section body — ~1,000 words**

Use the prompt below as a brief, not a template to fill in literally:

```
## What it is
[~100 words. Reader-experience first: not "Generalised Anxiety Disorder is a clinical syndrome characterised by...". Instead: "When anxiety becomes the texture of your week...". End with one sentence on the clinical label so people searching for it land here.]

## What it feels like day to day
[~150 words. Expand the symptoms list from frontmatter into lived experience — the racing thoughts at 3am, the cancelled plans, the physical knot in the chest, the avoidance that quietly shrinks your life.]

## Why it happens
[~100 words. Brief, accessible. Threat-detection systems that get stuck on. No jargon-laden etiology — keep it usable.]

## How CBT works with anxiety
[~150 words. Specific: identifying the loop (trigger → thought → feeling → behaviour → consequence). Worry postponement. Behavioural experiments. Imaginal exposure where avoidance is central. What homework looks like in the first three sessions vs sessions 6 onward.]

## How CAT works with anxiety — and when CAT vs CBT
[~150 words. Symmetric depth. Reformulation letter mapping how anxiety connects to relational patterns (e.g., the "should be perfect" voice of a critical parent showing up as performance anxiety). When CAT becomes the right next move: longstanding anxiety with relational roots that CBT has touched but not resolved.]

## What treatment looks like
[~150 words. Session count (8–16), what session 1 vs session 4 vs session 12 look like, how progress is measured, what an ending looks like.]

<CaseVignette>
[~100 words. Composite anonymised — "A typical course of treatment for anxiety might look like..." Generalised, never identifiable.]
</CaseVignette>

## Common questions
<FAQ items={[
  { q: "Will I have to talk about my childhood?", a: "..." },
  { q: "What if I cry?", a: "..." },
  { q: "What if it doesn't work for me?", a: "..." },
  { q: "How do I know if I'm bad enough to need therapy?", a: "..." },
  { q: "Is online therapy as good as in person for anxiety?", a: "..." },
]} />
```

(MDX is required to embed components — confirm `@astrojs/mdx` is installed if using `<CaseVignette>` and `<FAQ>` directly in markdown. If pure markdown is preferred, render the vignette and FAQ via a separate Astro component above/below `<Content />` in `ConditionPage.astro`, populated from frontmatter — but the v2 spec is happy either way; choose MDX for content readability.)

- [ ] **Step 3: If MDX is required, install and configure**

```bash
npm install @astrojs/mdx
```

Edit `astro.config.mjs`:

```js
import mdx from '@astrojs/mdx';
// ...
integrations: [tailwind({ applyBaseStyles: false }), sitemap(), mdx()],
```

Rename `src/content/conditions/anxiety.md` → `src/content/conditions/anxiety.mdx` if using components. (Update content collection schema if file-extension matters — the schema is content-driven, so renaming works.)

Add the import at the top of the MDX file:

```mdx
import CaseVignette from '../../components/CaseVignette.astro';
import FAQ from '../../components/FAQ.astro';
```

- [ ] **Step 4: Build, visually verify, commit**

```bash
npm run build && npm run preview
# Visit /what-i-treat/anxiety
git add src/content/conditions/anxiety.* astro.config.mjs package.json package-lock.json
git commit -m "content: condition page — anxiety (~1,000 words, MDX with vignette + FAQ)"
```

---

### Task C4.2: Depression condition page (~1,000 words)

**Files:**
- Modify: `src/content/conditions/depression.md` (or `.mdx` if MDX added in C4.1)

- [ ] **Step 1: Mirror C4.1 structure for depression**

Same 8-section structure. Replace the symptoms list and the CBT/CAT framing with depression-specific content. Symptoms list update:

```yaml
symptoms:
  - "Persistent low mood that flattens enjoyment"
  - "Loss of motivation for things that used to matter"
  - "Sleep and appetite changes"
  - "Self-critical thoughts that feel like facts"
  - "Withdrawal from people and activities"
```

Resources update (Mind / NHS depression-specific URLs).

Replace target_keyword with `"depression therapy jersey"`.

Body sections cover behavioural activation (the canonical CBT-for-depression move), Beck's cognitive triad as the cognitive layer, and CAT's relational framing of self-critical voices.

- [ ] **Step 2: Build, verify, commit**

```bash
npm run build
git add src/content/conditions/depression.*
git commit -m "content: condition page — depression (~1,000 words)"
```

---

### Task C4.3: Trauma & PTSD condition page (~1,000 words)

**Files:**
- Modify: `src/content/conditions/trauma-ptsd.md` (or `.mdx`)

- [ ] **Step 1: Mirror C4.1 structure for trauma**

Same 8-section structure. Trauma-specific CBT modalities (trauma-focused CBT, EMDR if Rodrigo offers it, prolonged exposure). CAT particularly relevant where complex trauma has shaped relational patterns. Be explicit about scope — single-incident vs complex; what's in scope for the practice and what gets referred to specialist trauma services.

Frontmatter:

```yaml
condition: "Trauma & PTSD"
slug: "trauma-ptsd"
description: "CBT and CAT for single-incident trauma, PTSD, and complex relational trauma — in Jersey or online."
target_keyword: "trauma therapy jersey"
sessions_typical: "12-20"
symptoms:
  - "Flashbacks or vivid memories you can't switch off"
  - "Hyperarousal — startled easily, hard to relax"
  - "Avoidance of reminders of what happened"
  - "Numbing — feeling disconnected from yourself or others"
  - "Sleep disturbance and nightmares"
```

Resources: NHS PTSD page, Mind trauma resources, PTSD UK.

- [ ] **Step 2: Build, verify, commit**

```bash
npm run build
git add src/content/conditions/trauma-ptsd.*
git commit -m "content: condition page — trauma & PTSD (~1,000 words)"
```

---

## Phase C5: Condition pages, batch 2 (OCD, relationships, burnout) — ~3,000 words

> **Batch 2 may ship within 30 days post-launch per the v2 spec compromise.** If launch deadline pressure exists, ship Launch (Phase L) with these three pages still drafted (`draft: true`), then complete C5.1–C5.3 in a follow-up push.

### Task C5.1: OCD condition page (~1,000 words)

**Files:**
- Modify: `src/content/conditions/ocd.md` (or `.mdx`)

- [ ] **Step 1: Mirror C4.1 structure for OCD**

CBT-for-OCD is largely Exposure and Response Prevention (ERP) — be specific about what ERP looks like in practice. CAT is less commonly first-line for OCD but useful where the OCD content connects to relational patterns (e.g., responsibility / contamination themes linked to early caregiving). Acknowledge this explicitly per v2 spec's symmetric-CAT requirement.

Frontmatter:

```yaml
condition: "OCD"
slug: "ocd"
description: "CBT (with ERP) and CAT for OCD — intrusive thoughts, compulsions, and the relational layers underneath."
target_keyword: "ocd therapy jersey"
sessions_typical: "12-20"
symptoms:
  - "Intrusive thoughts that feel out of character"
  - "Compulsive checking, washing, counting, or mental rituals"
  - "Difficulty tolerating uncertainty"
  - "Hours-per-day lost to compulsions"
  - "Avoidance of triggering situations"
```

- [ ] **Step 2: Build, verify, commit**

```bash
npm run build
git add src/content/conditions/ocd.*
git commit -m "content: condition page — OCD (~1,000 words)"
```

---

### Task C5.2: Relationships condition page (~1,000 words)

**Files:**
- Modify: `src/content/conditions/relationships.md` (or `.mdx`)

- [ ] **Step 1: Mirror C4.1 structure for relationship difficulties**

Relationships is the page where CAT often shines — relational patterns are the substance. CBT has a role around specific behaviours, communication skills, and assertiveness work, but CAT's reciprocal roles framework is the spine here. Be specific about the kinds of relational difficulties in scope (recurring patterns in romantic relationships, family-of-origin patterns, attachment difficulties) and note that couples work specifically is a different modality (signpost if Rodrigo doesn't offer it).

Frontmatter:

```yaml
condition: "Relationship difficulties"
slug: "relationships"
description: "CAT and CBT for the relational patterns that keep showing up across romantic, family, and work relationships."
target_keyword: "relationship therapy jersey"
sessions_typical: "12-20"
symptoms:
  - "The same kind of relationship keeps happening"
  - "Communication patterns that escalate fast"
  - "Difficulty with closeness, or difficulty with separation"
  - "Repeating conflicts with parents, partners, or colleagues"
  - "Feeling unseen, or overwhelmed by others' needs"
```

- [ ] **Step 2: Build, verify, commit**

```bash
npm run build
git add src/content/conditions/relationships.*
git commit -m "content: condition page — relationship difficulties (~1,000 words)"
```

---

### Task C5.3: Burnout condition page (~1,000 words)

**Files:**
- Modify: `src/content/conditions/burnout.md` (or `.mdx`)

- [ ] **Step 1: Mirror C4.1 structure for burnout**

Burnout is the page where the CBT/CAT split has the clearest practical answer: CBT for the present-tense work patterns (boundary-setting, recovery routines, cognitive reframing of "I should be able to handle this"), CAT for the relational patterns underneath (e.g., the "high-performer who can't say no" reciprocal role often laid down early). Acknowledge that burnout has structural causes beyond therapy — be honest that therapy can't fix a fundamentally unsustainable workplace.

Frontmatter:

```yaml
condition: "Burnout"
slug: "burnout"
description: "CBT and CAT for work-related burnout, exhaustion, and the patterns that drive it."
target_keyword: "burnout therapy jersey"
sessions_typical: "8-16"
symptoms:
  - "Chronic exhaustion that rest doesn't touch"
  - "Cynicism or detachment about work that used to matter"
  - "Reduced sense of professional efficacy"
  - "Difficulty disconnecting outside work hours"
  - "Physical symptoms — sleep, headaches, gut"
```

- [ ] **Step 2: Build, verify, commit**

```bash
npm run build
git add src/content/conditions/burnout.*
git commit -m "content: condition page — burnout (~1,000 words)"
```

---

# LAUNCH

## Phase L: Cutover

### Task L1: Final pre-cutover checklist

**Files:** None — verification gate.

- [ ] **Step 1: Verify all launch-required content is written**

- [ ] `/` home page final copy (C1.1 complete)
- [ ] `/approach` body (C1.2)
- [ ] `/about` body (C1.3)
- [ ] `/fees` copy (C1.4)
- [ ] `/privacy` and `/terms` reviewed by Rodrigo (C1.6)
- [ ] 3 launch articles (C2.1, C2.2, C2.3), all `draft: false`
- [ ] `/portugues` body, reviewed by Rodrigo (C3.1)
- [ ] 3 batch-1 conditions (anxiety, depression, trauma-ptsd), all `draft: false`
- [ ] Batch-2 conditions either complete (`draft: false`) **or** explicitly drafted (`draft: true`) for post-launch

- [ ] **Step 2: Confirm all `TODO_RODRIGO` markers are resolved or accepted as known**

```bash
grep -rn "TODO_RODRIGO" src/ public/
```

Expected: known list (Calendly free-consultation URL, phone number, Google Maps coordinates, Formspree endpoint, Behold widget ID, insurance providers confirmed). Each must either be resolved or explicitly accepted as launch-blocking.

- [ ] **Step 3: Final clean build**

```bash
rm -rf dist .astro
npm run build
```

Expected: no errors, no schema validation warnings.

- [ ] **Step 4: Final Lighthouse run on the production preview**

Per B9.3 — Performance ≥ 90, A11y ≥ 95 on mobile. If regressed, fix and rebuild.

- [ ] **Step 5: Final pa11y run**

```bash
npm run preview &
sleep 3
npm run a11y
# kill the bg preview
```

Expected: `0 errors`.

---

### Task L2: Delete legacy files and merge `redesign` → `Master`

**Files:**
- Delete: root `index.html`
- Delete: root `profile.jpg`
- Delete: root `robots.txt`
- Delete: root `sitemap.xml`
- Delete: root `CNAME` (the `public/CNAME` takes over)

- [ ] **Step 1: Delete the legacy single-page assets on the `redesign` branch**

```bash
git rm index.html profile.jpg robots.txt sitemap.xml CNAME
git commit -m "build: remove legacy single-page assets — Astro build now serves the site"
```

- [ ] **Step 2: Push `redesign` to origin one last time**

```bash
git push origin redesign
```

- [ ] **Step 3: Fast-forward `Master` to `redesign`**

```bash
git checkout Master
git merge --ff-only redesign
```

If the merge fails because `Master` has diverged (it shouldn't — no one else commits to this repo), abort, investigate, do not force.

- [ ] **Step 4: Push `Master`**

```bash
git push origin Master
```

This is the trigger event for `.github/workflows/deploy.yml`. CI runs `npm ci && npm run build` and pushes `dist/` to the `gh-pages` branch.

- [ ] **Step 5: Watch the workflow run**

```bash
gh run watch
```

Or via the GitHub web UI: Actions → "Deploy to GitHub Pages" → click the running job.

Expected: green check in ~2–4 minutes.

---

### Task L3: GitHub Pages source switch + DNS smoke

**Files:** None — GitHub repo settings.

- [ ] **Step 1: GitHub repo settings → Pages**

If the source isn't already set to `gh-pages` / `(root)` (from B10.1), set it now. The `gh-pages` branch exists post-CI-run.

Expected: GitHub shows "Your site is live at https://jerseycbt.com" within 1–2 minutes of the source switch.

- [ ] **Step 2: DNS smoke — verify CNAME resolution**

```bash
dig +short jerseycbt.com
```

Expected: GitHub Pages IPs (185.199.108.153, etc.) or a CNAME pointing to `zakadura.github.io`.

- [ ] **Step 3: Open `https://jerseycbt.com` in a browser**

Expected: redesign loads. Old single-page site is gone. SSL is green. (GitHub Pages provisions Let's Encrypt for the custom domain automatically — may take up to 24h for fresh domains, but `jerseycbt.com` is already using GitHub Pages SSL so it should be instant.)

- [ ] **Step 4: Click-through smoke on production**

Visit each page on production:
- `https://jerseycbt.com/`
- `https://jerseycbt.com/approach`
- `https://jerseycbt.com/about`
- `https://jerseycbt.com/articles`
- `https://jerseycbt.com/articles/cbt-vs-cat/`
- `https://jerseycbt.com/what-i-treat`
- `https://jerseycbt.com/what-i-treat/anxiety/`
- `https://jerseycbt.com/fees`
- `https://jerseycbt.com/book`
- `https://jerseycbt.com/contact`
- `https://jerseycbt.com/portugues`

Expected: all render, Calendly modals open on CTA click, contact form posts to Formspree (test with a real submission), Plausible records the page views (check dashboard at <https://plausible.io/jerseycbt.com>).

---

### Task L4: Post-launch SEO infrastructure

**Files:** None — external systems.

- [ ] **Step 1: Submit sitemap to Google Search Console**

Add `https://jerseycbt.com/sitemap-index.xml` in Search Console → Sitemaps.

- [ ] **Step 2: Validate JSON-LD via Google's Rich Results Test (production URL)**

<https://search.google.com/test/rich-results?url=https%3A%2F%2Fjerseycbt.com>

Expected: `LocalBusiness` + `MedicalBusiness` validate with zero errors.

- [ ] **Step 3: Google Business Profile**

Claim / verify the practice address, hours, photos, services per v2 spec's local-SEO checklist. Use the same address (NAP — name/address/phone) as in JSON-LD.

- [ ] **Step 4: Directory backlinks**

- BABCP directory: update profile URL → `jerseycbt.com`
- ACAT directory: same
- Psychology Today UK: update existing profile
- Counselling Directory: list/update

This is Rodrigo's manual step per v2 spec's off-site SEO checklist.

- [ ] **Step 5: Final tag the launch commit**

```bash
git checkout Master
git tag v1.0-redesign-launch
git push origin v1.0-redesign-launch
```

---

### Task L5: Post-launch follow-ups (deferred)

- Batch-2 conditions (OCD, relationships, burnout) within 30 days if not already shipped — per C5
- Photographer commission within 30 days
- First post-launch monthly article
- Newsletter revisit decision once article cadence is established

---

## Self-review notes (planner's own checklist)

**Spec coverage check (run after writing this plan):**

| Spec section | Covered by task(s) |
|---|---|
| IA — 10 page types | B7.3 (home), B7.4 (approach/about/articles index/what-i-treat index), B7.5 (fees/book/contact/portugues/privacy/terms), B6.2 (article [slug]), B6.3 (condition [slug]) |
| Visual direction — design tokens | B2.1 |
| Component system — 24 components | B2.2 (BaseLayout, JsonLdSchema stub), B3.1 (CTAButton/ConsultationCTA/SessionCTA), B4.1 (CalendlyPopupButton), B4.2 (CalendlyEmbed), B6.2 (ArticlePage), B6.3 (ConditionPage/CaseVignette/FAQ/ResourceLinks), B7.1 (Nav/Footer), B7.2 (StickyBookButton), B7.3 (ConversionHero/TrustStrip), B7.4 (LanguageNote/ArticleCard/ConditionCard), B7.5 (PriceTable/InsuranceLogos/ContactForm/GoogleMap/InstagramGrid) |
| Conversion mechanics — primary CTA, sticky mobile | B7.2 (sticky), B3.1 + B4.1 (CTAs everywhere) |
| Conversion-hero spec | B7.3 |
| Social proof — composite vignettes, no testimonials | B6.3 (CaseVignette component); C4.x bodies |
| Email capture — DEFERRED | C-stream no-op (locked) |
| SEO — JSON-LD | B5.1 |
| SEO — sitemap, robots, RSS | B5.2 (robots, RSS); Astro sitemap integration in B1.2 |
| SEO — per-page OG | B2.2 (base) + B9.1 (per-page override) |
| Portuguese landing | B7.5 (page scaffold) + C3.1 (copy) |
| Mobile-first discipline | B7.2 (sticky), B7.3 (mobile-fold hero), B9.2 (a11y), B9.3 (Lighthouse) |
| Calendly — two event types, lazy-loaded | B3.1 (ConsultationCTA/SessionCTA presets), B4.1 (popup lazy), B4.2 (inline lazy) |
| Behold.so Instagram | B7.5 (InstagramGrid) |
| Formspree contact form | B7.5 (ContactForm) |
| Google Maps lazy-loaded | B7.5 (GoogleMap) |
| Plausible analytics | B2.2 (BaseLayout) |
| Photography path | B8.1 (cheap path); post-launch commission deferred (L5) |
| GitHub Actions deploy | B1.4 |
| CNAME preservation | B1.3 |
| Migration approach | B1.1 (branch + pre-redesign tag), L2 (cutover), L3 (Pages source) |
| Acceptance: Lighthouse ≥ 90 mobile real device | B9.3 |
| Acceptance: A11y ≥ 95 | B9.2 |
| Content burden — ~10,200 words phased | C1–C5 |

**Placeholder scan:** No `TBD`, `TODO`, `implement later`, or `add appropriate X` phrases inside step instructions. The `TODO_RODRIGO` markers are intentional: they identify specific external values Rodrigo provides (Calendly URL, Formspree endpoint, Behold ID, phone, lat/long, insurance list). They are not implementation placeholders — the engineer can build the site without them; the values just need to be swapped in before launch (L1 step 2 verifies).

**Type consistency:**
- `PRACTICE` from `src/lib/jsonld.ts` is used in `JsonLdSchema`, `Footer`, `Contact`, `GoogleMap` — single source of truth.
- `ConsultationCTA` / `SessionCTA` both delegate to `CalendlyPopupButton` with consistent `url` + `class` props.
- Content schemas (`articles`, `conditions`) match the bodies the content stream produces — `target_keyword`, `sessions_typical`, `symptoms`, `resources` all referenced consistently.
- Component prop interfaces are typed in every component using `interface Props`.

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-15-jerseycbt-redesign-implementation.md`. Two execution options:

**1. Subagent-Driven (recommended)** — A fresh subagent runs each task; two-stage review between tasks; fast iteration. Best for the build stream (B1–B10) where steps are short and verifiable.

**2. Inline Execution** — Execute tasks in the current session using the `executing-plans` skill; batch checkpoints between phases for review. Better for the content stream (C1–C5) where you (Rodrigo) need to write the actual prose.

A hybrid approach is recommended: **Subagent-Driven for B1–B10**, **Inline (you writing) for C1–C5**, then **Subagent-Driven for L1–L4** (mechanical).
