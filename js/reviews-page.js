(() => {
  const supabaseConfig = window.__ZO2Y_SUPABASE_CONFIG || {};
  const SUPABASE_URL = String(supabaseConfig.url || '').trim();
  const SUPABASE_KEY = String(supabaseConfig.key || '').trim();
  const TMDB_POSTER = "https://image.tmdb.org/t/p/w500";
  const FALLBACK_IMAGE = "/newlogo.webp";
  const REVIEW_LIMIT = 70;
  const SOURCES = [
    { mediaType: "movie", table: "reviews", idField: "item_id", label: "Movie", icon: "fa-film" },
    { mediaType: "tv", table: "reviews", idField: "item_id", label: "TV", icon: "fa-tv" },
    { mediaType: "anime", table: "reviews", idField: "item_id", label: "Anime", icon: "fa-dragon" },
    { mediaType: "game", table: "reviews", idField: "item_id", label: "Game", icon: "fa-gamepad" },
    { mediaType: "book", table: "reviews", idField: "item_id", label: "Book", icon: "fa-book" },
    { mediaType: "music", table: "reviews", idField: "item_id", label: "Music", icon: "fa-music" },
    { mediaType: "travel", table: "reviews", idField: "item_id", label: "Travel", icon: "fa-earth-americas" }
  ];
  const LABEL_BY_MEDIA = Object.fromEntries(SOURCES.map((source) => [source.mediaType, source.label]));
  const ICON_BY_MEDIA = Object.fromEntries(SOURCES.map((source) => [source.mediaType, source.icon]));

  let client = null;
  let currentUser = null;
  let mediaFilter = "all";
  let sortMode = "newest";
  let reviews = [];
  let spotlightItems = [];
  let spotlightIndex = 0;
  let spotlightTimer = null;
  const users = new Map();
  const itemMeta = new Map();

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function fixEncoding(value) {
    return String(value ?? "")
      .replace(/â€"/g, '—')
      .replace(/â€˜/g, '‘')
      .replace(/â€™/g, '’')
      .replace(/â€œ/g, '“')
      .replace(/â€/g, '”')
      .replace(/â€¦/g, '…')
      .replace(/â€“/g, '–');
  }

  function safeHttps(url) {
    const text = String(url || "").trim();
    if (!text) return "";
    if (/\.php(?:$|[?#])/i.test(text)) return "";
    if (text.startsWith("//")) return `https:${text}`;
    if (text.startsWith("http://")) return text.replace(/^http:\/\//i, "https://");
    return text;
  }

  function getSafeReviewImage(url) {
    const clean = safeHttps(url);
    if (!clean) return FALLBACK_IMAGE;
    return clean;
  }

  function reviewKey(mediaType, itemId) {
    const media = String(mediaType || "").trim().toLowerCase();
    const id = String(itemId || "").trim();
    return media && id ? `${media}:${id}` : "";
  }

  function fallbackMeta(mediaType, itemId) {
    const media = String(mediaType || "").trim().toLowerCase();
    const id = String(itemId || "").trim();
    const label = LABEL_BY_MEDIA[media] || "Item";
    const href = media === "movie"
      ? `movie.html?id=${encodeURIComponent(id)}`
      : media === "tv"
        ? `tvshow.html?id=${encodeURIComponent(id)}`
        : media === "anime"
          ? `anime.html?id=${encodeURIComponent(id)}`
          : media === "game"
            ? `game.html?id=${encodeURIComponent(id)}`
            : media === "book"
              ? `book.html?id=${encodeURIComponent(id)}`
              : media === "music"
                ? `song.html?id=${encodeURIComponent(id)}`
                : media === "travel"
                  ? `country.html?country=${encodeURIComponent(String(id || "").toUpperCase())}`
                  : "reviews.html";
    return {
      title: `${label} ${id}`.trim(),
      subtitle: label,
      image: FALLBACK_IMAGE,
      href
    };
  }

  function getMeta(mediaType, itemId) {
    return itemMeta.get(reviewKey(mediaType, itemId)) || fallbackMeta(mediaType, itemId);
  }

  function formatDate(raw) {
    const date = new Date(raw || "");
    if (!Number.isFinite(date.getTime())) return "Unknown date";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  function stars(rating) {
    const score = Math.max(0, Math.min(5, Number(rating || 0)));
    const filled = Math.round(score);
    let html = `<span class="rating-stars" aria-label="${score.toFixed(1)}/5">`;
    for (let i = 0; i < 5; i += 1) {
      html += `<span class="rating-star${i < filled ? " is-filled" : ""}" aria-hidden="true"></span>`;
    }
    html += "</span>";
    return html;
  }

  async function fetchJson(url, timeoutMs = 8000) {
    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    let timer = null;
    try {
      if (controller) timer = setTimeout(() => controller.abort(), timeoutMs);
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: controller ? controller.signal : undefined
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (_error) {
      return null;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  async function ensureSupabase() {
    if (client) return client;
    if (window.__ZO2Y_SUPABASE_CLIENT) {
      client = window.__ZO2Y_SUPABASE_CLIENT;
      return client;
    }
    for (let i = 0; i < 20; i += 1) {
      if (window.supabase?.createClient) {
        client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
          auth: {
            storage: window.__ZO2Y_AUTH_STORAGE_BRIDGE,
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: false,
            storageKey: "zo2y-auth-v2"
          }
        });
        window.__ZO2Y_SUPABASE_CLIENT = client;
        return client;
      }
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
    return null;
  }

  async function loadAuthState() {
    const supabase = await ensureSupabase();
    const loginBtn = document.getElementById("loginBtn");
    const signupBtn = document.getElementById("signupBtn");
    const profileBtn = document.getElementById("profileBtn");

    const syncButtons = () => {
      const loggedIn = !!currentUser;
      if (loginBtn) loginBtn.style.display = loggedIn ? "none" : "inline-flex";
      if (signupBtn) signupBtn.style.display = loggedIn ? "none" : "inline-flex";
      if (profileBtn) profileBtn.style.display = loggedIn ? "inline-flex" : "none";
    };

    if (!supabase) {
      syncButtons();
      return;
    }

    try {
      const { data } = await supabase.auth.getSession();
      currentUser = data?.session?.user || null;
      if (currentUser && navigator.onLine !== false) {
        const verified = await supabase.auth.getUser();
        if (!verified.error && verified.data?.user) currentUser = verified.data.user;
      }
    } catch (_error) {
      currentUser = null;
    }

    syncButtons();
    supabase.auth.onAuthStateChange((_event, session) => {
      currentUser = session?.user || null;
      syncButtons();
    });
  }

  async function fetchSourceReviews(source) {
    if (!client) return [];
    try {
      const migratedTypes = new Set(['book']);
      if (!migratedTypes.has(source.mediaType)) {
        const { data, error } = await client.from('reviews').select('id,user_id,rating,body,created_at,item_id').order('created_at',{ascending:false}).limit(REVIEW_LIMIT);
        if (error || !Array.isArray(data)) return [];
        return data.map(row => ({
          id: row.id, mediaType: source.mediaType, itemId: row.item_id, userId: row.user_id,
          rating: Math.max(0, Math.min(5, Number(row?.rating || 0))),
          comment: String(row?.body || '').trim(), createdAt: row?.created_at || null
        })).filter(r => r.itemId);
      }
      let selectStr = 'id,user_id,rating,body,created_at,item_id';
      const { data, error } = await client.from(source.table).select(selectStr).order('created_at',{ascending:false}).limit(REVIEW_LIMIT);
      if (error || !Array.isArray(data)) return [];
      return data.map(row => {
        const itemId = String(row?.item_id || '').trim();
        if (!itemId) return null;
        return {
          id: `${source.mediaType}:${String(row?.id || itemId)}`, mediaType: source.mediaType, itemId,
          userId: String(row?.user_id || '').trim(), rating: Math.max(0, Math.min(5, Number(row?.rating || 0))),
          comment: String(row?.body || '').trim(), createdAt: row?.created_at || null
        };
      }).filter(Boolean);
    } catch (_error) {
      return [];
    }
  }

  async function loadUsers(rows) {
    if (!client) return;
    const ids = Array.from(new Set((rows || []).map((row) => String(row?.userId || "").trim()).filter(Boolean)));
    if (!ids.length) return;
    const { data, error } = await client
      .from("user_profiles")
      .select("id, username, full_name")
      .in("id", ids);
    if (error || !Array.isArray(data)) return;
    data.forEach((row) => {
      const id = String(row?.id || "").trim();
      if (!id) return;
      users.set(id, {
        username: String(row?.username || "").trim(),
        fullName: String(row?.full_name || "").trim()
      });
    });
  }

  function getReviewer(userId) {
    const profile = users.get(String(userId || "").trim());
    if (!profile) return "User";
    if (profile.username) return `@${profile.username}`;
    return profile.fullName || "User";
  }

  async function hydrateLocalMeta(rows) {
    if (!client) return;
    const bookIds = Array.from(new Set(rows.filter((row) => row.mediaType === "book").map((row) => row.itemId))).filter(Boolean);
    const trackIds = Array.from(new Set(rows.filter((row) => row.mediaType === "music").map((row) => row.itemId))).filter(Boolean);

    if (bookIds.length) {
      const { data } = await client.from("books").select("id,title,authors,thumbnail").in("id", bookIds.slice(0, 200));
      (Array.isArray(data) ? data : []).forEach((row) => {
        const id = String(row?.id || "").trim();
        if (!id) return;
        itemMeta.set(reviewKey("book", id), {
          title: String(row?.title || `Book ${id}`).trim(),
          subtitle: String(row?.authors || "Book").trim(),
          image: safeHttps(row?.thumbnail || "") || FALLBACK_IMAGE,
          href: `book.html?id=${encodeURIComponent(id)}`
        });
      });
    }

    if (trackIds.length) {
      const { data } = await client.from("tracks").select("id,name,artists,image_url,album_name").in("id", trackIds.slice(0, 200));
        (Array.isArray(data) ? data : []).forEach((row) => {
          const id = String(row?.id || "").trim();
          if (!id) return;
          itemMeta.set(reviewKey("music", id), {
            title: String(row?.name || `Track ${id}`).trim(),
            subtitle: String(row?.artists || row?.album_name || "Music").trim(),
            image: safeHttps(row?.image_url || "") || FALLBACK_IMAGE,
            href: `song.html?id=${encodeURIComponent(id)}`
          });
        });
      }
    }

  async function hydrateRemoteMeta(rows) {
    const tasks = [];
    const unique = new Map();
    (rows || []).forEach((row) => {
      const key = reviewKey(row?.mediaType, row?.itemId);
      if (!key || unique.has(key)) return;
      unique.set(key, row);
    });

    unique.forEach((row) => {
      const media = String(row.mediaType || "").toLowerCase();
      const id = String(row.itemId || "").trim();
      if (!id) return;

      if (media === "movie") {
        tasks.push((async () => {
          const json = await fetchJson(`/api/tmdb/movie/${encodeURIComponent(id)}?language=en-US`, 7000);
          if (!json?.title) return;
          itemMeta.set(reviewKey("movie", id), {
            title: String(json.title).trim(),
            subtitle: String(json.release_date || "").slice(0, 4) || "Movie",
            image: json.poster_path ? `${TMDB_POSTER}${json.poster_path}` : FALLBACK_IMAGE,
            href: `movie.html?id=${encodeURIComponent(id)}`
          });
        })());
        return;
      }

      if (media === "tv" || media === "anime") {
        tasks.push((async () => {
          const json = await fetchJson(`/api/tmdb/tv/${encodeURIComponent(id)}?language=en-US`, 7000);
          if (!json?.name) return;
          itemMeta.set(reviewKey(media, id), {
            title: String(json.name).trim(),
            subtitle: String(json.first_air_date || "").slice(0, 4) || (media === "anime" ? "Anime" : "TV"),
            image: json.poster_path ? `${TMDB_POSTER}${json.poster_path}` : FALLBACK_IMAGE,
            href: `${media === "anime" ? "anime" : "tvshow"}.html?id=${encodeURIComponent(id)}`
          });
        })());
        return;
      }

      if (media === "game") {
        tasks.push((async () => {
          const json = await fetchJson(`/api/igdb/games/${encodeURIComponent(id)}`, 8500);
          if (!json?.name) return;
          itemMeta.set(reviewKey("game", id), {
            title: String(json.name).trim(),
            subtitle: String(json.released || "").slice(0, 4) || "Game",
            image: safeHttps(json.cover || json.hero || json.background_image || "") || FALLBACK_IMAGE,
            href: `game.html?id=${encodeURIComponent(id)}`
          });
        })());
        return;
      }

      if (media === "travel") {
        tasks.push((async () => {
          const code = String(id || "").trim().toUpperCase();
          const json = await fetchJson(
            `/api/restcountries/alpha?codes=${encodeURIComponent(code)}&fields=name,cca2,cca3,capital,region,flags`,
            9000
          );
          const rowData = Array.isArray(json) ? json[0] : null;
          if (!rowData) return;
          const title = String(rowData?.name?.common || rowData?.name?.official || code).trim();
          const capital = Array.isArray(rowData?.capital) ? String(rowData.capital[0] || "").trim() : String(rowData?.capital || "").trim();
          itemMeta.set(reviewKey("travel", code), {
            title,
            subtitle: [capital ? `Capital: ${capital}` : "", String(rowData?.region || "").trim()].filter(Boolean).join(" | ") || "Country",
            image: safeHttps(rowData?.flags?.png || rowData?.flags?.svg || "") || FALLBACK_IMAGE,
            href: `country.html?country=${encodeURIComponent(code)}`
          });
        })());
      }
    });

    await Promise.allSettled(tasks);
  }

  function filteredRows() {
    const rows = mediaFilter === "all"
      ? reviews.slice()
      : reviews.filter((row) => row.mediaType === mediaFilter);
    if (sortMode === "highest") {
      rows.sort((a, b) => (b.rating - a.rating) || (new Date(b.createdAt || 0) - new Date(a.createdAt || 0)));
      return rows;
    }
    if (sortMode === "lowest") {
      rows.sort((a, b) => (a.rating - b.rating) || (new Date(b.createdAt || 0) - new Date(a.createdAt || 0)));
      return rows;
    }
    rows.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return rows;
  }

  function render() {
    const listEl = document.getElementById("reviewsList");
    const summaryEl = document.getElementById("summaryText");
    if (!listEl) return;

    const rows = filteredRows();

    if (summaryEl) {
      const label = mediaFilter === "all" ? "all media" : (LABEL_BY_MEDIA[mediaFilter] || mediaFilter);
      summaryEl.textContent = `${rows.length} review${rows.length === 1 ? "" : "s"} shown for ${label}.`;
    }

    if (!rows.length) {
      listEl.innerHTML = '<div class="empty">No reviews found for this filter.</div>';
      return;
    }

    const paperColors = ["paper-cream", "paper-yellow", "paper-orange", "paper-blue", "paper-green"];

    listEl.innerHTML = rows.map((row, idx) => {
      const media = String(row.mediaType || "").toLowerCase();
      const meta = getMeta(media, row.itemId);
      const title = escapeHtml(meta.title || "Untitled");
      const subtitle = escapeHtml(meta.subtitle || (LABEL_BY_MEDIA[media] || ""));
      const reviewer = escapeHtml(getReviewer(row.userId));
      const rating = Math.max(0, Math.min(5, Number(row.rating || 0)));
      const mediaLabel = escapeHtml(LABEL_BY_MEDIA[media] || "Media");
      const href = escapeHtml(meta.href || "#");
      const image = escapeHtml(getSafeReviewImage(meta.image || ""));
      const comment = escapeHtml(fixEncoding(String(row.comment || "").trim()));
      
      const rotation = (Math.random() * 4 - 2).toFixed(1);
      const paperClass = paperColors[Math.floor(Math.random() * paperColors.length)];
      const delay = (idx * 0.05).toFixed(2);

      return `
        <a class="sticky-card ${paperClass}" href="${href}" data-media="${escapeHtml(media)}" data-item-id="${escapeHtml(row.itemId)}" style="transform: rotate(${rotation}deg); animation-delay: ${delay}s">
          <div class="sticky-meta">
            <img class="sticky-thumb" src="${image}" alt="${title}" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='${FALLBACK_IMAGE}'" />
            <div class="sticky-info">
              <div class="sticky-title" title="${title}">${title}</div>
              <div class="sticky-subtitle">${mediaLabel}</div>
            </div>
          </div>
          ${comment ? `<div class="sticky-quote">${comment}</div>` : ''}
          <div class="sticky-footer">
            <div class="sticky-reviewer">by ${reviewer}</div>
            <div class="sticky-rating">${stars(rating)}</div>
          </div>
        </a>`;
    }).join("");
  }

  function wireFilters() {
    const wrap = document.getElementById("mediaFilters");
    wrap?.querySelectorAll(".chip[data-media]").forEach((btn) => {
      btn.addEventListener("click", () => {
        mediaFilter = String(btn.getAttribute("data-media") || "all").toLowerCase();
        wrap.querySelectorAll(".chip[data-media]").forEach((node) => node.classList.toggle("active", node === btn));
        render();
      });
    });

    document.getElementById("sortSelect")?.addEventListener("change", (event) => {
      sortMode = String(event.target.value || "newest");
      render();
    });
  }

  async function loadPage() {
    const listEl = document.getElementById("reviewsList");
    if (listEl) listEl.innerHTML = Skel.reviewList(4);

    await ensureSupabase();
    if (!client) {
      if (listEl) listEl.innerHTML = '<div class="empty">Could not connect to reviews right now.</div>';
      return;
    }

    const groups = await Promise.all(SOURCES.map((source) => fetchSourceReviews(source)));
    reviews = groups.flat().sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    if (!reviews.length) {
      if (listEl) listEl.innerHTML = '<div class="empty">No reviews have been posted yet.</div>';
      const summary = document.getElementById("summaryText");
      if (summary) summary.textContent = "0 reviews found.";
      return;
    }

    await Promise.allSettled([
      loadUsers(reviews),
      hydrateLocalMeta(reviews),
      hydrateRemoteMeta(reviews.slice(0, 140))
    ]);

    render();
  }

  document.addEventListener("DOMContentLoaded", () => {
    wireFilters();
    void loadAuthState();
    void loadPage();

    if (window.initUniversalSearch) {
      const initSearch = () => window.initUniversalSearch({ input: "#globalSearch", fallbackRoute: "movies.html" });
      if (typeof window.requestIdleCallback === "function") {
        window.requestIdleCallback(initSearch, { timeout: 1200 });
      } else {
        window.setTimeout(initSearch, 0);
      }
    }
  });
})();
