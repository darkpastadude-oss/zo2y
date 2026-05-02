(() => {
  const supabaseConfig = window.__ZO2Y_SUPABASE_CONFIG || {};
  const SUPABASE_URL = String(supabaseConfig.url || '').trim() || '__SUPABASE_URL__';
  const SUPABASE_KEY = String(supabaseConfig.key || '').trim();
  const SPORTSDB_PROXY_BASE = String(window.ZO2Y_SPORTSDB_PROXY || '/api/sportsdb').trim() || '/api/sportsdb';
  const SPORTSDB_DIRECT_KEY = String(window.ZO2Y_SPORTSDB_KEY || '3').trim() || '3';
  const SPORTSDB_DIRECT_BASE = `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_DIRECT_KEY}`;
  const FALLBACK_BADGE = '/file.svg';
  const FALLBACK_IMAGE = '/newlogo.webp';

  const state = {
    supabase: null,
    currentUser: null,
    favorites: new Set(),
    team: null
  };

  const ui = {
    hero: document.getElementById('teamHero'),
    heroMedia: document.getElementById('teamHeroMedia'),
    badge: document.getElementById('teamBadge'),
    name: document.getElementById('teamName'),
    meta: document.getElementById('teamMeta'),
    kicker: document.getElementById('teamKicker'),
    saveBtn: document.getElementById('teamSaveBtn'),
    website: document.getElementById('teamWebsite'),
    league: document.getElementById('teamLeague'),
    sport: document.getElementById('teamSport'),
    country: document.getElementById('teamCountry'),
    formed: document.getElementById('teamFormed'),
    stadium: document.getElementById('teamStadium'),
    stadiumLocation: document.getElementById('teamStadiumLocation'),
    capacity: document.getElementById('teamCapacity'),
    description: document.getElementById('teamDescription'),
    social: document.getElementById('teamSocial'),
    mediaGrid: document.getElementById('teamMediaGrid'),
    mediaEmpty: document.getElementById('teamMediaEmpty'),
    toast: document.getElementById('teamToast')
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

  function normalizeExternalUrl(url) {
    const text = String(url || '').trim();
    if (!text) return '';
    if (text.startsWith('//')) return `https:${text}`;
    if (/^https?:\/\//i.test(text)) return toHttps(text);
    return `https://${text.replace(/^\/+/, '')}`;
  }

  function normalizeTeamName(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]+/g, '')
      .replace(/['â€™]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function scoreTeamMatch(raw, criteria = {}) {
    if (!raw || typeof raw !== 'object') return -1;
    let score = 0;
    const nameNeedle = normalizeTeamName(criteria.name || '');
    const teamName = normalizeTeamName(raw.strTeam || '');
    if (nameNeedle) {
      if (teamName === nameNeedle) score += 6;
      else if (teamName.includes(nameNeedle) || nameNeedle.includes(teamName)) score += 3;
    }
    const leagueNeedle = normalizeTeamName(criteria.league || '');
    const teamLeague = normalizeTeamName(raw.strLeague || '');
    if (leagueNeedle) {
      if (teamLeague === leagueNeedle) score += 3;
      else if (teamLeague.includes(leagueNeedle) || leagueNeedle.includes(teamLeague)) score += 1;
    }
    const sportNeedle = normalizeTeamName(criteria.sport || '');
    const teamSport = normalizeTeamName(raw.strSport || '');
    if (sportNeedle) {
      if (teamSport === sportNeedle) score += 2;
      else if (teamSport.includes(sportNeedle) || sportNeedle.includes(teamSport)) score += 1;
    }
    const countryNeedle = normalizeTeamName(criteria.country || '');
    const teamCountry = normalizeTeamName(raw.strCountry || '');
    if (countryNeedle) {
      if (teamCountry === countryNeedle) score += 2;
      else if (teamCountry.includes(countryNeedle) || countryNeedle.includes(teamCountry)) score += 1;
    }
    return score;
  }

  function pickBestTeamMatch(teams, criteria) {
    const list = Array.isArray(teams) ? teams : [];
    if (!list.length) return null;
    let best = list[0];
    let bestScore = scoreTeamMatch(best, criteria);
    list.slice(1).forEach((team) => {
      const score = scoreTeamMatch(team, criteria);
      if (score > bestScore) {
        best = team;
        bestScore = score;
      }
    });
    return best;
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

  function resolveSportsDbBase() {
    const prefersDirect = window.ZO2Y_SPORTSDB_DIRECT === true || window.ZO2Y_SPORTSDB_DIRECT === '1';
    const base = prefersDirect ? SPORTSDB_DIRECT_BASE : SPORTSDB_PROXY_BASE;
    if (/^https?:\/\//i.test(base)) return base.replace(/\/+$/, '');
    const prefix = base.startsWith('/') ? '' : '/';
    return `${window.location.origin}${prefix}${base}`.replace(/\/+$/, '');
  }

  async function fetchSportsDb(endpoint, params = {}, timeoutMs = 9000) {
    const path = String(endpoint || '').trim().replace(/^\/+/, '');
    if (!path) return null;
    const url = new URL(`${resolveSportsDbBase()}/${path}`);
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
    return {
      id,
      name,
      sport: String(raw.strSport || '').trim(),
      league: String(raw.strLeague || '').trim(),
      country: String(raw.strCountry || '').trim(),
      formedYear: String(raw.intFormedYear || '').trim(),
      stadium: String(raw.strStadium || '').trim(),
      stadiumLocation: String(raw.strStadiumLocation || '').trim(),
      stadiumCapacity: String(raw.intStadiumCapacity || '').trim(),
      description: String(raw.strDescriptionEN || raw.strDescription || '').trim(),
      badge: toHttps(raw.strBadge || raw.strTeamBadge || raw.strLogo || raw.strTeamLogo || ''),
      banner: toHttps(raw.strBanner || raw.strTeamBanner || ''),
      fanart: [
        raw.strFanart1,
        raw.strFanart2,
        raw.strFanart3,
        raw.strFanart4,
        raw.strTeamFanart1,
        raw.strTeamFanart2,
        raw.strTeamFanart3
      ].map(toHttps).find((value) => value),
      fanarts: [
        raw.strFanart1,
        raw.strFanart2,
        raw.strFanart3,
        raw.strFanart4,
        raw.strTeamFanart1,
        raw.strTeamFanart2,
        raw.strTeamFanart3
      ].map(toHttps).filter(Boolean),
      stadiumThumb: toHttps(raw.strStadiumThumb || ''),
      jersey: toHttps(raw.strEquipment || raw.strTeamJersey || ''),
      website: normalizeExternalUrl(raw.strWebsite || ''),
      facebook: normalizeExternalUrl(raw.strFacebook || ''),
      twitter: normalizeExternalUrl(raw.strTwitter || ''),
      instagram: normalizeExternalUrl(raw.strInstagram || '')
    };
  }

  function formatNumber(value) {
    const num = Number(String(value || '').replace(/[^\d]/g, ''));
    if (!Number.isFinite(num) || !num) return '-';
    return num.toLocaleString('en-US');
  }

  function updateSaveButton(isSaved) {
    if (!ui.saveBtn) return;
    ui.saveBtn.classList.toggle('saved', !!isSaved);
    const icon = isSaved ? 'fa-check' : 'fa-heart';
    const text = isSaved ? 'Saved' : 'Save team';
    ui.saveBtn.innerHTML = `<i class="fas ${icon}"></i><span>${text}</span>`;
    ui.saveBtn.setAttribute('aria-pressed', isSaved ? 'true' : 'false');
  }

  function renderSocialLinks(team) {
    if (!ui.social) return;
    const links = [];
    if (team.website) links.push({ href: team.website, icon: 'fas fa-globe', label: 'Website' });
    if (team.facebook) links.push({ href: team.facebook, icon: 'fab fa-facebook', label: 'Facebook' });
    if (team.twitter) links.push({ href: team.twitter, icon: 'fab fa-twitter', label: 'Twitter' });
    if (team.instagram) links.push({ href: team.instagram, icon: 'fab fa-instagram', label: 'Instagram' });

    if (!links.length) {
      ui.social.innerHTML = '<span class="team-social-empty">No social links available.</span>';
      return;
    }

    ui.social.innerHTML = links.map((link) => `
      <a href="${escapeHtml(link.href)}" target="_blank" rel="noopener">
        <i class="${escapeHtml(link.icon)}"></i>
        <span>${escapeHtml(link.label)}</span>
      </a>
    `).join('');
  }

  function renderMedia(team) {
    if (!ui.mediaGrid || !ui.mediaEmpty) return;
    const mediaItems = [];
    const seen = new Set();
    const addMedia = (url, contain = false) => {
      const safeUrl = String(url || '').trim();
      if (!safeUrl || seen.has(safeUrl)) return;
      seen.add(safeUrl);
      mediaItems.push({ url: safeUrl, contain });
    };

    addMedia(team.fanart, false);
    (team.fanarts || []).forEach((url) => addMedia(url, false));
    addMedia(team.stadiumThumb, false);
    addMedia(team.banner, true);
    addMedia(team.jersey, true);
    addMedia(team.badge, true);

    ui.mediaGrid.innerHTML = '';
    if (!mediaItems.length) {
      ui.mediaEmpty.classList.add('visible');
      return;
    }

    ui.mediaEmpty.classList.remove('visible');
    const fragment = document.createDocumentFragment();
    mediaItems.forEach((item) => {
      const card = document.createElement('div');
      card.className = `team-media-item${item.contain ? ' contain' : ''}`;
      card.innerHTML = `<img src="${escapeHtml(item.url)}" alt="Team media" loading="lazy" onerror="this.onerror=null;this.src='${FALLBACK_IMAGE}';" />`;
      fragment.appendChild(card);
    });
    ui.mediaGrid.appendChild(fragment);
  }

  function setHero(team) {
    const heroImage = team.fanart || team.stadiumThumb || team.banner || FALLBACK_IMAGE;
    if (ui.heroMedia) {
      ui.heroMedia.style.setProperty('--hero-bg', `url("${heroImage}")`);
      ui.heroMedia.style.setProperty('--hero-bg-size', 'cover');
      ui.heroMedia.style.setProperty('--hero-bg-position', 'center');
    }

    if (ui.badge) {
      ui.badge.src = team.badge || FALLBACK_BADGE;
      ui.badge.alt = `${team.name} logo`;
    }

    if (ui.name) ui.name.textContent = team.name;
    if (ui.meta) {
      ui.meta.textContent = [team.league, team.sport].filter(Boolean).join(' | ') || 'Team';
    }

    if (ui.kicker) ui.kicker.textContent = team.league ? `${team.league} team` : 'Team spotlight';
    if (ui.league) ui.league.textContent = team.league || '-';
    if (ui.sport) ui.sport.textContent = team.sport || '-';
    if (ui.country) ui.country.textContent = team.country || '-';
    if (ui.formed) ui.formed.textContent = team.formedYear || '-';
    if (ui.stadium) ui.stadium.textContent = team.stadium || '-';
    if (ui.stadiumLocation) ui.stadiumLocation.textContent = team.stadiumLocation || '-';
    if (ui.capacity) ui.capacity.textContent = formatNumber(team.stadiumCapacity);

    if (ui.website) {
      if (team.website) {
        ui.website.href = team.website;
        ui.website.style.display = '';
      } else {
        ui.website.style.display = 'none';
      }
    }

    if (ui.description) {
      ui.description.textContent = team.description || 'No description available yet.';
    }

    renderSocialLinks(team);
    renderMedia(team);

    document.title = `Zo2y - ${team.name}`;
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
          auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
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
      if (state.currentUser) await loadFavoriteStatus();
      state.supabase.auth.onAuthStateChange((_event, session) => {
        state.currentUser = session?.user || null;
        if (state.currentUser) {
          loadFavoriteStatus().catch(() => {});
        } else {
          state.favorites = new Set();
          updateSaveButton(false);
        }
      });
    } catch (_err) {
      state.currentUser = null;
    }
  }

  async function loadFavoriteStatus() {
    if (!state.supabase || !state.currentUser || !state.team) return;
    const { data, error } = await state.supabase
      .from('user_favorite_teams')
      .select('team_id')
      .eq('user_id', state.currentUser.id)
      .eq('team_id', state.team.id)
      .maybeSingle();

    if (error) return;
    const isSaved = !!data?.team_id;
    state.favorites = new Set(isSaved ? [state.team.id] : []);
    updateSaveButton(isSaved);
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

  async function toggleFavorite() {
    if (!state.team?.id) return;
    if (!state.currentUser) {
      showToast('Sign in to save teams.', 'error');
      return;
    }
    const isSaved = state.favorites.has(state.team.id);
    if (isSaved) {
      const ok = await removeTeam(state.team.id);
      if (ok) {
        state.favorites.delete(state.team.id);
        showToast('Removed from favorites.');
      } else {
        showToast('Unable to remove team.', 'error');
      }
    } else {
      const ok = await saveTeam(state.team);
      if (ok) {
        state.favorites.add(state.team.id);
        showToast('Team saved to your profile.');
      } else {
        showToast('Unable to save team.', 'error');
      }
    }
    updateSaveButton(state.favorites.has(state.team.id));
  }

  async function loadTeam() {
    const params = new URLSearchParams(window.location.search);
    const teamIdRaw = params.get('id');
    const teamId = /^\d+$/.test(String(teamIdRaw || '').trim()) ? String(teamIdRaw || '').trim() : '';
    const teamName = params.get('team');
    const teamLeague = params.get('league');
    const teamSport = params.get('sport');
    const teamCountry = params.get('country');
    const criteria = {
      name: teamName,
      league: teamLeague,
      sport: teamSport,
      country: teamCountry
    };
    let teamRaw = null;

    if (teamId) {
      const payload = await fetchSportsDb('lookupteam.php', { id: teamId });
      teamRaw = Array.isArray(payload?.teams) ? payload.teams[0] : null;
      if (teamRaw && teamName) {
        const queryName = normalizeTeamName(teamName);
        const resultName = normalizeTeamName(teamRaw?.strTeam || '');
        if (queryName && resultName && queryName !== resultName) {
          const fallback = await fetchSportsDb('searchteams.php', { t: teamName });
          const teams = Array.isArray(fallback?.teams) ? fallback.teams : [];
          const best = pickBestTeamMatch(teams, criteria);
          if (best) teamRaw = best;
        }
      }
      if (!teamRaw && teamName) {
        const fallback = await fetchSportsDb('searchteams.php', { t: teamName });
        const teams = Array.isArray(fallback?.teams) ? fallback.teams : [];
        if (teams.length) {
          teamRaw = pickBestTeamMatch(teams, criteria) || teams[0];
        }
      }
    } else if (teamName) {
      const payload = await fetchSportsDb('searchteams.php', { t: teamName });
      const teams = Array.isArray(payload?.teams) ? payload.teams : [];
      if (teams.length) {
        teamRaw = pickBestTeamMatch(teams, criteria) || teams[0];
      }
    }

    const team = mapTeam(teamRaw);
    if (!team) {
      if (ui.name) ui.name.textContent = 'Team not found';
      if (ui.meta) ui.meta.textContent = 'Try searching again.';
      if (ui.description) ui.description.textContent = 'No team data was found for this request.';
      if (ui.saveBtn) ui.saveBtn.disabled = true;
      return;
    }

    state.team = team;
    setHero(team);
    await loadFavoriteStatus();
  }

  async function init() {
    await ensureSupabase();
    await initAuth();
    if (ui.saveBtn) {
      ui.saveBtn.addEventListener('click', () => {
        toggleFavorite().catch(() => {});
      });
    }
    await loadTeam();
  }

  init().catch(() => {
    showToast('Unable to load team details.', 'error');
  });
})();
