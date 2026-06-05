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
    trendingRail: document.getElementById('teamTrendingRail'),
    trendingSection: document.getElementById('teamTrendingSection'),
    trendingSub: document.getElementById('teamTrendingSub'),
    collections: document.getElementById('teamCollections'),
    collectionsSection: document.getElementById('teamCollectionsSection'),
    collectionsSub: document.getElementById('teamCollectionsSub'),
    communityPopular: document.getElementById('teamCommunityPopular'),
    communitySaved: document.getElementById('teamCommunitySaved'),
    communityRecent: document.getElementById('teamCommunityRecent'),
    communitySection: document.getElementById('teamCommunitySection'),
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
    const icon = isSaved ? 'fa-solid fa-check' : 'fa-solid fa-heart';
    const text = isSaved ? 'saved' : 'save team';
    ui.saveBtn.innerHTML = `<i class="${icon}"></i><span>${text}</span>`;
    ui.saveBtn.setAttribute('aria-pressed', isSaved ? 'true' : 'false');
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
      const sub = [p.number && `#${p.number}`, p.position].filter(Boolean).join(' · ');
      const thumb = p.thumb;
      return `
        <div class="elevated-person-card" title="${escapeHtml(p.name)}">
          <span class="elevated-person-avatar">
            ${thumb ? `<img src="${escapeHtml(thumb)}" alt="${escapeHtml(p.name)}" loading="lazy" onerror="this.remove();">` : escapeHtml(initials)}
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
      const sub = [team.league, team.sport].filter(Boolean).join(' · ') || 'Team';
      const hrefParams = new URLSearchParams();
      hrefParams.set('team', team.name);
      if (team.league) hrefParams.set('league', team.league);
      if (team.sport) hrefParams.set('sport', team.sport);
      if (team.country) hrefParams.set('country', team.country);
      return `
        <a class="elevated-related-card" href="team.html?${hrefParams.toString()}">
          <span class="elevated-related-thumb">
            ${team.badge ? `<img src="${escapeHtml(team.badge)}" alt="${escapeHtml(team.name)}" loading="lazy" onerror="this.remove();">` : `<i class="fa-solid ${getSportIcon(team.sport)}" style="color:var(--dt-text-3);font-size:1rem"></i>`}
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
      const { data, error } = await supabase
        .from('teams')
        .select('id,name,sport,league,logo_url')
        .or(`sport.ilike.${team.sport},league.ilike.${team.league || '__none__'}`)
        .neq('id', team.id)
        .limit(8);
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

  function getTeamInitials(name) {
    const text = String(name || '').trim();
    if (!text) return '?';
    return text.split(/\s+/).map((n) => n[0]).slice(0, 2).join('').toUpperCase();
  }

  function buildTeamRailCard(row) {
    if (!row) return '';
    const name = String(row.name || 'Team').trim() || 'Team';
    const badge = row.badge || row.logo_url || row.logo || '';
    const sub = [row.league, row.sport].filter(Boolean).join(' · ') || 'Team';
    const hrefParams = new URLSearchParams();
    hrefParams.set('team', name);
    if (row.league) hrefParams.set('league', row.league);
    if (row.sport) hrefParams.set('sport', row.sport);
    if (row.country) hrefParams.set('country', row.country);
    const initials = getTeamInitials(name);
    const thumb = badge
      ? `<img src="${escapeHtml(badge)}" alt="${escapeHtml(name)}" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.parentElement.innerHTML='<span class=&quot;elevated-rail-card-thumb-fallback&quot;>${escapeHtml(initials)}</span>';">`
      : `<span class="elevated-rail-card-thumb-fallback">${escapeHtml(initials)}</span>`;
    return `
      <a class="elevated-rail-card" href="team.html?${hrefParams.toString()}" role="listitem" aria-label="${escapeHtml(name)}">
        <span class="elevated-rail-card-thumb">${thumb}</span>
        <span class="elevated-rail-card-name">${escapeHtml(name)}</span>
        <span class="elevated-rail-card-meta">${escapeHtml(sub)}</span>
      </a>
    `;
  }

  function renderTeamRailSkeleton(target, count = 6) {
    if (!target) return;
    target.innerHTML = Array.from({ length: count }, () => '<div class="elevated-rail-skeleton"></div>').join('');
  }

  function renderEmptyTeamRail(target, message) {
    if (!target) return;
    target.innerHTML = `<div class="elevated-rail-empty">${escapeHtml(message || 'Nothing here yet.')}</div>`;
  }

  function wireTeamRailScrollers(scope) {
    const root = scope || document;
    const buttons = root.querySelectorAll('.elevated-rail-btn[data-rail-target]');
    buttons.forEach((btn) => {
      if (btn.dataset.wired === '1') return;
      btn.dataset.wired = '1';
      const targetId = btn.getAttribute('data-rail-target');
      const dir = parseInt(btn.getAttribute('data-rail-dir') || '1', 10);
      const targetEl = targetId ? document.getElementById(targetId) : null;
      if (!targetEl) return;
      btn.addEventListener('click', () => {
        const amount = Math.max(220, Math.round(targetEl.clientWidth * 0.85));
        targetEl.scrollBy({ left: dir * amount, behavior: 'smooth' });
      });
    });
    root.querySelectorAll('.elevated-rail').forEach((rail) => {
      if (rail.dataset.wired === '1') return;
      rail.dataset.wired = '1';
      const updateButtons = () => {
        const prevBtn = rail.parentElement?.querySelector('.elevated-rail-btn[data-rail-dir="-1"]');
        const nextBtn = rail.parentElement?.querySelector('.elevated-rail-btn[data-rail-dir="1"]');
        const atStart = rail.scrollLeft <= 4;
        const atEnd = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 4;
        if (prevBtn) prevBtn.disabled = atStart;
        if (nextBtn) nextBtn.disabled = atEnd;
      };
      rail.addEventListener('scroll', updateButtons, { passive: true });
      window.addEventListener('resize', updateButtons);
      requestAnimationFrame(updateButtons);
    });
  }

  async function loadTeamTrending(team) {
    if (!ui.trendingRail || !ui.trendingSection) return;
    renderTeamRailSkeleton(ui.trendingRail, 8);
    const supabase = state.supabase;
    if (!supabase) {
      renderEmptyTeamRail(ui.trendingRail, 'Trending picks will appear here soon.');
      return;
    }
    try {
      const orFilters = [];
      if (team.sport) orFilters.push(`sport.ilike.${team.sport}`);
      if (team.league) orFilters.push(`league.ilike.${team.league}`);
      let query = supabase.from('teams')
        .select('id,name,sport,league,logo_url')
        .neq('id', team.id)
        .limit(24);
      if (orFilters.length) query = query.or(orFilters.join(','));
      const { data, error } = await query;
      if (error || !data || !data.length) {
        renderEmptyTeamRail(ui.trendingRail, 'Trending picks will appear here soon.');
        return;
      }
      const popularRegex = /real|barcelona|madrid|united|city|chelsea|arsenal|liverpool|psg|juventus|bayern|ferrari|mercedes|red bull|mclaren|ferrari|yankees|lakers|celtics|bulls|warriors|knicks|dodgers/i;
      const pool = (popularRegex ? data.filter((r) => popularRegex.test(r.name || '')) : data).length >= 4
        ? data.filter((r) => popularRegex.test(r.name || ''))
        : data;
      const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, 10);
      if (!shuffled.length) {
        renderEmptyTeamRail(ui.trendingRail, 'Trending picks will appear here soon.');
        return;
      }
      ui.trendingRail.innerHTML = shuffled.map((row) => buildTeamRailCard({
        id: row.id, name: row.name, sport: row.sport, league: row.league, badge: row.logo_url
      })).join('');
      if (ui.trendingSub) {
        const league = team.league ? ` ${team.league}` : (team.sport ? ` ${team.sport}` : '');
        ui.trendingSub.textContent = `Top teams in${league}`;
      }
    } catch (_err) {
      renderEmptyTeamRail(ui.trendingRail, 'Trending picks will appear here soon.');
    }
  }

  function getTeamCollections(team) {
    const sport = String(team?.sport || '').toLowerCase();
    if (sport.includes('football') && !sport.includes('american')) {
      return [
        { kicker: 'derby', icon: 'fa-fire', name: 'Iconic Derbies', desc: 'The rivalries that define football culture.', count: 14, gradient: 'radial-gradient(circle at 80% 20%, rgba(239, 68, 68, 0.3), transparent 65%)' },
        { kicker: 'elite', icon: 'fa-trophy', name: 'Champions League Royalty', desc: 'Most successful clubs in European competition.', count: 16, gradient: 'radial-gradient(circle at 80% 20%, rgba(245, 158, 11, 0.3), transparent 65%)' },
        { kicker: 'rising', icon: 'fa-arrow-trend-up', name: 'Rising Powers', desc: 'New-money clubs reshaping the game.', count: 8, gradient: 'radial-gradient(circle at 80% 20%, rgba(34, 197, 94, 0.28), transparent 65%)' }
      ];
    }
    if (sport.includes('basketball')) {
      return [
        { kicker: 'dynasty', icon: 'fa-crown', name: 'NBA Dynasties', desc: 'The franchises that built basketball history.', count: 10, gradient: 'radial-gradient(circle at 80% 20%, rgba(245, 158, 11, 0.3), transparent 65%)' },
        { kicker: 'young core', icon: 'fa-bolt', name: 'Young Cores', desc: 'Rebuilding teams with the brightest future.', count: 8, gradient: 'radial-gradient(circle at 80% 20%, rgba(168, 85, 247, 0.28), transparent 65%)' },
        { kicker: 'iconic', icon: 'fa-medal', name: 'All-Time Greats', desc: 'The franchises of legends.', count: 12, gradient: 'radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.3), transparent 65%)' }
      ];
    }
    if (sport.includes('motorsport') || sport.includes('racing') || sport.includes('f1')) {
      return [
        { kicker: 'works', icon: 'fa-wrench', name: 'Factory Teams', desc: 'The constructor giants of motorsport.', count: 10, gradient: 'radial-gradient(circle at 80% 20%, rgba(239, 68, 68, 0.3), transparent 65%)' },
        { kicker: 'classic', icon: 'fa-flag-checkered', name: 'Heritage Builders', desc: 'The teams that defined eras.', count: 9, gradient: 'radial-gradient(circle at 80% 20%, rgba(245, 158, 11, 0.3), transparent 65%)' },
        { kicker: 'privateer', icon: 'fa-medal', name: 'Independent Entries', desc: 'Customer teams punching above their weight.', count: 7, gradient: 'radial-gradient(circle at 80% 20%, rgba(34, 197, 94, 0.28), transparent 65%)' }
      ];
    }
    if (sport.includes('american')) {
      return [
        { kicker: 'dynasty', icon: 'fa-trophy', name: 'NFL Dynasties', desc: 'Franchises that owned the Super Bowl era.', count: 10, gradient: 'radial-gradient(circle at 80% 20%, rgba(245, 158, 11, 0.3), transparent 65%)' },
        { kicker: 'classic', icon: 'fa-shield', name: 'Original Six', desc: 'The league’s foundational franchises.', count: 8, gradient: 'radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.3), transparent 65%)' },
        { kicker: 'modern', icon: 'fa-bolt', name: 'Modern Powerhouses', desc: 'The teams of the analytics era.', count: 6, gradient: 'radial-gradient(circle at 80% 20%, rgba(168, 85, 247, 0.28), transparent 65%)' }
      ];
    }
    return [
      { kicker: 'all', icon: 'fa-grid-2', name: 'Top teams in this sport', desc: 'Browse the most-followed teams on Zo2y.', count: 18, gradient: 'radial-gradient(circle at 80% 20%, rgba(34, 197, 94, 0.3), transparent 65%)' }
    ];
  }

  function buildTeamCollectionCard(item) {
    if (!item) return '';
    const styleVar = `--collection-bg: ${item.gradient || 'radial-gradient(circle at 80% 20%, rgba(34, 197, 94, 0.3), transparent 65%)'};`;
    return `
      <a class="elevated-collection-card" style="${styleVar}" href="javascript:void(0)" role="link" aria-label="${escapeHtml(item.name)}">
        <span class="elevated-collection-kicker"><i class="fa-solid ${escapeHtml(item.icon || 'fa-shapes')}"></i> ${escapeHtml(item.kicker || 'collection')}</span>
        <h3 class="elevated-collection-name">${escapeHtml(item.name)}</h3>
        <p class="elevated-collection-desc">${escapeHtml(item.desc || '')}</p>
        <div class="elevated-collection-foot">
          <span class="elevated-collection-count"><i class="fa-solid fa-layer-group"></i> ${item.count} teams</span>
          <span class="elevated-collection-cta">view <i class="fa-solid fa-arrow-right"></i></span>
        </div>
      </a>
    `;
  }

  function loadTeamCollections(team) {
    if (!ui.collections || !ui.collectionsSection) return;
    const items = getTeamCollections(team);
    if (!items.length) {
      ui.collectionsSection.hidden = true;
      return;
    }
    ui.collectionsSection.hidden = false;
    if (ui.collectionsSub) {
      ui.collectionsSub.textContent = 'Hand-picked matchday groups';
    }
    ui.collections.innerHTML = items.map(buildTeamCollectionCard).join('');
  }

  function buildTeamCommunityRow(row, rank) {
    if (!row) return '';
    const name = String(row.name || 'Team').trim() || 'Team';
    const badge = row.badge || row.logo_url || row.logo || '';
    const sub = [row.league, row.sport].filter(Boolean).join(' · ') || 'Team';
    const hrefParams = new URLSearchParams();
    hrefParams.set('team', name);
    if (row.league) hrefParams.set('league', row.league);
    if (row.sport) hrefParams.set('sport', row.sport);
    if (row.country) hrefParams.set('country', row.country);
    const initials = getTeamInitials(name);
    const thumb = badge
      ? `<img src="${escapeHtml(badge)}" alt="${escapeHtml(name)}" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.parentElement.innerHTML='<span class=&quot;elevated-community-thumb-fallback&quot;>${escapeHtml(initials)}</span>';">`
      : `<span class="elevated-community-thumb-fallback">${escapeHtml(initials)}</span>`;
    const rankHtml = rank ? `<span class="elevated-community-rank">${rank}</span>` : '';
    return `
      <a class="elevated-community-row" href="team.html?${hrefParams.toString()}" aria-label="${escapeHtml(name)}">
        ${rankHtml}
        <span class="elevated-community-thumb">${thumb}</span>
        <span class="elevated-community-body">
          <span class="elevated-community-name">${escapeHtml(name)}</span>
          <span class="elevated-community-meta">${escapeHtml(sub)}</span>
        </span>
      </a>
    `;
  }

  function renderEmptyTeamCommunity(target, message) {
    if (!target) return;
    target.innerHTML = `<div class="elevated-community-empty">${escapeHtml(message || 'Nothing here yet.')}</div>`;
  }

  async function loadTeamCommunity(team) {
    if (!ui.communitySection) return;
    const supabase = state.supabase;
    if (!supabase) {
      renderEmptyTeamCommunity(ui.communityPopular, 'No data yet.');
      renderEmptyTeamCommunity(ui.communitySaved, 'No data yet.');
      renderEmptyTeamCommunity(ui.communityRecent, 'No data yet.');
      return;
    }
    try {
      // Popular this week — proxy via most-favorited teams in the last 7 days
      const { data: popular } = await supabase
        .from('user_favorite_teams')
        .select('team_id,created_at')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .limit(500);
      const popularCounts = new Map();
      (popular || []).forEach((row) => {
        const id = String(row.team_id || '').trim();
        if (!id) return;
        popularCounts.set(id, (popularCounts.get(id) || 0) + 1);
      });
      const popularIds = Array.from(popularCounts.keys());
      let popularRows = [];
      if (popularIds.length) {
        const { data } = await supabase.from('teams')
          .select('id,name,sport,league,logo_url,country')
          .in('id', popularIds)
          .limit(20);
        popularRows = (data || []);
        popularRows.sort((a, b) => (popularCounts.get(b.id) || 0) - (popularCounts.get(a.id) || 0));
      }
      const popularTop = popularRows.filter((r) => r.id !== team?.id).slice(0, 5);
      if (popularTop.length) {
        ui.communityPopular.innerHTML = popularTop
          .map((row, i) => buildTeamCommunityRow(row, i + 1))
          .join('');
      } else {
        renderEmptyTeamCommunity(ui.communityPopular, 'No activity this week yet.');
      }

      // Most saved
      const { data: saved } = await supabase.from('user_favorite_teams').select('team_id').limit(2000);
      const savedCounts = new Map();
      (saved || []).forEach((row) => {
        const id = String(row.team_id || '').trim();
        if (!id) return;
        savedCounts.set(id, (savedCounts.get(id) || 0) + 1);
      });
      const savedIds = Array.from(savedCounts.keys());
      if (savedIds.length) {
        const { data } = await supabase.from('teams')
          .select('id,name,sport,league,logo_url,country')
          .in('id', savedIds)
          .limit(20);
        const savedRows = (data || []);
        savedRows.sort((a, b) => (savedCounts.get(b.id) || 0) - (savedCounts.get(a.id) || 0));
        const savedTop = savedRows.filter((r) => r.id !== team?.id).slice(0, 5);
        if (savedTop.length) {
          ui.communitySaved.innerHTML = savedTop
            .map((row, i) => buildTeamCommunityRow(row, i + 1))
            .join('');
        } else {
          renderEmptyTeamCommunity(ui.communitySaved, 'Nothing saved yet.');
        }
      } else {
        renderEmptyTeamCommunity(ui.communitySaved, 'Nothing saved yet.');
      }

      // Recently added
      const { data: recent } = await supabase.from('teams')
        .select('id,name,sport,league,logo_url,country,created_at')
        .order('created_at', { ascending: false })
        .limit(20);
      const recentRows = (recent || []).filter((r) => r.id && r.id !== team?.id).slice(0, 5);
      if (recentRows.length) {
        ui.communityRecent.innerHTML = recentRows
          .map((row) => buildTeamCommunityRow(row, 0))
          .join('');
      } else {
        const { data: fallback } = await supabase.from('teams')
          .select('id,name,sport,league,logo_url,country')
          .neq('id', team?.id || '__none__')
          .order('name', { ascending: true })
          .limit(5);
        if (fallback && fallback.length) {
          ui.communityRecent.innerHTML = fallback
            .map((row) => buildTeamCommunityRow(row, 0))
            .join('');
        } else {
          renderEmptyTeamCommunity(ui.communityRecent, 'No new entries yet.');
        }
      }
    } catch (_err) {
      renderEmptyTeamCommunity(ui.communityPopular, 'No data yet.');
      renderEmptyTeamCommunity(ui.communitySaved, 'No data yet.');
      renderEmptyTeamCommunity(ui.communityRecent, 'No data yet.');
    }
  }

  function setHero(team) {
    if (ui.body) ui.body.dataset.elevatedCategory = 'team';
    document.body.dataset.navPage = 'sports';
    document.title = `Zo2y - ${team.name}`;

    const initials = (team.name || 'T').split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0]).join('').toUpperCase();
    setFallbackInitial(initials);
    if (ui.posterFallbackTitle) ui.posterFallbackTitle.textContent = team.name;

    if (ui.badge) {
      ui.badge.src = team.badge || FALLBACK_BADGE;
      ui.badge.alt = `${team.name} badge`;
      ui.badge.onerror = () => {
        ui.badge.onerror = null;
        ui.badge.src = FALLBACK_BADGE;
        ui.posterFrame?.classList.add('is-missing');
      };
      if (team.badge) {
        ui.posterFrame?.classList.remove('is-missing');
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

    // Backdrop: prefer fanart, then banner, then sport fallback
    const backdrop = team.fanart || (team.fanarts && team.fanarts[0]) || team.banner;
    if (backdrop) {
      applyBackdrop(backdrop);
    } else {
      applySportFallbackBackground(team.sport);
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

    // TheSportsDB — fetch full data including images
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

    // Wikipedia for description
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

    // Trending rail, Collections, Community — non-blocking
    loadTeamTrending(team).catch(() => {});
    loadTeamCollections(team);
    loadTeamCommunity(team).catch(() => {});
    requestAnimationFrame(() => wireTeamRailScrollers(ui.body));

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
