(function () {
  'use strict';

  var auth = window.ZO2Y_AUTH;
  if (!auth) return;

  var RESERVED = new Set([
    'admin', 'api', 'app', 'auth', 'authcallback', 'blog', 'book', 'books', 'country', 'edit', 'explore',
    'game', 'games', 'help', 'home', 'index', 'login', 'movie', 'movies', 'music', 'new', 'privacy',
    'profile', 'resetpassword', 'reviews', 'search', 'settings', 'signup', 'support', 'terms', 'travel',
    'tv', 'tvshow', 'tvshows', 'updatepassword', 'user', 'users', 'zo2y'
  ]);

  var usernameInput = document.getElementById('usernameInput');
  var saveButton = document.getElementById('saveBtn');
  var statusEl = document.getElementById('status');
  var signOutButton = document.getElementById('signOutBtn');

  if (!usernameInput || !saveButton || !statusEl || !signOutButton) return;

  function setStatus(message, type) {
    statusEl.className = 'status' + (type ? ' ' + type : '');
    statusEl.textContent = message || '';
  }

  function nextPath() {
    return auth.readRequestedNextPath(window.location.search);
  }

  function normalizeUsername(value) {
    var normalized = auth.normalizeUsername(value);
    if (!normalized) return '';
    return normalized;
  }

  function isReservedUsername(value) {
    return RESERVED.has(String(value || '').replace(/_/g, ''));
  }

  async function getAuthenticatedUser(client) {
    var session = await auth.getActiveSession(client, {
      refreshIfNeeded: true,
      restore: true
    });
    return session && session.user ? session.user : null;
  }

  async function redirectIfAlreadyComplete(client, user, profileResult) {
    var result = profileResult;
    if (!result) result = await auth.ensureProfileBootstrap(client, user);
    if (result && result.ok && !result.needsUsername) {
      auth.clearOnboardingPending(user.id);
      auth.clearPendingPostAuthBootstrap();
      auth.redirectToPostAuthTarget(nextPath());
      return true;
    }
    return false;
  }

  async function init() {
    setStatus('loading...', '');
    await auth.waitForSupabase(8000);
    var client = auth.ensureClient();
    if (!client) {
      setStatus('Could not load auth. Refresh and try again.', 'error');
      return;
    }

    var user = await getAuthenticatedUser(client);
    if (!user || !user.id) {
      window.location.replace('login.html?next=' + encodeURIComponent('onboarding.html'));
      return;
    }

    var profileResult = await auth.ensureProfileBootstrap(client, user);
    window.__ZO2Y_ONBOARDING_DEBUG = {
      userId: user.id,
      next: nextPath(),
      profile: profileResult
    };

    if (await redirectIfAlreadyComplete(client, user, profileResult)) {
      return;
    }

    if (profileResult && profileResult.profile && profileResult.profile.username && !String(profileResult.profile.username).toLowerCase().startsWith('user_')) {
      usernameInput.value = String(profileResult.profile.username);
    }

    setStatus('', '');
    usernameInput.focus();

    saveButton.addEventListener('click', async function () {
      var normalized = normalizeUsername(usernameInput.value);
      if (!normalized) {
        setStatus('Enter a username.', 'error');
        return;
      }
      if (!auth.isValidUsername(normalized)) {
        setStatus('Use 3-30 chars: letters, numbers, underscore.', 'error');
        return;
      }
      if (isReservedUsername(normalized)) {
        setStatus('That username is reserved.', 'error');
        return;
      }

      saveButton.disabled = true;
      try {
        setStatus('Checking username...', '');
        var availableUsername = await auth.ensureUsernameAvailable(client, normalized, user.id);
        setStatus('Saving...', '');
        var updateResult = await client
          .from('user_profiles')
          .update({ username: availableUsername })
          .eq('id', user.id)
          .select('id, username')
          .maybeSingle();

        if (updateResult && updateResult.error) throw updateResult.error;

        auth.clearOnboardingPending(user.id);
        auth.clearPendingPostAuthBootstrap();
        await auth.updateAuthMetadataUsername(client, availableUsername);
        setStatus('Saved. Redirecting...', 'success');
        auth.redirectToPostAuthTarget(nextPath());
      } catch (error) {
        setStatus(String(error && error.message || 'Could not save username.'), 'error');
      } finally {
        saveButton.disabled = false;
      }
    });
  }

  usernameInput.addEventListener('keydown', function (event) {
    if (event.key === ' ') {
      event.preventDefault();
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      saveButton.click();
    }
  });

  usernameInput.addEventListener('input', function () {
    var before = String(usernameInput.value || '');
    var after = normalizeUsername(before);
    if (after !== before) usernameInput.value = after;
    if (!after) {
      setStatus('', '');
      return;
    }
    if (!auth.isValidUsername(after)) {
      setStatus('Letters, numbers, underscore only.', 'error');
      return;
    }
    if (isReservedUsername(after)) {
      setStatus('That username is reserved.', 'error');
      return;
    }
    setStatus('', '');
  });

  signOutButton.addEventListener('click', async function () {
    try {
      await auth.waitForSupabase(3000);
      await auth.signOut(auth.ensureClient());
    } catch (_err) {}
    window.location.replace('login.html');
  });

  void init().catch(function (error) {
    setStatus(String(error && error.message || 'Could not load onboarding.'), 'error');
  });
})();
