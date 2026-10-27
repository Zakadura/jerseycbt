# Existing-page SEO navigation changes

Prepared 27 October 2026 following independent Claude review of the Jersey CBT SEO Explorer. Source baseline: `e52e0f6` on Master. These changes improve navigation to existing service and explanatory pages; no ranking or enquiry uplift has been measured or promised.

## Changes

- Homepage and treatment index: descriptive links to the existing OCD page, naming exposure and response prevention (ERP).
- Approach and anxiety pages: contextual links to the existing CBT/CAT comparison and anxiety-duration articles.
- Anxiety-duration article: an onward link to the existing anxiety service page.

No new service page, clinical treatment claim, professional title, tracking service, fee, address, business-listing edit or release-workflow change is introduced. The Portuguese page already has `lang="pt"`, a self-canonical and a Portuguese title, so no speculative language-metadata correction is included. No hreflang pair is added without equivalent translated destinations.

## Pre-change evidence

Direct HTTP checks before editing returned 200 for sixteen sampled content pages, including four specific articles. Each sampled content page had one H1, a description, canonical and parseable JSON-LD. Robots and sitemap returned 200. A deliberately missing URL returned a real 404 with noindex. These checks do not establish Google index coverage or Core Web Vitals. Search discovery was not a controlled Jersey Google SERP or map-pack audit.

The source includes a Plausible script; no analytics account, Google Search Console or Google Business Profile report was accessed. Organic and enquiry baselines remain unavailable. Before publication, preserve the available 28-day page/query baseline and longer query history, or explicitly record that it was unavailable. Keep baseline collection separate from claiming success after release.

## Verification and release

Run the existing checks and build; verify all changed links resolve against generated routes. Use the unchanged required hosted quality and packaging checks. Performance comparison may fail if the hosted browser/image has drifted; investigate and review evidence rather than weakening budgets or resetting the reference automatically.

The production workflow requires an approved immutable Master SHA and protected `github-pages` approval. This change does not supply that approval or alter the workflow. Record the actual release SHA/date after a successful protected release; none is claimed here.

## Follow-through

After release, verify the public edited pages and onward booking routes. Compare the same landing pages and query groups against the saved baseline after sufficient data accrues. About 30 days is an early observation point; about 90 days is a provisional fuller assessment, with longer windows for low traffic. Observational before/after comparisons are not causal proof. No recurring automation has been created.

Health-anxiety expansion and other clinical content ideas remain gated on service fit, actual user need and wording approval. No unreviewed clinical expansion is bundled into this navigation change.
