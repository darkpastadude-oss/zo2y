(() => {
  if (window.__zo2yHomeHeavyLoaders) return;

  const supabaseConfig = window.__ZO2Y_SUPABASE_CONFIG || {};
  const SUPABASE_URL = String(supabaseConfig.url || '').trim() || 'https://gfkhjbztayjyojsgdpgk.supabase.co';
  const HOME_LOCAL_FALLBACK_IMAGE = String(window.HOME_LOCAL_FALLBACK_IMAGE || '').trim();
  const HOME_SPORTS_SEEDS = Array.isArray(window.ZO2Y_HOME_SPORTS_SEEDS) ? window.ZO2Y_HOME_SPORTS_SEEDS : [];

const HOME_BOOKS_ITEMS_CACHE_KEY = 'zo2y_home_books_items_v7';
const HOME_BOOKS_ITEMS_CACHE_MAX_AGE_MS = 1000 * 60 * 60 * 6;
const CURRENT_TOP_BOOK_SEEDS = Array.isArray(window.ZO2Y_CURATED_BOOK_SEEDS) && window.ZO2Y_CURATED_BOOK_SEEDS.length
  ? window.ZO2Y_CURATED_BOOK_SEEDS.slice()
  : [];

function buildOpenLibraryCoverUrl(doc, size = 'L') {
  const safeSize = String(size || 'L').trim().toUpperCase() || 'L';
  const coverId = Number(doc?.cover_i || 0) || 0;
  if (coverId > 0) {
    return `https://covers.openlibrary.org/b/id/${encodeURIComponent(String(coverId))}-${safeSize}.jpg`;
  }
  const isbn = Array.isArray(doc?.isbn)
    ? String(doc.isbn[0] || '').trim()
    : String(doc?.isbn || '').trim();
  const normalizedIsbn = isbn.replace(/[^0-9Xx]/g, '');
  if (normalizedIsbn) {
    return `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(normalizedIsbn)}-${safeSize}.jpg`;
  }
  return '';
}

function normalizeBookSeedText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function scoreSeededBookMatch(row, seed) {
  const normalizedTitle = normalizeBookSeedText(row?.title || '');
  const normalizedAuthor = normalizeBookSeedText(Array.isArray(row?.author_name) ? row.author_name[0] : '');
  const seedTitle = normalizeBookSeedText(seed?.title || '');
  const seedAuthor = normalizeBookSeedText(seed?.author || '');
  let score = 0;
  if (normalizedTitle && seedTitle) {
    if (normalizedTitle === seedTitle) score += 120;
    else if (normalizedTitle.startsWith(seedTitle) || seedTitle.startsWith(normalizedTitle)) score += 80;
    else if (normalizedTitle.includes(seedTitle) || seedTitle.includes(normalizedTitle)) score += 48;
  }
  if (normalizedAuthor && seedAuthor) {
    if (normalizedAuthor === seedAuthor) score += 70;
    else if (normalizedAuthor.includes(seedAuthor) || seedAuthor.includes(normalizedAuthor)) score += 42;
  }
  if (row?._googleThumbnail || row?.coverImage || row?.cover_i) score += 16;
  if (row?.first_publish_year) score += 8;
  return score;
}

async function loadBooks(signal) {
      const targetCount = getHomeChannelTargetItems();
      const lightweightMode = shouldUseLightweightHomeBooksLoad();
      const currentYear = new Date().getUTCFullYear();
      const recentFloor = 0;
      const setBooksDebug = (stage, detail = {}) => {
        try {
          window.__zo2yHomeBooksDebug = {
            stage: String(stage || '').trim() || 'unknown',
            detail: detail && typeof detail === 'object' ? detail : {},
            at: new Date().toISOString()
          };
        } catch (_error) {}
      };
      const getBookRecordId = (doc) => {
        const volumeId = String(doc?._googleVolumeId || doc?.id || '').trim();
        if (volumeId) return volumeId;
        const key = String(doc?.key || '').trim();
        if (key.startsWith('/works/')) return key.replace('/works/', '').trim();
        if (key) return key;
        return '';
      };
      const fetchLocalBookOverrides = async () => new Map();

      const normalizeBookDoc = (row, idx = 0) => {
        if (!row) return null;
        if (row.volumeInfo) {
          const info = row.volumeInfo || {};
          const title = String(info?.title || '').trim();
          if (!title) return null;
          const author = Array.isArray(info?.authors) && info.authors.length ? String(info.authors[0] || '').trim() : 'Unknown author';
          const identifiers = Array.isArray(info?.industryIdentifiers) ? info.industryIdentifiers : [];
          const isbn = identifiers
            .map((entry) => String(entry?.identifier || '').replace(/[^0-9Xx]/g, ''))
            .filter(Boolean);
          const published = String(info?.publishedDate || '').trim();
          const yearMatch = published.match(/\d{4}/);
          return {
            key: '',
            title,
            author_name: [author],
            first_publish_year: yearMatch ? Number(yearMatch[0]) : null,
            isbn,
            cover_i: null,
            coverImage: toHttpsUrl(info?.imageLinks?.thumbnail || info?.imageLinks?.smallThumbnail || ''),
            _googleThumbnail: toHttpsUrl(info?.imageLinks?.thumbnail || info?.imageLinks?.smallThumbnail || ''),
            _googleVolumeId: String(row?.id || '').trim(),
            maturityRating: String(info?.maturityRating || '').trim(),
            _source: 'google-books'
          };
        }
        const title = String(row?.title || '').trim();
        if (!title) return null;
        const author = Array.isArray(row?.author_name) && row.author_name.length
          ? String(row.author_name[0] || '').trim()
          : (String(row?.author || '').trim() || 'Unknown author');
        const isbn = Array.isArray(row?.isbn)
          ? row.isbn.map((entry) => String(entry || '').replace(/[^0-9Xx]/g, '')).filter(Boolean)
          : (String(row?.isbn || '').trim() ? [String(row.isbn).trim().replace(/[^0-9Xx]/g, '')] : []);
        return {
          key: String(row?.key || row?.id || '').trim(),
          title,
          author_name: [author],
          first_publish_year: Number(row?.first_publish_year || row?.year || 0) || null,
          isbn,
          cover_i: Number(row?.cover_i || 0) || null,
          coverImage: toHttpsUrl(row?.coverImage || row?.cover || ''),
          _googleThumbnail: toHttpsUrl(row?._googleThumbnail || ''),
          _googleVolumeId: String(row?._googleVolumeId || '').trim(),
          maturityRating: String(row?.maturityRating || '').trim(),
          _source: String(row?._source || '').trim() || 'book'
        };
      };

      const mapDocsToRailItems = (docs, options = {}) => {
        const minYear = Number(options.minYear || 0);
        const allowMissingYear = !!options.allowMissingYear;
          const seen = new Set();
          return (Array.isArray(docs) ? docs : []).map((doc, idx) => {
            const normalized = normalizeBookDoc(doc, idx);
            if (!normalized) return null;
            const recordId = getBookRecordId(normalized);
            const title = String(normalized.title || '').trim();
            const author = String((Array.isArray(normalized.author_name) ? normalized.author_name[0] : '') || '').trim() || 'Unknown author';
            const year = Number(normalized?.first_publish_year || 0) || 0;

          if (!allowMissingYear && !year) return null;
          if (minYear && year && year < minYear) return null;

            const coverCandidates = [
              toHttpsUrl(normalized?._googleThumbnail || ''),
              toHttpsUrl(buildOpenLibraryCoverUrl(normalized, 'L')),
              toHttpsUrl(buildOpenLibraryCoverUrl(normalized, 'M')),
              toHttpsUrl(normalized?.coverImage || '')
            ].filter(Boolean);
          const cover = coverCandidates[0] || '/images/landing-wall-poster.svg';

          const dedupeKey = `${title.toLowerCase()}::${author.toLowerCase()}`;
          if (seen.has(dedupeKey)) return null;
          seen.add(dedupeKey);

          const subtitle = year ? `${author} | ${year}` : author;
          const googleVolumeId = String(normalized?._googleVolumeId || '').trim();
          const workKey = String(normalized?.key || '').trim();
          let itemId = '';
          if (recordId) itemId = recordId;
          if (!itemId && googleVolumeId) itemId = googleVolumeId;
          if (!itemId && workKey.startsWith('/works/')) itemId = workKey.replace('/works/', '').trim();
          if (!itemId) {
            itemId = `search-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || `book-${idx}`}`;
          }
          const isbnRaw = Array.isArray(normalized?.isbn) ? String(normalized.isbn[0] || '').trim() : '';
          const isbn = isbnRaw.replace(/[^0-9Xx]/g, '');
          const titleParam = encodeURIComponent(title);
          const authorParam = encodeURIComponent(author);
          const href = `book.html?id=${encodeURIComponent(itemId)}&title=${titleParam}&author=${authorParam}`;

          return {
            mediaType: 'book',
            itemId,
            title,
            subtitle,
            image: cover,
            backgroundImage: cover,
            spotlightImage: cover,
            spotlightMediaImage: cover,
            spotlightMediaFit: 'contain',
            spotlightMediaShape: 'poster',
            fallbackImage: '/images/landing-wall-poster.svg',
            maturityRating: String(normalized?.maturityRating || '').trim(),
            isbn,
            href
          };
        }).filter(Boolean);
      };

      const mergeUniqueItems = (...batches) => {
        const seen = new Set();
        const out = [];
        batches.forEach((batch) => {
          (Array.isArray(batch) ? batch : []).forEach((item) => {
            const key = `${String(item?.title || '').trim().toLowerCase()}::${String(item?.subtitle || '').trim().toLowerCase()}`;
            if (!key || seen.has(key)) return;
            seen.add(key);
            out.push(item);
          });
        });
        return out;
      };

      const sanitizeHomeBookItem = (item) => {
        if (!item || String(item?.mediaType || '').trim().toLowerCase() !== 'book') return null;
        const title = String(item?.title || '').trim();
        const itemId = String(item?.itemId || '').trim();
        const image = toHttpsUrl(String(item?.image || item?.listImage || item?.spotlightImage || '').trim());
        if (!title || !itemId || !image) return null;
        return {
          ...item,
          mediaType: 'book',
          itemId,
          title,
          subtitle: String(item?.subtitle || '').trim(),
          image,
          listImage: image,
          backgroundImage: toHttpsUrl(String(item?.backgroundImage || image).trim()) || image,
          spotlightImage: toHttpsUrl(String(item?.spotlightImage || image).trim()) || image,
          spotlightMediaImage: toHttpsUrl(String(item?.spotlightMediaImage || image).trim()) || image,
          href: String(item?.href || '').trim() || 'books.html'
        };
      };

      const cachedItems = readHomeItemsCache(
        HOME_BOOKS_ITEMS_CACHE_KEY,
        HOME_BOOKS_ITEMS_CACHE_MAX_AGE_MS,
        sanitizeHomeBookItem
      );
      if (cachedItems.length) {
        setBooksDebug('cache-hit', { count: cachedItems.length });
        return cachedItems.slice(0, targetCount);
      }

      const fetchBooksPayload = async (path, params = {}) => {
        const normalizedPath = String(path || '').startsWith('/') ? String(path) : `/${String(path || '')}`;
        const url = new URL(`/api/books${normalizedPath}`, window.location.origin);
        Object.entries(params || {}).forEach(([key, value]) => {
          if (value === undefined || value === null || value === '') return;
          url.searchParams.set(key, String(value));
        });
        url.searchParams.set('cb', '20260325a');
        url.searchParams.set('_', String(Date.now()));
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), 12000);
        try {
          setBooksDebug('fetching', { path: normalizedPath, params });
          let response;
          try {
            response = await fetch(url.toString(), {
              headers: { Accept: 'application/json' },
              signal: controller.signal,
              cache: 'no-store'
            });
          } catch (error) {
            const isAbort = error && (error.name === 'AbortError' || String(error?.message || '').toLowerCase().includes('aborted'));
            // If the first attempt timed out, retry once without an AbortController before failing.
            if (isAbort) {
              response = await fetch(url.toString(), { headers: { Accept: 'application/json' }, cache: 'no-store' });
            } else {
              throw error;
            }
          }
          if (!response.ok) {
            const error = new Error(`Books API error ${response.status}`);
            error.status = response.status;
            error.path = normalizedPath;
            throw error;
          }
          const json = await response.json();
          setBooksDebug('fetched', {
            path: normalizedPath,
            books: Array.isArray(json?.books) ? json.books.length : 0,
            docs: Array.isArray(json?.docs) ? json.docs.length : 0,
            items: Array.isArray(json?.items) ? json.items.length : 0
          });
          return json;
        } finally {
          window.clearTimeout(timeoutId);
        }
      };

      const fetchSeededTopBooks = async (limit = targetCount) => {
        const pool = shuffleArray(CURRENT_TOP_BOOK_SEEDS).slice(0, Math.min(CURRENT_TOP_BOOK_SEEDS.length, Math.max(limit * 3, 18)));
        const results = await Promise.allSettled(pool.map(async (seed) => {
          const payload = await fetchBooksPayload('/search', {
            title: seed.title,
            author: seed.author,
            limit: 5,
            page: 1
          });
          const docs = Array.isArray(payload?.books)
            ? payload.books
            : (Array.isArray(payload?.docs) ? payload.docs : (Array.isArray(payload?.items) ? payload.items : []));
          if (!docs.length) return null;
          const normalizedDocs = docs
            .map((row, idx) => normalizeBookDoc(row, idx))
            .filter(Boolean)
            .sort((a, b) => scoreSeededBookMatch(b, seed) - scoreSeededBookMatch(a, seed));
          return normalizedDocs[0] || null;
        }));
        const seen = new Set();
        const seededDocs = [];
        results.forEach((result) => {
          if (result.status !== 'fulfilled' || !result.value) return;
          const row = result.value;
          const key = `${normalizeBookSeedText(row?.title || '')}::${normalizeBookSeedText(Array.isArray(row?.author_name) ? row.author_name[0] : '')}`;
          if (!key || seen.has(key)) return;
          seen.add(key);
          seededDocs.push(row);
        });
        return seededDocs;
      };

      try {
        const limit = lightweightMode ? Math.max(targetCount, 12) : Math.max(targetCount, 18);
        const [seededResult, popularResult, trendingResult] = await Promise.allSettled([
          fetchSeededTopBooks(limit),
          fetchBooksPayload('/popular', {
            page: 1,
            limit,
            subject: 'fiction',
            language: 'en',
            orderBy: 'relevance'
          }),
          fetchBooksPayload('/trending', {
            period: 'weekly',
            limit
          })
        ]);

        const seededDocs = seededResult.status === 'fulfilled' && Array.isArray(seededResult.value) ? seededResult.value : [];
        const popularPayload = popularResult.status === 'fulfilled' ? popularResult.value : null;
        const trendingPayload = trendingResult.status === 'fulfilled' ? trendingResult.value : null;
        const popularDocs = Array.isArray(popularPayload?.books)
          ? popularPayload.books
          : (Array.isArray(popularPayload?.docs) ? popularPayload.docs : (Array.isArray(popularPayload?.items) ? popularPayload.items : []));
        const trendingDocs = Array.isArray(trendingPayload?.books)
          ? trendingPayload.books
          : (Array.isArray(trendingPayload?.docs) ? trendingPayload.docs : (Array.isArray(trendingPayload?.items) ? trendingPayload.items : []));
        let allDocsRaw = [...seededDocs, ...trendingDocs, ...popularDocs];
        if (!allDocsRaw.length) {
          try {
            const fallbackPayload = await fetchBooksPayload('/popular', {
              page: 1,
              limit: Math.max(limit, 24),
              subject: 'fiction',
              language: 'en',
              orderBy: 'relevance'
            });
            const fallbackDocs = Array.isArray(fallbackPayload?.books)
              ? fallbackPayload.books
              : (Array.isArray(fallbackPayload?.docs) ? fallbackPayload.docs : (Array.isArray(fallbackPayload?.items) ? fallbackPayload.items : []));
            if (fallbackDocs.length) {
              allDocsRaw = fallbackDocs;
              setBooksDebug('fallback-popular-hit', { count: fallbackDocs.length });
            }
          } catch (fallbackError) {
            setBooksDebug('fallback-popular-failed', {
              message: String(fallbackError?.message || fallbackError || '')
            });
          }
        }
        setBooksDebug('payload-merged', {
          limit,
          seededStatus: seededResult.status,
          seededCount: seededDocs.length,
          popularStatus: popularResult.status,
          trendingStatus: trendingResult.status,
          popularCount: popularDocs.length,
          trendingCount: trendingDocs.length,
          seededError: seededResult.status === 'rejected' ? String(seededResult.reason?.message || seededResult.reason || '') : '',
          popularError: popularResult.status === 'rejected' ? String(popularResult.reason?.message || popularResult.reason || '') : '',
          trendingError: trendingResult.status === 'rejected' ? String(trendingResult.reason?.message || trendingResult.reason || '') : ''
        });

        const strictModern = mapDocsToRailItems(allDocsRaw, { minYear: 0, allowMissingYear: true });
        const modernWithUnknownYear = mapDocsToRailItems(allDocsRaw, { minYear: 0, allowMissingYear: true });
        const relaxedFallback = mapDocsToRailItems(allDocsRaw, { minYear: 0, allowMissingYear: true });
        const merged = mergeUniqueItems(strictModern, modernWithUnknownYear, relaxedFallback);
        const safeMerged = filterHomeSafeItems(merged);
        setBooksDebug('items-mapped', {
          rawDocs: allDocsRaw.length,
          strictModern: strictModern.length,
          modernWithUnknownYear: modernWithUnknownYear.length,
          relaxedFallback: relaxedFallback.length,
          merged: merged.length,
          safeMerged: safeMerged.length
        });
        if (safeMerged.length) {
          const shuffled = shuffleArray(safeMerged);
          writeHomeItemsCache(HOME_BOOKS_ITEMS_CACHE_KEY, shuffled);
          setBooksDebug('success', { count: shuffled.length });
          return shuffled.slice(0, targetCount);
        }
        const emptyDetail = {
          rawDocs: allDocsRaw.length,
          recentFloor
        };
        setBooksDebug('empty-after-mapping', emptyDetail);
        console.error('[home books] no usable homepage book items after mapping', emptyDetail);
      } catch (error) {
        const detail = {
          message: String(error?.message || error || ''),
          status: Number(error?.status || 0) || null,
          path: String(error?.path || '').trim()
        };
        setBooksDebug('error', detail);
        console.error('[home books] failed to load homepage books', detail, error);
      }

      return [];
    }

    async function loadMusic(signal) {
      const targetCount = getHomeChannelTargetItems();
      const lightweightMode = shouldUseLightweightHomeMusicLoad();
      const market = 'US';
      const HOME_MUSIC_MIN_ITEMS = lightweightMode
        ? Math.max(5, Math.min(targetCount, 8))
        : Math.max(8, Math.min(targetCount, 12));
      const getTrackContainerLabel = (track = {}) => {
        const title = String(track?.name || '').trim().toLowerCase();
        const albumName = String(track?.album?.name || track?.album_name || '').trim();
        const albumType = String(track?.album?.album_type || track?.album_type || '').trim().toLowerCase();
        const totalTracks = Number(track?.album?.total_tracks || track?.total_tracks || 0);
        const sameName = !!title && !!albumName && title === albumName.toLowerCase();
        if (albumType === 'single' && totalTracks > 0 && totalTracks <= 1 && sameName) return 'Single';
        if (/\bsingle\b/i.test(albumName) && totalTracks > 0 && totalTracks <= 1 && sameName) return 'Single';
        return 'Album';
      };
      const mapTracksToHomeItems = (tracks = []) => tracks.map((track) => {
        if (String(track?.kind || '').trim().toLowerCase() === 'album') return null;
        const artists = Array.isArray(track?.artists) ? track.artists.filter(Boolean).join(', ') : 'Artist';
        const title = String(track?.name || 'Track').trim() || 'Track';
        const albumName = String(track?.album?.name || track?.album_name || '').trim() || 'Unknown Album';
        const containerLabel = getTrackContainerLabel(track);
        const popularity = Number(track?.popularity || 0);
        const image = String(track?.image || '').trim();
        return {
          mediaType: 'music',
          itemId: String(track?.id || ''),
          title,
          subtitle: artists || 'Artist',
          extra: `Song | ${containerLabel}: ${albumName}${popularity ? ` | Popularity ${popularity}/100` : ''}`,
          image,
          backgroundImage: image,
          spotlightImage: image,
          spotlightMediaImage: image,
          previewUrl: String(track?.preview_url || '').trim(),
          spotlightMediaFit: 'contain',
          spotlightMediaShape: 'poster',
          explicit: track?.explicit === true,
          href: String(track?.id || '').trim() ? `song.html?id=${encodeURIComponent(track.id)}` : 'music.html'
        };
      }).filter((item) => item && String(item?.itemId || '').trim());

      const mapAlbumsToHomeItems = (albums = []) => albums.map((album, idx) => {
        const albumIdRaw = String(album?.id || '').trim();
        const albumId = albumIdRaw.startsWith('album:') ? albumIdRaw.slice(6) : albumIdRaw;
        const albumType = String(album?.album_type || 'album').trim().toLowerCase();
        if (albumType && albumType !== 'album') return null;
        if (!albumId) return null;
        const source = String(album?.source || '').trim().toLowerCase() || (/^[0-9]+$/.test(albumId) ? 'itunes' : 'spotify');
        const artists = Array.isArray(album?.artists) ? album.artists.filter(Boolean).join(', ') : 'Artist';
        const image = String(album?.image || '').trim();
        const releaseDate = String(album?.release_date || '').trim();
        const totalTracks = Number(album?.total_tracks || 0);
        const detail = [
          releaseDate ? `Released ${releaseDate}` : '',
          totalTracks > 0 ? `${totalTracks} tracks` : '',
          albumType || ''
        ].filter(Boolean).join(' | ');
        const href = `song.html?album_id=${encodeURIComponent(albumId)}&source=${encodeURIComponent(source)}`;
        return {
          mediaType: 'music',
          itemId: `album:${albumId}`,
          title: String(album?.name || 'Album').trim() || 'Album',
          subtitle: artists || 'Artist',
          extra: `Album${detail ? ` | ${detail}` : ''}`,
          image,
          backgroundImage: image,
          spotlightImage: image,
          spotlightMediaImage: image,
          spotlightMediaFit: 'contain',
          spotlightMediaShape: 'poster',
          href,
          isMusicAlbum: true
        };
      }).filter((item) => !!item && String(item?.itemId || '').trim());

      const dedupeMusicTrackRows = (rows = []) => {
        const seenIds = new Set();
        const seenTrackKeys = new Set();
        const deduped = [];
        rows.forEach((row) => {
          const id = String(row?.id || '').trim();
          const trackName = String(row?.name || '').trim().toLowerCase();
          const firstArtist = Array.isArray(row?.artists) && row.artists.length
            ? String(row.artists[0] || '').trim().toLowerCase()
            : '';
          const trackKey = `${trackName}::${firstArtist}`;
          if (!trackName || !firstArtist) return;
          if (id && seenIds.has(id)) return;
          if (seenTrackKeys.has(trackKey)) return;
          if (id) seenIds.add(id);
          seenTrackKeys.add(trackKey);
          deduped.push(row);
        });
        return deduped;
      };

      const dedupeMusicAlbumRows = (rows = []) => {
        const seenIds = new Set();
        const seenAlbumKeys = new Set();
        const deduped = [];
        rows.forEach((row) => {
          const id = String(row?.id || '').trim();
          const albumName = String(row?.name || '').trim().toLowerCase();
          const firstArtist = Array.isArray(row?.artists) && row.artists.length
            ? String(row.artists[0] || '').trim().toLowerCase()
            : '';
          const albumKey = `${albumName}::${firstArtist}`;
          if (!albumName || !firstArtist) return;
          if (id && seenIds.has(id)) return;
          if (seenAlbumKeys.has(albumKey)) return;
          if (id) seenIds.add(id);
          seenAlbumKeys.add(albumKey);
          deduped.push(row);
        });
        return deduped;
      };

      const mixMusicItems = (trackItems = [], albumItems = [], takeCount = targetCount) => {
        const trackQueue = [...(Array.isArray(trackItems) ? trackItems : [])];
        const albumQueue = [...(Array.isArray(albumItems) ? albumItems : [])];
        const mixed = [];
        while (mixed.length < takeCount && (trackQueue.length || albumQueue.length)) {
          if (albumQueue.length) mixed.push(albumQueue.shift());
          if (trackQueue.length && mixed.length < takeCount) mixed.push(trackQueue.shift());
          if (albumQueue.length && mixed.length < takeCount) mixed.push(albumQueue.shift());
        }
        while (mixed.length < takeCount && trackQueue.length) mixed.push(trackQueue.shift());
        while (mixed.length < takeCount && albumQueue.length) mixed.push(albumQueue.shift());
        return mixed.slice(0, takeCount);
      };

      const buildMixedMusicItems = (trackRows = [], albumRows = [], takeCount = targetCount) => {
        const dedupedTracks = dedupeMusicTrackRows(trackRows);
        const dedupedAlbums = dedupeMusicAlbumRows(albumRows);
        const tracksWithArtwork = dedupedTracks.filter((track) => String(track?.image || '').trim());
        const albumsWithArtwork = dedupedAlbums.filter((album) => String(album?.image || '').trim());
        const trackPool = tracksWithArtwork.length ? tracksWithArtwork : dedupedTracks;
        const albumPool = albumsWithArtwork.length ? albumsWithArtwork : dedupedAlbums;
        const selectedTracks = shuffleArray(trackPool).slice(0, Math.max(takeCount, 16));
        const selectedAlbums = shuffleArray(albumPool).slice(0, Math.max(takeCount * 2, 24));
        const mappedTracks = mapTracksToHomeItems(selectedTracks);
        const mappedAlbums = mapAlbumsToHomeItems(selectedAlbums);
        const mixed = mixMusicItems(mappedTracks, mappedAlbums, takeCount);
        return dedupeHomeItemsByMediaAndId(mixed).slice(0, takeCount);
      };
      const hasAlbumItems = (items = []) => (Array.isArray(items) ? items : [])
        .some((item) => item?.isMusicAlbum === true || String(item?.itemId || '').startsWith('album:'));
      const hasTrackItems = (items = []) => (Array.isArray(items) ? items : [])
        .some((item) => item && !item?.isMusicAlbum && !String(item?.itemId || '').startsWith('album:'));
      const isHealthyMusicBatch = (items = []) => {
        const list = Array.isArray(items) ? items : [];
        return list.length >= HOME_MUSIC_MIN_ITEMS && hasAlbumItems(list) && hasTrackItems(list);
      };
      const collectedTrackRows = [];
      const collectedAlbumRows = [];
      const collectMusicRows = ({ tracks = [], albums = [] } = {}) => {
        if (Array.isArray(tracks) && tracks.length) collectedTrackRows.push(...tracks);
        if (Array.isArray(albums) && albums.length) collectedAlbumRows.push(...albums);
      };
      const getCollectedTrackRows = () => dedupeMusicTrackRows(collectedTrackRows);
      const getCollectedAlbumRows = () => dedupeMusicAlbumRows(collectedAlbumRows);

      const top50Limit = lightweightMode ? Math.max(targetCount * 3, 28) : Math.max(targetCount * 4, 64);
      const newReleaseLimit = lightweightMode ? Math.max(targetCount * 2, 18) : Math.max(targetCount * 3, 36);
      const musicFetchOptions = { signal, timeoutMs: 3600, retries: 1 };
      const [top50Res, topAlbumsRes, topReleaseAlbumsRes] = await Promise.allSettled([
        fetchJsonWithPerfCache(
          `/api/music/top-50?limit=${top50Limit}&market=${market}`,
          { ...musicFetchOptions, cacheKey: `music:top-50:${top50Limit}:${market}` }
        ),
        fetchJsonWithPerfCache(
          `/api/music/popular-albums?limit=${newReleaseLimit}&market=${market}&album_types=album`,
          { ...musicFetchOptions, cacheKey: `music:popular-albums:${newReleaseLimit}:${market}:album` }
        ),
        fetchJsonWithPerfCache(
          `/api/music/new-releases?limit=${newReleaseLimit}&market=${market}&album_types=album`,
          { ...musicFetchOptions, cacheKey: `music:new-releases:${newReleaseLimit}:${market}:album` }
        )
      ]);
      const top50Rows = top50Res.status === 'fulfilled' && Array.isArray(top50Res.value?.results) ? top50Res.value.results : [];
      const topAlbumRows = [
        ...(topAlbumsRes.status === 'fulfilled' && Array.isArray(topAlbumsRes.value?.results) ? topAlbumsRes.value.results : []),
        ...(topReleaseAlbumsRes.status === 'fulfilled' && Array.isArray(topReleaseAlbumsRes.value?.results) ? topReleaseAlbumsRes.value.results : [])
      ];
      collectMusicRows({ tracks: top50Rows, albums: topAlbumRows });
      const topBatch = filterHomeSafeItems(buildMixedMusicItems(top50Rows, topAlbumRows, targetCount));
      if (isHealthyMusicBatch(topBatch)) return topBatch;
      if (lightweightMode && topBatch.length >= Math.min(6, HOME_MUSIC_MIN_ITEMS)) return topBatch;

      const [popularRes, popularAlbumsRes, popularReleaseAlbumsRes] = await Promise.allSettled([
        fetchJsonWithPerfCache(
          `/api/music/popular?limit=50&market=${market}`,
          { ...musicFetchOptions, cacheKey: `music:popular:50:${market}` }
        ),
        fetchJsonWithPerfCache(
          `/api/music/popular-albums?limit=36&market=${market}&album_types=album`,
          { ...musicFetchOptions, cacheKey: `music:popular-albums:36:${market}:album` }
        ),
        fetchJsonWithPerfCache(
          `/api/music/new-releases?limit=24&market=${market}&album_types=album`,
          { ...musicFetchOptions, cacheKey: `music:new-releases:24:${market}:album` }
        )
      ]);
      const popularRows = popularRes.status === 'fulfilled' && Array.isArray(popularRes.value?.results) ? popularRes.value.results : [];
      const popularAlbumRows = [
        ...(popularAlbumsRes.status === 'fulfilled' && Array.isArray(popularAlbumsRes.value?.results)
          ? popularAlbumsRes.value.results
          : []),
        ...(popularReleaseAlbumsRes.status === 'fulfilled' && Array.isArray(popularReleaseAlbumsRes.value?.results)
          ? popularReleaseAlbumsRes.value.results
          : [])
      ];
      collectMusicRows({ tracks: popularRows, albums: popularAlbumRows });
      const popularBatch = filterHomeSafeItems(buildMixedMusicItems(popularRows, popularAlbumRows, targetCount));
      if (isHealthyMusicBatch(popularBatch)) return popularBatch;
      if (lightweightMode && popularBatch.length >= Math.min(6, HOME_MUSIC_MIN_ITEMS)) return popularBatch;

      if (lightweightMode) {
        const bestEffortLightBatch = filterHomeSafeItems(
          buildMixedMusicItems(
            getCollectedTrackRows(),
            getCollectedAlbumRows(),
            Math.max(targetCount, HOME_MUSIC_MIN_ITEMS)
          )
        );
        return bestEffortLightBatch.slice(0, targetCount);
      }

      const searchFallbackTerms = ['top albums and songs', 'new music albums and songs'];
      for (const term of searchFallbackTerms) {
        try {
          const fallbackSearch = await fetchJsonWithPerfCache(
            `/api/music/search?q=${encodeURIComponent(term)}&limit=40&market=${market}&type=track,album&album_types=album`,
            { ...musicFetchOptions, cacheKey: `music:search-fallback:${market}:${term}` }
          );
          const fallbackTracks = Array.isArray(fallbackSearch?.tracks) ? fallbackSearch.tracks : [];
          const fallbackAlbums = Array.isArray(fallbackSearch?.albums) ? fallbackSearch.albums : [];
          collectMusicRows({ tracks: fallbackTracks, albums: fallbackAlbums });
          const searchBatch = filterHomeSafeItems(buildMixedMusicItems(fallbackTracks, fallbackAlbums, targetCount));
          if (isHealthyMusicBatch(searchBatch)) return searchBatch;
        } catch (_err) {}
      }

      const minimumTrackRows = Math.max(4, Math.ceil(HOME_MUSIC_MIN_ITEMS / 2));
      const minimumAlbumRows = Math.max(4, Math.ceil(HOME_MUSIC_MIN_ITEMS / 2));
      if (getCollectedAlbumRows().length < minimumAlbumRows) {
        try {
          const albumSearch = await fetchJsonWithPerfCache(
            `/api/music/search?q=${encodeURIComponent('top albums')}&limit=48&market=${market}&type=album&album_types=album`,
            { ...musicFetchOptions, cacheKey: `music:album-search-backfill:${market}` }
          );
          collectMusicRows({ albums: Array.isArray(albumSearch?.albums) ? albumSearch.albums : [] });
        } catch (_err) {}
      }
      if (getCollectedTrackRows().length < minimumTrackRows) {
        try {
          const trackSearch = await fetchJsonWithPerfCache(
            `/api/music/search?q=${encodeURIComponent('top songs')}&limit=48&market=${market}&type=track`,
            { ...musicFetchOptions, cacheKey: `music:track-search-backfill:${market}` }
          );
          collectMusicRows({ tracks: Array.isArray(trackSearch?.tracks) ? trackSearch.tracks : [] });
        } catch (_err) {}
      }

      const bestEffortBatch = filterHomeSafeItems(
        buildMixedMusicItems(
          getCollectedTrackRows(),
          getCollectedAlbumRows(),
          Math.max(targetCount, HOME_MUSIC_MIN_ITEMS)
        )
      );
      if (bestEffortBatch.length) {
        const mixedEnough = hasAlbumItems(bestEffortBatch) && hasTrackItems(bestEffortBatch);
        if (isHealthyMusicBatch(bestEffortBatch) || (mixedEnough && bestEffortBatch.length >= Math.min(6, HOME_MUSIC_MIN_ITEMS))) {
          return bestEffortBatch;
        }
      }

      return [];
    }

    function normalizeTravelSearchText(value) {
      return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/\s+\(country\)\s*$/i, '')
        .replace(/[^a-z0-9 ]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    function pickHomeCountryCities(code, capital) {
      const safeCode = String(code || '').trim().toUpperCase();
      const seeded = Array.isArray(homeCountryCityHints[safeCode]) ? homeCountryCityHints[safeCode] : [];
      const out = [];
      const firstCapital = Array.isArray(capital)
        ? String(capital[0] || '').trim()
        : String(capital || '').trim();
      if (firstCapital) out.push(firstCapital);
      seeded.forEach((city) => {
        const clean = String(city || '').trim();
        if (!clean) return;
        if (out.some((entry) => entry.toLowerCase() === clean.toLowerCase())) return;
        out.push(clean);
      });
      return out.slice(0, 3);
    }

    function isBlockedTravelCommonsTitle(title, countryName, capital, cityHints = [], categoryText = '') {
      const raw = `${String(title || '')} ${String(categoryText || '')}`.toLowerCase();
      if (!raw) return true;
      const blocked = [
        'flag',
        'coat of arms',
        'emblem',
        'seal',
        'map of',
        'locator map',
        'location map',
        'orthographic',
        'equirectangular',
        'blank map',
        'administrative map',
        'province map',
        'political map',
        'banner',
        'painting',
        'artwork',
        'illustration',
        'drawing',
        'poster',
        'cartoon',
        'sketch',
        'render',
        'vector',
        'banknote',
        'stamp',
        'mural',
        'logo',
        'watercolor',
        'etching',
        'engraving',
        'lithograph',
        'oil on canvas'
      ];
      if (blocked.some((token) => raw.includes(token))) return true;
      const countryNeedle = normalizeTravelSearchText(countryName);
      const capitalNeedle = normalizeTravelSearchText(capital);
      const cityNeedles = (Array.isArray(cityHints) ? cityHints : [])
        .map((value) => normalizeTravelSearchText(value))
        .filter(Boolean);
      if (!countryNeedle && !capitalNeedle && !cityNeedles.length) return false;
      const normalizedTitle = normalizeTravelSearchText(title);
      const hasCountry = countryNeedle && normalizedTitle.includes(countryNeedle);
      const hasCapital = capitalNeedle && normalizedTitle.includes(capitalNeedle);
      const hasCity = cityNeedles.some((needle) => normalizedTitle.includes(needle));
      return !(hasCountry || hasCapital || hasCity);
    }

    function scoreTravelCommonsPhotoCandidate(page, kind, countryName, capital, cityHints = []) {
      const title = String(page?.title || '');
      const mime = String(page?.imageinfo?.[0]?.mime || '').toLowerCase();
      if (!isTravelCommonsPhotoMime(mime)) return -1;
      const categoryText = getTravelCommonsCategoryText(page);
      if (isBlockedTravelCommonsTitle(title, countryName, capital, cityHints, categoryText)) return -1;
      const raw = `${title} ${categoryText}`.toLowerCase();
      let score = 0;
      if (raw.includes('photographs')) score += 5;
      if (kind === 'city') {
        if (raw.includes('skyline') || raw.includes('cityscape')) score += 6;
        if (raw.includes('downtown') || raw.includes('street') || raw.includes('urban') || raw.includes('capital')) score += 4;
      } else if (kind === 'nature') {
        if (raw.includes('landscape') || raw.includes('mountain') || raw.includes('coast') || raw.includes('beach') || raw.includes('forest') || raw.includes('lake') || raw.includes('national park')) score += 6;
      } else {
        if (raw.includes('landscape') || raw.includes('panorama') || raw.includes('view') || raw.includes('scenery')) score += 5;
        if (raw.includes('skyline') || raw.includes('cityscape')) score += 2;
      }
      if (raw.includes('night')) score += kind === 'city' ? 2 : 1;
      return score;
    }

    function isTravelCommonsPhotoMime(mime) {
      const value = String(mime || '').toLowerCase().trim();
      return value === 'image/jpeg' || value === 'image/jpg' || value === 'image/webp';
    }

    function buildHomeTravelPhotoQueries(kind, name, capital, cities = []) {
      const primaryCity = String(capital || cities[0] || '').trim();
      if (kind === 'city') {
        return [
          primaryCity ? `${primaryCity} skyline` : '',
          primaryCity ? `${primaryCity} downtown` : '',
          primaryCity ? `${primaryCity} cityscape` : '',
          `${name} city skyline`,
          `${name} city center`,
          `${name} street scene`
        ].map((value) => String(value || '').trim()).filter(Boolean);
      }
      if (kind === 'nature') {
        return [
          `${name} landscape`,
          `${name} nature`,
          `${name} national park`,
          `${name} mountains`,
          `${name} coast`,
          `${name} lake`
        ].map((value) => String(value || '').trim()).filter(Boolean);
      }
      return [
        `${name} landscape`,
        `${name} travel photography`,
        `${name} scenic`,
        `${name} panorama`,
        `${name} nature`,
        `${primaryCity ? `${primaryCity} skyline` : ''}`
      ].map((value) => String(value || '').trim()).filter(Boolean);
    }

    async function fetchTravelCommonsPhotoByKind(kind, name, code, capital, cities, signal) {
      const safeCode = String(code || '').trim().toUpperCase();
      if (!safeCode) return '';
      const queries = buildHomeTravelPhotoQueries(kind, name, capital, cities);
      for (const query of queries) {
        if (signal?.aborted) break;
        const endpoint = `https://commons.wikimedia.org/w/api.php?action=query&format=json&formatversion=2&origin=*&generator=search&gsrnamespace=6&gsrlimit=20&gsrsearch=${encodeURIComponent(query)}&prop=imageinfo|categories&iiprop=url|mime&iiurlwidth=1400&cllimit=max`;
        try {
          const payload = await fetchJsonWithPerfCache(endpoint, {
            signal,
            cacheKey: `commons:travel:home:${safeCode}:${kind}:${query.toLowerCase()}`,
            ttlMs: 1000 * 60 * 60 * 24 * 7,
            timeoutMs: 7600,
            retries: 1
          });
          const pages = Array.isArray(payload?.query?.pages) ? payload.query.pages : [];
          const ranked = pages
            .map((page) => ({ page, score: scoreTravelCommonsPhotoCandidate(page, kind, name, capital, cities) }))
            .filter((entry) => entry.score >= 0)
            .sort((left, right) => right.score - left.score);
          const preferred = ranked[0]?.page || null;
          const image = toHttpsUrl(preferred?.imageinfo?.[0]?.thumburl || preferred?.imageinfo?.[0]?.url || '');
          if (isUsableHomeTravelScenicUrl(image)) return image;
        } catch (_error) {
          // continue with next query
        }
      }
      return '';
    }

    async function fetchTravelCommonsPhoto(name, code, capital, cities, signal) {
      const safeCode = String(code || '').trim().toUpperCase();
      if (!safeCode) return '';
      const cached = getHomeTravelPhotoSet(safeCode);
      if (cached.scenic) return cached.scenic;
      const scenic = await fetchTravelCommonsPhotoByKind('scenic', name, safeCode, capital, cities, signal);
      if (scenic) setHomeTravelPhotoCache(safeCode, scenic, 'scenic');
      return scenic;
    }

    async function fetchTravelCommonsPhotos(rows = [], signal, opts = {}) {
      const list = Array.isArray(rows) ? rows : [];
      const includeLifestyle = !!opts.includeLifestyle && !isHomeSlowNetwork();
      const unresolved = list.filter((row) => {
        const rawCode = String(row?.cca2 || row?.cca3 || '').trim().toUpperCase();
        if (rawCode === 'IL') return false;
        const code = canonicalTravelCountryCode(rawCode);
        const name = String(row?.name?.common || row?.name?.official || '').trim();
        if (/\bisrael\b/i.test(name)) return false;
        const cached = getHomeTravelPhotoSet(code);
        if (!code || !name) return false;
        if (!cached.scenic) return true;
        if (includeLifestyle && (!cached.city || !cached.nature)) return true;
        return false;
      });
      if (!unresolved.length) return homeTravelPhotoCache;

      const queue = unresolved.slice(0, 100);
      const workerCount = Math.min(includeLifestyle ? 4 : 6, queue.length);
      let cursor = 0;
      const workers = Array.from({ length: workerCount }, async () => {
        while (cursor < queue.length) {
          const index = cursor;
          cursor += 1;
          const row = queue[index];
          if (!row || signal?.aborted) return;
          const rawCode = String(row?.cca2 || row?.cca3 || '').trim().toUpperCase();
          if (rawCode === 'IL') continue;
          const code = canonicalTravelCountryCode(rawCode);
          const name = String(row?.name?.common || row?.name?.official || '').trim();
          if (/\bisrael\b/i.test(name)) continue;
          const capital = Array.isArray(row?.capital)
            ? String(row.capital[0] || '').trim()
            : String(row?.capital || '').trim();
          if (!code || !name) continue;
          const cities = pickHomeCountryCities(code, capital);
          const cached = getHomeTravelPhotoSet(code);
          if (!cached.scenic) {
            const scenic = await fetchTravelCommonsPhoto(name, code, capital, cities, signal);
            if (scenic) setHomeTravelPhotoCache(code, scenic, 'scenic');
          }
          if (includeLifestyle) {
            const nextCached = getHomeTravelPhotoSet(code);
            if (!nextCached.city) {
              const cityPhoto = await fetchTravelCommonsPhotoByKind('city', name, code, capital, cities, signal);
              if (cityPhoto) setHomeTravelPhotoCache(code, cityPhoto, 'city');
            }
            const afterCity = getHomeTravelPhotoSet(code);
            if (!afterCity.nature) {
              const naturePhoto = await fetchTravelCommonsPhotoByKind('nature', name, code, capital, cities, signal);
              if (naturePhoto) setHomeTravelPhotoCache(code, naturePhoto, 'nature');
            }
          }
        }
      });
      await Promise.all(workers);

      return homeTravelPhotoCache;
    }

    function mapTravelCountryToHomeItem(row, photoMap = null) {
      const rawCode = String(row?.cca2 || row?.cca3 || '').trim().toUpperCase();
      if (!rawCode || rawCode === 'IL') return null;
      const code = canonicalTravelCountryCode(rawCode);
      const baseTitle = String(row?.name?.common || row?.name?.official || '').trim();
      if (/\bisrael\b/i.test(baseTitle)) return null;
      const resolvedBaseTitle = code === 'PS' ? 'Palestine' : baseTitle;
      const title = formatTravelTitleWithFlag(resolvedBaseTitle, code);
      if (!code || !title) return null;
      const capital = Array.isArray(row?.capital)
        ? String(row.capital[0] || '').trim()
        : String(row?.capital || '').trim();
      const region = String(row?.region || '').trim();
      const subregion = String(row?.subregion || '').trim();
      const cities = pickHomeCountryCities(code, capital);
      const flagImage = toHttpsUrl(String(row?.flags?.png || row?.flags?.svg || '').trim())
        || getHomeCountryFlagByCode(code)
        || getHomeCountryFlag(title)
        || '';
      const subtitle = [
        capital ? `Capital: ${capital}` : '',
        region
      ].filter(Boolean).join(' | ') || 'Country';
      const extraParts = [];
      if (subregion && subregion !== region) extraParts.push(subregion);
      if (cities.length) extraParts.push(`Cities: ${cities.join(', ')}`);
      const photoFromCommons = photoMap instanceof Map ? normalizeHomeTravelPhotoEntry(photoMap.get(code)) : { scenic: '', city: '', nature: '' };
      if (photoFromCommons.scenic) setHomeTravelPhotoCache(code, photoFromCommons.scenic, 'scenic');
      if (photoFromCommons.city) setHomeTravelPhotoCache(code, photoFromCommons.city, 'city');
      if (photoFromCommons.nature) setHomeTravelPhotoCache(code, photoFromCommons.nature, 'nature');
      const photoImageRaw = getSafeTravelScenicImage(resolvedBaseTitle, code, photoFromCommons.scenic || '');
      const scenicImage = isUsableHomeTravelScenicUrl(photoImageRaw) ? photoImageRaw : '';
      const safeFallback = isUsableHomeTravelScenicUrl(HOME_TRAVEL_FALLBACK_IMAGE) ? HOME_TRAVEL_FALLBACK_IMAGE : '';
      const heroImage = scenicImage || safeFallback;
      if (!heroImage) return null;
      const cachedSet = getHomeTravelPhotoSet(code);
      return {
        mediaType: 'travel',
        itemId: code,
        title,
        subtitle,
        extra: extraParts.join(' | ') || 'Travel',
        cities,
        flagImage,
        listImage: heroImage,
        image: heroImage,
        backgroundImage: heroImage || '',
        spotlightImage: heroImage || '',
        spotlightMediaImage: flagImage || heroImage,
        spotlightMediaFit: flagImage ? 'contain' : 'cover',
        spotlightMediaPosition: 'center center',
        spotlightMediaShape: 'square',
        travelPhotos: [cachedSet.city, cachedSet.nature].filter(Boolean),
        travelPhotoSet: {
          scenic: cachedSet.scenic || heroImage || '',
          city: cachedSet.city || '',
          nature: cachedSet.nature || ''
        },
        travelNeedsScenicHydration: false,
        fallbackImage: safeFallback || heroImage,
        href: `country.html?code=${encodeURIComponent(code)}`
      };
    }

    function mapCachedTravelCountryRowToHomeItem(row) {
      const code = canonicalTravelCountryCode(row?.code || row?.cca2 || row?.cca3 || '');
      const baseTitle = String(row?.name || row?.title || '').trim();
      if (!code || !baseTitle || /\bisrael\b/i.test(baseTitle)) return null;
      const resolvedBaseTitle = code === 'PS' ? 'Palestine' : baseTitle;
      const title = formatTravelTitleWithFlag(resolvedBaseTitle, code);
      const capital = String(row?.capital || '').trim();
      const region = String(row?.region || '').trim();
      const subregion = String(row?.subregion || '').trim();
      const cities = Array.isArray(row?.cities)
        ? row.cities.map((value) => String(value || '').trim()).filter(Boolean).slice(0, 3)
        : pickHomeCountryCities(code, capital);
      const flagImage = toHttpsUrl(String(row?.flag || row?.flagImage || '').trim())
        || getHomeCountryFlagByCode(code)
        || getHomeCountryFlag(title)
        || '';
      const subtitle = [
        capital ? `Capital: ${capital}` : '',
        region
      ].filter(Boolean).join(' | ') || 'Country';
      const extraParts = [];
      if (subregion && subregion !== region) extraParts.push(subregion);
      if (cities.length) extraParts.push(`Cities: ${cities.join(', ')}`);
      const scenicRaw = getSafeTravelScenicImage(resolvedBaseTitle, code, row?.photo || row?.image || row?.backgroundImage || row?.spotlightImage || '');
      const scenicImage = isUsableHomeTravelScenicUrl(scenicRaw) ? scenicRaw : '';
      const safeFallback = isUsableHomeTravelScenicUrl(HOME_TRAVEL_FALLBACK_IMAGE) ? HOME_TRAVEL_FALLBACK_IMAGE : '';
      const heroImage = scenicImage || safeFallback;
      if (!heroImage) return null;
      if (heroImage) setHomeTravelPhotoCache(code, heroImage, 'scenic');
      if (row?.photoCity) setHomeTravelPhotoCache(code, row.photoCity, 'city');
      if (row?.photoNature) setHomeTravelPhotoCache(code, row.photoNature, 'nature');
      const cachedSet = getHomeTravelPhotoSet(code);
      return {
        mediaType: 'travel',
        itemId: code,
        title,
        subtitle,
        extra: extraParts.join(' | ') || 'Travel',
        cities,
        flagImage,
        listImage: heroImage,
        image: heroImage,
        backgroundImage: heroImage || '',
        spotlightImage: heroImage || '',
        spotlightMediaImage: flagImage || heroImage,
        spotlightMediaFit: flagImage ? 'contain' : 'cover',
        spotlightMediaPosition: 'center center',
        spotlightMediaShape: 'square',
        travelPhotos: [cachedSet.city, cachedSet.nature].filter(Boolean),
        travelPhotoSet: {
          scenic: cachedSet.scenic || heroImage || '',
          city: cachedSet.city || '',
          nature: cachedSet.nature || ''
        },
        travelNeedsScenicHydration: false,
        fallbackImage: safeFallback || heroImage,
        href: `country.html?code=${encodeURIComponent(code)}`
      };
    }

    function getCachedHomeTravelItems(limit = getHomeChannelTargetItems()) {
      const rows = readHomeTravelCountryRowsCache();
      if (!rows.length) return [];
      const seenCodes = new Set();
      const items = [];
      rows.forEach((row) => {
        const item = mapCachedTravelCountryRowToHomeItem(row);
        const code = String(item?.itemId || '').trim().toUpperCase();
        if (!item || !code || seenCodes.has(code)) return;
        seenCodes.add(code);
        items.push(item);
      });
      return shuffleArray(items).slice(0, Math.max(1, Number(limit || getHomeChannelTargetItems())));
    }

    async function loadTravel(signal) {
      const targetCount = Math.max(1, Number(getHomeChannelTargetItems() || 16));
      await withTimeout(hydrateHomeTravelBucketManifest(signal), 1400, false).catch(() => false);
      const cachedRowItems = getCachedHomeTravelItems(targetCount);
      const cachedHomeItems = readHomeItemsCache(
        HOME_TRAVEL_ITEMS_CACHE_KEY,
        HOME_TRAVEL_ITEMS_CACHE_MAX_AGE_MS,
        sanitizeHomeTravelItem
      );

      if (cachedHomeItems.length) {
        return cachedHomeItems.slice(0, targetCount);
      }

      if (cachedRowItems.length) {
        return cachedRowItems.slice(0, targetCount);
      }

      try {
        const payload = await fetchJsonWithPerfCache(REST_COUNTRIES_ALL_URL, {
          signal,
          cacheKey: 'restcountries:all:v3.1:home',
          ttlMs: 1000 * 60 * 60 * 12,
          timeoutMs: 9500,
          retries: 1
        });
        if (signal?.aborted) return [];
        const rows = Array.isArray(payload) ? payload : [];
        if (!rows.length) return getHomeTravelFallbackItems(targetCount);
        primeHomeCountryIndex(rows);

        const sortedRows = rows
          .filter((row) => {
            if (!row || !(row.cca2 || row.cca3) || !(row?.name?.common || row?.name?.official)) return false;
            const code = String(row?.cca2 || row?.cca3 || '').trim().toUpperCase();
            const name = String(row?.name?.common || row?.name?.official || '').trim();
            if (code === 'IL') return false;
            if (/\bisrael\b/i.test(name)) return false;
            return true;
          })
          .sort((a, b) => {
            const left = String(a?.name?.common || a?.name?.official || '').trim();
            const right = String(b?.name?.common || b?.name?.official || '').trim();
            return left.localeCompare(right);
          });

        const shortlist = shuffleArray(sortedRows.slice(0, Math.max(targetCount * 5, 120)));
        const collectTravelItems = (photoMap) => {
          const seenCodes = new Set();
          const out = [];
          const pushRow = (row) => {
            const item = mapTravelCountryToHomeItem(row, photoMap);
            if (!item) return;
            const code = String(item.itemId || '').trim().toUpperCase();
            if (!code || seenCodes.has(code)) return;
            seenCodes.add(code);
            out.push(item);
          };
          shortlist.forEach(pushRow);
          if (out.length < targetCount) sortedRows.forEach(pushRow);
          return out;
        };

        const cachedCandidates = collectTravelItems(homeTravelPhotoCache).slice(0, targetCount);
        if (cachedCandidates.length >= Math.min(targetCount, 6)) {
          writeHomeItemsCache(HOME_TRAVEL_ITEMS_CACHE_KEY, cachedCandidates);
          const photoCandidates = sortedRows.slice(0, Math.max(targetCount * 3, 60));
          if (!homeTravelHydrationPromise) {
            homeTravelHydrationPromise = (async () => {
              const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
              const timer = setTimeout(() => controller?.abort(), 12000);
              try {
                const photoMap = await fetchTravelCommonsPhotos(
                  photoCandidates,
                  controller?.signal,
                  { includeLifestyle: !isHomeSlowNetwork() }
                );
                const hydrated = collectTravelItems(photoMap).slice(0, targetCount);
                if (hydrated.length) {
                  writeHomeItemsCache(HOME_TRAVEL_ITEMS_CACHE_KEY, hydrated);
                  homeFeedState.travel = hydrated;
                  renderOrDeferHomeRail('travelRail', hydrated, { mediaType: 'travel' });
                  const scoredPool = buildScoredDiscoveryPool(homeFeedState);
                  const unified = buildUnifiedFeed(scoredPool, getHomeUnifiedTargetItems());
                  renderOrDeferHomeRail('unifiedRail', unified, { mediaType: 'mixed', uniformMedia: true, restaurantComposite: true });
                  hydrateSpotlightFromPool(scoredPool);
                }
              } finally {
                clearTimeout(timer);
                homeTravelHydrationPromise = null;
              }
            })();
          }
          return cachedCandidates;
        }

        const photoCandidates = sortedRows.slice(0, Math.max(targetCount * 3, 60));
        const photoMap = await withTimeout(
          fetchTravelCommonsPhotos(
            photoCandidates,
            signal,
            { includeLifestyle: !isHomeSlowNetwork() }
          ),
          isHomeSlowNetwork() ? 2200 : 3600,
          homeTravelPhotoCache
        ).catch(() => homeTravelPhotoCache);

        const hydrated = collectTravelItems(photoMap).slice(0, targetCount);
        if (hydrated.length) {
          writeHomeItemsCache(HOME_TRAVEL_ITEMS_CACHE_KEY, hydrated);
          return hydrated;
        }
        if (cachedCandidates.length) {
          writeHomeItemsCache(HOME_TRAVEL_ITEMS_CACHE_KEY, cachedCandidates);
          return cachedCandidates;
        }
        if (cachedRowItems.length) return cachedRowItems;
      } catch (_err) {}

      return cachedRowItems.length ? cachedRowItems : getHomeTravelFallbackItems(targetCount);
    }

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

    function getHomeSportEmoji(sportRaw = '') {
      const sport = String(sportRaw || '').trim().toLowerCase();
      if (!sport) return '';
      if (sport.includes('soccer')) return '\u26BD';
      if (sport.includes('american football')) return '\u{1F3C8}';
      if (sport.includes('football')) return '\u26BD';
      if (sport.includes('basketball')) return '\u{1F3C0}';
      if (sport.includes('baseball')) return '\u26BE';
      if (sport.includes('ice hockey') || sport.includes('hockey')) return '\u{1F3D2}';
      if (sport.includes('cricket')) return '\u{1F3CF}';
      if (sport.includes('rugby')) return '\u{1F3C9}';
      if (sport.includes('golf')) return '\u26F3';
      if (sport.includes('tennis')) return '\u{1F3BE}';
      if (sport.includes('volleyball')) return '\u{1F3D0}';
      if (sport.includes('handball')) return '\u{1F93E}';
      if (sport.includes('boxing')) return '\u{1F94A}';
      if (sport.includes('mma') || sport.includes('mixed martial')) return '\u{1F94B}';
      if (sport.includes('motorsport') || sport.includes('racing')) return '\u{1F3CE}\uFE0F';
      if (sport.includes('cycling')) return '\u{1F6B4}';
      if (sport.includes('snooker') || sport.includes('billiard')) return '\u{1F3B1}';
      if (sport.includes('darts')) return '\u{1F3AF}';
      if (sport.includes('table tennis') || sport.includes('ping pong')) return '\u{1F3D3}';
      return '\u{1F3DF}\uFE0F';
    }

    const HOME_SPORTS_ASSET_BUCKET_NAME = 'sports-assets';
    const HOME_SPORTS_ASSET_MANIFEST_URL = `${SUPABASE_URL}/storage/v1/object/public/${HOME_SPORTS_ASSET_BUCKET_NAME}/manifest/sports-assets.json`;
    const HOME_SPORTS_ASSET_MANIFEST_CACHE_KEY = 'zo2y_home_sports_asset_manifest_v3';
    const HOME_SPORTS_ASSET_MANIFEST_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const HOME_SPORTS_ITEMS_CACHE_KEY = 'zo2y_home_sports_items_v6';
    const HOME_SPORTS_ITEMS_CACHE_MAX_AGE_MS = 1000 * 60 * 60 * 6;
    let homeSportsAssetManifestPromise = null;
    const homeSportsAssetManifestRows = [];
    const homeSportsAssetManifestById = new Map();
    const homeSportsAssetManifestByName = new Map();

    function normalizeHomeSportsAssetManifestRows(payload) {
      const rows = Array.isArray(payload?.teams) ? payload.teams : (Array.isArray(payload) ? payload : []);
      return rows.map((row) => {
        if (!row || typeof row !== 'object') return null;
        const id = String(row.id || row.sportsDbId || '').trim();
        const name = String(row.name || row.title || '').trim();
        if (!id && !name) return null;
        return {
          id: id || name,
          sportsDbId: id || '',
          name,
          league: String(row.league || '').trim(),
          sport: String(row.sport || '').trim(),
          country: String(row.country || '').trim(),
          stadium: String(row.stadium || '').trim(),
          badge: toHttpsUrl(row.badge || row.logo_url || ''),
          banner: '',
          fanart: '',
          stadiumImage: '',
          jersey: ''
        };
      }).filter(Boolean);
    }

    function mergeHomeSportsAssetManifestRows(rows = []) {
      (Array.isArray(rows) ? rows : []).forEach((row) => {
        const id = String(row?.sportsDbId || row?.id || '').trim();
        const nameKey = normalizeHomeSportsName(row?.name || '');
        const existing = (id && homeSportsAssetManifestById.get(id)) || (nameKey && homeSportsAssetManifestByName.get(nameKey)) || null;
        const merged = existing ? {
          ...existing,
          ...row,
          badge: row.badge || existing.badge || '',
          banner: '',
          fanart: '',
          stadiumImage: '',
          jersey: ''
        } : row;
        if (!existing) {
          homeSportsAssetManifestRows.push(merged);
        } else {
          const index = homeSportsAssetManifestRows.indexOf(existing);
          if (index >= 0) homeSportsAssetManifestRows[index] = merged;
        }
        if (id) homeSportsAssetManifestById.set(id, merged);
        if (nameKey) homeSportsAssetManifestByName.set(nameKey, merged);
      });
    }

    function readHomeSportsAssetManifestCache() {
      try {
        const raw = localStorage.getItem(HOME_SPORTS_ASSET_MANIFEST_CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        const savedAt = Number(parsed?.savedAt || 0);
        if (!savedAt || (Date.now() - savedAt) > HOME_SPORTS_ASSET_MANIFEST_TTL_MS) return null;
        const rows = normalizeHomeSportsAssetManifestRows(parsed);
        return rows.length ? rows : null;
      } catch (_err) {
        return null;
      }
    }

    function writeHomeSportsAssetManifestCache(rows = []) {
      try {
        localStorage.setItem(HOME_SPORTS_ASSET_MANIFEST_CACHE_KEY, JSON.stringify({
          savedAt: Date.now(),
          teams: rows
        }));
      } catch (_err) {}
    }

    function loadHomeSportsAssetManifestFromStorage() {
      const rows = readHomeSportsAssetManifestCache();
      if (!rows) return [];
      mergeHomeSportsAssetManifestRows(rows);
      return homeSportsAssetManifestRows.slice();
    }

    async function ensureHomeSportsAssetManifest(signal) {
      if (homeSportsAssetManifestRows.length) return homeSportsAssetManifestRows.slice();
      loadHomeSportsAssetManifestFromStorage();
      if (homeSportsAssetManifestRows.length) return homeSportsAssetManifestRows.slice();
      if (homeSportsAssetManifestPromise) return homeSportsAssetManifestPromise;
      homeSportsAssetManifestPromise = (async () => {
        try {
          const response = await fetch(HOME_SPORTS_ASSET_MANIFEST_URL, {
            signal,
            cache: 'force-cache',
            credentials: 'omit'
          });
          if (!response.ok) throw new Error(`Manifest fetch failed (${response.status})`);
          const payload = await response.json();
          const rows = normalizeHomeSportsAssetManifestRows(payload);
          if (rows.length) {
            mergeHomeSportsAssetManifestRows(rows);
            writeHomeSportsAssetManifestCache(rows);
          }
          return homeSportsAssetManifestRows.slice();
        } catch (_err) {
          return homeSportsAssetManifestRows.slice();
        } finally {
          homeSportsAssetManifestPromise = null;
        }
      })();
      return homeSportsAssetManifestPromise;
    }

    function getHomeSportsAssetOverride(team) {
      const id = String(team?.idTeam || team?.sportsDbId || team?.id || '').trim();
      const nameKey = normalizeHomeSportsName(team?.strTeam || team?.name || '');
      return (id && homeSportsAssetManifestById.get(id)) || (nameKey && homeSportsAssetManifestByName.get(nameKey)) || null;
    }

    function mapSportsTeamToHomeItem(team) {
      if (!team || typeof team !== 'object') return null;
      const override = getHomeSportsAssetOverride(team);
      const id = String(team.idTeam || override?.sportsDbId || override?.id || '').trim();
      const title = String(override?.name || team.strTeam || '').trim();
      if (!title) return null;
      const sport = String(override?.sport || team.strSport || '').trim();
      const league = String(override?.league || team.strLeague || '').trim();
      const stadium = String(override?.stadium || team.strStadium || '').trim();
      const country = String(override?.country || team.strCountry || '').trim();
      const badge = toHttpsUrl(override?.badge || team.strBadge || team.strTeamBadge || team.strTeamLogo || team.strLogo || '');
      const fallbackImage = HOME_LOCAL_FALLBACK_IMAGE || '/newlogo.webp';
      if (!badge) return null;
      const background = badge || fallbackImage;
      const image = badge;
      const subtitle = [league, sport].filter(Boolean).join(' | ') || 'Team';
      const sportIcon = getHomeSportEmoji(sport);
      const subtitleWithIcon = sportIcon ? `${sportIcon} ${subtitle}` : subtitle;
      const flagImage = getHomeCountryFlag(country);
      const spotlightMedia = badge || flagImage || background;
      const spotlightMediaFit = (badge || flagImage) ? 'contain' : 'cover';
      const params = new URLSearchParams();
      if (id) params.set('id', id);
      if (title) params.set('team', title);
      if (league) params.set('league', league);
      if (sport) params.set('sport', sport);
      if (country) params.set('country', country);
      const query = params.toString();
      const href = query ? `team.html?${query}` : 'team.html';
      return {
        mediaType: 'sports',
        itemId: id || title,
        title,
        subtitle: subtitleWithIcon,
        extra: stadium ? `Stadium: ${stadium}` : '',
        image,
        listImage: badge || flagImage || image,
        mediaFit: 'contain',
        backgroundImage: background,
        spotlightImage: background,
        spotlightMediaImage: spotlightMedia,
        spotlightMediaFit,
        spotlightMediaShape: 'square',
        sport,
        league,
        country,
        flagImage,
        stadium,
        badge,
        banner: '',
        fanart: '',
        jersey: '',
        stadiumImage: '',
        href
      };
    }

    function normalizeHomeSportsName(value) {
      return String(value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]+/g, '')
        .replace(/[\u0027\u2019]/g, '')
        .replace(/\b(fc|cf|sc|afc|club|the)\b/g, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
    }

    function isHomeSportsPriorityLeague(league) {
      const value = normalizeHomeSportsName(league);
      if (!value) return false;
      return [
        'premier league',
        'la liga',
        'serie a',
        'bundesliga',
        'ligue 1',
        'champions league',
        'major league soccer',
        'saudi pro league',
        'egyptian premier league',
        'nba',
        'nfl',
        'mlb',
        'nhl',
        'formula 1',
        'indian premier league'
      ].some((token) => value.includes(token));
    }

    function scoreHomeSportsPriority(item) {
      const title = normalizeHomeSportsName(item?.title || '');
      const league = normalizeHomeSportsName(item?.league || '');
      const sport = normalizeHomeSportsName(item?.sport || item?.subtitle || '');
      let score = 0;
      if (HOME_SPORTS_SEEDS.some((seed) => normalizeHomeSportsName(seed) === title)) score += 500;
      if (isHomeSportsPriorityLeague(league)) score += 220;
      if (sport.includes('soccer') || sport === 'football') score += 180;
      if (league.includes('premier league') || league.includes('la liga') || league.includes('serie a') || league.includes('bundesliga') || league.includes('champions league')) score += 180;
      if (league.includes('nba') || league.includes('nfl')) score += 80;
      return score;
    }

    function prioritizeHomeSportsItems(items = [], targetCount = 16) {
      const deduped = [];
      const seen = new Set();
      (Array.isArray(items) ? items : []).forEach((item) => {
        const key = [String(item?.itemId || '').trim().toLowerCase(), normalizeHomeSportsName(item?.title || '')]
          .filter(Boolean)
          .join('|');
        if (!key || seen.has(key)) return;
        seen.add(key);
        deduped.push(item);
      });
      const sorted = deduped.slice().sort((a, b) => {
        const scoreDiff = scoreHomeSportsPriority(b) - scoreHomeSportsPriority(a);
        if (scoreDiff) return scoreDiff;
        return String(a?.title || '').localeCompare(String(b?.title || ''));
      });
      return sorted.slice(0, targetCount);
    }

    async function loadSports(signal) {
      const targetCount = Math.max(1, Number(getHomeChannelTargetItems() || 16));
      loadHomeSportsAssetManifestFromStorage();
      const localManifestRows = await ensureHomeSportsAssetManifest(signal).catch(() => []);
      if (Array.isArray(localManifestRows) && localManifestRows.length) {
        const localItems = prioritizeHomeSportsItems(
          localManifestRows
            .map((row) => mapSportsTeamToHomeItem({
              idTeam: row.sportsDbId || row.id,
              strTeam: row.name,
              strSport: row.sport,
              strLeague: row.league,
              strStadium: row.stadium,
              strCountry: row.country
            }))
            .filter((item) => item && item.image),
          targetCount
        );
        if (localItems.length >= Math.min(targetCount, 8)) {
          writeHomeItemsCache(HOME_SPORTS_ITEMS_CACHE_KEY, localItems);
          return localItems;
        }
      }

      const cachedItemsRaw = readHomeItemsCache(HOME_SPORTS_ITEMS_CACHE_KEY, HOME_SPORTS_ITEMS_CACHE_MAX_AGE_MS)
        .filter((item) => item && item.image);
      if (cachedItemsRaw.length) {
        const dedupedCached = [];
        const seenCached = new Set();
        cachedItemsRaw.forEach((item) => {
          const key = String(item?.itemId || item?.title || '').toLowerCase().trim();
          const nameKey = normalizeHomeSportsName(item?.title || '');
          const dedupeKey = [key, nameKey].filter(Boolean).join('|');
          if (!dedupeKey || seenCached.has(dedupeKey)) return;
          seenCached.add(dedupeKey);
          dedupedCached.push(item);
        });
        if (dedupedCached.length) return prioritizeHomeSportsItems(dedupedCached, targetCount);
      }

      const seedTeams = [...HOME_SPORTS_SEEDS].slice(0, Math.max(targetCount, 12));
      const items = [];
      const seen = new Set();
      void ensureHomeCountryIndex(signal);

      const requests = seedTeams.map((seed) => fetchSportsDb('searchteams.php', { t: seed }, { signal, timeoutMs: 5200 }));
      const responses = await Promise.allSettled(requests);
      responses.forEach((result) => {
        if (items.length >= targetCount) return;
        if (!result || result.status !== 'fulfilled') return;
        const payload = result.value;
        const teams = Array.isArray(payload?.teams) ? payload.teams : [];
        teams.forEach((team) => {
          if (items.length >= targetCount) return;
          const item = mapSportsTeamToHomeItem(team);
          if (!item) return;
          const key = String(item.itemId || item.title || '').toLowerCase().trim();
          const nameKey = normalizeHomeSportsName(item.title || '');
          const dedupeKey = [key, nameKey].filter(Boolean).join('|');
          if (!dedupeKey || seen.has(dedupeKey)) return;
          seen.add(dedupeKey);
          items.push(item);
        });
      });

      if (items.length) {
        const prioritized = prioritizeHomeSportsItems(items, targetCount);
        writeHomeItemsCache(HOME_SPORTS_ITEMS_CACHE_KEY, prioritized);
        return prioritized;
      }

      return [];
    }

    // HOME BOOKS (override): keep this loader in lockstep with `books.html`.
    // We intentionally redeclare `loadBooks` here so it wins over any older/broken implementation above.
    async function loadBooks(signal) {
      const targetCount = getHomeChannelTargetItems();
      const BOOKS_PER_PAGE = Math.max(20, targetCount);
      const minHealthy = Math.min(Number(targetCount || 0) || 0, 8) || 8;

      const setBooksDebug = (stage, detail = {}) => {
        try {
          window.__zo2yHomeBooksDebug = {
            stage: String(stage || '').trim() || 'unknown',
            detail: detail && typeof detail === 'object' ? detail : {},
            at: new Date().toISOString()
          };
        } catch (_error) {}
      };

      const BOOKS_CACHE_BUSTER = '20260325a';
      const GOOGLE_BOOKS_PROXY_BASE = '/api/books';
      const FALLBACK_BOOK_IMAGE = '/images/landing-wall-poster.svg';

      function normalizeBookSeedText(value) {
        return String(value || '')
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      }

      function slugifyBookPart(value) {
        return String(value || '')
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .slice(0, 64);
      }

      function getBookEntryId(item, idx = 0) {
        const id = String(item?.id || '').trim();
        if (id) return id;
        const titleSlug = slugifyBookPart(item?.title || `book-${idx}`);
        const authorSlug = slugifyBookPart(item?.author || '');
        const year = String(item?.year || '').trim();
        return `search-${titleSlug}-${authorSlug || 'unknown'}-${year || 'na'}`;
      }

      async function booksFetch(path, params = {}) {
        const normalizedPath = String(path || '').startsWith('/') ? String(path) : `/${String(path || '')}`;
        const endpoint = normalizedPath === '/search.json'
          ? `${GOOGLE_BOOKS_PROXY_BASE}/search`
          : `${GOOGLE_BOOKS_PROXY_BASE}${normalizedPath}`;
        const url = new URL(endpoint, window.location.origin);
        Object.entries(params || {}).forEach(([key, value]) => {
          if (value === undefined || value === null || value === '') return;
          if (Array.isArray(value)) {
            value.forEach((entry) => {
              if (entry === undefined || entry === null || entry === '') return;
              url.searchParams.append(key, String(entry));
            });
            return;
          }
          url.searchParams.set(key, String(value));
        });
        url.searchParams.set('cb', BOOKS_CACHE_BUSTER);
        // Match the older "auth works" snapshot: always hit the network for books/search/pagination.
        // This avoids persisting empty arrays into local caches when the network hiccups.
        url.searchParams.set('_', String(Date.now()));

        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), 12000);
        let res;
        try {
          try {
            res = await fetch(url.toString(), {
              headers: { Accept: 'application/json' },
              signal: signal || controller.signal,
              cache: 'no-store'
            });
          } catch (error) {
            const isAbort = error && (error.name === 'AbortError' || String(error?.message || '').toLowerCase().includes('aborted'));
            if (!isAbort) throw error;
            res = await fetch(url.toString(), {
              headers: { Accept: 'application/json' },
              cache: 'no-store'
            });
          }
        } finally {
          window.clearTimeout(timeoutId);
        }

        if (!res.ok) throw new Error(`Books API error ${res.status}`);
        const json = await res.json();
        const booksRaw = Array.isArray(json?.books) ? json.books : [];
        const books = booksRaw
          .map((entry) => ({
            id: String(entry?.id || '').trim(),
            title: String(entry?.title || '').trim(),
            author: String(entry?.author || '').trim(),
            year: Number(entry?.year || 0) || null,
            cover: toHttpsUrl(entry?.cover || ''),
            source: String(entry?.source || '').trim()
          }))
          .filter((entry) => entry.title);
        const numFound = Number(json?.meta?.numFound || json?.numFound || json?.count || json?.totalItems || books.length) || books.length;
        return { books, numFound };
      }

      async function fetchPopularBooks(page = 1, limit = BOOKS_PER_PAGE) {
        return booksFetch('/popular', {
          page,
          limit,
          subject: 'fiction',
          language: 'en',
          orderBy: 'relevance'
        });
      }

      async function fetchTrendingBooks(limit = BOOKS_PER_PAGE) {
        return booksFetch('/trending', {
          period: 'weekly',
          limit
        });
      }

      function scoreCuratedTopBookDoc(doc, seed) {
        const normalizedTitle = normalizeBookSeedText(doc?.title || '');
        const normalizedAuthor = normalizeBookSeedText(doc?.author || '');
        const seedTitle = normalizeBookSeedText(seed?.title || '');
        const seedAuthor = normalizeBookSeedText(seed?.author || '');
        const seedYear = Number(seed?.year || 0) || 0;
        const docYear = Number(doc?.year || 0) || 0;
        let score = 0;
        if (normalizedTitle && seedTitle) {
          if (normalizedTitle === seedTitle) score += 120;
          else if (normalizedTitle.startsWith(seedTitle) || seedTitle.startsWith(normalizedTitle)) score += 80;
          else if (normalizedTitle.includes(seedTitle) || seedTitle.includes(normalizedTitle)) score += 48;
        }
        if (normalizedAuthor && seedAuthor) {
          if (normalizedAuthor === seedAuthor) score += 70;
          else if (normalizedAuthor.includes(seedAuthor) || seedAuthor.includes(normalizedAuthor)) score += 42;
        }
        if (String(doc?.cover || '').trim()) score += 24;
        if (docYear >= 2020) score += 16;
        if (seedYear && docYear === seedYear) score += 24;
        return score;
      }

      async function fetchSeededTopBooks(limit = BOOKS_PER_PAGE) {
        const pool = shuffleArray(CURRENT_TOP_BOOK_SEEDS).slice(0, Math.min(CURRENT_TOP_BOOK_SEEDS.length, Math.max(limit * 3, 24)));
        const results = await Promise.allSettled(pool.map(async (seed) => {
          const payload = await booksFetch('/search', Object.assign({
            title: seed.title,
            author: seed.author,
            limit: 5,
            page: 1
          }, seed?.year ? { first_publish_year: seed.year } : {}));
          const docs = Array.isArray(payload?.books) ? payload.books : [];
          if (!docs.length) return null;
          return docs.slice().sort((a, b) => scoreCuratedTopBookDoc(b, seed) - scoreCuratedTopBookDoc(a, seed))[0] || null;
        }));
        const seen = new Set();
        const docs = [];
        results.forEach((result) => {
          if (result.status !== 'fulfilled' || !result.value) return;
          const doc = result.value;
          const key = `${normalizeBookSeedText(doc?.title || '')}::${normalizeBookSeedText(doc?.author || '')}`;
          if (!key || seen.has(key)) return;
          seen.add(key);
          docs.push(doc);
        });
        return docs;
      }

      async function loadCuratedPopularBooks() {
        const [seededResult, popularResult, trendingResult] = await Promise.allSettled([
          fetchSeededTopBooks(BOOKS_PER_PAGE),
          fetchPopularBooks(1, BOOKS_PER_PAGE),
          fetchTrendingBooks(BOOKS_PER_PAGE)
        ]);
        const seededBooks = seededResult.status === 'fulfilled' && Array.isArray(seededResult.value)
          ? seededResult.value
          : [];
        const popular = popularResult.status === 'fulfilled' ? popularResult.value : null;
        const trending = trendingResult.status === 'fulfilled' ? trendingResult.value : null;
        const popularBooks = Array.isArray(popular?.books) ? popular.books.slice(0, BOOKS_PER_PAGE) : [];
        const trendingBooks = Array.isArray(trending?.books) ? trending.books.slice(0, BOOKS_PER_PAGE) : [];
        const merged = [];
        const seen = new Set();
        [...seededBooks, ...popularBooks, ...trendingBooks].forEach((book) => {
          const title = normalizeBookSeedText(book?.title || '');
          const author = normalizeBookSeedText(book?.author || '');
          const key = `${title}::${author}`;
          if (!title || seen.has(key)) return;
          seen.add(key);
          merged.push(book);
        });

        if (merged.length < BOOKS_PER_PAGE) {
          const needed = Math.max(1, BOOKS_PER_PAGE - merged.length);
          const [popularPage2, trendingPage2] = await Promise.allSettled([
            fetchPopularBooks(2, Math.max(10, needed)),
            fetchTrendingBooks(Math.max(10, needed))
          ]);
          const extraPopular = popularPage2.status === 'fulfilled' && Array.isArray(popularPage2.value?.books)
            ? popularPage2.value.books
            : [];
          const extraTrending = trendingPage2.status === 'fulfilled' && Array.isArray(trendingPage2.value?.books)
            ? trendingPage2.value.books
            : [];
          [...extraPopular, ...extraTrending].forEach((book) => {
            const title = normalizeBookSeedText(book?.title || '');
            const author = normalizeBookSeedText(book?.author || '');
            const key = `${title}::${author}`;
            if (!title || seen.has(key)) return;
            seen.add(key);
            merged.push(book);
          });
        }

        return {
          books: merged.slice(0, BOOKS_PER_PAGE),
          numFound: Math.max(seededBooks.length, Number(popular?.numFound || 0), Number(trending?.numFound || 0), merged.length, BOOKS_PER_PAGE * 2)
        };
      }

      const sanitizeHomeBookItem = (item) => {
        if (!item || String(item?.mediaType || '').trim().toLowerCase() !== 'book') return null;
        const title = String(item?.title || '').trim();
        const itemId = String(item?.itemId || '').trim();
        const image = toHttpsUrl(String(item?.image || item?.listImage || item?.spotlightImage || '').trim());
        if (!title || !itemId || !image) return null;
        return {
          ...item,
          mediaType: 'book',
          itemId,
          title,
          subtitle: String(item?.subtitle || '').trim(),
          image,
          listImage: image,
          backgroundImage: toHttpsUrl(String(item?.backgroundImage || image).trim()) || image,
          spotlightImage: toHttpsUrl(String(item?.spotlightImage || image).trim()) || image,
          spotlightMediaImage: toHttpsUrl(String(item?.spotlightMediaImage || image).trim()) || image,
          href: String(item?.href || '').trim() || 'books.html'
        };
      };

      const cachedItems = readHomeItemsCache(
        HOME_BOOKS_ITEMS_CACHE_KEY,
        HOME_BOOKS_ITEMS_CACHE_MAX_AGE_MS,
        sanitizeHomeBookItem
      );
      if (cachedItems.length) {
        setBooksDebug('cache-hit', { count: cachedItems.length });
        return shuffleArray(cachedItems).slice(0, targetCount);
      }

      try {
        setBooksDebug('fetch:start', { target: targetCount });
        const data = await loadCuratedPopularBooks();
        const books = Array.isArray(data?.books) ? data.books : [];
        const items = books.map((book, idx) => {
          const title = String(book?.title || '').trim();
          if (!title) return null;
          const author = String(book?.author || '').trim() || 'Unknown author';
          const year = Number(book?.year || 0) || 0;
          const cover = toHttpsUrl(book?.cover || '') || FALLBACK_BOOK_IMAGE;
          const itemId = getBookEntryId(book, idx);
          const titleParam = encodeURIComponent(title);
          const authorParam = encodeURIComponent(author);
          const href = `book.html?id=${encodeURIComponent(itemId)}&title=${titleParam}&author=${authorParam}`;
          return sanitizeHomeBookItem({
            mediaType: 'book',
            itemId,
            title,
            subtitle: year ? `${author} | ${year}` : author,
            image: cover,
            backgroundImage: cover,
            spotlightImage: cover,
            spotlightMediaImage: cover,
            spotlightMediaFit: 'contain',
            spotlightMediaShape: 'poster',
            fallbackImage: FALLBACK_BOOK_IMAGE,
            href
          });
        }).filter(Boolean);

        const filtered = shuffleArray(filterHomeSafeItems(items)).slice(0, targetCount);
        if (filtered.length) {
          if (filtered.length >= minHealthy) writeHomeItemsCache(HOME_BOOKS_ITEMS_CACHE_KEY, filtered);
          setBooksDebug('success', { count: filtered.length });
          return filtered;
        }

        setBooksDebug('empty', { books: books.length });
      } catch (error) {
        setBooksDebug('error', { message: String(error?.message || error || '') });
      }

      return [];
    }

  window.__zo2yHomeHeavyLoaders = {
    loadMovies,
    loadTv,
    loadAnime,
    loadBooks,
    loadMusic,
    loadTravel,
    loadSports
  };
})();
