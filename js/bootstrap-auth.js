// Bootstrap script to restore auth session before app UI renders
(function bootstrapAuth() {
  // Initialize boot state
  if (typeof window !== 'undefined') {
    window.__AUTH_READY = false;
    window.__ZO2Y_AUTH_STATE = null; // null = loading, true = authenticated, false = not authenticated
  }

  var overlay = document.getElementById('authBootstrapOverlay');
  function revealAppRoot() {
    try {
      var appRoot = document.getElementById('appRoot');
      if (appRoot) appRoot.style.display = '';
    } catch (_err) {}
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('zo2y-auth-ready', function () {
      revealAppRoot();
    });
  }

  async function run() {
    if (typeof window.__ZO2Y_BOOTSTRAP_RESTORE_SESSION === 'function') {
      try {
        var session = await window.__ZO2Y_BOOTSTRAP_RESTORE_SESSION();
        if (session && session.access_token) {
          window.__ZO2Y_AUTH_STATE = true;
        } else {
          window.__ZO2Y_AUTH_STATE = false;
        }
      } catch (_err) {
        window.__ZO2Y_AUTH_STATE = false;
      }
    } else {
      window.__ZO2Y_AUTH_STATE = null;
    }
    window.__AUTH_READY = true;
    revealAppRoot();
    try {
      if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    } catch (_e) {}
    try {
      var evt = new Event('zo2y-auth-ready');
      window.dispatchEvent(evt);
    } catch (_e2) {}
  }
  run();
})();
