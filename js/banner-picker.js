/* =========================================================
   BANNER PICKER V3 — Premium Visual Redesign
   ========================================================= */
window.BannerPicker = (function () {
  'use strict';

  /* ── state ────────────────────────────────────────────── */
  let isOpen = false;
  let currentMode = 'static';       // 'static' | 'rotate'
  let currentDomain = 'media';     // 'media' | 'lifestyle'
  let selectedMedia = null;          // { type, id, title, year }

  let draftStaticItem = null;        // { media_type, media_id, title, url, pos_y }
  let draftRotateQueue = [];
  let hasChanges = false;

  /* crop drag */
  let isDragging = false;
  let dragStartY = 0;
  let initialPosY = 15;

  /* search & filters */
  let searchTimeout = null;
  let currentSearchAbort = null;
  let activeCategoryFilter = 'all';

  /* lifestyle caches */
  let sportsCoversCache = null;
  let brandCoversCache = null;

  /* lifestyle datasets */
  const LIFESTYLE_CAR_ITEMS = [
    { id: 'porsche-911', title: 'Porsche 911 GT3 RS', poster: 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&cs=tinysrgb&w=800' },
    { id: 'ferrari-laferrari', title: 'Ferrari LaFerrari', poster: 'https://images.pexels.com/photos/337909/pexels-photo-337909.jpeg?auto=compress&cs=tinysrgb&w=800' },
    { id: 'lambo-aventador', title: 'Lamborghini Aventador', poster: 'https://images.pexels.com/photos/3972755/pexels-photo-3972755.jpeg?auto=compress&cs=tinysrgb&w=800' },
    { id: 'bmw-m4', title: 'BMW M4 Competition', poster: 'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg?auto=compress&cs=tinysrgb&w=800' },
    { id: 'mercedes-amg', title: 'Mercedes-AMG GT', poster: 'https://images.pexels.com/photos/112460/pexels-photo-112460.jpeg?auto=compress&cs=tinysrgb&w=800' },
    { id: 'aston-martin', title: 'Aston Martin DBS', poster: 'https://images.pexels.com/photos/210019/pexels-photo-210019.jpeg?auto=compress&cs=tinysrgb&w=800' },
    { id: 'audi-r8', title: 'Audi R8 V10', poster: 'https://images.pexels.com/photos/1149831/pexels-photo-1149831.jpeg?auto=compress&cs=tinysrgb&w=800' },
    { id: 'bugatti-chiron', title: 'Bugatti Chiron', poster: 'https://images.pexels.com/photos/909907/pexels-photo-909907.jpeg?auto=compress&cs=tinysrgb&w=800' }
  ];

  const LIFESTYLE_TRAVEL_ITEMS = [
    { id: 'tokyo', title: 'Tokyo, Japan', poster: 'https://images.pexels.com/photos/2506923/pexels-photo-2506923.jpeg?auto=compress&cs=tinysrgb&w=800' },
    { id: 'paris', title: 'Paris, France', poster: 'https://images.pexels.com/photos/699466/pexels-photo-699466.jpeg?auto=compress&cs=tinysrgb&w=800' },
    { id: 'amalfi', title: 'Amalfi Coast, Italy', poster: 'https://images.pexels.com/photos/532826/pexels-photo-532826.jpeg?auto=compress&cs=tinysrgb&w=800' },
    { id: 'swiss', title: 'Swiss Alps, Switzerland', poster: 'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=800' },
    { id: 'maldives', title: 'Maldives Islands', poster: 'https://images.pexels.com/photos/1483053/pexels-photo-1483053.jpeg?auto=compress&cs=tinysrgb&w=800' },
    { id: 'reykjavik', title: 'Reykjavik, Iceland', poster: 'https://images.pexels.com/photos/1009136/pexels-photo-1009136.jpeg?auto=compress&cs=tinysrgb&w=800' },
    { id: 'santorini', title: 'Santorini, Greece', poster: 'https://images.pexels.com/photos/1010657/pexels-photo-1010657.jpeg?auto=compress&cs=tinysrgb&w=800' },
    { id: 'nyc', title: 'New York City, USA', poster: 'https://images.pexels.com/photos/290386/pexels-photo-290386.jpeg?auto=compress&cs=tinysrgb&w=800' }
  ];

  /* recently used (localStorage) */
  let recentlyUsed = [];
  try {
    const stored = localStorage.getItem('zo2y_recently_used_banners');
    if (stored) recentlyUsed = JSON.parse(stored);
  } catch (_e) { /* ignore */ }

  /* ── helpers ──────────────────────────────────────────── */
  const $ = (id) => document.getElementById(id);
  const escHtml = (s) => String(s || '').replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
  const jsEsc = (s) => String(s || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  function getSupabase() {
    return window.supabase || window.sb || window.ZO2Y_AUTH?.supabase || null;
  }

  function getUserId() {
    if (window.ProfileManager && typeof window.ProfileManager.getCurrentUserId === 'function') {
      const pId = window.ProfileManager.getCurrentUserId();
      if (pId) return pId;
    }
    if (window.currentUser && window.currentUser.id) {
      return window.currentUser.id;
    }
    if (window.userProfile && (window.userProfile.id || window.userProfile.user_id)) {
      return window.userProfile.id || window.userProfile.user_id;
    }
    if (window.ZO2Y_AUTH) {
      if (typeof window.ZO2Y_AUTH.getUser === 'function') {
        const u = window.ZO2Y_AUTH.getUser();
        if (u && u.id) return u.id;
      }
      if (window.ZO2Y_AUTH.session?.user?.id) {
        return window.ZO2Y_AUTH.session.user.id;
      }
    }
    try {
      const storedId = localStorage.getItem('zo2y_current_user_id');
      if (storedId) return storedId;
    } catch (_e) {}
    try {
      const authSession = localStorage.getItem('sb-zo2y-auth-token') || localStorage.getItem('supabase.auth.token');
      if (authSession) {
        const parsed = JSON.parse(authSession);
        if (parsed?.user?.id) return parsed.user.id;
        if (parsed?.currentSession?.user?.id) return parsed.currentSession.user.id;
      }
    } catch (_e) {}
    return 'default_user';
  }

  function isUuid(str) {
    return typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
  }

  function getUserProfile() {
    return window.userProfile || {};
  }

  /* ── skeletons ────────────────────────────────────────── */
  function skeletons(n, type) {
    let h = '';
    for (let i = 0; i < n; i++) {
      if (type === 'poster') {
        h += '<div class="bp-poster-card"><div class="bp-poster-img-wrap bp-skeleton"></div><div class="bp-skeleton" style="height:12px;width:70%;margin-top:8px;border-radius:4px"></div><div class="bp-skeleton" style="height:10px;width:40%;margin-top:4px;border-radius:4px"></div></div>';
      } else if (type === 'backdrop') {
        h += '<div class="bp-backdrop-card bp-skeleton"></div>';
      } else if (type === 'carousel') {
        h += '<div class="bp-carousel-card bp-skeleton"></div>';
      }
    }
    return h;
  }

  /* ── init (wire UI controls & pointer drag) ──────────── */
  function init() {
    if (window.InteractionManager) {
      window.InteractionManager.onPress('bpBackBtn', goBack);
      window.InteractionManager.onPress('bpCloseBtn', closePicker);
      window.InteractionManager.onPress('bpCancelBtn', closePicker);
      window.InteractionManager.onPress('bpApplyBtn', applyBanner);
      window.InteractionManager.onPress('bpModeStaticBtn', () => setMode('static'));
      window.InteractionManager.onPress('bpModeRotateBtn', () => setMode('rotate'));

      window.InteractionManager.onDrag('bpLiveBanner', {
        onStart: (e) => {
          if (!draftStaticItem || !draftStaticItem.url) return false;
          isDragging = true;
          dragStartY = e.clientY;
          initialPosY = draftStaticItem.pos_y || 15;
          const hint = $('bpDragHint');
          if (hint) hint.style.display = 'block';
        },
        onMove: (e) => {
          if (!isDragging || !draftStaticItem) return;
          const dy = e.clientY - dragStartY;
          const newPosY = Math.max(0, Math.min(100, initialPosY + Math.round(dy / 2)));
          draftStaticItem.pos_y = newPosY;
          markChanged();

          const bannerImg = $('bpLiveImage');
          if (bannerImg) bannerImg.style.objectPosition = `center ${newPosY}%`;
        },
        onEnd: () => {
          isDragging = false;
          const hint = $('bpDragHint');
          if (hint) hint.style.display = 'none';
        }
      });
    }

    const searchInput = $('bpSearchInput');
    if (searchInput && !searchInput.dataset.wired) {
      searchInput.dataset.wired = '1';
      searchInput.addEventListener('input', onSearchInput);
      searchInput.addEventListener('focus', onSearchFocus);
    }
  }

  /* ── open / close ─────────────────────────────────────── */
  function openPicker() {
    isOpen = true;
    hasChanges = false;

    const profile = getUserProfile();
    currentMode = (profile.backdrop_mode === 'rotate') ? 'rotate' : 'static';
    const items = profile.banner_items || [];
    draftRotateQueue = items.map(i => ({ ...i }));
    draftStaticItem = items.length > 0 ? { ...items[0] } : null;

    /* populate preview with exact profile header fields */
    const username = profile.username || $('profileUsername')?.textContent?.replace(/^@/, '') || 'jnn';
    const name = profile.full_name || $('profileName')?.textContent || username;
    const bio = profile.bio || $('profileBio')?.textContent || 'No bio yet.';
    const location = profile.location || $('profileLocation')?.textContent || 'Cairo';
    const memberSince = $('memberSince')?.textContent || 'Member since 2025';
    const avatarEl = $('profileAvatar');

    const pName = $('bpLiveName');
    const pUser = $('bpLiveUsername');
    const pBio = $('bpLiveBio');
    const pAvatar = $('bpLiveAvatar');
    const pLocation = $('bpLiveLocation');
    const pMemberSince = $('bpLiveMemberSince');
    const pSaved = $('bpLiveSavedCount');
    const pLists = $('bpLiveListsCount');
    const pReviews = $('bpLiveReviewsCount');
    const pFollowers = $('bpLiveFollowersCount');

    if (pName) pName.textContent = name;
    if (pUser) pUser.textContent = '@' + username.replace(/^@/, '');
    if (pBio) pBio.textContent = bio;
    if (pLocation) pLocation.textContent = location;
    if (pMemberSince) pMemberSince.textContent = memberSince;
    if (pAvatar && avatarEl) pAvatar.innerHTML = avatarEl.innerHTML;

    if (pSaved) pSaved.textContent = $('visitedCount')?.textContent || '225';
    if (pLists) pLists.textContent = $('listsCount')?.textContent || '6';
    if (pReviews) pReviews.textContent = $('reviewsCount')?.textContent || '10';
    if (pFollowers) pFollowers.textContent = $('followersCount')?.textContent || '1';

    if (draftStaticItem && draftStaticItem.url) {
      updateLivePreview(draftStaticItem.url, draftStaticItem.pos_y || 15);
    } else {
      updateLivePreview('', 15);
    }

    /* mode radios */
    const modeStatic = $('bpModeStatic');
    const modeRotate = $('bpModeRotate');
    if (modeStatic) modeStatic.checked = currentMode === 'static';
    if (modeRotate) modeRotate.checked = currentMode === 'rotate';
    updateModeUI();

    /* show modal & lock background scroll */
    const modal = $('bannerPickerModal');
    if (modal) {
      modal.classList.add('show', 'active');
      modal.style.display = 'flex';
    }
    document.documentElement.classList.add('bp-modal-open');
    document.body.classList.add('bp-modal-open');

    /* clear search */
    const searchInput = $('bpSearchInput');
    if (searchInput) searchInput.value = '';

    /* load suggested */
    loadSuggested();
    updateApplyBtn();

    /* render queue if rotate */
    if (currentMode === 'rotate') renderQueue();
  }

  function closePicker() {
    isOpen = false;
    const modal = $('bannerPickerModal');
    if (modal) {
      modal.classList.remove('show', 'active');
      modal.style.display = 'none';
    }
    document.documentElement.classList.remove('bp-modal-open');
    document.body.classList.remove('bp-modal-open');
    abortSearch();
  }

  /* ── mode switching ───────────────────────────────────── */
  function setMode(mode) {
    currentMode = mode;
    updateModeUI();
    markChanged();

    if (mode === 'rotate') {
      renderQueue();
    }
  }

  function updateModeUI() {
    const btnStatic = $('bpModeStaticBtn');
    const btnRotate = $('bpModeRotateBtn');
    if (btnStatic) btnStatic.classList.toggle('active', currentMode === 'static');
    if (btnRotate) btnRotate.classList.toggle('active', currentMode === 'rotate');

    const queueSection = $('bpQueueSection');
    if (queueSection) {
      queueSection.style.display = currentMode === 'rotate' ? 'block' : 'none';
    }
  }

  /* ── search ───────────────────────────────────────────── */
  function abortSearch() {
    if (currentSearchAbort) {
      currentSearchAbort.abort();
      currentSearchAbort = null;
    }
    clearTimeout(searchTimeout);
  }

  function onSearchInput(e) {
    const query = e.target.value.trim();
    abortSearch();

    if (!query) {
      showSection('suggested');
      return;
    }

    searchTimeout = setTimeout(() => performSearch(query), 350);
  }

  function onSearchFocus() {
    if (window.innerWidth <= 900) {
      setTimeout(() => {
        const modal = $('bannerPickerModal');
        if (modal) modal.scrollTo({ top: 0, behavior: 'smooth' });
      }, 300);
    }
  }

  function setDomain(domain) {
    currentDomain = domain || 'media';
    activeCategoryFilter = 'all';

    const btnMedia = $('bpDomainMedia');
    const btnLifestyle = $('bpDomainLifestyle');
    if (btnMedia) btnMedia.classList.toggle('active', currentDomain === 'media');
    if (btnLifestyle) btnLifestyle.classList.toggle('active', currentDomain === 'lifestyle');

    renderCategoryPills();

    const query = ($('bpSearchInput')?.value || '').trim();
    if (query) {
      performSearch(query);
    } else {
      loadSuggested();
    }
  }

  function renderCategoryPills() {
    const bar = $('bpCategoryFilterBar');
    if (!bar) return;

    if (currentDomain === 'media') {
      bar.innerHTML = `
        <button type="button" class="bp-cat-pill ${activeCategoryFilter === 'all' ? 'active' : ''}" data-cat="all" onclick="BannerPicker.setCategoryFilter('all')">All</button>
        <button type="button" class="bp-cat-pill ${activeCategoryFilter === 'movie' ? 'active' : ''}" data-cat="movie" onclick="BannerPicker.setCategoryFilter('movie')"><i class="fas fa-film"></i> Movies</button>
        <button type="button" class="bp-cat-pill ${activeCategoryFilter === 'tv' ? 'active' : ''}" data-cat="tv" onclick="BannerPicker.setCategoryFilter('tv')"><i class="fas fa-tv"></i> TV Shows</button>
        <button type="button" class="bp-cat-pill ${activeCategoryFilter === 'anime' ? 'active' : ''}" data-cat="anime" onclick="BannerPicker.setCategoryFilter('anime')"><i class="fas fa-dragon"></i> Anime</button>
        <button type="button" class="bp-cat-pill ${activeCategoryFilter === 'game' ? 'active' : ''}" data-cat="game" onclick="BannerPicker.setCategoryFilter('game')"><i class="fas fa-gamepad"></i> Games</button>
        <button type="button" class="bp-cat-pill ${activeCategoryFilter === 'book' ? 'active' : ''}" data-cat="book" onclick="BannerPicker.setCategoryFilter('book')"><i class="fas fa-book"></i> Books</button>
        <button type="button" class="bp-cat-pill ${activeCategoryFilter === 'music' ? 'active' : ''}" data-cat="music" onclick="BannerPicker.setCategoryFilter('music')"><i class="fas fa-music"></i> Music</button>
      `;
    } else {
      bar.innerHTML = `
        <button type="button" class="bp-cat-pill ${activeCategoryFilter === 'all' ? 'active' : ''}" data-cat="all" onclick="BannerPicker.setCategoryFilter('all')">All</button>
        <button type="button" class="bp-cat-pill ${activeCategoryFilter === 'sports' ? 'active' : ''}" data-cat="sports" onclick="BannerPicker.setCategoryFilter('sports')"><i class="fas fa-football-ball"></i> Sports</button>
        <button type="button" class="bp-cat-pill ${activeCategoryFilter === 'brand' ? 'active' : ''}" data-cat="brand" onclick="BannerPicker.setCategoryFilter('brand')"><i class="fas fa-tag"></i> Brands</button>
        <button type="button" class="bp-cat-pill ${activeCategoryFilter === 'food' ? 'active' : ''}" data-cat="food" onclick="BannerPicker.setCategoryFilter('food')"><i class="fas fa-utensils"></i> Food</button>
        <button type="button" class="bp-cat-pill ${activeCategoryFilter === 'travel' ? 'active' : ''}" data-cat="travel" onclick="BannerPicker.setCategoryFilter('travel')"><i class="fas fa-plane"></i> Travel</button>
        <button type="button" class="bp-cat-pill ${activeCategoryFilter === 'car' ? 'active' : ''}" data-cat="car" onclick="BannerPicker.setCategoryFilter('car')"><i class="fas fa-car"></i> Cars</button>
      `;
    }
  }

  function setCategoryFilter(cat) {
    activeCategoryFilter = cat;
    document.querySelectorAll('.bp-cat-pill').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-cat') === cat);
    });
    const query = ($('bpSearchInput')?.value || '').trim();
    if (query) {
      performSearch(query);
    } else {
      loadSuggested();
    }
  }

  async function performSearch(query) {
    showSection('search');
    const grid = $('bpSearchGrid');
    const title = $('bpSearchTitle');
    const empty = $('bpEmptyState');
    if (title) title.textContent = `Searching "${query}"...`;
    if (grid) grid.innerHTML = skeletons(12, 'poster');
    if (empty) empty.style.display = 'none';

    const controller = new AbortController();
    currentSearchAbort = controller;
    const signal = controller.signal;

    try {
      let results = [];

      /* TMDB Search: Movies, TV Shows, Anime */
      const res = await fetch(`/api/tmdb/search/multi?query=${encodeURIComponent(query)}&language=en`, { signal });
      if (res.ok) {
        const data = await res.json();
        if (data.results) {
          data.results.filter(r => r.media_type === 'movie' || r.media_type === 'tv').slice(0, 18).forEach(r => {
            const isAnime = r.original_language === 'ja' || (r.genre_ids && r.genre_ids.includes(16));
            const itemType = isAnime && r.media_type === 'tv' ? 'anime' : r.media_type;
            results.push({
              type: itemType,
              id: String(r.id),
              title: r.title || r.name || 'Untitled',
              year: (r.release_date || r.first_air_date || '').split('-')[0],
              poster: r.poster_path ? `https://image.tmdb.org/t/p/w342${r.poster_path}` : '',
              label: itemType === 'anime' ? 'ANIME' : (itemType === 'movie' ? 'MOVIE' : 'TV SHOW')
            });
          });
        }
      }

      if (signal.aborted) return;

      if (results.length === 0) {
        if (grid) grid.innerHTML = '';
        if (empty) empty.style.display = 'block';
        if (title) title.style.display = 'none';
        return;
      }

      if (title) { title.textContent = `Search Results (${results.length})`; title.style.display = ''; }
      if (grid) {
        grid.innerHTML = results.map(item => `
          <div class="bp-poster-card" onclick="BannerPicker.selectMedia('${jsEsc(item.type)}', '${jsEsc(item.id)}', '${jsEsc(item.title)}', '${jsEsc(item.year)}')">
            <div class="bp-poster-img-wrap">
              ${item.poster ? `<img src="${jsEsc(item.poster)}" loading="lazy" alt="">` : '<div class="bp-poster-placeholder"><i class="fas fa-film"></i></div>'}
            </div>
            <div class="bp-poster-title">${escHtml(item.title)}</div>
            <div class="bp-poster-meta">${escHtml(item.label)} ${item.year ? '• ' + escHtml(item.year) : ''}</div>
          </div>
        `).join('');
      }
    } catch (e) {
      if (e.name === 'AbortError') return;
      if (grid) grid.innerHTML = '';
      if (empty) empty.style.display = 'block';
    }
  }

  /* ── section management ──────────────────────────────── */
  function showSection(name) {
    const sections = ['suggested', 'search', 'backdrops'];
    sections.forEach(s => {
      const el = $('bpSection_' + s);
      if (el) el.style.display = s === name ? '' : 'none';
    });
  }

  /* ── load suggested (Popular items) ─────────────────── */
  async function loadSuggested() {
    showSection('suggested');
    const grid = $('bpSuggestedGrid');
    if (grid) grid.innerHTML = skeletons(12, 'poster');

    /* Popular TMDB movies and TV shows */
    let items = [];
    try {
      const res = await fetch('/api/tmdb/movie/popular?language=en-US&page=1');
      if (res.ok) {
        const data = await res.json();
        if (data && data.results) {
          data.results.slice(0, 10).forEach(r => {
            items.push({
              type: 'movie',
              id: String(r.id),
              title: r.title || r.name,
              year: (r.release_date || '').split('-')[0],
              poster: r.poster_path ? `https://image.tmdb.org/t/p/w342${r.poster_path}` : '',
              label: 'MOVIE'
            });
          });
        }
      }

      const tvRes = await fetch('/api/tmdb/tv/popular?language=en-US&page=1');
      if (tvRes.ok) {
        const data = await tvRes.json();
        if (data && data.results) {
          data.results.slice(0, 8).forEach(r => {
            items.push({
              type: 'tv',
              id: String(r.id),
              title: r.name || r.title,
              year: (r.first_air_date || '').split('-')[0],
              poster: r.poster_path ? `https://image.tmdb.org/t/p/w342${r.poster_path}` : '',
              label: 'TV SHOW'
            });
          });
        }
      }
    } catch (_e) { /* ignore */ }

    if (grid) {
      if (items.length > 0) {
        grid.innerHTML = items.map(item => `
          <div class="bp-poster-card" onclick="BannerPicker.selectMedia('${jsEsc(item.type)}', '${jsEsc(item.id)}', '${jsEsc(item.title)}', '${jsEsc(item.year)}')">
            <div class="bp-poster-img-wrap">
              ${item.poster ? `<img src="${jsEsc(item.poster)}" loading="lazy" alt="">` : '<div class="bp-poster-placeholder"><i class="fas fa-film"></i></div>'}
            </div>
            <div class="bp-poster-title">${escHtml(item.title)}</div>
            <div class="bp-poster-meta">${escHtml(item.label)} ${item.year ? '• ' + escHtml(item.year) : ''}</div>
          </div>
        `).join('');
      } else {
        grid.innerHTML = '<div class="bp-empty-state"><div class="bp-empty-icon"><i class="fas fa-film"></i></div><div class="bp-empty-title">No items found</div></div>';
      }
    }
  }

  /* ── recently used ────────────────────────────────────── */
  function addToRecentlyUsed(item) {
    recentlyUsed = recentlyUsed.filter(r => r.url !== item.url);
    recentlyUsed.unshift(item);
    if (recentlyUsed.length > 8) recentlyUsed = recentlyUsed.slice(0, 8);
    try { localStorage.setItem('zo2y_recently_used_banners', JSON.stringify(recentlyUsed)); } catch (_e) { /* ignore */ }
  }

  function renderRecentlyUsed() {
    const container = $('bpRecentlyUsedRow');
    const label = $('bpRecentlyUsedLabel');
    if (!container) return;
    if (recentlyUsed.length === 0) {
      container.style.display = 'none';
      if (label) label.style.display = 'none';
      return;
    }
    container.style.display = '';
    if (label) label.style.display = '';
    container.innerHTML = recentlyUsed.map(item => `
      <div class="bp-carousel-card" onclick="BannerPicker.quickSelect('${jsEsc(item.media_type)}', '${jsEsc(item.media_id)}', '${jsEsc(item.title)}', '${jsEsc(item.url)}')">
        <img src="${jsEsc(item.url)}" loading="lazy" alt="">
        <div class="bp-carousel-label">${escHtml(item.title)}</div>
      </div>
    `).join('');
  }

  /* quick-select (from carousel/recently used — already has a URL) */
  function quickSelect(type, id, title, url) {
    selectedMedia = { type, id, title, year: '' };
    draftStaticItem = {
      media_type: type,
      media_id: id,
      title: title,
      url: url,
      pos_y: 15
    };
    updateLivePreview(url, 15);
    markChanged();

    /* If rotate mode, add to queue */
    if (currentMode === 'rotate') {
      if (!draftRotateQueue.find(q => String(q.media_id) === String(id) && q.media_type === type)) {
        draftRotateQueue.push({ ...draftStaticItem });
        renderQueue();
      }
    }
  }

  /* ── select media (show its backdrops) ────────────────── */
  async function selectMedia(type, id, title, year) {
    selectedMedia = { type, id, title, year };
    showSection('backdrops');

    const grid = $('bpBackdropGrid');
    const breadcrumb = $('bpBreadcrumb');
    const previewWrap = $('bpLivePreviewWrap');
    if (previewWrap) previewWrap.style.display = '';

    let icon = '🎬';
    if (type === 'game') icon = '🎮';
    if (type === 'tv' || type === 'anime') icon = '📺';
    if (type === 'book') icon = '📚';
    if (type === 'music') icon = '🎵';
    if (type === 'brand') icon = '👕';
    if (breadcrumb) breadcrumb.innerHTML = `${icon} <span>${escHtml(title)}</span> ${year ? '• ' + escHtml(year) : ''}`;

    if (grid) grid.innerHTML = skeletons(8, 'backdrop');

    /* If rotate mode, add to queue automatically (fetch url first) */
    if (currentMode === 'rotate') {
      const url = await fetchSingleBackdrop(type, id);
      if (url && !draftRotateQueue.find(q => String(q.media_id) === String(id) && q.media_type === type)) {
        draftRotateQueue.push({ media_type: type, media_id: id, title, url, pos_y: 15 });
        markChanged();
        renderQueue();
      }
    }

    /* Fetch all available backdrops */
    try {
      let urls = [];
      if (type === 'movie' || type === 'tv' || type === 'anime') {
        const endpoint = type === 'movie' ? 'movie' : 'tv';
        const res = await fetch(`/api/tmdb/${endpoint}/${id}/images`);
        const data = await res.json();
        if (data && data.backdrops && data.backdrops.length > 0) {
          urls = data.backdrops.map(b => `https://image.tmdb.org/t/p/w1280${b.file_path}`);
        }
      } else if (type === 'game') {
        const sb = getSupabase();
        if (sb) {
          const { data } = await sb.from('games').select('hero_url, background_url, screenshots').eq('id', id).maybeSingle();
          if (data) {
            if (data.hero_url) urls.push(data.hero_url);
            if (data.background_url) urls.push(data.background_url);
            if (Array.isArray(data.screenshots)) urls.push(...data.screenshots);
          }
        }
      } else if (type === 'brand' || type === 'food') {
        try {
          const coversRes = await fetch('/assets/data/brand_covers.json');
          if (coversRes.ok) {
            const covers = await coversRes.json();
            if (covers[id]) urls = Array.isArray(covers[id]) ? covers[id] : [covers[id]];
          }
        } catch (_e) { /* ignore */ }
      } else if (type === 'sports') {
        try {
          const coversRes = await fetch('/assets/data/sports_covers.json');
          if (coversRes.ok) {
            const covers = await coversRes.json();
            if (covers[id]) urls = Array.isArray(covers[id]) ? covers[id] : [covers[id]];
          }
        } catch (_e) { /* ignore */ }
      } else if (type === 'car') {
        const car = LIFESTYLE_CAR_ITEMS.find(c => c.id === id || c.title === title);
        if (car && car.poster) urls = [car.poster];
      } else if (type === 'travel') {
        const tr = LIFESTYLE_TRAVEL_ITEMS.find(t => t.id === id || t.title === title);
        if (tr && tr.poster) urls = [tr.poster];
      } else {
        /* Books, Music — try to get a single image */
        const url = await fetchSingleBackdrop(type, id);
        if (url) urls = [url];
      }

      if (urls.length === 0) {
        if (grid) grid.innerHTML = '<div class="bp-no-backdrops"><i class="fas fa-image"></i><p>No backdrops found for this title.</p></div>';
        return;
      }

      if (grid) {
        grid.innerHTML = urls.map(url => `
          <div class="bp-backdrop-card ${draftStaticItem && draftStaticItem.url === url ? 'selected' : ''}" onclick="BannerPicker.selectBackdrop('${jsEsc(url)}')">
            <img src="${jsEsc(url)}" loading="lazy" alt="">
          </div>
        `).join('');
      }

      /* Auto-select first if nothing is selected */
      if (!draftStaticItem || !draftStaticItem.url) {
        selectBackdrop(urls[0]);
      }
    } catch (_e) {
      if (grid) grid.innerHTML = '<div class="bp-no-backdrops"><i class="fas fa-exclamation-triangle"></i><p>Failed to load backdrops.</p></div>';
    }
  }

  /* ── fetch single backdrop URL (reuses ProfileBackdropEngine pattern) */
  async function fetchSingleBackdrop(type, id) {
    if (window.ProfileManager && window.ProfileManager.ProfileBackdropEngine && typeof window.ProfileManager.ProfileBackdropEngine.fetchBackdropUrl === 'function') {
      return await window.ProfileManager.ProfileBackdropEngine.fetchBackdropUrl({ media_type: type, media_id: id });
    }
    /* Fallback: manual fetch */
    try {
      if (type === 'movie' || type === 'tv' || type === 'anime') {
        const endpoint = type === 'movie' ? 'movie' : 'tv';
        const res = await fetch(`/api/tmdb/${endpoint}/${id}?language=en`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.backdrop_path) return `https://image.tmdb.org/t/p/w1280${data.backdrop_path}`;
        }
      } else if (type === 'game') {
        const sb = getSupabase();
        if (sb) {
          const { data } = await sb.from('games').select('hero_url, background_url').eq('id', id).maybeSingle();
          if (data) return data.hero_url || data.background_url || null;
        }
      }
    } catch (_e) { /* ignore */ }
    return null;
  }

  /* ── select backdrop ──────────────────────────────────── */
  function selectBackdrop(url) {
    if (!selectedMedia) return;
    draftStaticItem = {
      media_type: selectedMedia.type,
      media_id: selectedMedia.id,
      title: selectedMedia.title,
      url: url,
      pos_y: 15
    };

    /* Update grid selection state */
    const grid = $('bpBackdropGrid');
    if (grid) {
      grid.querySelectorAll('.bp-backdrop-card').forEach(c => c.classList.remove('selected'));
      const cards = grid.querySelectorAll('.bp-backdrop-card');
      cards.forEach(c => {
        const img = c.querySelector('img');
        if (img && img.src === url) c.classList.add('selected');
      });
    }

    updateLivePreview(url, 15);
    markChanged();
    addToRecentlyUsed(draftStaticItem);
  }

  /* ── live preview ─────────────────────────────────────── */
  function updateLivePreview(url, posY) {
    const img = $('bpLiveImage');
    if (!img) return;

    if (url && url.includes('/original/')) {
      url = url.replace('/original/', '/w1280/');
    }

    if (img.src !== url && url) {
      img.classList.add('bp-fade-out');
      setTimeout(() => {
        img.src = url;
        img.style.objectPosition = `center ${posY}%`;
        img.onload = () => img.classList.remove('bp-fade-out');
      }, 200);
    } else if (url) {
      img.style.objectPosition = `center ${posY}%`;
    }

    /* Update the drag hint visibility */
    const hint = $('bpDragHint');
    if (hint) hint.style.display = url ? '' : 'none';

    /* Also update the appearance mini preview */
    const mini = $('appearanceMiniBackdrop');
    if (mini && url) {
      mini.style.backgroundImage = `url('${url}')`;
      mini.style.backgroundPosition = `center ${posY}%`;
      mini.style.backgroundSize = 'cover';
      const emptyEl = $('appearanceBannerEmpty');
      if (emptyEl) emptyEl.style.display = 'none';
    }
  }

  /* ── drag to crop ─────────────────────────────────────── */
  function onDragStart(e) {
    if (!isOpen || currentMode !== 'static' || !draftStaticItem) return;
    isDragging = true;
    dragStartY = e.touches ? e.touches[0].clientY : e.clientY;
    initialPosY = draftStaticItem.pos_y || 15;
    if (e.cancelable) e.preventDefault();
  }

  function onDragMove(e) {
    if (!isDragging) return;
    if (e.cancelable) e.preventDefault();
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const banner = $('bpLiveBanner');
    if (!banner) return;
    const deltaY = clientY - dragStartY;
    const containerHeight = banner.offsetHeight;
    const deltaPercent = (deltaY / containerHeight) * 100;
    let newPosY = initialPosY - deltaPercent;
    newPosY = Math.max(0, Math.min(100, newPosY));
    draftStaticItem.pos_y = newPosY;
    updateLivePreview(draftStaticItem.url, newPosY);
    markChanged();
  }

  function onDragEnd() {
    isDragging = false;
  }

  /* ── rotation queue ───────────────────────────────────── */
  function renderQueue() {
    const list = $('bpQueueList');
    if (!list) return;
    if (draftRotateQueue.length === 0) {
      list.innerHTML = '<div class="bp-queue-empty"><i class="fas fa-sync"></i><p>Search for titles and select them to build your rotation.</p></div>';
      return;
    }
    list.innerHTML = draftRotateQueue.map((item, idx) => `
      <div class="bp-queue-item">
        <i class="fas fa-grip-vertical bp-queue-handle"></i>
        <div class="bp-queue-thumb">${item.url ? `<img src="${escHtml(item.url)}" alt="">` : ''}</div>
        <div class="bp-queue-info">
          <div class="bp-queue-title">${escHtml(item.title)}</div>
          <div class="bp-queue-meta">${escHtml((item.media_type || '').toUpperCase())}</div>
        </div>
        <button class="bp-queue-remove" onclick="BannerPicker.removeFromQueue(${idx})" aria-label="Remove">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `).join('');
  }

  function removeFromQueue(idx) {
    draftRotateQueue.splice(idx, 1);
    renderQueue();
    markChanged();
  }

  /* ── state helpers ────────────────────────────────────── */
  function markChanged() {
    hasChanges = true;
    updateApplyBtn();
  }

  function updateApplyBtn() {
    const btn = $('bpApplyBtn');
    if (btn) btn.disabled = !hasChanges;
  }

  /* ── back navigation (return to suggested from backdrops) */
  function goBack() {
    if ($('bpSection_backdrops') && $('bpSection_backdrops').style.display !== 'none') {
      showSection('suggested');
      selectedMedia = null;
    } else {
      closePicker();
    }
  }

  /* ── save / apply ─────────────────────────────────────── */
  async function applyBanner() {
    if (!hasChanges) return;

    const btn = $('bpApplyBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }

    const finalItems = currentMode === 'static'
      ? (draftStaticItem ? [draftStaticItem] : [])
      : draftRotateQueue;

    /* Update local profile object */
    if (!window.userProfile) window.userProfile = {};
    window.userProfile.backdrop_mode = currentMode;
    window.userProfile.banner_items = finalItems;

    const posY = finalItems.length > 0 ? (finalItems[0].pos_y || 15) : 15;
    const posX = 50;
    window.userProfile.banner_position_y = posY;
    window.userProfile.banner_position_x = posX;

    /* Update the Appearance mini-preview */
    const mini = $('appearanceMiniBackdrop');
    if (mini && finalItems.length > 0) {
      mini.style.backgroundImage = `url('${finalItems[0].url}')`;
      mini.style.backgroundPosition = `center ${posY}%`;
      mini.style.backgroundSize = 'cover';
      const emptyEl = $('appearanceBannerEmpty');
      if (emptyEl) emptyEl.style.display = 'none';
    }

    /* --- Persist to database & localStorage --- */
    const bannerUrl = finalItems.length > 0 ? (finalItems[0].url || '') : '';
    const bannerConfig = {
      items: finalItems,
      mode: currentMode,
      pos_y: Math.round(posY),
      pos_x: posX,
      banner_url: bannerUrl
    };

    const sb = getSupabase();
    const userId = getUserId();

    if (userId) {
      try {
        localStorage.setItem('zo2y_banner_config_' + userId, JSON.stringify(bannerConfig));
        if (bannerUrl) localStorage.setItem('zo2y_banner_url_' + userId, bannerUrl);
      } catch (_e) {}
    }

    if (sb && userId && isUuid(userId)) {
      /* 1. Update user_profiles with banner_url, position_y, position_x */
      const fullPayload = {
        banner_url: bannerUrl,
        banner_position_y: Math.round(posY),
        banner_position_x: posX
      };
      const basicPayload = {
        banner_position_y: Math.round(posY),
        banner_position_x: posX
      };

      try {
        const { error: err1 } = await sb.from('user_profiles').update(fullPayload).eq('id', userId);
        if (err1) {
          const { error: err2 } = await sb.from('user_profiles').update(fullPayload).eq('user_id', userId);
          if (err2) {
            await sb.from('user_profiles').update(basicPayload).eq('id', userId);
          }
        }
      } catch (e) {
        console.warn('Banner: user_profiles update notice', e);
      }

      /* 2. Update profile_showcase (banner config) */
      try {
        if (window.ProfileShowcase && typeof window.ProfileShowcase.setProfileShowcase === 'function') {
          await window.ProfileShowcase.setProfileShowcase(userId, 'banner', JSON.stringify(bannerConfig), { display_order: 0, is_hidden: false });
        } else {
          try {
            await sb.from('profile_showcase').delete().eq('user_id', userId).eq('media_type', 'banner');
          } catch (_e) {}
          const bannerRow = {
            user_id: userId,
            media_type: 'banner',
            list_id: JSON.stringify(bannerConfig),
            display_order: 0,
            is_hidden: false
          };
          await sb.from('profile_showcase').insert(bannerRow);
        }
      } catch (e) {
        console.warn('Banner: profile_showcase notice', e);
      }
    }

    /* Live-update the profile banner */
    if (window.ProfileManager && window.ProfileManager.ProfileBackdropEngine) {
      window.ProfileManager.ProfileBackdropEngine.stop();
      if (typeof window.ProfileManager.ProfileBackdropEngine.init === 'function') {
        window.ProfileManager.ProfileBackdropEngine.init(finalItems, currentMode);
      }
    }

    if (btn) { btn.textContent = 'Apply Banner'; }
    closePicker();

    /* Show success toast if available */
    if (typeof window.showToast === 'function') {
      window.showToast('Banner updated!', 'success');
    }
  }

  /* ── DOM ready ────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', init);

  /* ── public API ───────────────────────────────────────── */
  return {
    openPicker,
    closePicker,
    setMode,
    setDomain,
    setCategoryFilter,
    onSearchInput,
    onSearchFocus,
    selectMedia,
    selectBackdrop,
    quickSelect,
    removeFromQueue,
    applyBanner,
    goBack,
    init,
    // Expose onDragStart for the inline HTML event
    onDragStart
  };
})();
