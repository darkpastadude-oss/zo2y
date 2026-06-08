(() => {
  const supabaseConfig = window.__ZO2Y_SUPABASE_CONFIG || {};
  const SUPABASE_URL = String(supabaseConfig.url || '').trim() || '__SUPABASE_URL__';
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
    localBadgeMap: {},
    roster: [],
    related: []
  };

  const ui = {
    body: document.body,
    hero: document.getElementById('teamHero'),
    backdrop: document.getElementById('teamBackdrop'),
    backdropBlur: document.getElementById('teamBackdropBlur'),
    heroMedia: document.getElementById('teamHeroMedia'),
    posterFrame: document.getElementById('teamPosterFrame'),
    posterFallbackTitle: document.getElementById('teamPosterFallbackTitle'),
    badge: document.getElementById('teamBadge'),
    name: document.getElementById('teamName'),
    meta: document.getElementById('teamMeta'),
    tags: document.getElementById('teamTags'),
    description: document.getElementById('teamDescription'),
    descriptionToggle: document.getElementById('teamDescriptionToggle'),
    kicker: document.getElementById('teamKicker'),
    saveBtn: document.getElementById('teamSaveBtn'),
    website: document.getElementById('teamWebsite'),
    infoGrid: document.getElementById('teamInfoGrid'),
    league: document.getElementById('teamLeague'),
    sport: document.getElementById('teamSport'),
    country: document.getElementById('teamCountry'),
    formed: document.getElementById('teamFormed'),
    stadium: document.getElementById('teamStadium'),
    stadiumLocation: document.getElementById('teamStadiumLocation'),
    capacity: document.getElementById('teamCapacity'),
    social: document.getElementById('teamSocial'),
    socialSection: document.getElementById('teamSocialSection'),
    mediaGrid: document.getElementById('teamMediaGrid'),
    mediaEmpty: document.getElementById('teamMediaEmpty'),
    mediaSection: document.getElementById('teamMediaSection'),
    roster: document.getElementById('teamRoster'),
    rosterSection: document.getElementById('teamRosterSection'),
    rosterSub: document.getElementById('teamRosterSub'),
    related: document.getElementById('teamRelated'),
    relatedSection: document.getElementById('teamRelatedSection'),
    relatedSub: document.getElementById('teamRelatedSub'),
    trailer: document.getElementById('teamTrailer'),
    trailerSection: document.getElementById('teamTrailerSection'),
    trailerSub: document.getElementById('teamTrailerSub'),
    gallery: document.getElementById('teamGallery'),
    gallerySection: document.getElementById('teamGallerySection'),
    gallerySub: document.getElementById('teamGallerySub'),
    toast: document.getElementById('teamToast'),
    actionCard: document.getElementById('teamActionCard')
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
    ui.toast.classList.toggle('is-error', type === 'error');
    ui.toast.classList.toggle('is-success', type === 'success');
    ui.toast.classList.add('show');
    window.clearTimeout(showToast._timer);
    showToast._timer = window.setTimeout(() => {
      ui.toast.classList.remove('show');
    }, 2400);
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
      else if (teamSport.includes(sportNeedle) || sportNeedle.includes(sportNeedle)) score += 1;
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
      manager: String(raw.strManager || '').trim(),
      badge: '',
      banner: String(raw.strBanner || '').trim(),
      fanart: String(raw.strFanart1 || '').trim(),
      fanarts: [
        String(raw.strFanart1 || '').trim(),
        String(raw.strFanart2 || '').trim(),
        String(raw.strFanart3 || '').trim(),
        String(raw.strFanart4 || '').trim()
      ].filter(Boolean),
      stadiumThumb: String(raw.strStadiumThumb || '').trim(),
      jersey: String(raw.strEquipment || '').trim() || String(raw.strJersey || '').trim(),
      website: normalizeExternalUrl(raw.strWebsite || ''),
      facebook: normalizeExternalUrl(raw.strFacebook || ''),
      twitter: normalizeExternalUrl(raw.strTwitter || ''),
      instagram: normalizeExternalUrl(raw.strInstagram || ''),
      youtube: normalizeExternalUrl(raw.strYoutube || ''),
      raw
    };
  }

  function formatNumber(value) {
    const num = Number(String(value || '').replace(/[^\d]/g, ''));
    if (!Number.isFinite(num) || !num) return '-';
    return num.toLocaleString('en-US');
  }

  function updateSaveButton(isSaved) {
    if (!ui.saveBtn) return;
    ui.saveBtn.classList.toggle('elevated-btn-saved', !!isSaved);
    ui.saveBtn.classList.toggle('elevated-btn-primary', !isSaved);
    const icon = isSaved ? 'fa-solid fa-check' : 'fa-solid fa-bookmark';
    const text = isSaved ? 'saved' : 'add to list';
    ui.saveBtn.innerHTML = `<i class="${icon}"></i><span>${text}</span>`;
    ui.saveBtn.setAttribute('aria-pressed', isSaved ? 'true' : 'false');
  }

  function openListMenuFromCard() {
    if (ui.actionCard && window.openIndexStyleListMenu) {
      window.openIndexStyleListMenu(ui.actionCard);
    }
  }

  function initMenuBridge() {
    if (typeof window.initIndexStyleListMenu !== 'function') return;
    window.initIndexStyleListMenu({
      mediaType: 'team',
      getCurrentUser: () => state.currentUser,
      ensureClient: ensureSupabase,
      toggleDefaultList,
      notify: (message, isError) => showToast(message, isError ? 'error' : 'success')
    });
    if (window.ListUtils && typeof window.ListUtils.bindGlobalListUx === 'function') {
      window.ListUtils.bindGlobalListUx();
    }
  }

  function setFallbackInitial(initial) {
    if (ui.posterFrame) {
      ui.posterFrame.style.setProperty('--dt-fallback-initial', JSON.stringify(String(initial || 'T').toUpperCase()));
    }
  }

  function applyBackdrop(url) {
    if (!url) return;
    const safeUrl = String(url).replace(/"/g, '\\"');
    const style = `url("${safeUrl}") center 20% / cover no-repeat`;
    if (ui.backdrop) {
      ui.backdrop.style.background = style;
    }
    if (ui.backdropBlur) {
      ui.backdropBlur.style.background = style;
    }
    const wc = window.__zo2yWikiCache;
    if (wc && typeof wc.preloadImage === 'function') {
      try { wc.preloadImage(url); } catch (_) {}
    }
    if (ui.hero) {
      ui.hero.classList.remove('is-no-backdrop');
      ui.hero.classList.add('is-loaded');
    }
  }

  function applySportFallbackBackground(sport) {
    const bg = SPORT_BACKGROUNDS[getSportKey(sport)] || SPORT_BACKGROUNDS.default;
    const safeUrl = String(bg).replace(/"/g, '\\"');
    const style = `url("${safeUrl}") center / cover no-repeat`;
    if (ui.backdrop) {
      ui.backdrop.style.background = style;
      ui.backdrop.style.opacity = '0.7';
    }
    if (ui.backdropBlur) {
      ui.backdropBlur.style.background = style;
    }
    if (ui.hero) {
      ui.hero.classList.remove('is-no-backdrop');
      ui.hero.classList.add('is-loaded');
    }
  }

  function getSportKey(sport) {
    const norm = String(sport || '').toLowerCase().trim();
    if (norm.includes('football') || norm.includes('soccer')) return 'football';
    if (norm.includes('motor') || norm.includes('f1') || norm.includes('racing')) return 'motorsport';
    if (norm.includes('basket')) return 'basketball';
    if (norm.includes('american') || norm.includes('nfl')) return 'american football';
    if (norm.includes('base')) return 'baseball';
    if (norm.includes('hockey') || norm.includes('ice')) return 'ice hockey';
    if (norm.includes('mma') || norm.includes('ufc')) return 'mma';
    if (norm.includes('boxing') || norm.includes('kick')) return 'boxing';
    return 'default';
  }

  function getSportIcon(sport) {
    const norm = String(sport || '').toLowerCase().trim();
    if (norm.includes('football') || norm.includes('soccer')) return 'fa-futbol';
    if (norm.includes('motor') || norm.includes('f1') || norm.includes('racing')) return 'fa-flag-checkered';
    if (norm.includes('basket')) return 'fa-basketball';
    if (norm.includes('american') || norm.includes('nfl')) return 'fa-football';
    if (norm.includes('base')) return 'fa-baseball';
    if (norm.includes('hockey') || norm.includes('ice')) return 'fa-hockey-puck';
    if (norm.includes('mma') || norm.includes('ufc')) return 'fa-user-ninja';
    if (norm.includes('boxing') || norm.includes('kick')) return 'fa-mitten';
    return 'fa-trophy';
  }

  function applyCollageFallback(team) {
    if (!ui.hero) return;
    ui.hero.classList.add('is-collage');
    let collage = ui.hero.querySelector('.elevated-hero-collage');
    if (!collage) {
      collage = document.createElement('div');
      collage.className = 'elevated-hero-collage';
      ui.hero.insertBefore(collage, ui.hero.firstChild);
    }
    let track = collage.querySelector('.elevated-hero-collage-track');
    if (!track) {
      track = document.createElement('div');
      track.className = 'elevated-hero-collage-track';
      collage.appendChild(track);
    }
    const logoUrl = team.badge || FALLBACK_BADGE;
    track.innerHTML = '';
    for (let i = 0; i < 36; i++) {
      const item = document.createElement('div');
      item.className = 'elevated-hero-collage-item';
      item.style.backgroundImage = `url("${logoUrl}")`;
      track.appendChild(item);
    }
  }

  function bindClampedDescription(pEl, wrapEl, toggleEl) {
    if (!pEl || !wrapEl) return;
    const labelEl = toggleEl ? toggleEl.querySelector('.elevated-readmore-label') : null;
    const apply = () => {
      const overflows = pEl.scrollHeight - pEl.clientHeight > 4;
      if (overflows) {
        pEl.classList.add('is-clamped');
        wrapEl.classList.add('is-clamped');
        if (toggleEl) {
          toggleEl.style.display = '';
          toggleEl.setAttribute('aria-expanded', 'false');
        }
        if (labelEl) labelEl.textContent = 'read more';
      } else {
        pEl.classList.remove('is-clamped');
        wrapEl.classList.remove('is-clamped');
        if (toggleEl) toggleEl.style.display = 'none';
      }
    };
    requestAnimationFrame(apply);
    window.addEventListener('resize', apply);
    if (toggleEl) {
      toggleEl.addEventListener('click', () => {
        const expanded = toggleEl.getAttribute('aria-expanded') === 'true';
        const next = !expanded;
        toggleEl.setAttribute('aria-expanded', next ? 'true' : 'false');
        pEl.classList.toggle('is-clamped', !next);
        wrapEl.classList.toggle('is-clamped', !next);
        if (labelEl) labelEl.textContent = next ? 'read less' : 'read more';
      });
    }
  }

  function renderInfoGrid(team) {
    if (!ui.infoGrid) return;
    const cards = [];
    if (team.league) {
      cards.push({ icon: 'fa-trophy', label: 'League', value: escapeHtml(team.league) });
    }
    if (team.sport) {
      cards.push({ icon: getSportIcon(team.sport), label: 'Sport', value: escapeHtml(team.sport) });
    }
    if (team.country) {
      cards.push({ icon: 'fa-flag', label: 'Country', value: escapeHtml(team.country) });
    }
    if (team.formedYear) {
      cards.push({ icon: 'fa-calendar', label: 'Founded', value: escapeHtml(team.formedYear) });
    }
    if (team.stadium) {
      cards.push({ icon: 'fa-building', label: 'Stadium', value: escapeHtml(team.stadium) });
    }
    if (team.stadiumLocation) {
      cards.push({ icon: 'fa-location-dot', label: 'Stadium location', value: escapeHtml(team.stadiumLocation) });
    }
    if (team.stadiumCapacity) {
      cards.push({ icon: 'fa-people-group', label: 'Capacity', value: formatNumber(team.stadiumCapacity) });
    }
    if (team.manager) {
      cards.push({ icon: 'fa-whistle', label: 'Manager', value: escapeHtml(team.manager) });
    }
    if (team.website) {
      cards.push({ icon: 'fa-globe', label: 'Website', value: `<a href="${escapeHtml(team.website)}" target="_blank" rel="noopener">${escapeHtml(team.website.replace(/^https?:\/\//, ''))}</a>` });
    }

    if (!cards.length) {
      ui.infoGrid.innerHTML = `
        <div class="elevated-detail-card">
          <span class="elevated-detail-title"><i class="fa-solid fa-circle-info"></i> Status</span>
          <span class="elevated-detail-value">No additional details available yet.</span>
        </div>
      `;
      return;
    }
    ui.infoGrid.innerHTML = cards.map((c) => `
      <div class="elevated-detail-card">
        <span class="elevated-detail-title"><i class="fa-solid ${c.icon}"></i> ${escapeHtml(c.label)}</span>
        <span class="elevated-detail-value">${c.value}</span>
      </div>
    `).join('');
  }

  function renderTags(team) {
    if (!ui.tags) return;
    const list = [];
    if (team.league) list.push(team.league);
    if (team.sport) list.push(team.sport);
    if (team.country) list.push(team.country);
    if (!list.length) {
      ui.tags.innerHTML = '';
      return;
    }
    ui.tags.innerHTML = list.map((t) => `<span class="elevated-tag">${escapeHtml(t)}</span>`).join('');
  }

  function renderSocialLinks(team) {
    if (!ui.social || !ui.socialSection) return;
    const links = [];
    if (team.website) links.push({ href: team.website, icon: 'fa-globe', label: 'Website' });
    if (team.facebook) links.push({ href: team.facebook, icon: 'fa-facebook', label: 'Facebook' });
    if (team.twitter) links.push({ href: team.twitter, icon: 'fa-twitter', label: 'Twitter' });
    if (team.instagram) links.push({ href: team.instagram, icon: 'fa-instagram', label: 'Instagram' });
    if (team.youtube) links.push({ href: team.youtube, icon: 'fa-youtube', label: 'YouTube' });

    if (!links.length) {
      ui.socialSection.hidden = true;
      return;
    }
    ui.socialSection.hidden = false;
    ui.social.innerHTML = links.map((link) => `
      <a href="${escapeHtml(link.href)}" target="_blank" rel="noopener">
        <i class="fa-brands ${escapeHtml(link.icon)}"></i>
        <span>${escapeHtml(link.label)}</span>
      </a>
    `).join('');
  }

  function renderMedia(team) {
    if (!ui.mediaGrid || !ui.mediaEmpty) return;
    const items = [];
    const seen = new Set();
    const addMedia = (url, contain = false, label = '') => {
      const safeUrl = String(url || '').trim();
      if (!safeUrl || seen.has(safeUrl)) return;
      seen.add(safeUrl);
      items.push({ url: safeUrl, contain, label });
    };

    addMedia(team.fanart, false, 'Fanart');
    (team.fanarts || []).slice(1).forEach((url) => addMedia(url, false, 'Fanart'));
    addMedia(team.stadiumThumb, false, 'Stadium');
    addMedia(team.banner, true, 'Banner');
    addMedia(team.jersey, true, 'Kit');
    addMedia(team.badge, true, 'Badge');

    ui.mediaGrid.innerHTML = '';
    if (!items.length) {
      ui.mediaEmpty.hidden = false;
      return;
    }
    ui.mediaEmpty.hidden = true;
    const fragment = document.createDocumentFragment();
    items.forEach((item) => {
      const card = document.createElement('div');
      card.className = `elevated-media-item${item.contain ? ' contain' : ''}`;
      card.innerHTML = `<img src="${escapeHtml(item.url)}" alt="${escapeHtml(item.label || 'Team media')}" loading="lazy" onerror="this.onerror=null;this.src='${FALLBACK_IMAGE}';" />${item.label ? `<span class="elevated-media-label">${escapeHtml(item.label)}</span>` : ''}`;
      fragment.appendChild(card);
    });
    ui.mediaGrid.appendChild(fragment);
  }

  function extractRoster(raw) {
    if (!raw || typeof raw !== 'object') return [];
    const players = [];
    for (let i = 1; i <= 11; i += 1) {
      const nameKey = `strPlayer${i}`;
      const posKey = `strPosition${i}`;
      const numKey = `strNumber${i}`;
      const name = String(raw[nameKey] || '').trim();
      if (!name) continue;
      const position = String(raw[posKey] || '').trim();
      const number = String(raw[numKey] || '').trim();
      const thumb = String(raw[`strThumb${i}`] || '').trim() || String(raw.strThumb || '').trim();
      const id = String(raw[`idPlayer${i}`] || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
      players.push({
        id,
        name,
        position: position || 'Player',
        number: number || '',
        thumb
      });
    }
    return players;
  }

  function renderRoster() {
    if (!ui.roster || !ui.rosterSection) return;
    if (!state.roster.length) {
      ui.rosterSection.hidden = true;
      return;
    }
    ui.rosterSection.hidden = false;
    if (ui.rosterSub) {
      ui.rosterSub.textContent = `${state.roster.length} player${state.roster.length === 1 ? '' : 's'} on the roster`;
    }
    ui.roster.innerHTML = state.roster.slice(0, 16).map((p) => {
      const initials = (p.name || 'P').split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0]).join('').toUpperCase();
      const sub = [p.number && `#${p.number}`, p.position].filter(Boolean).join(' \u00B7 ');
      const thumb = p.thumb;
      return `
        <div class="elevated-person-card" title="${escapeHtml(p.name)}">
          <span class="elevated-person-avatar">
            ${thumb ? `<img src="${escapeHtml(thumb)}" alt="${escapeHtml(p.name)}" loading="lazy" onerror="this.outerHTML='<i class=\'fa-solid fa-user\' style=\'color:var(--dt-text-3);font-size:1.1rem\'></i>';">` : escapeHtml(initials)}
          </span>
          <span class="elevated-person-body">
            <span class="elevated-person-name">${escapeHtml(p.name)}</span>
            <span class="elevated-person-role">${escapeHtml(sub)}</span>
          </span>
        </div>
      `;
    }).join('');
  }

  function renderRelated() {
    if (!ui.related || !ui.relatedSection) return;
    if (!state.related.length) {
      ui.relatedSection.hidden = true;
      return;
    }
    ui.relatedSection.hidden = false;
    ui.related.innerHTML = state.related.slice(0, 6).map((team) => {
      const sub = [team.league, team.sport].filter(Boolean).join(' \u00B7 ') || 'Team';
      const hrefParams = new URLSearchParams();
      hrefParams.set('team', team.name);
      if (team.league) hrefParams.set('league', team.league);
      if (team.sport) hrefParams.set('sport', team.sport);
      if (team.country) hrefParams.set('country', team.country);
      return `
        <a class="elevated-related-card" href="team.html?${hrefParams.toString()}">
          <span class="elevated-related-thumb">
            ${team.badge ? `<img src="${escapeHtml(team.badge)}" alt="${escapeHtml(team.name)}" loading="lazy" onerror="this.outerHTML='<i class=\\'fa-solid fa-shield-halved\\' style=\\'color:var(--dt-text-3);font-size:1.2rem\\'></i>';">` : `<i class="fa-solid ${getSportIcon(team.sport)}" style="color:var(--dt-text-3);font-size:1rem"></i>`}
          </span>
          <span class="elevated-related-body">
            <span class="elevated-related-name">${escapeHtml(team.name)}</span>
            <span class="elevated-related-meta">${escapeHtml(sub)}</span>
          </span>
        </a>
      `;
    }).join('');
  }

  async function fetchRelatedTeams(team) {
    if (!team?.sport) {
      state.related = [];
      return;
    }
    const supabase = state.supabase;
    if (!supabase) return;
    try {
      let query = supabase
        .from('teams')
        .select('id,name,sport,league,logo_url')
        .ilike('sport', team.sport)
        .neq('id', team.id);
      if (team.league) {
        query = query.ilike('league', team.league);
      }
      const { data, error } = await query.limit(8);
      if (error || !data || !data.length) {
        state.related = [];
        return;
      }
      state.related = data.map((row) => ({
        id: row.id,
        name: row.name,
        sport: row.sport || team.sport,
        league: row.league || '',
        badge: row.logo_url || ''
      }));
    } catch (_err) {
      state.related = [];
    }
  }

  function searchYouTubeForTeam(query) {
    if (!query) return null;
    try {
      const q = encodeURIComponent(String(query));
      return `https://www.youtube.com/results?search_query=${q}`;
    } catch (_e) { return null; }
  }

  function loadTeamTrailer(team) {
    if (!ui.trailer || !ui.trailerSection) return;
    if (!team || !team.name) {
      ui.trailerSection.hidden = true;
      return;
    }
    const sport = team.sport ? ` ${team.sport}` : '';
    const query = `${team.name}${sport} highlights`.trim();
    const searchUrl = searchYouTubeForTeam(query);
    if (ui.trailerSub) ui.trailerSub.textContent = `Watch highlights and videos of ${team.name}`;
    ui.trailerSection.hidden = false;
    ui.trailer.innerHTML = `
      <div class="elevated-trailer-empty">
        <i class="fa-brands fa-youtube"></i>
        <span>no embedded video available for this team</span>
        <a class="elevated-trailer-cta" href="${escapeHtml(searchUrl || '#')}" target="_blank" rel="noopener">
          <i class="fa-solid fa-arrow-up-right-from-square"></i> search youtube
        </a>
      </div>
    `;
  }

  function loadTeamGallery(team) {
    if (!ui.gallery || !ui.gallerySection) return;
    if (!team || !team.name) {
      ui.gallerySection.hidden = true;
      return;
    }
    const images = [];
    const seen = new Set();
    const pushImage = (src, caption) => {
      if (!src || seen.has(src)) return;
      seen.add(src);
      images.push({ src, caption });
    };
    // 1) Real photo (stadium, players, kit) from Wikipedia page images
    if (team.wikiPhoto) pushImage(team.wikiPhoto, 'stadium');
    // 2) Wikipedia hero image — often the lead photo
    if (team.wikiHero) pushImage(team.wikiHero, team.name);
    // 3) Existing media from TheSportsDB
    if (team.fanart) pushImage(team.fanart, team.name);
    if (team.banner) pushImage(team.banner, team.name);
    if (team.stadiumThumb) pushImage(team.stadiumThumb, 'stadium');
    if (team.jersey) pushImage(team.jersey, 'kit');
    // 4) Team badge / crest as last fallback
    if (team.badge) pushImage(team.badge, 'crest');

    // 5) Fetch extra photos from the Wikipedia page
    if (team.wikiTitle) {
      const imagesUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(team.wikiTitle)}&prop=images&imlimit=30&format=json&origin=*`;
      fetch(imagesUrl)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!data || !data.query || !data.query.pages) return;
          const pages = Object.values(data.query.pages);
          const titles = [];
          pages.forEach((p) => (p.images || []).forEach((img) => titles.push(img.title || '')));
          const SKIP = /logo|icon|wordmark|seal|flag|svg|map\s*of|locator|wikidata|comm\.svg|coat|emblem/i;
          const candidates = titles.filter((t) => /\.(jpg|jpeg|JPG|JPEG|webp|WEBP)$/i.test(t) && !SKIP.test(t));
          const slice = candidates.slice(0, 8);
          if (!slice.length) return;
          return fetch(
            `https://en.wikipedia.org/w/api.php?action=query&titles=${slice.map(encodeURIComponent).join('|')}&prop=imageinfo&iiprop=url|size&iiurlwidth=1200&format=json&origin=*`
          );
        })
        .then((r) => (r && r.ok ? r.json() : null))
        .then((urlsData) => {
          if (!urlsData || !urlsData.query || !urlsData.query.pages) return;
          const urlPages = Object.values(urlsData.query.pages);
          urlPages.forEach((p) => {
            const info = p.imageinfo && p.imageinfo[0];
            if (info && info.url && info.width >= 400) {
              pushImage(info.url, p.title ? p.title.replace(/^File:/, '').replace(/\.[^.]+$/, '') : team.name);
            }
          });
          if (!images.length) return;
          ui.gallery.innerHTML = images.slice(0, 12).map((img) => `
            <figure class="elevated-gallery-item">
              <img src="${escapeHtml(img.src)}" alt="${escapeHtml(img.caption || team.name)}" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.parentElement.remove();" />
              ${img.caption ? `<figcaption class="elevated-gallery-item-caption">${escapeHtml(img.caption)}</figcaption>` : ''}
            </figure>
          `).join('');
        })
        .catch(() => {});
    }
    if (ui.gallerySub) ui.gallerySub.textContent = `Photos and visuals of ${team.name}`;
    ui.gallerySection.hidden = false;
    if (!images.length) {
      ui.gallery.innerHTML = `
        <div class="elevated-gallery-empty">
          <i class="fa-regular fa-image"></i>
          no photos available for this team yet
        </div>
      `;
      return;
    }
    ui.gallery.innerHTML = images.slice(0, 12).map((img) => `
      <figure class="elevated-gallery-item">
        <img src="${escapeHtml(img.src)}" alt="${escapeHtml(img.caption || team.name)}" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.parentElement.remove();" />
        ${img.caption ? `<figcaption class="elevated-gallery-item-caption">${escapeHtml(img.caption)}</figcaption>` : ''}
      </figure>
    `).join('');
  }

  function setHero(team) {
    if (ui.body) ui.body.dataset.elevatedCategory = 'team';
    document.body.dataset.navPage = 'sports';
    document.title = `Zo2y - ${team.name}`;

    const initials = (team.name || 'T').split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0]).join('').toUpperCase();
    setFallbackInitial(initials);
    if (ui.posterFallbackTitle) ui.posterFallbackTitle.textContent = team.name;

    if (ui.badge) {
      const badgeSources = [team.badge, team.logo_url].filter(Boolean);
      if (badgeSources.length) {
        ui.badge.src = badgeSources[0];
        ui.badge.alt = `${team.name} badge`;
        ui.badge.onerror = () => {
          // try next source, else show fallback
          const currentIdx = badgeSources.indexOf(ui.badge.src);
          if (currentIdx >= 0 && currentIdx < badgeSources.length - 1) {
            ui.badge.src = badgeSources[currentIdx + 1];
            return;
          }
          ui.badge.onerror = null;
          ui.badge.src = FALLBACK_BADGE;
          ui.posterFrame?.classList.add('is-missing');
        };
        ui.posterFrame?.classList.remove('is-missing');
      } else {
        ui.badge.src = FALLBACK_BADGE;
        ui.posterFrame?.classList.add('is-missing');
      }
    }

    if (ui.name) ui.name.textContent = team.name;

    const metaItems = [];
    if (team.league) metaItems.push(`<span class="elevated-meta-item"><i class="fa-solid fa-trophy"></i> ${escapeHtml(team.league)}</span>`);
    if (team.sport) metaItems.push(`<span class="elevated-meta-item"><i class="fa-solid ${getSportIcon(team.sport)}"></i> ${escapeHtml(team.sport)}</span>`);
    if (team.country) metaItems.push(`<span class="elevated-meta-item"><i class="fa-solid fa-flag"></i> ${escapeHtml(team.country)}</span>`);
    if (team.formedYear) metaItems.push(`<span class="elevated-meta-item"><i class="fa-solid fa-calendar"></i> founded ${escapeHtml(team.formedYear)}</span>`);
    if (ui.meta) ui.meta.innerHTML = metaItems.join('');

    renderTags(team);

    if (ui.kicker) ui.kicker.textContent = team.league ? `${team.league} team` : 'team spotlight';

    if (ui.description) {
      ui.description.textContent = team.description || 'No description available yet.';
      bindClampedDescription(ui.description, ui.description?.parentElement, ui.descriptionToggle);
    }

    if (ui.website) {
      if (team.website) {
        ui.website.href = team.website;
        ui.website.style.display = '';
      } else {
        ui.website.style.display = 'none';
      }
    }

    // Populate hidden action card so the list-menu modal can read team data
    if (ui.actionCard) {
      ui.actionCard.setAttribute('data-item-id', team.id || '');
      ui.actionCard.setAttribute('data-title', team.name || '');
      ui.actionCard.setAttribute('data-subtitle', team.league || team.sport || '');
      if (team.badge) ui.actionCard.setAttribute('data-list-image', team.badge);
      const titleEl = ui.actionCard.querySelector('.card-title');
      if (titleEl) titleEl.textContent = team.name || '';
      const metaEl = ui.actionCard.querySelector('.card-meta');
      if (metaEl) metaEl.textContent = team.league || team.sport || '';
      const img = ui.actionCard.querySelector('img');
      if (img && team.badge) img.src = team.badge;
    }

    // Backdrop: prefer real photo (stadium/players/kit), then fanart, then stadium image.
    // Never fall back to the badge/crest — that's the logo tile, not a backdrop.
    const isLogoUrl = (url) => {
      if (!url) return false;
      const u = String(url).toLowerCase();
      return /logo|icon|wordmark|seal|flag|svg|coat|emblem|badge|crest|monogram|trademark/.test(u)
        || /\.(svg)$/i.test(u);
    };
    const pickFirstNonLogo = (...candidates) => {
      for (const c of candidates) {
        if (!c) continue;
        if (Array.isArray(c)) {
          const found = c.find((x) => x && !isLogoUrl(x));
          if (found) return found;
        } else if (!isLogoUrl(c)) {
          return c;
        }
      }
      return null;
    };
    const backdrop = pickFirstNonLogo(
      team.wikiPhoto,
      team.wikiHero,
      team.fanart,
      team.fanarts,
      team.banner,
      team.stadiumThumb,
      team.jersey
    );
    if (backdrop) {
      applyBackdrop(backdrop);
    } else {
      applyCollageFallback(team);
    }

    renderInfoGrid(team);
    renderSocialLinks(team);
    renderMedia(team);
    renderRoster();
    renderRelated();
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

  async function toggleDefaultList({ itemId, listType, nextSaved }) {
    const client = await ensureSupabase();
    if (!client) return false;
    if (!state.currentUser?.id) return false;
    if (!itemId || !listType) return false;
    const isFavorite = String(listType).toLowerCase() === 'favorites';
    if (nextSaved) {
      if (isFavorite) {
        state.favorites.add(itemId);
        return await saveTeam({ id: itemId });
      }
      return true;
    }
    if (isFavorite) {
      state.favorites.delete(itemId);
      return await removeTeam(itemId);
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
        showToast('Removed from favorites.', 'success');
      } else {
        showToast('Unable to remove team.', 'error');
      }
    } else {
      const ok = await saveTeam(state.team);
      if (ok) {
        state.favorites.add(state.team.id);
        showToast('Team saved to your profile.', 'success');
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
    const wc = window.__zo2yWikiCache;
    if (wc) {
      const cached = await wc.getWiki(teamName);
      if (cached) return cached;
    }
    try {
      let title = '';
      // Try just the team name first (works for all sports)
      const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(teamName)}&format=json&origin=*&srlimit=3`;
      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json();
      const results = searchData?.query?.search || [];
      // Pick the best result — prefer exact or close title match
      if (results.length) {
        const normalized = teamName.toLowerCase();
        const exact = results.find((r) => String(r.title || '').toLowerCase() === normalized);
        title = exact ? exact.title : results[0].title;
      }
      // Fallback: try with " football club" if first search found nothing relevant
      if (!title) {
        const fbUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(teamName + ' football club')}&format=json&origin=*&srlimit=1`;
        const fbRes = await fetch(fbUrl);
        const fbData = await fbRes.json();
        const fbResults = fbData?.query?.search || [];
        if (fbResults.length) title = fbResults[0].title;
      }
      if (!title) return null;
      const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
      const summaryRes = await fetch(summaryUrl);
      const summaryData = await summaryRes.json();

      // Try to find a "logo" image from Wikipedia page images
      let logoImage = '';
      try {
        const pageImagesUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&piprop=original|thumbnail&pithumbsize=400&format=json&origin=*`;
        const piRes = await fetch(pageImagesUrl);
        if (piRes.ok) {
          const piData = await piRes.json();
          const pages = piData?.query?.pages ? Object.values(piData.query.pages) : [];
          pages.forEach((p) => {
            if (!logoImage && p.original && p.original.source) logoImage = p.original.source;
          });
        }
      } catch (_e) {}

      // Look for a real photo (stadium, players, kit) from the page's image list
      let photoImage = '';
      try {
        const imagesRes = await fetch(
          `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=images&imlimit=40&format=json&origin=*`
        );
        if (imagesRes.ok) {
          const imagesData = await imagesRes.json();
          const pages = imagesData?.query?.pages ? Object.values(imagesData.query.pages) : [];
          const titles = [];
          pages.forEach((p) => (p.images || []).forEach((img) => titles.push(img.title || '')));
          // Filter out logos, icons, wordmarks, and also buildings/people/executives
          // so we prefer stadium shots, team photos, kits, and action shots.
          const SKIP = /logo|icon|wordmark|seal|flag|svg|map\s*of|locator|wikidata|comm\.svg|coat|emblem|building|headquarters|factory|office|person|people|ceo|founder|portrait|signature|trademark|monogram|badge|crest|chart|graph|diagram/i;
          const candidates = titles.filter((t) => /\.(jpg|jpeg|JPG|JPEG|webp|WEBP)$/i.test(t) && !SKIP.test(t));
          // Boost stadium/team/kit/player photos to the top
          const PRODUCT_BOOST = /stadium|arena|ground|pitch|field|court|kit|jersey|shirt|uniform|players?|team|lineup|squad|training|match|game|action|celebration|trophy|\b\d{4}\b/i;
          const ranked = candidates.slice().sort((a, b) => {
            const aScore = PRODUCT_BOOST.test(a) ? 0 : 1;
            const bScore = PRODUCT_BOOST.test(b) ? 0 : 1;
            return aScore - bScore;
          });
          const slice = ranked.slice(0, 8);
          if (slice.length) {
            const urlsRes = await fetch(
              `https://en.wikipedia.org/w/api.php?action=query&titles=${slice.map(encodeURIComponent).join('|')}&prop=imageinfo&iiprop=url|size&iiurlwidth=1600&format=json&origin=*`
            );
            if (urlsRes.ok) {
              const urlsData = await urlsRes.json();
              const urlPages = urlsData?.query?.pages ? Object.values(urlsData.query.pages) : [];
              for (const p of urlPages) {
                const info = p.imageinfo && p.imageinfo[0];
                if (info && info.url && info.width >= 400) {
                  photoImage = info.url;
                  break;
                }
              }
            }
          }
        }
      } catch (_e) { /* photo lookup is best-effort */ }

      const result = {
        title: summaryData.title || title,
        description: summaryData.extract || '',
        thumbnail: summaryData.thumbnail?.source || '',
        heroImage: summaryData.originalimage?.source || summaryData.thumbnail?.source || '',
        photoImage,
        logoImage,
        url: summaryData.content_urls?.desktop?.page || '',
        wikiSource: title
      };
      if (wc) wc.setWiki(teamName, result);
      return result;
    } catch (_err) {
      if (wc) wc.setWiki(teamName, null);
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

    const localBadge = getLocalBadge(teamName);

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
            instagram: '',
            youtube: '',
            manager: ''
          };
        }
      } catch (_err) {
        console.warn('Failed to load from Supabase:', _err);
      }
    }

    if (!localTeam && teamName) {
      let fallbackId = teamName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      let fallbackSport = teamSport || 'Football';
      let fallbackLeague = teamLeague || '';
      if (state.supabase) {
        try {
          const { data: existing } = await state.supabase
            .from('teams')
            .select('id,sport,league')
            .ilike('name', teamName)
            .limit(1)
            .maybeSingle();
          if (existing) {
            fallbackId = existing.id || fallbackId;
            fallbackSport = existing.sport || fallbackSport;
            fallbackLeague = existing.league || fallbackLeague;
          }
        } catch (_) {}
      }
      localTeam = {
        id: fallbackId,
        name: teamName,
        sport: fallbackSport,
        league: fallbackLeague,
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
        instagram: '',
        youtube: '',
        manager: ''
      };
    }

    // TheSportsDB â€” fetch full data including images
    let sportsdbRaw = null;
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
        sportsdbRaw = best || teams[0];
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
          manager: mapped.manager || '',
          badge: localTeam?.badge || mapped.badge,
          banner: mapped.banner,
          fanart: mapped.fanart,
          fanarts: mapped.fanarts,
          stadiumThumb: mapped.stadiumThumb,
          jersey: mapped.jersey,
          website: mapped.website || '',
          facebook: mapped.facebook || '',
          twitter: mapped.twitter || '',
          instagram: mapped.instagram || '',
          youtube: mapped.youtube || ''
        };
      }
    }

    // Wikipedia for description + logo + cover
    if ((!remoteTeam?.description || remoteTeam.description.length < 80) && teamName) {
      const wikiData = await fetchWikipedia(teamName);
      if (wikiData) {
        remoteTeam = remoteTeam || { ...localTeam };
        if (wikiData.description) {
          remoteTeam.description = remoteTeam.description
            ? `${remoteTeam.description}\n\n${wikiData.description}`
            : wikiData.description;
        }
        if (!remoteTeam.website && wikiData.url) remoteTeam.website = wikiData.url;
        if (wikiData.thumbnail && !remoteTeam.fanart) {
          remoteTeam.fanart = wikiData.thumbnail;
          remoteTeam.fanarts = [wikiData.thumbnail];
        }
        if (wikiData.wikiSource) remoteTeam.wikiTitle = wikiData.wikiSource;
        if (wikiData.heroImage) remoteTeam.wikiHero = wikiData.heroImage;
        if (wikiData.photoImage) remoteTeam.wikiPhoto = wikiData.photoImage;
        if (!remoteTeam.fanart && wikiData.heroImage) remoteTeam.fanart = wikiData.heroImage;
        // Wikipedia logo image (or thumbnail) can serve as a fallback badge
        if (!remoteTeam.badge) remoteTeam.badge = wikiData.logoImage || wikiData.thumbnail;
      }
    }

    const team = remoteTeam || localTeam;

    if (!team) {
      if (ui.name) ui.name.textContent = 'Team not found';
      if (ui.meta) ui.meta.innerHTML = '';
      if (ui.description) ui.description.textContent = 'Try searching again.';
      if (ui.saveBtn) ui.saveBtn.disabled = true;
      return;
    }

    state.team = team;
    setHero(team);

    // Extract roster from the raw TheSportsDB payload
    state.roster = extractRoster(sportsdbRaw);
    renderRoster();

    // Related teams (non-blocking)
    fetchRelatedTeams(team).then(() => renderRelated()).catch(() => {});

    // Trailer (YouTube search fallback) + Gallery (team visuals)
    loadTeamTrailer(team);
    loadTeamGallery(team);

    // Save enriched data back to Supabase
    if (state.supabase && remoteTeam) {
      try {
        let saveId = team.id;
        const { data: existingRow } = await state.supabase
          .from('teams')
          .select('id')
          .ilike('name', team.name)
          .limit(1)
          .maybeSingle();
        if (existingRow?.id) saveId = existingRow.id;

        await state.supabase
          .from('teams')
          .upsert({
            id: saveId,
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
    if (ui.body) ui.body.dataset.elevatedCategory = 'team';
    await ensureSupabase();
    await initAuth();
    initMenuBridge();
    if (ui.saveBtn) {
      ui.saveBtn.addEventListener('click', (event) => {
        event.preventDefault();
        openListMenuFromCard();
      });
    }
    await loadTeam();
  }

  init().catch(() => {
    showToast('Unable to load team details.', 'error');
  });
})();
