/* Shared feedback platform loader. The widget itself is versioned and hosted by website-feedback. */
(function () {
  var script = document.createElement('script');
  script.src = 'https://all-website-feedback.vercel.app/feedback-widget.js';
  script.onload = function () {
    var box = document.getElementById('feedbackBox') || document.getElementById('feedbackForm')?.parentElement;
    var page = location.pathname.split('/').pop() || 'home';
    if (box) {
      box.innerHTML = '<h2>Suggestions &amp; Feedback</h2><website-feedback app-id="jfk-clinical-dashboard" area="' + page + '" button-label="Open feedback form"></website-feedback>';
    }

    document.querySelectorAll('[data-feedback-area]').forEach(function (card) {
      var body = card.querySelector('.protocol-body-inner');
      var area = card.getAttribute('data-feedback-area');
      if (!body || !area) return;
      var feedback = document.createElement('div');
      feedback.className = 'card-feedback';
      feedback.innerHTML = '<website-feedback app-id="jfk-clinical-dashboard" area="' + area + '" button-label="Submit feedback or correction"></website-feedback>';
      body.appendChild(feedback);
    });
  };
  document.head.appendChild(script);
})();
