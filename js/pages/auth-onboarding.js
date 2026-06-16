(function () {
  'use strict';

  var statusEl = document.getElementById('status');
  var usernameInput = document.getElementById('usernameInput');
  var saveButton = document.getElementById('saveBtn');
  var signOutButton = document.getElementById('signOutBtn');
  var auth = window.ZO2Y_AUTH;
  var client = null;
  var activeUser = null;

  if (!auth) {
    if (statusEl) {
      statusEl.className = 'status error';
      statusEl.textContent = 'Onboarding is temporarily unavailable. Please refresh and try again.';
    }
    return;
  }

  if (!statusEl || !usernameInput || !saveButton || !signOutButton) return;

  function setStatus(message, type) {
    statusEl.className = 'status' + (type ? ' ' + type : '');
    statusEl.textContent = message || '';
  }

  function nextPath() {
    return auth.readRequestedNextPath(window.location.search);
  }

  function getFallbackUsername(user) {
    var username = String(
      user &&
      user.user_metadata &&
      (user.user_metadata.zo2y_username || user.user_metadata.username || user.user_metadata.preferred_username) ||
      ''
    ).trim();
    if (!username) return '';
    return auth.normalizeUsername(username);
  }

  async function loadSession() {
    await auth.waitForSupabase(8000);
    client = auth.ensureClient();
    if (!client) throw new Error('Could not load auth. Refresh and try again.');

    try {
      if (sessionStorage.getItem('zo2y-intentional-logout') === 'true') {
        sessionStorage.removeItem('zo2y-intentional-logout');
        return null;
      }
    } catch (_e) {}

    var session = await auth.getActiveSession(client, {
      refreshIfNeeded: true,
      restore: true
    });
    if (!session || !session.user || !session.user.id) return null;
    return session;
  }

  async function init() {
    setStatus('Loading your account...', '');
    var session = await loadSession();
    if (!session) {
      window.location.replace('login.html?next=' + encodeURIComponent('onboarding.html'));
      return;
    }

    activeUser = session.user;
    try {
      var profileResult = await auth.ensureProfileBootstrap(client, activeUser);
      if (profileResult && profileResult.ok && !profileResult.needsOnboarding) {
        auth.clearOnboardingPending(activeUser.id);
        auth.redirectToPostAuthTarget(nextPath());
        return;
      }
    } catch (_err) {}

    usernameInput.value = getFallbackUsername(activeUser);
    usernameInput.focus();
    setStatus('', '');
  }

  async function completeOnboarding() {
    var username = auth.normalizeUsername(usernameInput.value || '');
    if (!auth.isValidUsername(username)) {
      setStatus('Choose a username with 3-30 letters, numbers, or underscores.', 'error');
      return;
    }
    if (!client || !activeUser || !activeUser.id) {
      setStatus('Your session expired. Please log in again.', 'error');
      return;
    }

    saveButton.disabled = true;
    setStatus('Saving your account...', '');

    try {
      username = await auth.ensureUsernameAvailable(client, username, activeUser.id);
      var profileRow = await auth.syncUserProfileRecord(client, activeUser, {
        username: username,
        full_name: username
      });

      var updateResult = await client.auth.updateUser({
        data: {
          username: username,
          zo2y_username: username,
          full_name: username,
          name: username
        }
      });
      if (updateResult && updateResult.error) throw updateResult.error;
      if (!profileRow || !String(profileRow.username || '').trim()) {
        throw new Error('Could not finish saving your username.');
      }

      auth.clearOnboardingPending(activeUser.id);
      auth.clearPendingPostAuthBootstrap();
      setStatus('All set. Redirecting...', 'success');
      auth.redirectToPostAuthTarget(nextPath());
    } catch (error) {
      setStatus(String(error && error.message || 'Could not finish onboarding.'), 'error');
      saveButton.disabled = false;
    }
  }

  usernameInput.addEventListener('input', function (event) {
    var value = usernameInput.value || '';
    var newValue = value.replace(/\s+/g, '');
    if (value !== newValue) {
      usernameInput.value = newValue;
    }
  });

  usernameInput.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      saveButton.click();
    }
    if (event.key === ' ') {
      event.preventDefault();
    }
  });

  saveButton.addEventListener('click', function () {
    void completeOnboarding();
  });

  function clearAuthStorage() {
    var knownKeys = [
      'zo2y-auth-v2', 'zo2y-auth-v1',
      'zo2y-auth-persist-v2', 'zo2y-auth-persist-v1',
      'zo2y-auth-durable-v2', 'zo2y-auth-durable-v1',
      'zo2y-auth-post-auth-redirect-v2', 'postAuthRedirect',
      'zo2y-auth-oauth-flow-v2', 'oauthFlow',
      'zo2y-post-auth-bootstrap-v2', 'zo2y_post_auth_bootstrap_v1'
    ];
    knownKeys.forEach(function (key) {
      try { localStorage.removeItem(key); } catch (_e) {}
      try { sessionStorage.removeItem(key); } catch (_e) {}
    });
    try {
      for (var i = localStorage.length - 1; i >= 0; i -= 1) {
        var k = localStorage.key(i);
        if (!k) continue;
        if (/^sb-[a-z0-9]+-auth-token$/i.test(k)) localStorage.removeItem(k);
      }
    } catch (_e) {}
    try {
      for (var j = sessionStorage.length - 1; j >= 0; j -= 1) {
        var k2 = sessionStorage.key(j);
        if (!k2) continue;
        if (/^sb-[a-z0-9]+-auth-token$/i.test(k2)) sessionStorage.removeItem(k2);
      }
    } catch (_e) {}

    try {
      sessionStorage.setItem('zo2y-intentional-logout', 'true');
    } catch (_e) {}
  }

  signOutButton.addEventListener('click', function () {
    clearAuthStorage();
    try { localStorage.setItem('zo2y-auth-explicit-signout-v2', String(Date.now())); } catch (_e) {}
    try { window.__ZO2Y_SUPABASE_CLIENT = null; } catch (_e) {}
    try { window.__ZO2Y_AUTH = null; } catch (_e) {}
    if (typeof window.__ZO2Y_CLEAR_PERSISTED_SESSION_SNAPSHOTS === 'function') {
      try { window.__ZO2Y_CLEAR_PERSISTED_SESSION_SNAPSHOTS(); } catch (_e) {}
    }
    try {
      for (var _i = localStorage.length - 1; _i >= 0; _i -= 1) {
        var _k = localStorage.key(_i);
        if (!_k) continue;
        if (/^sb-[a-z0-9]+-auth-token$/i.test(_k)) localStorage.removeItem(_k);
      }
    } catch (_e) {}
    window.location.replace('login.html');
  });

  void init().catch(function (error) {
    setStatus(String(error && error.message || 'Could not load onboarding.'), 'error');
  });
})();
