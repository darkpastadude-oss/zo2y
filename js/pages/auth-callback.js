(function () {
  'use strict';

  var statusText = document.getElementById('statusText');
  var errorText = document.getElementById('errorText');
  var debugConsole = document.getElementById('debugConsole');
  var auth = window.ZO2Y_AUTH;
  if (!auth) {
    document.body.classList.add('auth-callback-error');
    if (statusText) statusText.textContent = 'Auth is temporarily unavailable.';
    if (errorText) errorText.textContent = 'The sign-in runtime did not load. Refresh and try again.';
    try { console.error('ZO2Y_AUTH missing on auth callback page'); } catch (_err) {}
    return;
  }

  var referralUtils = window.ZO2Y_REFERRALS || null;
  if (referralUtils) referralUtils.captureReferralFromLocation(window.location.search);

  var params = new URLSearchParams(window.location.search || '');
  var flow = String(params.get('flow') || (window.localStorage ? window.localStorage.getItem('oauthFlow') : '') || 'login').trim().toLowerCase();
  if (flow !== 'signup') flow = 'login';
  var debugEnabled = params.get('debug') === 'true';

  if (debugEnabled && debugConsole) debugConsole.classList.add('show');

  function log(message, isError) {
    try {
      console[isError ? 'error' : 'log'](message);
    } catch (_err) {}
    if (!debugEnabled || !debugConsole) return;
    var line = document.createElement('div');
    line.className = isError ? 'debug-line debug-error' : 'debug-line';
    line.textContent = '[' + new Date().toLocaleTimeString() + '] ' + message;
    debugConsole.appendChild(line);
    debugConsole.scrollTop = debugConsole.scrollHeight;
  }

  function track(eventName, properties) {
    try {
      if (window.ZO2Y_ANALYTICS && typeof window.ZO2Y_ANALYTICS.track === 'function') {
        window.ZO2Y_ANALYTICS.track(eventName, properties || {}, { essential: true });
      }
    } catch (_err) {}
  }

  function fail(message) {
    document.body.classList.add('auth-callback-error');
    if (statusText) statusText.textContent = 'We could not finish signing you in.';
    if (errorText) errorText.textContent = message;
    track('oauth_callback_error', {
      flow: flow,
      message: String(message || 'unknown').slice(0, 180)
    });
    window.setTimeout(function () {
      window.location.replace(flow === 'signup' ? 'sign-up.html' : 'login.html');
    }, 2500);
  }

  (async function init() {
    try {
      if (statusText) statusText.textContent = flow === 'signup' ? 'Finishing your account...' : 'Finalizing secure sign-in...';
      log('Waiting for Supabase SDK...');
      await auth.waitForSupabase(8000);
      var client = auth.ensureClient();
      if (!client) {
        throw new Error('Auth library unavailable.');
      }

      log('Completing OAuth callback...');
      var session = await auth.completeOAuthCallback({
        client: client
      });

      if (!session || !session.user || !session.user.id) {
        throw new Error('Authentication was not completed. Please sign in again.');
      }

      track('oauth_callback_success', {
        flow: flow,
        next: auth.readRequestedNextPath(window.location.search)
      });

      if (statusText) statusText.textContent = 'Opening Zo2y...';
      log('OAuth callback completed for user ' + session.user.id);

      await auth.finishAuthRedirect({
        client: client,
        session: session,
        flow: flow,
        next: auth.readRequestedNextPath(window.location.search)
      });
    } catch (error) {
      log('OAuth callback failed: ' + String(error && error.message || error || 'Unknown error'), true);
      fail(String(error && error.message || 'Authentication failed.'));
    }
  })();
})();
