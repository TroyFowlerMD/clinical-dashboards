# Tasks - clinical-dashboards

## Status Key
- [ ] Not started
- [~] In progress
- [x] Complete
- [!] Blocked - include reason in parentheses

## Active Tasks
- [~] Migrate JFK feedback to the shared GitHub-issue widget; central pilot wiring is in progress and needs live verification after publication.

## Upcoming
- [ ] Decide whether to update `feedback-submit.js` or wire JFK pages to `feedback.js`.
- [ ] Remove `no-cors` from the active JFK feedback fetch when the active path is confirmed.
- [ ] Set the JFK `FEEDBACK_ENDPOINT` to the deployed Google Apps Script Web App URL for Website Feedback/Requests.
- [ ] Verify/redeploy `doPost(e)` and add a best-effort FormSubmit fallback to `troyfowlermd@gmail.com`.
- [ ] Decide whether `asam-app/` needs a deployable public entry point or should remain excluded from the public Pages clinical hub.

## Completed (last 30 days)
- [x] Resolved website-feedback issue #43 for JFK Epic Workflows: clarified expanded-card shading and updated the discharge C-SSRS, principal-diagnosis, and treatment-plan instructions (2026-08-11).
- [x] Added the JFK discharge-workflow "Close Treatment Plans" checklist for psych-goal closure, reordered the JFK landing links, removed the large JFK landing hero, and simplified TroyMD dashboard cards to linked titles (2026-08-11).
- [~] Alcohol calculator prebuilt-drinks + UX overhaul (119 products, category cascade + type-ahead search, volume dropdown w/ nicknames + custom entry, empty-by-default numeric fields, multi-ABV variants). Built + tested; awaiting commit/push approval.
- [x] Added the Clinical Alcohol Calculators mobile web app under `apps/alcohol-calculators/` with static Pages output at `alcohol-calculators/`.
- [x] Consolidated clinical dashboards into `clinical-dashboards` with `asam-app/`, `asam-classic/`, and `jfk/`.
- [x] Kept the ASAM React/Vite app in its own folder instead of flattening it into the static pages.
- [x] Restored the JFK landing page structure after a blank-page regression.
- [x] Cleaned public clinical hub wording to avoid repo-internal migration language.

## Backlog
- [ ] Review public clinical dashboard pages visually in a normal browser before future publish passes.
- [ ] Re-check README/setup instructions after any `asam-app` dependency or deployment changes.
