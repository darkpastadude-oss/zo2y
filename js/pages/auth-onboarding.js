(function () {
  'use strict';

  var statusEl = document.getElementById('status');
  var usernameInput = document.getElementById('usernameInput');
  var displayNameInput = document.getElementById('displayNameInput');
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

  if (!statusEl || !usernameInput || !displayNameInput || !saveButton || !signOutButton) return;

  function setStatus(message, type) {
    statusEl.className = 'status' + (type ? ' ' + type : '');
    statusEl.textContent = message || '';
  }

  function nextPath() {
    return auth.readRequestedNextPath(window.location.search);
  }

  function getFallbackName(user) {
    var fullName = String(user && user.user_metadata && (user.user_metadata.full_name || user.user_metadata.name) || '').trim();
    if (fullName) return fullName;
    return '';
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
    // If user already completed onboarding on a previous session, skip onboarding.
    // This guards against onboarding re-triggering on page refresh or direct navigation.
    try {
      if (session && session.user && session.user.user_metadata) {
        var meta = session.user.user_metadata;
        if (meta.onboarding_completed_at) {
          // Already onboarded, proceed to post-auth target
          var target = nextPath();
          auth.redirectToPostAuthTarget(target);
          return;
        }
      }
    } catch (_err) {
      // If anything goes wrong, continue with normal onboarding flow
    }
    if (!session) {
      window.location.replace('login.html?next=' + encodeURIComponent('onboarding.html'));
      return;
    }

    activeUser = session.user;
    usernameInput.value = getFallbackUsername(activeUser);
    displayNameInput.value = getFallbackName(activeUser);
    if (usernameInput.value) {
      displayNameInput.focus();
    } else {
      usernameInput.focus();
    }
    setStatus('Finish setting up your account so Zo2y can recognize you everywhere.', '');
  }

  async function completeOnboarding() {
    var username = auth.normalizeUsername(usernameInput.value || '');
    var displayName = String(displayNameInput.value || '').trim().slice(0, 80);
    if (!auth.isValidUsername(username)) {
      setStatus('Choose a username with 3-30 letters, numbers, or underscores.', 'error');
      return;
    }
    if (displayName.length < 2) {
      setStatus('Enter the name you want shown across your account.', 'error');
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
      var completedAt = new Date().toISOString();
      var profileRow = await auth.syncUserProfileRecord(client, activeUser, {
        username: username,
        full_name: displayName,
        onboarding_completed_at: completedAt
      });

      var updateResult = await client.auth.updateUser({
        data: {
          username: username,
          zo2y_username: username,
          full_name: displayName,
          name: displayName,
          onboarding_completed_at: completedAt,
          zo2y_onboarded_at: completedAt
        }
      });
      if (updateResult && updateResult.error) throw updateResult.error;
      if (!profileRow || !String(profileRow.username || '').trim()) {
        throw new Error('Could not finish saving your username.');
      }

      auth.clearOnboardingPending(activeUser.id);
      auth.clearPendingPostAuthBootstrap();
      setStatus('All set. Redirecting...', 'success');
      // Persist an onboarding flag so we don't show onboarding again for this user/session
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem('onboarded', 'true');
        }
      } catch (_e) {}
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

  displayNameInput.addEventListener('keydown', function (event) {
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
