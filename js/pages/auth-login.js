(function () {
  'use strict';

  var errorEl = document.getElementById('errorMessage');
  var successEl = document.getElementById('successMessage');
  var auth = window.ZO2Y_AUTH;
  if (!auth) {
    if (errorEl) {
      errorEl.textContent = 'Login is temporarily unavailable. Please refresh and try again.';
      errorEl.classList.add('show');
    }
    if (successEl) successEl.classList.remove('show');
    return;
  }

  var form = document.getElementById('authForm');
  var emailInput = document.getElementById('email');
  var passwordInput = document.getElementById('password');
  var rememberInput = document.getElementById('remember');
  var forgotPassword = document.getElementById('forgotPassword');
  var googleButton = document.getElementById('googleAuthBtn');
  var submitButton = document.getElementById('submitBtn');
  var inviteBanner = document.getElementById('authInviteBanner');
  var signupLink = document.getElementById('altSignupLink');

  if (!form || !emailInput || !passwordInput || !submitButton || !googleButton) return;

  var submitDefaultHtml = submitButton.innerHTML;
  var googleDefaultHtml = googleButton.innerHTML;
  var referralUtils = window.ZO2Y_REFERRALS || null;
  var activeReferral = referralUtils ? referralUtils.captureReferralFromLocation(window.location.search) : '';
  var redirectInFlight = false;

  function track(eventName, properties, essential) {
    try {
      if (window.ZO2Y_ANALYTICS && typeof window.ZO2Y_ANALYTICS.track === 'function') {
        window.ZO2Y_ANALYTICS.track(eventName, properties || {}, essential ? { essential: true } : {});
      }
    } catch (_err) {}
  }

  function markFirstAction(eventName, properties) {
    try {
      if (window.ZO2Y_ANALYTICS && typeof window.ZO2Y_ANALYTICS.markFirstAction === 'function') {
        window.ZO2Y_ANALYTICS.markFirstAction(eventName, properties || {}, { essential: true });
        return;
      }
    } catch (_err) {}
    track(eventName, properties, true);
  }

  function showError(message) {
    errorEl.textContent = message;
    errorEl.classList.add('show');
    successEl.classList.remove('show');
  }

  function showSuccess(message) {
    successEl.textContent = message;
    successEl.classList.add('show');
    errorEl.classList.remove('show');
  }

  function clearMessages() {
    errorEl.classList.remove('show');
    successEl.classList.remove('show');
  }

  function setSubmitLoading(loading) {
    submitButton.disabled = loading;
    submitButton.innerHTML = loading ? '<div class="loading"></div>' : submitDefaultHtml;
  }

  function setGoogleLoading(loading, label) {
    googleButton.disabled = loading;
    googleButton.innerHTML = loading ? '<div class="loading"></div> ' + label : googleDefaultHtml;
  }

  function withTimeout(promise, timeoutMs, message) {
    var timerId;
    var timeoutPromise = new Promise(function (_resolve, reject) {
      timerId = window.setTimeout(function () {
        reject(new Error(message));
      }, timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]).finally(function () {
      window.clearTimeout(timerId);
    });
  }

  function getReadableAuthError(error, fallbackMessage) {
    var message = String(error && error.message || '').toLowerCase();
    if (!message) return fallbackMessage;
    if (message.indexOf('failed to fetch') !== -1 || message.indexOf('network') !== -1) {
      return 'Auth service is temporarily unreachable. Please try again in a minute.';
    }
    if (message.indexOf('timed out') !== -1) {
      return 'Auth request timed out. Please try again.';
    }
    return String(error && error.message || fallbackMessage);
  }

  function decorateReferralLinks() {
    if (inviteBanner) {
      if (activeReferral) {
        inviteBanner.hidden = false;
        inviteBanner.innerHTML = '<i class="fas fa-user-group"></i><span>You came through @' + activeReferral + '\'s invite. Log in to keep exploring.</span>';
      } else {
        inviteBanner.hidden = true;
      }
    }

    if (signupLink && referralUtils) {
      signupLink.href = referralUtils.appendReferralToHref('sign-up.html', {
        referral: activeReferral,
        next: auth.readRequestedNextPath(window.location.search)
      });
    }

    if (!referralUtils) return;
    Array.prototype.forEach.call(document.querySelectorAll('.auth-entry-home'), function (link) {
      link.href = referralUtils.appendReferralToHref('index.html', {
        referral: activeReferral,
        next: 'index.html'
      });
    });
  }

  decorateReferralLinks();

  try {
    var rememberedEmail = window.localStorage ? window.localStorage.getItem('rememberedEmail') : '';
    if (rememberedEmail) {
      emailInput.value = rememberedEmail;
      if (rememberInput) rememberInput.checked = true;
    }
  } catch (_err) {}

  async function redirectIfAlreadyAuthenticated() {
    if (redirectInFlight) return true;
    await auth.waitForSupabase(6000);
    var client = auth.ensureClient();
    if (!client) return false;

    var session = await auth.getActiveSession(client, {
      refreshIfNeeded: true,
      restore: true
    });

    if (!session || !session.user) return false;
    redirectInFlight = true;
    showSuccess('You are already logged in. Redirecting...');
    await auth.finishAuthRedirect({
      client: client,
      session: session,
      flow: 'login',
      next: auth.readRequestedNextPath(window.location.search)
    });
    return true;
  }

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (redirectInFlight) return;

    clearMessages();

    var email = String(emailInput.value || '').trim();
    var password = String(passwordInput.value || '');
    if (!email || !password) {
      showError('Email and password are required.');
      track('login_validation_error', { reason: 'missing_credentials', path: window.location.pathname });
      return;
    }

    setSubmitLoading(true);
    try {
      await auth.waitForSupabase(6000);
      var client = auth.ensureClient();
      if (!client || !client.auth || typeof client.auth.signInWithPassword !== 'function') {
        throw new Error('Auth service is unavailable.');
      }

      var result = await withTimeout(
        client.auth.signInWithPassword({
          email: email,
          password: password
        }),
        15000,
        'Auth request timed out'
      );

      if (result && result.error) throw result.error;
      if (!result || !result.data || !result.data.session || !result.data.session.user) {
        throw new Error('Login did not return a usable session.');
      }

      if (rememberInput && rememberInput.checked) {
        try { window.localStorage.setItem('rememberedEmail', email); } catch (_errRemember) {}
      } else {
        try { window.localStorage.removeItem('rememberedEmail'); } catch (_errRemember2) {}
      }

      track('login_success', { method: 'password', path: window.location.pathname }, true);
      markFirstAction('first_login_success', { method: 'password' });
      redirectInFlight = true;
      showSuccess('Login successful. Redirecting...');

      await auth.finishAuthRedirect({
        client: client,
        session: result.data.session,
        flow: 'login',
        next: auth.readRequestedNextPath(window.location.search)
      });
    } catch (error) {
      track('login_error', {
        method: 'password',
        message: String(error && error.message || 'unknown').slice(0, 180)
      }, true);
      showError(getReadableAuthError(error, 'Login failed.'));
      setSubmitLoading(false);
    }
  });

  googleButton.addEventListener('click', async function (event) {
    event.preventDefault();
    if (redirectInFlight) return;
    clearMessages();
    setGoogleLoading(true, 'Signing in...');

    try {
      track('login_google_start', { path: window.location.pathname }, true);
      await auth.waitForSupabase(6000);
      var client = auth.ensureClient();
      if (!client) throw new Error('Google sign-in is unavailable right now.');
      await auth.startGoogleOAuth({
        client: client,
        flow: 'login',
        next: auth.readRequestedNextPath(window.location.search)
      });
    } catch (error) {
      track('login_google_error', {
        message: String(error && error.message || 'unknown').slice(0, 180)
      }, true);
      showError(getReadableAuthError(error, 'Google login failed.'));
      setGoogleLoading(false, 'Signing in...');
    }
  });

  forgotPassword.addEventListener('click', async function (event) {
    event.preventDefault();
    clearMessages();

    var email = String(emailInput.value || '').trim();
    if (!email) {
      showError('Enter your email first.');
      return;
    }

    try {
      await auth.waitForSupabase(6000);
      var client = auth.ensureClient();
      if (!client || !client.auth || typeof client.auth.resetPasswordForEmail !== 'function') {
        throw new Error('Password reset is unavailable right now.');
      }
      var result = await withTimeout(
        client.auth.resetPasswordForEmail(email, {
          redirectTo: new URL('update-password.html', window.location.origin).toString()
        }),
        15000,
        'Password reset request timed out'
      );
      if (result && result.error) throw result.error;
      track('password_reset_requested', { path: window.location.pathname }, true);
      showSuccess('Reset email sent. Check your inbox.');
    } catch (error) {
      track('password_reset_error', {
        message: String(error && error.message || 'unknown').slice(0, 180)
      }, true);
      showError(getReadableAuthError(error, 'Failed to send reset email.'));
    }
  });

  window.__ZO2Y_LOGIN_AUTH_DEBUG = function () {
    return {
      page: 'login',
      next: auth.readRequestedNextPath(window.location.search),
      auth: typeof window.__ZO2Y_AUTH_DIAGNOSTICS === 'function' ? window.__ZO2Y_AUTH_DIAGNOSTICS() : null
    };
  };

  void redirectIfAlreadyAuthenticated().catch(function () {
    return null;
  });
})();
