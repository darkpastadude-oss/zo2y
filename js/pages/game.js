(() => {
  const supabaseConfig = window.__ZO2Y_SUPABASE_CONFIG || {};
  const SUPABASE_URL = String(supabaseConfig.url || '').trim();
  const SUPABASE_KEY = String(supabaseConfig.key || '').trim();

  const params = new URLSearchParams(window.location.search);
  const gameId = String(params.get('id') || '').trim();
  const RAWG_API_KEY = ''; // Works without a key for basic endpoints

  const dom = {
    hero: document.getElementById('gameHero'),
    posterFrame: document.getElementById('gamePosterFrame'),
    logo: document.getElementById('gameLogo'),
    backdrop: document.getElementById('gameBackdrop'),
    name: document.getElementById('gameName'),
    meta: document.getElementById('gameMeta'),
    desc: document.getElementById('gameDescription'),
    saveBtn: document.getElementById('gameSaveBtn'),
    toast: document.getElementById('gameToast'),
    kickerLabel: document.getElementById('gameKickerLabel')
  };

  let supabaseClient = null;
  let currentUser = null;

  function ensureSupabase() {
    if (supabaseClient) return supabaseClient;
    if (window.__ZO2Y_SUPABASE_CLIENT) {
      supabaseClient = window.__ZO2Y_SUPABASE_CLIENT;
      return supabaseClient;
    }
    if (!window.supabase) return null;
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
    });
    window.__ZO2Y_SUPABASE_CLIENT = supabaseClient;
    return supabaseClient;
  }

  function showToast(msg, level = 'info') {
    if (dom.toast) {
      dom.toast.textContent = msg;
      dom.toast.className = `elevated-toast is-${level} show`;
      setTimeout(() => dom.toast.classList.remove('show'), 2500);
    } else {
      console.log(msg);
    }
  }

  async function toggleSave() {
    const client = ensureSupabase();
    if (!client) return showToast('Supabase not loaded', 'error');
    if (!currentUser) return window.location.href = 'login.html';
    
    // We assume there's a game_list_items or media_lists table.
    // For zo2y we use index-list-menu-adapter globally.
    if (typeof window.openIndexStyleListMenu === 'function') {
      window.openIndexStyleListMenu({
        mediaType: 'game',
        id: gameId,
        title: dom.name.textContent,
        cover_url: dom.logo.src
      });
    } else {
      showToast('List feature not fully implemented', 'error');
    }
  }

  async function loadGame() {
    if (!gameId) {
      dom.name.textContent = 'Game Not Found';
      return;
    }

    try {
      const res = await fetch(`https://api.rawg.io/api/games/${gameId}?key=${RAWG_API_KEY}`);
      if (!res.ok) throw new Error('Failed to fetch from RAWG');
      const data = await res.json();

      dom.name.textContent = data.name || 'Unknown Game';
      dom.kickerLabel.textContent = 'game spotlight';
      
      const year = data.released ? data.released.substring(0, 4) : '';
      const playtime = data.playtime ? `${data.playtime} hours` : '';
      dom.meta.textContent = [year, playtime, data.rating ? `★ ${data.rating}` : ''].filter(Boolean).join(' • ');

      if (data.description_raw) {
        dom.desc.textContent = data.description_raw;
      }

      if (data.background_image) {
        dom.backdrop.style.backgroundImage = `url("${data.background_image}")`;
        dom.logo.src = data.background_image;
        dom.logo.style.objectFit = 'cover';
        dom.logo.style.display = 'block';
      }

      dom.hero.classList.remove('is-no-backdrop');
    } catch (e) {
      console.error(e);
      dom.name.textContent = 'Error loading game';
      showToast('Error loading game data', 'error');
    }
  }

  ensureSupabase()?.auth.getSession().then(({ data }) => {
    currentUser = data?.session?.user || null;
  });

  if (dom.saveBtn) dom.saveBtn.addEventListener('click', toggleSave);
  
  loadGame();
})();
