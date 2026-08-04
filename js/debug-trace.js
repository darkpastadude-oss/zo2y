// debug-trace.js - Observability ONLY. No auth/app logic changes.
// Renders the auth lifecycle timeline to a visible panel so startup behavior
// can be inspected on a phone (especially iPhone Safari) without a console.
//
// It listens to the existing event bus emitted by auth-gate.js:
//   - 'zo2y-auth-debug'          (label, payload, t) fired by pushAuthDebugEvent
//   - 'zo2y-auth-ready'          fired by bootstrap-auth.js when restore completes
//   - 'zo2y-auth-gate-verified'  fired by auth-gate.js after verifyAndApplySession
// It also records resource load timing and dataset transitions.
//
// Safe by construction: every handler is wrapped; nothing here can throw into app code.
(function () {
  'use strict';
  if (window.__ZO2Y_DEBUG_TRACE_LOADED) return;
  window.__ZO2Y_DEBUG_TRACE_LOADED = true;

  var MAX_EVENTS = 600;
  var POLL_MS = 250;
  var POLL_DURATION_MS = 20000;
  var startWall = Date.now();
  var startPerf = performance.now();
  var events = [];
  var lastDataset = '';
  var panel = null;
  var body = null;

  function fmt(ms) {
    return (Math.round(ms * 100) / 100).toFixed(2);
  }

  function push(label, detail) {
    var safeDetail = '';
    try {
      safeDetail = detail === undefined || detail === null ? '' : String(detail);
    } catch (_err) {
      safeDetail = '';
    }
    events.push({
      t: performance.now() - startPerf,
      label: String(label || ''),
      detail: safeDetail
    });
    if (events.length > MAX_EVENTS) events.splice(0, events.length - MAX_EVENTS);
    render();
  }

  function render() {
    if (!panel || !body) return;
    var rows = [];
    var lastT = 0;
    for (var i = 0; i < events.length; i += 1) {
      var e = events[i];
      var delta = i === 0 ? e.t : (e.t - lastT);
      lastT = e.t;
      var row = document.createElement('div');
      row.className = 'tr';
      var badge = document.createElement('span');
      badge.className = 'tr-t';
      badge.textContent = '+' + fmt(e.t) + 'ms';
      var deltaSpan = document.createElement('span');
      deltaSpan.className = 'tr-d';
      deltaSpan.textContent = '(' + fmt(delta) + ')';
      var labelSpan = document.createElement('span');
      labelSpan.className = 'tr-l';
      labelSpan.textContent = e.label;
      row.appendChild(badge);
      row.appendChild(deltaSpan);
      row.appendChild(labelSpan);
      if (e.detail) {
        var detailDiv = document.createElement('div');
        detailDiv.className = 'tr-x';
        detailDiv.textContent = e.detail;
        row.appendChild(detailDiv);
      }
      rows.push(row);
    }
    var list = panel.querySelector('.dbg-list');
    list.innerHTML = '';
    for (var j = 0; j < rows.length; j += 1) list.appendChild(rows[j]);
    var status = panel.querySelector('.dbg-status');
    if (status) {
      status.textContent =
        'page=' + location.pathname +
        ' | authShell=' + (document.documentElement.getAttribute('data-auth-shell') || '') +
        ' | authed=' + (document.documentElement.getAttribute('data-authenticated') || '') +
        ' | verified=' + (document.documentElement.getAttribute('data-auth-verified') || '') +
        ' | __AUTH_READY=' + (window.__AUTH_READY === true) +
        ' | __ZO2Y_AUTH_STATE=' + String(window.__ZO2Y_AUTH_STATE) +
        ' | gate=' + (typeof window.ZO2Y_AUTH === 'object');
    }
  }

  function dumpDiagnostics() {
    var out = {};
    try {
      out.traceVersion = 'D';
      out.fetchHook = window.__ZO2Y_TRACE_FETCH_HOOKED === true ? 'installed' : 'MISSING';
    } catch (_err) { out.traceVersion = '?'; }
    try {
      out.hasStoredSession = typeof window.__ZO2Y_HAS_STORED_AUTH_SESSION === 'function'
        ? window.__ZO2Y_HAS_STORED_AUTH_SESSION()
        : null;
    } catch (_err) { out.hasStoredSession = 'ERR'; }
    try {
      if (typeof window.__ZO2Y_AUTH_DIAGNOSTICS === 'function') {
        var snap = window.__ZO2Y_AUTH_DIAGNOSTICS();
        out.diag = {
          pageKey: snap.pageKey,
          debugEnabled: snap.debugEnabled,
          hasStoredSession: snap.hasStoredSession,
          verifyInFlight: !!snap.verifyInFlight,
          lastVerifyAt: snap.lastVerifyAt,
          oauthFlow: snap.oauthFlow,
          postAuthRedirect: snap.postAuthRedirect
        };
        out.sessionPreview = snap.sessionPreview;
      }
    } catch (_err) { out.diag = 'ERR'; }
    try {
      if (window.ZO2Y_AUTH && typeof window.ZO2Y_AUTH.getDebugSnapshot === 'function') {
        var g = window.ZO2Y_AUTH.getDebugSnapshot();
        out.snapshot = {
          hasStoredSession: g.hasStoredSession,
          verifyInFlight: !!g.verifyInFlight,
          lastVerifyAt: g.lastVerifyAt,
          recent: (g.recentEvents || []).slice(-25)
        };
      }
    } catch (_err) { out.snapshot = 'ERR'; }
    try {
      var raw = null;
      try { raw = window.localStorage ? window.localStorage.getItem('zo2y-auth-v2') : null; } catch (_e) {}
      if (raw) {
        try {
          var parsed = JSON.parse(raw);
          var s = parsed && parsed.currentSession ? parsed.currentSession
            : parsed && parsed.session ? parsed.session : parsed;
          out.storedV2 = {
            hasToken: !!(s && s.access_token),
            hasRefresh: !!(s && s.refresh_token),
            userId: s && s.user ? String(s.user.id || '').slice(0, 12) : null,
            email: s && s.user ? String(s.user.email || '') : null,
            expiresAt: s && s.expires_at ? s.expires_at : null
          };
        } catch (_e2) { out.storedV2 = { parseError: true }; }
      } else {
        out.storedV2 = null;
      }
    } catch (_e3) { out.storedV2 = 'ERR'; }
    push('DIAGNOSTICS', JSON.stringify(out));
  }

  function buildPanel() {
    if (panel) return;
    if (!document.body) return;
    body = document.body;
    panel = document.createElement('div');
    panel.className = 'dbg-panel';
    panel.innerHTML =
      '<div class="dbg-head">' +
        '<strong>ZO2Y STARTUP TRACE</strong>' +
        '<div class="dbg-status"></div>' +
        '<div class="dbg-actions">' +
          '<button type="button" data-dbg="diag">Diagnostics</button>' +
          '<button type="button" data-dbg="refresh">Refresh</button>' +
          '<button type="button" data-dbg="copy">Copy log</button>' +
          '<button type="button" data-dbg="close">Close</button>' +
        '</div>' +
      '</div>' +
      '<div class="dbg-list"></div>';
    panel.addEventListener('click', function (event) {
      var btn = event.target && event.target.closest ? event.target.closest('[data-dbg]') : null;
      if (!btn) return;
      var action = btn.getAttribute('data-dbg');
      if (action === 'diag') dumpDiagnostics();
      if (action === 'refresh') { render(); dumpDiagnostics(); }
      if (action === 'close') panel.classList.toggle('dbg-collapsed');
      if (action === 'copy') {
        try {
          var text = events.map(function (e) {
            return '+' + fmt(e.t) + 'ms ' + e.label + (e.detail ? ' | ' + e.detail : '');
          }).join('\n');
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function () { push('CLIPBOARD', 'copied'); }).catch(function () {});
          } else {
            push('CLIPBOARD', 'copy unavailable');
          }
        } catch (_err) {}
      }
    });
    document.body.appendChild(panel);
    var style = document.createElement('style');
    style.textContent =
      '.dbg-panel{position:fixed;left:0;right:0;bottom:0;z-index:2147483000;max-height:45vh;display:flex;flex-direction:column;background:#0a1024;color:#e6ecff;font:10px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;border-top:2px solid #ffb23f;box-shadow:0 -6px 24px rgba(0,0,0,.55);}\n' +
      '.dbg-head{padding:6px 8px;border-bottom:1px solid #22305c;flex:0 0 auto;}\n' +
      '.dbg-head strong{color:#ffb23f;font-size:11px;}\n' +
      '.dbg-status{color:#9db2dc;margin:2px 0;word-break:break-all;}\n' +
      '.dbg-actions button{background:#16244d;color:#dbe6ff;border:1px solid #31406f;border-radius:4px;font-size:10px;padding:3px 8px;margin-right:4px;cursor:pointer;-webkit-tap-highlight-color:transparent;}\n' +
      '.dbg-actions button:active{background:#23376b;}\n' +
      '.dbg-list{overflow-y:auto;flex:1 1 auto;-webkit-overflow-scrolling:touch;padding:4px 8px 8px;}\n' +
      '.dbg-panel .tr{padding:2px 0;border-bottom:1px solid #131c3a;}\n' +
      '.dbg-panel .tr-t{color:#ffb23f;}\n' +
      '.dbg-panel .tr-d{color:#5a6d9e;margin:0 4px;}\n' +
      '.dbg-panel .tr-l{color:#e6ecff;}\n' +
      '.dbg-panel .tr-x{color:#8ea3cd;margin-left:12px;word-break:break-all;}\n' +
      '.dbg-panel.dbg-collapsed .dbg-list{display:none;}\n' +
      '.dbg-panel.dbg-collapsed{max-height:none;}\n' +
      '@media(max-width:640px){.dbg-panel{font-size:9px;max-height:40vh;}.dbg-panel .tr-x{margin-left:6px;}}';
    document.head.appendChild(style);
    render();
  }

  function hookEvents() {
    try {
      window.addEventListener('zo2y-auth-debug', function (event) {
        var d = event && event.detail;
        if (!d) return;
        var payload = '';
        try { payload = d.payload && typeof d.payload === 'object' ? JSON.stringify(d.payload) : (d.payload || ''); } catch (_e) { payload = '?'; }
        push('auth:' + d.label, payload);
      });
    } catch (_err) {}
    try {
      window.addEventListener('zo2y-auth-ready', function () {
        push('AUTH_READY_EVENT', 'bootstrap-auth finished; state=' + String(window.__ZO2Y_AUTH_STATE));
      });
    } catch (_err) {}
    try {
      window.addEventListener('zo2y-auth-gate-verified', function (event) {
        var d = event && event.detail;
        push('GATE_VERIFIED', d && d.authenticated ? 'authenticated' : 'guest' + (d ? ' pageKey=' + d.pageKey : ''));
      });
    } catch (_err) {}
    try {
      if (typeof PerformanceObserver === 'function') {
        var po = new PerformanceObserver(function (list) {
          try {
            var entries = list.getEntries();
            for (var i = 0; i < entries.length; i += 1) {
              var name = entries[i].name;
              if (/\.(js|css)(\?|$)/.test(name)) {
                push('LOAD', name.replace(/^.*\//, '') + ' (' + Math.round(entries[i].duration) + 'ms)');
              }
            }
          } catch (_e) {}
        });
        try { po.observe({ entryTypes: ['resource'] }); } catch (_e2) {}
      }
    } catch (_err) {}
    try {
      window.addEventListener('pageshow', function (event) {
        push('PAGESHOW', event.persisted ? 'persisted (bfcache)' : 'fresh');
      });
    } catch (_err) {}
    try {
      window.addEventListener('pagehide', function () {
        push('PAGEHIDE', 'leaving');
      });
    } catch (_err) {}
  }

  function hookFetch() {
    try {
      if (window.__ZO2Y_TRACE_FETCH_HOOKED) return;
      window.__ZO2Y_TRACE_FETCH_HOOKED = true;
      var originalFetch = window.fetch;
      if (typeof originalFetch !== 'function') return;
      window.fetch = function (input, init) {
        var url = '';
        try {
          url = typeof input === 'string' ? input : (input && input.url) ? String(input.url) : String(input || '');
        } catch (_e) { url = String(input || ''); }
        var isSupabaseRest = /supabase\.co\/rest\/v1\//i.test(url);
        var isSupabaseAuth = /supabase\.co\/auth\/v1\//i.test(url);
        var startedAt = performance.now();
        if (isSupabaseRest || isSupabaseAuth) {
          var clean = url.replace(/^https:\/\/[^/]+/, '');
          try {
            var u = new URL(url);
            var table = (u.pathname.match(/\/rest\/v1\/([^/?]+)/) || [])[1] || u.pathname;
            var action = String((init && init.method) || (input && input.method) || 'GET').toUpperCase();
            push('NET:' + (isSupabaseAuth ? 'AUTH' : 'DB'), action + ' ' + table);
          } catch (_e2) {
            push('NET:' + (isSupabaseAuth ? 'AUTH' : 'DB'), clean);
          }
        }
        var p = originalFetch.apply(this, arguments);
        if (isSupabaseRest || isSupabaseAuth) {
          var timed = false;
          var done = function (status) {
            if (timed) return;
            timed = true;
            var ms = Math.round((performance.now() - startedAt) * 10) / 10;
            push('NET:DONE:' + (isSupabaseAuth ? 'AUTH' : 'DB'), (status || '?') + ' in ' + ms + 'ms');
          };
          p.then(function (res) { done(res && res.status); }).catch(function () { done('ERR'); });
        }
        return p;
      };
    } catch (_err) {}
  }

  function pollState() {
    var startedAt = Date.now();
    var interval = window.setInterval(function () {
      if (!document.documentElement) return;
      if (Date.now() - startedAt > POLL_DURATION_MS) {
        window.clearInterval(interval);
        return;
      }
      var html = document.documentElement;
      var current =
        (html.getAttribute('data-auth-shell') || '') + '|' +
        (html.getAttribute('data-authenticated') || '') + '|' +
        (html.getAttribute('data-auth-verified') || '') + '|' +
        String(window.__AUTH_READY === true) + '|' +
        String(window.__ZO2Y_AUTH_STATE);
      if (current !== lastDataset) {
        lastDataset = current;
        push('DATASET', current);
      }
      render();
    }, POLL_MS);
  }

  push('TRACE START', 'debug-trace.js loaded, wall=' + new Date(startWall).toISOString());

  // Public marker API so app code (profile, list, showcase loaders) can emit
  // phase markers into the same timeline without depending on internal state.
  window.ZO2Y_TRACE = window.ZO2Y_TRACE || {};
  window.ZO2Y_TRACE.push = function (label, detail) {
    try {
      push(String(label || 'TRACE'), detail === undefined ? '' : String(detail));
    } catch (_err) {}
  };
  window.ZO2Y_TRACE.isActive = function () {
    return true;
  };

  hookFetch();
  hookEvents();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildPanel);
  } else {
    buildPanel();
  }
  pollState();
})();
