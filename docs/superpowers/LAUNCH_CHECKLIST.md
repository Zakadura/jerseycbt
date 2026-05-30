# jerseycbt.com — launch checklist (operational / non-code)

Items that live outside the codebase and must be done by the operator before (or at) go-live. Code-side gates are the G1–G11 pre-merge gates in `specs/2026-05-19-jerseycbt-launch-design.md`.

## Email & forms

- [ ] **Set the Formspree recipient to `hello@jerseycbt.com`.** The appointment form (`/book`) and contact form both POST to Formspree form **`xbdbrlrv`**. The recipient/notification address is set in the Formspree dashboard, NOT in the site code. Set it to `hello@jerseycbt.com` (which already copies to `rod.gui.sil@gmail.com`). If Formspree asks to verify the new address, confirm it from the `hello@` inbox.
- [ ] **Send a test submission** from the live `/book` form and confirm it arrives at `hello@jerseycbt.com` (and copies through to gmail). **Use a real email + genuine message** — `test@example.com`-style addresses get caught by Formspree's spam filter (confirmed 2026-05-30: a fake-email test landed in Spam, not the Inbox, and wasn't emailed). Delete the test entry afterwards.
- [ ] Note: Formspree's Formshield spam filter can over-flag early on — check the **Spam** tab periodically and mark legitimate submissions "Not spam" to train it.
- [ ] Confirm `hello@jerseycbt.com` is receiving mail and forwarding/copying to `rod.gui.sil@gmail.com` as expected.

## Analytics & SEO

- [ ] **Plausible account** — create at plausible.io for domain `jerseycbt.com` (the cookieless script is already wired in `BaseLayout.astro`). Then add the Plausible mention by name to `/privacy`.
- [ ] **Keyword-volume verification** (~20 min) — run the primary keywords from the keyword-to-page map through Google Keyword Planner / Ubersuggest before finalising meta titles/descriptions; substitute higher-volume synonyms where needed.
- [ ] **Google Business Profile** — claim/verify address, hours, services (separate workstream).

## Booking

- [ ] Confirm the Calendly **free 15-min consultation** event (`/15-min-onboard`) is live and the description reflects "fit/screening call — no clinical advice."

## Cutover (code side)

- [ ] All pre-merge gates G1–G11 green (see launch design spec).
- [ ] `git merge --no-ff redesign` → `Master`; confirm CI deploy; live smoke test on https://jerseycbt.com.

## Post-launch / deferred (parked by operator 2026-05-30)

- [ ] **Monthly-article automation** — a recurring scheduled agent that drafts each month's article from the content calendar for red-pen.
- [ ] **Social-media automation** — scheduling / repurposing (e.g., turning articles into LinkedIn / Instagram posts).
- [ ] **Skill development** — custom skills supporting the content + social workflows above.

---
*Started 2026-05-30. Formspree-recipient item added per operator request.*
