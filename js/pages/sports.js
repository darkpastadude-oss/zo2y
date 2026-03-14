(() => {
  const SUPABASE_URL = 'https://gfkhjbztayjyojsgdpgk.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma2hqYnp0YXlqeW9qc2dkcGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwOTYyNjQsImV4cCI6MjA3NTY3MjI2NH0.WUb2yDAwCeokdpWCPeH13FE8NhWF6G8e6ivTsgu6b2s';
  const SPORTSDB_API_KEY = String(window.ZO2Y_SPORTSDB_KEY || '3').trim() || '3';
  const SPORTSDB_BASE = `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_API_KEY}`;
  const FALLBACK_IMAGE = '/newlogo.webp';
  const FALLBACK_BADGE = '/file.svg';
  const SEED_TEAMS = [
    'Liverpool',
    'Real Madrid',
    'Los Angeles Lakers',
    'Golden State Warriors',
    'New York Yankees',
    'Boston Celtics',
    'Manchester City',
    'FC Barcelona',
    'Green Bay Packers',
    'Dallas Cowboys'
  ];

  const state = {
    supabase: null,
    currentUser: null,
    favorites: new Set(),
    heroTeam: null,
    teamMap: new Map(),
    searchTimer: null
  };

  const ui = {
    hero: document.getElementById('sportsHero'),
    heroMedia: document.getElementById('sportsHeroMedia'),
    heroTitle: document.getElementById('sportsHeroTitle'),
    heroSubtitle: document.getElementById('sportsHeroSubtitle'),
    heroMeta: document.getElementById('sportsHeroMeta'),
    heroCard: document.getElementById('sportsHeroCard'),
    heroBadge: document.getElementById('sportsHeroBadge'),
    heroTeam: document.getElementById('sportsHeroTeam'),
    heroLeague: document.getElementById('sportsHeroLeague'),
    heroStadium: document.getElementById('sportsHeroStadium'),
    heroSave: document.getElementById('sportsHeroSaveBtn'),
    searchInput: document.getElementById('sportsSearchInput'),
    searchBtn: document.getElementById('sportsSearchBtn'),
    searchTags: document.getElementById('sportsSearchTags'),
    resultsTitle: document.getElementById('sportsResultsTitle'),
    resultsSubtitle: document.getElementById('sportsResultsSubtitle'),
    grid: document.getElementById('sportsGrid'),
    empty: document.getElementById('sportsEmpty'),
    loading: document.getElementById('sportsLoading'),
    toast: document.getElementById('sportsToast')
  };

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function toHttps(url) {
    const text = String(url || '').trim();
    if (!text) return '';
    if (text.startsWith('//')) return `https:${text}`;
    if (text.startsWith('http://')) return text.replace(/^http:\/\//i, 'https://');
    return text;
  }

  function showToast(message, type = 'info') {
    if (!ui.toast) return;
    ui.toast.textContent = message;
    ui.toast.classList.toggle('error', type === 'error');
    ui.toast.classList.add('show');
    window.clearTimeout(showToast._timer);
    showToast._timer = window.setTimeout(() => {
      ui.toast.classList.remove('show');
    }, 2800);
  }

  async function fetchSportsDb(endpoint, params = {}, timeoutMs = 8000) {
    const url = new URL(`${SPORTSDB_BASE}/${endpoint}`);
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') return;
      url.searchParams.set(key, value);
    });
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    let timer = null;
    try {
      if (controller) timer = setTimeout(() => controller.abort(), timeoutMs);
      const response = await fetch(url.toString(), {
        headers: { Accept: 'application/json' },
        signal: controller ? controller.signal : undefined
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (_err) {
      return null;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  function mapTeam(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const name = String(raw.strTeam || '').trim();
    const id = String(raw.idTeam || name || '').trim();
    if (!name || !id) return null;
    const team = {
      id,
      name,
      sport: String(raw.strSport || '').trim(),
      league: String(raw.strLeague || '').trim(),
      stadium: String(raw.strStadium || '').trim(),
      badge: toHttps(raw.strTeamBadge || raw.strTeamLogo || ''),
      banner: toHttps(raw.strTeamBanner || ''),
      fanart: toHttps(raw.strTeamFanart1 || raw.strTeamFanart2 || raw.strTeamFanart3 || ''),
      stadiumThumb: toHttps(raw.strStadiumThumb || ''),
      jersey: toHttps(raw.strTeamJersey || '')
    };
    return team;
  }

  function setLoading(isLoading, message) {
    if (!ui.loading) return;
    if (isLoading) {
      ui.loading.textContent = message || 'Loading teams...';
      ui.loading.classList.add('visible');
      if (ui.empty) ui.empty.classList.remove('visible');
    } else {
      ui.loading.classList.remove('visible');
    }
  }

  function updateSaveButton(button, isSaved, labels) {
    if (!button) return;
    const label = labels?.label || 'Save';
    const savedLabel = labels?.savedLabel || 'Saved';
    button.classList.toggle('saved', !!isSaved);
    const icon = isSaved ? 'fa-check' : 'fa-heart';
    const text = isSaved ? savedLabel : label;
    button.innerHTML = `<i class="fas ${icon}"></i><span>${text}</span>`;
    button.setAttribute('aria-pressed', isSaved ? 'true' : 'false');
  }

  function setHeroTeam(team) {
    state.heroTeam = team || null;
    const hasTeam = !!team;

    if (ui.heroCard) {
      ui.heroCard.classList.toggle('is-empty', !hasTeam);
    }

    if (!hasTeam) {
      if (ui.heroTitle) ui.heroTitle.textContent = 'Find your team';
      if (ui.heroSubtitle) ui.heroSubtitle.textContent = 'Search teams, save favorites to your profile, and build a sports corner that matches your taste.';
      if (ui.heroTeam) ui.heroTeam.textContent = 'Team spotlight';
      if (ui.heroLeague) ui.heroLeague.textContent = 'Search for a team to see details.';
      if (ui.heroStadium) ui.heroStadium.textContent = '';
      if (ui.heroBadge) ui.heroBadge.src = FALLBACK_BADGE;
      if (ui.heroMeta) {
        ui.heroMeta.innerHTML = '<span class="sports-hero-pill">Powered by TheSportsDB</span><span class="sports-hero-pill">Save teams to your profile</span>';
      }
      if (ui.heroMedia) ui.heroMedia.style.removeProperty('--hero-bg');
      if (ui.heroSave) ui.heroSave.disabled = true;
      return;
    }

    const metaPieces = [team.league, team.sport, team.stadium].filter(Boolean);
    const metaHtml = metaPieces.length
      ? metaPieces.map((item) => `<span class="sports-hero-pill">${escapeHtml(item)}</span>`).join('')
      : '<span class="sports-hero-pill">Powered by TheSportsDB</span>';

    if (ui.heroTitle) ui.heroTitle.textContent = team.name;
    if (ui.heroSubtitle) {
      const subtitle = [team.league, team.sport].filter(Boolean).join(' | ') || 'Team details';
      ui.heroSubtitle.textContent = subtitle;
    }
    if (ui.heroTeam) ui.heroTeam.textContent = team.name;
    if (ui.heroLeague) {
      const leagueLine = [team.league, team.sport].filter(Boolean).join(' | ') || 'Team details';
      ui.heroLeague.textContent = leagueLine;
    }
    if (ui.heroStadium) {
      ui.heroStadium.textContent = team.stadium ? `Stadium: ${team.stadium}` : '';
    }
    if (ui.heroBadge) {
      ui.heroBadge.src = team.badge || FALLBACK_BADGE;
      ui.heroBadge.alt = `${team.name} logo`;
    }
    if (ui.heroMeta) ui.heroMeta.innerHTML = metaHtml;

    const heroImage = team.fanart || team.banner || team.stadiumThumb || team.badge;
    if (ui.heroMedia) {
      if (heroImage) ui.heroMedia.style.setProperty('--hero-bg', `url("${heroImage}")`);
      else ui.heroMedia.style.removeProperty('--hero-bg');
    }

    if (ui.heroSave) {
      ui.heroSave.disabled = false;
      updateSaveButton(ui.heroSave, state.favorites.has(team.id), { label: 'Save team', savedLabel: 'Saved' });
    }
  }

  function buildCard(team) {
    const card = document.createElement('article');
    card.className = 'sports-card';
    card.dataset.teamId = team.id;

    const mediaImage = team.fanart || team.banner || team.stadiumThumb || FALLBACK_IMAGE;
    const logo = team.badge || FALLBACK_BADGE;
    const metaLine = [team.league, team.sport].filter(Boolean).join(' | ') || 'Team';

    card.innerHTML = `
      <div class="sports-card-media">
        <img src="${escapeHtml(mediaImage)}" alt="${escapeHtml(team.name)} banner" loading="lazy" onerror="this.onerror=null;this.src='${FALLBACK_IMAGE}';" />
      </div>
      <div class="sports-card-logo"><img src="${escapeHtml(logo)}" alt="${escapeHtml(team.name)} logo" loading="lazy" onerror="this.onerror=null;this.src='${FALLBACK_BADGE}';" /></div>
      <div class="sports-card-body">
        <div class="sports-card-title">${escapeHtml(team.name)}</div>
        <div class="sports-card-meta">${escapeHtml(metaLine)}</div>
        ${team.stadium ? `<div class="sports-card-stadium"><i class="fas fa-location-dot"></i> ${escapeHtml(team.stadium)}</div>` : ''}
        <div class="sports-card-actions">
          <button class="sports-card-save" type="button" data-team-id="${escapeHtml(team.id)}">
            <i class="fas fa-heart"></i><span>Save</span>
          </button>
        </div>
      </div>
    `;

    const saveBtn = card.querySelector('.sports-card-save');
    if (saveBtn) {
      updateSaveButton(saveBtn, state.favorites.has(team.id), { label: 'Save', savedLabel: 'Saved' });
      saveBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        toggleFavorite(team);
      });
    }

    card.addEventListener('click', () => {
      setHeroTeam(team);
    });

    return card;
  }

  function renderTeams(teams, options = {}) {
    if (!ui.grid) return;
    const list = Array.isArray(teams) ? teams : [];
    ui.grid.innerHTML = '';
    state.teamMap.clear();

    if (ui.resultsTitle && options.title) ui.resultsTitle.textContent = options.title;
    if (ui.resultsSubtitle && options.subtitle) ui.resultsSubtitle.textContent = options.subtitle;

    if (!list.length) {
      if (ui.empty) {
        ui.empty.textContent = options.emptyMessage || 'No teams found. Try another search.';
        ui.empty.classList.add('visible');
      }
      setLoading(false);
      return;
    }

    if (ui.empty) ui.empty.classList.remove('visible');
    setLoading(false);

    const fragment = document.createDocumentFragment();
    list.forEach((team) => {
      state.teamMap.set(team.id, team);
      fragment.appendChild(buildCard(team));
    });
    ui.grid.appendChild(fragment);

    if (!options.keepHero && list.length) {
      setHeroTeam(list[0]);
    }

    syncSavedButtons();
  }

  async function ensureSupabase() {
    if (state.supabase) return state.supabase;
    if (window.__ZO2Y_SUPABASE_CLIENT) {
      state.supabase = window.__ZO2Y_SUPABASE_CLIENT;
      return state.supabase;
    }
    for (let i = 0; i < 20; i += 1) {
      if (window.supabase?.createClient) {
        state.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
          auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
        });
        window.__ZO2Y_SUPABASE_CLIENT = state.supabase;
        return state.supabase;
      }
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
    return null;
  }

  async function initAuth() {
    if (!state.supabase) return;
    try {
      const { data } = await state.supabase.auth.getUser();
      state.currentUser = data?.user || null;
      if (state.currentUser) await loadFavorites();
      state.supabase.auth.onAuthStateChange((_event, session) => {
        state.currentUser = session?.user || null;
        if (state.currentUser) {
          loadFavorites().catch(() => {});
        } else {
          state.favorites = new Set();
          syncSavedButtons();
        }
      });
    } catch (_err) {
      state.currentUser = null;
    }
  }

  async function loadFavorites() {
    if (!state.supabase || !state.currentUser) return;
    const { data, error } = await state.supabase
      .from('user_favorite_teams')
      .select('team_id')
      .eq('user_id', state.currentUser.id);

    if (error) return;

    state.favorites = new Set((data || []).map((row) => String(row.team_id)));
    syncSavedButtons();
  }

  function syncSavedButtons() {
    document.querySelectorAll('.sports-card-save').forEach((button) => {
      const teamId = button.getAttribute('data-team-id');
      updateSaveButton(button, state.favorites.has(teamId), { label: 'Save', savedLabel: 'Saved' });
    });
    if (ui.heroSave && state.heroTeam) {
      updateSaveButton(ui.heroSave, state.favorites.has(state.heroTeam.id), { label: 'Save team', savedLabel: 'Saved' });
    }
  }

  async function saveTeam(team) {
    if (!state.supabase || !state.currentUser) return false;
    const payload = {
      id: team.id,
      name: team.name,
      sport: team.sport || null,
      league: team.league || null,
      logo_url: team.badge || null,
      banner_url: team.banner || null,
      stadium: team.stadium || null,
      stadium_url: team.stadiumThumb || null,
      jersey_url: team.jersey || null,
      fanart_url: team.fanart || null
    };

    const { error: teamError } = await state.supabase
      .from('teams')
      .upsert(payload, { onConflict: 'id' });

    if (teamError) {
      console.error('Team upsert error', teamError);
      return false;
    }

    const { error: favoriteError } = await state.supabase
      .from('user_favorite_teams')
      .upsert({ user_id: state.currentUser.id, team_id: team.id }, { onConflict: 'user_id,team_id' });

    if (favoriteError) {
      console.error('Favorite upsert error', favoriteError);
      return false;
    }

    return true;
  }

  async function removeTeam(teamId) {
    if (!state.supabase || !state.currentUser) return false;
    const { error } = await state.supabase
      .from('user_favorite_teams')
      .delete()
      .eq('user_id', state.currentUser.id)
      .eq('team_id', teamId);
    if (error) {
      console.error('Favorite delete error', error);
      return false;
    }
    return true;
  }

  async function toggleFavorite(team) {
    if (!team || !team.id) return;
    if (!state.currentUser) {
      showToast('Sign in to save teams.', 'error');
      return;
    }

    const isSaved = state.favorites.has(team.id);
    if (isSaved) {
      const ok = await removeTeam(team.id);
      if (ok) {
        state.favorites.delete(team.id);
        showToast('Removed from favorites.');
      } else {
        showToast('Unable to remove team.', 'error');
      }
    } else {
      const ok = await saveTeam(team);
      if (ok) {
        state.favorites.add(team.id);
        showToast('Team saved to your profile.');
      } else {
        showToast('Unable to save team.', 'error');
      }
    }
    syncSavedButtons();
  }

  async function loadFeaturedTeams() {
    setLoading(true, 'Loading featured teams...');
    const picks = [];
    const seen = new Set();

    for (const seed of SEED_TEAMS) {
      if (picks.length >= 12) break;
      const payload = await fetchSportsDb('searchteams.php', { t: seed });
      const teamRaw = Array.isArray(payload?.teams) ? payload.teams[0] : null;
      const mapped = mapTeam(teamRaw);
      if (!mapped) continue;
      if (seen.has(mapped.id)) continue;
      seen.add(mapped.id);
      picks.push(mapped);
    }

    renderTeams(picks, {
      title: 'Featured teams',
      subtitle: 'Tap a team to see details and save it.'
    });
  }

  async function searchTeams(query) {
    const trimmed = String(query || '').trim();
    if (!trimmed) {
      await loadFeaturedTeams();
      return;
    }

    setLoading(true, `Searching "${trimmed}"...`);
    const payload = await fetchSportsDb('searchteams.php', { t: trimmed });
    const teams = Array.isArray(payload?.teams) ? payload.teams.map(mapTeam).filter(Boolean) : [];
    renderTeams(teams, {
      title: `Results for "${trimmed}"`,
      subtitle: teams.length ? `${teams.length} teams found` : 'No matching teams yet',
      emptyMessage: 'No teams found. Try another search.'
    });
  }

  async function loadTeamById(teamId) {
    if (!teamId) return false;
    setLoading(true, 'Loading team details...');
    const payload = await fetchSportsDb('lookupteam.php', { id: teamId });
    const teamRaw = Array.isArray(payload?.teams) ? payload.teams[0] : null;
    const team = mapTeam(teamRaw);
    if (!team) {
      setLoading(false);
      return false;
    }
    setHeroTeam(team);
    renderTeams([team], {
      title: 'Team spotlight',
      subtitle: 'Save this team to your profile.',
      keepHero: true
    });
    return true;
  }

  function wireSearch() {
    if (ui.searchInput) {
      ui.searchInput.addEventListener('input', () => {
        window.clearTimeout(state.searchTimer);
        state.searchTimer = window.setTimeout(() => {
          searchTeams(ui.searchInput.value).catch(() => {});
        }, 380);
      });

      ui.searchInput.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        searchTeams(ui.searchInput.value).catch(() => {});
      });
    }

    if (ui.searchBtn) {
      ui.searchBtn.addEventListener('click', () => {
        searchTeams(ui.searchInput?.value || '').catch(() => {});
      });
    }

    if (ui.searchTags) {
      ui.searchTags.querySelectorAll('[data-team]').forEach((button) => {
        button.addEventListener('click', () => {
          const teamName = button.getAttribute('data-team') || '';
          if (ui.searchInput) ui.searchInput.value = teamName;
          searchTeams(teamName).catch(() => {});
        });
      });
    }

    if (ui.heroSave) {
      ui.heroSave.addEventListener('click', () => {
        if (!state.heroTeam) return;
        toggleFavorite(state.heroTeam);
      });
    }
  }

  async function init() {
    await ensureSupabase();
    await initAuth();
    wireSearch();

    const params = new URLSearchParams(window.location.search);
    const teamId = params.get('id');
    const teamName = params.get('team');

    if (teamId) {
      const loaded = await loadTeamById(teamId);
      if (!loaded) {
        await loadFeaturedTeams();
      }
      return;
    }

    if (teamName) {
      if (ui.searchInput) ui.searchInput.value = teamName;
      await searchTeams(teamName);
      return;
    }

    await loadFeaturedTeams();
  }

  init().catch(() => {
    setHeroTeam(null);
  });
})();