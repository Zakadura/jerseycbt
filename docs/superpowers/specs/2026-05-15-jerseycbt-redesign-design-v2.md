# jerseycbt.com redesign — design spec v2 (conversion-focused)

**Date:** 2026-05-15
**Repo:** `Zakadura/jerseycbt` (branch: `Master`)
**Live domain:** `jerseycbt.com` (custom CNAME on GitHub Pages)
**Practitioner:** Rodrigo Silva — BABCP & ACAT accredited CBT/CAT psychotherapist, solo practice in St Helier, Jersey
**Supersedes:** `2026-05-15-jerseycbt-redesign-design.md` (v1) — same-day rewrite re-prioritising conversion over brand-restraint

## Summary

Replace the current single-page hand-coded site with a multi-page Astro site that **actively converts visitors into paying clients**, not just signals taste. Information density and conversion mechanics drive the design; aesthetic restraint (Hampstead-tuned cream + warm-black, serif headlines, sans body) is the visual treatment applied over that density — not an excuse to omit details.

Primary conversion mechanism: a **free 15-minute consultation** booked through Calendly, used site-wide as the primary CTA. Initial paid 50-minute sessions are a secondary CTA on `/fees` and `/book`.

Condition pages move from short reference cards (v1) to depth-led SEO assets (~1,000 words each), structured around reader experience, treatment specifics, symmetric CBT-and-CAT framing per condition, and real FAQs. Articles launch with 3 SEO-targeted pieces and a 1-per-month publishing commitment. Local SEO infrastructure (Schema.org JSON-LD, site-wide address, embedded map, directory backlinks) is built in from launch.

A single Portuguese landing page (`/portugues`) targets the low-competition Portuguese-speaking market segment without committing to a full bilingual site.

Stays on GitHub Pages with the existing custom domain. Same Astro + Tailwind + Plausible + Formspree stack as v1.

## Goals

- Multi-page site with information depth (Home, Approach, What I Treat + 6 condition sub-pages, About, Articles, Fees, Book, Contact, Portuguese landing)
- **Free 15-min consultation as the primary site-wide CTA** — removes booking-friction for first-time visitors
- $10K-equivalent perceived quality through restraint, typography, photography, structure, and information density — not decoration
- Inline Calendly booking on `/book`; popup-modal Calendly on CTA buttons elsewhere; two Calendly event types (free 15-min and initial 50-min)
- Markdown-driven articles system the practitioner publishes to by editing `.md` files + `git push`
- Honest solo-practitioner positioning — no language or design moves that imply a multi-therapist clinic
- **Local SEO from launch**: Schema.org JSON-LD, address site-wide, Google Map embed, directory-backlink checklist
- **Single Portuguese landing page** targeting Portuguese-speaking residents and expats in Jersey + online clients in Portugal/Brazil
- **Ethics-compliant social proof**: composite anonymised case vignettes, "what clients often say" editorial framing, Google reviews if collected — explicitly no direct client testimonials
- **Mobile-first conversion polish**: sticky consultation CTA on mobile, real-device performance verification, per-page OG tags
- Live Instagram feed via Behold.so on `/articles` (home-page placement flagged as open decision)

## Non-goals

- TikTok integration (deferred — revisit if TikTok output grows)
- Patient portal, secure messaging, session notes
- Custom CMS or admin panel — markdown + git is the publishing workflow
- E-commerce or paid downloads — booking is the only commerce action
- Full bilingual site (PT is one targeted landing page, not a duplicate site)
- Direct client testimonials in any form (BABCP/ACAT ethical constraint)
- Five-star rating widgets, before/after framings

## Success criteria

**Aesthetic / quality:**
- Lighthouse Performance ≥ 90 on Home, Conditions, Articles — verified on **real-device 4G mobile**, not localhost
- Lighthouse Accessibility ≥ 95 across the site
- Time to publish a new article: edit one markdown file → `git push` → live within ~60 seconds

**Conversion:**
- "Book a free 15-min consultation" CTA visible above the fold on every page, desktop and mobile
- Sticky `Book consultation` button on mobile after scroll past hero, on every page
- All booking paths land in Calendly within 1 click from any page
- Email capture present on `/articles` and at the foot of each condition page (not in hero)

**SEO:**
- Site ranks on page 1 for **"CBT Jersey"** within 6 months post-launch
- Site ranks on page 1 for at least 2 of {"CBT therapist Jersey", "anxiety therapy Jersey", "psychotherapy St Helier"} within 6 months
- `/portugues` indexed and ranking for at least 3 Portuguese-language keywords within 6 months
- Schema.org `LocalBusiness` + `MedicalBusiness` JSON-LD validates with no errors in Google's Rich Results Test
- Practice address present in footer site-wide and matches the address registered on Google Business Profile + BABCP directory

## Information architecture

```
/                              Home (conversion-hero — see Conversion mechanics)
/approach                      How I work — CBT vs CAT, what to expect, fit guidance
/what-i-treat                  Conditions landing — overview + bullet list of secondary conditions
  /what-i-treat/anxiety        Condition sub-pages (6 at launch, ~1,000 words each)
  /what-i-treat/depression
  /what-i-treat/trauma-ptsd
  /what-i-treat/ocd
  /what-i-treat/relationships
  /what-i-treat/burnout
/about                         Bio, credentials, languages (EN/PT), experience
/articles                      Articles hub + Instagram grid
  /articles/[slug]             Individual articles (3 at launch, +1/month)
/fees                          Pricing (visible), course length, insurance, free-consultation CTA
/book                          Calendly inline (both event types) + email fallback
/contact                       Contact form + email + embedded Google Map + practice address
/portugues                     Portuguese landing page (~600 words, not in global nav)
```

Conditions outside the launch 6 (anger management, addictions, sleep, self-esteem, phobias, grief, personality work, social anxiety, panic, health anxiety) appear as bullet items on `/what-i-treat`. Promotable to their own page later.

**Global navigation:** Approach · What I Treat · About · Articles · Fees · Contact.

`/portugues` is reachable from `/about` and `/approach` ("Sessions available in English and Portuguese"), and via organic search. Not in the global nav (preserves the "no full bilingual site" decision).

**Global footer:** practice address, BABCP/ACAT credentials, insurance logos, social links, contact, copyright, privacy & terms, link to `/portugues`.

## Visual direction

Hampstead-tuned restraint — same palette and typography discipline as v1.

| Token | Value | Use |
|---|---|---|
| `cream` | `#fbfaf7` | Primary background |
| `warm-black` | `#1a1612` | Headlines |
| `muted-cream` | `#ece9e2` | Section dividers, image placeholders |
| `subtle-text` | `#5a4f3c` | Body secondary, trust strip |
| `body-text` | `#2a2620` | Body primary |

**Typography:**
- Headlines: serif (`Charter` with `Georgia` fallback), restrained sizing
- Body: system-ui sans-serif stack
- Trust labels: sans-serif, uppercase, letter-spaced

**Design discipline:** No accent button color; primary CTA is `warm-black` on `cream`. Border radius 1px. No drop shadows. Warmth comes from cream tone + serif headlines + photography, not color accents.

**v2 amendment — information density is non-negotiable.** Restraint is the visual treatment over content density, not a permission to omit details. The hero must show — within 2 seconds on mobile — named conditions treated, location, credibility shorthand (BABCP + ACAT, 20+ years), and the primary free-consultation CTA. See Conversion mechanics for hero spec.

## Content model

Two Astro content collections, both markdown-based.

### `content/articles/`

Long-form educational posts, SEO-targeted. Frontmatter:

```yaml
---
title: "How long does CBT for anxiety take?"
description: "A working answer on the typical course length for CBT for generalised anxiety."
date: 2026-06-01
hero: "./images/cbt-anxiety-duration.jpg"
tags: ["anxiety", "cbt", "treatment-length"]
target_keyword: "how long does cbt for anxiety take"
---
```

**Launch set (3 articles, by launch day):**
1. "CBT vs CAT — which therapy is right for me"
2. "How long does CBT for anxiety take"
3. "What happens in your first therapy session"

(User to confirm/refine before writing.)

**Post-launch:** 1 article/month minimum. Topics chosen via keyword research targeting low-competition long-tail therapy questions, particularly the CBT/CAT distinction and Jersey-specific queries.

### `content/conditions/`

Depth-led SEO assets. **~800-1,200 words each.** Frontmatter:

```yaml
---
condition: "Anxiety & GAD"
slug: "anxiety"
description: "CBT and CAT for generalised anxiety, panic, and worry — in Jersey or online."
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
  - label: "BABCP — Find a CBT therapist"
    url: "https://www.babcp.com/"
---
```

**Body structure (each section rendered as H2 in the template):**

1. **What it is** — 1-2 paragraphs acknowledging reader experience, not textbook
2. **What it feels like day to day** — expanded symptoms, weaving in the bulleted list from frontmatter
3. **Why it happens** — brief, accessible, no jargon-laden etiology
4. **How CBT works with this** — specific to the condition: what CBT targets, what homework looks like, what changes between sessions 1, 4, and 12
5. **How CAT works with this — and when CAT vs CBT** — **symmetric across all 6 conditions** (per locked decision A). For conditions where CAT is less commonly the first-line choice (e.g., simple phobias), the section briefly acknowledges this and notes when CAT becomes useful (e.g., when relational patterns underlie the presentation). The CBT/CAT distinction is a key Jersey-market differentiator and must be present on every condition page.
6. **What treatment looks like** — session count, structure, what happens in session 1 vs session 4 vs session 12
7. **Common questions** — 3-5 real-feeling FAQ. Examples: "Will I have to talk about my childhood?", "What if I cry?", "What if it doesn't work for me?", "How do I know if I'm bad enough to need therapy?", "Is online therapy as good as in person?"
8. **[CTA: Book a free 15-min consultation]** — the consultation CTA, prominent
9. **Where to learn more** — renders from `resources` frontmatter

A `CaseVignette.astro` component appears once per condition page — a composite anonymised case vignette ("A typical course of treatment for anxiety might look like…"). Rodrigo writes one per condition during the content phase.

### Why two collections, not one

Conditions are static reference content (rarely updated, SEO-optimised, predictable structure). Articles are an ongoing stream (date-ordered, tag-filterable, variable structure). Different shapes, different index pages, different update cadences.

### Writing burden at launch

| Asset | Word count |
|---|---|
| 6 condition pages × ~1,000 words | ~6,000 |
| 3 launch articles × ~700 words | ~2,100 |
| Portuguese landing page (`/portugues`) | ~600 |
| Site copy (About + Approach + Fees + Contact + Home) | ~1,500 |
| **Total launch writing** | **~10,200 words** |

**This is the real bottleneck — content is a much larger commitment than code.** The implementation plan must phase the writing-content stream separately from the build stream. Compromise option: condition pages can ship in two batches (3 at launch, 3 within 30 days), but launch articles + Portuguese page + sitewide copy are non-negotiable for launch.

## Component system

`src/components/`:

| Component | Purpose | Used on |
|---|---|---|
| `Nav.astro` | Global navigation | Every page |
| `Footer.astro` | Global footer (address site-wide) | Every page |
| `Hero.astro` | Page hero base (variants: condition / article) | Conditions, articles |
| `ConversionHero.astro` | Conversion-tuned hero: named conditions, location, credibility, primary CTA above fold | Home |
| `StickyBookButton.astro` | Mobile-only sticky bottom-screen CTA (dismissible) | Every page (mobile breakpoint) |
| `JsonLdSchema.astro` | Schema.org `LocalBusiness` + `MedicalBusiness` JSON-LD injection into `<head>` | Every page (via base layout) |
| `TrustStrip.astro` | Credentials + insurance + address single line | Home + footer |
| `ConditionCard.astro` | Card in `/what-i-treat` grid | `/what-i-treat` |
| `ConditionPage.astro` | Layout template for expanded condition pages | All condition pages |
| `CaseVignette.astro` | Composite anonymised case vignette | Condition pages |
| `FAQ.astro` | Q/A list | Condition pages, articles |
| `ResourceLinks.astro` | "Where to learn more" outbound link section | Condition pages |
| `ArticleCard.astro` | Card in `/articles` listing | `/articles` |
| `ArticlePage.astro` | Layout template for articles | All articles |
| `InstagramGrid.astro` | Behold.so widget wrapper | `/articles` (home placement: open decision) |
| `CalendlyEmbed.astro` | Inline Calendly iframe (lazy-loaded), `eventType` prop | `/book`, `/fees` |
| `CalendlyPopupButton.astro` | Button triggers Calendly modal, `eventType` prop | Across site |
| `ConsultationCTA.astro` | `CalendlyPopupButton` preset for free 15-min consultation — the default site-wide CTA | Across site |
| `SessionCTA.astro` | `CalendlyPopupButton` preset for paid initial 50-min session | `/fees`, `/book` |
| `PriceTable.astro` | Service / pricing / typical course length grid | `/fees` |
| `InsuranceLogos.astro` | Accepted insurance provider logos | `/fees`, footer |
| `ContactForm.astro` | Formspree-backed form | `/contact` |
| `GoogleMap.astro` | Static map image with click-to-load real Google Maps iframe (lazy-loaded) | `/contact`, `/book` |
| `CTAButton.astro` | Base button variants: primary, ghost, popup-trigger | Across site |
| `LanguageNote.astro` | "Sessions available in English and Portuguese" badge | `/about`, `/approach`, `/portugues` |

## Conversion mechanics

### CTA strategy — two-tier funnel

- **Primary (everywhere):** "Book a free 15-min consultation" → Calendly free 15-min event type
- **Secondary (on `/fees`, `/book`):** "Book your initial session (50 min, £100)" → Calendly paid initial-session event type

Free consultation is positioned as a **fit / screening call**, not a clinical mini-session. **Locked:** no clinical advice given on the free call; it covers what the visitor is bringing, whether CBT/CAT is likely a good fit, and how Rodrigo works. This framing appears in the Calendly event description and on `/book`.

### Conversion-hero spec (home page)

Above the mobile fold (≤ 568px viewport height), within 2 seconds of paint:

```
[Tiny eyebrow]    CBT & CAT Psychotherapy · St Helier, Jersey · Online across UK and Europe

[H1]              Considered psychotherapy for anxiety, depression,
                  trauma, and burnout.

[Subhead]         BABCP & ACAT accredited. 21+ years in NHS and private practice.
                  In person in Jersey or online.

[Primary CTA]     [ Book a free 15-min consultation ]

[Secondary]       Or read about how I work →
```

No photo above the mobile fold (photo loads in a section below the CTA). Desktop hero adds the photo to the right of the text block.

### Where CTAs appear

- Hero (every page, above the fold)
- After every major section (home, condition pages, articles, approach, about)
- Sticky bottom-screen button on mobile (every page, after scroll past hero)
- Footer (every page)
- In-line where contextually relevant ("If this sounds like what you're experiencing, [book a free consultation]")

### Consultation funnel

```
Visitor lands → reads hero (named conditions + location + credibility)
  → scrolls and reads condition / approach content (deepening intent)
  → OR clicks "Book free 15-min consultation"
    → Calendly modal opens (or visits /book for inline embed)
    → books free 15-min slot
    → Rodrigo screens / qualifies in the call
    → fit clients book paid initial session via Calendly link sent post-call
```

### Social proof patterns — BABCP/ACAT ethics-compliant

**Approved:**
- **Composite anonymised case vignettes** on condition pages — "A typical course of treatment for someone with anxiety might look like…". Generalised, never identifiable, written by Rodrigo.
- **"What clients often say" editorial framing** — Rodrigo's own voice, summarising common feedback themes without quoting any individual. Used sparingly.
- **Google reviews if/when collected** (independent of practitioner, no soliciting from current clients). Embed selected reviews on home or about page once a base accumulates.
- **Quantified credibility**: "21+ years in practice", "BABCP Accredited #101239", "ACAT Accredited", "NHS + private practice background".

**Explicitly not used:**
- Direct client testimonials (named or anonymised quotes)
- Five-star rating widgets on the site itself
- Before/after framings
- "Real client story" boxes

### Email capture — deferred

**Locked:** no newsletter signup at launch. The hero, condition pages, and `/articles` index focus exclusively on the free 15-min consultation CTA. Revisit newsletter post-launch if article output sustains a publishing cadence and there's measurable reader demand. Skipping the signup form keeps `/articles` cleaner and removes the GDPR overhead of a marketing list.

## SEO infrastructure

### Local SEO — on-site

- **Schema.org JSON-LD** in `<head>` via the global Astro layout. Two schema types stacked: `LocalBusiness` (general) + `MedicalBusiness` (specialised). Includes practice name, address (House 3, 8 Lewis St, St Helier, Jersey JE2 3PB), phone, email, languages spoken (English, Portuguese), accepted insurance, geo coordinates, opening hours, founder credentials (BABCP #101239, ACAT, MSc, PgDip CBT, 21+ years).
- **Practice address site-wide** in the footer.
- **Embedded Google Map** on `/contact` and `/book` — static map image with click-to-load real map for performance.
- **Per-page OG tags** with page-specific title, description, OG image.
- **Sitemap.xml + robots.txt** auto-generated by Astro's sitemap integration.
- **RSS feed** for `/articles`.

### Local SEO — off-site checklist (executed by Rodrigo post-build, documented in spec)

- Google Business Profile setup: claim, verify address, hours, photos, services
- Directory backlinks:
  - BABCP directory listing → `jerseycbt.com`
  - ACAT directory listing → `jerseycbt.com`
  - Psychology Today UK profile → `jerseycbt.com` (existing profile to be updated)
  - Counselling Directory listing → `jerseycbt.com`
- **NAP consistency check**: name / address / phone identical across all listings and the JSON-LD. Mismatches damage local SEO.

### Portuguese landing page

`/portugues` — ~600 words in Portuguese.

**Structure:**
1. Hero: who I help (in Portuguese), location (Jersey + online), credentials
2. Brief bio in Portuguese
3. Conditions I treat (named in Portuguese)
4. "How I work" — short paragraph
5. Languages: English (primary practice) and Portuguese (native)
6. CTA: book a free 15-min consultation — Calendly event description should be available in Portuguese for this entry point
7. Where to learn more — links to Portuguese-language mental health resources if good ones exist, otherwise NHS/Mind with a note

**Target keywords (Rodrigo to validate via keyword research):**
- "psicólogo em inglês Jersey"
- "terapia CBT em português"
- "terapeuta português Channel Islands"
- "psicoterapia online em português"

`/portugues` is reachable from `/about` and `/approach` ("Sessions available in English and Portuguese") and via organic search. Not in the global nav.

### Article SEO strategy

Each article has a `target_keyword` in frontmatter. Articles answer the visitor's search query directly — they are not comprehensive treatments of a topic. Short titles (< 60 chars for SERP rendering), clear meta descriptions (< 155 chars).

**Launch set (Rodrigo to confirm):**
1. "CBT vs CAT — which therapy is right for me" → "cbt vs cat", "which therapy is right for me"
2. "How long does CBT for anxiety take" → "how long does cbt take", "cbt anxiety duration"
3. "What happens in your first therapy session" → "what happens in cbt", "first therapy session"

Post-launch: monthly cadence, topics from keyword research targeting Jersey + the CBT/CAT distinction.

## Integrations

### Booking — Calendly (two event types)

- **Free 15-min consultation** event type — primary CTA everywhere. Lazy-loaded popup widget on every page; inline embed on `/book`.
- **Initial 50-min session** event type — secondary CTA on `/fees` and `/book`. Same lazy-load pattern.
- Existing Calendly URL: `https://calendly.com/rodsil/cbt-session` — to be supplemented with a new free-consultation event type URL (Rodrigo to create in Calendly admin).
- Calendly event descriptions must clarify the framing (free = fit/screening call; initial = first paid clinical session).
- Fallback if Calendly fails: email link to `rod.gui.sil@gmail.com` visible on `/book` and `/contact`.

### Instagram — Behold.so

Free tier, ~9 latest posts auto-syncing. Configure look in Behold dashboard, drop their script tag into `InstagramGrid.astro`. Free-tier post volume limit is well above weekly cadence.

**v2 amendment:** home page placement is an **open decision** — keep the home tease only if Instagram content is uniformly professional, remove if it mixes personal and professional. Always keep the `/articles` placement.

### Newsletter — deferred post-launch

Not part of launch scope. Revisit when article cadence justifies it.

### Contact form — Formspree (free tier)

POST endpoint on Formspree's domain. 50 submissions/month on free tier — adequate for a solo therapy contact form. Spam protection via honeypot + reCAPTCHA option.

### Google Maps — lazy-loaded embed

Static map image (one HTTP request for an image, no JS) with click-to-load real Google Maps iframe. Same lazy-load pattern as Calendly. On `/contact` and `/book`.

### TikTok — not integrated

Explicitly deferred. No clean free embed solution exists. Revisit if TikTok output grows substantially.

## Technical stack

| Layer | Choice |
|---|---|
| Static site generator | Astro (latest) |
| Styling | Tailwind CSS (utility-first), via `@astrojs/tailwind` |
| Content collections | Astro built-in (`astro:content`) |
| Image optimization | Astro `<Image>` component (auto-WebP, responsive `srcset`) |
| Hosting | GitHub Pages |
| Build/deploy | GitHub Actions → `gh-pages` branch |
| Custom domain | `jerseycbt.com` via CNAME (moved into `/public/CNAME`) |
| Analytics | Plausible (~£8/mo, no cookie banner needed under UK GDPR) |
| Forms | Formspree free tier |
| Social embeds | Behold.so free tier |
| Newsletter | Deferred post-launch |

Plausible over GA4: therapy clients are privacy-sensitive; Plausible doesn't use cookies, doesn't need a consent banner, simpler dashboard. £8/mo is rounding error against the value of no creepy cookie banner on a mental health site.

## Mobile-first design discipline

- **All design decisions made at mobile breakpoint first**, then expanded for tablet and desktop. No "desktop-first then squashed" pattern.
- **Hero must show conversion content above the mobile fold**: H1 (1-2 lines max), 1-line subhead with named conditions, credibility shorthand, primary CTA. Photo can be cropped or hidden below the fold on mobile.
- **Sticky `Book a free 15-min consultation` button** appears bottom-of-screen on mobile after the visitor scrolls past the hero. Dismissible.
- **All embeds (Calendly, Behold, Google Maps) lazy-loaded** via Intersection Observer.
- **Real-device performance verification before launch**: Lighthouse mobile run on a throttled-4G profile, not localhost; tested on at least one actual phone (iPhone or Android).
- **Tap targets ≥ 44px** for all CTAs.
- **No horizontal scroll on any mobile viewport from 320px up.**

## Migration approach

```
1. git checkout -b redesign on the existing jerseycbt repo
2. Scaffold Astro project at the repo root (deleting the loose index.html, profile.jpg
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

Reversible at every step. The old site stays live on `Master` root until cutover.

## Photography

Current state:
- `profile.jpg` is 1.4 MB (too big for production even compressed; composition may not fit new design)
- No environmental photos of the practice space
- No supporting imagery for condition or article pages

Two paths:

| Path | Cost | Quality outcome |
|---|---|---|
| **Cheap (launch default)** | £0 | Unsplash for backgrounds + compressed existing `profile.jpg`. Site lands at ~70% of full potential. |
| **Pro (post-launch upgrade)** | £300-600 | Local Jersey photographer, 1-2hr shoot: portrait + 2-3 office/environmental photos. Where reference sites actually invest. |

**v2 amendment:** the launch hero requires *some* face-of-practitioner photo (cropped or below-fold on mobile, alongside text on desktop) for credibility. Compressed `profile.jpg` is acceptable for launch; commit to a Jersey photographer shoot within 30 days post-launch.

## Open decisions

**Locked 2026-05-15:**
- Newsletter: **deferred post-launch** (not part of launch scope)
- Initial session price: **£100** (visible on `/fees`)
- Free consultation framing: **screening-only** — no clinical advice in the 15 min; Calendly event description reflects this
- Article launch topics: **confirmed as proposed** — (1) CBT vs CAT, (2) How long does CBT for anxiety take, (3) What happens in your first therapy session

**Still open:**
- Instagram home page placement: keep tease on home or only on `/articles` — depends on whether Rodrigo's IG content is uniformly professional
- Insurance providers logo list: current site lists AXA, Aviva, Vitality, Aetna — Rodrigo to confirm/update (Bupa? Cigna?)
- Portuguese keywords: 4 candidates proposed, Rodrigo to validate via search volume
- Photography commission: cheap path at launch; book Jersey photographer within 30 days post-launch
- Privacy & terms pages: drafted during implementation using standard therapy templates, reviewed by Rodrigo before publish
- Composite case vignettes: Rodrigo writes one per condition page during content phase

## Out of scope

| Item | Why not |
|---|---|
| TikTok integration | No clean free embed; revisit if TikTok output grows |
| Patient portal / secure messaging | Outside marketing site; handled by Calendly + email |
| Custom CMS or admin UI | Markdown + git is the publishing workflow |
| Full bilingual site (EN + PT) | One targeted landing page only; revisit if PT-speaking demand is measurable |
| E-commerce / paid downloads | Booking is the only commerce action |
| Live chat | Mental-health-inappropriate response-time expectations |
| Direct client testimonials | BABCP/ACAT ethics |
| Five-star rating widgets | Ethics + not site's job |
| Before/after framings | Ethics + clinically inappropriate |
| Online therapy platform integration | Sessions happen on the practitioner's existing platform |

## Next step

After Rodrigo reviews and approves this v2 spec, invoke the `writing-plans` skill to produce a phased implementation plan that maps these decisions to concrete tasks, commits, and verification steps. **The implementation plan must phase the writing-content stream (~10,200 words) separately from the build stream — content is the real bottleneck, not code.**
