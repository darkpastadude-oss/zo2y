// ============================================================
// [PREVIEW] On-device boot diagnostic for the profile initial-load
// divergence (fresh post-login navigation vs refresh). NOT for production.
// Enable with ?diag=1 (or sessionStorage zo2y-diag='1').
// Loads as a NON-deferred sync script in <head> BEFORE the deferred
// auth-gate/bootstrap-auth/shared-header/profile scripts, so it is defined
// before any of them run and can capture their timing regardless of failures.
// ============================================================
(function () {
  'use strict';
  var enabled = (function () {
    try {
      if (new URLSearchParams(window.location.search).get('diag') === '0') return false;
      return true;
    } catch (_e) {}
    return true;
  })();

  var events = [];
  var kv = {};
  var clientSeq = 0;
  var clientMap = {};

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function fmt(ts) {
    var d = new Date(ts);
    return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()) + '.' + ('000' + d.getMilliseconds()).slice(-3);
  }

  function ev(stage, status, detail) {
    var entry = { t: Date.now(), stage: String(stage || ''), status: status || 'info', detail: detail === undefined || detail === null ? '' : String(detail) };
    events.push(entry);
    if (events.length > 3000) events.splice(0, events.length - 3000);
    try { if (enabled) console.debug('[Z-DIAG]', fmt(entry.t), entry.stage, entry.status, entry.detail); } catch (_e) {}
    render();
  }

  function set(k, v) {
    kv[k] = v;
    render();
  }

  // Fingerprint a supabase client so we can see EXACTLY which instance each
  // gate (auth-gate shared / header / profile fallback) is using.
  function stampClient(client, tag) {
    var clientTag = tag || 'client';
    if (!client || typeof client !== 'object') return null;
    if (client.__zo2yDiagId) return client.__zo2yDiagId;
    clientSeq += 1;
    var id = clientTag + '#' + clientSeq;
    try { Object.defineProperty(client, '__zo2yDiagId', { value: id, configurable: true, writable: true, enumerable: false }); }
    catch (_e) { client.__zo2yDiagId = id; }
    clientMap[id] = client;
    return id;
  }
  function clientId(client) {
    if (!client || typeof client !== 'object') return null;
    if (client.__zo2yDiagId) return client.__zo2yDiagId;
    return stampClient(client, 'anon');
  }

  window.__zo2yDiag = {
    enabled: enabled,
    ev: ev,
    set: set,
    stampClient: stampClient,
    clientId: clientId,
    events: function () { return events.slice(); },
    kv: function () { return Object.assign({}, kv); },
    dump: function () {
      var meta = 'URL: ' + location.href + '\nUA: ' + navigator.userAgent + '\nVIEWPORT: ' + window.innerWidth + 'x' + window.innerHeight;
      var body = events.map(function (e) { return fmt(e.t) + ' [' + e.status + '] ' + e.stage + (e.detail ? '  ' + e.detail : ''); }).join('\n');
      var kvBody = Object.keys(kv).map(function (k) { return k + ' = ' + kv[k]; }).join('\n');
      return meta + '\n\n=== SNAPSHOT ===\n' + kvBody + '\n\n=== TIMELINE ===\n' + body;
    }
  };

  // ---- panel UI ----
  var container = null, panel = null, countEl = null, snapshotEl = null;
  var OPEN = false;

  function css(el, s) { for (var k in s) el.style[k] = s[k]; }
  function makeBtn(text, bg) {
    var b = document.createElement('button');
    b.textContent = text;
    css(b, { border: 'none', borderRadius: '6px', padding: '4px 8px', color: '#fff', fontSize: '11px', cursor: 'pointer', background: bg });
    return b;
  }

  var STATUS_COLORS = { ok: '#10b981', warn: '#f59e0b', error: '#ef4444', info: '#60a5fa' };

  function statusDot(s) {
    var d = document.createElement('span');
    css(d, { display: 'inline-block', width: '9px', height: '9px', borderRadius: '50%', background: STATUS_COLORS[s] || STATUS_COLORS.info, marginRight: '5px', flexShrink: '0' });
    return d;
  }

  function renderSnapshot() {
    if (!snapshotEl) return;
    snapshotEl.textContent = '';
    var ordered = ['AUTH_STATE', 'AUTH_READY', 'BOOT_TOKEN', 'CLIENT_SHARED', 'CLIENT_PROFILE', 'CLIENT_RESOLVE', 'SESSION_ATTACHED', 'USER_RESOLVED', 'PROFILE_SRC', 'SHOWCASE_LEN', 'INIT_DONE'];
    ordered.forEach(function (k) {
      if (kv[k] === undefined) return;
      var row = document.createElement('div');
      css(row, { display: 'flex', fontSize: '11px', padding: '1px 0' });
      var n = document.createElement('span');
      n.textContent = k.toLowerCase().replace(/_/g, ' ') + ':';
      css(n, { color: '#94a3b8', width: '130px', flexShrink: '0' });
      var v = document.createElement('span');
      var s = String(kv[k]);
      v.textContent = s;
      css(v, { color: s.indexOf('ERROR') !== -1 ? '#f87171' : (s.indexOf('NO') !== -1 || s.indexOf('TIMEOUT') !== -1 ? '#f59e0b' : '#e2e8f0'), wordBreak: 'break-all' });
      row.appendChild(n); row.appendChild(v);
      snapshotEl.appendChild(row);
    });
  }

  function renderTimeline() {
    if (!container) return;
    container.textContent = '';
    if (events.length === 0) {
      container.textContent = 'no events captured yet';
      if (countEl) countEl.textContent = '0 events';
      return;
    }
    var frag = document.createDocumentFragment();
    events.forEach(function (e) {
      var row = document.createElement('div');
      css(row, { display: 'flex', alignItems: 'flex-start', padding: '2px 0', borderBottom: '1px solid rgba(255,255,255,.04)' });
      var time = document.createElement('span');
      time.textContent = fmt(e.t);
      css(time, { color: '#64748b', marginRight: '6px', flexShrink: '0' });
      var label = document.createElement('span');
      label.textContent = e.stage;
      css(label, { color: '#e2e8f0', flexShrink: '0', fontWeight: '600', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' });
      var det = document.createElement('span');
      det.textContent = e.detail ? '  ' + e.detail : '';
      css(det, { color: '#94a3b8', wordBreak: 'break-all' });
      row.appendChild(statusDot(e.status));
      row.appendChild(time);
      row.appendChild(label);
      row.appendChild(det);
      frag.appendChild(row);
    });
    container.appendChild(frag);
    container.scrollTop = container.scrollHeight;
    if (countEl) countEl.textContent = events.length + ' events';
  }

  function render() {
    renderSnapshot();
    renderTimeline();
  }

  function curText() { return window.__zo2yDiag && window.__zo2yDiag.dump ? window.__zo2yDiag.dump() : 'diag unavailable'; }

  var flashEl = null;
  function showFlash(txt) {
    if (!flashEl) {
      flashEl = document.createElement('div');
      css(flashEl, { position: 'fixed', top: '12px', left: '50%', transform: 'translateX(-50%)', background: '#10b981', color: '#06281a', padding: '6px 12px', borderRadius: '8px', zIndex: '1000003', fontWeight: '700', fontSize: '12px' });
      document.body.appendChild(flashEl);
    }
    flashEl.textContent = txt;
    flashEl.style.display = 'block';
    setTimeout(function () { if (flashEl) flashEl.style.display = 'none'; }, 1200);
  }

  function copyAll() {
    var text = curText();
    if (!window.isSecureContext || !navigator.clipboard) {
      var ta = document.createElement('textarea');
      ta.value = text;
      css(ta, { position: 'fixed', left: '-9999px', top: '0' });
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); showFlash('copied (fallback)'); } catch (_e) { showFlash('copy failed'); }
      document.body.removeChild(ta);
      return;
    }
    navigator.clipboard.writeText(text).then(function () { showFlash('copied'); }).catch(function () { showFlash('copy failed'); });
  }

  function close() { OPEN = false; if (panel) panel.style.display = 'none'; }
  function toggle() { OPEN = !OPEN; if (panel) { panel.style.display = OPEN ? 'flex' : 'none'; if (OPEN) render(); } }

  function buildUI() {
    var fab = document.createElement('button');
    fab.setAttribute('aria-label', 'Boot diagnostics');
    fab.textContent = 'diag';
    css(fab, { position: 'fixed', bottom: '14px', right: '14px', zIndex: '1000002', background: 'rgba(16,185,129,.95)', color: '#06281a', border: 'none', borderRadius: '999px', padding: '10px 14px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,.4)', fontFamily: 'inherit' });
    fab.addEventListener('click', function (e) { e.stopPropagation(); toggle(); });
    document.body.appendChild(fab);

    panel = document.createElement('div');
    css(panel, { position: 'fixed', bottom: '58px', right: '10px', zIndex: '1000002', width: 'min(95vw,460px)', maxHeight: '70vh', display: 'none', flexDirection: 'column', background: '#0f172a', border: '1px solid rgba(255,255,255,.15)', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,.5)', color: '#e2e8f0', fontFamily: 'ui-monospace,Menlo,monospace', fontSize: '12px', lineHeight: '14px', boxSizing: 'border-box' });

    var hdr = document.createElement('div');
    css(hdr, { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', padding: '8px 10px', background: '#1e293b', borderBottom: '1px solid rgba(255,255,255,.1)' });
    var title = document.createElement('span');
    title.style.fontWeight = '700';
    title.textContent = 'BOOT DIAG';
    var topBtns = document.createElement('div');
    css(topBtns, { display: 'flex', gap: '6px' });
    var bCopy = makeBtn('copy', '#10b981');
    var bClose = makeBtn('close', '#64748b');
    bCopy.addEventListener('click', copyAll);
    bClose.addEventListener('click', close);
    topBtns.appendChild(bCopy); topBtns.appendChild(bClose);
    hdr.appendChild(title); hdr.appendChild(topBtns);
    panel.appendChild(hdr);

    var snapWrap = document.createElement('div');
    css(snapWrap, { padding: '8px 10px', background: '#111c33', borderBottom: '1px solid rgba(255,255,255,.08)' });
    var snapTitle = document.createElement('div');
    snapTitle.textContent = 'SNAPSHOT';
    css(snapTitle, { fontSize: '10px', color: '#64748b', fontWeight: '700', marginBottom: '4px' });
    snapshotEl = document.createElement('div');
    snapWrap.appendChild(snapTitle); snapWrap.appendChild(snapshotEl);
    panel.appendChild(snapWrap);

    countEl = document.createElement('div');
    css(countEl, { fontSize: '11px', color: '#94a3b8', padding: '6px 12px' });
    panel.appendChild(countEl);

    container = document.createElement('div');
    css(container, { overflow: 'auto', padding: '4px 10px 10px', flex: '1' });
    panel.appendChild(container);

    document.body.appendChild(panel);
    render();
  }

  try {
    window.addEventListener('error', function (e) {
      ev('window:error', 'error', String(e && e.message || '').slice(0, 200) + ' @ ' + String(e && e.filename || '?') + ':' + (e && e.lineno || ''));
    });
    window.addEventListener('unhandledrejection', function (e) {
      var r = e && e.reason;
      ev('window:rejection', 'error', ((r && r.stack) || (r && r.message) || String(r)).slice(0, 1400));
    });
  } catch (_e) {}

  if (enabled) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', buildUI, { once: true });
    } else {
      buildUI();
    }
  }
})();