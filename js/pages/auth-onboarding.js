(function () {
  'use strict';

  var statusEl = document.getElementById('status');
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

  if (!statusEl || !displayNameInput || !saveButton || !signOutButton) return;

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
    var email = String(user && user.email || '').trim();
    if (email && email.indexOf('@') !== -1) return email.split('@')[0];
    return '';
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
    displayNameInput.value = getFallbackName(activeUser);
    displayNameInput.focus();
    setStatus('Finish setting up your account so Zo2y can recognize you everywhere.', '');
  }

  async function completeOnboarding() {
    var displayName = String(displayNameInput.value || '').trim().slice(0, 80);
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
      var updateResult = await client.auth.updateUser({
        data: {
          full_name: displayName,
          name: displayName,
          zo2y_onboarded_at: new Date().toISOString()
        }
      });
      if (updateResult && updateResult.error) throw updateResult.error;

      auth.clearOnboardingPending(activeUser.id);
      auth.clearPendingPostAuthBootstrap();
      setStatus('All set. Redirecting...', 'success');
      auth.redirectToPostAuthTarget(nextPath());
    } catch (error) {
      setStatus(String(error && error.message || 'Could not finish onboarding.'), 'error');
      saveButton.disabled = false;
    }
  }

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
