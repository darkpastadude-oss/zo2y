(() => {
  const supabaseConfig = window.__ZO2Y_SUPABASE_CONFIG || {};
  const SUPABASE_URL = String(supabaseConfig.url || '').trim() || '__SUPABASE_URL__';
  const SUPABASE_KEY = String(supabaseConfig.key || '').trim();
  const FALLBACK_BADGE = '/file.svg';
  const MANIFEST_URL = `${SUPABASE_URL}/storage/v1/object/public/sports-assets/manifest/sports-assets.json`;
  const MANIFEST_CACHE_KEY = 'zo2y_sports_manifest_v1';
  const MANIFEST_TTL = 1000 * 60 * 60 * 24 * 7;

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

  let supabase = null;
  let allTeams = [];
  let filteredTeams = [];
  let favorites = new Set();
  let manifestMap = {};

  function normalize(v) {
    return String(v || '').toLowerCase().trim();
  }

  function escapeHtml(v) {
    return String(v ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function getBadge(team) {
    const nameKey = normalize(team.name);
    if (BADGE_OVERRIDES[nameKey]) return BADGE_OVERRIDES[nameKey];
    if (manifestMap[nameKey]) return manifestMap[nameKey];
    return FALLBACK_BADGE;
  }

  async function ensureSupabase() {
    if (supabase) return supabase;
    if (window.__ZO2Y_SUPABASE_CLIENT) {
      supabase = window.__ZO2Y_SUPABASE_CLIENT;
      return supabase;
    }
    for (let i = 0; i < 20; i++) {
      if (window.supabase?.createClient) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
          auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
        });
        window.__ZO2Y_SUPABASE_CLIENT = supabase;
        return supabase;
      }
      await new Promise(r => setTimeout(r, 150));
    }
    return null;
  }

  async function loadManifest() {
    try {
      const cached = localStorage.getItem(MANIFEST_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.ts < MANIFEST_TTL && parsed.teams) {
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
        localStorage.setItem(MANIFEST_CACHE_KEY, JSON.stringify({ ts: Date.now(), teams: teams.map(t => ({ name: t.name, badge: t.badge })) }));
      } catch (_) {}
    } catch (_) {}
  }

  async function loadTeams() {
    const client = await ensureSupabase();
    if (!client) return [];
    try {
      const { data, error } = await client
        .from('teams')
        .select('id,name,sport,league,stadium')
        .order('name')
        .limit(5000);
      if (error) {
        console.error('Supabase query error:', error);
        return [];
      }
      const teams = (data || []).map(row => ({
        id: String(row.id || '').trim(),
        name: String(row.name || '').trim(),
        sport: String(row.sport || '').trim(),
        league: String(row.league || '').trim(),
        stadium: String(row.stadium || '').trim()
      })).filter(t => t.name);
      console.log(`Loaded ${teams.length} teams from Supabase`);
      return teams;
    } catch (err) {
      console.error('Error loading teams:', err);
      return [];
    }
  }

  async function loadFavorites() {
    const client = await ensureSupabase();
    if (!client) return;
    try {
      const { data } = await client.auth.getUser();
      const user = data?.user;
      if (!user) return;
      const { data: rows } = await client
        .from('user_favorite_teams')
        .select('team_id')
        .eq('user_id', user.id);
      favorites = new Set((rows || []).map(r => String(r.team_id)));
    } catch (_) {}
  }

  async function toggleFavorite(team) {
    const client = await ensureSupabase();
    if (!client) { showToast('Sign in to save teams.', true); return; }
    try {
      const { data } = await client.auth.getUser();
      if (!data?.user) { showToast('Sign in to save teams.', true); return; }
      const userId = data.user.id;
      if (favorites.has(team.id)) {
        await client.from('user_favorite_teams').delete().eq('user_id', userId).eq('team_id', team.id);
        favorites.delete(team.id);
        showToast('Removed from favorites.');
      } else {
        await client.from('teams').upsert({
          id: team.id, name: team.name, sport: team.sport || null,
          league: team.league || null, logo_url: getBadge(team),
          stadium: team.stadium || null
        }, { onConflict: 'id' });
        await client.from('user_favorite_teams').upsert(
          { user_id: userId, team_id: team.id },
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

  function buildCard(team) {
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
    card.innerHTML = `
      <div class="card-hover-cue"><i class="fas fa-arrow-up-right-from-square"></i> Open</div>
      <div class="card-media brand-cover">
        <img src="${escapeHtml(badge)}" alt="${escapeHtml(team.name)}" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='${FALLBACK_BADGE}';">
      </div>
      <div class="card-meta">
        <div class="card-meta-header">
          <span class="card-type"><i class="fa-solid fa-futbol"></i> Sports</span>
          <button class="card-save-btn ${saved ? 'saved' : ''}" type="button" aria-label="Save">${saved ? '<i class="fas fa-check"></i>' : '<i class="fas fa-heart"></i>'}</button>
        </div>
        <div class="card-meta-top">
          <p class="card-name">${escapeHtml(team.name)}</p>
        </div>
        <p class="card-sub">${escapeHtml(team.league || 'Sports')}</p>
        ${team.sport ? `<p class="card-extra">${escapeHtml(team.sport.toLowerCase())}</p>` : '<p class="card-extra placeholder">&nbsp;</p>'}
      </div>
    `;

    card.querySelector('.card-save-btn').addEventListener('click', e => {
      e.stopPropagation();
      toggleFavorite(team);
    });

    card.addEventListener('click', e => {
      if (e.target.closest('.card-save-btn')) return;
      window.location.href = card.dataset.href;
    });

    return card;
  }

  function renderTeams(teams, title, subtitle) {
    const grid = document.getElementById('sportsGrid');
    const loading = document.getElementById('sportsLoading');
    const empty = document.getElementById('sportsEmpty');
    const count = document.getElementById('sportsCount');
    const titleEl = document.getElementById('sportsTitle');
    const subEl = document.getElementById('sportsSubtitle');

    if (titleEl) titleEl.textContent = title || 'All teams';
    if (subEl) subEl.textContent = subtitle || `${teams.length} teams shown`;
    if (count) count.textContent = `${teams.length} teams shown`;
    if (loading) loading.classList.remove('visible');

    if (!grid) return;
    grid.innerHTML = '';

    if (!teams.length) {
      if (empty) empty.classList.add('visible');
      return;
    }
    if (empty) empty.classList.remove('visible');

    const frag = document.createDocumentFragment();
    teams.forEach(t => frag.appendChild(buildCard(t)));
    grid.appendChild(frag);
    syncSaveButtons();
  }

  function getFilters() {
    const sport = document.getElementById('filterSport')?.value || 'all';
    const league = document.getElementById('filterLeague')?.value || 'all';
    return { sport: sport !== 'all' ? sport : '', league: league !== 'all' ? league : '' };
  }

  function applyFilters(query) {
    const q = normalize(query);
    const { sport, league } = getFilters();
    filteredTeams = allTeams.filter(t => {
      if (sport && normalize(t.sport) !== sport) return false;
      if (league && normalize(t.league) !== league) return false;
      if (q) {
        const name = normalize(t.name);
        const leagueName = normalize(t.league);
        const sportName = normalize(t.sport);
        const tokens = q.split(' ').filter(Boolean);
        const match = tokens.some(tok =>
          name.includes(tok) || leagueName.includes(tok) || sportName.includes(tok)
        );
        if (!match) return false;
      }
      return true;
    });
    renderTeams(filteredTeams, q ? `Results for "${query}"` : 'All teams');
  }

  function populateFilters() {
    const sports = new Set();
    const leagues = new Set();
    allTeams.forEach(t => {
      if (t.sport) sports.add(t.sport);
      if (t.league) leagues.add(t.league);
    });
    const sportSelect = document.getElementById('filterSport');
    const leagueSelect = document.getElementById('filterLeague');
    if (sportSelect) {
      sportSelect.innerHTML = '<option value="all">All sports</option>' +
        [...sports].sort().map(s => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('');
    }
    if (leagueSelect) {
      leagueSelect.innerHTML = '<option value="all">All leagues</option>' +
        [...leagues].sort().map(s => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('');
    }
  }

  function showSuggestions(query) {
    const el = document.getElementById('sportsSuggest');
    if (!el) return;
    const q = normalize(query);
    if (!q || !filteredTeams.length) { el.classList.remove('show'); el.innerHTML = ''; return; }
    const matches = filteredTeams.filter(t => normalize(t.name).includes(q)).slice(0, 6);
    if (!matches.length) { el.classList.remove('show'); el.innerHTML = ''; return; }
    el.innerHTML = matches.map(t =>
      `<button type="button" class="sports-suggest-item" data-name="${escapeHtml(t.name)}">
        <span class="suggest-name">${escapeHtml(t.name)}</span>
        <span class="suggest-meta">${escapeHtml(t.league || t.sport || '')}</span>
      </button>`
    ).join('');
    el.classList.add('show');
    el.querySelectorAll('.sports-suggest-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const name = btn.dataset.name;
        document.getElementById('sportsSearch').value = name;
        el.classList.remove('show');
        applyFilters(name);
      });
    });
  }

  async function init() {
    await ensureSupabase();
    await loadManifest();
    await loadFavorites();

    allTeams = await loadTeams();
    filteredTeams = [...allTeams];
    populateFilters();
    renderTeams(allTeams, 'All teams', `${allTeams.length} teams loaded`);

    const searchInput = document.getElementById('sportsSearch');
    const searchBtn = document.getElementById('sportsSearchBtn');
    const filterBtn = document.getElementById('sportsFilterBtn');
    const filterModal = document.getElementById('sportsFilterModal');
    const filterClose = document.getElementById('sportsFilterClose');
    const filterSport = document.getElementById('filterSport');
    const filterLeague = document.getElementById('filterLeague');

    if (searchInput) {
      searchInput.addEventListener('input', () => {
        showSuggestions(searchInput.value);
        clearTimeout(searchInput._t);
        searchInput._t = setTimeout(() => applyFilters(searchInput.value), 150);
      });
      searchInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); applyFilters(searchInput.value); }
        if (e.key === 'Escape') { document.getElementById('sportsSuggest')?.classList.remove('show'); }
      });
      searchInput.addEventListener('focus', () => showSuggestions(searchInput.value));
    }

    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        document.getElementById('sportsSuggest')?.classList.remove('show');
        applyFilters(searchInput?.value || '');
      });
    }

    document.querySelectorAll('#sportsTags .sports-search-tag').forEach(btn => {
      btn.addEventListener('click', () => {
        if (searchInput) searchInput.value = btn.dataset.q;
        applyFilters(btn.dataset.q);
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

    if (filterSport) filterSport.addEventListener('change', () => applyFilters(searchInput?.value || ''));
    if (filterLeague) filterLeague.addEventListener('change', () => applyFilters(searchInput?.value || ''));

    document.addEventListener('click', e => {
      if (!e.target.closest('.sports-search-bar')) {
        document.getElementById('sportsSuggest')?.classList.remove('show');
      }
    });
  }

  init().catch(console.error);
})();
