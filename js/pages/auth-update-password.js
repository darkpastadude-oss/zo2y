(function () {
  'use strict';

  var errorEl = document.getElementById('errorMessage');
  var successEl = document.getElementById('successMessage');
  var helperText = document.getElementById('helperText');
  var auth = window.ZO2Y_AUTH;
  if (!auth) {
    if (errorEl) {
      errorEl.textContent = 'Password reset is temporarily unavailable. Please refresh and try again.';
      errorEl.classList.add('show');
    }
    if (successEl) successEl.classList.remove('show');
    if (helperText) helperText.textContent = 'Request a new reset link if this page does not recover after refresh.';
    return;
  }

  var form = document.getElementById('resetForm');
  var passwordInput = document.getElementById('password');
  var confirmInput = document.getElementById('confirmPassword');
  var submitButton = document.getElementById('submitBtn');

  if (!form || !passwordInput || !confirmInput || !submitButton || !errorEl || !successEl || !helperText) return;

  var submitDefaultHtml = submitButton.innerHTML;
  var recoveryClient = null;

  function track(eventName, properties) {
    try {
      if (window.ZO2Y_ANALYTICS && typeof window.ZO2Y_ANALYTICS.track === 'function') {
        window.ZO2Y_ANALYTICS.track(eventName, properties || {}, { essential: true });
      }
    } catch (_err) {}
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

  function setLoading(loading) {
    submitButton.disabled = loading;
    submitButton.innerHTML = loading ? '<div class="loading"></div>' : submitDefaultHtml;
  }

  async function init() {
    await auth.waitForSupabase(8000);
    recoveryClient = auth.createClient({
      auth: {
        detectSessionInUrl: false,
        autoRefreshToken: false
      }
    });

    var recoverySession = await auth.bootstrapRecoverySession(recoveryClient);
    if (!recoverySession || !recoverySession.user) {
      track('password_reset_invalid_link', { path: window.location.pathname });
      form.style.display = 'none';
      helperText.innerHTML = 'This password reset link is invalid or has expired. Request another one from <a href="login.html">login</a>.';
      showError('Reset link is invalid or expired.');
      return;
    }
  }

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    clearMessages();

    var password = String(passwordInput.value || '');
    var confirm = String(confirmInput.value || '');
    if (password.length < 8) {
      showError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      showError('Passwords do not match.');
      return;
    }
    if (!recoveryClient || !recoveryClient.auth || typeof recoveryClient.auth.updateUser !== 'function') {
      showError('Reset link is invalid or expired.');
      return;
    }

    setLoading(true);
    try {
      var result = await recoveryClient.auth.updateUser({ password: password });
      if (result && result.error) throw result.error;
      track('password_reset_completed', { path: window.location.pathname });
      showSuccess('Password updated. Redirecting to login...');
      await auth.signOut(recoveryClient);
      window.setTimeout(function () {
        window.location.replace('login.html');
      }, 1200);
    } catch (error) {
      track('password_reset_complete_error', {
        message: String(error && error.message || 'unknown').slice(0, 180)
      });
      showError(String(error && error.message || 'Could not update password.'));
      setLoading(false);
    }
  });

  void init().catch(function () {
    form.style.display = 'none';
    helperText.innerHTML = 'This password reset link could not be verified. Request another one from <a href="login.html">login</a>.';
    showError('Could not verify reset link.');
  });
})();
