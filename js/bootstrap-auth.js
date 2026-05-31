// Bootstrap script to restore auth session before app UI renders
(function bootstrapAuth() {
  if (typeof window !== 'undefined') {
    window.__AUTH_READY = false;
    window.__ZO2Y_AUTH_STATE = null;
  }

  async function run() {
    try {
      const session = typeof window.__ZO2Y_BOOTSTRAP_RESTORE_SESSION === 'function'
        ? await window.__ZO2Y_BOOTSTRAP_RESTORE_SESSION()
        : null;
      window.__ZO2Y_AUTH_STATE = session?.access_token ? true : false;
    } catch (_err) {
      window.__ZO2Y_AUTH_STATE = false;
    }
    window.__AUTH_READY = true;
    try {
      window.dispatchEvent(new Event('zo2y-auth-ready'));
    } catch (_e) {
      if (window.__ZO2Y_HELPERS) window.__ZO2Y_HELPERS.logError('bootstrap-auth: dispatchEvent failed', _e);
    }
  }
  run();
})();
