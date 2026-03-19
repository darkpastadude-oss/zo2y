(() => {
  const REFERRAL_STORAGE_KEY = 'zo2y_referral_v1';
  const REFERRAL_CAPTURED_AT_KEY = 'zo2y_referral_captured_at_v1';
  const REFERRAL_CONSUMED_PREFIX = 'zo2y_referral_consumed_v1_';
  const USERNAME_MAX_LENGTH = 30;

  function getStorage() {
    try {
      return window.localStorage;
    } catch (_err) {
      return null;
    }
  }

  function sanitizeUsername(raw) {
    const value = String(raw || '')
      .trim()
      .replace(/^@+/, '')
      .toLowerCase()
      .replace(/[\u0027\u2019]/g, '')
      .replace(/[^a-z0-9_]+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, USERNAME_MAX_LENGTH);
    return /^[a-z0-9_]{3,30}$/.test(value) ? value : '';
  }

  function sanitizeNextPath(raw) {
    const value = String(raw || '').trim();
    if (!value) return 'index.html';
    if (/^https?:\/\//i.test(value) || value.startsWith('//')) return 'index.html';
    if (value.startsWith('/')) return value.slice(1) || 'index.html';
    return value;
  }

  function getStoredReferral() {
    const storage = getStorage();
    if (!storage) return '';
    const value = sanitizeUsername(storage.getItem(REFERRAL_STORAGE_KEY));
    if (!value) {
      storage.removeItem(REFERRAL_STORAGE_KEY);
      storage.removeItem(REFERRAL_CAPTURED_AT_KEY);
    }
    return value;
  }

  function setStoredReferral(value) {
    const storage = getStorage();
    if (!storage) return '';
    const normalized = sanitizeUsername(value);
    if (!normalized) {
      storage.removeItem(REFERRAL_STORAGE_KEY);
      storage.removeItem(REFERRAL_CAPTURED_AT_KEY);
      return '';
    }
    storage.setItem(REFERRAL_STORAGE_KEY, normalized);
    storage.setItem(REFERRAL_CAPTURED_AT_KEY, new Date().toISOString());
    return normalized;
  }

  function captureReferralFromLocation(search = window.location.search) {
    const params = new URLSearchParams(String(search || ''));
    const direct = sanitizeUsername(params.get('ref'));
    if (direct) return setStoredReferral(direct);
    return getStoredReferral();
  }

  function getReferralConsumedKey(userId) {
    const safeId = String(userId || '').trim();
    return `${REFERRAL_CONSUMED_PREFIX}${safeId}`;
  }

  function markReferralConsumed(userId, value = '') {
    const storage = getStorage();
    if (!storage) return;
    const key = getReferralConsumedKey(userId);
    const normalized = sanitizeUsername(value) || getStoredReferral();
    if (!normalized) {
      storage.removeItem(key);
      return;
    }
    storage.setItem(key, normalized);
  }

  function getConsumedReferral(userId) {
    const storage = getStorage();
    if (!storage) return '';
    return sanitizeUsername(storage.getItem(getReferralConsumedKey(userId)));
  }

  function buildInviteUrl(username, nextPath = 'index.html') {
    const normalized = sanitizeUsername(username);
    const url = new URL('sign-up.html', window.location.origin);
    if (normalized) url.searchParams.set('ref', normalized);
    url.searchParams.set('next', sanitizeNextPath(nextPath));
    return url.toString();
  }

  function appendReferralToHref(href, options = {}) {
    const sourceHref = String(href || '').trim();
    if (!sourceHref) return sourceHref;
    const url = new URL(sourceHref, window.location.origin);
    const referral = sanitizeUsername(options.referral || getStoredReferral());
    const nextPath = options.next ? sanitizeNextPath(options.next) : '';
    if (referral) url.searchParams.set('ref', referral);
    if (nextPath) url.searchParams.set('next', nextPath);
    return `${url.pathname}${url.search}${url.hash}`;
  }

  window.ZO2Y_REFERRALS = {
    USERNAME_MAX_LENGTH,
    sanitizeUsername,
    sanitizeNextPath,
    getStoredReferral,
    setStoredReferral,
    captureReferralFromLocation,
    getReferralConsumedKey,
    getConsumedReferral,
    markReferralConsumed,
    buildInviteUrl,
    appendReferralToHref
  };
})();
