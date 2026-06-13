/*
 * Zo2y Music Home Directory - Professional directory style loading
 * Fetches music from Spotify/Apple APIs and displays them in a professional directory format
 * Similar to a music streaming platform's directory with detailed album/track information
 */
(function () {
  'use strict';

  const FALLBACK_COVER = '/images/fallback/music.svg';
  const HOME_MUSIC_LIMIT = 24;
  const HOME_MUSIC_SECTIONS = [
    {
      id: 'top-tracks',
      label: 'Top Tracks',
      desc: 'The most streamed songs right now across all genres.',
      query: 'top 50 usa',
      limit: 12,
      type: 'track'
    },
    {
      id: 'top-albums',
      label: 'Top Albums',
      desc: 'Best-selling albums and chart-topping compilations.',
      query: 'top albums',
      limit: 12,
      type: 'album'
    },
    {
      id: 'trending-songs',
      label: 'Trending Songs',
      desc: 'What everyone is singing about this week.',
      query: 'viral hits',
      limit: 12,
      type: 'track'
    },
    {
      id: 'popular-artists',
      label: 'Popular Artists',
      desc: 'The musicians and bands everyone loves right now.',
      query: 'top artists',
      limit: 12,
      type: 'artist'
    }
  ];

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function toHttps(url) {
    if (!url) return '';
    return String(url).replace(/^http:/i, 'https:');
  }

  function getCover(item) {
    const image = item?.image || item?.artworkUrl100 || item?.artworkUrl60;
    if (!image) return FALLBACK_COVER;
    const src = toHttps(image);
    if (src.includes('artworkUrl100') || src.includes('artworkUrl60')) {
      return src.replace(/\/artworkUrl\d+\./, '/artworkUrl600x600.');
    }
    return src;
  }

  function normalizeTrack(track) {
    const artists = Array.isArray(track?.artists) ? track.artists : 
                   [track?.artistName || track?.artist_name || 'Unknown Artist'];
    const albumName = track?.collectionName || track?.album || track?.album_name || 'Unknown Album';
    const albumType = track?.kind === 'album' ? 'album' : 'single';
    const totalTracks = track?.trackCount || track?.total_tracks || 0;
    const genre = track?.genre || '';
    const releaseDate = track?.releaseDate || track?.release_date || '';
    const popularity = track?.popularity || 0;
    const source = track?.source || 'spotify';

    return {
      id: track?.id || track?.trackId || track?.collectionId || '',
      kind: track?.kind === 'album' ? 'album' : 'track',
      source,
      name: track?.trackName || track?.name || 'Unknown Track',
      subtitle: artists.join(', '),
      album: albumName,
      album_type: albumType,
      total_tracks: totalTracks,
      image: getCover(track),
      preview_url: track?.previewUrl || '',
      external_url: track?.trackViewUrl || track?.collectionViewUrl || '',
      release_date: releaseDate,
      popularity,
      genre,
      artist_id: track?.artistId || ''
    };
  }

  async function fetchMusicFromApi(query, limit, type) {
    try {
      const res = await fetch(`/api/music/search?q=${encodeURIComponent(query)}&limit=${limit}&market=US&type=${type}`);
      if (!res.ok) {
        // Try fallback to iTunes API
        return fetch(`/api/music/fallback?q=${encodeURIComponent(query)}&limit=${limit}&type=${type}`).then(res2 => res2.json()).catch(() => ({ results: [] }));
      }
      return res.json();
    } catch (_err) {
      try {
        return fetch(`/api/music/fallback?q=${encodeURIComponent(query)}&limit=${limit}&type=${type}`).then(res2 => res2.json()).catch(() => ({ results: [] }));
      } catch (_err2) {
        return { results: [] };
      }
    }
  }

  async function fetchHomeMusicSection(section) {
    let items = [];
    
    if (section.type === 'track') {
      const result = await fetchMusicFromApi(section.query, section.limit, 'track');
      items = (result.results || result.tracks || []).map(normalizeTrack);
    } else if (section.type === 'album') {
      const result = await fetchMusicFromApi(section.query, section.limit, 'album');
      items = (result.results || result.albums || []).map(item => {
        const normalized = normalizeTrack(item);
        normalized.kind = 'album';
        return normalized;
      });
    } else if (section.type === 'artist') {
      const result = await fetchMusicFromApi(section.query, section.limit, 'artist');
      items = (result.results || result.artists || []).map(item => {
        const normalized = normalizeTrack(item);
        normalized.kind = 'artist';
        normalized.name = item.name || item.artistName || 'Unknown Artist';
        normalized.subtitle = item.genre || '';
        normalized.album_type = 'artist';
        normalized.release_date = item.releaseDate || '';
        return normalized;
      });
    }

    return {
      id: section.id,
      label: section.label,
      desc: section.desc,
      items,
      type: section.type
    };
  }

  function renderTrackCard(item) {
    if (!item) return '';
    const kind = item.kind === 'album' ? 'Album' : 'Track';
    const releaseInfo = item.release_date ? `
      <div class="directory-music-release">Released: ${item.release_date}</div>
    ` : '';
    const extraInfo = item.kind === 'album' ? `
      <div class="directory-music-details">
        <span class="directory-music-meta">${item.album_type || 'Album'}</span>
        <span class="directory-music-meta">${item.total_tracks || 0} tracks</span>
        ${item.genre ? `<span class="directory-music-meta genre-pill">${item.genre}</span>` : ''}
      </div>
    ` : `
      <div class="directory-music-details">
        <span class="directory-music-meta">${kind}</span>
        <span class="directory-music-meta">${item.album || 'Unknown Album'}</span>
        ${item.genre ? `<span class="directory-music-meta genre-pill">${item.genre}</span>` : ''}
      </div>
    `;

    return `
      <article class="directory-music-card" data-id="${escapeHtml(item.id)}" data-kind="${escapeHtml(item.kind)}">
        <a href="song.html?id=${encodeURIComponent(item.id)}&source=${encodeURIComponent(item.source || 'spotify')}" class="directory-music-media">
          <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" loading="lazy" onerror="this.src='${FALLBACK_COVER}'">
        </a>
        <div class="directory-music-meta">
          <h3 class="directory-music-title" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</h3>
          <div class="directory-music-artist">${escapeHtml(item.subtitle)}</div>
          ${extraInfo}
          ${releaseInfo}
          ${item.popularity > 0 ? `
            <div class="directory-music-popularity">
              <span class="popularity-bar" style="width: ${item.popularity}%"></span>
              <span class="popularity-text">Popularity: ${item.popularity}/100</span>
            </div>
          ` : ''}
        </div>
      </article>
    `;
  }

  function renderSection(section) {
    if (!section || !section.items || !section.items.length) return '';
    const cards = section.items.map(renderTrackCard).join('');
    return `
      <section class="directory-section" data-section="${escapeHtml(section.id)}">
        <div class="directory-section-header">
          <div class="directory-section-title">
            <h2>${escapeHtml(section.label)}</h2>
            <p>${escapeHtml(section.desc)}</p>
          </div>
          <a href="music.html" class="directory-section-link">View all</a>
        </div>
        <div class="directory-music-grid">
          ${cards}
        </div>
      </section>
    `;
  }

  function renderSkeleton(count = 2) {
    let html = '';
    for (let i = 0; i < count; i++) {
      html += `
        <section class="directory-section">
          <div class="directory-section-header">
            <div class="directory-section-title">
              <div class="skeleton-line skeleton-line-lg skeleton-shimmer"></div>
              <div class="skeleton-line skeleton-line-md skeleton-shimmer"></div>
            </div>
          </div>
          <div class="directory-music-grid">
            ${Array(8).fill(0).map(() => `
              <article class="directory-music-card skeleton-card">
                <div class="directory-music-media skeleton-shimmer"></div>
                <div class="directory-music-meta">
                  <span class="skeleton-line skeleton-line-sm skeleton-shimmer"></span>
                  <span class="skeleton-line skeleton-line-md skeleton-shimmer"></span>
                  <div class="skeleton-line-group">
                    <span class="skeleton-line-xs skeleton-shimmer"></span>
                    <span class="skeleton-line-xs skeleton-shimmer"></span>
                    <span class="skeleton-line-xs skeleton-shimmer"></span>
                  </div>
                  <span class="skeleton-line skeleton-line-sm skeleton-shimmer"></span>
                </div>
              </article>
            `).join('')}
          </div>
        </section>
      `;
    }
    return html;
  }

  async function initMusicDirectory() {
    const container = document.getElementById('musicRail');
    if (!container) return;

    // Show skeleton
    container.innerHTML = renderSkeleton(HOME_MUSIC_SECTIONS.length);

    try {
      const sections = await Promise.all(
        HOME_MUSIC_SECTIONS.map(section => fetchHomeMusicSection(section))
      );
      
      // Render sections
      const sectionsHtml = sections.map(renderSection).join('');
      container.innerHTML = sectionsHtml;
      
      // Prime images
      setTimeout(() => {
        if (window.IntersectionObserver) {
          const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                const img = entry.target;
                const src = img.getAttribute('data-music-src');
                if (src) {
                  img.src = src;
                  observer.unobserve(img);
                }
              }
            });
          }, { rootMargin: '100px 0px' });

          document.querySelectorAll('.directory-music-media img').forEach(img => {
            const src = img.getAttribute('src');
            if (src.includes('/images/fallback/music.svg')) {
              const dataSrc = img.getAttribute('data-music-src') || src;
              img.setAttribute('data-music-src', dataSrc);
              img.src = '/images/placeholder-music.svg';
              observer.observe(img);
            }
          });
        }
      }, 100);

    } catch (err) {
      console.error('Failed to load music directory:', err);
      container.innerHTML = `
        <div class="directory-empty-state">
          <div class="directory-empty-icon">🎵</div>
          <h3>Music feed unavailable</h3>
          <p>Please try again shortly.</p>
        </div>
      `;
    }
  }

  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initMusicDirectory);
    } else {
      initMusicDirectory();
    }
  }

  init();

  window.Zo2yMusicDirectory = {
    init: initMusicDirectory,
    fetchSections: () => Promise.all(HOME_MUSIC_SECTIONS.map(fetchHomeMusicSection))
  };
})();