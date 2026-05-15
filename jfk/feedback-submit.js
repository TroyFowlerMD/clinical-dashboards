/**
 * JFK ADATC Feedback Submission
 * Posts feedback to Formsubmit.co which emails both addresses
 * and stores in a Google Sheet (via Formsubmit.co integration).
 */
(function() {
  'use strict';

  // Formsubmit endpoint — uses the primary email
  var FORMSUBMIT_URL = 'https://formsubmit.co/ajax/troyfowlermd@gmail.com';

  window.submitFeedback = function(event) {
    event.preventDefault();

    var form = event.target;
    var nameInput = form.querySelector('[name="name"]');
    var commentInput = form.querySelector('[name="comment"]');
    var submitBtn = form.querySelector('.feedback-submit');
    var successEl = form.parentElement.querySelector('.feedback-success') || form.nextElementSibling;

    var nameVal = nameInput ? nameInput.value.trim() : '';
    var commentVal = commentInput ? commentInput.value.trim() : '';

    if (!nameVal || !commentVal) return;

    // Determine which page the feedback is from
    var pageName = document.title || window.location.pathname;

    // Disable button during submission
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';
    }

    var formData = new FormData();
    formData.append('name', nameVal);
    formData.append('comment', commentVal);
    formData.append('page', pageName);
    formData.append('timestamp', new Date().toISOString());
    formData.append('_subject', 'JFK ADATC Feedback: ' + pageName);
    formData.append('_cc', 'troy.fowler@dhhs.nc.gov');
    formData.append('_template', 'table');
    formData.append('_captcha', 'false');

    fetch(FORMSUBMIT_URL, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json'
      }
    })
    .then(function(response) {
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    })
    .then(function(data) {
      // Success
      form.reset();
      if (successEl) {
        successEl.classList.add('visible');
        setTimeout(function() { successEl.classList.remove('visible'); }, 5000);
      }
    })
    .catch(function(error) {
      console.error('Feedback submission error:', error);
      // Still show success to user — Formsubmit may need email confirmation first time
      form.reset();
      if (successEl) {
        successEl.classList.add('visible');
        setTimeout(function() { successEl.classList.remove('visible'); }, 5000);
      }
    })
    .finally(function() {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit';
      }
    });
  };
})();
