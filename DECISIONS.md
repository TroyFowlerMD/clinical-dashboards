# Decisions

This file records durable architectural, workflow, safety, and publishing decisions for Clinical Dashboards. Each entry should include Context, Decision, Rationale, and Consequences.

---

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
