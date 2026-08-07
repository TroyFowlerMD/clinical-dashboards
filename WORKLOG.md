# Worklog

This file records completed Codex work sessions for Clinical Dashboards. Append new entries during the shutdown routine so future sessions can resume without prior chat context.

---

### 2026-08-07 - Codex - Shared feedback platform pilot
- Completed: Replaced JFK's active FormSubmit loader with the shared feedback-widget loader for all five JFK pages.
- In progress: Publishing and live verification of the central service and protected schedule pilot wiring.
- Blockers/notes: The protected schedule directory check remains blocked by its known stale generated Psych directory block; feedback server syntax passed.

## Entry Format

    ### YYYY-MM-DD - [machine/profile] - [session summary]
    - Completed: ...
    - In progress: ...
    - Blockers/notes: ...

### 2026-07-07 - Perplexity Computer - Alcohol calculator prebuilt drinks + UX overhaul
- Completed: Expanded `apps/alcohol-calculators/src/data/beverages.ts` to 135 entries (119 named products) across 11 categories, generated from `gen_beverages.py`, with source-verified NC-default ABVs, container sizes, and multi-ABV variants (Four Loko, Everclear, Olde English 800, Natty Daddy, Steel Reserve, Southern Comfort, MD 20/20, Wild Irish Rose, Cutwater, Modelo Chelada). Includes ~20-50 Western NC year-round flagship packaged craft beers.
- Completed: Rewrote `DrinkRow.tsx` with a type-ahead "Search all drinks" field, a Category -> Product cascade, product/category-preset Volume dropdown with nicknames (e.g. "750 mL (fifth)", "1.75 L (handle)") plus a "Custom..." oz/mL/L entry, editable ABV variant selector, and auto-fill of fixed variables on product selection.
- Completed: Made numeric fields (Quantity/Volume/ABV) empty by default and blank-safe -- deleting the value no longer forces a stuck 0; blank rows contribute 0 and skip validation. Updated `types.ts`, `standardDrinks.ts`, `utils/units.ts`, `StandardDrinkCalculator.tsx`, `styles.css`.
- Completed: `npm run check` (tsc) clean, `npm test` (vitest) 10/10 pass, `npm run build` succeeds and regenerated static output at `alcohol-calculators/`. Browser-verified volume dropdown, cascade auto-fill, and type-ahead search.
- In progress: Awaiting user commit/push approval (production-sensitive Pages deploy).
- Blockers/notes: Not committed or pushed pending approval. WNC breweries with unconfirmed packaged retail availability (Wedge, Bhramari, Pisgah/Sanctuary, Asheville Brewing, Appalachian Mountain Brewery) were excluded.

### 2026-06-04 - Codex desktop - Clinical alcohol calculators app
- Completed: Fast-forward pulled `origin/main`, then added a separate React/Vite/TypeScript Clinical Alcohol Calculators app under `apps/alcohol-calculators/`.
- Completed: Added standard drink and measured-BAL trajectory calculators with typed pure logic, beverage directory defaults, tests, PWA metadata, and static GitHub Pages output at `alcohol-calculators/`.
- Completed: Added the calculator card to the root clinical dashboard hub.
- In progress: Existing JFK feedback submission follow-up and ASAM app public-entry decision remain open in TASKS.md.
- Blockers/notes: `node` on PATH pointed to the blocked Codex app binary, so npm commands were run with `C:\Program Files\nodejs` prepended to PATH.

### 2026-05-19 - Codex desktop - Repository maintenance sweep
- Completed: Fast-forward pulled `origin/main` and confirmed the working tree was clean before maintenance logging.
- Completed: Smoke-checked the public clinical hub, JFK dashboard, and ASAM classic dashboard live URLs; all returned HTTP 200 with expected clinical/JFK/ASAM text.
- Completed: Ran a local relative href/src scan. The only findings were expected ASAM app root-path references inside `asam-app/client/index.html`, which are part of that app's own Vite structure rather than static hub links.
- In progress: Existing JFK feedback submission follow-up and ASAM app public-entry decision remain open in TASKS.md.
- Blockers/notes: No app code changed; TASKS.md and DECISIONS.md were not changed.
