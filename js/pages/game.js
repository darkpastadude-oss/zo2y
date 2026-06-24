(() => {
  const supabaseConfig = window.__ZO2Y_SUPABASE_CONFIG || {};
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const gameId = id ? String(id).trim() : null;

  let supabaseClient = null;
  let currentUser = null;
  let currentRating = 0;
  let editingReviewId = null;
  let reviews = [];
  let currentSort = 'latest';

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
    renderReviewFormVisibility();
    await loadListStatus();
    supabaseClient.auth.onAuthStateChange((_event, session) => {
      currentUser = session?.user || null;
      renderReviewFormVisibility();
      loadListStatus();
    });
  }

  async function loadGame() {
    if (!gameId) {
      if (els.aboutBody) els.aboutBody.textContent = "No game ID provided.";
      return;
    }

    try {
      const res = await fetch(`/api/igdb/games/${encodeURIComponent(gameId)}`);
      if (!res.ok) throw new Error("Game not found");

      const game = await res.json();

      const config = {
        type: "game",
        typeLabel: "Game Spotlight",
        title: (game.name || "Unknown Game").replace(/\s*\(video game\)/i, ""),
        posterUrl: game.cover || "/images/fallback/game.svg",
        posterFit: "contain",
        backdropUrl: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=1600&q=80",
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
          value: game.platforms.slice(0, 2).map((p) => p.platform?.name || p.name || String(p)).join(", ") + (game.platforms.length > 2 ? "..." : "")
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
        bindUnifiedListMenu(config);
      }

      if (els.aboutBody) {
        els.aboutBody.textContent = game.description || "Explore more details about this game.";
        wireOverviewToggle();
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

  function wireOverviewToggle() {
    const overview = els.aboutBody;
    const toggle = els.aboutToggle;
    const wrap = document.querySelector('.elevated-description-wrap');
    const label = toggle ? toggle.querySelector('.elevated-readmore-label') : null;
    if (!overview || !toggle) return;

    let isExpanded = false;

    const measureAndSync = () => {
      overview.classList.add('is-clamped');
      if (wrap) wrap.classList.add('is-clamped');
      void overview.offsetHeight;
      const visibleHeight = overview.clientHeight;

      overview.classList.remove('is-clamped');
      if (wrap) wrap.classList.remove('is-clamped');
      void overview.offsetHeight;
      const naturalHeight = overview.scrollHeight;

      const shouldClamp = isExpanded ? false : (naturalHeight > visibleHeight + 2);
      overview.classList.toggle('is-clamped', shouldClamp);
      if (wrap) wrap.classList.toggle('is-clamped', shouldClamp);

      if (naturalHeight <= visibleHeight + 2) {
        toggle.hidden = true;
        return;
      }
      toggle.hidden = false;
      toggle.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
      if (label) label.textContent = isExpanded ? 'show less' : 'read more';
    };

    toggle.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      isExpanded = !isExpanded;
      measureAndSync();
    });

    let resizeRaf = 0;
    window.addEventListener('resize', () => {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(measureAndSync);
    });

    requestAnimationFrame(() => requestAnimationFrame(measureAndSync));
    setTimeout(measureAndSync, 600);
  }

  /* ---------- List Adapter ---------- */

  async function loadListStatus() {
    if (!supabaseClient || !currentUser || !gameId) return;
    const { data, error } = await supabaseClient
      .from('game_list_items')
      .select('list_type')
      .eq('user_id', currentUser.id)
      .eq('game_id', gameId);
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
          .from('game_list_items')
          .insert({ user_id: currentUser.id, game_id: gameId, list_type: listType });
        if (error && String(error.code || '') !== '23505') throw error;
        showNotification('Saved to list', 'success');
      } else {
        const { error } = await supabaseClient
          .from('game_list_items')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('game_id', gameId)
          .eq('list_type', listType);
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

  function bindUnifiedListMenu(config) {
    const saveBtn = document.getElementById('gameSaveBtn');
    if (!saveBtn || !gameId || !window.initIndexStyleListMenu) return;

    window.initIndexStyleListMenu({
      mediaType: 'game',
      itemIdAttr: 'data-item-id',
      getVisibleItemIds: () => gameId ? [gameId] : [],
      getQuickStatusForItem: (itemId) => {
        if (itemId !== gameId) return null;
        return { ...listStatus };
      },
      getItemFromCard: () => ({
        mediaType: 'game',
        itemId: gameId,
        title: config.title,
        subtitle: config.metadata.find(m => m.type === 'year')?.value || '',
        image: config.posterUrl
      }),
      ensureClient: async () => {
        if (supabaseClient) return supabaseClient;
        return initSupabase();
      },
      getCurrentUser: () => currentUser,
      notify: (message, isError) => showNotification(message, isError ? 'error' : 'success'),
      toggleDefaultList: async ({ listType, nextSaved }) => toggleList(listType, nextSaved)
    });

    saveBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.openIndexStyleListMenu(saveBtn);
    });
  }

  /* ---------- Reviews ---------- */

  async function initReviewSystem() {
    if (!gameId) return;
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        sortAndRenderReviews();
      });
    }
    const reviewForm = document.getElementById('review-form');
    if (reviewForm) {
      reviewForm.addEventListener('submit', submitReview);
    }
    const cancelBtn = document.querySelector('.cancel-edit-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => resetReviewForm());
    }
    const commentTextarea = document.getElementById('review-comment');
    if (commentTextarea) {
      commentTextarea.addEventListener('input', () => {
        const count = document.getElementById('charCount');
        if (count) count.textContent = String(commentTextarea.value.length);
      });
    }
    document.querySelectorAll('.star').forEach(star => {
      star.addEventListener('click', () => {
        currentRating = parseInt(star.dataset.rating, 10);
        updateStarDisplay();
      });
    });
    await loadReviews();
  }

  function renderReviewFormVisibility() {
    const form = document.getElementById('review-form');
    const prompt = document.getElementById('auth-prompt');
    const reviewsSection = document.getElementById('reviews-section');
    if (!form || !prompt) return;
    if (currentUser) {
      form.classList.remove('hidden');
      prompt.classList.add('hidden');
      if (reviewsSection) reviewsSection.hidden = false;
    } else {
      form.classList.add('hidden');
      prompt.classList.remove('hidden');
      if (reviews.length === 0 && reviewsSection) reviewsSection.hidden = true;
    }
  }

  async function loadReviews() {
    const container = document.getElementById('reviewsList');
    const statsContainer = document.getElementById('reviewsStats');
    const reviewsSection = document.getElementById('reviews-section');
    if (!container || !statsContainer || !supabaseClient) return;
    container.innerHTML = '<div class="reviews-loading">Loading reviews...</div>';

    const { data, error } = await supabaseClient
      .from('game_reviews')
      .select('*')
      .eq('game_id', gameId)
      .order('created_at', { ascending: false });

    if (error) {
      container.innerHTML = '<div class="reviews-empty">Error loading reviews.</div>';
      statsContainer.innerHTML = '<div class="reviews-empty">Error loading stats.</div>';
      return;
    }
    reviews = data || [];
    if (reviews.length === 0 && !currentUser) {
      if (reviewsSection) reviewsSection.hidden = true;
      return;
    }
    if (reviewsSection) reviewsSection.hidden = false;
    if (reviews.length === 0) {
      container.innerHTML = '<div class="reviews-empty">No reviews yet. Be the first to share your thoughts!</div>';
      statsContainer.innerHTML = `
        <div class="elevated-review-big">
          <div class="elevated-review-big-value">—<span class="elevated-review-big-denom">/5</span></div>
          <div class="elevated-review-big-stars">
            <i class="fa-regular fa-star"></i><i class="fa-regular fa-star"></i><i class="fa-regular fa-star"></i><i class="fa-regular fa-star"></i><i class="fa-regular fa-star"></i>
          </div>
          <div class="elevated-review-big-count">be the first to review</div>
        </div>
      `;
      return;
    }

    const totalReviews = reviews.length;
    const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;
    const ratingDistribution = {5: 0, 4: 0, 3: 0, 2: 0, 1: 0};
    reviews.forEach(review => ratingDistribution[review.rating]++);

    const fullStars = Math.round(averageRating);
    let starsHtml = '';
    for (let i = 0; i < 5; i++) {
      starsHtml += `<i class="${i < fullStars ? 'fa-solid' : 'fa-regular'} fa-star"></i>`;
    }

    statsContainer.innerHTML = `
      <div class="elevated-review-big">
        <div class="elevated-review-big-value">${averageRating.toFixed(1)}<span class="elevated-review-big-denom">/5</span></div>
        <div class="elevated-review-big-stars">${starsHtml}</div>
        <div class="elevated-review-big-count">${totalReviews} review${totalReviews === 1 ? '' : 's'}</div>
      </div>
      <div class="elevated-review-bars">
        ${[5,4,3,2,1].map(stars => `
          <div class="elevated-review-bar-row">
            <span class="label">${stars}★</span>
            <div class="elevated-review-bar">
              <div class="elevated-review-bar-fill" style="width: ${(ratingDistribution[stars] / totalReviews) * 100}%"></div>
            </div>
            <span class="count">${ratingDistribution[stars]}</span>
          </div>
        `).join('')}
      </div>
    `;

    const sortCtrl = document.getElementById('reviewsSortControls');
    if (sortCtrl) sortCtrl.classList.remove('hidden');
    sortAndRenderReviews();
  }

  function sortAndRenderReviews() {
    if (!reviews || reviews.length === 0) return;
    let sorted = [...reviews];
    if (currentSort === 'highest') sorted.sort((a, b) => b.rating - a.rating);
    if (currentSort === 'lowest') sorted.sort((a, b) => a.rating - b.rating);
    displayReviews(sorted);
  }

  function renderStarRating(rating, options = {}) {
    const raw = Number(rating || 0);
    const safe = Number.isFinite(raw) ? Math.max(0, Math.min(5, raw)) : 0;
    const filled = Math.round(safe);
    const wrapper = options.wrapper !== false;
    let html = wrapper ? '<span class="rating-stars" aria-label="' + safe.toFixed(1) + '/5">' : '';
    for (let i = 0; i < 5; i += 1) {
      html += '<span class="rating-star' + (i < filled ? ' is-filled' : '') + '" aria-hidden="true"></span>';
    }
    if (wrapper) html += '</span>';
    return html;
  }

  async function displayReviews(reviewsToDisplay) {
    const container = document.getElementById('reviewsList');
    if (!container) return;
    if (!reviewsToDisplay || reviewsToDisplay.length === 0) {
      container.innerHTML = '<div class="reviews-empty">No reviews yet.</div>';
      return;
    }

    const userIds = [...new Set(reviewsToDisplay.map(r => r.user_id))];
    let userMap = {};
    if (userIds.length && supabaseClient) {
      const { data: users } = await supabaseClient
        .from('user_profiles')
        .select('id, username, full_name')
        .in('id', userIds);
      (users || []).forEach(u => {
        if (u.id) userMap[u.id] = u;
      });
    }

    container.innerHTML = reviewsToDisplay.map(review => {
      const user = userMap[review.user_id];
      const reviewUsernameRaw = String(review?.username || review?.user_name || '').trim();
      const isAutoUsername = /^user-[a-f0-9]{6,}$/i.test(reviewUsernameRaw);
      const reviewUsername = isAutoUsername ? '' : reviewUsernameRaw;
      const username = String(user?.username || reviewUsername).trim();
      const fallbackName = String(user?.full_name || '').trim();
      const displayName = username ? `@${username}` : (fallbackName || 'User');
      const initialsBase = username || fallbackName || 'User';
      const initials = initialsBase.split(/\s+/).map(n => n[0]).slice(0, 2).join('').toUpperCase();
      const profileHref = `profile.html?id=${encodeURIComponent(review.user_id)}`;
      const canEditDelete = currentUser && currentUser.id === review.user_id;

      return `
        <div class="review-card" id="review-${review.id}" data-review-id="${review.id}">
          <div class="review-header">
            <div class="reviewer-info">
              <a class="reviewer-avatar reviewer-link" href="${profileHref}" aria-label="View ${escapeHtml(displayName)} profile">${escapeHtml(initials)}</a>
              <div>
                <div class="reviewer-name"><a class="reviewer-link" href="${profileHref}">${escapeHtml(displayName)}</a></div>
                <div class="review-date">${new Date(review.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
              </div>
            </div>
            <div class="review-rating">${renderStarRating(review.rating)}</div>
          </div>
          <p class="review-comment">${escapeHtml(review.comment || '')}</p>
          ${canEditDelete ? `
            <div class="review-actions">
              <button class="review-edit" onclick="editReview('${review.id}')">Edit</button>
              <button class="review-delete" onclick="deleteReview('${review.id}')">Delete</button>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    if (window.ZO2Y_REVIEW_INTERACTIONS && supabaseClient) {
      await window.ZO2Y_REVIEW_INTERACTIONS.mount({
        container,
        reviews: reviewsToDisplay,
        reviewSource: 'game_reviews',
        mediaType: 'game',
        currentUser,
        supabaseClient,
        notify: (message, level) => showNotification(message, level || 'info'),
        cardSelector: '.review-card',
        reviewIdAttribute: 'data-review-id'
      });
    }
  }

  function updateStarDisplay() {
    const stars = document.querySelectorAll('.star');
    const ratingText = document.getElementById('ratingText');
    stars.forEach(star => {
      const starRating = parseInt(star.dataset.rating, 10);
      star.classList.toggle('active', starRating <= currentRating);
    });
    const ratingTexts = ['select your rating', 'poor', 'fair', 'good', 'very good', 'excellent'];
    if (ratingText) ratingText.textContent = ratingTexts[currentRating] || 'select your rating';
  }

  async function submitReview(e) {
    e.preventDefault();
    if (!currentUser) {
      showNotification('Please sign in to submit a review', 'info');
      return;
    }
    const comment = document.getElementById('review-comment').value.trim();
    if (!currentRating) {
      showNotification('Please select a rating', 'info');
      return;
    }
    const payload = { game_id: gameId, user_id: currentUser.id, rating: currentRating, comment };
    let error = null;
    if (editingReviewId) {
      const { error: updateError } = await supabaseClient
        .from('game_reviews')
        .update(payload)
        .eq('id', editingReviewId);
      error = updateError;
    } else {
      const { error: insertError } = await supabaseClient
        .from('game_reviews')
        .insert(payload);
      error = insertError;
    }
    if (error) {
      showNotification('Error submitting review', 'error');
      return;
    }
    resetReviewForm();
    await loadReviews();
    showNotification('Review saved', 'success');
  }

  window.editReview = async function (reviewId) {
    if (!supabaseClient) return;
    const { data: review } = await supabaseClient
      .from('game_reviews')
      .select('*')
      .eq('id', reviewId)
      .single();
    if (!review) return;
    editingReviewId = reviewId;
    currentRating = review.rating;
    document.getElementById('review-comment').value = review.comment || '';
    updateStarDisplay();
    const submitText = document.querySelector('#review-form button[type="submit"] .btn-text');
    if (submitText) submitText.textContent = 'update review';
    const cancelBtn = document.querySelector('.cancel-edit-btn');
    if (cancelBtn) cancelBtn.classList.remove('hidden');
  };

  window.deleteReview = async function (reviewId) {
    if (!currentUser) {
      showNotification('Please sign in to delete reviews', 'info');
      return;
    }
    if (!confirm('Delete this review?')) return;
    const { error } = await supabaseClient
      .from('game_reviews')
      .delete()
      .eq('id', reviewId);
    if (error) {
      showNotification('Error deleting review', 'error');
      return;
    }
    await loadReviews();
    showNotification('Review deleted', 'success');
  };

  function resetReviewForm() {
    editingReviewId = null;
    currentRating = 0;
    const form = document.getElementById('review-form');
    if (form) form.reset();
    updateStarDisplay();
    const submitText = document.querySelector('#review-form button[type="submit"] .btn-text');
    if (submitText) submitText.textContent = 'submit review';
    const cancelBtn = document.querySelector('.cancel-edit-btn');
    if (cancelBtn) cancelBtn.classList.add('hidden');
    const count = document.getElementById('charCount');
    if (count) count.textContent = '0';
  }

  (async function init() {
    await initSupabase();
    await initAuth();
    await loadGame();
    await initReviewSystem();
  })().catch(err => {
    console.error('Game initialization failed:', err);
  });
})();
