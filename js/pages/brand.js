(() => {
  const supabaseConfig = window.__ZO2Y_SUPABASE_CONFIG || {};
  const SUPABASE_URL =
    String(supabaseConfig.url || "").trim() || "__SUPABASE_URL__";
  const SUPABASE_KEY = String(supabaseConfig.key || "").trim();

  const params = new URLSearchParams(window.location.search);
  const brandType = String(params.get("type") || "food").toLowerCase();
  const brandIdParam = String(params.get("id") || "").trim();
  const brandTable =
    brandType === "food"
      ? "food_brands"
      : brandType === "car"
        ? "car_brands"
        : "fashion_brands";

  // Apply theme immediately to prevent flash of pink (fashion default)
  if (document.body) {
    document.body.dataset.elevatedCategory = brandType;
  }
  const HOME_DEFAULT_LIST_TABLES = {
    fashion: { table: "list_items", itemField: "item_id", mediaType: "fashion" },
    food: { table: "list_items", itemField: "item_id", mediaType: "food" },
    car: { table: "list_items", itemField: "item_id", mediaType: "car" },
  };

  const CATEGORY_LABEL =
    brandType === "food" ? "Food" : brandType === "car" ? "Cars" : "Fashion";
  const CATEGORY_ICON =
    brandType === "food"
      ? "fa-burger"
      : brandType === "car"
        ? "fa-car"
        : "fa-shirt";

  const dom = {
    body: document.body,
    hero: document.getElementById("brandHero"),
    posterFrame: document.getElementById("brandPosterFrame"),
    logo: document.getElementById("brandLogo"),
    posterFallbackTitle: document.getElementById("brandPosterFallbackTitle"),
    backdrop: document.getElementById("brandBackdrop"),
    backdropBlur: document.getElementById("brandBackdropBlur"),
    kickerLabel: document.getElementById("brandKickerLabel"),
    name: document.getElementById("brandName"),
    meta: document.getElementById("brandMeta"),
    tags: document.getElementById("brandTags"),
    desc: document.getElementById("brandDescription"),
    descToggle: document.getElementById("brandDescriptionToggle"),
    about: document.getElementById("brandAboutBody"),
    aboutToggle: document.getElementById("brandAboutToggle"),
    aboutSource: document.getElementById("brandAboutSource"),
    aboutSection: document.getElementById("brandAboutSection"),
    infoGrid: document.getElementById("brandInfoGrid"),
    social: document.getElementById("brandSocial"),
    socialSection: document.getElementById("brandSocialSection"),
    related: document.getElementById("brandRelated"),
    relatedSection: document.getElementById("brandRelatedSection"),
    relatedSub: document.getElementById("brandRelatedSub"),
    saveBtn: document.getElementById("brandSaveBtn"),
    website: document.getElementById("brandWebsite"),

    actionCard: document.getElementById("brandActionCard"),
    toast: document.getElementById("brandToast"),
  };

  let supabaseClient = null;
  let currentUser = null;
  let brandData = null;

  let wikipediaCache = new Map();
  let socialGuessesLoaded = false;

  function ensureSupabase() {
    if (supabaseClient) return supabaseClient;
    if (window.__ZO2Y_SUPABASE_CLIENT) {
      supabaseClient = window.__ZO2Y_SUPABASE_CLIENT;
      return supabaseClient;
    }
    if (!window.supabase) return null;
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
    window.__ZO2Y_SUPABASE_CLIENT = supabaseClient;
    return supabaseClient;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function showToast(message, level = "info") {
    if (!dom.toast) {
      if (typeof window.showToast === "function") {
        window.showToast(message, level);
        return;
      }
      console.log(message);
      return;
    }
    dom.toast.textContent = message;
    dom.toast.classList.toggle("is-error", level === "error");
    dom.toast.classList.toggle("is-success", level === "success");
    dom.toast.classList.add("show");
    window.clearTimeout(showToast._timer);
    showToast._timer = window.setTimeout(() => {
      dom.toast.classList.remove("show");
    }, 2400);
  }

  const LOGO_CACHE_BUST = "20260713a";

  function resolveLogo(value, domain, name) {
    const direct = String(value || "").trim();
    if (direct) {
      let url;
      if (
        /^https?:\/\//i.test(direct) ||
        direct.startsWith("/") ||
        direct.startsWith("data:")
      ) {
        url = direct;
      } else {
        url = `${SUPABASE_URL}/storage/v1/object/public/brand-logos/${direct}`;
      }
      if (url.indexOf("data:") !== 0 && url.indexOf("?") === -1) {
        url += "?v=" + LOGO_CACHE_BUST;
      }
      return url;
    }
    const title = String(name || "").trim();
    if (title) {
      const params = new URLSearchParams();
      params.set("title", title);
      const dRaw = String(domain || "").trim();
      if (dRaw) params.set("domain", dRaw);
      params.set("mode", "logo");
      return "/api/logo?" + params.toString();
    }
    const domainRaw = String(domain || "").trim();
    const candidate = domainRaw;
    if (!candidate) return "";
    if (/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(candidate)) {
      return (
        "/api/logo?domain=" +
        encodeURIComponent(candidate) +
        "&size=256&mode=logo"
      );
    }
    if (/^https?:\/\//i.test(candidate)) {
      const match = candidate.match(/\/\/([^\/\?]+)/i);
      if (match && match[1])
        return (
          "/api/logo?domain=" +
          encodeURIComponent(match[1]) +
          "&size=256&mode=logo"
        );
      return candidate;
    }
    return "";
  }

  function normalizeBrand(row = {}) {
    return {
      id: String(row.id || row.slug || row.domain || row.name || "").trim(),
      name: String(row.name || row.brand_name || "").trim() || "Brand",
      category: String(row.category || row.type || "").trim(),
      domain: String(row.domain || "").trim(),
      logo: resolveLogo(
        row.logo_url || row.logo,
        row.domain,
        row.name || row.brand_name,
      ),
      description: String(row.description || row.extract || "").trim(),
      country: String(row.country || "").trim(),
      founded: String(row.founded || row.founded_year || "").trim(),
      headquarters: String(row.headquarters || row.hq || "").trim(),
      ceo: String(row.ceo || "").trim(),
      employees: String(row.employees || row.employee_count || "").trim(),
      slug: String(row.slug || "").trim(),
      tags: Array.isArray(row.tags) ? row.tags : [],
    };
  }

  function isUuid(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    );
  }

  const LEGACY_BRAND_ID_ALIASES = {
    fashion: {
      "fashion-nike": "nike.com",
      "fashion-adidas": "adidas.com",
      "fashion-zara": "zara.com",
      "fashion-uniqlo": "uniqlo.com",
      "fashion-hm": "hm.com",
      "fashion-gucci": "gucci.com",
      "fashion-prada": "prada.com",
      "fashion-lv": "louisvuitton.com",
      "fashion-offwhite": "offwhite.com",
      "fashion-supreme": "supremenewyork.com",
    },
    food: {
      "food-mcd": "mcdonalds.com",
      "food-kfc": "kfc.com",
      "food-bk": "burgerking.com",
      "food-subway": "subway.com",
      "food-taco": "tacobell.com",
      "food-starbucks": "starbucks.com",
      "food-dominos": "dominos.com",
      "food-pizzahut": "pizzahut.com",
      "food-chipotle": "chipotle.com",
      "food-shakeshack": "shakeshack.com",
    },
    car: {
      "car-toyota": "toyota.com",
      "car-honda": "honda.com",
      "car-bmw": "bmw.com",
      "car-mercedes": "mercedes-benz.com",
      "car-audi": "audi.com",
      "car-ford": "ford.com",
      "car-chevrolet": "chevrolet.com",
      "car-tesla": "tesla.com",
    },
  };

  function resolveLegacyBrandLookup(rawValue) {
    const safeValue = String(rawValue || "")
      .trim()
      .toLowerCase();
    if (!safeValue) return "";
    return LEGACY_BRAND_ID_ALIASES[brandType]?.[safeValue] || safeValue;
  }

  function supportsHomeLists(mediaType) {
    const type = String(mediaType || "").toLowerCase();
    return type === "fashion" || type === "food" || type === "car";
  }

  function getHomeDefaultListTable(mediaType) {
    const type = String(mediaType || "").toLowerCase();
    return HOME_DEFAULT_LIST_TABLES[type] || null;
  }

  function normalizeHomeDefaultItemId(mediaType, itemId) {
    const type = String(mediaType || "").toLowerCase();
    if (type === "travel") {
      const code = String(itemId || "")
        .trim()
        .toUpperCase();
      return code || null;
    }
    const text = String(itemId || "").trim();
    return text || null;
  }

  async function saveToListFromHome(payload) {
    const result = { ok: false, saved: null };
    const client = await ensureSupabase();
    if (!client) {
      showToast("List service unavailable", "error");
      return result;
    }
    if (!currentUser?.id) {
      window.location.href = "login.html";
      return result;
    }

    const mediaType = String(payload.mediaType || "").toLowerCase();
    const listType = payload.listType;
    const nextSaved =
      typeof payload.nextSaved === "boolean" ? payload.nextSaved : null;
    if (!payload.itemId || !listType) return result;
    if (!supportsHomeLists(mediaType)) {
      showToast("Lists are not available for this media yet.");
      return result;
    }

    const ensureLinkedMediaRecord = async (_itemId) => true;

    try {
      const defaultListTable = getHomeDefaultListTable(mediaType);
      const itemId = normalizeHomeDefaultItemId(mediaType, payload.itemId);

      if (defaultListTable) {
        if (itemId === null) {
          showToast("Could not update list", "error");
          return result;
        }
        const { table, itemField, mediaType } = defaultListTable;

        if (nextSaved === false) {
          const { error: deleteError } = await client
            .from(table)
            .delete()
            .eq("user_id", currentUser.id)
            .eq("media_type", mediaType)
            .eq(itemField, itemId)
            .eq("list_type", listType);
          if (deleteError) {
            showToast("Could not update list", "error");
            return result;
          }
          showToast("Removed from list", "success");
          result.ok = true;
          result.saved = false;
          return result;
        }

        if (nextSaved === true) {
          const ensured = await ensureLinkedMediaRecord(itemId);
          if (!ensured) {
            showToast("Book info is unavailable right now.", "error");
            return result;
          }
          const insertRow = { user_id: currentUser.id, media_type: mediaType, list_type: listType };
          insertRow[itemField] = itemId;
          const { error: insertError } = await client
            .from(table)
            .insert(insertRow);
          if (insertError && String(insertError.code || "") !== "23505") {
            showToast("Could not add to list", "error");
            return result;
          }
          showToast("Added to list", "success");
          result.ok = true;
          result.saved = true;
          return result;
        }

        const { data: existing } = await client
          .from(table)
          .select("id")
          .eq("user_id", currentUser.id)
          .eq("media_type", mediaType)
          .eq(itemField, itemId)
          .eq("list_type", listType)
          .limit(1)
          .maybeSingle();
        if (existing?.id) {
          const { error: deleteError } = await client
            .from(table)
            .delete()
            .eq("id", existing.id);
          if (deleteError) {
            showToast("Could not update list", "error");
            return result;
          }
          showToast("Removed from list", "success");
          result.ok = true;
          result.saved = false;
          return result;
        }

        await ensureLinkedMediaRecord(itemId);
        const insertRow = { user_id: currentUser.id, media_type: mediaType, list_type: listType };
        insertRow[itemField] = itemId;
        const { error: insertError } = await client
          .from(table)
          .insert(insertRow);
        if (insertError && String(insertError.code || "") !== "23505") {
          showToast("Could not add to list", "error");
          return result;
        }
        showToast("Added to list", "success");
        result.ok = true;
        result.saved = true;
        return result;
      }
    } catch (_err) {
      showToast("Could not add to list", "error");
    }
    return result;
  }

  async function toggleDefaultList({ itemId, listType, nextSaved }) {
    return await saveToListFromHome({
      mediaType: brandType,
      itemId,
      listType,
      nextSaved,
    });
  }

  async function loadSession() {
    const client = ensureSupabase();
    if (!client?.auth?.getSession) return null;
    try {
      const { data } = await client.auth.getSession();
      currentUser = data?.session?.user || null;
      return currentUser;
    } catch (_err) {
      return null;
    }
  }

  function setCategoryAccent() {
    if (dom.body) {
      dom.body.dataset.elevatedCategory = brandType;
    }
  }

  function setBrandNameInitials(name) {
    const safe = String(name || "").trim();
    if (!safe) return "?";
    const parts = safe.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return safe.slice(0, 2).toUpperCase();
  }

  function setFallbackInitial(initial) {
    if (dom.posterFrame) {
      dom.posterFrame.style.setProperty(
        "--dt-fallback-initial",
        JSON.stringify(String(initial || "?").toUpperCase()),
      );
    }
  }

  function renderTags(tags) {
    if (!dom.tags) return;
    const list = (Array.isArray(tags) ? tags : [])
      .filter(Boolean)
      .map(String)
      .slice(0, 8);
    if (!list.length) {
      dom.tags.innerHTML = "";
      return;
    }
    dom.tags.innerHTML = list
      .map(
        (tag) => `
      <span class="elevated-tag">${escapeHtml(tag)}</span>
    `,
      )
      .join("");
  }

  function renderInfoGrid(brand, wiki) {
    if (!dom.infoGrid) return;
    const cards = [];
    if (brand.category) {
      cards.push({
        icon: CATEGORY_ICON,
        label: "Category",
        value: escapeHtml(brand.category),
      });
    }
    if (brand.country) {
      cards.push({
        icon: "fa-flag",
        label: "Country",
        value: escapeHtml(brand.country),
      });
    }
    if (brand.headquarters || (wiki && wiki.headquarters)) {
      cards.push({
        icon: "fa-location-dot",
        label: "Headquarters",
        value: escapeHtml(brand.headquarters || wiki.headquarters),
      });
    }
    if (brand.founded) {
      cards.push({
        icon: "fa-calendar",
        label: "Founded",
        value: escapeHtml(brand.founded),
      });
    }
    if (brand.ceo || (wiki && wiki.ceo)) {
      cards.push({
        icon: "fa-user-tie",
        label: brandType === "car" ? "CEO" : "CEO / Founder",
        value: escapeHtml(brand.ceo || wiki.ceo),
      });
    }
    if (brand.employees || (wiki && wiki.employees)) {
      cards.push({
        icon: "fa-users",
        label: "Employees",
        value: escapeHtml(brand.employees || wiki.employees),
      });
    }
    if (brand.domain) {
      cards.push({
        icon: "fa-globe",
        label: "Website",
        value: `<a href="https://${escapeHtml(brand.domain)}" target="_blank" rel="noopener">${escapeHtml(brand.domain)}</a>`,
      });
    }
    if (wiki && wiki.parentCompany) {
      cards.push({
        icon: "fa-building",
        label: "Parent",
        value: escapeHtml(wiki.parentCompany),
      });
    }
    if (wiki && wiki.industry) {
      cards.push({
        icon: "fa-industry",
        label: "Industry",
        value: escapeHtml(wiki.industry),
      });
    }

    if (!cards.length) {
      dom.infoGrid.innerHTML = `
        <div class="elevated-detail-card">
          <span class="elevated-detail-title"><i class="fa-solid fa-circle-info"></i> Status</span>
          <span class="elevated-detail-value">No additional details available yet.</span>
        </div>
      `;
      return;
    }

    dom.infoGrid.innerHTML = cards
      .map(
        (c) => `
      <div class="elevated-detail-card">
        <span class="elevated-detail-title"><i class="fa-solid ${c.icon}"></i> ${escapeHtml(c.label)}</span>
        <span class="elevated-detail-value">${c.value}</span>
      </div>
    `,
      )
      .join("");
  }

  function renderSocial(brand, wiki) {
    if (!dom.social || !dom.socialSection) return;
    const links = [];
    if (brand.domain) {
      links.push({
        href: `https://${brand.domain}`,
        icon: "fa-globe",
        label: brand.domain,
      });
    }
    if (wiki?.socials) {
      wiki.socials.forEach((entry) => {
        if (entry?.href) links.push(entry);
      });
    }
    if (!links.length) {
      dom.socialSection.hidden = true;
      return;
    }
    dom.socialSection.hidden = false;
    dom.social.innerHTML = links
      .slice(0, 6)
      .map(
        (link) => `
      <a href="${escapeHtml(link.href)}" target="_blank" rel="noopener">
        <i class="fa-solid ${escapeHtml(link.icon || "fa-link")}"></i>
        <span>${escapeHtml(link.label || link.href.replace(/^https?:\/\//, ""))}</span>
      </a>
    `,
      )
      .join("");
  }

  async function fetchRelatedBrands(brand) {
    if (!dom.related || !dom.relatedSection) return;
    const client = ensureSupabase();
    if (!client || !brand) {
      dom.relatedSection.hidden = true;
      return;
    }
    try {
      const orFilters = [];
      if (brand.category) orFilters.push(`category.ilike.${brand.category}`);
      if (brand.country) orFilters.push(`country.ilike.${brand.country}`);
      let query = client
        .from(brandTable)
        .select("id,name,slug,domain,logo_url,category,country")
        .neq("id", brand.id)
        .limit(8);
      if (orFilters.length) {
        query = query.or(orFilters.join(","));
      } else {
        query = query.limit(8);
      }
      const { data, error } = await query;
      if (error || !data || !data.length) {
        dom.relatedSection.hidden = true;
        return;
      }
      const siblings = data.slice(0, 6);
      dom.relatedSection.hidden = false;
      if (dom.relatedSub) {
        dom.relatedSub.textContent = brand.category
          ? `More in ${brand.category}`
          : "Similar brands you may like";
      }
      dom.related.innerHTML = siblings
        .map((row) => {
          const name = String(row.name || "Brand");
          const id = String(row.id || row.slug || row.name || "");
          const logo = resolveLogo(
            row.logo_url || row.logo,
            row.domain,
            row.name,
          );
          const sub =
            [row.category, row.country].filter(Boolean).join(" \u00B7 ") ||
            "Brand";
          const href = `brand.html?type=${encodeURIComponent(brandType)}&id=${encodeURIComponent(id)}`;
          return `
          <a class="elevated-related-card" href="${escapeHtml(href)}">
            <span class="elevated-related-thumb">
              ${logo ? `<img src="${escapeHtml(logo)}" alt="${escapeHtml(name)}" loading="lazy" onerror="this.remove();">` : `<i class="fa-solid ${CATEGORY_ICON}" style="color:var(--dt-text-3);font-size:1rem"></i>`}
            </span>
            <span class="elevated-related-body">
              <span class="elevated-related-name">${escapeHtml(name)}</span>
              <span class="elevated-related-meta">${escapeHtml(sub)}</span>
            </span>
          </a>
        `;
        })
        .join("");
    } catch (_err) {
      dom.relatedSection.hidden = true;
    }
  }

  async function fetchWikipedia(brand) {
    if (!brand) return null;
    const name = String(brand.name || "").trim();
    if (!name) return null;
    if (wikipediaCache.has(name)) return wikipediaCache.get(name);

    const wc = window.__zo2yWikiCache;
    if (wc) {
      const cached = await wc.getWiki(name);
      if (cached) {
        wikipediaCache.set(name, cached);
        return cached;
      }
    }

    try {
      let title = "";
      const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(name)}&format=json&origin=*&srlimit=3`;
      const search = await fetch(searchUrl);
      const searchData = await search.json();
      const results = searchData?.query?.search || [];
      if (results.length) {
        const normalized = name.toLowerCase();
        const exact = results.find(
          (r) => String(r.title || "").toLowerCase() === normalized,
        );
        title = exact ? exact.title : results[0].title;
      }
      if (!title) {
        const fbUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(name + " " + CATEGORY_LABEL + " company")}&format=json&origin=*&srlimit=1`;
        const fbRes = await fetch(fbUrl);
        const fbData = await fbRes.json();
        const fbResults = fbData?.query?.search || [];
        if (fbResults.length) title = fbResults[0].title;
      }
      if (!title) {
        const variations = [name, `${name} (company)`, `${name} (${CATEGORY_LABEL})`];
        for (const variation of variations) {
          try {
            const summaryRes = await fetch(
              `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(variation)}`,
            );
            if (summaryRes.ok) {
              const summary = await summaryRes.json();
              if (summary.thumbnail?.source || summary.originalimage?.source) {
                title = variation;
                break;
              }
            }
          } catch (_e) {}
        }
      }
      if (!title) {
        wikipediaCache.set(name, null);
        if (wc) wc.setWiki(name, null);
        return null;
      }
      const summaryRes = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
      );
      const summary = await summaryRes.json();
      const result = {
        title: summary.title || title,
        description: summary.extract || "",
        thumbnail: summary.thumbnail?.source || "",
        heroImage: summary.originalimage?.source || summary.thumbnail?.source || "",
        photoImage: "",
        url: summary.content_urls?.desktop?.page || "",
        wikiSource: title,
      };
      wikipediaCache.set(name, result);
      if (wc) wc.setWiki(name, result);
      return result;
    } catch (_err) {
      wikipediaCache.set(name, null);
      if (wc) wc.setWiki(name, null);
      return null;
    }
  }

  function guessSocialsFromDomain(domain) {
    const root = String(domain || "")
      .replace(/^www\./, "")
      .trim();
    if (!root) return [];
    return [];
  }

  function mergeWikiIntoBrand(brand, wiki) {
    if (!wiki) return brand;
    brand.wiki = wiki;
    if (!brand.description && wiki.description) {
      brand.description = wiki.description;
    }
    if (!brand.headquarters) {
      const match = (wiki.description || "").match(
        /headquarters(?: in|:| is)?\s+(?:located\s+)?(?:in\s+)?([A-Z][\w\s,.-]+?)[.,;]/,
      );
      if (match) brand.headquarters = match[1].trim();
    }
    return brand;
  }

  function hashName(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  const MIN_HERO_SCORE = 15;

  function generateHeroSearchQuery(brandName, brandType) {
    const name = String(brandName || "").trim();
    return name;
  }

  function scoreHeroImage(imageName, brandType, width, height) {
    let score = 0;
    const text = String(imageName || "").toLowerCase().replace(/_/g, " ");

    if (/(official|press|campaign|factory)/.test(text)) score += 50;
    if (/(car|vehicle|burger|pizza|clothing|runway|jersey|stadium|team|meal)/.test(text)) score += 40;
    if (width >= 1200 && height >= 675) score += 20;
    if (/(hero|lineup|racing|editorial|action|celebration|concept)/.test(text)) score += 15;

    // Strict penalties for buildings, signs, and old photos
    if (/(building|headquarters|hq|office|farms|storefront|mall|retail|warehouse|plant|center|centre|exterior|facade|sign|logo)/.test(text)) score -= 200;
    if (/(van|bus|vintage|classic|bw|black_and_white|18\d\d|19[0-6]\d|history|antique|old)/.test(text)) score -= 200;
    if (/(person|founder|ceo|portrait)/.test(text)) score -= 100;

    // Strict category requirements
    if (brandType === "car" || brandType === "cars") {
      if (!/(factory|official|press|concept|lineup|racing)/.test(text)) score -= 50;
    }
    if (brandType === "food") {
      if (!/(pizza|burger|meal|food|chicken|fries|menu|product|hero|shot)/.test(text)) score -= 50;
    }
    if (brandType === "fashion") {
      if (!/(campaign|runway|model|clothing|editorial|collection|lookbook|apparel|photoshoot|show)/.test(text)) score -= 50;
    }

    return score;
  }

  function selectBestHeroImage(images, brandType) {
    let bestImg = null;
    let bestScore = -Infinity;
    if (!images || !images.length) return null;

    for (const img of images) {
      const score = scoreHeroImage(img.title || img.url || "", brandType, img.width || 0, img.height || 0);
      if (score > bestScore) {
        bestScore = score;
        bestImg = img;
      }
    }

    if (bestScore >= MIN_HERO_SCORE) return bestImg;
    return null;
  }

  const HARDCODED_BACKDROPS = {
    // FASHION & FOOTWEAR
    "nike": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=2070&auto=format&fit=crop",
    "adidas": "https://images.unsplash.com/photo-1518002171953-a080ee817e1f?q=80&w=2070&auto=format&fit=crop",
    "asics": "https://images.unsplash.com/photo-1518002171953-a080ee817e1f?q=80&w=2070&auto=format&fit=crop",
    "champion": "https://images.unsplash.com/photo-1518002171953-a080ee817e1f?q=80&w=2070&auto=format&fit=crop",
    "converse": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=2070&auto=format&fit=crop",
    "allbirds": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=2070&auto=format&fit=crop",
    "birkenstock": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=2070&auto=format&fit=crop",
    "clarks": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=2070&auto=format&fit=crop",
    "colehaan": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=2070&auto=format&fit=crop",
    "drmartens": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=2070&auto=format&fit=crop",
    "zara": "https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=2071&auto=format&fit=crop",
    "hm": "https://images.unsplash.com/photo-1489987707023-afc232dce9f2?q=80&w=2070&auto=format&fit=crop",
    "uniqlo": "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=2070&auto=format&fit=crop",
    "boohoo": "https://images.unsplash.com/photo-1489987707023-afc232dce9f2?q=80&w=2070&auto=format&fit=crop",
    "forever21": "https://images.unsplash.com/photo-1489987707023-afc232dce9f2?q=80&w=2070&auto=format&fit=crop",
    "abercrombie": "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=2070&auto=format&fit=crop",
    "ae": "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=2070&auto=format&fit=crop",
    "express": "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=2070&auto=format&fit=crop",
    "cos": "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=2070&auto=format&fit=crop",
    "gucci": "https://images.unsplash.com/photo-1558769132-cb1fac0840db?q=80&w=2070&auto=format&fit=crop",
    "prada": "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=2015&auto=format&fit=crop",
    "louis-vuitton": "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=2069&auto=format&fit=crop",
    "balenciaga": "https://images.unsplash.com/photo-1618355280206-8d69781bbba9?q=80&w=2070&auto=format&fit=crop",
    "supreme": "https://images.unsplash.com/photo-1522337660859-02fbefca4702?q=80&w=2069&auto=format&fit=crop",
    "off-white": "https://images.unsplash.com/photo-1552346154-21d32810baa3?q=80&w=2050&auto=format&fit=crop",
    "bape": "https://images.unsplash.com/photo-1552346154-21d32810baa3?q=80&w=2050&auto=format&fit=crop",
    "canadagoose": "https://images.unsplash.com/photo-1558769132-cb1fac0840db?q=80&w=2070&auto=format&fit=crop",

    // FOOD
    "burger-king": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1899&auto=format&fit=crop",
    "mcdonalds": "https://images.unsplash.com/photo-1626315865239-2ce1338a0f5a?q=80&w=2070&auto=format&fit=crop",
    "wendys": "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?q=80&w=2080&auto=format&fit=crop",
    "shake-shack": "https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=1965&auto=format&fit=crop",
    "whataburger": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1899&auto=format&fit=crop",
    "whitecastle": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1899&auto=format&fit=crop",
    "jackinthebox": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1899&auto=format&fit=crop",
    "culvers": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1899&auto=format&fit=crop",
    "sonicdrivein": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1899&auto=format&fit=crop",
    
    "dominos": "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=2070&auto=format&fit=crop",
    "pizza-hut": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=1981&auto=format&fit=crop",
    "papajohns": "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=2070&auto=format&fit=crop",
    "littlecaesars": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=1981&auto=format&fit=crop",
    
    "kfc": "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?q=80&w=2070&auto=format&fit=crop",
    "chick-fil-a": "https://images.unsplash.com/photo-1606755962773-d324e0a13086?q=80&w=1887&auto=format&fit=crop",
    "popeyes": "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?q=80&w=2070&auto=format&fit=crop",
    "raisingcanes": "https://images.unsplash.com/photo-1606755962773-d324e0a13086?q=80&w=1887&auto=format&fit=crop",
    "wingstop": "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?q=80&w=2070&auto=format&fit=crop",
    "buffalowildwings": "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?q=80&w=2070&auto=format&fit=crop",
    "zaxbys": "https://images.unsplash.com/photo-1606755962773-d324e0a13086?q=80&w=1887&auto=format&fit=crop",
    "txchicken": "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?q=80&w=2070&auto=format&fit=crop",
    "nandos": "https://images.unsplash.com/photo-1606755962773-d324e0a13086?q=80&w=1887&auto=format&fit=crop",
    
    "taco-bell": "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?q=80&w=1980&auto=format&fit=crop",
    "tacobell": "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?q=80&w=1980&auto=format&fit=crop",
    "chipotle": "https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?q=80&w=2071&auto=format&fit=crop",
    "torchystacos": "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?q=80&w=1980&auto=format&fit=crop",
    
    "subway": "https://images.unsplash.com/photo-1619881589316-56c7f9e6b587?q=80&w=1974&auto=format&fit=crop",
    "arbys": "https://images.unsplash.com/photo-1619881589316-56c7f9e6b587?q=80&w=1974&auto=format&fit=crop",
    
    "starbucks": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=2070&auto=format&fit=crop",
    "dunkin": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=2070&auto=format&fit=crop",
    "peets": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=2070&auto=format&fit=crop",
    "timhortons": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=2070&auto=format&fit=crop",
    
    "dairyqueen": "https://images.unsplash.com/photo-1553177595-4de2bb0842b9?q=80&w=2070&auto=format&fit=crop",
    "smoothieking": "https://images.unsplash.com/photo-1553177595-4de2bb0842b9?q=80&w=2070&auto=format&fit=crop",
    
    "pandaexpress": "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=2070&auto=format&fit=crop",
    "wagamama": "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=2070&auto=format&fit=crop",
    "yosushi": "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=2070&auto=format&fit=crop",
    
    "carrabbas": "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=2069&auto=format&fit=crop",
    "chilis": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1974&auto=format&fit=crop",
    "crackerbarrel": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1974&auto=format&fit=crop",
    "dennys": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1974&auto=format&fit=crop",
    "panerabread": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1974&auto=format&fit=crop",
    "sweetgreen": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1974&auto=format&fit=crop",
    "texasroadhouse": "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=2069&auto=format&fit=crop",
    "thecapitalgrille": "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=2069&auto=format&fit=crop",
    "thecheesecakefactory": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1974&auto=format&fit=crop",
    "tljus": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1974&auto=format&fit=crop",
    "redlobster": "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=2069&auto=format&fit=crop",
    "redrobin": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1974&auto=format&fit=crop",
    "zippys": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1974&auto=format&fit=crop",
    "zoeskitchen": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1974&auto=format&fit=crop",

    // CARS
    "bmw": "https://images.unsplash.com/photo-1555099962-4199c345e5dd?q=80&w=2070&auto=format&fit=crop",
    "mercedes-benz": "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?q=80&w=2070&auto=format&fit=crop",
    "audi": "https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?q=80&w=2069&auto=format&fit=crop",
    "porsche": "https://images.unsplash.com/photo-1503376760388-12e3e566ce00?q=80&w=2070&auto=format&fit=crop",
    "tesla": "https://images.unsplash.com/photo-1560958089-b8a1929cea89?q=80&w=2071&auto=format&fit=crop",
    "lamborghini": "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?q=80&w=2070&auto=format&fit=crop",
    "ferrari": "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?q=80&w=2070&auto=format&fit=crop",
    "bugatti": "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?q=80&w=2070&auto=format&fit=crop",
    "mclaren": "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?q=80&w=2070&auto=format&fit=crop",
    "maserati": "https://images.unsplash.com/photo-1555099962-4199c345e5dd?q=80&w=2070&auto=format&fit=crop",
    "rolls-roycemotorcars": "https://images.unsplash.com/photo-1555099962-4199c345e5dd?q=80&w=2070&auto=format&fit=crop",
    
    "lucidmotors": "https://images.unsplash.com/photo-1560958089-b8a1929cea89?q=80&w=2071&auto=format&fit=crop",
    "nio": "https://images.unsplash.com/photo-1560958089-b8a1929cea89?q=80&w=2071&auto=format&fit=crop",
    "polestar": "https://images.unsplash.com/photo-1560958089-b8a1929cea89?q=80&w=2071&auto=format&fit=crop",
    "rimac-automobili": "https://images.unsplash.com/photo-1560958089-b8a1929cea89?q=80&w=2071&auto=format&fit=crop",
    "rivian": "https://images.unsplash.com/photo-1560958089-b8a1929cea89?q=80&w=2071&auto=format&fit=crop",
    "xiaopeng": "https://images.unsplash.com/photo-1560958089-b8a1929cea89?q=80&w=2071&auto=format&fit=crop",
    "zeekrlife": "https://images.unsplash.com/photo-1560958089-b8a1929cea89?q=80&w=2071&auto=format&fit=crop",
    "vinfast": "https://images.unsplash.com/photo-1560958089-b8a1929cea89?q=80&w=2071&auto=format&fit=crop",

    "ford": "https://images.unsplash.com/photo-1551830116-d86927d3b0d2?q=80&w=2070&auto=format&fit=crop",
    "chevrolet": "https://images.unsplash.com/photo-1551830116-d86927d3b0d2?q=80&w=2070&auto=format&fit=crop",
    "dodge": "https://images.unsplash.com/photo-1551830116-d86927d3b0d2?q=80&w=2070&auto=format&fit=crop",
    
    "ramtrucks": "https://images.unsplash.com/photo-1559416523-140ddc3d238c?q=80&w=2069&auto=format&fit=crop",
    "westernstartrucks": "https://images.unsplash.com/photo-1559416523-140ddc3d238c?q=80&w=2069&auto=format&fit=crop",
    "scania": "https://images.unsplash.com/photo-1559416523-140ddc3d238c?q=80&w=2069&auto=format&fit=crop",

    "jeep": "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=2070&auto=format&fit=crop",
    "mahindra": "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=2070&auto=format&fit=crop",
    
    "honda": "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=2070&auto=format&fit=crop",
    "toyota": "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=2070&auto=format&fit=crop",
    "hyundai": "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=2070&auto=format&fit=crop",
    "kia": "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=2070&auto=format&fit=crop",
    "mazda": "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=2070&auto=format&fit=crop",
    "nissan": "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=2070&auto=format&fit=crop",
    "subaru": "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=2070&auto=format&fit=crop",
    "volkswagen": "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=2070&auto=format&fit=crop",
    "fiat": "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=2070&auto=format&fit=crop",
    "peugeot": "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=2070&auto=format&fit=crop",
    "renault": "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=2070&auto=format&fit=crop",
    "citroen": "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=2070&auto=format&fit=crop",
    "opel": "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=2070&auto=format&fit=crop",
    "skoda-auto": "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=2070&auto=format&fit=crop",
    "seat": "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=2070&auto=format&fit=crop",
    "dacia": "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=2070&auto=format&fit=crop",
    "chrysler": "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=2070&auto=format&fit=crop",
    "buick": "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=2070&auto=format&fit=crop",
    "cadillac": "https://images.unsplash.com/photo-1555099962-4199c345e5dd?q=80&w=2070&auto=format&fit=crop",
    "lincoln": "https://images.unsplash.com/photo-1555099962-4199c345e5dd?q=80&w=2070&auto=format&fit=crop",
    "lexus": "https://images.unsplash.com/photo-1555099962-4199c345e5dd?q=80&w=2070&auto=format&fit=crop",
    "acura": "https://images.unsplash.com/photo-1555099962-4199c345e5dd?q=80&w=2070&auto=format&fit=crop",
    "genesis": "https://images.unsplash.com/photo-1555099962-4199c345e5dd?q=80&w=2070&auto=format&fit=crop",
    "jaguar": "https://images.unsplash.com/photo-1555099962-4199c345e5dd?q=80&w=2070&auto=format&fit=crop",
    "volvocars": "https://images.unsplash.com/photo-1555099962-4199c345e5dd?q=80&w=2070&auto=format&fit=crop",
    "abarth": "https://images.unsplash.com/photo-1551830116-d86927d3b0d2?q=80&w=2070&auto=format&fit=crop",
    "changan": "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=2070&auto=format&fit=crop",
    "geely": "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=2070&auto=format&fit=crop",
    "saicmotor": "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=2070&auto=format&fit=crop",
    "tatamotors": "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=2070&auto=format&fit=crop",
    "proton": "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=2070&auto=format&fit=crop",
    "daihatsu": "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=2070&auto=format&fit=crop",
    "isuzu": "https://images.unsplash.com/photo-1559416523-140ddc3d238c?q=80&w=2069&auto=format&fit=crop",
    "lancia": "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=2070&auto=format&fit=crop",
    "mini": "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=2070&auto=format&fit=crop",
    "smart": "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=2070&auto=format&fit=crop",
    "saab": "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=2070&auto=format&fit=crop",
    "vauxhall": "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=2070&auto=format&fit=crop"
  };

  let brandCoversCache = null;
  async function getBrandCovers() {
    if (brandCoversCache !== null) return brandCoversCache;
    try {
      const res = await fetch("/assets/data/brand_covers.json?v=" + LOGO_CACHE_BUST);
      if (res.ok) {
        brandCoversCache = await res.json();
        return brandCoversCache;
      }
    } catch(e) {}
    brandCoversCache = {};
    return brandCoversCache;
  }

  async function fetchWikiHeroBackdrop(brand) {
    const covers = await getBrandCovers();
    if (brand.id && covers[brand.id]) {
      return covers[brand.id];
    }

    const wikiTitle = brand.wiki?.title || brand.name;
    if (!wikiTitle) return "";

    const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(wikiTitle)}&generator=images&gimlimit=50&prop=imageinfo&iiprop=url|size&iiurlwidth=1200&format=json&origin=*`;
    try {
      const res = await fetch(url);
      if (!res.ok) return "";
      const data = await res.json();
      if (!data?.query?.pages) return "";

      const candidates = [];
      Object.values(data.query.pages).forEach((p) => {
        const info = p.imageinfo && p.imageinfo[0];
        if (info && (info.thumburl || info.url)) {
          candidates.push({
            title: p.title,
            url: info.thumburl || info.url,
            width: info.thumbwidth || info.width || 0,
            height: info.thumbheight || info.height || 0,
          });
        }
      });

      const best = selectBestHeroImage(candidates, brandType);
      return best ? best.url : "";
    } catch (_e) {
      return "";
    }
  }

  let brandHeroConfig = null;

  function renderBrandHeroConfig(brand, wiki) {
    brandHeroConfig = {
      type: brandType,
      title: brand.name || "Brand",
      description: brand.description || "",
      posterUrl: brand.logo || "/newlogo.webp?v=" + LOGO_CACHE_BUST,
      posterFit: "contain",
      backdropUrl: "",
      metadata: [],
      tags: [],
      actions: [],
    };

    brandHeroConfig.backdropUrl = brand.heroBackdropUrl || "";

    if (brand.category)
      brandHeroConfig.metadata.push({ type: "genre", value: brand.category });
    if (brand.country)
      brandHeroConfig.metadata.push({
        type: "globe",
        value: brand.country,
        icon: "fa-solid fa-flag",
      });
    if (brand.founded)
      brandHeroConfig.metadata.push({
        type: "year",
        value: `founded ${brand.founded}`,
        icon: "fa-solid fa-calendar",
      });
    if (brand.headquarters)
      brandHeroConfig.metadata.push({
        type: "location",
        value: brand.headquarters,
        icon: "fa-solid fa-location-dot",
      });

    if (Array.isArray(brand.tags)) {
      brandHeroConfig.tags = brand.tags.slice(0, 8);
    }

    brandHeroConfig.actions.push({
      id: "brandSaveBtn",
      icon: "fa-solid fa-bookmark",
      label: "save to list",
      primary: true,
    });
    if (brand.domain) {
      brandHeroConfig.actions.push({
        id: "brandWebsite",
        icon: "fa-solid fa-arrow-up-right-from-square",
        label: "visit website",
        href: `https://${brand.domain}`,
      });
    }

    if (window.renderUnifiedMediaHero) {
      window.renderUnifiedMediaHero(
        document.getElementById("unifiedHeroContainer"),
        brandHeroConfig,
      );

    }
  }

  function updateHero(brand) {
    setCategoryAccent();
    document.body.dataset.navPage = brandType;
    document.title = `${brand.name} \u00B7 ${CATEGORY_LABEL} \u00B7 Zo2y`;

    if (dom.about) {
      dom.about.textContent =
        brand.description || "This brand does not have a bio yet.";
    }

    renderBrandHeroConfig(brand, null);
  }

  function loadGallery(brand) {
    if (!dom.gallery || !dom.gallerySection) return;
    if (!brand || !brand.name) {
      dom.gallerySection.hidden = true;
      return;
    }
    const images = [];
    const seen = new Set();
    const pushImage = (src, caption) => {
      if (!src) return;
      if (seen.has(src)) return;
      seen.add(src);
      images.push({ src, caption });
    };
    // 1) Real photo (shoes, car, food, clothing) from Wikipedia page images
    if (brand.wiki?.photoImage) pushImage(brand.wiki.photoImage, brand.name);
    // 2) Wikipedia hero image (large) — often a building/photo of subject
    if (brand.wiki?.heroImage) pushImage(brand.wiki.heroImage, brand.name);
    else if (brand.wiki?.thumbnail) pushImage(brand.wiki.thumbnail, brand.name);
    // 3) Logo as gallery item
    const logoUrl = brand.logo_url || brand.logo;
    const logo = logoUrl ? resolveLogo(logoUrl, brand.domain, brand.name) : "";
    if (logo) pushImage(logo, "logo");

    // 4) Fetch extra photos from the Wikipedia page (non-SVG, non-logo filenames)
    const wikiTitle = brand.wiki?.wikiSource || brand.wiki?.title;
    if (wikiTitle) {
      const imagesUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(wikiTitle)}&prop=images&imlimit=30&format=json&origin=*`;
      fetch(imagesUrl)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!data || !data.query || !data.query.pages) return;
          const pages = Object.values(data.query.pages);
          const titles = [];
          pages.forEach((p) =>
            (p.images || []).forEach((img) => titles.push(img.title || "")),
          );
          const SKIP =
            /logo|icon|wordmark|seal|flag|svg|map\s*of|locator|wikidata|comm\.svg|coat|emblem/i;
          const candidates = titles.filter(
            (t) => /\.(jpg|jpeg|JPG|JPEG|webp|WEBP)$/i.test(t) && !SKIP.test(t),
          );
          const slice = candidates.slice(0, 8);
          if (!slice.length) return;
          return fetch(
            `https://en.wikipedia.org/w/api.php?action=query&titles=${slice.map(encodeURIComponent).join("|")}&prop=imageinfo&iiprop=url|size&iiurlwidth=1200&format=json&origin=*`,
          );
        })
        .then((r) => (r && r.ok ? r.json() : null))
        .then((urlsData) => {
          if (!urlsData || !urlsData.query || !urlsData.query.pages) return;
          const urlPages = Object.values(urlsData.query.pages);
          urlPages.forEach((p) => {
            const info = p.imageinfo && p.imageinfo[0];
            if (info && info.url && info.width >= 400) {
              pushImage(
                info.url,
                p.title
                  ? p.title.replace(/^File:/, "").replace(/\.[^.]+$/, "")
                  : brand.name,
              );
            }
          });
          if (!images.length) return;
          const renderImgs1 = images.slice(0, 12);
          dom.gallery.classList.toggle("has-multiple", renderImgs1.length > 1);
          dom.gallery.innerHTML = renderImgs1
            .map(
              (img, i) => `
            <figure class="elevated-gallery-item" ${i === 0 && renderImgs1.length > 1 ? `data-remaining="${renderImgs1.length - 1}"` : ""} data-index="${i}">
              <img src="${escapeHtml(img.src)}" alt="${escapeHtml(img.caption || brand.name)}" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.parentElement.remove();" />
              ${img.caption ? `<figcaption class="elevated-gallery-item-caption">${escapeHtml(img.caption)}</figcaption>` : ""}
            </figure>
          `,
            )
            .join("");
          dom.gallery.onclick = (e) => {
            const item = e.target.closest(".elevated-gallery-item");
            if (item && window.openGalleryLightbox) {
              window.openGalleryLightbox(
                renderImgs1,
                parseInt(item.getAttribute("data-index") || "0", 10),
              );
            }
          };
        })
        .catch(() => {});
    }
    if (dom.gallerySub)
      dom.gallerySub.textContent = `Photos and visuals of ${brand.name}`;
    dom.gallerySection.hidden = false;
    if (!images.length) {
      dom.gallery.innerHTML = `
        <div class="elevated-gallery-empty">
          <i class="fa-regular fa-image"></i>
          no photos available for this brand yet
        </div>
      `;
      return;
    }
    const renderImgs2 = images.slice(0, 12);
    dom.gallery.classList.toggle("has-multiple", renderImgs2.length > 1);
    dom.gallery.innerHTML = renderImgs2
      .map(
        (img, i) => `
      <figure class="elevated-gallery-item" ${i === 0 && renderImgs2.length > 1 ? `data-remaining="${renderImgs2.length - 1}"` : ""} data-index="${i}">
        <img src="${escapeHtml(img.src)}" alt="${escapeHtml(img.caption || brand.name)}" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.parentElement.remove();" />
        ${img.caption ? `<figcaption class="elevated-gallery-item-caption">${escapeHtml(img.caption)}</figcaption>` : ""}
      </figure>
    `,
      )
      .join("");
    dom.gallery.onclick = (e) => {
      const item = e.target.closest(".elevated-gallery-item");
      if (item && window.openGalleryLightbox) {
        window.openGalleryLightbox(
          renderImgs2,
          parseInt(item.getAttribute("data-index") || "0", 10),
        );
      }
    };
  }

  function openListMenuFromCard() {
    if (dom.actionCard && window.openIndexStyleListMenu) {
      window.openIndexStyleListMenu(dom.actionCard);
    }
  }

  function wireActions() {
    var saveBtn = document.getElementById("brandSaveBtn");
    if (saveBtn && !saveBtn.dataset.zo2yWired) {
      saveBtn.dataset.zo2yWired = "1";
      saveBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        openListMenuFromCard();
      });
    }
  }

  async function fetchBrand() {
    const client = ensureSupabase();
    if (!client) return null;
    const idParam = brandIdParam;
    if (!idParam) return null;
    try {
      let query = client
        .from(brandTable)
        .select("*")
        .limit(1);
      if (isUuid(idParam)) {
        query = query.eq("id", idParam);
      } else {
        query = query.or(
          `id.eq.${idParam},slug.eq.${idParam},domain.eq.${idParam},name.ilike.${idParam}`,
        );
      }
      const { data, error } = await query;
      if (error || !data || !data.length) {
        const legacy = resolveLegacyBrandLookup(idParam);
        if (legacy && legacy !== idParam) {
          const { data: retry } = await client
            .from(brandTable)
            .select("*")
            .or(`id.eq.${legacy},slug.eq.${legacy},domain.eq.${legacy},name.ilike.${legacy}`)
            .limit(1);
          if (retry && retry.length) return normalizeBrand(retry[0]);
        }
        return null;
      }
      return normalizeBrand(data[0]);
    } catch (_err) {
      return null;
    }
  }

  function applyCollageFallback(brand) {
    if (!dom.hero) return;

    dom.hero.classList.add("is-collage");

    // Create collage container
    let collage = dom.hero.querySelector(".elevated-hero-collage");
    if (!collage) {
      collage = document.createElement("div");
      collage.className = "elevated-hero-collage";
      dom.hero.insertBefore(collage, dom.hero.firstChild);
    }

    // Create track for scrolling logos
    let track = collage.querySelector(".elevated-hero-collage-track");
    if (!track) {
      track = document.createElement("div");
      track.className = "elevated-hero-collage-track";
      collage.appendChild(track);
    }

    // Get logo URL - use brand logo or fallback placeholder
    const logoUrl = brand.logo || "/logo-placeholder.svg";

    // Create collage items (36 tiles for a 6x6 grid)
    track.innerHTML = "";
    for (let i = 0; i < 36; i++) {
      const item = document.createElement("div");
      item.className = "elevated-hero-collage-item";
      item.style.backgroundImage = `url("${logoUrl}")`;
      track.appendChild(item);
    }
  }

  async function boot() {
    setCategoryAccent();
    await loadSession();
    wireActions();

    const brand = await fetchBrand();
    if (!brand) {
      if (dom.name) dom.name.textContent = "Brand not found";
      if (dom.desc) dom.desc.textContent = "We could not locate this brand.";
      if (dom.about)
        dom.about.textContent = "Try heading back to the brand list.";
      return;
    }

    brandData = brand;
    updateHero(brand);

    if (dom.actionCard) {
      dom.actionCard.dataset.itemId = brand.id || brand.slug || '';
      dom.actionCard.dataset.mediaType = brandType;
    }
    wireActions();

    renderInfoGrid(brand, null);
    renderSocial(brand, null);

    // Fetch Wikipedia in the background — populate about/info if it returns more
    const wiki = await fetchWikipedia(brand);
    if (wiki) {
      mergeWikiIntoBrand(brand, wiki);
      if (dom.about) {
        dom.about.textContent = wiki.description || brand.description;
      }
      if (dom.aboutSource) {
        dom.aboutSource.innerHTML = `Source: <a href="${escapeHtml(wiki.url)}" target="_blank" rel="noopener">Wikipedia</a>`;
      }
      // Re-render hero with wiki data for backdrop image
      renderBrandHeroConfig(brand, wiki);
      wireActions();
      renderInfoGrid(brand, wiki);
      renderSocial(brand, wiki);
    }
    
    // Also try to fetch dynamic hero image from Wikipedia files
    const backdropUrl = await fetchWikiHeroBackdrop(brand);
    if (backdropUrl) {
      brand.heroBackdropUrl = backdropUrl;
      renderBrandHeroConfig(brand, wiki || null);
      wireActions();
    }

    // Related brands — non-blocking
    fetchRelatedBrands(brand).catch(() => {});

    if (supabaseClient?.auth?.onAuthStateChange) {
      supabaseClient.auth.onAuthStateChange((_event, session) => {
        currentUser = session?.user || null;
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
