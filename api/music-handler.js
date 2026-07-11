const SPOTIFY_ACCOUNTS = "https://accounts.spotify.com/api";
const SPOTIFY_API = "https://api.spotify.com/v1";
const APPLE_RSS = "https://rss.applemarketingtools.com/api/v2/us/music";

const spotifyConfig = {
  clientId: String(process.env.SPOTIFY_CLIENT_ID || "").trim(),
  clientSecret: String(process.env.SPOTIFY_CLIENT_SECRET || "").trim()
};

let spotifyToken = null;
let spotifyTokenExpires = 0;

const ARTIST_CACHE = new Map();
const ARTIST_CACHE_TTL = 3600 * 1000;

const DEFAULT_GENRES = [
  "pop", "hip-hop", "rap", "r&b", "rock", "country",
  "latin", "indie", "k-pop", "dance", "electronic",
  "alternative", "soul", "jazz", "reggaeton", "metal",
  "punk", "folk", "blues", "classical"
];

async function getWikipediaBio(artistName) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exsentences=4&exlimit=1&titles=${encodeURIComponent(artistName)}&explaintext=1&format=json&redirects=1`, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return "";
    const data = await res.json();
    const pages = data.query?.pages || {};
    const pageId = Object.keys(pages)[0];
    if (pageId && pageId !== '-1') {
      return String(pages[pageId].extract || "");
    }
  } catch (_) {}
  return "";
}

async function getAudioDbArtist(artistName) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`https://www.theaudiodb.com/api/v1/json/2/search.php?s=${encodeURIComponent(artistName)}`, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.artists && data.artists.length > 0) {
      const a = data.artists[0];
      return {
        biography: String(a.strBiographyEN || ""),
        banner: String(a.strArtistFanart || a.strArtistBanner || ""),
        formedYear: String(a.intFormedYear || ""),
        origin: String(a.strCountry || ""),
        style: String(a.strStyle || a.strGenre || "")
      };
    }
  } catch (_) {}
  return null;
}

function setResponseCache(res, opts = {}) {
  const maxAge = Math.max(0, Number(opts.maxAge) || 300);
  const swr = Math.max(0, Number(opts.staleWhileRevalidate) || 900);
  res.setHeader("Cache-Control", `public, s-maxage=${maxAge}, stale-while-revalidate=${swr}`);
}

function clampInt(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function readQuery(req) {
  if (req.query && typeof req.query === "object") return req.query;
  try {
    const url = new URL(req.url || "", "http://localhost");
    return Object.fromEntries(url.searchParams.entries());
  } catch (_) { return {}; }
}

function readPathParts(query) {
  const raw = query?.path;
  if (Array.isArray(raw)) return raw.filter(Boolean);
  return String(raw || "").split("/").filter(Boolean);
}

async function getSpotifyToken() {
  if (spotifyToken && Date.now() < spotifyTokenExpires - 60000) return spotifyToken;
  if (!spotifyConfig.clientId || !spotifyConfig.clientSecret) return null;
  try {
    const body = new URLSearchParams({ grant_type: "client_credentials" });
    const res = await fetch(`${SPOTIFY_ACCOUNTS}/token`, {
      method: "POST",
      headers: {
        "Authorization": "Basic " + Buffer.from(`${spotifyConfig.clientId}:${spotifyConfig.clientSecret}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body
    });
    if (!res.ok) return null;
    const json = await res.json();
    spotifyToken = json.access_token;
    spotifyTokenExpires = Date.now() + (json.expires_in || 3600) * 1000;
    return spotifyToken;
  } catch (_) { return null; }
}

async function spotifyFetch(endpoint, params = {}, timeoutMs = 8000) {
  const token = await getSpotifyToken();
  if (!token) return null;
  const url = new URL(`${SPOTIFY_API}/${endpoint}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    return res.json();
  } catch (_) { clearTimeout(timeout); return null; }
}

async function appleRssFetch(endpoint, timeoutMs = 7000) {
  const url = `${APPLE_RSS}/${endpoint}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    return res.json();
  } catch (_) { clearTimeout(timeout); return null; }
}

function normalizeSpotifyArtist(artist) {
  if (!artist) return null;
  const images = artist.images || [];
  const image = images.length > 0 ? images[0].url : "";
  return {
    id: String(artist.id || ""),
    mediaType: "artist",
    title: String(artist.name || "").trim(),
    subtitle: String((artist.genres || []).slice(0, 2).join(", ") || "Music").trim(),
    image: image,
    popularity: Number(artist.popularity || 0),
    followers: Number(artist.followers?.total || 0),
    externalUrl: String(artist.external_urls?.spotify || "").trim(),
    provider: "spotify"
  };
}

async function spotifySearchArtists(query, limit = 50) {
  const data = await spotifyFetch("search", { q: query, type: "artist", limit: String(limit) });
  if (!data || !data.artists) return [];
  return (data.artists.items || []).map(normalizeSpotifyArtist).filter(Boolean);
}

const POPULAR_ARTIST_IDS = [
  "66CXWjxzNUsdJxJ2JdwvnR", "1Xyo4u8uXC1ZmMpatF05PJ", "0Y5tJX1MQlPlqiwlOH1tJY",
  "74KM79TiuVKeVCqs8QtBqB", "4Q8iWy4kM9yHy3WEsqYKcK", "6KImCVD70vtIoJWnq6nGn3",
  "1HY2Jd0NmPuamShAr6KMms", "0du5cEVh5yTK9QJze8zA0C", "246dkJv52ZmvvB3MU3EfWD",
  "6eUKZXaKkcviH0Ku9w2n3V", "4dpARuHxo51G3z768sgnrY", "0vn82ciwoffRj4fPM57RRz",
  "1vCWHaC5f2uS3yhpwWbIA6", "7cPv8Q080UGh7Q4uxU0qQc", "1dfeR4HaWDbWqFHLkxsg1d",
  "4gzpq5DPGxSnKTe4SA8HAU", "3WrFJ7ztbogyGnTHbHJFl2", "1RyvyyTE3bv76ynp8GV1CD",
  "5K4W6rqBFWDnAN6FQUkS6x", "7ouG8Zh9LKboamobBmvrqL", "3Nrfpe0tUJi4K4DXYWgMUX",
  "1uNFoZAHGPtTmQ8EzALuQI", "1XyzdFpbj67yiDUZ1JWQnA", "0EmeFodog0B6cWt2Tl4JDl",
  "3q7HBObVc0L8jNeTe5Gofh", "53Xhw976x0cJV354YqJXRW", "0qtk0OhDkVaH2MoIhZ0UOo",
  "4r63FHU0t8eEYzTRzRt0Zp", "3EclbrCbNnNeaLVNRtPBz", "4kI8iiVn0PpoaEGMlCp1MF",
  "0gPlYImhkx45dkZDqCLcQX", "4yvcSjfuuPCcSYzB+oUm0n", "4xRYI6IsDOsa8yz3RgHaw3",
  "2CIMQHirSU0MQaakyelNZW", "3sgXDLRjZ0t5nAeHxFWHnQ", "4STHE9QIsOUL7Ih5kW1Vf3",
  "0iEtIznC4noha2kHvbYrNH", "09C0xjtosZaytableMvJcW", "3hV2JqIHtiGIF1ME5SjQXC",
  "4qwqE4EdtN5bLFO1hZ1mWD", "6olE6TJLqED3rqDCT0FyPh", "707St7h4p1Ajd84lVNKX4p",
  "23zg3TcMrWgg9Oh63tZPbO", "66aHtG9YF2Ti0JL26cIeKj", "4kSGhnmKgXbk5D8yXDbCgF",
  "6FfCtQCECycRrLrfoSFkQF", "20q1BFx3gHkDBkYDoHpn0V", "536HYn9LbcNPRXEM2HqDk2",
  "0aXZ8AHBfvq3nJU5CQ36uk"
];

async function spotifyGetArtistsByIds(ids) {
  const batch = ids.slice(0, 50);
  const token = await getSpotifyToken();
  if (!token) return [];
  try {
    const url = new URL(`${SPOTIFY_API}/artists`);
    url.search = `ids=${batch.join(",")}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || !data.artists) return [];
    return data.artists.filter(Boolean).map(normalizeSpotifyArtist).filter(Boolean);
  } catch (_) { return []; }
}

function dedupeById(items) {
  const seen = new Set();
  return (items || []).filter(item => {
    if (!item || !item.id) return false;
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function deezerSearchArtists(names) {
  const results = {};
  for (const name of names) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`https://api.deezer.com/search/artist?q=${encodeURIComponent(name)}&limit=1`, {
        signal: controller.signal,
        headers: { "User-Agent": "Mozilla/5.0" }
      });
      clearTimeout(timeout);
      if (!res.ok) continue;
      const json = await res.json();
      const artist = json.data?.[0];
      if (artist?.picture_xl) {
        results[name.toLowerCase()] = artist.picture_xl;
      }
    } catch (_) {}
  }
  return results;
}

async function deezerSearchArtistsByQuery(query, limit = 10) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(`https://api.deezer.com/search/artist?q=${encodeURIComponent(query)}&limit=${limit}`, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    clearTimeout(timeout);
    if (!res.ok) return [];
    const json = await res.json();
    return (json.data || []).map(a => ({
      id: String(a.id || ""),
      mediaType: "artist",
      title: String(a.name || "").trim(),
      subtitle: "Music",
      image: String(a.picture_xl || a.picture_big || a.picture_medium || ""),
      popularity: Number(a.nb_fan || 0),
      externalUrl: String(a.link || "").trim(),
      provider: "deezer"
    })).filter(a => a.title);
  } catch (_) { return []; }
}

async function getArtistsFromRss(limit = 20) {
  const data = await appleRssFetch(`most-played/${Math.min(limit * 3, 50)}/songs.json`);
  if (!data || !data.feed || !data.feed.results) return [];
  const seen = new Set();
  const artists = [];
  data.feed.results.forEach((song) => {
    const key = String(song.artistId || song.artistName || "").toLowerCase();
    if (!key || seen.has(key)) return;
    if (artists.length >= limit) return;
    seen.add(key);
    let image = song.artworkUrl100 || "";
    image = image.replace("100x100bb.jpg", "600x600bb.jpg");
    artists.push({
      id: String(song.artistId || ""),
      mediaType: "artist",
      title: String(song.artistName || "").trim(),
      subtitle: String(song.genres?.[0]?.name || "Music").trim(),
      image: image,
      popularity: 0,
      externalUrl: String(song.artistUrl || "").trim(),
      provider: "apple"
    });
  });
  return artists.filter(Boolean);
}

async function fetchHomeArtists(targetCount = 12) {
  const cacheKey = "home_artists";
  const cached = ARTIST_CACHE.get(cacheKey);
  if (cached && (Date.now() - cached.ts) < ARTIST_CACHE_TTL) return cached.items;

  let artists = [];
  const spotifyWorks = !!(spotifyConfig.clientId && spotifyConfig.clientSecret);

  if (spotifyWorks) {
    try {
      const ids = shuffle(POPULAR_ARTIST_IDS).slice(0, targetCount + 10);
      const spotifyArtists = await spotifyGetArtistsByIds(ids);
      artists.push(...spotifyArtists);
    } catch (e) {}
  }

  if (artists.length < targetCount) {
    try {
      const rssArtists = await getArtistsFromRss(30);
      const rssOnly = rssArtists.filter(r => !artists.find(a => a.title.toLowerCase() === r.title.toLowerCase()));
      if (rssOnly.length) {
        const names = [...new Set(rssOnly.map(a => a.title))];
        const deezerImages = await deezerSearchArtists(names.slice(0, 20));
        for (const a of rssOnly) {
          const dzImg = deezerImages[a.title.toLowerCase()];
          if (dzImg) a.image = dzImg;
        }
      }
      artists.push(...rssOnly);
    } catch (e) {}
  }

  if (artists.length < targetCount) {
    try {
      const deezerQueries = ["pop", "hip-hop", "rock", "country", "r&b", "latin"];
      const dq = shuffle(deezerQueries).slice(0, 3);
      for (const q of dq) {
        const dzArtists = await deezerSearchArtistsByQuery(q, Math.ceil(targetCount / dq.length));
        const dzOnly = dzArtists.filter(d => !artists.find(a => a.title.toLowerCase() === d.title.toLowerCase()));
        artists.push(...dzOnly);
        if (artists.length >= targetCount) break;
      }
    } catch (e) {}
  }

  artists = dedupeById(artists);
  artists = shuffle(artists);

  if (artists.length > 0) {
    ARTIST_CACHE.set(cacheKey, { items: artists, ts: Date.now() });
  }
  return artists;
}

export default async function handler(req, res) {
  try {
  const query = readQuery(req);
  const pathParts = readPathParts(query);
  const section = String(pathParts[0] || "").trim().toLowerCase();
  const id = String(pathParts[1] || "").trim();

  if (!section) {
    setResponseCache(res, { maxAge: 900, staleWhileRevalidate: 3600 });
    return res.json({ ok: true, service: "music", type: "artists", routes: ["/artists", "/search"] });
  }

  if (section === "health") {
    setResponseCache(res, { maxAge: 600, staleWhileRevalidate: 3600 });
    return res.json({ ok: true, service: "music", type: "artists", spotifyConfigured: !!spotifyConfig.clientId });
  }

  if (section === "artist") {
    setResponseCache(res, { maxAge: 600, staleWhileRevalidate: 3600 });
    const id = String(pathParts[1] || "").trim();
    if (!id) return res.status(400).json({ message: "Missing artist id" });

    const subRoute = String(pathParts[2] || "").trim().toLowerCase();
    if (subRoute === "top-tracks") {
      const spotifyWorks = !!(spotifyConfig.clientId && spotifyConfig.clientSecret);
      if (spotifyWorks) {
        try {
          const st = await spotifyFetch(`artists/${id}/top-tracks?market=US`);
          if (st && st.tracks) {
            const tracks = st.tracks.map(t => ({
              id: String(t.id || ""),
              title: String(t.name || ""),
              artist: (t.artists || []).map(a => a.name).join(", "),
              image: String(t.album?.images?.[0]?.url || ""),
              duration_ms: Number(t.duration_ms || 0),
              previewUrl: String(t.preview_url || ""),
              externalUrl: String(t.external_urls?.spotify || ""),
              trackNumber: Number(t.track_number || 0)
            }));
            return res.json({ ok: true, tracks });
          }
        } catch (_) {}
      }
      
      const artistName = String(query.name || decodeURIComponent(query.path?.split('/').pop() || '') || "").trim();
      if (artistName) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 6000);
          const res2 = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(artistName)}&entity=musicTrack&limit=10`, {
            signal: controller.signal,
            headers: { "User-Agent": "Mozilla/5.0" }
          });
          clearTimeout(timeout);
          if (res2.ok) {
            const json = await res2.json();
            if (json && json.results) {
              const tracks = json.results.map(t => ({
                id: String(t.trackId || ""),
                title: String(t.trackName || ""),
                artist: String(t.artistName || ""),
                image: String(t.artworkUrl100 || "").replace("100x100bb.jpg", "600x600bb.jpg"),
                duration_ms: Number(t.trackTimeMillis || 0),
                previewUrl: String(t.previewUrl || ""),
                externalUrl: String(t.trackViewUrl || ""),
                trackNumber: Number(t.trackNumber || 0)
              }));
              return res.json({ ok: true, tracks });
            }
          }
        } catch (_) {}
      }
      
      return res.json({ ok: true, tracks: [] });
    }

    if (subRoute === "albums") {
      const spotifyWorks = !!(spotifyConfig.clientId && spotifyConfig.clientSecret);
      if (spotifyWorks) {
        try {
          const sa = await spotifyFetch(`artists/${id}/albums?include_groups=album,single&market=US&limit=20`);
          if (sa && sa.items) {
            const albums = sa.items.map(a => ({
              id: String(a.id || ""),
              title: String(a.name || ""),
              image: String(a.images?.[0]?.url || ""),
              releaseDate: String(a.release_date || ""),
              totalTracks: Number(a.total_tracks || 0),
              type: String(a.album_type || "album"),
              externalUrl: String(a.external_urls?.spotify || "")
            }));
            return res.json({ ok: true, albums });
          }
        } catch (_) {}
      }

      const artistName = String(query.name || decodeURIComponent(query.path?.split('/').pop() || '') || "").trim();
      if (artistName) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 6000);
          const res2 = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(artistName)}&entity=album&limit=20`, {
            signal: controller.signal,
            headers: { "User-Agent": "Mozilla/5.0" }
          });
          clearTimeout(timeout);
          if (res2.ok) {
            const json = await res2.json();
            if (json && json.results) {
              const albums = json.results.map(a => ({
                id: String(a.collectionId || ""),
                title: String(a.collectionName || ""),
                image: String(a.artworkUrl100 || "").replace("100x100bb.jpg", "600x600bb.jpg"),
                releaseDate: String(a.releaseDate || ""),
                totalTracks: Number(a.trackCount || 0),
                type: (String(a.collectionType || "Album").toLowerCase() === "album") ? "album" : "single",
                externalUrl: String(a.collectionViewUrl || "")
              }));
              return res.json({ ok: true, albums });
            }
          }
        } catch (_) {}
      }
      
      return res.json({ ok: true, albums: [] });
    }

    let finalResult = null;

    const spotifyWorks = !!(spotifyConfig.clientId && spotifyConfig.clientSecret);
    if (spotifyWorks) {
      try {
        const spotifyArtists = await spotifyGetArtistsByIds([id]);
        if (spotifyArtists.length > 0) {
          finalResult = spotifyArtists[0];
        }
      } catch (_) {}
    }

    if (!finalResult) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);
        const res2 = await fetch(`https://itunes.apple.com/lookup?id=${encodeURIComponent(id)}&entity=musicArtist`, {
          signal: controller.signal,
          headers: { "User-Agent": "Mozilla/5.0" }
        });
        clearTimeout(timeout);
        if (res2.ok) {
          const json = await res2.json();
          const artist = json.results && json.results[0];
          if (artist && artist.artistName) {
            let image = String(artist.artworkUrl100 || "").replace("100x100bb.jpg", "600x600bb.jpg");
            if (!image) {
              try {
                const trackCtrl = new AbortController();
                const trackTimeout = setTimeout(() => trackCtrl.abort(), 5000);
                const trackRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(artist.artistName)}&entity=musicTrack&limit=1`, {
                  signal: trackCtrl.signal,
                  headers: { "User-Agent": "Mozilla/5.0" }
                });
                clearTimeout(trackTimeout);
                if (trackRes.ok) {
                  const trackJson = await trackRes.json();
                  const track = trackJson.results && trackJson.results[0];
                  if (track && track.artworkUrl100) {
                    image = String(track.artworkUrl100).replace("100x100bb.jpg", "600x600bb.jpg");
                  }
                }
              } catch (_) {}
            }
            finalResult = {
              id: String(artist.artistId || id),
              mediaType: "artist",
              title: String(artist.artistName || "").trim(),
              subtitle: String(artist.primaryGenreName || "Music").trim(),
              image,
              externalUrl: String(artist.artistLinkUrl || "").trim(),
              provider: "apple"
            };
          }
        }
      } catch (_) {}
    }

    if (!finalResult) {
      try {
        if (String(query.provider || "").trim().toLowerCase() !== "apple") {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 5000);
          const res3 = await fetch(`https://api.deezer.com/artist/${encodeURIComponent(id)}`, {
            signal: controller.signal,
            headers: { "User-Agent": "Mozilla/5.0" }
          });
          clearTimeout(timeout);
          if (res3.ok) {
            const dz = await res3.json();
            if (dz && dz.name) {
              finalResult = {
                id: String(dz.id || id),
                mediaType: "artist",
                title: String(dz.name || "").trim(),
                subtitle: "Music",
                image: String(dz.picture_xl || dz.picture_big || dz.picture_medium || ""),
                externalUrl: String(dz.link || "").trim(),
                provider: "deezer"
              };
            }
          }
        }
      } catch (_) {}
    }

    if (finalResult) {
      const adb = await getAudioDbArtist(finalResult.title);
      let bio = "";
      try { bio = await getWikipediaBio(finalResult.title); } catch (_) {}
      
      if (adb) {
        finalResult = { ...finalResult, ...adb };
      }
      if (bio) {
        finalResult.biography = bio;
      }
      return res.json({ ok: true, result: finalResult });
    }

    return res.status(404).json({ message: "Artist not found" });
  }

  if (section === "artists") {
    setResponseCache(res, { maxAge: 600, staleWhileRevalidate: 3600 });
    const limit = clampInt(query.limit, 1, 50, 20);
    const artists = await fetchHomeArtists(limit);
    return res.json({ count: artists.length, results: artists.slice(0, limit), source: "multi" });
  }

  if (section === "search") {
    setResponseCache(res, { maxAge: 300, staleWhileRevalidate: 1800 });
    const q = String(query.q || "").trim().slice(0, 200);
    if (!q) return res.status(400).json({ message: "Missing q parameter" });
    const limit = clampInt(query.limit, 1, 50, 20);

    let artists = [];

    const spotifyWorks = !!(spotifyConfig.clientId && spotifyConfig.clientSecret);
    if (spotifyWorks) {
      try {
        artists = await spotifySearchArtists(q, limit);
      } catch (_) {}
    }

    if (!artists.length) {
      try {
        const data = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=musicArtist&limit=${limit}`);
        if (data.ok) {
          const json = await data.json();
          artists = (json.results || []).map(a => ({
            id: String(a.artistId || ""),
            mediaType: "artist",
            title: String(a.artistName || "").trim(),
            subtitle: String(a.primaryGenreName || "Music").trim(),
            image: String(a.artworkUrl100 || "").replace("100x100bb.jpg", "600x600bb.jpg"),
            externalUrl: String(a.artistLinkUrl || "").trim(),
            provider: "apple"
          })).filter(Boolean);
        }
      } catch (_) {}
    }

    if (!artists.length) {
      try {
        artists = await deezerSearchArtistsByQuery(q, limit);
      } catch (_) {}
    }

    artists = dedupeById(artists);
    return res.json({ count: artists.length, limit, offset: 0, results: artists.slice(0, limit) });
  }

  setResponseCache(res, { maxAge: 600, staleWhileRevalidate: 3600 });
  return res.json({ ok: true, service: "music", type: "artists" });
  } catch (err) {
    return res.status(500).json({ error: "Internal error", message: String(err?.message || err) });
  }
}
