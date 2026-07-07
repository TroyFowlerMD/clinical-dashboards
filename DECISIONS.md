# Decisions

This file records durable architectural, workflow, safety, and publishing decisions for Clinical Dashboards. Each entry should include Context, Decision, Rationale, and Consequences.

---

### 2026-07-07 - Alcohol Calculator Prebuilt-Drink Data Model And Input UX
Context: The standard drink calculator previously used a small (~40 entry) beverage list with a datalist and numeric inputs that forced a stuck 0 when cleared. User requested a large curated drink directory (~100+ products including Western NC packaged craft flagships), auto-filled fixed variables, and better volume entry.
Decision: (1) Store beverages as source-verified entries with `category`, `style`, `abvOptions[]`, `containers[]`, and `sourceUrl`, generated deterministically via `gen_beverages.py` into `data/beverages.ts`. (2) Model multi-ABV products (e.g. Four Loko, Everclear, MD 20/20) as adjacent selectable-and-editable variants defaulted to NC retail values, not silently merged. (3) UI uses a Category -> Product cascade plus a type-ahead "Search all drinks" field; selecting a product auto-fills fixed variables and leaves only non-fixed choices (size, ABV variant) selectable. (4) Volume is a dropdown of product/category presets with human nicknames ("750 mL (fifth)", "1.75 L (handle)") plus a "Custom..." oz/mL/L entry. (5) Quantity/Volume/ABV are `number | ""` so they can be truly empty; blank rows contribute 0 and skip validation.
Rationale: A curated, source-cited directory with NC-accurate ABVs supports clinical estimation; adjacent editable variants preserve accuracy without hiding real-world label differences; empty-by-default fields fix the user-reported stuck-0 UX.
Consequences: Regenerate `beverages.ts` via `python3 gen_beverages.py` rather than hand-editing. Only YEAR-ROUND, PACKAGED (canned/bottled, retail-sold) WNC craft flagships are included; tap-only and unconfirmed-retail beers are excluded. New beverage additions must carry a `sourceUrl`.

### 2026-05-14 - Consolidate Clinical Dashboards Into One Destination Repo
Context: JFK clinical dashboard, ASAM classic dashboard, and the larger ASAM app were previously spread across separate legacy repos.
Decision: Use `clinical-dashboards` as the destination repo for `asam-app/`, `asam-classic/`, and `jfk/`.
Rationale: A single clinical dashboard hub gives Codex and future maintainers one technical home for related clinical tools while preserving source history separately.
Consequences: New clinical-dashboard docs and maintenance context should live here, while legacy source repos remain untouched unless explicitly requested.

### 2026-05-14 - Keep ASAM React App Structurally Separate
Context: The ASAM app is a full React/Vite/TypeScript app, unlike the static hub and classic dashboards.
Decision: Keep `asam-app/` as its own app folder rather than flattening it into static pages.
Rationale: Flattening would break its app structure and setup assumptions.
Consequences: Public GitHub Pages routing should not treat `asam-app/` as a simple static dashboard unless a deployable public entry point is intentionally added.

### 2026-05-14 - Keep JFK Static Dashboard Together
Context: JFK has a multi-page static dashboard with internal links.
Decision: Keep JFK content together under `jfk/`.
Rationale: Preserves internal links and the clinical reference structure.
Consequences: Future JFK edits should inspect the grouped `jfk/` page set rather than moving individual pages into unrelated folders.

### 2026-05-11 - Pause JFK Feedback Repair Until Active Script Path Is Confirmed
Context: A feedback repair attempt initially targeted `feedback.js`, but the HTML pages actually loaded `feedback-submit.js`.
Decision: Abort the active repo/deployment work and preserve the findings as a follow-up task.
Rationale: Editing an inactive script would be inert, and Apps Script deployment URL updates required authenticated Google access.
Consequences: Future feedback work must first confirm the loaded script path, then update endpoint/deployment details before publishing.

### 2026-06-04 - Add Alcohol Calculators As A Separate Static Vite App
Context: The clinical dashboard hub needed a mobile-first alcohol calculator suite without folding it into the ASAM app or adding a backend.
Decision: Keep source under `apps/alcohol-calculators/` and build static GitHub Pages output into `alcohol-calculators/`.
Rationale: This preserves the ASAM app boundary while giving the public static hub a directly deployable calculator URL.
Consequences: Future calculator edits should happen in `apps/alcohol-calculators/`, followed by `npm run test`, `npm run check`, and `npm run build` from that folder before committing the regenerated `alcohol-calculators/` output.
