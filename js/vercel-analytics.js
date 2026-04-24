(function () {
  'use strict';

  if (window.ZO2Y_ANALYTICS) return;

  function send(eventName, properties, options) {
    var payload = {
      event: String(eventName || '').trim().toLowerCase(),
      properties: properties || {},
      essential: !!(options && options.essential),
      context: {
        page_url: window.location.href,
        path: window.location.pathname,
        referrer: document.referrer || '',
        user_agent: navigator.userAgent || ''
      }
    };
    if (!payload.event) return;
    try {
      var body = JSON.stringify(payload);
      if (navigator.sendBeacon) {
        var blob = new Blob([body], { type: 'application/json' });
        if (navigator.sendBeacon('/api/analytics/track', blob)) return;
      }
      void fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body,
        keepalive: true
      }).catch(function () {});
    } catch (_err) {}
  }

  window.ZO2Y_ANALYTICS = {
    track: function (eventName, properties, options) {
      send(eventName, properties, options || {});
    },
    markFirstAction: function (eventName, properties, options) {
      send(eventName, properties, options || { essential: true });
    }
  };
})();
