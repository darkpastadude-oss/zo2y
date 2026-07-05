const fs = require('fs');

let js = fs.readFileSync('js/pages/books.js', 'utf8');

// Insert auth variables at top
js = `
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
` + js;

// Update initMenuBridge to use new auth
js = js.replace(
`      ensureClient: async function () {
        if (typeof window.ensureHomeSupabase === 'function') {
          return await window.ensureHomeSupabase();
        }
        return window.__ZO2Y_SUPABASE_CLIENT || null;
      },
      getCurrentUser: function () { return window.homeCurrentUser || null; },`,
`      ensureClient: async function () { return await ensureSupabase(); },
      getCurrentUser: function () { return currentUser || null; },`
);

// Call initAuthUi on DOMContentLoaded
js = js.replace(
`  wireEvents();
  initMenuBridge();
  loadBooks();
});`,
`  wireEvents();
  initMenuBridge();
  initAuthUi().then(() => loadBooks());
});`
);

fs.writeFileSync('js/pages/books.js', js);
console.log('books.js updated with auth support');
