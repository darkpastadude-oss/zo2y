// Lightweight home page boot script.
// Purpose: keep the home page functional even when auth/SW caching gets weird.
(() => {
  function $(sel, root = document) {
    return root.querySelector(sel);
  }

  function safeInitSearch() {
    try {
      if (!window.initUniversalSearch) return;
      window.initUniversalSearch({ input: '#globalSearch', fallbackRoute: 'movies.html' });
      window.initUniversalSearch({ input: '#sidebarSearch', fallbackRoute: 'movies.html' });
    } catch (_err) {}
  }

  const FALLBACK_SPOTLIGHT = [
    {
      title: 'discover',
      subtitle: 'featured content from across your interests',
      image: '/images/fallback/movie.svg',
      href: 'movies.html',
      kicker: 'spotlight'
    },
    {
      title: 'culture stream',
      subtitle: 'one swipeable feed blending movies, tv, anime, books, music, and travel.',
      image: '/images/fallback/tv.svg',
      href: 'movies.html',
      kicker: 'discover'
    }
  ];

  function getSpotlightItems() {
    try {
      const curated = window.ZO2Y_CURATED_MEDIA || window.ZO2Y_CURATED || null;
      const candidates = [];

      if (curated && typeof curated === 'object') {
        const pushFrom = (arr, kicker, hrefBuilder) => {
          if (!Array.isArray(arr)) return;
          arr.slice(0, 6).forEach((item) => {
            if (!item) return;
            candidates.push({
              title: String(item.title || item.name || '').trim() || 'spotlight',
              subtitle: String(item.summary || item.description || '').trim() || '',
              image: String(item.image || item.poster || item.cover || '').trim() || '',
              href: typeof hrefBuilder === 'function' ? hrefBuilder(item) : 'index.html',
              kicker
            });
          });
        };

        pushFrom(curated.movies, 'movie', (it) => (it?.id ? `movie.html?id=${encodeURIComponent(it.id)}` : 'movies.html'));
        pushFrom(curated.tv, 'tv', (it) => (it?.id ? `tvshow.html?id=${encodeURIComponent(it.id)}` : 'tvshows.html'));
        pushFrom(curated.anime, 'anime', () => 'animes.html');
        pushFrom(curated.books, 'book', () => 'books.html');
        pushFrom(curated.music, 'music', () => 'music.html');
        pushFrom(curated.travel, 'travel', () => 'travel.html');
      }

      return candidates.length ? candidates : FALLBACK_SPOTLIGHT;
    } catch (_err) {
      return FALLBACK_SPOTLIGHT;
    }
  }

  function setText(el, text) {
    if (!el) return;
    el.textContent = String(text || '');
  }

  function setHref(el, href) {
    if (!el) return;
    el.setAttribute('href', href || '#');
  }

  function setBgImage(el, url) {
    if (!el) return;
    if (!url) {
      el.style.backgroundImage = '';
      return;
    }
    el.style.backgroundImage = `url("${String(url).replace(/\"/g, '%22')}")`;
  }

  function renderSpotlight(items, idx) {
    const item = items[idx % items.length] || items[0];
    setText($('#spotlightKicker'), item.kicker || 'spotlight');
    setText($('#spotlightTitle'), item.title || 'spotlight');
    setText($('#spotlightSubtitle'), item.subtitle || '');
    setHref($('#spotlightOpen'), item.href || 'index.html');
    const image = String(item.image || '').trim();
    setBgImage($('#spotlightArtwork'), image);
    const imgEl = $('#spotlightArtworkImg');
    if (imgEl && image) imgEl.setAttribute('src', image);
  }

  document.addEventListener('DOMContentLoaded', () => {
    safeInitSearch();

    const items = getSpotlightItems();
    let idx = 0;
    renderSpotlight(items, idx);

    const nextBtn = $('#spotlightNextBtn');
    nextBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      idx = (idx + 1) % items.length;
      renderSpotlight(items, idx);
    });

    // Make sure the page is visible even if older markup/CSS hides it.
    $('#appRoot')?.classList?.remove('hidden');
    document.body?.classList?.remove('loading');
  });
})();

