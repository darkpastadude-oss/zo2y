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
  var emailInput = document.getElementById('email');
  var passwordInput = document.getElementById('password');
  var consentInput = document.getElementById('signupConsent');
  var googleButton = document.getElementById('googleSignup');
  var submitButton = document.getElementById('submitBtn');
  var inviteBanner = document.getElementById('authInviteBanner');
  var loginLink = document.getElementById('altLoginLink');

  if (!form || !emailInput || !passwordInput || !submitButton || !googleButton) return;
  if (consentInput) {
    var updateSubmitEnabled = function () {
      if (!consentInput.checked) {
        submitButton.disabled = true;
        submitButton.setAttribute('aria-disabled', 'true');
        submitButton.title = 'Please agree to the Terms of Service and Privacy Policy';
      } else {
        submitButton.disabled = false;
        submitButton.removeAttribute('aria-disabled');
        submitButton.title = '';
      }
    };
    consentInput.addEventListener('change', updateSubmitEnabled);
    consentInput.addEventListener('input', updateSubmitEnabled);
    updateSubmitEnabled();
  }

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

  function showVerificationView(email) {
    var panel = document.querySelector('.auth-panel-card');
    if (!panel) return;
    var altHtml = '';
    var altLink = panel.querySelector('.alt-link');
    if (altLink) altHtml = altLink.outerHTML;
    var loginUrl = 'login.html';
    if (referralUtils) loginUrl = referralUtils.appendReferralToHref('login.html', {
      referral: activeReferral,
      next: auth.readRequestedNextPath(window.location.search)
    });
    panel.innerHTML =
      '<div class="verify-email-view">' +
        '<div class="verify-icon"><i class="fas fa-envelope-circle-check"></i></div>' +
        '<h2>Check your email</h2>' +
        '<p class="verify-text">We sent a verification link to <strong>' + escapeHtml(email) + '</strong>.</p>' +
        '<p class="verify-hint">Click the link in the email to confirm your account and get started.</p>' +
        '<div id="verifyError" class="message error"></div>' +
        '<button class="submit-btn" id="resendBtn" type="button">' +
          '<i class="fas fa-rotate"></i> <span>Resend verification</span>' +
        '</button>' +
      '</div>' +
      '<div class="alt-link">Already have an account? <a href="' + escapeHtml(loginUrl) + '">Log in</a></div>';

    document.getElementById('resendBtn').addEventListener('click', function () {
      var btn = this;
      var errEl = document.getElementById('verifyError');
      btn.disabled = true;
      btn.innerHTML = '<div class="loading"></div> Sending...';
      if (errEl) { errEl.classList.remove('show'); }
      fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email })
      }).then(function (r) { return r.json(); }).then(function (data) {
        if (data && data.success) {
          btn.innerHTML = '<i class="fas fa-check"></i> <span>Sent!</span>';
          window.setTimeout(function () {
            btn.innerHTML = '<i class="fas fa-rotate"></i> <span>Resend verification</span>';
            btn.disabled = false;
          }, 3000);
        } else {
          btn.innerHTML = '<i class="fas fa-rotate"></i> <span>Resend verification</span>';
          btn.disabled = false;
          if (errEl) { errEl.textContent = data && data.message || 'Could not resend. Try again.'; errEl.classList.add('show'); }
        }
      }).catch(function () {
        btn.innerHTML = '<i class="fas fa-rotate"></i> <span>Resend verification</span>';
        btn.disabled = false;
        if (errEl) { errEl.textContent = 'Could not resend. Try again.'; errEl.classList.add('show'); }
      });
    });
  }

  function escapeHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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

  function normalizeUsername(value) {
    return auth.normalizeUsername(String(value || '').trim());
  }

  function decorateReferralLinks() {
    if (inviteBanner) {
      if (activeReferral) {
        inviteBanner.hidden = false;
        while (inviteBanner.firstChild) inviteBanner.removeChild(inviteBanner.firstChild);
        var icon = document.createElement('i');
        icon.className = 'fas fa-user-group';
        var span = document.createElement('span');
        span.textContent = 'You are joining Zo2y through @' + activeReferral + "'s invite link.";
        inviteBanner.appendChild(icon);
        inviteBanner.appendChild(span);
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

    var email = String(emailInput.value || '').trim();
    var password = String(passwordInput.value || '');

    if (!email || !password) {
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

    if (consentInput && !consentInput.checked) {
      showError('Please agree to the Terms of Service and Privacy Policy to create your account.');
      track('signup_validation_error', { reason: 'consent_missing', path: window.location.pathname });
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
          email: email,
          password: password,
          // Record the current Terms of Service version the user just
          // accepted. Bump CONSENT_VERSION in legal-consent.js to
          // re-prompt existing users.
          tos_version: (window.ZO2Y_CONSENT && window.ZO2Y_CONSENT.TOS_VERSION) || '20260606a'
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
        if (/already registered/i.test(message) || signupPayload && signupPayload.code === 'email_already_registered') {
          showError('This email is already registered. Please log in instead.');
        } else {
          showError(message);
        }
        setSubmitLoading(false);
        return;
      }

      track('signup_success', {
        method: 'password',
        auto_login: false,
        path: window.location.pathname
      }, true);
      markFirstAction('first_signup_success', { method: 'password' });
      redirectInFlight = true;

      showVerificationView(email);
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
