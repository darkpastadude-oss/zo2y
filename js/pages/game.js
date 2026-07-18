(() => {
  const supabaseConfig = window.__ZO2Y_SUPABASE_CONFIG || {};
  const SUPABASE_URL = String(supabaseConfig.url || '').trim();
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const gameId = id ? String(id).trim() : null;

  let supabaseClient = null;
  let currentUser = null;
  const listStatus = { favorites: false, watched: false, watchlist: false };
  const pendingListOps = new Set();

  const els = {
    related: document.getElementById("gameRelated"),
    relatedSec: document.getElementById("gameRelatedSection"),
    aboutBody: document.getElementById("gameAboutBody"),
    aboutSec: document.getElementById("gameAboutSection"),
    aboutToggle: document.getElementById("gameAboutToggle")
  };

  function showNotification(message, type = 'info', duration = 3000) {
    const existing = document.querySelectorAll('.notification');
    existing.forEach(n => n.remove());
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), duration);
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatCount(n) {
    const num = Number(n) || 0;
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return String(num);
  }

  function normalizeUrl(value) {
    const raw = String(value || '').trim();
    if (!raw || raw === '[object Object]') return '';
    if (raw.startsWith('//')) return `https:${raw}`;
    return raw.replace(/^http:\/\//i, 'https://');
  }

  async function isTransparentPng(url) {
    if (!url) return false;
    const ext = url.split('?')[0].split('.').pop().toLowerCase();
    if (ext !== 'png' && ext !== 'webp') return false;
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const w = Math.min(img.naturalWidth, 64);
          const h = Math.min(img.naturalHeight, 96);
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          ctx.drawImage(img, 0, 0, w, h);
          const data = ctx.getImageData(0, 0, w, h).data;
          let transparent = 0;
          let total = 0;
          for (let i = 3; i < data.length; i += 16) {
            total++;
            if (data[i] < 30) transparent++;
          }
          const ratio = transparent / total;
          resolve(ratio > 0.35);
        } catch (_) {
          resolve(false);
        }
      };
      img.onerror = () => resolve(false);
      img.src = url;
    });
  }

  function buildArtworkFrame(posterUrl, title) {
    return `<div class="logo-artwork-frame">
      <img class="game-logo" src="${escapeHtml(posterUrl)}" alt="${escapeHtml(title || 'Game logo')}" />
      <div class="frame-label">official artwork</div>
    </div>`;
  }

  async function initSupabase() {
    if (supabaseClient) return supabaseClient;
    const authRuntime = window.ZO2Y_AUTH || null;
    if (authRuntime && typeof authRuntime.waitForSupabase === 'function') {
      await authRuntime.waitForSupabase(8000);
    }
    if (typeof window.__ZO2Y_ENSURE_SUPABASE_CLIENT === 'function') {
      supabaseClient = await window.__ZO2Y_ENSURE_SUPABASE_CLIENT();
      if (supabaseClient) return supabaseClient;
    }
    if (window.supabase && typeof window.supabase.createClient === 'function' && window.__ZO2Y_SUPABASE_CONFIG) {
      supabaseClient = window.supabase.createClient(
        window.__ZO2Y_SUPABASE_CONFIG.url,
        window.__ZO2Y_SUPABASE_CONFIG.key,
        { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } }
      );
      window.__ZO2Y_SUPABASE_CLIENT = supabaseClient;
      return supabaseClient;
    }
    return null;
  }

  async function initAuth() {
    if (!supabaseClient) return;
    const { data: { user } } = await supabaseClient.auth.getUser();
    currentUser = user || null;
    await loadListStatus();
    supabaseClient.auth.onAuthStateChange((_event, session) => {
      currentUser = session?.user || null;
      loadListStatus();
    });
  }

  function resolveAssetsFromRow(row) {
    if (!row) return {};
    const steamAppId = row?.extra?.steam_appid || row?.steam_appid;
    const steamHero = steamAppId
      ? `https://steamcdn-a.akamaihd.net/steam/apps/${String(steamAppId).replace(/\D/g, '')}/header.jpg`
      : '';
    const rawScreenshots = row?.screenshots || [];
    const screenshots = Array.isArray(rawScreenshots)
      ? rawScreenshots.map(s => typeof s === 'string' ? normalizeUrl(s) : normalizeUrl(s?.image || s?.url || '')).filter(Boolean)
      : [];

    return {
      poster: normalizeUrl(row?.cover_url || row?.cover || row?.image || '') || steamAppId ? `https://steamcdn-a.akamaihd.net/steam/apps/${String(steamAppId || '').replace(/\D/g, '')}/library_600x900.jpg` : '',
      heroBackground: normalizeUrl(row?.hero_background || row?.background_image || row?.hero_url || row?.hero || row?.background || '') || steamHero,
      heroBackgroundSecondary: normalizeUrl(row?.hero_background_secondary || row?.background_image_additional || ''),
      screenshots: screenshots.slice(0, 12)
    };
  }

  function resolvePoster(game) {
    if (game.cover && typeof game.cover === 'string') return normalizeUrl(game.cover);
    if (game.cover?.url) return normalizeUrl(game.cover.url);
    if (game.poster) return normalizeUrl(game.poster);
    const steamId = game.steam_appid || game?.extra?.steam_appid;
    if (steamId) {
      const num = String(steamId).replace(/\D/g, '');
      if (num.length >= 2) return `https://steamcdn-a.akamaihd.net/steam/apps/${num}/library_600x900.jpg`;
    }
    return game.background_image ? normalizeUrl(game.background_image) : '/images/fallback/game.svg';
  }

  function resolveHeroBackground(game) {
    return normalizeUrl(game.hero_background || game.background_image || '') || '';
  }

  function resolveHeroSecondary(game) {
    return normalizeUrl(game.hero_background_secondary || game.background_image_additional || '') || '';
  }

  function resolveScreenshots(game) {
    const raw = game.screenshots || [];
    if (!Array.isArray(raw)) return [];
    return raw
      .map(s => {
        if (typeof s === 'string') return normalizeUrl(s);
        return normalizeUrl(s?.image || s?.url || '');
      })
      .filter(Boolean)
      .slice(0, 12);
  }

  function renderScreenshotGallery(screenshots) {
    const sec = document.getElementById('gameScreenshotsSection');
    const grid = document.getElementById('gameScreenshotsGrid');
    if (!sec || !grid || !screenshots.length) return;
    sec.hidden = false;
    grid.innerHTML = screenshots.map((url, i) => `
      <div class="game-screenshot-item" data-index="${i}">
        <img src="${escapeHtml(url)}" alt="Screenshot ${i + 1}" loading="lazy"
             onerror="this.parentElement.style.display='none'">
      </div>
    `).join('');
    grid.querySelectorAll('.game-screenshot-item').forEach(item => {
      item.addEventListener('click', () => {
        const idx = Number(item.getAttribute('data-index') || 0);
        openScreenshotLightbox(screenshots, idx);
      });
    });
  }

  function openScreenshotLightbox(screenshots, startIndex) {
    const existing = document.querySelector('.game-screenshot-lightbox');
    if (existing) existing.remove();
    let current = startIndex;
    const overlay = document.createElement('div');
    overlay.className = 'game-screenshot-lightbox';
    overlay.innerHTML = `
      <button class="lightbox-close" aria-label="Close"><i class="fas fa-times"></i></button>
      <button class="lightbox-prev" aria-label="Previous"><i class="fas fa-chevron-left"></i></button>
      <button class="lightbox-next" aria-label="Next"><i class="fas fa-chevron-right"></i></button>
      <img class="lightbox-img" src="${escapeHtml(screenshots[current])}" alt="Screenshot">
    `;
    document.body.appendChild(overlay);

    const img = overlay.querySelector('.lightbox-img');
    function update() {
      img.src = escapeHtml(screenshots[current]);
      overlay.querySelector('.lightbox-prev').style.display = current > 0 ? '' : 'none';
      overlay.querySelector('.lightbox-next').style.display = current < screenshots.length - 1 ? '' : 'none';
    }
    update();

    overlay.querySelector('.lightbox-close').addEventListener('click', () => overlay.remove());
    overlay.querySelector('.lightbox-prev').addEventListener('click', () => { if (current > 0) { current--; update(); } });
    overlay.querySelector('.lightbox-next').addEventListener('click', () => { if (current < screenshots.length - 1) { current++; update(); } });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    document.addEventListener('keydown', function handler(e) {
      if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', handler); }
      if (e.key === 'ArrowLeft' && current > 0) { current--; update(); }
      if (e.key === 'ArrowRight' && current < screenshots.length - 1) { current++; update(); }
    });
  }

  async function loadGame() {
    if (!gameId) {
      if (els.aboutBody) els.aboutBody.textContent = "No game ID provided.";
      return;
    }

    const GAME_GENRE_BACKDROPS = {
      action: 'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?w=1600&q=80',
      shooter: 'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?w=1600&q=80',
      'role-playing-games-rpg': 'https://images.pexels.com/photos/1293506/pexels-photo-1293506.jpeg?w=1600&q=80',
      rpg: 'https://images.pexels.com/photos/1293506/pexels-photo-1293506.jpeg?w=1600&q=80',
      adventure: 'https://images.pexels.com/photos/417173/pexels-photo-417173.jpeg?w=1600&q=80',
      puzzle: 'https://images.pexels.com/photos/207924/pexels-photo-207924.jpeg?w=1600&q=80',
      strategy: 'https://images.pexels.com/photos/207924/pexels-photo-207924.jpeg?w=1600&q=80',
      horror: 'https://images.pexels.com/photos/2387873/pexels-photo-2387873.jpeg?w=1600&q=80',
      simulation: 'https://images.pexels.com/photos/163489/cpu-motherboard-electronics-computer-163489.jpeg?w=1600&q=80',
      racing: 'https://images.pexels.com/photos/1707820/pexels-photo-1707820.jpeg?w=1600&q=80',
      sports: 'https://images.pexels.com/photos/4773081/pexels-photo-4773081.jpeg?w=1600&q=80',
      fighting: 'https://images.pexels.com/photos/8612004/pexels-photo-8612004.jpeg?w=1600&q=80',
      platformer: 'https://images.pexels.com/photos/442576/pexels-photo-442576.jpeg?w=1600&q=80',
      stealth: 'https://images.pexels.com/photos/1671325/pexels-photo-1671325.jpeg?w=1600&q=80',
      default: 'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?w=1600&q=80'
    };

    function getGameGenreBackdrop(genres) {
      const g = Array.isArray(genres) ? genres.map(x => {
        const name = String(x?.slug || x?.name || x || '').toLowerCase().trim();
        return name;
      }) : [];
      for (const genre of g) {
        if (GAME_GENRE_BACKDROPS[genre]) return GAME_GENRE_BACKDROPS[genre];
      }
      return GAME_GENRE_BACKDROPS.default;
    }

    let game = null;

    try {
      const res = await fetch(`/api/igdb/games/${encodeURIComponent(gameId)}?cb=${Date.now()}`);
      if (res.ok) {
        game = await res.json();
      }
    } catch (_err) {}

    if (!game && supabaseClient) {
      try {
        const { data } = await supabaseClient
          .from('games')
          .select('id,title,description,cover_url,hero_url,release_date,rating,rating_count,source,slug,extra')
          .eq('id', gameId)
          .maybeSingle();
        if (data) {
          const assets = resolveAssetsFromRow(data);
          game = {
            id: data.id,
            name: data.title,
            slug: data.slug,
            description: data.description,
            cover: assets.poster || data.cover_url || '',
            hero_url: data.hero_url || '',
            hero_background: assets.heroBackground || data.hero_url || '',
            hero_background_secondary: assets.heroBackgroundSecondary || '',
            background_image: data.hero_url || '',
            screenshots: assets.screenshots,
            released: data.release_date || '',
            rating: data.rating || 0,
            rating_count: data.rating_count || 0,
            genres: data.extra?.genres || [],
            platforms: data.extra?.platforms || [],
            developers: [],
            publishers: [],
            website: '',
            reddit_url: '',
            source: data.source || 'local'
          };
        }
      } catch (_err) {}
    }

    if (!game) {
      if (els.aboutBody) els.aboutBody.textContent = "Game not found.";
      return;
    }

    const posterUrl = resolvePoster(game);
    const heroBg = resolveHeroBackground(game);
    const heroSec = resolveHeroSecondary(game);
    const screenshots = resolveScreenshots(game);
    const backdropUrl = heroBg || heroSec || posterUrl || getGameGenreBackdrop(game.genres);

    const config = {
      type: "game",
      typeLabel: "Game Spotlight",
      title: (game.name || "Unknown Game").replace(/\s*\(video game\)/i, ""),
      posterUrl: posterUrl,
      backdropUrl: backdropUrl,
      description: game.description || "Explore more details about this game.",
      metadata: [],
      actions: [
        {
          id: "gameSaveBtn",
          icon: "fa-solid fa-bookmark",
          label: "add to list",
          primary: true,
        }
      ]
    };

    if (game.released || game.firstReleaseDate) {
      config.metadata.push({
        type: "year",
        value: (game.released || game.firstReleaseDate).substring(0, 4),
      });
    }
    if (game.platforms && game.platforms.length > 0) {
      config.metadata.push({
        type: "platform",
        value: game.platforms.slice(0, 2).map((p) => {
          if (typeof p === 'string') return p;
          return p?.platform?.name || p?.name || (typeof p?.platform === 'string' ? p.platform : '') || '';
        }).filter(Boolean).join(", ") + (game.platforms.length > 2 ? "..." : "")
      });
    }
    if (game.genres && game.genres.length > 0) {
      config.metadata.push({
        type: "genre",
        value: game.genres.slice(0, 2).map((g) => g.name || g).join(", ")
      });
    }

    if (game.website) {
      config.actions.push({
        id: "gameWebsite",
        icon: "fa-solid fa-arrow-up-right-from-square",
        label: "visit website",
        href: game.website
      });
    }

    if (window.renderUnifiedMediaHero) {
      window.renderUnifiedMediaHero(
        document.getElementById("unifiedHeroContainer"),
        config
      );
      var saveBtn = document.getElementById('gameSaveBtn');
      if (saveBtn) {
        saveBtn.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          if (gameId) {
            ListModal.open(gameId, 'game');
          }
        });
      }

      if (posterUrl && !posterUrl.includes('fallback')) {
        isTransparentPng(posterUrl).then(isLogo => {
          if (!isLogo) return;
          const heroPoster = document.querySelector('#unifiedHeroContainer .umh-poster');
          if (heroPoster) {
            const wrap = document.createElement('div');
            wrap.className = 'poster-artwork-wrap';
            wrap.innerHTML = buildArtworkFrame(posterUrl, config.title);
            heroPoster.style.display = 'none';
            heroPoster.parentElement.insertBefore(wrap, heroPoster);
          }
        }).catch(() => {});
      }
    }

    if (els.aboutBody) {
      els.aboutBody.textContent = game.description || "Explore more details about this game.";
    }

    renderScreenshotGallery(screenshots);

    const infoGrid = document.getElementById("gameInfoGrid");
    if (infoGrid) {
      let factsHtml = "";
      if (game.developers && game.developers.length > 0) {
        factsHtml += `<div class="elevated-detail-card"><div class="elevated-detail-title"><i class="fa-solid fa-building"></i> Developer</div><div class="elevated-detail-value">${game.developers.map((d) => d.name || d).join(", ")}</div></div>`;
      }
      if (game.publishers && game.publishers.length > 0) {
        factsHtml += `<div class="elevated-detail-card"><div class="elevated-detail-title"><i class="fa-solid fa-truck-ramp-box"></i> Publisher</div><div class="elevated-detail-value">${game.publishers.map((p) => p.name || p).join(", ")}</div></div>`;
      }
      const releaseDate = game.released || game.firstReleaseDate || '';
      if (releaseDate) {
        factsHtml += `<div class="elevated-detail-card"><div class="elevated-detail-title"><i class="fa-solid fa-calendar"></i> Release Date</div><div class="elevated-detail-value">${escapeHtml(releaseDate)}</div></div>`;
      }
      if (game.rating) {
        factsHtml += `<div class="elevated-detail-card"><div class="elevated-detail-title"><i class="fa-solid fa-star"></i> Rating</div><div class="elevated-detail-value">${Number(game.rating).toFixed(1)}</div></div>`;
      }
      infoGrid.innerHTML = factsHtml;
    }

    const socialSec = document.getElementById("gameSocialSection");
    const socialGrid = document.getElementById("gameSocial");
    if (socialSec && socialGrid && (game.website || game.reddit_url)) {
      socialSec.hidden = false;
      let socialHtml = "";
      if (game.website) {
        socialHtml += `<a href="${escapeHtml(game.website)}" target="_blank" class="elevated-social-link"><i class="fa-solid fa-globe"></i> Official Website</a>`;
      }
      if (game.reddit_url) {
        socialHtml += `<a href="${escapeHtml(game.reddit_url)}" target="_blank" class="elevated-social-link"><i class="fa-brands fa-reddit"></i> Reddit</a>`;
      }
      socialGrid.innerHTML = socialHtml;
    }

    const actionCard = document.getElementById("gameActionCard");
    if (actionCard) {
      actionCard.setAttribute("data-item-id", gameId || "");
      actionCard.setAttribute("data-title", game.name || "");
      actionCard.setAttribute("data-subtitle", game.released ? game.released.substring(0, 4) : "");
      if (posterUrl) {
        actionCard.setAttribute("data-list-image", posterUrl);
      }
    }

    if (supabaseClient && game.source !== 'rawg' && (heroBg || screenshots.length > 0)) {
      const shared = window.__zo2yGamesShared;
      if (shared?.ensureGameInSupabase) {
        shared.ensureGameInSupabase(supabaseClient, {
          id: gameId,
          name: game.name,
          slug: game.slug,
          description: game.description,
          cover: posterUrl,
          hero_background: heroBg,
          hero_background_secondary: heroSec,
          screenshots: screenshots,
          released: game.released,
          rating: game.rating,
          ratings_count: game.rating_count,
          genres: game.genres,
          platforms: game.platforms,
          developers: game.developers,
          publishers: game.publishers
        }).catch(() => {});
      }
    }
  }

  async function loadListStatus() {
    if (!supabaseClient || !currentUser || !gameId) return;
    const { data, error } = await supabaseClient
      .from('list_items')
      .select('list_type')
      .eq('media_type', 'game')
      .eq('user_id', currentUser.id)
      .eq('item_id', gameId);
    if (error) return;
    listStatus.favorites = false;
    listStatus.watched = false;
    listStatus.watchlist = false;
    (data || []).forEach(item => {
      if (listStatus[item.list_type] !== undefined) {
        listStatus[item.list_type] = true;
      }
    });
    updateListMenuUI();
  }

  function updateListMenuUI() {
    const saveBtn = document.getElementById("gameSaveBtn");
    if (!saveBtn) return;
    const listType = 'watchlist';
    const isActive = !!listStatus[listType];
    const opKey = `${gameId}:${listType}`;
    const isPending = pendingListOps.has(opKey);
    saveBtn.classList.toggle('active', isActive);
    saveBtn.setAttribute('aria-busy', isPending ? 'true' : 'false');
    saveBtn.style.pointerEvents = isPending ? 'none' : '';
    saveBtn.style.opacity = isPending ? '0.72' : '';
  }

  async function toggleList(listType, forcedNextSaved) {
    if (!currentUser) {
      showNotification('Please sign in to save games', 'info');
      return { ok: false, saved: false };
    }
    if (!gameId || !(listType in listStatus)) return { ok: false, saved: false };
    const opKey = `${gameId}:${listType}`;
    if (pendingListOps.has(opKey)) return { ok: false, saved: !!listStatus[listType] };

    const previousSaved = !!listStatus[listType];
    const nextSaved = typeof forcedNextSaved === 'boolean' ? forcedNextSaved : !previousSaved;
    pendingListOps.add(opKey);
    listStatus[listType] = nextSaved;
    updateListMenuUI();

    try {
      if (nextSaved) {
        const { error } = await supabaseClient
          .from('list_items')
          .insert({ user_id: currentUser.id, item_id: gameId, list_type: listType, media_type: 'game' });
        if (error) {
          if (String(error.code || '') === '23505') return;
          throw error;
        }
        showNotification('Saved to list', 'success');
      } else {
        const { error } = await supabaseClient
          .from('list_items')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('item_id', gameId)
          .eq('list_type', listType)
          .eq('media_type', 'game');
        if (error) throw error;
        showNotification('Removed from list', 'info');
      }
      return { ok: true, saved: nextSaved };
    } catch (error) {
      listStatus[listType] = previousSaved;
      showNotification('Could not update list', 'error');
      return { ok: false, saved: previousSaved };
    } finally {
      pendingListOps.delete(opKey);
      updateListMenuUI();
    }
  }

  (async function init() {
    await initSupabase();
    await initAuth();
    await loadGame();
  })().catch(err => {
    console.error('Game initialization failed:', err);
  });
})();
