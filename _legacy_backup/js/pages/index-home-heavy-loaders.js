(() => {
  if (window.__zo2yHomeHeavyLoaders) return;

  async function loadMovies(signal) {
    const targetCount = getHomeChannelTargetItems();
    const interestBuilders = buildHomeTmdbInterestSources('movie');
    const sourceBuilders = shuffleArray([
      ...interestBuilders,
      () => `${TMDB_PROXY_BASE}/movie/popular?language=en-US&page=${randomInt(1, 5)}`,
      () => `${TMDB_PROXY_BASE}/movie/top_rated?language=en-US&page=${randomInt(1, 5)}`,
      () => `${TMDB_PROXY_BASE}/movie/now_playing?language=en-US&page=${randomInt(1, 4)}`,
      () => `${TMDB_PROXY_BASE}/trending/movie/week?page=${randomInt(1, 3)}`
    ]).slice(0, getHomeTmdbSourceCount() + (interestBuilders.length ? 1 : 0));
    const batches = await Promise.all(sourceBuilders.map(async (buildUrl) => {
      try {
        const url = buildUrl();
        const json = await fetchJsonWithPerfCache(url, { signal, cacheKey: `tmdb:${url}` });
        if (!json) return [];
        return Array.isArray(json.results) ? json.results : [];
      } catch (_err) {
        return [];
      }
    }));
    const collected = shuffleArray(batches.flat());
    const seen = new Set();
    const results = [];
    for (const item of collected) {
      const key = String(item?.id || '').trim();
      if (!key || seen.has(key)) continue;
      if (isLikelyAnimeMovieEntry(item)) continue;
      if (!item?.poster_path && !item?.backdrop_path) continue;
      seen.add(key);
      results.push(item);
      if (results.length >= targetCount) break;
    }
    return results.map((m) => ({
      mediaType: 'movie',
      itemId: String(m.id || ''),
      title: m.title || 'Movie',
      subtitle: m.release_date ? m.release_date.slice(0, 4) : 'Movie',
      image: m.poster_path ? `${TMDB_POSTER}${m.poster_path}` : '',
      backgroundImage: m.backdrop_path ? `${TMDB_BACKDROP}${m.backdrop_path}` : '',
      spotlightImage: m.backdrop_path ? `${TMDB_BACKDROP}${m.backdrop_path}` : '',
      spotlightMediaImage: m.poster_path ? `${TMDB_SPOT_POSTER}${m.poster_path}` : (m.backdrop_path ? `${TMDB_BACKDROP}${m.backdrop_path}` : ''),
      spotlightMediaFit: 'contain',
      spotlightMediaShape: 'poster',
      isAdult: m?.adult === true,
      href: m.id ? `movie.html?id=${encodeURIComponent(m.id)}` : 'movies.html'
    })).filter((item) => isHomeSafeContentItem(item));
  }

  async function loadTv(signal) {
    const targetCount = getHomeChannelTargetItems();
    const interestBuilders = buildHomeTmdbInterestSources('tv');
    const sourceBuilders = shuffleArray([
      ...interestBuilders,
      () => `${TMDB_PROXY_BASE}/tv/popular?language=en-US&page=${randomInt(1, 5)}`,
      () => `${TMDB_PROXY_BASE}/tv/top_rated?language=en-US&page=${randomInt(1, 5)}`,
      () => `${TMDB_PROXY_BASE}/tv/airing_today?language=en-US&page=${randomInt(1, 4)}`,
      () => `${TMDB_PROXY_BASE}/trending/tv/week?page=${randomInt(1, 3)}`
    ]).slice(0, getHomeTmdbSourceCount() + (interestBuilders.length ? 1 : 0));
    const batches = await Promise.all(sourceBuilders.map(async (buildUrl) => {
      try {
        const url = buildUrl();
        const json = await fetchJsonWithPerfCache(url, { signal, cacheKey: `tmdb:${url}` });
        if (!json) return [];
        return Array.isArray(json.results) ? json.results : [];
      } catch (_err) {
        return [];
      }
    }));
    const collected = shuffleArray(batches.flat());
    const seen = new Set();
    const results = [];
    for (const item of collected) {
      const key = String(item?.id || '').trim();
      if (!key || seen.has(key)) continue;
      if (isLikelyAnimeTvEntry(item)) continue;
      if (!item?.poster_path && !item?.backdrop_path) continue;
      seen.add(key);
      results.push(item);
      if (results.length >= targetCount) break;
    }
    return results.map((t) => ({
      mediaType: 'tv',
      itemId: String(t.id || ''),
      title: t.name || 'TV Show',
      subtitle: t.first_air_date ? t.first_air_date.slice(0, 4) : 'TV Show',
      image: t.poster_path ? `${TMDB_POSTER}${t.poster_path}` : '',
      backgroundImage: t.backdrop_path ? `${TMDB_BACKDROP}${t.backdrop_path}` : '',
      spotlightImage: t.backdrop_path ? `${TMDB_BACKDROP}${t.backdrop_path}` : '',
      spotlightMediaImage: t.poster_path ? `${TMDB_SPOT_POSTER}${t.poster_path}` : (t.backdrop_path ? `${TMDB_BACKDROP}${t.backdrop_path}` : ''),
      spotlightMediaFit: 'contain',
      spotlightMediaShape: 'poster',
      isAdult: t?.adult === true,
      href: t.id ? `tvshow.html?id=${encodeURIComponent(t.id)}` : 'tvshows.html'
    })).filter((item) => isHomeSafeContentItem(item));
  }

  async function loadAnime(signal) {
    const targetCount = getHomeChannelTargetItems();
    const sourceBuilders = shuffleArray([
      () => `${TMDB_PROXY_BASE}/discover/tv?language=en-US&sort_by=popularity.desc&page=${randomInt(1, 5)}&with_genres=16&with_original_language=ja`,
      () => `${TMDB_PROXY_BASE}/discover/tv?language=en-US&sort_by=vote_count.desc&page=${randomInt(1, 5)}&with_genres=16&with_original_language=ja`,
      () => `${TMDB_PROXY_BASE}/discover/tv?language=en-US&sort_by=vote_average.desc&page=${randomInt(1, 4)}&with_genres=16&with_original_language=ja&vote_count.gte=120`
    ]).slice(0, getHomeTmdbSourceCount());
    const batches = await Promise.all(sourceBuilders.map(async (buildUrl) => {
      try {
        const url = buildUrl();
        const json = await fetchJsonWithPerfCache(url, { signal, cacheKey: `tmdb:${url}` });
        if (!json) return [];
        return Array.isArray(json.results) ? json.results : [];
      } catch (_err) {
        return [];
      }
    }));
    const collected = shuffleArray(batches.flat());
    const seen = new Set();
    const results = [];
    for (const item of collected) {
      const key = String(item?.id || '').trim();
      if (!key || seen.has(key)) continue;
      if (!item?.poster_path && !item?.backdrop_path) continue;
      seen.add(key);
      results.push(item);
      if (results.length >= targetCount) break;
    }
    return results.map((show) => ({
      mediaType: 'anime',
      itemId: String(show.id || ''),
      title: show.name || 'Anime',
      subtitle: show.first_air_date ? show.first_air_date.slice(0, 4) : 'Anime',
      image: show.poster_path ? `${TMDB_POSTER}${show.poster_path}` : '',
      backgroundImage: show.backdrop_path ? `${TMDB_BACKDROP}${show.backdrop_path}` : '',
      spotlightImage: show.backdrop_path ? `${TMDB_BACKDROP}${show.backdrop_path}` : '',
      spotlightMediaImage: show.poster_path ? `${TMDB_SPOT_POSTER}${show.poster_path}` : (show.backdrop_path ? `${TMDB_BACKDROP}${show.backdrop_path}` : ''),
      spotlightMediaFit: 'contain',
      spotlightMediaShape: 'poster',
      isAdult: show?.adult === true,
      href: show.id ? `anime.html?id=${encodeURIComponent(show.id)}` : 'animes.html'
    })).filter((item) => isHomeSafeContentItem(item));
  }

  window.__zo2yHomeHeavyLoaders = {
    loadMovies,
    loadTv,
    loadAnime
  };
})();
