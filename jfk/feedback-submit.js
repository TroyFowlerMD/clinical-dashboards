/* Shared feedback platform loader. The widget itself is versioned and hosted by website-feedback. */
(function () {
  var script = document.createElement('script');
  script.src = 'https://all-website-feedback.vercel.app/feedback-widget.js';
  script.onload = function () {
    var box = document.getElementById('feedbackBox') || document.getElementById('feedbackForm')?.parentElement;
    var page = location.pathname.split('/').pop() || 'home';
    if (box) {
      box.innerHTML = '<h2>IT requests / Feedback</h2><website-feedback app-id="jfk-clinical-dashboard" area="' + page + '" button-label="Submit Ticket/ Feedback"></website-feedback>';
    }

    document.querySelectorAll('.protocol-card').forEach(function (card, index) {
      if (card.querySelector('.card-feedback')) return;
      var title = card.querySelector('.protocol-header-title')?.textContent?.trim() || ('Card ' + (index + 1));
      var slug = title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      var feedback = document.createElement('div');
      feedback.className = 'card-feedback';
      feedback.innerHTML = '<website-feedback app-id="jfk-clinical-dashboard" area="' + page + '-' + slug + '" button-label="Submit Ticket/ Feedback"></website-feedback>';
      var body = card.querySelector('.protocol-body-inner') || card.querySelector('.protocol-body');
      if (body) body.appendChild(feedback);
    });
  };
  document.head.appendChild(script);
})();
