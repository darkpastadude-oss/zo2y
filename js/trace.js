/* trace.js - Flight recorder. DEBUG ONLY. v=20260804flightA
 *
 * Unified timeline + async-op ID tracking + DB wrapper + profile-write
 * stack traces + duplicate-init detection + auth-listener tracking.
 *
 * Replace this file+script tags with nothing for production. Never ship.
 * Safe by construction: every hook is wrapped so it CANNOT throw into app code.
 */
(function () {
  'use strict';
  if (window.ZO2Y_TRACE) return; // already loaded
  window.ZO2Y_TRACE = {};

  var ENABLED = true;
  var startPerf = performance.now();
  var events = [];
  var MAX_EVENTS = 2000;
  var idCounter = 0;
  var minLogLevel = 'log'; // 'log' | 'warn' | 'error' | 'off'

  function now() {
    return Math.round((performance.now() - startPerf) * 100) / 100;
  }

  function fmt(ms) {
    return (Math.round(ms * 100) / 100).toFixed(2);
  }

  function safeString(v) {
    if (v === undefined || v === null) return '';
    try {
      if (typeof v === 'object') {
        try { return JSON.stringify(v); } catch (_e) { return String(v); }
      }
      return String(v);
    } catch (_e) {
      return '?';
    }
  }

  function nextId() {
    idCounter += 1;
    var hex = ((idCounter + Math.floor(Math.random() * 1000)).toString(16)).toUpperCase();
    return hex.slice(-6);
  }

  // Unified log. Everything funnels through here.
  function log() {
    var args = Array.prototype.slice.call(arguments);
    var level = 'log';
    // allow trace.log('warn', ...) or trace.log('error', ...) first-arg overrides
    if (args.length && (args[0] === 'warn' || args[0] === 'error' || args[0] === 'info')) {
      level = String(args.shift());
    }
    if (level === 'off') return;
    if (minLogLevel === 'off') return;
    var order = { 'log': 0, 'info': 1, 'warn': 2, 'error': 3 };
    if (order[level] < order[minLogLevel]) return;

    var line = args.map(safeString).join(' ');

    events.push({ t: now(), level: level, line: line });
    if (events.length > MAX_EVENTS) events.splice(0, events.length - MAX_EVENTS);

    var prefix = '[trace]';
    if (level === 'warn') { try { console.warn(prefix, line); } catch (_e) {} }
    else if (level === 'error') { try { console.error(prefix, line); } catch (_e) {} }
    else { try { console.log(prefix, line); } catch (_e) {} }
  }

  // ---- Track an async operation with a stable ID ----
  function wrap(name, promiseFactory) {
    var id = nextId();
    var t0 = now();
    log('warn', 'op+' + id + ' start ' + name + ' @' + fmt(t0));
    var p;
    try {
      p = Promise.resolve(promiseFactory());
    } catch (e) {
      var tErr = now();
      log('error', 'op+' + id + ' SYNC-FAIL ' + name + ' @' + fmt(tErr) + ' :: ' + safeString(e && e.message));
      throw e;
    }
    return p.then(
      function (result) {
        var t1 = now();
        log('warn', 'op+' + id + ' end ' + name + ' @' + fmt(t1) + ' (' + fmt(t1 - t0) + 'ms)');
        return result;
      },
      function (err) {
        var t2 = now();
        log('error', 'op+' + id + ' FAIL ' + name + ' @' + fmt(t2) + ' (' + fmt(t2 - t0) + 'ms) :: ' + safeString(err && err.message));
        throw err;
      }
    );
  }

  // ---- Wrap a Supabase-ish {promisePromise} or a raw promise ----
  function db(tag, p) {
    var id = nextId();
    var t0 = now();
    var promise;
    if (p && typeof p.then === 'function') {
      promise = p;
    } else if (p && typeof p.then === 'function') {
      promise = p;
    } else {
      log('warn', 'db+' + id + ' ' + tag + ' @' + fmt(t0) + ' (NO PROMISE)');
      return p;
    }
    log('warn', 'db+' + id + ' SEND ' + tag + ' @' + fmt(t0));
    return Promise.resolve(promise)
      .then(function (result) {
        var t1 = now();
        var errBrief = result && result.error ? ' ERR=' + safeString(result.error.message || result.error.code || result.error) : '';
        log('warn', 'db+' + id + ' DONE ' + tag + ' @' + fmt(t1) + ' (' + fmt(t1 - t0) + 'ms)' + errBrief);
        return result;
      })
      .catch(function (e) {
        var t2 = now();
        log('error', 'db+' + id + ' FAIL ' + tag + ' @' + fmt(t2) + ' :: ' + safeString(e && e.message));
        throw e;
      });
  }

  // ---- Profile write log with stack trace ----
  function write(kind, data) {
    var id = nextId();
    var t = now();
    var stack = '';
    try { stack = new Error().stack ? String(new Error().stack) : ''; } catch (_e) {}
    var dataLine = '';
    try {
      dataLine = data ? (typeof data === 'object' ? JSON.stringify(data) : String(data)) : '';
    } catch (_e) { dataLine = '?'; }
    log('error', 'WRITE[' + kind + '] +' + id + ' @' + fmt(t) + ' :: ' + dataLine);
    if (ENABLED) {
      try { console.group && console.group('PROFILE WRITE ' + kind); } catch (_e) {}
      try { console.log(line => line); } catch (_e) {}
      try { console.trace && console.trace('stack'); } catch (_e) {}
      try { console.groupEnd && console.groupEnd(); } catch (_e) {}
    }
  }

  // ---- Render markers ----
  function render(name) {
    log('info', 'RENDER ' + name + ' @' + fmt(now()));
  }

  // ---- Duplicate-init detection ----
  function init(scope) {
    var key = '__zo2yInit_' + scope;
    var t = now();
    if (window[key]) {
      log('error', 'INIT-TWICE [' + scope + '] @' + fmt(t));
      return false;
    }
    window[key] = true;
    log('warn', 'INIT [' + scope + '] @' + fmt(t));
    return true;
  }

  // ---- Auth listener registration tracking ----
  function authListener(who) {
    log('warn', 'REGISTER-AUTH-LISTENER [' + who + '] @' + fmt(now()));
  }

  // ---- Export the timeline ----
  function snapshot() {
    return events.slice();
  }

  function dump() {
    var lines = events.map(function (e) {
      return '+' + fmt(e.t) + 'ms [' + e.level + '] ' + e.line;
    });
    var text = lines.join('\n');
    try { console.log('[trace:dump] ' + lines.length + ' events'); } catch (_e) {}
    try { console.log(text); } catch (_e) {}
    return text;
  }

  // ---- Wrap every supabase method that returns a .then query builder ----
  // Attach a `tracify` flag so app code can opt specific queries in without
  // changing call sites: trace.traceSupabase('profile', supabase) etc.
  var patchedClients = [];
  function tracePromiseChain(name, builderPromise) {
    // supabase-js builder objects are not Promises (they have .then but resolve
    // later). We cannot wrap the builder here without a setter. Instead we log
    // the construction and let app code use trace.db at the await site.
    log('warn', 'QUERY-BUILT ' + name + ' @' + fmt(now()));
    return builderPromise;
  }

  window.ZO2Y_TRACE = {
    log: log,
    wrap: wrap,
    db: db,
    write: write,
    render: render,
    init: init,
    authListener: authListener,
    snapshot: snapshot,
    dump: dump,
    _tracePromiseChain: tracePromiseChain,
    ENABLED: ENABLED
  };

  log('warn', 'TRACE-READY v=20260804flightA @' + fmt(0));
})();