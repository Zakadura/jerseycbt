# jerseycbt.com Launch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pour voice-correct, SEO-aware content into the 17 placeholder pages on the `redesign` branch, pass all pre-merge gates, merge `redesign` → `Master` to trigger a single CI deploy, and verify the new site live at https://jerseycbt.com.

**Architecture:** Sequential page-by-page pour on the `redesign` branch. Each page draft is composed under a dual-register rule (client-search language in meta surface, voice-correct language in body). Per-page verification runs the hard-ban grep, the build, and pa11y locally before commit. After all 17 content tasks land (plus polish, plus Plausible wiring), a single `git merge --no-ff redesign Master` triggers the existing GitHub Actions workflow, which deploys `dist/` to `gh-pages` with CNAME `jerseycbt.com`. Rollback anchor is the `pre-redesign` git tag at the prior live `Master` HEAD.

**Tech Stack:** Astro 5 + Tailwind 3 + Markdown content collections (`src/content/`), Plausible analytics (added in this plan), Calendly inline + popup, Formspree contact endpoint `xbdbrlrv`, OpenStreetMap iframe, pa11y-ci accessibility audit, GitHub Pages + custom CNAME, peaceiris/actions-gh-pages@v3 deploy workflow.

**Spec:** [`docs/superpowers/specs/2026-05-19-jerseycbt-launch-design.md`](../specs/2026-05-19-jerseycbt-launch-design.md)

---

## File structure

### Files modified (existing placeholder shells)

```
src/pages/
├── index.astro               (Home)
├── about.astro               (About)
├── approach.astro            (Approach)
├── fees.astro                (Fees)
├── contact.astro             (Contact — light copy edits only)
├── book.astro                (Book — light copy edits only)
├── portugues.astro           (Portuguese landing)
├── privacy.astro             (Plausible disclosure addition only)

src/content/conditions/
├── anxiety.md
├── trauma-ptsd.md
├── ocd.md
├── depression.md
├── relationships.md
├── burnout.md

src/content/articles/
├── cbt-vs-cat.md             (existing placeholder → CBT vs CAT comparison)
├── how-long-cbt-anxiety.md   (existing placeholder → how-long article)
```

### Files created

```
src/content/articles/
├── what-is-cat.md            (NEW — CAT plain-English cornerstone)
├── reformulation-letter.md   (NEW — reformulation letter cornerstone)

scripts/
├── preflight.sh              (NEW — preflight wrapper, optional per Open Decision #3)

(maybe) src/layouts/BaseLayout.astro   (modify only — add Plausible script tag)
```

### Files untouched (verify only)

- `src/lib/jsonld.ts` — JSON-LD data unchanged from commit `6bf9308`.
- `astro.config.mjs` — integrations stay (tailwind, sitemap).
- `.github/workflows/deploy.yml` — CI workflow unchanged.
- `public/CNAME` — already contains `jerseycbt.com`.
- `tailwind.config.mjs`, `tsconfig.json`, `package.json` — no dep changes.

---

## Phase 0 — Pre-pour setup

### Task 0.1: Baseline verification + branch sync

**Files:** none (verification only)

- [ ] **Step 1: Confirm working tree clean, branch is `redesign`, in sync with origin**

```bash
cd "C:\Users\rodri\OneDrive\Documents\Claude\Business Development\jerseycbt"
git status
git branch --show-current
git fetch origin
git log origin/redesign..redesign --oneline    # should print nothing (or only the spec commit)
git log redesign..origin/redesign --oneline    # should print nothing
```

Expected: branch `redesign`, working tree clean (except untracked `node_modules/`, `dist/`), no divergence from origin (the spec commit `6b96990` may not yet be pushed — that's fine, it'll go with the pour commits).

- [ ] **Step 2: Confirm `pre-redesign` tag exists**

```bash
git rev-parse pre-redesign
git show pre-redesign --stat | head -3
```

Expected: SHA `8325ad1...`, commit on `Master`. This is the rollback anchor.

- [ ] **Step 3: Baseline build + a11y green**

```bash
npm ci
npm run build
npm run a11y
```

Expected: build exits 0 (warnings about placeholder content allowed), pa11y exits 0 on all configured routes. If a11y fails, fix BEFORE starting pour — placeholder pages must already be accessible.

- [ ] **Step 4: Baseline placeholder inventory**

```bash
grep -rnE "Placeholder|TODO|TODO_RODRIGO|FIXME|Lorem|C[0-9]+\.[0-9]+" src/ > .baseline-placeholders.txt
wc -l .baseline-placeholders.txt
```

Expected: ~30+ lines. This file is the start-state inventory. At Phase 5 the same grep returns zero matches.

- [ ] **Step 5: Snapshot the live old site for visual diff later**

Open https://jerseycbt.com in a browser tab. Take a full-page screenshot (browser dev-tools or extension). Save to `docs/superpowers/plans/_baseline-snapshot-2026-05-19.png` (NOT committed — just for reference). This is the visual anchor for the launch smoke step.

- [ ] **Step 6: Commit baseline marker (optional)**

No commit needed — this task is verification only.

---

### Task 0.2: Keyword-volume verification (Open Decision #4 — default: run)

**Files:** none (operator-driven verification)

**Time budget:** ~20 min. Confirms the best-guess keyword map against actual Jersey + Portuguese-language search volumes before any meta layer is written.

- [ ] **Step 1: Open Google Keyword Planner (or Ubersuggest free tier)**

URL: https://ads.google.com/intl/en_uk/home/tools/keyword-planner/ (requires Google account; "Get search volume and forecasts" mode is free without an active campaign).

- [ ] **Step 2: Run primary-keyword list from spec, scope to United Kingdom + Channel Islands**

Paste the 17 primary keywords from the SEO map:

```
private therapist Jersey
therapist Jersey
CBT and CAT therapy
private therapist fees Jersey
therapist Jersey contact
therapist consultation Jersey
terapeuta português Jersey
anxiety therapy Jersey
trauma therapy Jersey
OCD therapy Jersey
depression therapy Jersey
relationship patterns therapy
burnout therapy Jersey
what is Cognitive Analytical Therapy
CBT vs CAT
how long does CBT for anxiety take
reformulation letter CAT
```

- [ ] **Step 3: For each row, record monthly volume + competition**

If any primary keyword returns **zero or near-zero** local volume, replace with a higher-volume synonym BEFORE pour. Common substitutions to consider:
- "therapist Jersey" → "counsellor Jersey" or "psychotherapist Jersey" if higher
- "anxiety therapy Jersey" → "anxiety counselling Jersey" or "anxiety help Jersey"
- "OCD therapy Jersey" → "OCD counselling Jersey" or "intrusive thoughts therapy"

- [ ] **Step 4: Update spec keyword map if substitutions made**

If any primary keyword changes, edit `docs/superpowers/specs/2026-05-19-jerseycbt-launch-design.md` SEO section, then commit with:

```bash
git add docs/superpowers/specs/2026-05-19-jerseycbt-launch-design.md
git commit -m "docs: substitute verified keywords in launch spec SEO map"
```

If no substitutions needed, no commit. Move on.

---

### Task 0.3: Wire Plausible analytics (Open Decision #1 — default: in scope)

**Files:**
- Modify: `src/layouts/BaseLayout.astro` (or whichever `<head>`-bearing layout components use — verify first)
- Modify: `src/pages/privacy.astro` (add Plausible disclosure paragraph)

- [ ] **Step 1: Identify the head-bearing layout**

```bash
grep -rln '<head>' src/layouts/ src/pages/ src/components/ | head -10
```

Expected: one of `src/layouts/BaseLayout.astro`, `src/layouts/Layout.astro`, or similar. Note the path — that's the file to modify.

- [ ] **Step 2: Add Plausible script tag inside `<head>` of the base layout**

Add immediately after the existing `<meta>` block, before any other `<script>` or stylesheet:

```html
<script defer data-domain="jerseycbt.com" src="https://plausible.io/js/script.js"></script>
```

No cookies, no consent banner needed (Plausible is cookieless + ICO-compliant). Per spec G9, privacy page must mention Plausible by name — done in step 3.

- [ ] **Step 3: Add Plausible disclosure paragraph to `src/pages/privacy.astro`**

Locate the analytics/data section (or, if none exists, add one before the "Contact" section). Insert:

```
**Analytics.** This site uses Plausible Analytics (https://plausible.io) to count page views and referrers. Plausible does not use cookies and does not collect or store any personal information. Aggregated, anonymous data only. No tracking across sites.
```

The exact phrasing must respect voice contract hard bans (no "your privacy is important to us", no wellness register). Use the line above as the canonical version.

- [ ] **Step 4: Build locally to confirm Plausible script renders**

```bash
npm run build
grep -l 'plausible.io' dist/index.html
```

Expected: at least one match — the script tag should be in every page's `<head>`.

- [ ] **Step 5: Verify Plausible dashboard reachable (operator)**

Operator confirms account at https://plausible.io exists or signs up. Domain `jerseycbt.com` must be added before traffic logs. This is a Plausible-side config step, not a code step. If account not yet set up, defer Plausible disclosure language in privacy.astro to a follow-up commit and skip Steps 2 + 3; in that case mark Open Decision #1 as deferred and continue.

- [ ] **Step 6: Commit**

```bash
git add src/layouts/BaseLayout.astro src/pages/privacy.astro
git commit -m "feat: wire Plausible analytics + privacy disclosure"
```

(Use the actual layout file path identified in Step 1 — substitute if different.)

---

## Phase 1 — Top-of-funnel pages

### Task 1.1: Home (`src/pages/index.astro`)

**Files:**
- Modify: `src/pages/index.astro`

**Spec ref:** Queue item #1; SEO map row 1. Lead: both, parallel.

**Pre-drafted SEO surface (lock these strings):**
- Slug: `/` (Home)
- Meta title (≤60 chars): `Rodrigo Silva — CBT & CAT Therapy in Jersey` (44 chars)
- Meta description (≤155 chars): `Private therapy in Jersey with Rodrigo Silva — BABCP CBT and ACAT CAT. Reformulation letters, behavioural experiments. I don't promise to fix anything.` (151 chars)
- H1: `Patterns that don't shift on their own.`

**Required moves (must hit ≥3):**
- Named pattern, not feeling — H1 itself.
- Named methods — reformulation letter AND collaborative formulation in named-specifics block (parallel signatures rule).
- Honest limit — "I don't promise to fix anything" in hero.
- Bion/Beck-style sentence — one in opening paragraph.

**Structural skeleton (subheading list + opening lines):**

```
H1: Patterns that don't shift on their own.

Hero opener (1 paragraph): "[Bion-style opening sentence — respect-the-reader move]. I'm Rodrigo Silva — a private psychotherapist in Saint Helier, accredited with BABCP (CBT) and ACAT (CAT). I don't promise to fix anything. I promise to think with you."

H2: What I work with
  — 4-5 condition cards (anxiety, trauma & PTSD, depression, relationships, OCD/burnout) — pulled from existing ConditionCard component if already rendered, else hand-listed. Each card 1 sentence in voice.

H2: How I work
  — 2 named-specifics blocks side by side:
    Block 1 (CAT side): "The reformulation letter." Opening sentence: "Early in the work, I write you a letter that lays out the patterns I'm hearing — in your words, not jargon. It's the document the rest of the work moves through."
    Block 2 (CBT side): "Collaborative formulation." Opening sentence: "We map what's happening on paper together — what triggers what, what maintains it, what we can test in the week between sessions. You leave with a working model, not advice."

H2: Where to start
  — CTA block. Free 15-min consult (Calendly /15-min-onboard) as primary. Paid 50-min initial via SessionCTA. Email/phone direct.

Closing line: anchor phrase variant. e.g. "If the same loop keeps reasserting itself, that's the work."
```

- [ ] **Step 1: Read current `src/pages/index.astro`**

```bash
cat src/pages/index.astro
```

Note the layout component imported, the meta title/description props (or wherever they're set), and the existing hero/section structure. Keep all component imports unchanged — only rewrite the prose and meta.

- [ ] **Step 2: Replace meta title + meta description**

Find the existing `<title>`, `<meta name="description">`, or layout props that set them. Replace with the pre-drafted strings above. Confirm character lengths:

```bash
echo -n "Rodrigo Silva — CBT & CAT Therapy in Jersey" | wc -c
echo -n "Private therapy in Jersey with Rodrigo Silva — BABCP CBT and ACAT CAT. Reformulation letters, behavioural experiments. I don't promise to fix anything." | wc -c
```

Expected: 44 and 151. (The em-dash is one char in UTF-8 byte count terms it's 3, but Google's char-counting uses display chars — these strings are display-correct.)

- [ ] **Step 3: Replace placeholder body copy following the skeleton above**

Hand-write the prose under each H2 using the structural skeleton. Each block must hit at least one required move. Keep paragraphs short (2-4 sentences). No bullet points unless the existing component design uses them.

- [ ] **Step 4: Hard-ban grep on this file**

```bash
grep -inE "safe space|on a journey|non.judgemental|here to help|unlock your potential|wellness|holistic|compassionate|empower|empowerment|In today's fast.paced|Many people struggle|self.care|self.love|growth journey" src/pages/index.astro
```

Expected: no matches. If any match, rewrite the section that contains it.

- [ ] **Step 5: Build + a11y green on this page**

```bash
npm run build
npm run a11y -- --reporter cli 2>&1 | grep -E "/(index\.html| / )" || npm run a11y
```

Expected: build exits 0, pa11y exits 0 on Home. Fix any failures before commit.

- [ ] **Step 6: Operator red-pen (stop and present)**

Present the rewritten `index.astro` to the operator for voice review. Operator either says "ship" or red-pens specific sections. If red-penned, revise and rerun Steps 4–5.

- [ ] **Step 7: Commit**

```bash
git add src/pages/index.astro
git commit -m "content: Home — voice + SEO pour (item 1/17)"
```

---

### Task 1.2: About (`src/pages/about.astro`)

**Files:**
- Modify: `src/pages/about.astro`

**Spec ref:** Queue item #2; SEO map row 2. Lead: both, parallel.

**Pre-drafted SEO surface:**
- Slug: `/about/`
- Meta title (≤60 chars): `About Rodrigo Silva — Therapist in Jersey` (42 chars)
- Meta description (≤155 chars): `Private psychotherapist in St Helier, Jersey — BABCP accredited (CBT), ACAT accredited (CAT). Bion and Beck as lineage. I think with, not at.` (147 chars)
- H1: `About my practice.`

**Required moves:**
- Bion AND Beck named in lineage paragraph (spec requirement).
- BABCP + ACAT + OPP credentials listed at same line weight (no hierarchy).
- "I don't promise to fix anything" present (or anchor variant).
- One Bion-style sentence.

**Structural skeleton:**

```
H1: About my practice.

Para 1 (opening — relational frame): "[Bion-style opening — what the work is when it's working]. I work privately from Saint Helier, with people across the Channel Islands, the UK, and online with Portuguese speakers in Portugal and Brazil."

H2: Where the work comes from
  — Lineage paragraph naming Bion and Beck:
    "Two traditions shape how I work. From Wilfred Bion (the analytic tradition CAT draws from): the practice of thinking-with rather than thinking-at, and the discipline of staying close to what's actually happening rather than what the manual says should be happening. From Aaron Beck (the founder of CBT): collaborative empiricism — the patient is a scientist of their own experience, and we test together what holds up."

H2: Credentials
  — Short list at equal weight:
    "BABCP-accredited Cognitive Behavioural Therapist."
    "ACAT-accredited Cognitive Analytic Therapist."
    "Registered with the Ordem dos Psicólogos Portugueses (Portugal)."
    "Also listed on Psychology Today and Think CBT."

H2: What I don't do
  — Honest-limit list:
    "I don't promise to fix anything — I promise to think with you."
    "I don't do couples work."
    "I don't take on cases where the right intervention is psychiatry, inpatient care, or addiction services I'm not trained for. If we meet and that's what you need, I'll say so."

H2: How to begin
  — CTA: free 15-min consult.
```

- [ ] **Step 1: Read current `src/pages/about.astro`**

```bash
cat src/pages/about.astro
```

- [ ] **Step 2: Replace meta + body following skeleton above**

- [ ] **Step 3: Hard-ban grep**

```bash
grep -inE "safe space|on a journey|non.judgemental|here to help|unlock your potential|wellness|holistic|compassionate|empower|empowerment|In today's fast.paced|Many people struggle|self.care|self.love|growth journey" src/pages/about.astro
```

Expected: no matches.

- [ ] **Step 4: Build + a11y green**

```bash
npm run build
npm run a11y
```

- [ ] **Step 5: Operator red-pen**

- [ ] **Step 6: Commit**

```bash
git add src/pages/about.astro
git commit -m "content: About — Bion + Beck lineage, parallel modality (item 2/17)"
```

---

### Task 1.3: Approach (`src/pages/approach.astro`)

**Files:**
- Modify: `src/pages/approach.astro`

**Spec ref:** Queue item #3; SEO map row 3. Lead: both, parallel.

**Pre-drafted SEO surface:**
- Slug: `/approach/`
- Meta title: `Approach — How I work in CBT and CAT` (37 chars)
- Meta description: `How CBT and CAT actually work in the room — collaborative formulation, behavioural experiments, the reformulation letter, reciprocal roles. Honest gating logic.` (Note: 162 chars — trim. Final: `How CBT and CAT work in the room — collaborative formulation, behavioural experiments, reformulation letters, reciprocal roles. Honest gating logic.`) (148 chars)
- H1: `How I work.`

**Required moves:**
- Equal-billing CBT and CAT sections.
- Named CAT mechanisms: reformulation letter, sequential diagrammatic reformulation (SDR), exits, reciprocal roles.
- Named CBT mechanisms: collaborative formulation, behavioural experiments, exposure, behavioural activation, cognitive restructuring.
- Honest gating-logic section ("when each is the right call") — not "we use both".

**Structural skeleton:**

```
H1: How I work.

Para 1 (opener): "[Single-sentence orientation]. Two structured modalities, two different routes into the work, both serious."

H2: How CBT looks in the room
  Para 1 (Beck-style opener): "Beck's framing: you're the scientist of your own experience, and we collaborate on what holds up. CBT is structured, time-aware, and works the present forward."
  Sub-bullets or paragraphs:
    — Collaborative formulation. Sentence each on what it is, what it produces, who it suits.
    — Behavioural experiments. Same.
    — Exposure (ERP for OCD, in vivo and imaginal for anxiety, trauma-focused for PTSD).
    — Behavioural activation (depression).
    — Cognitive restructuring (when the thought-level is where it gets stuck).

H2: How CAT looks in the room
  Para 1 (Bion-style opener): "Bion's framing: thinking-with rather than thinking-at. CAT works the relational and identity patterns that CBT can leave running underneath."
  Sub-bullets or paragraphs:
    — The reformulation letter. Sentence on what it is, when it's written, what it does.
    — Sequential Diagrammatic Reformulation (SDR). What it maps, why on paper.
    — Reciprocal roles. What they are, why naming them shifts something.
    — Exits. The targeted procedure language.
    — Target Problem Procedures. The named-pattern method.

H2: When each is the right call
  Gating-logic paragraphs (not bullets):
    "When CBT is the right call: [list — symptom-led, time-bounded, the present is where it's stuck, ERP for ritual, BA for anhedonic depression, exposure for clean discrete trauma]."
    "When CAT is the right call: [list — pattern keeps reasserting itself, relational themes, identity-level work, the same therapy keeps not working in the same way]."
    "When both are in play: [list — complex presentations, trauma + relational, OCD with identity component, recurrent depression with reciprocal-role driver]."

H2: How to start
  CTA: free 15-min consult.
```

- [ ] **Step 1: Read `src/pages/approach.astro`**

- [ ] **Step 2: Replace meta + body**

- [ ] **Step 3: Hard-ban grep**

```bash
grep -inE "safe space|on a journey|non.judgemental|here to help|unlock your potential|wellness|holistic|compassionate|empower|empowerment|In today's fast.paced|Many people struggle|self.care|self.love|growth journey" src/pages/approach.astro
```

- [ ] **Step 4: Build + a11y green**

```bash
npm run build && npm run a11y
```

- [ ] **Step 5: Operator red-pen**

- [ ] **Step 6: Commit**

```bash
git add src/pages/approach.astro
git commit -m "content: Approach — parallel CBT/CAT sections + gating logic (item 3/17)"
```

---

### Task 1.4: Fees (`src/pages/fees.astro`)

**Files:**
- Modify: `src/pages/fees.astro`

**Spec ref:** Queue item #4; SEO map row 4. Lead: operational.

**Pre-drafted SEO surface:**
- Slug: `/fees/`
- Meta title: `Fees & Sessions — Jersey Therapy` (32 chars)
- Meta description: `Session fees, insurance, free 15-min consultation. CBT and CAT in Jersey — typical work runs 8 to 16 sessions, with a written reformulation or formulation.` (155 chars)
- H1: `Fees and sessions.`

**Required moves:**
- Honest length limit (8–16 sessions framing per spec).
- Named deliverable (reformulation letter OR collaborative formulation).
- No wellness-pricing register ("investment in yourself" is banned).
- One Bion-style or Beck-style line.

**Structural skeleton:**

```
H1: Fees and sessions.

H2: What sessions cost
  Para: "[Hourly fee, currency, what's included]. Pay per session, by bank transfer or card."

H2: Session length and number
  Para 1: "Sessions are 50 minutes, usually weekly while we're building the formulation, sometimes fortnightly once the work is established."
  Para 2: "Most people work with me for 8 to 16 sessions. Some less, some more. The work is sized to the problem, not the calendar."
  Para 3 (named deliverables): "By session 4 to 6, either a reformulation letter (if we're on the CAT route) or a collaborative formulation (if CBT) is on paper. That document is the working spine."

H2: Free 15-minute consultation
  Para: "First contact is a free 15-minute call. You describe what's bringing you. I say whether I think this is workable, and what route I'd suggest. If it's not workable with me, I say so and where to look."
  CTA: Calendly button.

H2: Insurance and self-pay
  Para: "I work with [list AXA, BUPA, etc. — pull from existing InsuranceLogos component]. Self-pay is also straightforward — I'll send an invoice you can submit if needed."

H2: Cancellation
  Para: "Cancellation under 48 hours is chargeable at full session fee. Earlier than that, no charge."
```

- [ ] **Step 1: Read `src/pages/fees.astro`**

- [ ] **Step 2: Pull exact session fee + insurance providers from existing components**

```bash
grep -inE "fee|price|£|\\$|insurance" src/pages/fees.astro src/components/PriceTable.astro src/components/InsuranceLogos.astro 2>/dev/null
```

Use the values found — don't invent. If the file uses a `PriceTable` component, the fee data may live in props.

- [ ] **Step 3: Replace meta + body**

- [ ] **Step 4: Hard-ban grep + extra fees-specific ban scan**

```bash
grep -inE "safe space|on a journey|non.judgemental|here to help|unlock your potential|wellness|holistic|compassionate|empower|empowerment|In today's fast.paced|Many people struggle|self.care|self.love|growth journey|investment in yourself|invest in your" src/pages/fees.astro
```

Expected: no matches.

- [ ] **Step 5: Build + a11y green**

- [ ] **Step 6: Operator red-pen**

- [ ] **Step 7: Commit**

```bash
git add src/pages/fees.astro
git commit -m "content: Fees — session arc + named deliverable (item 4/17)"
```

---

## Phase 2 — Action pages

### Task 2.1: Contact (`src/pages/contact.astro`)

**Files:**
- Modify: `src/pages/contact.astro`

**Spec ref:** Queue item #5; SEO map row 5. Lead: modality-neutral, relational opening.

**Pre-drafted SEO surface:**
- Slug: `/contact/`
- Meta title: `Contact — Rodrigo Silva, Jersey Therapist` (42 chars)
- Meta description: `Get in touch with Rodrigo Silva — private therapist in Saint Helier, Jersey. Email, phone, contact form. I usually reply within two working days.` (149 chars)
- H1: `Getting in touch.`

**Required moves:**
- Honest response-time limit explicit.
- Bion-style sentence on what to write in first message.
- No "we'd love to hear from you" / "reach out" register.

**Structural skeleton:**

```
H1: Getting in touch.

Para 1 (Bion-style): "If you're not sure what to say in a first message, this is what helps: a sentence or two about what's bringing you, whether you'd prefer in-person or online, and a sense of when you'd be free for a 15-minute consultation. Anything more detailed can wait for the call."

H2: Reply window
  Para: "I usually reply within two working days. If it's longer than that, the email has either got buried or I'm away — please feel free to follow up."

H2: Direct contact
  — Email: rod.gui.sil@gmail.com (tel: link)
  — Phone: +44 7458 153479
  — Address: St Helier, Jersey

[ContactForm component renders here — copy unchanged inside the form]
[GoogleMap component renders here]
```

- [ ] **Step 1: Read `src/pages/contact.astro`**

- [ ] **Step 2: Confirm form + map components are still wired (don't touch them, just verify)**

```bash
grep -nE "ContactForm|GoogleMap" src/pages/contact.astro
```

- [ ] **Step 3: Replace meta + body framing (NOT the form innards)**

- [ ] **Step 4: Hard-ban grep**

- [ ] **Step 5: Build + a11y green**

- [ ] **Step 6: Operator red-pen**

- [ ] **Step 7: Commit**

```bash
git add src/pages/contact.astro
git commit -m "content: Contact — relational framing, honest reply window (item 5/17)"
```

---

### Task 2.2: Book (`src/pages/book.astro`)

**Files:**
- Modify: `src/pages/book.astro`

**Spec ref:** Queue item #6; SEO map row 6. Lead: operational.

**Pre-drafted SEO surface:**
- Slug: `/book/`
- Meta title: `Book — Free 15-min Consultation` (31 chars)
- Meta description: `Book a free 15-minute consultation with Rodrigo Silva — Jersey CBT and CAT therapist. The call is for triage, not therapy. If it's not workable I'll say so.` (155 chars)
- H1: `Book a 15-minute consultation.`

**Required moves:**
- Honest limit — what the consult is and isn't.
- Named methods or the gating route (CBT vs CAT decision happens here).
- Bion-style sentence on what triage is.

**Structural skeleton:**

```
H1: Book a 15-minute consultation.

Para 1 (Bion-style): "The 15-minute call is for triage, not therapy. You describe what's bringing you, I say whether I think we can work on it, and what route I'd suggest if so. If I'm not the right person, I'll say so and where to look."

H2: What we cover
  — Three short paragraphs:
    "What you're bringing — a sentence or two, in your words."
    "What route fits — CBT, CAT, or both, and why. (Or: this isn't the right fit, and what is.)"
    "Practical — fees, frequency, in-person or online."

H2: Book
  [CalendlyPopupButton or CalendlyEmbed — /15-min-onboard]

H2: Already had a consultation?
  [SessionCTA — direct email/phone for booking paid initial session]
```

- [ ] **Step 1: Read `src/pages/book.astro`**

- [ ] **Step 2: Confirm Calendly + SessionCTA components still wired**

- [ ] **Step 3: Replace meta + body framing copy**

- [ ] **Step 4: Hard-ban grep**

- [ ] **Step 5: Build + a11y green**

- [ ] **Step 6: Operator red-pen**

- [ ] **Step 7: Commit**

```bash
git add src/pages/book.astro
git commit -m "content: Book — triage framing, honest consult limit (item 6/17)"
```

---

### Task 2.3: Portuguese (`src/pages/portugues.astro`)

**Files:**
- Modify: `src/pages/portugues.astro`

**Spec ref:** Queue item #7; SEO map row 7. Lead: both, parallel. Portuguese-language register.

**Pre-drafted SEO surface (Portuguese):**
- Slug: `/portugues/`
- Meta title: `Terapia em Português — Jersey e Online` (40 chars)
- Meta description: `Psicoterapeuta português em Jersey — TCC (CBT) e TAC (CAT) com Rodrigo Silva. Não prometo consertar nada; prometo pensar contigo. Consulta gratuita de 15 minutos.` (Trim to 154 chars — final: `Psicoterapeuta português em Jersey — TCC (CBT) e TAC (CAT) com Rodrigo Silva. Não prometo consertar nada — prometo pensar contigo.`) (130 chars)
- H1: `Terapia em português.`

**Required moves (Portuguese register):**
- Hard bans translated and respected (no "lugar seguro", no "espaço sem julgamento", no "estou aqui para ajudar").
- Reformulation letter named in Portuguese: "carta de reformulação".
- Collaborative formulation named: "formulação colaborativa".
- One Bion-style or Beck-style line in PT.
- Honest limit translated: "Não prometo consertar nada — prometo pensar contigo".

**Structural skeleton (Portuguese):**

```
H1: Terapia em português.

Para 1 (Bion-style PT opener): "Falo português europeu e estou registado na Ordem dos Psicólogos Portugueses. Trabalho com pessoas em Jersey presencialmente, e online com clientes em Portugal e no Brasil."

Para 2 (honest limit): "Não prometo consertar nada. Prometo pensar contigo. O trabalho é sobre os padrões que não mudam por si — não sobre soluções rápidas."

H2: O que faço
  Para 1: "Trabalho com TCC (Terapia Cognitivo-Comportamental — acreditado BABCP) e TAC (Terapia Analítica Cognitiva — acreditado ACAT). Ambas estruturadas, ambas sérias. A escolha depende do que está a trazer."

  H3: TCC (CBT)
    "Formulação colaborativa, experiências comportamentais, exposição. Estruturada, focada no presente."

  H3: TAC (CAT)
    "A carta de reformulação é o documento central. Mapeamos os padrões — papéis recíprocos, procedimentos, saídas. Trabalho relacional e de identidade."

H2: Com que trabalho
  Lista curta: ansiedade, trauma, depressão, OCD, padrões relacionais, burnout.

H2: Como começar
  Para: "A primeira conversa é uma consulta gratuita de 15 minutos. Descreves o que te traz, eu digo se me parece que conseguimos trabalhar nisto, e que rota sugiro."
  CTA: Calendly /15-min-onboard.
```

- [ ] **Step 1: Read `src/pages/portugues.astro`**

- [ ] **Step 2: Replace meta + body in Portuguese**

Use European Portuguese baseline ("contigo", "estás", "consultório"), with Brazilian-neutral phrasing where the choice exists. Avoid uniquely Brazilian terms ("você" forms in greeting) unless the structure demands.

- [ ] **Step 3: Portuguese hard-ban grep**

```bash
grep -inE "lugar seguro|espaço sem julgamento|estou aqui para ajudar|jornada|empoderamento|bem-estar|cuide de si|você merece|jornada de cura" src/pages/portugues.astro
```

Expected: no matches.

- [ ] **Step 4: Build + a11y green**

- [ ] **Step 5: Operator red-pen (Portuguese-speaking review — operator is native Portuguese)**

- [ ] **Step 6: Commit**

```bash
git add src/pages/portugues.astro
git commit -m "content: Portugues — PT-EU register, carta de reformulacao (item 7/17)"
```

---

## Phase 3 — Condition pages

### Task 3.1: Anxiety (`src/content/conditions/anxiety.md`)

**Files:**
- Modify: `src/content/conditions/anxiety.md`

**Spec ref:** Queue item #8; SEO map row 8. Lead: CBT, CAT secondary.

**Pre-drafted SEO surface:**
- Slug: `/what-i-treat/anxiety/`
- Meta title: `Anxiety Therapy Jersey — CBT and CAT` (37 chars)
- Meta description: `Anxiety therapy in Jersey — CBT for panic, GAD, health anxiety, social anxiety. CAT when the pattern keeps reasserting itself. Free 15-min consultation.` (152 chars)
- H1: `Anxiety, and the loop that keeps it going.`

**Required moves:**
- Named CBT method: collaborative formulation, behavioural experiments, exposure (in vivo + interoceptive for panic).
- Named CAT entry point: reformulation letter when pattern is recurrent.
- Honest limit: "anxiety doesn't always go quickly — and CBT isn't always the right first move."
- One Bion or Beck line.

**Structural skeleton (frontmatter + body):**

```yaml
---
title: "Anxiety, and the loop that keeps it going"
description: "Anxiety therapy in Jersey — CBT for panic, GAD, health anxiety, social anxiety. CAT when the pattern keeps reasserting itself. Free 15-min consultation."
keywords: ["anxiety therapy Jersey", "CBT for anxiety", "panic attacks", "GAD therapy"]
ogImage: "/og-default.jpg"   # or per-page override if heroImage set
---
```

```markdown
[Opening paragraph — Beck-style:] Anxiety isn't the problem. The loop that keeps anxiety going is the problem — the avoidance that lowers it short-term and raises it medium-term, the catastrophic interpretation of an ordinary body sensation, the safety behaviour that prevents the disconfirming evidence. CBT works the loop directly.

## What I work with on the CBT side

- **Panic attacks.** Interoceptive exposure + cognitive work on the catastrophic interpretation. Usually visible improvement in 6–12 sessions.
- **Generalised anxiety (GAD).** Worry postponement, behavioural experiments on probability/cost estimates, intolerance of uncertainty work.
- **Health anxiety.** Reassurance reduction, body-scanning cessation, behavioural experiments on the don't-check rule.
- **Social anxiety.** Attention-bias work, dropping safety behaviours, video review of self-as-others-see-me.

## How CBT looks in the room

[Para — collaborative formulation named, behavioural experiments named, exposure named. Bion/Beck-respect-the-reader sentence here.]

## When CAT is the better route

[Para — "If anxiety has been around since childhood, if it tracks the same relational themes, if you've done CBT before and the symptoms came back: the work is probably at the pattern level. The reformulation letter is where that starts."]

## The honest limit

[Para — "Anxiety doesn't always go quickly. The fast-feeling first weeks (psychoeducation, formulation) are not the work — the work is the experiment phase. Some people find the experiments harder than the symptoms; some find the symptoms reassert when life gets harder. We work with that, not against it."]

## How to start

[Para — free 15-min consult CTA.]
```

- [ ] **Step 1: Read `src/content/conditions/anxiety.md`**

- [ ] **Step 2: Read `src/components/ConditionPage.astro` to confirm frontmatter schema expected**

```bash
cat src/components/ConditionPage.astro
cat src/content/config.ts
```

Make sure frontmatter fields written match the content-collection schema. If schema requires `heroImage`, set it; if schema is permissive, leave default.

- [ ] **Step 3: Replace frontmatter + body following skeleton above**

- [ ] **Step 4: Hard-ban grep**

```bash
grep -inE "safe space|on a journey|non.judgemental|here to help|unlock your potential|wellness|holistic|compassionate|empower|empowerment|In today's fast.paced|Many people struggle|self.care|self.love|growth journey" src/content/conditions/anxiety.md
```

- [ ] **Step 5: Build + a11y green**

```bash
npm run build && npm run a11y
```

- [ ] **Step 6: Internal-linking check — page must link to at least one related article (e.g., how-long-CBT-anxiety)**

- [ ] **Step 7: Operator red-pen**

- [ ] **Step 8: Commit**

```bash
git add src/content/conditions/anxiety.md
git commit -m "content: Anxiety — CBT lead with CAT entry-point (item 8/17)"
```

---

### Task 3.2: Trauma & PTSD (`src/content/conditions/trauma-ptsd.md`)

**Files:**
- Modify: `src/content/conditions/trauma-ptsd.md`

**Spec ref:** Queue item #9; SEO map row 9. Lead: CAT, CBT secondary.

**Pre-drafted SEO surface:**
- Slug: `/what-i-treat/trauma-ptsd/`
- Meta title: `Trauma & PTSD Therapy — Jersey` (30 chars)
- Meta description: `Trauma and PTSD therapy in Jersey — CAT and the reformulation letter for complex relational trauma; trauma-focused CBT and exposure for discrete trauma.` (153 chars)
- H1: `Trauma, and the patterns it leaves.`

**Required moves:**
- Reformulation letter named in opening + repeated.
- Reciprocal roles named.
- Named CBT route: TF-CBT, exposure, cognitive processing — for discrete trauma.
- Honest limit on trauma work pacing.

**Structural skeleton:**

```yaml
---
title: "Trauma, and the patterns it leaves"
description: "Trauma and PTSD therapy in Jersey — CAT and the reformulation letter for complex relational trauma; trauma-focused CBT and exposure for discrete trauma."
keywords: ["trauma therapy Jersey", "PTSD therapist Jersey", "trauma-informed therapy", "reformulation letter trauma"]
---
```

```markdown
[Opening — Bion-style:] Trauma isn't only an event. It's the way the event keeps writing itself into how you relate to people, to your own body, to what feels safe to want. The work isn't to forget what happened. It's to read the letter the trauma is still writing.

## When CAT is the lead route

Most complex relational trauma needs the pattern-level work. The reformulation letter — written by me, in your words, around session 4 to 6 — names the reciprocal roles the trauma installed and the procedures (the moves you make automatically) that keep them running. Once those are on paper, we work them, not the symptoms.

- **Reciprocal roles.** [What they are — short paragraph.]
- **Sequential Diagrammatic Reformulation.** [What it maps — short paragraph.]
- **Exits.** [Why the named-exit move shifts something — short paragraph.]

## When CBT is the lead route

For discrete, single-event trauma — an assault, an accident, a specific recent event — trauma-focused CBT and exposure are usually the right call.

- **Trauma-focused CBT (TF-CBT).** [Sentence — what it does.]
- **Imaginal exposure + cognitive processing.** [Sentence.]
- **In-vivo exposure to trauma reminders.** [Sentence.]

## The honest limit

Trauma work is paced. We don't rush the reformulation. The early sessions are about whether we can work together at all — only then does the letter get written. Some people are not in a place where this work is the right work, and I'll say so.

I don't do couples or family work, and trauma that's still actively unsafe (current abuse, current violence) usually needs a different setting first.

## How to start

Free 15-minute consultation. We'll talk about what happened only as much as you want to, and I'll say whether I think we can work together.
```

- [ ] **Step 1: Read `src/content/conditions/trauma-ptsd.md`**

- [ ] **Step 2: Replace frontmatter + body**

- [ ] **Step 3: Hard-ban grep + trauma-specific extras**

```bash
grep -inE "safe space|on a journey|non.judgemental|here to help|trigger.warning|trauma.informed practitioner|gentle approach|safe and gentle" src/content/conditions/trauma-ptsd.md
```

"trauma-informed" used as filler-adjective is banned. Used in the named-method sense (TF-CBT) it's fine.

- [ ] **Step 4: Build + a11y green**

- [ ] **Step 5: Operator red-pen**

- [ ] **Step 6: Commit**

```bash
git add src/content/conditions/trauma-ptsd.md
git commit -m "content: Trauma & PTSD — CAT lead, reformulation letter centrepiece (item 9/17)"
```

---

### Task 3.3: OCD (`src/content/conditions/ocd.md`)

**Files:**
- Modify: `src/content/conditions/ocd.md`

**Spec ref:** Queue item #10; SEO map row 10. Lead: parallel (ritual-driven → ERP; relational/identity-driven → CAT).

**Pre-drafted SEO surface:**
- Slug: `/what-i-treat/ocd/`
- Meta title: `OCD Therapy Jersey — ERP and CAT` (33 chars)
- Meta description: `OCD therapy in Jersey — Exposure and Response Prevention for ritual-driven OCD; CAT and reformulation letter for identity-driven and relational OCD.` (148 chars)
- H1: `OCD — two routes, depending on the pattern.`

**Required moves:**
- ERP named as primary CBT route.
- Reformulation letter + reciprocal roles named for relational/identity OCD.
- Explicit gating sentence between the two routes.
- Honest limit on ERP difficulty.

**Structural skeleton:**

```yaml
---
title: "OCD — two routes, depending on the pattern"
description: "OCD therapy in Jersey — Exposure and Response Prevention for ritual-driven OCD; CAT and reformulation letter for identity-driven and relational OCD."
keywords: ["OCD therapy Jersey", "ERP Jersey", "intrusive thoughts therapy"]
---
```

```markdown
[Opening:] OCD doesn't run the same way for everyone. For some people the loop is intrusive thought → compulsion → relief → repeat, and Exposure and Response Prevention (ERP) is the established route. For others, the thoughts are about who they are, and the work is at the identity and relational level — that's where CAT comes in.

## When ERP is the right call

If the OCD is ritual-driven — contact contamination, checking, counting, ordering, harm-OCD with compulsive checking, religious or moral scrupulosity with compulsive review — ERP is the evidence-based route.

- **Exposure.** [Sentence on hierarchy + repeated exposure.]
- **Response prevention.** [Sentence — the compulsion doesn't happen, the anxiety habituates.]
- **Cognitive work on Thought-Action Fusion.** [Sentence.]

ERP is hard. The first weeks feel worse before they feel better — that's the mechanism, not a bug.

## When CAT is the better route

If the OCD content is identity-driven — "what if I'm secretly a bad person", "what if I don't really love them", "what if my real self is the threatening one" — and the rituals are mental rather than behavioural, ERP can run aground. The work then is at the level of the reciprocal role: who is the worried self threatening, who is being protected, what's the pattern this is part of. The reformulation letter names that.

[Para — reciprocal roles in OCD context, short.]

## The gating sentence

If the rituals are clear and behavioural: start with ERP. If the OCD is mostly mental and identity-focused, or if ERP has been tried and stalled: the CAT route is where I'd start.

## The honest limit

OCD doesn't go away cleanly. The realistic outcome is significantly reduced compulsion, faster recovery from intrusive thoughts, a working relationship with the residual content. Pretending otherwise is part of how OCD keeps people stuck.

## How to start

Free 15-minute consultation. I'll ask which side this looks like and we'll decide which route to start on.
```

- [ ] **Step 1: Read `src/content/conditions/ocd.md`**

- [ ] **Step 2: Replace frontmatter + body**

- [ ] **Step 3: Hard-ban grep**

- [ ] **Step 4: Build + a11y green**

- [ ] **Step 5: Operator red-pen**

- [ ] **Step 6: Commit**

```bash
git add src/content/conditions/ocd.md
git commit -m "content: OCD — parallel ERP / CAT, explicit gating (item 10/17)"
```

---

### Task 3.4: Depression (`src/content/conditions/depression.md`)

**Files:**
- Modify: `src/content/conditions/depression.md`

**Spec ref:** Queue item #11; SEO map row 11. Lead: parallel (acute → CBT/BA; recurrent → CAT).

**Pre-drafted SEO surface:**
- Slug: `/what-i-treat/depression/`
- Meta title: `Depression Therapy — Jersey` (27 chars)
- Meta description: `Depression therapy in Jersey — Behavioural Activation and CBT for acute episodes; CAT and the reformulation letter for recurrent or pattern-driven depression.` (160 chars — trim. Final: `Depression therapy in Jersey — BA and CBT for acute episodes; CAT and reformulation letter for recurrent, pattern-driven depression.`) (132 chars)
- H1: `Depression, acute and recurrent.`

**Required moves:**
- Behavioural Activation named for acute.
- Reformulation letter + "patterns that don't shift on their own" for recurrent.
- Gating sentence.
- Honest limit — depression often has medical/lifestyle/relational drivers therapy alone won't shift.

**Structural skeleton:**

```yaml
---
title: "Depression, acute and recurrent"
description: "Depression therapy in Jersey — BA and CBT for acute episodes; CAT and reformulation letter for recurrent, pattern-driven depression."
keywords: ["depression therapy Jersey", "CBT for depression", "recurrent depression therapy"]
---
```

```markdown
[Opening:] Depression isn't one thing. A first acute episode after a clear precipitant is a different problem from depression that keeps coming back along the same lines. The two need different routes.

## When CBT and Behavioural Activation are the right call

For a first or acute episode — clear onset, identifiable triggers, anhedonia and inertia as primary symptoms — Behavioural Activation and CBT are well-evidenced.

- **Behavioural Activation.** [What it is — re-introducing value-aligned activity systematically, not waiting for motivation to return.]
- **Cognitive restructuring on rumination.** [Sentence.]
- **Sleep + activity scheduling.** [Sentence.]

Usually visible movement in 6–10 sessions if the depression is acute and behaviourally accessible.

## When CAT is the right call

For recurrent depression — same shape, same triggers, same exit — the work is at the pattern level. Why does it keep being this version of depression, not another one? Whose voice is the depressed voice modelling? What does the depression do for the system around it?

The reformulation letter is where this work starts. It names the reciprocal role the depression maintains and the procedures (the moves) that keep returning to it.

## The gating sentence

If this is a first episode: start with BA + CBT. If this is the third or fourth, and the previous rounds got better and then this came back: CAT first.

## The honest limit

Depression often has drivers therapy alone won't shift — physical health, medication, relationships, work, grief. I'll be honest if I think one of those is doing more of the work than the therapy could. I work with GPs and psychiatrists where appropriate, and I'll suggest that referral if it's the right call.

## How to start

Free 15-minute consultation.
```

- [ ] **Step 1: Read `src/content/conditions/depression.md`**

- [ ] **Step 2: Replace frontmatter + body**

- [ ] **Step 3: Hard-ban grep**

- [ ] **Step 4: Build + a11y green**

- [ ] **Step 5: Operator red-pen**

- [ ] **Step 6: Commit**

```bash
git add src/content/conditions/depression.md
git commit -m "content: Depression — BA acute, CAT recurrent, explicit gating (item 11/17)"
```

---

### Task 3.5: Relationships (`src/content/conditions/relationships.md`)

**Files:**
- Modify: `src/content/conditions/relationships.md`

**Spec ref:** Queue item #12; SEO map row 12. Lead: CAT.

**Pre-drafted SEO surface:**
- Slug: `/what-i-treat/relationships/`
- Meta title: `Relationship Patterns Therapy — Jersey` (39 chars)
- Meta description: `Relational therapy in Jersey for repeated relationship patterns — reciprocal roles, reformulation letter, CAT-led. I don't do couples work.` (140 chars)
- H1: `When relationships keep going the same way.`

**Required moves:**
- Reformulation letter + reciprocal roles centrepiece.
- Explicit "this is not couples work; that's a different intervention" honest limit.
- Honest limit on what individual relational work can and can't shift.

**Structural skeleton:**

```yaml
---
title: "When relationships keep going the same way"
description: "Relational therapy in Jersey for repeated relationship patterns — reciprocal roles, reformulation letter, CAT-led. I don't do couples work."
keywords: ["relationship patterns therapy", "reciprocal roles therapy", "relational therapy Jersey"]
---
```

```markdown
[Opening — Bion-style:] If your relationships keep landing in the same shape — same arguments, same disappointments, same exits — the question isn't whether you're choosing badly. It's what role you keep ending up in, and what role you keep casting the other person in.

## The work

CAT is built for this. The reformulation letter — written by me around session 4 to 6 — names the reciprocal roles you keep entering and the procedures (the moves you make automatically) that keep installing them.

- **Reciprocal roles.** [Short paragraph — what they are, where they come from, why they repeat.]
- **The reformulation letter.** [Short paragraph — what it does, what it looks like.]
- **Procedures and exits.** [Short paragraph.]

## What this isn't

This isn't couples therapy. I work with you, not you-and-partner. If what you need is structured couples work — communication, mediation, joint formulation — that's a different intervention and a different therapist.

It's also not "relationship advice". I'm not the right person if what you want is whether to stay or leave; what I can help with is reading the pattern you keep landing in, regardless of which side of a decision you're on.

## The honest limit

The pattern shifts before the relationships do. People often see the patterns clearly before the patterns stop running them. Some don't shift in the lifetime of the work — what shifts is your relationship to them.

## How to start

Free 15-minute consultation.
```

- [ ] **Step 1: Read `src/content/conditions/relationships.md`**

- [ ] **Step 2: Replace frontmatter + body**

- [ ] **Step 3: Hard-ban grep**

- [ ] **Step 4: Build + a11y green**

- [ ] **Step 5: Operator red-pen**

- [ ] **Step 6: Commit**

```bash
git add src/content/conditions/relationships.md
git commit -m "content: Relationships — CAT lead, not-couples-work limit explicit (item 12/17)"
```

---

### Task 3.6: Burnout (`src/content/conditions/burnout.md`)

**Files:**
- Modify: `src/content/conditions/burnout.md`

**Spec ref:** Queue item #13; SEO map row 13. Lead: parallel.

**Pre-drafted SEO surface:**
- Slug: `/what-i-treat/burnout/`
- Meta title: `Burnout Therapy Jersey` (22 chars)
- Meta description: `Burnout therapy in Jersey — behavioural rebalancing for exhaustion-led burnout; CAT and the reformulation letter for narrative and identity-led burnout.` (151 chars)
- H1: `Burnout, and what it's actually doing.`

**Required moves:**
- Named CBT route (behavioural rebalancing, values work).
- Named CAT route (reformulation letter, reciprocal roles, identity-procedure).
- Explicit reframing if `self-care` appears — it appears ONLY to be argued against.
- Honest limit on what therapy can and can't shift about work systems.

**Structural skeleton:**

```yaml
---
title: "Burnout, and what it's actually doing"
description: "Burnout therapy in Jersey — behavioural rebalancing for exhaustion-led burnout; CAT and the reformulation letter for narrative and identity-led burnout."
keywords: ["burnout therapy Jersey", "exhaustion therapy", "work burnout counselling"]
---
```

```markdown
[Opening:] Burnout is not a synonym for being tired. It's a specific pattern — a sustained mismatch between what you keep giving and what comes back, plus the meaning-collapse that follows. The work isn't "self-care". Self-care is what the burnout industry tries to sell to people who already over-perform. The work is reading the pattern.

## When the lead is behavioural

For burnout that's primarily exhaustion-led — overwork, undersleep, no recovery — the route is structural and behavioural.

- **Behavioural rebalancing.** [Sentence — what gets removed, what gets restored, on what schedule.]
- **Values work (ACT-aligned).** [Sentence.]
- **Limit-setting in working life.** [Sentence.]

## When the lead is narrative

For burnout that's primarily about identity — "who am I when I'm not the one doing this", "what does it mean about me if I stop" — the route is CAT.

- **The reformulation letter** names the reciprocal role the over-functioning maintains. (Who needs to be looked after? Whose disappointment is being prevented? Whose values are being lived?)
- **Procedures and exits** for the over-functioning patterns.

## The honest limit

Therapy doesn't fix bad workplaces. Some burnout is being caused, and the only real intervention is structural change — different role, different employer, different career. I'll say so if I think that's what's happening. What therapy can do is help you read the pattern clearly enough to make the decision you've been postponing.

## How to start

Free 15-minute consultation.
```

- [ ] **Step 1: Read `src/content/conditions/burnout.md`**

- [ ] **Step 2: Replace frontmatter + body**

- [ ] **Step 3: Hard-ban grep — `self-care` allowed ONLY if argued against**

```bash
grep -inE "safe space|on a journey|non.judgemental|here to help|unlock your potential|wellness|holistic|compassionate|empower|empowerment|In today's fast.paced|Many people struggle|self.love|growth journey" src/content/conditions/burnout.md
grep -n "self.care" src/content/conditions/burnout.md
```

Second grep should match the line "Self-care is what the burnout industry tries to sell to people who already over-perform" and no others. If `self-care` appears in any non-argued-against context, rewrite.

- [ ] **Step 4: Build + a11y green**

- [ ] **Step 5: Operator red-pen**

- [ ] **Step 6: Commit**

```bash
git add src/content/conditions/burnout.md
git commit -m "content: Burnout — parallel behavioural / narrative, anti-self-care frame (item 13/17)"
```

---

## Phase 4 — Article pages

### Task 4.1: Article — What is CAT (NEW file)

**Files:**
- Create: `src/content/articles/what-is-cat.md`

**Spec ref:** Queue item #14; SEO map row 14. Lead: CAT.

**Pre-drafted SEO surface:**
- Slug: `/articles/what-is-cat/`
- Meta title: `What is CAT? — Cognitive Analytical Therapy` (45 chars)
- Meta description: `A plain-English guide to Cognitive Analytical Therapy (CAT) — what it is, where it came from, what a reformulation letter does, how it differs from CBT.` (150 chars)
- H1: `What is Cognitive Analytic Therapy? A plain-English guide.`

**Required moves:**
- Reformulation letter named in opening, explained as signature deliverable.
- Reciprocal roles, SDR, exits, procedures all named.
- Honest comparison to CBT and psychodynamic — what CAT is and isn't.
- ~1500–2000 words.

**Structural skeleton:**

```yaml
---
title: "What is Cognitive Analytic Therapy? A plain-English guide"
description: "A plain-English guide to Cognitive Analytical Therapy (CAT) — what it is, where it came from, what a reformulation letter does, how it differs from CBT."
pubDate: 2026-05-19
heroImage: "/images/articles/what-is-cat.jpg"   # if asset exists, else /og-default.jpg
tags: ["CAT", "modalities", "explainer"]
---
```

```markdown
## The 60-second version

Cognitive Analytic Therapy (CAT) is a structured, time-limited talking therapy developed in the UK by Anthony Ryle in the 1980s. It combines the relational depth of psychodynamic work with the practical structure of cognitive therapy. The signature move: by the end of the early sessions, the therapist writes you a letter — the **reformulation letter** — that names the patterns at work in your life in your own words. That letter is the working spine of the rest of the therapy.

## Where it came from

[Paragraph — Ryle, NHS context, the practical problem of "the therapy that doesn't have to take ten years to be deep". Cite plainly, no name-dropping for its own sake.]

## What the reformulation letter actually is

[Two or three paragraphs — what's in it, how long it is, when it's written, what it does, what it's like to receive one. The Bion move: the letter respects the reader's intelligence; it doesn't instruct, it names.]

## The vocabulary CAT uses

### Reciprocal roles

[Paragraph — what they are, with a concrete example. e.g. "criticising-to-criticised" / "neglecting-to-neglected".]

### Procedures

[Paragraph — what they are. The automatic moves that maintain reciprocal roles.]

### Sequential Diagrammatic Reformulation (SDR)

[Paragraph — the map on paper. Why putting the procedure on a single page makes the procedure visible.]

### Target Problem Procedures + Exits

[Paragraph — naming the specific procedure to be worked on, and the specific exit move from it.]

## How CAT differs from CBT

[Two paragraphs — fair comparison. CBT works the present-tense maintenance cycle and the cognitive content. CAT works the relational pattern the maintenance cycle is serving. Neither subsumes the other. Both are evidence-based for different things.]

## How CAT differs from psychodynamic therapy

[One paragraph — CAT is time-limited (typically 16 or 24 sessions), written-document-led, focused on named procedures and exits. Psychodynamic work is open-ended, less explicitly structured, less concerned with naming procedures as targets.]

## When CAT is a good fit

[Paragraph — recurrent patterns, relational themes, identity-level work, the same therapy keeps not working in the same way.]

## When CAT isn't the right call

[Paragraph — acute first-episode CBT-amenable presentations, ritual-driven OCD, single-event PTSD, where the structure of the problem is clearly present-tense maintenance.]

## Reading on

[Paragraph — Ryle's "Introducing CAT", ACAT (acat.me.uk). One or two short references. No Amazon links.]
```

- [ ] **Step 1: Confirm articles content collection schema**

```bash
cat src/content/config.ts | head -30
```

Note required fields. Match frontmatter to schema.

- [ ] **Step 2: Create file**

```bash
touch src/content/articles/what-is-cat.md
```

- [ ] **Step 3: Write frontmatter + body following skeleton**

- [ ] **Step 4: Hard-ban grep**

- [ ] **Step 5: Build + a11y green**

```bash
npm run build && npm run a11y
```

Verify the new article appears in `dist/articles/what-is-cat/index.html` and that `/articles/` index lists it (the index page rebuilds the list from the collection automatically).

- [ ] **Step 6: Internal-linking check — article links to Approach, to relationships condition, to reformulation-letter article (forward-link OK even if that article isn't written yet — slug is known)**

- [ ] **Step 7: Operator red-pen**

- [ ] **Step 8: Commit**

```bash
git add src/content/articles/what-is-cat.md
git commit -m "content: Article — what is CAT (item 14/17)"
```

---

### Task 4.2: Article — CBT vs CAT (existing placeholder)

**Files:**
- Modify: `src/content/articles/cbt-vs-cat.md`

**Spec ref:** Queue item #15; SEO map row 15. Lead: parallel, fair comparison.

**Pre-drafted SEO surface:**
- Slug: `/articles/cbt-vs-cat/`
- Meta title: `CBT vs CAT — Which is right for me?` (35 chars)
- Meta description: `CBT vs CAT — an honest comparison. What each modality does well, where each falls short, and how to tell which one your problem actually needs.` (143 chars)
- H1: `CBT or CAT — which fits the problem?`

**Required moves:**
- Both modalities described in equal weight, equal seriousness.
- Named gating logic (when each is the right call).
- Honest limits of each.
- ~1200–1800 words.

**Structural skeleton:**

```yaml
---
title: "CBT or CAT — which fits the problem?"
description: "CBT vs CAT — an honest comparison. What each modality does well, where each falls short, and how to tell which one your problem actually needs."
pubDate: 2026-05-19
tags: ["CBT", "CAT", "modalities", "comparison"]
---
```

```markdown
## The short answer

CBT is the right route when the problem is a present-tense maintenance cycle and you can name a thought-feeling-behaviour loop. CAT is the right route when the problem is a recurring pattern across relationships, time, and presentations, and you can name a shape that keeps happening. Plenty of problems have both.

## What CBT does

[Paragraph — structured, time-bounded, present-focused. Collaborative empiricism (Beck): you're the scientist of your own experience and we test what holds up. Best-evidenced for anxiety disorders, OCD with rituals, depression with clear behavioural markers, PTSD with single-event trauma.]

[Paragraph — concrete CBT toolkit: collaborative formulation, behavioural experiments, exposure, behavioural activation, cognitive restructuring.]

[Paragraph — honest CBT limit: if the problem is a pattern the formulation keeps re-installing, CBT can stall.]

## What CAT does

[Paragraph — structured but pattern-focused. Combines analytic depth (Bion: thinking-with rather than thinking-at) with practical structure. Best-evidenced for personality difficulties, complex relational trauma, recurrent depression, repeated relational patterns.]

[Paragraph — concrete CAT toolkit: reformulation letter, sequential diagrammatic reformulation, reciprocal roles, procedures, exits.]

[Paragraph — honest CAT limit: it's not the fast route to symptom reduction. The pattern shifts before the symptoms always do.]

## How to tell which one your problem needs

[Numbered list:
  1. If this is a first episode and the trigger is clear → CBT.
  2. If you've done therapy before and the same problem keeps coming back → CAT.
  3. If the problem is symptom-led (panic attacks, intrusive thoughts with rituals, acute depression after a clear precipitant) → CBT.
  4. If the problem is relationship-led, identity-led, or the symptoms are different each time but the shape is the same → CAT.
  5. If you can't tell, both work — the 15-minute consultation is for triage.
]

## When both are in play

[Paragraph — many complex presentations need both. The serial / integrated approach: CBT for the acute layer, CAT for the pattern layer. Sometimes simultaneously, sometimes one after the other.]

## What I do in practice

[Paragraph — BABCP-accredited in CBT, ACAT-accredited in CAT. Modality fit decided at the 15-minute consultation, not by site preference. Operator note: state honestly that both are taken seriously.]

## The plain summary

[Closing paragraph — anchor phrase variant: "Patterns that don't shift on their own usually need the CAT route. Loops that respond to structured experiments usually need the CBT route. The work is naming which one you're inside."]
```

- [ ] **Step 1: Read existing `src/content/articles/cbt-vs-cat.md` placeholder**

- [ ] **Step 2: Replace frontmatter + body**

- [ ] **Step 3: Hard-ban grep**

- [ ] **Step 4: Build + a11y green**

- [ ] **Step 5: Internal-linking — links to /articles/what-is-cat/ and /approach/**

- [ ] **Step 6: Operator red-pen**

- [ ] **Step 7: Commit**

```bash
git add src/content/articles/cbt-vs-cat.md
git commit -m "content: Article — CBT vs CAT honest comparison (item 15/17)"
```

---

### Task 4.3: Article — How long does CBT for anxiety take (existing placeholder)

**Files:**
- Modify: `src/content/articles/how-long-cbt-anxiety.md`

**Spec ref:** Queue item #16; SEO map row 16. Lead: CBT.

**Pre-drafted SEO surface:**
- Slug: `/articles/how-long-cbt-anxiety/`
- Meta title: `How long does CBT for anxiety take?` (35 chars)
- Meta description: `How long CBT for anxiety actually takes — honest session counts by anxiety subtype, what makes treatment longer, and when CBT isn't the right route.` (149 chars)
- H1: `How long does CBT for anxiety actually take?`

**Required moves:**
- Honest "it depends" answer that resists the question's premise.
- Named CBT mechanism + named gating logic.
- Numbers where defensible (panic 8–12, GAD 12–20, social 12–16, health 12–16, complex 20+).
- ~1000–1500 words.

**Structural skeleton:**

```yaml
---
title: "How long does CBT for anxiety actually take?"
description: "How long CBT for anxiety actually takes — honest session counts by anxiety subtype, what makes treatment longer, and when CBT isn't the right route."
pubDate: 2026-05-19
tags: ["CBT", "anxiety", "duration", "FAQ"]
---
```

```markdown
## The honest answer first

CBT for anxiety usually runs between 8 and 20 sessions, depending heavily on what kind of anxiety. The number people are quoted at the start is almost always less than the number they end on, and that's not a failure of CBT — it's a feature of how anxiety presents.

## Session counts by anxiety subtype

### Panic disorder

[Paragraph — typically 8–12 sessions. Mechanism: interoceptive exposure + cognitive work on catastrophic body-sensation interpretation. Most movement happens in the middle third.]

### Generalised Anxiety Disorder (GAD)

[Paragraph — typically 12–20 sessions. Mechanism: worry postponement, intolerance-of-uncertainty work, behavioural experiments on probability/cost estimates.]

### Social anxiety

[Paragraph — typically 12–16 sessions. Mechanism: attention-bias modification, dropping safety behaviours, video review of self-as-others-see-me.]

### Health anxiety

[Paragraph — typically 12–16 sessions. Mechanism: reassurance reduction, behavioural experiments on the no-check rule, body-scanning cessation.]

### Specific phobia

[Paragraph — often shorter, 4–8 sessions for a clear phobia. Mechanism: graded exposure hierarchy.]

## What makes treatment longer

[Bulleted or paragraph list:
- Co-morbid depression — adds 4–8 sessions.
- Long-standing anxiety (since childhood) — usually means CAT is the better second-line route, not more CBT.
- Health conditions that maintain physiological arousal.
- Life circumstances that don't allow the exposure work (active illness, active crisis).
- The first 2–4 sessions are formulation, not work — they don't count towards the symptom-change phase.]

## What makes treatment shorter

[Paragraph — single-trigger anxiety, recent onset, behaviourally accessible, no co-morbid depression, supportive environment to do between-session work.]

## When CBT isn't the right route

[Paragraph — anxiety that's been around since childhood, that tracks the same relational themes, that came back after a previous round of CBT. The problem there is at the pattern level, not the loop level — CAT is the better route. Internal link to /what-i-treat/anxiety/ and /articles/what-is-cat/.]

## The honest limit

[Paragraph — CBT for anxiety works but isn't fast in the way Internet summaries claim. The first sessions feel productive (psychoeducation, formulation) but aren't the work — the work is the experiments. Some people find the experiments harder than the symptoms. Plan for the full course.]

## Want to know more

[Paragraph — link to the Anxiety condition page and the CBT vs CAT article. CTA to free 15-min consultation.]
```

- [ ] **Step 1: Read existing `src/content/articles/how-long-cbt-anxiety.md` placeholder**

- [ ] **Step 2: Replace frontmatter + body**

- [ ] **Step 3: Hard-ban grep**

- [ ] **Step 4: Build + a11y green**

- [ ] **Step 5: Internal-linking — links to /what-i-treat/anxiety/, /articles/what-is-cat/, /articles/cbt-vs-cat/**

- [ ] **Step 6: Operator red-pen**

- [ ] **Step 7: Commit**

```bash
git add src/content/articles/how-long-cbt-anxiety.md
git commit -m "content: Article — how long CBT for anxiety takes (item 16/17)"
```

---

### Task 4.4: Article — Reformulation letter cornerstone (NEW file)

**Files:**
- Create: `src/content/articles/reformulation-letter.md`

**Spec ref:** Queue item #17; SEO map row 17. Lead: CAT.

**Pre-drafted SEO surface:**
- Slug: `/articles/reformulation-letter/`
- Meta title: `The Reformulation Letter in CAT` (31 chars)
- Meta description: `The reformulation letter is the signature deliverable of Cognitive Analytic Therapy — what it is, what's in it, when it's written, and what it actually does.` (155 chars)
- H1: `The reformulation letter — the document at the centre of CAT.`

**Required moves:**
- Letter named in title, dek, body, ≥4 subheadings (per spec).
- What it is, what it does, what it doesn't do.
- One Bion-style sentence.
- ~1500–2200 words.

**Structural skeleton:**

```yaml
---
title: "The reformulation letter — the document at the centre of CAT"
description: "The reformulation letter is the signature deliverable of Cognitive Analytic Therapy — what it is, what's in it, when it's written, and what it actually does."
pubDate: 2026-05-19
tags: ["CAT", "reformulation letter", "explainer"]
---
```

```markdown
## What the reformulation letter is

[Paragraph — Bion-style opener. A letter the therapist writes to the client, around session 4 to 6, that names the patterns at work in their life in their own words. It's the working spine of the rest of the therapy. It's the thing the therapy keeps coming back to. It's also, often, the moment something shifts.]

## What's in a reformulation letter

### The early life sketch

[Paragraph — short, factual, not narrative-y. The relational context the patterns came from.]

### The reciprocal roles

[Paragraph — named explicitly. e.g. "There's a critical-to-criticised pattern that runs in most of your significant relationships, including the one with yourself." Specific to the client, in the client's language.]

### The procedures

[Paragraph — the moves the client makes automatically that maintain the roles. e.g. "When you sense disapproval coming, you pre-empt it by either over-explaining or going silent. Both moves keep the criticising side of the pattern in play."]

### The target problem procedures

[Paragraph — the procedures the work will focus on, named explicitly. Usually 2 to 4 of them.]

### The exits

[Paragraph — what a different move would look like. Not "be more confident" — specifically "what would going neither over-explaining nor silent look like, in this specific situation".]

## What the letter is not

### It's not a diagnosis

[Paragraph.]

### It's not a verdict

[Paragraph — the letter is provisional, gets revised, and is jointly owned. The client reads it, marks it up, sends notes. It's not the therapist's pronouncement.]

### It's not advice

[Paragraph — naming a procedure isn't the same as telling someone to change it.]

## What the letter actually does

### It moves the work from talk to text

[Paragraph — Bion move: the letter respects the reader's intelligence. It doesn't instruct. It names.]

### It gives the work a shared spine

[Paragraph.]

### It makes the procedures visible

[Paragraph — once the procedures are on paper, the client catches themselves doing them in real time. That's the mechanism by which the work shifts something.]

### It survives the therapy

[Paragraph — clients keep the letter. Some re-read it years later. It's a portable artefact, not just a session record.]

## When the letter is written

[Paragraph — session 4 to 6 in a typical 16- or 24-session CAT. Written by me, read aloud in session, then given to the client to take home, mark up, return to.]

## What if I don't like the letter?

[Paragraph — fair question, common moment. The letter is provisional. If something in it lands wrong — wrong word, wrong pattern, premature conclusion — we revise. The relationship to the letter is more important than the first version of the letter.]

## Why this matters more than it sounds

[Closing paragraph — Bion-style. Most therapy doesn't produce a written artefact. CAT does. The artefact is part of what makes the work do something other than feel-better-while-talking.]

## How to start

[CTA to free 15-min consultation. Internal links to /approach/, /what-i-treat/relationships/, /what-i-treat/trauma-ptsd/, /articles/what-is-cat/.]
```

- [ ] **Step 1: Create file**

```bash
touch src/content/articles/reformulation-letter.md
```

- [ ] **Step 2: Write frontmatter + body**

- [ ] **Step 3: Hard-ban grep**

- [ ] **Step 4: Verify ≥4 subheadings name "reformulation letter" or "the letter" — spec rule**

```bash
grep -nE "^##" src/content/articles/reformulation-letter.md | grep -ciE "letter|reformulation"
```

Expected: ≥4.

- [ ] **Step 5: Build + a11y green**

- [ ] **Step 6: Internal-linking — links back from /approach/, /what-i-treat/relationships/, /what-i-treat/trauma-ptsd/, /articles/what-is-cat/**

Verify all four already link forward to this article (slug `reformulation-letter`). If not, edit them now to add the link — small one-line additions, commit together.

- [ ] **Step 7: Operator red-pen**

- [ ] **Step 8: Commit**

```bash
git add src/content/articles/reformulation-letter.md
git commit -m "content: Article — reformulation letter cornerstone (item 17/17)"
```

---

## Phase 5 — Polish + gates

### Task 5.1: Cross-page consistency pass

**Files:**
- Modify: any of `src/pages/*.astro` or `src/content/**/*.md` flagged in this pass.
- Modify: `src/components/Nav.astro` and `src/components/Footer.astro` if labels need updating.

- [ ] **Step 1: Anchor-phrase audit**

```bash
grep -rnE "patterns that don't shift on their own|I promise to think with you|I don't promise to fix anything" src/pages/ src/content/
```

Expected: anchor variant present on Home AND at least one of About/Approach. Variant present on Trauma-PTSD condition page. Not present on every page — that'd read as slogan.

If absent on Home or About/Approach: add. If present on too many condition pages (>3): trim.

- [ ] **Step 2: Modality-gating consistency**

Read Approach gating section. Read every condition page that has both CBT and CAT routes (OCD, Depression, Burnout). Confirm the gating sentence on each condition matches the gating section on Approach. If divergent: pick one, propagate.

- [ ] **Step 3: Navigation labels final**

```bash
cat src/components/Nav.astro
```

Compare nav labels to actual page H1s / titles. Any mismatch (e.g., nav says "Services" but page title is "Approach"): rename. Confirm Portuguese landing link in Footer:

```bash
grep -n "portugues" src/components/Footer.astro src/components/Nav.astro
```

Expected: at least one match in Footer. If missing: add.

- [ ] **Step 4: Orphan-page check**

```bash
# Every page in src/pages and every collection entry in src/content must be linked from at least one other page.
grep -rln "/articles/what-is-cat" src/ || echo "ORPHAN: what-is-cat"
grep -rln "/articles/cbt-vs-cat" src/ || echo "ORPHAN: cbt-vs-cat"
grep -rln "/articles/how-long-cbt-anxiety" src/ || echo "ORPHAN: how-long-cbt-anxiety"
grep -rln "/articles/reformulation-letter" src/ || echo "ORPHAN: reformulation-letter"
grep -rln "/what-i-treat/anxiety" src/ || echo "ORPHAN: anxiety"
grep -rln "/what-i-treat/trauma-ptsd" src/ || echo "ORPHAN: trauma-ptsd"
grep -rln "/what-i-treat/ocd" src/ || echo "ORPHAN: ocd"
grep -rln "/what-i-treat/depression" src/ || echo "ORPHAN: depression"
grep -rln "/what-i-treat/relationships" src/ || echo "ORPHAN: relationships"
grep -rln "/what-i-treat/burnout" src/ || echo "ORPHAN: burnout"
grep -rln "/portugues" src/ || echo "ORPHAN: portugues"
```

Expected: zero `ORPHAN:` lines. Fix any orphan by adding an inbound link from a relevant page.

- [ ] **Step 5: Meta descriptions all rewritten — none from placeholder era**

```bash
grep -rnE 'description: "(Placeholder|C[0-9]+\.)' src/content/ src/pages/
```

Expected: zero matches.

- [ ] **Step 6: Hard-ban grep across full tree**

```bash
grep -rinE "safe space|on a journey|non.judgemental|here to help|unlock your potential|wellness|holistic|compassionate|empower|empowerment|In today's fast.paced|Many people struggle|self.love|growth journey" src/pages/ src/content/
```

Expected: zero matches. (Exception: `self-care` on burnout.md only in the argued-against context.)

- [ ] **Step 7: Placeholder zero check (gate G1)**

```bash
grep -rnE "Placeholder|TODO|TODO_RODRIGO|FIXME|Lorem|C[0-9]+\.[0-9]+" src/
```

Expected: zero matches. If any: fix and re-run.

- [ ] **Step 8: Commit any consistency fixes**

```bash
git add <changed files>
git commit -m "polish: cross-page consistency, nav labels, orphan fixes"
```

If no changes needed in this task: no commit. Move on.

---

### Task 5.2: `npm run preflight` wrapper (Open Decision #3 — default: written)

**Files:**
- Create: `scripts/preflight.sh`
- Modify: `package.json` (add `preflight` script)

- [ ] **Step 1: Create the script**

```bash
mkdir -p scripts
cat > scripts/preflight.sh <<'EOF'
#!/usr/bin/env bash
# Preflight: gates G1 + G2 + G4 + G5 before merging redesign → Master.
# Exits non-zero on any gate failure.

set -e

echo "=== G1: Placeholder zero ==="
PLACEHOLDERS=$(grep -rnE "Placeholder|TODO|TODO_RODRIGO|FIXME|Lorem|C[0-9]+\.[0-9]+" src/ || true)
if [ -n "$PLACEHOLDERS" ]; then
  echo "FAIL — placeholders found:"
  echo "$PLACEHOLDERS"
  exit 1
fi
echo "OK"

echo ""
echo "=== G2: Hard-ban scan ==="
BANS=$(grep -rinE "safe space|on a journey|non.judgemental|here to help|unlock your potential|holistic|compassionate|empower|empowerment|In today's fast.paced|Many people struggle|self.love|growth journey" src/pages/ src/content/ || true)
# Allow "wellness" + "self-care" only on burnout.md in the argued-against context
WELLNESS=$(grep -rinE "wellness" src/pages/ src/content/ | grep -v "burnout industry" || true)
SELFCARE=$(grep -rinE "self.care" src/pages/ src/content/ | grep -v "burnout industry tries to sell" || true)
if [ -n "$BANS$WELLNESS$SELFCARE" ]; then
  echo "FAIL — hard-ban hits:"
  echo "$BANS"
  echo "$WELLNESS"
  echo "$SELFCARE"
  exit 1
fi
echo "OK"

echo ""
echo "=== G4: Build ==="
npm run build
echo "OK"

echo ""
echo "=== G5: Accessibility ==="
npm run a11y
echo "OK"

echo ""
echo "=== Preflight: ALL GREEN ==="
EOF
chmod +x scripts/preflight.sh
```

- [ ] **Step 2: Add npm script**

Edit `package.json`. Inside the `"scripts"` block, add:

```json
"preflight": "bash scripts/preflight.sh"
```

- [ ] **Step 3: Run it once**

```bash
npm run preflight
```

Expected: all four gates print OK, final line "ALL GREEN", exit 0.

If anything fails: fix the underlying issue (this is the whole point — fail at the gate, not at merge).

- [ ] **Step 4: Commit**

```bash
git add scripts/preflight.sh package.json package-lock.json
git commit -m "chore: npm run preflight — scriptable G1+G2+G4+G5 gates"
```

---

### Task 5.3: All pre-merge gates green (final gate run)

**Files:** none (verification only)

- [ ] **Step 1: Run preflight**

```bash
npm run preflight
```

Expected: ALL GREEN.

- [ ] **Step 2: G3 — voice required-moves check (operator-verified)**

Operator confirms — explicitly, per page — that each of items 1–17 had the red-pen pass and is signed off. Check off mentally or in a tracking doc. If any page wasn't red-penned: stop here, go back to that task's Step 5 (operator red-pen) and complete.

- [ ] **Step 3: G6 — JSON-LD valid**

```bash
git diff pre-redesign src/lib/jsonld.ts
```

Expected: no changes from `6bf9308` baseline (other than any pre-existing redesign-branch edits).

Visit https://search.google.com/test/rich-results, paste the URL of one rendered page from `dist/index.html` (after `npm run build`) by serving locally:

```bash
npm run preview
# open the preview URL it prints
```

Manually test the Home + one article + one condition page via Rich Results test. Expected: no critical errors.

- [ ] **Step 4: G7 — integrations smoke (preview build)**

```bash
npm run preview
```

Open the preview URL. Click through:
- Home → Calendly popup → confirms /15-min-onboard loads.
- /contact → fill the Formspree form with test data, submit, confirm redirect → log into Formspree dashboard and mark/delete the test row.
- /contact → click the `tel:` link on mobile-emulation mode → confirms dialer-intent.
- /contact → OSM map renders.
- /book → SessionCTA renders, email + phone clickable.
- Sticky book button appears on scroll past hero on mobile-emulation viewport.

- [ ] **Step 5: G8 — cross-page consistency (already verified in Task 5.1)**

Re-run the orphan check and anchor-phrase check:

```bash
grep -rnE "patterns that don't shift on their own|I promise to think with you" src/ | wc -l
# Expected: ~3–6 hits total across the site
```

- [ ] **Step 6: G9 — privacy + compliance**

```bash
grep -n "Plausible" src/pages/privacy.astro
```

Expected: at least one match if Plausible was wired in Task 0.3. If Plausible deferred: skip this check.

```bash
grep -n "ICO\|GDPR\|insurance" src/pages/privacy.astro src/pages/terms.astro
```

Expected: ICO + GDPR + insurance still mentioned (per prior commit `6bf9308`).

- [ ] **Step 7: G10 — branch state**

```bash
git fetch origin
git status
git log origin/Master..redesign --oneline | head -20
git rev-parse pre-redesign
```

Expected:
- Working tree clean.
- All Phase 1–4 pour commits visible on `redesign`, none on `Master`.
- `pre-redesign` tag still points at `8325ad1...`.

- [ ] **Step 8: G11 — SEO surface check**

```bash
# Every page has a unique title
grep -rnE "<title>|title:" src/content/ src/pages/ | wc -l
# Compare to page count
```

For each page in the SEO map, grep its primary keyword:

```bash
grep -inE "private therapist Jersey" src/pages/index.astro
grep -inE "therapist Jersey" src/pages/about.astro
grep -inE "CBT and CAT therapy" src/pages/approach.astro
grep -inE "anxiety therapy Jersey" src/content/conditions/anxiety.md
grep -inE "trauma therapy Jersey" src/content/conditions/trauma-ptsd.md
grep -inE "OCD therapy Jersey" src/content/conditions/ocd.md
grep -inE "depression therapy Jersey" src/content/conditions/depression.md
grep -inE "relationship patterns therapy|reciprocal roles" src/content/conditions/relationships.md
grep -inE "burnout therapy Jersey" src/content/conditions/burnout.md
grep -inE "Cognitive Analytic Therapy" src/content/articles/what-is-cat.md
grep -inE "CBT vs CAT|CBT or CAT" src/content/articles/cbt-vs-cat.md
grep -inE "how long does CBT for anxiety" src/content/articles/how-long-cbt-anxiety.md
grep -inE "reformulation letter" src/content/articles/reformulation-letter.md
grep -inE "terapeuta português|psicólogo que fala português" src/pages/portugues.astro
```

Expected: each grep returns ≥1 line.

- [ ] **Step 9: All gates green — proceed to launch**

If all of G1–G11 pass: proceed to Phase 6. If any fail: fix, re-run preflight, re-run G3 red-pen on affected pages, retry.

---

## Phase 6 — Launch

### Task 6.1: Tag launch candidate

**Files:** none (git operation)

- [ ] **Step 1: Tag on `redesign` HEAD**

```bash
git tag -a launch-candidate-2026-05-19 -m "Content pour complete, gates green, ready to merge to Master"
git push origin launch-candidate-2026-05-19
```

- [ ] **Step 2: Verify tag exists on origin**

```bash
git ls-remote origin refs/tags/launch-candidate-2026-05-19
```

Expected: one line with SHA matching `redesign` HEAD.

---

### Task 6.2: Merge `redesign` → `Master`

**Files:** none (git operation)

- [ ] **Step 1: Confirm `Master` hasn't moved**

```bash
git fetch origin
git log origin/Master..pre-redesign --oneline
git log pre-redesign..origin/Master --oneline
```

Expected: both empty (i.e., `Master` HEAD == `pre-redesign`). If `Master` has moved: rebase `redesign` onto new `Master` first, re-run preflight, then proceed.

- [ ] **Step 2: Checkout Master + pull**

```bash
git checkout Master
git pull origin Master
```

- [ ] **Step 3: Merge with --no-ff**

```bash
git merge --no-ff redesign -m "feat: launch redesign — content pour complete

All 17 placeholder pages replaced with voice-correct content under
parallel CBT/CAT framing with Bion + Beck ethos. Reformulation letter
and collaborative formulation as parallel signature assets. SEO meta
layer integrated under dual-register rule. Plausible analytics wired.

Refs: docs/superpowers/specs/2026-05-19-jerseycbt-launch-design.md
Tag: launch-candidate-2026-05-19

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 4: Push to Master**

```bash
git push origin Master
```

This is the moment of go-live. The push triggers CI.

- [ ] **Step 5: Watch CI run**

Open https://github.com/Zakadura/jerseycbt/actions in a browser. Wait for the workflow triggered by the push to complete. Expected: ~2–4 min, ends green.

If CI fails: **do not retry blindly.** Read the logs. Fix on `redesign` (or directly on `Master` if it's a tiny launch-specific fix). If the fix is on `redesign`: cherry-pick or re-merge. If the fix breaks more than it fixes: roll back (Task 6.5).

---

### Task 6.3: Production smoke

**Files:** none (live-site verification)

- [ ] **Step 1: Hard-refresh the live site**

Open https://jerseycbt.com in a private window (no cache). Confirm:
- New Home page renders (visible signal: the named-specifics block with reformulation letter + collaborative formulation side by side).
- SSL cert valid (padlock).
- Page title in browser tab matches "Rodrigo Silva — CBT & CAT Therapy in Jersey".

- [ ] **Step 2: Click through key pages**

- https://jerseycbt.com/about/ — Bion + Beck lineage paragraph visible.
- https://jerseycbt.com/approach/ — both CBT and CAT sections equal-billed.
- https://jerseycbt.com/fees/ — fees + insurance + free consult.
- https://jerseycbt.com/contact/ — Formspree form, map, tel + email.
- https://jerseycbt.com/book/ — Calendly inline embed loads.
- https://jerseycbt.com/portugues/ — Portuguese page renders, "carta de reformulação" present.
- https://jerseycbt.com/what-i-treat/anxiety/ — anxiety condition.
- https://jerseycbt.com/what-i-treat/trauma-ptsd/ — trauma condition.
- https://jerseycbt.com/articles/reformulation-letter/ — cornerstone article.
- https://jerseycbt.com/articles/what-is-cat/ — CAT explainer.

- [ ] **Step 3: Submit a real Formspree test**

On /contact, send a real test message (e.g., subject "Launch test"). Log into Formspree dashboard, confirm row received, delete the test row.

- [ ] **Step 4: Calendly real-test**

On /book, click the Calendly button. Confirm the /15-min-onboard widget loads. Don't book a real slot — close the widget after confirming load.

- [ ] **Step 5: View-source spot checks**

```bash
curl -s https://jerseycbt.com | grep -iE "<title>|description|jsonld|plausible|og:image"
```

Expected:
- Title matches "Rodrigo Silva — CBT & CAT Therapy in Jersey".
- Description matches the spec.
- JSON-LD block present.
- Plausible script tag present (if Plausible was wired).
- OG image URL absolute and resolvable.

- [ ] **Step 6: Sitemap accessible**

```bash
curl -sI https://jerseycbt.com/sitemap-index.xml | head -1
```

Expected: `HTTP/2 200`.

- [ ] **Step 7: Mobile smoke**

Open https://jerseycbt.com on a phone. Confirm:
- Layout responsive.
- Sticky book button appears after scrolling past hero.
- `tel:` link on /contact opens dialer.

---

### Task 6.4: Search + social surfaces

**Files:** none (external configuration)

- [ ] **Step 1: Submit sitemap to Google Search Console**

URL: https://search.google.com/search-console. Property must already exist for jerseycbt.com (verify; if not, complete property verification first via DNS TXT or HTML tag).

- Sitemaps section → submit `https://jerseycbt.com/sitemap-index.xml`.
- Wait for "Success" status.

- [ ] **Step 2: Request indexing on priority pages**

URL Inspection tool → enter each, request indexing:

```
https://jerseycbt.com/
https://jerseycbt.com/about/
https://jerseycbt.com/approach/
https://jerseycbt.com/articles/reformulation-letter/
https://jerseycbt.com/articles/what-is-cat/
https://jerseycbt.com/what-i-treat/trauma-ptsd/
https://jerseycbt.com/what-i-treat/relationships/
```

- [ ] **Step 3: OG render test**

- LinkedIn: paste `https://jerseycbt.com` into a new post composer (don't publish). Confirm the OG image + title + description render correctly.
- WhatsApp: send the link to yourself in a draft message. Confirm preview card renders.
- Twitter/X (optional): use https://cards-dev.twitter.com/validator.

If any render is wrong: image probably wrong dimensions or missing meta. Fix in a follow-up commit.

- [ ] **Step 4: Update external profiles to point at jerseycbt.com**

- Psychology Today profile (https://www.psychologytoday.com/gb/counselling/rodrigo-silva-saint-helier/1009468): update website URL to `https://jerseycbt.com` if not already.
- Think CBT team page (https://thinkcbt.com/team/rodrigo-silva): same.

- [ ] **Step 5: Plausible dashboard check (if wired)**

Open https://plausible.io/jerseycbt.com (or wherever the dashboard lives). Confirm first hits appearing within a minute of the live smoke clicks. If zero hits: re-check the data-domain attribute matches `jerseycbt.com` exactly.

---

### Task 6.5: Rollback path (only if needed)

**Files:** none (git operation)

**Trigger:** Visible-to-public regression with no fix-forward path <15 min. Cosmetic issues fix-forward in a new commit. Real bust = roll back.

- [ ] **Step 1 (preferred — revert):**

```bash
git checkout Master
git revert --no-edit -m 1 <merge-commit-sha>   # use the actual SHA from Task 6.2
git push origin Master
```

CI re-deploys the reverted state. Old site live again ~2–4 min later.

- [ ] **Step 2 (nuclear — only if revert conflicts intractable):**

```bash
git checkout Master
git reset --hard pre-redesign
git push --force-with-lease origin Master
```

WARNING: force push. Only if revert path is genuinely broken. CI re-deploys the pre-redesign state.

- [ ] **Step 3: Triage the regression on `redesign`**

```bash
git checkout redesign
# fix the issue
# re-run preflight
# tag a new launch-candidate-2026-05-19-b
# retry the merge from Task 6.2
```

---

## Phase 7 — Post-launch monitor

### Task 7.1: 30-min watch

**Files:** none

- [ ] **Step 1: Operator leaves the live site open in a tab for 30 minutes**

Click through pages organically. Watch for any glitch the smoke checks missed — broken image, layout glitch on a narrow viewport, broken link in nav, JS error in console (open dev tools).

- [ ] **Step 2: Catch + file any issues**

Any defect: file a small one-line memory observation OR create a follow-up task list item. Don't fix now unless critical.

---

### Task 7.2: 24-hour checkpoint

**Files:** none

**Trigger:** ~24h after Task 6.2 merge.

- [ ] **Step 1: Google Search Console — indexing started**

Confirm that the priority pages from Task 6.4 Step 2 are marked as "Submitted and indexed" or "Crawled". If still "Discovered — currently not indexed" after 48h: investigate (often resolves itself within a week).

- [ ] **Step 2: Plausible — first day's traffic visible (if wired)**

Open Plausible dashboard. Expected: ≥ a few page views from operator's own browsing. If zero: the script may not be firing. Debug via browser dev tools → Network tab → look for `script.js` from `plausible.io`.

- [ ] **Step 3: Formspree — any real inbound**

Log into Formspree. Any real (non-test) form submission means the contact path is working end-to-end.

- [ ] **Step 4: Calendly — any real bookings**

Log into Calendly. Same.

- [ ] **Step 5: Memory housekeeping**

Update memory file with the launch outcome:

```markdown
# Update project_therapy_online_presence.md:
- Launch date: 2026-05-19
- Merge SHA: <merge sha>
- Live URL: https://jerseycbt.com
- Pages live: 17 + privacy/terms
- Next: post-launch SEO pass after 30d traffic data, decide on first-therapy-session article and Google Business Profile setup
```

---

## Self-review checklist

Before handing this plan to execution:

- [ ] Each spec section maps to at least one task:
  - Architecture & branch flow → Task 0.1, 6.1, 6.2, 6.5.
  - Content shapes → Tasks 1.1–4.4.
  - Integrations → Task 0.3 (Plausible), referenced in 6.3 (smoke).
  - Analytics → Task 0.3.
  - Voice & quality contract → required-moves in each pour task; hard-ban grep in each.
  - SEO & keyword strategy → pre-drafted meta in each pour task; G11 in Task 5.3.
  - Pre-merge gates → Phase 5 (5.1 polish, 5.2 preflight, 5.3 gate run).
  - Launch sequence → Phase 6.
  - Rollback path → Task 6.5.
  - Open decisions → Task 0.2 (keyword verification), Task 0.3 (Plausible), Task 5.2 (preflight wrapper).
  - Memory update → Task 7.2 Step 5.
- [ ] No "TBD" / "fill in details" / "TODO" / "similar to Task N" placeholders in this plan.
- [ ] All type/method/property names consistent across tasks (e.g., `preflight` script named identically in 5.2 and 5.3).
- [ ] Every "Commit" step has the exact `git add` + `git commit -m` command.
- [ ] Pre-drafted meta titles all ≤60 chars; meta descriptions all ≤155 chars (verify on execution).
- [ ] Pre-drafted Portuguese strings respect PT-EU register; operator (native speaker) is the red-pen authority.
