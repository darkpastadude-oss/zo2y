(() => {
  const STORAGE_KEY = 'zo2y-cookie-consent';
  const ANALYTICS_KEY = 'zo2y-analytics-consent';
  const CONSENT_VERSION = '20260606a';
  // Exposed early so signup / login can read the current ToS version
  // before the full consent modal binds.
  if (typeof window !== 'undefined') {
    window.ZO2Y_CONSENT = Object.assign(window.ZO2Y_CONSENT || {}, {
      TOS_VERSION: CONSENT_VERSION
    });
  }

  const defaultConsent = () => ({
    version: CONSENT_VERSION,
    necessary: true,
    functional: true,
    analytics: false,
    decidedAt: null,
    method: null
  });

  function readConsent() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && parsed.version === CONSENT_VERSION) return parsed;
      return null;
    } catch (_e) {
      return null;
    }
  }

  function writeConsent(consent) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
      if (consent.analytics) {
        localStorage.setItem(ANALYTICS_KEY, '1');
      } else {
        localStorage.removeItem(ANALYTICS_KEY);
      }
    } catch (_e) {}
  }

  function clearAnalyticsStorage() {
    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('zo2y_perf_') || key === ANALYTICS_KEY) {
          localStorage.removeItem(key);
        }
      });
    } catch (_e) {}
  }

  function shouldShowBanner() {
    if (readConsent()) return false;
    if (navigator.globalPrivacyControl === true) return false;
    return true;
  }

  function buildBanner() {
    const banner = document.createElement('div');
    banner.className = 'cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-live', 'polite');
    banner.setAttribute('aria-label', 'Cookie consent');
    banner.innerHTML = `
      <div class="cookie-banner-title"><i class="fas fa-cookie-bite"></i> Cookies on Zo2y</div>
      <p>We use strictly necessary cookies to keep you signed in and secure. With your consent we also use functional and analytics cookies. We don't use advertising trackers. <a href="cookies.html">Learn more</a> · <a href="privacy.html">Privacy</a></p>
      <div class="cookie-banner-actions">
        <button type="button" class="cookie-banner-btn" data-cookie-action="reject">Reject all</button>
        <button type="button" class="cookie-banner-btn" data-cookie-action="manage">Manage</button>
        <button type="button" class="cookie-banner-btn cookie-banner-btn-primary" data-cookie-action="accept">Accept all</button>
      </div>
    `;
    return banner;
  }

  function buildPrefsModal(initialConsent) {
    const modal = document.createElement('div');
    modal.className = 'cookie-prefs is-hidden';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Cookie preferences');
    const c = initialConsent || defaultConsent();
    modal.innerHTML = `
      <div class="cookie-prefs-card">
        <h3>Cookie preferences</h3>
        <p>Choose which cookies Zo2y may set. You can change this any time from the "Cookie preferences" link in the footer.</p>

        <div class="cookie-prefs-row">
          <div>
            <div class="cookie-prefs-label">Strictly necessary</div>
            <div class="cookie-prefs-desc">Authentication, security, load balancing. Always on.</div>
          </div>
          <label class="cookie-prefs-toggle">
            <input type="checkbox" checked disabled aria-label="Strictly necessary">
            <span class="cookie-prefs-slider"></span>
          </label>
        </div>

        <div class="cookie-prefs-row">
          <div>
            <div class="cookie-prefs-label">Functional</div>
            <div class="cookie-prefs-desc">Theme, last-viewed page, list filter state, locale.</div>
          </div>
          <label class="cookie-prefs-toggle">
            <input type="checkbox" id="cookieFunctional" ${c.functional ? 'checked' : ''} aria-label="Functional">
            <span class="cookie-prefs-slider"></span>
          </label>
        </div>

        <div class="cookie-prefs-row">
          <div>
            <div class="cookie-prefs-label">Analytics</div>
            <div class="cookie-prefs-desc">First-party aggregated page metrics. No third-party trackers.</div>
          </div>
          <label class="cookie-prefs-toggle">
            <input type="checkbox" id="cookieAnalytics" ${c.analytics ? 'checked' : ''} aria-label="Analytics">
            <span class="cookie-prefs-slider"></span>
          </label>
        </div>

        <div class="cookie-prefs-actions">
          <button type="button" class="cookie-banner-btn cookie-banner-btn-primary" data-cookie-save="all">Accept all</button>
          <button type="button" class="cookie-banner-btn" data-cookie-save="necessary">Reject all</button>
          <button type="button" class="cookie-banner-btn" data-cookie-save="custom">Save my choices</button>
          <button type="button" class="cookie-banner-btn" data-cookie-save="close" style="margin-left:auto;">Close</button>
        </div>
      </div>
    `;
    return modal;
  }

  function recordDecision(consent, method) {
    const finalConsent = Object.assign({}, consent, {
      version: CONSENT_VERSION,
      necessary: true,
      decidedAt: new Date().toISOString(),
      method
    });
    writeConsent(finalConsent);
    if (!finalConsent.analytics) {
      clearAnalyticsStorage();
    }
    window.dispatchEvent(new CustomEvent('zo2y:consent-updated', { detail: finalConsent }));
    return finalConsent;
  }

  function hideBanner(banner) {
    if (banner) banner.classList.add('is-hidden');
  }

  function openPrefs() {
    const existing = document.querySelector('.cookie-prefs');
    if (existing) {
      existing.classList.remove('is-hidden');
      return existing;
    }
    const current = readConsent() || defaultConsent();
    const modal = buildPrefsModal(current);
    document.body.appendChild(modal);
    modal.classList.remove('is-hidden');
    return modal;
  }

  function closePrefs() {
    const existing = document.querySelector('.cookie-prefs');
    if (existing) existing.classList.add('is-hidden');
  }

  function initBanner() {
    if (!shouldShowBanner()) return;
    if (window.location && window.location.pathname) {
      const path = window.location.pathname.toLowerCase();
      if (path.endsWith('clear-auth.html')) return;
    }
    if (document.querySelector('.cookie-banner')) return;
    const banner = buildBanner();
    document.body.appendChild(banner);
    banner.addEventListener('click', (event) => {
      const action = event.target && event.target.getAttribute && event.target.getAttribute('data-cookie-action');
      if (!action) return;
      if (action === 'accept') {
        recordDecision({ necessary: true, functional: true, analytics: true }, 'banner-accept-all');
        hideBanner(banner);
        closePrefs();
      } else if (action === 'reject') {
        recordDecision({ necessary: true, functional: false, analytics: false }, 'banner-reject-all');
        hideBanner(banner);
        closePrefs();
      } else if (action === 'manage') {
        openPrefs();
      }
    });
  }

  function initPrefsButtons() {
    document.addEventListener('click', (event) => {
      const target = event.target.closest('[data-cookie-save]');
      if (!target) return;
      const action = target.getAttribute('data-cookie-save');
      if (action === 'all') {
        recordDecision({ necessary: true, functional: true, analytics: true }, 'prefs-accept-all');
        hideBanner(document.querySelector('.cookie-banner'));
        closePrefs();
      } else if (action === 'necessary') {
        recordDecision({ necessary: true, functional: false, analytics: false }, 'prefs-reject-all');
        hideBanner(document.querySelector('.cookie-banner'));
        closePrefs();
      } else if (action === 'custom') {
        const functional = document.getElementById('cookieFunctional');
        const analytics = document.getElementById('cookieAnalytics');
        recordDecision({
          necessary: true,
          functional: functional ? functional.checked : false,
          analytics: analytics ? analytics.checked : false
        }, 'prefs-custom');
        hideBanner(document.querySelector('.cookie-banner'));
        closePrefs();
      } else if (action === 'close') {
        closePrefs();
      }
    });

    document.addEventListener('click', (event) => {
      const trigger = event.target.closest('[data-open-cookie-prefs]');
      if (!trigger) return;
      event.preventDefault();
      openPrefs();
    });

    document.addEventListener('click', (event) => {
      const modal = document.querySelector('.cookie-prefs');
      if (!modal) return;
      if (event.target === modal) closePrefs();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closePrefs();
    });
  }

  function init() {
    initBanner();
    initPrefsButtons();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.ZO2Y_LEGAL_CONSENT = {
    openPrefs,
    closePrefs,
    readConsent,
    writeConsent,
    recordDecision,
    shouldShowBanner
  };
})();
