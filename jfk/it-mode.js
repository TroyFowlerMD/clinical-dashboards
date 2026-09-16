(function () {
  'use strict';

  var ALLOWED_EMAIL = 'troyfowlermd@gmail.com';
  var IDENTITY_ENDPOINT = '/cdn-cgi/access/get-identity';
  var FEEDBACK_ENDPOINT = 'https://all-website-feedback.vercel.app/api/feedback';
  var APP_ID = 'jfk-clinical-dashboard';
  var MAX_ATTACHMENTS = 3;
  var MAX_ATTACHMENT_BYTES = 1500000;
  var IMAGE_TYPES = { 'image/png': true, 'image/jpeg': true, 'image/webp': true };
  var enabled = false;

  function injectStyles() {
    if (document.getElementById('jfk-it-mode-styles')) return;
    var style = document.createElement('style'); style.id = 'jfk-it-mode-styles';
    style.textContent = [
      '.it-mode-entry{display:inline-flex;margin-top:6px;padding:3px 7px;border:1px solid var(--border);border-radius:6px;background:transparent;color:var(--text-muted);font:600 10px/1.3 var(--font-display,inherit);cursor:pointer}',
      '.it-mode-entry:hover{border-color:var(--teal);color:var(--teal)}','.it-mode-entry-status{display:block;margin-top:5px;color:var(--text-muted);font-size:10px;line-height:1.35}',
      '.it-request-btn{flex:0 0 auto;margin-left:auto;margin-right:7px;padding:3px 7px;border:1px solid var(--teal-border,var(--border));border-radius:6px;background:var(--teal-bg,transparent);color:var(--teal);font:700 10px/1.25 var(--font-display,inherit);cursor:pointer}',
      '.it-inline-editor{flex:0 0 100%;display:grid;gap:7px;margin:8px 0 0;padding:9px;border:1px solid var(--teal-border,var(--border));border-radius:8px;background:var(--teal-bg,rgba(0,128,128,.08));box-sizing:border-box}',
      '.it-inline-editor[hidden]{display:none!important}.it-inline-request{display:grid;gap:5px;padding-bottom:8px;border-bottom:1px solid var(--border)}',
      '.it-inline-request textarea{width:100%;min-height:82px;box-sizing:border-box;resize:vertical;padding:7px;border:1px solid var(--border);border-radius:6px;background:var(--surface,#182027);color:var(--text);font:inherit;font-size:12px}',
      '.it-inline-attachments,.it-inline-status{color:var(--text-muted);font-size:10px;line-height:1.3}.it-inline-actions{display:flex;flex-wrap:wrap;align-items:center;gap:6px}',
      '.it-inline-actions button{padding:4px 8px;border:1px solid var(--border);border-radius:6px;background:transparent;color:var(--text);font:600 10px/1.25 var(--font-display,inherit);cursor:pointer}',
      '.it-inline-actions .it-inline-send{border-color:var(--teal);background:var(--teal);color:#fff}',
      '.it-mode-banner{position:fixed;right:12px;bottom:12px;z-index:1000;display:flex;align-items:center;gap:8px;padding:7px 10px;border:1px solid var(--teal-border,var(--border));border-radius:9px;background:var(--surface,#182027);color:var(--text);box-shadow:0 8px 28px rgba(0,0,0,.32);font-size:11px;font-weight:700}',
      '.it-mode-banner button{padding:3px 7px;border:1px solid var(--border);border-radius:6px;background:transparent;color:var(--text);cursor:pointer}','@media print{.it-mode-entry,.it-request-btn,.it-inline-editor,.it-mode-banner,.it-mode-entry-status{display:none!important}}'
    ].join(''); document.head.appendChild(style);
  }

  function feedbackBox() { return document.getElementById('feedbackBox') || document.querySelector('.feedback-box'); }
  function ensureEntryButton() {
    var box = feedbackBox(); if (!box || box.querySelector('.it-mode-entry')) return false;
    var button = document.createElement('button'); button.type = 'button'; button.className = 'it-mode-entry'; button.textContent = 'Enter IT mode (admin only)'; button.addEventListener('click', enterItMode);
    var status = document.createElement('span'); status.className = 'it-mode-entry-status'; status.hidden = true;
    var heading = box.querySelector('h2'); if (heading) heading.insertAdjacentElement('afterend', button); else box.prepend(button); button.insertAdjacentElement('afterend', status); return true;
  }
  function setEntryStatus(message, isError) { var status = document.querySelector('.it-mode-entry-status'); if (!status) return; status.hidden = !message; status.textContent = message || ''; status.style.color = isError ? 'var(--red,#d24b4b)' : ''; }
  async function accessIdentity() {
    var response = await fetch(IDENTITY_ENDPOINT, { credentials: 'include', headers: { Accept: 'application/json' } }); if (!response.ok) throw new Error('access-unavailable');
    var identity = await response.json(); var email = String(identity.email || identity.user_email || '').trim().toLowerCase(); if (email !== ALLOWED_EMAIL) throw new Error('not-authorized'); return email;
  }
  async function enterItMode() {
    if (enabled) return; setEntryStatus('Checking admin access…', false);
    try { await accessIdentity(); enableItMode(); setEntryStatus('', false); } catch (error) {
      var entryUrl = String(window.JFK_IT_MODE_ENTRY_URL || '').trim(); if (entryUrl && location.href.indexOf(entryUrl) !== 0) { location.assign(entryUrl); return; }
      setEntryStatus(error && error.message === 'not-authorized' ? 'This Google account is not authorized for IT mode.' : 'IT mode requires the protected Cloudflare Access URL.', true);
    }
  }
  function textOf(root, selector, fallback) { var node = root && root.querySelector(selector); return (node && node.textContent || fallback || '').replace(/\s+/g, ' ').trim(); }
  function workflowContext(element) {
    var page = location.pathname.split('/').pop() || 'workflows.html', phase = element.closest('.workflow-phase'), category = element.closest('.wf-category'); var parts = [page];
    var phaseTitle = textOf(phase, '.workflow-phase-title'), categoryTitle = textOf(category, '.wf-category-header'); if (phaseTitle) parts.push(phaseTitle); if (categoryTitle) parts.push(categoryTitle);
    if (element.classList.contains('wf-item')) parts.push(textOf(element, '.wf-item-title', element.id || 'Subcard')); if (element.id) parts.push('[' + element.id + ']'); return parts.join(' > ');
  }
  function moudContext(card, index) { var title = textOf(card, '.protocol-header-title', 'MOUD card ' + (index + 1)); return 'moud.html > ' + title + (card.id ? ' [' + card.id + ']' : ''); }
  function updateAttachmentText(state) { state.attachments.textContent = state.files.length ? state.files.length + ' screenshot' + (state.files.length === 1 ? '' : 's') + ' attached.' : 'You can paste up to 3 PNG, JPEG, or WebP screenshots.'; }
  function addAttachments(state, files) { Array.prototype.slice.call(files || []).forEach(function (file) { if (IMAGE_TYPES[file.type] && file.size <= MAX_ATTACHMENT_BYTES && state.files.length < MAX_ATTACHMENTS) state.files.push(file); }); updateAttachmentText(state); }
  function readAttachment(file) { return new Promise(function (resolve, reject) { var reader = new FileReader(); reader.onload = function () { resolve({ name: file.name || 'screenshot', type: file.type, data: String(reader.result).split(',')[1] || '' }); }; reader.onerror = reject; reader.readAsDataURL(file); }); }
  function createRequest(editor, context) {
    var request = document.createElement('div'); request.className = 'it-inline-request';
    var state = { context: context, files: [], textarea: document.createElement('textarea'), attachments: document.createElement('div') }; state.textarea.required = true; state.textarea.placeholder = 'Describe the requested change for: ' + context + '.'; state.textarea.setAttribute('aria-label', 'IT request for ' + context); state.attachments.className = 'it-inline-attachments';
    var input = document.createElement('input'); input.type = 'file'; input.accept = 'image/png,image/jpeg,image/webp'; input.multiple = true; input.hidden = true;
    var screenshot = document.createElement('button'); screenshot.type = 'button'; screenshot.textContent = 'Add screenshots'; screenshot.addEventListener('click', function () { input.click(); });
    var actions = document.createElement('div'); actions.className = 'it-inline-actions'; actions.appendChild(screenshot);
    input.addEventListener('change', function () { addAttachments(state, input.files); input.value = ''; });
    state.textarea.addEventListener('paste', function (event) { var files = Array.prototype.slice.call(event.clipboardData && event.clipboardData.items || []).filter(function (item) { return item.kind === 'file' && IMAGE_TYPES[item.type]; }).map(function (item) { return item.getAsFile(); }).filter(Boolean); if (files.length) { event.preventDefault(); addAttachments(state, files); } });
    updateAttachmentText(state); request.append(state.textarea, state.attachments, actions, input); editor.states.push(state); editor.requests.push(request); return state;
  }
  function setEditorStatus(editor, message, isError) { editor.status.textContent = message || ''; editor.status.style.color = isError ? 'var(--red,#d24b4b)' : ''; }
  async function submitRequests(editor, all) {
    var states = all ? editor.states.slice() : [editor.states[editor.states.length - 1]], valid = states.filter(function (state) { return state.textarea.value.trim(); });
    if (!valid.length || valid.length !== states.length) { setEditorStatus(editor, 'Enter a request in each box before sending.', true); return; }
    setEditorStatus(editor, 'Sending…', false); editor.sendButtons.forEach(function (button) { button.disabled = true; });
    try {
      await Promise.all(valid.map(async function (state) { var attachments = await Promise.all(state.files.map(readAttachment)); var response = await fetch(FEEDBACK_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ appId: APP_ID, name: 'troymd', message: state.textarea.value.trim(), attachments: attachments, pageTitle: document.title, pageUrl: location.href, source: 'shared-feedback-widget', area: state.context, userAgent: navigator.userAgent, submissionId: crypto.randomUUID ? crypto.randomUUID() : 'fb-' + Date.now() }) }); if (!response.ok) throw new Error('submit-failed'); }));
      setEditorStatus(editor, all && valid.length > 1 ? valid.length + ' IT requests submitted.' : 'IT request submitted.', false); valid.forEach(function (state) { state.textarea.value = ''; state.files = []; updateAttachmentText(state); });
      if (all) editor.states.slice(1).forEach(function (state) { state.textarea.parentElement.remove(); }); if (all) editor.states = [editor.states[0]];
    } catch (error) { setEditorStatus(editor, 'Could not submit the IT request. Please try again.', true); }
    editor.sendButtons.forEach(function (button) { button.disabled = false; });
  }
  function createInlineEditor(context) {
    var editor = document.createElement('div'); editor.className = 'it-inline-editor'; editor.hidden = true; editor.states = []; editor.requests = []; editor.sendButtons = [];
    createRequest(editor, context); var controls = document.createElement('div'); controls.className = 'it-inline-actions';
    var add = document.createElement('button'); add.type = 'button'; add.textContent = 'Add another request'; add.addEventListener('click', function () { var state = createRequest(editor, context); editor.insertBefore(state.textarea.parentElement, controls); });
    var send = document.createElement('button'); send.type = 'button'; send.className = 'it-inline-send'; send.textContent = 'Send'; send.addEventListener('click', function () { submitRequests(editor, false); }); editor.sendButtons.push(send);
    var sendAll = document.createElement('button'); sendAll.type = 'button'; sendAll.className = 'it-inline-send'; sendAll.textContent = 'Send all'; sendAll.addEventListener('click', function () { submitRequests(editor, true); }); editor.sendButtons.push(sendAll);
    var cancel = document.createElement('button'); cancel.type = 'button'; cancel.textContent = 'Cancel'; cancel.addEventListener('click', function () { editor.hidden = true; });
    var status = document.createElement('span'); status.className = 'it-inline-status'; editor.status = status; controls.append(add, send, sendAll, cancel, status); editor.append(editor.requests[0], controls); return editor;
  }
  function addRequestButton(container, context, insertBefore) {
    if (!container || container.querySelector(':scope > .it-request-btn')) return; var editor = createInlineEditor(context); var button = document.createElement('button'); button.type = 'button'; button.className = 'it-request-btn'; button.textContent = 'Request change'; button.title = 'Submit an IT request for ' + context;
    button.addEventListener('click', function (event) { event.preventDefault(); event.stopPropagation(); editor.hidden = !editor.hidden; if (!editor.hidden) editor.states[editor.states.length - 1].textarea.focus(); }); if (insertBefore && insertBefore.parentElement === container) container.insertBefore(button, insertBefore); else container.appendChild(button); container.appendChild(editor);
  }
  function addWorkflowButtons() { document.querySelectorAll('.workflow-phase').forEach(function (phase) { var header = phase.querySelector(':scope > .workflow-phase-header'); addRequestButton(header, workflowContext(phase), header && header.querySelector('.workflow-phase-chevron')); }); document.querySelectorAll('.wf-item').forEach(function (item) { var header = item.querySelector(':scope > .wf-item-header'); addRequestButton(header, workflowContext(item), header && header.querySelector('.wf-item-chevron')); }); }
  function addMoudButtons() { document.querySelectorAll('.protocol-card').forEach(function (card, index) { var header = card.querySelector(':scope > .protocol-header'); addRequestButton(header, moudContext(card, index), header && header.querySelector('.protocol-chevron')); }); }
  function showBanner() { if (document.querySelector('.it-mode-banner')) return; var banner = document.createElement('div'); banner.className = 'it-mode-banner'; banner.innerHTML = '<span>IT mode · ' + ALLOWED_EMAIL + '</span><button type="button">Exit</button>'; banner.querySelector('button').addEventListener('click', function () { location.reload(); }); document.body.appendChild(banner); }
  function enableItMode() { if (enabled) return; enabled = true; document.documentElement.classList.add('it-mode-enabled'); addWorkflowButtons(); addMoudButtons(); showBanner(); }
  function init() { injectStyles(); ensureEntryButton(); new MutationObserver(function () { ensureEntryButton(); if (enabled) { addWorkflowButtons(); addMoudButtons(); } }).observe(document.body, { childList: true, subtree: true }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
