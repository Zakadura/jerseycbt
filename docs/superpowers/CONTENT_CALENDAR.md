# jerseycbt.com — content calendar & freshness plan

## Publishing cadence

One article per month, post-launch. To add one: create `src/content/articles/<slug>.md` with frontmatter (`title` ≤70, `description` ≤160, `date`, `tags`, `target_keyword`, `draft: false`) + body, add its route to `.pa11yci`, then `git push` → live via CI in ~60s. Keep articles tight (~600–1,000 words) and voice-correct (see `feedback_therapy_brand_voice`): client-search language in the title/meta, voice-correct method language in the body.

## Live at launch (items 14–17)

- What is Cognitive Analytic Therapy? — `what-is-cat`
- CBT vs CAT — which therapy is right for me — `cbt-vs-cat`
- How long does CBT for anxiety take? — `how-long-cbt-anxiety`
- The reformulation letter — `reformulation-letter`

## 12-month schedule (working — confirm topics + validate Jersey keyword volume)

| Month | Working title | Target keyword | Supports |
|---|---|---|---|
| 1 | What happens in your first therapy session | first therapy session | conversion — *draft already exists (`first-therapy-session.md`); just publish* |
| 2 | Behavioural activation: starting when you can't face anything | behavioural activation depression | Depression |
| 3 | Work stress vs burnout — when it's more than a bad week | burnout vs work stress | Work Stress & Burnout (Jersey professionals) |
| 4 | ERP for OCD: facing the fear without the ritual | ERP for OCD | Anxiety/OCD cluster |
| 5 | How EMDR works — processing a memory that won't settle | how does EMDR work | Trauma & PTSD |
| 6 | Reciprocal roles: why the same relationship keeps happening | reciprocal roles | Relationship Patterns |
| 7 | Is online therapy as good as in person? | online therapy vs in person | conversion |
| 8 | What "evidence-based therapy" actually means | evidence-based therapy | credibility |
| 9 | Choosing a therapist in Jersey — what BABCP/ACAT accreditation means | therapist Jersey accreditation | local SEO / credibility |
| 10 | Panic attacks: what's happening, and what helps | panic attacks help | Anxiety cluster |
| 11 | Therapy and medication — do you need both? | therapy or medication | Depression / anxiety |
| 12 | How therapy ends — the goodbye letter | ending therapy | CAT / retention |

## Keeping content current — preventing obsolete pages

- **Every 6 months:** verify fees (£100), accepted insurers, credentials and registration numbers, and any figures ("21+ years") are still accurate. Update `src/lib/jsonld.ts` and the visible pages together so NAP / structured data stay consistent.
- **Annually:** re-read each condition page and article for accuracy and tone; refresh anything dated; confirm external resource links (NHS, Mind, BABCP, ACAT, NICE) still resolve.
- **When publishing:** make sure a new article doesn't duplicate or contradict an existing one; cross-link it to the relevant condition page (and back); add its route to `.pa11yci`.
- **Retire, don't orphan:** if an article goes out of date, update it or set `draft: true` (removes it from the index and the build) rather than leaving stale content live. Don't delete a live URL that may have inbound links without a redirect.
- **Auto-aging watch:** the footer year auto-updates (`new Date().getFullYear()`); the "21+ years" figures do **not** — revisit them periodically.
- **Obsolete files now:** `ocd.md` is folded into the Anxiety/OCD cluster and left `draft:true` (unused — safe to delete or leave). `first-therapy-session.md` is a parked draft → the Month-1 candidate above.

---
*Created 2026-05-30, on completion of the launch content pour (items 1–17).*
