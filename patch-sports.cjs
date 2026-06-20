const fs = require('fs');

let js = fs.readFileSync('js/pages/sports.js', 'utf8');

// Replace the top variables and ensureSupabase definition
const newAuth = `
let supabaseClient = null;
let currentUser = null;

async function ensureSupabase() {
  if (supabaseClient) return supabaseClient;
  const authRuntime = window.ZO2Y_AUTH || null;
  if (authRuntime && typeof authRuntime.waitForSupabase === 'function') {
    await authRuntime.waitForSupabase(8000);
  } else {
    const startedAt = Date.now();
    while (!(window.supabase && typeof window.supabase.createClient === 'function') && (Date.now() - startedAt) < 8000) {
      await new Promise((resolve) => setTimeout(resolve, 40));
    }
  }
  if (typeof window.__ZO2Y_ENSURE_SUPABASE_CLIENT === 'function') {
    supabaseClient = await window.__ZO2Y_ENSURE_SUPABASE_CLIENT();
    if (supabaseClient) return supabaseClient;
  }
  return window.__ZO2Y_SUPABASE_CLIENT || null;
}

async function initAuthUi() {
  try {
    const client = await ensureSupabase();
    if (client) {
      const { data } = await client.auth.getUser();
      if (data?.user) currentUser = data.user;
    }
    if (typeof window.syncAuthToHeader === 'function') {
      window.syncAuthToHeader(currentUser);
    }
  } catch (_err) {}
}
`;

// Find and replace the old ensureSupabase block
js = js.replace(/const supabaseConfig = window\.__ZO2Y_CFG_SUPABASE[\s\S]*?window\.__ZO2Y_SUPABASE_CLIENT = supabaseClient;\s*return supabaseClient;\s*}/, newAuth);

// Fix initAuth
js = js.replace(/async function initAuth\(\) {[\s\S]*?if \(typeof window\.syncAuthToHeader === 'function'\) {[\s\S]*?window\.syncAuthToHeader\(currentUser\);\s*}[\s\S]*?}/, ''); // Remove old initAuth completely if present

// Also update DOMContentLoaded to call initAuthUi
js = js.replace(
`  document.addEventListener('DOMContentLoaded', () => {
    wireEvents();
    loadLeagues();
    initAuth();
  });`,
`  document.addEventListener('DOMContentLoaded', () => {
    wireEvents();
    initAuthUi().then(() => loadLeagues());
  });`
);

fs.writeFileSync('js/pages/sports.js', js);
console.log('sports.js patched with correct auth!');
