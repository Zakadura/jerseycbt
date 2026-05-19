# jerseycbt.com launch — design spec

**Date:** 2026-05-19
**Repo:** `Zakadura/jerseycbt`
**Working branch:** `redesign`. Tags: `pre-redesign` (`ced537e`) marks the redesign-branch state *before* the content pour started; `live-master-pre-launch` (`8325ad1`) marks the original live `Master` HEAD = the old single-page hand-coded `index.html` currently in production. `live-master-pre-launch` is the nuclear-rollback anchor.
**Live domain:** `https://jerseycbt.com` (CNAME wired to GitHub Pages, currently serving the old single-page site at `live-master-pre-launch` = `origin/Master`)
**Practitioner:** Rodrigo Silva — BABCP (CBT) & ACAT (CAT) accredited, Ordem dos Psicólogos Portugueses, solo practice in St Helier, Jersey
**Builds on:** `2026-05-15-jerseycbt-redesign-design.md`, `2026-05-15-jerseycbt-redesign-design-v2.md`

## Summary

The redesign branch is **structurally** ready to launch — Astro 5 site is built, CI workflow deploys to GitHub Pages with the correct CNAME, Calendly + Formspree + JSON-LD + OG images + pa11y all wired. The redesign is **content-poor**: Home, About, Approach, Fees, Portugues, all 6 condition pages, and all 3 article pages still hold placeholder text referencing content-pour slots (`C1.1`, `C2.1`, `C4.1`, etc.).

Launch is therefore not an infrastructure project. It is a **content-pour project terminated by a single-merge cutover**. Pour content top-down into the existing Astro shells; pa11y and build stay green per page; when all placeholders are gone and gates green, no-ff merge `redesign` → `Master`; CI publishes to `gh-pages`; GitHub Pages serves the new site at the existing live domain. Old `Master` (= tag `live-master-pre-launch`, the single-page `index.html`) keeps serving until merge. The merge is a **complete site replacement**, not a content swap — `Master` currently has none of the Astro infrastructure; all 26+ redesign commits land in one go.

Brand-voice contract has shifted from prior memory: **CBT and CAT are now presented in parallel**, with **Bion and Beck** as the paired ethos lineages. Two parallel signature assets — the reformulation letter (CAT) and the collaborative formulation (CBT) — anchor the site's specifics. Page-level modality lead is determined by presentation match, not by site-level priority.

## Goals

- Replace every placeholder page with finished, voice-correct copy.
- Preserve all existing infrastructure (CI, integrations, JSON-LD, accessibility audit, CNAME).
- Cut over to live atomically — one merge into `Master`, one CI run, one go-live.
- Maintain rollback safety via the `live-master-pre-launch` tag throughout.
- Update brand-voice memory to reflect CBT/CAT parallel framing once the spec is committed.

## Non-goals

- IA changes — pages, components, URL structure, navigation stay as built.
- New dependencies, env vars, GitHub secrets, or DNS work.
- Full Portuguese-language mirror — single landing only at `/portugues`.
- "First therapy session" article (`first-therapy-session.md`) — optional; off the launch queue unless added on request.
- Behold / Instagram grid — already deferred post-launch per commit `6bf9308`.
- Custom 404 page — follow-up after launch.
- A `npm run preflight` wrapper script — optional improvement during polish pass, not blocking.

## Architecture

### Branch & deploy flow

```
redesign (working — content pour happens here)
   │  page-by-page commits via /commit
   │  pa11y + astro build green per commit
   ▼
Master (default, watched by CI)
   │  .github/workflows/deploy.yml on push
   ▼
gh-pages (publish_dir: ./dist, cname: jerseycbt.com)
   │
   ▼
GitHub Pages → https://jerseycbt.com (DNS unchanged)
```

- Working branch: `redesign`. Live keeps serving from `origin/Master` (= tag `live-master-pre-launch`) throughout the pour.
- Go-live: single `git merge --no-ff redesign` into `Master`, then `git push origin Master`. CI runtime ~2–4 min.
- Rollback: `git revert -m 1 <merge-sha>` (preferred) or `git reset --hard live-master-pre-launch && git push --force-with-lease` (nuclear). `live-master-pre-launch` is the anchor for "back to the old live site"; `pre-redesign` is the anchor for "back to the redesign branch state before pour started".

### Content shapes (unchanged from redesign)

- `src/pages/*.astro` — Home, About, Approach, Fees, Contact, Book, Portugues, Privacy, Terms.
- `src/content/conditions/*.md` — 6 condition pages, rendered through `ConditionPage.astro`.
- `src/content/articles/*.md` — articles, rendered through `ArticlePage.astro`.
- `src/lib/jsonld.ts` — practice JSON-LD (phone, coords, hours, insurance). Unchanged from commit `6bf9308`; verified, not re-edited.

### Integrations (already wired)

- Calendly inline + popup, URL `/15-min-onboard`.
- Formspree endpoint `xbdbrlrv` on contact form.
- OpenStreetMap embed on contact page (no API key).
- JSON-LD with real phone `+44-7458-153479`, coords `49.1888196,-2.1129293`, hours Mo-Fr 10:00–18:00.
- OG default image `/og-default.jpg`; per-page overrides on articles + conditions per commit `1a5e070`.
- Sitemap generation at `/sitemap-index.xml`; `robots.txt` allow-all with sitemap link.
- `pa11y-ci` audit configured and passing per commit `0950a24`.

### Analytics (decision baked in)

- **Plausible** (no cookies, no banner, ICO-friendly) added during the pour if not yet wired. Privacy page must mention Plausible by name when it lands.
- Alternative: no analytics. Operator's call before pour completes — defaults to Plausible.

## Voice & quality contract

Operationalised brand voice. Each page is checked against this contract before it leaves the pour queue.

### Hard bans

A single occurrence of any of the following — **in body, headings, OR meta description** — triggers a section rewrite:

- "safe space", "on a journey", "non-judgemental" / "non-judgmental", "here to help", "unlock your potential", "wellness" (as virtue), "holistic" (as virtue), "compassionate" (as filler), "empower" / "empowerment" (as virtue).
- Filler openers: "In today's fast-paced world…", "Many people struggle with…", "We all have moments…".
- Wellness-industry register: self-care, self-love, journey, growth (as filler).
- CAT and CBT framed asymmetrically site-wide (one positioned as "real work", the other as "fast surface fix").
- Promissory language ("we will heal", "you will overcome", "transform your life").
- `self-care` is allowed *only* on Burnout if the text explicitly reframes it against the cliché.

### Required moves per page

Each page must demonstrate at least three of:

- Name the pattern, not the feeling — "the same loop reasserting itself" rather than "feeling stuck".
- Name a specific method — reformulation letter, sequential diagrammatic reformulation (SDR), exits, reciprocal roles, target problem procedures (CAT side); collaborative formulation, behavioural experiments, exposure (ERP, in vivo, imaginal), behavioural activation, cognitive restructuring (CBT side).
- Name an honest limit — "I don't promise to fix anything", "this isn't quick", "patterns that don't shift on their own".
- Use a Bion-style or Beck-style move once per page — a sentence that respects the reader's intelligence rather than instructs them (Bion: "thinking with rather than at"); collaborative-empirical (Beck: "scientist of self").
- Anchor phrase variants where they fit: "patterns that don't shift on their own", "I promise to think with you", "the work is reformulation, then practice".

### Modality framing (parallel CBT + CAT)

- Site-level: CBT and CAT are co-equal. No "primary modality" framing on Home, About, Approach, or Fees.
- Page-level: lead modality is determined by presentation match, not site-level priority. Each condition or topic admits a lead-modality call, and the page makes that call explicitly via a gating sentence.
- About page lineage paragraph names **Bion** (CAT/analytic — containment, thinking with, learning from experience) and **Beck** (CBT — collaborative empiricism, scientist of self).
- Credentials paragraph keeps BABCP (CBT) and ACAT (CAT) at the same line weight.

### Two parallel signature assets

| Asset | Modality | Required on |
|---|---|---|
| **Reformulation letter** | CAT signature | Home, About, Approach, Fees, Trauma-PTSD, Relationships, OCD (relational branch), Depression (recurrent branch), Burnout (narrative branch), Article 17 (reformulation cornerstone) |
| **Collaborative formulation** (Beck-style written 5-areas + behavioural-experiment protocol) | CBT signature | Home, About, Approach, Fees, Anxiety, OCD (ritual branch), Depression (acute branch), Burnout (behavioural branch) |

### Portuguese page rule

Same ethos, same directness. No softer register. Reformulation letter → "carta de reformulação". Brazilian + EU Portuguese neutral phrasing where the choice exists.

### Definition of done per page

- Zero placeholders (no `Placeholder`, no `TODO`, no `C[0-9]+\.[0-9]+` slot marker).
- All hard bans absent (including in meta description — Google reads meta aloud).
- ≥3 required moves present.
- Reformulation letter named where the asset table says.
- Collaborative formulation named where the asset table says.
- Headings and meta description rewritten (not just body copy).
- Meta title ≤60 chars; meta description ≤155 chars; primary keyword present per SEO map.
- H1 voice-correct (pattern-named, not slogan-y); H2s mix client-search phrases with voice-correct phrases.
- Internal-linking minimum met per SEO section (condition ↔ article, Home ↔ key pages).
- OG image still resolves.
- `astro build` clean, `pa11y-ci` green on the page.

## SEO & keyword strategy

The voice contract governs what reads naturally on the page. The SEO layer governs what surfaces in Google for a Jersey-based or Portuguese-speaking searcher. The two operate on **different surfaces** and must coexist without one corrupting the other.

### Core insight (from research)

Clinical language and client search language don't overlap. Clients type "I can't stop feeling anxious", not "integrative psychodynamic treatment". Google treats them as different topics. So the surfaces that compete for search clicks — meta titles, meta descriptions, URL slugs, H1s, H2s — must use **client search language**, while the body copy continues to use voice-correct method language. This is a dual-register write, not a register collision.

### Keyword categories that matter

1. **Local terms** — strongest opportunity. Tiny competition pool in Jersey.
2. **Condition terms** — where high-intent clients land. Each condition page is titled the way a sufferer searches.
3. **Question-based / "feeling" terms** — for articles and AI-search answers.
4. **Service terms** — head-volume, hard to rank against directories, but signal relevance.
5. **Portuguese terms** — near-zero competition. The `/portugues` page owns this surface end-to-end.

### Dual-register rule

For every page with a search-facing surface:

| Surface | Register | Example (Anxiety) |
|---|---|---|
| Meta title (≤60 chars) | Client-search language, condition + location | "Anxiety Therapy Jersey — CBT and CAT" |
| URL slug | Client-search language, no jargon | `/what-i-treat/anxiety/` |
| H1 | Voice-correct, pattern-named, not slogan-y | "Anxiety, and the loop that keeps it going" |
| H2s | Mix: at least one client-search phrase, rest voice-correct | "Panic attacks" + "Generalised worry" + "How CBT works for anxiety" + "When CAT is the better route" |
| Meta description (≤155 chars) | Client-search keywords + one honest-limit phrase | "Anxiety therapy in Jersey with Rodrigo Silva — CBT and CAT for panic, GAD, health anxiety. I don't promise to fix anything; I work the pattern." |
| Body copy | Voice contract — hard bans apply, required moves apply | as per voice section |

The hard bans still apply to meta descriptions. "Safe space", "on a journey", and friends are out of meta descriptions too — Google reads them aloud in featured-snippet contexts.

### Keyword-to-page map

| # | Page | Primary keyword | Secondary keywords | Meta title (≤60 chars) |
|---|---|---|---|---|
| 1 | Home | `private therapist Jersey` | CBT Jersey, CAT therapist Jersey, anxiety therapy Jersey, BABCP Jersey | Rodrigo Silva — CBT & CAT Therapy in Jersey |
| 2 | About | `therapist Jersey` | psychotherapist St Helier, BABCP CBT, ACAT CAT, private therapist Jersey | About Rodrigo Silva — Therapist in Jersey |
| 3 | Approach | `CBT and CAT therapy` | how CBT works, how CAT works, reformulation letter, collaborative formulation | Approach — How I work in CBT and CAT |
| 4 | Fees | `private therapist fees Jersey` | therapy cost Jersey, insurance therapy Jersey, AXA Jersey therapist | Fees & Sessions — Jersey Therapy |
| 5 | Contact | `therapist Jersey contact` | book therapist St Helier, message therapist Jersey | Contact — Rodrigo Silva, Jersey Therapist |
| 6 | Book | `therapist consultation Jersey` | free therapy consultation Jersey, book therapy Jersey | Book — Free 15-min Consultation |
| 7 | Portugues | `terapeuta português Jersey` | psicólogo que fala português, terapia online em português, terapia cognitivo-comportamental português | Terapia em Português — Jersey e Online |
| 8 | Anxiety | `anxiety therapy Jersey` | help for panic attacks, GAD therapy Jersey, CBT for anxiety Jersey, social anxiety Jersey | Anxiety Therapy Jersey — CBT and CAT |
| 9 | Trauma & PTSD | `trauma therapy Jersey` | PTSD therapist Jersey, trauma-informed therapy Jersey, reformulation letter trauma | Trauma & PTSD Therapy — Jersey |
| 10 | OCD | `OCD therapy Jersey` | ERP Jersey, intrusive thoughts therapy, OCD CBT Jersey | OCD Therapy Jersey — ERP and CAT |
| 11 | Depression | `depression therapy Jersey` | help with depression, CBT for depression Jersey, recurrent depression therapy | Depression Therapy — Jersey |
| 12 | Relationships | `relationship patterns therapy` | reciprocal roles therapy, relational therapy Jersey, why my relationships repeat | Relationship Patterns Therapy — Jersey |
| 13 | Burnout | `burnout therapy Jersey` | exhaustion therapy, work burnout counselling Jersey, burnout CBT | Burnout Therapy Jersey |
| 14 | Article — what is CAT | `what is Cognitive Analytical Therapy` | CAT therapy explained, reformulation letter, CAT vs psychodynamic | What is CAT? — Cognitive Analytical Therapy |
| 15 | Article — CBT vs CAT | `CBT vs CAT` | difference between CBT and CAT, choosing CBT or CAT | CBT vs CAT — Which is right for me? |
| 16 | Article — how long CBT for anxiety | `how long does CBT for anxiety take` | how many CBT sessions for anxiety, CBT anxiety duration | How long does CBT for anxiety take? |
| 17 | Article — reformulation letter | `reformulation letter CAT` | what is a reformulation letter, CAT therapy letter | The Reformulation Letter in CAT |

### Constraints baked in

- Meta title ≤60 chars (Google truncates beyond). Meta description ≤155 chars.
- One H1 per page. Primary keyword appears in H1 OR in meta title (preferably both, naturally).
- Each condition page H1 carries a voice-correct pattern phrase; the meta title carries the search phrase. The two co-exist.
- Internal linking: every condition page links to at least one related article; every article links to the relevant condition page; Home links to Approach + Fees + top-2 conditions; About links to Approach.
- Avoid keyword stuffing — primary keyword once in title, once in H1 or first paragraph, once in meta description. Synonyms thereafter.
- Acronyms (CBT, CAT, ERP, SDR) never lead — pages lead with what the method *does*, then name the method.

### Volume verification (operator step, before pour starts)

Research above is from SEO agency sources with strategic-framing bias. The strategic claims (client-language, local + long-tail, condition pages) are sound. The **specific keywords above are best-guesses**, not verified Jersey-specific volumes. Before drafting the meta layer for any page, operator runs the primary keyword through Google Keyword Planner or Ubersuggest free tier, confirms it returns non-zero local volume, and substitutes a higher-volume synonym if one exists. This is a small upfront pass (~20 min total), not a per-page rerun.

### Out of scope for launch SEO

- Backlink campaign / directory submissions beyond the existing Psychology Today + Think CBT profiles.
- Google Business Profile setup (separate workstream — flag for follow-up).
- Schema markup beyond what's already in `src/lib/jsonld.ts` (LocalBusiness, Person, MedicalCondition where applicable).
- Long-tail expansion ("postpartum anxiety Jersey", "men's therapy Jersey", etc.) — picked up in a post-launch SEO pass if traffic data warrants.

## Page-by-page work queue

Pour order is home-out: highest-trafficked and most voice-load-bearing pages first, then conditions, then articles. Each row is one work unit — I draft, operator red-pens, page closes, move on.

| # | Slot | File(s) | Lead | Key moves |
|---|---|---|---|---|
| 1 | Home | `src/pages/index.astro` | Both, parallel | Named-specifics block lists reformulation letter + collaborative formulation side by side; hero carries honest limit |
| 2 | About | `src/pages/about.astro` | Both, parallel | Bion + Beck named; BABCP + ACAT + OPP listed without inflation; "I don't promise to fix anything" |
| 3 | Approach | `src/pages/approach.astro` | Both, parallel | Equal-billing sections "How CBT looks in the room" / "How CAT looks in the room"; gating-logic section ("when each is the right call") |
| 4 | Fees | `src/pages/fees.astro` | Operational | 8–16-session arc framed honestly; named deliverable (reformulation letter or collaborative formulation, depending on path); insurance providers; free 15-min consult; no wellness-pricing register |
| 5 | Contact | `src/pages/contact.astro` | n/a (relational opening, modality-neutral) | Light framing of what to write in first message; Bion-style sentence; honest response-time limit |
| 6 | Book | `src/pages/book.astro` | Operational | Calendly free 15-min consult framed honestly — what it is and isn't; paid-session direct-contact block per `SessionCTA` |
| 7 | Portuguese | `src/pages/portugues.astro` | Both, parallel | All hard bans translated; ethos preserved in PT; carta de reformulação named |
| 8 | Anxiety | `src/content/conditions/anxiety.md` | CBT lead, CAT secondary | Behavioural experiments + exposure + collaborative formulation named; CAT entry-point named for recurrent / pattern-driven presentations |
| 9 | Trauma & PTSD | `src/content/conditions/trauma-ptsd.md` | CAT lead, CBT secondary | Reformulation letter centrepiece; reciprocal roles named; TF-CBT + exposure named as parallel route for discrete-trauma presentations |
| 10 | OCD | `src/content/conditions/ocd.md` | Parallel | ERP named for ritual-driven; reformulation letter + reciprocal roles for relational/identity-driven; explicit gating sentence picks the route |
| 11 | Depression | `src/content/conditions/depression.md` | Parallel | BA + cognitive restructuring for acute; reformulation letter for pattern-recurrent; gating sentence |
| 12 | Relationships | `src/content/conditions/relationships.md` | CAT lead | Reformulation letter + reciprocal roles centrepiece; explicit "this isn't couples work; CBT isn't the right tool here" honest limit |
| 13 | Burnout | `src/content/conditions/burnout.md` | Parallel | CAT for narrative/identity burnout; CBT (behavioural rebalancing, values work) for exhaustion/behavioural burnout; hard ban on `self-care` unless explicitly reframed |
| 14 | Article: CAT plain-English | new `src/content/articles/what-is-cat.md` | CAT | Reformulation letter explained as signature deliverable; ~2000 words; per Cowork v1 cornerstone |
| 15 | Article: CBT vs CAT | `src/content/articles/cbt-vs-cat.md` (existing placeholder file) | Parallel, fair | Honest comparison; gating logic; named limits of each modality |
| 16 | Article: How long does CBT for anxiety take | `src/content/articles/how-long-cbt-anxiety.md` | CBT | Honest "it depends" answer; named gating logic; numbers where defensible |
| 17 | Article: Reformulation letter cornerstone | new `src/content/articles/reformulation-letter.md` | CAT | Letter named in title, dek, body, ≥4 subheadings; what it is, what it does, what it doesn't do |
| 18 | Polish pass | all of `src/pages` + `src/content` | n/a | Cross-page consistency; anchor-phrase repetition audit; nav labels final; meta descriptions all rewritten; zero `Placeholder` / `TODO` / `Lorem` |

Notes:
- Item 14 lands at a new file path (`what-is-cat.md`); the existing `cbt-vs-cat.md` placeholder is the home for item 15.
- Item 18 is non-optional. Sequential pour's main job is catching cross-page drift; polish is where that catch lands.
- "First therapy session" article (`first-therapy-session.md`) stays placeholder unless explicitly added — easy addition by operator request.

## Pre-merge gates

All gates must be green before `redesign` merges into `Master`. Single red gate blocks the merge.

- **G1 — Placeholder zero.** `grep -rn -E "Placeholder|TODO|TODO_RODRIGO|FIXME|Lorem|C[0-9]+\.[0-9]+" src/` returns nothing. Includes frontmatter meta descriptions.
- **G2 — Hard-ban scan.** Case-insensitive grep across `src/pages/**/*.astro` and `src/content/**/*.md` for the hard-ban list. Hand-check ambiguous matches (`holistic`, `compassionate`, `self-care` on Burnout).
- **G3 — Voice required-moves check.** Operator red-penned and signed off each of pages 1–17. Each page names ≥1 CBT mechanism and ≥1 CAT mechanism where topic admits both. Reformulation letter named per asset table. Collaborative formulation named per asset table. Bion + Beck both named on About.
- **G4 — Build green.** `npm run build` exits 0; no missing-page or content-collection-schema warnings; sitemap contains all expected pages; OG overrides resolve.
- **G5 — Accessibility green.** `npm run a11y` (pa11y-ci) exits 0 across all configured routes. New articles + conditions added to pa11y targets if not already covered.
- **G6 — JSON-LD + structured data valid.** `src/lib/jsonld.ts` unchanged from `6bf9308`. Page-type JSON-LD (Article on articles, MedicalCondition/MedicalWebPage on conditions, LocalBusiness on Home) emits and validates.
- **G7 — Integrations smoke.** Calendly inline + popup load on `/book` and `ConsultationCTA` hosts. Formspree form on `/contact` posts a test row (marked test, deleted after). `tel:` link opens dialer on mobile. OSM map renders.
- **G8 — Cross-page consistency.** Anchor phrases present on Home and at least one of About/Approach (not on all pages). Modality gating logic same on Approach and on parallel-lead condition pages. Nav labels match final titles. Footer includes Portuguese link. No orphan pages.
- **G9 — Privacy + compliance.** `/privacy` and `/terms` reviewed against any copy changes. If Plausible added, privacy page mentions it by name. ICO / GDPR text intact. Insurer-claims wording unchanged unless explicitly revisited.
- **G10 — Branch state.** `redesign` merges no-ff cleanly onto current `Master`. `live-master-pre-launch` tag still points at the original live `Master` HEAD (`8325ad1`); `pre-redesign` tag still points at `ced537e`.
- **G11 — SEO surface check.** Every page in queue items 1–17 has: meta title ≤60 chars containing the primary keyword from the keyword-to-page map; meta description ≤155 chars containing the primary keyword once and respecting hard bans; H1 voice-correct; URL slug matching map; ≥1 internal link to a related page (condition→article, article→condition, Home→top-pages). Verified by grep + hand-audit during polish pass.

G1, G2, G4, G5 are scriptable (optional `npm run preflight` wrapper during polish pass). G3, G6, G7, G8, G9, G11 are operator-verified.

## Launch sequence

Linear playbook, one go-live event.

- **T-0:00** — Pre-flight on `redesign`: `git status` clean; `npm ci`; `npm run build`; `npm run a11y`. G1 + G2 grep sweeps zero. `astro preview` smoke: Home, About, Approach, Fees, Contact, Book, Portugues, one condition, one article — Calendly loads, Formspree posts test, map renders, sticky CTA appears on scroll. Snapshot old live site for visual diff.
- **T-0:05** — Tag launch candidate: `git tag launch-candidate-2026-05-19` on `redesign` HEAD; push tag.
- **T-0:10** — Merge: `git checkout Master && git pull && git merge --no-ff redesign -m "feat: launch redesign — content pour complete" && git push origin Master`.
- **T-0:11** — CI run: `.github/workflows/deploy.yml` fires; runtime ~2–4 min. Block until green.
- **T-0:15** — GitHub Pages serves new content.
- **T-0:16** — Live smoke (production): hard-refresh `https://jerseycbt.com` and `https://www.jerseycbt.com`. Confirm new Home, SSL valid, Formspree posts a real test (mark + delete), Calendly widget loads, `/portugues` renders in Portuguese, JSON-LD present, OG image absolute and resolving. Mobile smoke: sticky book button after scroll.
- **T-0:25** — Search & social: submit sitemap to Google Search Console; request indexing on Home + About + Approach + reformulation-letter cornerstone + trauma-PTSD + relationships. OG render test in LinkedIn composer + WhatsApp draft. Update Psychology Today + Think CBT profiles if URLs not pointing at jerseycbt.com root.
- **T-0:40** — Analytics live (if Plausible accepted): confirm Plausible dashboard logging the domain.
- **T-0:45** — Stand-down + monitor: 30-min watch from operator's own browsing. 24-hour post-launch checkpoint scheduled.

### Rollback path

- Visible-to-public regression with no quick fix-forward (<15 min) → roll back.
- Cosmetic issues → fix-forward in a follow-up commit.
- Mechanics: `git checkout Master && git revert --no-edit -m 1 <merge-sha> && git push origin Master`. CI re-deploys reverted state.
- Nuclear (only if revert conflicts intractable): `git reset --hard live-master-pre-launch && git push --force-with-lease origin Master`.

## Open decisions to confirm before pour starts

These are decisions the operator should lock in before page #1 drafting begins:

1. **Plausible analytics**: in scope for this launch, or follow-up? Default = in scope.
2. **First-therapy-session article**: added to queue as item 17.5, or stays out? Default = stays out.
3. **`npm run preflight` wrapper**: written during polish pass, or skipped? Default = written.
4. **Keyword-volume verification step**: operator runs the primary-keyword list through Google Keyword Planner / Ubersuggest before pour starts (≈20 min), or skips and accepts the best-guess keyword map? Default = run the verification.
5. **Google Business Profile**: in scope or follow-up? Default = follow-up (separate workstream).

## Memory update on commit

When the spec lands, update `feedback_therapy_brand_voice.md` to reflect:

- CBT and CAT now parallel/co-equal site-wide, not "CAT first across every surface".
- Bion + Beck paired ethos lineage.
- Two parallel signature assets (reformulation letter + collaborative formulation).
- Original asymmetric framing preserved as the prior position with date of supersession.

## Risks

- **Voice drift across 17 pages.** Sequential pour mitigates by catching drift on page 1 instead of page 17. Polish pass (item 18) is the second line of defence.
- **Cowork artifacts not used.** Operator chose to rewrite from memory + ethos. Risk = duplicating prior work. Mitigation = operator red-penning each page catches any reinvention waste before it propagates.
- **`Master` branch name is capital-M.** CI workflow is case-sensitive (`branches: - Master`). Standard `main`-style commands could miss. Mitigated by explicit `Master` in all checkout / merge / push steps in this spec.
- **CNAME drift.** GitHub Pages occasionally drops the CNAME on deploys. `peaceiris/actions-gh-pages@v3` writes `cname: jerseycbt.com` explicitly each run, but verify in live smoke step.
- **DNS already live = no warmup.** First public visitor hits the new site within seconds of CI completion. No staging step. Mitigation = all gates green before merge; rollback path tested mentally before merge.
- **SEO/voice tension.** Meta titles use client-search language ("Anxiety Therapy Jersey"); H1s use voice-correct pattern language ("Anxiety, and the loop that keeps it going"). Risk is that one register bleeds into the other and either the meta becomes voice-foreign or the H1 becomes generic. Mitigation = dual-register rule explicit; each page proofread separately for meta surface and body surface.
- **Best-guess keyword map.** Volumes in the keyword-to-page map are inferred from agency-source research, not measured. Some Jersey-specific terms may return near-zero local volume; some Portuguese-specific terms may have unexpected competition. Mitigation = optional volume-verification pass (open decision #4) before pour starts.
