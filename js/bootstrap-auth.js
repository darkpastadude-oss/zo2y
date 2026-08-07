// Bootstrap script to restore auth session before app UI renders
(function bootstrapAuth() {
  if (typeof window !== 'undefined') {
    window.__AUTH_READY = false;
    window.__ZO2Y_AUTH_STATE = null;
  }

  async function run() {
    const trace = (label, detail) => {
      try {
        const on = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('zo2y-auth-trace') === '1') ||
          new URLSearchParams(window.location.search).get('auth_trace') === '1';
        if (!on) return;
        console.debug('[AUTH-BOOT]', Date.now(), label, detail || '');
      } catch (_e) {}
    };
    try {
      const session = typeof window.__ZO2Y_BOOTSTRAP_RESTORE_SESSION === 'function'
        ? await window.__ZO2Y_BOOTSTRAP_RESTORE_SESSION()
        : null;
      window.__ZO2Y_AUTH_STATE = session?.access_token ? true : false;
      trace('restored', 'hasToken=' + (session?.access_token ? 'YES' : 'NO'));
      if (window.__zo2yDiag) {
        window.__zo2yDiag.set('BOOT_TOKEN', session?.access_token ? 'YES' : 'NO');
        window.__zo2yDiag.ev('boot:restore', session?.access_token ? 'ok' : 'warn', 'hasToken=' + (session?.access_token ? 'YES' : 'NO') + ' uid=' + String((session?.user?.id) || '').slice(0, 8));
      }
    } catch (err) {
      window.__ZO2Y_AUTH_STATE = false;
      trace('restoreError', String((err && err.message) || err).slice(0, 80));
      if (window.__zo2yDiag) { window.__zo2yDiag.set('BOOT_TOKEN', 'NO(error)'); window.__zo2yDiag.ev('boot:restore', 'error', String((err && err.message) || err).slice(0, 80)); }
    }
    window.__AUTH_READY = true;
    trace('ready', '__AUTH_READY=true');
    if (window.__zo2yDiag) { window.__zo2yDiag.set('AUTH_READY', window.__AUTH_READY ? 'YES' : 'NO'); window.__zo2yDiag.ev('boot:ready', 'ok', '__AUTH_READY=true then dispatch'); }
    try {
      window.dispatchEvent(new Event('zo2y-auth-ready'));
    } catch (_e) {}
  }
  run();
})();
