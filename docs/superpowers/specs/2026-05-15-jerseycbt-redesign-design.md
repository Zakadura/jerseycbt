# jerseycbt.com redesign — design spec

**Date:** 2026-05-15
**Repo:** `Zakadura/jerseycbt` (branch: `Master`)
**Live domain:** `jerseycbt.com` (custom CNAME on GitHub Pages)
**Practitioner:** Rodrigo Silva — BABCP & ACAT accredited CBT/CAT psychotherapist, solo practice in St Helier, Jersey

## Summary

Replace the current single-page hand-coded site with a multi-page Astro site that signals clinic-grade polish from a solo-practice positioning. Adds an articles system for educational content, Instagram integration for social discovery, and a dedicated booking page. Stays on GitHub Pages with the existing custom domain. Target aesthetic: Hampstead Psychology restraint (clean sans-serif body, restrained serif headlines, cream + warm-black palette) tuned warmer than Soho Center.

## Goals

- Multi-page site with information depth (Home, Approach, What I Treat + 6 condition sub-pages, About, Articles, Fees, Book, Contact)
- $10K-equivalent perceived quality through restraint, typography, photography, and structure — not decoration
- Inline Calendly booking on a dedicated `/book` page; popup-modal Calendly on CTA buttons elsewhere
- Live Instagram feed via Behold.so on `/articles` page + 3-thumbnail tease on home
- Markdown-driven articles system the practitioner can publish to by editing `.md` files + `git push`
- Honest solo-practitioner positioning — no language or design moves that imply a multi-therapist clinic

## Non-goals

- TikTok integration (explicitly skipped — no clean free embed solution for auto-feed; revisit later if desired)
- Patient portal, secure messaging, or session notes — outside the public marketing site
- Custom CMS or admin panel — markdown + git is the publishing workflow
- E-commerce / paid downloads — booking is the only commerce action
- Multilingual site at launch (EN only; Portuguese mentioned as a credential, not as a separate site version)

## Success criteria

- Lighthouse Performance ≥ 90 on Home, Conditions, Articles index
- Lighthouse Accessibility ≥ 95 across the site
- All booking paths land on Calendly within 1 click from any page
- Time to publish a new article: edit one markdown file → `git push` → live within ~60 seconds
- Visitor reading a condition page (e.g. `/what-i-treat/anxiety`) can: understand what it is, see the symptoms, see how Rodrigo works with it, book a session, OR follow an authoritative outbound link — all without leaving the page first

## Information architecture

```
/                              Home
/approach                      How I work — CBT vs CAT, what to expect, fit guidance
/what-i-treat                  Conditions landing — all conditions overview
  /what-i-treat/anxiety        Condition sub-pages (6 total at launch)
  /what-i-treat/depression
  /what-i-treat/trauma-ptsd
  /what-i-treat/ocd
  /what-i-treat/relationships
  /what-i-treat/burnout
/about                         Bio, credentials, languages (EN/PT), experience
/articles                      Articles hub + Instagram grid
  /articles/[slug]             Individual articles
/fees                          Pricing, insurance, cancellation policy
/book                          Calendly inline embed + email fallback
/contact                       Contact form + email + map + practice address
```

Conditions outside the launch 6 (anger management, addictions, sleep, self-esteem, phobias, grief, personality work, social anxiety, panic, health anxiety, etc.) appear as bullet items on `/what-i-treat` with no individual page. They can be promoted to their own page later as content is written.

Global navigation: Approach · What I Treat · About · Articles · Fees · Contact. The "Book a consultation" action lives as an inline CTA on every page, not as a styled nav pill (Hampstead convention).

Global footer: BABCP/ACAT credentials, insurance logos, social links, contact, copyright, privacy & terms links.

## Visual direction

**Aesthetic:** Hampstead Psychology restraint, tuned warmer.

| Token | Value | Use |
|---|---|---|
| `cream` | `#fbfaf7` | Primary background |
| `warm-black` | `#1a1612` | Headlines |
| `muted-cream` | `#ece9e2` | Section dividers, image placeholders |
| `subtle-text` | `#5a4f3c` | Body secondary, trust strip |
| `body-text` | `#2a2620` | Body primary |

**Typography:**
- Headlines: serif (`Charter` with `Georgia` fallback), restrained sizing, no italic span decoration, no decorative line breaks
- Body: system-ui sans-serif stack
- Trust labels: sans-serif, uppercase, letter-spaced

**Design discipline:**
- No accent button color at launch — primary CTA is `warm-black` background on `cream`
- Border radius: 1px (essentially square, Hampstead convention)
- No drop shadows, no gradients
- Warmth source: cream tone + serif headlines + photography; not color accents
- Information density on listing pages (4-column condition list, not 4 colored cards)

## Content model

Two Astro content collections, both markdown-based.

### `content/articles/`

Long-form educational posts. Frontmatter:

```yaml
---
title: "Why anxiety feels worse at night"
description: "A short clinical take on the evening anxiety spike."
date: 2026-05-20
hero: "./images/night-anxiety.jpg"  # optional
tags: ["anxiety", "sleep"]
---
```

Body: free markdown. No length constraint. Publishing cadence: at Rodrigo's pace; nothing in the system breaks if there are zero articles.

### `content/conditions/`

Short-light reference pages. ~200-300 words each. Frontmatter:

```yaml
---
condition: "Anxiety & GAD"
slug: "anxiety"
description: "CBT for generalised anxiety, panic, and worry — in Jersey or online."
symptoms:
  - "Constant worry that's hard to switch off"
  - "Sleep disruption from racing thoughts"
  - "Physical tension, restlessness"
  - "Avoidance of situations that trigger worry"
sessions_typical: "8-16"
resources:
  - label: "NHS — Generalised anxiety disorder"
    url: "https://www.nhs.uk/mental-health/conditions/generalised-anxiety-disorder/"
  - label: "Mind — Self-help for anxiety"
    url: "https://www.mind.org.uk/information-support/types-of-mental-health-problems/anxiety-and-panic-attacks/"
  - label: "BABCP — Find a CBT therapist"
    url: "https://www.babcp.com/"
---

What it is. One sentence.

How I work with this. One short paragraph — CBT/CAT specific, no generic platitudes.

Typical session count: see `sessions_typical`.

[Book a consultation CTA]

──────────
Where to learn more (rendered from `resources` array)
```

### Why two collections, not one

Conditions are static reference content (rarely updated, SEO-optimized, predictable structure). Articles are an ongoing stream (date-ordered, tag-filterable, variable structure). Different shapes, different index pages.

### Writing burden at launch

- 6 condition pages × ~250 words = **~1,500 words**
- 0-5 launch articles (optional)
- **Minimum to launch: ~1,500 words** of Rodrigo's own clinical writing

## Component system

`src/components/`:

| Component | Purpose | Used on |
|---|---|---|
| `Nav.astro` | Global navigation | Every page |
| `Footer.astro` | Global footer | Every page |
| `Hero.astro` | Page hero (variants: home, condition, article) | Home, conditions, articles |
| `TrustStrip.astro` | Credentials + insurance single line | Home + footer |
| `ConditionCard.astro` | Card in `/what-i-treat` grid | `/what-i-treat` |
| `ConditionPage.astro` | Layout template for `/what-i-treat/[slug]` | All condition pages |
| `ResourceLinks.astro` | "Where to learn more" outbound link section | Condition pages |
| `ArticleCard.astro` | Card in `/articles` listing | `/articles` |
| `ArticlePage.astro` | Layout template for `/articles/[slug]` | All articles |
| `InstagramGrid.astro` | Behold.so widget wrapper | Home tease + `/articles` |
| `CalendlyEmbed.astro` | Inline Calendly iframe (lazy-loaded) | `/book` |
| `CalendlyPopupButton.astro` | Button that triggers Calendly modal | Across site |
| `ContactForm.astro` | Form (Formspree-backed) | `/contact` |
| `CTAButton.astro` | Variants: primary, ghost, popup-trigger | Across site |

## Integrations

### Booking — Calendly

- **Inline embed** on `/book` (Calendly's recommended iframe snippet). Lazy-load script via Intersection Observer so the heavy JS doesn't ship on every page.
- **Popup widget** on CTA buttons across the site. Same lazy-load pattern.
- Existing Calendly URL: `https://calendly.com/rodsil/cbt-session`. No change.
- Fallback if Calendly fails: email link to `rod.gui.sil@gmail.com` visible on `/book`.

### Instagram — Behold.so

- Free tier, ~9 latest posts auto-syncing.
- Configure look in Behold dashboard, drop their script tag into `InstagramGrid.astro`.
- Free-tier post volume limit: well above weekly posting cadence.
- Behold also handles caching, so Instagram API downtime doesn't break the site.

### Contact form — Formspree (free tier)

- POST endpoint on Formspree's domain.
- 50 submissions/month on free tier — adequate for a solo therapy contact form.
- Spam protection via Formspree's built-in honeypot + reCAPTCHA option.

### TikTok — not integrated

Explicitly deferred. No clean free embed solution exists; manual featured grid (originally proposed) was dropped because of curation discipline cost.

## Technical stack

| Layer | Choice |
|---|---|
| Static site generator | Astro (latest) |
| Styling | Tailwind CSS (utility-first), via `@astrojs/tailwind` integration |
| Content collections | Astro built-in (`astro:content`) |
| Image optimization | Astro `<Image>` component (auto-WebP, responsive `srcset`) |
| Hosting | GitHub Pages |
| Build/deploy | GitHub Actions → publish to `gh-pages` branch |
| Custom domain | `jerseycbt.com` via existing CNAME (moved into `/public/CNAME` so the build preserves it) |
| Analytics | Plausible (~£8/mo, privacy-respecting, no cookie banner) |
| Forms | Formspree free tier |
| Social embeds | Behold.so free tier |

### Why Plausible over GA4

Therapy clients are privacy-sensitive. Plausible doesn't use cookies, doesn't need a consent banner under UK GDPR, and the dashboard is simpler than GA4. The £8/mo cost is rounding error against the value of not having a creepy cookie banner on a mental health site.

## Migration approach

```
1. git checkout -b redesign on the existing jerseycbt repo
2. Scaffold Astro project at the repo root (deleting the loose index.html, profile.jpg etc.
   — they remain recoverable in git history)
3. Move CNAME into public/CNAME so the build output keeps the custom domain mapping
4. Build out pages and content iteratively in commits to the redesign branch
5. Set up .github/workflows/deploy.yml that builds Astro and publishes /dist to gh-pages
6. In GitHub repo settings, set Pages source = "Deploy from branch" → gh-pages branch
7. Verify the redesign deploys to a temporary preview (gh-pages → zakadura.github.io/jerseycbt
   while jerseycbt.com still serves the old Master root)
8. Launch day: merge redesign → Master. CI rebuilds, gh-pages updates, jerseycbt.com flips.
9. Old single-page site recoverable from Master's pre-merge tag if anything goes wrong.
```

Reversible at every step. The old site stays live on `Master` root until the cutover.

## Photography — the real bottleneck

Current state:
- `profile.jpg` is 1.4 MB (too big for production use even compressed; composition may not fit new design)
- No environmental photos of the practice space
- No supporting imagery for condition or article pages

Two paths, documented for decision later:

| Path | Cost | Quality outcome |
|---|---|---|
| **Cheap (launch default)** | £0 | Unsplash for backgrounds + compressed existing profile.jpg. Site lands at ~70% of full potential. |
| **Pro (post-launch upgrade)** | £300-600 | Local Jersey photographer, 1-2hr shoot: portrait + 2-3 office/environmental photos. This is where reference sites actually invest. |

The redesign will ship on the cheap path so launch isn't gated on a photo shoot. The pro path is documented as the highest-ROI post-launch upgrade.

## Open decisions (deferred to implementation plan or post-launch)

- **Article launch set**: 0, 3, or 5 articles at launch. Cleanest is 0 — let the publishing cadence start naturally. Final call deferred until content writing begins.
- **Photography commission**: cheap path at launch; book Jersey photographer within 30 days post-launch.
- **Sitemap, robots.txt, RSS**: standard Astro integrations exist; defer config detail to implementation plan.
- **Privacy & terms pages**: required for GDPR / professional indemnity. Will use standard therapy-practice templates adapted to Rodrigo's specifics. Content is operational, not design — drafted during implementation, not in this spec.

## Out of scope

| Item | Why not |
|---|---|
| Patient portal / secure messaging | Outside the public marketing site's job; handled by Calendly + email |
| Custom CMS or admin UI | Markdown + git is the publishing workflow |
| TikTok integration | No clean free embed; revisit if TikTok output grows |
| Multilingual (EN + PT) | EN only at launch; revisit if PT-speaking demand is measurable |
| E-commerce / paid downloads | Booking is the only commerce action |
| Live chat | Mental-health-inappropriate response-time expectations |
| Online therapy platform integration (Doxy, Zoom-as-a-service) | Sessions happen on the practitioner's existing platform; not the marketing site's concern |

## Next step

After Rodrigo reviews and approves this spec, invoke the `writing-plans` skill to produce a phased implementation plan that maps these decisions to concrete tasks, commits, and verification steps.
