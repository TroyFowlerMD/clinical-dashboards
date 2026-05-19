# clinical-dashboards

Consolidated clinical dashboard hub for ASAM documentation tools, JFK workflows, and related clinical references. The repo keeps static public pages together while preserving the larger ASAM React/Vite app as its own app folder.

## Current Structure

- `index.html`: root hub for the merged dashboard repo
- `asam-app/`: full app migrated from `asam-dashboard`
- `asam-classic/`: static legacy dashboard migrated from `ASAM-Clinical-Dashboard`
- `jfk/`: static multi-page dashboard migrated from `jfk-clinical-dashboard`

## Source Mapping

- `ASAM-Clinical-Dashboard` -> `asam-classic/`
- `asam-dashboard` -> `asam-app/`
- `jfk-clinical-dashboard` -> `jfk/`
- `my-dashboard` -> represented by the new root hub concept rather than copied wholesale, because only its clinical dashboard role fit this destination

## Merge Notes

- The legacy source repos were not modified.
- The larger React/Vite ASAM app was kept in its own folder instead of being flattened into the static pages.
- The JFK multi-page static dashboard was kept together so its internal links continue to work.
- Only the clinically relevant role of `my-dashboard` was brought forward into this destination.

## Project Files

- `CONTEXT.md`: Short session-start briefing for Codex and returning developers.
- `TASKS.md`: Live working task list seeded from the migrated Notion state.
- `WORKLOG.md`: Append-only session-end worklog format.
- `DECISIONS.md`: Key architectural and workflow decisions extracted from Notion.
- `docs/jfk-clinical-dashboard.md`: Migrated JFK Clinical Dashboard project context, excluding Epic Email Intelligence content.
- `docs/jfk-feedback-submission-fix-paused.md`: Paused JFK feedback submission repair findings and resume checklist.
