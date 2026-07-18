(() => {
  const supabaseConfig = window.__ZO2Y_SUPABASE_CONFIG || {};
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

  async function loadGame() {
    if (!gameId) {
      if (els.aboutBody) els.aboutBody.textContent = "No game ID provided.";
      return;
    }

    const GAME_GENRE_BACKDROPS = {
      action: 'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?w=1600',
      shooter: 'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?w=1600',
      'role-playing-games-rpg': 'https://images.pexels.com/photos/1293506/pexels-photo-1293506.jpeg?w=1600',
      rpg: 'https://images.pexels.com/photos/1293506/pexels-photo-1293506.jpeg?w=1600',
      adventure: 'https://images.pexels.com/photos/417173/pexels-photo-417173.jpeg?w=1600',
      puzzle: 'https://images.pexels.com/photos/207924/pexels-photo-207924.jpeg?w=1600',
      strategy: 'https://images.pexels.com/photos/207924/pexels-photo-207924.jpeg?w=1600',
      horror: 'https://images.pexels.com/photos/2387873/pexels-photo-2387873.jpeg?w=1600',
      simulation: 'https://images.pexels.com/photos/163489/cpu-motherboard-electronics-computer-163489.jpeg?w=1600',
      racing: 'https://images.pexels.com/photos/1707820/pexels-photo-1707820.jpeg?w=1600',
      sports: 'https://images.pexels.com/photos/4773081/pexels-photo-4773081.jpeg?w=1600',
      fighting: 'https://images.pexels.com/photos/8612004/pexels-photo-8612004.jpeg?w=1600',
      platformer: 'https://images.pexels.com/photos/442576/pexels-photo-442576.jpeg?w=1600',
      stealth: 'https://images.pexels.com/photos/1671325/pexels-photo-1671325.jpeg?w=1600',
      default: 'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?w=1600'
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

    try {
      const res = await fetch(`/api/igdb/games/${encodeURIComponent(gameId)}?cb=${Date.now()}`);
      if (!res.ok) throw new Error("Game not found");

      const game = await res.json();

      const posterUrl = game.cover || "/images/fallback/game.svg";
      const backdropUrl = game.hero_url || game.hero || game.background_image || getGameGenreBackdrop(game.genres);

      const config = {
        type: "game",
        typeLabel: "Game Spotlight",
        title: (game.name || "Unknown Game").replace(/\s*\(video game\)/i, ""),
        posterUrl: posterUrl,
        posterFit: "contain",
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

      if (game.released) {
        config.metadata.push({
          type: "year",
          value: game.released.substring(0, 4),
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
      if (game.developers && game.developers.length > 0) {
        config.metadata.push({
          type: "developer",
          value: game.developers[0].name || game.developers[0]
        });
      }
      if (game.genres && game.genres.length > 0) {
        config.metadata.push({
          type: "genre",
          value: game.genres.slice(0, 2).map((g) => g.name || g).join(", ")
        });
      }
      if (game.rating) {
        config.metadata.push({
          type: "rating",
          value: Number(game.rating).toFixed(1)
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
      }

      if (els.aboutBody) {
        els.aboutBody.textContent = game.description || "Explore more details about this game.";
      }

      // Populate quick facts grid
      const infoGrid = document.getElementById("gameInfoGrid");
      if (infoGrid) {
        let factsHtml = "";
        if (game.developers && game.developers.length > 0) {
          factsHtml += `<div class="elevated-detail-card"><div class="elevated-detail-title"><i class="fa-solid fa-building"></i> Developer</div><div class="elevated-detail-value">${game.developers.map((d) => d.name || d).join(", ")}</div></div>`;
        }
        if (game.publishers && game.publishers.length > 0) {
          factsHtml += `<div class="elevated-detail-card"><div class="elevated-detail-title"><i class="fa-solid fa-truck-ramp-box"></i> Publisher</div><div class="elevated-detail-value">${game.publishers.map((p) => p.name || p).join(", ")}</div></div>`;
        }
        if (game.released) {
          factsHtml += `<div class="elevated-detail-card"><div class="elevated-detail-title"><i class="fa-solid fa-calendar"></i> Release Date</div><div class="elevated-detail-value">${game.released}</div></div>`;
        }
        if (game.rating) {
          factsHtml += `<div class="elevated-detail-card"><div class="elevated-detail-title"><i class="fa-solid fa-star"></i> IGDB Rating</div><div class="elevated-detail-value">${Number(game.rating).toFixed(1)}</div></div>`;
        }
        infoGrid.innerHTML = factsHtml;
      }

      // Social links
      const socialSec = document.getElementById("gameSocialSection");
      const socialGrid = document.getElementById("gameSocial");
      if (socialSec && socialGrid && (game.website || game.reddit_url)) {
        socialSec.hidden = false;
        let socialHtml = "";
        if (game.website) {
          socialHtml += `<a href="${game.website}" target="_blank" class="elevated-social-link"><i class="fa-solid fa-globe"></i> Official Website</a>`;
        }
        if (game.reddit_url) {
          socialHtml += `<a href="${game.reddit_url}" target="_blank" class="elevated-social-link"><i class="fa-brands fa-reddit"></i> Reddit</a>`;
        }
        socialGrid.innerHTML = socialHtml;
      }

      // Action card data populate for custom list adapter
      const actionCard = document.getElementById("gameActionCard");
      if (actionCard) {
        actionCard.setAttribute("data-item-id", gameId || "");
        actionCard.setAttribute("data-title", game.name || "");
        actionCard.setAttribute("data-subtitle", game.released ? game.released.substring(0, 4) : "");
        if (game.cover) {
          actionCard.setAttribute("data-list-image", game.cover);
        }
      }

    } catch (e) {
      console.error(e);
      if (els.aboutBody) els.aboutBody.textContent = "Failed to load game details.";
    }
  }

  /* ---------- List Adapter ---------- */

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
    const listType = 'watchlist'; // default toggle type for the main button
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
