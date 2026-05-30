# jerseycbt.com — launch checklist (operational / non-code)

Items that live outside the codebase and must be done by the operator before (or at) go-live. Code-side gates are the G1–G11 pre-merge gates in `specs/2026-05-19-jerseycbt-launch-design.md`.

## Email & forms

- [ ] **Set the Formspree recipient to `hello@jerseycbt.com`.** The appointment form (`/book`) and contact form both POST to Formspree form **`xbdbrlrv`**. The recipient/notification address is set in the Formspree dashboard, NOT in the site code. Set it to `hello@jerseycbt.com` (which already copies to `rod.gui.sil@gmail.com`). If Formspree asks to verify the new address, confirm it from the `hello@` inbox.
- [ ] **Send a test submission** from the live `/book` form and confirm it arrives at `hello@jerseycbt.com` (and copies through to gmail). Delete the test entry afterwards.
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

---
*Started 2026-05-30. Formspree-recipient item added per operator request.*
