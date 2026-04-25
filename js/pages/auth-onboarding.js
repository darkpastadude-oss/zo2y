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
    setStatus('Choose the username Zo2y should use everywhere.', '');
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

  usernameInput.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      void completeOnboarding();
    }
  });

  saveButton.addEventListener('click', function () {
    void completeOnboarding();
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
