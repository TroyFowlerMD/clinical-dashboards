(function () {
  'use strict';

  var ALLOWED_EMAIL = 'troyfowlermd@gmail.com';
  var IDENTITY_ENDPOINT = '/cdn-cgi/access/get-identity';
  var APP_ID = 'jfk-clinical-dashboard';
  var enabled = false;

  function injectStyles() {
    if (document.getElementById('jfk-it-mode-styles')) return;
    var style = document.createElement('style');
    style.id = 'jfk-it-mode-styles';
    style.textContent = [
      '.it-mode-entry{display:inline-flex;margin-top:6px;padding:3px 7px;border:1px solid var(--border);border-radius:6px;background:transparent;color:var(--text-muted);font:600 10px/1.3 var(--font-display,inherit);cursor:pointer}',
      '.it-mode-entry:hover{border-color:var(--teal);color:var(--teal)}',
      '.it-mode-entry-status{display:block;margin-top:5px;color:var(--text-muted);font-size:10px;line-height:1.35}',
      '.it-request-btn{flex:0 0 auto;margin-left:auto;margin-right:7px;padding:3px 7px;border:1px solid var(--teal-border,var(--border));border-radius:6px;background:var(--teal-bg,transparent);color:var(--teal);font:700 10px/1.25 var(--font-display,inherit);cursor:pointer}',
      '.it-request-btn:hover{filter:brightness(1.08)}',
      '.it-mode-banner{position:fixed;right:12px;bottom:12px;z-index:1000;display:flex;align-items:center;gap:8px;padding:7px 10px;border:1px solid var(--teal-border,var(--border));border-radius:9px;background:var(--surface,#182027);color:var(--text);box-shadow:0 8px 28px rgba(0,0,0,.32);font-size:11px;font-weight:700}',
      '.it-mode-banner button{padding:3px 7px;border:1px solid var(--border);border-radius:6px;background:transparent;color:var(--text);cursor:pointer}',
      '@media print{.it-mode-entry,.it-request-btn,.it-mode-banner,.it-mode-entry-status{display:none!important}}'
    ].join('');
    document.head.appendChild(style);
  }

  function feedbackBox() {
    return document.getElementById('feedbackBox') || document.querySelector('.feedback-box');
  }

  function ensureEntryButton() {
    var box = feedbackBox();
    if (!box || box.querySelector('.it-mode-entry')) return false;
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'it-mode-entry';
    button.textContent = 'Enter IT mode (admin only)';
    button.addEventListener('click', enterItMode);
    var status = document.createElement('span');
    status.className = 'it-mode-entry-status';
    status.hidden = true;
    var heading = box.querySelector('h2');
    if (heading) heading.insertAdjacentElement('afterend', button);
    else box.prepend(button);
    button.insertAdjacentElement('afterend', status);
    return true;
  }

  function setEntryStatus(message, isError) {
    var status = document.querySelector('.it-mode-entry-status');
    if (!status) return;
    status.hidden = !message;
    status.textContent = message || '';
    status.style.color = isError ? 'var(--red,#d24b4b)' : '';
  }

  async function accessIdentity() {
    var response = await fetch(IDENTITY_ENDPOINT, {
      credentials: 'include',
      headers: { Accept: 'application/json' }
    });
    if (!response.ok) throw new Error('access-unavailable');
    var identity = await response.json();
    var email = String(identity.email || identity.user_email || '').trim().toLowerCase();
    if (email !== ALLOWED_EMAIL) throw new Error('not-authorized');
    return email;
  }

  async function enterItMode() {
    if (enabled) return;
    setEntryStatus('Checking admin access…', false);
    try {
      await accessIdentity();
      enableItMode();
      setEntryStatus('', false);
    } catch (error) {
      var entryUrl = String(window.JFK_IT_MODE_ENTRY_URL || '').trim();
      if (entryUrl && location.href.indexOf(entryUrl) !== 0) {
        location.assign(entryUrl);
        return;
      }
      setEntryStatus(
        error && error.message === 'not-authorized'
          ? 'This Google account is not authorized for IT mode.'
          : 'IT mode requires the protected Cloudflare Access URL.',
        true
      );
    }
  }

  function textOf(root, selector, fallback) {
    var node = root && root.querySelector(selector);
    return (node && node.textContent || fallback || '').replace(/\s+/g, ' ').trim();
  }

  function workflowContext(element) {
    var page = location.pathname.split('/').pop() || 'workflows.html';
    var phase = element.closest('.workflow-phase');
    var category = element.closest('.wf-category');
    var parts = [page];
    var phaseTitle = textOf(phase, '.workflow-phase-title');
    var categoryTitle = textOf(category, '.wf-category-header');
    if (phaseTitle) parts.push(phaseTitle);
    if (categoryTitle) parts.push(categoryTitle);
    if (element.classList.contains('wf-item')) {
      parts.push(textOf(element, '.wf-item-title', element.id || 'Subcard'));
    }
    if (element.id) parts.push('[' + element.id + ']');
    return parts.join(' > ');
  }

  function moudContext(card, index) {
    var title = textOf(card, '.protocol-header-title', 'MOUD card ' + (index + 1));
    return 'moud.html > ' + title + (card.id ? ' [' + card.id + ']' : '');
  }

  function prepareWidget(widget, context) {
    var root = widget.shadowRoot;
    if (!root) return false;
    var launch = root.querySelector('.launch');
    if (launch) launch.hidden = true;
    var name = root.querySelector('[data-name]');
    if (name) {
      name.value = 'troymd';
      name.required = false;
      name.style.display = 'none';
      var label = name.closest('label');
      if (label) {
        label.hidden = true;
        label.style.display = 'none';
        label.setAttribute('aria-hidden', 'true');
      }
    }
    var message = root.querySelector('[data-message]');
    if (message) message.placeholder = 'Describe the requested change for: ' + context + '. You can paste screenshots here.';
    return true;
  }

  function addRequestButton(container, context, insertBefore) {
    if (!container || container.querySelector(':scope > .it-request-btn')) return;
    var widget = document.createElement('website-feedback');
    widget.className = 'it-widget-host';
    widget.setAttribute('app-id', APP_ID);
    widget.setAttribute('area', context);
    widget.setAttribute('heading', 'IT Request — ' + context);
    widget.setAttribute('button-label', 'Request change');

    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'it-request-btn';
    button.textContent = 'Request change';
    button.title = 'Submit an IT request for ' + context;
    button.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      prepareWidget(widget, context);
      widget.open();
    });

    container.appendChild(widget);
    prepareWidget(widget, context);
    if (insertBefore && insertBefore.parentElement === container) container.insertBefore(button, insertBefore);
    else container.appendChild(button);
  }

  function addWorkflowButtons() {
    document.querySelectorAll('.workflow-phase').forEach(function (phase) {
      var header = phase.querySelector(':scope > .workflow-phase-header');
      addRequestButton(header, workflowContext(phase), header && header.querySelector('.workflow-phase-chevron'));
    });
    document.querySelectorAll('.wf-item').forEach(function (item) {
      var header = item.querySelector(':scope > .wf-item-header');
      addRequestButton(header, workflowContext(item), header && header.querySelector('.wf-item-chevron'));
    });
  }

  function addMoudButtons() {
    document.querySelectorAll('.protocol-card').forEach(function (card, index) {
      var header = card.querySelector(':scope > .protocol-header');
      addRequestButton(header, moudContext(card, index), header && header.querySelector('.protocol-chevron'));
    });
  }

  function showBanner() {
    var banner = document.createElement('div');
    banner.className = 'it-mode-banner';
    banner.innerHTML = '<span>IT mode · ' + ALLOWED_EMAIL + '</span><button type="button">Exit</button>';
    banner.querySelector('button').addEventListener('click', function () { location.reload(); });
    document.body.appendChild(banner);
  }

  function enableItMode() {
    if (enabled) return;
    enabled = true;
    document.documentElement.classList.add('it-mode-enabled');
    customElements.whenDefined('website-feedback').then(function () {
      addWorkflowButtons();
      addMoudButtons();
      showBanner();
    });
  }

  function init() {
    injectStyles();
    ensureEntryButton();
    var observer = new MutationObserver(function () {
      ensureEntryButton();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
