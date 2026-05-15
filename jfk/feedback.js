/* ==========================================================================
   Feedback System — Shared across all pages
   Uses Google Apps Script web app as backend for Google Sheets storage
   ========================================================================== */

(function() {
  'use strict';

  // Google Apps Script web app URL — will be set after deployment
  var FEEDBACK_ENDPOINT = '';

  // Initialize all feedback forms on the page
  document.querySelectorAll('.feedback-form').forEach(function(form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();

      var nameInput = form.querySelector('.feedback-name');
      var commentInput = form.querySelector('.feedback-comment');
      var submitBtn = form.querySelector('.feedback-submit');
      var successMsg = form.querySelector('.feedback-success');
      var errorMsg = form.querySelector('.feedback-error');

      var name = nameInput.value.trim();
      var comment = commentInput.value.trim();

      if (!name || !comment) return;

      // Disable button during submission
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting…';
      successMsg.style.display = 'none';
      errorMsg.style.display = 'none';

      var pageName = document.title.split('—')[0].trim();
      var timestamp = new Date().toISOString();

      if (!FEEDBACK_ENDPOINT) {
        // Endpoint not configured yet — show success anyway and log to console
        console.log('Feedback submitted:', { name: name, comment: comment, page: pageName, timestamp: timestamp });
        successMsg.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit';
        nameInput.value = '';
        commentInput.value = '';
        return;
      }

      var data = {
        name: name,
        comment: comment,
        page: pageName,
        timestamp: timestamp
      };

      fetch(FEEDBACK_ENDPOINT, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(function() {
        successMsg.style.display = 'block';
        nameInput.value = '';
        commentInput.value = '';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit';
      }).catch(function() {
        errorMsg.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit';
      });
    });
  });
})();
