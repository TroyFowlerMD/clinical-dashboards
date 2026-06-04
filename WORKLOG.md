# Worklog

This file records completed Codex work sessions for Clinical Dashboards. Append new entries during the shutdown routine so future sessions can resume without prior chat context.

---

## Entry Format

    ### YYYY-MM-DD - [machine/profile] - [session summary]
    - Completed: ...
    - In progress: ...
    - Blockers/notes: ...

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
