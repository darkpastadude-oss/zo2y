(function () {
  var root = window.__ZO2Y_HELPERS = {};

  root.escapeHtml = function (value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  root.safeHttps = function (value) {
    var raw = String(value || '').trim();
    if (!raw) return '';
    return raw.replace(/^http:\/\//i, 'https://');
  };

  root.debounce = function (fn, ms) {
    var t;
    return function () {
      var ctx = this, args = arguments;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(ctx, args); }, ms);
    };
  };

  root.normalizeQuery = function (value) {
    return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
  };

  root.fetchWithTimeout = function (url, ms) {
    ms = ms || 10000;
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, ms);
    return fetch(url, { signal: ctrl.signal }).finally(function () { clearTimeout(timer); });
  };
})();
