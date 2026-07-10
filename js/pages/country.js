(() => {
  const supabaseConfig = window.__ZO2Y_SUPABASE_CONFIG || {};
  const SUPABASE_URL =
    String(supabaseConfig.url || "").trim() || "__SUPABASE_URL__";
  const SUPABASE_KEY = String(supabaseConfig.key || "").trim();

  const FALLBACK_FLAG = "/file.svg";

  const REST_COUNTRIES_BASE = "/api/restcountries/alpha";
  const WIKIMEDIA_GALLERY_FALLBACK = "https://commons.wikimedia.org/w/api.php";
  const TRAVEL_PHOTO_CACHE_KEY = "zo2y_travel_photo_cache_v7";
  const TRAVEL_PHOTO_CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 14;
  const COUNTRY_GALLERY_CACHE_KEY = "zo2y_country_gallery_cache_v4";
  const COUNTRY_GALLERY_CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7;
  const TRAVEL_BUCKET_NAME = "travel-photos";
  const TRAVEL_BUCKET_MANIFEST_CACHE_KEY = "zo2y_travel_bucket_manifest_v1";
  const TRAVEL_BUCKET_MANIFEST_TTL_MS = 1000 * 60 * 60 * 24 * 7;
  const TRAVEL_BUCKET_MANIFEST_URL = `${SUPABASE_URL}/storage/v1/object/public/${TRAVEL_BUCKET_NAME}/manifest/travel-photo-manifest.json`;

  const params = new URLSearchParams(window.location.search);
  const routeCode = String(params.get("country") || "")
    .trim()
    .toUpperCase();

  const state = {
    supabase: null,
    currentUser: null,
    code: "",
    name: "",
    capital: "",
    region: "",
    subregion: "",
    languages: [],
    currencies: [],
    flag: "",
    mapsUrl: "",
  };

  const sharedTravelPhotoCache = new Map();
  const countryGalleryCache = new Map();
  let travelBucketManifestPromise = null;

  const ui = {
    body: document.body,
    infoGrid: document.getElementById("countryInfoGrid"),
    guideSection: document.getElementById("countryGuideSection"),
    guideGrid: document.getElementById("countryGuideGrid"),
    related: document.getElementById("countryRelated"),
    relatedSection: document.getElementById("countryRelatedSection"),
    relatedSub: document.getElementById("countryRelatedSub"),
    toast: document.getElementById("countryToast"),
    actionCard: document.getElementById("countryActionCard"),
  };

  const COUNTRY_CITY_GUIDE = {
    US: ["New York City", "San Francisco", "Chicago", "New Orleans"],
    JP: ["Tokyo", "Kyoto", "Osaka", "Sapporo"],
    FR: ["Paris", "Lyon", "Nice", "Bordeaux"],
    IT: ["Rome", "Florence", "Milan", "Naples"],
    ES: ["Barcelona", "Madrid", "Seville", "Valencia"],
    GB: ["London", "Edinburgh", "Manchester", "Bath"],
    DE: ["Berlin", "Munich", "Hamburg", "Cologne"],
    EG: ["Cairo", "Alexandria", "Luxor", "Aswan"],
    TR: ["Istanbul", "Ankara", "Izmir", "Antalya"],
    BR: ["Rio de Janeiro", "Sao Paulo", "Salvador", "Florianopolis"],
    MX: ["Mexico City", "Guadalajara", "Merida", "Oaxaca"],
    AU: ["Sydney", "Melbourne", "Brisbane", "Perth"],
    CA: ["Toronto", "Vancouver", "Montreal", "Quebec City"],
    TH: ["Bangkok", "Chiang Mai", "Phuket", "Krabi"],
    ID: ["Bali", "Jakarta", "Yogyakarta", "Lombok"],
    IN: ["Delhi", "Mumbai", "Jaipur", "Goa"],
    ZA: ["Cape Town", "Johannesburg", "Durban", "Stellenbosch"],
    AE: ["Dubai", "Abu Dhabi", "Sharjah", "Ras Al Khaimah"],
  };

  const REGION_ACTIVITY_GUIDE = {
    Europe: [
      "Explore old town districts and historic landmarks",
      "Take a local market and street food walk",
      "Book one museum or gallery in advance to skip lines",
      "Plan one slow afternoon in a neighborhood cafe",
    ],
    Asia: [
      "Visit a temple, shrine, or cultural heritage site",
      "Try regional dishes at local food streets",
      "Use train networks for efficient city-to-city travel",
      "Explore one night market or evening district",
    ],
    Africa: [
      "Mix city highlights with a nature or desert day trip",
      "Book guided history tours in major heritage areas",
      "Start early for outdoor sites to avoid peak heat",
      "Support local artisans in certified craft markets",
    ],
    Americas: [
      "Pair city neighborhoods with one scenic viewpoint",
      "Plan a food-focused day around local specialties",
      "Use public transit apps for safer navigation",
      "Reserve popular attractions before weekends",
    ],
    Oceania: [
      "Combine city days with coastal or nature escapes",
      "Check weather and UV index before outdoor plans",
      "Try local seafood and regional produce markets",
      "Book national park activities ahead of time",
    ],
    default: [
      "Start with central landmarks and local neighborhoods",
      "Keep one day flexible for spontaneous discoveries",
      "Plan meals around top-rated local specialties",
      "Balance busy attractions with one relaxed evening",
    ],
  };

  const REGION_SEASON_GUIDE = {
    Europe: [
      "Best windows: April to June and September to October.",
      "Winter is quieter but colder; pack layers.",
    ],
    Asia: [
      "Best windows vary by monsoon zone; spring and autumn are usually safest bets.",
      "Check humidity and rain forecasts weekly.",
    ],
    Africa: [
      "Dry seasons are typically best for sightseeing and road travel.",
      "Desert areas have large day/night temperature swings.",
    ],
    Americas: [
      "Spring and fall usually offer milder weather and lower crowds.",
      "Hurricane/typhoon regions require seasonal checks.",
    ],
    Oceania: [
      "Shoulder seasons can offer strong weather and lighter crowds.",
      "Summer can be hot; plan outdoor activities early.",
    ],
    default: [
      "Shoulder seasons usually balance weather and crowd levels.",
      "Confirm local holidays before booking popular attractions.",
    ],
  };

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function safeHttps(url) {
    const text = String(url || "").trim();
    if (!text) return "";
    if (text.startsWith("//")) return `https:${text}`;
    if (text.startsWith("http://"))
      return text.replace(/^http:\/\//i, "https://");
    return text;
  }

  function canonicalCountryCode(value) {
    const raw = String(value || "")
      .trim()
      .toUpperCase();
    if (raw === "IL") return "PS";
    return raw;
  }

  function showToast(message, type = "info") {
    if (!ui.toast) return;
    ui.toast.textContent = message;
    ui.toast.classList.toggle("is-error", type === "error");
    ui.toast.classList.toggle("is-success", type === "success");
    ui.toast.classList.add("show");
    window.clearTimeout(showToast._timer);
    showToast._timer = window.setTimeout(() => {
      ui.toast.classList.remove("show");
    }, 2400);
  }

  async function ensureSupabase() {
    if (state.supabase) return state.supabase;
    const authRuntime = window.ZO2Y_AUTH || null;
    if (authRuntime && typeof authRuntime.waitForSupabase === "function") {
      await authRuntime.waitForSupabase(8000);
    } else {
      const startedAt = Date.now();
      while (
        !(
          window.supabase && typeof window.supabase.createClient === "function"
        ) &&
        Date.now() - startedAt < 8000
      ) {
        await new Promise((resolve) => setTimeout(resolve, 40));
      }
    }
    if (typeof window.__ZO2Y_ENSURE_SUPABASE_CLIENT === "function") {
      state.supabase = await window.__ZO2Y_ENSURE_SUPABASE_CLIENT();
      if (state.supabase) return state.supabase;
    }
    if (
      window.supabase &&
      typeof window.supabase.createClient === "function" &&
      window.__ZO2Y_SUPABASE_CONFIG
    ) {
      state.supabase = window.supabase.createClient(
        window.__ZO2Y_SUPABASE_CONFIG.url,
        window.__ZO2Y_SUPABASE_CONFIG.key,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: false,
          },
        },
      );
      window.__ZO2Y_SUPABASE_CLIENT = state.supabase;
      return state.supabase;
    }
    return null;
  }

  async function initAuth() {
    const sb = await ensureSupabase();
    if (!sb) return;
    try {
      const { data } = await sb.auth.getUser();
      state.currentUser = data && data.user ? data.user : null;
    } catch (_e) {
      state.currentUser = null;
    }
    sb.auth.onAuthStateChange((_event, session) => {
      state.currentUser = session && session.user ? session.user : null;
    });
  }

  /* ---------- Guide ---------- */
  function uniqueStrings(values) {
    return [
      ...new Set(
        (Array.isArray(values) ? values : [])
          .map((value) => String(value || "").trim())
          .filter(Boolean),
      ),
    ];
  }

  function buildCountryGuide() {
    const code = state.code;
    const name = state.name;
    const capital = state.capital;
    const region = state.region;
    const subregion = state.subregion;
    const languages = state.languages;
    const currencies = state.currencies;

    const citySeed = COUNTRY_CITY_GUIDE[code] || [];
    const fallbackCities = [
      capital,
      subregion ? `${subregion} highlights` : "",
      `${name} old town`,
      `${name} cultural district`,
    ];
    const cities = uniqueStrings([...citySeed, ...fallbackCities]).slice(0, 4);

    const activities = [
      ...(REGION_ACTIVITY_GUIDE[region] || REGION_ACTIVITY_GUIDE.default),
      capital
        ? `Spend half a day exploring ${capital}'s central district.`
        : "",
    ];

    const season = [
      ...(REGION_SEASON_GUIDE[region] || REGION_SEASON_GUIDE.default),
      subregion
        ? `Regional weather note: ${subregion} can differ from national averages.`
        : "",
    ];

    const languageNote = languages.length
      ? `Learn a few phrases in ${languages[0]}.`
      : "Learn a few local greetings before arrival.";
    const currencyNote = currencies.length
      ? `Carry a backup payment option for ${currencies[0]} transactions.`
      : "Carry a backup payment option for local transactions.";
    const tips = [
      languageNote,
      currencyNote,
      "Download offline maps and key addresses before long day trips.",
      "Book airport transfer or first-night transport in advance.",
    ];

    return { cities, activities, season, tips };
  }

  function renderGuideList(targetId, values) {
    const host = document.getElementById(targetId);
    if (!host) return;
    const items = uniqueStrings(values).slice(0, 5);
    host.innerHTML = items.length
      ? items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")
      : '<li class="country-guide-empty">No guide details available yet.</li>';
  }

  function renderGuide() {
    if (!ui.guideGrid) return;
    const guide = buildCountryGuide();
    const cards = [
      {
        title: "Top cities",
        icon: "fa-city",
        id: "gCities",
        values: guide.cities,
      },
      {
        title: "What to do",
        icon: "fa-compass",
        id: "gActivities",
        values: guide.activities,
      },
      {
        title: "Best time to visit",
        icon: "fa-calendar-days",
        id: "gSeason",
        values: guide.season,
      },
      {
        title: "Local tips",
        icon: "fa-lightbulb",
        id: "gTips",
        values: guide.tips,
      },
    ];
    ui.guideGrid.innerHTML = cards
      .map(
        (card) => `
      <article class="country-guide-card">
        <h3><i class="fa-solid ${card.icon}"></i> ${escapeHtml(card.title)}</h3>
        <ul class="country-guide-list" id="${card.id}"></ul>
      </article>
    `,
      )
      .join("");
    renderGuideList("gCities", guide.cities);
    renderGuideList("gActivities", guide.activities);
    renderGuideList("gSeason", guide.season);
    renderGuideList("gTips", guide.tips);
  }

  /* ---------- Quick facts ---------- */
  function renderInfoGrid() {
    if (!ui.infoGrid) return;
    const items = [];
    if (state.capital)
      items.push({
        icon: "fa-landmark",
        label: "Capital",
        value: state.capital,
      });
    if (state.region || state.subregion)
      items.push({
        icon: "fa-globe",
        label: "Region",
        value: [state.region, state.subregion].filter(Boolean).join(" · "),
      });
    if (state.languages.length)
      items.push({
        icon: "fa-language",
        label: "Languages",
        value: state.languages.join(", "),
      });
    if (state.currencies.length)
      items.push({
        icon: "fa-coins",
        label: "Currencies",
        value: state.currencies.join(", "),
      });
    if (state.code)
      items.push({ icon: "fa-hashtag", label: "Code", value: state.code });
    items.push({
      icon: "fa-map-location-dot",
      label: "Maps",
      value: state.mapsUrl ? "Open in Google Maps" : "Not available",
    });

    if (!items.length) {
      ui.infoGrid.innerHTML =
        '<div class="country-review-empty">No facts available.</div>';
      return;
    }

    ui.infoGrid.innerHTML = items
      .map(
        (item) => `
      <div class="country-fact">
        <i class="fa-solid ${item.icon}"></i>
        <div class="country-fact-body">
          <span class="country-fact-label">${escapeHtml(item.label)}</span>
          <span class="country-fact-value">${escapeHtml(item.value)}</span>
        </div>
      </div>
    `,
      )
      .join("");
  }

  /* ---------- Gallery (Wikimedia Commons) ---------- */
  function isBadScenicUrl(url) {
    const raw = String(url || "")
      .trim()
      .toLowerCase();
    if (!raw) return true;
    if (raw.includes("flagcdn.com")) return true;
    if (raw.includes("/flags/")) return true;
    if (raw.includes("flag_of_") || raw.includes("flag-of-")) return true;
    if (raw.includes("coat_of_arms") || raw.includes("coat-of-arms"))
      return true;
    if (raw.includes("map_of_") || raw.includes("map-of-")) return true;
    if (raw.includes("emblem") || raw.includes("seal")) return true;
    const blocked = [
      "painting",
      "artwork",
      "illustration",
      "drawing",
      "poster",
      "logo",
      "cartoon",
      "sketch",
      "render",
      "vector",
      "banknote",
      "stamp",
      "crest",
    ];
    return blocked.some((token) => raw.includes(token));
  }

  function normalizeGalleryItem(entry) {
    if (!entry) return null;
    if (typeof entry === "string") {
      const url = safeHttps(entry);
      if (!url || isBadScenicUrl(url)) return null;
      return { url, kind: "scenic" };
    }
    if (typeof entry === "object") {
      const url = safeHttps(
        entry.url || entry.src || entry.image || entry.thumbnail || "",
      );
      if (!url || isBadScenicUrl(url)) return null;
      const rawKind = String(entry.kind || entry.label || "")
        .trim()
        .toLowerCase();
      const kind =
        rawKind === "city"
          ? "city"
          : rawKind === "nature"
            ? "nature"
            : "scenic";
      return { url, kind };
    }
    return null;
  }

  function normalizeCountryName(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+\(country\)\s*$/i, "")
      .replace(/[^a-z0-9 ]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function isPhotoMime(mime) {
    const value = String(mime || "")
      .toLowerCase()
      .trim();
    return (
      value === "image/jpeg" || value === "image/jpg" || value === "image/webp"
    );
  }

  function getCommonsCategoryText(page) {
    const categories = Array.isArray(page?.categories) ? page.categories : [];
    return categories
      .map((entry) =>
        String(entry?.title || "")
          .replace(/^Category:/i, "")
          .trim()
          .toLowerCase(),
      )
      .filter(Boolean)
      .join(" | ");
  }

  function isBadScenicTitle(
    title,
    countryName,
    capital,
    cityHints = [],
    categoryText = "",
  ) {
    const raw =
      `${String(title || "")} ${String(categoryText || "")}`.toLowerCase();
    if (!raw) return true;
    const blocked = [
      "flag",
      "coat of arms",
      "emblem",
      "seal",
      "map of",
      "locator map",
      "location map",
      "orthographic",
      "equirectangular",
      "blank map",
      "administrative map",
      "province map",
      "political map",
      "banner",
      "painting",
      "artwork",
      "illustration",
      "drawing",
      "poster",
      "cartoon",
      "sketch",
      "render",
      "vector",
      "banknote",
      "stamp",
      "mural",
      "logo",
    ];
    if (blocked.some((token) => raw.includes(token))) return true;
    const countryNeedle = normalizeCountryName(countryName);
    const capitalNeedle = normalizeCountryName(capital);
    const cityNeedles = (Array.isArray(cityHints) ? cityHints : [])
      .map((value) => normalizeCountryName(value))
      .filter(Boolean);
    if (!countryNeedle && !capitalNeedle && !cityNeedles.length) return false;
    const normalizedTitle = normalizeCountryName(title);
    const hasCountry = countryNeedle && normalizedTitle.includes(countryNeedle);
    const hasCapital = capitalNeedle && normalizedTitle.includes(capitalNeedle);
    const hasCity = cityNeedles.some((needle) =>
      normalizedTitle.includes(needle),
    );
    return !(hasCountry || hasCapital || hasCity);
  }

  function scoreCountryPhotoCandidate(
    page,
    kind,
    countryName,
    capital,
    cityHints = [],
  ) {
    const title = String(page?.title || "");
    const mime = String(page?.imageinfo?.[0]?.mime || "").toLowerCase();
    if (!isPhotoMime(mime)) return -1;
    const categoryText = getCommonsCategoryText(page);
    if (isBadScenicTitle(title, countryName, capital, cityHints, categoryText))
      return -1;
    const raw = `${title} ${categoryText}`.toLowerCase();
    let score = 0;
    if (raw.includes("photographs")) score += 5;
    if (kind === "city") {
      if (raw.includes("skyline") || raw.includes("cityscape")) score += 6;
      if (
        raw.includes("downtown") ||
        raw.includes("street") ||
        raw.includes("urban") ||
        raw.includes("capital")
      )
        score += 4;
    } else if (kind === "nature") {
      if (
        raw.includes("landscape") ||
        raw.includes("mountain") ||
        raw.includes("coast") ||
        raw.includes("beach") ||
        raw.includes("forest") ||
        raw.includes("lake") ||
        raw.includes("national park")
      )
        score += 6;
    } else {
      if (
        raw.includes("landscape") ||
        raw.includes("panorama") ||
        raw.includes("view") ||
        raw.includes("scenery")
      )
        score += 5;
      if (raw.includes("skyline") || raw.includes("cityscape")) score += 2;
    }
    return score;
  }

  function loadSharedTravelPhotoCache() {
    try {
      const raw = localStorage.getItem(TRAVEL_PHOTO_CACHE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const savedAt = Number((parsed && parsed.savedAt) || 0);
      const entries =
        parsed && parsed.entries && typeof parsed.entries === "object"
          ? parsed.entries
          : null;
      if (!savedAt || !entries) return;
      if (Date.now() - savedAt > TRAVEL_PHOTO_CACHE_TTL_MS) return;
      Object.entries(entries).forEach(([code, entry]) => {
        const safeCountryCode = canonicalCountryCode(code);
        if (!safeCountryCode) return;
        const scenic = safeHttps((entry && entry.scenic) || "");
        const city = safeHttps((entry && entry.city) || "");
        const nature = safeHttps((entry && entry.nature) || "");
        const normalized = {
          scenic: scenic && !isBadScenicUrl(scenic) ? scenic : "",
          city: city && !isBadScenicUrl(city) ? city : "",
          nature: nature && !isBadScenicUrl(nature) ? nature : "",
        };
        if (!normalized.scenic && !normalized.city && !normalized.nature)
          return;
        sharedTravelPhotoCache.set(safeCountryCode, normalized);
      });
    } catch (_e) {}
  }

  function loadCountryGalleryCache() {
    try {
      const raw = localStorage.getItem(COUNTRY_GALLERY_CACHE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const savedAt = Number((parsed && parsed.savedAt) || 0);
      const entries =
        parsed && parsed.entries && typeof parsed.entries === "object"
          ? parsed.entries
          : null;
      if (!savedAt || !entries) return;
      if (Date.now() - savedAt > COUNTRY_GALLERY_CACHE_TTL_MS) return;
      Object.entries(entries).forEach(([code, urls]) => {
        const safeCountryCode = canonicalCountryCode(code);
        const list = Array.isArray(urls)
          ? urls
              .map((value) => normalizeGalleryItem(value))
              .filter(Boolean)
              .slice(0, 12)
          : [];
        if (!safeCountryCode || !list.length) return;
        countryGalleryCache.set(safeCountryCode, list);
      });
    } catch (_e) {}
  }

  function saveSharedTravelPhoto(code, url, kind = "scenic") {
    const safeCountryCode = canonicalCountryCode(code);
    const safeUrl = safeHttps(url);
    if (!safeCountryCode || !safeUrl || isBadScenicUrl(safeUrl)) return;
    const targetKind = ["scenic", "city", "nature"].includes(kind)
      ? kind
      : "scenic";
    const current = sharedTravelPhotoCache.get(safeCountryCode) || {
      scenic: "",
      city: "",
      nature: "",
    };
    if (current[targetKind] === safeUrl) return;
    current[targetKind] = safeUrl;
    sharedTravelPhotoCache.set(safeCountryCode, current);
    try {
      const entries = {};
      sharedTravelPhotoCache.forEach((value, key) => {
        const safeKey = canonicalCountryCode(key);
        if (!safeKey) return;
        const v = value || {};
        if (!v.scenic && !v.city && !v.nature) return;
        entries[safeKey] = v;
      });
      localStorage.setItem(
        TRAVEL_PHOTO_CACHE_KEY,
        JSON.stringify({ savedAt: Date.now(), entries }),
      );
    } catch (_e) {}
  }

  function saveCountryGalleryCache() {
    try {
      const entries = {};
      countryGalleryCache.forEach((urls, code) => {
        const safeCountryCode = canonicalCountryCode(code);
        const list = (Array.isArray(urls) ? urls : [])
          .map((value) => normalizeGalleryItem(value))
          .filter(Boolean)
          .slice(0, 12);
        if (!safeCountryCode || !list.length) return;
        entries[safeCountryCode] = list;
      });
      localStorage.setItem(
        COUNTRY_GALLERY_CACHE_KEY,
        JSON.stringify({ savedAt: Date.now(), entries }),
      );
    } catch (_e) {}
  }

  function buildCountryPhotoUrl(name, code) {
    const safeCountryCode = canonicalCountryCode(code);
    const shared = sharedTravelPhotoCache.get(safeCountryCode);
    if (shared) {
      if (shared.scenic && !isBadScenicUrl(shared.scenic)) return shared.scenic;
      if (shared.city && !isBadScenicUrl(shared.city)) return shared.city;
      if (shared.nature && !isBadScenicUrl(shared.nature)) return shared.nature;
    }
    const gallery = countryGalleryCache.get(safeCountryCode);
    if (Array.isArray(gallery) && gallery.length) {
      const first = normalizeGalleryItem(gallery[0]);
      if (first && first.url && !isBadScenicUrl(first.url)) return first.url;
    }
    return "";
  }

  function renderGallery(images = [], countryName = "") {
    const grid = ui.gallery;
    if (!grid) return;
    const list = (Array.isArray(images) ? images : [])
      .map((value) => normalizeGalleryItem(value))
      .filter(Boolean)
      .slice(0, 12);
    if (!list.length) {
      grid.innerHTML =
        '<div class="elevated-gallery-empty"><i class="fa-solid fa-image"></i> No photos available right now.</div>';
      if (ui.gallerySection) ui.gallerySection.hidden = true;
      return;
    }
    const labelForKind = (kind) => {
      if (kind === "city") return "city life";
      if (kind === "nature") return "nature";
      return "scenic";
    };
    grid.classList.toggle("has-multiple", list.length > 1);
    grid.innerHTML = list
      .map(
        (entry, i) => `
      <div class="elevated-gallery-item" data-kind="${escapeHtml(entry.kind)}" data-index="${i}" ${i === 0 && list.length > 1 ? `data-remaining="${list.length - 1}"` : ""}>
        <img src="${escapeHtml(entry.url)}" alt="${escapeHtml(countryName)} ${escapeHtml(labelForKind(entry.kind))}" loading="lazy" onerror="this.onerror=null;this.closest('.elevated-gallery-item')?.remove();">
        <div class="elevated-gallery-item-caption">${escapeHtml(labelForKind(entry.kind))}</div>
      </div>
    `,
      )
      .join("");
    grid.onclick = (e) => {
      const item = e.target.closest(".elevated-gallery-item");
      if (item && window.openGalleryLightbox) {
        window.openGalleryLightbox(
          list.map((e) => ({ url: e.url, caption: labelForKind(e.kind) })),
          parseInt(item.getAttribute("data-index") || "0", 10),
        );
      }
    };
    if (ui.gallerySection) ui.gallerySection.hidden = false;
  }

  async function fetchCommonsCountryGallery(name, code, capital) {
    const safeCountryCode = canonicalCountryCode(code);
    if (!safeCountryCode) return [];
    const cached = countryGalleryCache.get(safeCountryCode);
    if (Array.isArray(cached) && cached.length) return cached;

    const cityHints = capital ? [capital] : [];
    const queryGroups = [
      {
        kind: "city",
        limit: 4,
        queries: [
          capital ? `${capital} skyline` : "",
          capital ? `${capital} downtown` : "",
          capital ? `${capital} cityscape` : "",
          `${name} city skyline`,
          `${name} city center`,
          `${name} street scene`,
        ],
      },
      {
        kind: "nature",
        limit: 4,
        queries: [
          `${name} landscape`,
          `${name} nature`,
          `${name} national park`,
          `${name} mountains`,
          `${name} coast`,
          `${name} lake`,
        ],
      },
      {
        kind: "scenic",
        limit: 4,
        queries: [
          `${name} travel photography`,
          `${name} scenery`,
          `${name} landmarks`,
          `${name} panorama`,
        ],
      },
    ];

    const out = [];
    const seen = new Set();
    const counts = { city: 0, nature: 0, scenic: 0 };

    for (const group of queryGroups) {
      const queries = group.queries
        .map((value) => String(value || "").trim())
        .filter(Boolean);
      for (const query of queries) {
        if (out.length >= 12 || counts[group.kind] >= group.limit) break;
        const endpoint = `${WIKIMEDIA_GALLERY_FALLBACK}?action=query&format=json&formatversion=2&origin=*&generator=search&gsrnamespace=6&gsrlimit=20&gsrsearch=${encodeURIComponent(query)}&prop=imageinfo|categories&iiprop=url|mime&iiurlwidth=1600&cllimit=max`;
        try {
          const response = await fetch(endpoint, {
            headers: { Accept: "application/json" },
          });
          if (!response.ok) continue;
          const payload = await response.json();
          const pages = Array.isArray(
            payload && payload.query && payload.query.pages,
          )
            ? payload.query.pages
            : [];
          pages
            .map((page) => ({
              page,
              score: scoreCountryPhotoCandidate(
                page,
                group.kind,
                name,
                capital,
                cityHints,
              ),
            }))
            .filter((entry) => entry.score >= 0)
            .sort((left, right) => right.score - left.score)
            .forEach(({ page }) => {
              if (out.length >= 12 || counts[group.kind] >= group.limit) return;
              const title = String((page && page.title) || "");
              const mime = String(
                (page &&
                  page.imageinfo &&
                  page.imageinfo[0] &&
                  page.imageinfo[0].mime) ||
                  "",
              ).toLowerCase();
              if (!isPhotoMime(mime)) return;
              const image = safeHttps(
                page &&
                  page.imageinfo &&
                  page.imageinfo[0] &&
                  (page.imageinfo[0].thumburl || page.imageinfo[0].url),
              );
              if (!image || isBadScenicUrl(image) || seen.has(image)) return;
              seen.add(image);
              out.push({ url: image, kind: group.kind });
              counts[group.kind] += 1;
            });
        } catch (_e) {}
      }
    }

    if (out.length) {
      countryGalleryCache.set(safeCountryCode, out);
      saveCountryGalleryCache();
      const scenicFirst =
        out.find((entry) => entry.kind === "scenic") || out[0];
      if (scenicFirst && scenicFirst.url) {
        saveSharedTravelPhoto(safeCountryCode, scenicFirst.url, "scenic");
      }
    }
    return out;
  }

  /* ---------- Related (other countries in same region) ---------- */
  function renderRelated(otherCountries) {
    if (!ui.related) return;
    const list = Array.isArray(otherCountries) ? otherCountries : [];
    if (!list.length) {
      if (ui.relatedSection) ui.relatedSection.hidden = true;
      return;
    }
    ui.related.innerHTML = list
      .map(
        (c) => `
      <a class="elevated-related-card" href="country.html?country=${encodeURIComponent(c.code)}" data-code="${escapeHtml(c.code)}">
        <span class="elevated-related-thumb">
          ${c.flag ? `<img src="${escapeHtml(c.flag)}" alt="${escapeHtml(c.name)}" loading="lazy" onerror="this.onerror=null;this.outerHTML='<i class=&quot;fa-solid fa-earth-americas&quot;></i>';">` : '<i class="fa-solid fa-earth-americas"></i>'}
        </span>
        <span class="elevated-related-body">
          <span class="elevated-related-name">${escapeHtml(c.name)}</span>
          <span class="elevated-related-meta">${escapeHtml(c.region || "")}</span>
        </span>
      </a>
    `,
      )
      .join("");
    if (ui.relatedSection) ui.relatedSection.hidden = false;
  }

  async function fetchRelatedCountries() {
    if (!state.region) {
      renderRelated([]);
      return [];
    }
    try {
      const url = `/api/restcountries/region/${encodeURIComponent(state.region)}?fields=name,cca2,flags,region`;
      const response = await fetch(url);
      if (!response.ok) {
        renderRelated([]);
        return [];
      }
      const data = await response.json();
      const list = (Array.isArray(data) ? data : [])
        .map((row) => ({
          code: canonicalCountryCode(row && (row.cca2 || "")),
          name: String(
            (row && row.name && (row.name.common || row.name.official)) || "",
          ).trim(),
          flag: safeHttps(
            (row && row.flags && (row.flags.png || row.flags.svg)) || "",
          ),
          region: String((row && row.region) || "").trim(),
        }))
        .filter((c) => c.code && c.name && c.code !== state.code)
        .slice(0, 12);
      renderRelated(list);
      return list;
    } catch (_e) {
      renderRelated([]);
      return [];
    }
  }

  /* ---------- Action card & list menu ---------- */
  function updateSaveButton(isSaved) {
    if (!ui.saveBtn) return;
    ui.saveBtn.disabled = !state.code;
    ui.saveBtn.classList.toggle("elevated-btn-saved", !!isSaved);
    ui.saveBtn.classList.toggle("elevated-btn-primary", !isSaved);
    const icon = isSaved ? "fa-solid fa-check" : "fa-solid fa-bookmark";
    const text = isSaved ? "saved" : "add to list";
    ui.saveBtn.innerHTML = `<i class="${icon}"></i><span>${text}</span>`;
    ui.saveBtn.setAttribute("aria-pressed", isSaved ? "true" : "false");
  }

  function openListMenuFromCard() {
    if (ui.saveBtn && window.openIndexStyleListMenu) {
      window.openIndexStyleListMenu(ui.saveBtn);
    }
  }

  function ensureActionCard() {
    if (!ui.actionCard) return;
    ui.actionCard.setAttribute("data-item-id", state.code || "");
    ui.actionCard.setAttribute("data-media-type", "travel");
    const titleEl = ui.actionCard.querySelector(".action-card-title");
    if (titleEl) titleEl.textContent = state.name || "Country";
    const metaEl = ui.actionCard.querySelector(".card-meta");
    if (metaEl)
      metaEl.textContent = [state.region, state.subregion]
        .filter(Boolean)
        .join(" · ");
    const imgEl = ui.actionCard.querySelector("img");
    if (imgEl && state.flag) imgEl.src = state.flag;
  }

  /* ---------- Country loading ---------- */
  function showMissingCodeView() {
    if (ui.guideSection) ui.guideSection.hidden = true;
    if (ui.gallerySection) ui.gallerySection.hidden = true;
    if (ui.relatedSection) ui.relatedSection.hidden = true;
    if (ui.infoGrid)
      ui.infoGrid.innerHTML =
        '<div class="country-fact"><i class="fa-solid fa-earth-americas"></i><div class="country-fact-body"><span class="country-fact-label">Browse</span><span class="country-fact-value">Open the travel page to pick a country</span></div></div>';
  }

  async function loadCountry() {
    if (!state.code) {
      showMissingCodeView();
      return;
    }
    let fetchOk = false;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const controller =
          typeof AbortController !== "undefined" ? new AbortController() : null;
        let timer = null;
        if (controller) timer = setTimeout(() => controller.abort(), 10000);
        const response = await fetch(
          `${REST_COUNTRIES_BASE}/${encodeURIComponent(state.code)}?fields=name,cca2,cca3,capital,region,subregion,flags,languages,currencies,maps`,
          controller ? { signal: controller.signal } : undefined,
        );
        if (timer) clearTimeout(timer);
        if (!response.ok) {
          if (response.status >= 500 && attempt === 0) {
            await new Promise((r) => setTimeout(r, 1000));
            continue;
          }
          return;
        }
        const payload = await response.json();
        if (Array.isArray(payload) && !payload.length) {
          return;
        }
        const row = Array.isArray(payload) ? payload[0] : payload;
        const code = canonicalCountryCode(
          row && (row.cca2 || row.cca3 || state.code),
        );
        state.code = code;

        const name =
          String(
            (row && row.name && (row.name.common || row.name.official)) || code,
          ).trim() || (code === "PS" ? "Palestine" : code);
        const capital = Array.isArray(row && row.capital)
          ? String(row.capital[0] || "").trim()
          : String((row && row.capital) || "").trim();
        const region = String((row && row.region) || "").trim();
        const subregion = String((row && row.subregion) || "").trim();
        const flag =
          safeHttps(
            (row && row.flags && (row.flags.png || row.flags.svg)) || "",
          ) || `https://flagcdn.com/w640/${code.toLowerCase()}.png`;
        const mapsUrl = safeHttps(
          (row && row.maps && row.maps.googleMaps) || "",
        );

        const languagesList =
          row && row.languages && typeof row.languages === "object"
            ? Object.values(row.languages)
                .map((value) => String(value || "").trim())
                .filter(Boolean)
                .slice(0, 4)
            : [];
        const currenciesList =
          row && row.currencies && typeof row.currencies === "object"
            ? Object.keys(row.currencies)
                .map((value) => String(value || "").trim())
                .filter(Boolean)
                .slice(0, 3)
            : [];

        state.name = name;
        state.capital = capital;
        state.region = region;
        state.subregion = subregion;
        state.languages = languagesList;
        state.currencies = currenciesList;
        state.flag = flag;
        state.mapsUrl = mapsUrl;
        fetchOk = true;
        break;
      } catch (e) {
        if (attempt === 0) {
          await new Promise((r) => setTimeout(r, 1000));
          continue;
        }
      }
    }
    if (!fetchOk) {
      return;
    }
    try {
      const config = {
        type: "country",
        title: state.name || "Country",
        posterUrl:
          state.flag ||
          `https://flagcdn.com/w640/${state.code.toLowerCase()}.png`,
        posterFit: "contain",
        backdropUrl: "",
        description: "",
        metadata: [],
        actions: [],
      };

      const parts = [];
      parts.push(
        `${state.name}${state.capital ? `, with ${state.capital} as its capital,` : ""} sits in the ${state.region || "—"}${state.subregion ? ` (${state.subregion})` : ""}.`,
      );
      if (state.languages.length)
        parts.push(
          `Locals speak ${state.languages.slice(0, 2).join(" and ")}.`,
        );
      if (state.currencies.length)
        parts.push(
          `The currency${state.currencies.length > 1 ? "ies" : ""} in use include ${state.currencies.join(", ")}.`,
        );
      parts.push(
        `Browse the travel guide below for city ideas, activity picks, and practical tips. Save your plan and share a review once you've been.`,
      );
      config.description = parts.join(" ");

      if (state.capital)
        config.metadata.push({
          type: "location",
          value: state.capital,
          icon: "fa-solid fa-landmark",
        });
      if (state.region)
        config.metadata.push({
          type: "location",
          value: state.region,
          icon: "fa-solid fa-globe",
        });
      if (state.subregion)
        config.metadata.push({
          type: "location",
          value: state.subregion,
          icon: "fa-solid fa-location-dot",
        });

      config.actions.push({
        id: "countrySaveBtn",
        icon: "fa-solid fa-bookmark",
        label: "save destination",
        primary: true,
      });
      if (state.mapsUrl) {
        config.actions.push({
          id: "countryMapBtn",
          icon: "fa-solid fa-map-location-dot",
          label: "open map",
          href: state.mapsUrl,
        });
      } else {
        config.actions.push({
          id: "countryMapBtn",
          icon: "fa-solid fa-map-location-dot",
          label: "open map",
          href: "travel.html",
        });
      }

      if (window.renderUnifiedMediaHero) {
        const fallbackPhoto = buildCountryPhotoUrl(state.name, state.code);
        if (fallbackPhoto) {
          config.backdropUrl = fallbackPhoto;
        }

        window.renderUnifiedMediaHero(
          document.getElementById("unifiedHeroContainer"),
          config,
        );

        ui.saveBtn = document.getElementById("countrySaveBtn");
        wireSaveButton();

        ui.mapBtn = document.getElementById("countryMapBtn");
      }

      renderInfoGrid();
      renderGuide();
      ensureActionCard();
      updateSaveButton(false);

      renderGallery(countryGalleryCache.get(state.code) || [], state.name);

      void fetchCommonsCountryGallery(state.name, state.code, state.capital)
        .then((images) => {
          const list = Array.isArray(images) ? images : [];
          renderGallery(list, state.name);
        })
        .catch(() => {});

      void fetchRelatedCountries();
    } catch (e) {
      console.warn("Country render error:", e);
    }
  }

  /* ---------- Init ---------- */
  function wireSaveButton() {
    if (!ui.saveBtn) return;
    ui.saveBtn.addEventListener("click", (event) => {
      event.preventDefault();
      if (!state.code) {
        showToast("Pick a country first", "error");
        return;
      }
      openListMenuFromCard();
    });
  }

  async function init() {
    try {
      if (ui.body) ui.body.dataset.elevatedCategory = "travel";
      state.code = canonicalCountryCode(routeCode);

      loadSharedTravelPhotoCache();
      loadCountryGalleryCache();

      if (routeCode === "IL" && state.code === "PS") {
        try {
          const next = new URLSearchParams(window.location.search);
          next.set("code", "PS");
          const query = next.toString();
          window.history.replaceState(
            {},
            "",
            `${window.location.pathname}${query ? `?${query}` : ""}`,
          );
        } catch (_e) {}
      }

      wireSaveButton();

      await loadCountry();
      await initAuth();
    } catch (err) {
      console.error("Country page init failed:", err);
      showToast("Unable to load country details.", "error");
    }
  }

  init();
})();
