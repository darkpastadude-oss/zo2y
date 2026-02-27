(() => {
  const CONSENT_KEY = "zo2y_analytics_consent_v1";
  const CLIENT_ID_KEY = "zo2y_client_id_v1";
  const SESSION_ID_KEY = "zo2y_session_id_v1";
  const SESSION_STARTED_KEY = "zo2y_session_started_v1";
  const TRACK_URL = "/api/analytics/track";
  const ERROR_URL = "/api/analytics/error";
  const MAX_QUEUE = 40;
  const CONTACT_EMAIL = "zo2yhq@gmail.com";
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

  function renderConsentBanner() {
    if (getConsent()) return;
    const banner = document.createElement("aside");
    banner.setAttribute("aria-label", "Analytics consent");
    banner.style.position = "fixed";
    banner.style.left = "16px";
    banner.style.right = "16px";
    banner.style.bottom = "16px";
    banner.style.zIndex = "99999";
    banner.style.background = "rgba(11,22,51,0.95)";
    banner.style.border = "1px solid rgba(255,255,255,0.18)";
    banner.style.borderRadius = "12px";
    banner.style.padding = "12px";
    banner.style.color = "#fff";
    banner.style.backdropFilter = "blur(6px)";
    banner.innerHTML = `
      <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;justify-content:space-between;">
        <div style="font-size:13px;line-height:1.4;max-width:860px;">
          We use anonymous analytics to improve feed quality and reliability.
          See <a href="privacy.html" style="color:#f59e0b;">Privacy</a>.
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button type="button" data-consent="deny" style="background:#132347;color:#fff;border:1px solid rgba(255,255,255,0.2);padding:8px 10px;border-radius:8px;cursor:pointer;">Decline</button>
          <button type="button" data-consent="allow" style="background:#f59e0b;color:#0b1633;border:none;padding:8px 12px;border-radius:8px;font-weight:700;cursor:pointer;">Allow analytics</button>
        </div>
      </div>
    `;
    document.body.appendChild(banner);

    banner.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const action = target.getAttribute("data-consent");
      if (!action) return;
      if (action === "allow") {
        setConsent("granted");
        track("consent_granted", { source: "banner" }, { essential: true });
      } else {
        setConsent("denied");
      }
      banner.remove();
    });
  }

  function setupFunnelTracking() {
    const sessionStorage = getSessionStorage();
    if (sessionStorage && !sessionStorage.getItem(SESSION_STARTED_KEY)) {
      sessionStorage.setItem(SESSION_STARTED_KEY, "1");
      track("session_start", { path: window.location.pathname }, { essential: true });
    }

    track("page_view", { path: window.location.pathname, title: document.title || "" }, { essential: true });

    document.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const tracked = target.closest("[data-track]");
      if (!(tracked instanceof HTMLElement)) return;
      const eventName = tracked.getAttribute("data-track");
      if (!eventName) return;
      const value = tracked.getAttribute("data-track-value") || tracked.textContent || "";
      track(eventName, { value: String(value).trim().slice(0, 120) });
    });

    const signUpForm =
      document.getElementById("signupForm") ||
      document.getElementById("signUpForm") ||
      document.querySelector("form[data-form='signup']");
    if (signUpForm) {
      signUpForm.addEventListener("submit", () => {
        track("signup_submit", { path: window.location.pathname });
      });
    }

    const loginForm =
      document.getElementById("loginForm") ||
      document.querySelector("form[data-form='login']");
    if (loginForm) {
      loginForm.addEventListener("submit", () => {
        track("login_submit", { path: window.location.pathname });
      });
    }
  }

  function ensureGlobalLegalFooterStyles() {
    if (document.getElementById("zo2yGlobalLegalFooterStyle")) return;
    const style = document.createElement("style");
    style.id = "zo2yGlobalLegalFooterStyle";
    style.textContent = `
      .legal-strip.global-legal-footer {
        width: min(1240px, calc(100% - 28px));
        margin: 14px auto 26px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 14px;
        color: #8ca3c7;
        font-size: 12px;
        flex-wrap: wrap;
      }
      .legal-strip.global-legal-footer a {
        color: #f59e0b;
        text-decoration: none;
        font-weight: 600;
      }
      .legal-strip.global-legal-footer .legal-sep {
        color: rgba(255,255,255,0.28);
      }
      @media (max-width: 760px) {
        .legal-strip.global-legal-footer {
          width: calc(100% - 18px);
          margin: 12px auto 96px;
          gap: 12px;
          font-size: 12px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function buildMailtoContactHref() {
    return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(CONTACT_SUBJECT)}`;
  }

  function buildGmailComposeHref() {
    const params = new URLSearchParams({
      view: "cm",
      fs: "1",
      to: CONTACT_EMAIL,
      su: CONTACT_SUBJECT
    });
    return `https://mail.google.com/mail/?${params.toString()}`;
  }

  function isContactLikeLink(link) {
    if (!(link instanceof HTMLAnchorElement)) return false;
    const href = String(link.getAttribute("href") || "").trim();
    const text = String(link.textContent || "").trim().toLowerCase();
    if (/(^|\/)support\.html(\?|#|$)/i.test(href)) return true;
    if (/^mailto:/i.test(href) && /(zo2hyq|zo2yhq)@gmail\.com/i.test(href)) return true;
    if (text === "support" || text === "contact") return true;
    return false;
  }

  function rewriteSupportLinksToEmail() {
    const links = Array.from(document.querySelectorAll("a[href]"));
    const mailtoHref = buildMailtoContactHref();
    links.forEach((link) => {
      if (!(link instanceof HTMLAnchorElement)) return;
      if (!isContactLikeLink(link)) return;
      link.setAttribute("href", mailtoHref);
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener");
      link.setAttribute("data-contact-link", "1");
      if (String(link.textContent || "").trim().toLowerCase() === "support") {
        link.textContent = "Contact";
      }
    });
  }

  function setupContactLinkPopup() {
    if (window.__ZO2Y_CONTACT_POPUP_WIRED__) return;
    window.__ZO2Y_CONTACT_POPUP_WIRED__ = true;

    document.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest("a[data-contact-link='1']");
      if (!(link instanceof HTMLAnchorElement)) return;

      event.preventDefault();
      const shouldOpenGmail = window.confirm(`Contact us at ${CONTACT_EMAIL}.\nOpen Gmail compose now?`);
      if (!shouldOpenGmail) return;

      const gmailHref = buildGmailComposeHref();
      const popup = window.open(gmailHref, "_blank", "noopener,noreferrer");
      if (!popup) {
        window.location.href = buildMailtoContactHref();
      }
    });
  }

  function mountGlobalLegalFooter() {
    rewriteSupportLinksToEmail();
    setupContactLinkPopup();
    const existing = document.querySelector(".legal-strip");
    if (existing) return;
    const body = document.body;
    if (!body || document.querySelector("[data-global-legal-footer='1']")) return;
    ensureGlobalLegalFooterStyles();
    const footer = document.createElement("div");
    footer.className = "legal-strip global-legal-footer";
    footer.setAttribute("data-global-legal-footer", "1");
    footer.innerHTML = `
      <a href="privacy.html">Privacy</a>
      <span class="legal-sep">|</span>
      <a href="terms.html">Terms</a>
      <span class="legal-sep">|</span>
      <a href="${buildMailtoContactHref()}" data-contact-link="1" target="_blank" rel="noopener">Contact</a>
    `;
    body.appendChild(footer);
  }

  function normalizeDedupeText(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  }

  function normalizeDedupeHref(rawHref) {
    const href = String(rawHref || "").trim();
    if (!href || href === "#") return "";
    try {
      const url = new URL(href, window.location.origin);
      const base = `${url.origin}${url.pathname}`;
      const params = new URLSearchParams(url.search || "");
      const stableKeys = ["id", "track", "track_id", "album", "album_id", "movie", "tv", "game", "book", "q", "source"];
      const stablePairs = [];
      stableKeys.forEach((key) => {
        const value = params.get(key);
        if (value) stablePairs.push(`${key}=${value}`);
      });
      return stablePairs.length ? `${base}?${stablePairs.join("&")}` : base;
    } catch (_err) {
      return href;
    }
  }

  function isDuplicateCardExcluded(node) {
    if (!(node instanceof HTMLElement)) return true;
    return !!node.closest(
      [
        "[data-dedupe-exempt='1']",
        ".modal",
        ".menu-modal",
        ".rail-menu",
        ".list-menu",
        ".home-onboarding-card",
        ".mini-card",
        "#homeOnboardingOverlay",
        "#itemMenuModal",
        "#createListModal",
        "#homeListsModal"
      ].join(",")
    );
  }

  function buildDuplicateCardKey(card) {
    if (!(card instanceof HTMLElement)) return "";

    const media = normalizeDedupeText(
      card.getAttribute("data-media-type") ||
      card.getAttribute("data-kind") ||
      card.getAttribute("data-type") ||
      ""
    );

    const idCandidates = [
      card.getAttribute("data-item-id"),
      card.getAttribute("data-id"),
      card.getAttribute("data-track-id"),
      card.getAttribute("data-album-id"),
      card.getAttribute("data-movie-id"),
      card.getAttribute("data-tv-id"),
      card.getAttribute("data-game-id"),
      card.getAttribute("data-book-id")
    ]
      .map((value) => String(value || "").trim())
      .filter(Boolean);

    if (idCandidates.length) {
      return `id:${media}:${idCandidates[0].toLowerCase()}`;
    }

    const href =
      card.getAttribute("data-href") ||
      card.querySelector("a[href]")?.getAttribute("href") ||
      "";
    const normalizedHref = normalizeDedupeHref(href);
    if (normalizedHref) {
      return `href:${media}:${normalizedHref.toLowerCase()}`;
    }

    const title = normalizeDedupeText(
      card.getAttribute("data-title") ||
      card.querySelector(".card-title")?.textContent ||
      card.querySelector(".card-name")?.textContent ||
      card.querySelector("h2, h3, h4")?.textContent ||
      ""
    );
    const subtitle = normalizeDedupeText(
      card.getAttribute("data-subtitle") ||
      card.querySelector(".card-sub")?.textContent ||
      card.querySelector(".subtitle")?.textContent ||
      ""
    );

    if (!title) return "";
    return `text:${media}:${title}::${subtitle}`;
  }

  function removeDuplicateCards(scope = document) {
    if (!(scope instanceof Document || scope instanceof HTMLElement)) return 0;
    const selector = [
      ".grid .card",
      ".rail .card",
      ".cards .card",
      ".results .card",
      "article.card[data-item-id]",
      "article.card[data-id]"
    ].join(",");
    const cards = Array.from(scope.querySelectorAll(selector));
    const seen = new Set();
    let removed = 0;

    cards.forEach((card) => {
      if (!(card instanceof HTMLElement)) return;
      if (isDuplicateCardExcluded(card)) return;
      const key = buildDuplicateCardKey(card);
      if (!key) return;
      if (seen.has(key)) {
        card.remove();
        removed += 1;
        return;
      }
      seen.add(key);
    });

    return removed;
  }

  function setupDuplicateCardCleanup() {
    let scheduled = false;
    let debugRuns = 0;

    const run = () => {
      scheduled = false;
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
    }
  }

  function init() {
    setupErrorObservers();
    setupWebVitals();
    setupFunnelTracking();
    renderConsentBanner();
    mountGlobalLegalFooter();
    setupDuplicateCardCleanup();

    window.ZO2Y_ANALYTICS = {
      track,
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
