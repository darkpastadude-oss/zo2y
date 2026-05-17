(() => {
  const supabaseConfig = window.__ZO2Y_SUPABASE_CONFIG || {};
  const SUPABASE_URL = String(supabaseConfig.url || '').trim() || '__SUPABASE_URL__';
  const SUPABASE_KEY = String(supabaseConfig.key || '').trim();

  const FALLBACK_BADGE = '/file.svg';
  const LOCAL_MANIFEST_URL = '/assets/sports-badges/local-manifest.json';

  const BADGE_OVERRIDES = {
    'atletico madrid': '/assets/sports-badges/atletico-madrid.png',
    'psg': '/assets/sports-badges/paris-saint-germain.png',
    'paris saint germain': '/assets/sports-badges/paris-saint-germain.png',
    'sao paulo': '/assets/sports-badges/sao-paulo.png',
    'ufc': '/assets/sports-badges/ufc.png',
    'wbc': '/assets/sports-badges/wbc.png',
    'wba': '/assets/sports-badges/wba.png',
    'ibf': '/assets/sports-badges/ibf.png',
    'wbo': '/assets/sports-badges/wbo.png',
    'glory kickboxing': '/assets/sports-badges/glory-kickboxing.png',
    'one championship': '/assets/sports-badges/one-championship.png',
    'k-1': '/assets/sports-badges/k-1.png',
    'ferrari': '/assets/sports-badges/scuderia-ferrari-hp.png',
    'scuderia ferrari hp': '/assets/sports-badges/scuderia-ferrari-hp.png',
    'red bull racing': '/assets/sports-badges/oracle-red-bull-racing.png',
    'oracle red bull racing': '/assets/sports-badges/oracle-red-bull-racing.png',
    'mercedes': '/assets/sports-badges/mercedes-amg-petronas-formula-one-team.png',
    'mercedes-amg petronas formula one team': '/assets/sports-badges/mercedes-amg-petronas-formula-one-team.png',
    'mclaren': '/assets/sports-badges/mclaren-formula-1-team.png',
    'mclaren formula 1 team': '/assets/sports-badges/mclaren-formula-1-team.png',
    'aston martin': '/assets/sports-badges/aston-martin-aramco-formula-one-team.png',
    'aston martin aramco formula one team': '/assets/sports-badges/aston-martin-aramco-formula-one-team.png',
    'alpine': '/assets/sports-badges/bwt-alpine-formula-one-team.png',
    'bwt alpine formula one team': '/assets/sports-badges/bwt-alpine-formula-one-team.png',
    'williams': '/assets/sports-badges/williams-racing.png',
    'williams racing': '/assets/sports-badges/williams-racing.png',
    'rb': '/assets/sports-badges/visa-cash-app-rb-formula-one-team.png',
    'visa cash app rb formula one team': '/assets/sports-badges/visa-cash-app-rb-formula-one-team.png',
    'kick sauber': '/assets/sports-badges/stake-f1-team-kick-sauber.png',
    'stake f1 team kick sauber': '/assets/sports-badges/stake-f1-team-kick-sauber.png',
    'haas': '/assets/sports-badges/moneygram-haas-f1-team.png',
    'moneygram haas f1 team': '/assets/sports-badges/moneygram-haas-f1-team.png',
    'top rank': '/assets/sports-badges/top-rank.png',
    'golden boy promotions': '/assets/sports-badges/golden-boy-promotions.png',
    'matchroom boxing': '/assets/sports-badges/matchroom-boxing.png',
    'queensberry promotions': '/assets/sports-badges/queensberry-promotions.png',
    'pbc': '/assets/sports-badges/premier-boxing-champions.png',
    'premier boxing champions': '/assets/sports-badges/premier-boxing-champions.png',
    'boxxer': '/assets/sports-badges/boxxer.png',
    'wasserman boxing': '/assets/sports-badges/wasserman-boxing.png',
    'mgb promotions': '/assets/sports-badges/mgb-promotions.png',
    'wako': '/assets/sports-badges/wako.png',
    'iska': '/assets/sports-badges/iska.png',
    'wmc': '/assets/sports-badges/wmc.png',
    'ifma': '/assets/sports-badges/ifma.png',
    'wkn': '/assets/sports-badges/wkn.png',
    'enfusion': '/assets/sports-badges/enfusion.png',
    'krush': '/assets/sports-badges/krush.png'
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
  let localBadgeMap = {};
  let localBadgeMapLower = {};
  let favorites = new Set();

  function normalize(v) {
    return String(v || '').toLowerCase().trim();
  }

  async function loadLocalManifest() {
    try {
      const res = await fetch(LOCAL_MANIFEST_URL, { cache: 'force-cache' });
      if (!res.ok) return;
      localBadgeMap = await res.json();
      Object.entries(localBadgeMap).forEach(([name, path]) => {
        localBadgeMapLower[name.toLowerCase()] = path;
      });
    } catch (_) {}
  }

  function getBadge(team) {
    const nameKey = normalize(team.name);
    if (BADGE_OVERRIDES[nameKey]) return BADGE_OVERRIDES[nameKey];
    if (localBadgeMap[team.name]) return localBadgeMap[team.name];
    if (localBadgeMapLower[nameKey]) return localBadgeMapLower[nameKey];
    return FALLBACK_BADGE;
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
      <div class="card-media brand-cover">
        <img
          src="${escapeHtml(badge)}"
          alt="${escapeHtml(title)} badge"
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

    document.querySelectorAll('#sportsTags .sports-search-tag').forEach(btn => {
      btn.addEventListener('click', () => {
        if (searchInput) searchInput.value = btn.dataset.q;
        renderGrid();
      });
    });

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
    await loadLocalManifest();
    console.log('[sports] local manifest loaded:', Object.keys(localBadgeMap).length, 'badges');
    const client = await ensureSupabase();
    console.log('[sports] supabase client:', client ? 'OK' : 'NULL');
    await loadSession();
    console.log('[sports] session loaded, user:', currentUser?.id || 'none');
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
