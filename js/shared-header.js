(() => {
  const SUPABASE_URL = 'https://gfkhjbztayjyojsgdpgk.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma2hqYnp0YXlqeW9qc2dkcGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwOTYyNjQsImV4cCI6MjA3NTY3MjI2NH0.WUb2yDAwCeokdpWCPeH13FE8NhWF6G8e6ivTsgu6b2s';
  const UNIVERSAL_SEARCH_SRC = 'js/universal-search.js?v=20260315b';
  const DESKTOP_RAIL_COLLAPSE_KEY = 'zo2y_desktop_rail_collapsed';
  let universalSearchLoaderPromise = null;
  let supabaseClient = null;
  let authStateListenerBound = false;
  if (window.ZO2Y_DISABLE_GAMES !== false) {
    window.ZO2Y_DISABLE_GAMES = true;
  }
  const GAMES_DISABLED = window.ZO2Y_DISABLE_GAMES !== false;

  const LOGO_HTML = `
<span class="zo2y-logo-anim" data-zo2y-logo="1">
  <span class="zo2y-logo-idle">
    <span class="zo2y-logo-pop">
      <span class="zo2y-logo-sprite">
        <span class="zo2y-logo-face zo2y-logo-face-top">
          <img class="zo2y-logo-img normal" src="/newlogo.webp" alt="Zo2y logo" />
          <img class="zo2y-logo-img scared" src="/scared.webp" alt="" aria-hidden="true" />
        </span>
        <span class="zo2y-logo-face zo2y-logo-face-bottom" aria-hidden="true">
          <img class="zo2y-logo-img normal" src="/newlogo.webp" alt="" />
          <img class="zo2y-logo-img scared" src="/scared.webp" alt="" />
        </span>
        <span class="zo2y-logo-eye-white eye-left" aria-hidden="true"></span>
        <span class="zo2y-logo-eye-white eye-right" aria-hidden="true"></span>
        <span class="zo2y-logo-pupil pupil-left" aria-hidden="true"></span>
        <span class="zo2y-logo-pupil pupil-right" aria-hidden="true"></span>
        <span class="zo2y-logo-eye eye-left" aria-hidden="true"></span>
        <span class="zo2y-logo-eye eye-right" aria-hidden="true"></span>
        <span class="zo2y-logo-tongue" aria-hidden="true"></span>
        <span class="zo2y-logo-sweat sweat-1" aria-hidden="true"></span>
        <span class="zo2y-logo-sweat sweat-2" aria-hidden="true"></span>
        <span class="zo2y-logo-sweat sweat-3" aria-hidden="true"></span>
        <span class="zo2y-logo-sweat sweat-4" aria-hidden="true"></span>
        <span class="zo2y-logo-sweat sweat-5" aria-hidden="true"></span>
      </span>
    </span>
  </span>
</span>`;

const HEADER_HTML = `
<header class="zo2y-shared-header" role="banner" data-shared-header="1">
  <div class="zo2y-mobile-topbar">
    <button class="zo2y-mobile-menu-btn" id="zo2yMobileMenuBtn" type="button" aria-label="Open navigation menu" aria-controls="zo2yMobileDrawer" aria-expanded="false">
      <i class="fa-solid fa-bars"></i>
    </button>
    <a class="zo2y-mobile-wordmark" href="index.html" aria-label="Home">
      ${LOGO_HTML}
    </a>
    <span class="zo2y-mobile-topbar-spacer" aria-hidden="true"></span>
  </div>
  <div class="zo2y-shared-header-inner">
    <a class="zo2y-shared-brand" href="index.html" aria-label="Home">
      ${LOGO_HTML}
    </a>
    <div class="nav-search zo2y-shared-search">
      <input id="globalSearch" class="nav-search-input zo2y-shared-search-input" type="search" placeholder="Search all media..." aria-label="Search all media" />
      <button id="globalSearchBtn" class="nav-search-btn zo2y-shared-search-btn" type="button" aria-label="Search"><i class="fas fa-search"></i></button>
    </div>
    <nav class="zo2y-shared-nav" aria-label="Primary navigation">
      <a class="zo2y-shared-pill" data-nav-page="index" href="index.html">Home</a>
      <div class="zo2y-nav-group" data-nav-group="media">
        <button class="zo2y-shared-pill zo2y-nav-toggle" type="button" aria-expanded="false">
          Media <i class="fa-solid fa-chevron-down"></i>
        </button>
        <div class="zo2y-nav-menu" role="menu">
          <a class="zo2y-nav-link" data-nav-page="movies" href="movies.html">Movies</a>
          <a class="zo2y-nav-link" data-nav-page="tvshows" href="tvshows.html">TV Shows</a>
          <a class="zo2y-nav-link" data-nav-page="animes" href="animes.html">Anime</a>
          <a class="zo2y-nav-link" data-nav-page="games" href="games.html">Games</a>
          <a class="zo2y-nav-link" data-nav-page="books" href="books.html">Books</a>
          <a class="zo2y-nav-link" data-nav-page="music" href="music.html">Music</a>
        </div>
      </div>
      <div class="zo2y-nav-group" data-nav-group="lifestyle">
        <button class="zo2y-shared-pill zo2y-nav-toggle" type="button" aria-expanded="false">
          Lifestyle <i class="fa-solid fa-chevron-down"></i>
        </button>
        <div class="zo2y-nav-menu" role="menu">
          <a class="zo2y-nav-link" data-nav-page="travel" href="travel.html">Travel</a>
          <a class="zo2y-nav-link" data-nav-page="sports" href="sports.html">Sports</a>
          <a class="zo2y-nav-link" data-nav-page="fashion" href="fashion.html">Fashion</a>
          <a class="zo2y-nav-link" data-nav-page="food" href="food.html">Food</a>
        </div>
      </div>
      <a class="zo2y-shared-pill" data-nav-page="reviews" href="reviews.html">Reviews</a>
    </nav>
    <div class="zo2y-shared-auth">
      <a class="zo2y-shared-btn" href="login.html" id="loginBtn">Login</a>
      <a class="zo2y-shared-btn zo2y-shared-btn-primary" href="sign-up.html" id="signupBtn">Sign Up</a>
      <a class="zo2y-shared-btn" href="profile.html" id="profileBtn" style="display:none;">Profile</a>
    </div>
  </div>
</header>
<aside class="zo2y-desktop-rail" id="zo2yDesktopRail" aria-label="Desktop navigation">
  <a class="zo2y-desktop-rail-brand" href="index.html" aria-label="Home">
    ${LOGO_HTML}
    <span class="sidebar-brand-wordmark">zo2y</span>
  </a>

  <button class="zo2y-desktop-rail-collapse" id="zo2yDesktopRailCollapseBtn" type="button" aria-label="Toggle menu">
    <i class="fa-solid fa-bars"></i>
    <span>collapse menu</span>
  </button>

  <div class="zo2y-desktop-rail-search nav-search">
    <input id="desktopRailSearch" class="nav-search-input" type="search" placeholder="Search all media..." aria-label="Search all media" />
    <button id="desktopRailSearchBtn" class="nav-search-btn" type="button" aria-label="Search"><i class="fas fa-search"></i></button>
  </div>

  <a class="zo2y-desktop-rail-profile" href="profile.html" id="desktopRailProfileBtn" style="display:none;">
    <i class="fa-solid fa-user"></i><span>profile</span>
  </a>

  <nav class="zo2y-desktop-rail-nav" aria-label="Desktop sections">
    <a class="zo2y-desktop-rail-link" data-nav-page="index" href="index.html"><i class="fa-solid fa-house"></i><span>home</span></a>
    <div class="zo2y-rail-section">
      <div class="zo2y-rail-section-title">media</div>
      <a class="zo2y-desktop-rail-link" data-nav-page="movies" href="movies.html"><i class="fa-solid fa-film"></i><span>movies</span></a>
      <a class="zo2y-desktop-rail-link" data-nav-page="tvshows" href="tvshows.html"><i class="fa-solid fa-tv"></i><span>tv shows</span></a>
      <a class="zo2y-desktop-rail-link" data-nav-page="animes" href="animes.html"><i class="fa-solid fa-dragon"></i><span>anime</span></a>
      <a class="zo2y-desktop-rail-link" data-nav-page="games" href="games.html"><i class="fa-solid fa-gamepad"></i><span>games</span></a>
      <a class="zo2y-desktop-rail-link" data-nav-page="books" href="books.html"><i class="fa-solid fa-book"></i><span>books</span></a>
      <a class="zo2y-desktop-rail-link" data-nav-page="music" href="music.html"><i class="fa-solid fa-music"></i><span>music</span></a>
    </div>
    <div class="zo2y-rail-section">
      <div class="zo2y-rail-section-title">lifestyle</div>
      <a class="zo2y-desktop-rail-link" data-nav-page="travel" href="travel.html"><i class="fa-solid fa-earth-americas"></i><span>travel</span></a>
      <a class="zo2y-desktop-rail-link" data-nav-page="sports" href="sports.html"><i class="fa-solid fa-futbol"></i><span>sports</span></a>
      <a class="zo2y-desktop-rail-link" data-nav-page="fashion" href="fashion.html"><i class="fa-solid fa-shirt"></i><span>fashion</span></a>
      <a class="zo2y-desktop-rail-link" data-nav-page="food" href="food.html"><i class="fa-solid fa-burger"></i><span>food</span></a>
    </div>
    <a class="zo2y-desktop-rail-link accent" data-nav-page="reviews" href="reviews.html"><i class="fa-solid fa-star"></i><span>reviews</span></a>
  </nav>
</aside>
<div class="zo2y-mobile-drawer-backdrop" id="zo2yMobileDrawerBackdrop" hidden></div>
<aside class="zo2y-mobile-drawer" id="zo2yMobileDrawer" aria-hidden="true" aria-label="Mobile navigation">
  <div class="zo2y-mobile-drawer-head">
    <a class="zo2y-mobile-drawer-brand" href="index.html" aria-label="Home">
      ${LOGO_HTML}
    </a>
    <button class="zo2y-mobile-drawer-close" id="zo2yMobileMenuCloseBtn" type="button" aria-label="Close navigation menu">
      <i class="fa-solid fa-xmark"></i>
    </button>
  </div>

  <div class="zo2y-mobile-drawer-auth">
    <a class="zo2y-mobile-auth-btn zo2y-mobile-auth-profile" href="profile.html" id="mobileProfileBtn" style="display:none;">
      <i class="fa-solid fa-user"></i><span>Profile</span>
    </a>
    <a class="zo2y-mobile-auth-btn" href="login.html" id="mobileLoginBtn">Login</a>
    <a class="zo2y-mobile-auth-btn zo2y-mobile-auth-btn-primary" href="sign-up.html" id="mobileSignupBtn">Sign Up</a>
  </div>

  <div class="zo2y-mobile-drawer-search">
    <div class="nav-search zo2y-mobile-drawer-search-wrap">
      <input id="mobileMenuSearch" class="nav-search-input zo2y-mobile-drawer-search-input" type="search" placeholder="Search all media..." aria-label="Search all media in menu" />
      <button id="mobileMenuSearchBtn" class="nav-search-btn zo2y-mobile-drawer-search-btn" type="button" aria-label="Search"><i class="fas fa-search"></i></button>
    </div>
  </div>

  <nav class="zo2y-mobile-drawer-nav" aria-label="Mobile sections">
    <a class="zo2y-mobile-drawer-link" data-nav-page="index" href="index.html"><i class="fa-solid fa-house"></i><span>Home</span></a>
    <div class="zo2y-mobile-accordion" data-accordion="media">
      <button class="zo2y-mobile-accordion-toggle" type="button" aria-expanded="false">
        <span><i class="fa-solid fa-layer-group"></i> Media</span>
        <i class="fa-solid fa-chevron-down"></i>
      </button>
      <div class="zo2y-mobile-accordion-panel">
        <a class="zo2y-mobile-drawer-link" data-nav-page="movies" href="movies.html"><i class="fa-solid fa-film"></i><span>Movies</span></a>
        <a class="zo2y-mobile-drawer-link" data-nav-page="tvshows" href="tvshows.html"><i class="fa-solid fa-tv"></i><span>TV Shows</span></a>
        <a class="zo2y-mobile-drawer-link" data-nav-page="animes" href="animes.html"><i class="fa-solid fa-dragon"></i><span>Anime</span></a>
        <a class="zo2y-mobile-drawer-link" data-nav-page="games" href="games.html"><i class="fa-solid fa-gamepad"></i><span>Games</span></a>
        <a class="zo2y-mobile-drawer-link" data-nav-page="books" href="books.html"><i class="fa-solid fa-book"></i><span>Books</span></a>
        <a class="zo2y-mobile-drawer-link" data-nav-page="music" href="music.html"><i class="fa-solid fa-music"></i><span>Music</span></a>
      </div>
    </div>
    <div class="zo2y-mobile-accordion" data-accordion="lifestyle">
      <button class="zo2y-mobile-accordion-toggle" type="button" aria-expanded="false">
        <span><i class="fa-solid fa-sparkles"></i> Lifestyle</span>
        <i class="fa-solid fa-chevron-down"></i>
      </button>
      <div class="zo2y-mobile-accordion-panel">
        <a class="zo2y-mobile-drawer-link" data-nav-page="travel" href="travel.html"><i class="fa-solid fa-earth-americas"></i><span>Travel</span></a>
        <a class="zo2y-mobile-drawer-link" data-nav-page="sports" href="sports.html"><i class="fa-solid fa-futbol"></i><span>Sports</span></a>
        <a class="zo2y-mobile-drawer-link" data-nav-page="fashion" href="fashion.html"><i class="fa-solid fa-shirt"></i><span>Fashion</span></a>
        <a class="zo2y-mobile-drawer-link" data-nav-page="food" href="food.html"><i class="fa-solid fa-burger"></i><span>Food</span></a>
      </div>
    </div>
    <a class="zo2y-mobile-drawer-link accent" data-nav-page="reviews" href="reviews.html"><i class="fa-solid fa-star"></i><span>Reviews</span></a>
  </nav>

  <div class="zo2y-mobile-drawer-footer">
    <div class="zo2y-mobile-drawer-divider"></div>
    <p class="zo2y-mobile-drawer-label">Quick Picks</p>
    <div class="zo2y-mobile-drawer-quick">
      <a class="zo2y-mobile-drawer-link" href="index.html#newReleasesRail"><i class="fa-solid fa-satellite-dish"></i><span>New Releases</span></a>
      <a class="zo2y-mobile-drawer-link" href="index.html#imdbTop10Rail"><i class="fa-solid fa-ranking-star"></i><span>IMDb Top 10</span></a>
      <a class="zo2y-mobile-drawer-link" href="profile.html"><i class="fa-solid fa-list"></i><span>Your Lists</span></a>
    </div>
  </div>
</aside>`;

  function flushQueuedUniversalSearchInits() {
    if (!window.__ZO2Y_UNIVERSAL_SEARCH_READY || typeof window.initUniversalSearch !== 'function') return;
    const queued = Array.isArray(window.__ZO2Y_UNIVERSAL_SEARCH_QUEUE)
      ? window.__ZO2Y_UNIVERSAL_SEARCH_QUEUE.splice(0)
      : [];
    queued.forEach((options) => {
      try {
        window.initUniversalSearch(options || {});
      } catch (_err) {}
    });
  }

  function loadUniversalSearchScript() {
    if (window.__ZO2Y_UNIVERSAL_SEARCH_READY && typeof window.initUniversalSearch === 'function') {
      return Promise.resolve(window.initUniversalSearch);
    }
    if (universalSearchLoaderPromise) return universalSearchLoaderPromise;

    universalSearchLoaderPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[data-zo2y-universal-search="1"]`);
      if (existing) {
        existing.addEventListener('load', () => {
          flushQueuedUniversalSearchInits();
          resolve(window.initUniversalSearch);
        }, { once: true });
        existing.addEventListener('error', reject, { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = UNIVERSAL_SEARCH_SRC;
      script.defer = true;
      script.dataset.zo2yUniversalSearch = '1';
      script.onload = () => {
        flushQueuedUniversalSearchInits();
        resolve(window.initUniversalSearch);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    }).catch((_err) => {
      universalSearchLoaderPromise = null;
      return null;
    });

    return universalSearchLoaderPromise;
  }

  if (!Array.isArray(window.__ZO2Y_UNIVERSAL_SEARCH_QUEUE)) {
    window.__ZO2Y_UNIVERSAL_SEARCH_QUEUE = [];
  }

  if (!window.__ZO2Y_UNIVERSAL_SEARCH_READY) {
    window.initUniversalSearch = function initUniversalSearchProxy(options = {}) {
      window.__ZO2Y_UNIVERSAL_SEARCH_QUEUE.push(options);
      void loadUniversalSearchScript();
    };
  }

  function normalizePageName(pathname) {
    const override = document?.body?.dataset?.navPage;
    if (override) return String(override).toLowerCase();
    const file = String(pathname || '').split('/').pop().toLowerCase() || 'index.html';
    if (file === '' || file === 'index.html') return 'index';
    if (file.startsWith('movie')) return 'movies';
    if (file.startsWith('tvshow')) return 'tvshows';
    if (file.startsWith('anime')) return 'animes';
    if (file.startsWith('game')) return 'games';
    if (file.startsWith('book')) return 'books';
    if (file.startsWith('song') || file.startsWith('music')) return 'music';
    if (file.startsWith('travel') || file.startsWith('country')) return 'travel';
    if (file.startsWith('sport')) return 'sports';
    if (file.startsWith('fashion')) return 'fashion';
    if (file.startsWith('food')) return 'food';
    if (file.startsWith('review')) return 'reviews';
    if (file.startsWith('profile')) return 'profile';
    return 'index';
  }

  function isMobileContentPage(pathname) {
    const file = String(pathname || '').split('/').pop().toLowerCase() || 'index.html';
    return file.endsWith('-mobile.html');
  }

  function isHeaderSuppressedPage(pathname) {
    const file = String(pathname || '').split('/').pop().toLowerCase() || 'index.html';
    return file === 'login.html' || file === 'sign-up.html' || file === 'signup.html' || file === 'update-password.html';
  }

  function isLandingShell() {
    const authShell = document.documentElement?.dataset?.authShell || document.body?.dataset?.authShell || '';
    if (authShell) return authShell === 'landing';
    const landingNode = document.getElementById('homeLandingPage');
    const authed = document.documentElement?.dataset?.authenticated === '1' || document.body?.dataset?.authenticated === '1';
    return !!landingNode && !authed;
  }

  function teardownSharedHeader() {
    document.querySelectorAll('[data-shared-header="1"]').forEach((el) => el.remove());
    const desktopRail = document.getElementById('zo2yDesktopRail');
    if (desktopRail) desktopRail.remove();
    const mobileDrawer = document.getElementById('zo2yMobileDrawer');
    if (mobileDrawer) mobileDrawer.remove();
    const mobileBackdrop = document.getElementById('zo2yMobileDrawerBackdrop');
    if (mobileBackdrop) mobileBackdrop.remove();
    if (document.body) {
      document.body.classList.remove('zo2y-desktop-rail-layout', 'zo2y-mobile-header-fixed');
    }
  }

  function mountSharedHeader() {
    if (!document.body) return;
    document.querySelectorAll('header.landing-header').forEach((landingHeader) => {
      landingHeader.remove();
    });

    const parser = document.createElement('div');
    parser.innerHTML = HEADER_HTML.trim();
    const nextSharedHeader = parser.firstElementChild;
    const nextDesktopRail = parser.querySelector('#zo2yDesktopRail');
    const nextMobileDrawer = parser.querySelector('#zo2yMobileDrawer');
    const nextMobileBackdrop = parser.querySelector('#zo2yMobileDrawerBackdrop');
    if (!nextSharedHeader) return;

    const existingSharedHeader = document.querySelector('[data-shared-header="1"]');
    const existingDesktopRail = document.getElementById('zo2yDesktopRail');
    const existingMobileDrawer = document.getElementById('zo2yMobileDrawer');
    const existingMobileBackdrop = document.getElementById('zo2yMobileDrawerBackdrop');

    if (existingDesktopRail) existingDesktopRail.remove();
    if (existingMobileDrawer) existingMobileDrawer.remove();
    if (existingMobileBackdrop) existingMobileBackdrop.remove();

    const isMobileViewport = window.matchMedia && window.matchMedia('(max-width: 1024px)').matches;
    if (isMobileViewport) {
      if (existingSharedHeader) existingSharedHeader.remove();
      const legacyHeader = document.querySelector('header');
      if (legacyHeader && !legacyHeader.matches('.landing-header')) legacyHeader.remove();
      document.body.insertBefore(nextSharedHeader, document.body.firstChild);
    } else if (existingSharedHeader) {
      existingSharedHeader.replaceWith(nextSharedHeader);
    } else {
      const legacyHeader = document.querySelector('header');
      if (legacyHeader) {
        legacyHeader.replaceWith(nextSharedHeader);
      } else {
        document.body.insertBefore(nextSharedHeader, document.body.firstChild);
      }
    }

    if (nextMobileBackdrop) document.body.appendChild(nextMobileBackdrop);
    if (nextMobileDrawer) document.body.appendChild(nextMobileDrawer);

    const hasNativeDesktopSidebar = !!document.querySelector('.desktop-sidebar');
    if (nextDesktopRail && !hasNativeDesktopSidebar) {
      document.body.appendChild(nextDesktopRail);
      document.body.classList.add('zo2y-desktop-rail-layout');
    } else {
      document.body.classList.remove('zo2y-desktop-rail-layout');
    }

    const mobilePage = isMobileContentPage(window.location.pathname);
    document.body.setAttribute('data-zo2y-compact-header', mobilePage ? '1' : '0');

    if (mobilePage || GAMES_DISABLED) {
      document.querySelectorAll('[data-nav-page="games"]').forEach((gamesNavItem) => gamesNavItem.remove());
    }

    if (document.body) {
      document.body.dataset.gamesDisabled = GAMES_DISABLED ? '1' : '0';
    }

    const activePage = normalizePageName(window.location.pathname);

    document.querySelectorAll('[data-nav-page]').forEach((link) => {
      const page = String(link.getAttribute('data-nav-page') || '');
      if (!page) return;
      const active = page === activePage;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });

    document.querySelectorAll('[data-nav-group]').forEach((group) => {
      const hasActive = !!group.querySelector('[data-nav-page].active');
      group.classList.toggle('active', hasActive);
      const toggle = group.querySelector('.zo2y-nav-toggle');
      if (toggle) toggle.classList.toggle('active', hasActive);
    });

    document.querySelectorAll('.zo2y-mobile-accordion').forEach((accordion) => {
      const panel = accordion.querySelector('.zo2y-mobile-accordion-panel');
      const toggle = accordion.querySelector('.zo2y-mobile-accordion-toggle');
      const hasActive = !!accordion.querySelector('[data-nav-page].active');
      accordion.classList.toggle('open', hasActive);
      if (toggle) toggle.setAttribute('aria-expanded', hasActive ? 'true' : 'false');
      if (panel) panel.style.maxHeight = hasActive ? `${panel.scrollHeight}px` : '';
    });
  }

  function ensureSupabaseClient() {
    if (supabaseClient) return supabaseClient;
    if (window.__ZO2Y_SUPABASE_CLIENT) {
      supabaseClient = window.__ZO2Y_SUPABASE_CLIENT;
      return supabaseClient;
    }
    if (!window.supabase || typeof window.supabase.createClient !== 'function') return null;
    try {
      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
      window.__ZO2Y_SUPABASE_CLIENT = supabaseClient;
      return supabaseClient;
    } catch (_err) {
      return null;
    }
  }

  function readDesktopRailCollapsedPreference() {
    try {
      return window.localStorage.getItem(DESKTOP_RAIL_COLLAPSE_KEY) === '1';
    } catch (_err) {
      return false;
    }
  }

  function writeDesktopRailCollapsedPreference(collapsed) {
    try {
      window.localStorage.setItem(DESKTOP_RAIL_COLLAPSE_KEY, collapsed ? '1' : '0');
    } catch (_err) {}
  }

  function applyDesktopRailCollapsedState(collapsed) {
    document.body.classList.toggle('sidebar-collapsed', !!collapsed);
    document.querySelectorAll('#sidebarToggleBtn, #zo2yDesktopRailCollapseBtn').forEach((button) => {
      const expanded = !collapsed;
      button.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      button.setAttribute('aria-label', expanded ? 'Collapse navigation menu' : 'Expand navigation menu');
      const label = button.querySelector('span');
      if (label) {
        label.textContent = expanded ? 'collapse menu' : 'expand menu';
      }
    });
  }

  function wireAuthStateSync() {
    if (authStateListenerBound) return;
    const client = ensureSupabaseClient();
    if (!client || !client.auth || typeof client.auth.onAuthStateChange !== 'function') return;

    authStateListenerBound = true;
    client.auth.onAuthStateChange(() => {
      void syncAuthHeaderState();
    });
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) void syncAuthHeaderState();
    });
    window.addEventListener('focus', () => {
      void syncAuthHeaderState();
    });
  }

  async function syncAuthHeaderState() {
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const profileBtn = document.getElementById('profileBtn');
    const mobileLoginBtn = document.getElementById('mobileLoginBtn');
    const mobileSignupBtn = document.getElementById('mobileSignupBtn');
    const mobileProfileBtn = document.getElementById('mobileProfileBtn');
    const desktopRailProfileBtn = document.getElementById('desktopRailProfileBtn');
    if (!loginBtn && !signupBtn && !profileBtn && !mobileLoginBtn && !mobileSignupBtn && !mobileProfileBtn && !desktopRailProfileBtn) return;

    const client = ensureSupabaseClient();
    if (!client || !client.auth || typeof client.auth.getSession !== 'function') {
      return;
    }

    try {
      const { data } = await client.auth.getSession();
      const session = data && data.session ? data.session : null;
      const loggedIn = !!session;
      const user = session && session.user ? session.user : null;
      const hiddenDisplay = 'none';

      if (loginBtn) loginBtn.style.display = loggedIn ? hiddenDisplay : 'inline-flex';
      if (signupBtn) signupBtn.style.display = loggedIn ? hiddenDisplay : 'inline-flex';
      if (mobileLoginBtn) mobileLoginBtn.style.display = loggedIn ? hiddenDisplay : 'inline-flex';
      if (mobileSignupBtn) mobileSignupBtn.style.display = loggedIn ? hiddenDisplay : 'inline-flex';
      if (profileBtn) {
        profileBtn.style.display = loggedIn ? 'inline-flex' : hiddenDisplay;
      }
      if (mobileProfileBtn) {
        mobileProfileBtn.style.display = loggedIn ? 'inline-flex' : hiddenDisplay;
      }
      if (desktopRailProfileBtn) {
        desktopRailProfileBtn.style.display = loggedIn ? 'inline-flex' : hiddenDisplay;
      }

      if (loggedIn) {
        let label = 'Profile';
        try {
          if (user && user.id && client.from) {
            const { data: profile } = await client
              .from('user_profiles')
              .select('username, full_name')
              .eq('id', user.id)
              .single();
            const raw = profile?.username || profile?.full_name || '';
            const clean = String(raw || '').trim();
            if (clean) label = clean.startsWith('@') ? clean : `@${clean}`;
          }
        } catch (_profileErr) {
          const fallback =
            (user && user.user_metadata && (user.user_metadata.username || user.user_metadata.full_name || user.user_metadata.name)) ||
            (user && user.email ? String(user.email).split('@')[0] : '');
          const cleanFallback = String(fallback || '').trim();
          if (cleanFallback) label = cleanFallback.startsWith('@') ? cleanFallback : `@${cleanFallback}`;
        }

        if (profileBtn) {
          profileBtn.innerHTML = `<i class="fas fa-user"></i><span>${label}</span>`;
        }
        if (mobileProfileBtn) {
          mobileProfileBtn.innerHTML = `<i class="fas fa-user"></i><span>${label}</span>`;
        }
        if (desktopRailProfileBtn) {
          desktopRailProfileBtn.innerHTML = `<i class="fas fa-user"></i><span>${label}</span>`;
        }
      }
    } catch (_err) {}
  }

  function wireMobileDrawer() {
    const menuBtn = document.getElementById('zo2yMobileMenuBtn');
    const closeBtn = document.getElementById('zo2yMobileMenuCloseBtn');
    const drawer = document.getElementById('zo2yMobileDrawer');
    const backdrop = document.getElementById('zo2yMobileDrawerBackdrop');
    if (!menuBtn || !closeBtn || !drawer || !backdrop) return;
    if (menuBtn.dataset.wired === '1') return;
    menuBtn.dataset.wired = '1';
    let lockedScrollY = 0;

    const lockBodyScrollForMenu = () => {
      if (document.body.dataset.zo2yMenuScrollLock === '1') return;
      document.body.dataset.zo2yMenuScrollLock = '1';
      lockedScrollY = window.scrollY || window.pageYOffset || 0;
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.style.overscrollBehavior = 'none';
      document.body.style.overscrollBehavior = 'none';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${lockedScrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
    };

    const unlockBodyScrollForMenu = () => {
      if (document.body.dataset.zo2yMenuScrollLock !== '1') return;
      delete document.body.dataset.zo2yMenuScrollLock;
      document.documentElement.style.overflow = '';
      document.documentElement.style.overscrollBehavior = '';
      document.body.style.overscrollBehavior = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      window.scrollTo(0, lockedScrollY);
    };

    const resetDrawerScrollTop = () => {
      if (!drawer) return;
      drawer.scrollTop = 0;
      // Mobile Safari can restore scroll after paint; force again.
      requestAnimationFrame(() => {
        drawer.scrollTop = 0;
      });
      setTimeout(() => {
        drawer.scrollTop = 0;
      }, 60);
    };

    const setDrawerState = (isOpen) => {
      drawer.classList.toggle('open', isOpen);
      backdrop.classList.toggle('active', isOpen);
      drawer.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
      menuBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      menuBtn.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
      backdrop.hidden = !isOpen;
      document.body.classList.toggle('zo2y-mobile-menu-open', isOpen);
      if (isOpen) lockBodyScrollForMenu();
      else unlockBodyScrollForMenu();
      resetDrawerScrollTop();
      if (isOpen) requestAnimationFrame(resetDrawerScrollTop);
    };

    const closeDrawer = () => setDrawerState(false);

    menuBtn.addEventListener('click', () => {
      const open = drawer.classList.contains('open');
      setDrawerState(!open);
    });

    closeBtn.addEventListener('click', closeDrawer);
    backdrop.addEventListener('click', closeDrawer);

    drawer.querySelectorAll('a[href]').forEach((link) => {
      link.addEventListener('click', closeDrawer);
    });

    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeDrawer();
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 1024) closeDrawer();
    });
  }

  function wireMobileAccordions() {
    const accordions = Array.from(document.querySelectorAll('.zo2y-mobile-accordion'));
    if (!accordions.length) return;
    accordions.forEach((accordion) => {
      const toggle = accordion.querySelector('.zo2y-mobile-accordion-toggle');
      const panel = accordion.querySelector('.zo2y-mobile-accordion-panel');
      if (!toggle || !panel) return;
      if (toggle.dataset.wired === '1') return;
      toggle.dataset.wired = '1';
      toggle.addEventListener('click', () => {
        const isOpen = accordion.classList.toggle('open');
        toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        panel.style.maxHeight = isOpen ? `${panel.scrollHeight}px` : '';
      });
    });
  }

  function wireDesktopRailCollapse() {
    const buttons = Array.from(document.querySelectorAll('#sidebarToggleBtn, #zo2yDesktopRailCollapseBtn'));
    if (!buttons.length) return;

    const syncState = () => {
      if (window.matchMedia && !window.matchMedia('(min-width: 1025px)').matches) {
        applyDesktopRailCollapsedState(false);
        return;
      }
      applyDesktopRailCollapsedState(readDesktopRailCollapsedPreference());
    };

    buttons.forEach((button) => {
      if (button.dataset.wired === '1') return;
      button.dataset.wired = '1';
      button.addEventListener('click', () => {
        const nextCollapsed = !document.body.classList.contains('sidebar-collapsed');
        writeDesktopRailCollapsedPreference(nextCollapsed);
        applyDesktopRailCollapsedState(nextCollapsed);
      });
    });

    syncState();
    window.addEventListener('resize', syncState);
  }

  function wireLogoAnim() {
    const logos = Array.from(document.querySelectorAll('[data-zo2y-logo="1"]'));
    if (!logos.length) return;
    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canTrackPointer = !prefersReducedMotion
      && window.matchMedia
      && window.matchMedia('(pointer: fine)').matches;

    logos.forEach((logo) => {
      if (logo.dataset.zo2yLogoWired === '1') return;
      logo.dataset.zo2yLogoWired = '1';
      logo.classList.toggle('is-idle', !prefersReducedMotion);

      const triggerTongue = () => {
        logo.classList.remove('is-tongue');
        logo.classList.remove('is-pop');
        logo.classList.remove('is-chomp');
        void logo.offsetWidth;
        logo.classList.add('is-tongue');
        logo.classList.add('is-pop');
        logo.classList.add('is-chomp');
        if (logo._tongueTimer) window.clearTimeout(logo._tongueTimer);
        logo._tongueTimer = window.setTimeout(() => {
          logo.classList.remove('is-tongue');
        }, 260);
        if (logo._popTimer) window.clearTimeout(logo._popTimer);
        logo._popTimer = window.setTimeout(() => {
          logo.classList.remove('is-pop');
        }, 200);
        if (logo._chompTimer) window.clearTimeout(logo._chompTimer);
        logo._chompTimer = window.setTimeout(() => {
          logo.classList.remove('is-chomp');
        }, 420);
      };

      logo.addEventListener('pointerdown', triggerTongue, { passive: true });

      const anchor = logo.closest('a');
      if (anchor) {
        anchor.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            triggerTongue();
          }
        });
      }

      if (prefersReducedMotion) return;

      const minDelay = 3800;
      const maxDelay = 9200;
      const blinkDuration = 180;

      const runBlink = () => {
        if (!logo.isConnected) return;
        logo.classList.add('is-blinking');
        window.setTimeout(() => logo.classList.remove('is-blinking'), blinkDuration);
      };

      const scheduleBlink = () => {
        const delay = Math.round(minDelay + Math.random() * (maxDelay - minDelay));
        window.setTimeout(() => {
          runBlink();
          scheduleBlink();
        }, delay);
      };

      window.setTimeout(runBlink, 700 + Math.random() * 500);
      scheduleBlink();
    });

    if (canTrackPointer && !window.__ZO2Y_LOGO_TRACKING_BOUND) {
      window.__ZO2Y_LOGO_TRACKING_BOUND = true;
      let rafId = null;

      const applyOffsets = (clientX, clientY) => {
        logos.forEach((logo) => {
          const rect = logo.getBoundingClientRect();
          if (!rect.width || !rect.height) return;
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const dx = clientX - cx;
          const dy = clientY - cy;
          const distance = Math.hypot(dx, dy) || 1;
          const maxOffset = Math.min(rect.width, rect.height) * 0.12;
          const strength = Math.min(1, distance / 160);
          const offsetX = (dx / distance) * maxOffset * strength;
          const offsetY = (dy / distance) * maxOffset * strength;
          logo.style.setProperty('--pupil-offset-x', offsetX.toFixed(2));
          logo.style.setProperty('--pupil-offset-y', offsetY.toFixed(2));
        });
      };

      const resetOffsets = () => {
        logos.forEach((logo) => {
          logo.style.setProperty('--pupil-offset-x', '0');
          logo.style.setProperty('--pupil-offset-y', '0');
        });
      };

      document.addEventListener('mousemove', (event) => {
        if (rafId) cancelAnimationFrame(rafId);
        const { clientX, clientY } = event;
        rafId = requestAnimationFrame(() => applyOffsets(clientX, clientY));
      }, { passive: true });

      document.addEventListener('mouseleave', resetOffsets);
      window.addEventListener('blur', resetOffsets);
    }
  }

  function wireSearchButton() {
    const warmSearch = () => {
      void loadUniversalSearchScript();
    };

    const initInputUniversalSearch = (input) => {
      if (!input) return;
      if (input.dataset.zo2yUniversalWired === '1') return;
      const init = () => {
        if (typeof window.initUniversalSearch !== 'function') return;
        try {
          window.initUniversalSearch({ input, fallbackRoute: 'movies.html' });
          input.dataset.zo2yUniversalWired = '1';
        } catch (_err) {}
      };
      if (window.__ZO2Y_UNIVERSAL_SEARCH_READY && typeof window.initUniversalSearch === 'function') {
        init();
        return;
      }
      void loadUniversalSearchScript().finally(init);
    };

    const searchTargets = [
      { input: document.getElementById('globalSearch'), button: document.getElementById('globalSearchBtn') },
      { input: document.getElementById('desktopRailSearch'), button: document.getElementById('desktopRailSearchBtn') },
      { input: document.getElementById('mobileGlobalSearch'), button: document.getElementById('mobileGlobalSearchBtn') },
      { input: document.getElementById('mobileMenuSearch'), button: document.getElementById('mobileMenuSearchBtn') }
    ];

    searchTargets.forEach(({ input, button }) => {
      if (!input || !button) return;
      if (button.dataset.wired === '1') return;
      button.dataset.wired = '1';

      initInputUniversalSearch(input);

      input.addEventListener('focus', () => {
        warmSearch();
        initInputUniversalSearch(input);
      });
      input.addEventListener('pointerdown', () => {
        warmSearch();
        initInputUniversalSearch(input);
      });

      button.addEventListener('click', () => {
        void loadUniversalSearchScript().finally(() => {
          initInputUniversalSearch(input);
          input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        });
      });
    });
  }

  function boot() {
    if (isHeaderSuppressedPage(window.location.pathname)) return;
    if (isLandingShell()) {
      teardownSharedHeader();
      return;
    }
    mountSharedHeader();
    wireLogoAnim();
    const applyMobileHeaderState = () => {
      const isMobile = window.matchMedia && window.matchMedia('(max-width: 1024px)').matches;
      document.body.classList.toggle('zo2y-mobile-header-fixed', !!isMobile);
    };
    applyMobileHeaderState();
    window.addEventListener('resize', applyMobileHeaderState);
    wireSearchButton();
    wireMobileDrawer();
    wireMobileAccordions();
    wireDesktopRailCollapse();
    wireAuthStateSync();
    void syncAuthHeaderState();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
