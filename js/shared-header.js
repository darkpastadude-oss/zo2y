(() => {
  const SUPABASE_URL = 'https://gfkhjbztayjyojsgdpgk.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma2hqYnp0YXlqeW9qc2dkcGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwOTYyNjQsImV4cCI6MjA3NTY3MjI2NH0.WUb2yDAwCeokdpWCPeH13FE8NhWF6G8e6ivTsgu6b2s';

  const HEADER_HTML = `
<header class="zo2y-shared-header" role="banner" data-shared-header="1">
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
</header>`;

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

  function mountSharedHeader() {
    if (!document.body) return;
    let sharedHeader = document.querySelector('[data-shared-header="1"]');

    if (!sharedHeader) {
      const parser = document.createElement('div');
      parser.innerHTML = HEADER_HTML.trim();
      sharedHeader = parser.firstElementChild;
      if (!sharedHeader) return;

      const legacyHeader = document.querySelector('header');
      if (legacyHeader) {
        legacyHeader.replaceWith(sharedHeader);
      } else {
        document.body.insertBefore(sharedHeader, document.body.firstChild);
      }
    }

    const activePage = normalizePageName(window.location.pathname);
    const accountBtn = sharedHeader.querySelector('#userAccountBtn');
    if (accountBtn) accountBtn.remove();

    sharedHeader.querySelectorAll('[data-nav-page]').forEach((link) => {
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
    if (!loginBtn && !signupBtn && !profileBtn) return;

    const client = ensureSupabaseClient();
    if (!client || !client.auth || typeof client.auth.getSession !== 'function') {
      return;
    }

    try {
      const { data } = await client.auth.getSession();
      const session = data && data.session ? data.session : null;
      const loggedIn = !!session;
      const user = session && session.user ? session.user : null;

      if (loginBtn) loginBtn.style.display = loggedIn ? 'none' : 'inline-flex';
      if (signupBtn) signupBtn.style.display = loggedIn ? 'none' : 'inline-flex';
      if (profileBtn) {
        profileBtn.style.display = loggedIn ? 'inline-flex' : 'none';
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
          profileBtn.innerHTML = `<i class="fas fa-user"></i><span>${label}</span>`;
        }
      }
    } catch (_err) {}
  }

  function wireSearchButton() {
    const input = document.getElementById('globalSearch');
    const btn = document.getElementById('globalSearchBtn');
    if (!input || !btn) return;
    if (btn.dataset.wired === '1') return;
    btn.dataset.wired = '1';

    btn.addEventListener('click', () => {
      if (input) input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    });
  }

  function hideLegacyProfileTopbar() {
    const topbar = document.querySelector('.mobile-topbar');
    if (topbar) {
      topbar.style.display = 'none';
    }
  }

  function boot() {
    mountSharedHeader();
    hideLegacyProfileTopbar();
    wireSearchButton();
    void syncAuthHeaderState();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
