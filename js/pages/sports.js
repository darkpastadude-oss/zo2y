(() => {
  const supabaseConfig = window.__ZO2Y_SUPABASE_CONFIG || {};
  const SUPABASE_URL = String(supabaseConfig.url || '').trim() || '__SUPABASE_URL__';
  const SUPABASE_KEY = String(supabaseConfig.key || '').trim();

  const MANIFEST_URL = `${SUPABASE_URL}/storage/v1/object/public/sports-assets/manifest/sports-assets.json`;
  const FALLBACK_BADGE = '/file.svg';

  const BADGE_OVERRIDES = {
    'atletico madrid': 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f4/Atletico_Madrid_2017_logo.svg/200px-Atletico_Madrid_2017_logo.svg.png',
    'psg': 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a7/Paris_Saint-Germain_F.C..svg/200px-Paris_Saint-Germain_F.C..svg.png',
    'sao paulo': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Brasao_do_Sao_Paulo_Futebol_Clube.svg/200px-Brasao_do_Sao_Paulo_Futebol_Clube.svg.png',
    'ufc': 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d0/UFC_Logo.svg/200px-UFC_Logo.svg.png',
    'wbc': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/World_Boxing_Council_logo.svg/200px-World_Boxing_Council_logo.svg.png',
    'wba': 'https://upload.wikimedia.org/wikipedia/en/thumb/0/0e/World_Boxing_Association_logo.svg/200px-World_Boxing_Association_logo.svg.png',
    'ibf': 'https://upload.wikimedia.org/wikipedia/en/thumb/1/18/International_Boxing_Federation_logo.svg/200px-International_Boxing_Federation_logo.svg.png',
    'wbo': 'https://upload.wikimedia.org/wikipedia/en/thumb/4/4d/World_Boxing_Organization_logo.svg/200px-World_Boxing_Organization_logo.svg.png',
    'glory kickboxing': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Glory_Kickboxing_logo.svg/200px-Glory_Kickboxing_logo.svg.png',
    'one championship': 'https://upload.wikimedia.org/wikipedia/en/thumb/2/2f/ONE_Championship_logo.svg/200px-ONE_Championship_logo.svg.png',
    'k-1': 'https://upload.wikimedia.org/wikipedia/en/thumb/3/3e/K-1_logo.svg/200px-K-1_logo.svg.png'
  };

  const grid = document.getElementById('sportsGrid');
  const searchInput = document.getElementById('sportsSearch');
  const searchBtn = document.getElementById('sportsSearchBtn');
  const filterBtn = document.getElementById('sportsFilterBtn');
  const filterModal = document.getElementById('sportsFilterModal');
  const filterClose = document.getElementById('sportsFilterClose');
  const filterSport = document.getElementById('filterSport');
  const filterLeague = document.getElementById('filterLeague');
  const countText = document.getElementById('sportsCount');
  const titleEl = document.getElementById('sportsTitle');
  const subEl = document.getElementById('sportsSubtitle');
  const loadingEl = document.getElementById('sportsLoading');
  const emptyEl = document.getElementById('sportsEmpty');

  let supabaseClient = null;
  let currentUser = null;
  let allTeams = [];
  let manifestMap = {};
  let favorites = new Set();

  function normalize(v) {
    return String(v || '').toLowerCase().trim();
  }

  function escapeHtml(v) {
    return String(v ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

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

  async function loadSession() {
    const client = ensureSupabase();
    if (!client?.auth?.getSession) return null;
    try {
      const { data } = await client.auth.getSession();
      currentUser = data?.session?.user || null;
      return currentUser;
    } catch (_) { return null; }
  }

  async function loadManifest() {
    try {
      const cached = localStorage.getItem('zo2y_sports_manifest_v1');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.ts < 1000 * 60 * 60 * 24 * 7 && parsed.teams) {
          parsed.teams.forEach(t => {
            if (t.name) manifestMap[normalize(t.name)] = t.badge || '';
          });
          return;
        }
      }
    } catch (_) {}

    try {
      const res = await fetch(MANIFEST_URL, { cache: 'force-cache' });
      if (!res.ok) return;
      const data = await res.json();
      const teams = Array.isArray(data?.teams) ? data.teams : (Array.isArray(data) ? data : []);
      teams.forEach(t => {
        if (t.name) manifestMap[normalize(t.name)] = t.badge || '';
      });
      try {
        localStorage.setItem('zo2y_sports_manifest_v1', JSON.stringify({
          ts: Date.now(),
          teams: teams.map(t => ({ name: t.name, badge: t.badge }))
        }));
      } catch (_) {}
    } catch (_) {}
  }

  function getBadge(team) {
    const nameKey = normalize(team.name);
    if (BADGE_OVERRIDES[nameKey]) return BADGE_OVERRIDES[nameKey];
    if (manifestMap[nameKey]) return manifestMap[nameKey];
    return FALLBACK_BADGE;
  }

  async function loadFavorites() {
    const client = ensureSupabase();
    if (!client || !currentUser) return;
    try {
      const { data: rows } = await client
        .from('user_favorite_teams')
        .select('team_id')
        .eq('user_id', currentUser.id);
      favorites = new Set((rows || []).map(r => String(r.team_id)));
    } catch (_) {}
  }

  async function loadTeams() {
    const client = ensureSupabase();
    if (!client) {
      console.error('[sports] No supabase client');
      return [];
    }
    try {
      console.log('[sports] Querying teams table...');
      const { data, error, count } = await client
        .from('teams')
        .select('id,name,sport,league,stadium', { count: 'exact' })
        .order('name')
        .limit(5000);
      if (error) {
        console.error('[sports] Supabase teams error:', error);
        return [];
      }
      const teams = (data || []).map(row => ({
        id: String(row.id || '').trim(),
        name: String(row.name || '').trim(),
        sport: String(row.sport || '').trim(),
        league: String(row.league || '').trim(),
        stadium: String(row.stadium || '').trim()
      })).filter(t => t.name);
      console.log(`[sports] Loaded ${teams.length} teams (count: ${count})`);
      return teams;
    } catch (err) {
      console.error('[sports] Error loading teams:', err);
      return [];
    }
  }

  async function toggleFavorite(team) {
    const client = ensureSupabase();
    if (!client) { showToast('Sign in to save teams.', true); return; }
    if (!currentUser) { showToast('Sign in to save teams.', true); return; }
    try {
      if (favorites.has(team.id)) {
        await client.from('user_favorite_teams').delete()
          .eq('user_id', currentUser.id).eq('team_id', team.id);
        favorites.delete(team.id);
        showToast('Removed from favorites.');
      } else {
        await client.from('teams').upsert({
          id: team.id, name: team.name, sport: team.sport || null,
          league: team.league || null, logo_url: getBadge(team),
          stadium: team.stadium || null
        }, { onConflict: 'id' });
        await client.from('user_favorite_teams').upsert(
          { user_id: currentUser.id, team_id: team.id },
          { onConflict: 'user_id,team_id' }
        );
        favorites.add(team.id);
        showToast('Team saved to your profile.');
      }
      syncSaveButtons();
    } catch (_) {
      showToast('Unable to save team.', true);
    }
  }

  function syncSaveButtons() {
    document.querySelectorAll('.card[data-team-id]').forEach(card => {
      const id = card.dataset.teamId;
      const btn = card.querySelector('.card-save-btn');
      if (btn) {
        const saved = favorites.has(id);
        btn.classList.toggle('saved', saved);
        btn.innerHTML = saved
          ? '<i class="fas fa-check"></i>'
          : '<i class="fas fa-heart"></i>';
      }
    });
  }

  function showToast(msg, isError) {
    const el = document.getElementById('sportsToast');
    if (!el) return;
    el.textContent = msg;
    el.classList.toggle('error', !!isError);
    el.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => el.classList.remove('show'), 2800);
  }

  function createCard(team) {
    const badge = getBadge(team);
    const saved = favorites.has(team.id);
    const card = document.createElement('article');
    card.className = 'card';
    card.dataset.teamId = team.id;
    card.dataset.href = `team.html?id=${encodeURIComponent(team.id)}&team=${encodeURIComponent(team.name)}`;
    card.dataset.mediaType = 'sports';
    card.dataset.title = team.name;
    card.dataset.subtitle = team.league || 'Sports';
    card.dataset.image = badge;
    card.dataset.listImage = badge;

    const href = card.dataset.href;
    const title = team.name;
    const subtitle = team.league || 'Sports';
    const extra = team.sport ? team.sport.toLowerCase() : ' ';

    card.innerHTML = `
      <div class="card-hover-cue"><i class="fas fa-arrow-up-right-from-square"></i> Open</div>
      <div class="card-media brand-cover is-loading-media">
        <img
          src="${FALLBACK_BADGE}"
          data-defer-src="${escapeHtml(badge)}"
          data-fallback-image="${FALLBACK_BADGE}"
          data-home-image="1"
          data-image-ready="0"
          alt="${escapeHtml(title)} badge"
          loading="lazy"
          decoding="async"
          referrerpolicy="no-referrer"
        />
      </div>
      <div class="card-meta">
        <div class="card-meta-header">
          <span class="card-type"><i class="fa-solid fa-futbol"></i> Sports</span>
          <button class="card-save-btn ${saved ? 'saved' : ''}" type="button" aria-label="Save">${saved ? '<i class="fas fa-check"></i>' : '<i class="fas fa-heart"></i>'}</button>
        </div>
        <div class="card-meta-top">
          <p class="card-name">${escapeHtml(title)}</p>
        </div>
        <p class="card-sub">${escapeHtml(subtitle)}</p>
        <p class="card-extra">${escapeHtml(extra)}</p>
      </div>
    `;

    const saveBtn = card.querySelector('.card-save-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', e => {
        e.stopPropagation();
        toggleFavorite(team);
      });
    }

    card.addEventListener('click', e => {
      if (e.target.closest('.card-save-btn')) return;
      window.location.href = href;
    });

    return card;
  }

  function getFilteredTeams() {
    const search = String(searchInput?.value || '').trim();
    const sport = String(filterSport?.value || 'all').toLowerCase();
    const league = String(filterLeague?.value || 'all').toLowerCase();

    return allTeams.filter(t => {
      if (sport !== 'all' && normalize(t.sport) !== sport) return false;
      if (league !== 'all' && normalize(t.league) !== league) return false;
      if (search) {
        const q = normalize(search);
        const name = normalize(t.name);
        const leagueName = normalize(t.league);
        const sportName = normalize(t.sport);
        const tokens = q.split(' ').filter(Boolean);
        return tokens.some(tok => name.includes(tok) || leagueName.includes(tok) || sportName.includes(tok));
      }
      return true;
    });
  }

  function renderGrid() {
    if (!grid) return;
    const filtered = getFilteredTeams();

    if (loadingEl) loadingEl.classList.remove('visible');
    if (emptyEl) emptyEl.classList.remove('visible');

    grid.innerHTML = '';

    if (countText) countText.textContent = `${filtered.length} teams shown`;
    if (titleEl) titleEl.textContent = 'All teams';
    if (subEl) subEl.textContent = `${filtered.length} teams loaded`;

    if (!filtered.length) {
      if (emptyEl) emptyEl.classList.add('visible');
      return;
    }

    const fragment = document.createDocumentFragment();
    filtered.forEach(t => fragment.appendChild(createCard(t)));
    grid.appendChild(fragment);
    wireImageState(grid);
    primeImages(grid);
    syncSaveButtons();
  }

  function populateFilters() {
    const sports = new Set();
    const leagues = new Set();
    allTeams.forEach(t => {
      if (t.sport) sports.add(t.sport);
      if (t.league) leagues.add(t.league);
    });
    if (filterSport) {
      filterSport.innerHTML = '<option value="all">All sports</option>' +
        [...sports].sort().map(s => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('');
    }
    if (filterLeague) {
      filterLeague.innerHTML = '<option value="all">All leagues</option>' +
        [...leagues].sort().map(s => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('');
    }
  }

  function wireImageState(scope) {
    const root = scope || document;
    root.querySelectorAll('img[data-home-image="1"]').forEach(img => {
      const wrap = img.closest('.card-media');
      const markReady = () => {
        img.setAttribute('data-image-ready', '1');
        if (wrap) wrap.classList.remove('is-loading-media');
      };
      const handleError = () => {
        const fallback = FALLBACK_BADGE;
        if (img.src.endsWith(fallback)) { markReady(); return; }
        img.removeAttribute('data-defer-src');
        img.src = fallback;
      };
      img.addEventListener('load', markReady);
      img.addEventListener('error', handleError);
      if (img.complete && !img.hasAttribute('data-defer-src')) markReady();
    });
  }

  function primeImages(scope) {
    const root = scope || document;
    const images = Array.from(root.querySelectorAll('img[data-defer-src]'));
    if (!images.length) return;
    if (typeof window.IntersectionObserver !== 'function') {
      images.forEach(img => {
        const src = String(img.getAttribute('data-defer-src') || '').trim();
        if (src) { img.removeAttribute('data-defer-src'); img.src = src; }
      });
      return;
    }
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const img = entry.target;
        obs.unobserve(img);
        const src = String(img.getAttribute('data-defer-src') || '').trim();
        if (src) { img.removeAttribute('data-defer-src'); img.src = src; }
      });
    }, { rootMargin: '260px 0px', threshold: 0.01 });
    images.forEach(img => observer.observe(img));
  }

  function wireEvents() {
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        clearTimeout(searchInput._t);
        searchInput._t = setTimeout(renderGrid, 150);
      });
      searchInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); renderGrid(); }
      });
    }
    if (searchBtn) searchBtn.addEventListener('click', renderGrid);
    if (filterSport) filterSport.addEventListener('change', renderGrid);
    if (filterLeague) filterLeague.addEventListener('change', renderGrid);

    if (filterBtn && filterModal) {
      filterBtn.addEventListener('click', () => {
        filterModal.classList.add('show');
        filterModal.setAttribute('aria-hidden', 'false');
      });
    }
    if (filterClose && filterModal) {
      filterClose.addEventListener('click', () => {
        filterModal.classList.remove('show');
        filterModal.setAttribute('aria-hidden', 'true');
      });
    }
    if (filterModal) {
      filterModal.addEventListener('click', e => {
        if (e.target === filterModal) {
          filterModal.classList.remove('show');
          filterModal.setAttribute('aria-hidden', 'true');
        }
      });
    }

    document.addEventListener('click', e => {
      if (!e.target.closest('.sports-search-bar')) {
        document.getElementById('sportsSuggest')?.classList.remove('show');
      }
    });
  }

  async function boot() {
    console.log('[sports] boot starting');
    wireEvents();
    const client = await ensureSupabase();
    console.log('[sports] supabase client:', client ? 'OK' : 'NULL');
    await loadSession();
    console.log('[sports] session loaded, user:', currentUser?.id || 'none');
    await loadManifest();
    console.log('[sports] manifest loaded, entries:', Object.keys(manifestMap).length);
    await loadFavorites();
    console.log('[sports] favorites loaded:', favorites.size);

    allTeams = await loadTeams();
    console.log('[sports] teams loaded:', allTeams.length);
    populateFilters();
    renderGrid();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
