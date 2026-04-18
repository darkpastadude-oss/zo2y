// ========== GLOBAL STATE ==========
let currentUser = null;
let currentRating = 0;
let editingReviewId = null;
let galleryImages = [];
let currentGalleryIndex = 0;
let currentGalleryCategory = 'all';
let reviews = [];
let currentSort = 'latest';
let imageCache = new Map();
let lazyLoadObserver = null;
let supabaseClient = null;
let restaurantId = null;
let listManager = null;

// ========== SUPABASE CONFIG ==========
const supabaseConfig = window.__ZO2Y_SUPABASE_CONFIG || {};
const SUPABASE_URL = String(supabaseConfig.url || '').trim() || 'https://gfkhjbztayjyojsgdpgk.supabase.co';
const SUPABASE_KEY = String(supabaseConfig.key || '').trim();

// ============================================
// INITIALIZATION
// ============================================
async function initializeRestaurantPage() {
    console.log('ðŸš€ Starting restaurant page initialization...');
    
    try {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            await new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve);
            });
        }
        
        // Initialize Supabase
        await initSupabase();
        
        if (!window.supabase || !supabaseClient) {
            console.error('âŒ Supabase not initialized');
            showErrorMessage('Failed to initialize database connection');
            return;
        }
        
        // Get restaurant slug from URL
        const restaurantRoute = getRestaurantRouteParams();
        
        if (!restaurantRoute.id && !restaurantRoute.slug) {
            console.error('âŒ No restaurant slug in URL');
            showNotFoundMessage();
            return;
        }
        
        // Load restaurant data
        await loadAndRenderRestaurantData(restaurantRoute);
        
        // Initialize list manager
        initializeListManager();
        
        // Initialize review system
        await initReviewSystem();
        
        // Setup global event listeners
        setupGlobalEventListeners();
        
        console.log('âœ… Restaurant page initialization complete');
        
    } catch (err) {
        console.error('âŒ Fatal error during initialization:', err);
        showErrorMessage('Failed to load restaurant page');
    }
}

// ============================================
// SUPABASE INITIALIZATION
// ============================================
async function initSupabase() {
    try {
        if (typeof supabase === 'undefined') {
            console.warn('Supabase library not loaded yet, waiting...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            if (typeof supabase === 'undefined') {
                throw new Error('Supabase library failed to load');
            }
        }
        
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log('âœ… Supabase initialized successfully');
        return supabaseClient;
    } catch (error) {
        console.error('âŒ Failed to initialize Supabase:', error);
        showErrorMessage('Database connection failed');
        throw error;
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function getRestaurantIdParam() {
    const urlParams = new URLSearchParams(window.location.search);
    const rawId = urlParams.get('id');
    if (!rawId) return null;
    const decoded = decodeURIComponent(rawId).trim();
    return decoded || null;
}

function getRestaurantSlug() {
    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('slug');
    return slug ? decodeURIComponent(slug).toLowerCase().trim() : null;
}

function getRestaurantRouteParams() {
    return {
        id: getRestaurantIdParam(),
        slug: getRestaurantSlug()
    };
}

function showNotification(message, type = 'info', duration = 4000) {
    const existing = document.querySelectorAll('.notification');
    existing.forEach(n => n.remove());

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    requestAnimationFrame(() => {
        notification.classList.add('show');
    });

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 400);
    }, duration);

    return notification;
}

function showLoginModal() {
    document.getElementById('loginModal').classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeLoginModal() {
    document.getElementById('loginModal').classList.remove('show');
    document.body.style.overflow = '';
}

function showError() {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error').style.display = 'block';
}

function showNotFoundMessage() {
    showError();
}

function showErrorMessage(message) {
    showNotification(message, 'error');
    showError();
}

// ============================================
// RESTAURANT DATA LOADING
// ============================================
async function loadAndRenderRestaurantData(routeOrSlug) {
    try {
        const route = typeof routeOrSlug === 'string'
            ? { slug: routeOrSlug, id: null }
            : (routeOrSlug || {});
        const routeId = route.id ? String(route.id).trim() : '';
        const routeSlug = route.slug ? String(route.slug).trim().toLowerCase() : '';

        console.log('Loading data for route:', route);

        let restaurantQuery = supabaseClient.from('restraunts').select('*');
        if (routeId) {
            const routeIdValue = Number.isFinite(Number(routeId)) ? Number(routeId) : routeId;
            restaurantQuery = restaurantQuery.eq('id', routeIdValue);
        } else if (routeSlug) {
            restaurantQuery = restaurantQuery.eq('slug', routeSlug);
        } else {
            throw new Error('Restaurant route missing id/slug');
        }

        const { data: restaurant, error: restaurantError } = await restaurantQuery.maybeSingle();
        if (restaurantError || !restaurant) {
            throw new Error('Restaurant not found');
        }

        const restaurantSlug = String(restaurant.slug || routeSlug || '').trim().toLowerCase();
        if (!restaurantSlug) {
            throw new Error('Restaurant slug missing');
        }

        // Load everything in parallel after resolving the canonical slug
        const [menuData, branchesData, imagesData] = await Promise.all([
            supabaseClient.from('menu_items').select('*').eq('restaurant_slug', restaurantSlug).order('category'),
            supabaseClient.from('branches').select('*').eq('restaurant_slug', restaurantSlug).order('branch_name'),
            loadRestaurantImages(restaurantSlug)
        ]);

        // Render the data
        renderRestaurantData({
            restaurant,
            menuItems: menuData.data || [], 
            branches: branchesData.data || [],
            images: imagesData
        });
        
    } catch (error) {
        console.error('Error loading restaurant data:', error);
        showNotFoundMessage();
    }
}

async function loadRestaurantImages(restaurantSlug) {
    try {
        const { data, error } = await supabaseClient
            .from('restaurant_gallery')
            .select('*')
            .eq('restaurant_slug', restaurantSlug)
            .order('sort_order', { ascending: true });
        
        if (error) {
            console.error('Error loading gallery images:', error);
            return [];
        }
        
        return data || [];
    } catch (err) {
        console.error('Exception loading gallery images:', err);
        return [];
    }
}

// ============================================
// RENDER FUNCTIONS
// ============================================
function renderRestaurantData(data) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('main-content').style.display = 'block';
    
    const { restaurant, menuItems, branches, images } = data;
    
    document.title = `${restaurant.name} - Zo2y`;
    
    createSectionNavigation();
    
    // Set logo
    const logoImg = document.getElementById('restaurant-logo');
    const logoUrl = restaurant.logo_url || restaurant.image || 'images/default-logo.jpg';
    logoImg.src = logoUrl;
    logoImg.alt = `${restaurant.name} Logo`;
    logoImg.classList.remove('lazy-img');
    logoImg.classList.add('loaded');
    
    document.getElementById('restaurant-name').textContent = restaurant.name;
    document.getElementById('restaurant-description').textContent = restaurant.description || 'Delicious food served with care';
    
    const ratingElement = document.getElementById('restaurant-rating');
    if (restaurant.rating) {
        ratingElement.innerHTML = `${renderStarRating(restaurant.rating)} <span class="rating-text">${restaurant.rating.toFixed(1)}/5</span>`;
    } else {
        ratingElement.textContent = 'Rating not available';
    }
// Set up buttons
    setupRestaurantButtons(restaurant);
    
    // Render overview
    renderOverview(restaurant);
    
    // Render contact info
    renderContactInfo(restaurant, branches);
    
    // Render menu
    renderMenu(menuItems, restaurant);
    
    // Render gallery
    renderGallery(images, restaurant.name);
    
    // Update Talabat status
    updateTalabatDisplay(restaurant.slug);
    
    document.getElementById('footer-tagline').textContent = `${restaurant.name} - ${restaurant.category || 'Restaurant'}`;
}

function setupRestaurantButtons(restaurant) {
    const hotlineBtn = document.getElementById('call-hotline');
    if (restaurant.hotline) {
        hotlineBtn.href = `tel:${restaurant.hotline}`;
        hotlineBtn.innerHTML = `<span>ðŸ“ž</span> Call: ${restaurant.hotline}`;
    } else {
        hotlineBtn.style.display = 'none';
    }
    
    const websiteBtn = document.getElementById('order-online');
    const otherPlatforms = document.getElementById('other-platforms');
    if (restaurant.website_url) {
        websiteBtn.href = restaurant.website_url;
        document.getElementById('website-order-link').href = restaurant.website_url;
        otherPlatforms.style.display = 'block';
    } else {
        websiteBtn.style.display = 'none';
        otherPlatforms.style.display = 'none';
    }
    
    const instagramBtn = document.getElementById('instagram-link');
    if (restaurant.instagram_url) {
        instagramBtn.href = restaurant.instagram_url;
        instagramBtn.style.display = 'inline-flex';
    }
    
    const facebookBtn = document.getElementById('facebook-link');
    if (restaurant.facebook_url) {
        facebookBtn.href = restaurant.facebook_url;
        facebookBtn.style.display = 'inline-flex';
    }
}

function renderOverview(restaurant) {
    const overviewContent = document.getElementById('overview-content');
    overviewContent.innerHTML = `
        <div class="overview-summary">
            <p>${restaurant.description || 'Delicious food served with care'}</p>
            <div class="overview-details" style="margin-top: 20px;">
                ${restaurant.rating ? `<div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                    <strong style="color: var(--text);">Rating:</strong>
                    <span class="rating" style="color: #FF9800;">${renderStarRating(restaurant.rating)} <span class="rating-text">${restaurant.rating.toFixed(1)}/5</span></span>
                </div>` : ''}
                ${restaurant.hotline ? `<div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                    <strong style="color: var(--text);">Hotline:</strong>
                    <a href="tel:${restaurant.hotline}" style="color: var(--accent); text-decoration: none;">${restaurant.hotline}</a>
                </div>` : ''}
                ${restaurant.category ? `<div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                    <strong style="color: var(--text);">Category:</strong>
                    <span style="color: var(--text2);">${restaurant.category}</span>
                </div>` : ''}
            </div>
        </div>
    `;
}

function renderContactInfo(restaurant, branches) {
    const hotlineLink = document.getElementById('hotline-link');
    if (restaurant.hotline) {
        hotlineLink.href = `tel:${restaurant.hotline}`;
        hotlineLink.textContent = restaurant.hotline;
    }
    
    const branchesContainer = document.getElementById('branches-container');
    const existingToggleBtn = document.getElementById('branchesToggleBtn');
    if (existingToggleBtn) existingToggleBtn.remove();
    if (branches.length > 0) {
        branchesContainer.innerHTML = '';
        const maxVisible = 3;
        branches.forEach((branch, index) => {
            const branchCard = document.createElement('div');
            branchCard.className = 'branch-card';
            if (index >= maxVisible) {
                branchCard.classList.add('is-hidden');
            }
            branchCard.innerHTML = `
                <h3>${branch.branch_name}</h3>
                <p>${branch.details || 'Location details not available'}</p>
                ${branch.directions_link
                    ? `<a href="${branch.directions_link}" target="_blank" rel="noopener">ðŸ“ Get directions</a>`
                    : `<span class="branch-directions disabled">ðŸ“ Get directions</span>`
                }
            `;
            branchesContainer.appendChild(branchCard);
        });

        if (branches.length > maxVisible && branchesContainer.parentElement) {
            const toggleBtn = document.createElement('button');
            toggleBtn.id = 'branchesToggleBtn';
            toggleBtn.className = 'branches-toggle-btn';
            toggleBtn.type = 'button';
            toggleBtn.setAttribute('data-expanded', 'false');
            toggleBtn.innerHTML = '<span>See more</span><i class="fas fa-chevron-down"></i>';

            toggleBtn.addEventListener('click', () => {
                const isExpanded = toggleBtn.getAttribute('data-expanded') === 'true';
                branchesContainer.querySelectorAll('.branch-card').forEach((card, idx) => {
                    if (idx >= maxVisible) {
                        card.classList.toggle('is-hidden', isExpanded);
                    }
                });

                toggleBtn.setAttribute('data-expanded', (!isExpanded).toString());
                toggleBtn.innerHTML = isExpanded
                    ? '<span>See more</span><i class="fas fa-chevron-down"></i>'
                    : '<span>See less</span><i class="fas fa-chevron-up"></i>';
            });

            branchesContainer.parentElement.appendChild(toggleBtn);
        }
    } else {
        branchesContainer.innerHTML = '<p class="no-data">No branch information available</p>';
    }
}

function renderMenu(menuItems, restaurant) {
    const menuContainer = document.getElementById('menu-container');
    if (menuItems.length > 0) {
        const groupedByCategory = {};
        menuItems.forEach(item => {
            if (!groupedByCategory[item.category]) {
                groupedByCategory[item.category] = [];
            }
            groupedByCategory[item.category].push(item);
        });
        
        menuContainer.innerHTML = '';
        Object.keys(groupedByCategory).forEach(category => {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'menu-category';
            categoryDiv.innerHTML = `<h3>${category}</h3>`;
            
            groupedByCategory[category].forEach(item => {
                const menuItem = document.createElement('div');
                menuItem.className = 'menu-item';
                
                const hasDescription = item.description && item.description.trim() !== '';
                
                menuItem.innerHTML = `
                    <div class="menu-item-header">
                        <span class="menu-item-name">${item.item_name}</span>
                        ${hasDescription ? `<button class="menu-expand-btn">â–¼</button>` : ''}
                    </div>
                    ${hasDescription ? `<div class="menu-item-description">${item.description}</div>` : ''}
                `;
                
                if (hasDescription) {
                    const menuItemHeader = menuItem.querySelector('.menu-item-header');
                    const expandBtn = menuItem.querySelector('.menu-expand-btn');
                    
                    menuItemHeader.addEventListener('click', (e) => {
                        menuItem.classList.toggle('expanded');
                        expandBtn.textContent = menuItem.classList.contains('expanded') ? 'â–²' : 'â–¼';
                    });
                    
                    expandBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        menuItem.classList.toggle('expanded');
                        expandBtn.textContent = menuItem.classList.contains('expanded') ? 'â–²' : 'â–¼';
                    });
                }
                
                categoryDiv.appendChild(menuItem);
            });
            
            menuContainer.appendChild(categoryDiv);
        });
    } else {
        menuContainer.innerHTML = '<p class="no-data">Menu items not available</p>';
    }
    
    const fullMenuLink = document.getElementById('full-menu-link');
    if (restaurant.website_url) {
        fullMenuLink.href = restaurant.website_url;
        fullMenuLink.style.display = 'inline-flex';
    } else {
        fullMenuLink.style.display = 'none';
    }
}

function renderGallery(images, restaurantName) {
    galleryImages = images;
    
    if (!images || images.length === 0) {
        document.getElementById('gallery-empty').style.display = 'block';
        return;
    }
    
    displayGalleryImages(galleryImages, restaurantName);
    setupGalleryTabs();
}

function displayGalleryImages(images, restaurantName) {
    const container = document.getElementById('gallery-container');
    
    if (!images || images.length === 0) {
        container.innerHTML = '<div class="no-data">No photos available yet</div>';
        return;
    }
    
    const filteredImages = currentGalleryCategory === 'all' 
        ? images
        : images.filter(img => img.image_type === currentGalleryCategory);
    
    if (filteredImages.length === 0) {
        container.innerHTML = `<div class="no-data">No ${currentGalleryCategory} photos available</div>`;
        return;
    }
    
    container.innerHTML = filteredImages.map((image, index) => `
        <div class="gallery-item" onclick="openImageModal('${image.image_url}', '${restaurantName} - ${image.image_type}')">
            <img src="${image.image_url}" 
                 alt="${restaurantName} - ${image.image_type}"
                 loading="lazy"
                 class="gallery-image">
            <div class="gallery-caption">${image.image_type.charAt(0).toUpperCase() + image.image_type.slice(1)}</div>
        </div>
    `).join('');
}

function setupGalleryTabs() {
    const tabs = document.querySelectorAll('.gallery-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            currentGalleryCategory = tab.dataset.category;
            
            const restaurantName = document.getElementById('restaurant-name').textContent;
            displayGalleryImages(galleryImages, restaurantName);
        });
    });
}

// ============================================
// SECTION NAVIGATION
// ============================================
function createSectionNavigation() {
    const navList = document.getElementById('sectionNavList');
    if (!navList) return;
    
    const sections = [
        { id: 'overview-section', label: 'Overview' },
        { id: 'branches-section', label: 'Contact & Branches' },
        { id: 'ordering-section', label: 'Ordering' },
        { id: 'gallery-section', label: 'Gallery' },
        { id: 'menu-section', label: 'Menu' },
        { id: 'reviews-section', label: 'Reviews' }
    ];
    
    navList.innerHTML = '';
    
    sections.forEach(section => {
        const navItem = document.createElement('li');
        navItem.className = 'section-nav-item';
        
        const navLink = document.createElement('a');
        navLink.href = `#${section.id}`;
        navLink.className = 'section-nav-link';
        navLink.textContent = section.label;
        navLink.onclick = (e) => {
            e.preventDefault();
            document.getElementById(section.id).scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
            
            document.querySelectorAll('.section-nav-link').forEach(link => {
                link.classList.remove('active');
            });
            navLink.classList.add('active');
        };
        
        navItem.appendChild(navLink);
        navList.appendChild(navItem);
    });
    
    const firstLink = navList.querySelector('.section-nav-link');
    if (firstLink) {
        firstLink.classList.add('active');
    }
    
    let ticking = false;
    
    function updateActiveNavOnScroll() {
        const scrollPosition = window.scrollY + 150;
        
        sections.forEach(section => {
            const sectionElement = document.getElementById(section.id);
            if (sectionElement) {
                const sectionTop = sectionElement.offsetTop;
                const sectionBottom = sectionTop + sectionElement.offsetHeight;
                
                if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
                    document.querySelectorAll('.section-nav-link').forEach(link => {
                        link.classList.remove('active');
                    });
                    
                    const currentLink = document.querySelector(`.section-nav-link[href="#${section.id}"]`);
                    if (currentLink) {
                        currentLink.classList.add('active');
                    }
                }
            }
        });
        
        ticking = false;
    }
    
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                updateActiveNavOnScroll();
            });
            ticking = true;
        }
    });
}

// ============================================
// TALABAT FUNCTIONS
// ============================================
async function updateTalabatDisplay(slug) {
    const statusElement = document.getElementById('talabat-status');
    const warningElement = document.getElementById('availability-warning');
    const normalizedSlug = String(slug || '').trim().toLowerCase();
    
    try {
        if (!normalizedSlug) {
            statusElement.innerHTML = '<span class="status-loading">Availability unknown</span>';
            return;
        }
        const { data: restaurant, error } = await supabaseClient
            .from('restraunts')
            .select('talabat')
            .eq('slug', normalizedSlug)
            .maybeSingle();

        if (error || !restaurant) {
            statusElement.innerHTML = '<span class="status-loading">Availability unknown</span>';
            return;
        }
        
        const isAvailable = restaurant.talabat === 'yes';
        
        if (isAvailable) {
            statusElement.innerHTML = `
                <span class="status-badge available">
                    <span class="checkmark">âœ“</span>
                    Available on Talabat
                </span>
                <span style="color: var(--text2); font-size: 0.9rem;">Check the Talabat app for ordering</span>
            `;
            warningElement.style.display = 'block';
        } else {
            statusElement.innerHTML = `
                <span class="status-badge not-available">
                    Not Available
                </span>
                <span style="color: var(--text2); font-size: 0.9rem;">Not currently on Talabat</span>
            `;
        }
    } catch (error) {
        statusElement.innerHTML = '<span class="status-loading">Error checking availability</span>';
    }
}

// ============================================
// REVIEW SYSTEM
// ============================================
async function initReviewSystem() {
    try {
        const id = await getRestaurantIdFromSlug();
        if (!id) {
            console.error('Could not determine restaurant ID from slug');
            const reviewSection = document.getElementById('reviews-section');
            if (reviewSection) {
                reviewSection.style.display = 'none';
            }
            return;
        }
        
        restaurantId = id;
        
        await checkAuth();
        await loadReviews();
        setupReviewEventListeners();
        setupSortControls();
    } catch (error) {
        console.error('Error initializing review system:', error);
        showNotification('Error setting up review system', 'error');
    }
}

async function getRestaurantIdFromSlug() {
    const idParam = getRestaurantIdParam();
    if (idParam) {
        const numericId = Number(idParam);
        return Number.isFinite(numericId) && numericId > 0 ? numericId : idParam;
    }

    const slug = getRestaurantSlug();
    
    if (!slug) {
        console.error('No restaurant id/slug found in URL');
        return null;
    }
    
    try {
        const { data, error } = await supabaseClient
            .from('restraunts')
            .select('id')
            .eq('slug', slug)
            .maybeSingle();
        
        if (error) {
            console.error('Error fetching restaurant ID:', error);
            return null;
        }

        if (!data?.id) {
            console.error('No restaurant row found for slug:', slug);
            return null;
        }
        
        return data?.id || null;
    } catch (error) {
        console.error('Error in getRestaurantIdFromSlug:', error);
        return null;
    }
}

async function loadReviews() {
    const container = document.getElementById('reviewsList');
    const statsContainer = document.getElementById('reviewsStats');
    
    try {
        container.innerHTML = '<div class="reviews-loading">Loading reviews...</div>';
        
        const { data: reviewsData, error } = await supabaseClient
            .from('reviews')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        reviews = reviewsData || [];

        if (!reviews || reviews.length === 0) {
            container.innerHTML = '<div class="reviews-empty">No reviews yet. Be the first to share your experience! ðŸŽ‰</div>';
            statsContainer.innerHTML = '<div class="reviews-empty">No reviews yet</div>';
            return;
        }

        const totalReviews = reviews.length;
        const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;
        const ratingDistribution = {5: 0, 4: 0, 3: 0, 2: 0, 1: 0};
        reviews.forEach(review => ratingDistribution[review.rating]++);

        statsContainer.innerHTML = `
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
                    <div class="stat-label">5 Star Reviews</div>
                </div>
            </div>
            <div class="rating-breakdown">
                ${[5, 4, 3, 2, 1].map(stars => `
                    <div class="rating-row">
                        ${renderStarRating(stars, { compact: true })}
                        <div class="rating-bar">
                            <div class="rating-fill" style="width: ${(ratingDistribution[stars] / totalReviews) * 100}%"></div>
                        </div>
                        <div class="rating-count">${ratingDistribution[stars]}</div>
                    </div>
                `).join('')}
            </div>
        `;

        sortAndDisplayReviews();

    } catch (error) {
        console.error('Error loading reviews:', error);
        container.innerHTML = '<div class="reviews-empty">Error loading reviews. Please try again later.</div>';
        showNotification('Error loading reviews', 'error');
    }
}

function sortAndDisplayReviews() {
    if (!reviews || reviews.length === 0) return;
    
    let sortedReviews = [...reviews];
    
    switch (currentSort) {
        case 'latest':
            sortedReviews.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            break;
        case 'highest':
            sortedReviews.sort((a, b) => b.rating - a.rating);
            break;
        case 'lowest':
            sortedReviews.sort((a, b) => a.rating - b.rating);
            break;
    }
    
    displayReviews(sortedReviews);
}

async function displayReviews(reviewsToDisplay) {
    const container = document.getElementById('reviewsList');
    
    if (!reviewsToDisplay || reviewsToDisplay.length === 0) {
        container.innerHTML = '<div class="reviews-empty">No reviews yet. Be the first to share your experience! ðŸŽ‰</div>';
        return;
    }

    const userIds = [...new Set(reviewsToDisplay.map(review => review.user_id))];
    const { data: users } = await supabaseClient
        .from('user_profiles')
        .select('id, username, full_name')
        .in('id', userIds);

    const userMap = {};
    users?.forEach(user => userMap[user.id] = user);

    container.innerHTML = reviewsToDisplay.map(review => {
        const user = userMap[review.user_id];
        const displayName = user?.full_name || user?.username || 'Anonymous';
        const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
        const canEditDelete = currentUser && currentUser.id === review.user_id;
        const isEditing = editingReviewId === review.id;

        return `
            <div class="review-card" id="review-${review.id}">
                <div class="review-header">
                    <div class="reviewer-info">
                        <div class="reviewer-avatar">${initials}</div>
                        <div class="reviewer-details">
                            <div class="reviewer-name">${displayName}</div>
                            <div class="review-date">${new Date(review.created_at).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                            })}</div>
                        </div>
                    </div>
                    <div class="review-rating">${renderStarRating(review.rating)}</div>
                </div>
                <p class="review-comment">${review.comment}</p>
                ${canEditDelete ? `
                    <div class="review-actions">
                        <button class="review-edit" onclick="editReview('${review.id}')">
                            ${isEditing ? 'Editing...' : 'Edit'}
                        </button>
                        <button class="review-delete" onclick="deleteReview('${review.id}')">
                            Delete
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

async function checkAuth() {
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        currentUser = user;
        
        const reviewForm = document.getElementById('review-form');
        const authPrompt = document.getElementById('auth-prompt');
        
        if (user) {
            reviewForm.style.display = 'block';
            authPrompt.style.display = 'none';
        } else {
            reviewForm.style.display = 'none';
            authPrompt.style.display = 'block';
        }
        
        supabaseClient.auth.onAuthStateChange(async (event, session) => {
            currentUser = session?.user || null;
            
            if (currentUser) {
                reviewForm.style.display = 'block';
                authPrompt.style.display = 'none';
            } else {
                reviewForm.style.display = 'none';
                authPrompt.style.display = 'block';
            }
            
            await loadReviews();
        });
    } catch (error) {
        console.error('Auth error:', error);
        showNotification('Error checking authentication', 'error');
    }
}

function setupReviewEventListeners() {
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('star')) {
            currentRating = parseInt(e.target.dataset.rating);
            updateStars();
        }
    });

    const reviewForm = document.getElementById('review-form');
    if (reviewForm) {
        reviewForm.addEventListener('submit', submitReview);
    }

    const commentTextarea = document.getElementById('review-comment');
    if (commentTextarea) {
        commentTextarea.addEventListener('input', updateCharCount);
    }

    const cancelEditBtn = document.querySelector('.cancel-edit-btn');
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', cancelEdit);
    }
}

function updateStars() {
    const stars = document.querySelectorAll('.star');
    const ratingText = document.getElementById('ratingText');
    
    stars.forEach(star => {
        const starRating = parseInt(star.dataset.rating);
        star.classList.toggle('active', starRating <= currentRating);
    });

    const ratingTexts = ['Select your rating', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
    if (ratingText) {
        ratingText.textContent = ratingTexts[currentRating] || 'Select your rating';
    }
}

function updateCharCount() {
    const textarea = document.getElementById('review-comment');
    const charCount = document.getElementById('charCount');
    if (textarea && charCount) {
        charCount.textContent = textarea.value.length;
    }
}

async function submitReview(e) {
    e.preventDefault();
    const wasEditing = !!editingReviewId;
    
    if (!currentUser) {
        showNotification('Please sign in to submit a review', 'error');
        return;
    }

    const comment = document.getElementById('review-comment').value.trim();
    
    if (currentRating === 0) {
        showNotification('Please select a rating', 'error');
        return;
    }

    if (!comment) {
        showNotification('Please write a comment', 'error');
        return;
    }

    if (comment.length > 500) {
        showNotification('Comment must be 500 characters or less', 'error');
        return;
    }

    const submitBtn = document.querySelector('.submit-review-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');
    
    submitBtn.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline';

    try {
        if (editingReviewId) {
            const { error } = await supabaseClient
                .from('reviews')
                .update({ 
                    rating: currentRating, 
                    comment: comment,
                    updated_at: new Date().toISOString()
                })
                .eq('id', editingReviewId)
                .eq('user_id', currentUser.id);

            if (error) throw error;
            
            showNotification('Review updated successfully!', 'success');
            cancelEdit();
        } else {
            const { data: profile } = await supabaseClient
                .from('user_profiles')
                .select('username, full_name')
                .eq('id', currentUser.id)
                .single();

            const displayName = profile?.full_name || profile?.username || 'User';

            const { error } = await supabaseClient
                .from('reviews')
                .insert({
                    restaurant_id: restaurantId,
                    user_id: currentUser.id,
                    user_name: displayName,
                    rating: currentRating,
                    comment: comment
                });

            if (error) throw error;
            
            showNotification('Review submitted successfully!', 'success');
        }

        if (window.ZO2Y_ANALYTICS && typeof window.ZO2Y_ANALYTICS.track === 'function') {
            window.ZO2Y_ANALYTICS.track('review_saved', { media_type: 'restaurant', is_edit: wasEditing }, { essential: true });
        }
        if (window.ZO2Y_ANALYTICS && typeof window.ZO2Y_ANALYTICS.markFirstAction === 'function') {
            window.ZO2Y_ANALYTICS.markFirstAction('first_review_saved', {}, { essential: true });
        }

        document.getElementById('review-form').reset();
        currentRating = 0;
        updateStars();
        updateCharCount();
        
        await loadReviews();

    } catch (error) {
        console.error('Error submitting review:', error);
        showNotification('Error submitting review. Please try again.', 'error');
    } finally {
        submitBtn.disabled = false;
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
    }
}

async function editReview(reviewId) {
    try {
        const { data: review } = await supabaseClient
            .from('reviews')
            .select('*')
            .eq('id', reviewId)
            .eq('user_id', currentUser.id)
            .single();

        if (!review) {
            showNotification('Review not found', 'error');
            return;
        }

        editingReviewId = reviewId;
        currentRating = review.rating;
        
        document.getElementById('review-comment').value = review.comment;
        updateStars();
        updateCharCount();
        
        document.querySelector('.submit-review-btn .btn-text').textContent = 'Update Review';
        document.querySelector('.cancel-edit-btn').style.display = 'inline-block';
        
        document.getElementById('review-form').scrollIntoView({ 
            behavior: 'smooth',
            block: 'center'
        });

    } catch (error) {
        console.error('Error loading review for edit:', error);
        showNotification('Error loading review', 'error');
    }
}

function cancelEdit() {
    editingReviewId = null;
    currentRating = 0;
    
    document.getElementById('review-form').reset();
    updateStars();
    updateCharCount();
    
    document.querySelector('.submit-review-btn .btn-text').textContent = 'Submit Review';
    document.querySelector('.cancel-edit-btn').style.display = 'none';
}

async function deleteReview(reviewId) {
    if (!currentUser) {
        showNotification('Please log in to delete reviews', 'error');
        return;
    }

    if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
        return;
    }

    try {
        const { error } = await supabaseClient
            .from('reviews')
            .delete()
            .eq('id', reviewId)
            .eq('user_id', currentUser.id);

        if (error) throw error;
        
        showNotification('Review deleted successfully', 'success');
        await loadReviews();

    } catch (error) {
        console.error('Error deleting review:', error);
        showNotification('Error deleting review', 'error');
    }
}

function setupSortControls() {
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            currentSort = e.target.value;
            sortAndDisplayReviews();
        });
        
        document.getElementById('reviewsSortControls').style.display = 'flex';
    }
}

// ============================================
// LIST MANAGER
// ============================================
class RestaurantListManager {
    constructor() {
        this.restaurantId = null;
        this.userLists = [];
        this.customLists = [];
        this.currentLists = {
            favorites: null,
            visited: null,
            wantToGo: null
        };
        this.currentUser = null;
        this.isLoading = false;
        this.dropdownVisible = false;
        this.editingListId = null;
        
        console.log('ðŸ“‹ List Manager Initialized');
    }

    async init() {
        try {
            // Get restaurant ID
            this.restaurantId = await getRestaurantIdFromSlug();
            console.log('ðŸ“‹ Restaurant ID:', this.restaurantId);
            
            // Inject UI immediately
            this.injectListMenu();
            
            // Check auth in background
            await this.checkAuth();
            
            if (this.currentUser && this.restaurantId) {
                await this.loadUserLists();
                this.updateDropdown();
            } else {
                // Still show UI but with login prompt
                this.updateDropdown();
            }
        } catch (error) {
            console.error('Error initializing list manager:', error);
        }
    }

    async checkAuth() {
        try {
            const { data: userData, error: userError } = await supabaseClient.auth.getUser();
            let resolvedUser = userData?.user || null;
            if (userError) {
                const errorMessage = String(userError.message || '').toLowerCase();
                const invalidSession =
                    userError.status === 401 ||
                    errorMessage.includes('jwt') ||
                    errorMessage.includes('token') ||
                    errorMessage.includes('session') ||
                    errorMessage.includes('unauthorized');
                if (invalidSession) {
                    const { data: refreshed, error: refreshError } = await supabaseClient.auth.refreshSession();
                    if (!refreshError && refreshed?.session?.user) {
                        resolvedUser = refreshed.session.user;
                    }
                }
            }
            this.currentUser = resolvedUser;
            
            if (this.currentUser) {
                console.log('ðŸ“‹ User authenticated:', this.currentUser.id);
                
                // Listen for auth changes
                supabaseClient.auth.onAuthStateChange((event, session) => {
                    console.log('ðŸ“‹ Auth state changed:', event);
                    this.currentUser = session?.user || null;
                    if (this.currentUser && this.restaurantId) {
                        this.loadUserLists().then(() => this.updateDropdown());
                    } else {
                        this.updateDropdown();
                    }
                });
            } else {
                console.log('ðŸ“‹ No user authenticated');
            }
        } catch (error) {
            console.error('ðŸ“‹ Auth error:', error);
            this.currentUser = null;
        }
    }

    async loadUserLists() {
        if (this.isLoading) return;
        this.isLoading = true;
        console.log('ðŸ“‹ Loading user lists...');
        
        try {
            const { data: { user } } = await supabaseClient.auth.getUser();
            if (!user) {
                console.log('ðŸ“‹ No user found');
                this.userLists = [];
                this.customLists = [];
                return;
            }

            // Load user's lists
            const { data: lists, error } = await supabaseClient
                .from('lists')
                .select('*')
                .eq('user_id', user.id);
            
            if (error) {
                console.error('ðŸ“‹ Error loading lists:', error);
                throw error;
            }
            
            this.userLists = lists || [];
            console.log('ðŸ“‹ Loaded user lists:', this.userLists.length);
            
            // Filter custom lists
            this.customLists = this.userLists.filter(list => 
                !['Favorites', 'Visited', 'Want to Go'].includes(list.title)
            );
            
            // Setup default lists if they don't exist
            await this.setupDefaultLists();
            
            // Load restaurants in lists
            await this.loadListRestaurants();
            
        } catch (error) {
            console.error('ðŸ“‹ Error loading user lists:', error);
            this.userLists = [];
            this.customLists = [];
        } finally {
            this.isLoading = false;
        }
    }
    
    async setupDefaultLists() {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return;
        
        console.log('ðŸ“‹ Setting up default lists...');
        
        // Find or create default lists
        this.currentLists.favorites = this.userLists.find(list => 
            list.title.toLowerCase() === 'favorites'
        );
        this.currentLists.visited = this.userLists.find(list => 
            list.title.toLowerCase() === 'visited'
        ); 
        this.currentLists.wantToGo = this.userLists.find(list => 
            list.title.toLowerCase() === 'want to go'
        );
        
        // Create missing default lists
        if (!this.currentLists.favorites) {
            console.log('ðŸ“‹ Creating Favorites list...');
            this.currentLists.favorites = await this.createList('Favorites', 'My favorite restaurants');
            if (this.currentLists.favorites) this.userLists.push(this.currentLists.favorites);
        }
        if (!this.currentLists.visited) {
            console.log('ðŸ“‹ Creating Visited list...');
            this.currentLists.visited = await this.createList('Visited', 'Restaurants I have visited');
            if (this.currentLists.visited) this.userLists.push(this.currentLists.visited);
        }
        if (!this.currentLists.wantToGo) {
            console.log('ðŸ“‹ Creating Want to Go list...');
            this.currentLists.wantToGo = await this.createList('Want to Go', 'Restaurants I want to try');
            if (this.currentLists.wantToGo) this.userLists.push(this.currentLists.wantToGo);
        }
    }
    
    async createList(title, description, icon = 'ðŸ“‹') {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return null;
        
        try {
            console.log(`ðŸ“‹ Creating list: ${title}`);
            
            const { data: newList, error } = await supabaseClient
                .from('lists')
                .insert([
                    {
                        user_id: user.id,
                        title: title,
                        description: description,
                        icon: icon,
                        created_at: new Date().toISOString()
                    }
                ])
                .select()
                .single();
            
            if (error) {
                console.error('ðŸ“‹ Error creating list:', error);
                throw error;
            }
            
            // Initialize empty restaurants array
            newList.restaurants = [];
            
            showNotification(`Created "${title}" list`, 'success');
            console.log(`ðŸ“‹ List created:`, newList);
            return newList;
            
        } catch (error) {
            console.error('Error creating list:', error);
            showNotification('Error creating list', 'error');
            return null;
        }
    }
    
    async loadListRestaurants() {
        const listIds = this.userLists.map(list => list.id);
        if (listIds.length === 0) {
            console.log('ðŸ“‹ No lists to load restaurants for');
            return;
        }
        
        console.log('ðŸ“‹ Loading restaurants for lists:', listIds);
        
        try {
            const { data: listRestaurants, error } = await supabaseClient
                .from('lists_restraunts')
                .select('list_id, restraunt_id')
                .in('list_id', listIds);
            
            if (error) {
                console.error('ðŸ“‹ Error loading list restaurants:', error);
                throw error;
            }
            
            // Group restaurants by list
            const restaurantsByList = {};
            listRestaurants?.forEach(item => {
                if (!restaurantsByList[item.list_id]) {
                    restaurantsByList[item.list_id] = [];
                }
                restaurantsByList[item.list_id].push(item.restraunt_id);
            });
            
            // Assign restaurants to each list
            this.userLists.forEach(list => {
                list.restaurants = restaurantsByList[list.id] || [];
            });
            
            // Update custom lists
            this.customLists = this.userLists.filter(list => 
                !['Favorites', 'Visited', 'Want to Go'].includes(list.title)
            );
            
            console.log('ðŸ“‹ Loaded list restaurants');
            
        } catch (error) {
            console.error('Error loading list restaurants:', error);
        }
    }
    
    async checkIfInList(listId) {
        if (!this.currentUser || !this.restaurantId) {
            console.log('ðŸ“‹ Cannot check list: no user or restaurant ID');
            return false;
        }
        
        const list = this.userLists.find(l => l.id === listId);
        if (!list || !list.restaurants) {
            console.log(`ðŸ“‹ List ${listId} not found or has no restaurants`);
            return false;
        }
        
        const isInList = list.restaurants.includes(this.restaurantId);
        console.log(`ðŸ“‹ Restaurant ${this.restaurantId} in list ${listId}: ${isInList}`);
        return isInList;
    }
    
    async toggleInList(listId) {
        if (!this.currentUser || !this.restaurantId) {
            console.log('ðŸ“‹ Cannot toggle list: no user or restaurant ID');
            showLoginModal();
            return false;
        }
        
        const list = this.userLists.find(l => l.id === listId);
        if (!list) {
            console.error(`ðŸ“‹ List ${listId} not found`);
            return false;
        }
        
        try {
            const isInList = await this.checkIfInList(listId);
            
            if (isInList) {
                // Remove from list
                console.log(`ðŸ“‹ Removing restaurant ${this.restaurantId} from list ${listId}`);
                
                const { error } = await supabaseClient
                    .from('lists_restraunts')
                    .delete()
                    .match({
                        list_id: list.id,
                        restraunt_id: this.restaurantId
                    });
                
                if (error) {
                    console.error('ðŸ“‹ Error removing from list:', error);
                    throw error;
                }
                
                // Update local state
                if (list.restaurants) {
                    list.restaurants = list.restaurants.filter(id => id !== this.restaurantId);
                }
                
                showNotification(`Removed from "${list.title}"`, 'info');
                console.log(`ðŸ“‹ Successfully removed from list`);
                return false;
            } else {
                // Add to list
                console.log(`ðŸ“‹ Adding restaurant ${this.restaurantId} to list ${listId}`);
                
                const { error } = await supabaseClient
                    .from('lists_restraunts')
                    .insert([
                        {
                            list_id: list.id,
                            restraunt_id: this.restaurantId,
                            added_at: new Date().toISOString()
                        }
                    ]);
                
                if (error) {
                    console.error('ðŸ“‹ Error adding to list:', error);
                    throw error;
                }
                
                // Update local state
                if (!list.restaurants) list.restaurants = [];
                list.restaurants.push(this.restaurantId);
                
                showNotification(`Added to "${list.title}"`, 'success');
                console.log(`ðŸ“‹ Successfully added to list`);
                return true;
            }
            
        } catch (error) {
            console.error('Error updating list:', error);
            showNotification('Error saving changes', 'error');
            return null;
        }
    }
    
    updateDropdown() {
        const dropdown = document.querySelector('.list-dropdown');
        if (!dropdown) {
            console.error('ðŸ“‹ Dropdown element not found');
            return;
        }
        
        if (this.isLoading) {
            dropdown.innerHTML = `
                <div class="dropdown-header">
                    <h3 class="dropdown-title">Save to Lists</h3>
                    <button class="close-btn" onclick="window.listManager?.hideDropdown()">Ã—</button>
                </div>
                <div style="padding: 40px; text-align: center; color: var(--text2);">
                    <div class="loading-spinner" style="width: 24px; height: 24px; margin: 0 auto 10px;"></div>
                    Loading lists...
                </div>
            `;
            return;
        }
        
        if (!this.currentUser) {
            dropdown.innerHTML = `
                <div class="dropdown-header">
                    <h3 class="dropdown-title">Save to Lists</h3>
                    <button class="close-btn" onclick="window.listManager?.hideDropdown()">Ã—</button>
                </div>
                <div class="auth-prompt" style="padding: 30px; text-align: center;">
                    <div class="auth-icon" style="font-size: 2rem; margin-bottom: 15px; opacity: 0.7;">ðŸ”</div>
                    <div style="color: var(--text2); margin-bottom: 20px; line-height: 1.5;">
                        Sign in to save restaurants to your lists and organize your favorites
                    </div>
                    <button class="btn" onclick="showLoginModal()" style="width: 100%;">
                        <span>â†’</span> Sign In
                    </button>
                </div>
            `;
            return;
        }
        
        // Render lists
        this.renderListsContent(dropdown);
    }
    
    async renderListsContent(dropdown) {
        // Get status for all lists
        const listsWithStatus = await Promise.all(
            this.userLists.map(async (list) => ({
                ...list,
                isChecked: await this.checkIfInList(list.id)
            }))
        );
        
        const defaultLists = listsWithStatus.filter(list => 
            ['Favorites', 'Visited', 'Want to Go'].includes(list.title)
        );
        const customLists = listsWithStatus.filter(list => 
            !['Favorites', 'Visited', 'Want to Go'].includes(list.title)
        );
        
        dropdown.innerHTML = `
            <div class="dropdown-header">
                <h3 class="dropdown-title">Save to Lists</h3>
                <button class="close-btn" onclick="window.listManager?.hideDropdown()">Ã—</button>
            </div>
            
            <div class="lists-scroll-container">
                <div class="list-section">
                    <div class="list-section-title">ðŸŒŸ Quick Actions</div>
                    ${defaultLists.map(list => `
                        <div class="list-item" data-list-id="${list.id}">
                            <div class="list-checkbox ${list.isChecked ? 'checked' : ''}"></div>
                            <span class="list-item-text">
                                ${list.title === 'Favorites' ? 'â¤ï¸' : 
                                list.title === 'Want to Go' ? 'ðŸ“' : 'ðŸ½ï¸'}
                                ${list.title}
                            </span>
                        </div>
                    `).join('')}
                </div>
                
                ${customLists.length > 0 ? `
                <div class="list-section">
                    <div class="list-section-title">ðŸ“‹ Your Lists (${customLists.length})</div>
                ${customLists.map(list => `
                        <div class="list-item" data-list-id="${list.id}">
                            <div class="list-checkbox ${list.isChecked ? 'checked' : ''}"></div>
                            <span class="list-item-text">
                                <span class="list-item-icon">${list.icon || 'ðŸ“‹'}</span>
                                ${list.title}
                            </span>
                            <button class="list-edit-btn" type="button" data-edit-id="${list.id}">
                                <i class="fas fa-edit"></i>
                            </button>
                        </div>
                    `).join('')}
                </div>
                ` : `
                <div class="empty-custom-lists">
                    No custom lists yet. Create one below!
                </div>
                `}
            </div>
            
            <div class="list-section">
                <div class="list-section-title">ðŸ†• Create New</div>
                <input type="text" class="new-list-input" placeholder="Enter list name..." id="newListName">
                <div class="list-icon-options" id="newListIconOptions">
                    <div class="list-icon-option selected" data-icon="ðŸ“‹">ðŸ“‹</div>
                    <div class="list-icon-option" data-icon="â¤ï¸">â¤ï¸</div>
                    <div class="list-icon-option" data-icon="â­">â­</div>
                    <div class="list-icon-option" data-icon="ðŸ“">ðŸ“</div>
                    <div class="list-icon-option" data-icon="ðŸ½ï¸">ðŸ½ï¸</div>
                    <div class="list-icon-option" data-icon="ðŸ”¥">ðŸ”¥</div>
                </div>
                <input type="hidden" id="newListIcon" value="ðŸ“‹">
                <button class="add-list-btn" id="createListBtn">
                    <span>+</span> Create Custom List
                </button>
                <button class="cancel-edit-btn" id="cancelEditListBtn" type="button">Cancel Edit</button>
            </div>
        `;
        
        // Add event listeners
        this.setupDropdownEventListeners(dropdown);
    }
    
    setupDropdownEventListeners(dropdown) {
        // List item clicks
        dropdown.querySelectorAll('.list-item').forEach(item => {
            item.addEventListener('click', async (e) => {
                e.stopPropagation();
                const listId = item.dataset.listId;
                const wasAdded = await this.toggleInList(listId);
                
                if (wasAdded !== null) {
                    const checkbox = item.querySelector('.list-checkbox');
                    if (checkbox) {
                        checkbox.classList.toggle('checked', wasAdded);
                        
                        // Add animation
                        checkbox.style.animation = 'none';
                        setTimeout(() => {
                            checkbox.style.animation = 'checkPop 0.3s ease';
                        }, 10);
                    }
                    
                    // Reload lists to update counts
                    await this.loadUserLists();
                    this.updateDropdown();
                }
            });
        });

        // Edit list buttons
        dropdown.querySelectorAll('.list-edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const listId = btn.dataset.editId;
                const list = this.customLists.find(l => l.id === listId);
                if (list) {
                    startEditList(list);
                }
            });
        });
        
        // Create list button
        const createBtn = dropdown.querySelector('#createListBtn');
        const nameInput = dropdown.querySelector('#newListName');
        const newListIconInput = dropdown.querySelector('#newListIcon');
        const cancelEditBtn = dropdown.querySelector('#cancelEditListBtn');
        const iconOptions = dropdown.querySelectorAll('.list-icon-option');

        const setSelectedIcon = (icon) => {
            if (!newListIconInput) return;
            newListIconInput.value = icon || 'ðŸ“‹';
            if (iconOptions && iconOptions.length > 0) {
                iconOptions.forEach(option => {
                    option.classList.toggle('selected', option.getAttribute('data-icon') === newListIconInput.value);
                });
            }
        };

        const resetListForm = () => {
            if (nameInput) nameInput.value = '';
            setSelectedIcon('ðŸ“‹');
            this.editingListId = null;
            if (createBtn) createBtn.innerHTML = '<span>+</span> Create Custom List';
            if (cancelEditBtn) cancelEditBtn.style.display = 'none';
        };

        const startEditList = (list) => {
            if (!list || !nameInput) return;
            this.editingListId = list.id;
            nameInput.value = list.title || '';
            setSelectedIcon(list.icon || 'ðŸ“‹');
            if (createBtn) createBtn.innerHTML = '<i class="fas fa-save"></i> Update List';
            if (cancelEditBtn) cancelEditBtn.style.display = 'block';
            nameInput.focus();
        };

        if (iconOptions && iconOptions.length > 0) {
            iconOptions.forEach(option => {
                option.addEventListener('click', () => {
                    setSelectedIcon(option.getAttribute('data-icon'));
                });
            });
        }

        if (cancelEditBtn) {
            cancelEditBtn.addEventListener('click', (e) => {
                e.preventDefault();
                resetListForm();
            });
        }

        resetListForm();
        
        createBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const name = nameInput.value.trim();
            if (!name) {
                showNotification('Please enter a list name', 'warning');
                return;
            }

            const selectedIcon = newListIconInput?.value || 'ðŸ“‹';
            const existingList = this.customLists.find(list => 
                list.title.toLowerCase() === name.toLowerCase() && list.id !== this.editingListId
            );
            
            if (existingList) {
                showNotification(`"${name}" list already exists`, 'warning');
                return;
            }

            if (this.editingListId) {
                const { error } = await supabaseClient
                    .from('lists')
                    .update({
                        title: name,
                        icon: selectedIcon,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', this.editingListId);

                if (error) {
                    console.error('Error updating list:', error);
                    showNotification('Error updating list', 'error');
                    return;
                }

                const listIndex = this.customLists.findIndex(list => list.id === this.editingListId);
                if (listIndex > -1) {
                    this.customLists[listIndex] = {
                        ...this.customLists[listIndex],
                        title: name,
                        icon: selectedIcon
                    };
                }

                const userListIndex = this.userLists.findIndex(list => list.id === this.editingListId);
                if (userListIndex > -1) {
                    this.userLists[userListIndex] = {
                        ...this.userLists[userListIndex],
                        title: name,
                        icon: selectedIcon
                    };
                }

                showNotification(`Updated list "${name}"`, 'success');
                resetListForm();
                await this.updateDropdown();
                return;
            }

            const newList = await this.createList(name, 'Custom list', selectedIcon);
            if (newList) {
                resetListForm();
                
                // Add to user lists
                this.userLists.push(newList);
                this.customLists = this.userLists.filter(list => 
                    !['Favorites', 'Visited', 'Want to Go'].includes(list.title)
                );
                
                // Update dropdown
                await this.updateDropdown();
                
                // Ask if user wants to add current restaurant
                const addToNewList = confirm(`Would you like to add this restaurant to "${name}"?`);
                if (addToNewList) {
                    await this.toggleInList(newList.id);
                    await this.updateDropdown();
                }
            }
        });
        
        // Enter key for input
        nameInput.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                e.stopPropagation();
                createBtn.click();
            }
        });
    }
    
    showDropdown() {
        const dropdown = document.querySelector('.list-dropdown');
        if (dropdown) {
            dropdown.classList.add('show');
            this.dropdownVisible = true;
            this.updateDropdown();
        }
    }
    
    hideDropdown() {
        const dropdown = document.querySelector('.list-dropdown');
        if (dropdown) {
            dropdown.classList.remove('show');
            this.dropdownVisible = false;
        }
    }
    
    toggleDropdown() {
        if (this.dropdownVisible) {
            this.hideDropdown();
        } else {
            this.showDropdown();
        }
    }
    
    injectListMenu() {
        // Remove existing FAB if any
        const existingFab = document.querySelector('.list-manager-fab');
        if (existingFab) existingFab.remove();
        
        const existingDropdown = document.querySelector('.list-dropdown');
        if (existingDropdown) existingDropdown.remove();
        
        // Create FAB button
        const fab = document.createElement('div');
        fab.className = 'list-manager-fab';
        fab.innerHTML = `
            <button class="fab-main" title="Save to lists">
                <svg class="fab-icon" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </button>
        `;
        
        // Create dropdown
        const dropdown = document.createElement('div');
        dropdown.className = 'list-dropdown';
        
        // Store reference to this manager instance
        const manager = this;
        
        // FAB click handler
        fab.addEventListener('click', (e) => {
            e.stopPropagation();
            manager.toggleDropdown();
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!fab.contains(e.target) && !dropdown.contains(e.target)) {
                manager.hideDropdown();
            }
        });
        
        // Prevent dropdown clicks from closing
        dropdown.addEventListener('click', (e) => e.stopPropagation());
        
        // Add to DOM
        document.body.appendChild(fab);
        document.body.appendChild(dropdown);
        
        console.log('âœ… List manager UI injected');
    }
}

function initializeListManager() {
    try {
        listManager = new RestaurantListManager();
        window.listManager = listManager;
        
        // Initialize list manager after a short delay to ensure page is loaded
        setTimeout(() => {
            listManager.init().catch(err => {
                console.error('List manager initialization failed:', err);
            });
        }, 1000);
    } catch (err) {
        console.error('Error creating list manager:', err);
    }
}

// ============================================
// GALLERY LIGHTBOX
// ============================================
function openImageModal(imageUrl, caption) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightbox-image');
    const lightboxCaption = document.getElementById('lightbox-caption');
    
    // Get filtered images based on current category
    const filteredImages = currentGalleryCategory === 'all' 
        ? galleryImages
        : galleryImages.filter(img => img.image_type === currentGalleryCategory);
    
    currentGalleryIndex = filteredImages.findIndex(img => img.image_url === imageUrl);
    
    lightboxImage.src = imageUrl;
    lightboxCaption.textContent = caption;
    
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
}

function changeImage(direction) {
    // Get filtered images based on current category
    const filteredImages = currentGalleryCategory === 'all' 
        ? galleryImages
        : galleryImages.filter(img => img.image_type === currentGalleryCategory);
    
    if (filteredImages.length === 0) return;
    
    currentGalleryIndex = (currentGalleryIndex + direction + filteredImages.length) % filteredImages.length;
    
    const lightboxImage = document.getElementById('lightbox-image');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const image = filteredImages[currentGalleryIndex];
    const restaurantName = document.getElementById('restaurant-name').textContent;
    
    lightboxImage.src = image.image_url;
    lightboxCaption.textContent = `${restaurantName} - ${image.image_type}`;
}

// ============================================
// GLOBAL EVENT LISTENERS
// ============================================
function setupGlobalEventListeners() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeLightbox();
            closeLoginModal();
            if (window.listManager) window.listManager.hideDropdown();
        } else if (e.key === 'ArrowLeft') {
            changeImage(-1);
        } else if (e.key === 'ArrowRight') {
            changeImage(1);
        }
    });

    document.getElementById('lightbox').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
            closeLightbox();
        }
    });

    document.getElementById('loginModal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
            closeLoginModal();
        }
    });
}

// ============================================
// EXPOSE FUNCTIONS TO GLOBAL SCOPE
// ============================================
window.editReview = editReview;
window.deleteReview = deleteReview;
window.openLightbox = openImageModal;
window.closeLightbox = closeLightbox;
window.changeImage = changeImage;
window.showLoginModal = showLoginModal;
window.closeLoginModal = closeLoginModal;
window.openImageModal = openImageModal;

// ============================================
// START APPLICATION
// ============================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeRestaurantPage);
} else {
    initializeRestaurantPage();
}


