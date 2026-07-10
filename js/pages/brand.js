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

  const LOGO_CACHE_BUST = "20260622a";

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
      const domainRaw = String(domain || "").trim();
      if (domainRaw) params.set("domain", domainRaw);
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

  function applyBackdrop(url) {
    if (!url) return;
    const safeUrl = String(url).replace(/"/g, '\\"');
    const style = `url("${safeUrl}") center 20% / cover no-repeat`;
    if (dom.backdrop) {
      dom.backdrop.style.background = style;
    }
    if (dom.backdropBlur) {
      dom.backdropBlur.style.background = style;
    }
    if (dom.hero) {
      dom.hero.classList.remove("is-no-backdrop");
      dom.hero.classList.add("is-loaded");
    }
    const wc = window.__zo2yWikiCache;
    if (wc && typeof wc.preloadImage === "function") {
      try {
        wc.preloadImage(url);
      } catch (_) {}
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
      const categorySearchHint =
        brandType === "fashion" ? " fashion clothing brand" :
        brandType === "food" ? " food restaurant chain" :
        brandType === "car" ? " automobile car manufacturer" : "";
      const enrichedName = name + categorySearchHint;
      const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(enrichedName)}&format=json&origin=*&srlimit=3`;
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
      // Fallback: try with category + "company" if first search found nothing relevant
      if (!title) {
        const fbUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(name + " " + CATEGORY_LABEL + " company")}&format=json&origin=*&srlimit=1`;
        const fbRes = await fetch(fbUrl);
        const fbData = await fbRes.json();
        const fbResults = fbData?.query?.search || [];
        if (fbResults.length) title = fbResults[0].title;
      }
      // Fallback: try REST summary directly with title variations
      if (!title) {
        const variations = [
          name,
          `${name} (company)`,
          `${name} (${CATEGORY_LABEL})`,
        ];
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
          } catch (_e) {
            /* continue */
          }
        }
      }
      // Fallback: try Wikidata P18 image search via SPARQL
      if (!title) {
        try {
          const sparql = `
            SELECT ?item ?itemLabel ?image WHERE {
              ?item rdfs:label "${name}"@en .
              ?item wdt:P18 ?image .
              SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
            } LIMIT 1
          `;
          const sparqlUrl = `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(sparql)}`;
          const sparqlRes = await fetch(sparqlUrl, {
            headers: { "User-Agent": "Zo2yBrandBackdrop/1.0" },
          });
          if (sparqlRes.ok) {
            const sparqlData = await sparqlRes.json();
            const bindings = sparqlData?.results?.bindings || [];
            if (bindings.length) {
              const imageUrl = bindings[0].image?.value;
              if (imageUrl) {
                // Convert Wikimedia Commons URL to direct image URL
                const commonsMatch = imageUrl.match(/\/wiki\/File:(.+)/);
                if (commonsMatch) {
                  const fileName = decodeURIComponent(commonsMatch[1]);
                  const directUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}?width=1600`;
                  const result = {
                    title: name,
                    description: "",
                    thumbnail: directUrl,
                    heroImage: directUrl,
                    photoImage: directUrl,
                    url: imageUrl,
                    wikiSource: name,
                  };
                  wikipediaCache.set(name, result);
                  if (wc) wc.setWiki(name, result);
                  return result;
                }
              }
            }
          }
        } catch (_e) {
          /* Wikidata fallback is best-effort */
        }
      }
      // Fallback: try Wikipedia commons category search
      if (!title) {
        try {
          const _searchType = brandType + " " + (brand.name || "");
          const productHints =
            /food|restaurant|pizza|burger|coffee|tea|snack|bakery|cafe|chocolate|candy|ice.cream|fast.food/i.test(_searchType) ? " food meal" :
            /fashion|clothing|apparel|retail|style/i.test(_searchType) ? " fashion clothing" :
            /car|auto/i.test(_searchType) ? " car vehicle" : "";
          const commonsSearchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(name + productHints)}&srnamespace=6&format=json&origin=*&srlimit=15`;
          const categoryRes = await fetch(commonsSearchUrl);
          if (categoryRes.ok) {
            const categoryData = await categoryRes.json();
            const categoryResults = categoryData?.query?.search || [];
            // Find first jpg/jpeg/webp that isn't a logo
            const COMMONS_SKIP = /logo|icon|wordmark|seal|flag|svg|emblem|badge|crest|monogram|trademark|coat|building|headquarters|hq|factory|plant|office|warehouse|campus|storefront|store|mall|exterior|facade|entrance|architecture|sign|neon|poster|billboard|advertisement|person|people|ceo|founder|portrait|chart|graph|diagram|map/i;
            for (const result of categoryResults) {
              const pageTitle = result.title || "";
              if (/\.(jpg|jpeg|webp)$/i.test(pageTitle) && !COMMONS_SKIP.test(pageTitle)) {
                const fileName = pageTitle.replace(/^File:/, "");
                const directUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}?width=1600`;
                const wikiResult = {
                  title: name,
                  description: "",
                  thumbnail: directUrl,
                  heroImage: directUrl,
                  photoImage: directUrl,
                  url: `https://commons.wikimedia.org/wiki/${encodeURIComponent(pageTitle)}`,
                  wikiSource: name,
                };
                wikipediaCache.set(name, wikiResult);
                if (wc) wc.setWiki(name, wikiResult);
                return wikiResult;
              }
            }
          }
        } catch (_e) {
          /* commons fallback is best-effort */
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
      // Prefer original image for backdrops; fall back to thumbnail
      const heroImage =
        summary.originalimage?.source || summary.thumbnail?.source || "";

      // Look for a real photo (shoes, car, food, clothing) by listing page images
      // and picking the first non-SVG, non-icon image.
      let photoImage = "";
      try {
        const imagesRes = await fetch(
          `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=images&imlimit=40&format=json&origin=*`,
        );
        if (imagesRes.ok) {
          const imagesData = await imagesRes.json();
          const pages = imagesData?.query?.pages
            ? Object.values(imagesData.query.pages)
            : [];
          const titles = [];
          pages.forEach((p) =>
            (p.images || []).forEach((img) => titles.push(img.title || "")),
          );
          // Filter: only jpg/jpeg/webp, exclude .svg, icons, logos, wordmarks
          const SKIP =
            /logo|icon|wordmark|seal|flag|svg|building|headquarters|hq|factory|plant|office|warehouse|campus|exhibit|booth|stand|person|people|ceo|founder|portrait|signature|trademark|monogram|badge|crest|emblem|chart|graph|diagram|map|locator|infographic|protest|rally|crowd|march|demonstration|wall|graffiti|street.*art|mural|urban.*decay|storefront|store|mall|shop.*interior|retail.*space|parking|lobby|reception|interior.*design|architecture|poster|billboard|advertisement|exterior|facade|entrance|door|window|roof|ceiling|floor|tile|brick|concrete|steel|glass|sign|neon|awning|canopy|patio|terrace|balcony|staircase|elevator|corridor|hallway|atrium|lobby|foyer|lobby|garage|drive.*thru|drive.thru|takeout|packaging|box|bag|wrapper|cup|napkin|tray|receipt|uniform|hat|cap|visor|apron|badge|lanyard|id.*card/i;
          const candidates = titles.filter(
            (t) => /\.(jpg|jpeg|JPG|JPEG|webp|WEBP)$/i.test(t) && !SKIP.test(t),
          );
          const combinedType = brandType + " " + (brand.name || "");
          const isFoodBrand = /food|restaurant|pizza|burger|coffee|tea|snack|bakery|cafe|chocolate|candy|ice.cream|fast.food/i.test(combinedType);
          const isFashionBrand = /fashion|clothing|apparel|retail|style/i.test(combinedType);
          const FOOD_BOOST = /food|dish|meal|plate|cuisine|restaurant|cafe|coffee|burger|pizza|sushi|noodle|salad|dessert|cake|bakery|chocolate|drink|beverage|menu|chef|kitchen|cooking|grill|fry|bake|oven|stove|fresh|organic|fruit|vegetable|meat|seafood|recipe|sandwich|fries|chicken|wings|taco|burrito|ramen|steak|bbq|sauce|cheese|bread|pastry|donut|ice.cream|smoothie|milkshake|latte|espresso/i;
          const FASHION_BOOST = /fashion|clothing|apparel|runway|editorial|outfit|dress|denim|leather|cotton|knitwear|textile|wear|collection|couture|garment|jacket|coat|shoe|sneaker|boot|accessori|handbag|watch|jewel|silk|wool|cashmere|lace|fabric|stitch|model|style|portrait|lookbook|mannequin|boutique|atelier/i;
          const PRODUCT_BOOST = /front|side|rear|view|press|show|model|sedan|coupe|suv|truck|hatch|wagon|roadster|convertible|hybrid|electric|gt|racing|race|track|motor|auto|vehicle|\b\d{4}\b/i;
          const ranked = candidates.slice().sort((a, b) => {
            let aScore = 2, bScore = 2;
            if (isFoodBrand) {
              aScore = FOOD_BOOST.test(a) ? 0 : (PRODUCT_BOOST.test(a) ? 1 : 2);
              bScore = FOOD_BOOST.test(b) ? 0 : (PRODUCT_BOOST.test(b) ? 1 : 2);
            } else if (isFashionBrand) {
              aScore = FASHION_BOOST.test(a) ? 0 : (PRODUCT_BOOST.test(a) ? 1 : 2);
              bScore = FASHION_BOOST.test(b) ? 0 : (PRODUCT_BOOST.test(b) ? 1 : 2);
            } else {
              aScore = PRODUCT_BOOST.test(a) ? 0 : 1;
              bScore = PRODUCT_BOOST.test(b) ? 0 : 1;
            }
            return aScore - bScore;
          });
          // Resolve the first 8 candidates to URLs
          const slice = ranked.slice(0, 8);
          if (slice.length) {
            const urlsRes = await fetch(
              `https://en.wikipedia.org/w/api.php?action=query&titles=${slice.map(encodeURIComponent).join("|")}&prop=imageinfo&iiprop=url|size&iiurlwidth=1600&format=json&origin=*`,
            );
            if (urlsRes.ok) {
              const urlsData = await urlsRes.json();
              const urlPages = urlsData?.query?.pages
                ? Object.values(urlsData.query.pages)
                : [];
              // pick the first one that is reasonably large
              for (const p of urlPages) {
                const info = p.imageinfo && p.imageinfo[0];
                if (info && info.url && info.width >= 400) {
                  photoImage = info.url;
                  break;
                }
              }
            }
          }
        }
        // If no good photoImage found, try a product-specific Wikipedia search
        if (!photoImage) {
          try {
            const productSearch =
              isFoodBrand ? `${name} food dish meal` :
              isFashionBrand ? `${name} fashion clothing collection` :
              `${name} car vehicle model`;
            const prodSearchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(productSearch)}&format=json&origin=*&srlimit=5`;
            const prodRes = await fetch(prodSearchUrl);
            if (prodRes.ok) {
              const prodData = await prodRes.json();
              const prodResults = prodData?.query?.search || [];
              for (const r of prodResults) {
                const rTitle = r.title || "";
                if (rTitle.toLowerCase() === title.toLowerCase()) continue;
                try {
                  const rImgRes = await fetch(
                    `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(rTitle)}&prop=images&imlimit=20&format=json&origin=*`,
                  );
                  if (!rImgRes.ok) continue;
                  const rImgData = await rImgRes.json();
                  const rPages = rImgData?.query?.pages ? Object.values(rImgData.query.pages) : [];
                  const rTitles = [];
                  rPages.forEach((p) => (p.images || []).forEach((img) => rTitles.push(img.title || "")));
                  const rCandidates = rTitles.filter(
                    (t) => /\.(jpg|jpeg|webp)$/i.test(t) && !SKIP.test(t) && (isFoodBrand ? FOOD_BOOST.test(t) : isFashionBrand ? FASHION_BOOST.test(t) : PRODUCT_BOOST.test(t)),
                  );
                  if (rCandidates.length) {
                    const rUrlRes = await fetch(
                      `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(rCandidates[0])}&prop=imageinfo&iiprop=url|size&iiurlwidth=1600&format=json&origin=*`,
                    );
                    if (rUrlRes.ok) {
                      const rUrlData = await rUrlRes.json();
                      const rUrlPages = rUrlData?.query?.pages ? Object.values(rUrlData.query.pages) : [];
                      for (const p of rUrlPages) {
                        const info = p.imageinfo && p.imageinfo[0];
                        if (info && info.url && info.width >= 400) {
                          photoImage = info.url;
                          break;
                        }
                      }
                    }
                  }
                  if (photoImage) break;
                } catch (_re) { /* continue */ }
              }
            }
          } catch (_pe) { /* product search is best-effort */ }
        }
      } catch (_e) {
        /* photo lookup is best-effort */
      }

      const result = {
        title: summary.title || title,
        description: summary.extract || "",
        thumbnail: summary.thumbnail?.source || "",
        heroImage,
        photoImage, // a real photo (shoes, car, food, clothing) when available
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

  const CATEGORY_FALLBACK_BACKDROPS = {
    food: [
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1920&q=80",
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1920&q=80",
      "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=1920&q=80",
      "https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=1920&q=80",
      "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=1920&q=80",
      "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1920&q=80",
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1920&q=80",
      "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=1920&q=80",
    ],
    fashion: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&w=1920&q=80",
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1920&q=80",
      "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1920&q=80",
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1920&q=80",
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1920&q=80",
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1920&q=80",
      "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1920&q=80",
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1920&q=80",
    ],
    car: [
      "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=1920&q=80",
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1920&q=80",
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1920&q=80",
      "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1920&q=80",
      "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1920&q=80",
      "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1920&q=80",
      "https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=1920&q=80",
      "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1920&q=80",
    ],
  };

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

    const isLogoUrl = (url) => {
      if (!url) return false;
      const u = String(url).toLowerCase();
      const brandLogo = String(brand.logo || "").toLowerCase();
      if (brandLogo && u.includes(brandLogo)) return true;
      if (u === brandLogo) return true;
      return (
        /logo|icon|wordmark|seal|flag|svg|coat|emblem|badge|crest|monogram|trademark/.test(
          u,
        ) || /\.(svg)$/i.test(u)
      );
    };

    const isBuildingUrl = (url) => {
      if (!url) return false;
      const u = String(url).toLowerCase();
      return /building|headquarters|factory|plant|office|warehouse|campus|exterior|facade|storefront|store|mall|architecture|entrance|lobby|parking|drive.*thru/i.test(u);
    };

    const pickFirstNonLogo = (...candidates) => {
      for (const c of candidates) {
        if (!c) continue;
        if (Array.isArray(c)) {
          const found = c.find((x) => x && !isLogoUrl(x) && !isBuildingUrl(x));
          if (found) return found;
        } else if (!isLogoUrl(c) && !isBuildingUrl(c)) {
          return c;
        }
      }
      return null;
    };

    if (wiki) {
      const heroImg = pickFirstNonLogo(
        wiki.photoImage,
        wiki.heroImage,
        wiki.thumbnail,
      );
      if (heroImg) {
        brandHeroConfig.backdropUrl = heroImg;
      }
    }

    if (!brandHeroConfig.backdropUrl) {
      const arr = CATEGORY_FALLBACK_BACKDROPS[brandType] || CATEGORY_FALLBACK_BACKDROPS.food;
      brandHeroConfig.backdropUrl = arr[hashName(brand.name || "") % arr.length];
    }

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

  async function applyWikipediaBackdrop(brand) {
    if (!brand) return;
    const wiki = await fetchWikipedia(brand);
    if (!wiki) return;
    mergeWikiIntoBrand(brand, wiki);
    if (wiki.thumbnail) {
      applyBackdrop(wiki.thumbnail);
    } else if (wiki.url) {
      // Try to fetch a Wikipedia image via REST summary
      try {
        const title = wiki.wikiSource || wiki.title;
        if (title) {
          const summaryRes = await fetch(
            `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
          );
          if (summaryRes.ok) {
            const summary = await summaryRes.json();
            const image =
              summary.originalimage?.source || summary.thumbnail?.source;
            if (image) applyBackdrop(image);
          }
        }
      } catch (_e) {}
    }
    return wiki;
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
