(() => {
  const CONSENT_KEY = "zo2y_analytics_consent_v1";
  const CLIENT_ID_KEY = "zo2y_client_id_v1";
  const SESSION_ID_KEY = "zo2y_session_id_v1";
  const SESSION_STARTED_KEY = "zo2y_session_started_v1";
  const FIRST_ACTION_KEY = "zo2y_first_action_v1";
  const TRACK_URL = "/api/analytics/track";
  const ERROR_URL = "/api/analytics/error";
  const MAX_QUEUE = 40;
  const CONTACT_EMAIL = "darkpastadude@gmail.com";
  const CONTACT_SUBJECT = "Zo2y Support";

  let queue = [];
  let flushTimer = null;
  let latestLcp = null;
  let clsValue = 0;
  let hasReportedVitals = false;
  let analyticsDisabledUntil = 0;
  let analyticsConsecutiveFailures = 0;

  function nowIso() {
    return new Date().toISOString();
  }

  function randomId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function getStorage() {
    try {
      return window.localStorage;
    } catch (_err) {
      return null;
    }
  }

  function getSessionStorage() {
    try {
      return window.sessionStorage;
    } catch (_err) {
      return null;
    }
  }

  function getClientId() {
    const storage = getStorage();
    if (!storage) return "";
    let value = storage.getItem(CLIENT_ID_KEY);
    if (!value) {
      value = randomId();
      storage.setItem(CLIENT_ID_KEY, value);
    }
    return value;
  }

  function getSessionId() {
    const storage = getSessionStorage();
    if (!storage) return randomId();
    let value = storage.getItem(SESSION_ID_KEY);
    if (!value) {
      value = randomId();
      storage.setItem(SESSION_ID_KEY, value);
    }
    return value;
  }

  function getConsent() {
    const storage = getStorage();
    if (!storage) return "denied";
    const value = String(storage.getItem(CONSENT_KEY) || "").trim();
    if (value === "granted" || value === "denied") return value;
    // Check cookie consent system's analytics flag
    try {
      const raw = storage.getItem("zo2y-cookie-consent");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.analytics === true) return "granted";
        if (parsed && parsed.decidedAt) return "denied";
      }
    } catch (_e) {}
    return "";
  }

  function setConsent(value) {
    const storage = getStorage();
    if (!storage) return;
    storage.setItem(CONSENT_KEY, value === "granted" ? "granted" : "denied");
  }

  function canTrackAnalytics() {
    return getConsent() === "granted";
  }

  function normalizeProps(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    try {
      const text = JSON.stringify(value);
      if (!text) return {};
      if (text.length > 16000) return JSON.parse(text.slice(0, 16000));
      return JSON.parse(text);
    } catch (_err) {
      return {};
    }
  }

  function buildFirstActionKey(kind, identity = "") {
    const safeKind = String(kind || "").trim().toLowerCase();
    const safeIdentity = String(identity || "").trim().toLowerCase();
    if (!safeKind) return "";
    return safeIdentity ? `${safeKind}:${safeIdentity}` : safeKind;
  }

  function markFirstAction(kind, properties = {}, options = {}) {
    const storage = getStorage();
    const identity =
      String(properties?.user_id || properties?.userId || properties?.user || "").trim() ||
      getClientId();
    const key = buildFirstActionKey(kind, identity);
    if (!key) return false;

    try {
      const raw = storage?.getItem(FIRST_ACTION_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      if (parsed && parsed[key]) return false;
      parsed[key] = nowIso();
      storage?.setItem(FIRST_ACTION_KEY, JSON.stringify(parsed));
    } catch (_err) {}

    track(kind, properties, options);
    return true;
  }

  function scheduleFlush() {
    if (flushTimer) return;
    flushTimer = setTimeout(() => {
      flushTimer = null;
      void flushQueue();
    }, 2500);
  }

  function resetAnalyticsTransportState() {
    analyticsConsecutiveFailures = 0;
    analyticsDisabledUntil = 0;
  }

  function markAnalyticsTransportFailure() {
    analyticsConsecutiveFailures += 1;
    const cappedFailures = Math.min(analyticsConsecutiveFailures, 6);
    const backoffMs = Math.min(15 * 60 * 1000, 30 * 1000 * Math.pow(2, Math.max(0, cappedFailures - 1)));
    analyticsDisabledUntil = Date.now() + backoffMs;
  }

  async function sendPayload(url, payload) {
    if (Date.now() < analyticsDisabledUntil) return false;
    const body = JSON.stringify(payload);

    if (navigator.sendBeacon) {
      try {
        const blob = new Blob([body], { type: "application/json" });
        const sent = navigator.sendBeacon(url, blob);
        if (sent) {
          resetAnalyticsTransportState();
          return true;
        }
      } catch (_err) {}
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true
      });
      if (response.ok) {
        resetAnalyticsTransportState();
        return true;
      }
      markAnalyticsTransportFailure();
      return false;
    } catch (_err) {
      markAnalyticsTransportFailure();
      throw _err;
    }
  }

  async function flushQueue() {
    if (!queue.length) return;
    const items = queue.splice(0, Math.min(queue.length, MAX_QUEUE));
    try {
      for (let index = 0; index < items.length; index += 1) {
        const ok = await sendPayload(TRACK_URL, items[index]);
        if (!ok) {
          queue = [...items.slice(index), ...queue].slice(0, MAX_QUEUE);
          return;
        }
      }
    } catch (_err) {
      queue = [...items, ...queue].slice(0, MAX_QUEUE);
    }
  }

  function track(event, properties = {}, options = {}) {
    const eventName = String(event || "").trim().toLowerCase();
    if (!eventName) return;
    const essential = options && options.essential === true;
    if (!essential && !canTrackAnalytics()) return;

    const payload = {
      event: eventName,
      client_id: getClientId(),
      session_id: getSessionId(),
      properties: normalizeProps(properties),
      context: {
        page_url: window.location.href,
        path: window.location.pathname,
        referrer: document.referrer || "",
        user_agent: navigator.userAgent || "",
        viewport_w: window.innerWidth || 0,
        viewport_h: window.innerHeight || 0,
        ts: nowIso()
      }
    };

    queue.push(payload);
    if (queue.length > MAX_QUEUE) queue = queue.slice(-MAX_QUEUE);
    scheduleFlush();
  }

  function reportError(type, message, stack) {
    const payload = {
      type: String(type || "error").slice(0, 80),
      message: String(message || "").slice(0, 1000),
      stack: String(stack || "").slice(0, 2500),
      client_id: getClientId(),
      session_id: getSessionId(),
      context: {
        page_url: window.location.href,
        referrer: document.referrer || "",
        user_agent: navigator.userAgent || ""
      }
    };

    void sendPayload(ERROR_URL, payload).catch(() => {});
  }

  function setupErrorObservers() {
    window.addEventListener("error", (event) => {
      reportError("window_error", event.message, event.error?.stack || "");
    });
    window.addEventListener("unhandledrejection", (event) => {
      const reason = event.reason;
      if (reason instanceof Error) {
        reportError("unhandled_rejection", reason.message, reason.stack || "");
      } else {
        reportError("unhandled_rejection", String(reason || "unknown"), "");
      }
    });
  }

  function setupWebVitals() {
    if (!("PerformanceObserver" in window)) return;

    try {
      const poPaint = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.name === "first-contentful-paint") {
            track("web_vital_fcp", { value_ms: Math.round(entry.startTime) }, { essential: true });
          }
        });
      });
      poPaint.observe({ type: "paint", buffered: true });
    } catch (_err) {}

    try {
      const poLcp = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length) {
          latestLcp = entries[entries.length - 1];
        }
      });
      poLcp.observe({ type: "largest-contentful-paint", buffered: true });
    } catch (_err) {}

    try {
      const poCls = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value || 0;
          }
        }
      });
      poCls.observe({ type: "layout-shift", buffered: true });
    } catch (_err) {}

    const sendVitals = () => {
      if (hasReportedVitals) return;
      hasReportedVitals = true;

      const nav = performance.getEntriesByType("navigation")[0];
      if (nav) {
        track("web_vital_ttfb", { value_ms: Math.round(nav.responseStart || 0) }, { essential: true });
        track("web_vital_dom_complete", { value_ms: Math.round(nav.domComplete || 0) }, { essential: true });
      }
      if (latestLcp) {
        track("web_vital_lcp", { value_ms: Math.round(latestLcp.startTime || 0) }, { essential: true });
      }
      track("web_vital_cls", { value: Number(clsValue.toFixed(4)) }, { essential: true });
      void flushQueue();
    };

    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") sendVitals();
    });
    window.addEventListener("pagehide", sendVitals);
  }

  function removeDuplicateCards(root) {
    if (!root) return 0;
    const cards = Array.from(root.querySelectorAll('[data-media-id], [data-id]'));
    const seen = new Map();
    let removed = 0;
    cards.forEach(card => {
      const key = card.getAttribute('data-media-id') || card.getAttribute('data-id');
      if (!key) return;
      const tag = card.tagName + ':' + (card.getAttribute('data-media-type') || '');
      const mapKey = key + '|' + tag;
      if (seen.has(mapKey)) {
        card.remove();
        removed++;
      } else {
        seen.set(mapKey, card);
      }
    });
    return removed;
  }

  function setupDuplicateCardCleanup() {
    let scheduled = false;
    let debugRuns = 0;
    let lastRunAt = 0;

    const run = () => {
      scheduled = false;
      if (document.hidden) return;
      const now = Date.now();
      if (now - lastRunAt < 600) return;
      lastRunAt = now;
      const removed = removeDuplicateCards(document);
      if (removed > 0) {
        debugRuns += 1;
        if (debugRuns <= 20) {
          console.info(`[zo2y] duplicate cleanup removed ${removed} card(s)`);
        }
      }
    };

    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      if (typeof window.requestAnimationFrame === "function") {
        window.requestAnimationFrame(run);
      } else {
        setTimeout(run, 50);
      }
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", schedule, { once: true });
    } else {
      schedule();
    }
    window.addEventListener("load", schedule);

    if ("MutationObserver" in window) {
      const observer = new MutationObserver((mutations) => {
        if (document.hidden) return;
        for (const mutation of mutations) {
          if (mutation.type !== "childList") continue;
          if ((mutation.addedNodes?.length || 0) < 1) continue;
          schedule();
          break;
        }
      });
      if (document.body) {
        observer.observe(document.body, { childList: true, subtree: true });
      } else {
        document.addEventListener("DOMContentLoaded", () => {
          if (document.body) observer.observe(document.body, { childList: true, subtree: true });
        }, { once: true });
      }
      window.setTimeout(() => {
        try { observer.disconnect(); } catch (_err) {}
      }, 20000);
    }
  }

  function init() {
    setupErrorObservers();
    setupWebVitals();
    const runDeferredUiWork = () => {
      setupDuplicateCardCleanup();
    };
    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(runDeferredUiWork, { timeout: 1500 });
    } else {
      setTimeout(runDeferredUiWork, 0);
    }

    window.ZO2Y_ANALYTICS = {
      track,
      markFirstAction,
      flush: () => flushQueue(),
      getConsent,
      setConsent: (value) => setConsent(value === "granted" ? "granted" : "denied")
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

  window.addEventListener("pagehide", () => {
    void flushQueue();
  });
})();
