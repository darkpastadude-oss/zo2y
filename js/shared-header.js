(() => {
  const SUPABASE_URL = 'https://gfkhjbztayjyojsgdpgk.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma2hqYnp0YXlqeW9qc2dkcGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwOTYyNjQsImV4cCI6MjA3NTY3MjI2NH0.WUb2yDAwCeokdpWCPeH13FE8NhWF6G8e6ivTsgu6b2s';
  const UNIVERSAL_SEARCH_SRC = 'js/universal-search.js?v=20260307a';
  let universalSearchLoaderPromise = null;

  const HEADER_HTML = `
<header class="zo2y-shared-header" role="banner" data-shared-header="1">
  <div class="zo2y-mobile-topbar">
    <button class="zo2y-mobile-menu-btn" id="zo2yMobileMenuBtn" type="button" aria-label="Open navigation menu" aria-controls="zo2yMobileDrawer" aria-expanded="false">
      <i class="fa-solid fa-bars"></i>
    </button>
    <a class="zo2y-mobile-wordmark" href="index.html" aria-label="Zo2y home">
      <img src="images/logo.png" alt="Zo2y logo" />
      <span>o2y</span>
    </a>
    <span class="zo2y-mobile-topbar-spacer" aria-hidden="true"></span>
  </div>
  <div class="zo2y-shared-header-inner">
    <a class="zo2y-shared-brand" href="index.html">
      <img src="images/logo.png" alt="Zo2y" />
      <span>Zo2y</span>
    </a>
    <div class="nav-search zo2y-shared-search">
      <input id="globalSearch" class="nav-search-input zo2y-shared-search-input" type="search" placeholder="Search all media..." aria-label="Search all media" />
      <button id="globalSearchBtn" class="nav-search-btn zo2y-shared-search-btn" type="button" aria-label="Search"><i class="fas fa-search"></i></button>
      <div id="globalSearchSuggest" class="search-suggest zo2y-shared-suggest"></div>
    </div>
    <nav class="zo2y-shared-nav" aria-label="Primary navigation">
      <a class="zo2y-shared-pill" data-nav-page="index" href="index.html">Home</a>
      <a class="zo2y-shared-pill" data-nav-page="movies" href="movies.html">Movies</a>
      <a class="zo2y-shared-pill" data-nav-page="tvshows" href="tvshows.html">TV</a>
      <a class="zo2y-shared-pill" data-nav-page="animes" href="animes.html">Anime</a>
      <a class="zo2y-shared-pill" data-nav-page="games" href="games.html">Games</a>
      <a class="zo2y-shared-pill" data-nav-page="books" href="books.html">Books</a>
      <a class="zo2y-shared-pill" data-nav-page="music" href="music.html">Music</a>
      <a class="zo2y-shared-pill" data-nav-page="travel" href="travel.html">Travel</a>
      <a class="zo2y-shared-pill" data-nav-page="reviews" href="reviews.html">Reviews</a>
    </nav>
    <div class="zo2y-shared-auth">
      <a class="zo2y-shared-btn" href="login.html" id="loginBtn">Login</a>
      <a class="zo2y-shared-btn zo2y-shared-btn-primary" href="sign-up.html" id="signupBtn">Sign Up</a>
      <a class="zo2y-shared-btn" href="profile.html" id="profileBtn" style="display:none;">Profile</a>
    </div>
  </div>
</header>
<div class="zo2y-mobile-drawer-backdrop" id="zo2yMobileDrawerBackdrop" hidden></div>
<aside class="zo2y-mobile-drawer" id="zo2yMobileDrawer" aria-hidden="true" aria-label="Mobile navigation">
  <div class="zo2y-mobile-drawer-head">
    <a class="zo2y-mobile-drawer-brand" href="index.html" aria-label="Zo2y home">
      <img src="images/logo.png" alt="Zo2y logo" />
      <span>o2y</span>
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

  <nav class="zo2y-mobile-drawer-nav" aria-label="Mobile sections">
    <a class="zo2y-mobile-drawer-link" data-nav-page="index" href="index.html"><i class="fa-solid fa-house"></i><span>Home</span></a>
    <a class="zo2y-mobile-drawer-link" data-nav-page="movies" href="movies.html"><i class="fa-solid fa-film"></i><span>Movies</span></a>
    <a class="zo2y-mobile-drawer-link" data-nav-page="tvshows" href="tvshows.html"><i class="fa-solid fa-tv"></i><span>TV Shows</span></a>
    <a class="zo2y-mobile-drawer-link" data-nav-page="animes" href="animes.html"><i class="fa-solid fa-dragon"></i><span>Anime</span></a>
    <a class="zo2y-mobile-drawer-link" data-nav-page="games" href="games.html"><i class="fa-solid fa-gamepad"></i><span>Games</span></a>
    <a class="zo2y-mobile-drawer-link" data-nav-page="books" href="books.html"><i class="fa-solid fa-book"></i><span>Books</span></a>
    <a class="zo2y-mobile-drawer-link" data-nav-page="music" href="music.html"><i class="fa-solid fa-music"></i><span>Music</span></a>
    <a class="zo2y-mobile-drawer-link" data-nav-page="travel" href="travel.html"><i class="fa-solid fa-earth-americas"></i><span>Travel</span></a>
    <a class="zo2y-mobile-drawer-link accent" data-nav-page="reviews" href="reviews.html"><i class="fa-solid fa-star"></i><span>Reviews</span></a>
  </nav>

  <div class="zo2y-mobile-drawer-divider"></div>
  <p class="zo2y-mobile-drawer-label">Quick Picks</p>
  <div class="zo2y-mobile-drawer-quick">
    <a class="zo2y-mobile-drawer-link" href="index.html#newReleasesRail"><i class="fa-solid fa-satellite-dish"></i><span>New Releases</span></a>
    <a class="zo2y-mobile-drawer-link" href="index.html#imdbTop10Rail"><i class="fa-solid fa-ranking-star"></i><span>IMDb Top 10</span></a>
    <a class="zo2y-mobile-drawer-link" href="profile.html"><i class="fa-solid fa-list"></i><span>Your Lists</span></a>
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
    const file = String(pathname || '').split('/').pop().toLowerCase() || 'index.html';
    if (file === '' || file === 'index.html') return 'index';
    if (file.startsWith('movie')) return 'movies';
    if (file.startsWith('tvshow')) return 'tvshows';
    if (file.startsWith('anime')) return 'animes';
    if (file.startsWith('game')) return 'games';
    if (file.startsWith('book')) return 'books';
    if (file.startsWith('song') || file.startsWith('music')) return 'music';
    if (file.startsWith('travel') || file.startsWith('country')) return 'travel';
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

  function mountSharedHeader() {
    if (!document.body) return;
    const parser = document.createElement('div');
    parser.innerHTML = HEADER_HTML.trim();
    const nextSharedHeader = parser.firstElementChild;
    const nextMobileDrawer = parser.querySelector('#zo2yMobileDrawer');
    const nextMobileBackdrop = parser.querySelector('#zo2yMobileDrawerBackdrop');
    if (!nextSharedHeader) return;

    const existingSharedHeader = document.querySelector('[data-shared-header="1"]');
    const existingMobileDrawer = document.getElementById('zo2yMobileDrawer');
    const existingMobileBackdrop = document.getElementById('zo2yMobileDrawerBackdrop');

    if (existingMobileDrawer) existingMobileDrawer.remove();
    if (existingMobileBackdrop) existingMobileBackdrop.remove();

    if (existingSharedHeader) {
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

    const mobilePage = isMobileContentPage(window.location.pathname);
    document.body.setAttribute('data-zo2y-compact-header', mobilePage ? '1' : '0');

    if (mobilePage) {
      document.querySelectorAll('[data-nav-page="games"]').forEach((gamesNavItem) => gamesNavItem.remove());
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
  }

  function ensureSupabaseClient() {
    if (!window.supabase || typeof window.supabase.createClient !== 'function') return null;
    try {
      return window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    } catch (_err) {
      return null;
    }
  }

  async function syncAuthHeaderState() {
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const profileBtn = document.getElementById('profileBtn');
    const mobileLoginBtn = document.getElementById('mobileLoginBtn');
    const mobileSignupBtn = document.getElementById('mobileSignupBtn');
    const mobileProfileBtn = document.getElementById('mobileProfileBtn');
    if (!loginBtn && !signupBtn && !profileBtn && !mobileLoginBtn && !mobileSignupBtn && !mobileProfileBtn) return;

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

    const setDrawerState = (isOpen) => {
      drawer.classList.toggle('open', isOpen);
      backdrop.classList.toggle('active', isOpen);
      drawer.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
      menuBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      menuBtn.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
      backdrop.hidden = !isOpen;
      document.body.classList.toggle('zo2y-mobile-menu-open', isOpen);
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

  function wireSearchButton() {
    const input = document.getElementById('globalSearch');
    const btn = document.getElementById('globalSearchBtn');
    if (!input || !btn) return;
    if (btn.dataset.wired === '1') return;
    btn.dataset.wired = '1';

    const warmSearch = () => {
      void loadUniversalSearchScript();
    };

    input.addEventListener('focus', warmSearch, { once: true });
    input.addEventListener('pointerdown', warmSearch, { once: true });

    btn.addEventListener('click', () => {
      void loadUniversalSearchScript().finally(() => {
        if (input) input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      });
    });
  }

  function boot() {
    if (isHeaderSuppressedPage(window.location.pathname)) return;
    mountSharedHeader();
    wireSearchButton();
    wireMobileDrawer();
    void syncAuthHeaderState();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
