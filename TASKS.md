# Tasks - clinical-dashboards

## Status Key
- [ ] Not started
- [~] In progress
- [x] Complete
- [!] Blocked - include reason in parentheses

## Active Tasks
- [!] Repair JFK feedback submission flow (paused because Google sign-in blocked Apps Script deployment URL updates; must decide whether active script is `feedback-submit.js` or `feedback.js`).

## Upcoming
- [ ] Decide whether to update `feedback-submit.js` or wire JFK pages to `feedback.js`.
- [ ] Remove `no-cors` from the active JFK feedback fetch when the active path is confirmed.
- [ ] Set the JFK `FEEDBACK_ENDPOINT` to the deployed Google Apps Script Web App URL for Website Feedback/Requests.
- [ ] Verify/redeploy `doPost(e)` and add a best-effort FormSubmit fallback to `troyfowlermd@gmail.com`.
- [ ] Decide whether `asam-app/` needs a deployable public entry point or should remain excluded from the public Pages clinical hub.

## Completed (last 30 days)
- [~] Alcohol calculator prebuilt-drinks + UX overhaul (119 products, category cascade + type-ahead search, volume dropdown w/ nicknames + custom entry, empty-by-default numeric fields, multi-ABV variants). Built + tested; awaiting commit/push approval.
- [x] Added the Clinical Alcohol Calculators mobile web app under `apps/alcohol-calculators/` with static Pages output at `alcohol-calculators/`.
- [x] Consolidated clinical dashboards into `clinical-dashboards` with `asam-app/`, `asam-classic/`, and `jfk/`.
- [x] Kept the ASAM React/Vite app in its own folder instead of flattening it into the static pages.
- [x] Restored the JFK landing page structure after a blank-page regression.
- [x] Cleaned public clinical hub wording to avoid repo-internal migration language.

## Backlog
- [ ] Review public clinical dashboard pages visually in a normal browser before future publish passes.
- [ ] Re-check README/setup instructions after any `asam-app` dependency or deployment changes.
