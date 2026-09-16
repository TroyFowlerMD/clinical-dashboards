# JFK IT Mode — Cloudflare Access Setup

The repository-side IT Mode is implemented for `jfk/workflows.html` and `jfk/moud.html`. It is deliberately fail-closed: contextual request buttons are not created unless Cloudflare Access reports the authenticated identity as `troyfowlermd@gmail.com`.

## Required Cloudflare architecture

1. Use Troy's personal/corporate Cloudflare account, not the account associated with COCM.
2. Put an admin-only hostname in front of the existing GitHub Pages JFK content, using a Cloudflare Worker or equivalent reverse proxy.
3. Create a Cloudflare Zero Trust Access self-hosted application for the admin hostname/path.
4. Configure Google as the identity provider.
5. Add an Access policy that allows only `troyfowlermd@gmail.com`; do not use an email-domain allow rule.
6. Ensure `GET /cdn-cgi/access/get-identity` is available on the protected origin. The client uses that endpoint and checks the exact email again before enabling IT Mode.
7. Set `window.JFK_IT_MODE_ENTRY_URL` on the public pages to the protected URL for the corresponding page, or serve the same repository build from the protected hostname so the Enter button can verify identity in place.

## Verification

- The public GitHub Pages URL continues to show the small **Enter IT mode (admin only)** button, but cannot reveal contextual request controls.
- The protected URL prompts for Cloudflare Google authentication.
- `troyfowlermd@gmail.com` can enter IT Mode.
- A different Google account is denied.
- After entry, every workflow phase and nested workflow item has a **Request change** button.
- Every MOUD protocol card has a **Request change** button.
- Submissions create GitHub issues through the shared widget, identify the exact page/card/subcard in `Area`, do not request a username, and allow selecting or pasting up to three images.
