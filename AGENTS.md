# Project: Clinical Dashboards

## Identity
- GitHub is the source of truth for this project: TroyFowlerMD/clinical-dashboards.
- Notion is no longer the operating source of truth for this repo. Historical Notion content has been migrated into docs/ and the repo memory files.
- Durable documentation lives in docs/, AGENTS.md, TASKS.md, WORKLOG.md, and DECISIONS.md.
- Work in this repo in place. Do not move folders, clone over this repo, or rewrite history unless Dr. Fowler explicitly asks.
- Default branch: main.
- Live/public target: https://troyfowlermd.github.io/clinical-dashboards/.

## Project Overview
- Consolidated clinical-dashboard hub for TroyMD clinical tools.
- Contains the ASAM classic dashboard, the full ASAM React/Vite app, and the JFK clinical reference dashboard.
- GitHub Pages serves the static public hub; the ASAM app remains structurally separate under asam-app/.

## Project Structure
- index.html - public clinical dashboard hub
- asam-classic/ - static ASAM clinical dashboard
- asam-app/ - React/Vite/TypeScript ASAM app kept as a full app
- jfk/ - multi-page JFK clinical reference dashboard
- docs/ - durable project documentation migrated from Notion and later Codex work

## Documentation Map
- docs/jfk-clinical-dashboard.md
- docs/jfk-feedback-submission-fix-paused.md

## Required Startup Routine
1. Run git status --short in the repo root.
2. If there are uncommitted changes, stop and report exactly what is present before editing. Treat those changes as user or prior-Codex work and do not overwrite them.
3. If the working tree is clean and network access is available, run git pull --ff-only before starting work. Do not merge, rebase, or force update unless explicitly approved.
4. Read AGENTS.md, TASKS.md, WORKLOG.md, DECISIONS.md, and any task-relevant files in docs/.
5. Report the current branch, repo status, active task, blockers, and proposed next action.
6. Wait for approval before editing unless the user has already given explicit implementation approval.

## Required Shutdown Routine
1. Update WORKLOG.md with what changed, what remains, and any blockers.
2. Update TASKS.md if task status changed.
3. Update DECISIONS.md if an architectural, workflow, safety, or publishing decision was made.
4. Run the relevant tests/checks, or explain why they were not run.
5. Run git status --short and summarize the exact files changed.
6. By default, after approved work is complete and relevant checks have passed, commit and push automatically unless Dr. Fowler explicitly says not to push yet. Stop and ask before committing or pushing if the changes are unclear, checks fail, deployment/config/secrets are involved, or the repo appears production-sensitive.
7. End every shutdown with an explicit "Shutdown Receipt" section. Do not end with a generic "Done" only.
8. The Shutdown Receipt must visibly report:
   - WORKLOG.md: updated or not updated, with a one-line summary.
   - TASKS.md: updated or not updated, with any task status changes.
   - DECISIONS.md: updated or not updated, with a one-line summary.
   - Tests/checks: commands run, or why none were run.
   - Commit: hash and commit message if a commit was made, or "not committed" with the reason.
   - Push: pushed successfully, failed with reason, or not pushed with the reason.
   - Final git status: exact final status result.

## Worklog Entry Format
Append entries to WORKLOG.md using this shape:

    ### YYYY-MM-DD - [machine/profile] - [session summary]
    - Completed: ...
    - In progress: ...
    - Blockers/notes: ...

## Cross-Machine Rules
- Never assume prior chat context is available. Reconstruct state from Git, TASKS.md, WORKLOG.md, DECISIONS.md, and docs/.
- Use git pull --ff-only only when the working tree is clean.
- Avoid destructive Git operations such as reset --hard, force pushes, history rewrites, or deleting untracked work unless explicitly approved.
- Keep generated context inside this repo's memory files and docs/ so another Windows account or computer can resume.
- Do not store secrets, tokens, credentials, private keys, or unnecessary sensitive data in repo docs.
- Preserve user or prior-Codex changes that are already in the working tree.

## Project-Specific Rules
- Keep legacy source repos unchanged unless explicitly asked.
- Keep asam-app/ as a full app; do not flatten it into the static hub.
- Keep jfk/ pages together so internal links continue to work.
- Do not link to non-deployable app folders as if they are static Pages targets.
- Remove repo-internal migration wording from public pages; keep source mapping in README/docs.
- For JFK feedback work, inspect which script the HTML actually loads before editing.
- Beginner-facing setup docs should say which directory commands run from, especially inside asam-app/.

## Verification Guidance
- For static page changes, verify key pages render more than HTTP 200 when feasible.
- For asam-app/ changes, inspect package scripts first and run the relevant npm checks from asam-app/.
- If tests cannot run, record the reason in WORKLOG.md before shutdown.
