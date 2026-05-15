# clinical-dashboards

Local destination repo for consolidated clinical dashboard projects.

## Current structure

- `index.html`: root hub for the merged dashboard repo
- `asam-app/`: full app migrated from `asam-dashboard`
- `asam-classic/`: static legacy dashboard migrated from `ASAM-Clinical-Dashboard`
- `jfk/`: static multi-page dashboard migrated from `jfk-clinical-dashboard`

## Source mapping

- `ASAM-Clinical-Dashboard` -> `asam-classic/`
- `asam-dashboard` -> `asam-app/`
- `jfk-clinical-dashboard` -> `jfk/`
- `my-dashboard` -> represented by the new root hub concept rather than copied wholesale, because only its clinical dashboard role fit this destination

## Merge notes

- The legacy source repos were not modified.
- The larger React/Vite ASAM app was kept in its own folder instead of being flattened into the static pages.
- The JFK multi-page static dashboard was kept together so its internal links continue to work.
- Only the clinically relevant role of `my-dashboard` was brought forward into this destination.
