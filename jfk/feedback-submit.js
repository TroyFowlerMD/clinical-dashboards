/* Shared feedback platform loader. The widget itself is versioned and hosted by website-feedback. */
(function () {
  var script = document.createElement('script');
  script.src = 'https://all-website-feedback.vercel.app/feedback-widget.js';
  script.onload = function () {
    var box = document.getElementById('feedbackBox') || document.getElementById('feedbackForm')?.parentElement;
    if (!box) return;
    var page = location.pathname.split('/').pop() || 'home';
    box.innerHTML = '<h2>Suggestions &amp; Feedback</h2><website-feedback app-id="jfk-clinical-dashboard" area="' + page + '" button-label="Open feedback form"></website-feedback>';
  };
  document.head.appendChild(script);
})();
