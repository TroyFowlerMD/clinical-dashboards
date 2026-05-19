<!-- last-reviewed: 2026-05-18 -->
<!-- source: notion -->

# 2026-05-11 - JFK Feedback Submission Fix Paused

## Paused State
Troy asked to abort the active repo/deployment work and add it as an Asana todo. No PR was opened.

## Findings To Preserve
- Repo: TroyFowlerMD/jfk-clinical-dashboard.
- Initial target: feedback.js.
- Runtime finding: HTML pages currently load feedback-submit.js, not feedback.js.
- Apps Script URL/deployment could not be updated through browser automation because Google required sign-in.

## Resume Checklist
- Decide whether to update feedback-submit.js or wire pages to feedback.js.
- Remove no-cors from the active fetch.
- Use a simple request compatible with Apps Script e.postData.contents parsing.
- Set FEEDBACK_ENDPOINT to the deployed Google Apps Script Web App URL for Website Feedback/Requests.
- Verify/redeploy doPost(e) and add best-effort [formsubmit.co](http://formsubmit.co) fallback to [troyfowlermd@gmail.com](mailto:troyfowlermd@gmail.com).
