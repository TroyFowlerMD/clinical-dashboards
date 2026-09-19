(function () {
  'use strict';

  var ALLOWED_EMAIL = 'troyfowlermd@gmail.com';
  var IDENTITY_ENDPOINT = '/cdn-cgi/access/get-identity';
  var FEEDBACK_ENDPOINT = '/api/feedback';
  var APP_ID = 'jfk-clinical-dashboard';
  var AUTO_ENTER_PARAM = 'it_mode';
  var MAX_ATTACHMENTS = 3;
  var MAX_ATTACHMENT_BYTES = 1500000;
  var IMAGE_TYPES = { 'image/png': true, 'image/jpeg': true, 'image/webp': true };
  var CODEX_PROMPT = 'Review all open GitHub issues created today in https://github.com/TroyFowlerMD/website-feedback/issues that have the labels source:jfk-clinical-dashboard, submitter:troymd, and status:new. Treat these as authorized IT Mode requests for https://github.com/TroyFowlerMD/clinical-dashboards. For each matching issue, read the full request, Exact page area, screenshots, and comments; implement the requested change; run the relevant checks; deploy it; and verify the result on the live JFK Clinical Dashboard. Close an issue only after its requested change is confirmed live. Process every matching issue and report the issue, pull request or commit, deployment, and live-verification links.';
  var enabled = false;
  var entries = [];
  var pageObserver = null;

  function injectStyles() {
    if (document.getElementById('jfk-it-mode-styles')) return;
    var style = document.createElement('style'); style.id = 'jfk-it-mode-styles';
    style.textContent = [
      '.it-mode-entry{display:flex;width:max-content;margin:12px 0 0 auto;padding:3px 7px;border:1px solid var(--border);border-radius:6px;background:transparent;color:var(--text-muted);font:600 10px/1.3 var(--font-display,inherit);cursor:pointer}.it-mode-entry:hover{border-color:var(--teal);color:var(--teal)}',
      '.it-mode-entry-status[hidden]{display:none}.it-mode-entry-status{display:block;margin-top:10px;color:var(--text-muted);font-size:10px;line-height:1.35}',
      '.it-request-btn{flex:0 0 auto;margin-left:auto;margin-right:7px;padding:3px 7px;border:1px solid var(--teal-border,var(--border));border-radius:6px;background:var(--teal-bg,transparent);color:var(--teal);font:700 10px/1.25 var(--font-display,inherit);cursor:pointer}.it-request-btn:hover{filter:brightness(1.08)}',
      '.it-inline-editor{display:grid;width:100%;clear:both;gap:7px;margin:8px 0 0;padding:9px;border:1px solid var(--teal-border,var(--border));border-radius:8px;background:var(--teal-bg,rgba(0,128,128,.08));box-sizing:border-box}.it-inline-editor[hidden]{display:none!important}',
      '.it-inline-editor textarea{width:100%;min-height:82px;box-sizing:border-box;resize:vertical;padding:7px;border:1px solid var(--border);border-radius:6px;background:var(--surface,#182027);color:var(--text);font:inherit;font-size:12px}.it-inline-editor textarea[readonly]{opacity:.82}',
      '.it-inline-attachments,.it-inline-status{color:var(--text-muted);font-size:10px;line-height:1.3}.it-inline-actions{display:flex;flex-wrap:wrap;align-items:center;gap:6px}.it-inline-actions button{padding:4px 8px;border:1px solid var(--border);border-radius:6px;background:transparent;color:var(--text);font:600 10px/1.25 var(--font-display,inherit);cursor:pointer}.it-inline-actions .it-inline-send,.it-inline-actions .it-inline-pend{border-color:var(--teal);background:var(--teal);color:#fff}',
      '.it-mode-banner{position:fixed;right:12px;bottom:12px;z-index:1000;display:flex;align-items:center;gap:8px;padding:7px 10px;border:1px solid var(--teal-border,var(--border));border-radius:9px;background:var(--surface,#182027);color:var(--text);box-shadow:0 8px 28px rgba(0,0,0,.32);font-size:11px;font-weight:700}.it-mode-banner button{padding:3px 7px;border:1px solid var(--border);border-radius:6px;background:transparent;color:var(--text);cursor:pointer}.it-mode-banner .it-send-all{border-color:var(--teal);background:var(--teal);color:#fff}.it-mode-queue-count{color:var(--teal)}',
      '.it-confirm-dialog{max-width:440px;border:1px solid var(--teal-border,var(--border));border-radius:10px;background:var(--surface,#182027);color:var(--text);padding:18px;box-shadow:0 12px 42px rgba(0,0,0,.45)}.it-confirm-dialog::backdrop{background:rgba(0,0,0,.58)}.it-confirm-dialog h2{margin:0 0 8px;font-size:16px}.it-confirm-dialog p{font-size:12px;line-height:1.45}.it-confirm-dialog button,.it-confirm-dialog .it-open-chatgpt{display:inline-block;margin:5px 6px 0 0;padding:6px 9px;border:1px solid var(--border);border-radius:6px;background:transparent;color:var(--text);font:inherit;text-decoration:none;cursor:pointer}.it-confirm-dialog .it-open-chatgpt,.it-confirm-dialog .it-copy-prompt{border-color:var(--teal);background:var(--teal);color:#fff}',
      '@media print{.it-mode-entry,.it-request-btn,.it-inline-editor,.it-mode-banner,.it-mode-entry-status{display:none!important}}'
    ].join(''); document.head.appendChild(style);
  }
  function feedbackBox() { return document.getElementById('feedbackBox') || document.querySelector('.feedback-box'); }
  function ensureEntryButton() { var box = feedbackBox(); if (!box || box.querySelector('.it-mode-entry')) return false; var button = document.createElement('button'); button.type = 'button'; button.className = 'it-mode-entry'; button.textContent = 'Enter IT mode (admin only)'; button.addEventListener('click', enterItMode); var status = document.createElement('span'); status.className = 'it-mode-entry-status'; status.hidden = true; box.append(status, button); return true; }
  function setEntryStatus(message, isError) { var status = document.querySelector('.it-mode-entry-status'); if (!status) return; status.hidden = !message; status.textContent = message || ''; status.style.color = isError ? 'var(--red,#d24b4b)' : ''; }
  async function accessIdentity() { if (location.hostname === 'jfk-it-mode.troyfowlermd.workers.dev') return ALLOWED_EMAIL; var response = await fetch(IDENTITY_ENDPOINT, { credentials: 'include', headers: { Accept: 'application/json' } }); if (!response.ok) throw new Error('access-unavailable'); var identity = await response.json(); var email = String(identity.email || identity.user_email || '').trim().toLowerCase(); if (email !== ALLOWED_EMAIL) throw new Error('not-authorized'); return email; }
  function protectedEntryUrl(entryUrl) { var url = new URL(entryUrl, location.href); url.searchParams.set(AUTO_ENTER_PARAM, '1'); return url.toString(); }
  function consumeAutoEnter() { var url = new URL(location.href); if (url.searchParams.get(AUTO_ENTER_PARAM) !== '1') return false; url.searchParams.delete(AUTO_ENTER_PARAM); history.replaceState(history.state, '', url.pathname + url.search + url.hash); return true; }
  async function enterItMode() { if (enabled) return; setEntryStatus('Checking admin access…', false); try { await accessIdentity(); enableItMode(); setEntryStatus('', false); } catch (error) { var entryUrl = String(window.JFK_IT_MODE_ENTRY_URL || '').trim(); if (entryUrl && location.href.indexOf(entryUrl) !== 0) { location.assign(protectedEntryUrl(entryUrl)); return; } setEntryStatus(error && error.message === 'not-authorized' ? 'This Google account is not authorized for IT mode.' : 'IT mode requires the protected Cloudflare Access URL.', true); } }
  function textOf(root, selector, fallback) { var node = root && root.querySelector(selector); return (node && node.textContent || fallback || '').replace(/\s+/g, ' ').trim(); }
  function workflowContext(element) { var page = location.pathname.split('/').pop() || 'workflows.html', phase = element.closest('.workflow-phase'), category = element.closest('.wf-category'), parts = [page]; var phaseTitle = textOf(phase, '.workflow-phase-title'), categoryTitle = textOf(category, '.wf-category-header'); if (phaseTitle) parts.push(phaseTitle); if (categoryTitle) parts.push(categoryTitle); if (element.classList.contains('wf-item')) parts.push(textOf(element, '.wf-item-title', element.id || 'Subcard')); if (element.id) parts.push('[' + element.id + ']'); return parts.join(' > '); }
  function moudContext(card, index) { var title = textOf(card, '.protocol-header-title', 'MOUD card ' + (index + 1)); return 'moud.html > ' + title + (card.id ? ' [' + card.id + ']' : ''); }
  function attachmentText(entry) { entry.attachments.textContent = entry.files.length ? entry.files.length + ' screenshot' + (entry.files.length === 1 ? '' : 's') + ' attached.' : 'You can paste up to 3 PNG, JPEG, or WebP screenshots.'; }
  function addAttachments(entry, files) { Array.prototype.slice.call(files || []).forEach(function (file) { if (IMAGE_TYPES[file.type] && file.size <= MAX_ATTACHMENT_BYTES && entry.files.length < MAX_ATTACHMENTS) entry.files.push(file); }); attachmentText(entry); }
  function readAttachment(file) { return new Promise(function (resolve, reject) { var reader = new FileReader(); reader.onload = function () { resolve({ name: file.name || 'screenshot', type: file.type, data: String(reader.result).split(',')[1] || '' }); }; reader.onerror = reject; reader.readAsDataURL(file); }); }
  function submitErrorMessage(code, status) {
    var messages = {
      feedback_create_failed: 'GitHub could not create this ticket. Your request is still here to retry.',
      feedback_auth_failed: 'The ticket service needs its GitHub authorization renewed. Your request is still here.',
      rate_limited: 'Too many recent submissions. Wait a few minutes, then retry; your requests are still here.',
      invalid_batch: 'This batch could not be validated. Your requests are still here to edit and retry.',
      origin_not_allowed: 'This IT Mode page is not authorized to submit tickets.'
    };
    return messages[code] || ('Ticket submission failed' + (status ? ' (HTTP ' + status + ')' : '') + '. Your requests are still here to retry.');
  }
  function refreshQueue() { var count = entries.filter(function (entry) { return entry.pending && !entry.sent; }).length; var queue = document.querySelector('.it-mode-queue-count'); var sendAll = document.querySelector('.it-send-all'); if (queue) queue.textContent = count ? count + ' pending' : ''; if (sendAll) sendAll.hidden = !entries.some(function (entry) { return !entry.sent && entry.textarea.value.trim(); }); }
  function createEntry(editor, context) {
    var entry = { context: context, files: [], pending: false, sent: false, editor: editor, request: document.createElement('div'), textarea: document.createElement('textarea'), attachments: document.createElement('div') };
    entry.request.className = 'it-inline-request'; entry.textarea.required = true; entry.textarea.placeholder = 'Describe the requested change for: ' + context + '.'; entry.textarea.setAttribute('aria-label', 'IT request for ' + context); entry.attachments.className = 'it-inline-attachments';
    var input = document.createElement('input'); input.type = 'file'; input.accept = 'image/png,image/jpeg,image/webp'; input.multiple = true; input.hidden = true;
    var screenshot = document.createElement('button'); screenshot.type = 'button'; screenshot.textContent = 'Add screenshots'; screenshot.addEventListener('click', function () { input.click(); });
    var edit = document.createElement('button'); edit.type = 'button'; edit.textContent = 'Edit'; edit.hidden = true; edit.addEventListener('click', function () { entry.pending = false; entry.sent = false; entry.textarea.readOnly = false; edit.hidden = true; pend.hidden = false; send.hidden = false; refreshQueue(); entry.textarea.focus(); });
    var pend = document.createElement('button'); pend.type = 'button'; pend.className = 'it-inline-pend'; pend.textContent = 'Pend';
    var send = document.createElement('button'); send.type = 'button'; send.className = 'it-inline-send'; send.textContent = 'Send';
    var cancel = document.createElement('button'); cancel.type = 'button'; cancel.textContent = 'Cancel'; cancel.addEventListener('click', function () { entry.pending = false; entry.textarea.readOnly = false; pend.hidden = false; send.hidden = false; edit.hidden = true; entry.status.textContent = ''; entry.editor.hidden = true; refreshQueue(); });
    var actions = document.createElement('div'); actions.className = 'it-inline-actions'; actions.append(screenshot, pend, send, edit, cancel);
    entry.status = document.createElement('span'); entry.status.className = 'it-inline-status';
    input.addEventListener('change', function () { addAttachments(entry, input.files); input.value = ''; refreshQueue(); });
    entry.textarea.addEventListener('input', refreshQueue); entry.textarea.addEventListener('paste', function (event) { var files = Array.prototype.slice.call(event.clipboardData && event.clipboardData.items || []).filter(function (item) { return item.kind === 'file' && IMAGE_TYPES[item.type]; }).map(function (item) { return item.getAsFile(); }).filter(Boolean); if (files.length) { event.preventDefault(); addAttachments(entry, files); } });
    pend.addEventListener('click', function () { if (!entry.textarea.value.trim()) { entry.status.textContent = 'Enter a request before pending it.'; return; } entry.pending = true; entry.textarea.readOnly = true; pend.hidden = true; send.hidden = true; edit.hidden = false; entry.status.textContent = 'Pending — you can edit this before sending.'; refreshQueue(); });
    send.addEventListener('click', function () { sendEntries([entry]); });
    attachmentText(entry); entry.request.append(entry.textarea, entry.attachments, actions, input, entry.status); entries.push(entry); return entry;
  }
  async function sendEntries(selected) {
    var list = selected.filter(function (entry) { return !entry.sent && entry.textarea.value.trim(); }); if (!list.length) return;
    var bannerStatus = document.querySelector('.it-mode-banner .it-inline-status'); if (bannerStatus) bannerStatus.textContent = 'Sending…';
    try {
      var payloadEntries = await Promise.all(list.map(async function (entry) {
        var submissionId = crypto.randomUUID ? crypto.randomUUID() : 'fb-' + Date.now() + '-' + Math.random().toString(36).slice(2);
        entry.submissionId = submissionId;
        return { message: entry.textarea.value.trim(), attachments: await Promise.all(entry.files.map(readAttachment)), area: entry.context, areaDetail: entry.context, submissionId: submissionId };
      }));
      var response = await fetch(FEEDBACK_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ appId: APP_ID, name: 'troymd', entries: payloadEntries, pageTitle: document.title, pageUrl: location.href, source: 'shared-feedback-widget', userAgent: navigator.userAgent }) });
      var result = await response.json().catch(function () { return {}; });
      if (!Array.isArray(result.results)) { var responseError = new Error(result.error || 'submit-failed'); responseError.status = response.status; throw responseError; }
      var sentCount = 0;
      result.results.forEach(function (outcome) {
        var entry = list.find(function (candidate) { return candidate.submissionId === outcome.submissionId; });
        if (!entry) return;
        if (outcome.ok) { entry.sent = true; entry.editor.hidden = true; sentCount += 1; }
        else entry.status.textContent = submitErrorMessage(outcome.error, response.status);
      });
      entries = entries.filter(function (entry) { return !entry.sent; }); refreshQueue();
      if (sentCount) showConfirmation(sentCount);
      if (sentCount < list.length && bannerStatus) bannerStatus.textContent = sentCount ? (list.length - sentCount) + ' request' + (list.length - sentCount === 1 ? '' : 's') + ' still need to be sent.' : submitErrorMessage(result.error || (result.results[0] && result.results[0].error), response.status);
    } catch (error) { var message = submitErrorMessage(error && error.message, error && error.status); list.forEach(function (entry) { entry.status.textContent = message; }); if (bannerStatus) bannerStatus.textContent = message; }
  }
  function showConfirmation(count) { var dialog = document.getElementById('it-confirm-dialog'); if (!dialog) { dialog = document.createElement('dialog'); dialog.id = 'it-confirm-dialog'; dialog.className = 'it-confirm-dialog'; dialog.innerHTML = '<h2>IT requests sent</h2><p><span class="it-confirm-count"></span> submitted successfully.</p><p>Open ChatGPT in a new tab, then copy and paste the task prompt to complete the requested changes in Codex or ChatGPT Work.</p><div><a class="it-open-chatgpt" href="https://chatgpt.com/" target="_blank" rel="noopener">Open ChatGPT</a><button type="button" class="it-copy-prompt">Copy task prompt</button><button type="button" class="it-close-confirm">Close</button></div>'; dialog.querySelector('.it-copy-prompt').addEventListener('click', function () { navigator.clipboard.writeText(CODEX_PROMPT).then(function () { dialog.querySelector('.it-copy-prompt').textContent = 'Copied'; }); }); dialog.querySelector('.it-close-confirm').addEventListener('click', function () { dialog.close(); }); document.body.appendChild(dialog); } dialog.querySelector('.it-confirm-count').textContent = count + (count === 1 ? ' request was' : ' requests were'); dialog.showModal(); }
  function addRequestButton(container, context, insertBefore) { if (!container || container.querySelector(':scope > .it-request-btn')) return; var editor = document.createElement('div'); editor.className = 'it-inline-editor'; editor.hidden = true; var entry = createEntry(editor, context); editor.appendChild(entry.request); var button = document.createElement('button'); button.type = 'button'; button.className = 'it-request-btn'; button.textContent = 'Request change'; button.title = 'Submit an IT request for ' + context; button.addEventListener('click', function (event) { event.preventDefault(); event.stopPropagation(); editor.hidden = !editor.hidden; if (!editor.hidden) entry.textarea.focus(); }); var parent = container.parentElement; if (insertBefore && insertBefore.parentElement === container) container.insertBefore(button, insertBefore); else container.appendChild(button); if (parent) parent.insertBefore(editor, container.nextSibling); else container.appendChild(editor); }
  function addWorkflowButtons() { document.querySelectorAll('.workflow-phase').forEach(function (phase) { var header = phase.querySelector(':scope > .workflow-phase-header'); addRequestButton(header, workflowContext(phase), header && header.querySelector('.workflow-phase-chevron')); }); document.querySelectorAll('.wf-item').forEach(function (item) { var header = item.querySelector(':scope > .wf-item-header'); addRequestButton(header, workflowContext(item), header && header.querySelector('.wf-item-chevron')); }); }
  function addMoudButtons() { document.querySelectorAll('.protocol-card').forEach(function (card, index) { var header = card.querySelector(':scope > .protocol-header'); addRequestButton(header, moudContext(card, index), header && header.querySelector('.protocol-chevron')); }); }
  function showBanner() { if (document.querySelector('.it-mode-banner')) return; var banner = document.createElement('div'); banner.className = 'it-mode-banner'; banner.innerHTML = '<span>IT mode · ' + ALLOWED_EMAIL + '</span><span class="it-mode-queue-count"></span><button type="button" class="it-send-all" hidden>Send all</button><span class="it-inline-status"></span><button type="button" class="it-exit">Exit</button>'; banner.querySelector('.it-send-all').addEventListener('click', function () { sendEntries(entries); }); banner.querySelector('.it-exit').addEventListener('click', function () { location.reload(); }); document.body.appendChild(banner); refreshQueue(); }
  function enableItMode() { if (enabled) return; enabled = true; if (pageObserver) pageObserver.disconnect(); document.documentElement.classList.add('it-mode-enabled'); showBanner(); addWorkflowButtons(); addMoudButtons(); }
  function init() { injectStyles(); var autoEnter = consumeAutoEnter() || location.hostname === 'jfk-it-mode.troyfowlermd.workers.dev'; ensureEntryButton(); pageObserver = new MutationObserver(function () { if (!enabled) ensureEntryButton(); }); pageObserver.observe(document.body, { childList: true, subtree: true }); if (autoEnter) enterItMode(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
