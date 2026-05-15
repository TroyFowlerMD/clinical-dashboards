# ASAM Clinical Dashboard - Codex Reference

Use this file as a lightweight handoff document when future Codex threads need project context for the ASAM app inside `clinical-dashboards/asam-app/`.

## Purpose

This app is a clinical decision-support tool for ASAM Level 3.7 and 3.5 documentation workflows, built around NC Medicaid medical necessity language. It helps generate structured clinical content, but it is not an EHR and should not be treated as a PHI storage system.

## Primary Use Case

The user may want Codex to:
- maintain or improve the ASAM dashboard app
- debug UI or generation behavior
- update wording for clinical documentation outputs
- refine app structure, navigation, or deployment readiness
- help turn dashboard output into insurance-ready documentation

## PHI Safeguard

Do not request, store, or introduce direct patient identifiers. Keep examples de-identified, such as:
- `45M with opioid use disorder`
- `adolescent with severe alcohol use disorder`

Avoid names, DOB, MRN, addresses, exact dates, and other direct identifiers.

## Clinical Framing

When explaining or editing documentation behavior, preserve these assumptions:
- documentation should read at an attending-physician level
- language should be precise, active, and defensible
- outputs should support insurance, utilization review, peer-to-peer, and chart documentation workflows
- lower-level-of-care insufficiency should be stated explicitly when relevant
- missing data should be labeled as missing, not invented

## Expected Output Types

Future Codex threads may be asked to help with:
- ASAM dimensional summaries
- peer-to-peer talking points
- psychiatric assessment summaries
- full evaluation-note structure
- letters of medical necessity
- wording and formatting improvements for dashboard-generated content

## Engineering Guidance

- Treat this folder as an app within the larger `clinical-dashboards` consolidation repo.
- Preserve working behavior before polishing wording.
- If a change affects clinical output, keep logic changes and wording changes easy to review.
- Prefer small, testable edits over large rewrites.
- If deployment or setup docs mention old repo names such as `asam-dashboard`, update them only if the change clearly improves the consolidated repo state.

## Documentation Guidance For Future Codex Threads

If the user points Codex to Notion for project context, use Notion as the primary state reference and this file as a local supplement.

Suggested pattern:
1. Read the relevant Notion project page first.
2. Confirm current local git status before editing.
3. Treat this file as background on the ASAM app's purpose, safeguards, and expected outputs.
4. Keep explanations beginner-friendly and practical unless the user asks for deeper detail.

## If Asked To Draft Clinical Text

Use this style:
- concise but complete
- medically necessary and clinically appropriate language
- explicit reasoning about requested level of care
- clear statements about why lower LOC is insufficient when applicable

If information is incomplete:
- say `not documented`
- identify what additional information would strengthen the note
- do not fabricate findings

## Maintenance Note

This file intentionally replaces the older Perplexity-specific prompt and now serves as the local Codex reference for this app. It should stay short, durable, and useful as a project-context document rather than a tool-specific system prompt.
