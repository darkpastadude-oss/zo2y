(() => {
  const supabaseConfig = window.__ZO2Y_SUPABASE_CONFIG || {};
  const SUPABASE_URL = String(supabaseConfig.url || '').trim() || 'https://gfkhjbztayjyojsgdpgk.supabase.co';
  const SUPABASE_KEY = String(supabaseConfig.key || '').trim();
  const SPORTSDB_KEY = '3';
  const SPORTSDB_BASE = `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_KEY}`;
  const FALLBACK_BADGE = '/file.svg';
  const FALLBACK_IMAGE = '/newlogo.webp';

  const state = {
    supabase: null,
    currentUser: null,
    favorites: new Set(),
    team: null,
    localBadgeMap: {}
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

  const SPORT_BACKGROUNDS = {
    'football': `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400"><defs><radialGradient id="g" cx="50%" cy="50%" r="60%"><stop offset="0%" stop-color="#1e3a5f"/><stop offset="100%" stop-color="#0b1633"/></radialGradient><pattern id="p" width="80" height="80" patternUnits="userSpaceOnUse"><path d="M40 0 L80 40 L40 80 L0 40 Z" fill="none" stroke="#ffffff" stroke-width="1.5" opacity="0.06"/><circle cx="40" cy="40" r="15" fill="none" stroke="#ffffff" stroke-width="1.5" opacity="0.06"/></pattern></defs><rect width="800" height="400" fill="url(#g)"/><rect width="800" height="400" fill="url(#p)"/></svg>`)}`,
    'motorsport': `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#1e3a5f"/><stop offset="100%" stop-color="#0b1633"/></linearGradient><pattern id="p" width="40" height="40" patternUnits="userSpaceOnUse"><rect x="0" y="0" width="20" height="20" fill="#ffffff" opacity="0.04"/><rect x="20" y="20" width="20" height="20" fill="#ffffff" opacity="0.04"/></pattern></defs><rect width="800" height="400" fill="url(#g)"/><rect width="800" height="400" fill="url(#p)"/><line x1="0" y1="200" x2="800" y2="200" stroke="#ffffff" stroke-width="6" opacity="0.08"/><line x1="0" y1="212" x2="800" y2="212" stroke="#ffffff" stroke-width="2" opacity="0.04"/></svg>`)}`,
    'basketball': `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400"><defs><radialGradient id="g" cx="50%" cy="50%" r="60%"><stop offset="0%" stop-color="#1e3a5f"/><stop offset="100%" stop-color="#0b1633"/></radialGradient><pattern id="p" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M0 30 L60 30 M30 0 L30 60" stroke="#ffffff" stroke-width="1" opacity="0.05"/></pattern></defs><rect width="800" height="400" fill="url(#g)"/><rect width="800" height="400" fill="url(#p)"/><circle cx="400" cy="200" r="80" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.06"/></svg>`)}`,
    'american football': `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400"><defs><linearGradient id="g" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#1e3a5f"/><stop offset="100%" stop-color="#0b1633"/></linearGradient><pattern id="p" width="100" height="100" patternUnits="userSpaceOnUse"><line x1="0" y1="50" x2="100" y2="50" stroke="#ffffff" stroke-width="1" opacity="0.04"/></pattern></defs><rect width="800" height="400" fill="url(#g)"/><rect width="800" height="400" fill="url(#p)"/></svg>`)}`,
    'baseball': `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400"><defs><radialGradient id="g" cx="50%" cy="50%" r="60%"><stop offset="0%" stop-color="#1e3a5f"/><stop offset="100%" stop-color="#0b1633"/></radialGradient><pattern id="p" width="100" height="100" patternUnits="userSpaceOnUse"><path d="M50 0 L100 50 L50 100 L0 50 Z" fill="none" stroke="#ffffff" stroke-width="1" opacity="0.04"/></pattern></defs><rect width="800" height="400" fill="url(#g)"/><rect width="800" height="400" fill="url(#p)"/></svg>`)}`,
    'ice hockey': `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#1e3a5f"/><stop offset="100%" stop-color="#0b1633"/></linearGradient><pattern id="p" width="80" height="80" patternUnits="userSpaceOnUse"><circle cx="40" cy="40" r="20" fill="none" stroke="#ffffff" stroke-width="1" opacity="0.04"/></pattern></defs><rect width="800" height="400" fill="url(#g)"/><rect width="800" height="400" fill="url(#p)"/><line x1="400" y1="0" x2="400" y2="400" stroke="#ffffff" stroke-width="2" opacity="0.06"/></svg>`)}`,
    'mma': `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400"><defs><radialGradient id="g" cx="50%" cy="50%" r="60%"><stop offset="0%" stop-color="#1e3a5f"/><stop offset="100%" stop-color="#0b1633"/></radialGradient><pattern id="p" width="40" height="40" patternUnits="userSpaceOnUse"><rect x="0" y="0" width="40" height="40" fill="none" stroke="#ffffff" stroke-width="1" opacity="0.04"/></pattern></defs><rect width="800" height="400" fill="url(#g)"/><rect width="800" height="400" fill="url(#p)"/></svg>`)}`,
    'boxing': `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400"><defs><radialGradient id="g" cx="50%" cy="50%" r="60%"><stop offset="0%" stop-color="#1e3a5f"/><stop offset="100%" stop-color="#0b1633"/></radialGradient><pattern id="p" width="40" height="40" patternUnits="userSpaceOnUse"><rect x="0" y="0" width="40" height="40" fill="none" stroke="#ffffff" stroke-width="1" opacity="0.04"/></pattern></defs><rect width="800" height="400" fill="url(#g)"/><rect width="800" height="400" fill="url(#p)"/></svg>`)}`,
    'kickboxing': `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400"><defs><radialGradient id="g" cx="50%" cy="50%" r="60%"><stop offset="0%" stop-color="#1e3a5f"/><stop offset="100%" stop-color="#0b1633"/></radialGradient><pattern id="p" width="40" height="40" patternUnits="userSpaceOnUse"><rect x="0" y="0" width="40" height="40" fill="none" stroke="#ffffff" stroke-width="1" opacity="0.04"/></pattern></defs><rect width="800" height="400" fill="url(#g)"/><rect width="800" height="400" fill="url(#p)"/></svg>`)}`,
    'default': `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400"><defs><radialGradient id="g" cx="50%" cy="50%" r="60%"><stop offset="0%" stop-color="#1e3a5f"/><stop offset="100%" stop-color="#0b1633"/></radialGradient></defs><rect width="800" height="400" fill="url(#g)"/></svg>`)}`
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
      .replace(/['']/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
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
      badge: '',
      banner: '',
      fanart: '',
      fanarts: [],
      stadiumThumb: '',
      jersey: '',
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

  function getSportBackground(sport) {
    const norm = String(sport || '').toLowerCase().trim();
    if (norm.includes('football') || norm.includes('soccer')) return SPORT_BACKGROUNDS['football'];
    if (norm.includes('motor') || norm.includes('f1') || norm.includes('racing')) return SPORT_BACKGROUNDS['motorsport'];
    if (norm.includes('basket')) return SPORT_BACKGROUNDS['basketball'];
    if (norm.includes('american') || norm.includes('nfl')) return SPORT_BACKGROUNDS['american football'];
    if (norm.includes('base')) return SPORT_BACKGROUNDS['baseball'];
    if (norm.includes('hockey') || norm.includes('ice')) return SPORT_BACKGROUNDS['ice hockey'];
    if (norm.includes('mma') || norm.includes('ufc')) return SPORT_BACKGROUNDS['mma'];
    if (norm.includes('boxing') || norm.includes('kick')) return SPORT_BACKGROUNDS['boxing'];
    return SPORT_BACKGROUNDS['default'];
  }

  function setHero(team) {
    const bg = getSportBackground(team.sport);
    if (ui.heroMedia) {
      ui.heroMedia.style.setProperty('--hero-bg', `url("${bg}")`);
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

  async function fetchSportsDB(endpoint, params = {}, timeoutMs = 10000) {
    const url = new URL(`${SPORTSDB_BASE}/${endpoint}`);
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        url.searchParams.set(key, value);
      }
    });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url.toString(), {
        headers: { Accept: 'application/json' },
        signal: controller.signal
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (_err) {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  async function fetchWikipedia(teamName) {
    try {
      const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(teamName + ' football club')}&format=json&origin=*`;
      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json();
      const results = searchData?.query?.search || [];
      if (!results.length) return null;

      const title = results[0].title;
      const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
      const summaryRes = await fetch(summaryUrl);
      const summaryData = await summaryRes.json();

      return {
        title: summaryData.title || title,
        description: summaryData.extract || '',
        thumbnail: summaryData.thumbnail?.source || '',
        url: summaryData.content_urls?.desktop?.page || ''
      };
    } catch (_err) {
      return null;
    }
  }

  async function loadLocalManifest() {
    try {
      const res = await fetch('/assets/sports-badges/local-manifest.json', { cache: 'force-cache' });
      if (!res.ok) return;
      state.localBadgeMap = await res.json();
    } catch (_err) {
      state.localBadgeMap = {};
    }
  }

  function getLocalBadge(teamName) {
    if (!teamName) return '';
    const nameKey = teamName.toLowerCase().trim();
    if (state.localBadgeMap[teamName]) return state.localBadgeMap[teamName];
    if (state.localBadgeMap[nameKey]) return state.localBadgeMap[nameKey];
    return '';
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

    await loadLocalManifest();

    let localTeam = null;
    let remoteTeam = null;

    // Get local badge from manifest
    const localBadge = getLocalBadge(teamName);

    // Try to get from Supabase first
    if (state.supabase && teamName) {
      try {
        const { data } = await state.supabase
          .from('teams')
          .select('*')
          .ilike('name', teamName)
          .limit(1)
          .maybeSingle();

        if (data) {
          localTeam = {
            id: data.id || teamName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            name: data.name || teamName,
            sport: data.sport || teamSport || '',
            league: data.league || teamLeague || '',
            country: teamCountry || '',
            formedYear: '',
            stadium: data.stadium || '',
            stadiumLocation: '',
            stadiumCapacity: '',
            description: '',
            badge: localBadge || data.logo_url || '',
            banner: data.banner_url || '',
            fanart: data.fanart_url || '',
            fanarts: [],
            stadiumThumb: data.stadium_url || '',
            jersey: data.jersey_url || '',
            website: '',
            facebook: '',
            twitter: '',
            instagram: ''
          };
        }
      } catch (_err) {
        console.warn('Failed to load from Supabase:', _err);
      }
    }

    // Fallback if no Supabase data
    if (!localTeam && teamName) {
      localTeam = {
        id: teamName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        name: teamName,
        sport: teamSport || 'Football',
        league: teamLeague || '',
        country: teamCountry || '',
        formedYear: '',
        stadium: '',
        stadiumLocation: '',
        stadiumCapacity: '',
        description: '',
        badge: localBadge || '',
        banner: '',
        fanart: '',
        fanarts: [],
        stadiumThumb: '',
        jersey: '',
        website: '',
        facebook: '',
        twitter: '',
        instagram: ''
      };
    }

    // Try TheSportsDB for TEXT data only (country, formed, stadium, capacity, description, social)
    // NEVER use images from TheSportsDB - they are often wrong
    if (teamName) {
      let payload = null;

      if (teamId) {
        payload = await fetchSportsDB('lookupteam.php', { id: teamId });
      }

      if (!payload?.teams?.length) {
        payload = await fetchSportsDB('searchteams.php', { t: teamName });
      }

      const teams = Array.isArray(payload?.teams) ? payload.teams : [];
      if (teams.length) {
        const best = pickBestTeamMatch(teams, criteria);
        const mapped = mapTeam(best || teams[0]);
        // Only use remote TEXT data, NEVER images
        remoteTeam = {
          id: localTeam?.id || mapped.id,
          name: localTeam?.name || mapped.name,
          sport: localTeam?.sport || mapped.sport,
          league: localTeam?.league || mapped.league,
          country: mapped.country || localTeam?.country || '',
          formedYear: mapped.formedYear || '',
          stadium: localTeam?.stadium || mapped.stadium,
          stadiumLocation: mapped.stadiumLocation || '',
          stadiumCapacity: mapped.stadiumCapacity || '',
          description: mapped.description || '',
          badge: localTeam?.badge || '',
          banner: '',
          fanart: '',
          fanarts: [],
          stadiumThumb: '',
          jersey: '',
          website: mapped.website || '',
          facebook: mapped.facebook || '',
          twitter: mapped.twitter || '',
          instagram: mapped.instagram || ''
        };
      }
    }

    // Try Wikipedia for description only (NOT for images)
    if (!remoteTeam?.description && teamName) {
      const wikiData = await fetchWikipedia(teamName);
      if (wikiData) {
        remoteTeam = remoteTeam || { ...localTeam };
        remoteTeam.description = wikiData.description || remoteTeam.description;
        if (!remoteTeam.website && wikiData.url) remoteTeam.website = wikiData.url;
      }
    }

    // Use remote data if available, otherwise local
    const team = remoteTeam || localTeam;

    if (!team) {
      if (ui.name) ui.name.textContent = 'Team not found';
      if (ui.meta) ui.meta.textContent = 'Try searching again.';
      if (ui.description) ui.description.textContent = 'No team data was found for this request.';
      if (ui.saveBtn) ui.saveBtn.disabled = true;
      return;
    }

    state.team = team;
    setHero(team);

    // Save enriched data back to Supabase
    if (state.supabase && remoteTeam) {
      try {
        await state.supabase
          .from('teams')
          .upsert({
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
          }, { onConflict: 'id' });
      } catch (_err) {
        console.warn('Failed to save team data:', _err);
      }
    }

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
