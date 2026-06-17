(() => {
  const supabaseConfig = window.__ZO2Y_SUPABASE_CONFIG || {};
  const SUPABASE_URL = String(supabaseConfig.url || '').trim() || '__SUPABASE_URL__';
  const SUPABASE_KEY = String(supabaseConfig.key || '').trim();

  const params = new URLSearchParams(window.location.search);
  const brandType = String(params.get('type') || 'food').toLowerCase();
  const brandIdParam = String(params.get('id') || '').trim();
  const brandTable = brandType === 'food' ? 'food_brands' : (brandType === 'car' ? 'car_brands' : 'fashion_brands');
  const reviewTable = brandType === 'food' ? 'food_reviews' : (brandType === 'car' ? 'car_reviews' : 'fashion_reviews');

  // Apply theme immediately to prevent flash of pink (fashion default)
  if (document.body) {
    document.body.dataset.elevatedCategory = brandType;
  }
  const HOME_DEFAULT_LIST_TABLES = {
    fashion: { table: 'list_items', itemField: 'external_id' },
    food: { table: 'list_items', itemField: 'external_id' },
    car: { table: 'list_items', itemField: 'external_id' }
  };

  const CATEGORY_LABEL = brandType === 'food' ? 'Food' : brandType === 'car' ? 'Cars' : 'Fashion';
  const CATEGORY_ICON = brandType === 'food' ? 'fa-burger' : brandType === 'car' ? 'fa-car' : 'fa-shirt';

  const dom = {
    body: document.body,
    hero: document.getElementById('brandHero'),
    posterFrame: document.getElementById('brandPosterFrame'),
    logo: document.getElementById('brandLogo'),
    posterFallbackTitle: document.getElementById('brandPosterFallbackTitle'),
    backdrop: document.getElementById('brandBackdrop'),
    backdropBlur: document.getElementById('brandBackdropBlur'),
    kickerLabel: document.getElementById('brandKickerLabel'),
    name: document.getElementById('brandName'),
    meta: document.getElementById('brandMeta'),
    tags: document.getElementById('brandTags'),
    desc: document.getElementById('brandDescription'),
    descToggle: document.getElementById('brandDescriptionToggle'),
    about: document.getElementById('brandAboutBody'),
    aboutToggle: document.getElementById('brandAboutToggle'),
    aboutSource: document.getElementById('brandAboutSource'),
    aboutSection: document.getElementById('brandAboutSection'),
    infoGrid: document.getElementById('brandInfoGrid'),
    social: document.getElementById('brandSocial'),
    socialSection: document.getElementById('brandSocialSection'),
    related: document.getElementById('brandRelated'),
    relatedSection: document.getElementById('brandRelatedSection'),
    relatedSub: document.getElementById('brandRelatedSub'),
    trailer: document.getElementById('brandTrailer'),
    trailerSection: document.getElementById('brandTrailerSection'),
    trailerSub: document.getElementById('brandTrailerSub'),
    gallery: document.getElementById('brandGallery'),
    gallerySection: document.getElementById('brandGallerySection'),
    gallerySub: document.getElementById('brandGallerySub'),
    saveBtn: document.getElementById('brandSaveBtn'),
    website: document.getElementById('brandWebsite'),
    reviewsList: document.getElementById('reviewsList'),
    reviewsStats: document.getElementById('reviewsStats'),
    reviewsCount: document.getElementById('reviewsCount'),
    reviewForm: document.getElementById('review-form'),
    authPrompt: document.getElementById('auth-prompt'),
    sortSelect: document.getElementById('sortSelect'),
    reviewsSortControls: document.getElementById('reviewsSortControls'),
    ratingText: document.getElementById('ratingText'),
    reviewStars: document.getElementById('reviewStars'),
    commentInput: document.getElementById('review-comment'),
    charCount: document.getElementById('charCount'),
    cancelEditBtn: document.querySelector('.cancel-edit-btn'),
    actionCard: document.getElementById('brandActionCard'),
    toast: document.getElementById('brandToast')
  };

  let supabaseClient = null;
  let currentUser = null;
  let brandData = null;
  let currentRating = 0;
  let editingReviewId = null;
  let reviews = [];
  let currentSort = 'latest';
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
        detectSessionInUrl: false
      }
    });
    window.__ZO2Y_SUPABASE_CLIENT = supabaseClient;
    return supabaseClient;
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function showToast(message, level = 'info') {
    if (!dom.toast) {
      if (typeof window.showToast === 'function') {
        window.showToast(message, level);
        return;
      }
      console.log(message);
      return;
    }
    dom.toast.textContent = message;
    dom.toast.classList.toggle('is-error', level === 'error');
    dom.toast.classList.toggle('is-success', level === 'success');
    dom.toast.classList.add('show');
    window.clearTimeout(showToast._timer);
    showToast._timer = window.setTimeout(() => {
      dom.toast.classList.remove('show');
    }, 2400);
  }

  const SUPABASE_STORAGE_BASE = 'https://gfkhjbztayjyojsgdpgk.supabase.co/storage/v1/object/public/brand-logos';

  function resolveLogo(value, domain, name) {
    const domainRaw = String(domain || '').trim();
    if (domainRaw) {
      const bucketType = brandType === 'food' ? 'food_brands' : (brandType === 'car' ? 'car_brands' : 'fashion_brands');
      const slug = domainRaw.replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/.*/, '').replace(/\./g, '-');
      const base = `${SUPABASE_STORAGE_BASE}/${bucketType}/${slug}`;
      if (/\.(jpe?g|png|gif|webp)$/i.test(String(value || ''))) {
        const ext = String(value).match(/\.([a-z0-9]+)$/i)?.[1] || 'png';
        return `${base}.${ext}`;
      }
      return `${base}.svg`;
    }
    const direct = String(value || '').trim();
    if (direct && (direct.startsWith('/') || direct.startsWith('data:'))) {
      return direct;
    }
    return '';
  }

  function normalizeBrand(row = {}) {
    return {
      id: String(row.id || row.slug || row.domain || row.name || '').trim(),
      name: String(row.name || row.brand_name || '').trim() || 'Brand',
      category: String(row.category || row.type || '').trim(),
      domain: String(row.domain || '').trim(),
      logo: resolveLogo(row.logo_url || row.logo, row.domain, row.name || row.brand_name),
      description: String(row.description || row.extract || '').trim(),
      country: String(row.country || '').trim(),
      founded: String(row.founded || row.founded_year || '').trim(),
      headquarters: String(row.headquarters || row.hq || '').trim(),
      ceo: String(row.ceo || '').trim(),
      employees: String(row.employees || row.employee_count || '').trim(),
      slug: String(row.slug || '').trim(),
      tags: Array.isArray(row.tags) ? row.tags : []
    };
  }

  function isUuid(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }

  const LEGACY_BRAND_ID_ALIASES = {
    fashion: {
      'fashion-nike': 'nike.com',
      'fashion-adidas': 'adidas.com',
      'fashion-zara': 'zara.com',
      'fashion-uniqlo': 'uniqlo.com',
      'fashion-hm': 'hm.com',
      'fashion-gucci': 'gucci.com',
      'fashion-prada': 'prada.com',
      'fashion-lv': 'louisvuitton.com',
      'fashion-offwhite': 'offwhite.com',
      'fashion-supreme': 'supremenewyork.com'
    },
    food: {
      'food-mcd': 'mcdonalds.com',
      'food-kfc': 'kfc.com',
      'food-bk': 'burgerking.com',
      'food-subway': 'subway.com',
      'food-taco': 'tacobell.com',
      'food-starbucks': 'starbucks.com',
      'food-dominos': 'dominos.com',
      'food-pizzahut': 'pizzahut.com',
      'food-chipotle': 'chipotle.com',
      'food-shakeshack': 'shakeshack.com'
    },
    car: {
      'car-toyota': 'toyota.com',
      'car-honda': 'honda.com',
      'car-bmw': 'bmw.com',
      'car-mercedes': 'mercedes-benz.com',
      'car-audi': 'audi.com',
      'car-ford': 'ford.com',
      'car-chevrolet': 'chevrolet.com',
      'car-tesla': 'tesla.com'
    }
  };

  function resolveLegacyBrandLookup(rawValue) {
    const safeValue = String(rawValue || '').trim().toLowerCase();
    if (!safeValue) return '';
    return LEGACY_BRAND_ID_ALIASES[brandType]?.[safeValue] || safeValue;
  }

  function supportsHomeLists(mediaType) {
    const type = String(mediaType || '').toLowerCase();
    return type === 'fashion' || type === 'food' || type === 'car';
  }

  function getHomeDefaultListTable(mediaType) {
    const type = String(mediaType || '').toLowerCase();
    return HOME_DEFAULT_LIST_TABLES[type] || null;
  }

  function normalizeHomeDefaultItemId(mediaType, itemId) {
    const type = String(mediaType || '').toLowerCase();
    if (type === 'travel') {
      const code = String(itemId || '').trim().toUpperCase();
      return code || null;
    }
    const text = String(itemId || '').trim();
    return text || null;
  }

  async function saveToListFromHome(payload) {
    const result = { ok: false, saved: null };
    const client = await ensureSupabase();
    if (!client) {
      showToast('List service unavailable', 'error');
      return result;
    }
    if (!currentUser?.id) {
      window.location.href = 'login.html';
      return result;
    }

    const mediaType = String(payload.mediaType || '').toLowerCase();
    const listType = payload.listType;
    const nextSaved = typeof payload.nextSaved === 'boolean' ? payload.nextSaved : null;
    if (!payload.itemId || !listType) return result;
    if (!supportsHomeLists(mediaType)) {
      showToast('Lists are not available for this media yet.');
      return result;
    }

    const ensureLinkedMediaRecord = async (_itemId) => true;

    try {
      const defaultListTable = getHomeDefaultListTable(mediaType);
      const itemId = normalizeHomeDefaultItemId(mediaType, payload.itemId);

      if (defaultListTable) {
        if (itemId === null) {
          showToast('Could not update list', 'error');
          return result;
        }

        const { data: list, error: listError } = await client
          .from('user_lists')
          .select('id')
          .eq('user_id', currentUser.id)
          .eq('category', mediaType)
          .eq('type', listType)
          .maybeSingle();
        if (listError || !list) {
          showToast('Could not update list', 'error');
          return result;
        }

        if (nextSaved === false) {
          const { error: deleteError } = await client
            .from('list_items')
            .delete()
            .eq('list_id', list.id)
            .eq('external_id', String(itemId));
          if (deleteError) {
            showToast('Could not update list', 'error');
            return result;
          }
          showToast('Removed from list', 'success');
          result.ok = true;
          result.saved = false;
          return result;
        }

        if (nextSaved === true) {
          const ensured = await ensureLinkedMediaRecord(itemId);
          if (!ensured) {
            showToast('Book info is unavailable right now.', 'error');
            return result;
          }
          const { error: insertError } = await client
            .from('list_items')
            .insert({ list_id: list.id, external_id: String(itemId), external_source: 'local_db', external_type: mediaType });
          if (insertError && String(insertError.code || '') !== '23505') {
            showToast('Could not add to list', 'error');
            return result;
          }
          showToast('Added to list', 'success');
          result.ok = true;
          result.saved = true;
          return result;
        }

        const { data: existing } = await client
          .from('list_items')
          .select('id')
          .eq('list_id', list.id)
          .eq('external_id', String(itemId))
          .limit(1)
          .maybeSingle();
        if (existing?.id) {
          const { error: deleteError } = await client.from('list_items').delete().eq('id', existing.id);
          if (deleteError) {
            showToast('Could not update list', 'error');
            return result;
          }
          showToast('Removed from list', 'success');
          result.ok = true;
          result.saved = false;
          return result;
        }

        await ensureLinkedMediaRecord(itemId);
        const { error: insertError } = await client
          .from('list_items')
          .insert({ list_id: list.id, external_id: String(itemId), external_source: 'local_db', external_type: mediaType });
        if (insertError && String(insertError.code || '') !== '23505') {
          showToast('Could not add to list', 'error');
          return result;
        }
        showToast('Added to list', 'success');
        result.ok = true;
        result.saved = true;
        return result;
      }
    } catch (_err) {
      showToast('Could not add to list', 'error');
    }
    return result;
  }

  async function toggleDefaultList({ itemId, listType, nextSaved }) {
    return await saveToListFromHome({
      mediaType: brandType,
      itemId,
      listType,
      nextSaved
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
    const safe = String(name || '').trim();
    if (!safe) return '?';
    const parts = safe.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return safe.slice(0, 2).toUpperCase();
  }

  function setFallbackInitial(initial) {
    if (dom.posterFrame) {
      dom.posterFrame.style.setProperty('--dt-fallback-initial', JSON.stringify(String(initial || '?').toUpperCase()));
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
      dom.hero.classList.remove('is-no-backdrop');
      dom.hero.classList.add('is-loaded');
    }
    const wc = window.__zo2yWikiCache;
    if (wc && typeof wc.preloadImage === 'function') {
      try { wc.preloadImage(url); } catch (_) {}
    }
  }

  function bindClampedDescription(pEl, wrapEl, toggleEl) {
    if (!pEl || !wrapEl) return;
    const labelEl = toggleEl ? toggleEl.querySelector('.elevated-readmore-label') : null;
    const apply = () => {
      const overflows = pEl.scrollHeight - pEl.clientHeight > 4;
      if (overflows) {
        pEl.classList.add('is-clamped');
        wrapEl.classList.add('is-clamped');
        if (toggleEl) toggleEl.style.display = '';
        if (labelEl) labelEl.textContent = 'read more';
        if (toggleEl) toggleEl.setAttribute('aria-expanded', 'false');
      } else {
        pEl.classList.remove('is-clamped');
        wrapEl.classList.remove('is-clamped');
        if (toggleEl) toggleEl.style.display = 'none';
      }
    };
    requestAnimationFrame(apply);
    window.addEventListener('resize', apply);
    if (toggleEl) {
      toggleEl.addEventListener('click', () => {
        const expanded = toggleEl.getAttribute('aria-expanded') === 'true';
        const next = !expanded;
        toggleEl.setAttribute('aria-expanded', next ? 'true' : 'false');
        pEl.classList.toggle('is-clamped', !next);
        wrapEl.classList.toggle('is-clamped', !next);
        if (labelEl) labelEl.textContent = next ? 'read less' : 'read more';
      });
    }
  }

  function renderTags(tags) {
    if (!dom.tags) return;
    const list = (Array.isArray(tags) ? tags : []).filter(Boolean).map(String).slice(0, 8);
    if (!list.length) {
      dom.tags.innerHTML = '';
      return;
    }
    dom.tags.innerHTML = list.map((tag) => `
      <span class="elevated-tag">${escapeHtml(tag)}</span>
    `).join('');
  }

  function renderInfoGrid(brand, wiki) {
    if (!dom.infoGrid) return;
    const cards = [];
    if (brand.category) {
      cards.push({ icon: CATEGORY_ICON, label: 'Category', value: escapeHtml(brand.category) });
    }
    if (brand.country) {
      cards.push({ icon: 'fa-flag', label: 'Country', value: escapeHtml(brand.country) });
    }
    if (brand.headquarters || (wiki && wiki.headquarters)) {
      cards.push({ icon: 'fa-location-dot', label: 'Headquarters', value: escapeHtml(brand.headquarters || wiki.headquarters) });
    }
    if (brand.founded) {
      cards.push({ icon: 'fa-calendar', label: 'Founded', value: escapeHtml(brand.founded) });
    }
    if (brand.ceo || (wiki && wiki.ceo)) {
      cards.push({ icon: 'fa-user-tie', label: brandType === 'car' ? 'CEO' : 'CEO / Founder', value: escapeHtml(brand.ceo || wiki.ceo) });
    }
    if (brand.employees || (wiki && wiki.employees)) {
      cards.push({ icon: 'fa-users', label: 'Employees', value: escapeHtml(brand.employees || wiki.employees) });
    }
    if (brand.domain) {
      cards.push({ icon: 'fa-globe', label: 'Website', value: `<a href="https://${escapeHtml(brand.domain)}" target="_blank" rel="noopener">${escapeHtml(brand.domain)}</a>` });
    }
    if (wiki && wiki.parentCompany) {
      cards.push({ icon: 'fa-building', label: 'Parent', value: escapeHtml(wiki.parentCompany) });
    }
    if (wiki && wiki.industry) {
      cards.push({ icon: 'fa-industry', label: 'Industry', value: escapeHtml(wiki.industry) });
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

    dom.infoGrid.innerHTML = cards.map((c) => `
      <div class="elevated-detail-card">
        <span class="elevated-detail-title"><i class="fa-solid ${c.icon}"></i> ${escapeHtml(c.label)}</span>
        <span class="elevated-detail-value">${c.value}</span>
      </div>
    `).join('');
  }

  function renderSocial(brand, wiki) {
    if (!dom.social || !dom.socialSection) return;
    const links = [];
    if (brand.domain) {
      links.push({ href: `https://${brand.domain}`, icon: 'fa-globe', label: brand.domain });
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
    dom.social.innerHTML = links.slice(0, 6).map((link) => `
      <a href="${escapeHtml(link.href)}" target="_blank" rel="noopener">
        <i class="fa-solid ${escapeHtml(link.icon || 'fa-link')}"></i>
        <span>${escapeHtml(link.label || link.href.replace(/^https?:\/\//, ''))}</span>
      </a>
    `).join('');
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
      let query = client.from(brandTable)
        .select('id,name,slug,domain,logo_url,category,country')
        .neq('id', brand.id)
        .limit(8);
      if (orFilters.length) {
        query = query.or(orFilters.join(','));
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
          : 'Similar brands you may like';
      }
      dom.related.innerHTML = siblings.map((row) => {
        const name = String(row.name || 'Brand');
        const id = String(row.id || row.slug || row.name || '');
        const logo = resolveLogo(row.logo_url || row.logo, row.domain, row.name);
        const sub = [row.category, row.country].filter(Boolean).join(' \u00B7 ') || 'Brand';
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
      }).join('');
    } catch (_err) {
      dom.relatedSection.hidden = true;
    }
  }

  async function fetchWikipedia(brand) {
    if (!brand) return null;
    const name = String(brand.name || '').trim();
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
      let title = '';
      // Try just the brand name first (works best for well-known brands)
      const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(name)}&format=json&origin=*&srlimit=3`;
      const search = await fetch(searchUrl);
      const searchData = await search.json();
      const results = searchData?.query?.search || [];
      if (results.length) {
        const normalized = name.toLowerCase();
        const exact = results.find((r) => String(r.title || '').toLowerCase() === normalized);
        title = exact ? exact.title : results[0].title;
      }
      // Fallback: try with category + "company" if first search found nothing relevant
      if (!title) {
        const fbUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(name + ' ' + CATEGORY_LABEL + ' company')}&format=json&origin=*&srlimit=1`;
        const fbRes = await fetch(fbUrl);
        const fbData = await fbRes.json();
        const fbResults = fbData?.query?.search || [];
        if (fbResults.length) title = fbResults[0].title;
      }
      // Fallback: try REST summary directly with title variations
      if (!title) {
        const variations = [name, `${name} (company)`, `${name} (${CATEGORY_LABEL})`];
        for (const variation of variations) {
          try {
            const summaryRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(variation)}`);
            if (summaryRes.ok) {
              const summary = await summaryRes.json();
              if (summary.thumbnail?.source || summary.originalimage?.source) {
                title = variation;
                break;
              }
            }
          } catch (_e) { /* continue */ }
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
            headers: { 'User-Agent': 'Zo2yBrandBackdrop/1.0' }
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
                    description: '',
                    thumbnail: directUrl,
                    heroImage: directUrl,
                    photoImage: directUrl,
                    url: imageUrl,
                    wikiSource: name
                  };
                  wikipediaCache.set(name, result);
                  if (wc) wc.setWiki(name, result);
                  return result;
                }
              }
            }
          }
        } catch (_e) { /* Wikidata fallback is best-effort */ }
      }
      // Fallback: try Wikipedia commons category search
      if (!title) {
        try {
          // Search for commons category with brand name
          const categorySearchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(name + ' logo')}&srnamespace=6&format=json&origin=*&srlimit=5`;
          const categoryRes = await fetch(categorySearchUrl);
          if (categoryRes.ok) {
            const categoryData = await categoryRes.json();
            const categoryResults = categoryData?.query?.search || [];
            // Find first jpg/jpeg/webp image
            for (const result of categoryResults) {
              const pageTitle = result.title || '';
              if (/\.(jpg|jpeg|webp)$/i.test(pageTitle)) {
                const fileName = pageTitle.replace(/^File:/, '');
                const directUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}?width=1600`;
                const wikiResult = {
                  title: name,
                  description: '',
                  thumbnail: directUrl,
                  heroImage: directUrl,
                  photoImage: directUrl,
                  url: `https://commons.wikimedia.org/wiki/${encodeURIComponent(pageTitle)}`,
                  wikiSource: name
                };
                wikipediaCache.set(name, wikiResult);
                if (wc) wc.setWiki(name, wikiResult);
                return wikiResult;
              }
            }
          }
        } catch (_e) { /* commons fallback is best-effort */ }
      }
      if (!title) {
        wikipediaCache.set(name, null);
        if (wc) wc.setWiki(name, null);
        return null;
      }
      const summaryRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
      const summary = await summaryRes.json();
      // Prefer original image for backdrops; fall back to thumbnail
      const heroImage = summary.originalimage?.source || summary.thumbnail?.source || '';

      // Look for a real photo (shoes, car, food, clothing) by listing page images
      // and picking the first non-SVG, non-icon image.
      let photoImage = '';
      try {
        const imagesRes = await fetch(
          `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=images&imlimit=40&format=json&origin=*`
        );
        if (imagesRes.ok) {
          const imagesData = await imagesRes.json();
          const pages = imagesData?.query?.pages ? Object.values(imagesData.query.pages) : [];
          const titles = [];
          pages.forEach((p) => (p.images || []).forEach((img) => titles.push(img.title || '')));
          // Filter: only jpg/jpeg/webp, exclude .svg, icons, logos, wordmarks
          // Also exclude buildings/factories/headquarters/plants/people/CEO for car brands
          // so we prefer actual product photos (the cars themselves).
          const SKIP = /logo|icon|wordmark|seal|flag|svg|building|headquarters|hq|factory|plant|office|warehouse|campus|exhibit|booth|stand|person|people|ceo|founder|portrait|signature|trademark|monogram|badge|crest|emblem|chart|graph|diagram|map|locator|infographic/i;
          const candidates = titles.filter((t) => /\.(jpg|jpeg|JPG|JPEG|webp|WEBP)$/i.test(t) && !SKIP.test(t));
          // For car brands, prefer images that look like product shots (car model names,
          // front/side/rear view, studio shots, press photos). We boost those to the top.
          const PRODUCT_BOOST = /front|side|rear|view|press|show|model|sedan|coupe|suv|truck|hatch|wagon|roadster|convertible|hybrid|electric|gt|racing|race|track|motor|auto|vehicle|\b\d{4}\b/i;
          const ranked = candidates.slice().sort((a, b) => {
            const aScore = PRODUCT_BOOST.test(a) ? 0 : 1;
            const bScore = PRODUCT_BOOST.test(b) ? 0 : 1;
            return aScore - bScore;
          });
          // Resolve the first 8 candidates to URLs
          const slice = ranked.slice(0, 8);
          if (slice.length) {
            const urlsRes = await fetch(
              `https://en.wikipedia.org/w/api.php?action=query&titles=${slice.map(encodeURIComponent).join('|')}&prop=imageinfo&iiprop=url|size&iiurlwidth=1600&format=json&origin=*`
            );
            if (urlsRes.ok) {
              const urlsData = await urlsRes.json();
              const urlPages = urlsData?.query?.pages ? Object.values(urlsData.query.pages) : [];
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
      } catch (_e) { /* photo lookup is best-effort */ }

      const result = {
        title: summary.title || title,
        description: summary.extract || '',
        thumbnail: summary.thumbnail?.source || '',
        heroImage,
        photoImage, // a real photo (shoes, car, food, clothing) when available
        url: summary.content_urls?.desktop?.page || '',
        wikiSource: title
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
    const root = String(domain || '').replace(/^www\./, '').trim();
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
      const match = (wiki.description || '').match(/headquarters(?: in|:| is)?\s+(?:located\s+)?(?:in\s+)?([A-Z][\w\s,.-]+?)[.,;]/);
      if (match) brand.headquarters = match[1].trim();
    }
    return brand;
  }

  function updateHero(brand) {
    setCategoryAccent();
    document.body.dataset.navPage = brandType;
    document.title = `${brand.name} \u00B7 ${CATEGORY_LABEL} \u00B7 Zo2y`;

    const initials = setBrandNameInitials(brand.name);
    setFallbackInitial(initials);
    if (dom.posterFallbackTitle) {
      dom.posterFallbackTitle.textContent = brand.name;
    }
    if (dom.kickerLabel) {
      dom.kickerLabel.textContent = `${brandType} spotlight`;
    }

    if (dom.logo) {
      dom.logo.src = brand.logo || '/newlogo.webp';
      dom.logo.alt = `${brand.name} logo`;
      dom.logo.onerror = () => {
        dom.logo.onerror = null;
        dom.logo.src = '/newlogo.webp';
        if (dom.posterFrame) dom.posterFrame.classList.add('is-missing');
      };
      if (!brand.logo) {
        dom.posterFrame?.classList.add('is-missing');
      } else {
        dom.posterFrame?.classList.remove('is-missing');
      }
    }

    if (dom.name) dom.name.textContent = brand.name;

    const metaItems = [];
    if (brand.category) metaItems.push(`<span class="elevated-meta-item"><i class="fa-solid ${CATEGORY_ICON}"></i> ${escapeHtml(brand.category)}</span>`);
    if (brand.country) metaItems.push(`<span class="elevated-meta-item"><i class="fa-solid fa-flag"></i> ${escapeHtml(brand.country)}</span>`);
    if (brand.founded) metaItems.push(`<span class="elevated-meta-item"><i class="fa-solid fa-calendar"></i> founded ${escapeHtml(brand.founded)}</span>`);
    if (brand.headquarters) metaItems.push(`<span class="elevated-meta-item"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(brand.headquarters)}</span>`);
    if (dom.meta) dom.meta.innerHTML = metaItems.join('');

    renderTags(brand.tags);

    if (dom.desc) {
      dom.desc.textContent = brand.description || 'No description yet.';
      bindClampedDescription(dom.desc, dom.desc?.parentElement, dom.descToggle);
    }

    if (dom.about) {
      dom.about.textContent = brand.description || 'This brand does not have a bio yet.';
      bindClampedDescription(dom.about, dom.about?.parentElement, dom.aboutToggle);
    }

    if (dom.website) {
      if (brand.domain) {
        dom.website.href = `https://${brand.domain}`;
        dom.website.style.display = '';
        if (dom.posterFrame) {
          dom.posterFrame.href = `https://${brand.domain}`;
        }
      } else {
        dom.website.style.display = 'none';
        if (dom.posterFrame) {
          dom.posterFrame.removeAttribute('href');
        }
      }
    }

    if (dom.actionCard) {
      dom.actionCard.setAttribute('data-item-id', brand.id);
      if (brand.logo) dom.actionCard.setAttribute('data-list-image', brand.logo);
      dom.actionCard.querySelector('.card-title')?.replaceChildren(document.createTextNode(brand.name));
      dom.actionCard.querySelector('.card-meta')?.replaceChildren(document.createTextNode(brand.category || CATEGORY_LABEL));
      const img = dom.actionCard.querySelector('img');
      if (img) img.src = brand.logo || '/newlogo.webp';
    }
  }

  async function fetchBrand() {
    if (!brandIdParam) return null;
    const client = ensureSupabase();
    if (!client) return null;
    try {
      let query = client.from(brandTable).select('id,name,slug,domain,logo_url,description,category,country,founded,tags').limit(1);
      if (isUuid(brandIdParam)) {
        query = query.eq('id', brandIdParam);
      } else {
        const safe = resolveLegacyBrandLookup(brandIdParam).replace(/,/g, '');
        query = query.or(`slug.eq.${safe},domain.eq.${safe},name.ilike.%${safe}%`);
      }
      const { data, error } = await query;
      if (error || !data || !data.length) return null;
      return normalizeBrand(data[0]);
    } catch (_err) {
      // Supabase offline / network error — page will fall back to Wikipedia-only
      return null;
    }
  }

  function renderStarRating(rating, options = {}) {
    const raw = Number(rating || 0);
    const safe = Number.isFinite(raw) ? Math.max(0, Math.min(5, raw)) : 0;
    const filled = Math.round(safe);
    const wrapper = options.wrapper !== false;
    let html = wrapper ? `<span class="elevated-review-big-stars" aria-label="${safe.toFixed(1)}/5">` : '';
    for (let i = 0; i < 5; i += 1) {
      html += `<i class="${i < filled ? 'fa-solid' : 'fa-regular'} fa-star" aria-hidden="true"></i>`;
    }
    if (wrapper) html += '</span>';
    return html;
  }

  function updateStarDisplay() {
    const stars = dom.reviewStars ? dom.reviewStars.querySelectorAll('.elevated-star') : [];
    stars.forEach((star) => {
      const starRating = parseInt(star.dataset.rating, 10);
      star.classList.toggle('is-active', starRating <= currentRating);
    });
    const ratingTexts = ['select your rating', 'poor', 'fair', 'good', 'very good', 'excellent'];
    if (dom.ratingText) dom.ratingText.textContent = ratingTexts[currentRating] || ratingTexts[0];
  }

  function renderReviewForm() {
    if (!dom.reviewForm || !dom.authPrompt) return;
    if (!currentUser) {
      dom.reviewForm.style.display = 'none';
      dom.authPrompt.style.display = '';
    } else {
      dom.reviewForm.style.display = '';
      dom.authPrompt.style.display = 'none';
    }
  }

  function renderReviewSummary() {
    if (!dom.reviewsStats) return;
    if (!reviews.length) {
      dom.reviewsStats.innerHTML = `
        <div class="elevated-review-big">
          <div class="elevated-review-big-value">—<span class="elevated-review-big-denom">/5</span></div>
          <div class="elevated-review-big-stars" aria-hidden="true">
            <i class="fa-regular fa-star"></i><i class="fa-regular fa-star"></i><i class="fa-regular fa-star"></i><i class="fa-regular fa-star"></i><i class="fa-regular fa-star"></i>
          </div>
          <div class="elevated-review-big-count">be the first to review</div>
        </div>
        <div class="elevated-review-bars">
          <div class="elevated-review-bar-row"><span class="label">5â˜…</span><div class="elevated-review-bar"><div class="elevated-review-bar-fill" style="width:0%"></div></div><span class="count">0</span></div>
          <div class="elevated-review-bar-row"><span class="label">4â˜…</span><div class="elevated-review-bar"><div class="elevated-review-bar-fill" style="width:0%"></div></div><span class="count">0</span></div>
          <div class="elevated-review-bar-row"><span class="label">3â˜…</span><div class="elevated-review-bar"><div class="elevated-review-bar-fill" style="width:0%"></div></div><span class="count">0</span></div>
          <div class="elevated-review-bar-row"><span class="label">2â˜…</span><div class="elevated-review-bar"><div class="elevated-review-bar-fill" style="width:0%"></div></div><span class="count">0</span></div>
          <div class="elevated-review-bar-row"><span class="label">1â˜…</span><div class="elevated-review-bar"><div class="elevated-review-bar-fill" style="width:0%"></div></div><span class="count">0</span></div>
        </div>
      `;
      if (dom.reviewsCount) dom.reviewsCount.textContent = 'no reviews yet';
      return;
    }

    const totalReviews = reviews.length;
    const average = reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      if (distribution[r.rating] !== undefined) distribution[r.rating] += 1;
    });
    const fivePct = Math.round((distribution[5] / totalReviews) * 100);

    dom.reviewsStats.innerHTML = `
      <div class="elevated-review-big">
        <div class="elevated-review-big-value">${average.toFixed(1)}<span class="elevated-review-big-denom">/5</span></div>
        ${renderStarRating(average)}
        <div class="elevated-review-big-count">${totalReviews} review${totalReviews === 1 ? '' : 's'} \u00B7 ${fivePct}% 5\u2605</div>
      </div>
      <div class="elevated-review-bars">
        ${[5, 4, 3, 2, 1].map((stars) => `
          <div class="elevated-review-bar-row">
            <span class="label">${stars}â˜…</span>
            <div class="elevated-review-bar">
              <div class="elevated-review-bar-fill" style="width:${(distribution[stars] / totalReviews) * 100}%"></div>
            </div>
            <span class="count">${distribution[stars]}</span>
          </div>
        `).join('')}
      </div>
    `;
    if (dom.reviewsCount) {
      dom.reviewsCount.textContent = `${totalReviews} review${totalReviews === 1 ? '' : 's'} \u00B7 ${average.toFixed(1)}/5 average`;
    }
  }

  async function loadReviews() {
    if (!dom.reviewsList || !dom.reviewsStats || !brandData) return;
    const client = ensureSupabase();
    if (!client) return;
    dom.reviewsList.innerHTML = '<div class="elevated-review-loading">Loading reviews…</div>';
    const { data, error } = await client
      .from(reviewTable)
      .select('*')
      .eq('brand_id', brandData.id)
      .order('created_at', { ascending: false });

    if (error) {
      dom.reviewsList.innerHTML = '<div class="elevated-review-empty">Error loading reviews.</div>';
      renderReviewSummary();
      return;
    }

    reviews = data || [];
    renderReviewSummary();
    if (dom.reviewsSortControls) dom.reviewsSortControls.style.display = reviews.length ? 'flex' : 'none';
    sortAndRenderReviews();
  }

  function sortAndRenderReviews() {
    if (!reviews || !reviews.length) return;
    let sorted = [...reviews];
    if (currentSort === 'highest') sorted.sort((a, b) => b.rating - a.rating);
    if (currentSort === 'lowest') sorted.sort((a, b) => a.rating - b.rating);
    displayReviews(sorted);
  }

  async function displayReviews(reviewsToDisplay) {
    if (!dom.reviewsList) return;
    if (!reviewsToDisplay || !reviewsToDisplay.length) {
      dom.reviewsList.innerHTML = '<div class="elevated-review-empty">No reviews yet — be the first to share your thoughts!</div>';
      return;
    }

    const userIds = [...new Set(reviewsToDisplay.map((r) => r.user_id))];
    let userMap = {};
    if (userIds.length && supabaseClient) {
      const { data } = await supabaseClient
        .from('user_profiles')
        .select('id, username, full_name')
        .in('id', userIds);
      (data || []).forEach((user) => {
        userMap[user.id] = user;
      });
    }

    dom.reviewsList.innerHTML = reviewsToDisplay.map((review) => {
      const user = userMap[review.user_id];
      const reviewUsernameRaw = String(review?.username || review?.user_name || '').trim();
      const isAutoUsername = /^user-[a-f0-9]{6,}$/i.test(reviewUsernameRaw);
      const reviewUsername = isAutoUsername ? '' : reviewUsernameRaw;
      const username = String(user?.username || reviewUsername).trim();
      const fallbackName = String(user?.full_name || '').trim();
      const displayName = username ? `@${username}` : (fallbackName || 'User');
      const initialsBase = username || fallbackName || 'User';
      const initials = initialsBase.split(/\s+/).map((n) => n[0]).slice(0, 2).join('').toUpperCase();
      const profileHref = `profile.html?id=${encodeURIComponent(review.user_id)}`;
      const canEditDelete = currentUser && currentUser.id === review.user_id;
      const comment = review.comment || review.review_text || '';
      return `
        <div class="elevated-review-card" id="review-${review.id}" data-review-id="${review.id}">
          <a class="elevated-reviewer-avatar reviewer-link" href="${profileHref}" aria-label="View ${escapeHtml(displayName)} profile">${escapeHtml(initials)}</a>
          <div>
            <a class="elevated-reviewer-name reviewer-link" href="${profileHref}">${escapeHtml(displayName)}</a>
            <div class="elevated-review-date">${new Date(review.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
          </div>
          <div class="elevated-review-rating">${renderStarRating(review.rating)}</div>
          <p class="elevated-review-comment">${escapeHtml(comment)}</p>
          ${canEditDelete ? `
            <div class="elevated-review-actions">
              <button class="review-edit" onclick="editReview('${review.id}')">edit</button>
              <button class="review-delete danger" onclick="deleteReview('${review.id}')">delete</button>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    if (window.ZO2Y_REVIEW_INTERACTIONS && supabaseClient) {
      await window.ZO2Y_REVIEW_INTERACTIONS.mount({
        container: dom.reviewsList,
        reviews: reviewsToDisplay,
        reviewSource: reviewTable,
        mediaType: brandType,
        currentUser,
        supabaseClient,
        notify: (message, level) => showToast(message, level || 'info'),
        cardSelector: '.elevated-review-card',
        reviewIdAttribute: 'data-review-id'
      });
    }
  }

  async function submitReview(e) {
    e.preventDefault();
    if (!currentUser) {
      showToast('Please sign in to submit a review', 'info');
      return;
    }
    const comment = dom.commentInput ? dom.commentInput.value.trim() : '';
    if (!currentRating) {
      showToast('Please select a rating', 'info');
      return;
    }
    const payload = {
      brand_id: brandData.id,
      user_id: currentUser.id,
      rating: currentRating,
      review_text: comment
    };
    let error = null;
    if (editingReviewId) {
      const { error: updateError } = await supabaseClient
        .from(reviewTable)
        .update(payload)
        .eq('id', editingReviewId);
      error = updateError;
    } else {
      const { error: insertError } = await supabaseClient
        .from(reviewTable)
        .insert(payload);
      error = insertError;
    }
    if (error) {
      showToast('Error submitting review', 'error');
      return;
    }
    const wasEditing = !!editingReviewId;
    resetReviewForm();
    await loadReviews();
    if (window.ZO2Y_ANALYTICS && typeof window.ZO2Y_ANALYTICS.track === 'function') {
      window.ZO2Y_ANALYTICS.track('review_saved', { media_type: brandType, is_edit: wasEditing }, { essential: true });
    }
    if (window.ZO2Y_ANALYTICS && typeof window.ZO2Y_ANALYTICS.markFirstAction === 'function') {
      window.ZO2Y_ANALYTICS.markFirstAction('first_review_saved', {}, { essential: true });
    }
    showToast('Review saved', 'success');
  }

  window.editReview = async function (reviewId) {
    if (!supabaseClient) return;
    const { data: review } = await supabaseClient
      .from(reviewTable)
      .select('*')
      .eq('id', reviewId)
      .single();
    if (!review) return;
    editingReviewId = reviewId;
    currentRating = review.rating;
    if (dom.commentInput) dom.commentInput.value = review.comment || review.review_text || '';
    updateStarDisplay();
    const submitText = document.querySelector('.submit-review-btn .btn-text, .elevated-form-actions .btn-text');
    if (submitText) submitText.textContent = 'Update Review';
    if (dom.cancelEditBtn) dom.cancelEditBtn.style.display = '';
  };

  window.deleteReview = async function (reviewId) {
    if (!currentUser) {
      showToast('Please sign in to delete reviews', 'info');
      return;
    }
    if (!window.ProfileManager) return;
    ProfileManager.showConfirmModal('Delete Review', 'Delete this review?', async function() {
    const { error } = await supabaseClient
      .from(reviewTable)
      .delete()
      .eq('id', reviewId);
    if (error) {
      showToast('Error deleting review', 'error');
      return;
    }
    await loadReviews();
    showToast('Review deleted', 'success');
    });
  };

  function resetReviewForm() {
    editingReviewId = null;
    currentRating = 0;
    if (dom.reviewForm) dom.reviewForm.reset();
    updateStarDisplay();
    const submitText = document.querySelector('.submit-review-btn .btn-text, .elevated-form-actions .btn-text');
    if (submitText) submitText.textContent = 'Submit Review';
    if (dom.cancelEditBtn) dom.cancelEditBtn.style.display = 'none';
  }

  async function initReviewSystem() {
    if (!supabaseClient || !brandData) return;
    if (dom.sortSelect) {
      dom.sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        sortAndRenderReviews();
      });
    }
    if (dom.reviewForm) {
      dom.reviewForm.addEventListener('submit', submitReview);
    }
    if (dom.cancelEditBtn) {
      dom.cancelEditBtn.addEventListener('click', () => resetReviewForm());
    }
    if (dom.commentInput) {
      dom.commentInput.addEventListener('input', () => {
        const count = dom.commentInput.value.length;
        if (dom.charCount) dom.charCount.textContent = String(count);
      });
    }
    if (dom.reviewStars) {
      dom.reviewStars.querySelectorAll('.elevated-star').forEach((star) => {
        star.addEventListener('click', () => {
          currentRating = parseInt(star.dataset.rating, 10);
          updateStarDisplay();
        });
      });
    }
    await loadReviews();
  }
  function searchYouTubeForBrand(query) {
    if (!query) return null;
    try {
      const q = encodeURIComponent(String(query));
      return `https://www.youtube.com/results?search_query=${q}`;
    } catch (_e) { return null; }
  }

  function loadTrailer(brand) {
    if (!dom.trailer || !dom.trailerSection) return;
    if (!brand || !brand.name) {
      dom.trailerSection.hidden = true;
      return;
    }
    const query = `${brand.name} ${CATEGORY_LABEL} brand`.trim();
    const searchUrl = searchYouTubeForBrand(query);
    if (dom.trailerSub) dom.trailerSub.textContent = `Watch trailers and videos about ${brand.name}`;
    dom.trailerSection.hidden = false;
    dom.trailer.innerHTML = `
      <div class="elevated-trailer-empty">
        <i class="fa-brands fa-youtube"></i>
        <span>no embedded video available for this brand</span>
        <a class="elevated-trailer-cta" href="${escapeHtml(searchUrl || '#')}" target="_blank" rel="noopener">
          <i class="fa-solid fa-arrow-up-right-from-square"></i> search youtube
        </a>
      </div>
    `;
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
    const logo = logoUrl ? resolveLogo(logoUrl, brand.domain, brand.name) : '';
    if (logo) pushImage(logo, 'logo');

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
          pages.forEach((p) => (p.images || []).forEach((img) => titles.push(img.title || '')));
          const SKIP = /logo|icon|wordmark|seal|flag|svg|map\s*of|locator|wikidata|comm\.svg|coat|emblem/i;
          const candidates = titles.filter((t) => /\.(jpg|jpeg|JPG|JPEG|webp|WEBP)$/i.test(t) && !SKIP.test(t));
          const slice = candidates.slice(0, 8);
          if (!slice.length) return;
          return fetch(
            `https://en.wikipedia.org/w/api.php?action=query&titles=${slice.map(encodeURIComponent).join('|')}&prop=imageinfo&iiprop=url|size&iiurlwidth=1200&format=json&origin=*`
          );
        })
        .then((r) => (r && r.ok ? r.json() : null))
        .then((urlsData) => {
          if (!urlsData || !urlsData.query || !urlsData.query.pages) return;
          const urlPages = Object.values(urlsData.query.pages);
          urlPages.forEach((p) => {
            const info = p.imageinfo && p.imageinfo[0];
            if (info && info.url && info.width >= 400) {
              pushImage(info.url, p.title ? p.title.replace(/^File:/, '').replace(/\.[^.]+$/, '') : brand.name);
            }
          });
          if (!images.length) return;
          dom.gallery.innerHTML = images.slice(0, 12).map((img) => `
            <figure class="elevated-gallery-item">
              <img src="${escapeHtml(img.src)}" alt="${escapeHtml(img.caption || brand.name)}" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.parentElement.remove();" />
              ${img.caption ? `<figcaption class="elevated-gallery-item-caption">${escapeHtml(img.caption)}</figcaption>` : ''}
            </figure>
          `).join('');
        })
        .catch(() => {});
    }
    if (dom.gallerySub) dom.gallerySub.textContent = `Photos and visuals of ${brand.name}`;
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
    dom.gallery.innerHTML = images.slice(0, 12).map((img) => `
      <figure class="elevated-gallery-item">
        <img src="${escapeHtml(img.src)}" alt="${escapeHtml(img.caption || brand.name)}" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.parentElement.remove();" />
        ${img.caption ? `<figcaption class="elevated-gallery-item-caption">${escapeHtml(img.caption)}</figcaption>` : ''}
      </figure>
    `).join('');
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
          const summaryRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
          if (summaryRes.ok) {
            const summary = await summaryRes.json();
            const image = summary.originalimage?.source || summary.thumbnail?.source;
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

  function initMenuBridge() {
    if (typeof window.initIndexStyleListMenu !== 'function') return;
    window.initIndexStyleListMenu({
      mediaType: brandType,
      getCurrentUser: () => currentUser,
      ensureClient: ensureSupabase,
      toggleDefaultList,
      notify: (message, isError) => showToast(message, isError ? 'error' : 'success')
    });
    if (window.ListUtils && typeof window.ListUtils.bindGlobalListUx === 'function') {
      window.ListUtils.bindGlobalListUx();
    }
  }

  function wireActions() {
    if (dom.saveBtn) {
      dom.saveBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        openListMenuFromCard();
      });
    }
  }

  function applyCollageFallback(brand) {
    if (!dom.hero) return;
    
    dom.hero.classList.add('is-collage');
    
    // Create collage container
    let collage = dom.hero.querySelector('.elevated-hero-collage');
    if (!collage) {
      collage = document.createElement('div');
      collage.className = 'elevated-hero-collage';
      dom.hero.insertBefore(collage, dom.hero.firstChild);
    }
    
    // Create track for scrolling logos
    let track = collage.querySelector('.elevated-hero-collage-track');
    if (!track) {
      track = document.createElement('div');
      track.className = 'elevated-hero-collage-track';
      collage.appendChild(track);
    }
    
    // Get logo URL - use brand logo or fallback placeholder
    const logoUrl = brand.logo || '/logo-placeholder.svg';
    
    // Create collage items (36 tiles for a 6x6 grid)
    track.innerHTML = '';
    for (let i = 0; i < 36; i++) {
      const item = document.createElement('div');
      item.className = 'elevated-hero-collage-item';
      item.style.backgroundImage = `url("${logoUrl}")`;
      track.appendChild(item);
    }
  }

  async function boot() {
    setCategoryAccent();
    await loadSession();
    initMenuBridge();
    wireActions();

    const brand = await fetchBrand();
    if (!brand) {
      if (dom.name) dom.name.textContent = 'Brand not found';
      if (dom.desc) dom.desc.textContent = 'We could not locate this brand.';
      if (dom.about) dom.about.textContent = 'Try heading back to the brand list.';
      return;
    }

    brandData = brand;
    updateHero(brand);
    renderInfoGrid(brand, null);
    renderSocial(brand, null);
    renderReviewForm();
    await initReviewSystem();

    // Fetch Wikipedia in the background — populate about/info if it returns more
    const wiki = await fetchWikipedia(brand);
    if (wiki) {
      mergeWikiIntoBrand(brand, wiki);
      if (dom.about) {
        dom.about.textContent = wiki.description || brand.description;
        bindClampedDescription(dom.about, dom.about?.parentElement, dom.aboutToggle);
      }
      if (dom.aboutSource) {
        dom.aboutSource.innerHTML = `Source: <a href="${escapeHtml(wiki.url)}" target="_blank" rel="noopener">Wikipedia</a>`;
      }
      const heroImg = wiki.photoImage || wiki.heroImage || wiki.thumbnail;
      if (heroImg) applyBackdrop(heroImg);
      renderInfoGrid(brand, wiki);
      renderSocial(brand, wiki);
    }

    // Fallback: if no Wikipedia backdrop was found, use the brand logo
    if (!dom.hero?.classList.contains('is-loaded') && brand.logo) {
      applyBackdrop(brand.logo);
    }

    // Final fallback: animated collage if no backdrop at all
    if (!dom.hero?.classList.contains('is-loaded')) {
      applyCollageFallback(brand);
    }

    // Related brands — non-blocking
    fetchRelatedBrands(brand).catch(() => {});

    // Trailer (YouTube search fallback) + Gallery (Wikipedia images)
    loadTrailer(brand);
    loadGallery(brand);

    if (supabaseClient?.auth?.onAuthStateChange) {
      supabaseClient.auth.onAuthStateChange((_event, session) => {
        currentUser = session?.user || null;
        renderReviewForm();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
