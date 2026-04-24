(function () {
  'use strict';

  var errorEl = document.getElementById('errorMessage');
  var successEl = document.getElementById('successMessage');
  var auth = window.ZO2Y_AUTH;
  if (!auth) {
    if (errorEl) {
      errorEl.textContent = 'Signup is temporarily unavailable. Please refresh and try again.';
      errorEl.classList.add('show');
    }
    if (successEl) successEl.classList.remove('show');
    return;
  }

  var form = document.getElementById('signupForm');
  var fullNameInput = document.getElementById('fullName');
  var emailInput = document.getElementById('email');
  var passwordInput = document.getElementById('password');
  var googleButton = document.getElementById('googleSignup');
  var submitButton = document.getElementById('submitBtn');
  var inviteBanner = document.getElementById('authInviteBanner');
  var loginLink = document.getElementById('altLoginLink');

  if (!form || !fullNameInput || !emailInput || !passwordInput || !submitButton || !googleButton) return;

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

  function showError(message, allowHtml) {
    if (allowHtml) {
      errorEl.innerHTML = message;
    } else {
      errorEl.textContent = message;
    }
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

  function decorateReferralLinks() {
    if (inviteBanner) {
      if (activeReferral) {
        inviteBanner.hidden = false;
        inviteBanner.innerHTML = '<i class="fas fa-user-group"></i><span>You are joining Zo2y through @' + activeReferral + '\'s invite link.</span>';
      } else {
        inviteBanner.hidden = true;
      }
    }

    if (loginLink && referralUtils) {
      loginLink.href = referralUtils.appendReferralToHref('login.html', {
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
    showSuccess('You already have an account. Redirecting...');
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

    var fullName = String(fullNameInput.value || '').trim();
    var email = String(emailInput.value || '').trim();
    var password = String(passwordInput.value || '');

    if (!fullName || !email || !password) {
      showError('All fields are required.');
      track('signup_validation_error', { reason: 'missing_fields', path: window.location.pathname });
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      showError('Please enter a valid email address.');
      track('signup_validation_error', { reason: 'invalid_email', path: window.location.pathname });
      return;
    }

    if (password.length < 8) {
      showError('Password must be at least 8 characters.');
      track('signup_validation_error', { reason: 'password_short', path: window.location.pathname });
      return;
    }

    setSubmitLoading(true);

    try {
      var signupResponse = await withTimeout(fetch('/api/auth/password-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fullName: fullName,
          email: email,
          password: password
        })
      }), 15000, 'Signup request timed out');

      var signupPayload = await signupResponse.json().catch(function () {
        return {};
      });

      if (!signupResponse.ok || !signupPayload || !signupPayload.success) {
        var message = String(signupPayload && signupPayload.message || 'Signup failed').trim();
        track('signup_error', {
          method: 'password',
          message: message.slice(0, 180)
        }, true);
        if (/already registered/i.test(message)) {
          showError('This email is already registered. Please log in instead.');
        } else {
          showError(message);
        }
        setSubmitLoading(false);
        return;
      }

      await auth.waitForSupabase(6000);
      var client = auth.ensureClient();
      if (!client || !client.auth || typeof client.auth.signInWithPassword !== 'function') {
        throw new Error('Auth service is unavailable.');
      }

      var signInResult = await withTimeout(
        client.auth.signInWithPassword({
          email: email,
          password: password
        }),
        15000,
        'Automatic sign-in timed out'
      );

      if (signInResult && signInResult.error) throw signInResult.error;
      if (!signInResult || !signInResult.data || !signInResult.data.session || !signInResult.data.session.user) {
        throw new Error('Account was created, but automatic sign-in failed. Please log in.');
      }

      track('signup_success', {
        method: 'password',
        auto_login: true,
        path: window.location.pathname
      }, true);
      markFirstAction('first_signup_success', { method: 'password' });
      redirectInFlight = true;
      showSuccess('Account created. Redirecting...');

      await auth.finishAuthRedirect({
        client: client,
        session: signInResult.data.session,
        flow: 'signup',
        next: auth.readRequestedNextPath(window.location.search)
      });
    } catch (error) {
      track('signup_error', {
        method: 'password',
        message: String(error && error.message || 'unknown').slice(0, 180)
      }, true);
      showError(String(error && error.message || 'An unexpected error occurred. Please try again.'));
      setSubmitLoading(false);
    }
  });

  googleButton.addEventListener('click', async function () {
    if (redirectInFlight) return;
    clearMessages();
    setGoogleLoading(true, 'Signing up...');

    try {
      track('signup_google_start', { path: window.location.pathname }, true);
      await auth.waitForSupabase(6000);
      var client = auth.ensureClient();
      if (!client) throw new Error('Google sign-up is unavailable right now.');
      await auth.startGoogleOAuth({
        client: client,
        flow: 'signup',
        next: auth.readRequestedNextPath(window.location.search)
      });
    } catch (error) {
      track('signup_google_error', {
        message: String(error && error.message || 'unknown').slice(0, 180)
      }, true);
      showError(String(error && error.message || 'Google signup failed.'));
      setGoogleLoading(false, 'Signing up...');
    }
  });

  window.__ZO2Y_SIGNUP_AUTH_DEBUG = function () {
    return {
      page: 'signup',
      next: auth.readRequestedNextPath(window.location.search),
      auth: typeof window.__ZO2Y_AUTH_DIAGNOSTICS === 'function' ? window.__ZO2Y_AUTH_DIAGNOSTICS() : null
    };
  };

  void redirectIfAlreadyAuthenticated().catch(function () {
    return null;
  });
})();
