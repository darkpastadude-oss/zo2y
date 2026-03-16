(() => {
  const SUPABASE_URL = 'https://gfkhjbztayjyojsgdpgk.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma2hqYnp0YXlqeW9qc2dkcGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwOTYyNjQsImV4cCI6MjA3NTY3MjI2NH0.WUb2yDAwCeokdpWCPeH13FE8NhWF6G8e6ivTsgu6b2s';

  const BRAND_TYPE = String(document.body?.dataset?.brandType || 'fashion').toLowerCase();
  const BRAND_LABEL = BRAND_TYPE === 'food' ? 'Food' : 'Fashion';
  const BRAND_ICON = BRAND_TYPE === 'food' ? 'fa-burger' : 'fa-shirt';
  const BRAND_TABLE = BRAND_TYPE === 'food' ? 'food_brands' : 'fashion_brands';

  const FALLBACKS = BRAND_TYPE === 'food'
    ? [
        { id: 'food-mcd', name: "McDonald's", category: 'Fast Food', domain: 'mcdonalds.com', logo_url: 'https://logo.clearbit.com/mcdonalds.com', description: 'American fast-food chain.' },
        { id: 'food-kfc', name: 'KFC', category: 'Fast Food', domain: 'kfc.com', logo_url: 'https://logo.clearbit.com/kfc.com', description: 'Fried chicken specialists.' },
        { id: 'food-bk', name: 'Burger King', category: 'Fast Food', domain: 'burgerking.com', logo_url: 'https://logo.clearbit.com/burgerking.com', description: 'Home of the Whopper.' },
        { id: 'food-subway', name: 'Subway', category: 'Fast Food', domain: 'subway.com', logo_url: 'https://logo.clearbit.com/subway.com', description: 'Sandwich chain.' },
        { id: 'food-taco', name: 'Taco Bell', category: 'Fast Food', domain: 'tacobell.com', logo_url: 'https://logo.clearbit.com/tacobell.com', description: 'Mexican-inspired fast food.' },
        { id: 'food-starbucks', name: 'Starbucks', category: 'Coffee', domain: 'starbucks.com', logo_url: 'https://logo.clearbit.com/starbucks.com', description: 'Coffeehouse chain.' },
        { id: 'food-dominos', name: "Domino's", category: 'Pizza', domain: 'dominos.com', logo_url: 'https://logo.clearbit.com/dominos.com', description: 'Pizza delivery chain.' },
        { id: 'food-pizzahut', name: 'Pizza Hut', category: 'Pizza', domain: 'pizzahut.com', logo_url: 'https://logo.clearbit.com/pizzahut.com', description: 'Pizza restaurant chain.' }
      ]
    : [
        { id: 'fashion-nike', name: 'Nike', category: 'Sportswear', domain: 'nike.com', logo_url: 'https://logo.clearbit.com/nike.com', description: 'Global sportswear brand.' },
        { id: 'fashion-adidas', name: 'Adidas', category: 'Sportswear', domain: 'adidas.com', logo_url: 'https://logo.clearbit.com/adidas.com', description: 'Athletic apparel and footwear.' },
        { id: 'fashion-zara', name: 'Zara', category: 'Fast Fashion', domain: 'zara.com', logo_url: 'https://logo.clearbit.com/zara.com', description: 'Spanish fashion retailer.' },
        { id: 'fashion-uniqlo', name: 'Uniqlo', category: 'Basics', domain: 'uniqlo.com', logo_url: 'https://logo.clearbit.com/uniqlo.com', description: 'Japanese casualwear brand.' },
        { id: 'fashion-hm', name: 'H&M', category: 'Fast Fashion', domain: 'hm.com', logo_url: 'https://logo.clearbit.com/hm.com', description: 'Global fashion retailer.' },
        { id: 'fashion-gucci', name: 'Gucci', category: 'Luxury', domain: 'gucci.com', logo_url: 'https://logo.clearbit.com/gucci.com', description: 'Italian luxury fashion.' },
        { id: 'fashion-prada', name: 'Prada', category: 'Luxury', domain: 'prada.com', logo_url: 'https://logo.clearbit.com/prada.com', description: 'Luxury fashion house.' },
        { id: 'fashion-lv', name: 'Louis Vuitton', category: 'Luxury', domain: 'louisvuitton.com', logo_url: 'https://logo.clearbit.com/louisvuitton.com', description: 'French luxury fashion.' }
      ];

  const grid = document.getElementById('brandGrid');
  const searchInput = document.getElementById('brandSearch');
  const categorySelect = document.getElementById('brandCategory');
  const countText = document.getElementById('brandCount');

  let supabaseClient = null;
  let currentUser = null;
  let allBrands = [];

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
        detectSessionInUrl: true
      }
    });
    window.__ZO2Y_SUPABASE_CLIENT = supabaseClient;
    return supabaseClient;
  }

  function resolveLogo(value, domain) {
    const raw = String(value || '').trim();
    const domainRaw = String(domain || '').trim();
    const candidate = domainRaw || raw;
    if (!candidate) return '';
    if (/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(candidate)) {
      return 'https://img.logo.dev/' + candidate;
    }
    if (/^https?:\/\//i.test(candidate)) {
      const match = candidate.match(/\/\/([^\/\?]+)/i);
      if (match && match[1]) return 'https://img.logo.dev/' + match[1];
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

  function normalizeBrand(row = {}) {
    return {
      id: String(row.id || row.slug || row.domain || row.name || '').trim(),
      name: String(row.name || row.brand_name || '').trim() || 'Brand',
      category: String(row.category || row.type || '').trim(),
      domain: String(row.domain || '').trim(),
      logo: resolveLogo(row.logo_url || row.logo, row.domain),
      description: String(row.description || row.extract || '').trim(),
      country: String(row.country || '').trim(),
      founded: String(row.founded || '').trim(),
      slug: String(row.slug || '').trim(),
      tags: Array.isArray(row.tags) ? row.tags : []
    };
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
      <div class="brand-card-logo">
        <img src="${escapeHtml(brand.logo || '/newlogo.webp')}" alt="${escapeHtml(brand.name)} logo" loading="lazy" onerror="this.onerror=null;this.src='/newlogo.webp';">
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
      .limit(200);

    if (error || !Array.isArray(data) || !data.length) {
      allBrands = FALLBACKS.map(normalizeBrand);
    } else {
      allBrands = data.map(normalizeBrand);
    }

    renderCategories(allBrands);
    renderGrid();
  }

  function initMenuBridge() {
    if (typeof window.initIndexStyleListMenu !== 'function') return;
    window.initIndexStyleListMenu({
      mediaType: BRAND_TYPE,
      getCurrentUser: () => currentUser,
      ensureClient: ensureSupabase,
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



