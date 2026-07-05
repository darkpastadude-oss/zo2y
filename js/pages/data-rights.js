(() => {
  const TABLES_TO_EXPORT = [
    { table: 'user_profiles', label: 'Profile' },
    { table: 'movie_list_items', label: 'Movie list items' },
    { table: 'tv_list_items', label: 'TV list items' },
    { table: 'anime_list_items', label: 'Anime list items' },
    { table: 'game_list_items', label: 'Game list items' },
    { table: 'book_list_items', label: 'Book list items' },
    { table: 'artist_list_items', label: 'Artist list items' },
    { table: 'sports_list_items', label: 'Sports list items' },
    { table: 'travel_list_items', label: 'Travel list items' },
    { table: 'fashion_list_items', label: 'Fashion list items' },
    { table: 'food_list_items', label: 'Food list items' },
    { table: 'car_list_items', label: 'Car list items' },
    { table: 'custom_lists', label: 'Custom lists' },
    { table: 'custom_list_items', label: 'Custom list items' },
    { table: 'movie_reviews', label: 'Movie reviews' },
    { table: 'tv_reviews', label: 'TV reviews' },
    { table: 'anime_reviews', label: 'Anime reviews' },
    { table: 'game_reviews', label: 'Game reviews' },
    { table: 'book_reviews', label: 'Book reviews' },
    { table: 'music_reviews', label: 'Music reviews' },
    { table: 'sports_reviews', label: 'Sports reviews' },
    { table: 'travel_reviews', label: 'Travel reviews' },
    { table: 'fashion_reviews', label: 'Fashion reviews' },
    { table: 'food_reviews', label: 'Food reviews' },
    { table: 'car_reviews', label: 'Car reviews' },
    { table: 'travel_plans', label: 'Travel plans' }
  ];

  async function ensureSupabase() {
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
      return await window.__ZO2Y_ENSURE_SUPABASE_CLIENT();
    }
    if (window.supabase && typeof window.supabase.createClient === 'function' && window.__ZO2Y_SUPABASE_CONFIG) {
      return window.supabase.createClient(
        window.__ZO2Y_SUPABASE_CONFIG.url,
        window.__ZO2Y_SUPABASE_CONFIG.key,
        { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } }
      );
    }
    return null;
  }

  function formatDate(input) {
    if (!input) return '—';
    const d = new Date(input);
    if (!Number.isFinite(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function setStatus(el, message, kind) {
    if (!el) return;
    el.textContent = message || '';
    el.style.color = kind === 'error' ? '#fca5a5' : kind === 'success' ? '#86efac' : '';
  }

  function showSignedOut() {
    const out = document.getElementById('signedOut');
    const inn = document.getElementById('signedIn');
    if (out) out.hidden = false;
    if (inn) inn.hidden = true;
  }

  function showSignedIn(user) {
    const out = document.getElementById('signedOut');
    const inn = document.getElementById('signedIn');
    if (out) out.hidden = true;
    if (inn) inn.hidden = false;
    const emailEl = document.getElementById('userEmail');
    if (emailEl) emailEl.textContent = user.email || '(no email)';
    const idEl = document.getElementById('userId');
    if (idEl) idEl.textContent = user.id;
    const createdEl = document.getElementById('userCreated');
    if (createdEl) createdEl.textContent = formatDate(user.created_at);
  }

  async function loadStats(supabase, userId) {
    try {
      const [listsRes, reviewsRes, plansRes] = await Promise.all([
        supabase.from('custom_lists').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('travel_reviews').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('travel_plans').select('id', { count: 'exact', head: true }).eq('user_id', userId)
      ]);
      const listsEl = document.getElementById('statLists');
      const reviewsEl = document.getElementById('statReviews');
      const plansEl = document.getElementById('statPlans');
      if (listsEl) listsEl.textContent = String(listsRes.count || 0);
      if (reviewsEl) reviewsEl.textContent = String(reviewsRes.count || 0);
      if (plansEl) plansEl.textContent = String(plansRes.count || 0);
    } catch (_e) {}
  }

  async function exportData(supabase, userId, user) {
    const archive = {
      exportedAt: new Date().toISOString(),
      exporter: 'Zo2y Data Rights Dashboard v' + (window.ZO2Y_DATA_RIGHTS_VERSION || '1'),
      account: {
        id: user.id,
        email: user.email,
        phone: user.phone || null,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        providers: Array.isArray(user.app_metadata && user.app_metadata.providers)
          ? user.app_metadata.providers
          : []
      },
      profile: null,
      data: {}
    };

    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      archive.profile = profile || null;
    } catch (_e) {
      archive.profile = null;
    }

    for (const t of TABLES_TO_EXPORT) {
      try {
        const { data, error } = await supabase
          .from(t.table)
          .select('*')
          .eq('user_id', userId);
        if (!error && Array.isArray(data)) {
          archive.data[t.label] = data;
        } else {
          archive.data[t.label] = { error: error ? error.message : 'unavailable' };
        }
      } catch (e) {
        archive.data[t.label] = { error: String(e && e.message || e) };
      }
    }

    const blob = new Blob([JSON.stringify(archive, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeEmail = String(user.email || user.id).replace(/[^a-z0-9._-]/gi, '_');
    a.download = `zo2y-data-export-${safeEmail}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  async function deleteAccount(supabase, userId) {
    const errors = [];
    for (const t of TABLES_TO_EXPORT) {
      try {
        const { error } = await supabase.from(t.table).delete().eq('user_id', userId);
        if (error && error.code !== 'PGRST116') errors.push({ table: t.table, message: error.message });
      } catch (e) {
        errors.push({ table: t.table, message: String(e && e.message || e) });
      }
    }
    return errors;
  }

  async function init() {
    const supabase = await ensureSupabase();
    if (!supabase) {
      showSignedOut();
      return;
    }
    let user = null;
    try {
      const { data } = await supabase.auth.getUser();
      user = data && data.user ? data.user : null;
    } catch (_e) {
      user = null;
    }
    if (!user) {
      showSignedOut();
      return;
    }
    showSignedIn(user);
    void loadStats(supabase, user.id);

    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', async (event) => {
        event.preventDefault();
        exportBtn.disabled = true;
        try {
          await exportData(supabase, user.id, user);
        } catch (e) {
          window.alert('Export failed: ' + (e && e.message || e));
        } finally {
          exportBtn.disabled = false;
        }
      });
    }

    const confirmInput = document.getElementById('deleteConfirm');
    const deleteBtn = document.getElementById('deleteBtn');
    const status = document.getElementById('deleteStatus');
    function refreshDeleteBtn() {
      if (!confirmInput || !deleteBtn) return;
      const typed = String(confirmInput.value || '').trim().toLowerCase();
      const expected = String(user.email || '').trim().toLowerCase();
      deleteBtn.disabled = typed !== expected || !expected;
    }
    if (confirmInput) {
      confirmInput.addEventListener('input', refreshDeleteBtn);
    }
    if (deleteBtn) {
      deleteBtn.addEventListener('click', async () => {
        refreshDeleteBtn();
        if (deleteBtn.disabled) return;
        const doubleConfirm = window.confirm(
          'This will permanently delete your account and all of your Zo2y data (lists, reviews, ratings, travel plans, profile). This action cannot be undone. Continue?'
        );
        if (!doubleConfirm) return;
        deleteBtn.disabled = true;
        setStatus(status, 'Deleting your data…', 'info');
        const errors = await deleteAccount(supabase, user.id);
        setStatus(status, 'Signing you out and clearing local data…', 'info');
        try {
          await supabase.auth.signOut({ scope: 'global' });
        } catch (_e) {}
        try {
          sessionStorage.setItem('zo2y-intentional-logout', 'true');
        } catch (_e) {}
        try {
          Object.keys(localStorage).forEach((key) => {
            if (key.startsWith('zo2y-') || key.startsWith('sb-') || key === 'supabase.auth.token') {
              localStorage.removeItem(key);
            }
          });
          Object.keys(sessionStorage).forEach((key) => {
            if (key.startsWith('zo2y-') || key.startsWith('sb-')) {
              sessionStorage.removeItem(key);
            }
          });
        } catch (_e) {}
        if (errors && errors.length) {
          setStatus(status, 'Your account data has been deleted, but some records could not be removed by you and will be cleaned by the server within 30 days. You have been signed out.', 'error');
        } else {
          setStatus(status, 'Your account has been deleted. You have been signed out. Thank you for using Zo2y.', 'success');
        }
        setTimeout(() => {
          window.location.href = 'index.html?deleted=1';
        }, 2500);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
