(() => {
  const SUPABASE_URL = 'https://gfkhjbztayjyojsgdpgk.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma2hqYnp0YXlqeW9qc2dkcGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwOTYyNjQsImV4cCI6MjA3NTY3MjI2NH0.WUb2yDAwCeokdpWCPeH13FE8NhWF6G8e6ivTsgu6b2s';

  const params = new URLSearchParams(window.location.search);
  const brandType = String(params.get('type') || 'fashion').toLowerCase();
  const brandIdParam = String(params.get('id') || '').trim();
  const brandTable = brandType === 'food' ? 'food_brands' : 'fashion_brands';
  const reviewTable = brandType === 'food' ? 'food_reviews' : 'fashion_reviews';

  const dom = {
    logo: document.getElementById('brandLogo'),
    name: document.getElementById('brandName'),
    meta: document.getElementById('brandMeta'),
    desc: document.getElementById('brandDescription'),
    about: document.getElementById('brandAboutBody'),
    saveBtn: document.getElementById('brandSaveBtn'),
    website: document.getElementById('brandWebsite'),
    reviewFormWrap: document.getElementById('reviewFormWrap'),
    reviewList: document.getElementById('reviewList'),
    actionCard: document.getElementById('brandActionCard')
  };

  let supabaseClient = null;
  let currentUser = null;
  let brandData = null;

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

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function toHttps(url) {
    const safe = String(url || '').trim();
    if (!safe) return '';
    if (safe.startsWith('//')) return `https:${safe}`;
    return safe.replace(/^http:\/\//i, 'https://');
  }

  function normalizeBrand(row = {}) {
    return {
      id: String(row.id || row.slug || row.domain || row.name || '').trim(),
      name: String(row.name || row.brand_name || '').trim() || 'Brand',
      category: String(row.category || row.type || '').trim(),
      domain: String(row.domain || '').trim(),
      logo: toHttps(row.logo_url || row.logo || ''),
      description: String(row.description || row.extract || '').trim(),
      country: String(row.country || '').trim(),
      founded: String(row.founded || '').trim(),
      slug: String(row.slug || '').trim(),
      tags: Array.isArray(row.tags) ? row.tags : []
    };
  }

  function isUuid(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
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

  function updateHero(brand) {
    document.body.dataset.navPage = brandType;
    const label = brandType === 'food' ? 'Food' : 'Fashion';
    document.title = `${brand.name} · ${label} · Zo2y`;

    if (dom.logo) dom.logo.src = brand.logo || '/newlogo.webp';
    if (dom.name) dom.name.textContent = brand.name;
    if (dom.meta) {
      dom.meta.innerHTML = [
        brand.category ? `<span><i class="fa-solid fa-tag"></i> ${escapeHtml(brand.category)}</span>` : '',
        brand.country ? `<span><i class="fa-solid fa-flag"></i> ${escapeHtml(brand.country)}</span>` : '',
        brand.founded ? `<span><i class="fa-solid fa-calendar"></i> Founded ${escapeHtml(brand.founded)}</span>` : ''
      ].filter(Boolean).join('');
    }
    if (dom.desc) dom.desc.textContent = brand.description || 'No description yet.';
    if (dom.about) dom.about.textContent = brand.description || 'This brand does not have a bio yet.';

    if (dom.website) {
      if (brand.domain) {
        dom.website.href = `https://${brand.domain}`;
        dom.website.style.display = 'inline-flex';
      } else {
        dom.website.style.display = 'none';
      }
    }

    if (dom.actionCard) {
      dom.actionCard.setAttribute('data-item-id', brand.id);
      dom.actionCard.querySelector('.card-title')?.replaceChildren(document.createTextNode(brand.name));
      dom.actionCard.querySelector('.card-meta')?.replaceChildren(document.createTextNode(brand.category || label));
      const img = dom.actionCard.querySelector('img');
      if (img) img.src = brand.logo || '/newlogo.webp';
    }
  }

  async function fetchBrand() {
    if (!brandIdParam) return null;
    const client = ensureSupabase();
    if (!client) return null;
    let query = client.from(brandTable).select('id,name,slug,domain,logo_url,description,category,country,founded,tags').limit(1);
    if (isUuid(brandIdParam)) {
      query = query.eq('id', brandIdParam);
    } else {
      const safe = brandIdParam.replace(/,/g, '');
      query = query.or(`slug.eq.${safe},domain.eq.${safe},name.ilike.%${safe}%`);
    }
    const { data, error } = await query;
    if (error || !data || !data.length) return null;
    return normalizeBrand(data[0]);
  }

  function renderReviewForm() {
    if (!dom.reviewFormWrap) return;
    if (!currentUser) {
      dom.reviewFormWrap.innerHTML = `
        <div class="review-form">
          <p style="color: var(--brand-muted);">Sign in to write a review.</p>
          <button class="action-btn primary" onclick="window.location.href='login.html'">
            <i class="fa-solid fa-user"></i> Login to review
          </button>
        </div>
      `;
      return;
    }
    dom.reviewFormWrap.innerHTML = `
      <form class="review-form" id="brandReviewForm">
        <select id="brandReviewRating" required>
          <option value="">Rate this brand</option>
          <option value="5">5 - Loved it</option>
          <option value="4">4 - Great</option>
          <option value="3">3 - Solid</option>
          <option value="2">2 - Meh</option>
          <option value="1">1 - Skip</option>
        </select>
        <textarea id="brandReviewText" rows="4" placeholder="Share your thoughts..."></textarea>
        <button class="action-btn primary" type="submit"><i class="fa-solid fa-paper-plane"></i> Post review</button>
      </form>
    `;
    const form = document.getElementById('brandReviewForm');
    if (form) {
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const rating = Number(document.getElementById('brandReviewRating')?.value || 0);
        const text = String(document.getElementById('brandReviewText')?.value || '').trim();
        if (!rating || rating < 1 || rating > 5) return;
        await submitReview(rating, text);
      });
    }
  }

  async function submitReview(rating, text) {
    const client = ensureSupabase();
    if (!client || !currentUser || !brandData) return;
    const payload = {
      brand_id: brandData.id,
      user_id: currentUser.id,
      rating,
      review_text: text
    };
    const { error } = await client.from(reviewTable).insert(payload);
    if (error) {
      console.error('Review error', error);
      return;
    }
    await loadReviews();
  }

  function formatDate(raw) {
    const date = new Date(raw || '');
    if (!Number.isFinite(date.getTime())) return '';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  async function loadReviews() {
    if (!dom.reviewList || !brandData) return;
    const client = ensureSupabase();
    if (!client) return;
    const { data, error } = await client
      .from(reviewTable)
      .select('id, user_id, rating, review_text, created_at, user_profiles(username, full_name)')
      .eq('brand_id', brandData.id)
      .order('created_at', { ascending: false })
      .limit(40);

    if (error || !Array.isArray(data) || !data.length) {
      dom.reviewList.innerHTML = '<div style="color: var(--brand-muted);">No reviews yet.</div>';
      return;
    }

    dom.reviewList.innerHTML = data.map((row) => {
      const profile = row.user_profiles || {};
      const label = profile.username ? `@${profile.username}` : (profile.full_name || 'User');
      return `
        <div class="review-card">
          <div class="review-card-header">
            <strong>${escapeHtml(label)}</strong>
            <span>${escapeHtml(formatDate(row.created_at))} · ${escapeHtml(String(row.rating || ''))}/5</span>
          </div>
          <div class="review-card-body">${escapeHtml(row.review_text || '')}</div>
        </div>
      `;
    }).join('');
  }

  function initMenuBridge() {
    if (typeof window.initIndexStyleListMenu !== 'function') return;
    window.initIndexStyleListMenu({
      mediaType: brandType,
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

  function wireActions() {
    if (dom.saveBtn) {
      dom.saveBtn.addEventListener('click', () => {
        if (dom.actionCard && window.openIndexStyleListMenu) {
          window.openIndexStyleListMenu(dom.actionCard);
        }
      });
    }
  }

  async function boot() {
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
    renderReviewForm();
    await loadReviews();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
