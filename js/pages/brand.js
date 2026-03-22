(() => {
  const SUPABASE_URL = 'https://gfkhjbztayjyojsgdpgk.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma2hqYnp0YXlqeW9qc2dkcGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwOTYyNjQsImV4cCI6MjA3NTY3MjI2NH0.WUb2yDAwCeokdpWCPeH13FE8NhWF6G8e6ivTsgu6b2s';

  const params = new URLSearchParams(window.location.search);
  const brandType = String(params.get('type') || 'fashion').toLowerCase();
  const brandIdParam = String(params.get('id') || '').trim();
  const brandTable = brandType === 'food' ? 'food_brands' : (brandType === 'car' ? 'car_brands' : 'fashion_brands');
  const reviewTable = brandType === 'food' ? 'food_reviews' : (brandType === 'car' ? 'car_reviews' : 'fashion_reviews');
  const HOME_DEFAULT_LIST_TABLES = {
    fashion: { table: 'fashion_list_items', itemField: 'brand_id' },
    food: { table: 'food_list_items', itemField: 'brand_id' },
    car: { table: 'car_list_items', itemField: 'brand_id' }
  };

  const dom = {
    logo: document.getElementById('brandLogo'),
    name: document.getElementById('brandName'),
    meta: document.getElementById('brandMeta'),
    desc: document.getElementById('brandDescription'),
    about: document.getElementById('brandAboutBody'),
    menuBtn: document.getElementById('brandMenuBtn'),
    website: document.getElementById('brandWebsite'),
    reviewsList: document.getElementById('reviewsList'),
    reviewsStats: document.getElementById('reviewsStats'),
    reviewForm: document.getElementById('review-form'),
    authPrompt: document.getElementById('auth-prompt'),
    sortSelect: document.getElementById('sortSelect'),
    ratingText: document.getElementById('ratingText'),
    commentInput: document.getElementById('review-comment'),
    charCount: document.getElementById('charCount'),
    cancelEditBtn: document.querySelector('.cancel-edit-btn'),
    actionCard: document.getElementById('brandActionCard')
  };

  let supabaseClient = null;
  let currentUser = null;
  let brandData = null;
  let currentRating = 0;
  let editingReviewId = null;
  let reviews = [];
  let currentSort = 'latest';

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
      return '/api/logo?domain=' + encodeURIComponent(candidate) + '&size=256&mode=logo';
    }
    if (/^https?:\/\//i.test(candidate)) {
      const match = candidate.match(/\/\/([^\/\?]+)/i);
      if (match && match[1]) return '/api/logo?domain=' + encodeURIComponent(match[1]) + '&size=256&mode=logo';
      return candidate;
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
      founded: String(row.founded || '').trim(),
      slug: String(row.slug || '').trim(),
      tags: Array.isArray(row.tags) ? row.tags : []
    };
  }

  function isUuid(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }

  function showBrandToast(message, isError = false) {
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

  async function saveToListFromHome(payload) {
    const result = { ok: false, saved: null };
    const client = await ensureSupabase();
    if (!client) {
      showBrandToast('List service unavailable', true);
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
      showBrandToast('Lists are not available for this media yet.');
      return result;
    }

    const ensureLinkedMediaRecord = async (_itemId) => true;

    try {
      const defaultListTable = getHomeDefaultListTable(mediaType);
      const itemId = normalizeHomeDefaultItemId(mediaType, payload.itemId);

      if (defaultListTable) {
        if (itemId === null) {
          showBrandToast('Could not update list', true);
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
            showBrandToast('Could not update list', true);
            return result;
          }
          showBrandToast('Removed from list');
          result.ok = true;
          result.saved = false;
          return result;
        }

        if (nextSaved === true) {
          const ensured = await ensureLinkedMediaRecord(itemId);
          if (!ensured) {
            showBrandToast('Book info is unavailable right now.', true);
            return result;
          }
          const insertRow = { user_id: currentUser.id, list_type: listType };
          insertRow[itemField] = itemId;
          const { error: insertError } = await client.from(table).insert(insertRow);
          if (insertError && String(insertError.code || '') !== '23505') {
            showBrandToast('Could not add to list', true);
            return result;
          }
          showBrandToast('Added to list');
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
            showBrandToast('Could not update list', true);
            return result;
          }
          showBrandToast('Removed from list');
          result.ok = true;
          result.saved = false;
          return result;
        }

        await ensureLinkedMediaRecord(itemId);
        const insertRow = { user_id: currentUser.id, list_type: listType };
        insertRow[itemField] = itemId;
        const { error: insertError } = await client.from(table).insert(insertRow);
        if (insertError && String(insertError.code || '') !== '23505') {
          showBrandToast('Could not add to list', true);
          return result;
        }
        showBrandToast('Added to list');
        result.ok = true;
        result.saved = true;
        return result;
      }
    } catch (_err) {
      showBrandToast('Could not add to list', true);
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

  function showNotification(message, level = 'info') {
    const toast = document.createElement('div');
    toast.style.position = 'fixed';
    toast.style.top = '16px';
    toast.style.right = '16px';
    toast.style.zIndex = '99999';
    toast.style.background = level === 'error' ? '#ef4444' : '#10b981';
    if (level === 'info') toast.style.background = '#3b82f6';
    toast.style.color = '#fff';
    toast.style.padding = '10px 14px';
    toast.style.borderRadius = '10px';
    toast.style.fontSize = '13px';
    toast.style.boxShadow = '0 10px 24px rgba(0,0,0,0.35)';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2200);
  }

  function updateHero(brand) {
    document.body.dataset.navPage = brandType;
    const label = brandType === 'food' ? 'Food' : 'Fashion';
    document.title = `${brand.name} · ${label} · Zo2y`;

    if (dom.logo) {
      dom.logo.src = brand.logo || '/newlogo.webp';
      dom.logo.onerror = () => {
        dom.logo.onerror = null;
        dom.logo.src = '/newlogo.webp';
      };
    }
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
      if (brand.logo) dom.actionCard.setAttribute('data-list-image', brand.logo);
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

  function renderStarRating(rating, options = {}) {
    const raw = Number(rating || 0);
    const safe = Number.isFinite(raw) ? Math.max(0, Math.min(5, raw)) : 0;
    const filled = Math.round(safe);
    const wrapper = options.wrapper !== false;
    let html = wrapper ? `<span class="rating-stars" aria-label="${safe.toFixed(1)}/5">` : '';
    for (let i = 0; i < 5; i += 1) {
      html += `<span class="rating-star${i < filled ? ' is-filled' : ''}" aria-hidden="true"></span>`;
    }
    if (wrapper) html += '</span>';
    return html;
  }

  function updateStarDisplay() {
    const stars = document.querySelectorAll('.star');
    const ratingText = dom.ratingText;
    stars.forEach((star) => {
      const starRating = parseInt(star.dataset.rating, 10);
      star.classList.toggle('active', starRating <= currentRating);
    });
    const ratingTexts = ['Select your rating', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
    if (ratingText) ratingText.textContent = ratingTexts[currentRating] || ratingTexts[0];
  }

  function renderReviewForm() {
    if (!dom.reviewForm || !dom.authPrompt) return;
    if (!currentUser) {
      dom.reviewForm.style.display = 'none';
      dom.authPrompt.style.display = 'block';
      return;
    }
    dom.reviewForm.style.display = 'block';
    dom.authPrompt.style.display = 'none';
  }

  async function loadReviews() {
    if (!dom.reviewsList || !dom.reviewsStats || !brandData) return;
    const client = ensureSupabase();
    if (!client) return;
    dom.reviewsList.innerHTML = '<div class="reviews-loading">Loading reviews...</div>';
    const { data, error } = await client
      .from(reviewTable)
      .select('*')
      .eq('brand_id', brandData.id)
      .order('created_at', { ascending: false });

    if (error) {
      dom.reviewsList.innerHTML = '<div class="reviews-empty">Error loading reviews.</div>';
      dom.reviewsStats.innerHTML = '<div class="reviews-empty">Error loading stats.</div>';
      return;
    }

    reviews = data || [];
    if (!reviews.length) {
      dom.reviewsList.innerHTML = '<div class="reviews-empty">No reviews yet. Be the first to share your thoughts!</div>';
      dom.reviewsStats.innerHTML = '<div class="reviews-empty">No reviews yet</div>';
      return;
    }

    const totalReviews = reviews.length;
    const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;
    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((review) => {
      if (ratingDistribution[review.rating] !== undefined) ratingDistribution[review.rating] += 1;
    });

    dom.reviewsStats.innerHTML = `
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-value">${averageRating.toFixed(1)}</div>
          <div class="stat-label">Average Rating</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${totalReviews}</div>
          <div class="stat-label">Total Reviews</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${Math.round((ratingDistribution[5] / totalReviews) * 100)}%</div>
          <div class="stat-label">5-Star Reviews</div>
        </div>
      </div>
      <div class="rating-breakdown">
        ${[5, 4, 3, 2, 1].map((stars) => `
          <div class="rating-row">
            <div class="rating-stars">${renderStarRating(stars, { wrapper: false })}</div>
            <div class="rating-bar">
              <div class="rating-fill" style="width: ${(ratingDistribution[stars] / totalReviews) * 100}%"></div>
            </div>
            <div class="rating-count">${ratingDistribution[stars]}</div>
          </div>
        `).join('')}
      </div>
    `;

    const sortControls = document.getElementById('reviewsSortControls');
    if (sortControls) sortControls.style.display = 'flex';
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
      dom.reviewsList.innerHTML = '<div class="reviews-empty">No reviews yet.</div>';
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
        <div class="review-card" id="review-${review.id}" data-review-id="${review.id}">
          <div class="review-header">
            <div class="reviewer-info">
              <a class="reviewer-avatar reviewer-link" href="${profileHref}" aria-label="View ${escapeHtml(displayName)} profile">${escapeHtml(initials)}</a>
              <div>
                <div class="reviewer-name"><a class="reviewer-link" href="${profileHref}">${escapeHtml(displayName)}</a></div>
                <div class="review-date">${new Date(review.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
              </div>
            </div>
            <div class="review-rating">${renderStarRating(review.rating)}</div>
          </div>
          <p class="review-comment">${escapeHtml(comment)}</p>
          ${canEditDelete ? `
            <div class="review-actions">
              <button class="review-edit" onclick="editReview('${review.id}')">Edit</button>
              <button class="review-delete" onclick="deleteReview('${review.id}')">Delete</button>
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
        notify: (message, level) => showNotification(message, level || 'info'),
        cardSelector: '.review-card',
        reviewIdAttribute: 'data-review-id'
      });
    }
  }

  async function submitReview(e) {
    e.preventDefault();
    if (!currentUser) {
      showNotification('Please sign in to submit a review', 'info');
      return;
    }
    const comment = dom.commentInput ? dom.commentInput.value.trim() : '';
    if (!currentRating) {
      showNotification('Please select a rating', 'info');
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
      showNotification('Error submitting review', 'error');
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
    showNotification('Review saved', 'success');
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
    const submitText = document.querySelector('.submit-review-btn .btn-text');
    if (submitText) submitText.textContent = 'Update Review';
    if (dom.cancelEditBtn) dom.cancelEditBtn.style.display = 'inline-flex';
  };

  window.deleteReview = async function (reviewId) {
    if (!currentUser) {
      showNotification('Please sign in to delete reviews', 'info');
      return;
    }
    if (!confirm('Delete this review?')) return;
    const { error } = await supabaseClient
      .from(reviewTable)
      .delete()
      .eq('id', reviewId);
    if (error) {
      showNotification('Error deleting review', 'error');
      return;
    }
    await loadReviews();
    showNotification('Review deleted', 'success');
  };

  function resetReviewForm() {
    editingReviewId = null;
    currentRating = 0;
    if (dom.reviewForm) dom.reviewForm.reset();
    updateStarDisplay();
    const submitText = document.querySelector('.submit-review-btn .btn-text');
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
    document.querySelectorAll('.star').forEach((star) => {
      star.addEventListener('click', () => {
        currentRating = parseInt(star.dataset.rating, 10);
        updateStarDisplay();
      });
    });
    await loadReviews();
  }

  function initMenuBridge() {
    if (typeof window.initIndexStyleListMenu !== 'function') return;
    window.initIndexStyleListMenu({
      mediaType: brandType,
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

  function wireActions() {
    if (dom.menuBtn) {
      dom.menuBtn.addEventListener('click', (event) => {
        event.stopPropagation();
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
    await initReviewSystem();

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







