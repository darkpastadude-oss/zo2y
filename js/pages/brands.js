(() => {
  const SUPABASE_URL = 'https://gfkhjbztayjyojsgdpgk.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma2hqYnp0YXlqeW9qc2dkcGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwOTYyNjQsImV4cCI6MjA3NTY3MjI2NH0.WUb2yDAwCeokdpWCPeH13FE8NhWF6G8e6ivTsgu6b2s';

  const BRAND_TYPE = String(document.body?.dataset?.brandType || 'fashion').toLowerCase();
  const BRAND_LABEL = BRAND_TYPE === 'food' ? 'Food' : (BRAND_TYPE === 'car' ? 'Cars' : 'Fashion');
  const BRAND_ICON = BRAND_TYPE === 'food' ? 'fa-burger' : (BRAND_TYPE === 'car' ? 'fa-car' : 'fa-shirt');
  const BRAND_TABLE = BRAND_TYPE === 'food' ? 'food_brands' : (BRAND_TYPE === 'car' ? 'car_brands' : 'fashion_brands');
  const HOME_DEFAULT_LIST_TABLES = {
    fashion: { table: 'fashion_list_items', itemField: 'brand_id' },
    food: { table: 'food_list_items', itemField: 'brand_id' },
    car: { table: 'car_list_items', itemField: 'brand_id' }
  };

  const FALLBACKS = BRAND_TYPE === 'food'
    ? [
        { id: 'food-mcd', name: "McDonald's", category: 'Fast Food', domain: 'mcdonalds.com', description: 'American fast-food chain.' },
        { id: 'food-kfc', name: 'KFC', category: 'Fast Food', domain: 'kfc.com', description: 'Fried chicken specialists.' },
        { id: 'food-bk', name: 'Burger King', category: 'Fast Food', domain: 'burgerking.com', description: 'Home of the Whopper.' },
        { id: 'food-subway', name: 'Subway', category: 'Fast Food', domain: 'subway.com', description: 'Sandwich chain.' },
        { id: 'food-taco', name: 'Taco Bell', category: 'Fast Food', domain: 'tacobell.com', description: 'Mexican-inspired fast food.' },
        { id: 'food-starbucks', name: 'Starbucks', category: 'Coffee', domain: 'starbucks.com', description: 'Coffeehouse chain.' },
        { id: 'food-dominos', name: "Domino's", category: 'Pizza', domain: 'dominos.com', description: 'Pizza delivery chain.' },
        { id: 'food-pizzahut', name: 'Pizza Hut', category: 'Pizza', domain: 'pizzahut.com', description: 'Pizza restaurant chain.' }
      ]
    : (BRAND_TYPE === 'car'
      ? [
          { id: 'car-toyota', name: 'Toyota', category: 'Automaker', domain: 'toyota.com', description: 'Global automaker.' },
          { id: 'car-honda', name: 'Honda', category: 'Automaker', domain: 'honda.com', description: 'Japanese automaker.' },
          { id: 'car-bmw', name: 'BMW', category: 'Luxury', domain: 'bmw.com', description: 'German luxury automaker.' },
          { id: 'car-mercedes', name: 'Mercedes-Benz', category: 'Luxury', domain: 'mercedes-benz.com', description: 'German luxury automaker.' },
          { id: 'car-audi', name: 'Audi', category: 'Luxury', domain: 'audi.com', description: 'German luxury automaker.' },
          { id: 'car-ford', name: 'Ford', category: 'Automaker', domain: 'ford.com', description: 'American automaker.' },
          { id: 'car-chevrolet', name: 'Chevrolet', category: 'Automaker', domain: 'chevrolet.com', description: 'American automaker.' },
          { id: 'car-tesla', name: 'Tesla', category: 'EV', domain: 'tesla.com', description: 'Electric vehicle maker.' }
        ]
      : [
          { id: 'fashion-nike', name: 'Nike', category: 'Sportswear', domain: 'nike.com', description: 'Global sportswear brand.' },
          { id: 'fashion-adidas', name: 'Adidas', category: 'Sportswear', domain: 'adidas.com', description: 'Athletic apparel and footwear.' },
          { id: 'fashion-zara', name: 'Zara', category: 'Fast Fashion', domain: 'zara.com', description: 'Spanish fashion retailer.' },
          { id: 'fashion-uniqlo', name: 'Uniqlo', category: 'Basics', domain: 'uniqlo.com', description: 'Japanese casualwear brand.' },
          { id: 'fashion-hm', name: 'H&M', category: 'Fast Fashion', domain: 'hm.com', description: 'Global fashion retailer.' },
          { id: 'fashion-gucci', name: 'Gucci', category: 'Luxury', domain: 'gucci.com', description: 'Italian luxury fashion.' },
          { id: 'fashion-prada', name: 'Prada', category: 'Luxury', domain: 'prada.com', description: 'Luxury fashion house.' },
          { id: 'fashion-lv', name: 'Louis Vuitton', category: 'Luxury', domain: 'louisvuitton.com', description: 'French luxury fashion.' }
        ]);

  const grid = document.getElementById('brandGrid');
  const searchInput = document.getElementById('brandSearch');
  const categorySelect = document.getElementById('brandCategory');
  const countText = document.getElementById('brandCount');
  const spotlight = {
    section: document.getElementById('brandSpotlight'),
    bg: document.getElementById('brandSpotlightBg'),
    kicker: document.getElementById('brandSpotlightKicker'),
    title: document.getElementById('brandSpotlightTitle'),
    meta: document.getElementById('brandSpotlightMeta'),
    summary: document.getElementById('brandSpotlightSummary'),
    logo: document.getElementById('brandSpotlightLogo'),
    open: document.getElementById('brandSpotlightOpen')
  };
  const BRAND_IMAGE_PLACEHOLDER = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' preserveAspectRatio='none'>
      <rect width='24' height='24' fill='#10224a'/>
    </svg>
  `)}`;

  let supabaseClient = null;
  let currentUser = null;
  let allBrands = [];
  let brandImageObserver = null;
  let brandSpotlightTimer = null;
  let brandSpotlightItems = [];
  let brandSpotlightIndex = 0;
  let brandBackgroundManifest = null;
  let brandBackgroundManifestPromise = null;

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
        storageKey: 'zo2y-auth-v1'
      }
    });
    window.__ZO2Y_SUPABASE_CLIENT = supabaseClient;
    return supabaseClient;
  }

  function resolveLogo(value, domain, name) {
    const direct = String(value || '').trim();
    if (direct) {
      if (/^https?:\/\//i.test(direct) || direct.startsWith('/') || direct.startsWith('data:')) {
        return direct;
      }
    }
    const title = String(name || '').trim();
    if (title) {
      const params = new URLSearchParams();
      params.set('title', title);
      const domainRaw = String(domain || '').trim();
      if (domainRaw) params.set('domain', domainRaw);
      params.set('mode', 'logo');
      return '/api/logo?' + params.toString();
    }
    const domainRaw = String(domain || '').trim();
    const candidate = domainRaw;
    if (!candidate) return '';
    if (/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(candidate)) {
      return '/api/logo?domain=' + encodeURIComponent(candidate) + '&size=128&mode=logo';
    }
    if (/^https?:\/\//i.test(candidate)) {
      const match = candidate.match(/\/\/([^\/\?]+)/i);
      if (match && match[1]) return '/api/logo?domain=' + encodeURIComponent(match[1]) + '&size=128&mode=logo';
      return candidate;
    }
    return '';
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function getBrandImageObserver() {
    if (brandImageObserver || typeof window.IntersectionObserver !== 'function') return brandImageObserver;
    brandImageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const img = entry.target;
        observer.unobserve(img);
        const nextSrc = String(img.getAttribute('data-defer-src') || '').trim();
        if (!nextSrc) return;
        img.removeAttribute('data-defer-src');
        img.src = nextSrc;
      });
    }, {
      rootMargin: '260px 0px',
      threshold: 0.01
    });
    return brandImageObserver;
  }

  function primeBrandImages(scope) {
    const root = scope || document;
    const images = Array.from(root.querySelectorAll('img[data-defer-src]'));
    if (!images.length) return;
    const observer = getBrandImageObserver();
    if (!observer) {
      images.forEach((img) => {
        const nextSrc = String(img.getAttribute('data-defer-src') || '').trim();
        if (!nextSrc) return;
        img.removeAttribute('data-defer-src');
        img.src = nextSrc;
      });
      return;
    }
    images.forEach((img) => observer.observe(img));
  }

  function wireBrandImageState(scope) {
    const root = scope || document;
    root.querySelectorAll('.brand-card-logo img').forEach((img) => {
      const wrap = img.closest('.brand-card-logo');
      const markReady = () => {
        img.setAttribute('data-ready', '1');
        if (wrap) wrap.classList.remove('is-loading');
      };
      const handleError = () => {
        const fallback = '/newlogo.webp';
        if (img.src.endsWith(fallback)) {
          markReady();
          return;
        }
        img.removeAttribute('data-defer-src');
        img.src = fallback;
      };
      img.addEventListener('load', markReady);
      img.addEventListener('error', handleError);
      if (img.complete && !img.hasAttribute('data-defer-src')) {
        markReady();
      }
    });
  }

  function showBrandsToast(message, isError = false) {
    if (typeof window.showToast === 'function') {
      window.showToast(message, isError ? 'error' : 'success');
      return;
    }
    if (isError) console.error(message);
    else console.log(message);
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

  function normalizeBrand(row = {}) {
    return {
      id: String(row.id || row.slug || row.domain || row.name || '').trim(),
      name: String(row.name || row.brand_name || '').trim() || 'Brand',
      category: String(row.category || row.type || '').trim(),
      domain: String(row.domain || '').trim(),
      logo: resolveLogo(row.logo_url || row.logo, row.domain, row.name || row.brand_name),
      description: String(row.description || row.extract || '').trim(),
      country: String(row.country || '').trim(),
      founded: String(row.founded || '').trim(),
      slug: String(row.slug || '').trim(),
      tags: Array.isArray(row.tags) ? row.tags : []
    };
  }

  function dedupeBrands(items = []) {
    const map = new Map();
    (Array.isArray(items) ? items : []).forEach((brand) => {
      const domainKey = String(brand.domain || '').trim().toLowerCase();
      const slugKey = String(brand.slug || '').trim().toLowerCase();
      const nameKey = String(brand.name || '').trim().toLowerCase();
      const key = domainKey || slugKey || nameKey;
      if (!key) return;
      const score = (brand.logo ? 2 : 0)
        + (brand.description ? 1 : 0)
        + (brand.country ? 1 : 0);
      if (!map.has(key)) {
        map.set(key, { brand, score });
        return;
      }
      const existing = map.get(key);
      if (score > existing.score) {
        map.set(key, { brand, score });
      }
    });
    return Array.from(map.values()).map((entry) => entry.brand);
  }

  async function ensureBrandBackgroundManifest() {
    if (brandBackgroundManifest) return brandBackgroundManifest;
    if (brandBackgroundManifestPromise) return brandBackgroundManifestPromise;
    const manifestUrl = `${SUPABASE_URL}/storage/v1/object/public/brand-backgrounds/manifest/brand-backgrounds.json`;
    brandBackgroundManifestPromise = fetch(manifestUrl, { headers: { Accept: 'application/json' } })
      .then((response) => response.ok ? response.json() : null)
      .then((payload) => {
        if (!payload || typeof payload !== 'object') return null;
        brandBackgroundManifest = payload;
        return brandBackgroundManifest;
      })
      .catch(() => null)
      .finally(() => { brandBackgroundManifestPromise = null; });
    return brandBackgroundManifestPromise;
  }

  function getBrandSpotlightBackground(brand) {
    const slug = String(brand?.slug || '').trim().toLowerCase();
    const direct = slug && brandBackgroundManifest?.[BRAND_TABLE]
      ? String(brandBackgroundManifest[BRAND_TABLE][slug] || '').trim()
      : '';
    if (direct) return direct;
    const fallbackName = BRAND_TYPE === 'food' ? 'food.jpg' : (BRAND_TYPE === 'car' ? 'cars.jpg' : 'fashion.jpg');
    return `${SUPABASE_URL}/storage/v1/object/public/home-spotlights/${fallbackName}`;
  }

  function normalizeBrandSearch(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function buildBrandSpotlightPool(items = []) {
    const seen = new Set();
    return (Array.isArray(items) ? items : []).filter((brand) => {
      const key = normalizeBrandSearch(brand?.name) || String(brand?.id || '').trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 18);
  }

  function renderBrandSpotlightItem(brand) {
    if (!spotlight.section || !brand) return;
    const background = getBrandSpotlightBackground(brand);
    spotlight.section.hidden = false;
    if (spotlight.bg) {
      spotlight.bg.style.backgroundImage = `linear-gradient(120deg, rgba(8, 14, 31, 0.72), rgba(11, 23, 49, 0.4)), url("${background}")`;
    }
    if (spotlight.kicker) spotlight.kicker.textContent = `${BRAND_LABEL} Spotlight`;
    if (spotlight.title) spotlight.title.textContent = brand.name || BRAND_LABEL;
    if (spotlight.meta) {
      spotlight.meta.textContent = [brand.category, brand.country, brand.founded ? `since ${brand.founded}` : '']
        .filter(Boolean)
        .join(' · ');
    }
    if (spotlight.summary) {
      spotlight.summary.textContent = brand.description || `A standout ${BRAND_LABEL.toLowerCase()} pick from the local catalog.`;
    }
    if (spotlight.logo) {
      spotlight.logo.src = brand.logo || '/newlogo.webp';
      spotlight.logo.alt = `${brand.name || BRAND_LABEL} logo`;
    }
    if (spotlight.open) {
      const id = encodeURIComponent(brand.id || brand.slug || brand.domain || brand.name);
      spotlight.open.href = `brand.html?type=${encodeURIComponent(BRAND_TYPE)}&id=${id}`;
    }
  }

  function resetBrandSpotlightTimer() {
    if (brandSpotlightTimer) clearInterval(brandSpotlightTimer);
    if (brandSpotlightItems.length < 2) return;
    brandSpotlightTimer = window.setInterval(() => {
      brandSpotlightIndex = (brandSpotlightIndex + 1) % brandSpotlightItems.length;
      renderBrandSpotlightItem(brandSpotlightItems[brandSpotlightIndex]);
    }, 6000);
  }

  function updateBrandSpotlight(items = []) {
    if (!spotlight.section) return;
    brandSpotlightItems = buildBrandSpotlightPool(items.length ? items : allBrands);
    brandSpotlightIndex = 0;
    if (!brandSpotlightItems.length) {
      spotlight.section.hidden = true;
      if (brandSpotlightTimer) clearInterval(brandSpotlightTimer);
      return;
    }
    renderBrandSpotlightItem(brandSpotlightItems[0]);
    resetBrandSpotlightTimer();
  }

  async function saveToListFromHome(payload) {
    const result = { ok: false, saved: null };
    const client = await ensureSupabase();
    if (!client) {
      showBrandsToast('List service unavailable', true);
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
      showBrandsToast('Lists are not available for this media yet.');
      return result;
    }

    const ensureLinkedMediaRecord = async (_itemId) => true;

    try {
      const defaultListTable = getHomeDefaultListTable(mediaType);
      const itemId = normalizeHomeDefaultItemId(mediaType, payload.itemId);

      if (defaultListTable) {
        if (itemId === null) {
          showBrandsToast('Could not update list', true);
          return result;
        }
        const { table, itemField } = defaultListTable;

        if (nextSaved === false) {
          const { error: deleteError } = await client
            .from(table)
            .delete()
            .eq('user_id', currentUser.id)
            .eq(itemField, itemId)
            .eq('list_type', listType);
          if (deleteError) {
            showBrandsToast('Could not update list', true);
            return result;
          }
          showBrandsToast('Removed from list');
          result.ok = true;
          result.saved = false;
          return result;
        }

        if (nextSaved === true) {
          const ensured = await ensureLinkedMediaRecord(itemId);
          if (!ensured) {
            showBrandsToast('Book info is unavailable right now.', true);
            return result;
          }
          const insertRow = { user_id: currentUser.id, list_type: listType };
          insertRow[itemField] = itemId;
          const { error: insertError } = await client.from(table).insert(insertRow);
          if (insertError && String(insertError.code || '') !== '23505') {
            showBrandsToast('Could not add to list', true);
            return result;
          }
          showBrandsToast('Added to list');
          result.ok = true;
          result.saved = true;
          return result;
        }

        const { data: existing } = await client
          .from(table)
          .select('id')
          .eq('user_id', currentUser.id)
          .eq(itemField, itemId)
          .eq('list_type', listType)
          .limit(1)
          .maybeSingle();
        if (existing?.id) {
          const { error: deleteError } = await client.from(table).delete().eq('id', existing.id);
          if (deleteError) {
            showBrandsToast('Could not update list', true);
            return result;
          }
          showBrandsToast('Removed from list');
          result.ok = true;
          result.saved = false;
          return result;
        }

        await ensureLinkedMediaRecord(itemId);
        const insertRow = { user_id: currentUser.id, list_type: listType };
        insertRow[itemField] = itemId;
        const { error: insertError } = await client.from(table).insert(insertRow);
        if (insertError && String(insertError.code || '') !== '23505') {
          showBrandsToast('Could not add to list', true);
          return result;
        }
        showBrandsToast('Added to list');
        result.ok = true;
        result.saved = true;
        return result;
      }
    } catch (_err) {
      showBrandsToast('Could not add to list', true);
    }
    return result;
  }

  async function toggleDefaultList({ itemId, listType, nextSaved }) {
    return await saveToListFromHome({
      mediaType: BRAND_TYPE,
      itemId,
      listType,
      nextSaved
    });
  }

  function renderCategories(items = []) {
    if (!categorySelect) return;
    const categories = Array.from(new Set(items.map((b) => b.category).filter(Boolean))).sort();
    categorySelect.innerHTML = `
      <option value="all">All ${escapeHtml(BRAND_LABEL)} Brands</option>
      ${categories.map((cat) => `<option value="${escapeHtml(cat)}">${escapeHtml(cat)}</option>`).join('')}
    `;
  }

  function getFilteredBrands() {
    const search = String(searchInput?.value || '').trim().toLowerCase();
    const category = String(categorySelect?.value || 'all').toLowerCase();
    return allBrands.filter((brand) => {
      if (category !== 'all' && String(brand.category || '').toLowerCase() !== category) return false;
      if (!search) return true;
      return brand.name.toLowerCase().includes(search)
        || brand.category.toLowerCase().includes(search)
        || brand.description.toLowerCase().includes(search)
        || brand.country.toLowerCase().includes(search);
    });
  }

  function updateCount(count) {
    if (countText) {
      countText.textContent = `${count} ${count === 1 ? 'brand' : 'brands'} shown`;
    }
  }

  function createCard(brand) {
    const card = document.createElement('div');
    card.className = 'brand-card card';
    card.setAttribute('data-item-id', brand.id);
    if (brand.logo) card.setAttribute('data-list-image', brand.logo);

    card.innerHTML = `
      <button class="card-menu-btn" aria-label="Add to list">
        <i class="fas fa-ellipsis-v"></i>
      </button>
      <div class="brand-card-logo is-loading">
        <img src="${BRAND_IMAGE_PLACEHOLDER}" data-defer-src="${escapeHtml(brand.logo || '/newlogo.webp')}" data-ready="0" alt="${escapeHtml(brand.name)} logo" loading="lazy" decoding="async" referrerpolicy="no-referrer">
      </div>
      <div class="brand-card-name">${escapeHtml(brand.name)}</div>
      <div class="brand-card-meta">
        ${brand.category ? `<span class="brand-chip">${escapeHtml(brand.category)}</span>` : ''}
        ${brand.country ? `<span>${escapeHtml(brand.country)}</span>` : ''}
      </div>
      <div class="brand-card-desc">${escapeHtml(brand.description || '')}</div>
    `;

    const menuBtn = card.querySelector('.card-menu-btn');
    if (menuBtn) {
      menuBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        if (window.openIndexStyleListMenu) window.openIndexStyleListMenu(card);
      });
    }

    card.addEventListener('click', () => {
      const id = encodeURIComponent(brand.id || brand.slug || brand.domain || brand.name);
      window.location.href = `brand.html?type=${encodeURIComponent(BRAND_TYPE)}&id=${id}`;
    });

    return card;
  }

  function renderGrid() {
    if (!grid) return;
    const filtered = getFilteredBrands();
    grid.innerHTML = '';
    updateCount(filtered.length);
    if (!filtered.length) {
      grid.innerHTML = `<div class="empty-state">No ${escapeHtml(BRAND_LABEL)} brands found.</div>`;
      return;
    }
    const fragment = document.createDocumentFragment();
    filtered.forEach((brand) => fragment.appendChild(createCard(brand)));
    grid.appendChild(fragment);
    wireBrandImageState(grid);
    primeBrandImages(grid);
    updateBrandSpotlight(filtered);
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

  async function loadBrands() {
    if (!grid) return;
    grid.innerHTML = '<div class="empty-state">Loading brands...</div>';
    const client = ensureSupabase();
    if (!client) {
      allBrands = FALLBACKS.map(normalizeBrand);
      renderCategories(allBrands);
      renderGrid();
      return;
    }

    const { data, error } = await client
      .from(BRAND_TABLE)
      .select('id,name,slug,domain,logo_url,description,category,country,founded,tags')
      .order('name', { ascending: true })
      .limit(500);

    if (error || !Array.isArray(data) || !data.length) {
      allBrands = dedupeBrands(FALLBACKS.map(normalizeBrand));
    } else {
      allBrands = dedupeBrands(data.map(normalizeBrand));
    }

    renderCategories(allBrands);
    renderGrid();
    updateBrandSpotlight(getFilteredBrands());
    void ensureBrandBackgroundManifest().then(() => updateBrandSpotlight(getFilteredBrands()));
  }

  function initMenuBridge() {
    if (typeof window.initIndexStyleListMenu !== 'function') return;
    window.initIndexStyleListMenu({
      mediaType: BRAND_TYPE,
      getCurrentUser: () => currentUser,
      ensureClient: ensureSupabase,
      toggleDefaultList,
      notify: (message, isError) => {
        if (typeof window.showToast === 'function') window.showToast(message, isError ? 'error' : 'success');
        else if (isError) console.error(message);
      }
    });
    if (window.ListUtils && typeof window.ListUtils.bindGlobalListUx === 'function') {
      window.ListUtils.bindGlobalListUx();
    }
  }

  function wireEvents() {
    if (searchInput) {
      searchInput.addEventListener('input', renderGrid);
    }
    if (categorySelect) {
      categorySelect.addEventListener('change', renderGrid);
    }
  }

  function initPageMeta() {
    const title = `${BRAND_LABEL} Brands · Zo2y`;
    document.title = title;
    const titleEl = document.getElementById('pageTitle');
    const subtitleEl = document.getElementById('pageSubtitle');
    if (titleEl) titleEl.innerHTML = `${BRAND_LABEL} <span><i class="fa-solid ${BRAND_ICON}"></i></span>`;
    if (subtitleEl) subtitleEl.textContent = `Discover and review ${BRAND_LABEL.toLowerCase()} brands you actually wear or eat.`;
  }

  async function boot() {
    initPageMeta();
    wireEvents();
    await loadSession();
    initMenuBridge();
    await loadBrands();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();







