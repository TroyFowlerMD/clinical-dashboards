# JFK IT Mode — Cloudflare Access Setup

The repository-side IT Mode is implemented for `jfk/workflows.html` and `jfk/moud.html`. It is deliberately fail-closed: contextual request buttons are not created unless Cloudflare Access reports the authenticated identity as `troyfowlermd@gmail.com`.

## Production architecture (2026-09-16)

- Cloudflare account: Troy Fowler's non-COCM account (`0cc97ad133a28f1909ff91ee52a02c3e`), using the account `workers.dev` subdomain.
- Worker: `jfk-it-mode`, deployed at `https://jfk-it-mode.troyfowlermd.workers.dev`.
- Architecture: the Worker reverse-proxies the existing GitHub Pages site at `https://troyfowlermd.github.io/clinical-dashboards`, preserving request paths and query strings.
- Access application: `JFK IT Mode`, a self-hosted Worker application protecting the Worker's production and preview URLs.
- Identity provider: Google only; the application does not accept the other available provider or all-provider mode.
- Allow policy: `JFK IT Mode - Troy exact email`, allowing only `troyfowlermd@gmail.com` through an exact Emails selector. No domain-wide rule is used.
- Identity endpoint: `GET /cdn-cgi/access/get-identity`; `jfk/it-mode.js` performs a second exact-email check before enabling controls.
- Public entry URLs:
  - `jfk/workflows.html` → `https://jfk-it-mode.troyfowlermd.workers.dev/jfk/workflows.html`
  - `jfk/moud.html` → `https://jfk-it-mode.troyfowlermd.workers.dev/jfk/moud.html`

The Worker uses the existing account `workers.dev` hostname because this Cloudflare account has no managed custom domains. This avoids purchasing or transferring a domain while preserving the public GitHub Pages URLs.

## Verification

- The public GitHub Pages URL continues to show the small **Enter IT mode (admin only)** button, but cannot reveal contextual request controls.
- The protected URL prompts for Cloudflare Google authentication (verified on the production Workflows URL).
- `troyfowlermd@gmail.com` can enter IT Mode (verified; the page banner displays the approved email).
- A non-approved Google account must be denied by the exact-email policy; perform this negative test when a second signed-in Google account is available.
- After entry, every workflow phase and nested workflow item has a **Request change** button.
- Every MOUD protocol card has a **Request change** button.
- IT Mode uses an inline request editor rather than the shared feedback dialog. Each editor identifies the exact page/card/subcard in `Area`, uses the fixed `troymd` submitter, and allows up to three pasted or selected PNG/JPEG/WebP screenshots. A single request can be sent with `Send`; `Add another request` creates additional boxes on the same card and `Send all` submits them together.
