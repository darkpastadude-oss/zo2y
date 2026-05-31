(function () {
  'use strict';

  const root = window.__ZO2Y_HELPERS = {};

  root.escapeHtml = function (value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  root.safeHttps = function (value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    return raw.replace(/^http:\/\//i, 'https://');
  };

  root.debounce = function (fn, ms) {
    let t;
    return function () {
      const ctx = this;
      const args = arguments;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(ctx, args); }, ms);
    };
  };

  root.throttle = function (fn, ms) {
    let lastCall = 0;
    return function () {
      const now = Date.now();
      if (now - lastCall >= ms) {
        lastCall = now;
        fn.apply(this, arguments);
      }
    };
  };

  root.normalizeQuery = function (value) {
    return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
  };

  root.fetchWithTimeout = function (url, ms) {
    ms = ms || 10000;
    const ctrl = new AbortController();
    const timer = setTimeout(function () { ctrl.abort(); }, ms);
    return fetch(url, { signal: ctrl.signal }).finally(function () { clearTimeout(timer); });
  };

  root.toHttpsUrl = function (value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    if (raw.startsWith('//')) return 'https:' + raw;
    return raw.replace(/^http:\/\//i, 'https://');
  };

  root.getLocalStorage = function (key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  };

  root.setLocalStorage = function (key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) { /* localStorage access may fail in private mode */ }

  root.removeLocalStorage = function (key) {
    try { localStorage.removeItem(key); } catch (e) { /* localStorage access may fail in private mode */ }
  };

  root.isMobile = function () {
    return typeof window !== 'undefined' && window.innerWidth < 768;
  };

  root.isCompact = function () {
    return typeof window !== 'undefined' && window.innerWidth < 1024;
  };

  root.clamp = function (value, min, max) {
    return Math.max(min, Math.min(max, value));
  };

  root.randomInt = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  root.getUniqueId = function (prefix) {
    return (prefix || 'id') + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
  };

  root.logError = function (context, err) {
    try {
      var message = '[zo2y] ' + context + ': ' + (err && err.message ? err.message : String(err || 'unknown'));
      console.error(message);
      if (err && err.stack) {
        console.error('[zo2y] stack:', err.stack);
      }
    } catch (_) { /* logError must never throw */ }
  };

  var _focusTrapKey = null;

  root.trapFocus = function (modalEl) {
    if (!modalEl || typeof modalEl.addEventListener !== 'function') return;
    root.releaseFocusTrap();
    var focusable = modalEl.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    var handler = function (e) {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handler);
    _focusTrapKey = handler;
    if (document.activeElement && modalEl.contains(document.activeElement)) return;
    if (typeof first.focus === 'function') first.focus();
  };

  root.releaseFocusTrap = function () {
    if (_focusTrapKey) {
      document.removeEventListener('keydown', _focusTrapKey);
      _focusTrapKey = null;
    }
  };
})();
