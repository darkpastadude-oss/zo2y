// ===== GLOBAL PROFILE MANAGER =====
        const ProfileManager = (function() {
            // Supabase configuration
            const SUPABASE_URL = "https://gfkhjbztayjyojsgdpgk.supabase.co";
            const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma2hqYnp0YXlqeW9qc2dkcGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwOTYyNjQsImV4cCI6MjA3NTY3MjI2NH0.WUb2yDAwCeokdpWCPeH13FE8NhWF6G8e6ivTsgu6b2s";
            const TMDB_PROXY_BASE = "/api/tmdb";
            const IGDB_PROXY_BASE = "/api/igdb";
            const TMDB_POSTER = "https://image.tmdb.org/t/p/w500";
            const OPEN_LIBRARY_BASE = "https://openlibrary.org";
            const OPEN_LIBRARY_PROXY_BASE = "/api/openlibrary";
            const GOOGLE_BOOKS_PROXY_BASE = "/api/books";
            const FALLBACK_BOOK_IMAGE = "/newlogo.webp";
            const BOOKS_CACHE_BUSTER = "20260323-api-only-profile";

            async function igdbFetch(path, params = {}, signal = null) {
                if (window.ZO2Y_IGDB && typeof window.ZO2Y_IGDB.request === "function") {
                    return window.ZO2Y_IGDB.request(path, params, signal ? { signal } : undefined);
                }
                const url = new URL(`${IGDB_PROXY_BASE}${path}`, window.location.origin);
                Object.entries(params || {}).forEach(([key, value]) => {
                    if (value === undefined || value === null || value === "") return;
                    url.searchParams.set(key, String(value));
                });
                const res = await fetch(url.toString(), signal ? { signal } : undefined);
                if (!res.ok) throw new Error(`IGDB error ${res.status}`);
                const json = await res.json().catch(() => null);
                if (!json) throw new Error('IGDB error');
                return json;
            }

            // Initialize Supabase client
            let supabase = null;

            // Global state
            let currentUser = null;
            let userProfile = null;
            let targetUser = null;
            let targetUserId = null;
            let isViewingOwnProfile = true;
            const ENABLE_RESTAURANTS = false;
            const GAMES_DISABLED = false;
            const DEFAULT_PROFILE_TAB = ENABLE_RESTAURANTS ? 'restaurants' : 'movies';
            const VALID_PRIMARY_TABS = new Set(['overview', 'reviews', 'lists', 'activity', 'about']);
            let currentPrimaryTab = 'overview';
            let lastMediaTab = DEFAULT_PROFILE_TAB;
            let restaurants = [];
            let customLists = [];
            let currentTab = DEFAULT_PROFILE_TAB;
            let journalFilter = 'all';
            let currentActiveList = null;
            let selectedAvatarIcon = null;
            let currentEditingJournalEntry = null;
            let loadedUserIds = new Set();
            let communitySystem = null;
            let isEditingList = false;
            let editingListId = null;
            let followStatusCache = new Map();
            let currentSearchDebounce = null;
            let isSubmittingList = false;
            let movieCache = new Map();
            let tvCache = new Map();
            let animeCache = new Map();
            let gameCache = new Map();
            let bookCache = new Map();
            let musicCache = new Map();
            let travelCountryCache = new Map();
            let fashionBrandCache = new Map();
            let foodBrandCache = new Map();
            let carBrandCache = new Map();
            let renderMoviesToken = 0;
            let renderTvToken = 0;
            let renderAnimeToken = 0;
            let renderGamesToken = 0;
            let renderBooksToken = 0;
            let renderMusicToken = 0;
            let renderTravelToken = 0;
            let renderFashionToken = 0;
            let renderFoodToken = 0;
            let renderCarsToken = 0;
            let renderSportsToken = 0;
            let renderRestaurantsToken = 0;
            let editingMediaList = null;
            let currentMediaDetail = null;
            let hasPreloadedTabs = false;
            let tabSwitchToken = 0;
            let hasBoundRouteListeners = false;
            let hasBoundModalViewportListeners = false;
            const TAB_RENDER_CACHE_TTL_MS = 5 * 60 * 1000;
            const tabRenderCache = new Map();
            const PREVIEW_ASSET_CACHE_TTL_MS = 10 * 60 * 1000;
            const previewAssetCache = new Map();

            function clearLegacyProfileBookCaches() {
                try {
                    const keysToRemove = [];
                    for (let index = 0; index < localStorage.length; index += 1) {
                        const key = String(localStorage.key(index) || '');
                        if (!key) continue;
                        if (key.startsWith('profile_books_') || key.startsWith('zo2y_books_') || key.startsWith('books_search_v')) {
                            keysToRemove.push(key);
                        }
                    }
                    keysToRemove.forEach((key) => localStorage.removeItem(key));
                } catch (_err) {}
            }
            const PROFILE_THEME_KEYS = ['navy', 'ocean', 'sunset', 'forest'];
            const PROFILE_THEME_META = {
                navy: { themeColor: '#0b1633' },
                ocean: { themeColor: '#071f2b' },
                sunset: { themeColor: '#2a1328' },
                forest: { themeColor: '#102015' }
            };
            const PROFILE_PIN_TABLE = 'profile_pinned_lists';
            const LIST_COLLAB_TABLE = 'list_collaborators';
            const CUSTOM_LIST_TABLES = {
                movie: 'movie_lists',
                tv: 'tv_lists',
                anime: 'anime_lists',
                ...(GAMES_DISABLED ? {} : { game: 'game_lists' }),
                book: 'book_lists',
                music: 'music_lists',
                travel: 'travel_lists',
                fashion: 'fashion_lists',
                food: 'food_lists',
                car: 'car_lists'
            };
            const MEDIA_ITEM_TABLES = {
                movie: 'movie_list_items',
                tv: 'tv_list_items',
                anime: 'anime_list_items',
                ...(GAMES_DISABLED ? {} : { game: 'game_list_items' }),
                book: 'book_list_items',
                music: 'music_list_items',
                travel: 'travel_list_items',
                fashion: 'fashion_list_items',
                food: 'food_list_items',
                car: 'car_list_items'
            };
            const MEDIA_ITEM_FIELDS = {
                movie: 'movie_id',
                tv: 'tv_id',
                anime: 'anime_id',
                ...(GAMES_DISABLED ? {} : { game: 'game_id' }),
                book: 'book_id',
                music: 'track_id',
                travel: 'country_code',
                fashion: 'brand_id',
                food: 'brand_id',
                car: 'brand_id'
            };
            let manualProfileBadges = [];
            let profileStatsSnapshot = {
                visitedCount: 0,
                followersCount: 0,
                listsCount: 0,
                reviewsCount: 0,
                followingCount: 0
            };
            let pinnedListsMap = new Map();
            let pinnedListsOwnerId = '';
            let collaborativeListAccess = new Map();
            let editingMediaCollaborators = [];
            let hasWarnedMissingCollaborativeTable = false;
            let statsRealtimeChannels = [];
            let statsRealtimeTargetId = '';
            let statsRealtimeRefreshTimer = null;
            let hasBoundStatsRealtimeLifecycle = false;
            const STATS_REALTIME_DEBOUNCE_MS = 220;
            const VALID_PROFILE_TABS = new Set(
                ENABLE_RESTAURANTS
                    ? ['restaurants', 'movies', 'tv', 'anime', ...(GAMES_DISABLED ? [] : ['games']), 'books', 'music', 'sports', 'travel', 'fashion', 'food', 'cars', 'community']
                    : ['movies', 'tv', 'anime', ...(GAMES_DISABLED ? [] : ['games']), 'books', 'music', 'sports', 'travel', 'fashion', 'food', 'cars', 'community']
            );
            const VALID_COLLECTION_TYPES = new Set([
                ...(ENABLE_RESTAURANTS ? ['restaurant'] : []),
                'movie',
                'tv',
                'anime',
                ...(GAMES_DISABLED ? [] : ['game']),
                'book',
                'music',
                'travel',
                'fashion',
                'food',
                'car'
            ]);
            const COLLECTION_TO_TAB = {
                ...(ENABLE_RESTAURANTS ? { restaurant: 'restaurants' } : {}),
                movie: 'movies',
                tv: 'tv',
                anime: 'anime',
                ...(GAMES_DISABLED ? {} : { game: 'games' }),
                book: 'books',
                music: 'music',
                travel: 'travel',
                fashion: 'fashion',
                food: 'food',
                car: 'cars'
            };
            const COLLECTION_VIEW_STORAGE_KEY = 'zo2y_profile_collection_view_modes_v2';
            let collectionViewModes = loadCollectionViewModes();

            // Avatar/icon palette (unicode escapes to avoid encoding issues)
            const avatarIcons = [
                "\u{1F464}", "\u{1F3AC}", "\u{1F3A5}", "\u{1F4FA}", "\u{1F409}",
                "\u{1F3AE}", "\u{1F4DA}", "\u{1F3B5}", "\u{1F3A7}", "\u{1F3A4}",
                "\u{1F3B8}", "\u{1F3B9}", "\u{1F3BB}", "\u{1F4F7}", "\u{1F3AD}",
                "\u{1F39F}\uFE0F", "\u{1F3AB}", "\u{1F3AA}", "\u{1F4FD}", "\u{1F31F}",
                "\u{2B50}", "\u{1F680}", "\u{1F3AF}", "\u{1F3C6}", "\u{2728}"
            ];

            async function sleep(ms) {
                await new Promise((resolve) => setTimeout(resolve, ms));
            }

            async function resolveAuthenticatedProfileUser() {
                if (!supabase || !supabase.auth) return null;

                try {
                    const { data: sessionData } = await supabase.auth.getSession();
                    const sessionUser = sessionData?.session?.user || null;
                    if (sessionUser?.id) return sessionUser;
                } catch (_sessionErr) {}

                for (let attempt = 0; attempt < 4; attempt += 1) {
                    try {
                        const { data: userData, error } = await supabase.auth.getUser();
                        const verifiedUser = userData?.user || null;
                        if (!error && verifiedUser?.id) return verifiedUser;
                    } catch (_userErr) {}
                    await sleep(180 * (attempt + 1));
                }

                try {
                    const { data: fallbackSessionData } = await supabase.auth.getSession();
                    return fallbackSessionData?.session?.user || null;
                } catch (_fallbackErr) {
                    return null;
                }
            }

            // ===== INITIALIZATION =====
            async function initialize() {
                try {
                    clearLegacyProfileBookCaches();
                    if (!window.supabase) {
                        console.error('Supabase library not loaded');
                        return;
                    }
                    
                    if (window.__ZO2Y_ENSURE_SUPABASE_CLIENT && typeof window.__ZO2Y_ENSURE_SUPABASE_CLIENT === 'function') {
                        supabase = await window.__ZO2Y_ENSURE_SUPABASE_CLIENT();
                    }
                    if (!supabase) {
                        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
                            auth: {
                                storageKey: 'sb-gfkhjbztayjyojsgdpgk-auth-token',
                                persistSession: true,
                                autoRefreshToken: true,
                                detectSessionInUrl: false
                            }
                        });
                    }

                    const user = await resolveAuthenticatedProfileUser();
                    if (!user) {
                        window.location.replace("login.html");
                        return;
                    }

                    currentUser = user;
                    if (window.ListUtils && typeof ListUtils.setTierSyncContext === 'function') {
                        ListUtils.setTierSyncContext(supabase, currentUser.id);
                    }

                    disableRestaurantFeatures();
                    disableGameFeatures();
                    
                    // 5. FIX: Optimized initialization to load faster
                    await loadProfile();

                    // Load restaurants in background
                    if (ENABLE_RESTAURANTS) {
                        loadRestaurants().catch(err => console.error('Restaurant load error:', err));
                    }
                    
                    // Initialize systems
                    communitySystem = createCommunitySystem();
                    
                    // Initialize list manager and community in background
                    const initTasks = [communitySystem.init()];
                    if (ENABLE_RESTAURANTS) {
                        initTasks.unshift(listManager.init());
                    }
                    Promise.all(initTasks).catch(err => console.error('Initialization error:', err));
                    
                    // 2. FIX: Update setupEventListeners to prevent multiple bindings
                    setupEventListeners();
                    showPrimaryTab('overview', { force: true, skipTabSync: true });
                    bindRouteListeners();
                    
                    if (window.innerWidth <= 768) {
                        initializeMobile();
                    }

                    await hydrateInitialRoute();
                    preloadCollectionTabs();
                    updateCollectionViewToggleButtons();

                    if (!isCollectionRouteActive()) {
                        renderMovies().catch(() => {});
                    }
                    
                    // Handle click outside dropdown
                    document.addEventListener('click', (e) => {
                        if (!e.target.closest('.list-card-actions')) {
                            document.querySelectorAll('.kebab-dropdown').forEach(d => d.classList.remove('show'));
                        }
                        if (!e.target.closest('.collection-card-actions')) {
                            document.querySelectorAll('.collection-dropdown').forEach(d => d.classList.remove('show'));
                        }
                    });
                    
                } catch (error) {
                    console.error('Error initializing profile page:', error);
                    showToast('Error loading profile', 'error');
                }
            }

            // ===== MOBILE INITIALIZATION =====
            function initializeMobile() {
                updateMobileStats();
                setupMobileTabsHint();
            }

            function disableRestaurantFeatures() {
                if (ENABLE_RESTAURANTS) return;

                const removeSelectors = [
                    '.nav-tab[data-tab="restaurants"]',
                    '#restaurants-tab',
                    '#restaurant-detail-view',
                    '#createRestaurantListBtn',
                    '.mobile-tab[data-tab="restaurants"]',
                    '#mobileRestaurantsSection',
                    '#mobileRestaurantDetailSection',
                    '#mobileCreateRestaurantListBtn',
                    'button[onclick*="createListForType(\'restaurants\')"]',
                    '.mobile-nav-item[href="restraunts.html"]',
                    '.list-icon-option[data-icon="restaurant"]',
                    '.edit-list-icon-option[data-icon="restaurant"]'
                ];
                removeSelectors.forEach((selector) => {
                    document.querySelectorAll(selector).forEach((el) => el.remove());
                });

                const mobileProfileItem = document.querySelector('.mobile-bottom-nav-item[onclick*="showTab(\'restaurants\')"]');
                if (mobileProfileItem) {
                    mobileProfileItem.setAttribute('onclick', `ProfileManager.showTab('${DEFAULT_PROFILE_TAB}')`);
                }

                const desktopVisitedLabel = document.querySelector('.stats-grid .stat-card:first-child .stat-label');
                if (desktopVisitedLabel) desktopVisitedLabel.textContent = 'Items Saved';
                const mobileVisitedLabel = document.querySelector('.mobile-stats .mobile-stat:first-child .mobile-stat-label');
                if (mobileVisitedLabel) mobileVisitedLabel.textContent = 'Saved';
                const visitedMeta = document.getElementById('visitedCountMeta');
                if (visitedMeta) visitedMeta.textContent = '0 saved items';
            }

            function disableGameFeatures() {
                if (!GAMES_DISABLED) return;

                const removeSelectors = [
                    '.nav-tab[data-tab="games"]',
                    '#games-tab',
                    '#game-detail-view',
                    '#createGameListBtn',
                    '.mobile-tab[data-tab="games"]',
                    '#mobileGamesSection',
                    '#mobileGameDetailSection',
                    '#mobileCreateGameListBtn',
                    "button[onclick*=\"createListForType('games')\"]",
                    "button[onclick*=\"createListForType('game')\"]",
                    'button[onclick*="games.html"]',
                    'a[href="games.html"]',
                    'a[href="/games.html"]',
                    '.list-icon-option[data-icon="game"]',
                    '.edit-list-icon-option[data-icon="game"]'
                ];
                removeSelectors.forEach((selector) => {
                    document.querySelectorAll(selector).forEach((el) => el.remove());
                });

                document.querySelectorAll("[onclick*=\"showTab('games')\"]").forEach((el) => {
                    el.setAttribute('onclick', `ProfileManager.showTab('${DEFAULT_PROFILE_TAB}')`);
                });

                if (currentTab === 'games') {
                    currentTab = DEFAULT_PROFILE_TAB;
                }
            }

            const RESERVED_PROFILE_USERNAMES = new Set([
                'admin', 'api', 'app', 'auth', 'authcallback', 'blog', 'book', 'books',
                'country', 'edit', 'explore', 'game', 'games', 'help', 'home', 'index',
                'login', 'movie', 'movies', 'music', 'new', 'privacy', 'profile',
                'resetpassword', 'reviews', 'search', 'settings', 'signup', 'support',
                'terms', 'travel', 'tv', 'tvshow', 'tvshows', 'updatepassword', 'user',
                'users', 'zo2y'
            ]);

            function normalizeProfileUsername(value) {
                const normalized = String(value || '')
                    .trim()
                    .replace(/^@+/, '')
                    .toLowerCase()
                    .replace(/['’]/g, '')
                    .replace(/[^a-z0-9_]+/g, '_')
                    .replace(/_+/g, '_')
                    .replace(/^_+|_+$/g, '')
                    .slice(0, 30);
                return normalized;
            }

            function isValidProfileUsername(value) {
                return /^[a-z0-9_]{3,30}$/.test(String(value || ''));
            }

            function buildProfileUsernameCandidates(seed, userId) {
                const rawBaseSeed = normalizeProfileUsername(seed) || 'user';
                const baseSeed = RESERVED_PROFILE_USERNAMES.has(rawBaseSeed.replace(/_/g, ''))
                    ? `${rawBaseSeed.slice(0, 24)}_user`.slice(0, 30)
                    : rawBaseSeed;
                const uniqueSeed = String(userId || '').replace(/-/g, '').slice(0, 6).toLowerCase() || 'user';
                const paddedBase = baseSeed.length >= 3 ? baseSeed : normalizeProfileUsername(`user_${baseSeed}`) || 'user';
                const suffixCandidate = `${paddedBase.slice(0, Math.max(3, 30 - uniqueSeed.length - 1))}_${uniqueSeed}`.slice(0, 30);
                return Array.from(new Set([paddedBase.slice(0, 30), suffixCandidate]));
            }

            async function ensureProfileUsernameAvailable(username, currentProfileId = '') {
                const normalizedUsername = normalizeProfileUsername(username);
                if (!isValidProfileUsername(normalizedUsername)) {
                    throw new Error('Username must be 3-30 characters and use only letters, numbers, or underscores.');
                }
                if (RESERVED_PROFILE_USERNAMES.has(normalizedUsername.replace(/_/g, ''))) {
                    throw new Error('That username is reserved. Choose another one.');
                }

                const { data, error } = await supabase
                    .from('user_profiles')
                    .select('id')
                    .eq('username', normalizedUsername)
                    .limit(10);

                if (error) throw error;

                const isTaken = Array.isArray(data) && data.some((row) => String(row?.id || '') !== String(currentProfileId || currentUser?.id || ''));
                if (isTaken) {
                    throw new Error('That username is already taken.');
                }

                return normalizedUsername;
            }

            function setupMobileTabsHint() {
                const tabs = document.querySelector('.mobile-tabs');
                const hint = document.getElementById('mobileTabsSwipeHint');
                if (!tabs || !hint) return;

                const updateHintVisibility = () => {
                    const maxScroll = tabs.scrollWidth - tabs.clientWidth;
                    if (maxScroll <= 12) {
                        hint.classList.add('hidden');
                        return;
                    }
                    const hasScrolled = tabs.scrollLeft > 6;
                    hint.classList.toggle('hidden', hasScrolled);
                };

                tabs.addEventListener('scroll', updateHintVisibility, { passive: true });
                setTimeout(updateHintVisibility, 50);
                setTimeout(updateHintVisibility, 500);
            }

            function preloadCollectionTabs() {
                if (hasPreloadedTabs || !currentUser) return;
                if (isCollectionRouteActive()) return;
                hasPreloadedTabs = true;
                const deferMs = window.innerWidth <= 768 ? 2200 : 1200;
                setTimeout(() => {
                    if (document.hidden) return;
                    const activeTab = String(currentTab || 'movies').trim().toLowerCase();
                    const preloadTasks = [];
                    if (activeTab === 'movies' && !hasFreshTabRender('movies')) preloadTasks.push(renderMovies());
                    if (activeTab === 'tv' && !hasFreshTabRender('tv')) preloadTasks.push(renderTvShows());
                    if (activeTab === 'anime' && !hasFreshTabRender('anime')) preloadTasks.push(renderAnimeShows());
                    if (activeTab === 'games' && !GAMES_DISABLED && !hasFreshTabRender('games')) preloadTasks.push(renderGames());
                    if (activeTab === 'books' && !hasFreshTabRender('books')) preloadTasks.push(renderBooks());
                    if (activeTab === 'music' && !hasFreshTabRender('music')) preloadTasks.push(renderMusic());
                    if (activeTab === 'sports' && !hasFreshTabRender('sports')) preloadTasks.push(renderSports());
                    if (activeTab === 'travel' && !hasFreshTabRender('travel')) preloadTasks.push(renderTravel());
                    if (activeTab === 'fashion' && !hasFreshTabRender('fashion')) preloadTasks.push(renderFashion());
                    if (activeTab === 'food' && !hasFreshTabRender('food')) preloadTasks.push(renderFood());
                    if (activeTab === 'cars' && !hasFreshTabRender('cars')) preloadTasks.push(renderCars());
                    if (!preloadTasks.length) return;
                    Promise.allSettled(preloadTasks).catch(() => {});
                }, deferMs);
            }

            // ===== TOAST SYSTEM =====
            function showToast(message, type = 'info', duration = 3000) {
                const isMobile = window.innerWidth <= 768;
                const toastContainerId = isMobile ? 'mobileToastContainer' : 'toastContainer';
                let toastContainer = document.getElementById(toastContainerId);
                
                if (!toastContainer) {
                    toastContainer = document.createElement('div');
                    toastContainer.className = isMobile ? 'mobile-toast-container' : 'toast-container';
                    toastContainer.id = toastContainerId;
                    document.body.appendChild(toastContainer);
                }
                
                const toast = document.createElement('div');
                toast.className = isMobile ? `mobile-toast ${type}` : `toast ${type}`;
                
                const icons = {
                    success: 'fas fa-check-circle',
                    error: 'fas fa-exclamation-circle',
                    warning: 'fas fa-exclamation-triangle',
                    info: 'fas fa-info-circle'
                };
                
                if (isMobile) {
                    toast.innerHTML = `
                        <i class="${icons[type]}" style="color: ${type === 'success' ? 'var(--success)' : type === 'error' ? 'var(--error)' : type === 'warning' ? 'var(--warning)' : 'var(--accent)'}; font-size: 20px;"></i>
                        <div style="flex: 1; font-size: 14px;">${message}</div>
                        <button onclick="this.parentElement.remove()" style="background: none; border: none; color: var(--muted); font-size: 20px; cursor: pointer;">&times;</button>
                    `;
                } else {
                    toast.innerHTML = `
                        <i class="${icons[type]} toast-icon"></i>
                        <div class="toast-content">
                            <div class="toast-message">${message}</div>
                        </div>
                        <button class="toast-close">&times;</button>
                    `;
                    
                    const closeBtn = toast.querySelector('.toast-close');
                    closeBtn.addEventListener('click', () => toast.remove());
                }
                
                toastContainer.appendChild(toast);
                
                setTimeout(() => {
                    if (toast.parentNode) toast.remove();
                }, duration);
            }

            function closeProfileTabGroups() {
                document.querySelectorAll('.profile-tab-group-row').forEach((row) => {
                    row.classList.remove('open');
                    row.style.display = 'none';
                });
                document.querySelectorAll('.profile-tab-group-toggle[aria-expanded="true"]').forEach((toggle) => {
                    toggle.setAttribute('aria-expanded', 'false');
                });
            }

            function resolveProfileGroupRow(group, toggle) {
                if (!group) return null;
                const isMobile = window.innerWidth <= 768;
                const inMobileTabs = !!toggle?.closest?.('.mobile-tabs');
                if (isMobile || inMobileTabs) {
                    return document.querySelector(`.profile-tab-group-row.mobile[data-group="${group}"]`);
                }
                return document.querySelector(`.profile-tab-group-row[data-group="${group}"]:not(.mobile)`);
            }

            function wireProfileTabGroups() {
                const toggles = Array.from(document.querySelectorAll('.profile-tab-group-toggle'));
                if (!toggles.length) return;

                toggles.forEach((toggle) => {
                    if (toggle.dataset.wired === '1') return;
                    toggle.dataset.wired = '1';
                    toggle.addEventListener('click', (event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        event.stopImmediatePropagation();
                        if (currentPrimaryTab !== 'lists') {
                            showPrimaryTab('lists', { force: true, skipTabSync: true });
                            const fallbackTab = lastMediaTab && lastMediaTab !== 'community'
                                ? lastMediaTab
                                : DEFAULT_PROFILE_TAB;
                            showTab(fallbackTab, { skipUrlSync: true, skipPrimarySync: true, skipRender: true });
                        }
                        const group = toggle.getAttribute('data-group');
                        if (!group) return;
                        const row = resolveProfileGroupRow(group, toggle);
                        const isOpen = row && (row.classList.contains('open') || row.style.display === 'flex');
                        closeProfileTabGroups();
                        if (row && !isOpen) {
                            row.classList.add('open');
                            row.style.display = 'flex';
                            toggle.setAttribute('aria-expanded', 'true');
                        }
                    });
                });

                document.addEventListener('click', (event) => {
                    if (!(event.target instanceof Element)) return;
                    if (event.target.closest('.profile-tab-group-row') || event.target.closest('.profile-tab-group-toggle')) return;
                    closeProfileTabGroups();
                });
            }

            function ensureProfileGroupRowVisible(tabName) {
                const mediaTabs = new Set(['movies', 'tv', 'anime', 'books', 'music']);
                const lifestyleTabs = new Set(['sports', 'travel', 'fashion', 'food', 'cars']);
                let group = '';
                if (mediaTabs.has(tabName)) group = 'media';
                if (lifestyleTabs.has(tabName)) group = 'lifestyle';
                if (!group) return;
                const row = resolveProfileGroupRow(group, window.innerWidth <= 768 ? document.querySelector('.mobile-tabs') : null);
                const toggle = document.querySelector(`.profile-tab-group-toggle[data-group="${group}"]`);
                if (row && !row.classList.contains('open')) {
                    row.classList.add('open');
                    row.style.display = 'flex';
                }
                if (toggle) toggle.setAttribute('aria-expanded', 'true');
            }

            function normalizePrimaryTab(tabName) {
                const safe = String(tabName || '').trim().toLowerCase();
                return VALID_PRIMARY_TABS.has(safe) ? safe : 'overview';
            }

            function syncPrimaryTabUi(activeTab) {
                document.body.dataset.profilePrimary = activeTab;
                document.querySelectorAll('[data-primary-tab]').forEach((btn) => {
                    const key = btn.getAttribute('data-primary-tab');
                    btn.classList.toggle('active', key === activeTab);
                });
            }

            function showPrimaryTab(tabName, options = {}) {
                const safeTab = normalizePrimaryTab(tabName);
                if (safeTab === currentPrimaryTab && options.force !== true) return;
                currentPrimaryTab = safeTab;
                syncPrimaryTabUi(safeTab);

                const isMobile = window.innerWidth <= 768;
                if (isMobile && safeTab !== 'lists' && safeTab !== 'activity') {
                    document.querySelectorAll('.mobile-section').forEach((section) => {
                        const panel = section.getAttribute('data-profile-panel') || '';
                        if (panel === safeTab) {
                            section.style.display = 'block';
                            section.classList.add('active');
                        } else if (panel) {
                            section.style.display = 'none';
                            section.classList.remove('active');
                        }
                    });
                }

                if (!options.skipTabSync) {
                    if (safeTab === 'lists') {
                        const targetTab = lastMediaTab && lastMediaTab !== 'community'
                            ? lastMediaTab
                            : DEFAULT_PROFILE_TAB;
                        showTab(targetTab, { skipUrlSync: true, skipPrimarySync: true });
                    } else if (safeTab === 'activity') {
                        showTab('community', { skipUrlSync: true, skipPrimarySync: true });
                    }
                }
            }

            function getPreviewOrientationClass(contentType) {
                const type = String(contentType || '').toLowerCase();
                if (type === 'fashion' || type === 'food' || type === 'car') return 'is-square';
                return (type === 'restaurant' || type === 'travel') ? 'is-landscape' : 'is-portrait';
            }

            function playProfileModalFlyUp(modal) {
                if (!modal) return;
                const content = modal.querySelector('.modal-content, .confirm-content');
                if (!content) return;
                content.classList.remove('profile-modal-fly-up');
                // Restart animation for repeated opens.
                // eslint-disable-next-line no-unused-expressions
                content.offsetWidth;
                content.classList.add('profile-modal-fly-up');
            }

            function syncProfileModalViewport(modal) {
                if (!modal || !modal.classList.contains('active')) return;
                const visual = window.visualViewport;
                const top = (visual?.offsetTop || 0) + window.scrollY;
                const left = (visual?.offsetLeft || 0) + window.scrollX;
                const width = Math.max(0, Math.ceil(visual?.width || window.innerWidth || document.documentElement.clientWidth || 0));
                const height = Math.max(0, Math.ceil(visual?.height || window.innerHeight || document.documentElement.clientHeight || 0));
                modal.style.top = `${top}px`;
                modal.style.left = `${left}px`;
                modal.style.width = `${width}px`;
                modal.style.height = `${height}px`;
            }

            function getActiveProfileModals() {
                return Array.from(document.querySelectorAll('.modal.active, .confirm-modal.active'));
            }

            function syncActiveProfileModalViewports() {
                getActiveProfileModals().forEach(syncProfileModalViewport);
            }

            function syncProfileModalBodyLock() {
                const anyActive = getActiveProfileModals().length > 0;
                if (anyActive) {
                    syncActiveProfileModalViewports();
                    document.body.style.overflow = 'hidden';
                    document.documentElement.style.overflow = 'hidden';
                } else {
                    document.body.style.overflow = '';
                    document.documentElement.style.overflow = '';
                }
            }

            function bindProfileModalViewportListeners() {
                if (hasBoundModalViewportListeners) return;
                hasBoundModalViewportListeners = true;
                const sync = () => syncActiveProfileModalViewports();
                window.addEventListener('resize', sync, { passive: true });
                window.addEventListener('scroll', sync, { passive: true });
                if (window.visualViewport) {
                    window.visualViewport.addEventListener('resize', sync, { passive: true });
                    window.visualViewport.addEventListener('scroll', sync, { passive: true });
                }
            }

            function isColumnMissingError(error, columnName) {
                const message = String(error?.message || '').toLowerCase();
                const details = String(error?.details || '').toLowerCase();
                const hint = String(error?.hint || '').toLowerCase();
                const code = String(error?.code || '').toUpperCase();
                const needle = String(columnName || '').toLowerCase();
                if (!needle) return false;
                return code === '42703' || message.includes(needle) || details.includes(needle) || hint.includes(needle);
            }

            // ===== CUSTOM CONFIRMATION MODAL =====
            function showConfirmModal(title, message, onConfirm) {
                const modal = document.getElementById('confirmModal');
                const titleEl = document.getElementById('confirmTitle');
                const messageEl = document.getElementById('confirmMessage');
                const confirmBtn = document.getElementById('confirmActionBtn');
                
                if (modal && titleEl && messageEl && confirmBtn) {
                    titleEl.textContent = title;
                    messageEl.textContent = message;
                    
                    const newConfirmBtn = confirmBtn.cloneNode(true);
                    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
                    
                    newConfirmBtn.addEventListener('click', function() {
                        onConfirm();
                        closeConfirmModal();
                    });
                    
                    modal.classList.add('active');
                    modal.setAttribute('aria-hidden', 'false');
                    syncProfileModalViewport(modal);
                    playProfileModalFlyUp(modal);
                    syncProfileModalBodyLock();
                }
            }

            function closeConfirmModal() {
                const modal = document.getElementById('confirmModal');
                if (modal) {
                    modal.classList.remove('active');
                    modal.setAttribute('aria-hidden', 'true');
                    syncProfileModalBodyLock();
                }
            }

            // ===== LOGOUT FUNCTION =====
            async function logout() {
                try {
                    showToast('Logging out...', 'info');
                    await teardownStatsRealtimeSubscriptions();
                    await supabase.auth.signOut();
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 1000);
                } catch (error) {
                    console.error('Error logging out:', error);
                    showToast('Error logging out', 'error');
                }
            }

            // ===== PROFILE MANAGEMENT =====
            async function loadProfile() {
                tabRenderCache.clear();
                pinnedListsMap = new Map();
                pinnedListsOwnerId = '';
                resetCollaborativeListAccess();
                targetUserId = getUserIdFromUrl();
                isViewingOwnProfile = !targetUserId || targetUserId === currentUser.id;

                if (isViewingOwnProfile) {
                    await loadOwnProfile();
                } else {
                    await loadOtherUserProfile();
                }
                const pinOwnerId = isViewingOwnProfile ? currentUser?.id : targetUserId;
                await ensurePinnedCollectionsLoaded(pinOwnerId);
                const statsOwnerId = isViewingOwnProfile ? currentUser?.id : targetUserId;
                if (statsOwnerId) {
                    setupStatsRealtimeSubscriptions(statsOwnerId).catch((error) => {
                        console.error('Failed to setup realtime stats subscriptions:', error);
                    });
                }
            }

            // 3. FIX: Optimize loadProfile function (faster loading)
            async function loadOwnProfile() {
                // Show/hide UI elements
                const editProfileBtn = document.getElementById('editProfileBtn');
                const settingsBtn = document.getElementById('settingsBtn');
                const followButton = document.getElementById('followButton');
                const logoutBtn = document.getElementById('logoutBtn');
                const viewingIndicator = document.getElementById('viewingOtherProfile');
                const mobileViewingIndicator = document.getElementById('mobileViewingIndicator');
                const createListBtn = document.getElementById('createRestaurantListBtn');
                const createMovieListBtn = document.getElementById('createMovieListBtn');
                const createTvListBtn = document.getElementById('createTvListBtn');
                const createAnimeListBtn = document.getElementById('createAnimeListBtn');
                const createGameListBtn = document.getElementById('createGameListBtn');
                const createBookListBtn = document.getElementById('createBookListBtn');
                const createMusicListBtn = document.getElementById('createMusicListBtn');
                const mobileCreateRestaurantListBtn = document.getElementById('mobileCreateRestaurantListBtn');
                const mobileCreateMovieListBtn = document.getElementById('mobileCreateMovieListBtn');
                const mobileCreateTvListBtn = document.getElementById('mobileCreateTvListBtn');
                const mobileCreateAnimeListBtn = document.getElementById('mobileCreateAnimeListBtn');
                const mobileCreateGameListBtn = document.getElementById('mobileCreateGameListBtn');
                const mobileCreateBookListBtn = document.getElementById('mobileCreateBookListBtn');
                const mobileCreateMusicListBtn = document.getElementById('mobileCreateMusicListBtn');
                
                if (editProfileBtn) editProfileBtn.style.display = 'flex';
                if (settingsBtn) settingsBtn.style.display = 'flex';
                if (followButton) followButton.style.display = 'none';
                if (logoutBtn) logoutBtn.style.display = 'block';
                if (viewingIndicator) viewingIndicator.style.display = 'none';
                if (mobileViewingIndicator) mobileViewingIndicator.style.display = 'none';
                if (createListBtn) createListBtn.style.display = 'flex';
                if (createMovieListBtn) createMovieListBtn.style.display = 'inline-flex';
                if (createTvListBtn) createTvListBtn.style.display = 'inline-flex';
                if (createAnimeListBtn) createAnimeListBtn.style.display = 'inline-flex';
                if (createGameListBtn) createGameListBtn.style.display = 'inline-flex';
                if (createBookListBtn) createBookListBtn.style.display = 'inline-flex';
                if (createMusicListBtn) createMusicListBtn.style.display = 'inline-flex';
                if (mobileCreateRestaurantListBtn) mobileCreateRestaurantListBtn.style.display = 'inline-flex';
                if (mobileCreateMovieListBtn) mobileCreateMovieListBtn.style.display = 'inline-flex';
                if (mobileCreateTvListBtn) mobileCreateTvListBtn.style.display = 'inline-flex';
                if (mobileCreateAnimeListBtn) mobileCreateAnimeListBtn.style.display = 'inline-flex';
                if (mobileCreateGameListBtn) mobileCreateGameListBtn.style.display = 'inline-flex';
                if (mobileCreateBookListBtn) mobileCreateBookListBtn.style.display = 'inline-flex';
                if (mobileCreateMusicListBtn) mobileCreateMusicListBtn.style.display = 'inline-flex';
                document.body.classList.remove('mobile-viewing-other');

                // Load profile - use cached if available
                if (!userProfile) {
                    await loadUserProfile();
                }
                
                updateProfileUI();
                
                // Load stats in background (don't block UI)
                updateStats().catch(err => console.error('Stats error:', err));
            }

            async function loadOtherUserProfile() {
                const editProfileBtn = document.getElementById('editProfileBtn');
                const settingsBtn = document.getElementById('settingsBtn');
                const logoutBtn = document.getElementById('logoutBtn');
                const followButton = document.getElementById('followButton');
                const viewingIndicator = document.getElementById('viewingOtherProfile');
                const mobileViewingIndicator = document.getElementById('mobileViewingIndicator');
                const createListBtn = document.getElementById('createRestaurantListBtn');
                const createMovieListBtn = document.getElementById('createMovieListBtn');
                const createTvListBtn = document.getElementById('createTvListBtn');
                const createAnimeListBtn = document.getElementById('createAnimeListBtn');
                const createGameListBtn = document.getElementById('createGameListBtn');
                const createBookListBtn = document.getElementById('createBookListBtn');
                const createMusicListBtn = document.getElementById('createMusicListBtn');
                const mobileCreateRestaurantListBtn = document.getElementById('mobileCreateRestaurantListBtn');
                const mobileCreateMovieListBtn = document.getElementById('mobileCreateMovieListBtn');
                const mobileCreateTvListBtn = document.getElementById('mobileCreateTvListBtn');
                const mobileCreateAnimeListBtn = document.getElementById('mobileCreateAnimeListBtn');
                const mobileCreateGameListBtn = document.getElementById('mobileCreateGameListBtn');
                const mobileCreateBookListBtn = document.getElementById('mobileCreateBookListBtn');
                const mobileCreateMusicListBtn = document.getElementById('mobileCreateMusicListBtn');
                
                if (editProfileBtn) editProfileBtn.style.display = 'none';
                if (settingsBtn) settingsBtn.style.display = 'none';
                if (logoutBtn) logoutBtn.style.display = 'none';
                if (followButton) followButton.style.display = 'block';
                if (viewingIndicator) viewingIndicator.style.display = 'flex';
                if (mobileViewingIndicator) mobileViewingIndicator.style.display = 'flex';
                if (createListBtn) createListBtn.style.display = 'none';
                if (createMovieListBtn) createMovieListBtn.style.display = 'none';
                if (createTvListBtn) createTvListBtn.style.display = 'none';
                if (createAnimeListBtn) createAnimeListBtn.style.display = 'none';
                if (createGameListBtn) createGameListBtn.style.display = 'none';
                if (createBookListBtn) createBookListBtn.style.display = 'none';
                if (createMusicListBtn) createMusicListBtn.style.display = 'none';
                if (mobileCreateRestaurantListBtn) mobileCreateRestaurantListBtn.style.display = 'none';
                if (mobileCreateMovieListBtn) mobileCreateMovieListBtn.style.display = 'none';
                if (mobileCreateTvListBtn) mobileCreateTvListBtn.style.display = 'none';
                if (mobileCreateAnimeListBtn) mobileCreateAnimeListBtn.style.display = 'none';
                if (mobileCreateGameListBtn) mobileCreateGameListBtn.style.display = 'none';
                if (mobileCreateBookListBtn) mobileCreateBookListBtn.style.display = 'none';
                if (mobileCreateMusicListBtn) mobileCreateMusicListBtn.style.display = 'none';
                document.body.classList.add('mobile-viewing-other');

                const { data: profile, error } = await supabase
                    .from('user_profiles')
                    .select('*')
                    .eq('id', targetUserId)
                    .single();

                if (error || !profile) {
                    showToast('User not found', 'error');
                    setTimeout(() => window.location.href = 'profile.html', 1500);
                    return;
                }

                targetUser = profile;
                updateProfileUI(profile);
                updateTabTitlesForOtherUser(profile.full_name || profile.username || 'User');
                await updateFollowButton();
                await updateStats(targetUserId);
            }

            async function loadUserProfile() {
                let profile = null;
                let profileError = null;

                {
                    const result = await supabase
                        .from("user_profiles")
                        .select("*")
                        .eq("id", currentUser.id)
                        .maybeSingle();
                    profile = result.data || null;
                    profileError = result.error || null;
                }

                if (!profile) {
                    const fallbackResult = await supabase
                        .from("user_profiles")
                        .select("*")
                        .eq("user_id", currentUser.id)
                        .maybeSingle();
                    if (!fallbackResult.error && fallbackResult.data) {
                        profile = fallbackResult.data;
                        profileError = null;
                    } else if (fallbackResult.error && !isColumnMissingError(fallbackResult.error, 'user_id')) {
                        profileError = fallbackResult.error;
                    }
                }

                if (profileError && profileError.code !== 'PGRST116') {
                    console.error("Error loading profile:", profileError);
                }

                userProfile = profile || {};
                if (profile) return;

                const usernameCandidates = buildProfileUsernameCandidates(
                    currentUser?.user_metadata?.username ||
                    currentUser?.user_metadata?.full_name ||
                    currentUser?.email?.split('@')[0] ||
                    'user',
                    currentUser?.id
                );
                const bootstrapUsername = usernameCandidates[0] || 'user';
                const bootstrapDisplayName = String(
                    currentUser?.user_metadata?.full_name ||
                    currentUser?.user_metadata?.name ||
                    bootstrapUsername
                ).trim().slice(0, 80) || bootstrapUsername;

                const basePayload = {
                    id: currentUser.id,
                    username: bootstrapUsername,
                    full_name: bootstrapDisplayName,
                    bio: "",
                    location: "",
                    avatar_icon: iconGlyphText('user'),
                    is_private: false,
                    created_at: new Date().toISOString()
                };

                let insertError = null;
                {
                    const result = await supabase
                        .from("user_profiles")
                        .insert({
                            ...basePayload,
                            user_id: currentUser.id
                        });
                    insertError = result.error || null;
                }
                if (insertError && isColumnMissingError(insertError, 'user_id')) {
                    const retryResult = await supabase
                        .from("user_profiles")
                        .insert(basePayload);
                    insertError = retryResult.error || null;
                }

                if (insertError) {
                    console.error('Error creating profile:', insertError);
                    return;
                }

                const { data: newProfile, error: newProfileError } = await supabase
                    .from("user_profiles")
                    .select("*")
                    .eq("id", currentUser.id)
                    .maybeSingle();
                if (newProfileError && newProfileError.code !== 'PGRST116') {
                    console.error('Error reloading profile:', newProfileError);
                }
                userProfile = newProfile || {
                    ...basePayload,
                    user_id: currentUser.id
                };
            }

            function normalizeProfileTheme(themeValue) {
                const safeTheme = String(themeValue || '').trim().toLowerCase();
                return PROFILE_THEME_KEYS.includes(safeTheme) ? safeTheme : 'navy';
            }

            function normalizeProfileBadges(rawBadges) {
                const source = Array.isArray(rawBadges)
                    ? rawBadges
                    : String(rawBadges || '')
                        .split(',')
                        .map((entry) => entry.trim())
                        .filter(Boolean);
                const unique = [];
                const seen = new Set();
                source.forEach((entry) => {
                    const label = String(entry || '').trim().slice(0, 24);
                    const key = label.toLowerCase();
                    if (!label || seen.has(key)) return;
                    seen.add(key);
                    unique.push(label);
                });
                return unique.slice(0, 10);
            }

            function applyProfileTheme(themeValue) {
                const theme = normalizeProfileTheme(themeValue);
                PROFILE_THEME_KEYS.forEach((key) => {
                    document.body.classList.remove(`profile-theme-${key}`);
                });
                document.body.classList.add(`profile-theme-${theme}`);
                const meta = document.querySelector('meta[name="theme-color"]');
                const themeColor = PROFILE_THEME_META[theme]?.themeColor || '#0b1633';
                if (meta) meta.setAttribute('content', themeColor);
                return theme;
            }

            function getAutoProfileBadges(stats) {
                const badgeList = [];
                if ((stats?.listsCount || 0) >= 10) {
                    badgeList.push({ label: 'Master Curator', icon: 'fa-layer-group', manual: false });
                }
                if ((stats?.followersCount || 0) >= 25) {
                    badgeList.push({ label: 'Rising Creator', icon: 'fa-chart-line', manual: false });
                }
                if ((stats?.visitedCount || 0) >= 50) {
                    badgeList.push({ label: 'Explorer', icon: 'fa-compass', manual: false });
                }
                if ((stats?.followingCount || 0) >= 20) {
                    badgeList.push({ label: 'Connector', icon: 'fa-link', manual: false });
                }
                return badgeList;
            }

            function renderProfileBadges(profile = userProfile) {
                const desktopEl = document.getElementById('profileBadges');
                const mobileEl = document.getElementById('mobileProfileBadges');
                if (!desktopEl && !mobileEl) return;

                const autoBadges = getAutoProfileBadges(profileStatsSnapshot);
                const manual = normalizeProfileBadges(profile?.profile_badges || manualProfileBadges)
                    .map((label) => ({ label, icon: 'fa-award', manual: true }));

                const combined = [];
                const seen = new Set();
                [...autoBadges, ...manual].forEach((badge) => {
                    const label = String(badge?.label || '').trim();
                    const key = label.toLowerCase();
                    if (!label || seen.has(key)) return;
                    seen.add(key);
                    combined.push({
                        label,
                        icon: String(badge.icon || 'fa-award'),
                        manual: !!badge.manual
                    });
                });

                const html = combined
                    .slice(0, 10)
                    .map((badge) => `
                        <span class="profile-badge-chip ${badge.manual ? 'manual' : 'auto'}">
                            <i class="fas ${badge.icon}"></i>
                            ${escapeHtml(badge.label)}
                        </span>
                    `)
                    .join('');

                if (desktopEl) desktopEl.innerHTML = html;
                if (mobileEl) mobileEl.innerHTML = html;
            }

            function updateProfileUI(profile = userProfile) {
                const isMobile = window.innerWidth <= 768;
                const resolvedTheme = applyProfileTheme(profile?.profile_theme || 'navy');
                manualProfileBadges = normalizeProfileBadges(profile?.profile_badges || []);
                if (profile && typeof profile === 'object') {
                    profile.profile_theme = resolvedTheme;
                    profile.profile_badges = [...manualProfileBadges];
                }
                renderProfileBadges(profile);
                
                if (isMobile) {
                    document.getElementById('mobileProfileName').textContent = profile?.full_name || profile?.username || currentUser.email.split('@')[0];
                    document.getElementById('mobileProfileUsername').textContent = `@${profile?.username || currentUser.email.split('@')[0]}`;
                    document.getElementById('mobileProfileBio').textContent = profile?.bio || "No bio yet. Tap edit to add one!";
                    document.getElementById('mobileAvatar').textContent = profile?.avatar_icon || iconGlyphText('user');
                    const mobileAboutBio = document.getElementById('mobileAboutBio');
                    const mobileAboutLocation = document.getElementById('mobileAboutLocation');
                    const mobileAboutMember = document.getElementById('mobileAboutMemberSince');
                    if (mobileAboutBio) mobileAboutBio.textContent = profile?.bio || "No bio yet.";
                    if (mobileAboutLocation) mobileAboutLocation.textContent = profile?.location || "Location not set";
                    if (mobileAboutMember) mobileAboutMember.textContent = `Member since ${new Date(currentUser.created_at).getFullYear()}`;
                } else {
                    document.getElementById('profileName').textContent = profile?.full_name || profile?.username || currentUser.email.split('@')[0];
                    document.getElementById('profileUsername').textContent = `@${profile?.username || currentUser.email.split('@')[0]}`;
                    document.getElementById('profileBio').textContent = profile?.bio || "No bio yet. Click edit to add one!";
                    document.getElementById('profileLocation').textContent = profile?.location || "Location not set";
                    document.getElementById('memberSince').textContent = `Member since ${new Date(currentUser.created_at).getFullYear()}`;
                    document.getElementById('profileAvatar').textContent = profile?.avatar_icon || iconGlyphText('user');
                    const aboutBio = document.getElementById('aboutBio');
                    const aboutLocation = document.getElementById('aboutLocation');
                    const aboutMember = document.getElementById('aboutMemberSince');
                    if (aboutBio) aboutBio.textContent = profile?.bio || "No bio yet.";
                    if (aboutLocation) aboutLocation.textContent = profile?.location || "Location not set";
                    if (aboutMember) aboutMember.textContent = `Member since ${new Date(currentUser.created_at).getFullYear()}`;
                }
            }

            function updateTabTitlesForOtherUser(userName) {
                const journalTabText = document.getElementById('journalTabText');
                const restaurantsTabText = document.getElementById('restaurantsTabText');
                const tvTabText = document.getElementById('tvTabText');
                const animeTabText = document.getElementById('animeTabText');
                const gamesTabText = document.getElementById('gamesTabText');
                const booksTabText = document.getElementById('booksTabText');
                const musicTabText = document.getElementById('musicTabText');
                const sportsTabText = document.getElementById('sportsTabText');
                const carsTabText = document.getElementById('carsTabText');
                const journalTitle = document.getElementById('journalTitle');
                const restaurantsTitle = document.getElementById('restaurantsTitle');
                const tvTitle = document.getElementById('tvTitle');
                const animeTitle = document.getElementById('animeTitle');
                const gamesTitle = document.getElementById('gamesTitle');
                const booksTitle = document.getElementById('booksTitle');
                const musicTitle = document.getElementById('musicTitle');
                const sportsTitle = document.getElementById('sportsTitle');
                const carsTitle = document.getElementById('carsTitle');
                const communityTitle = document.getElementById('communityTitle');
                const journalSubtitle = document.getElementById('journalSubtitle');
                const restaurantsSubtitle = document.getElementById('restaurantsSubtitle');
                const tvSubtitle = document.getElementById('tvSubtitle');
                const animeSubtitle = document.getElementById('animeSubtitle');
                const gamesSubtitle = document.getElementById('gamesSubtitle');
                const booksSubtitle = document.getElementById('booksSubtitle');
                const musicSubtitle = document.getElementById('musicSubtitle');
                const sportsSubtitle = document.getElementById('sportsSubtitle');
                const carsSubtitle = document.getElementById('carsSubtitle');
                const communitySubtitle = document.getElementById('communitySubtitle');
                const followersSectionTitle = document.getElementById('followersSectionTitle');
                const followingSectionTitle = document.getElementById('followingSectionTitle');
                
                if (journalTabText) journalTabText.textContent = `${userName}'s Journal`;
                if (restaurantsTabText) restaurantsTabText.textContent = `${userName}'s Collections`;
                if (tvTabText) tvTabText.textContent = `${userName}'s TV Shows`;
                if (animeTabText) animeTabText.textContent = `${userName}'s Anime`;
                if (gamesTabText) gamesTabText.textContent = `${userName}'s Games`;
                if (booksTabText) booksTabText.textContent = `${userName}'s Books`;
                if (musicTabText) musicTabText.textContent = `${userName}'s Music`;
                if (sportsTabText) sportsTabText.textContent = `${userName}'s Sports`;
                if (journalTitle) journalTitle.textContent = `${userName}'s Food Journal`;
                if (restaurantsTitle) restaurantsTitle.textContent = `${userName}'s Collections`;
                if (tvTitle) tvTitle.textContent = `${userName}'s TV Shows`;
                if (animeTitle) animeTitle.textContent = `${userName}'s Anime`;
                if (gamesTitle) gamesTitle.textContent = `${userName}'s Games`;
                if (booksTitle) booksTitle.textContent = `${userName}'s Books`;
                if (musicTitle) musicTitle.textContent = `${userName}'s Music`;
                if (sportsTitle) sportsTitle.textContent = `${userName}'s Teams`;
                if (communityTitle) communityTitle.textContent = `${userName}'s Community`;
                if (journalSubtitle) journalSubtitle.textContent = `${userName}'s restaurant reviews and experiences`;
                if (restaurantsSubtitle) restaurantsSubtitle.textContent = `${userName}'s featured collections`;
                if (tvSubtitle) tvSubtitle.textContent = `${userName}'s favorite TV shows`;
                if (animeSubtitle) animeSubtitle.textContent = `${userName}'s favorite anime`;
                if (gamesSubtitle) gamesSubtitle.textContent = `${userName}'s favorite games`;
                if (booksSubtitle) booksSubtitle.textContent = `${userName}'s favorite books`;
                if (musicSubtitle) musicSubtitle.textContent = `${userName}'s favorite tracks`;
                if (sportsSubtitle) sportsSubtitle.textContent = `${userName}'s favorite teams`;
                if (communitySubtitle) communitySubtitle.textContent = `${userName}'s community connections`;
                if (followersSectionTitle) followersSectionTitle.textContent = `${userName}'s Followers`;
                if (followingSectionTitle) followingSectionTitle.textContent = `${userName}'s Following`;
                
                const mobileJournalTabText = document.getElementById('mobileJournalTabText');
                const mobileTabJournal = document.getElementById('mobileTabJournal');
                const mobileTabRestaurants = document.getElementById('mobileTabRestaurants');
                const mobileTabTv = document.getElementById('mobileTabTv');
                const mobileTabAnime = document.getElementById('mobileTabAnime');
                const mobileTabGames = document.getElementById('mobileTabGames');
                const mobileTabBooks = document.getElementById('mobileTabBooks');
                const mobileTabMusic = document.getElementById('mobileTabMusic');
                const mobileTabSports = document.getElementById('mobileTabSports');
                const mobileTabFashion = document.getElementById('mobileTabFashion');
                const mobileTabFood = document.getElementById('mobileTabFood');
                const mobileTabCars = document.getElementById('mobileTabCars');
                const mobileJournalTitle = document.getElementById('mobileJournalTitle');
                const mobileRestaurantsTitle = document.getElementById('mobileRestaurantsTitle');
                const mobileAnimeTitle = document.getElementById('mobileAnimeTitle');
                const mobileGamesTitle = document.getElementById('mobileGamesTitle');
                const mobileBooksTitle = document.getElementById('mobileBooksTitle');
                const mobileMusicTitle = document.getElementById('mobileMusicTitle');
                const mobileSportsTitle = document.getElementById('mobileSportsTitle');
                const mobileFashionTitle = document.getElementById('mobileFashionTitle');
                const mobileFoodTitle = document.getElementById('mobileFoodTitle');
                const mobileCarsTitle = document.getElementById('mobileCarsTitle');
                const mobileCommunityTitle = document.getElementById('mobileCommunityTitle');
                const mobileJournalSubtitle = document.getElementById('mobileJournalSubtitle');
                const mobileRestaurantsSubtitle = document.getElementById('mobileRestaurantsSubtitle');
                const mobileAnimeSubtitle = document.getElementById('mobileAnimeSubtitle');
                const mobileGamesSubtitle = document.getElementById('mobileGamesSubtitle');
                const mobileBooksSubtitle = document.getElementById('mobileBooksSubtitle');
                const mobileMusicSubtitle = document.getElementById('mobileMusicSubtitle');
                const mobileSportsSubtitle = document.getElementById('mobileSportsSubtitle');
                const mobileFashionSubtitle = document.getElementById('mobileFashionSubtitle');
                const mobileFoodSubtitle = document.getElementById('mobileFoodSubtitle');
                const mobileCarsSubtitle = document.getElementById('mobileCarsSubtitle');
                const mobileCommunitySubtitle = document.getElementById('mobileCommunitySubtitle');
                
                if (mobileJournalTabText) mobileJournalTabText.textContent = `${userName}'s Journal`;
                if (mobileTabJournal) mobileTabJournal.textContent = `${userName}'s Journal`;
                if (mobileTabRestaurants) mobileTabRestaurants.textContent = `${userName}'s Collections`;
                if (mobileTabTv) mobileTabTv.textContent = `${userName}'s TV Shows`;
                if (mobileTabAnime) mobileTabAnime.textContent = `${userName}'s Anime`;
                if (mobileTabGames) mobileTabGames.textContent = `${userName}'s Games`;
                if (mobileTabBooks) mobileTabBooks.textContent = `${userName}'s Books`;
                if (mobileTabMusic) mobileTabMusic.textContent = `${userName}'s Music`;
                if (mobileTabSports) mobileTabSports.textContent = `${userName}'s Sports`;
                if (mobileJournalTitle) mobileJournalTitle.textContent = `${userName}'s Food Journal`;
                if (mobileRestaurantsTitle) mobileRestaurantsTitle.textContent = `${userName}'s Collections`;
                if (mobileAnimeTitle) mobileAnimeTitle.textContent = `${userName}'s Anime`;
                if (mobileGamesTitle) mobileGamesTitle.textContent = `${userName}'s Games`;
                if (mobileBooksTitle) mobileBooksTitle.textContent = `${userName}'s Books`;
                if (mobileMusicTitle) mobileMusicTitle.textContent = `${userName}'s Music`;
                if (mobileSportsTitle) mobileSportsTitle.textContent = `${userName}'s Teams`;
                if (mobileCommunityTitle) mobileCommunityTitle.textContent = `${userName}'s Community`;
                if (mobileJournalSubtitle) mobileJournalSubtitle.textContent = `${userName}'s restaurant reviews and experiences`;
                if (mobileRestaurantsSubtitle) mobileRestaurantsSubtitle.textContent = `${userName}'s featured collections`;
                if (mobileAnimeSubtitle) mobileAnimeSubtitle.textContent = `${userName}'s favorite anime`;
                if (mobileGamesSubtitle) mobileGamesSubtitle.textContent = `${userName}'s favorite games`;
                if (mobileBooksSubtitle) mobileBooksSubtitle.textContent = `${userName}'s favorite books`;
                if (mobileMusicSubtitle) mobileMusicSubtitle.textContent = `${userName}'s favorite tracks`;
                if (mobileSportsSubtitle) mobileSportsSubtitle.textContent = `${userName}'s favorite teams`;
                if (mobileCommunitySubtitle) mobileCommunitySubtitle.textContent = `${userName}'s community connections`;
            }

            // ===== FOLLOW SYSTEM =====
            async function updateFollowButton() {
                if (isViewingOwnProfile) return;
                
                const followButton = document.getElementById('followButton');
                if (!followButton) return;
                
                const isFollowing = await checkIfFollowing(targetUserId);
                
                if (isFollowing) {
                    followButton.textContent = 'Unfollow';
                    followButton.className = 'btn btn-error';
                } else {
                    followButton.textContent = 'Follow';
                    followButton.className = 'btn btn-primary';
                }
                
                followButton.onclick = () => toggleFollow(targetUserId, followButton);
            }

            async function checkIfFollowing(userId) {
                const cacheKey = `${currentUser.id}_${userId}`;
                
                if (followStatusCache.has(cacheKey)) {
                    return followStatusCache.get(cacheKey);
                }
                
                try {
                    const { data, error } = await supabase
                        .from('follows')
                        .select('id')
                        .eq('follower_id', currentUser.id)
                        .eq('followed_id', userId)
                        .maybeSingle(); 

                    const isFollowing = !!data && !error;
                    followStatusCache.set(cacheKey, isFollowing);
                    
                    return isFollowing;
                    
                } catch (error) {
                    console.error('Error checking follow status:', error);
                    return false;
                }
            }

            async function toggleFollow(userId, buttonElement) {
                try {
                    const isFollowing = await checkIfFollowing(userId);
                    const cacheKey = `${currentUser.id}_${userId}`;
                    
                    if (isFollowing) {
                        // Unfollow
                        const { error } = await supabase
                            .from('follows')
                            .delete()
                            .eq('follower_id', currentUser.id)
                            .eq('followed_id', userId);

                        if (error) throw error;
                        
                        followStatusCache.set(cacheKey, false);
                        
                        // Update button
                        if (buttonElement) {
                            buttonElement.textContent = 'Follow';
                            buttonElement.className = buttonElement.className.includes('mobile') ? 
                                'mobile-action-btn primary' : 'btn btn-primary';
                        }
                        
                        showToast('Unfollowed user', 'info');
                        
                    } else {
                        // Follow
                        const { error } = await supabase
                            .from('follows')
                            .insert({
                                follower_id: currentUser.id,
                                followed_id: userId,
                                created_at: new Date().toISOString()
                            });

                        if (error) throw error;
                        
                        followStatusCache.set(cacheKey, true);
                        
                        // Update button
                        if (buttonElement) {
                            buttonElement.textContent = 'Unfollow';
                            buttonElement.className = buttonElement.className.includes('mobile') ? 
                                'mobile-action-btn' : 'btn btn-error';
                            if (buttonElement.className.includes('mobile')) {
                                buttonElement.style.background = 'var(--error)';
                                buttonElement.style.color = 'white';
                            }
                        }
                        
                        showToast('Started following user', 'success');
                    }
                    
                    // Update stats
                    await updateStats();
                    if (communitySystem) {
                        await communitySystem.loadFollowStats();
                        communitySystem.refreshCurrentView();
                    }
                    
                } catch (error) {
                    console.error('Error toggling follow:', error);
                    showToast('Action failed. Please try again.', 'error');
                }
            }

            // ===== RESTAURANTS =====
            async function loadRestaurants() {
                try {
                    const { data, error } = await supabase
                        .from('restraunts')
                        .select('*')
                        .order('name');
                    
                    if (error) throw error;
                    
                    restaurants = data || [];
                    populateRestaurantSelect();
                    
                } catch (error) {
                    console.error('Error loading restaurants:', error);
                    restaurants = [];
                }
            }

            function populateRestaurantSelect() {
                const restaurantSelect = document.getElementById('restaurantSelect');
                if (!restaurantSelect) return;
                
                restaurantSelect.innerHTML = '<option value="">Select a restaurant</option>';
                
                restaurants.forEach(restaurant => {
                    const option = document.createElement('option');
                    option.value = restaurant.id;
                    option.textContent = `${restaurant.name} (${restaurant.category})`;
                    restaurantSelect.appendChild(option);
                });
            }

            // ===== STATS =====
            function clearStatsRealtimeRefreshTimer() {
                if (!statsRealtimeRefreshTimer) return;
                clearTimeout(statsRealtimeRefreshTimer);
                statsRealtimeRefreshTimer = null;
            }

            function scheduleStatsRealtimeRefresh(userId = null) {
                const targetId = String(userId || statsRealtimeTargetId || '').trim();
                if (!targetId) return;
                clearStatsRealtimeRefreshTimer();
                statsRealtimeRefreshTimer = setTimeout(() => {
                    updateStats(targetId).catch((error) => {
                        console.error('Realtime stats refresh error:', error);
                    });
                }, STATS_REALTIME_DEBOUNCE_MS);
            }

            async function teardownStatsRealtimeSubscriptions() {
                clearStatsRealtimeRefreshTimer();
                statsRealtimeTargetId = '';
                if (!supabase || !Array.isArray(statsRealtimeChannels) || !statsRealtimeChannels.length) {
                    statsRealtimeChannels = [];
                    return;
                }
                const channels = statsRealtimeChannels.slice();
                statsRealtimeChannels = [];
                await Promise.allSettled(channels.map((channel) => {
                    try {
                        return supabase.removeChannel(channel);
                    } catch (_error) {
                        return Promise.resolve();
                    }
                }));
            }

            function getStatsRealtimeDefinitions(targetId) {
                const safeId = String(targetId || '').trim();
                if (!safeId) return [];
                const defs = [
                    { table: 'follows', filter: `followed_id=eq.${safeId}` },
                    { table: 'follows', filter: `follower_id=eq.${safeId}` },
                    { table: 'movie_list_items', filter: `user_id=eq.${safeId}` },
                    { table: 'tv_list_items', filter: `user_id=eq.${safeId}` },
                    { table: 'anime_list_items', filter: `user_id=eq.${safeId}` },
                    { table: 'game_list_items', filter: `user_id=eq.${safeId}` },
                    { table: 'book_list_items', filter: `user_id=eq.${safeId}` },
                    { table: 'music_list_items', filter: `user_id=eq.${safeId}` },
                    { table: 'movie_lists', filter: `user_id=eq.${safeId}` },
                    { table: 'tv_lists', filter: `user_id=eq.${safeId}` },
                    { table: 'anime_lists', filter: `user_id=eq.${safeId}` },
                    { table: 'game_lists', filter: `user_id=eq.${safeId}` },
                    { table: 'book_lists', filter: `user_id=eq.${safeId}` },
                    { table: 'music_lists', filter: `user_id=eq.${safeId}` },
                    { table: 'journal_entries', filter: `user_id=eq.${safeId}` },
                    { table: 'tv_reviews', filter: `user_id=eq.${safeId}` },
                    { table: 'anime_reviews', filter: `user_id=eq.${safeId}` },
                    { table: 'game_reviews', filter: `user_id=eq.${safeId}` },
                    { table: 'book_reviews', filter: `user_id=eq.${safeId}` },
                    { table: 'music_reviews', filter: `user_id=eq.${safeId}` }
                ];
                if (ENABLE_RESTAURANTS) {
                    defs.push({ table: 'lists', filter: `user_id=eq.${safeId}` });
                }
                return defs;
            }

            async function setupStatsRealtimeSubscriptions(targetId) {
                const safeId = String(targetId || '').trim();
                if (!supabase || !safeId) return;

                if (statsRealtimeTargetId === safeId && Array.isArray(statsRealtimeChannels) && statsRealtimeChannels.length) {
                    return;
                }

                await teardownStatsRealtimeSubscriptions();
                statsRealtimeTargetId = safeId;

                const definitions = getStatsRealtimeDefinitions(safeId);
                definitions.forEach((def, index) => {
                    const channelName = `profile-stats-${def.table}-${index}-${safeId.slice(0, 12)}-${Date.now().toString(36)}`;
                    const channel = supabase
                        .channel(channelName)
                        .on('postgres_changes', {
                            event: '*',
                            schema: 'public',
                            table: def.table,
                            filter: def.filter
                        }, () => {
                            scheduleStatsRealtimeRefresh(safeId);
                        })
                        .subscribe((status) => {
                            if (status === 'CHANNEL_ERROR') {
                                console.warn(`Stats realtime channel error for ${def.table}`);
                            }
                        });
                    statsRealtimeChannels.push(channel);
                });

                if (!hasBoundStatsRealtimeLifecycle) {
                    hasBoundStatsRealtimeLifecycle = true;
                    window.addEventListener('beforeunload', () => {
                        if (!supabase || !statsRealtimeChannels.length) return;
                        statsRealtimeChannels.forEach((channel) => {
                            try { supabase.removeChannel(channel); } catch (_error) {}
                        });
                        statsRealtimeChannels = [];
                    });
                    document.addEventListener('visibilitychange', () => {
                        if (!document.hidden && statsRealtimeTargetId) {
                            scheduleStatsRealtimeRefresh(statsRealtimeTargetId);
                        }
                    });
                }
            }

            function isIgnorableStatsError(error) {
                const code = String(error?.code || '').trim();
                const message = String(error?.message || error?.details || '').toLowerCase();
                if (code === '42P01' || code === '42703') return true;
                if (message.includes('does not exist')) return true;
                if (message.includes('relation') && message.includes('not found')) return true;
                return false;
            }

            async function safeCountByUser(tableName, userId, options = {}) {
                if (!supabase || !tableName || !userId) return 0;
                const userColumn = String(options.userColumn || 'user_id');
                const extraFilter = typeof options.extraFilter === 'function' ? options.extraFilter : null;
                try {
                    let query = supabase
                        .from(tableName)
                        .select('*', { count: 'exact', head: true })
                        .eq(userColumn, userId);
                    if (extraFilter) query = extraFilter(query);
                    const { count, error } = await query;
                    if (error) {
                        if (isIgnorableStatsError(error)) return 0;
                        throw error;
                    }
                    return Number(count || 0);
                } catch (error) {
                    if (isIgnorableStatsError(error)) return 0;
                    console.warn(`Stats count failed for ${tableName}:`, error);
                    return 0;
                }
            }

            async function countRestaurantSavedItems(userId) {
                if (!ENABLE_RESTAURANTS || !supabase || !userId) return 0;
                try {
                    const { data: ownedLists, error: ownedListsError } = await supabase
                        .from('lists')
                        .select('id')
                        .eq('user_id', userId);
                    if (ownedListsError) {
                        if (isIgnorableStatsError(ownedListsError)) return 0;
                        throw ownedListsError;
                    }
                    const listIds = (ownedLists || []).map((row) => row?.id).filter(Boolean);
                    if (!listIds.length) return 0;

                    const { count, error } = await supabase
                        .from('lists_restraunts')
                        .select('*', { count: 'exact', head: true })
                        .in('list_id', listIds);
                    if (error) {
                        if (isIgnorableStatsError(error)) return 0;
                        throw error;
                    }
                    return Number(count || 0);
                } catch (error) {
                    if (isIgnorableStatsError(error)) return 0;
                    console.warn('Stats count failed for lists_restraunts:', error);
                    return 0;
                }
            }

            async function countRestaurantListsCreated(userId) {
                if (!ENABLE_RESTAURANTS || !supabase || !userId) return 0;
                try {
                    let result = await supabase
                        .from('lists')
                        .select('*', { count: 'exact', head: true })
                        .eq('user_id', userId)
                        .eq('is_default', false);

                    if (result.error && String(result.error?.code || '').trim() === '42703') {
                        result = await supabase
                            .from('lists')
                            .select('*', { count: 'exact', head: true })
                            .eq('user_id', userId);
                    }

                    if (result.error) {
                        if (isIgnorableStatsError(result.error)) return 0;
                        throw result.error;
                    }
                    return Number(result.count || 0);
                } catch (error) {
                    if (isIgnorableStatsError(error)) return 0;
                    console.warn('Stats count failed for lists:', error);
                    return 0;
                }
            }

            async function updateStats(userId = null) {
                const targetId = userId || currentUser.id;
                
                try {
                    const [
                        followersResult,
                        followingResult,
                        movieSavedCount,
                        tvSavedCount,
                        animeSavedCount,
                        gameSavedCount,
                        bookSavedCount,
                        musicSavedCount,
                        restaurantSavedCount,
                        movieListsCount,
                        tvListsCount,
                        animeListsCount,
                        gameListsCount,
                        bookListsCount,
                        musicListsCount,
                        restaurantListsCount,
                        journalReviewsCount,
                        movieReviewsCount,
                        tvReviewsCount,
                        animeReviewsCount,
                        gameReviewsCount,
                        bookReviewsCount,
                        musicReviewsCount
                    ] = await Promise.all([
                        supabase
                            .from('follows')
                            .select('*', { count: 'exact', head: true })
                            .eq('followed_id', targetId),
                        supabase
                            .from('follows')
                            .select('*', { count: 'exact', head: true })
                            .eq('follower_id', targetId),
                        safeCountByUser('movie_list_items', targetId),
                        safeCountByUser('tv_list_items', targetId),
                        safeCountByUser('anime_list_items', targetId),
                        safeCountByUser('game_list_items', targetId),
                        safeCountByUser('book_list_items', targetId),
                        safeCountByUser('music_list_items', targetId),
                        countRestaurantSavedItems(targetId),
                        safeCountByUser('movie_lists', targetId),
                        safeCountByUser('tv_lists', targetId),
                        safeCountByUser('anime_lists', targetId),
                        safeCountByUser('game_lists', targetId),
                        safeCountByUser('book_lists', targetId),
                        safeCountByUser('music_lists', targetId),
                        countRestaurantListsCreated(targetId),
                        safeCountByUser('journal_entries', targetId),
                        safeCountByUser('movie_reviews', targetId),
                        safeCountByUser('tv_reviews', targetId),
                        safeCountByUser('anime_reviews', targetId),
                        safeCountByUser('game_reviews', targetId),
                        safeCountByUser('book_reviews', targetId),
                        safeCountByUser('music_reviews', targetId)
                    ]);

                    if (followersResult?.error && !isIgnorableStatsError(followersResult.error)) {
                        throw followersResult.error;
                    }
                    if (followingResult?.error && !isIgnorableStatsError(followingResult.error)) {
                        throw followingResult.error;
                    }

                    const followersCount = Number(followersResult?.count || 0) || 0;
                    const followingCount = Number(followingResult?.count || 0) || 0;
                    const savedItemsCount = Number(movieSavedCount || 0)
                        + Number(tvSavedCount || 0)
                        + Number(animeSavedCount || 0)
                        + Number(gameSavedCount || 0)
                        + Number(bookSavedCount || 0)
                        + Number(musicSavedCount || 0)
                        + Number(restaurantSavedCount || 0);
                    const listsCount = Number(movieListsCount || 0)
                        + Number(tvListsCount || 0)
                        + Number(animeListsCount || 0)
                        + Number(gameListsCount || 0)
                        + Number(bookListsCount || 0)
                        + Number(musicListsCount || 0)
                        + Number(restaurantListsCount || 0);
                    const reviewsCount = Number(journalReviewsCount || 0)
                        + Number(movieReviewsCount || 0)
                        + Number(tvReviewsCount || 0)
                        + Number(animeReviewsCount || 0)
                        + Number(gameReviewsCount || 0)
                        + Number(bookReviewsCount || 0)
                        + Number(musicReviewsCount || 0);

                    // Update UI
                    updateStatsUI(
                        savedItemsCount,
                        followersCount,
                        listsCount,
                        reviewsCount,
                        followingCount
                    );
                    
                    // Update badges
                    updateFollowBadges(followersCount);
                    await renderCommunityPreview(targetId, followersCount, followingCount);
                    
                } catch (error) {
                    console.error('Error updating stats:', error);
                    updateStatsUI(0, 0, 0, 0, 0);
                }
            }

            function updateStatsUI(visitedCount, followersCount, listsCount, reviewsCount, followingCount = 0) {
                const isMobile = window.innerWidth <= 768;
                profileStatsSnapshot = {
                    visitedCount: Number(visitedCount || 0),
                    followersCount: Number(followersCount || 0),
                    listsCount: Number(listsCount || 0),
                    reviewsCount: Number(reviewsCount || 0),
                    followingCount: Number(followingCount || 0)
                };
                
                if (isMobile) {
                    document.getElementById('mobileVisitedCount').textContent = visitedCount;
                    document.getElementById('mobileFollowersCount').textContent = followersCount;
                    document.getElementById('mobileListsCount').textContent = listsCount;
                    document.getElementById('mobileReviewsCount').textContent = reviewsCount;
                } else {
                    document.getElementById('visitedCount').textContent = visitedCount;
                    document.getElementById('followersCount').textContent = followersCount;
                    document.getElementById('listsCount').textContent = listsCount;
                    document.getElementById('reviewsCount').textContent = reviewsCount;
                    document.getElementById('visitedCountMeta').textContent = `${visitedCount} saved items`;
                }

                const desktopMeta = document.getElementById('desktopSocialPreviewMeta');
                const mobileMeta = document.getElementById('mobileSocialPreviewMeta');
                const summaryText = `${followersCount} followers · ${followingCount} following`;
                if (desktopMeta) desktopMeta.textContent = summaryText;
                if (mobileMeta) mobileMeta.textContent = summaryText;
                renderProfileBadges();
            }

            function updateFollowBadges(followersCount) {
                const followersCountBadge = document.getElementById('followersCountBadge');
                
                if (followersCountBadge) {
                    followersCountBadge.textContent = followersCount;
                    followersCountBadge.style.display = followersCount > 0 ? 'inline-block' : 'none';
                }
            }

            async function renderCommunityPreview(targetId, followersCount, followingCount) {
                const desktopAvatars = document.getElementById('desktopFriendsPreviewAvatars');
                const mobileAvatars = document.getElementById('mobileFriendsPreviewAvatars');
                if (!desktopAvatars && !mobileAvatars) return;

                try {
                    const [followersRes, followingRes] = await Promise.all([
                        supabase
                            .from('follows')
                            .select('follower_id, created_at')
                            .eq('followed_id', targetId)
                            .order('created_at', { ascending: false })
                            .limit(4),
                        supabase
                            .from('follows')
                            .select('followed_id, created_at')
                            .eq('follower_id', targetId)
                            .order('created_at', { ascending: false })
                            .limit(4)
                    ]);

                    const candidateIds = [];
                    (followersRes.data || []).forEach((row) => {
                        if (row?.follower_id) candidateIds.push(row.follower_id);
                    });
                    (followingRes.data || []).forEach((row) => {
                        if (row?.followed_id) candidateIds.push(row.followed_id);
                    });
                    const uniqueIds = [...new Set(candidateIds)].filter(Boolean).slice(0, 6);

                    if (!uniqueIds.length) {
                        const emptyAvatar = `<span class="social-preview-avatar">${iconGlyph('user')}</span>`;
                        if (desktopAvatars) desktopAvatars.innerHTML = emptyAvatar;
                        if (mobileAvatars) mobileAvatars.innerHTML = emptyAvatar;
                        return;
                    }

                    const { data: users } = await supabase
                        .from('user_profiles')
                        .select('id, username, full_name, avatar_icon')
                        .in('id', uniqueIds);

                    const userMap = new Map();
                    (users || []).forEach((user) => userMap.set(user.id, user));

                    const avatarsHtml = uniqueIds.map((id) => {
                        const user = userMap.get(id);
                        const label = escapeHtml(user?.full_name || user?.username || 'User');
                        const rawAvatar = String(user?.avatar_icon || '').trim();
                        const avatar = rawAvatar ? escapeHtml(rawAvatar) : iconGlyph('user');
                        return `<button class="social-preview-avatar" title="${label}" onclick="ProfileManager.viewUserProfile('${id}')">${avatar}</button>`;
                    }).join('');

                    if (desktopAvatars) desktopAvatars.innerHTML = avatarsHtml;
                    if (mobileAvatars) mobileAvatars.innerHTML = avatarsHtml;
                } catch (error) {
                    console.error('Error rendering community preview:', error);
                    const fallback = `<span class="social-preview-avatar">${iconGlyph('user')}</span>`;
                    if (desktopAvatars) desktopAvatars.innerHTML = fallback;
                    if (mobileAvatars) mobileAvatars.innerHTML = fallback;
                } finally {
                    const desktopMeta = document.getElementById('desktopSocialPreviewMeta');
                    const mobileMeta = document.getElementById('mobileSocialPreviewMeta');
                    const summaryText = `${followersCount} followers · ${followingCount} following`;
                    if (desktopMeta) desktopMeta.textContent = summaryText;
                    if (mobileMeta) mobileMeta.textContent = summaryText;
                }
            }

            // ===== LIST MANAGER =====
            const listManager = {
                userLists: [],
                currentLists: {
                    favorites: null,
                    visited: null,
                    wantToGo: null
                },
                
                async init() { 
                    const targetId = isViewingOwnProfile ? currentUser.id : targetUserId;
                    if (!targetId) return;
                    
                    await this.loadUserLists(targetId);
                    await this.loadListRestaurants();
                    await this.loadCustomLists(targetId);
                    this.renderLists();
                },
                
                async loadUserLists(userId) {
                    try {
                        const { data: lists, error } = await supabase
                            .from('lists')
                            .select('*')
                            .eq('user_id', userId);
                        
                        if (error) throw error;
                        
                        this.userLists = lists || [];
                        await this.setupDefaultLists(userId);
                        
                    } catch (error) {
                        console.error('Error loading lists:', error);
                    }
                },
                
                async setupDefaultLists(userId) {
                    this.currentLists.favorites = this.userLists.find(list => list.title === 'Favorites');
                    this.currentLists.visited = this.userLists.find(list => list.title === 'Visited'); 
                    this.currentLists.wantToGo = this.userLists.find(list => list.title === 'Want to Go');
                    
                    if (isViewingOwnProfile) {
                        if (!this.currentLists.favorites) {
                            this.currentLists.favorites = await this.createList('Favorites', 'My favorite picks', userId, 'heart');
                        }
                        if (!this.currentLists.visited) {
                            this.currentLists.visited = await this.createList('Visited', 'Places I have visited', userId, 'check');
                        }
                        if (!this.currentLists.wantToGo) {
                            this.currentLists.wantToGo = await this.createList('Want to Go', 'Places I want to try', userId, 'bookmark');
                        }
                    }
                },
                
                async createList(title, description, userId = currentUser.id, icon = 'list') {
                    const { data: newList, error } = await supabase
                        .from('lists')
                        .insert([{ 
                            user_id: userId, 
                            title: title, 
                            description: description,
                            icon: icon,
                            is_default: true,
                            created_at: new Date().toISOString()
                        }])
                        .select()
                        .single();
                    
                    if (error) {
                        console.error('Error creating list:', error);
                        return null;
                    }
                    
                    this.userLists.push(newList);
                    return newList;
                },
                
                async loadListRestaurants() {
                    for (const listType in this.currentLists) {
                        const list = this.currentLists[listType];
                        if (list) {
                            const { data: listRestraunts, error } = await supabase
                                .from('lists_restraunts')
                                .select('restraunt_id')
                                .eq('list_id', list.id);
                            
                            if (!error && listRestraunts) {
                                list.restaurants = listRestraunts.map(item => item.restraunt_id);
                            } else {
                                list.restaurants = [];
                            }
                        }
                    }
                },
                
                async loadCustomLists(userId) {
                    if (!userId) return;
                    
                    try {
                        const { data: lists, error } = await supabase
                            .from('lists')
                            .select('*')
                            .eq('user_id', userId)
                            .neq('title', 'Favorites')
                            .neq('title', 'Visited')
                            .neq('title', 'Want to Go');
                        
                        if (error) throw error;
                        
                        customLists = lists || [];
                        
                        for (const list of customLists) {
                            const { data: listRestraunts, error } = await supabase
                                .from('lists_restraunts')
                                .select('restraunt_id')
                                .eq('list_id', list.id);
                            
                            if (!error && listRestraunts) {
                                list.restaurants = listRestraunts.map(item => item.restraunt_id);
                            } else {
                                list.restaurants = [];
                            }
                        }
                        
                    } catch (error) {
                        console.error('Error loading custom lists:', error);
                    }
                },

                async toggleInList(listId, restaurantId) {
                    let list;
                    
                    if (typeof listId === 'string') {
                        if (listId === 'favorites') list = this.currentLists.favorites;
                        else if (listId === 'visited') list = this.currentLists.visited;
                        else if (listId === 'wantToGo') list = this.currentLists.wantToGo;
                    } else {
                        list = customLists.find(l => l.id === listId) || 
                            this.userLists.find(l => l.id === listId);
                    }
                    
                    if (!list) return false;
                    
                    const isInList = list.restaurants?.includes(restaurantId);
                    
                    try {
                        if (isInList) {
                            const { error } = await supabase
                                .from('lists_restraunts')
                                .delete()
                                .match({ 
                                    list_id: list.id, 
                                    restraunt_id: restaurantId
                                });
                            
                            if (error) throw error;
                            
                            if (list.restaurants) {
                                list.restaurants = list.restaurants.filter(id => id !== restaurantId);
                            }
                            
                            showToast(`Removed from ${list.title}`, "info");
                            return false;
                        } else {
                            const { error } = await supabase
                                .from('lists_restraunts')
                                .insert([{ 
                                    list_id: list.id, 
                                    restraunt_id: restaurantId,
                                    added_at: new Date().toISOString()
                                }]);
                            
                            if (error) throw error;
                            
                            if (!list.restaurants) list.restaurants = [];
                            list.restaurants.push(restaurantId);
                            showToast(`Added to ${list.title}`, "success");
                            return true;
                        }
                        
                    } catch (error) {
                        console.error('Error updating list:', error);
                        showToast('Error saving changes', 'error');
                        return isInList;
                    }
                },

                isInList(listType, restaurantId) {
                    let list;
                    
                    if (typeof listType === 'string') {
                        list = this.currentLists[listType];
                    } else {
                        list = customLists.find(l => l.id === listType);
                    }
                    
                    return list?.restaurants?.includes(restaurantId) || false;
                },

                renderLists() {
                    const isMobile = window.innerWidth <= 768;
                    
                    if (isMobile) {
                        this.renderMobileLists();
                    } else {
                        this.renderDesktopLists();
                    }
                },

                renderDesktopLists() {
                    const listsGrid = document.getElementById('listsGrid');
                    if (!listsGrid) return;
                    
                    listsGrid.innerHTML = '';
                    
                    const defaultLists = [
                        {
                            id: 'favorites',
                            title: 'Favorites',
                            description: 'Your top picks.',
                            icon: 'heart',
                            color: 'var(--error)',
                            restaurants: this.currentLists.favorites?.restaurants || [],
                            isDefault: true
                        },
                        {
                            id: 'visited',
                            title: 'Visited',
                            description: 'Places you have checked out.',
                            icon: 'check',
                            color: 'var(--success)',
                            restaurants: this.currentLists.visited?.restaurants || [],
                            isDefault: true
                        },
                        {
                            id: 'wantToGo',
                            title: 'Want To Go',
                            description: 'Saved for later.',
                            icon: 'bookmark',
                            color: 'var(--accent)',
                            restaurants: this.currentLists.wantToGo?.restaurants || [],
                            isDefault: true
                        }
                    ];
                    
                    let allLists = [...defaultLists, ...customLists.map(list => ({
                        id: list.id,
                        title: list.title,
                        description: list.description || 'Your custom-made collection.',
                        icon: normalizeIconKey(list.icon, 'list'),
                        color: 'var(--accent)',
                        restaurants: list.restaurants || [],
                        isDefault: false
                    }))];
                    allLists = applyPinnedListSorting('restaurant', allLists);
                    
                    if (allLists.length === 0) {
                        listsGrid.innerHTML = `
                            <div class="empty-state">
                                <div class="empty-icon">${iconGlyph('list')}</div>
                                <h3 class="empty-title">No Lists Yet</h3>
                                <p class="empty-description">Create your first list to organize restaurants by occasion, cuisine, or mood!</p>
                                <button class="btn btn-primary mt-md" onclick="ProfileManager.showCreateListModal()">
                                    <i class="fas fa-plus"></i> Create Your First List
                                </button>
                            </div>
                        `;
                        return;
                    }
                    
                    allLists.forEach(list => {
                        const listCard = document.createElement('div');
                        listCard.className = 'list-card';
                        
                        const previewItems = [];
                        const restaurantIds = list.restaurants || [];
                        const shuffledIds = [...restaurantIds].sort(() => 0.5 - Math.random());
                        
                        for (let i = 0; i < 4; i++) {
                            if (shuffledIds[i]) {
                                const restaurantId = shuffledIds[i];
                                const restaurant = restaurants.find(r => r.id === restaurantId);
                                if (restaurant) {
                                    previewItems.push(`
                                        <div class="list-preview-item is-landscape">
                                            <img src="images/${restaurant.image || 'placeholder.jpg'}" alt="${restaurant.name}" loading="lazy">
                                        </div>
                                    `);
                                } else {
                                    previewItems.push(`
                                        <div class="list-preview-item is-landscape">
                                            <div style="width: 100%; height: 100%; background: var(--bg); display: flex; align-items: center; justify-content: center; color: var(--muted);">
                                                ${iconGlyph('restaurant')}
                                            </div>
                                        </div>
                                    `);
                                }
                            } else {
                                previewItems.push(`
                                    <div class="list-preview-item is-landscape">
                                        <div style="width: 100%; height: 100%; background: var(--bg); display: flex; align-items: center; justify-content: center; color: var(--muted);">
                                            ${iconGlyph('restaurant')}
                                        </div>
                                    </div>
                                `);
                            }
                        }
                        
                        const kebabHtml = (isViewingOwnProfile && !list.isDefault) ? `
                            <div class="list-card-actions">
                                <button class="kebab-btn" onclick="event.stopPropagation(); ProfileManager.toggleListMenu('${list.id}')"><i class="fas fa-ellipsis-v"></i></button>
                                <div class="kebab-dropdown" id="kebab-${list.id}">
                                    <div class="kebab-item" onclick="event.stopPropagation(); ProfileManager.prepareEditList('${list.id}')"><i class="fas fa-edit"></i> Edit</div>
                                    <div class="kebab-item delete" onclick="event.stopPropagation(); ProfileManager.confirmDeleteList('${list.id}')"><i class="fas fa-trash"></i> Delete</div>
                                </div>
                            </div>` : '';
                        
                        listCard.innerHTML = `
                            ${kebabHtml}
                            <div class="list-card-header">
                                <div class="list-card-title">
                                    <span style="font-size: 24px;">${list.icon}</span>
                                    ${list.title}
                                </div>
                            </div>
                            <p class="list-card-description">${list.description}</p>
                            <div class="list-preview-grid">
                                ${previewItems.join('')}
                            </div>
                            <div class="list-card-footer">
                                <span class="list-card-count">${restaurantIds.length} places</span>
                                <button class="list-card-button" onclick="event.stopPropagation(); ProfileManager.showList('${list.id}')">View List</button>
                            </div>
                        `;
                        
                        listCard.onclick = () => ProfileManager.showList(list.id);
                        listsGrid.appendChild(listCard);
                    });
                },

                renderMobileLists() {
                    const mobileListsContainer = document.getElementById('mobileLists');
                    if (!mobileListsContainer) return;
                    
                    mobileListsContainer.innerHTML = '';
                    
                    const defaultLists = [
                        {
                            id: 'favorites',
                            title: 'Favorites',
                            description: 'Your top picks.',
                            icon: 'heart',
                            color: 'var(--error)',
                            restaurants: this.currentLists.favorites?.restaurants || [],
                            isDefault: true
                        },
                        {
                            id: 'visited',
                            title: 'Visited',
                            description: 'Places you have checked out.',
                            icon: 'check',
                            color: 'var(--success)',
                            restaurants: this.currentLists.visited?.restaurants || [],
                            isDefault: true
                        },
                        {
                            id: 'wantToGo',
                            title: 'Want To Go',
                            description: 'Saved for later.',
                            icon: 'bookmark',
                            color: 'var(--accent)',
                            restaurants: this.currentLists.wantToGo?.restaurants || [],
                            isDefault: true
                        }
                    ];
                    
                    let allLists = [...defaultLists, ...customLists.map(list => ({
                        id: list.id,
                        title: list.title,
                        description: list.description || 'Your custom-made collection.',
                        icon: normalizeIconKey(list.icon, 'list'),
                        color: 'var(--accent)',
                        restaurants: list.restaurants || [],
                        isDefault: false
                    }))];
                    allLists = applyPinnedListSorting('restaurant', allLists);
                    
                    if (allLists.length === 0) {
                        mobileListsContainer.innerHTML = `
                            <div class="mobile-empty-state">
                                <div class="mobile-empty-icon">${iconGlyph('list')}</div>
                                <div class="mobile-empty-title">No Lists Yet</div>
                                <div class="mobile-empty-description">Create your first list to organize restaurants!</div>
                                <button class="mobile-action-btn" onclick="ProfileManager.showCreateListModal()">
                                    <i class="fas fa-plus"></i> Create List
                                </button>
                            </div>
                        `;
                        return;
                    }
                    
                    allLists.forEach(list => {
                        const listCard = document.createElement('div');
                        listCard.className = 'mobile-list-card';
                        
                        const previewItems = [];
                        const restaurantIds = list.restaurants || [];
                        const shuffledIds = [...restaurantIds].sort(() => 0.5 - Math.random());
                        
                        for (let i = 0; i < 4; i++) {
                            if (shuffledIds[i]) {
                                const restaurantId = shuffledIds[i];
                                const restaurant = restaurants.find(r => r.id === restaurantId);
                                if (restaurant) {
                                    previewItems.push(`
                                        <div class="mobile-preview-item is-landscape">
                                            <img src="images/${restaurant.image || 'placeholder.jpg'}" alt="${restaurant.name}" loading="lazy">
                                        </div>
                                    `);
                                } else {
                                    previewItems.push(`
                                        <div class="mobile-preview-item is-landscape">
                                            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: var(--bg); display: flex; align-items: center; justify-content: center; color: var(--muted);">
                                                ${iconGlyph('restaurant')}
                                            </div>
                                        </div>
                                    `);
                                }
                            } else {
                                previewItems.push(`
                                    <div class="mobile-preview-item is-landscape">
                                        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: var(--bg); display: flex; align-items: center; justify-content: center; color: var(--muted);">
                                            ${iconGlyph('restaurant')}
                                        </div>
                                    </div>
                                `);
                            }
                        }
                        
                        const kebabHtml = (isViewingOwnProfile && !list.isDefault) ? `
                            <div class="list-card-actions">
                                <button class="kebab-btn" onclick="event.stopPropagation(); ProfileManager.toggleListMenu('${list.id}')"><i class="fas fa-ellipsis-v"></i></button>
                                <div class="kebab-dropdown" id="kebab-${list.id}">
                                    <div class="kebab-item" onclick="event.stopPropagation(); ProfileManager.prepareEditList('${list.id}')"><i class="fas fa-edit"></i> Edit</div>
                                    <div class="kebab-item delete" onclick="event.stopPropagation(); ProfileManager.confirmDeleteList('${list.id}')"><i class="fas fa-trash"></i> Delete</div>
                                </div>
                            </div>` : '';
                        
                        listCard.innerHTML = `
                            ${kebabHtml}
                            <div class="mobile-list-header">
                                <div class="mobile-list-icon">
                                    ${iconGlyph(list.icon, 'list')}
                                </div>
                                <div class="mobile-list-info">
                                    <div class="mobile-list-title">${list.title}</div>
                                    <div class="mobile-list-count">${restaurantIds.length} places</div>
                                </div>
                            </div>
                            ${list.description ? `<div class="mobile-list-description">${list.description}</div>` : ''}
                            <div class="mobile-list-preview">
                                ${previewItems.join('')}
                            </div>
                            <button class="mobile-action-btn secondary" onclick="event.stopPropagation(); ProfileManager.showMobileList('${list.id}')" style="width: 100%;">
                                <i class="fas fa-eye"></i> View List
                            </button>
                        `;
                        
                        listCard.onclick = () => ProfileManager.showMobileList(list.id);
                        mobileListsContainer.appendChild(listCard);
                    });
                }
            };

            // ===== LIST SUBMIT FUNCTION =====
            async function handleListSubmit(e) {
                e.preventDefault();
                
                const title = document.getElementById('listName').value.trim();
                const description = document.getElementById('listDescription').value.trim();
                const icon = getDefaultListIconForContext('restaurant');
                const createListModal = document.getElementById('createListModal');
                const tierState = window.ListUtils && createListModal
                    ? ListUtils.readTierCreateState(createListModal)
                    : { listKind: 'standard', maxRank: null };
                const normalizedListKind = window.ListUtils
                    ? ListUtils.normalizeListKindValue(tierState.listKind, 'standard')
                    : (String(tierState.listKind || '').toLowerCase() === 'tier' ? 'tier' : 'standard');
                const normalizedMaxRank = window.ListUtils
                    ? ListUtils.normalizeTierMaxRank(tierState.maxRank)
                    : null;
                const dbListKind = normalizedListKind === 'tier' ? 'tier' : 'restaurant';
                
                if (!title) {
                    showToast('Please enter a list name', 'error');
                    return;
                }
                
                // Check if already submitting
                if (isSubmittingList) {
                    console.log('Already submitting, ignoring duplicate request');
                    return;
                }
                
                isSubmittingList = true;
                
                // Disable form
                const submitBtn = e.target.querySelector('button[type="submit"]');
                const form = document.getElementById('createListForm');
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<div class="loading-spinner"></div>';
                }
                if (form) {
                    form.style.pointerEvents = 'none';
                }
                
                try {
                    if (isEditingList && editingListId) {
                        // UPDATE existing list
                        console.log('Updating list:', editingListId);

                        const updatePayload = {
                            title: title,
                            description: description,
                            icon: icon,
                            list_kind: dbListKind,
                            updated_at: new Date().toISOString()
                        };
                        const hasListKindColumnError = (error) => {
                            const message = String(error?.message || '').toLowerCase();
                            const details = String(error?.details || '').toLowerCase();
                            return !!error && (
                                error.code === '42703' ||
                                message.includes('list_kind') ||
                                details.includes('list_kind')
                            );
                        };

                        let { error } = await supabase
                            .from('lists')
                            .update(updatePayload)
                            .eq('id', editingListId);

                        if (hasListKindColumnError(error)) {
                            ({ error } = await supabase
                                .from('lists')
                                .update({
                                    title: title,
                                    description: description,
                                    icon: icon,
                                    updated_at: new Date().toISOString()
                                })
                                .eq('id', editingListId));
                        }

                        if (error) throw error;

                        if (window.ListUtils && typeof ListUtils.setListMeta === 'function') {
                            ListUtils.setListMeta('restaurant', editingListId, {
                                listKind: normalizedListKind,
                                maxRank: normalizedMaxRank
                            }, {
                                client: supabase,
                                userId: currentUser?.id
                            });
                        }
                        
                        // Update in local arrays
                        const listIndex = customLists.findIndex(l => l.id === editingListId);
                        if (listIndex > -1) {
                            customLists[listIndex] = { 
                                ...customLists[listIndex], 
                                title, 
                                description, 
                                icon,
                                list_kind: dbListKind
                            };
                        }
                        
                        const userListIndex = listManager.userLists.findIndex(l => l.id === editingListId);
                        if (userListIndex > -1) {
                            listManager.userLists[userListIndex] = { 
                                ...listManager.userLists[userListIndex], 
                                title, 
                                description, 
                                icon,
                                list_kind: dbListKind
                            };
                        }
                        
                        showToast('List updated successfully', 'success');
                        
                    } else {
                        // CREATE new list
                        console.log('Creating new list:', title);

                        let { data: newList, error } = await supabase
                            .from('lists')
                            .insert([{
                                user_id: currentUser.id,
                                title: title,
                                description: description,
                                is_default: false,
                                icon: icon,
                                list_kind: dbListKind,
                                created_at: new Date().toISOString()
                            }])
                            .select()
                            .single();

                        const hasListKindColumnError = (err) => {
                            const message = String(err?.message || '').toLowerCase();
                            const details = String(err?.details || '').toLowerCase();
                            return !!err && (
                                err.code === '42703' ||
                                message.includes('list_kind') ||
                                details.includes('list_kind')
                            );
                        };
                        if (hasListKindColumnError(error)) {
                            ({ data: newList, error } = await supabase
                                .from('lists')
                                .insert([{
                                    user_id: currentUser.id,
                                    title: title,
                                    description: description,
                                    is_default: false,
                                    icon: icon,
                                    created_at: new Date().toISOString()
                                }])
                                .select()
                                .single());
                        }
                        
                        if (error) throw error;

                        if (window.ListUtils && newList?.id && typeof ListUtils.setListMeta === 'function') {
                            ListUtils.setListMeta('restaurant', newList.id, {
                                listKind: normalizedListKind,
                                maxRank: normalizedMaxRank
                            }, {
                                client: supabase,
                                userId: currentUser?.id
                            });
                            if (typeof ListUtils.applyListMeta === 'function') {
                                newList = ListUtils.applyListMeta('restaurant', newList);
                            }
                        }
                        
                        console.log('List created:', newList);
                        
                        // Add to local arrays
                        customLists.push(newList);
                        listManager.userLists.push(newList);
                        
                        showToast(`Created list "${title}"`, 'success');
                        if (window.ZO2Y_ANALYTICS && typeof window.ZO2Y_ANALYTICS.track === 'function') {
                            window.ZO2Y_ANALYTICS.track('custom_list_created', {
                                media_type: 'restaurant',
                                source: 'profile_modal'
                            }, { essential: true });
                        }
                        if (window.ZO2Y_ANALYTICS && typeof window.ZO2Y_ANALYTICS.markFirstAction === 'function') {
                            window.ZO2Y_ANALYTICS.markFirstAction('first_custom_list_created', {
                                media_type: 'restaurant',
                                user_id: currentUser?.id || ''
                            }, { essential: true });
                        }
                    }
                    
                    // Close modal and reset form
                    closeModal('createListModal');
                    
                    if (form) form.reset();
                    document.getElementById('selectedIcon').value = getDefaultListIconForContext('restaurant');
                    if (window.ListUtils && createListModal) {
                        ListUtils.resetTierCreateState(createListModal);
                    }
                    
                    // Reset editing state
                    isEditingList = false;
                    editingListId = null;
                    
                    const modalTitle = document.querySelector('#createListModal .modal-title');
                    if (modalTitle) modalTitle.textContent = "Create New List";
                    
                    // Re-render lists
                    renderRestaurants();
                    
                    // Update stats
                    await updateStats();
                    
                } catch (error) {
                    console.error('Error saving list:', error);
                    showToast('Error saving list: ' + error.message, 'error');
                } finally {
                    // Re-enable form
                    isSubmittingList = false;
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = isEditingList ? 'Update List' : 'Create List';
                    }
                    if (form) {
                        form.style.pointerEvents = '';
                    }
                }
            }

            // ===== LIST DISPLAY FUNCTIONS =====
            function removeFromList(restaurantId) {
                showConfirmModal(
                    'Remove restaurant from list?',
                    'This will remove the restaurant from your list.',
                    async () => {
                        if (!currentActiveList || !currentActiveList.id) {
                            showToast('Could not find list', 'error');
                            return;
                        }
                        
                        try {
                            // Remove from database
                            await supabase
                                .from('lists_restraunts')
                                .delete()
                                .match({ 
                                    list_id: currentActiveList.id, 
                                    restraunt_id: restaurantId 
                                });
                            
                            showToast('Removed from list', 'success');
                            
                            // Update the local list data
                            if (currentActiveList.restaurants) {
                                const index = currentActiveList.restaurants.indexOf(restaurantId);
                                if (index > -1) {
                                    currentActiveList.restaurants.splice(index, 1);
                                }
                            }
                            
                            // Refresh the view
                            if (window.innerWidth <= 768) {
                                await renderMobileListRestaurants(currentActiveList.restaurants || [], currentActiveList);
                            } else {
                                await renderListRestaurants(currentActiveList.restaurants || [], currentActiveList);
                            }
                            
                        } catch (error) {
                            console.error('Error removing restaurant:', error);
                            showToast('Error removing restaurant', 'error');
                        }
                    }
                );
            }

            async function showList(listId) {
                let list;
                
                if (listId === 'favorites') {
                    list = listManager.currentLists.favorites;
                } else if (listId === 'visited') {
                    list = listManager.currentLists.visited;
                } else if (listId === 'wantToGo') {
                    list = listManager.currentLists.wantToGo;
                } else {
                    list = customLists.find(l => l.id == listId) || 
                        listManager.userLists.find(l => l.id == listId);
                }
                
                if (!list) {
                    showToast('List not found', 'error');
                    return;
                }
                
                currentActiveList = list;
                
                const isMobile = window.innerWidth <= 768;
                
                if (isMobile) {
                    showMobileList(listId);
                    return;
                }
                
                const listsTab = document.getElementById('lists-tab');
                const listDetailView = document.getElementById('list-detail-view');
                
                if (listsTab) listsTab.style.display = 'none';
                if (listDetailView) {
                    listDetailView.style.display = 'block';
                    listDetailView.classList.add('active');
                }
                
                document.getElementById('listDetailTitle').textContent = list.title;
                document.getElementById('listDetailDescription').textContent = list.description || '';
                
                const editListBtn = document.getElementById('editListBtn');
                const addToListBtn = document.getElementById('addToListBtn');
                
                if (editListBtn) {
                    editListBtn.style.display = isViewingOwnProfile && !['favorites', 'visited', 'wantToGo'].includes(listId) ? 'flex' : 'none';
                }
                if (addToListBtn) addToListBtn.style.display = isViewingOwnProfile ? 'flex' : 'none';
                
                await renderListRestaurants(list.restaurants || [], list);
            }

            async function renderListRestaurants(listRestaurants, list) {
                const grid = document.getElementById('listRestaurantsGrid');
                if (!grid) return;

                grid.innerHTML = '';

                if (!listRestaurants || listRestaurants.length === 0) {
                    const emptyStateText = isViewingOwnProfile ?
                        'Start adding items to your list!' :
                        'This list is currently empty.';

                    grid.innerHTML = `
                        <div class="empty-state">
                            <div class="empty-icon">${iconGlyph('list')}</div>
                            <h3 class="empty-title">No Collections Yet</h3>
                            <p class="empty-description">${emptyStateText}</p>
                            ${isViewingOwnProfile ? `
                                <button class="btn btn-primary mt-md" onclick="window.location.href='index.html'">
                                    <i class="fas fa-search"></i> Browse Places
                                </button>
                            ` : ''}
                        </div>
                    `;
                    return;
                }

                // Get restaurant details
                const numericIds = listRestaurants.map(id => Number(id));
                const restaurantsData = restaurants.filter(r => numericIds.includes(r.id));
                
                const listDetailTitle = document.getElementById('listDetailTitle');
                if (listDetailTitle) {
                    listDetailTitle.textContent = `${list.title} (${restaurantsData.length} ${restaurantsData.length === 1 ? 'place' : 'places'})`;
                }

                restaurantsData.forEach(restaurant => {
                    const card = document.createElement('div');
                    card.className = 'card';
                    card.style.position = 'relative';
                    
                    const clickableContent = document.createElement('a');
                    clickableContent.href = `restaurant.html?slug=${restaurant.slug}`;
                    clickableContent.style.textDecoration = 'none';
                    clickableContent.style.color = 'inherit';
                    clickableContent.style.display = 'block';
                    clickableContent.style.height = '100%';
                    
                    clickableContent.innerHTML = `
                        <div class="card-body">
                            <div class="d-flex align-center gap-md">
                                <div class="restaurant-image" style="width: 60px; height: 60px;">
                                    <img src="images/${restaurant.image || 'placeholder.jpg'}" alt="${restaurant.name}" loading="lazy" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">
                                </div>
                                <div style="flex: 1;">
                                    <h3 style="margin-bottom: 4px;">${restaurant.name}</h3>
                                    <div class="text-sm text-muted">${restaurant.category}</div>
                                    <div class="text-sm" style="margin-top: 4px;">* ${restaurant.rating}</div>
                                </div>
                            </div>
                        </div>
                    `;
                    
                    card.appendChild(clickableContent);
                    
                    if (isViewingOwnProfile) {
                        const removeBtn = document.createElement('button');
                        removeBtn.className = 'remove-btn';
                        removeBtn.innerHTML = '<i class="fas fa-times"></i>';
                        removeBtn.onclick = (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            removeFromList(restaurant.id);
                        };
                        card.appendChild(removeBtn);
                    }
                    
                    grid.appendChild(card);
                });
            }

            async function showMobileList(listId) {
                let list;
                
                if (listId === 'favorites') {
                    list = listManager.currentLists.favorites;
                } else if (listId === 'visited') {
                    list = listManager.currentLists.visited;
                } else if (listId === 'wantToGo') {
                    list = listManager.currentLists.wantToGo;
                } else {
                    list = customLists.find(l => l.id == listId) || 
                        listManager.userLists.find(l => l.id == listId);
                }
                
                if (!list) {
                    showToast('List not found', 'error');
                    return;
                }
                
                currentActiveList = list;
                
                // Hide all mobile sections
                document.querySelectorAll('.mobile-section').forEach(section => {
                    section.style.display = 'none';
                    section.classList.remove('active');
                });
                
                // Show list detail section
                const listDetailSection = document.getElementById('mobileListDetailSection');
                if (listDetailSection) {
                    listDetailSection.style.display = 'block';
                    listDetailSection.classList.add('active');
                    
                    // Update title and description
                    const titleEl = document.getElementById('mobileListDetailTitle');
                    const descEl = document.getElementById('mobileListDetailDescription');
                    const addBtn = document.getElementById('mobileAddToListBtn');
                    
                    if (titleEl) titleEl.textContent = list.title;
                    if (descEl) descEl.textContent = list.description || '';
                    if (addBtn) {
                        addBtn.style.display = isViewingOwnProfile ? 'flex' : 'none';
                    }
                    
                    await renderMobileListRestaurants(list.restaurants || [], list);
                }
            }

            async function renderMobileListRestaurants(listRestaurants, list) {
                const container = document.getElementById('mobileListRestaurants');
                if (!container) return;

                container.innerHTML = '';

                if (!listRestaurants || listRestaurants.length === 0) {
                    const emptyStateText = isViewingOwnProfile ?
                        'Start adding items to your list!' :
                        'This list is currently empty.';

                    container.innerHTML = `
                        <div class="mobile-empty-state">
                            <div class="mobile-empty-icon">${iconGlyph('list')}</div>
                            <div class="mobile-empty-title">No Collections Yet</div>
                            <div class="mobile-empty-description">${emptyStateText}</div>
                            ${isViewingOwnProfile ? `
                                <button class="mobile-action-btn" onclick="window.location.href='index.html'">
                                    <i class="fas fa-search"></i> Browse Places
                                </button>
                            ` : ''}
                        </div>
                    `;
                    return;
                }

                // Get restaurant details
                const numericIds = listRestaurants.map(id => Number(id));
                const restaurantsData = restaurants.filter(r => numericIds.includes(r.id));

                restaurantsData.forEach(restaurant => {
                    const restaurantCard = document.createElement('div');
                    restaurantCard.className = 'mobile-list-restaurant-card';
                    restaurantCard.style.position = 'relative';

                    const restaurantInfo = document.createElement('div');
                    restaurantInfo.className = 'mobile-list-restaurant-info';
                    restaurantInfo.style.cursor = 'pointer';
                    restaurantInfo.onclick = () => {
                        window.location.href = `restaurant.html?slug=${restaurant.slug}`;
                    };

                    restaurantInfo.innerHTML = `
                        <div class="mobile-list-restaurant-image">
                            <img src="images/${restaurant.image || 'placeholder.jpg'}" alt="${restaurant.name}" loading="lazy">
                        </div>
                        <div>
                            <div style="font-weight: 600; margin-bottom: 2px;">${restaurant.name}</div>
                            <div style="font-size: 12px; color: var(--muted);">${restaurant.category}</div>
                            <div style="font-size: 12px; color: var(--accent); margin-top: 2px;">* ${restaurant.rating}</div>
                        </div>
                    `;

                    restaurantCard.appendChild(restaurantInfo);

                    if (isViewingOwnProfile) {
                        const removeBtn = document.createElement('button');
                        removeBtn.className = 'remove-btn';
                        removeBtn.innerHTML = '<i class="fas fa-times"></i>';
                        removeBtn.style.opacity = '1';
                        removeBtn.onclick = (e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            removeFromList(restaurant.id);
                        };
                        restaurantCard.appendChild(removeBtn);
                    }

                    container.appendChild(restaurantCard);
                });
            }

            function hideListDetail() {
                const isMobile = window.innerWidth <= 768;
                
                if (isMobile) {
                    hideMobileListDetail();
                    return;
                }
                
                const listsTab = document.getElementById('lists-tab');
                const listDetailView = document.getElementById('list-detail-view');
                
                if (listsTab) listsTab.style.display = 'block';
                if (listDetailView) {
                    listDetailView.style.display = 'none';
                    listDetailView.classList.remove('active');
                }
                
                currentActiveList = null;
            }

            function hideMobileListDetail() {
                const listDetailSection = document.getElementById('mobileListDetailSection');
                if (listDetailSection) {
                    listDetailSection.style.display = 'none';
                    listDetailSection.classList.remove('active');
                }
                
                // Show the current tab section
                const currentTabSection = document.getElementById(`mobile${currentTab.charAt(0).toUpperCase() + currentTab.slice(1)}Section`);
                if (currentTabSection) {
                    currentTabSection.style.display = 'block';
                    currentTabSection.classList.add('active');
                }
                
                currentActiveList = null;
            }

            // ===== FOOD JOURNAL =====
            const foodJournal = {
                async init() {
                    await this.loadJournalEntries();
                },
                
                async loadJournalEntries() {
                    const isMobile = window.innerWidth <= 768;
                    const journalEntries = isMobile ? document.getElementById('mobileJournalEntries') : document.getElementById('journalEntries');
                    if (!journalEntries) return;
                    
                    const targetId = isViewingOwnProfile ? currentUser.id : targetUserId;
                    if (!targetId) return;
                    
                    try {
                        const { data: entries, error } = await supabase
                            .from('journal_entries')
                            .select('*, restraunts(name, image, category, slug)')
                            .eq('user_id', targetId)
                            .order('created_at', { ascending: false });

                        if (error) throw error;
                        
                        if (!entries || entries.length === 0) {
                            const emptyText = isViewingOwnProfile ? 
                                'Start reviewing places to build your journey!' :
                                'This user hasn\'t reviewed any restaurants yet.';
                            
                            if (isMobile) {
                                journalEntries.innerHTML = `
                                    <div class="mobile-empty-state">
                                        <div class="mobile-empty-icon">${iconGlyph('restaurant')}</div>
                                        <div class="mobile-empty-title">No Reviews Yet</div>
                                        <div class="mobile-empty-description">${emptyText}</div>
                                        ${isViewingOwnProfile ? `
                                            <button class="mobile-action-btn" onclick="window.location.href='index.html'">
                                                <i class="fas fa-search"></i> Browse Places
                                            </button>
                                        ` : ''}
                                    </div>
                                `;
                            } else {
                                journalEntries.innerHTML = `
                                    <div class="empty-state">
                                        <div class="empty-icon">${iconGlyph('restaurant')}</div>
                                        <h3 class="empty-title">No Reviews Yet</h3>
                                        <p class="empty-description">${emptyText}</p>
                                        ${isViewingOwnProfile ? `
                                            <button class="btn btn-primary mt-md" onclick="window.location.href='index.html'">
                                                <i class="fas fa-clapperboard"></i> Browse Places
                                            </button>
                                        ` : ''}
                                    </div>
                                `;
                            }
                            return;
                        }
                        
                        journalEntries.innerHTML = '';
                        
                        let entriesToShow = entries;
                        if (!isMobile && journalFilter === 'recent') {
                            entriesToShow = entries.slice(0, 5);
                        } else if (!isMobile && journalFilter === 'favorites') {
                            entriesToShow = entries.filter(entry => entry.rating >= 4);
                        }
                        
                        for (const entry of entriesToShow) {
                            const restaurant = entry.restraunts;
                            
                            if (!restaurant) continue;
                            
                            this.renderJournalEntry(entry, restaurant, isMobile);
                        }
                        
                    } catch (error) {
                        console.error('Error loading journal entries:', error);
                        if (isMobile) {
                            journalEntries.innerHTML = `
                                <div class="mobile-empty-state">
                                    <div class="mobile-empty-icon">${iconGlyph('list')}</div>
                                    <div class="mobile-empty-title">Unable to Load Reviews</div>
                                    <div class="mobile-empty-description">There was an error loading your reviews.</div>
                                </div>
                            `;
                        } else {
                            journalEntries.innerHTML = `
                                <div class="empty-state">
                                    <div class="empty-icon">${iconGlyph('list')}</div>
                                    <h3 class="empty-title">Unable to Load Reviews</h3>
                                    <p class="empty-description">There was an error loading your reviews.</p>
                                </div>
                            `;
                        }
                    }
                },
                
                renderJournalEntry(entry, restaurant, isMobile) {
                    const journalEntries = isMobile ? document.getElementById('mobileJournalEntries') : document.getElementById('journalEntries');
                    const entryElement = document.createElement('div');
                    
                    if (isMobile) {
                        entryElement.className = 'mobile-journal-entry';
                        entryElement.style.cursor = 'pointer';
                        entryElement.onclick = () => this.editJournalEntry(entry, restaurant);
                        
                        const restaurantImage = restaurant.image ? 
                            `<img src="images/${restaurant.image}" alt="${restaurant.name}" loading="lazy" style="width: 100%; height: 100%; object-fit: cover;">` : 
                            `<div style="width: 50px; height: 50px; background: var(--accent); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #0b1633; font-weight: bold;">${restaurant.name.charAt(0)}</div>`;
                        
                        entryElement.innerHTML = `
                            <div class="mobile-entry-header">
                                <div class="mobile-restaurant-info">
                                    <div class="mobile-restaurant-image">
                                        <a href="restaurant.html?slug=${restaurant.slug || ''}" style="text-decoration: none; color: inherit;">
                                            ${restaurantImage}
                                        </a>
                                    </div>
                                    <div class="mobile-restaurant-details">
                                        <div class="mobile-restaurant-name">${restaurant.name}</div>
                                        <div class="mobile-restaurant-category">${restaurant.category}</div>
                                    </div>
                                </div>
                                <div class="mobile-entry-rating">${'*'.repeat(Math.floor(entry.rating))} ${entry.rating}/5</div>
                            </div>
                            <div class="mobile-entry-meta">
                                <div class="mobile-meta-badge">
                                    <i class="fas fa-calendar"></i>
                                    ${new Date(entry.visit_date || entry.created_at).toLocaleDateString()}
                                </div>
                                <div class="mobile-meta-badge">
                                    <i class="fas fa-clapperboard"></i>
                                    ${restaurant.category}
                                </div>
                            </div>
                            ${entry.notes ? `
                                <div class="mobile-entry-notes">${entry.notes}</div>
                            ` : ''}
                            ${entry.tags ? `
                                <div class="mobile-entry-tags">
                                    ${entry.tags.split(',').map(tag => `<span class="mobile-tag">${tag.trim()}</span>`).join('')}
                                </div>
                            ` : ''}
                            ${isViewingOwnProfile ? `
                                <div class="mobile-entry-actions">
                                    <button class="mobile-action-btn secondary" style="padding: 8px 12px; font-size: 14px; flex: 1;" onclick="event.stopPropagation(); window.location.href='restaurant.html?slug=${restaurant.slug || ''}'">
                                        <i class="fas fa-external-link-alt"></i> View Restaurant
                                    </button>
                                </div>
                            ` : ''}
                        `;
                    } else {
                        entryElement.className = 'journal-entry';
                        entryElement.style.cursor = 'pointer';
                        entryElement.onclick = () => this.editJournalEntry(entry, restaurant);
                        
                        const restaurantLink = restaurant.slug ? `restaurant.html?slug=${restaurant.slug}` : 'javascript:void(0)';
                        const restaurantImage = restaurant.image ? 
                            `<img src="images/${restaurant.image}" alt="${restaurant.name}" loading="lazy" style="width: 100%; height: 100%; object-fit: cover;">` : 
                            `<div style="width: 60px; height: 60px; background: var(--accent); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #0b1633; font-weight: bold;">${restaurant.name.charAt(0)}</div>`;
                        
                        entryElement.innerHTML = `
                            <div class="entry-header">
                                <div class="restaurant-info">
                                    <div class="restaurant-image">
                                        <a href="${restaurantLink}" style="text-decoration: none; color: inherit;">
                                            ${restaurantImage}
                                        </a>
                                    </div>
                                    <div class="restaurant-details">
                                        <h3>
                                            <a href="${restaurantLink}" style="text-decoration: none; color: inherit;">
                                                ${restaurant.name}
                                            </a>
                                        </h3>
                                        <div class="restaurant-category">${restaurant.category}</div>
                                    </div>
                                </div>
                                <div class="entry-rating">
                                    ${'*'.repeat(Math.floor(entry.rating))}
                                    <span>${entry.rating}/5</span>
                                </div>
                            </div>
                            <div class="entry-meta">
                                <div class="meta-badge">
                                    <i class="fas fa-calendar"></i>
                                    ${new Date(entry.visit_date || entry.created_at).toLocaleDateString()}
                                </div>
                                <div class="meta-badge">
                                    <i class="fas fa-clapperboard"></i>
                                    ${restaurant.category}
                                </div>
                                <div class="meta-badge">
                                    <i class="fas fa-star"></i>
                                    ${entry.rating}/5
                                </div>
                            </div>
                            <div class="entry-notes">${entry.notes || 'No review text provided'}</div>
                            ${entry.tags ? `
                                <div class="entry-tags">
                                    ${entry.tags.split(',').map(tag => `<span class="tag">${tag.trim()}</span>`).join('')}
                                </div>
                            ` : ''}
                            ${isViewingOwnProfile ? `
                                <div class="entry-actions">
                                    <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); foodJournal.editJournalEntry(${JSON.stringify(entry).replace(/"/g, '&quot;')}, ${JSON.stringify(restaurant).replace(/"/g, '&quot;')})">
                                        <i class="fas fa-edit"></i> Edit
                                    </button>
                                    <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); listManager.toggleInList('favorites', ${restaurant.id})">
                                        <i class="fas fa-heart"></i> Favorite
                                    </button>
                                </div>
                            ` : ''}
                        `;
                    }
                    journalEntries.appendChild(entryElement);
                },
                
                async editJournalEntry(entry, restaurant) {
                    if (!isViewingOwnProfile) {
                        return;
                    }

                    const restaurantSelect = document.getElementById('restaurantSelect');
                    const visitDate = document.getElementById('visitDate');
                    const visitNotes = document.getElementById('visitNotes');
                    const visitTags = document.getElementById('visitTags');
                    
                    if (restaurantSelect) restaurantSelect.value = entry.restaurant_id;
                    if (visitDate) visitDate.value = entry.visit_date || entry.created_at.split('T')[0];
                    if (visitNotes) visitNotes.value = entry.notes || '';
                    if (visitTags) visitTags.value = entry.tags || '';
                    
                    ProfileManager.setRating(entry.rating);
                    currentEditingJournalEntry = entry.id;
                    
                    const modalTitle = document.querySelector('#addEntryModal .modal-title');
                    const submitButton = document.querySelector('#journalEntryForm button[type="submit"]');
                    
                    if (modalTitle) modalTitle.textContent = 'Edit Journal Entry';
                    if (submitButton) submitButton.textContent = 'Update Entry';
                    
                    ProfileManager.showModal('addEntryModal');
                },

                async saveJournalEntry() {
                    const restaurantId = parseInt(document.getElementById('restaurantSelect')?.value);
                    const visitDate = document.getElementById('visitDate')?.value;
                    const rating = parseInt(document.getElementById('selectedRating')?.value || '0');
                    const notes = document.getElementById('visitNotes')?.value || '';
                    const tags = (document.getElementById('visitTags')?.value || '').split(',').map(tag => tag.trim()).filter(tag => tag);
                    
                    if (!restaurantId || !visitDate || rating === 0) {
                        showToast('Please fill in all required fields', 'error');
                        return;
                    }

                    try {
                        if (currentEditingJournalEntry) {
                            const { error } = await supabase
                                .from('journal_entries')
                                .update({
                                    restaurant_id: restaurantId,
                                    visit_date: visitDate,
                                    rating: rating,
                                    notes: notes,
                                    tags: tags.join(','),
                                    updated_at: new Date().toISOString()
                                })
                                .eq('id', currentEditingJournalEntry);
                            
                            if (error) throw error;
                            
                            showToast('Journal entry updated successfully!', 'success');
                            currentEditingJournalEntry = null;
                            
                        } else {
                            const { error } = await supabase
                                .from('journal_entries')
                                .insert({
                                    user_id: currentUser.id,
                                    restaurant_id: restaurantId,
                                    visit_date: visitDate,
                                    rating: rating,
                                    notes: notes,
                                    tags: tags.join(','),
                                    created_at: new Date().toISOString()
                                });
                            
                            if (error) throw error;
                            
                            await listManager.toggleInList('visited', restaurantId);
                            const restaurant = restaurants.find(r => r.id === restaurantId);
                            showToast(`Added ${restaurant?.name || 'restaurant'} to your journal!`, 'success');
                        }
                        
                        ProfileManager.closeModal('addEntryModal');
                        
                        const form = document.getElementById('journalEntryForm');
                        if (form) form.reset();
                        ProfileManager.setRating(0);
                        
                        const modalTitle = document.querySelector('#addEntryModal .modal-title');
                        const submitButton = document.querySelector('#journalEntryForm button[type="submit"]');
                        
                        if (modalTitle) modalTitle.textContent = 'Add Journal Entry';
                        if (submitButton) submitButton.textContent = 'Save Entry';
                        
                        await this.loadJournalEntries();
                        await updateStats();
                        
                    } catch (error) {
                        console.error('Error saving journal entry:', error);
                        showToast('Error saving journal entry', 'error');
                    }
                }
            };

            // ===== CREATE COMMUNITY SYSTEM =====
            function createCommunitySystem() {
                return {
                    currentSection: 'followers',
                    loadedUsersCache: new Set(),
                    
                    async init() {
                        await this.loadFollowStats();
                        
                        const userSearch = document.getElementById('userSearch');
                        if (userSearch) {
                            userSearch.addEventListener('input', () => {
                                if (currentSearchDebounce) {
                                    clearTimeout(currentSearchDebounce);
                                }
                                currentSearchDebounce = setTimeout(() => {
                                    this.searchUsers();
                                }, 300);
                            });
                        }
                    },

                    async loadFollowStats() {
                        try {
                            const targetId = isViewingOwnProfile ? currentUser.id : targetUserId;
                            
                            // Get followers count
                            const { count: followersCount, error: followersError } = await supabase
                                .from('follows')
                                .select('*', { count: 'exact', head: true })
                                .eq('followed_id', targetId);

                            // Get following count
                            const { count: followingCount, error: followingError } = await supabase
                                .from('follows')
                                .select('*', { count: 'exact', head: true })
                                .eq('follower_id', targetId);

                            const followersCountBadge = document.getElementById('followersCountBadge');
                            const followingCountBadge = document.getElementById('followingCountBadge');
                            
                            if (followersCountBadge) {
                                followersCountBadge.textContent = followersCount || 0;
                                followersCountBadge.style.display = (followersCount || 0) > 0 ? 'inline-block' : 'none';
                            }
                            if (followingCountBadge) {
                                followingCountBadge.textContent = followingCount || 0;
                                followingCountBadge.style.display = (followingCount || 0) > 0 ? 'inline-block' : 'none';
                            }

                            await renderCommunityPreview(targetId, followersCount || 0, followingCount || 0);

                        } catch (error) {
                            console.error('Error loading follow stats:', error);
                        }
                    },

                    async loadFollowers() {
                        try {
                            const targetId = isViewingOwnProfile ? currentUser.id : targetUserId;
                            
                            const { data: follows, error } = await supabase
                                .from('follows')
                                .select('follower_id')
                                .eq('followed_id', targetId);

                            if (error) throw error;

                            const isMobile = window.innerWidth <= 768;
                            const followersList = isMobile ? document.getElementById('mobileFollowersList') : document.getElementById('followersList');
                            if (!followersList) return;

                            if (!follows || follows.length === 0) {
                                const emptyText = isViewingOwnProfile ? 
                                    'Share your profile to get followers!' :
                                    'This user doesn\'t have any followers yet.';
                                
                                if (isMobile) {
                                    followersList.innerHTML = `
                                        <div class="mobile-empty-state">
                                            <div class="mobile-empty-icon">${iconGlyph('list')}</div>
                                            <div class="mobile-empty-title">No followers yet</div>
                                            <div class="mobile-empty-description">${emptyText}</div>
                                        </div>
                                    `;
                                } else {
                                    followersList.innerHTML = `
                                        <div class="empty-state">
                                            <div class="empty-icon">${iconGlyph('list')}</div>
                                            <h3 class="empty-title">No followers yet</h3>
                                            <p class="empty-description">${emptyText}</p>
                                        </div>
                                    `;
                                }
                                return;
                            }

                            this.loadedUsersCache.clear();
                            const followerIds = follows.map(f => f.follower_id);
                            const uniqueFollowerIds = [...new Set(followerIds)];
                            
                            const { data: users, error: usersError } = await supabase
                                .from('user_profiles')
                                .select('*')
                                .in('id', uniqueFollowerIds);

                            if (!usersError) {
                                this.displayUsers(users, isMobile ? 'mobileFollowersList' : 'followersList');
                            }
                        } catch (error) {
                            console.error('Error loading followers:', error);
                            showToast('Error loading followers', 'error');
                        }
                    },

                    async loadFollowing() {
                        try {
                            const targetId = isViewingOwnProfile ? currentUser.id : targetUserId;
                            
                            const { data: follows, error } = await supabase
                                .from('follows')
                                .select('followed_id')
                                .eq('follower_id', targetId);

                            if (error) throw error;

                            const isMobile = window.innerWidth <= 768;
                            const followingList = isMobile ? document.getElementById('mobileFollowingList') : document.getElementById('followingList');
                            if (!followingList) return;

                            if (!follows || follows.length === 0) {
                                const emptyText = isViewingOwnProfile ? 
                                    'Discover and follow people you like!' :
                                    'This user isn\'t following anyone yet.';
                                
                                if (isMobile) {
                                    followingList.innerHTML = `
                                        <div class="mobile-empty-state">
                                            <div class="mobile-empty-icon">${iconGlyph('list')}</div>
                                            <div class="mobile-empty-title">${isViewingOwnProfile ? 'Not following anyone yet' : 'No following yet'}</div>
                                            <div class="mobile-empty-description">${emptyText}</div>
                                        </div>
                                    `;
                                } else {
                                    followingList.innerHTML = `
                                        <div class="empty-state">
                                            <div class="empty-icon">${iconGlyph('list')}</div>
                                            <h3 class="empty-title">${isViewingOwnProfile ? 'Not following anyone yet' : 'No following yet'}</h3>
                                            <p class="empty-description">${emptyText}</p>
                                        </div>
                                    `;
                                }
                                return;
                            }

                            this.loadedUsersCache.clear();
                            const followingIds = follows.map(f => f.followed_id);
                            const uniqueFollowingIds = [...new Set(followingIds)];
                            
                            const { data: users, error: usersError } = await supabase
                                .from('user_profiles')
                                .select('*')
                                .in('id', uniqueFollowingIds);

                            if (!usersError) {
                                this.displayUsers(users, isMobile ? 'mobileFollowingList' : 'followingList');
                            }
                        } catch (error) {
                            console.error('Error loading following:', error);
                            showToast('Error loading following', 'error');
                        }
                    },

                    formatActivityTime(value) {
                        const ts = new Date(value || 0).getTime();
                        if (!Number.isFinite(ts) || ts <= 0) return '';
                        const diff = Math.max(0, Date.now() - ts);
                        const mins = Math.floor(diff / (1000 * 60));
                        if (mins < 1) return 'just now';
                        if (mins < 60) return `${mins}m ago`;
                        const hours = Math.floor(mins / 60);
                        if (hours < 24) return `${hours}h ago`;
                        const days = Math.floor(hours / 24);
                        if (days < 30) return `${days}d ago`;
                        return new Date(ts).toLocaleDateString();
                    },

                    renderActivityAction(eventRow) {
                        const eventType = String(eventRow?.event_type || '').toLowerCase();
                        const mediaType = String(eventRow?.media_type || '').toLowerCase();
                        const item = eventRow?.__activityItem || {};
                        const listTitle = String(eventRow?.__activityListTitle || '').trim();
                        const itemTitle = String(item.title || '').trim();
                        const targetText = itemTitle || this.getActivityGenericTarget(eventRow?.media_type);
                        const listText = listTitle || 'a list';
                        const safeTarget = escapeHtml(targetText);
                        const safeList = escapeHtml(listText);
                        const mediaTag = this.getActivityMediaTypeTag(mediaType);

                        if (eventType === 'review_add') return `posted a review for ${safeTarget}${mediaTag}`;
                        if (eventType === 'review_edit') return `edited a review for ${safeTarget}${mediaTag}`;
                        if (eventType === 'review_delete') return `deleted a review for ${safeTarget}${mediaTag}`;
                        if (eventType === 'list_create') return `created a new list ${safeList}${mediaTag}`;
                        if (eventType === 'list_delete') return `deleted a list ${safeList}${mediaTag}`;
                        if (eventType === 'list_add') return `added ${safeTarget}${mediaTag} to ${safeList}`;
                        if (eventType === 'list_remove') return `removed ${safeTarget}${mediaTag} from ${safeList}`;
                        return 'updated activity';
                    },

                    getActivityMediaTypeTag(mediaType) {
                        const normalized = String(mediaType || '').trim().toLowerCase();
                        if (!normalized) return '';
                        return ` (${escapeHtml(normalized)})`;
                    },

                    getActivityGenericTarget(mediaType) {
                        const labelByMedia = {
                            movie: 'movie',
                            tv: 'show',
                            anime: 'anime',
                            game: 'game',
                            book: 'book',
                            music: 'track',
                            restaurant: 'restaurant'
                        };
                        const mediaLabel = labelByMedia[String(mediaType || '').toLowerCase()] || 'item';
                        return `a ${mediaLabel}`;
                    },

                    getDefaultActivityListTitle(mediaType, listType) {
                        const key = String(listType || '').trim().toLowerCase();
                        const type = String(mediaType || '').trim().toLowerCase();
                        if (!key) return '';
                        const map = {
                            movie: { favorites: 'Favorites', watched: 'Watched', watchlist: 'Watchlist' },
                            tv: { favorites: 'Favorites', watched: 'Watched', watchlist: 'Watchlist' },
                            anime: { favorites: 'Favorites', watched: 'Watched', watchlist: 'Watchlist' },
                            game: { favorites: 'Favorites', watched: 'Played', watchlist: 'Backlog' },
                            book: { favorites: 'Favorites', read: 'Read', readlist: 'Readlist' },
                            music: { favorites: 'Favorites', listened: 'Listened', listenlist: 'Listenlist' },
                            fashion: { favorites: 'Favorites', owned: 'Owned', wishlist: 'Wishlist' },
                            food: { favorites: 'Favorites', tried: 'Tried', want_to_try: 'Want to Try' },
                            car: { favorites: 'Favorites', owned: 'Owned', wishlist: 'Wishlist' }
                        };
                        if (map[type] && map[type][key]) return map[type][key];
                        return key.replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());
                    },

                    getActivityCustomListTable(mediaType) {
                        const normalized = String(mediaType || '').trim().toLowerCase();
                        if (!normalized) return '';
                        if (normalized === 'restaurant' && ENABLE_RESTAURANTS) return 'lists';
                        return CUSTOM_LIST_TABLES[normalized] || '';
                    },

                    async fetchActivityItemDetails(mediaType, itemId) {
                        const safeType = String(mediaType || '').trim().toLowerCase();
                        const safeId = String(itemId || '').trim();
                        if (!safeType || !safeId) return null;

                        if (safeType === 'movie') {
                            const data = await fetchMovieDetails(safeId);
                            return data ? {
                                title: String(data.title || data.name || '').trim(),
                                image: data.poster_path ? `${TMDB_POSTER}${data.poster_path}` : ''
                            } : null;
                        }
                        if (safeType === 'tv') {
                            const data = await fetchTvDetails(safeId);
                            return data ? {
                                title: String(data.name || data.title || '').trim(),
                                image: data.poster_path ? `${TMDB_POSTER}${data.poster_path}` : ''
                            } : null;
                        }
                        if (safeType === 'anime') {
                            const data = await fetchAnimeDetails(safeId);
                            return data ? {
                                title: String(data.name || data.title || '').trim(),
                                image: data.poster_path ? `${TMDB_POSTER}${data.poster_path}` : ''
                            } : null;
                        }
                        if (safeType === 'game') {
                            const data = await fetchGameDetails(safeId);
                            return data ? {
                                title: String(data.name || data.title || '').trim(),
                                image: normalizeGameImageSource(data)
                            } : null;
                        }
                        if (safeType === 'book') {
                            const data = await resolveProfileBookRecord(safeId);
                            return data ? {
                                title: String(data.title || '').trim(),
                                image: String(data.thumbnail || '').trim() || FALLBACK_BOOK_IMAGE
                            } : null;
                        }
                        if (safeType === 'music') {
                            const data = await fetchMusicDetails(safeId);
                            return data ? {
                                title: String(data.name || '').trim(),
                                image: String(data.image_url || '').trim() || '/newlogo.webp'
                            } : null;
                        }
                        if (safeType === 'fashion' || safeType === 'food') {
                            const table = safeType === 'fashion' ? 'fashion_brands' : 'food_brands';
                            const { data } = await supabase
                                .from(table)
                                .select('id, name, logo_url')
                                .eq('id', safeId)
                                .maybeSingle();
                            return data ? {
                                title: String(data.name || '').trim(),
                                image: String(data.logo_url || '').trim() || '/newlogo.webp'
                            } : null;
                        }
                        if (safeType === 'restaurant') {
                            if (!restaurants.length) {
                                await loadRestaurants().catch(() => {});
                            }
                            const restaurant = restaurants.find((entry) => String(entry?.id || '') === safeId);
                            return restaurant ? {
                                title: String(restaurant.name || '').trim(),
                                image: restaurant.image ? `images/${restaurant.image}` : ''
                            } : null;
                        }
                        return null;
                    },

                    async enrichActivityRows(rows) {
                        const safeRows = Array.isArray(rows) ? rows : [];
                        if (!safeRows.length) return [];

                        const uniqueItemPairs = [];
                        const seenItemPairs = new Set();
                        safeRows.forEach((row) => {
                            const mediaType = String(row?.media_type || '').trim().toLowerCase();
                            const itemId = String(row?.item_id || '').trim();
                            const key = `${mediaType}:${itemId}`;
                            if (!mediaType || !itemId || seenItemPairs.has(key)) return;
                            seenItemPairs.add(key);
                            uniqueItemPairs.push({ mediaType, itemId, key });
                        });

                        const itemMap = new Map();
                        await Promise.all(uniqueItemPairs.map(async (pair) => {
                            try {
                                const details = await this.fetchActivityItemDetails(pair.mediaType, pair.itemId);
                                if (details) itemMap.set(pair.key, details);
                            } catch (_err) {}
                        }));

                        const customListIdsByType = new Map();
                        safeRows.forEach((row) => {
                            const mediaType = String(row?.media_type || '').trim().toLowerCase();
                            const listId = String(row?.list_id || '').trim();
                            const table = this.getActivityCustomListTable(mediaType);
                            if (!mediaType || !listId || !table) return;
                            if (!customListIdsByType.has(mediaType)) customListIdsByType.set(mediaType, new Set());
                            customListIdsByType.get(mediaType).add(listId);
                        });

                        const listMap = new Map();
                        await Promise.all(Array.from(customListIdsByType.entries()).map(async ([mediaType, idsSet]) => {
                            const ids = Array.from(idsSet || []).filter(Boolean);
                            if (!ids.length) return;
                            const table = this.getActivityCustomListTable(mediaType);
                            if (!table) return;
                            const { data } = await supabase
                                .from(table)
                                .select('id, title')
                                .in('id', ids);
                            (data || []).forEach((row) => {
                                const key = `${mediaType}:${String(row.id || '').trim()}`;
                                const title = String(row.title || '').trim();
                                if (title) listMap.set(key, title);
                            });
                        }));

                        return safeRows.map((row) => {
                            const mediaType = String(row?.media_type || '').trim().toLowerCase();
                            const itemId = String(row?.item_id || '').trim();
                            const listId = String(row?.list_id || '').trim();
                            const itemKey = `${mediaType}:${itemId}`;
                            const listKey = `${mediaType}:${listId}`;
                            const item = itemMap.get(itemKey) || null;
                            const metadataListTitle = String(row?.metadata?.list_title || '').trim();
                            const listTitle = listMap.get(listKey) || metadataListTitle || this.getDefaultActivityListTitle(mediaType, row?.list_type);
                            return {
                                ...row,
                                __activityItem: item,
                                __activityListTitle: listTitle || ''
                            };
                        });
                    },

                    async fetchRowsWithCreatedAtFallback(tableName, selectWithCreatedAt, selectFallback, actorIds, limit = 30) {
                        const withCreatedAt = await supabase
                            .from(tableName)
                            .select(selectWithCreatedAt)
                            .in('user_id', actorIds)
                            .order('created_at', { ascending: false })
                            .limit(limit);

                        if (!withCreatedAt?.error) {
                            return Array.isArray(withCreatedAt?.data) ? withCreatedAt.data : [];
                        }

                        const fallback = await supabase
                            .from(tableName)
                            .select(selectFallback)
                            .in('user_id', actorIds)
                            .order('id', { ascending: false })
                            .limit(limit);

                        if (fallback?.error) return [];
                        return (Array.isArray(fallback?.data) ? fallback.data : []).map((row) => ({ ...row, created_at: null }));
                    },

                    toActivityTimestamp(value) {
                        const ts = value ? new Date(value).getTime() : 0;
                        return Number.isFinite(ts) ? ts : 0;
                    },

                    buildActivityRowKey(row) {
                        const eventType = String(row?.event_type || '').trim().toLowerCase();
                        const actorId = String(row?.actor_id || '').trim();
                        const mediaType = String(row?.media_type || '').trim().toLowerCase();
                        const itemId = String(row?.item_id || '').trim();
                        const listType = String(row?.list_type || '').trim().toLowerCase();
                        const listId = String(row?.list_id || '').trim();
                        const rating = Number(row?.rating || 0);
                        const reviewText = String(row?.review_text || '').trim().replace(/\s+/g, ' ').slice(0, 120).toLowerCase();
                        const createdBucket = Math.floor(this.toActivityTimestamp(row?.created_at) / 60000);
                        return [eventType, actorId, mediaType, itemId, listType, listId, rating, reviewText, createdBucket].join('|');
                    },

                    mergeActivityRows(...groups) {
                        const merged = groups.flat().filter(Boolean);
                        if (!merged.length) return [];
                        const keyed = new Map();

                        merged.forEach((row) => {
                            const key = this.buildActivityRowKey(row);
                            const prev = keyed.get(key);
                            if (!prev) {
                                keyed.set(key, row);
                                return;
                            }
                            const prevTs = this.toActivityTimestamp(prev?.created_at);
                            const nextTs = this.toActivityTimestamp(row?.created_at);
                            if (nextTs >= prevTs) keyed.set(key, row);
                        });

                        const out = Array.from(keyed.values());
                        out.sort((a, b) => this.toActivityTimestamp(b?.created_at) - this.toActivityTimestamp(a?.created_at));
                        return out.slice(0, 60);
                    },

                    async loadFallbackActivityRows(actorIds) {
                        const listItemSources = [
                            { table: 'movie_list_items', mediaType: 'movie', itemField: 'movie_id' },
                            { table: 'tv_list_items', mediaType: 'tv', itemField: 'tv_id' },
                            { table: 'anime_list_items', mediaType: 'anime', itemField: 'anime_id' },
                            { table: 'game_list_items', mediaType: 'game', itemField: 'game_id' },
                            { table: 'book_list_items', mediaType: 'book', itemField: 'book_id' },
                            { table: 'music_list_items', mediaType: 'music', itemField: 'track_id' }
                        ];
                        const customListSources = [
                            { table: 'movie_lists', mediaType: 'movie' },
                            { table: 'tv_lists', mediaType: 'tv' },
                            { table: 'anime_lists', mediaType: 'anime' },
                            { table: 'game_lists', mediaType: 'game' },
                            { table: 'book_lists', mediaType: 'book' },
                            { table: 'music_lists', mediaType: 'music' }
                        ];
                        if (ENABLE_RESTAURANTS) {
                            customListSources.push({ table: 'lists', mediaType: 'restaurant' });
                        }
                        const reviewSources = [
                            { table: 'movie_reviews', mediaType: 'movie', itemField: 'movie_id', textField: 'comment' },
                            { table: 'tv_reviews', mediaType: 'tv', itemField: 'tv_id', textField: 'comment' },
                            { table: 'anime_reviews', mediaType: 'anime', itemField: 'anime_id', textField: 'comment' },
                            { table: 'game_reviews', mediaType: 'game', itemField: 'game_id', textField: 'comment' },
                            { table: 'book_reviews', mediaType: 'book', itemField: 'book_id', textField: 'comment' },
                            { table: 'music_reviews', mediaType: 'music', itemField: 'track_id', textField: 'comment' }
                        ];
                        if (ENABLE_RESTAURANTS) {
                            reviewSources.push({ table: 'journal_entries', mediaType: 'restaurant', itemField: 'restraunt_id', textField: 'notes' });
                        }

                        const listAddTasks = listItemSources.map(async (source) => {
                            const rows = await this.fetchRowsWithCreatedAtFallback(
                                source.table,
                                `id, user_id, list_type, list_id, ${source.itemField}, created_at`,
                                `id, user_id, list_type, list_id, ${source.itemField}`,
                                actorIds,
                                24
                            );
                            return rows.map((row) => ({
                                id: `fallback-${source.mediaType}-list-add-${row.id}`,
                                actor_id: row.user_id,
                                event_type: 'list_add',
                                media_type: source.mediaType,
                                item_id: row[source.itemField] != null ? String(row[source.itemField]) : '',
                                list_type: row.list_type || null,
                                list_id: row.list_id != null ? String(row.list_id) : null,
                                rating: null,
                                review_text: null,
                                metadata: { source_table: source.table, fallback: true },
                                created_at: row.created_at || null
                            }));
                        });

                        const listCreateTasks = customListSources.map(async (source) => {
                            const rows = await this.fetchRowsWithCreatedAtFallback(
                                source.table,
                                'id, user_id, title, created_at',
                                'id, user_id, title',
                                actorIds,
                                20
                            );
                            return rows.map((row) => ({
                                id: `fallback-${source.mediaType}-list-create-${row.id}`,
                                actor_id: row.user_id,
                                event_type: 'list_create',
                                media_type: source.mediaType,
                                item_id: '',
                                list_type: null,
                                list_id: row.id != null ? String(row.id) : null,
                                rating: null,
                                review_text: null,
                                metadata: {
                                    source_table: source.table,
                                    fallback: true,
                                    list_title: String(row.title || '').trim()
                                },
                                created_at: row.created_at || null
                            }));
                        });

                        const reviewTasks = reviewSources.map(async (source) => {
                            const rows = await this.fetchRowsWithCreatedAtFallback(
                                source.table,
                                `id, user_id, ${source.itemField}, rating, ${source.textField}, created_at`,
                                `id, user_id, ${source.itemField}, rating, ${source.textField}`,
                                actorIds,
                                24
                            );
                            return rows.map((row) => ({
                                id: `fallback-${source.mediaType}-review-${row.id}`,
                                actor_id: row.user_id,
                                event_type: 'review_add',
                                media_type: source.mediaType,
                                item_id: row[source.itemField] != null ? String(row[source.itemField]) : '',
                                list_type: null,
                                list_id: null,
                                rating: row.rating ?? null,
                                review_text: row[source.textField] || null,
                                metadata: { source_table: source.table, fallback: true },
                                created_at: row.created_at || null
                            }));
                        });

                        const listAddRows = (await Promise.all(listAddTasks)).flat();
                        const listCreateRows = (await Promise.all(listCreateTasks)).flat();
                        const reviewRows = (await Promise.all(reviewTasks)).flat();
                        return this.mergeActivityRows(listAddRows, listCreateRows, reviewRows);
                    },

                    async fetchActivityRows(actorIds) {
                        const { data: rows, error } = await supabase
                            .from('user_activity_feed')
                            .select('id, actor_id, event_type, media_type, item_id, list_type, list_id, rating, review_text, metadata, created_at')
                            .in('actor_id', actorIds)
                            .order('created_at', { ascending: false })
                            .limit(60);

                        if (!error) {
                            const primaryRows = Array.isArray(rows) ? rows : [];
                            const supplementalRows = await this.loadFallbackActivityRows(actorIds);
                            return this.mergeActivityRows(primaryRows, supplementalRows);
                        }

                        const msg = String(error?.message || '').toLowerCase();
                        const code = String(error?.code || '').toUpperCase();
                        const missingFeedTable =
                            code === 'PGRST205' ||
                            msg.includes('user_activity_feed') ||
                            msg.includes('could not find the table');
                        if (missingFeedTable) {
                            return await this.loadFallbackActivityRows(actorIds);
                        }

                        throw error;
                    },

                    async loadActivity() {
                        try {
                            const targetId = isViewingOwnProfile ? currentUser.id : targetUserId;
                            const isMobile = window.innerWidth <= 768;
                            const list = isMobile ? document.getElementById('mobileActivityList') : document.getElementById('activityList');
                            if (!list) return;

                            const { data: follows } = await supabase
                                .from('follows')
                                .select('followed_id')
                                .eq('follower_id', targetId)
                                .limit(80);

                            const actorIds = [...new Set([
                                String(targetId || '').trim(),
                                ...((follows || []).map((row) => String(row?.followed_id || '').trim()))
                            ].filter(Boolean))].slice(0, 80);

                            if (!actorIds.length) {
                                list.innerHTML = isMobile
                                    ? `
                                        <div class="mobile-empty-state">
                                            <div class="mobile-empty-icon">${iconGlyph('list')}</div>
                                            <div class="mobile-empty-title">No activity yet</div>
                                            <div class="mobile-empty-description">Follow users to see their list updates and reviews.</div>
                                        </div>
                                    `
                                    : `
                                        <div class="empty-state">
                                            <div class="empty-icon">${iconGlyph('list')}</div>
                                            <h3 class="empty-title">No activity yet</h3>
                                            <p class="empty-description">Follow users to see their list updates and reviews.</p>
                                        </div>
                                    `;
                                return;
                            }

                            const rows = await this.fetchActivityRows(actorIds);
                            if (!rows || !rows.length) {
                                list.innerHTML = isMobile
                                    ? `
                                        <div class="mobile-empty-state">
                                            <div class="mobile-empty-icon">${iconGlyph('list')}</div>
                                            <div class="mobile-empty-title">No activity yet</div>
                                            <div class="mobile-empty-description">No recent list updates or reviews were found.</div>
                                        </div>
                                    `
                                    : `
                                        <div class="empty-state">
                                            <div class="empty-icon">${iconGlyph('list')}</div>
                                            <h3 class="empty-title">No activity yet</h3>
                                            <p class="empty-description">No recent list updates or reviews were found.</p>
                                        </div>
                                    `;
                                return;
                            }

                            const profileIds = [...new Set(rows.map((r) => String(r?.actor_id || '').trim()).filter(Boolean))];
                            const { data: profiles } = await supabase
                                .from('user_profiles')
                                .select('id, username, full_name, avatar_icon')
                                .in('id', profileIds);
                            const profileMap = new Map((profiles || []).map((p) => [String(p.id), p]));
                            const enrichedRows = await this.enrichActivityRows(rows);

                            if (isMobile) {
                                list.innerHTML = `
                                    <div class="mobile-activity-feed">
                                        ${enrichedRows.map((row) => {
                                            const profile = profileMap.get(String(row.actor_id)) || {};
                                            const isCurrentActor = String(row?.actor_id || '').trim() === String(currentUser?.id || '').trim();
                                            const actorName = isCurrentActor
                                                ? 'YOU'
                                                : escapeHtml(profile.full_name || profile.username || 'User');
                                            const ratingText = row?.rating ? `Rated ${Number(row.rating).toFixed(1)}/5` : '';
                                            const noteText = escapeHtml(String(row?.review_text || '').trim());
                                            const listText = String(row?.__activityListTitle || '').trim();
                                            const listMetaText = listText ? `List: ${escapeHtml(listText)}` : '';
                                            const item = row?.__activityItem || null;
                                            const itemImage = escapeHtml(String(item?.image || '').trim());
                                            const itemFallback = iconGlyph(String(row?.media_type || '').toLowerCase());
                                            const primaryMeta = ratingText || listMetaText;
                                            return `
                                                <article class="mobile-activity-item">
                                                    <div class="mobile-activity-header">
                                                        <div class="mobile-activity-actor">
                                                            <span class="mobile-activity-avatar">${profile.avatar_icon || iconGlyph('user')}</span>
                                                            <span>${actorName}</span>
                                                        </div>
                                                        <span class="mobile-activity-time">${this.formatActivityTime(row.created_at)}</span>
                                                    </div>
                                                    <div class="mobile-activity-body">
                                                        <div class="mobile-activity-thumb">
                                                            ${itemImage
                                                                ? `<img src="${itemImage}" alt="Item artwork" loading="lazy" onerror="this.onerror=null;this.closest('.mobile-activity-thumb').innerHTML='${itemFallback}';">`
                                                                : itemFallback}
                                                        </div>
                                                        <div class="mobile-activity-main">
                                                            <div class="mobile-activity-text">${this.renderActivityAction(row)}</div>
                                                            ${primaryMeta ? `<div class="mobile-activity-meta">${primaryMeta}</div>` : ''}
                                                            ${ratingText && listMetaText ? `<div class="mobile-activity-meta">${listMetaText}</div>` : ''}
                                                            ${noteText ? `<div class="mobile-activity-meta">${noteText}</div>` : ''}
                                                        </div>
                                                    </div>
                                                </article>
                                            `;
                                        }).join('')}
                                    </div>
                                `;
                            } else {
                                list.innerHTML = `
                                    <div class="activity-feed">
                                        ${enrichedRows.map((row) => {
                                            const profile = profileMap.get(String(row.actor_id)) || {};
                                            const isCurrentActor = String(row?.actor_id || '').trim() === String(currentUser?.id || '').trim();
                                            const actorName = isCurrentActor
                                                ? 'YOU'
                                                : escapeHtml(profile.full_name || profile.username || 'User');
                                            const ratingText = row?.rating ? `Rated ${Number(row.rating).toFixed(1)}/5` : '';
                                            const noteText = escapeHtml(String(row?.review_text || '').trim());
                                            const listText = String(row?.__activityListTitle || '').trim();
                                            const listMetaText = listText ? `List: ${escapeHtml(listText)}` : '';
                                            const item = row?.__activityItem || null;
                                            const itemImage = escapeHtml(String(item?.image || '').trim());
                                            const itemFallback = iconGlyph(String(row?.media_type || '').toLowerCase());
                                            const primaryMeta = ratingText || listMetaText;
                                            return `
                                                <article class="activity-item">
                                                    <div class="activity-item-header">
                                                        <div class="activity-item-actor">
                                                            <span class="activity-item-avatar">${profile.avatar_icon || iconGlyph('user')}</span>
                                                            <span>${actorName}</span>
                                                        </div>
                                                        <span class="activity-item-time">${this.formatActivityTime(row.created_at)}</span>
                                                    </div>
                                                    <div class="activity-item-body">
                                                        <div class="activity-item-thumb">
                                                            ${itemImage
                                                                ? `<img src="${itemImage}" alt="Item artwork" loading="lazy" onerror="this.onerror=null;this.closest('.activity-item-thumb').innerHTML='${itemFallback}';">`
                                                                : itemFallback}
                                                        </div>
                                                        <div class="activity-item-main">
                                                            <div class="activity-item-text">${this.renderActivityAction(row)}</div>
                                                            ${primaryMeta ? `<div class="activity-item-meta">${primaryMeta}</div>` : ''}
                                                            ${ratingText && listMetaText ? `<div class="activity-item-meta">${listMetaText}</div>` : ''}
                                                            ${noteText ? `<div class="activity-item-meta">${noteText}</div>` : ''}
                                                        </div>
                                                    </div>
                                                </article>
                                            `;
                                        }).join('')}
                                    </div>
                                `;
                            }
                        } catch (error) {
                            console.error('Error loading activity feed:', error);
                            const isMobile = window.innerWidth <= 768;
                            const list = isMobile ? document.getElementById('mobileActivityList') : document.getElementById('activityList');
                            if (list) {
                                list.innerHTML = isMobile
                                    ? `
                                        <div class="mobile-empty-state">
                                            <div class="mobile-empty-icon">${iconGlyph('list')}</div>
                                            <div class="mobile-empty-title">Activity unavailable</div>
                                            <div class="mobile-empty-description">Run the activity feed SQL migration and try again.</div>
                                        </div>
                                    `
                                    : `
                                        <div class="empty-state">
                                            <div class="empty-icon">${iconGlyph('list')}</div>
                                            <h3 class="empty-title">Activity unavailable</h3>
                                            <p class="empty-description">Run the activity feed SQL migration and try again.</p>
                                        </div>
                                    `;
                            }
                        }
                    },

                    async searchUsers() {
                        const userSearch = document.getElementById('userSearch');
                        if (!userSearch) return;
                        
                        const searchTerm = userSearch.value.trim();
                        
                        if (!searchTerm || searchTerm.length < 2) {
                            const searchResults = document.getElementById('searchResults');
                            if (searchResults) {
                                searchResults.innerHTML = `
                                    <div class="empty-state">
                                        <div class="empty-icon">${iconGlyph('list')}</div>
                                        <h3 class="empty-title">Search for users</h3>
                                        <p class="empty-description">Enter at least 2 characters to search</p>
                                    </div>
                                `;
                            }
                            return;
                        }

                        try {
                            this.loadedUsersCache.clear();
                            
                            const { data: users, error } = await supabase
                                .from('user_profiles')
                                .select('*')
                                .or(`username.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`)
                                .neq('id', currentUser.id)
                                .limit(20);

                            if (error) throw error;

                            this.displayUsers(users, 'searchResults');
                            
                        } catch (error) {
                            console.error('Error searching users:', error);
                            const searchResults = document.getElementById('searchResults');
                            if (searchResults) {
                                searchResults.innerHTML = `
                                    <div class="empty-state">
                                        <div class="empty-icon">${iconGlyph('list')}</div>
                                        <h3 class="empty-title">Search Error</h3>
                                        <p class="empty-description">Unable to search users at this time</p>
                                    </div>
                                `;
                            }
                        }
                    },

                    async displayUsers(users, containerId) {
                        const container = document.getElementById(containerId);
                        if (!container) return;
                        
                        if (!users || users.length === 0) {
                            container.innerHTML = `
                                <div class="empty-state">
                                    <div class="empty-icon">${iconGlyph('list')}</div>
                                    <h3 class="empty-title">No users found</h3>
                                    <p class="empty-description">Try searching with a different name or username</p>
                                </div>
                            `;
                            return;
                        }

                        container.innerHTML = '';
                        
                        const uniqueUsers = users.filter(user => {
                            if (this.loadedUsersCache.has(user.id)) {
                                return false;
                            }
                            this.loadedUsersCache.add(user.id);
                            return true;
                        });

                        for (const user of uniqueUsers) {
                            const isPrivate = user.is_private === true;
                            const isCurrentUser = user.id === currentUser.id;
                            
                            let isFollowing = false;
                            if (!isCurrentUser) {
                                isFollowing = await checkIfFollowing(user.id);
                            }
                            
                            const isMobile = window.innerWidth <= 768 || containerId.includes('mobile');
                            
                            if (isMobile) {
                                const userCard = document.createElement('div');
                                userCard.className = 'mobile-community-card';
                                
                                userCard.innerHTML = `
                                    <div class="mobile-community-header" onclick="ProfileManager.viewUserProfile('${user.id}')" style="cursor: pointer;">
                                        <div class="mobile-community-avatar">${user.avatar_icon || iconGlyph('user')}</div>
                                        <div class="mobile-community-info">
                                            <div class="mobile-community-name">${user.full_name || user.username || 'Unknown User'}</div>
                                            <div class="mobile-community-username">@${user.username || 'user'}</div>
                                        </div>
                                    </div>
                                    <div class="mobile-community-stats">
                                        <div class="mobile-community-stat">
                                            <span class="mobile-community-stat-number">${user.visited_count || 0}</span>
                                            <span class="mobile-community-stat-label">Visited</span>
                                        </div>
                                        <div class="mobile-community-stat">
                                            <span class="mobile-community-stat-number">${user.favorites_count || 0}</span>
                                            <span class="mobile-community-stat-label">Favorites</span>
                                        </div>
                                        <div class="mobile-community-stat">
                                            <span class="mobile-community-stat-number">${user.followers_count || 0}</span>
                                            <span class="mobile-community-stat-label">Followers</span>
                                        </div>
                                    </div>
                                    <div class="mobile-community-actions">
                                        ${!isCurrentUser ? `
                                            <button class="mobile-action-btn secondary" style="flex: 1; padding: 8px 12px; font-size: 14px;" onclick="event.stopPropagation(); ProfileManager.viewUserProfile('${user.id}')">
                                                <i class="fas fa-eye"></i> View
                                            </button>
                                            <button class="mobile-action-btn ${isFollowing ? '' : 'primary'}" style="flex: 1; padding: 8px 12px; font-size: 14px; ${isFollowing ? 'background: var(--error); color: white;' : ''}" onclick="event.stopPropagation(); ProfileManager.toggleFollow('${user.id}', this)">
                                                ${isFollowing ? '<i class="fas fa-user-minus"></i> Unfollow' : '<i class="fas fa-user-plus"></i> Follow'}
                                            </button>
                                        ` : `
                                            <button class="mobile-action-btn secondary" style="width: 100%;" disabled>
                                                <i class="fas fa-user"></i> This is you
                                            </button>
                                        `}
                                    </div>
                                `;
                                
                                container.appendChild(userCard);
                            } else {
                                const userCard = document.createElement('div');
                                userCard.className = 'community-card';
                                userCard.innerHTML = `
                                    <div class="community-header" onclick="ProfileManager.viewUserProfile('${user.id}')" style="cursor: pointer;">
                                        <div class="community-avatar">${user.avatar_icon || iconGlyph('user')}</div>
                                        <div class="community-info">
                                            <div class="community-name">${user.full_name || user.username || 'Unknown User'}</div>
                                            <div class="community-username">@${user.username || 'user'}</div>
                                        </div>
                                    </div>
                                    <div class="community-stats">
                                        <div class="community-stat">
                                            <span class="community-stat-number">${user.visited_count || 0}</span>
                                            <span class="community-stat-label">Visited</span>
                                        </div>
                                        <div class="community-stat">
                                            <span class="community-stat-number">${user.lists_count || 0}</span>
                                            <span class="community-stat-label">Lists</span>
                                        </div>
                                        <div class="community-stat">
                                            <span class="community-stat-number">${user.followers_count || 0}</span>
                                            <span class="community-stat-label">Followers</span>
                                        </div>
                                    </div>
                                    <div class="community-actions">
                                        ${!isCurrentUser ? `
                                            <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); ProfileManager.viewUserProfile('${user.id}')">
                                                <i class="fas fa-eye"></i> View Profile
                                            </button>
                                            <button class="btn ${isFollowing ? 'btn-error' : 'btn-primary'} btn-sm" onclick="event.stopPropagation(); ProfileManager.toggleFollow('${user.id}', this)">
                                                ${isFollowing ? '<i class="fas fa-user-minus"></i> Unfollow' : '<i class="fas fa-user-plus"></i> Follow'}
                                            </button>
                                        ` : `
                                            <button class="btn btn-secondary btn-sm" disabled>
                                                <i class="fas fa-user"></i> This is you
                                            </button>
                                        `}
                                    </div>
                                `;
                                
                                container.appendChild(userCard);
                            }
                        }
                    },

                    refreshCurrentView() {
                        const userSearch = document.getElementById('userSearch');
                        if (userSearch && userSearch.value) {
                            this.searchUsers();
                        } else {
                            if (this.currentSection === 'followers') {
                                this.loadFollowers();
                            } else if (this.currentSection === 'activity') {
                                this.loadActivity();
                            } else {
                                this.loadFollowing();
                            }
                        }
                    }
                };
            }

            // ===== KEBAB MENU FUNCTIONS =====
            function toggleListMenu(listId) {
                const dropdown = document.getElementById(`kebab-${listId}`);
                if (!dropdown) return;
                
                document.querySelectorAll('.kebab-dropdown').forEach(d => {
                    if (d.id !== `kebab-${listId}`) {
                        d.classList.remove('show');
                    }
                });
                
                dropdown.classList.toggle('show');
            }

            function confirmDeleteList(listId) {
                showConfirmModal(
                    'Delete List',
                    'Are you sure you want to delete this list? This action cannot be undone.',
                    async () => {
                        await deleteList(listId);
                    }
                );
            }

            async function deleteList(listId) {
                try {
                    await supabase.from('lists_restraunts').delete().eq('list_id', listId);
                    
                    const { error } = await supabase
                        .from('lists')
                        .delete()
                        .eq('id', listId);

                    if (error) throw error;
                    
                    customLists = customLists.filter(l => l.id !== listId);
                    listManager.userLists = listManager.userLists.filter(l => l.id !== listId);
                    
                    listManager.renderLists();
                    
                    showToast('List deleted successfully', 'success');
                    
                    if (currentActiveList && currentActiveList.id === listId) {
                        hideListDetail();
                    }
                    
                } catch (error) {
                    console.error('Error deleting list:', error);
                    showToast('Could not delete list', 'error');
                }
            }

            function prepareEditList(listId) {
                const list = customLists.find(l => l.id === listId) || 
                        listManager.userLists.find(l => l.id === listId);
                
                if (!list) return;
                
                isEditingList = true;
                editingListId = listId;
                
                document.getElementById('listName').value = list.title;
                document.getElementById('listDescription').value = list.description || '';
                document.getElementById('selectedIcon').value = getDefaultListIconForContext('restaurant');
                
                document.querySelectorAll('.list-icon-option').forEach(icon => {
                    const isSelected = icon.getAttribute('data-icon') === getDefaultListIconForContext('restaurant');
                    icon.classList.toggle('selected', isSelected);
                });
                
                document.querySelector('#createListModal .modal-title').textContent = "Edit List";
                
                showModal('createListModal');
            }

            // ===== UTILITY FUNCTIONS =====
            function normalizeIconKey(icon, fallback = 'list') {
                const raw = String(icon || '').trim().toLowerCase();
                if (!raw) return fallback;
                if (raw.includes('fa-heart')) return 'heart';
                if (raw.includes('fa-check') || raw.includes('fa-eye')) return 'check';
                if (raw.includes('fa-bookmark')) return 'bookmark';
                if (raw.includes('fa-clapperboard')) return 'restaurant';
                if (raw.includes('fa-utensils')) return 'restaurant';
                if (raw.includes('fa-film')) return 'movie';
                if (raw.includes('fa-book')) return 'book';
                if (raw.includes('fa-user')) return 'user';
                if (raw === '?') return 'check';
                if (raw === '??') return 'list';
                if (raw === '???') return 'restaurant';
                if (raw.includes('fa-tv')) return 'tv';
                if (raw.includes('fa-dragon')) return 'anime';
                if (raw.includes('fa-gamepad')) return 'game';
                if (raw.includes('fa-earth-americas') || raw.includes('fa-globe')) return 'travel';
                if (raw.includes('fa-shirt')) return 'fashion';
                if (raw.includes('fa-burger')) return 'food';
                if (raw === 'heart' || raw === 'check' || raw === 'bookmark' || raw === 'restaurant' || raw === 'movie' || raw === 'book' || raw === 'tv' || raw === 'anime' || raw === 'game' || raw === 'list' || raw === 'user' || raw === 'star' || raw === 'fire' || raw === 'sparkles' || raw === 'rocket' || raw === 'trophy' || raw === 'gift' || raw === 'music' || raw === 'travel' || raw === 'fashion' || raw === 'food' || raw === 'camera' || raw === 'soccer') return raw;
                return raw;
            }

            function iconClass(icon, fallback = 'list') {
                const key = normalizeIconKey(icon, fallback);
                const map = {
                    heart: 'fas fa-heart',
                    check: 'fas fa-check',
                    bookmark: 'fas fa-bookmark',
                    restaurant: 'fas fa-clapperboard',
                    movie: 'fas fa-film',
                    tv: 'fas fa-tv',
                    anime: 'fas fa-dragon',
                    game: 'fas fa-gamepad',
                    book: 'fas fa-book',
                    list: 'fas fa-list',
                    user: 'fas fa-user',
                    star: 'fas fa-star',
                    fire: 'fas fa-fire',
                    sparkles: 'fas fa-sparkles',
                    rocket: 'fas fa-rocket',
                    trophy: 'fas fa-trophy',
                    gift: 'fas fa-gift',
                    music: 'fas fa-music',
                    travel: 'fas fa-earth-americas',
                    fashion: 'fas fa-shirt',
                    food: 'fas fa-burger',
                    car: 'fas fa-car',
                    camera: 'fas fa-camera',
                    soccer: 'fas fa-futbol'
                };
                return map[key] || map[fallback] || map.list;
            }

            function iconGlyph(icon, fallback = 'list') {
                return `<span class="zo2y-orange-illustration" aria-hidden="true"><i class="${iconClass(icon, fallback)}"></i></span>`;
            }

            function iconGlyphText(icon, fallback = 'user') {
                const key = normalizeIconKey(icon, fallback);
                const map = {
                    user: 'U',
                    list: 'L',
                    heart: 'H',
                    check: 'C',
                    bookmark: 'B',
                    restaurant: 'R',
                    movie: 'M',
                    tv: 'T',
                    anime: 'A',
                    game: 'G',
                    book: 'B',
                    music: 'M',
                    travel: 'T',
                    fashion: 'F',
                    food: 'F',
                    car: 'C'
                };
                return map[key] || map[fallback] || 'U';
            }

            function getUserIdFromUrl() {
                const urlParams = new URLSearchParams(window.location.search);
                const id = urlParams.get('id');
                return id ? id.trim() : null;
            }

            function goToMyProfile() {
                window.location.href = 'profile.html';
            }

            function viewUserProfile(userId) {
                window.location.href = `profile.html?id=${userId}`;
            }

            function loadCollectionViewModes() {
                try {
                    const raw = localStorage.getItem(COLLECTION_VIEW_STORAGE_KEY);
                    const parsed = raw ? JSON.parse(raw) : {};
                    const base = {
                        ...(ENABLE_RESTAURANTS ? { restaurant: 'grid' } : {}),
                        movie: 'grid',
                        tv: 'grid',
                        anime: 'grid',
                        game: 'grid',
                        book: 'grid',
                        music: 'grid',
                        travel: 'grid',
                        fashion: 'grid',
                        food: 'grid',
                        car: 'grid'
                    };
                    Object.keys(base).forEach((key) => {
                        const mode = parsed?.[key];
                        if (mode === 'grid' || mode === 'list') base[key] = mode;
                    });
                    return base;
                } catch (_error) {
                    return {
                        ...(ENABLE_RESTAURANTS ? { restaurant: 'grid' } : {}),
                        movie: 'grid',
                        tv: 'grid',
                        anime: 'grid',
                        game: 'grid',
                        book: 'grid',
                        music: 'grid',
                        travel: 'grid',
                        fashion: 'grid',
                        food: 'grid'
                    };
                }
            }

            async function checkMutualFollow(userAId, userBId) {
                const a = String(userAId || '').trim();
                const b = String(userBId || '').trim();
                if (!a || !b || a === b || !supabase) return false;
                try {
                    const [{ data: ab, error: abError }, { data: ba, error: baError }] = await Promise.all([
                        supabase
                            .from('follows')
                            .select('follower_id')
                            .eq('follower_id', a)
                            .eq('followed_id', b)
                            .maybeSingle(),
                        supabase
                            .from('follows')
                            .select('follower_id')
                            .eq('follower_id', b)
                            .eq('followed_id', a)
                            .maybeSingle()
                    ]);
                    if (abError || baError) return false;
                    return !!ab && !!ba;
                } catch (_error) {
                    return false;
                }
            }

            function persistCollectionViewModes() {
                try {
                    localStorage.setItem(COLLECTION_VIEW_STORAGE_KEY, JSON.stringify(collectionViewModes));
                } catch (_error) {}
            }

            function normalizeCollectionViewMode(mode) {
                return mode === 'list' ? 'list' : 'grid';
            }

            function getCollectionViewMode(mediaType) {
                const key = String(mediaType || '').toLowerCase();
                return normalizeCollectionViewMode(collectionViewModes[key]);
            }

            function getTabForCollectionType(contentType) {
                return COLLECTION_TO_TAB[String(contentType || '').toLowerCase()] || DEFAULT_PROFILE_TAB;
            }

            function getCollectionItemLabel(contentType, count) {
                const type = String(contentType || '').toLowerCase();
                const singular = (
                    type === 'restaurant' ? 'restaurant' :
                    type === 'movie' ? 'movie' :
                    type === 'tv' ? 'TV show' :
                    type === 'anime' ? 'anime' :
                    type === 'game' ? 'game' :
                    type === 'book' ? 'book' :
                    type === 'travel' ? 'country' :
                    type === 'fashion' ? 'brand' :
                    type === 'food' ? 'brand' :
                    type === 'car' ? 'brand' :
                    'track'
                );
                if (count === 1) return `${count} ${singular}`;
                if (type === 'travel') return `${count} countries`;
                if (type === 'fashion' || type === 'food' || type === 'car') return `${count} brands`;
                if (type === 'tv') return `${count} TV shows`;
                return `${count} ${singular}s`;
            }

            function getCollaborativeAccessKey(contentType, listId) {
                const safeType = String(contentType || '').trim().toLowerCase();
                const safeListId = String(listId || '').trim();
                if (!safeType || !safeListId) return '';
                return `${safeType}:${safeListId}`;
            }

            function resetCollaborativeListAccess() {
                collaborativeListAccess = new Map();
            }

            function setCollaborativeAccess(contentType, listId, access = {}) {
                const key = getCollaborativeAccessKey(contentType, listId);
                if (!key) return;
                const ownerUserId = String(access.ownerUserId || '').trim();
                const isOwner = !!access.isOwner;
                const canEdit = !!access.canEdit;
                const isCollaborative = !!access.isCollaborative || (!isOwner && !!access.canEdit);
                collaborativeListAccess.set(key, {
                    ownerUserId,
                    isOwner,
                    canEdit,
                    isCollaborative
                });
            }

            function getCollaborativeAccess(contentType, listId, list = null) {
                const key = getCollaborativeAccessKey(contentType, listId);
                if (key && collaborativeListAccess.has(key)) {
                    return collaborativeListAccess.get(key);
                }
                if (!list || typeof list !== 'object') {
                    return {
                        ownerUserId: '',
                        isOwner: false,
                        canEdit: false,
                        isCollaborative: false
                    };
                }
                const currentUserId = String(currentUser?.id || '').trim();
                const ownerUserId = String(list?.user_id || currentUserId).trim();
                const isOwner = !!ownerUserId && ownerUserId === currentUserId;
                return {
                    ownerUserId,
                    isOwner,
                    canEdit: isOwner,
                    isCollaborative: false
                };
            }

            function canEditCustomCollection(contentType, listId, list = null) {
                if (!isViewingOwnProfile) return false;
                const access = getCollaborativeAccess(contentType, listId, list);
                return !!access.canEdit;
            }

            function canDeleteCustomCollection(contentType, listId, list = null) {
                if (!isViewingOwnProfile) return false;
                const access = getCollaborativeAccess(contentType, listId, list);
                return !!access.isOwner;
            }

            function canEditCollectionItems(contentType, listId, listType = 'custom', list = null) {
                if (!isViewingOwnProfile) return false;
                if (String(listType || '').toLowerCase() === 'default') return true;
                return canEditCustomCollection(contentType, listId, list);
            }

            function setCollaborativeAccessForLists(contentType, lists = [], collaboratorMap = new Map()) {
                const currentUserId = String(currentUser?.id || '').trim();
                (Array.isArray(lists) ? lists : []).forEach((list) => {
                    const safeListId = String(list?.id || '').trim();
                    if (!safeListId) return;
                    const ownerUserId = String(list?.user_id || currentUserId).trim();
                    const collaboratorMeta = collaboratorMap.get(safeListId) || null;
                    const isOwner = !!ownerUserId && ownerUserId === currentUserId;
                    const canEdit = isOwner || !!collaboratorMeta?.can_edit;
                    setCollaborativeAccess(contentType, safeListId, {
                        ownerUserId: ownerUserId || String(collaboratorMeta?.list_owner_id || '').trim(),
                        isOwner,
                        canEdit,
                        isCollaborative: !!collaboratorMeta
                    });
                });
            }

            async function loadCollaborativeCustomLists(contentType, ownerUserId) {
                const table = CUSTOM_LIST_TABLES[contentType];
                if (!table) return [];
                const safeOwnerId = String(ownerUserId || '').trim();
                if (!safeOwnerId) return [];

                const { data: ownedLists, error: ownedError } = await supabase
                    .from(table)
                    .select('*')
                    .eq('user_id', safeOwnerId)
                    .order('created_at', { ascending: false });
                if (ownedError) throw ownedError;

                const merged = [];
                const byId = new Map();
                (ownedLists || []).forEach((list) => {
                    const safeId = String(list?.id || '').trim();
                    if (!safeId || byId.has(safeId)) return;
                    const row = { ...list, type: 'custom', __isCollaborative: false };
                    byId.set(safeId, row);
                    merged.push(row);
                });

                const isSelfView = isViewingOwnProfile && safeOwnerId === String(currentUser?.id || '').trim();
                const collaboratorMap = new Map();

                if (isSelfView) {
                    const { data: collaboratorRows, error: collaboratorError } = await supabase
                        .from(LIST_COLLAB_TABLE)
                        .select('media_type, list_id, list_owner_id, can_edit')
                        .eq('media_type', contentType)
                        .eq('collaborator_id', safeOwnerId);

                    if (collaboratorError) {
                        if (String(collaboratorError?.code || '').trim() !== '42P01') {
                            console.error('Error loading collaborative lists:', collaboratorError);
                        } else if (!hasWarnedMissingCollaborativeTable) {
                            hasWarnedMissingCollaborativeTable = true;
                            showToast('Collaborative lists require the new SQL migration.', 'warning');
                        }
                    } else {
                        (collaboratorRows || []).forEach((row) => {
                            const safeListId = String(row?.list_id || '').trim();
                            if (!safeListId) return;
                            collaboratorMap.set(safeListId, row);
                        });

                        const sharedIds = [...collaboratorMap.keys()].filter((id) => !byId.has(id));
                        if (sharedIds.length) {
                            const { data: sharedLists, error: sharedError } = await supabase
                                .from(table)
                                .select('*')
                                .in('id', sharedIds);

                            if (sharedError) {
                                console.error('Error loading shared lists:', sharedError);
                            } else {
                                (sharedLists || []).forEach((list) => {
                                    const safeId = String(list?.id || '').trim();
                                    if (!safeId || byId.has(safeId)) return;
                                    const row = {
                                        ...list,
                                        type: 'custom',
                                        __isCollaborative: true
                                    };
                                    byId.set(safeId, row);
                                    merged.push(row);
                                });
                            }
                        }
                    }
                }

                setCollaborativeAccessForLists(contentType, merged, collaboratorMap);
                return merged;
            }

            async function fetchCustomListAccessRecord(contentType, listId) {
                const table = CUSTOM_LIST_TABLES[String(contentType || '').toLowerCase()];
                const safeListId = String(listId || '').trim();
                if (!table || !safeListId) return null;
                const { data, error } = await supabase
                    .from(table)
                    .select('id, user_id')
                    .eq('id', safeListId)
                    .maybeSingle();
                if (error || !data) return null;
                const ownerUserId = String(data.user_id || '').trim();
                const currentUserId = String(currentUser?.id || '').trim();
                let isCollaborative = false;
                let canEdit = ownerUserId === currentUserId;
                if (!canEdit && isViewingOwnProfile) {
                    const { data: collabRow, error: collabError } = await supabase
                        .from(LIST_COLLAB_TABLE)
                        .select('can_edit')
                        .eq('media_type', String(contentType || '').toLowerCase())
                        .eq('list_id', safeListId)
                        .eq('collaborator_id', currentUserId)
                        .maybeSingle();
                    if (!collabError && collabRow) {
                        isCollaborative = true;
                        canEdit = !!collabRow.can_edit;
                    }
                }
                setCollaborativeAccess(contentType, safeListId, {
                    ownerUserId,
                    isOwner: ownerUserId === currentUserId,
                    canEdit,
                    isCollaborative
                });
                return data;
            }

            async function fetchCustomListById(contentType, listId) {
                const safeType = String(contentType || '').trim().toLowerCase();
                const safeListId = String(listId || '').trim();
                if (!safeType || !safeListId) return null;

                if (safeType === 'fashion' || safeType === 'food' || safeType === 'car') {
                    const defaultMeta = safeType === 'fashion'
                        ? {
                            titles: { favorites: 'Favorites', owned: 'Owned', wishlist: 'Wishlist' },
                            icons: { favorites: 'heart', owned: 'check', wishlist: 'bookmark' },
                            descriptions: {
                                favorites: 'Brands you love',
                                owned: 'Brands you own',
                                wishlist: 'Brands you want to try'
                            },
                            fallbackTitle: 'Fashion',
                            fallbackIcon: 'fashion'
                        }
                        : safeType === 'food'
                            ? {
                                titles: { favorites: 'Favorites', tried: 'Tried', want_to_try: 'Want to Try' },
                                icons: { favorites: 'heart', tried: 'check', want_to_try: 'bookmark' },
                                descriptions: {
                                    favorites: 'Brands you love',
                                    tried: 'Places you tried',
                                    want_to_try: 'Places you want to try'
                                },
                                fallbackTitle: 'Food',
                                fallbackIcon: 'food'
                            }
                            : {
                                titles: { favorites: 'Favorites', owned: 'Owned', wishlist: 'Wishlist' },
                                icons: { favorites: 'heart', owned: 'check', wishlist: 'bookmark' },
                                descriptions: {
                                    favorites: 'Brands you love',
                                    owned: 'Brands you own',
                                    wishlist: 'Brands you want to try'
                                },
                                fallbackTitle: 'Cars',
                                fallbackIcon: 'car'
                            };
                    if (Object.prototype.hasOwnProperty.call(defaultMeta.titles, safeListId)) {
                        return {
                            id: safeListId,
                            title: defaultMeta.titles[safeListId] || defaultMeta.fallbackTitle,
                            icon: defaultMeta.icons[safeListId] || defaultMeta.fallbackIcon,
                            description: defaultMeta.descriptions[safeListId] || '',
                            type: 'default'
                        };
                    }
                }

                const table = CUSTOM_LIST_TABLES[safeType];
                if (!table || !supabase) return null;
                const { data, error } = await supabase
                    .from(table)
                    .select('*')
                    .eq('id', safeListId)
                    .maybeSingle();
                if (error || !data) return null;
                return { ...data, type: 'custom' };
            }

            async function ensureCollaborativeAccessForList(contentType, list = null) {
                const safeType = String(contentType || '').trim().toLowerCase();
                const safeListId = String(list?.id || '').trim();
                if (!safeType || !safeListId || !isViewingOwnProfile) {
                    return getCollaborativeAccess(safeType, safeListId, list);
                }

                const ownerUserId = String(list?.user_id || '').trim();
                const currentUserId = String(currentUser?.id || '').trim();
                if (ownerUserId && ownerUserId === currentUserId) {
                    const ownerAccess = {
                        ownerUserId,
                        isOwner: true,
                        canEdit: true,
                        isCollaborative: false
                    };
                    setCollaborativeAccess(safeType, safeListId, ownerAccess);
                    return ownerAccess;
                }

                const cached = getCollaborativeAccess(safeType, safeListId, null);
                if (cached?.ownerUserId || cached?.canEdit) return cached;

                try {
                    const { data, error } = await supabase
                        .from(LIST_COLLAB_TABLE)
                        .select('can_edit, list_owner_id')
                        .eq('media_type', safeType)
                        .eq('list_id', safeListId)
                        .eq('collaborator_id', currentUserId)
                        .maybeSingle();
                    if (error) throw error;

                    const access = {
                        ownerUserId: String(ownerUserId || data?.list_owner_id || '').trim(),
                        isOwner: false,
                        canEdit: !!data?.can_edit,
                        isCollaborative: true
                    };
                    setCollaborativeAccess(safeType, safeListId, access);
                    return access;
                } catch (_error) {
                    return {
                        ownerUserId: ownerUserId || '',
                        isOwner: false,
                        canEdit: false,
                        isCollaborative: true
                    };
                }
            }

            async function hydrateListMetaByOwner(contentType, lists = [], fallbackOwnerUserId = null) {
                if (!window.ListUtils || typeof ListUtils.hydrateListMetaForLists !== 'function') {
                    return Array.isArray(lists) ? lists : [];
                }
                const source = Array.isArray(lists) ? lists : [];
                if (!source.length) return [];

                const groups = new Map();
                source.forEach((list) => {
                    const ownerUserId = String(list?.user_id || fallbackOwnerUserId || currentUser?.id || '').trim();
                    const key = ownerUserId || '__unknown_owner__';
                    if (!groups.has(key)) groups.set(key, []);
                    groups.get(key).push(list);
                });

                const mergedById = new Map();
                for (const [ownerId, groupLists] of groups.entries()) {
                    const hydratedGroup = await ListUtils.hydrateListMetaForLists(contentType, groupLists, {
                        client: supabase,
                        userId: currentUser?.id,
                        ownerUserId: ownerId === '__unknown_owner__' ? null : ownerId
                    });
                    (hydratedGroup || []).forEach((item) => {
                        const safeId = String(item?.id || '').trim();
                        if (!safeId) return;
                        mergedById.set(safeId, item);
                    });
                }

                return source.map((list) => {
                    const safeId = String(list?.id || '').trim();
                    return mergedById.get(safeId) || list;
                });
            }

            async function loadMediaListItems(contentType, ownerUserId, customListIds = []) {
                const table = MEDIA_ITEM_TABLES[contentType];
                const itemField = MEDIA_ITEM_FIELDS[contentType];
                if (!table || !itemField) return [];

                const safeOwnerId = String(ownerUserId || '').trim();
                const safeCustomIds = [...new Set((Array.isArray(customListIds) ? customListIds : [])
                    .map((id) => String(id || '').trim())
                    .filter(Boolean))];

                const normalizeRows = (rows = []) => (Array.isArray(rows) ? rows : []).map((row) => {
                    const normalized = { ...(row || {}) };
                    if (
                        (normalized?.[itemField] === null || normalized?.[itemField] === undefined || normalized?.[itemField] === '') &&
                        normalized?.item_id !== null &&
                        normalized?.item_id !== undefined &&
                        normalized?.item_id !== ''
                    ) {
                        normalized[itemField] = normalized.item_id;
                    }
                    return normalized;
                });

                const dedupeRows = (rows = []) => {
                    const out = [];
                    const seen = new Set();
                    (Array.isArray(rows) ? rows : []).forEach((row) => {
                        const value = String(row?.[itemField] || row?.item_id || '').trim();
                        const listType = String(row?.list_type || '').trim();
                        const listId = String(row?.list_id || '').trim();
                        const key = `${value}::${listType}::${listId}`;
                        if (!value || seen.has(key)) return;
                        seen.add(key);
                        out.push(row);
                    });
                    return out;
                };

                const queryDefaultRows = async () => {
                    let result = await supabase
                        .from(table)
                        .select(`${itemField}, list_type, list_id`)
                        .eq('user_id', safeOwnerId);

                    if (result?.error && isColumnMissingError(result.error, 'list_id')) {
                        result = await supabase
                            .from(table)
                            .select(`${itemField}, list_type`)
                            .eq('user_id', safeOwnerId);
                    }
                    if (result?.error && isColumnMissingError(result.error, itemField)) {
                        result = await supabase
                            .from(table)
                            .select('item_id, list_type, list_id')
                            .eq('user_id', safeOwnerId);
                        if (result?.error && isColumnMissingError(result.error, 'list_id')) {
                            result = await supabase
                                .from(table)
                                .select('item_id, list_type')
                                .eq('user_id', safeOwnerId);
                        }
                    }
                    return result;
                };

                const queryCustomRows = async () => {
                    if (!safeCustomIds.length) return { data: [] };
                    let result = await supabase
                        .from(table)
                        .select(`${itemField}, list_type, list_id`)
                        .in('list_id', safeCustomIds);

                    if (result?.error && isColumnMissingError(result.error, itemField)) {
                        result = await supabase
                            .from(table)
                            .select('item_id, list_type, list_id')
                            .in('list_id', safeCustomIds);
                    }
                    if (result?.error && isColumnMissingError(result.error, 'list_id')) {
                        result = await supabase
                            .from(table)
                            .select(`${itemField}, list_type`)
                            .eq('user_id', safeOwnerId);
                        if (result?.error && isColumnMissingError(result.error, itemField)) {
                            result = await supabase
                                .from(table)
                                .select('item_id, list_type')
                                .eq('user_id', safeOwnerId);
                        }
                    }
                    return result;
                };

                const [defaultRes, customRes] = await Promise.all([
                    queryDefaultRows(),
                    queryCustomRows()
                ]);

                if (defaultRes?.error) throw defaultRes.error;
                if (customRes?.error) throw customRes.error;

                const merged = dedupeRows([
                    ...normalizeRows(defaultRes?.data || []),
                    ...normalizeRows(customRes?.data || [])
                ]);
                return merged;
            }

            async function fetchMediaCollectionItemIds(contentType, ownerUserId, listId, listType = 'custom') {
                const table = MEDIA_ITEM_TABLES[contentType];
                const itemField = MEDIA_ITEM_FIELDS[contentType];
                if (!table || !itemField) return [];

                const safeListType = String(listType || '').toLowerCase();
                const safeOwnerId = String(ownerUserId || '').trim();
                const safeListId = String(listId || '').trim();
                if (!safeListId) return [];

                const runQuery = async (selectField, filterField) => {
                    let query = supabase
                        .from(table)
                        .select(selectField)
                        .eq(filterField, safeListId);
                    if (safeListType === 'default') {
                        query = query.eq('user_id', safeOwnerId);
                    }
                    return await query;
                };

                const primaryFilterField = safeListType === 'default' ? 'list_type' : 'list_id';
                const fallbackFilterField = primaryFilterField === 'list_type' ? 'list_id' : 'list_type';

                let result = await runQuery(itemField, primaryFilterField);
                if (result?.error && isColumnMissingError(result.error, itemField)) {
                    result = await runQuery('item_id', primaryFilterField);
                }
                if (result?.error && isColumnMissingError(result.error, primaryFilterField)) {
                    result = await runQuery(itemField, fallbackFilterField);
                    if (result?.error && isColumnMissingError(result.error, itemField)) {
                        result = await runQuery('item_id', fallbackFilterField);
                    }
                }

                const data = result?.data || [];
                const error = result?.error || null;
                if (error) throw error;

                const unique = [];
                const seen = new Set();
                (data || []).forEach((row) => {
                    const value = String(row?.[itemField] || row?.item_id || '').trim();
                    if (!value || seen.has(value)) return;
                    seen.add(value);
                    unique.push(value);
                });
                return unique;
            }

            function buildProfileUrl({ tab = null, collection = null, listId = null, listType = null, view = null } = {}) {
                const currentParams = new URLSearchParams(window.location.search);
                const nextParams = new URLSearchParams();
                const profileId = currentParams.get('id');
                if (profileId) nextParams.set('id', profileId);
                if (tab) nextParams.set('tab', tab);
                if (collection && listId) {
                    nextParams.set('collection', collection);
                    nextParams.set('listId', String(listId));
                    if (listType) nextParams.set('listType', listType);
                    if (view) nextParams.set('view', normalizeCollectionViewMode(view));
                }
                const query = nextParams.toString();
                return `${window.location.pathname}${query ? `?${query}` : ''}`;
            }

            function isCollectionRouteActive() {
                const params = new URLSearchParams(window.location.search);
                return params.has('collection') && params.has('listId');
            }

            function getActiveProfileOwnerId() {
                return String((isViewingOwnProfile ? currentUser?.id : targetUserId) || '').trim();
            }

            function getTabRenderCacheKey(tabName) {
                const safeTab = normalizeProfileTab(tabName);
                const ownerId = getActiveProfileOwnerId() || 'unknown';
                const viewport = window.innerWidth <= 768 ? 'mobile' : 'desktop';
                return `${ownerId}:${viewport}:${safeTab}`;
            }

            function hasFreshTabRender(tabName) {
                const stamp = Number(tabRenderCache.get(getTabRenderCacheKey(tabName)) || 0);
                if (!stamp) return false;
                return (Date.now() - stamp) < TAB_RENDER_CACHE_TTL_MS;
            }

            function markTabRendered(tabName) {
                tabRenderCache.set(getTabRenderCacheKey(tabName), Date.now());
            }

            function resolveCollectionListType(contentType, list = null) {
                if (contentType === 'restaurant') {
                    return list?.is_default ? 'default' : 'custom';
                }
                const rawType = String(list?.type || '').trim().toLowerCase();
                if (rawType === 'default' || rawType === 'custom') return rawType;
                return 'custom';
            }

            function getPinnedCollectionKey(contentType, listId, listType = 'custom') {
                const safeType = String(contentType || '').trim().toLowerCase();
                const safeListId = String(listId || '').trim();
                const safeListType = String(listType || '').trim().toLowerCase() || 'custom';
                if (!safeType || !safeListId) return '';
                return `${safeType}:${safeListType}:${safeListId}`;
            }

            async function ensurePinnedCollectionsLoaded(ownerId) {
                const safeOwnerId = String(ownerId || '').trim();
                if (!safeOwnerId || pinnedListsOwnerId === safeOwnerId) return;
                pinnedListsMap = new Map();
                pinnedListsOwnerId = '';
                try {
                    const { data, error } = await supabase
                        .from(PROFILE_PIN_TABLE)
                        .select('media_type, list_id, list_type, sort_order')
                        .eq('user_id', safeOwnerId)
                        .order('sort_order', { ascending: true });
                    if (error) throw error;
                    (data || []).forEach((row) => {
                        const key = getPinnedCollectionKey(row.media_type, row.list_id, row.list_type);
                        if (!key) return;
                        pinnedListsMap.set(key, {
                            sort_order: Number(row.sort_order || 0)
                        });
                    });
                    pinnedListsOwnerId = safeOwnerId;
                } catch (error) {
                    const code = String(error?.code || '').trim();
                    if (code !== '42P01') {
                        console.error('Error loading pinned collections:', error);
                    }
                }
            }

            function applyPinnedListSorting(contentType, lists = []) {
                if (!Array.isArray(lists) || !lists.length) return [];
                const normalizedType = String(contentType || '').toLowerCase();
                return lists
                    .map((list, index) => {
                        const listType = resolveCollectionListType(normalizedType, list);
                        const key = getPinnedCollectionKey(normalizedType, list?.id, listType);
                        const pinMeta = key ? pinnedListsMap.get(key) : null;
                        return {
                            ...list,
                            __sourceIndex: index,
                            __pinOrder: Number(pinMeta?.sort_order ?? Number.MAX_SAFE_INTEGER),
                            __isPinned: !!pinMeta
                        };
                    })
                    .sort((a, b) => {
                        if (a.__isPinned !== b.__isPinned) return a.__isPinned ? -1 : 1;
                        if (a.__isPinned && b.__isPinned && a.__pinOrder !== b.__pinOrder) {
                            return a.__pinOrder - b.__pinOrder;
                        }
                        return a.__sourceIndex - b.__sourceIndex;
                    })
                    .map(({ __sourceIndex, __pinOrder, __isPinned, ...rest }) => rest);
            }

            async function rerenderCollectionTabForType(contentType) {
                if (contentType === 'restaurant') {
                    await renderRestaurants();
                    return;
                }
                if (contentType === 'movie') {
                    await renderMovies();
                    return;
                }
                if (contentType === 'tv') {
                    await renderTvShows();
                    return;
                }
                if (contentType === 'anime') {
                    await renderAnimeShows();
                    return;
                }
                if (contentType === 'game') {
                    await renderGames();
                    return;
                }
                if (contentType === 'book') {
                    await renderBooks();
                    return;
                }
                if (contentType === 'music') {
                    await renderMusic();
                    return;
                }
                if (contentType === 'travel') {
                    await renderTravel();
                    return;
                }
                if (contentType === 'fashion') {
                    await renderFashion();
                    return;
                }
                if (contentType === 'food') {
                    await renderFood();
                    return;
                }
                if (contentType === 'car') {
                    await renderCars();
                }
            }

            async function togglePinnedCollection(listId, contentType, listType = 'custom') {
                if (!isViewingOwnProfile) return;
                const safeListId = String(listId || '').trim();
                const safeType = String(contentType || '').trim().toLowerCase();
                const safeListType = String(listType || 'custom').trim().toLowerCase() || 'custom';
                if (!safeListId || !safeType) return;

                const key = getPinnedCollectionKey(safeType, safeListId, safeListType);
                const existing = pinnedListsMap.get(key);
                try {
                    if (existing) {
                        const { error } = await supabase
                            .from(PROFILE_PIN_TABLE)
                            .delete()
                            .eq('user_id', currentUser.id)
                            .eq('media_type', safeType)
                            .eq('list_id', safeListId)
                            .eq('list_type', safeListType);
                        if (error) throw error;
                        pinnedListsMap.delete(key);
                        showToast('Unpinned collection', 'info');
                    } else {
                        const maxOrder = Array.from(pinnedListsMap.values())
                            .map((entry) => Number(entry?.sort_order || 0))
                            .reduce((max, value) => (value > max ? value : max), 0);
                        const nextOrder = maxOrder + 1;
                        const payload = {
                            user_id: currentUser.id,
                            media_type: safeType,
                            list_id: safeListId,
                            list_type: safeListType,
                            sort_order: nextOrder
                        };
                        const { error: insertError } = await supabase
                            .from(PROFILE_PIN_TABLE)
                            .insert(payload);
                        if (insertError) {
                            const insertCode = String(insertError?.code || '').trim();
                            const insertMessage = String(insertError?.message || '').toLowerCase();
                            const isConflict =
                                insertCode === '23505' ||
                                insertMessage.includes('duplicate key') ||
                                insertMessage.includes('unique constraint');
                            if (!isConflict) {
                                throw insertError;
                            }
                            const { error: updateError } = await supabase
                                .from(PROFILE_PIN_TABLE)
                                .update({ sort_order: nextOrder })
                                .eq('user_id', currentUser.id)
                                .eq('media_type', safeType)
                                .eq('list_id', safeListId)
                                .eq('list_type', safeListType);
                            if (updateError) throw updateError;
                        }
                        pinnedListsMap.set(key, { sort_order: nextOrder });
                        showToast('Pinned collection to top', 'success');
                    }

                    tabRenderCache.delete(getTabRenderCacheKey(getTabForCollectionType(safeType)));
                    await rerenderCollectionTabForType(safeType);
                } catch (error) {
                    const code = String(error?.code || '').trim();
                    if (code === '42P01') {
                        showToast('Pinned lists table missing. Run the new SQL migration.', 'warning');
                        return;
                    }
                    console.error('Error toggling pinned collection:', error);
                    showToast('Could not update pin state', 'error');
                }
            }

            function bindRouteListeners() {
                if (hasBoundRouteListeners) return;
                hasBoundRouteListeners = true;
                window.addEventListener('popstate', () => {
                    hydrateInitialRoute().catch((error) => {
                        console.error('Route hydration failed:', error);
                    });
                });
            }

            function leaveCollectionRoute(tabName) {
                if (!isCollectionRouteActive()) return false;
                const nextUrl = buildProfileUrl({ tab: normalizeProfileTab(tabName) });
                history.replaceState({}, '', nextUrl);
                return false;
            }

            async function openCollectionPage(listId, contentType, listType = null) {
                const normalizedType = String(contentType || '').toLowerCase();
                if (!VALID_COLLECTION_TYPES.has(normalizedType)) return;
                const tabName = getTabForCollectionType(normalizedType);
                const resolvedListType = listType || (normalizedType === 'restaurant' ? 'custom' : 'default');
                const view = getCollectionViewMode(normalizedType);
                const url = buildProfileUrl({
                    tab: tabName,
                    collection: normalizedType,
                    listId: String(listId),
                    listType: resolvedListType,
                    view
                });
                if (window.location.pathname + window.location.search !== url) {
                    history.pushState({}, '', url);
                }
                if (currentTab !== tabName) {
                    showTab(tabName, { skipUrlSync: true, skipRender: true });
                }
                try {
                    await showCollectionDetail(String(listId), normalizedType, resolvedListType);
                } catch (error) {
                    console.error('Unable to open collection:', error);
                    showToast('Unable to open this collection', 'error');
                }
            }

            async function hydrateInitialRoute() {
                const params = new URLSearchParams(window.location.search);
                const requestedTab = normalizeProfileTab(params.get('tab'));
                const routeCollection = String(params.get('collection') || '').toLowerCase();
                const routeListId = params.get('listId');
                const routeListType = params.get('listType');
                const routeView = normalizeCollectionViewMode(params.get('view'));
                const hasCollectionRoute = !!(routeCollection && routeListId && VALID_COLLECTION_TYPES.has(routeCollection));
                const initialTab = hasCollectionRoute ? getTabForCollectionType(routeCollection) : requestedTab;

                if (initialTab !== currentTab) {
                    showTab(initialTab, { skipUrlSync: true, skipRender: hasCollectionRoute });
                } else if (!hasCollectionRoute) {
                    requestTabRender(initialTab, ++tabSwitchToken);
                }

                if (!hasCollectionRoute) {
                    return;
                }

                collectionViewModes[routeCollection] = routeView;
                persistCollectionViewModes();
                updateCollectionViewToggleButtons(routeCollection);

                const expectedTab = getTabForCollectionType(routeCollection);
                if (expectedTab !== currentTab) {
                    showTab(expectedTab, { skipUrlSync: true, skipRender: true });
                }

                try {
                    const fallbackListType = routeListType || (routeCollection === 'restaurant' ? 'custom' : 'default');
                    await showCollectionDetail(routeListId, routeCollection, fallbackListType);
                } catch (error) {
                    console.error('Unable to open collection route:', error);
                    showToast('Unable to open this collection', 'error');
                }
            }

            function updateCollectionViewToggleButtons(mediaType = null) {
                const targetType = mediaType ? String(mediaType).toLowerCase() : null;
                const toggles = document.querySelectorAll('.collection-view-toggle[data-media]');
                toggles.forEach((toggle) => {
                    const type = String(toggle.getAttribute('data-media') || '').toLowerCase();
                    if (targetType && type !== targetType) return;
                    const mode = getCollectionViewMode(type);
                    toggle.querySelectorAll('.collection-view-toggle-btn').forEach((btn) => {
                        btn.classList.toggle('active', btn.getAttribute('data-mode') === mode);
                    });
                });
            }

            function applyCollectionViewToContainer(container, mediaType) {
                if (!container) return;
                const mode = getCollectionViewMode(mediaType);
                container.classList.remove('collection-items-grid', 'collection-items-list');
                container.classList.add(mode === 'list' ? 'collection-items-list' : 'collection-items-grid');
            }

            async function rerenderActiveCollectionDetail(mediaType) {
                if (!currentMediaDetail || currentMediaDetail.mediaType !== mediaType) return;
                const isMobile = window.innerWidth <= 768;
                const listId = currentMediaDetail.listId;
                const listType = currentMediaDetail.listType;
                if (mediaType === 'restaurant') {
                    await showRestaurantDetail(listId, isMobile);
                } else if (mediaType === 'movie') {
                    await showMovieDetail(listId, listType, isMobile);
                } else if (mediaType === 'tv') {
                    await showTvDetail(listId, listType, isMobile);
                } else if (mediaType === 'anime') {
                    await showAnimeDetail(listId, listType, isMobile);
                } else if (mediaType === 'game') {
                    await showGameDetail(listId, listType, isMobile);
                } else if (mediaType === 'book') {
                    await showBookDetail(listId, listType, isMobile);
                } else if (mediaType === 'music') {
                    await showMusicDetail(listId, listType, isMobile);
                } else if (mediaType === 'travel') {
                    await showTravelDetail(listId, listType, isMobile);
                } else if (mediaType === 'fashion') {
                    await showFashionDetail(listId, listType, isMobile);
                } else if (mediaType === 'food') {
                    await showFoodDetail(listId, listType, isMobile);
                } else if (mediaType === 'car') {
                    await showCarDetail(listId, listType, isMobile);
                }
            }

            async function setCollectionViewMode(mediaType, mode, _forceMobile = null) {
                const normalizedType = String(mediaType || '').toLowerCase();
                if (!VALID_COLLECTION_TYPES.has(normalizedType)) return;
                collectionViewModes[normalizedType] = normalizeCollectionViewMode(mode);
                persistCollectionViewModes();
                updateCollectionViewToggleButtons(normalizedType);

                if (isCollectionRouteActive()) {
                    const currentParams = new URLSearchParams(window.location.search);
                    if (String(currentParams.get('collection') || '').toLowerCase() === normalizedType) {
                        currentParams.set('view', collectionViewModes[normalizedType]);
                        history.replaceState({}, '', `${window.location.pathname}?${currentParams.toString()}`);
                    }
                }

                if (currentMediaDetail && currentMediaDetail.mediaType === normalizedType) {
                    await rerenderActiveCollectionDetail(normalizedType);
                }
            }

            async function fetchMovieDetails(movieId) {
                if (movieCache.has(movieId)) return movieCache.get(movieId);
                const res = await fetch(`${TMDB_PROXY_BASE}/movie/${movieId}?language=en`);
                if (!res.ok) return null;
                const data = await res.json();
                movieCache.set(movieId, data);
                return data;
            }

            async function fetchTvDetails(tvId) {
                if (tvCache.has(tvId)) return tvCache.get(tvId);
                const res = await fetch(`${TMDB_PROXY_BASE}/tv/${tvId}?language=en`);
                if (!res.ok) return null;
                const data = await res.json();
                tvCache.set(tvId, data);
                return data;
            }

            async function fetchAnimeDetails(animeId) {
                if (animeCache.has(animeId)) return animeCache.get(animeId);
                const res = await fetch(`${TMDB_PROXY_BASE}/tv/${animeId}?language=en`);
                if (!res.ok) return null;
                const data = await res.json();
                animeCache.set(animeId, data);
                return data;
            }

                        function normalizeGameImageSource(game) {
                if (!game || typeof game !== 'object') return '/newlogo.webp';
                const candidates = [
                    game.cover,
                    game.cover_url,
                    game.hero,
                    game.hero_url,
                    game.background_image
                ];
                const screenshots = Array.isArray(game.screenshots) ? game.screenshots : [];
                const shortScreens = Array.isArray(game.short_screenshots)
                    ? game.short_screenshots.map((entry) => entry?.image)
                    : [];
                candidates.push(screenshots[0], shortScreens[0]);
                for (const entry of candidates) {
                    const url = String(entry || '').trim();
                    if (url) return url;
                }
                return '/newlogo.webp';
            }

            function normalizeSupabaseGameRecord(row, fallbackId = '') {
                if (!row || typeof row !== 'object') return null;
                const idValue = row.id ?? fallbackId;
                const title = String(row.title || row.name || row.slug || '').trim() || 'Untitled';
                const ratingValue = Number(row.rating);
                const ratingCountValue = Number(row.rating_count ?? row.ratings_count ?? 0);
                const coverUrl = String(row.cover_url || row.cover || '').trim();
                const releaseDate = String(row.release_date || row.released || '').trim();
                return {
                    ...row,
                    id: idValue,
                    name: String(row.name || title).trim() || title,
                    title,
                    cover: coverUrl,
                    cover_url: coverUrl,
                    hero: coverUrl,
                    hero_url: coverUrl,
                    released: releaseDate,
                    release_date: releaseDate,
                    rating: Number.isFinite(ratingValue) ? ratingValue : null,
                    ratings_count: Number.isFinite(ratingCountValue) ? Math.floor(ratingCountValue) : 0,
                    rating_count: Number.isFinite(ratingCountValue) ? Math.floor(ratingCountValue) : 0
                };
            }

            async function fetchGameDetails(gameId) {
                const cacheKey = String(gameId || '').trim();
                if (!cacheKey) return null;
                if (gameCache.has(cacheKey)) return gameCache.get(cacheKey);

                const cacheGameRecord = (record) => {
                    if (!record) return null;
                    const normalizedId = String(record.id ?? cacheKey).trim();
                    if (normalizedId) gameCache.set(normalizedId, record);
                    gameCache.set(cacheKey, record);
                    return record;
                };

                if (supabase) {
                    try {
                        const numericId = Number(cacheKey);
                        let query = supabase
                            .from('games')
                            .select('id,title,description,cover_url,hero_url,release_date,rating,rating_count,source,igdb_id,rawg_id,slug,extra')
                            .limit(1);
                        query = Number.isFinite(numericId)
                            ? query.eq('id', numericId)
                            : query.eq('id', cacheKey);
                        const { data, error } = await query.maybeSingle();
                        if (!error && data) {
                            const normalized = normalizeSupabaseGameRecord(data, cacheKey);
                            return cacheGameRecord(normalized);
                        }
                    } catch (_err) {}
                }

                try {
                    const response = await igdbFetch(`/games/${encodeURIComponent(cacheKey)}`);
                    const raw = Array.isArray(response?.results)
                        ? response.results[0]
                        : (Array.isArray(response) ? response[0] : response);
                    if (!raw || typeof raw !== 'object') return null;

                    const requestedId = Number(cacheKey);
                    const receivedId = Number(raw.id);
                    if (Number.isFinite(requestedId) && Number.isFinite(receivedId) && requestedId !== receivedId) {
                        return null;
                    }

                    const normalized = normalizeSupabaseGameRecord(raw, cacheKey) || { ...raw, id: raw.id ?? cacheKey };
                    return cacheGameRecord(normalized);
                } catch (_err) {
                    return null;
                }
            }

            async function fetchMusicDetails(trackId) {
                const key = String(trackId || '').trim();
                if (!key) return null;
                if (musicCache.has(key)) return musicCache.get(key);
                try {
                    const { data, error } = await supabase
                        .from('tracks')
                        .select('id, name, artists, album_name, image_url, external_url, preview_url')
                        .eq('id', key)
                        .maybeSingle();
                    if (error || !data) return null;
                    musicCache.set(key, data);
                    return data;
                } catch (_err) {
                    return null;
                }
            }

            function normalizeCountryCode(value) {
                const raw = String(value || '').trim().toUpperCase();
                if (raw === 'IL') return 'PS';
                return /^[A-Z]{2,3}$/.test(raw) ? raw : '';
            }

            function countryFlagFromCode(code) {
                const safeCode = normalizeCountryCode(code);
                if (!safeCode) return '/newlogo.webp';
                return `https://flagcdn.com/w640/${safeCode.toLowerCase()}.png`;
            }

            function toHttpsUrl(url) {
                const text = String(url || '').trim();
                if (!text) return '';
                if (text.startsWith('//')) return `https:${text}`;
                if (text.startsWith('http://')) return text.replace(/^http:\/\//i, 'https://');
                return text;
            }

            async function fetchTravelCountriesByCodes(codes = []) {
                const normalizedCodes = Array.from(new Set(
                    (Array.isArray(codes) ? codes : [])
                        .map((code) => normalizeCountryCode(code))
                        .filter(Boolean)
                ));
                if (!normalizedCodes.length) return new Map();

                const byCode = new Map();
                const missing = [];
                normalizedCodes.forEach((code) => {
                    if (travelCountryCache.has(code)) {
                        byCode.set(code, travelCountryCache.get(code));
                    } else {
                        missing.push(code);
                    }
                });

                if (missing.length) {
                    const chunks = [];
                    for (let i = 0; i < missing.length; i += 30) {
                        chunks.push(missing.slice(i, i + 30));
                    }
                    for (const chunk of chunks) {
                        const endpoint = `https://restcountries.com/v3.1/alpha?codes=${encodeURIComponent(chunk.join(','))}&fields=name,cca2,cca3,capital,region,subregion,flags`;
                        try {
                            const response = await fetch(endpoint, { headers: { Accept: 'application/json' } });
                            if (!response.ok) continue;
                            const payload = await response.json();
                            const rows = Array.isArray(payload) ? payload : [payload];
                            rows.forEach((row) => {
                                const code = normalizeCountryCode(row?.cca2 || row?.cca3);
                                if (!code) return;
                                const capital = Array.isArray(row?.capital)
                                    ? String(row.capital[0] || '').trim()
                                    : String(row?.capital || '').trim();
                                const travelCountry = {
                                    code,
                                    name: String(row?.name?.common || row?.name?.official || code).trim(),
                                    capital,
                                    region: String(row?.region || '').trim(),
                                    subregion: String(row?.subregion || '').trim(),
                                    flag: toHttpsUrl(row?.flags?.png || row?.flags?.svg || '') || countryFlagFromCode(code)
                                };
                                travelCountryCache.set(code, travelCountry);
                                byCode.set(code, travelCountry);
                            });
                        } catch (_error) {
                            // keep fallback behavior if remote fetch fails
                        }
                    }
                }

                normalizedCodes.forEach((code) => {
                    if (byCode.has(code)) return;
                    const fallback = {
                        code,
                        name: code,
                        capital: '',
                        region: '',
                        subregion: '',
                        flag: countryFlagFromCode(code)
                    };
                    travelCountryCache.set(code, fallback);
                    byCode.set(code, fallback);
                });
                return byCode;
            }

            async function fetchBrandMapByIds(contentType, ids = []) {
                const normalizedIds = Array.from(new Set(
                    (Array.isArray(ids) ? ids : [])
                        .map((id) => String(id || '').trim())
                        .filter(Boolean)
                ));
                if (!normalizedIds.length) return new Map();

                const cache = contentType === 'food'
                    ? foodBrandCache
                    : (contentType === 'car' ? carBrandCache : fashionBrandCache);
                const byId = new Map();
                const missing = [];
                normalizedIds.forEach((id) => {
                    if (cache.has(id)) {
                        byId.set(id, cache.get(id));
                    } else {
                        missing.push(id);
                    }
                });

                if (missing.length) {
                    const table = contentType === 'food'
                        ? 'food_brands'
                        : (contentType === 'car' ? 'car_brands' : 'fashion_brands');
                    const { data } = await supabase
                        .from(table)
                        .select('id, name, domain, logo_url, category, description, country')
                        .in('id', missing);
                    (data || []).forEach((row) => {
                        const id = String(row?.id || '').trim();
                        if (!id) return;
                        const name = String(row?.name || '').trim();
                        const wikiLogo = (() => {
                            if (!name) return '';
                            const params = new URLSearchParams();
                            params.set('title', name);
                            const domainRaw = String(row?.domain || '').trim();
                            if (domainRaw) params.set('domain', domainRaw);
                            params.set('mode', 'logo');
                            return `/api/logo?${params.toString()}`;
                        })();
                        const localLogo = toHttpsUrl(row?.logo_url || '');
                        const brand = {
                            id,
                            name,
                            logo: localLogo || wikiLogo,
                            category: String(row?.category || '').trim(),
                            description: String(row?.description || '').trim(),
                            country: String(row?.country || '').trim()
                        };
                        cache.set(id, brand);
                        byId.set(id, brand);
                    });
                }

                normalizedIds.forEach((id) => {
                    if (!byId.has(id)) {
                        const fallback = { id, name: 'Brand', logo: '/newlogo.webp', category: '', description: '', country: '' };
                        cache.set(id, fallback);
                        byId.set(id, fallback);
                    }
                });
                return byId;
            }

            function renderMovieListIcon(icon) {
                return iconGlyph(icon, 'movie');
            }

            async function loadMovieLists() {
                const grid = document.getElementById('movieListsGrid');
                const mobileGrid = document.getElementById('mobileMovieListsGrid');
                if (!grid && !mobileGrid) return;
                const userId = isViewingOwnProfile ? currentUser?.id : targetUserId;
                if (!userId || !supabase) return;
                const loadingHtml = `
                    <div class="empty-state">
                        <div class="empty-icon"><i class="fas fa-film"></i></div>
                        <h3 class="empty-title">Loading...</h3>
                        <p class="empty-description">Fetching your movie lists.</p>
                    </div>
                `;
                if (grid) grid.innerHTML = loadingHtml;
                if (mobileGrid) mobileGrid.innerHTML = loadingHtml;

                const [listsRes, itemsRes] = await Promise.all([
                    supabase.from('movie_lists').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
                    supabase.from('movie_list_items').select('movie_id, list_type, list_id').eq('user_id', userId)
                ]);

                if (listsRes.error || itemsRes.error) {
                    const errorHtml = `
                        <div class="empty-state">
                            <div class="empty-icon">${iconGlyph('list')}</div>
                            <h3 class="empty-title">Could not load movies</h3>
                            <p class="empty-description">Please try again later.</p>
                        </div>
                    `;
                    if (grid) grid.innerHTML = errorHtml;
                    if (mobileGrid) mobileGrid.innerHTML = errorHtml;
                    return;
                }

                const customLists = listsRes.data || [];
                const items = itemsRes.data || [];
                const defaultLists = [
                    { id: 'favorites', title: 'Favorites', icon: 'fas fa-heart', description: 'Movies you love', type: 'default' },
                    { id: 'watched', title: 'Watched', icon: 'fas fa-eye', description: 'Movies you watched', type: 'default' },
                    { id: 'watchlist', title: 'Watchlist', icon: 'fas fa-bookmark', description: 'Movies to watch later', type: 'default' }
                ];

                const allLists = [
                    ...defaultLists,
                    ...customLists.map(l => ({ id: l.id, title: l.title, icon: l.icon || 'fas fa-film', description: l.description || 'Custom list', type: 'custom' }))
                ];

                const listMovieMap = new Map();
                allLists.forEach(l => listMovieMap.set(l.id, []));
                items.forEach(item => {
                    if (item.list_type) {
                        const list = listMovieMap.get(item.list_type);
                        if (list) list.push(item.movie_id);
                    } else if (item.list_id) {
                        const list = listMovieMap.get(item.list_id);
                        if (list) list.push(item.movie_id);
                    }
                });

                const cards = await Promise.all(allLists.map(async list => {
                    const movieIds = listMovieMap.get(list.id) || [];
                    const previewIds = movieIds.slice(0, 4);
                    const previewData = await Promise.all(previewIds.map(id => fetchMovieDetails(id)));
                    const previewHtml = previewIds.length ? `
                        <div class="list-preview-grid">
                            ${previewData.map(m => `
                                <div class="list-preview-item is-portrait">
                                    <img src="${m && m.poster_path ? TMDB_POSTER + m.poster_path : 'images/placeholder.jpg'}" alt="Preview" loading="lazy">
                                </div>
                            `).join('')}
                        </div>
                    ` : '';
                    const editBtnHtml = list.type === 'custom' ? `
                        <div class="movie-list-actions">
                            <button class="movie-list-action-btn" onclick="event.stopPropagation(); ProfileManager.renameMovieList('${list.id}')">
                                <i class="fas fa-pen"></i>
                            </button>
                            <button class="movie-list-action-btn danger" onclick="event.stopPropagation(); ProfileManager.deleteMovieList('${list.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    ` : '';
                    return `
                        <div class="movie-list-card" onclick="ProfileManager.showMovieListDetail('${list.id}', '${list.type}')">
                            <div class="movie-list-info">
                                <div class="movie-list-icon">${renderMovieListIcon(list.icon)}</div>
                                <div>
                                    <div class="movie-list-title">${list.title}</div>
                                    <div class="movie-list-count">${movieIds.length} movie${movieIds.length === 1 ? '' : 's'}</div>
                                </div>
                                ${editBtnHtml}
                            </div>
                            ${previewHtml}
                        </div>
                    `;
                }));

                const cardsHtml = cards.join('') || `
                    <div class="empty-state">
                        <div class="empty-icon"><i class="fas fa-film"></i></div>
                        <h3 class="empty-title">No Movies Yet</h3>
                        <p class="empty-description">Save movies to see them here.</p>
                    </div>
                `;
                if (grid) grid.innerHTML = cardsHtml;
                if (mobileGrid) mobileGrid.innerHTML = cardsHtml;
            }

            async function showMovieListDetail(listId, listType) {
                const isMobileView = window.innerWidth <= 768;
                const detailView = document.getElementById('movieListDetailView');
                const grid = document.getElementById('movieListMoviesGrid');
                const titleEl = document.getElementById('movieListDetailTitle');
                const descEl = document.getElementById('movieListDetailDescription');
                const listGrid = document.getElementById('movieListsGrid');
                const actions = document.getElementById('movieListDetailActions');
                const editBtn = document.getElementById('movieListEditBtn');
                const deleteBtn = document.getElementById('movieListDeleteBtn');
                const mobileDetail = document.getElementById('mobileMovieListDetail');
                const mobileGrid = document.getElementById('mobileMovieListMoviesGrid');
                const mobileTitle = document.getElementById('mobileMovieListDetailTitle');
                const mobileDesc = document.getElementById('mobileMovieListDetailDescription');
                const mobileListsGrid = document.getElementById('mobileMovieListsGrid');
                const mobileActions = document.getElementById('mobileMovieListDetailActions');
                const mobileEditBtn = document.getElementById('mobileMovieListEditBtn');
                const mobileDeleteBtn = document.getElementById('mobileMovieListDeleteBtn');
                if (isMobileView) {
                    if (mobileDetail) mobileDetail.style.display = 'block';
                    if (mobileListsGrid) mobileListsGrid.style.display = 'none';
                } else {
                    if (!detailView || !grid) return;
                    detailView.style.display = 'block';
                    if (listGrid) listGrid.style.display = 'none';
                }

                const listTitleMap = { favorites: 'Favorites', watched: 'Watched', watchlist: 'Watchlist' };
                const listDescMap = {
                    favorites: 'Movies you love',
                    watched: 'Movies you watched',
                    watchlist: 'Movies to watch later'
                };
                if (listType === 'default') {
                    if (titleEl) titleEl.textContent = listTitleMap[listId] || 'Movies';
                    if (descEl) descEl.textContent = listDescMap[listId] || '';
                    if (mobileTitle) mobileTitle.textContent = listTitleMap[listId] || 'Movies';
                    if (mobileDesc) mobileDesc.textContent = listDescMap[listId] || '';
                    if (actions) actions.style.display = 'none';
                    if (mobileActions) mobileActions.style.display = 'none';
                } else {
                    const { data } = await supabase.from('movie_lists').select('*').eq('id', listId).single();
                    if (data?.id) {
                        const ownerUserId = String(data.user_id || '').trim();
                        const currentUserId = String(currentUser?.id || '').trim();
                        setCollaborativeAccess('movie', data.id, {
                            ownerUserId,
                            isOwner: ownerUserId === currentUserId,
                            canEdit: ownerUserId === currentUserId
                        });
                    }
                    if (titleEl) titleEl.textContent = data?.title || 'Movies';
                    if (descEl) descEl.textContent = data?.description || 'Custom list';
                    if (mobileTitle) mobileTitle.textContent = data?.title || 'Movies';
                    if (mobileDesc) mobileDesc.textContent = data?.description || 'Custom list';
                    const canEdit = canEditCustomCollection('movie', listId, data || null);
                    const canDelete = canDeleteCustomCollection('movie', listId, data || null);
                    if (actions) actions.style.display = (canEdit || canDelete) ? 'flex' : 'none';
                    if (mobileActions) mobileActions.style.display = (canEdit || canDelete) ? 'flex' : 'none';
                    if (editBtn) editBtn.style.display = canEdit ? 'inline-flex' : 'none';
                    if (deleteBtn) deleteBtn.style.display = canDelete ? 'inline-flex' : 'none';
                    if (mobileEditBtn) mobileEditBtn.style.display = canEdit ? 'inline-flex' : 'none';
                    if (mobileDeleteBtn) mobileDeleteBtn.style.display = canDelete ? 'inline-flex' : 'none';
                    if (editBtn) {
                        editBtn.onclick = () => ProfileManager.renameMovieList(listId);
                    }
                    if (deleteBtn) {
                        deleteBtn.onclick = () => ProfileManager.deleteMovieList(listId);
                    }
                    if (mobileEditBtn) {
                        mobileEditBtn.onclick = () => ProfileManager.renameMovieList(listId);
                    }
                    if (mobileDeleteBtn) {
                        mobileDeleteBtn.onclick = () => ProfileManager.deleteMovieList(listId);
                    }
                }

                if (grid) grid.innerHTML = '<div class="empty-state"><div class="empty-icon"><i class="fas fa-film"></i></div><h3 class="empty-title">Loading...</h3></div>';
                if (mobileGrid) mobileGrid.innerHTML = '<div class="empty-state"><div class="empty-icon"><i class="fas fa-film"></i></div><h3 class="empty-title">Loading...</h3></div>';
                const ownerIdForDefault = isViewingOwnProfile ? currentUser?.id : targetUserId;
                let ownerIdForCustom = ownerIdForDefault;
                if (listType === 'custom') {
                    const { data: ownerRow } = await supabase.from('movie_lists').select('user_id').eq('id', listId).maybeSingle();
                    ownerIdForCustom = ownerRow?.user_id || ownerIdForDefault;
                }
                const filtered = await fetchMediaCollectionItemIds(
                    'movie',
                    listType === 'default' ? ownerIdForDefault : ownerIdForCustom,
                    listId,
                    listType
                );
                if (!filtered.length) {
                    const emptyHtml = '<div class="empty-state"><div class="empty-icon"><i class="fas fa-film"></i></div><h3 class="empty-title">No movies in this list</h3></div>';
                    if (grid) grid.innerHTML = emptyHtml;
                    if (mobileGrid) mobileGrid.innerHTML = emptyHtml;
                    return;
                }
                const movies = await Promise.all(filtered.map(id => fetchMovieDetails(id)));
                const cardsHtml = movies.map(m => `
                    <div class="movie-list-movie-card" onclick="window.location.href='movie.html?id=${m?.id}'">
                        <button class="movie-remove-btn" onclick="event.stopPropagation(); ProfileManager.removeMovieFromList('${listId}', '${listType}', ${m?.id})">
                            <i class="fas fa-times"></i>
                        </button>
                        <img src="${m && m.poster_path ? TMDB_POSTER + m.poster_path : 'images/placeholder.jpg'}" alt="${m?.title || 'Movie'}">
                        <div class="movie-list-movie-body">
                            <h3 class="card-title">${m?.title || 'Untitled'}</h3>
                        </div>
                    </div>
                `).join('');
                if (grid) grid.innerHTML = cardsHtml;
                if (mobileGrid) {
                    const mobileCards = movies.map(m => `
                        <div class="movie-list-movie-card" onclick="window.location.href='movie.html?id=${m?.id}'">
                            <button class="movie-remove-btn" onclick="event.stopPropagation(); ProfileManager.removeMovieFromList('${listId}', '${listType}', ${m?.id})">
                                <i class="fas fa-times"></i>
                            </button>
                            <img src="${m && m.poster_path ? TMDB_POSTER + m.poster_path : 'images/placeholder.jpg'}" alt="${m?.title || 'Movie'}">
                            <div class="movie-list-movie-body">
                                <h3 class="card-title">${m?.title || 'Untitled'}</h3>
                            </div>
                        </div>
                    `).join('');
                    mobileGrid.innerHTML = mobileCards;
                }
            }

            function hideMovieListDetail() {
                const detailView = document.getElementById('movieListDetailView');
                const mobileDetail = document.getElementById('mobileMovieListDetail');
                const mobileListsGrid = document.getElementById('mobileMovieListsGrid');
                const listGrid = document.getElementById('movieListsGrid');
                if (detailView) detailView.style.display = 'none';
                if (mobileDetail) mobileDetail.style.display = 'none';
                if (mobileListsGrid) mobileListsGrid.style.display = 'grid';
                if (listGrid) listGrid.style.display = 'grid';
            }

            async function removeMovieFromList(listId, listType, movieId) {
                if (!supabase || !movieId) return;
                const userId = isViewingOwnProfile ? currentUser?.id : targetUserId;
                if (!userId) return;
                if (!canEditCollectionItems('movie', listId, listType)) {
                    showToast('You do not have permission to edit this list', 'warning');
                    return;
                }
                const renderToken = ++renderMoviesToken;
                if (listType === 'default') {
                    await supabase
                        .from('movie_list_items')
                        .delete()
                        .eq('user_id', userId)
                        .eq('movie_id', movieId)
                        .eq('list_type', listId);
                } else {
                    await supabase
                        .from('movie_list_items')
                        .delete()
                        .eq('movie_id', movieId)
                        .eq('list_id', listId);
                }
                await showMovieListDetail(listId, listType);
                await renderMovies();
            }

            function getDefaultListIconForContext(type) {
                const normalized = String(type || '').trim().toLowerCase();
                const map = {
                    restaurant: 'restaurant',
                    movie: 'movie',
                    tv: 'tv',
                    anime: 'anime',
                    game: 'game',
                    book: 'book',
                    music: 'music',
                    travel: 'travel',
                    fashion: 'fashion',
                    food: 'food',
                    car: 'car',
                    cars: 'car'
                };
                return map[normalized] || 'list';
            }

            function getMediaListConfig(type) {
                const configMap = {
                    movie: { table: 'movie_lists', fallback: 'movie', label: 'Movie', rerender: renderMovies },
                    tv: { table: 'tv_lists', fallback: 'tv', label: 'TV', rerender: renderTvShows },
                    anime: { table: 'anime_lists', fallback: 'anime', label: 'Anime', rerender: renderAnimeShows },
                    game: { table: 'game_lists', fallback: 'game', label: 'Game', rerender: renderGames },
                    book: { table: 'book_lists', fallback: 'book', label: 'Book', rerender: renderBooks },
                    music: { table: 'music_lists', fallback: 'music', label: 'Music', rerender: renderMusic },
                    travel: { table: 'travel_lists', fallback: 'travel', label: 'Travel', rerender: renderTravel },
                    fashion: { table: 'fashion_lists', fallback: 'fashion', label: 'Fashion', rerender: renderFashion },
                    food: { table: 'food_lists', fallback: 'food', label: 'Food', rerender: renderFood },
                    car: { table: 'car_lists', fallback: 'car', label: 'Cars', rerender: renderCars }
                };
                return configMap[type] || null;
            }

            function getReservedMediaListTitles(type) {
                const map = {
                    movie: ['favorites', 'watched', 'watchlist'],
                    tv: ['favorites', 'watched', 'watchlist'],
                    anime: ['favorites', 'watched', 'watchlist'],
                    game: ['favorites', 'watched', 'watchlist'],
                    book: ['favorites', 'read', 'readlist'],
                    music: ['favorites', 'listened', 'listenlist'],
                    travel: ['favorites', 'visited', 'bucket list', 'bucketlist'],
                    fashion: ['favorites', 'owned', 'wishlist'],
                    food: ['favorites', 'tried', 'want to try', 'want_to_try'],
                    car: ['favorites', 'owned', 'wishlist']
                };
                return new Set(map[type] || []);
            }

            const TierListMeta = (function() {
                function normalizeListKind(value, fallback = 'standard') {
                    const raw = String(value || '').trim().toLowerCase();
                    if (!raw) return fallback;
                    if (raw === 'tier' || raw === 'tierlist' || raw === 'tier_list') return 'tier';
                    if (raw === 'standard' || raw === 'list' || raw === 'custom' || raw === 'default') return 'standard';
                    if (raw === 'movie' || raw === 'tv' || raw === 'anime' || raw === 'game' || raw === 'book' || raw === 'music' || raw === 'travel' || raw === 'restaurant') {
                        return 'standard';
                    }
                    return fallback;
                }

                function normalizeMaxRank(value) {
                    const parsed = Number(value);
                    if (!Number.isFinite(parsed) || parsed <= 0) return null;
                    return Math.max(1, Math.floor(parsed));
                }

                function detect(type, list, itemsCount = 0) {
                    const safeType = String(type || '').toLowerCase();
                    const safeList = list && typeof list === 'object' ? list : {};

                    if (window.ListUtils && typeof ListUtils.resolveListMeta === 'function') {
                        const resolved = ListUtils.resolveListMeta(safeType, safeList, itemsCount);
                        if (resolved && typeof resolved === 'object') {
                            const resolvedKind = normalizeListKind(resolved.listKind, 'standard');
                            const resolvedMaxRank = normalizeMaxRank(resolved.maxRank);
                            return {
                                listKind: resolvedKind,
                                isTier: resolvedKind === 'tier',
                                maxRank: resolvedMaxRank || (resolvedKind === 'tier' ? Math.max(1, Number(itemsCount) || 1) : null)
                            };
                        }
                    }

                    const safeListId = String(safeList.id || safeList.list_id || '').trim();
                    const storedMeta = (window.ListUtils && typeof ListUtils.getListMeta === 'function' && safeListId)
                        ? ListUtils.getListMeta(safeType, safeListId)
                        : { listKind: 'standard', maxRank: null };
                    const rowKind = normalizeListKind(
                        safeList.__listKind || safeList.__zo2yListKind || safeList.list_kind,
                        normalizeListKind(storedMeta?.listKind, 'standard')
                    );
                    const listKind = rowKind === 'tier' || normalizeListKind(storedMeta?.listKind, 'standard') === 'tier'
                        ? 'tier'
                        : 'standard';
                    const rawMaxRank = safeList.__tierMaxRank || safeList.__zo2yTierMaxRank || safeList.tier_max_rank || safeList.max_rank || storedMeta?.maxRank;
                    const maxRank = (window.ListUtils && typeof ListUtils.normalizeTierMaxRank === 'function')
                        ? ListUtils.normalizeTierMaxRank(rawMaxRank)
                        : normalizeMaxRank(rawMaxRank);

                    return {
                        listKind,
                        isTier: listKind === 'tier',
                        maxRank: maxRank || (listKind === 'tier' ? Math.max(1, Number(itemsCount) || 1) : null)
                    };
                }

                return {
                    detect
                };
            })();

            const TierListOrdering = (function() {
                const hydratedKeys = new Set();

                function normalizeIds(itemIds = []) {
                    const seen = new Set();
                    return (Array.isArray(itemIds) ? itemIds : [])
                        .map((itemId) => String(itemId || '').trim())
                        .filter((itemId) => {
                            if (!itemId || seen.has(itemId)) return false;
                            seen.add(itemId);
                            return true;
                        });
                }

                function makeKey(type, listId, ownerUserId) {
                    const safeOwner = String(ownerUserId || currentUser?.id || '').trim() || 'self';
                    return `${safeOwner}:${String(type || '').toLowerCase()}:${String(listId || '').trim()}`;
                }

                async function hydrateOnce(type, listId, ownerUserId = null) {
                    if (!window.ListUtils || typeof ListUtils.hydrateTierRanksForList !== 'function') return;
                    const key = makeKey(type, listId, ownerUserId);
                    if (hydratedKeys.has(key)) return;
                    hydratedKeys.add(key);
                    try {
                        await ListUtils.hydrateTierRanksForList(type, listId, {
                            client: supabase,
                            userId: currentUser?.id,
                            ownerUserId
                        });
                    } catch (error) {
                        hydratedKeys.delete(key);
                        throw error;
                    }
                }

                function markHydrated(type, listId, ownerUserId = null) {
                    hydratedKeys.add(makeKey(type, listId, ownerUserId));
                }

                async function resolve(type, list, listId, itemIds = [], options = {}) {
                    const safeType = String(type || '').toLowerCase();
                    const safeListId = String(listId || '').trim();
                    const ownerUserId = options.ownerUserId || null;
                    const normalizedIds = normalizeIds(itemIds);
                    const tierMeta = TierListMeta.detect(safeType, list, normalizedIds.length);
                    // Most lists are standard lists; avoid tier-rank hydration queries unless needed.
                    if (!tierMeta.isTier) {
                        return { tierMeta, orderedIds: normalizedIds };
                    }
                    if (!(safeListId && window.ListUtils)) {
                        return { tierMeta, orderedIds: normalizedIds };
                    }
                    await hydrateOnce(safeType, safeListId, ownerUserId);
                    const orderedIds = (typeof ListUtils.sortIdsByTierRank === 'function')
                        ? ListUtils.sortIdsByTierRank(safeType, safeListId, normalizedIds)
                        : normalizedIds;
                    return { tierMeta, orderedIds: normalizeIds(orderedIds) };
                }

                return {
                    normalizeIds,
                    resolve,
                    markHydrated
                };
            })();

            function getTierMetaForList(type, list, itemsCount = 0) {
                return TierListMeta.detect(type, list, itemsCount);
            }
            function getCollectionTitleWithKind(type, list, listType) {
                const baseTitle = String(list?.title || '');
                if (listType !== 'custom') return baseTitle;
                const tierMeta = getTierMetaForList(type, list, 0);
                if (!tierMeta.isTier) return baseTitle;
                return `${baseTitle} • Tier List`;
            }

            function canReorderCollectionItems(contentType, listId, listType = 'custom', list = null) {
                const safeListId = String(listId || '').trim();
                if (!safeListId) return false;
                return canEditCollectionItems(contentType, safeListId, listType, list);
            }

            const TierListUI = (function() {
                function getRankToneClass(rankValue) {
                    const rank = Math.max(1, Number(rankValue) || 1);
                    if (rank === 1) return 'rank-gold';
                    if (rank === 2) return 'rank-silver';
                    if (rank === 3) return 'rank-bronze';
                    return 'rank-default';
                }

                function applyRankPillTone(pill, rankValue) {
                    if (!pill) return;
                    const rank = Math.max(1, Number(rankValue) || 1);
                    pill.textContent = `#${rank}`;
                    pill.classList.remove('rank-gold', 'rank-silver', 'rank-bronze', 'rank-default');
                    pill.classList.add(getRankToneClass(rank));
                }

                function refreshRankPills(container) {
                    if (!container) return;
                    const cards = Array.from(container.querySelectorAll('.collection-item-card[data-tier-item-id]'));
                    cards.forEach((card, index) => {
                        applyRankPillTone(card.querySelector('.collection-item-rank-pill'), index + 1);
                    });
                }

                function clearDropTargets(container) {
                    if (!container) return;
                    container.querySelectorAll('.collection-item-card.tier-drop-target, .collection-item-card.tier-drop-before, .collection-item-card.tier-drop-after').forEach((card) => {
                        card.classList.remove('tier-drop-target', 'tier-drop-before', 'tier-drop-after');
                    });
                }

                function markDropTarget(card, position = 'before') {
                    if (!card) return;
                    card.classList.add('tier-drop-target');
                    card.classList.toggle('tier-drop-before', position === 'before');
                    card.classList.toggle('tier-drop-after', position === 'after');
                }

                function buildRankMarkup(rankPosition, totalCount, canReorder = false) {
                    const safeRank = Math.max(1, Number(rankPosition) || 1);
                    const toneClass = getRankToneClass(safeRank);
                    const handleMarkup = canReorder
                        ? `<button type="button" class="tier-drag-handle" aria-label="Drag to reorder" title="Drag to reorder"><i class="fas fa-grip-lines"></i></button>`
                        : '';
                    return `
                        <div class="collection-item-rank" onclick="event.stopPropagation()">
                            <span class="collection-item-rank-pill ${toneClass}">#${safeRank}</span>
                            ${handleMarkup}
                        </div>
                    `;
                }

                return {
                    buildRankMarkup,
                    refreshRankPills,
                    clearDropTargets,
                    markDropTarget
                };
            })();

            const TierListPersistence = (function() {
                const TIER_RANK_TABLE = 'list_tier_ranks';

                async function saveOrder(mediaType, listId, orderedItemIds = []) {
                    if (!isViewingOwnProfile) return;
                    const safeType = String(mediaType || '').toLowerCase();
                    const safeListId = String(listId || '').trim();
                    if (!safeType || !safeListId) return;

                    const normalizedIds = TierListOrdering.normalizeIds(orderedItemIds);
                    const access = getCollaborativeAccess(safeType, safeListId, null);
                    const ownerUserId = String(access?.ownerUserId || currentUser?.id || '').trim();
                    const persistUserId = ownerUserId || String(currentUser?.id || '').trim();
                    if (window.ListUtils && typeof ListUtils.setTierRank === 'function') {
                        normalizedIds.forEach((itemId, index) => {
                            void ListUtils.setTierRank(safeType, safeListId, itemId, index + 1, { skipRemote: true });
                        });
                    }
                    TierListOrdering.markHydrated(safeType, safeListId, persistUserId);

                    if (!supabase || !persistUserId || !normalizedIds.length) return;

                    const updatedAt = new Date().toISOString();
                    const payload = normalizedIds.map((itemId, index) => ({
                        user_id: persistUserId,
                        media_type: safeType,
                        list_id: safeListId,
                        item_id: itemId,
                        rank: index + 1,
                        updated_at: updatedAt
                    }));

                    const { error } = await supabase
                        .from(TIER_RANK_TABLE)
                        .upsert(payload, { onConflict: 'user_id,media_type,list_id,item_id' });
                    if (error) {
                        console.warn('Tier rank batch update failed:', error);
                    }
                }

                return {
                    saveOrder
                };
            })();

            function buildTierRankControlMarkup(rankPosition, totalCount, canReorder = false) {
                return TierListUI.buildRankMarkup(rankPosition, totalCount, canReorder);
            }

            async function resolveTierOrderedIds(mediaType, list, listId, itemIds = [], options = {}) {
                return TierListOrdering.resolve(mediaType, list, listId, itemIds, options);
            }

            async function persistTierOrder(mediaType, listId, orderedItemIds = []) {
                await TierListPersistence.saveOrder(mediaType, listId, orderedItemIds);
            }
            function wireTierDragAndDrop(container, mediaType, listId, listType = 'custom') {
                if (!container) return;

                if (typeof container.__tierCleanup === 'function') {
                    container.__tierCleanup();
                }
                container.__tierCleanup = null;
                TierListUI.clearDropTargets(container);

                const safeType = String(mediaType || '').toLowerCase();
                const safeListId = String(listId || '').trim();
                const canReorder = !!safeType
                    && !!safeListId
                    && canEditCollectionItems(safeType, safeListId, listType);

                if (!canReorder) return;

                const getCards = () => Array.from(container.querySelectorAll('.collection-item-card[data-tier-item-id]'));
                const cards = getCards();
                if (cards.length < 2) {
                    TierListUI.refreshRankPills(container);
                    return;
                }

                const cleanupFns = [];
                const addListener = (target, eventName, handler, options) => {
                    if (!target || typeof target.addEventListener !== 'function') return;
                    target.addEventListener(eventName, handler, options);
                    cleanupFns.push(() => target.removeEventListener(eventName, handler, options));
                };
                const getOrder = () => getCards()
                    .map((card) => String(card.dataset.tierItemId || '').trim())
                    .filter(Boolean);

                let activeCard = null;
                let activePointerId = null;
                let activeTouchId = null;
                let activeMode = null;
                let dragStartX = 0;
                let dragStartY = 0;
                let dragMoved = false;
                let orderDirty = false;
                let startOrderKey = '';
                let isSaving = false;
                let queueSave = false;
                let pendingCard = null;
                let pendingPointerId = null;
                let pendingPointerType = '';
                let pendingStartX = 0;
                let pendingStartY = 0;
                const DRAG_THRESHOLD = 6;

                const clearPendingDrag = () => {
                    pendingCard = null;
                    pendingPointerId = null;
                    pendingPointerType = '';
                    pendingStartX = 0;
                    pendingStartY = 0;
                };

                const isBlockedDragTarget = (target) => {
                    if (!(target instanceof Element)) return false;
                    return !!target.closest('.collection-item-remove, .collection-item-remove-inline, a, button, input, select, textarea, [role="button"]');
                };

                const persistCurrentOrder = async () => {
                    if (isSaving) {
                        queueSave = true;
                        return;
                    }
                    isSaving = true;
                    try {
                        await persistTierOrder(safeType, safeListId, getOrder());
                    } finally {
                        isSaving = false;
                        if (queueSave) {
                            queueSave = false;
                            void persistCurrentOrder();
                        }
                    }
                };

                const beginDrag = (card, mode, pointerId, touchId, clientX, clientY) => {
                    if (!card || activeCard) return;
                    clearPendingDrag();
                    activeCard = card;
                    activeMode = mode;
                    activePointerId = pointerId;
                    activeTouchId = touchId;
                    dragStartX = Number(clientX || 0);
                    dragStartY = Number(clientY || 0);
                    dragMoved = false;
                    orderDirty = false;
                    startOrderKey = getOrder().join('|');
                    card.classList.add('is-dragging');
                    card.style.pointerEvents = 'none';
                    document.body.classList.add('tier-drag-active');
                };

                const moveDrag = (clientX, clientY) => {
                    if (!activeCard) return;

                    const deltaX = Math.abs(Number(clientX || 0) - dragStartX);
                    const deltaY = Math.abs(Number(clientY || 0) - dragStartY);
                    if (!dragMoved && Math.max(deltaX, deltaY) >= DRAG_THRESHOLD) {
                        dragMoved = true;
                    }

                    const siblings = getCards().filter((card) => card !== activeCard);
                    if (!siblings.length) return;

                    const isGridLayout = container.classList.contains('collection-items-grid');
                    let nearest = null;
                    for (const sibling of siblings) {
                        const rect = sibling.getBoundingClientRect();
                        const centerX = rect.left + (rect.width / 2);
                        const centerY = rect.top + (rect.height / 2);
                        const dx = Number(clientX || 0) - centerX;
                        const dy = Number(clientY || 0) - centerY;
                        const distance = (dx * dx) + (dy * dy);
                        if (!nearest || distance < nearest.distance) {
                            nearest = { card: sibling, rect, centerX, centerY, dx, dy, distance };
                        }
                    }

                    if (!nearest) return;
                    const targetCard = nearest.card;
                    let targetPosition = 'after';
                    if (isGridLayout) {
                        const absDx = Math.abs(nearest.dx);
                        const absDy = Math.abs(nearest.dy);
                        const useVerticalAxis = absDy > (nearest.rect.height * 0.25) && absDy >= absDx;
                        if (useVerticalAxis) {
                            targetPosition = nearest.dy > 0 ? 'after' : 'before';
                        } else {
                            targetPosition = nearest.dx > 0 ? 'after' : 'before';
                        }
                    } else {
                        targetPosition = nearest.dy > 0 ? 'after' : 'before';
                    }

                    TierListUI.clearDropTargets(container);
                    if (targetCard) TierListUI.markDropTarget(targetCard, targetPosition);

                    let moved = false;
                    if (targetPosition === 'before') {
                        if (activeCard.nextElementSibling !== targetCard) {
                            container.insertBefore(activeCard, targetCard);
                            moved = true;
                        }
                    } else {
                        const afterNode = targetCard.nextElementSibling;
                        if (afterNode !== activeCard) {
                            container.insertBefore(activeCard, afterNode);
                            moved = true;
                        }
                    }

                    if (moved) {
                        orderDirty = true;
                        dragMoved = true;
                        TierListUI.refreshRankPills(container);
                    }
                };

                const finishDrag = async (suppressClick = false) => {
                    if (!activeCard) return;

                    activeCard.classList.remove('is-dragging');
                    activeCard.style.pointerEvents = '';
                    TierListUI.clearDropTargets(container);
                    document.body.classList.remove('tier-drag-active');

                    const finalOrderKey = getOrder().join('|');
                    const changed = orderDirty || finalOrderKey !== startOrderKey;
                    if (changed || dragMoved || suppressClick) {
                        container.__tierSuppressClickUntil = Date.now() + 320;
                    }

                    activeCard = null;
                    activeMode = null;
                    activePointerId = null;
                    activeTouchId = null;
                    dragMoved = false;
                    orderDirty = false;
                    startOrderKey = '';
                    clearPendingDrag();

                    TierListUI.refreshRankPills(container);
                    if (changed) {
                        await persistCurrentOrder();
                    }
                };

                const resolveTouchById = (touchList, touchId) => {
                    if (!touchList || touchId === null || touchId === undefined) return null;
                    for (let i = 0; i < touchList.length; i += 1) {
                        const touch = touchList[i];
                        if (touch && touch.identifier === touchId) return touch;
                    }
                    return null;
                };

                const suppressCardClick = (event) => {
                    const suppressUntil = Number(container.__tierSuppressClickUntil || 0);
                    if (Date.now() <= suppressUntil) {
                        event.preventDefault();
                        event.stopPropagation();
                    }
                };
                addListener(container, 'click', suppressCardClick, true);

                const supportsPointer = typeof window !== 'undefined' && ('PointerEvent' in window);
                if (supportsPointer) {
                    addListener(window, 'pointermove', (event) => {
                        if (activeCard && activeMode === 'pointer' && event.pointerId === activePointerId) {
                            event.preventDefault();
                            moveDrag(event.clientX, event.clientY);
                            return;
                        }
                        if (!activeCard && pendingCard && event.pointerId === pendingPointerId) {
                            const deltaX = Math.abs(Number(event.clientX || 0) - pendingStartX);
                            const deltaY = Math.abs(Number(event.clientY || 0) - pendingStartY);
                            const threshold = pendingPointerType === 'touch' ? 14 : DRAG_THRESHOLD;
                            if (Math.max(deltaX, deltaY) >= threshold) {
                                event.preventDefault();
                                beginDrag(pendingCard, 'pointer', pendingPointerId, null, pendingStartX, pendingStartY);
                                moveDrag(event.clientX, event.clientY);
                            }
                        }
                    }, { passive: false });
                    addListener(window, 'pointerup', (event) => {
                        if (activeCard && activeMode === 'pointer' && event.pointerId === activePointerId) {
                            event.preventDefault();
                            void finishDrag(event.pointerType !== 'mouse');
                            return;
                        }
                        if (!activeCard && pendingCard && event.pointerId === pendingPointerId) {
                            clearPendingDrag();
                        }
                    });
                    addListener(window, 'pointercancel', (event) => {
                        if (activeCard && activeMode === 'pointer' && event.pointerId === activePointerId) {
                            void finishDrag(true);
                            return;
                        }
                        if (!activeCard && pendingCard && event.pointerId === pendingPointerId) {
                            clearPendingDrag();
                        }
                    });
                } else {
                    addListener(window, 'mousemove', (event) => {
                        if (!activeCard || activeMode !== 'mouse') return;
                        event.preventDefault();
                        moveDrag(event.clientX, event.clientY);
                    }, { passive: false });
                    addListener(window, 'mouseup', (event) => {
                        if (!activeCard || activeMode !== 'mouse') return;
                        event.preventDefault();
                        void finishDrag(false);
                    });
                    addListener(window, 'touchmove', (event) => {
                        if (!activeCard || activeMode !== 'touch') return;
                        const touch = resolveTouchById(event.touches, activeTouchId)
                            || resolveTouchById(event.changedTouches, activeTouchId);
                        if (!touch) return;
                        event.preventDefault();
                        moveDrag(touch.clientX, touch.clientY);
                    }, { passive: false });
                    addListener(window, 'touchend', (event) => {
                        if (!activeCard || activeMode !== 'touch') return;
                        const touch = resolveTouchById(event.changedTouches, activeTouchId);
                        if (!touch) return;
                        event.preventDefault();
                        void finishDrag(true);
                    }, { passive: false });
                    addListener(window, 'touchcancel', () => {
                        if (!activeCard || activeMode !== 'touch') return;
                        void finishDrag(true);
                    }, { passive: false });
                }

                cards.forEach((card) => {
                    card.classList.add('tier-draggable');
                    card.removeAttribute('draggable');
                    card.querySelectorAll('img').forEach((imgEl) => imgEl.setAttribute('draggable', 'false'));

                    if (supportsPointer) {
                        addListener(card, 'pointerdown', (event) => {
                            if (activeCard) return;
                            if (event.pointerType === 'mouse' && event.button !== 0) return;
                            if (isBlockedDragTarget(event.target)) return;
                            pendingCard = card;
                            pendingPointerId = event.pointerId;
                            pendingPointerType = String(event.pointerType || '').toLowerCase();
                            pendingStartX = Number(event.clientX || 0);
                            pendingStartY = Number(event.clientY || 0);
                        }, { passive: true });
                    }

                    const handle = card.querySelector('.tier-drag-handle');
                    if (handle) {
                        addListener(handle, 'click', (event) => {
                            event.preventDefault();
                            event.stopPropagation();
                        });
                    }

                    if (!supportsPointer) {
                        addListener(card, 'mousedown', (event) => {
                            if (activeCard || event.button !== 0) return;
                            if (isBlockedDragTarget(event.target)) return;
                            event.preventDefault();
                            beginDrag(card, 'mouse', null, null, event.clientX, event.clientY);
                            moveDrag(event.clientX, event.clientY);
                        }, { passive: false });
                        addListener(card, 'touchstart', (event) => {
                            if (activeCard || !event.touches || !event.touches.length) return;
                            if (isBlockedDragTarget(event.target)) return;
                            const touch = event.touches[0];
                            beginDrag(card, 'touch', null, touch.identifier, touch.clientX, touch.clientY);
                            moveDrag(touch.clientX, touch.clientY);
                        }, { passive: true });
                        if (handle) {
                            addListener(handle, 'mousedown', (event) => {
                                if (activeCard || event.button !== 0) return;
                                event.preventDefault();
                                event.stopPropagation();
                                beginDrag(card, 'mouse', null, null, event.clientX, event.clientY);
                                moveDrag(event.clientX, event.clientY);
                            }, { passive: false });
                            addListener(handle, 'touchstart', (event) => {
                                if (activeCard || !event.touches || !event.touches.length) return;
                                const touch = event.touches[0];
                                event.preventDefault();
                                event.stopPropagation();
                                beginDrag(card, 'touch', null, touch.identifier, touch.clientX, touch.clientY);
                                moveDrag(touch.clientX, touch.clientY);
                            }, { passive: false });
                        }
                    } else if (handle) {
                        addListener(handle, 'pointerdown', (event) => {
                            if (activeCard) return;
                            if (event.pointerType === 'mouse' && event.button !== 0) return;
                            event.preventDefault();
                            event.stopPropagation();
                            beginDrag(card, 'pointer', event.pointerId, null, event.clientX, event.clientY);
                            moveDrag(event.clientX, event.clientY);
                        }, { passive: false });
                    }
                });

                container.__tierCleanup = () => {
                    cleanupFns.forEach((cleanup) => {
                        try { cleanup(); } catch (_error) {}
                    });
                    cleanupFns.length = 0;
                    TierListUI.clearDropTargets(container);
                    getCards().forEach((card) => {
                        card.classList.remove('is-dragging', 'tier-draggable');
                        card.style.pointerEvents = '';
                    });
                    activeCard = null;
                    activeMode = null;
                    activePointerId = null;
                    activeTouchId = null;
                    clearPendingDrag();
                    document.body.classList.remove('tier-drag-active');
                };

                TierListUI.refreshRankPills(container);
            }
            function setEditMediaListModalMode(config, isCreate = false) {
                const titleEl = document.getElementById('editMediaListModalTitle');
                const submitBtn = document.querySelector('#editMediaListForm button[type="submit"]');
                if (titleEl) {
                    titleEl.textContent = isCreate
                        ? `Create ${config.label} List`
                        : `Edit ${config.label} List`;
                }
                if (submitBtn) {
                    submitBtn.textContent = isCreate ? 'Create List' : 'Save Changes';
                }
            }

            function setEditMediaListIcon(iconKey) {
                const selected = normalizeIconKey(iconKey, editingMediaList?.fallback || 'list');
                const hiddenInput = document.getElementById('editMediaListSelectedIcon');
                if (hiddenInput) hiddenInput.value = selected;
                document.querySelectorAll('.edit-list-icon-option').forEach(option => {
                    option.classList.toggle('selected', option.getAttribute('data-icon') === selected);
                });
            }

            function setEditMediaCollaboratorsVisibility(visible) {
                const group = document.getElementById('editMediaCollaboratorsGroup');
                if (!group) return;
                group.classList.toggle('d-none', !visible);
            }

            function renderEditMediaCollaborators() {
                const container = document.getElementById('editMediaCollaboratorsList');
                if (!container) return;
                const canManage = !!editingMediaList?.canManageCollaborators;
                if (!editingMediaCollaborators.length) {
                    container.innerHTML = '<span class="text-muted text-sm">No collaborators yet.</span>';
                    return;
                }
                container.innerHTML = editingMediaCollaborators.map((collab) => {
                    const displayName = escapeHtml(collab.full_name || collab.username || 'User');
                    const username = escapeHtml(collab.username || '');
                    const safeId = String(collab.collaborator_id || '').replace(/'/g, "\\'");
                    const removeBtn = canManage
                        ? `<button type="button" class="collab-chip-remove" onclick="ProfileManager.removeMediaListCollaborator('${safeId}')" title="Remove collaborator"><i class="fas fa-times"></i></button>`
                        : '';
                    return `
                        <span class="collab-chip">
                            <i class="fas fa-user"></i>
                            ${displayName}${username ? ` (@${username})` : ''}
                            ${removeBtn}
                        </span>
                    `;
                }).join('');
            }

            async function loadEditMediaCollaborators(contentType, listId) {
                const safeType = String(contentType || '').trim().toLowerCase();
                const safeListId = String(listId || '').trim();
                editingMediaCollaborators = [];
                if (!safeType || !safeListId) {
                    renderEditMediaCollaborators();
                    return;
                }

                const { data: links, error } = await supabase
                    .from(LIST_COLLAB_TABLE)
                    .select('collaborator_id, can_edit, created_at')
                    .eq('media_type', safeType)
                    .eq('list_id', safeListId)
                    .order('created_at', { ascending: true });

                if (error) {
                    if (String(error?.code || '').trim() !== '42P01') {
                        console.error('Error loading collaborators:', error);
                    }
                    renderEditMediaCollaborators();
                    return;
                }

                const collaboratorIds = [...new Set((links || [])
                    .map((row) => String(row.collaborator_id || '').trim())
                    .filter(Boolean))];
                if (!collaboratorIds.length) {
                    renderEditMediaCollaborators();
                    return;
                }

                const { data: users } = await supabase
                    .from('user_profiles')
                    .select('id, username, full_name')
                    .in('id', collaboratorIds);
                const byId = new Map();
                (users || []).forEach((user) => byId.set(String(user.id || '').trim(), user));

                editingMediaCollaborators = (links || []).map((row) => {
                    const collaboratorId = String(row.collaborator_id || '').trim();
                    const profile = byId.get(collaboratorId) || {};
                    return {
                        collaborator_id: collaboratorId,
                        can_edit: !!row.can_edit,
                        username: profile.username || '',
                        full_name: profile.full_name || ''
                    };
                });
                renderEditMediaCollaborators();
            }

            async function openMediaListCreator(type) {
                if (!supabase || !currentUser || !isViewingOwnProfile) {
                    showToast('You cannot create lists for other users', 'error');
                    return;
                }
                const config = getMediaListConfig(type);
                if (!config) return;

                editingMediaList = {
                    type,
                    id: null,
                    table: config.table,
                    fallback: config.fallback,
                    label: config.label,
                    rerender: config.rerender,
                    isCreate: true,
                    listKind: 'standard',
                    maxRank: null,
                    ownerUserId: String(currentUser?.id || '').trim(),
                    canManageCollaborators: false
                };
                editingMediaCollaborators = [];
                setEditMediaCollaboratorsVisibility(false);
                renderEditMediaCollaborators();

                const nameInput = document.getElementById('editMediaListName');
                if (nameInput) nameInput.value = '';
                setEditMediaListIcon(config.fallback);
                setEditMediaListModalMode(config, true);
                showModal('editMediaListModal');
                const editModal = document.getElementById('editMediaListModal');
                if (window.ListUtils && editModal) {
                    ListUtils.setTierCreateState(editModal, { listKind: 'standard', maxRank: null });
                }
            }

            async function openMediaListEditor(type, listId, existing = null) {
                if (!supabase || !currentUser || !isViewingOwnProfile) return;
                const config = getMediaListConfig(type);
                if (!config) return;

                let record = existing;
                if (!record) {
                    let { data, error } = await supabase
                        .from(config.table)
                        .select('id, user_id, title, icon, list_kind')
                        .eq('id', listId)
                        .single();
                    const message = String(error?.message || '').toLowerCase();
                    const details = String(error?.details || '').toLowerCase();
                    const missingListKindColumn = !!error && (
                        error.code === '42703' ||
                        message.includes('list_kind') ||
                        details.includes('list_kind')
                    );
                    if (missingListKindColumn) {
                        ({ data, error } = await supabase
                            .from(config.table)
                            .select('id, user_id, title, icon')
                            .eq('id', listId)
                            .single());
                    }
                    if (error || !data) {
                        showToast('Could not load list', 'error');
                        return;
                    }
                    record = data;
                }

                if (!canEditCustomCollection(type, listId, record)) {
                    await ensureCollaborativeAccessForList(type, record);
                }

                if (!canEditCustomCollection(type, listId, record)) {
                    showToast('You do not have permission to edit this list', 'warning');
                    return;
                }

                editingMediaList = {
                    type,
                    id: listId,
                    table: config.table,
                    fallback: config.fallback,
                    label: config.label,
                    rerender: config.rerender,
                    isCreate: false,
                    listKind: getTierMetaForList(type, record, 0).listKind,
                    maxRank: getTierMetaForList(type, record, 0).maxRank,
                    ownerUserId: String(record?.user_id || currentUser?.id || '').trim(),
                    canManageCollaborators: String(record?.user_id || '').trim() === String(currentUser?.id || '').trim()
                };

                const nameInput = document.getElementById('editMediaListName');
                if (nameInput) nameInput.value = record.title || '';
                setEditMediaListIcon(config.fallback);
                setEditMediaListModalMode(config, false);
                showModal('editMediaListModal');
                const editModal = document.getElementById('editMediaListModal');
                if (window.ListUtils && editModal) {
                    const tierMeta = getTierMetaForList(type, record, 0);
                    ListUtils.setTierCreateState(editModal, {
                        listKind: tierMeta.listKind,
                        maxRank: tierMeta.maxRank
                    });
                }

                setEditMediaCollaboratorsVisibility(!!editingMediaList.canManageCollaborators);
                await loadEditMediaCollaborators(type, listId);
            }

            async function addMediaListCollaborator() {
                if (!editingMediaList?.id || !editingMediaList?.type) return;
                if (!editingMediaList.canManageCollaborators) {
                    showToast('Only the list owner can add collaborators', 'warning');
                    return;
                }

                const input = document.getElementById('editMediaCollaboratorUsername');
                const rawUsername = String(input?.value || '').trim().replace(/^@+/, '');
                if (!rawUsername) {
                    showToast('Enter a username', 'warning');
                    return;
                }

                try {
                    let { data: user, error } = await supabase
                        .from('user_profiles')
                        .select('id, username, full_name')
                        .eq('username', rawUsername)
                        .maybeSingle();
                    if (!user && !error) {
                        ({ data: user, error } = await supabase
                            .from('user_profiles')
                            .select('id, username, full_name')
                            .ilike('username', rawUsername)
                            .limit(1)
                            .maybeSingle());
                    }
                    if (error || !user?.id) {
                        showToast('User not found', 'error');
                        return;
                    }

                    const collaboratorId = String(user.id || '').trim();
                    const ownerId = String(editingMediaList.ownerUserId || currentUser?.id || '').trim();
                    if (!collaboratorId || !ownerId) return;
                    if (collaboratorId === ownerId) {
                        showToast('Owner is already in the list', 'info');
                        return;
                    }

                    const hasMutualFollow = await checkMutualFollow(ownerId, collaboratorId);
                    if (!hasMutualFollow) {
                        showToast('You can only add collaborators when both users follow each other', 'warning');
                        return;
                    }

                    const exists = editingMediaCollaborators.some(
                        (row) => String(row.collaborator_id || '').trim() === collaboratorId
                    );
                    if (exists) {
                        showToast('User is already a collaborator', 'info');
                        return;
                    }

                    const payload = {
                        media_type: editingMediaList.type,
                        list_id: editingMediaList.id,
                        list_owner_id: ownerId,
                        collaborator_id: collaboratorId,
                        can_edit: true
                    };

                    const { error: upsertError } = await supabase
                        .from(LIST_COLLAB_TABLE)
                        .upsert(payload, { onConflict: 'media_type,list_id,collaborator_id' });
                    if (upsertError) {
                        if (String(upsertError?.code || '').trim() === '42P01') {
                            showToast('Run SQL migration for collaborative lists first', 'warning');
                            return;
                        }
                        if (String(upsertError?.code || '').trim() === '42501') {
                            showToast('Collaboration requires mutual follow between both users', 'warning');
                            return;
                        }
                        throw upsertError;
                    }

                    if (input) input.value = '';
                    await loadEditMediaCollaborators(editingMediaList.type, editingMediaList.id);
                    showToast('Collaborator added', 'success');
                } catch (error) {
                    console.error('Error adding collaborator:', error);
                    showToast('Could not add collaborator', 'error');
                }
            }

            async function removeMediaListCollaborator(collaboratorId) {
                if (!editingMediaList?.id || !editingMediaList?.type) return;
                if (!editingMediaList.canManageCollaborators) {
                    showToast('Only the list owner can remove collaborators', 'warning');
                    return;
                }
                const safeCollaboratorId = String(collaboratorId || '').trim();
                if (!safeCollaboratorId) return;

                try {
                    const { error } = await supabase
                        .from(LIST_COLLAB_TABLE)
                        .delete()
                        .eq('media_type', editingMediaList.type)
                        .eq('list_id', editingMediaList.id)
                        .eq('collaborator_id', safeCollaboratorId);
                    if (error) throw error;

                    editingMediaCollaborators = editingMediaCollaborators.filter(
                        (row) => String(row.collaborator_id || '').trim() !== safeCollaboratorId
                    );
                    renderEditMediaCollaborators();
                    showToast('Collaborator removed', 'success');
                } catch (error) {
                    console.error('Error removing collaborator:', error);
                    showToast('Could not remove collaborator', 'error');
                }
            }

            async function createMediaListRecord(context, title, icon, listKind = 'standard', maxRank = null) {
                const trimmedTitle = String(title || '').trim();
                const normalizedTitle = trimmedTitle.toLowerCase();
                const reservedTitles = getReservedMediaListTitles(context.type);
                if (reservedTitles.has(normalizedTitle)) {
                    showToast('That name is reserved for a default list', 'warning');
                    return null;
                }

                const { data: existingLists, error: existingError } = await supabase
                    .from(context.table)
                    .select('id,title')
                    .eq('user_id', currentUser.id);
                if (existingError) {
                    showToast('Could not verify existing lists', 'error');
                    return null;
                }

                const alreadyExists = (existingLists || []).some((list) =>
                    String(list.title || '').trim().toLowerCase() === normalizedTitle
                );
                if (alreadyExists) {
                    showToast('A list with this name already exists', 'warning');
                    return null;
                }

                const normalizedKind = window.ListUtils
                    ? ListUtils.normalizeListKindValue(listKind, 'standard')
                    : (String(listKind || '').toLowerCase() === 'tier' ? 'tier' : 'standard');
                const normalizedMaxRank = window.ListUtils
                    ? ListUtils.normalizeTierMaxRank(maxRank)
                    : null;
                const dbListKind = normalizedKind === 'tier' ? 'tier' : context.type;

                const insertBase = {
                    user_id: currentUser.id,
                    title: trimmedTitle,
                    icon,
                    list_kind: dbListKind,
                    created_at: new Date().toISOString()
                };

                const insertRow = async (payload, includeListKind = true) => supabase
                    .from(context.table)
                    .insert(payload)
                    .select(includeListKind ? 'id,title,icon,list_kind' : 'id,title,icon')
                    .single();

                const hasListKindColumnError = (error) => {
                    const message = String(error?.message || '').toLowerCase();
                    const details = String(error?.details || '').toLowerCase();
                    return !!error && (
                        error.code === '42703' ||
                        message.includes('list_kind') ||
                        details.includes('list_kind')
                    );
                };

                let insertPayload = { ...insertBase };
                let { data: createdList, error: insertError } = await insertRow(insertPayload, true);

                if (hasListKindColumnError(insertError)) {
                    delete insertPayload.list_kind;
                    ({ data: createdList, error: insertError } = await insertRow(insertPayload, false));
                }

                if (insertError) {
                    insertPayload = {
                        ...insertPayload,
                        id: (window.crypto && typeof window.crypto.randomUUID === 'function')
                            ? window.crypto.randomUUID()
                            : `${Date.now()}-${Math.random().toString(16).slice(2)}`
                    };
                    ({ data: createdList, error: insertError } = await insertRow(insertPayload, true));

                    if (hasListKindColumnError(insertError)) {
                        const fallbackPayload = { ...insertPayload };
                        delete fallbackPayload.list_kind;
                        ({ data: createdList, error: insertError } = await insertRow(fallbackPayload, false));
                    }
                }

                if (insertError || !createdList) {
                    showToast(`Could not create ${context.label.toLowerCase()} list`, 'error');
                    return null;
                }

                if (window.ListUtils && createdList.id && typeof ListUtils.setListMeta === 'function') {
                    ListUtils.setListMeta(context.type, createdList.id, {
                        listKind: normalizedKind,
                        maxRank: normalizedMaxRank
                    }, {
                        client: supabase,
                        userId: currentUser?.id
                    });
                    if (typeof ListUtils.applyListMeta === 'function') {
                        createdList = ListUtils.applyListMeta(context.type, createdList);
                    }
                }

                showToast(`${context.label} list "${trimmedTitle}" created`, 'success');
                return createdList;
            }

            async function handleEditMediaListSubmit(e) {
                e.preventDefault();
                if (!editingMediaList || !supabase || !currentUser) return;
                if (!editingMediaList.isCreate && !canEditCustomCollection(editingMediaList.type, editingMediaList.id, {
                    user_id: editingMediaList.ownerUserId
                })) {
                    showToast('You do not have permission to edit this list', 'warning');
                    return;
                }

                const nameInput = document.getElementById('editMediaListName');
                const iconInput = document.getElementById('editMediaListSelectedIcon');
                const editModal = document.getElementById('editMediaListModal');
                const title = (nameInput?.value || '').trim();
                const icon = normalizeIconKey(editingMediaList?.fallback || iconInput?.value || 'list', editingMediaList.fallback);
                const enforcedIcon = editingMediaList?.fallback || icon;
                const tierState = window.ListUtils && editModal
                    ? ListUtils.readTierCreateState(editModal)
                    : {
                        listKind: editingMediaList.listKind || 'standard',
                        maxRank: editingMediaList.maxRank || null
                    };

                if (!title) {
                    showToast('Please enter a list name', 'error');
                    return;
                }

                if (editingMediaList.isCreate || !editingMediaList.id) {
                    const created = await createMediaListRecord(
                        editingMediaList,
                        title,
                        enforcedIcon,
                        tierState.listKind,
                        tierState.maxRank
                    );
                    if (!created) return;
                    const createdContext = {
                        ...editingMediaList,
                        listKind: tierState.listKind,
                        maxRank: tierState.maxRank
                    };
                    closeModal('editMediaListModal');
                    if (window.ListUtils && editModal) {
                        ListUtils.resetTierCreateState(editModal);
                    }
                    if (typeof createdContext.rerender === 'function') {
                        await createdContext.rerender();
                    }
                    return;
                }

                const normalizedKind = window.ListUtils
                    ? ListUtils.normalizeListKindValue(tierState.listKind, 'standard')
                    : (String(tierState.listKind || '').toLowerCase() === 'tier' ? 'tier' : 'standard');
                const normalizedMaxRank = window.ListUtils
                    ? ListUtils.normalizeTierMaxRank(tierState.maxRank)
                    : null;
                const updatePayload = {
                    title,
                    icon: enforcedIcon,
                    list_kind: normalizedKind === 'tier' ? 'tier' : editingMediaList.type
                };
                const hasListKindColumnError = (error) => {
                    const message = String(error?.message || '').toLowerCase();
                    const details = String(error?.details || '').toLowerCase();
                    return !!error && (
                        error.code === '42703' ||
                        message.includes('list_kind') ||
                        details.includes('list_kind')
                    );
                };

                let { error } = await supabase
                    .from(editingMediaList.table)
                    .update(updatePayload)
                    .eq('id', editingMediaList.id);

                if (hasListKindColumnError(error)) {
                    const fallbackPayload = { title, icon };
                    ({ error } = await supabase
                        .from(editingMediaList.table)
                        .update(fallbackPayload)
                        .eq('id', editingMediaList.id));
                }

                if (error) {
                    showToast('Could not save list changes', 'error');
                    return;
                }

                if (window.ListUtils && typeof ListUtils.setListMeta === 'function') {
                    ListUtils.setListMeta(editingMediaList.type, editingMediaList.id, {
                        listKind: normalizedKind,
                        maxRank: normalizedMaxRank
                    }, {
                        client: supabase,
                        userId: currentUser?.id
                    });
                }

                const updatedContext = {
                    ...editingMediaList,
                    listKind: normalizedKind,
                    maxRank: normalizedMaxRank
                };
                closeModal('editMediaListModal');
                syncOpenCollectionDetailAfterEdit(updatedContext.type, updatedContext.id, title, icon);
                if (typeof updatedContext.rerender === 'function') {
                    await updatedContext.rerender();
                }
                showToast(`${updatedContext.label} list updated`, 'success');
            }

            function syncOpenCollectionDetailAfterEdit(type, listId, title, icon) {
                const safeTitle = title || '';
                const safeIcon = icon || 'list';
                const iconText = iconGlyph(
                    safeIcon,
                    type === 'tv'
                        ? 'tv'
                        : (type === 'anime'
                            ? 'anime'
                        : (type === 'game'
                            ? 'game'
                            : (type === 'movie'
                                ? 'movie'
                                : (type === 'music' ? 'music' : 'book'))))
                );

                if (type === 'movie') {
                    const desktopName = document.getElementById('movieDetailName');
                    const desktopIcon = document.getElementById('movieDetailIcon');
                    const mobileName = document.getElementById('mobileMovieDetailTitle');
                    if (desktopName) desktopName.textContent = safeTitle;
                    if (desktopIcon) desktopIcon.innerHTML = iconText;
                    if (mobileName) mobileName.textContent = safeTitle;
                } else if (type === 'tv') {
                    const desktopName = document.getElementById('tvDetailName');
                    const desktopIcon = document.getElementById('tvDetailIcon');
                    const mobileName = document.getElementById('mobileTvDetailTitle');
                    if (desktopName) desktopName.textContent = safeTitle;
                    if (desktopIcon) desktopIcon.innerHTML = iconText;
                    if (mobileName) mobileName.textContent = safeTitle;
                } else if (type === 'anime') {
                    const desktopName = document.getElementById('animeDetailName');
                    const desktopIcon = document.getElementById('animeDetailIcon');
                    const mobileName = document.getElementById('mobileAnimeDetailTitle');
                    if (desktopName) desktopName.textContent = safeTitle;
                    if (desktopIcon) desktopIcon.innerHTML = iconText;
                    if (mobileName) mobileName.textContent = safeTitle;
                } else if (type === 'game') {
                    const desktopName = document.getElementById('gameDetailName');
                    const desktopIcon = document.getElementById('gameDetailIcon');
                    const mobileName = document.getElementById('mobileGameDetailTitle');
                    if (desktopName) desktopName.textContent = safeTitle;
                    if (desktopIcon) desktopIcon.innerHTML = iconText;
                    if (mobileName) mobileName.textContent = safeTitle;
                } else if (type === 'book') {
                    const desktopName = document.getElementById('bookDetailName');
                    const desktopIcon = document.getElementById('bookDetailIcon');
                    const mobileName = document.getElementById('mobileBookDetailTitle');
                    if (desktopName) desktopName.textContent = safeTitle;
                    if (desktopIcon) desktopIcon.innerHTML = iconText;
                    if (mobileName) mobileName.textContent = safeTitle;
                } else if (type === 'music') {
                    const desktopName = document.getElementById('musicDetailName');
                    const desktopIcon = document.getElementById('musicDetailIcon');
                    const mobileName = document.getElementById('mobileMusicDetailTitle');
                    if (desktopName) desktopName.textContent = safeTitle;
                    if (desktopIcon) desktopIcon.innerHTML = iconText;
                    if (mobileName) mobileName.textContent = safeTitle;
                }
            }

            async function renameMovieList(listId) {
                await openMediaListEditor('movie', listId);
            }

            async function createMovieList() {
                await openMediaListCreator('movie');
            }

            async function deleteMovieList(listId) {
                if (!supabase || !currentUser || !isViewingOwnProfile) return;
                const accessRecord = await fetchCustomListAccessRecord('movie', listId);
                if (!accessRecord || !canDeleteCustomCollection('movie', listId, accessRecord)) {
                    showToast('Only the list owner can delete this list', 'warning');
                    return;
                }
                if (!confirm('Delete this movie list? This cannot be undone.')) return;
                const userId = currentUser.id;
                await supabase
                    .from('movie_list_items')
                    .delete()
                    .eq('user_id', userId)
                    .eq('list_id', listId);
                const { error } = await supabase
                    .from('movie_lists')
                    .delete()
                    .eq('id', listId)
                    .eq('user_id', userId);
                if (error) {
                    showToast('Could not delete list', 'error');
                    return;
                }
                hideMovieDetail();
                await renderMovies();
                showToast('List deleted', 'success');
            }

            async function renameTvList(listId) {
                await openMediaListEditor('tv', listId);
            }

            async function createTvList() {
                await openMediaListCreator('tv');
            }

            async function deleteTvList(listId) {
                if (!supabase || !currentUser || !isViewingOwnProfile) return;
                const accessRecord = await fetchCustomListAccessRecord('tv', listId);
                if (!accessRecord || !canDeleteCustomCollection('tv', listId, accessRecord)) {
                    showToast('Only the list owner can delete this list', 'warning');
                    return;
                }
                if (!confirm('Delete this TV show list? This cannot be undone.')) return;
                const userId = currentUser.id;
                await supabase
                    .from('tv_list_items')
                    .delete()
                    .eq('user_id', userId)
                    .eq('list_id', listId);
                const { error } = await supabase
                    .from('tv_lists')
                    .delete()
                    .eq('id', listId)
                    .eq('user_id', userId);
                if (error) {
                    showToast('Could not delete list', 'error');
                    return;
                }
                hideTvDetail();
                await renderTvShows();
                showToast('List deleted', 'success');
            }

            async function renameAnimeList(listId) {
                await openMediaListEditor('anime', listId);
            }

            async function createAnimeList() {
                await openMediaListCreator('anime');
            }

            async function deleteAnimeList(listId) {
                if (!supabase || !currentUser || !isViewingOwnProfile) return;
                const accessRecord = await fetchCustomListAccessRecord('anime', listId);
                if (!accessRecord || !canDeleteCustomCollection('anime', listId, accessRecord)) {
                    showToast('Only the list owner can delete this list', 'warning');
                    return;
                }
                if (!confirm('Delete this anime list? This cannot be undone.')) return;
                const userId = currentUser.id;
                await supabase
                    .from('anime_list_items')
                    .delete()
                    .eq('user_id', userId)
                    .eq('list_id', listId);
                const { error } = await supabase
                    .from('anime_lists')
                    .delete()
                    .eq('id', listId)
                    .eq('user_id', userId);
                if (error) {
                    showToast('Could not delete list', 'error');
                    return;
                }
                hideAnimeDetail();
                await renderAnimeShows();
                showToast('List deleted', 'success');
            }

            async function renameGameList(listId) {
                await openMediaListEditor('game', listId);
            }

            async function createGameList() {
                await openMediaListCreator('game');
            }

            async function deleteGameList(listId) {
                if (!supabase || !currentUser || !isViewingOwnProfile) return;
                const accessRecord = await fetchCustomListAccessRecord('game', listId);
                if (!accessRecord || !canDeleteCustomCollection('game', listId, accessRecord)) {
                    showToast('Only the list owner can delete this list', 'warning');
                    return;
                }
                if (!confirm('Delete this game list? This cannot be undone.')) return;
                const userId = currentUser.id;
                await supabase
                    .from('game_list_items')
                    .delete()
                    .eq('user_id', userId)
                    .eq('list_id', listId);
                const { error } = await supabase
                    .from('game_lists')
                    .delete()
                    .eq('id', listId)
                    .eq('user_id', userId);
                if (error) {
                    showToast('Could not delete list', 'error');
                    return;
                }
                hideGameDetail();
                await renderGames();
                showToast('List deleted', 'success');
            }

            function scrollActiveMobileTabIntoView(tabName) {
                const activeTab = document.querySelector(`.mobile-tab[data-tab="${tabName}"]`);
                if (!activeTab) return;
                activeTab.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'center'
                });
            }

            function normalizeProfileTab(tabName) {
                const safeTab = String(tabName || '').trim().toLowerCase();
                return VALID_PROFILE_TABS.has(safeTab) ? safeTab : DEFAULT_PROFILE_TAB;
            }

            function resetDetailPanels() {
                const desktopPairs = [
                    ['restaurants-tab', 'restaurant-detail-view'],
                    ['movies-tab', 'movie-detail-view'],
                    ['tv-tab', 'tv-detail-view'],
                    ['anime-tab', 'anime-detail-view'],
                    ['games-tab', 'game-detail-view'],
                    ['books-tab', 'book-detail-view'],
                    ['music-tab', 'music-detail-view'],
                    ['travel-tab', 'travel-detail-view'],
                    ['fashion-tab', 'fashion-detail-view'],
                    ['food-tab', 'food-detail-view'],
                    ['cars-tab', 'cars-detail-view']
                ];
                desktopPairs.forEach(([mainId, detailId]) => {
                    const main = document.getElementById(mainId);
                    const detail = document.getElementById(detailId);
                    if (main) main.style.display = '';
                    if (detail) {
                        detail.style.display = 'none';
                        detail.classList.remove('active');
                    }
                });

                const mobileConfigs = [
                    { main: 'mobileRestaurantsSection', detail: 'mobileRestaurantDetailSection', grid: 'mobileRestaurantsGrid' },
                    { main: 'mobileMoviesSection', detail: 'mobileMovieDetailSection', grid: 'mobileMoviesGrid' },
                    { main: 'mobileTvSection', detail: 'mobileTvDetailSection', grid: 'mobileTvGrid' },
                    { main: 'mobileAnimeSection', detail: 'mobileAnimeDetailSection', grid: 'mobileAnimeGrid' },
                    { main: 'mobileGamesSection', detail: 'mobileGameDetailSection', grid: 'mobileGamesGrid' },
                    { main: 'mobileBooksSection', detail: 'mobileBookDetailSection', grid: 'mobileBooksGrid' },
                    { main: 'mobileMusicSection', detail: 'mobileMusicDetailSection', grid: 'mobileMusicGrid' },
                    { main: 'mobileTravelSection', detail: 'mobileTravelDetailSection', grid: 'mobileTravelGrid' },
                    { main: 'mobileFashionSection', detail: 'mobileFashionDetailSection', grid: 'mobileFashionGrid' },
                    { main: 'mobileFoodSection', detail: 'mobileFoodDetailSection', grid: 'mobileFoodGrid' },
                    { main: 'mobileCarsSection', detail: 'mobileCarsDetailSection', grid: 'mobileCarsGrid' }
                ];
                mobileConfigs.forEach((cfg) => {
                    const mainSection = document.getElementById(cfg.main);
                    const detailSection = document.getElementById(cfg.detail);
                    const grid = document.getElementById(cfg.grid);
                    if (detailSection) {
                        detailSection.style.display = 'none';
                        detailSection.classList.remove('active');
                    }
                    if (mainSection) {
                        const titleEl = mainSection.querySelector('.mobile-section-title');
                        const subtitleEl = mainSection.querySelector('.mobile-section-subtitle');
                        if (titleEl) titleEl.style.display = '';
                        if (subtitleEl) subtitleEl.style.display = '';
                        mainSection.style.display = '';
                    }
                    if (grid) grid.style.display = '';
                });
            }

            function requestTabRender(tabName, requestToken) {
                const safeTab = normalizeProfileTab(tabName);
                if (safeTab !== 'community' && hasFreshTabRender(safeTab)) {
                    return;
                }
                const handlers = {
                    ...(ENABLE_RESTAURANTS ? { restaurants: () => renderRestaurants() } : {}),
                    movies: () => renderMovies(),
                    ...(GAMES_DISABLED ? {} : { games: () => renderGames() }),
                    tv: () => renderTvShows(),
                    anime: () => renderAnimeShows(),
                    books: () => renderBooks(),
                    music: () => renderMusic(),
                    sports: () => renderSports(),
                    travel: () => renderTravel(),
                    fashion: () => renderFashion(),
                    food: () => renderFood(),
                    cars: () => renderCars(),
                    community: () => showCommunitySection('followers')
                };
                const handler = handlers[safeTab] || handlers[DEFAULT_PROFILE_TAB] || handlers.movies;
                Promise.resolve()
                    .then(() => handler())
                    .catch((error) => {
                        if (requestToken !== tabSwitchToken) return;
                        console.error(`Tab render failed (${safeTab}):`, error);
                        showToast('Could not load this tab right now', 'error');
                    });
            }

            function showTab(tabName, options = {}) {
                const safeTab = normalizeProfileTab(tabName);
                const requestToken = ++tabSwitchToken;
                const isMobile = window.innerWidth <= 768;
                const alreadyActive = isMobile
                    ? !!document.querySelector(`.mobile-tab[data-tab="${safeTab}"]`)?.classList.contains('active')
                    : !!document.querySelector(`.nav-tab[data-tab="${safeTab}"]`)?.classList.contains('active');
                if (safeTab === currentTab && alreadyActive) return;

                resetDetailPanels();
                currentMediaDetail = null;

                if (!options.skipPrimarySync) {
                    if (safeTab === 'community') {
                        showPrimaryTab('activity', { skipTabSync: true });
                    } else {
                        showPrimaryTab('lists', { skipTabSync: true });
                    }
                }

                if (safeTab !== 'community') {
                    lastMediaTab = safeTab;
                }

                if (!options.skipUrlSync) {
                    const nextUrl = buildProfileUrl({ tab: safeTab });
                    history.replaceState({}, '', nextUrl);
                }
                
                if (isMobile) {
                    document.querySelectorAll('.mobile-section').forEach(section => {
                        section.style.display = 'none';
                        section.classList.remove('active');
                    });
                    
                    document.querySelectorAll('.mobile-tab').forEach(tab => {
                        tab.classList.remove('active');
                    });
                    closeProfileTabGroups();
                    
                    const activeSection =
                        document.getElementById(`mobile${safeTab.charAt(0).toUpperCase() + safeTab.slice(1)}Section`) ||
                        document.getElementById(`mobile${DEFAULT_PROFILE_TAB.charAt(0).toUpperCase() + DEFAULT_PROFILE_TAB.slice(1)}Section`) ||
                        document.getElementById('mobileMoviesSection');
                    if (activeSection) {
                        activeSection.style.display = 'block';
                        activeSection.classList.add('active');
                    }
                    
                    const activeTab = document.querySelector(`.mobile-tab[data-tab="${safeTab}"]`);
                    if (activeTab) {
                        activeTab.classList.add('active');
                    } else if (safeTab !== 'community') {
                        const fallbackTab = document.querySelector(`.mobile-tab[data-tab="${DEFAULT_PROFILE_TAB}"]`);
                        if (fallbackTab) fallbackTab.classList.add('active');
                    }
                    ensureProfileGroupRowVisible(safeTab);
                    scrollActiveMobileTabIntoView(safeTab);
                    const swipeHint = document.getElementById('mobileTabsSwipeHint');
                    if (swipeHint) swipeHint.classList.add('hidden');
                    
                    currentTab = safeTab;
                    if (!options.skipRender) {
                        requestTabRender(safeTab, requestToken);
                    }
                } else {
                    document.querySelectorAll('.tab-content').forEach(tab => {
                        tab.classList.remove('active');
                    });
                    
                    const tabElement =
                        document.getElementById(`${safeTab}-tab`) ||
                        document.getElementById(`${DEFAULT_PROFILE_TAB}-tab`) ||
                        document.getElementById('movies-tab');
                    if (tabElement) {
                        tabElement.classList.add('active');
                    }
                    
                    document.querySelectorAll('.nav-tab').forEach(btn => {
                        btn.classList.remove('active');
                    });
                    closeProfileTabGroups();
                    
                    const activeButton = document.querySelector(`.nav-tab[data-tab="${safeTab}"]`);
                    if (activeButton) {
                        activeButton.classList.add('active');
                    } else if (safeTab !== 'community') {
                        const fallbackButton = document.querySelector(`.nav-tab[data-tab="${DEFAULT_PROFILE_TAB}"]`);
                        if (fallbackButton) fallbackButton.classList.add('active');
                    }
                    ensureProfileGroupRowVisible(safeTab);
                    
                    currentTab = safeTab;
                    if (!options.skipRender) {
                        requestTabRender(safeTab, requestToken);
                    }
                }
            }

            // ===== UNIFIED COLLECTION RENDERING =====
            async function renderRestaurants() {
                const isMobile = window.innerWidth <= 768;
                const grid = isMobile ? document.getElementById('mobileRestaurantsGrid') : document.getElementById('restaurantsGrid');
                if (!grid) return;

                const userId = isViewingOwnProfile ? currentUser?.id : targetUserId;
                if (!userId) return;
                const renderToken = ++renderRestaurantsToken;

                try {
                    await ensurePinnedCollectionsLoaded(userId);
                    const { data: listsData, error } = await supabase
                        .from('lists')
                        .select('*')
                        .eq('user_id', userId)
                        .order('created_at', { ascending: false });

                    if (error) throw error;
                    if (renderToken !== renderRestaurantsToken) return;
                    let lists = Array.isArray(listsData) ? listsData : [];
                    if (window.ListUtils && lists.length && typeof ListUtils.hydrateListMetaForLists === 'function') {
                        lists = await ListUtils.hydrateListMetaForLists('restaurant', lists, {
                            client: supabase,
                            userId: currentUser?.id,
                            ownerUserId: userId
                        });
                    }
                    if (renderToken !== renderRestaurantsToken) return;

                    if (!lists.length) {
                        grid.innerHTML = `
                            <div class="${isMobile ? 'mobile-empty-state' : 'empty-state'}">
                                <div class="${isMobile ? 'mobile-empty-icon' : 'empty-icon'}">${iconGlyph('list')}</div>
                                <h3 class="${isMobile ? 'mobile-empty-title' : 'empty-title'}">No Collections Yet</h3>
                                <p class="${isMobile ? 'mobile-empty-description' : 'empty-description'}">Create your first collection!</p>
                                ${isViewingOwnProfile ? `
                                    <button class="${isMobile ? 'mobile-action-btn' : 'btn btn-primary mt-md'}" onclick="ProfileManager.showCreateListModal()">
                                        <i class="fas fa-plus"></i> Create Collection
                                    </button>
                                ` : ''}
                            </div>
                        `;
                        markTabRendered('restaurants');
                        return;
                    }

                    const priorityOrder = {
                        'favorites': 0,
                        'want to go': 1,
                        'want to go to': 1,
                        'visited': 2
                    };
                    const priorityIcons = {
                        'favorites': 'heart',
                        'want to go': 'bookmark',
                        'want to go to': 'bookmark',
                        'visited': 'check'
                    };

                    lists.forEach(list => {
                        const key = (list.title || '').trim().toLowerCase();
                        if (priorityIcons[key]) {
                            list.icon = priorityIcons[key];
                        }
                    });

                    lists.sort((a, b) => {
                        const aKey = (a.title || '').trim().toLowerCase();
                        const bKey = (b.title || '').trim().toLowerCase();
                        const aRank = priorityOrder[aKey] ?? 99;
                        const bRank = priorityOrder[bKey] ?? 99;
                        if (aRank !== bRank) return aRank - bRank;
                        return new Date(b.created_at) - new Date(a.created_at);
                    });
                    lists = applyPinnedListSorting('restaurant', lists);

                    const listIds = lists.map(list => list.id).filter(Boolean);
                    const { data: allListItems } = listIds.length
                        ? await supabase
                            .from('lists_restraunts')
                            .select('list_id, restraunt_id')
                            .in('list_id', listIds)
                        : { data: [] };
                    const itemsByListId = new Map();
                    (allListItems || []).forEach(item => {
                        if (!itemsByListId.has(item.list_id)) itemsByListId.set(item.list_id, []);
                        itemsByListId.get(item.list_id).push(item.restraunt_id);
                    });
                    lists.forEach(list => {
                        list.restaurantIds = itemsByListId.get(list.id) || [];
                    });

                    if (renderToken !== renderRestaurantsToken) return;
                    const cards = await Promise.all(lists.map(list => createCollectionCard(list, 'restaurant', isMobile, userId)));
                    grid.innerHTML = '';
                    const fragment = document.createDocumentFragment();
                    cards.forEach(card => fragment.appendChild(card));
                    grid.appendChild(fragment);
                    markTabRendered('restaurants');
                } catch (error) {
                    console.error('Error loading restaurants:', error);
                    grid.innerHTML = `
                        <div class="${isMobile ? 'mobile-empty-state' : 'empty-state'}">
                            <div class="${isMobile ? 'mobile-empty-icon' : 'empty-icon'}">${iconGlyph('list')}</div>
                            <h3 class="${isMobile ? 'mobile-empty-title' : 'empty-title'}">Error Loading Collections</h3>
                            <p class="${isMobile ? 'mobile-empty-description' : 'empty-description'}">Unable to load your collections</p>
                        </div>
                    `;
                }
            }

            async function renderMovies() {
                const isMobile = window.innerWidth <= 768;
                const grid = isMobile ? document.getElementById('mobileMoviesGrid') : document.getElementById('moviesGrid');
                if (!grid) return;

                const userId = isViewingOwnProfile ? currentUser?.id : targetUserId;
                if (!userId) return;
                const renderToken = ++renderMoviesToken;
                const hasCards = !!grid.querySelector('.collection-card');
                if (!hasCards) {
                    grid.innerHTML = `
                        <div class="${isMobile ? 'mobile-empty-state' : 'empty-state'} loading">
                            <div class="${isMobile ? 'mobile-empty-icon' : 'empty-icon'}">${iconGlyph('movie')}</div>
                            <h3 class="${isMobile ? 'mobile-empty-title' : 'empty-title'}">Loading Movies...</h3>
                            <p class="${isMobile ? 'mobile-empty-description' : 'empty-description'}">Syncing your collections.</p>
                        </div>
                    `;
                }

                try {
                    const [_, loadedCustomLists] = await Promise.all([
                        ensurePinnedCollectionsLoaded(userId),
                        loadCollaborativeCustomLists('movie', userId)
                    ]);
                    const defaultLists = [
                        { id: 'favorites', title: 'Favorites', icon: 'heart', description: 'Movies you love', type: 'default' },
                        { id: 'watched', title: 'Watched', icon: 'check', description: 'Movies you watched', type: 'default' },
                        { id: 'watchlist', title: 'Watchlist', icon: 'bookmark', description: 'Movies to watch', type: 'default' }
                    ];

                    let customLists = Array.isArray(loadedCustomLists) ? loadedCustomLists : [];
                    if (renderToken !== renderMoviesToken) return;
                    customLists = await hydrateListMetaByOwner('movie', customLists, userId);
                    if (renderToken !== renderMoviesToken) return;

                    const items = await loadMediaListItems('movie', userId, customLists.map((list) => list.id));

                    for (const list of defaultLists) {
                        list.movieIds = Array.from(new Set(
                            items
                                .filter((i) => i.list_type === list.id)
                                .map((i) => String(i.movie_id || '').trim())
                                .filter(Boolean)
                        ));
                    }

                    for (const list of customLists) {
                        list.movieIds = Array.from(new Set(
                            items
                                .filter((i) => String(i.list_id || '') === String(list.id || ''))
                                .map((i) => String(i.movie_id || '').trim())
                                .filter(Boolean)
                        ));
                        list.type = 'custom';
                    }

                    const allLists = applyPinnedListSorting('movie', [...defaultLists, ...customLists]);

                    if (allLists.length === 0) {
                        grid.innerHTML = `
                            <div class="${isMobile ? 'mobile-empty-state' : 'empty-state'}">
                                <div class="${isMobile ? 'mobile-empty-icon' : 'empty-icon'}">${iconGlyph('list')}</div>
                                <h3 class="${isMobile ? 'mobile-empty-title' : 'empty-title'}">No Movies Yet</h3>
                                <p class="${isMobile ? 'mobile-empty-description' : 'empty-description'}">Save movies to see them here.</p>
                                <button class="${isMobile ? 'mobile-action-btn' : 'btn btn-primary mt-md'}" onclick="window.location.href='movies.html'">
                                    <i class="fas fa-film"></i> Explore Movies
                                </button>
                            </div>
                        `;
                        markTabRendered('movies');
                        return;
                    }

                    const cards = await Promise.all(allLists.map((list) => createCollectionCard(
                        list,
                        'movie',
                        isMobile,
                        String(list?.user_id || userId || '').trim() || userId
                    )));
                    grid.innerHTML = '';
                    const fragment = document.createDocumentFragment();
                    cards.forEach(card => fragment.appendChild(card));
                    grid.appendChild(fragment);
                    markTabRendered('movies');
                } catch (error) {
                    console.error('Error loading movies:', error);
                    grid.innerHTML = `
                        <div class="${isMobile ? 'mobile-empty-state' : 'empty-state'}">
                            <div class="${isMobile ? 'mobile-empty-icon' : 'empty-icon'}">${iconGlyph('list')}</div>
                            <h3 class="${isMobile ? 'mobile-empty-title' : 'empty-title'}">Error Loading Movies</h3>
                            <p class="${isMobile ? 'mobile-empty-description' : 'empty-description'}">Unable to load your movies</p>
                        </div>
                    `;
                }
            }

            async function renderTvShows() {
                const isMobile = window.innerWidth <= 768;
                const grid = isMobile ? document.getElementById('mobileTvGrid') : document.getElementById('tvGrid');
                if (!grid) return;

                const userId = isViewingOwnProfile ? currentUser?.id : targetUserId;
                if (!userId) return;
                const renderToken = ++renderTvToken;
                const hasCards = !!grid.querySelector('.collection-card');
                if (!hasCards) {
                    grid.innerHTML = `
                        <div class="${isMobile ? 'mobile-empty-state' : 'empty-state'} loading">
                            <div class="${isMobile ? 'mobile-empty-icon' : 'empty-icon'}">${iconGlyph('tv')}</div>
                            <h3 class="${isMobile ? 'mobile-empty-title' : 'empty-title'}">Loading TV Shows...</h3>
                            <p class="${isMobile ? 'mobile-empty-description' : 'empty-description'}">Syncing your collections.</p>
                        </div>
                    `;
                }

                try {
                    const [_, loadedCustomLists] = await Promise.all([
                        ensurePinnedCollectionsLoaded(userId),
                        loadCollaborativeCustomLists('tv', userId)
                    ]);
                    const defaultLists = [
                        { id: 'favorites', title: 'Favorites', icon: 'heart', description: 'Shows you love', type: 'default' },
                        { id: 'watched', title: 'Watched', icon: 'check', description: 'Shows you watched', type: 'default' },
                        { id: 'watchlist', title: 'Watchlist', icon: 'bookmark', description: 'Shows to watch', type: 'default' }
                    ];

                    let customLists = Array.isArray(loadedCustomLists) ? loadedCustomLists : [];
                    if (renderToken !== renderTvToken) return;
                    customLists = await hydrateListMetaByOwner('tv', customLists, userId);
                    if (renderToken !== renderTvToken) return;

                    const items = await loadMediaListItems('tv', userId, customLists.map((list) => list.id));

                    for (const list of defaultLists) {
                        list.tvIds = Array.from(new Set(
                            items
                                .filter((i) => i.list_type === list.id)
                                .map((i) => String(i.tv_id || '').trim())
                                .filter(Boolean)
                        ));
                    }

                    for (const list of customLists) {
                        list.tvIds = Array.from(new Set(
                            items
                                .filter((i) => String(i.list_id || '') === String(list.id || ''))
                                .map((i) => String(i.tv_id || '').trim())
                                .filter(Boolean)
                        ));
                        list.type = 'custom';
                    }

                    const allLists = applyPinnedListSorting('tv', [...defaultLists, ...customLists]);

                    if (allLists.length === 0) {
                        grid.innerHTML = `
                            <div class="${isMobile ? 'mobile-empty-state' : 'empty-state'}">
                                <div class="${isMobile ? 'mobile-empty-icon' : 'empty-icon'}">${iconGlyph('list')}</div>
                                <h3 class="${isMobile ? 'mobile-empty-title' : 'empty-title'}">No TV Shows Yet</h3>
                                <p class="${isMobile ? 'mobile-empty-description' : 'empty-description'}">Save TV shows to see them here.</p>
                                <button class="${isMobile ? 'mobile-action-btn' : 'btn btn-primary mt-md'}" onclick="window.location.href='tvshows.html'">
                                    <i class="fas fa-tv"></i> Explore TV Shows
                                </button>
                            </div>
                        `;
                        markTabRendered('tv');
                        return;
                    }

                    const cards = await Promise.all(allLists.map((list) => createCollectionCard(
                        list,
                        'tv',
                        isMobile,
                        String(list?.user_id || userId || '').trim() || userId
                    )));
                    grid.innerHTML = '';
                    const fragment = document.createDocumentFragment();
                    cards.forEach(card => fragment.appendChild(card));
                    grid.appendChild(fragment);
                    markTabRendered('tv');
                } catch (error) {
                    console.error('Error loading TV shows:', error);
                    grid.innerHTML = `
                        <div class="${isMobile ? 'mobile-empty-state' : 'empty-state'}">
                            <div class="${isMobile ? 'mobile-empty-icon' : 'empty-icon'}">${iconGlyph('list')}</div>
                            <h3 class="${isMobile ? 'mobile-empty-title' : 'empty-title'}">Error Loading TV Shows</h3>
                            <p class="${isMobile ? 'mobile-empty-description' : 'empty-description'}">Unable to load your TV shows</p>
                        </div>
                    `;
                }
            }

            async function renderAnimeShows() {
                const isMobile = window.innerWidth <= 768;
                const grid = isMobile ? document.getElementById('mobileAnimeGrid') : document.getElementById('animeGrid');
                if (!grid) return;

                const userId = isViewingOwnProfile ? currentUser?.id : targetUserId;
                if (!userId) return;
                const renderToken = ++renderAnimeToken;
                const hasCards = !!grid.querySelector('.collection-card');
                if (!hasCards) {
                    grid.innerHTML = `
                        <div class="${isMobile ? 'mobile-empty-state' : 'empty-state'} loading">
                            <div class="${isMobile ? 'mobile-empty-icon' : 'empty-icon'}">${iconGlyph('anime')}</div>
                            <h3 class="${isMobile ? 'mobile-empty-title' : 'empty-title'}">Loading Anime...</h3>
                            <p class="${isMobile ? 'mobile-empty-description' : 'empty-description'}">Syncing your collections.</p>
                        </div>
                    `;
                }

                try {
                    const [_, loadedCustomLists] = await Promise.all([
                        ensurePinnedCollectionsLoaded(userId),
                        loadCollaborativeCustomLists('anime', userId)
                    ]);
                    const defaultLists = [
                        { id: 'favorites', title: 'Favorites', icon: 'heart', description: 'Anime you love', type: 'default' },
                        { id: 'watched', title: 'Watched', icon: 'check', description: 'Anime you watched', type: 'default' },
                        { id: 'watchlist', title: 'Watchlist', icon: 'bookmark', description: 'Anime to watch', type: 'default' }
                    ];

                    let customLists = Array.isArray(loadedCustomLists) ? loadedCustomLists : [];
                    if (renderToken !== renderAnimeToken) return;
                    customLists = await hydrateListMetaByOwner('anime', customLists, userId);
                    if (renderToken !== renderAnimeToken) return;

                    const items = await loadMediaListItems('anime', userId, customLists.map((list) => list.id));

                    for (const list of defaultLists) {
                        list.animeIds = Array.from(new Set(
                            items
                                .filter((i) => i.list_type === list.id)
                                .map((i) => String(i.anime_id || '').trim())
                                .filter(Boolean)
                        ));
                    }

                    for (const list of customLists) {
                        list.animeIds = Array.from(new Set(
                            items
                                .filter((i) => String(i.list_id || '') === String(list.id || ''))
                                .map((i) => String(i.anime_id || '').trim())
                                .filter(Boolean)
                        ));
                        list.type = 'custom';
                    }

                    const allLists = applyPinnedListSorting('anime', [...defaultLists, ...customLists]);

                    if (allLists.length === 0) {
                        grid.innerHTML = `
                            <div class="${isMobile ? 'mobile-empty-state' : 'empty-state'}">
                                <div class="${isMobile ? 'mobile-empty-icon' : 'empty-icon'}">${iconGlyph('list')}</div>
                                <h3 class="${isMobile ? 'mobile-empty-title' : 'empty-title'}">No Anime Yet</h3>
                                <p class="${isMobile ? 'mobile-empty-description' : 'empty-description'}">Save anime to see it here.</p>
                                <button class="${isMobile ? 'mobile-action-btn' : 'btn btn-primary mt-md'}" onclick="window.location.href='animes.html'">
                                    <i class="fas fa-dragon"></i> Explore Anime
                                </button>
                            </div>
                        `;
                        markTabRendered('anime');
                        return;
                    }

                    const cards = await Promise.all(allLists.map((list) => createCollectionCard(
                        list,
                        'anime',
                        isMobile,
                        String(list?.user_id || userId || '').trim() || userId
                    )));
                    grid.innerHTML = '';
                    const fragment = document.createDocumentFragment();
                    cards.forEach(card => fragment.appendChild(card));
                    grid.appendChild(fragment);
                    markTabRendered('anime');
                } catch (error) {
                    console.error('Error loading anime:', error);
                    grid.innerHTML = `
                        <div class="${isMobile ? 'mobile-empty-state' : 'empty-state'}">
                            <div class="${isMobile ? 'mobile-empty-icon' : 'empty-icon'}">${iconGlyph('list')}</div>
                            <h3 class="${isMobile ? 'mobile-empty-title' : 'empty-title'}">Error Loading Anime</h3>
                            <p class="${isMobile ? 'mobile-empty-description' : 'empty-description'}">Unable to load your anime</p>
                        </div>
                    `;
                }
            }

            async function renderGames() {
                if (GAMES_DISABLED) {
                    markTabRendered('games');
                    return;
                }
                const isMobile = window.innerWidth <= 768;
                const grid = isMobile ? document.getElementById('mobileGamesGrid') : document.getElementById('gamesGrid');
                if (!grid) return;

                const userId = isViewingOwnProfile ? currentUser?.id : targetUserId;
                if (!userId) return;
                const renderToken = ++renderGamesToken;

                try {
                    await ensurePinnedCollectionsLoaded(userId);
                    const defaultLists = [
                        { id: 'favorites', title: 'Favorites', icon: 'heart', description: 'Games you love', type: 'default' },
                        { id: 'watched', title: 'Played', icon: 'check', description: 'Games you played', type: 'default' },
                        { id: 'watchlist', title: 'Backlog', icon: 'bookmark', description: 'Games to play', type: 'default' }
                    ];

                    let customLists = await loadCollaborativeCustomLists('game', userId);
                    if (renderToken !== renderGamesToken) return;
                    customLists = await hydrateListMetaByOwner('game', customLists, userId);
                    if (renderToken !== renderGamesToken) return;

                    const items = await loadMediaListItems('game', userId, customLists.map((list) => list.id));

                    for (const list of defaultLists) {
                        list.gameIds = Array.from(new Set(
                            items
                                .filter(i => i.list_type === list.id)
                                .map(i => i.game_id)
                                .filter((id) => String(id || '').trim() !== '')
                        ));
                    }

                    for (const list of customLists) {
                        list.gameIds = Array.from(new Set(
                            items
                                .filter(i => String(i.list_id || '') === String(list.id || ''))
                                .map(i => i.game_id)
                                .filter((id) => String(id || '').trim() !== '')
                        ));
                        list.type = 'custom';
                    }

                    const allLists = applyPinnedListSorting('game', [...defaultLists, ...customLists]);

                    if (allLists.length === 0) {
                        grid.innerHTML = `
                            <div class="${isMobile ? 'mobile-empty-state' : 'empty-state'}">
                                <div class="${isMobile ? 'mobile-empty-icon' : 'empty-icon'}">${iconGlyph('list')}</div>
                                <h3 class="${isMobile ? 'mobile-empty-title' : 'empty-title'}">No Games Yet</h3>
                                <p class="${isMobile ? 'mobile-empty-description' : 'empty-description'}">Save games to see them here.</p>
                                <button class="${isMobile ? 'mobile-action-btn' : 'btn btn-primary mt-md'}" onclick="window.location.href='games.html'">
                                    <i class="fas fa-gamepad"></i> Explore Games
                                </button>
                            </div>
                        `;
                        markTabRendered('games');
                        return;
                    }

                    const cards = await Promise.all(allLists.map((list) => createCollectionCard(
                        list,
                        'game',
                        isMobile,
                        String(list?.user_id || userId || '').trim() || userId
                    )));
                    grid.innerHTML = '';
                    const fragment = document.createDocumentFragment();
                    cards.forEach(card => fragment.appendChild(card));
                    grid.appendChild(fragment);
                    markTabRendered('games');
                } catch (error) {
                    console.error('Error loading games:', error);
                    grid.innerHTML = `
                        <div class="${isMobile ? 'mobile-empty-state' : 'empty-state'}">
                            <div class="${isMobile ? 'mobile-empty-icon' : 'empty-icon'}">${iconGlyph('list')}</div>
                            <h3 class="${isMobile ? 'mobile-empty-title' : 'empty-title'}">Error Loading Games</h3>
                            <p class="${isMobile ? 'mobile-empty-description' : 'empty-description'}">Unable to load your games</p>
                        </div>
                    `;
                }
            }

            async function fetchBookDetails(bookId) {
                if (bookCache.has(bookId)) return bookCache.get(bookId);
                try {
                    const normalizedId = String(bookId || '').replace(/^\/works\//i, '').trim();
                    if (!normalizedId || !/^[A-Za-z0-9]+W$/.test(normalizedId)) return null;
                    const path = `/works/${encodeURIComponent(normalizedId)}.json`;
                    const requestTargets = [
                        `${OPEN_LIBRARY_PROXY_BASE}${path}`,
                        `${OPEN_LIBRARY_BASE}${path}`
                    ];
                    let data = null;
                    for (const target of requestTargets) {
                        for (let attempt = 0; attempt < 4; attempt += 1) {
                            const controller = new AbortController();
                            const timeoutId = setTimeout(() => controller.abort(), 7000 + (attempt * 1000));
                            try {
                                const res = await fetch(target, { signal: controller.signal, headers: { Accept: 'application/json' } });
                                clearTimeout(timeoutId);
                                if (res.ok) {
                                    data = await res.json();
                                    break;
                                }
                                const retryable = res.status === 429 || res.status >= 500;
                                if (!retryable) break;
                            } catch (_error) {
                                clearTimeout(timeoutId);
                            }
                            if (attempt < 3) {
                                await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
                            }
                        }
                        if (data) break;
                    }
                    if (!data) return null;
                    bookCache.set(bookId, data);
                    return data;
                } catch (error) {
                    console.error('Error fetching book details:', error);
                    return null;
                }
            }

            function normalizeBookImageUrl(url) {
                if (!url) return null;
                let safe = String(url).trim();
                if (safe.startsWith('//')) safe = `https:${safe}`;
                if (safe.startsWith('http:')) safe = safe.replace(/^http:/i, 'https:');
                return safe;
            }

            function getBestBookIdentifier(book) {
                const isbnFromArray = Array.isArray(book?.isbn) ? String(book.isbn[0] || '').trim() : '';
                if (isbnFromArray) return { type: 'isbn', value: isbnFromArray };
                const identifiers = book?.identifiers || {};
                const isbn13 = Array.isArray(identifiers.isbn_13) ? String(identifiers.isbn_13[0] || '').trim() : '';
                if (isbn13) return { type: 'isbn', value: isbn13 };
                const isbn10 = Array.isArray(identifiers.isbn_10) ? String(identifiers.isbn_10[0] || '').trim() : '';
                if (isbn10) return { type: 'isbn', value: isbn10 };
                return null;
            }

            function getOpenLibraryBookFallback(book) {
                const best = getBestBookIdentifier(book);
                if (!best) return null;
                return `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(best.value)}-L.jpg`;
            }

            function getBookThumbnail(book) {
                const coverId = Number(book?.cover_i || (Array.isArray(book?.covers) ? book.covers[0] : 0) || 0);
                const coverById = coverId ? `https://covers.openlibrary.org/b/id/${encodeURIComponent(String(coverId))}-L.jpg` : '';
                const fallbackCover = getOpenLibraryBookFallback(book);
                return normalizeBookImageUrl(coverById) || normalizeBookImageUrl(fallbackCover) || FALLBACK_BOOK_IMAGE;
            }

            async function fetchGoogleBookVolume(volumeId) {
                const cleanId = String(volumeId || '').trim();
                if (!cleanId || cleanId.startsWith('search-')) return null;
                try {
                    const volumeUrl = new URL(`${GOOGLE_BOOKS_PROXY_BASE}/volumes/${encodeURIComponent(cleanId)}`, window.location.origin);
                    volumeUrl.searchParams.set('cb', BOOKS_CACHE_BUSTER);
                    volumeUrl.searchParams.set('_', String(Date.now()));
                    const res = await fetch(volumeUrl.toString(), { headers: { Accept: 'application/json' }, cache: 'no-store' });
                    if (!res.ok) return null;
                    const json = await res.json();
                    const info = json?.volumeInfo || {};
                    const title = String(info?.title || '').trim();
                    if (!title) return null;
                    const authors = Array.isArray(info?.authors) ? info.authors.filter(Boolean).map((name) => String(name).trim()) : [];
                    const publisher = String(info?.publisher || '').trim();
                    const thumbnail = normalizeBookImageUrl(info?.imageLinks?.thumbnail || info?.imageLinks?.smallThumbnail || '') || FALLBACK_BOOK_IMAGE;
                    return {
                        id: cleanId,
                        title,
                        authors: authors.join(', '),
                        published_date: String(info?.publishedDate || '').trim(),
                        thumbnail,
                        publisher
                    };
                } catch (_err) {
                    return null;
                }
            }

            async function resolveProfileBookRecord(bookId) {
                const safeId = String(bookId || '').trim();
                if (!safeId) return null;
                const workDetails = await fetchBookDetails(safeId);
                if (workDetails) {
                    const author = Array.isArray(workDetails?.authors) ? String(workDetails.authors[0] || '').trim() : '';
                    return {
                        id: safeId,
                        title: String(workDetails?.title || '').trim() || `Book ${safeId}`,
                        authors: author,
                        published_date: String(workDetails?.first_publish_date || workDetails?.publishedDate || '').trim(),
                        thumbnail: getBookThumbnail(workDetails),
                        publisher: ''
                    };
                }
                return await fetchGoogleBookVolume(safeId);
            }

            async function renderBooks() {
                const isMobile = window.innerWidth <= 768;
                const grid = isMobile ? document.getElementById('mobileBooksGrid') : document.getElementById('booksGrid');
                if (!grid) return;

                const userId = isViewingOwnProfile ? currentUser?.id : targetUserId;
                if (!userId) return;
                const renderToken = ++renderBooksToken;

                try {
                    await ensurePinnedCollectionsLoaded(userId);
                    const defaultLists = [
                        { id: 'favorites', title: 'Favorites', icon: 'heart', description: 'Books you love', type: 'default' },
                        { id: 'read', title: 'Read', icon: 'check', description: 'Books you finished', type: 'default' },
                        { id: 'readlist', title: 'Readlist', icon: 'bookmark', description: 'Books to read', type: 'default' }
                    ];

                    let customLists = await loadCollaborativeCustomLists('book', userId);
                    const allItems = await loadMediaListItems('book', userId, customLists.map((list) => list.id));

                    if (renderToken !== renderBooksToken) return;

                    const reservedTitles = new Set(['favorites', 'read', 'readlist']);
                    const seenCustomIds = new Set();
                    const normalizedCustomLists = [];

                    for (const raw of (customLists || [])) {
                        const id = String(raw.id || '').trim();
                        if (!id || seenCustomIds.has(id)) continue;

                        const titleNorm = String(raw.title || '').trim().toLowerCase();
                        if (reservedTitles.has(titleNorm)) continue;

                        seenCustomIds.add(id);
                        normalizedCustomLists.push({ ...raw, type: 'custom' });
                    }

                    customLists = await hydrateListMetaByOwner('book', normalizedCustomLists, userId);
                    if (renderToken !== renderBooksToken) return;

                    for (const list of defaultLists) {
                        list.bookIds = Array.from(new Set(
                            allItems
                                .filter(i => i.list_type === list.id)
                                .map(i => i.book_id)
                        ));
                    }

                    for (const list of customLists) {
                        list.bookIds = Array.from(new Set(
                            allItems
                                .filter(i => String(i.list_id) === String(list.id))
                                .map(i => i.book_id)
                        ));
                    }

                    const allLists = applyPinnedListSorting('book', [...defaultLists, ...customLists]);
                    if (!allLists.length) {
                        grid.innerHTML = `
                            <div class="${isMobile ? 'mobile-empty-state' : 'empty-state'}">
                                <div class="${isMobile ? 'mobile-empty-icon' : 'empty-icon'}">${iconGlyph('list')}</div>
                                <h3 class="${isMobile ? 'mobile-empty-title' : 'empty-title'}">No Books Yet</h3>
                                <p class="${isMobile ? 'mobile-empty-description' : 'empty-description'}">Save books to see them here.</p>
                            </div>
                        `;
                        markTabRendered('books');
                        return;
                    }

                    const cards = await Promise.all(allLists.map((list) => createCollectionCard(
                        list,
                        'book',
                        isMobile,
                        String(list?.user_id || userId || '').trim() || userId
                    )));
                    grid.innerHTML = '';
                    const fragment = document.createDocumentFragment();
                    cards.forEach(card => fragment.appendChild(card));
                    grid.appendChild(fragment);
                    markTabRendered('books');
                } catch (error) {
                    console.error('Error loading books:', error);
                    grid.innerHTML = `
                        <div class="${isMobile ? 'mobile-empty-state' : 'empty-state'}">
                            <div class="${isMobile ? 'mobile-empty-icon' : 'empty-icon'}">${iconGlyph('list')}</div>
                            <h3 class="${isMobile ? 'mobile-empty-title' : 'empty-title'}">Error Loading Books</h3>
                            <p class="${isMobile ? 'mobile-empty-description' : 'empty-description'}">Unable to load your books</p>
                        </div>
                    `;
                }
            }

            async function renderMusic() {
                const isMobile = window.innerWidth <= 768;
                const grid = isMobile ? document.getElementById('mobileMusicGrid') : document.getElementById('musicGrid');
                if (!grid) return;

                const userId = isViewingOwnProfile ? currentUser?.id : targetUserId;
                if (!userId) return;
                const renderToken = ++renderMusicToken;

                try {
                    await ensurePinnedCollectionsLoaded(userId);
                    const defaultLists = [
                        { id: 'favorites', title: 'Favorites', icon: 'heart', description: 'Tracks you love', type: 'default' },
                        { id: 'listened', title: 'Listened', icon: 'check', description: 'Tracks you already played', type: 'default' },
                        { id: 'listenlist', title: 'Listenlist', icon: 'bookmark', description: 'Tracks to play later', type: 'default' }
                    ];

                    let customLists = await loadCollaborativeCustomLists('music', userId);
                    const allItems = await loadMediaListItems('music', userId, customLists.map((list) => list.id));

                    if (renderToken !== renderMusicToken) return;

                    const reservedTitles = new Set(['favorites', 'listened', 'listenlist']);
                    const seenCustomIds = new Set();
                    const normalizedCustomLists = [];

                    for (const raw of (customLists || [])) {
                        const id = String(raw.id || '').trim();
                        if (!id || seenCustomIds.has(id)) continue;

                        const titleNorm = String(raw.title || '').trim().toLowerCase();
                        if (reservedTitles.has(titleNorm)) continue;

                        seenCustomIds.add(id);
                        normalizedCustomLists.push({ ...raw, type: 'custom' });
                    }

                    customLists = await hydrateListMetaByOwner('music', normalizedCustomLists, userId);
                    if (renderToken !== renderMusicToken) return;

                    for (const list of defaultLists) {
                        list.trackIds = Array.from(new Set(
                            allItems
                                .filter((i) => i.list_type === list.id)
                                .map((i) => String(i.track_id || '').trim())
                                .filter(Boolean)
                        ));
                    }

                    for (const list of customLists) {
                        list.trackIds = Array.from(new Set(
                            allItems
                                .filter((i) => String(i.list_id) === String(list.id))
                                .map((i) => String(i.track_id || '').trim())
                                .filter(Boolean)
                        ));
                    }

                    const allLists = applyPinnedListSorting('music', [...defaultLists, ...customLists]);
                    if (!allLists.length) {
                        grid.innerHTML = `
                            <div class="${isMobile ? 'mobile-empty-state' : 'empty-state'}">
                                <div class="${isMobile ? 'mobile-empty-icon' : 'empty-icon'}">${iconGlyph('list')}</div>
                                <h3 class="${isMobile ? 'mobile-empty-title' : 'empty-title'}">No Music Yet</h3>
                                <p class="${isMobile ? 'mobile-empty-description' : 'empty-description'}">Save tracks to see them here.</p>
                            </div>
                        `;
                        markTabRendered('music');
                        return;
                    }

                    const cards = await Promise.all(allLists.map((list) => createCollectionCard(
                        list,
                        'music',
                        isMobile,
                        String(list?.user_id || userId || '').trim() || userId
                    )));
                    grid.innerHTML = '';
                    const fragment = document.createDocumentFragment();
                    cards.forEach((card) => fragment.appendChild(card));
                    grid.appendChild(fragment);
                    markTabRendered('music');
                } catch (error) {
                    console.error('Error loading music:', error);
                    grid.innerHTML = `
                        <div class="${isMobile ? 'mobile-empty-state' : 'empty-state'}">
                            <div class="${isMobile ? 'mobile-empty-icon' : 'empty-icon'}">${iconGlyph('list')}</div>
                            <h3 class="${isMobile ? 'mobile-empty-title' : 'empty-title'}">Error Loading Music</h3>
                            <p class="${isMobile ? 'mobile-empty-description' : 'empty-description'}">Unable to load your tracks</p>
                        </div>
                    `;
                }
            }

            function normalizeSportsImageUrl(url) {
                if (!url) return '';
                let safe = String(url).trim();
                if (!safe) return '';
                if (safe.startsWith('//')) safe = `https:${safe}`;
                if (safe.startsWith('http:')) safe = safe.replace(/^http:/i, 'https:');
                return safe;
            }

            async function removeFavoriteTeam(teamId) {
                if (!teamId) return false;
                if (!currentUser?.id) {
                    showToast('Sign in to remove teams', 'error');
                    return false;
                }
                const { error } = await supabase
                    .from('user_favorite_teams')
                    .delete()
                    .eq('user_id', currentUser.id)
                    .eq('team_id', teamId);

                if (error) {
                    console.error('Error removing team:', error);
                    showToast('Unable to remove team', 'error');
                    return false;
                }
                showToast('Removed from favorites', 'success');
                return true;
            }

            function buildSportsTeamCard(team, options = {}) {
                const id = String(team?.id || team?.idTeam || '').trim();
                const name = String(team?.name || team?.strTeam || '').trim() || 'Team';
                const league = String(team?.league || team?.strLeague || '').trim();
                const sport = String(team?.sport || team?.strSport || '').trim();
                const stadium = String(team?.stadium || team?.strStadium || '').trim();
                const logo = normalizeSportsImageUrl(team?.logo_url || team?.strTeamBadge || team?.strTeamLogo || '');
                const subtitle = [league, sport].filter(Boolean).join(' • ') || 'Team';
                const logoImage = logo || FALLBACK_BOOK_IMAGE;
                const canRemove = !!options?.canRemove && !!id;

                const card = document.createElement('div');
                card.className = 'team-card logo-only';
                card.innerHTML = `
                    <div class="team-card-media logo-only">
                        <img class="team-card-logo-main" src="${logoImage}" alt="${name} logo" loading="lazy" onerror="this.onerror=null;this.src='${FALLBACK_BOOK_IMAGE}';">
                        ${canRemove ? `<button class="remove-btn" type="button" aria-label="Remove team"><i class="fas fa-times"></i></button>` : ''}
                    </div>
                    <div class="team-card-body">
                        <div class="team-card-title">${name}</div>
                        <div class="team-card-meta">${subtitle}</div>
                        ${stadium ? `<div class="team-card-stadium"><i class="fas fa-location-dot"></i> ${stadium}</div>` : ''}
                    </div>
                `;

                if (canRemove) {
                    const removeBtn = card.querySelector('.remove-btn');
                    if (removeBtn) {
                        removeBtn.addEventListener('click', async (event) => {
                            event.stopPropagation();
                            const ok = await removeFavoriteTeam(id);
                            if (!ok) return;
                            card.remove();
                            if (typeof options?.onRemove === 'function') {
                                options.onRemove();
                            }
                        });
                    }
                }

                card.addEventListener('click', () => {
                    const params = new URLSearchParams();
                    if (id) params.set('id', id);
                    if (name) params.set('team', name);
                    const query = params.toString();
                    const href = query ? `team.html?${query}` : 'team.html';
                    window.location.href = href;
                });

                return card;
            }
            async function renderSports() {
                const isMobile = window.innerWidth <= 768;
                const grid = isMobile ? document.getElementById('mobileSportsGrid') : document.getElementById('sportsGrid');
                if (!grid) return;

                const userId = isViewingOwnProfile ? currentUser?.id : targetUserId;
                if (!userId) return;
                const renderToken = ++renderSportsToken;
                const renderEmptyState = () => {
                    grid.innerHTML = `
                        <div class="${isMobile ? 'mobile-empty-state' : 'empty-state'}">
                            <div class="${isMobile ? 'mobile-empty-icon' : 'empty-icon'}"><i class="fas fa-futbol"></i></div>
                            <h3 class="${isMobile ? 'mobile-empty-title' : 'empty-title'}">No Teams Yet</h3>
                            <p class="${isMobile ? 'mobile-empty-description' : 'empty-description'}">Save teams to see them here.</p>
                        </div>
                    `;
                };

                try {
                    const { data, error } = await supabase
                        .from('user_favorite_teams')
                        .select('team_id, teams (id, name, sport, league, logo_url, banner_url, stadium, stadium_url, jersey_url, fanart_url)')
                        .eq('user_id', userId)
                        .order('created_at', { ascending: false });

                    if (error) throw error;
                    if (renderToken !== renderSportsToken) return;

                    const teams = (data || [])
                        .map((row) => row?.teams || row?.team || row)
                        .filter(Boolean);

                    if (!teams.length) {
                        renderEmptyState();
                        markTabRendered('sports');
                        return;
                    }

                    grid.innerHTML = '';
                    const fragment = document.createDocumentFragment();
                    teams.forEach((team) => {
                        fragment.appendChild(buildSportsTeamCard(team, {
                            canRemove: isViewingOwnProfile,
                            onRemove: () => {
                                if (!grid.querySelector('.team-card')) {
                                    renderEmptyState();
                                }
                            }
                        }));
                    });
                    grid.appendChild(fragment);
                    markTabRendered('sports');
                } catch (error) {
                    console.error('Error loading sports:', error);
                    grid.innerHTML = `
                        <div class="${isMobile ? 'mobile-empty-state' : 'empty-state'}">
                            <div class="${isMobile ? 'mobile-empty-icon' : 'empty-icon'}"><i class="fas fa-futbol"></i></div>
                            <h3 class="${isMobile ? 'mobile-empty-title' : 'empty-title'}">Error Loading Sports</h3>
                            <p class="${isMobile ? 'mobile-empty-description' : 'empty-description'}">Unable to load your teams.</p>
                        </div>
                    `;
                }
            }

            async function renderTravel() {
                const isMobile = window.innerWidth <= 768;
                const grid = isMobile ? document.getElementById('mobileTravelGrid') : document.getElementById('travelGrid');
                if (!grid) return;

                const userId = isViewingOwnProfile ? currentUser?.id : targetUserId;
                if (!userId) return;
                const renderToken = ++renderTravelToken;

                try {
                    await ensurePinnedCollectionsLoaded(userId);
                    const defaultLists = [
                        { id: 'favorites', title: 'Favorites', icon: 'heart', description: 'Countries you love', type: 'default' },
                        { id: 'visited', title: 'Visited', icon: 'check', description: 'Countries you visited', type: 'default' },
                        { id: 'bucketlist', title: 'Bucket List', icon: 'bookmark', description: 'Countries you want to visit', type: 'default' }
                    ];

                    let customLists = await loadCollaborativeCustomLists('travel', userId);
                    const allItems = await loadMediaListItems('travel', userId, customLists.map((list) => list.id));

                    if (renderToken !== renderTravelToken) return;

                    const reservedTitles = new Set(['favorites', 'visited', 'bucketlist', 'bucket list']);
                    const seenCustomIds = new Set();
                    const normalizedCustomLists = [];

                    for (const raw of (customLists || [])) {
                        const id = String(raw.id || '').trim();
                        if (!id || seenCustomIds.has(id)) continue;
                        const titleNorm = String(raw.title || '').trim().toLowerCase();
                        if (reservedTitles.has(titleNorm)) continue;
                        seenCustomIds.add(id);
                        normalizedCustomLists.push({ ...raw, type: 'custom' });
                    }

                    customLists = await hydrateListMetaByOwner('travel', normalizedCustomLists, userId);
                    if (renderToken !== renderTravelToken) return;

                    for (const list of defaultLists) {
                        list.countryCodes = Array.from(new Set(
                            allItems
                                .filter((row) => String(row.list_type || '').toLowerCase() === list.id)
                                .map((row) => normalizeCountryCode(row.country_code || row.item_id))
                                .filter(Boolean)
                        ));
                    }

                    for (const list of customLists) {
                        list.countryCodes = Array.from(new Set(
                            allItems
                                .filter((row) => String(row.list_id || '') === String(list.id || ''))
                                .map((row) => normalizeCountryCode(row.country_code || row.item_id))
                                .filter(Boolean)
                        ));
                    }

                    const allLists = applyPinnedListSorting('travel', [...defaultLists, ...customLists]);
                    if (!allLists.length) {
                        grid.innerHTML = `
                            <div class="${isMobile ? 'mobile-empty-state' : 'empty-state'}">
                                <div class="${isMobile ? 'mobile-empty-icon' : 'empty-icon'}">${iconGlyph('list')}</div>
                                <h3 class="${isMobile ? 'mobile-empty-title' : 'empty-title'}">No Travel Lists Yet</h3>
                                <p class="${isMobile ? 'mobile-empty-description' : 'empty-description'}">Save countries to see them here.</p>
                                <button class="${isMobile ? 'mobile-action-btn' : 'btn btn-primary mt-md'}" onclick="window.location.href='travel.html'">
                                    <i class="fas fa-earth-americas"></i> Explore Travel
                                </button>
                            </div>
                        `;
                        markTabRendered('travel');
                        return;
                    }

                    const cards = await Promise.all(allLists.map((list) => createCollectionCard(
                        list,
                        'travel',
                        isMobile,
                        String(list?.user_id || userId || '').trim() || userId
                    )));
                    grid.innerHTML = '';
                    const fragment = document.createDocumentFragment();
                    cards.forEach((card) => fragment.appendChild(card));
                    grid.appendChild(fragment);
                    markTabRendered('travel');
                } catch (error) {
                    console.error('Error loading travel:', error);
                    grid.innerHTML = `
                        <div class="${isMobile ? 'mobile-empty-state' : 'empty-state'}">
                            <div class="${isMobile ? 'mobile-empty-icon' : 'empty-icon'}">${iconGlyph('list')}</div>
                            <h3 class="${isMobile ? 'mobile-empty-title' : 'empty-title'}">Error Loading Travel</h3>
                            <p class="${isMobile ? 'mobile-empty-description' : 'empty-description'}">Unable to load your travel lists</p>
                        </div>
                    `;
                }
            }

            async function renderFashion() {
                const isMobile = window.innerWidth <= 768;
                const grid = isMobile ? document.getElementById('mobileFashionGrid') : document.getElementById('fashionGrid');
                if (!grid) return;

                const userId = isViewingOwnProfile ? currentUser?.id : targetUserId;
                if (!userId) return;
                const renderToken = ++renderFashionToken;

                try {
                    await ensurePinnedCollectionsLoaded(userId);
                    const defaultLists = [
                        { id: 'favorites', title: 'Favorites', icon: 'heart', description: 'Brands you love', type: 'default' },
                        { id: 'owned', title: 'Owned', icon: 'check', description: 'Brands you own', type: 'default' },
                        { id: 'wishlist', title: 'Wishlist', icon: 'bookmark', description: 'Brands you want to try', type: 'default' }
                    ];

                    let customLists = await loadCollaborativeCustomLists('fashion', userId);
                    const allItems = await loadMediaListItems('fashion', userId, customLists.map((list) => list.id));

                    if (renderToken !== renderFashionToken) return;

                    const reservedTitles = new Set(['favorites', 'owned', 'wishlist']);
                    const seenCustomIds = new Set();
                    const normalizedCustomLists = [];

                    for (const list of customLists) {
                        const title = String(list.title || '').trim().toLowerCase();
                        if (reservedTitles.has(title)) continue;
                        const safeId = String(list.id || '').trim();
                        if (safeId && !seenCustomIds.has(safeId)) {
                            seenCustomIds.add(safeId);
                            normalizedCustomLists.push(list);
                        }
                    }

                    customLists = await hydrateListMetaByOwner('fashion', normalizedCustomLists, userId);
                    if (renderToken !== renderFashionToken) return;

                    for (const list of defaultLists) {
                        list.brandIds = Array.from(new Set(
                            allItems
                                .filter((row) => String(row.list_type || '').toLowerCase() === list.id)
                                .map((row) => String(row.brand_id || row.item_id || '').trim())
                                .filter(Boolean)
                        ));
                    }
                    for (const list of customLists) {
                        list.brandIds = Array.from(new Set(
                            allItems
                                .filter((row) => String(row.list_id || '') === String(list.id || ''))
                                .map((row) => String(row.brand_id || row.item_id || '').trim())
                                .filter(Boolean)
                        ));
                    }

                    const allLists = applyPinnedListSorting('fashion', [...defaultLists, ...customLists]);
                    if (!allLists.length) {
                        grid.innerHTML = `
                            <div class="${isMobile ? 'mobile-empty-state' : 'empty-state'}">
                                <div class="${isMobile ? 'mobile-empty-icon' : 'empty-icon'}">${iconGlyph('list')}</div>
                                <h3 class="${isMobile ? 'mobile-empty-title' : 'empty-title'}">No Fashion Lists Yet</h3>
                                <p class="${isMobile ? 'mobile-empty-description' : 'empty-description'}">Save brands to see them here.</p>
                                <button class="${isMobile ? 'mobile-action-btn' : 'btn btn-primary mt-md'}" onclick="window.location.href='fashion.html'">
                                    <i class="fas fa-shirt"></i> Explore Fashion
                                </button>
                            </div>
                        `;
                        markTabRendered('fashion');
                        return;
                    }

                    const cards = await Promise.all(allLists.map((list) => createCollectionCard(
                        list,
                        'fashion',
                        isMobile,
                        String(list?.user_id || userId || '').trim() || userId
                    )));
                    grid.innerHTML = '';
                    const fragment = document.createDocumentFragment();
                    cards.forEach((card) => fragment.appendChild(card));
                    grid.appendChild(fragment);
                    markTabRendered('fashion');
                } catch (error) {
                    console.error('Error loading fashion:', error);
                    grid.innerHTML = `
                        <div class="${isMobile ? 'mobile-empty-state' : 'empty-state'}">
                            <div class="${isMobile ? 'mobile-empty-icon' : 'empty-icon'}">${iconGlyph('list')}</div>
                            <h3 class="${isMobile ? 'mobile-empty-title' : 'empty-title'}">Error Loading Fashion</h3>
                            <p class="${isMobile ? 'mobile-empty-description' : 'empty-description'}">Unable to load your fashion lists</p>
                        </div>
                    `;
                }
            }

            async function renderCars() {
                const isMobile = window.innerWidth <= 768;
                const grid = isMobile ? document.getElementById('mobileCarsGrid') : document.getElementById('carsGrid');
                if (!grid) return;

                const userId = isViewingOwnProfile ? currentUser?.id : targetUserId;
                if (!userId) return;
                const renderToken = ++renderCarsToken;

                try {
                    await ensurePinnedCollectionsLoaded(userId);
                    const defaultLists = [
                        { id: 'favorites', title: 'Favorites', icon: 'heart', description: 'Brands you love', type: 'default' },
                        { id: 'owned', title: 'Owned', icon: 'check', description: 'Brands you own', type: 'default' },
                        { id: 'wishlist', title: 'Wishlist', icon: 'bookmark', description: 'Brands you want to try', type: 'default' }
                    ];

                    let customLists = await loadCollaborativeCustomLists('car', userId);
                    const allItems = await loadMediaListItems('car', userId, customLists.map((list) => list.id));

                    if (renderToken !== renderCarsToken) return;

                    const reservedTitles = new Set(['favorites', 'owned', 'wishlist']);
                    const seenCustomIds = new Set();
                    const normalizedCustomLists = [];

                    for (const list of customLists) {
                        const title = String(list.title || '').trim().toLowerCase();
                        if (reservedTitles.has(title)) continue;
                        const safeId = String(list.id || '').trim();
                        if (safeId && !seenCustomIds.has(safeId)) {
                            seenCustomIds.add(safeId);
                            normalizedCustomLists.push(list);
                        }
                    }

                    customLists = await hydrateListMetaByOwner('car', normalizedCustomLists, userId);
                    if (renderToken !== renderCarsToken) return;

                    for (const list of defaultLists) {
                        list.brandIds = Array.from(new Set(
                            allItems
                                .filter((row) => String(row.list_type || '').toLowerCase() === list.id)
                                .map((row) => String(row.brand_id || row.item_id || '').trim())
                                .filter(Boolean)
                        ));
                    }
                    for (const list of customLists) {
                        list.brandIds = Array.from(new Set(
                            allItems
                                .filter((row) => String(row.list_id || '') === String(list.id || ''))
                                .map((row) => String(row.brand_id || row.item_id || '').trim())
                                .filter(Boolean)
                        ));
                    }

                    const allLists = applyPinnedListSorting('car', [...defaultLists, ...customLists]);
                    if (!allLists.length) {
                        grid.innerHTML = `
                            <div class="${isMobile ? 'mobile-empty-state' : 'empty-state'}">
                                <div class="${isMobile ? 'mobile-empty-icon' : 'empty-icon'}">${iconGlyph('list')}</div>
                                <h3 class="${isMobile ? 'mobile-empty-title' : 'empty-title'}">No Car Lists Yet</h3>
                                <p class="${isMobile ? 'mobile-empty-description' : 'empty-description'}">Save brands to see them here.</p>
                                <button class="${isMobile ? 'mobile-action-btn' : 'btn btn-primary mt-md'}" onclick="window.location.href='cars.html'">
                                    <i class="fas fa-car"></i> Explore Cars
                                </button>
                            </div>
                        `;
                        markTabRendered('cars');
                        return;
                    }

                    const cards = await Promise.all(allLists.map((list) => createCollectionCard(
                        list,
                        'car',
                        isMobile,
                        String(list?.user_id || userId || '').trim() || userId
                    )));
                    grid.innerHTML = '';
                    const fragment = document.createDocumentFragment();
                    cards.forEach((card) => fragment.appendChild(card));
                    grid.appendChild(fragment);
                    markTabRendered('cars');
                } catch (error) {
                    console.error('Error loading cars:', error);
                    grid.innerHTML = `
                        <div class="${isMobile ? 'mobile-empty-state' : 'empty-state'}">
                            <div class="${isMobile ? 'mobile-empty-icon' : 'empty-icon'}">${iconGlyph('list')}</div>
                            <h3 class="${isMobile ? 'mobile-empty-title' : 'empty-title'}">Error Loading Cars</h3>
                            <p class="${isMobile ? 'mobile-empty-description' : 'empty-description'}">Unable to load your car lists</p>
                        </div>
                    `;
                }
            }

            async function renderFood() {
                const isMobile = window.innerWidth <= 768;
                const grid = isMobile ? document.getElementById('mobileFoodGrid') : document.getElementById('foodGrid');
                if (!grid) return;

                const userId = isViewingOwnProfile ? currentUser?.id : targetUserId;
                if (!userId) return;
                const renderToken = ++renderFoodToken;

                try {
                    await ensurePinnedCollectionsLoaded(userId);
                    const defaultLists = [
                        { id: 'favorites', title: 'Favorites', icon: 'heart', description: 'Brands you love', type: 'default' },
                        { id: 'tried', title: 'Tried', icon: 'check', description: 'Places you already tried', type: 'default' },
                        { id: 'want_to_try', title: 'Want to Try', icon: 'bookmark', description: 'Spots you want to try', type: 'default' }
                    ];

                    let customLists = await loadCollaborativeCustomLists('food', userId);
                    const allItems = await loadMediaListItems('food', userId, customLists.map((list) => list.id));

                    if (renderToken !== renderFoodToken) return;

                    const reservedTitles = new Set(['favorites', 'tried', 'want to try', 'want_to_try']);
                    const seenCustomIds = new Set();
                    const normalizedCustomLists = [];

                    for (const list of customLists) {
                        const title = String(list.title || '').trim().toLowerCase();
                        if (reservedTitles.has(title)) continue;
                        const safeId = String(list.id || '').trim();
                        if (safeId && !seenCustomIds.has(safeId)) {
                            seenCustomIds.add(safeId);
                            normalizedCustomLists.push(list);
                        }
                    }

                    customLists = await hydrateListMetaByOwner('food', normalizedCustomLists, userId);
                    if (renderToken !== renderFoodToken) return;

                    for (const list of defaultLists) {
                        list.brandIds = Array.from(new Set(
                            allItems
                                .filter((row) => String(row.list_type || '').toLowerCase() === list.id)
                                .map((row) => String(row.brand_id || row.item_id || '').trim())
                                .filter(Boolean)
                        ));
                    }
                    for (const list of customLists) {
                        list.brandIds = Array.from(new Set(
                            allItems
                                .filter((row) => String(row.list_id || '') === String(list.id || ''))
                                .map((row) => String(row.brand_id || row.item_id || '').trim())
                                .filter(Boolean)
                        ));
                    }

                    const allLists = applyPinnedListSorting('food', [...defaultLists, ...customLists]);
                    if (!allLists.length) {
                        grid.innerHTML = `
                            <div class="${isMobile ? 'mobile-empty-state' : 'empty-state'}">
                                <div class="${isMobile ? 'mobile-empty-icon' : 'empty-icon'}">${iconGlyph('list')}</div>
                                <h3 class="${isMobile ? 'mobile-empty-title' : 'empty-title'}">No Food Lists Yet</h3>
                                <p class="${isMobile ? 'mobile-empty-description' : 'empty-description'}">Save brands to see them here.</p>
                                <button class="${isMobile ? 'mobile-action-btn' : 'btn btn-primary mt-md'}" onclick="window.location.href='food.html'">
                                    <i class="fas fa-burger"></i> Explore Food
                                </button>
                            </div>
                        `;
                        markTabRendered('food');
                        return;
                    }

                    const cards = await Promise.all(allLists.map((list) => createCollectionCard(
                        list,
                        'food',
                        isMobile,
                        String(list?.user_id || userId || '').trim() || userId
                    )));
                    grid.innerHTML = '';
                    const fragment = document.createDocumentFragment();
                    cards.forEach((card) => fragment.appendChild(card));
                    grid.appendChild(fragment);
                    markTabRendered('food');
                } catch (error) {
                    console.error('Error loading food:', error);
                    grid.innerHTML = `
                        <div class="${isMobile ? 'mobile-empty-state' : 'empty-state'}">
                            <div class="${isMobile ? 'mobile-empty-icon' : 'empty-icon'}">${iconGlyph('list')}</div>
                            <h3 class="${isMobile ? 'mobile-empty-title' : 'empty-title'}">Error Loading Food</h3>
                            <p class="${isMobile ? 'mobile-empty-description' : 'empty-description'}">Unable to load your food lists</p>
                        </div>
                    `;
                }
            }

            async function createCollectionCard(list, contentType, isMobile, ownerUserId = null) {
                const card = document.createElement('div');
                card.className = 'collection-card';

                const normalizedType = contentType === 'cars' ? 'car' : contentType;

                                let itemIds = [];
                if (normalizedType === 'restaurant') {
                    itemIds = list.restaurantIds || [];
                } else if (normalizedType === 'movie') {
                    itemIds = list.movieIds || [];
                } else if (normalizedType === 'tv') {
                    itemIds = list.tvIds || [];
                } else if (normalizedType === 'anime') {
                    itemIds = list.animeIds || [];
                } else if (normalizedType === 'game') {
                    itemIds = list.gameIds || [];
                } else if (normalizedType === 'book') {
                    itemIds = list.bookIds || [];
                } else if (normalizedType === 'fashion' || normalizedType === 'food' || normalizedType === 'car') {
                    itemIds = list.brandIds || [];
                } else if (normalizedType === 'travel') {
                    itemIds = list.countryCodes || [];
                } else {
                    itemIds = list.trackIds || [];
                }                const resolvedListType = resolveCollectionListType(normalizedType, list);
                const routeListId = String(list.id || '');
                const { tierMeta, orderedIds } = await resolveTierOrderedIds(normalizedType, list, routeListId, itemIds, {
                    listType: resolvedListType,
                    ownerUserId
                });
                const count = orderedIds.length;
                const isCustom = normalizedType === 'restaurant' ? !list.is_default : list.type === 'custom';
                const collabAccess = isCustom
                    ? getCollaborativeAccess(normalizedType, routeListId, list)
                    : { isOwner: true, canEdit: true, isCollaborative: false };
                const pinKey = getPinnedCollectionKey(normalizedType, routeListId, resolvedListType);
                const isPinned = !!pinnedListsMap.get(pinKey);
                const tierBadgeHtml = (isCustom && tierMeta.isTier)
                    ? `<div class="tier-list-badge"><i class="fas fa-layer-group"></i> Tier List</div>`
                    : '';
                const pinBadgeHtml = isPinned
                    ? `<div class="collection-pin-badge"><i class="fas fa-thumbtack"></i> Pinned</div>`
                    : '';
                const collabBadgeHtml = (isCustom && collabAccess.isCollaborative)
                    ? `<div class="collection-collab-badge"><i class="fas fa-user-group"></i> Shared</div>`
                    : '';
                const routeListType = String(resolvedListType || '');
                const safeListId = routeListId.replace(/'/g, "\\'");
                const safeListType = routeListType.replace(/'/g, "\\'");
                const countLabel = getCollectionItemLabel(normalizedType, count);

                const previewLimit = 3;
                const travelPreviewIds = normalizedType === 'travel'
                    ? Array.from(new Set(
                        [
                            ...(Array.isArray(list?.countryCodes) ? list.countryCodes : []),
                            ...orderedIds
                        ]
                            .map((id) => normalizeCountryCode(id))
                            .filter(Boolean)
                    ))
                    : [];
                const previewIds = normalizedType === 'travel'
                    ? travelPreviewIds.slice(0, previewLimit)
                    : orderedIds.slice(0, previewLimit);
                const previewOrientationClass = getPreviewOrientationClass(normalizedType);
                const fallbackPreviewIcon = normalizedType === 'restaurant'
                    ? 'restaurant'
                    : normalizedType === 'movie'
                        ? 'movie'
                        : normalizedType === 'tv'
                            ? 'tv'
                            : normalizedType === 'anime'
                                ? 'anime'
                                : normalizedType === 'game'
                                    ? 'game'
                                    : normalizedType === 'book'
                                        ? 'book'
                                        : normalizedType === 'fashion'
                                            ? 'fashion'
                                            : normalizedType === 'food'
                                                ? 'food'
                                                : normalizedType === 'car'
                                                    ? 'car'
                                        : normalizedType === 'travel'
                                            ? 'travel'
                                            : 'music';
                const isBrandCollection = normalizedType === 'fashion' || normalizedType === 'food' || normalizedType === 'car';
                const buildPreviewHtml = (previewItems = []) => {
                    let html = '';
                    for (let i = 0; i < previewLimit; i++) {
                        const overflowHtml = (i === previewLimit - 1 && count > previewLimit)
                            ? `<div class="collection-preview-overflow">+${count - previewLimit}</div>`
                            : '';
                        const previewClass = `collection-preview-item ${previewOrientationClass}${isBrandCollection ? ' brand-logo-preview' : ''}`;
                        const imageClass = isBrandCollection ? 'brand-logo-preview-image' : '';
                        if (previewItems[i]) {
                            html += `
                                <div class="${previewClass}">
                                    <img class="${imageClass}" src="${previewItems[i]}" alt="Preview" loading="lazy" onerror="this.onerror=null;this.src='/newlogo.webp';">
                                    ${overflowHtml}
                                </div>
                            `;
                        } else {
                            html += `
                                <div class="${previewClass}">
                                    <div class="collection-preview-item-empty">${iconGlyph(fallbackPreviewIcon)}</div>
                                    ${overflowHtml}
                                </div>
                            `;
                        }
                    }
                    return html;
                };
                const cachedPreviewItems = normalizedType === 'travel'
                    ? previewIds.map((id) => {
                        const code = normalizeCountryCode(id);
                        const flagUrl = countryFlagFromCode(code || id);
                        writePreviewAssetCache(normalizedType, code || id, flagUrl);
                        return flagUrl;
                    })
                    : previewIds.map((id) => readPreviewAssetCache(normalizedType, id));
                const previewHtml = buildPreviewHtml(cachedPreviewItems);

                const canEditCollection = isViewingOwnProfile && isCustom && !!collabAccess.canEdit;
                const canDeleteCollection = isViewingOwnProfile && isCustom && !!collabAccess.isOwner;
                const canPinCollection = isViewingOwnProfile;
                const pinActionLabel = isPinned ? 'Unpin' : 'Pin to Top';
                const pinActionIcon = isPinned ? 'fa-thumbtack-slash' : 'fa-thumbtack';
                const kebabHtml = (canEditCollection || canDeleteCollection || canPinCollection) ? `
                    <div class="collection-card-actions">
                        <button class="collection-kebab-btn" onclick="event.stopPropagation(); ProfileManager.toggleCollectionMenu('${list.id}', '${normalizedType}')">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                        <div class="collection-dropdown" id="collection-${normalizedType}-${list.id}">
                            ${canPinCollection ? `
                                <div class="collection-dropdown-item" onclick="event.stopPropagation(); ProfileManager.togglePinnedCollection('${safeListId}', '${normalizedType}', '${safeListType}')">
                                    <i class="fas ${pinActionIcon}"></i> ${pinActionLabel}
                                </div>
                            ` : ''}
                            ${canEditCollection ? `
                                <div class="collection-dropdown-item" onclick="event.stopPropagation(); ProfileManager.editCollection('${safeListId}', '${normalizedType}')">
                                    <i class="fas fa-edit"></i> Edit
                                </div>
                            ` : ''}
                            ${canDeleteCollection ? `
                                <div class="collection-dropdown-item danger" onclick="event.stopPropagation(); ProfileManager.deleteCollection('${safeListId}', '${normalizedType}')">
                                    <i class="fas fa-trash"></i> Delete
                                </div>
                            ` : ''}
                        </div>
                    </div>
                ` : '';

                card.innerHTML = `
                    ${kebabHtml}
                    <div class="collection-card-header">
                        <div class="collection-card-title-group">
                            <div class="collection-card-icon">${iconGlyph(list.icon, normalizedType === 'restaurant' ? 'restaurant' : (normalizedType === 'movie' ? 'movie' : (normalizedType === 'tv' ? 'tv' : (normalizedType === 'anime' ? 'anime' : (normalizedType === 'game' ? 'game' : (normalizedType === 'book' ? 'book' : (normalizedType === 'travel' ? 'travel' : (normalizedType === 'car' ? 'car' : 'music'))))))))}</div>
                            <div class="collection-card-info">
                                <div class="collection-card-title">${list.title}</div>
                                <div class="collection-card-count">${countLabel}</div>
                                ${tierBadgeHtml}
                                ${pinBadgeHtml}
                                ${collabBadgeHtml}
                            </div>
                        </div>
                    </div>
                    <div class="collection-card-preview">
                        ${previewHtml}
                    </div>
                    <div class="collection-card-footer">
                        <div class="collection-card-meta">
                            <div class="collection-card-meta-item">
                                <i class="fas fa-calendar"></i>
                                ${list.created_at ? new Date(list.created_at).toLocaleDateString() : ''}
                            </div>
                        </div>
                        <button class="collection-view-btn" onclick="event.stopPropagation(); ProfileManager.openCollectionPage('${safeListId}', '${normalizedType}', '${safeListType}')">
                            View all ->
                        </button>
                    </div>
                `;

                card.onclick = () => openCollectionPage(routeListId, normalizedType, routeListType);

                // Hydrate preview images in the background to keep first paint instant.
                if (previewIds.length) {
                    void getPreviewItems(previewIds, contentType)
                        .then((resolvedPreviewItems) => {
                            if (!card.isConnected) return;
                            const previewContainer = card.querySelector('.collection-card-preview');
                            if (!previewContainer) return;
                            const nextHtml = buildPreviewHtml(resolvedPreviewItems);
                            if (previewContainer.innerHTML !== nextHtml) {
                                previewContainer.innerHTML = nextHtml;
                            }
                        })
                        .catch(() => {});
                }

                return card;
            }

            function getPreviewAssetCacheKey(contentType, id) {
                return `v2:${String(contentType || '').toLowerCase()}:${String(id || '').trim()}`;
            }

            function readPreviewAssetCache(contentType, id) {
                const key = getPreviewAssetCacheKey(contentType, id);
                const entry = previewAssetCache.get(key);
                if (!entry) return null;
                if ((Date.now() - Number(entry.savedAt || 0)) > PREVIEW_ASSET_CACHE_TTL_MS) {
                    previewAssetCache.delete(key);
                    return null;
                }
                return String(entry.url || '').trim() || null;
            }

            function writePreviewAssetCache(contentType, id, url) {
                const safeUrl = String(url || '').trim();
                if (!safeUrl) return;
                const key = getPreviewAssetCacheKey(contentType, id);
                previewAssetCache.set(key, {
                    url: safeUrl,
                    savedAt: Date.now()
                });
            }

            async function getPreviewItems(ids, contentType) {
                const normalizedIds = Array.isArray(ids) ? ids.map((id) => String(id || '').trim()).filter(Boolean) : [];
                if (!normalizedIds.length) return [];

                const urls = normalizedIds.map((id) => readPreviewAssetCache(contentType, id));
                const missingIds = normalizedIds.filter((id, index) => !urls[index]);

                if (missingIds.length) {
                    if (contentType === 'restaurant') {
                        missingIds.forEach((id) => {
                            const restaurant = restaurants.find((r) => String(r.id || '') === String(id || ''));
                            const imageUrl = restaurant?.image ? `images/${restaurant.image}` : null;
                            if (imageUrl) writePreviewAssetCache(contentType, id, imageUrl);
                        });
                    } else if (contentType === 'book') {
                        const rows = await Promise.all(missingIds.map((id) => resolveProfileBookRecord(id)));
                        rows.forEach((row, index) => {
                            const id = String(row?.id || missingIds[index] || '').trim();
                            if (!id) return;
                            const imageUrl = String(row?.thumbnail || '').trim() || FALLBACK_BOOK_IMAGE;
                            writePreviewAssetCache(contentType, id, imageUrl);
                        });
                    } else if (contentType === 'music') {
                        const { data } = await supabase
                            .from('tracks')
                            .select('id, image_url')
                            .in('id', missingIds);
                        (data || []).forEach((row) => {
                            const id = String(row.id || '').trim();
                            const imageUrl = row.image_url || '/newlogo.webp';
                            writePreviewAssetCache(contentType, id, imageUrl);
                        });
                    } else if (contentType === 'fashion' || contentType === 'food' || contentType === 'car') {
                        const table = contentType === 'fashion'
                            ? 'fashion_brands'
                            : (contentType === 'food' ? 'food_brands' : 'car_brands');
                        const { data } = await supabase
                            .from(table)
                            .select('id, name, domain, logo_url')
                            .in('id', missingIds);
                        (data || []).forEach((row) => {
                            const id = String(row.id || '').trim();
                            const name = String(row?.name || '').trim();
                            const domain = String(row?.domain || '').trim();
                            let imageUrl = '';
                            const localLogo = toHttpsUrl(row?.logo_url || '');
                            if (localLogo) {
                                imageUrl = localLogo;
                            } else if (name) {
                                const params = new URLSearchParams();
                                params.set('title', name);
                                if (domain) params.set('domain', domain);
                                params.set('mode', 'logo');
                                imageUrl = `/api/logo?${params.toString()}`;
                            } else if (domain) {
                                imageUrl = `/api/logo?domain=${encodeURIComponent(domain)}&size=256`;
                            }
                            writePreviewAssetCache(contentType, id, imageUrl || '/newlogo.webp');
                        });
                    } else if (contentType === 'travel') {
                        missingIds.forEach((id) => {
                            const code = normalizeCountryCode(id);
                            if (!code) return;
                            writePreviewAssetCache(contentType, id, countryFlagFromCode(code));
                        });
                    } else if (contentType === 'game') {
                        await Promise.all(missingIds.map(async (id) => {
                            const game = await fetchGameDetails(id);
                            const imageUrl = game?.cover ? String(game.cover).trim() : null;
                            if (imageUrl) writePreviewAssetCache(contentType, id, imageUrl);
                        }));
                    } else if (contentType === 'tv') {
                        await Promise.all(missingIds.map(async (id) => {
                            const tv = await fetchTvDetails(id);
                            const imageUrl = tv?.poster_path ? `${TMDB_POSTER}${tv.poster_path}` : null;
                            if (imageUrl) writePreviewAssetCache(contentType, id, imageUrl);
                        }));
                    } else if (contentType === 'anime') {
                        await Promise.all(missingIds.map(async (id) => {
                            const anime = await fetchAnimeDetails(id);
                            const imageUrl = anime?.poster_path ? `${TMDB_POSTER}${anime.poster_path}` : null;
                            if (imageUrl) writePreviewAssetCache(contentType, id, imageUrl);
                        }));
                    } else {
                        await Promise.all(missingIds.map(async (id) => {
                            const movie = await fetchMovieDetails(id);
                            const imageUrl = movie?.poster_path ? `${TMDB_POSTER}${movie.poster_path}` : null;
                            if (imageUrl) writePreviewAssetCache(contentType, id, imageUrl);
                        }));
                    }
                }

                return normalizedIds.map((id) => {
                    const cached = readPreviewAssetCache(contentType, id);
                    if (cached) return cached;
                    if (contentType === 'book') return FALLBACK_BOOK_IMAGE;
                    if (contentType === 'music') return '/newlogo.webp';
                    if (contentType === 'travel') return countryFlagFromCode(normalizeCountryCode(id) || id);
                    return null;
                });
            }

            async function showCollectionDetail(listId, contentType, listType) {
                const isMobile = window.innerWidth <= 768;

                if (contentType === 'restaurant') {
                    await showRestaurantDetail(listId, isMobile);
                } else if (contentType === 'movie') {
                    await showMovieDetail(listId, listType, isMobile);
                } else if (contentType === 'game') {
                    await showGameDetail(listId, listType, isMobile);
                } else if (contentType === 'tv') {
                    await showTvDetail(listId, listType, isMobile);
                } else if (contentType === 'anime') {
                    await showAnimeDetail(listId, listType, isMobile);
                } else if (contentType === 'travel') {
                    await showTravelDetail(listId, listType, isMobile);
                } else if (contentType === 'fashion') {
                    await showFashionDetail(listId, listType, isMobile);
                } else if (contentType === 'food') {
                    await showFoodDetail(listId, listType, isMobile);
                } else if (contentType === 'car') {
                    await showCarDetail(listId, listType, isMobile);
                } else if (contentType === 'music') {
                    await showMusicDetail(listId, listType, isMobile);
                } else {
                    await showBookDetail(listId, listType, isMobile);
                }
            }

            async function showRestaurantDetail(listId, isMobile) {
                const userId = isViewingOwnProfile ? currentUser?.id : targetUserId;
                if (!restaurants.length) {
                    await loadRestaurants().catch(() => {});
                }
                if (isMobile) {
                    const mainSection = document.getElementById('mobileRestaurantsSection');
                    const detailSection = document.getElementById('mobileRestaurantDetailSection');
                    if (mainSection) mainSection.style.display = 'none';
                    if (detailSection) {
                        detailSection.style.display = 'block';
                        detailSection.classList.add('active');
                    }
                } else {
                    const mainTab = document.getElementById('restaurants-tab');
                    const detailView = document.getElementById('restaurant-detail-view');
                    if (mainTab) mainTab.style.display = 'none';
                    if (detailView) {
                        detailView.style.display = 'block';
                        detailView.classList.add('active');
                    }
                }

                let { data: list, error } = await supabase
                    .from('lists')
                    .select('*')
                    .eq('id', listId)
                    .single();

                if (error || !list) {
                    showToast('Collection not found', 'error');
                    return;
                }

                if (window.ListUtils) {
                    const [hydrated] = await ListUtils.hydrateListMetaForLists('restaurant', [list], {
                        client: supabase,
                        userId: currentUser?.id,
                        ownerUserId: userId
                    });
                    if (hydrated) list = hydrated;
                }

                const { data: items } = await supabase
                    .from('lists_restraunts')
                    .select('restraunt_id')
                    .eq('list_id', listId);

                const restaurantIds = items ? items.map(i => i.restraunt_id) : [];
                const listType = list.is_default ? 'default' : 'custom';
                const tierMeta = getTierMetaForList('restaurant', list, restaurantIds.length);
                const detailTitle = getCollectionTitleWithKind('restaurant', list, listType);
                const detailDescription = tierMeta.isTier
                    ? `${list.description || ''}${list.description ? ' | ' : ''}Ranked list.`
                    : (list.description || '');

                if (isMobile) {
                    const titleEl = document.getElementById('mobileRestaurantDetailTitle');
                    const descEl = document.getElementById('mobileRestaurantDetailDescription');
                    const addBtn = document.getElementById('mobileAddToRestaurantListBtn');
                    if (titleEl) titleEl.textContent = detailTitle;
                    if (descEl) descEl.textContent = detailDescription;
                    if (addBtn) addBtn.style.display = isViewingOwnProfile ? 'flex' : 'none';
                } else {
                    const iconEl = document.getElementById('restaurantDetailIcon');
                    const nameEl = document.getElementById('restaurantDetailName');
                    const descEl = document.getElementById('restaurantDetailDescription');
                    const actions = document.getElementById('restaurantDetailActions');
                    if (iconEl) iconEl.innerHTML = iconGlyph(list.icon, 'restaurant');
                    if (nameEl) nameEl.textContent = detailTitle;
                    if (descEl) descEl.textContent = detailDescription;
                    if (actions) actions.style.display = isViewingOwnProfile && !list.is_default ? 'flex' : 'none';
                }

                await renderRestaurantItems(restaurantIds, listId, isMobile, list, listType, userId);

                currentActiveList = { ...list, id: listId, restaurantIds, listType };
                currentMediaDetail = { mediaType: 'restaurant', listId, listType, isMobile };
                updateCollectionViewToggleButtons('restaurant');
            }

            async function renderRestaurantItems(restaurantIds, listId, isMobile, list = null, listType = 'custom', ownerUserId = null) {
                const container = isMobile ? document.getElementById('mobileRestaurantItems') : document.getElementById('restaurantItemsContainer');
                if (!container) return;
                applyCollectionViewToContainer(container, 'restaurant');

                if (!restaurantIds || restaurantIds.length === 0) {
                    container.innerHTML = `
                        <div class="${isMobile ? 'mobile-empty-state' : 'empty-state'}">
                            <div class="${isMobile ? 'mobile-empty-icon' : 'empty-icon'}">${iconGlyph('restaurant')}</div>
                            <h3 class="${isMobile ? 'mobile-empty-title' : 'empty-title'}">No Collections Yet</h3>
                            <p class="${isMobile ? 'mobile-empty-description' : 'empty-description'}">Start adding items!</p>
                            ${isViewingOwnProfile ? `
                                <button class="${isMobile ? 'mobile-action-btn' : 'btn btn-primary mt-md'}" onclick="window.location.href='index.html'">
                                    <i class="fas fa-search"></i> Browse Places
                                </button>
                            ` : ''}
                        </div>
                    `;
                    wireTierDragAndDrop(container, null, null, 'default');
                    return;
                }

                container.innerHTML = '';

                const { tierMeta, orderedIds: orderedRestaurantIds } = await resolveTierOrderedIds('restaurant', list, listId, restaurantIds, {
                    listType,
                    ownerUserId
                });
                const canReorderList = canReorderCollectionItems('restaurant', listId, listType, list);

                const restaurantMap = new Map();
                (restaurants || []).forEach((row) => {
                    restaurantMap.set(String(row.id), row);
                });

                for (let index = 0; index < orderedRestaurantIds.length; index += 1) {
                    const rankedRestaurantId = String(orderedRestaurantIds[index] || '').trim();
                    const restaurant = restaurantMap.get(rankedRestaurantId);
                    if (!restaurant) continue;
                    const itemCard = document.createElement('div');
                    itemCard.className = 'collection-item-card';
                    itemCard.onclick = () => window.location.href = `restaurant.html?slug=${restaurant.slug}`;
                    const canReorder = canReorderList;
                    const rankMarkup = tierMeta.isTier
                        ? buildTierRankControlMarkup(
                            index + 1,
                            orderedRestaurantIds.length,
                            canReorder
                        )
                        : '';

                    itemCard.innerHTML = `
                        <img class="collection-item-image" src="images/${restaurant.image || 'placeholder.jpg'}" alt="${restaurant.name}" loading="lazy">
                        <div class="collection-item-body">
                            <h3 class="collection-item-title">${restaurant.name}</h3>
                            ${isViewingOwnProfile ? `
                                <button class="collection-item-remove-inline" onclick="event.stopPropagation(); ProfileManager.removeFromCollection(${restaurant.id}, '${listId}', 'restaurant')">
                                    <i class="fas fa-times"></i> Remove
                                </button>
                            ` : ''}
                            <div class="collection-item-meta">
                                <span><i class="fas fa-clapperboard"></i> ${restaurant.category}</span>
                                <span><i class="fas fa-star"></i> ${restaurant.rating}</span>
                            </div>
                            ${rankMarkup}
                        </div>
                        ${isViewingOwnProfile ? `
                            <button class="collection-item-remove" onclick="event.stopPropagation(); ProfileManager.removeFromCollection(${restaurant.id}, '${listId}', 'restaurant')">
                                <i class="fas fa-times"></i>
                            </button>
                        ` : ''}
                    `;

                    container.appendChild(itemCard);
                    if (canReorder) {
                        itemCard.dataset.tierItemId = rankedRestaurantId;
                    }
                }

                wireTierDragAndDrop(
                    container,
                    canReorderList ? 'restaurant' : null,
                    canReorderList ? listId : null,
                    canReorderList ? listType : 'default'
                );
            }

            async function showMovieDetail(listId, listType, isMobile) {
                if (isMobile) {
                    const mainSection = document.getElementById('mobileMoviesSection');
                    const detailSection = document.getElementById('mobileMovieDetailSection');
                    if (mainSection) {
                        mainSection.style.display = 'block';
                        mainSection.classList.add('active');
                        const titleEl = mainSection.querySelector('.mobile-section-title');
                        const subtitleEl = mainSection.querySelector('.mobile-section-subtitle');
                        const gridEl = document.getElementById('mobileMoviesGrid');
                        if (titleEl) titleEl.style.display = 'none';
                        if (subtitleEl) subtitleEl.style.display = 'none';
                        if (gridEl) gridEl.style.display = 'none';
                    }
                    if (detailSection) {
                        detailSection.style.display = 'block';
                        detailSection.classList.add('active');
                    }
                } else {
                    const mainTab = document.getElementById('movies-tab');
                    const detailView = document.getElementById('movie-detail-view');
                    if (mainTab) mainTab.style.display = 'none';
                    if (detailView) {
                        detailView.style.display = 'block';
                        detailView.classList.add('active');
                    }
                }

                const userId = isViewingOwnProfile ? currentUser?.id : targetUserId;

                let list = null;
                if (listType === 'default') {
                    const titles = { favorites: 'Favorites', watched: 'Watched', watchlist: 'Watchlist' };
                    const icons = { favorites: 'heart', watched: 'check', watchlist: 'bookmark' };
                    const descriptions = { favorites: 'Movies you love', watched: 'Movies you watched', watchlist: 'Movies to watch' };
                    list = {
                        id: listId,
                        title: titles[listId],
                        icon: icons[listId],
                        description: descriptions[listId],
                        type: 'default'
                    };
                } else {
                    const { data, error } = await supabase
                        .from('movie_lists')
                        .select('*')
                        .eq('id', listId)
                        .single();

                    if (error || !data) {
                        showToast('Collection not found', 'error');
                        return;
                    }
                    list = { ...data, type: 'custom' };
                }

                if (listType === 'custom' && window.ListUtils) {
                    const [hydrated] = await ListUtils.hydrateListMetaForLists('movie', [list], {
                        client: supabase,
                        userId: currentUser?.id,
                        ownerUserId: list?.user_id || userId
                    });
                    if (hydrated) list = hydrated;
                }
                if (listType === 'custom') {
                    await ensureCollaborativeAccessForList('movie', list);
                }

                const listOwnerUserId = String(list?.user_id || userId || '').trim() || userId;
                const movieIds = await fetchMediaCollectionItemIds('movie', listOwnerUserId, listId, listType);
                const tierMeta = getTierMetaForList('movie', list, movieIds.length);
                const detailTitle = getCollectionTitleWithKind('movie', list, listType);
                const detailDescription = tierMeta.isTier
                    ? `${list.description || ''}${list.description ? ' | ' : ''}Ranked list.`
                    : (list.description || '');
                const canEditList = listType === 'custom' && canEditCustomCollection('movie', listId, list);
                const canDeleteList = listType === 'custom' && canDeleteCustomCollection('movie', listId, list);

                if (isMobile) {
                    const titleEl = document.getElementById('mobileMovieDetailTitle');
                    const descEl = document.getElementById('mobileMovieDetailDescription');
                    const actions = document.getElementById('mobileMovieDetailActions');
                    const editBtn = document.getElementById('mobileMovieListEditBtn');
                    const deleteBtn = document.getElementById('mobileMovieListDeleteBtn');
                    if (titleEl) titleEl.textContent = detailTitle;
                    if (descEl) descEl.textContent = detailDescription;
                    if (actions) actions.style.display = (canEditList || canDeleteList) ? 'flex' : 'none';
                    if (editBtn) editBtn.style.display = canEditList ? 'inline-flex' : 'none';
                    if (deleteBtn) deleteBtn.style.display = canDeleteList ? 'inline-flex' : 'none';
                    if (editBtn) editBtn.onclick = () => renameMovieList(listId);
                    if (deleteBtn) deleteBtn.onclick = () => deleteMovieList(listId);
                } else {
                    const iconEl = document.getElementById('movieDetailIcon');
                    const nameEl = document.getElementById('movieDetailName');
                    const descEl = document.getElementById('movieDetailDescription');
                    const actions = document.getElementById('movieDetailActions');
                    const editBtn = document.getElementById('movieListEditBtn');
                    const deleteBtn = document.getElementById('movieListDeleteBtn');
                    if (iconEl) iconEl.innerHTML = iconGlyph(list.icon, 'list');
                    if (nameEl) nameEl.textContent = detailTitle;
                    if (descEl) descEl.textContent = detailDescription;
                    if (actions) actions.style.display = (canEditList || canDeleteList) ? 'flex' : 'none';
                    if (editBtn) editBtn.style.display = canEditList ? 'inline-flex' : 'none';
                    if (deleteBtn) deleteBtn.style.display = canDeleteList ? 'inline-flex' : 'none';
                    if (editBtn) editBtn.onclick = () => renameMovieList(listId);
                    if (deleteBtn) deleteBtn.onclick = () => deleteMovieList(listId);
                }

                currentMediaDetail = { mediaType: 'movie', listId, listType, isMobile };
                updateCollectionViewToggleButtons('movie');
                await renderMovieItems(movieIds, listId, listType, isMobile, list, listOwnerUserId);
            }

            async function renderMovieItems(movieIds, listId, listType, isMobile, list = null, ownerUserId = null) {
                const container = isMobile ? document.getElementById('mobileMovieItems') : document.getElementById('movieItemsContainer');
                if (!container) return;
                applyCollectionViewToContainer(container, 'movie');

                if (!movieIds || movieIds.length === 0) {
                    container.innerHTML = `
                        <div class="${isMobile ? 'mobile-empty-state' : 'empty-state'}">
                            <div class="${isMobile ? 'mobile-empty-icon' : 'empty-icon'}">${iconGlyph('list')}</div>
                            <h3 class="${isMobile ? 'mobile-empty-title' : 'empty-title'}">No Movies Yet</h3>
                            <p class="${isMobile ? 'mobile-empty-description' : 'empty-description'}">Add movies to this collection!</p>
                        </div>
                    `;
                    wireTierDragAndDrop(container, null, null, 'default');
                    return;
                }

                container.innerHTML = '<div class="empty-state"><div class="empty-icon"><i class="fas fa-spinner fa-spin"></i></div><h3 class="empty-title">Loading...</h3></div>';
                const { tierMeta, orderedIds: rankedMovieIds } = await resolveTierOrderedIds('movie', list, listId, movieIds, {
                    listType,
                    ownerUserId
                });
                const canReorderList = canReorderCollectionItems('movie', listId, listType, list);
                const canEditItems = canEditCollectionItems('movie', listId, listType, list);

                const movies = await Promise.all(rankedMovieIds.map(id => fetchMovieDetails(id)));

                container.innerHTML = '';

                for (let index = 0; index < movies.length; index += 1) {
                    const movie = movies[index];
                    if (!movie) continue;
                    const movieIdValue = rankedMovieIds[index] ?? movie.id;
                    const canReorder = canReorderList;
                    const rankMarkup = tierMeta.isTier
                        ? buildTierRankControlMarkup(
                            index + 1,
                            rankedMovieIds.length,
                            canReorder
                        )
                        : '';

                    const itemCard = document.createElement('div');
                    itemCard.className = 'collection-item-card';
                    itemCard.onclick = () => window.location.href = `movie.html?id=${movie.id}`;

                    itemCard.innerHTML = `
                        <img class="collection-item-image" src="${movie.poster_path ? TMDB_POSTER + movie.poster_path : 'images/placeholder.jpg'}" alt="${movie.title}" loading="lazy">
                        <div class="collection-item-body">
                            <h3 class="collection-item-title">${movie.title}</h3>
                            ${canEditItems ? `
                                <button class="collection-item-remove-inline" onclick="event.stopPropagation(); ProfileManager.removeFromCollection(${movieIdValue}, '${listId}', 'movie', '${listType}')">
                                    <i class="fas fa-times"></i> Remove
                                </button>
                            ` : ''}
                            <div class="collection-item-meta">
                                <span><i class="fas fa-calendar"></i> ${movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}</span>
                                ${movie.vote_average ? `<span><i class="fas fa-star"></i> ${movie.vote_average.toFixed(1)}</span>` : ''}
                            </div>
                            ${rankMarkup}
                        </div>
                        ${canEditItems ? `
                            <button class="collection-item-remove" onclick="event.stopPropagation(); ProfileManager.removeFromCollection(${movieIdValue}, '${listId}', 'movie', '${listType}')">
                                <i class="fas fa-times"></i>
                            </button>
                        ` : ''}
                    `;

                    if (canReorder) {
                        itemCard.dataset.tierItemId = String(movieIdValue || '').trim();
                    }
                    container.appendChild(itemCard);
                }

                wireTierDragAndDrop(
                    container,
                    canReorderList ? 'movie' : null,
                    canReorderList ? listId : null,
                    canReorderList ? listType : 'default'
                );
            }

            async function showTvDetail(listId, listType, isMobile) {
                if (isMobile) {
                    const mainSection = document.getElementById('mobileTvSection');
                    const detailSection = document.getElementById('mobileTvDetailSection');
                    if (mainSection) {
                        mainSection.style.display = 'block';
                        mainSection.classList.add('active');
                        const titleEl = mainSection.querySelector('.mobile-section-title');
                        const subtitleEl = mainSection.querySelector('.mobile-section-subtitle');
                        const gridEl = document.getElementById('mobileTvGrid');
                        if (titleEl) titleEl.style.display = 'none';
                        if (subtitleEl) subtitleEl.style.display = 'none';
                        if (gridEl) gridEl.style.display = 'none';
                    }
                    if (detailSection) {
                        detailSection.style.display = 'block';
                        detailSection.classList.add('active');
                    }
                } else {
                    const mainTab = document.getElementById('tv-tab');
                    const detailView = document.getElementById('tv-detail-view');
                    if (mainTab) mainTab.style.display = 'none';
                    if (detailView) {
                        detailView.style.display = 'block';
                        detailView.classList.add('active');
                    }
                }

                const userId = isViewingOwnProfile ? currentUser?.id : targetUserId;

                let list = null;
                if (listType === 'default') {
                    const titles = { favorites: 'Favorites', watched: 'Watched', watchlist: 'Watchlist' };
                    const icons = { favorites: 'heart', watched: 'check', watchlist: 'bookmark' };
                    const descriptions = { favorites: 'Shows you love', watched: 'Shows you watched', watchlist: 'Shows to watch' };
                    list = {
                        id: listId,
                        title: titles[listId],
                        icon: icons[listId],
                        description: descriptions[listId],
                        type: 'default'
                    };
                } else {
                    const { data, error } = await supabase
                        .from('tv_lists')
                        .select('*')
                        .eq('id', listId)
                        .single();

                    if (error || !data) {
                        showToast('Collection not found', 'error');
                        return;
                    }
                    list = { ...data, type: 'custom' };
                }

                if (listType === 'custom' && window.ListUtils) {
                    const [hydrated] = await ListUtils.hydrateListMetaForLists('tv', [list], {
                        client: supabase,
                        userId: currentUser?.id,
                        ownerUserId: list?.user_id || userId
                    });
                    if (hydrated) list = hydrated;
                }
                if (listType === 'custom') {
                    await ensureCollaborativeAccessForList('tv', list);
                }

                const listOwnerUserId = String(list?.user_id || userId || '').trim() || userId;
                const tvIds = await fetchMediaCollectionItemIds('tv', listOwnerUserId, listId, listType);
                const tierMeta = getTierMetaForList('tv', list, tvIds.length);
                const detailTitle = getCollectionTitleWithKind('tv', list, listType);
                const detailDescription = tierMeta.isTier
                    ? `${list.description || ''}${list.description ? ' | ' : ''}Ranked list.`
                    : (list.description || '');
                const canEditList = listType === 'custom' && canEditCustomCollection('tv', listId, list);
                const canDeleteList = listType === 'custom' && canDeleteCustomCollection('tv', listId, list);

                if (isMobile) {
                    const titleEl = document.getElementById('mobileTvDetailTitle');
                    const descEl = document.getElementById('mobileTvDetailDescription');
                    const actions = document.getElementById('mobileTvDetailActions');
                    const editBtn = document.getElementById('mobileTvListEditBtn');
                    const deleteBtn = document.getElementById('mobileTvListDeleteBtn');
                    if (titleEl) titleEl.textContent = detailTitle;
                    if (descEl) descEl.textContent = detailDescription;
                    if (actions) actions.style.display = (canEditList || canDeleteList) ? 'flex' : 'none';
                    if (editBtn) editBtn.style.display = canEditList ? 'inline-flex' : 'none';
                    if (deleteBtn) deleteBtn.style.display = canDeleteList ? 'inline-flex' : 'none';
                    if (editBtn) editBtn.onclick = () => renameTvList(listId);
                    if (deleteBtn) deleteBtn.onclick = () => deleteTvList(listId);
                } else {
                    const iconEl = document.getElementById('tvDetailIcon');
                    const nameEl = document.getElementById('tvDetailName');
                    const descEl = document.getElementById('tvDetailDescription');
                    const actions = document.getElementById('tvDetailActions');
                    const editBtn = document.getElementById('tvListEditBtn');
                    const deleteBtn = document.getElementById('tvListDeleteBtn');
                    if (iconEl) iconEl.innerHTML = iconGlyph(list.icon, 'tv');
                    if (nameEl) nameEl.textContent = detailTitle;
                    if (descEl) descEl.textContent = detailDescription;
                    if (actions) actions.style.display = (canEditList || canDeleteList) ? 'flex' : 'none';
                    if (editBtn) editBtn.style.display = canEditList ? 'inline-flex' : 'none';
                    if (deleteBtn) deleteBtn.style.display = canDeleteList ? 'inline-flex' : 'none';
                    if (editBtn) editBtn.onclick = () => renameTvList(listId);
                    if (deleteBtn) deleteBtn.onclick = () => deleteTvList(listId);
                }

                currentMediaDetail = { mediaType: 'tv', listId, listType, isMobile };
                updateCollectionViewToggleButtons('tv');
                await renderTvItems(tvIds, listId, listType, isMobile, list, listOwnerUserId);
            }

            async function renderTvItems(tvIds, listId, listType, isMobile, list = null, ownerUserId = null) {
                const container = isMobile ? document.getElementById('mobileTvItems') : document.getElementById('tvItemsContainer');
                if (!container) return;
                applyCollectionViewToContainer(container, 'tv');

                if (!tvIds || tvIds.length === 0) {
                    container.innerHTML = `
                        <div class="${isMobile ? 'mobile-empty-state' : 'empty-state'}">
                            <div class="${isMobile ? 'mobile-empty-icon' : 'empty-icon'}">${iconGlyph('list')}</div>
                            <h3 class="${isMobile ? 'mobile-empty-title' : 'empty-title'}">No TV Shows Yet</h3>
                            <p class="${isMobile ? 'mobile-empty-description' : 'empty-description'}">Add TV shows to this collection!</p>
                        </div>
                    `;
                    wireTierDragAndDrop(container, null, null, 'default');
                    return;
                }

                container.innerHTML = '<div class="empty-state"><div class="empty-icon"><i class="fas fa-spinner fa-spin"></i></div><h3 class="empty-title">Loading...</h3></div>';
                const { tierMeta, orderedIds: rankedTvIds } = await resolveTierOrderedIds('tv', list, listId, tvIds, {
                    listType,
                    ownerUserId
                });
                const canReorderList = canReorderCollectionItems('tv', listId, listType, list);
                const canEditItems = canEditCollectionItems('tv', listId, listType, list);

                const shows = await Promise.all(rankedTvIds.map(id => fetchTvDetails(id)));

                container.innerHTML = '';

                for (let index = 0; index < shows.length; index += 1) {
                    const show = shows[index];
                    if (!show) continue;
                    const tvIdValue = rankedTvIds[index] ?? show.id;
                    const canReorder = canReorderList;
                    const rankMarkup = tierMeta.isTier
                        ? buildTierRankControlMarkup(
                            index + 1,
                            rankedTvIds.length,
                            canReorder
                        )
                        : '';

                    const itemCard = document.createElement('div');
                    itemCard.className = 'collection-item-card';
                    itemCard.onclick = () => window.location.href = `tvshow.html?id=${show.id}`;

                    const showTitle = show.name || show.original_name || show.title || 'Untitled';

                    itemCard.innerHTML = `
                        <img class="collection-item-image" src="${show.poster_path ? TMDB_POSTER + show.poster_path : 'images/placeholder.jpg'}" alt="${showTitle}" loading="lazy">
                        <div class="collection-item-body">
                            <h3 class="collection-item-title">${showTitle}</h3>
                            ${canEditItems ? `
                                <button class="collection-item-remove-inline" onclick="event.stopPropagation(); ProfileManager.removeFromCollection(${tvIdValue}, '${listId}', 'tv', '${listType}')">
                                    <i class="fas fa-times"></i> Remove
                                </button>
                            ` : ''}
                            <div class="collection-item-meta">
                                <span><i class="fas fa-calendar"></i> ${show.first_air_date ? new Date(show.first_air_date).getFullYear() : 'N/A'}</span>
                                <span><i class="fas fa-star"></i> ${show.vote_average ? show.vote_average.toFixed(1) : 'N/A'}</span>
                            </div>
                            ${rankMarkup}
                        </div>
                        ${canEditItems ? `
                            <button class="collection-item-remove" onclick="event.stopPropagation(); ProfileManager.removeFromCollection(${tvIdValue}, '${listId}', 'tv', '${listType}')">
                                <i class="fas fa-times"></i>
                            </button>
                        ` : ''}
                    `;

                    if (canReorder) {
                        itemCard.dataset.tierItemId = String(tvIdValue || '').trim();
                    }
                    container.appendChild(itemCard);
                }

                wireTierDragAndDrop(
                    container,
                    canReorderList ? 'tv' : null,
                    canReorderList ? listId : null,
                    canReorderList ? listType : 'default'
                );
            }

            async function showAnimeDetail(listId, listType, isMobile) {
                if (isMobile) {
                    const mainSection = document.getElementById('mobileAnimeSection');
                    const detailSection = document.getElementById('mobileAnimeDetailSection');
                    if (mainSection) {
                        mainSection.style.display = 'block';
                        mainSection.classList.add('active');
                        const titleEl = mainSection.querySelector('.mobile-section-title');
                        const subtitleEl = mainSection.querySelector('.mobile-section-subtitle');
                        const gridEl = document.getElementById('mobileAnimeGrid');
                        if (titleEl) titleEl.style.display = 'none';
                        if (subtitleEl) subtitleEl.style.display = 'none';
                        if (gridEl) gridEl.style.display = 'none';
                    }
                    if (detailSection) {
                        detailSection.style.display = 'block';
                        detailSection.classList.add('active');
                    }
                } else {
                    const mainTab = document.getElementById('anime-tab');
                    const detailView = document.getElementById('anime-detail-view');
                    if (mainTab) mainTab.style.display = 'none';
                    if (detailView) {
                        detailView.style.display = 'block';
                        detailView.classList.add('active');
                    }
                }

                const userId = isViewingOwnProfile ? currentUser?.id : targetUserId;

                let list = null;
                if (listType === 'default') {
                    const titles = { favorites: 'Favorites', watched: 'Watched', watchlist: 'Watchlist' };
                    const icons = { favorites: 'heart', watched: 'check', watchlist: 'bookmark' };
                    const descriptions = { favorites: 'Anime you love', watched: 'Anime you watched', watchlist: 'Anime to watch' };
                    list = {
                        id: listId,
                        title: titles[listId],
                        icon: icons[listId],
                        description: descriptions[listId],
                        type: 'default'
                    };
                } else {
                    const { data, error } = await supabase
                        .from('anime_lists')
                        .select('*')
                        .eq('id', listId)
                        .single();

                    if (error || !data) {
                        showToast('Collection not found', 'error');
                        return;
                    }
                    list = { ...data, type: 'custom' };
                }

                if (listType === 'custom' && window.ListUtils) {
                    const [hydrated] = await ListUtils.hydrateListMetaForLists('anime', [list], {
                        client: supabase,
                        userId: currentUser?.id,
                        ownerUserId: list?.user_id || userId
                    });
                    if (hydrated) list = hydrated;
                }
                if (listType === 'custom') {
                    await ensureCollaborativeAccessForList('anime', list);
                }

                const listOwnerUserId = String(list?.user_id || userId || '').trim() || userId;
                const animeIds = await fetchMediaCollectionItemIds('anime', listOwnerUserId, listId, listType);
                const tierMeta = getTierMetaForList('anime', list, animeIds.length);
                const detailTitle = getCollectionTitleWithKind('anime', list, listType);
                const detailDescription = tierMeta.isTier
                    ? `${list.description || ''}${list.description ? ' | ' : ''}Ranked list.`
                    : (list.description || '');
                const canEditList = listType === 'custom' && canEditCustomCollection('anime', listId, list);
                const canDeleteList = listType === 'custom' && canDeleteCustomCollection('anime', listId, list);

                if (isMobile) {
                    const titleEl = document.getElementById('mobileAnimeDetailTitle');
                    const descEl = document.getElementById('mobileAnimeDetailDescription');
                    const actions = document.getElementById('mobileAnimeDetailActions');
                    const editBtn = document.getElementById('mobileAnimeListEditBtn');
                    const deleteBtn = document.getElementById('mobileAnimeListDeleteBtn');
                    if (titleEl) titleEl.textContent = detailTitle;
                    if (descEl) descEl.textContent = detailDescription;
                    if (actions) actions.style.display = (canEditList || canDeleteList) ? 'flex' : 'none';
                    if (editBtn) editBtn.style.display = canEditList ? 'inline-flex' : 'none';
                    if (deleteBtn) deleteBtn.style.display = canDeleteList ? 'inline-flex' : 'none';
                    if (editBtn) editBtn.onclick = () => renameAnimeList(listId);
                    if (deleteBtn) deleteBtn.onclick = () => deleteAnimeList(listId);
                } else {
                    const iconEl = document.getElementById('animeDetailIcon');
                    const nameEl = document.getElementById('animeDetailName');
                    const descEl = document.getElementById('animeDetailDescription');
                    const actions = document.getElementById('animeDetailActions');
                    const editBtn = document.getElementById('animeListEditBtn');
                    const deleteBtn = document.getElementById('animeListDeleteBtn');
                    if (iconEl) iconEl.innerHTML = iconGlyph(list.icon, 'anime');
                    if (nameEl) nameEl.textContent = detailTitle;
                    if (descEl) descEl.textContent = detailDescription;
                    if (actions) actions.style.display = (canEditList || canDeleteList) ? 'flex' : 'none';
                    if (editBtn) editBtn.style.display = canEditList ? 'inline-flex' : 'none';
                    if (deleteBtn) deleteBtn.style.display = canDeleteList ? 'inline-flex' : 'none';
                    if (editBtn) editBtn.onclick = () => renameAnimeList(listId);
                    if (deleteBtn) deleteBtn.onclick = () => deleteAnimeList(listId);
                }

                currentMediaDetail = { mediaType: 'anime', listId, listType, isMobile };
                updateCollectionViewToggleButtons('anime');
                await renderAnimeItems(animeIds, listId, listType, isMobile, list, listOwnerUserId);
            }

            async function renderAnimeItems(animeIds, listId, listType, isMobile, list = null, ownerUserId = null) {
                const container = isMobile ? document.getElementById('mobileAnimeItems') : document.getElementById('animeItemsContainer');
                if (!container) return;
                applyCollectionViewToContainer(container, 'anime');

                if (!animeIds || animeIds.length === 0) {
                    container.innerHTML = `
                        <div class="${isMobile ? 'mobile-empty-state' : 'empty-state'}">
                            <div class="${isMobile ? 'mobile-empty-icon' : 'empty-icon'}">${iconGlyph('list')}</div>
                            <h3 class="${isMobile ? 'mobile-empty-title' : 'empty-title'}">No Anime Yet</h3>
                            <p class="${isMobile ? 'mobile-empty-description' : 'empty-description'}">Add anime to this collection!</p>
                        </div>
                    `;
                    wireTierDragAndDrop(container, null, null, 'default');
                    return;
                }

                container.innerHTML = '<div class="empty-state"><div class="empty-icon"><i class="fas fa-spinner fa-spin"></i></div><h3 class="empty-title">Loading...</h3></div>';
                const { tierMeta, orderedIds: rankedAnimeIds } = await resolveTierOrderedIds('anime', list, listId, animeIds, {
                    listType,
                    ownerUserId
                });
                const canReorderList = canReorderCollectionItems('anime', listId, listType, list);
                const canEditItems = canEditCollectionItems('anime', listId, listType, list);

                const shows = await Promise.all(rankedAnimeIds.map((id) => fetchAnimeDetails(id)));

                container.innerHTML = '';

                for (let index = 0; index < shows.length; index += 1) {
                    const show = shows[index];
                    if (!show) continue;
                    const animeIdValue = rankedAnimeIds[index] ?? show.id;
                    const canReorder = canReorderList;
                    const rankMarkup = tierMeta.isTier
                        ? buildTierRankControlMarkup(
                            index + 1,
                            rankedAnimeIds.length,
                            canReorder
                        )
                        : '';

                    const itemCard = document.createElement('div');
                    itemCard.className = 'collection-item-card';
                    itemCard.onclick = () => window.location.href = `anime.html?id=${show.id}`;

                    const showTitle = show.name || show.original_name || show.title || 'Untitled';

                    itemCard.innerHTML = `
                        <img class="collection-item-image" src="${show.poster_path ? TMDB_POSTER + show.poster_path : 'images/placeholder.jpg'}" alt="${showTitle}" loading="lazy">
                        <div class="collection-item-body">
                            <h3 class="collection-item-title">${showTitle}</h3>
                            ${canEditItems ? `
                                <button class="collection-item-remove-inline" onclick="event.stopPropagation(); ProfileManager.removeFromCollection(${animeIdValue}, '${listId}', 'anime', '${listType}')">
                                    <i class="fas fa-times"></i> Remove
                                </button>
                            ` : ''}
                            <div class="collection-item-meta">
                                <span><i class="fas fa-calendar"></i> ${show.first_air_date ? new Date(show.first_air_date).getFullYear() : 'N/A'}</span>
                                <span><i class="fas fa-star"></i> ${show.vote_average ? show.vote_average.toFixed(1) : 'N/A'}</span>
                            </div>
                            ${rankMarkup}
                        </div>
                        ${canEditItems ? `
                            <button class="collection-item-remove" onclick="event.stopPropagation(); ProfileManager.removeFromCollection(${animeIdValue}, '${listId}', 'anime', '${listType}')">
                                <i class="fas fa-times"></i>
                            </button>
                        ` : ''}
                    `;

                    if (canReorder) {
                        itemCard.dataset.tierItemId = String(animeIdValue || '').trim();
                    }
                    container.appendChild(itemCard);
                }

                wireTierDragAndDrop(
                    container,
                    canReorderList ? 'anime' : null,
                    canReorderList ? listId : null,
                    canReorderList ? listType : 'default'
                );
            }

            async function showGameDetail(listId, listType, isMobile) {
                if (isMobile) {
                    const mainSection = document.getElementById('mobileGamesSection');
                    const detailSection = document.getElementById('mobileGameDetailSection');
                    if (mainSection) {
                        mainSection.style.display = 'block';
                        mainSection.classList.add('active');
                        const titleEl = mainSection.querySelector('.mobile-section-title');
                        const subtitleEl = mainSection.querySelector('.mobile-section-subtitle');
                        const gridEl = document.getElementById('mobileGamesGrid');
                        if (titleEl) titleEl.style.display = 'none';
                        if (subtitleEl) subtitleEl.style.display = 'none';
                        if (gridEl) gridEl.style.display = 'none';
                    }
                    if (detailSection) {
                        detailSection.style.display = 'block';
                        detailSection.classList.add('active');
                    }
                } else {
                    const mainTab = document.getElementById('games-tab');
                    const detailView = document.getElementById('game-detail-view');
                    if (mainTab) mainTab.style.display = 'none';
                    if (detailView) {
                        detailView.style.display = 'block';
                        detailView.classList.add('active');
                    }
                }

                const userId = isViewingOwnProfile ? currentUser?.id : targetUserId;

                let list = null;
                if (listType === 'default') {
                    const titles = { favorites: 'Favorites', watched: 'Played', watchlist: 'Backlog' };
                    const icons = { favorites: 'heart', watched: 'check', watchlist: 'bookmark' };
                    const descriptions = { favorites: 'Games you love', watched: 'Games you played', watchlist: 'Games to play' };
                    list = {
                        id: listId,
                        title: titles[listId],
                        icon: icons[listId],
                        description: descriptions[listId],
                        type: 'default'
                    };
                } else {
                    const { data, error } = await supabase
                        .from('game_lists')
                        .select('*')
                        .eq('id', listId)
                        .single();

                    if (error || !data) {
                        showToast('Collection not found', 'error');
                        return;
                    }
                    list = { ...data, type: 'custom' };
                }

                if (listType === 'custom' && window.ListUtils) {
                    const [hydrated] = await ListUtils.hydrateListMetaForLists('game', [list], {
                        client: supabase,
                        userId: currentUser?.id,
                        ownerUserId: list?.user_id || userId
                    });
                    if (hydrated) list = hydrated;
                }
                if (listType === 'custom') {
                    await ensureCollaborativeAccessForList('game', list);
                }

                const listOwnerUserId = String(list?.user_id || userId || '').trim() || userId;
                const gameIds = await fetchMediaCollectionItemIds('game', listOwnerUserId, listId, listType);
                const tierMeta = getTierMetaForList('game', list, gameIds.length);
                const detailTitle = getCollectionTitleWithKind('game', list, listType);
                const detailDescription = tierMeta.isTier
                    ? `${list.description || ''}${list.description ? ' | ' : ''}Ranked list.`
                    : (list.description || '');
                const canEditList = listType === 'custom' && canEditCustomCollection('game', listId, list);
                const canDeleteList = listType === 'custom' && canDeleteCustomCollection('game', listId, list);

                if (isMobile) {
                    const titleEl = document.getElementById('mobileGameDetailTitle');
                    const descEl = document.getElementById('mobileGameDetailDescription');
                    const actions = document.getElementById('mobileGameDetailActions');
                    const editBtn = document.getElementById('mobileGameListEditBtn');
                    const deleteBtn = document.getElementById('mobileGameListDeleteBtn');
                    if (titleEl) titleEl.textContent = detailTitle;
                    if (descEl) descEl.textContent = detailDescription;
                    if (actions) actions.style.display = (canEditList || canDeleteList) ? 'flex' : 'none';
                    if (editBtn) editBtn.style.display = canEditList ? 'inline-flex' : 'none';
                    if (deleteBtn) deleteBtn.style.display = canDeleteList ? 'inline-flex' : 'none';
                    if (editBtn) editBtn.onclick = () => renameGameList(listId);
                    if (deleteBtn) deleteBtn.onclick = () => deleteGameList(listId);
                } else {
                    const iconEl = document.getElementById('gameDetailIcon');
                    const nameEl = document.getElementById('gameDetailName');
                    const descEl = document.getElementById('gameDetailDescription');
                    const actions = document.getElementById('gameDetailActions');
                    const editBtn = document.getElementById('gameListEditBtn');
                    const deleteBtn = document.getElementById('gameListDeleteBtn');
                    if (iconEl) iconEl.innerHTML = iconGlyph(list.icon, 'game');
                    if (nameEl) nameEl.textContent = detailTitle;
                    if (descEl) descEl.textContent = detailDescription;
                    if (actions) actions.style.display = (canEditList || canDeleteList) ? 'flex' : 'none';
                    if (editBtn) editBtn.style.display = canEditList ? 'inline-flex' : 'none';
                    if (deleteBtn) deleteBtn.style.display = canDeleteList ? 'inline-flex' : 'none';
                    if (editBtn) editBtn.onclick = () => renameGameList(listId);
                    if (deleteBtn) deleteBtn.onclick = () => deleteGameList(listId);
                }

                currentMediaDetail = { mediaType: 'game', listId, listType, isMobile };
                updateCollectionViewToggleButtons('game');
                await renderGameItems(gameIds, listId, listType, isMobile, list, listOwnerUserId);
            }

            async function renderGameItems(gameIds, listId, listType, isMobile, list = null, ownerUserId = null) {
                const container = isMobile ? document.getElementById('mobileGameItems') : document.getElementById('gameItemsContainer');
                if (!container) return;
                applyCollectionViewToContainer(container, 'game');

                if (!gameIds || gameIds.length === 0) {
                    container.innerHTML = `
                        <div class="${isMobile ? 'mobile-empty-state' : 'empty-state'}">
                            <div class="${isMobile ? 'mobile-empty-icon' : 'empty-icon'}">${iconGlyph('list')}</div>
                            <h3 class="${isMobile ? 'mobile-empty-title' : 'empty-title'}">No Games Yet</h3>
                            <p class="${isMobile ? 'mobile-empty-description' : 'empty-description'}">Add games to this collection!</p>
                        </div>
                    `;
                    wireTierDragAndDrop(container, null, null, 'default');
                    return;
                }

                container.innerHTML = '<div class="empty-state"><div class="empty-icon"><i class="fas fa-spinner fa-spin"></i></div><h3 class="empty-title">Loading...</h3></div>';
                const { tierMeta, orderedIds: rankedGameIds } = await resolveTierOrderedIds('game', list, listId, gameIds, {
                    listType,
                    ownerUserId
                });
                const canReorderList = canReorderCollectionItems('game', listId, listType, list);
                const canEditItems = canEditCollectionItems('game', listId, listType, list);

                const games = await Promise.all(rankedGameIds.map(async (id) => ({
                    id: String(id || '').trim(),
                    game: await fetchGameDetails(id)
                })));

                container.innerHTML = '';

                for (let index = 0; index < games.length; index += 1) {
                    const entry = games[index];
                    const game = entry?.game;
                    if (!game) continue;

                    const itemCard = document.createElement('div');
                    itemCard.className = 'collection-item-card';
                    const resolvedGameId = String(entry.id || game.id || '').trim();
                    if (!resolvedGameId) continue;
                    itemCard.onclick = () => window.location.href = `game.html?id=${encodeURIComponent(resolvedGameId)}`;

                    const gameTitle = game.name || game.slug || 'Untitled';
                    const safeGameId = resolvedGameId.replace(/'/g, "\\'");
                    const gameImage = normalizeGameImageSource(game);
                    const canReorder = canReorderList;
                    const rankMarkup = tierMeta.isTier
                        ? buildTierRankControlMarkup(
                            index + 1,
                            rankedGameIds.length,
                            canReorder
                        )
                        : '';

                    itemCard.innerHTML = `
                        <img class="collection-item-image" src="${gameImage}" alt="${gameTitle}" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='/newlogo.webp';">
                        <div class="collection-item-body">
                            <h3 class="collection-item-title">${gameTitle}</h3>
                            ${canEditItems ? `
                                <button class="collection-item-remove-inline" onclick="event.stopPropagation(); ProfileManager.removeFromCollection('${safeGameId}', '${listId}', 'game', '${listType}')">
                                    <i class="fas fa-times"></i> Remove
                                </button>
                            ` : ''}
                            <div class="collection-item-meta">
                                <span><i class="fas fa-calendar"></i> ${game.released ? new Date(game.released).getFullYear() : 'N/A'}</span>
                                <span><i class="fas fa-star"></i> ${game.rating ? game.rating.toFixed(1) : 'N/A'}</span>
                            </div>
                            ${rankMarkup}
                        </div>
                        ${canEditItems ? `
                            <button class="collection-item-remove" onclick="event.stopPropagation(); ProfileManager.removeFromCollection('${safeGameId}', '${listId}', 'game', '${listType}')">
                                <i class="fas fa-times"></i>
                            </button>
                        ` : ''}
                    `;

                    if (canReorder) {
                        itemCard.dataset.tierItemId = resolvedGameId;
                    }
                    container.appendChild(itemCard);
                }

                wireTierDragAndDrop(
                    container,
                    canReorderList ? 'game' : null,
                    canReorderList ? listId : null,
                    canReorderList ? listType : 'default'
                );
            }

            async function showBookDetail(listId, listType, isMobile) {
                if (isMobile) {
                    const mainSection = document.getElementById('mobileBooksSection');
                    const detailSection = document.getElementById('mobileBookDetailSection');
                    if (mainSection) {
                        mainSection.style.display = 'block';
                        mainSection.classList.add('active');
                        const titleEl = mainSection.querySelector('.mobile-section-title');
                        const subtitleEl = mainSection.querySelector('.mobile-section-subtitle');
                        const gridEl = document.getElementById('mobileBooksGrid');
                        if (titleEl) titleEl.style.display = 'none';
                        if (subtitleEl) subtitleEl.style.display = 'none';
                        if (gridEl) gridEl.style.display = 'none';
                    }
                    if (detailSection) {
                        detailSection.style.display = 'block';
                        detailSection.classList.add('active');
                    }
                } else {
                    const mainTab = document.getElementById('books-tab');
                    const detailView = document.getElementById('book-detail-view');
                    if (mainTab) mainTab.style.display = 'none';
                    if (detailView) {
                        detailView.style.display = 'block';
                        detailView.classList.add('active');
                    }
                }

                const userId = isViewingOwnProfile ? currentUser?.id : targetUserId;
                let list = null;

                if (listType === 'default') {
                    const titles = { favorites: 'Favorites', read: 'Read', readlist: 'Readlist' };
                    const icons = { favorites: 'heart', read: 'check', readlist: 'bookmark' };
                    const descriptions = { favorites: 'Books you love', read: 'Books you finished', readlist: 'Books to read' };
                    list = { id: listId, title: titles[listId], icon: icons[listId], description: descriptions[listId], type: 'default' };
                } else {
                    const { data, error } = await supabase.from('book_lists').select('*').eq('id', listId).single();
                    if (error || !data) {
                        showToast('Collection not found', 'error');
                        return;
                    }
                    list = { ...data, type: 'custom' };
                }

                if (listType === 'custom' && window.ListUtils) {
                    const [hydrated] = await ListUtils.hydrateListMetaForLists('book', [list], {
                        client: supabase,
                        userId: currentUser?.id,
                        ownerUserId: list?.user_id || userId
                    });
                    if (hydrated) list = hydrated;
                }
                if (listType === 'custom') {
                    await ensureCollaborativeAccessForList('book', list);
                }

                const listOwnerUserId = String(list?.user_id || userId || '').trim() || userId;
                const bookIds = await fetchMediaCollectionItemIds('book', listOwnerUserId, listId, listType);
                const tierMeta = getTierMetaForList('book', list, bookIds.length);
                const detailTitle = getCollectionTitleWithKind('book', list, listType);
                const detailDescription = tierMeta.isTier
                    ? `${list.description || ''}${list.description ? ' | ' : ''}Ranked list.`
                    : (list.description || '');
                const canEditList = listType === 'custom' && canEditCustomCollection('book', listId, list);
                const canDeleteList = listType === 'custom' && canDeleteCustomCollection('book', listId, list);

                if (isMobile) {
                    const titleEl = document.getElementById('mobileBookDetailTitle');
                    const descEl = document.getElementById('mobileBookDetailDescription');
                    const actions = document.getElementById('mobileBookDetailActions');
                    const editBtn = document.getElementById('mobileBookListEditBtn');
                    const deleteBtn = document.getElementById('mobileBookListDeleteBtn');
                    if (titleEl) titleEl.textContent = detailTitle;
                    if (descEl) descEl.textContent = detailDescription;
                    if (actions) actions.style.display = (canEditList || canDeleteList) ? 'flex' : 'none';
                    if (editBtn) editBtn.style.display = canEditList ? 'inline-flex' : 'none';
                    if (deleteBtn) deleteBtn.style.display = canDeleteList ? 'inline-flex' : 'none';
                    if (editBtn) editBtn.onclick = () => renameBookList(listId);
                    if (deleteBtn) deleteBtn.onclick = () => deleteBookList(listId);
                } else {
                    const iconEl = document.getElementById('bookDetailIcon');
                    const nameEl = document.getElementById('bookDetailName');
                    const descEl = document.getElementById('bookDetailDescription');
                    const actions = document.getElementById('bookDetailActions');
                    const editBtn = document.getElementById('bookListEditBtn');
                    const deleteBtn = document.getElementById('bookListDeleteBtn');
                    if (iconEl) iconEl.innerHTML = iconGlyph(list.icon, 'list');
                    if (nameEl) nameEl.textContent = detailTitle;
                    if (descEl) descEl.textContent = detailDescription;
                    if (actions) actions.style.display = (canEditList || canDeleteList) ? 'flex' : 'none';
                    if (editBtn) editBtn.style.display = canEditList ? 'inline-flex' : 'none';
                    if (deleteBtn) deleteBtn.style.display = canDeleteList ? 'inline-flex' : 'none';
                    if (editBtn) editBtn.onclick = () => renameBookList(listId);
                    if (deleteBtn) deleteBtn.onclick = () => deleteBookList(listId);
                }

                currentMediaDetail = { mediaType: 'book', listId, listType, isMobile };
                updateCollectionViewToggleButtons('book');
                await renderBookItems(bookIds, listId, listType, isMobile, list, listOwnerUserId);
            }

            async function renderBookItems(bookIds, listId, listType, isMobile, list = null, ownerUserId = null) {
                const container = isMobile ? document.getElementById('mobileBookItems') : document.getElementById('bookItemsContainer');
                if (!container) return;
                applyCollectionViewToContainer(container, 'book');

                if (!bookIds || bookIds.length === 0) {
                    container.innerHTML = `
                        <div class="${isMobile ? 'mobile-empty-state' : 'empty-state'}">
                            <div class="${isMobile ? 'mobile-empty-icon' : 'empty-icon'}">${iconGlyph('list')}</div>
                            <h3 class="${isMobile ? 'mobile-empty-title' : 'empty-title'}">No Books Yet</h3>
                            <p class="${isMobile ? 'mobile-empty-description' : 'empty-description'}">Add books to this collection!</p>
                        </div>
                    `;
                    wireTierDragAndDrop(container, null, null, 'default');
                    return;
                }

                const { tierMeta, orderedIds: rankedBookIds } = await resolveTierOrderedIds('book', list, listId, bookIds, {
                    listType,
                    ownerUserId
                });
                const canReorderList = canReorderCollectionItems('book', listId, listType, list);
                const canEditItems = canEditCollectionItems('book', listId, listType, list);

                container.innerHTML = '<div class="empty-state"><div class="empty-icon"><i class="fas fa-spinner fa-spin"></i></div><h3 class="empty-title">Loading...</h3></div>';
                const resolvedRows = await Promise.all(rankedBookIds.map((id) => resolveProfileBookRecord(id)));
                const bookData = resolvedRows.filter(Boolean);

                const bookMap = new Map();
                (bookData || []).forEach(row => bookMap.set(row.id, row));
                
                container.innerHTML = '';

                for (let i = 0; i < rankedBookIds.length; i++) {
                    const id = rankedBookIds[i];
                    const row = bookMap.get(id);
                    const title = row?.title || 'Untitled';
                    const rawAuthors = row?.authors;
                    let subtitle;
                    if (Array.isArray(rawAuthors)) {
                        subtitle = rawAuthors.join(', ');
                    } else if (typeof rawAuthors === 'string') {
                        subtitle = rawAuthors;
                    } else {
                        subtitle = row?.publisher || 'Unknown';
                    }
                    const metaYear = row?.published_date ? String(row.published_date).slice(0, 4) : 'N/A';
                    const image = row?.thumbnail || FALLBACK_BOOK_IMAGE;
                    const canReorder = canReorderList;
                    const rankMarkup = tierMeta.isTier
                        ? buildTierRankControlMarkup(
                            i + 1,
                            rankedBookIds.length,
                            canReorder
                        )
                        : '';

                    const itemCard = document.createElement('div');
                    itemCard.className = 'collection-item-card';
                    itemCard.onclick = () => window.location.href = `book.html?id=${encodeURIComponent(id)}`;

                    itemCard.innerHTML = `
                        <img class="collection-item-image" src="${image}" alt="${title}" loading="lazy" onerror="this.onerror=null;this.src='/newlogo.webp';">
                        <div class="collection-item-body">
                            <h3 class="collection-item-title">${ProfileManager.escapeHtml(title)}</h3>
                            ${canEditItems ? `
                                <button class="collection-item-remove-inline" onclick="event.stopPropagation(); ProfileManager.removeFromCollection('${id}', '${listId}', 'book', '${listType}')">
                                    <i class="fas fa-times"></i> Remove
                                </button>
                            ` : ''}
                            <div class="collection-item-meta">
                                <span><i class="fas fa-user"></i> ${ProfileManager.escapeHtml(subtitle)}</span>
                                <span><i class="fas fa-calendar"></i> ${ProfileManager.escapeHtml(metaYear)}</span>
                            </div>
                            ${rankMarkup}
                        </div>
                        ${canEditItems ? `
                            <button class="collection-item-remove" onclick="event.stopPropagation(); ProfileManager.removeFromCollection('${id}', '${listId}', 'book', '${listType}')">
                                <i class="fas fa-times"></i>
                            </button>
                        ` : ''}
                    `;
                    if (canReorder) {
                        itemCard.dataset.tierItemId = String(id || '').trim();
                    }
                    container.appendChild(itemCard);
                }

                wireTierDragAndDrop(
                    container,
                    canReorderList ? 'book' : null,
                    canReorderList ? listId : null,
                    canReorderList ? listType : 'default'
                );
            }

            async function showMusicDetail(listId, listType, isMobile) {
                if (isMobile) {
                    const mainSection = document.getElementById('mobileMusicSection');
                    const detailSection = document.getElementById('mobileMusicDetailSection');
                    if (mainSection) {
                        mainSection.style.display = 'block';
                        mainSection.classList.add('active');
                        const titleEl = mainSection.querySelector('.mobile-section-title');
                        const subtitleEl = mainSection.querySelector('.mobile-section-subtitle');
                        const gridEl = document.getElementById('mobileMusicGrid');
                        if (titleEl) titleEl.style.display = 'none';
                        if (subtitleEl) subtitleEl.style.display = 'none';
                        if (gridEl) gridEl.style.display = 'none';
                    }
                    if (detailSection) {
                        detailSection.style.display = 'block';
                        detailSection.classList.add('active');
                    }
                } else {
                    const mainTab = document.getElementById('music-tab');
                    const detailView = document.getElementById('music-detail-view');
                    if (mainTab) mainTab.style.display = 'none';
                    if (detailView) {
                        detailView.style.display = 'block';
                        detailView.classList.add('active');
                    }
                }

                const userId = isViewingOwnProfile ? currentUser?.id : targetUserId;
                let list = null;

                if (listType === 'default') {
                    const titles = { favorites: 'Favorites', listened: 'Listened', listenlist: 'Listenlist' };
                    const icons = { favorites: 'heart', listened: 'check', listenlist: 'bookmark' };
                    const descriptions = {
                        favorites: 'Tracks you love',
                        listened: 'Tracks you already played',
                        listenlist: 'Tracks to play later'
                    };
                    list = { id: listId, title: titles[listId], icon: icons[listId], description: descriptions[listId], type: 'default' };
                } else {
                    const { data, error } = await supabase.from('music_lists').select('*').eq('id', listId).single();
                    if (error || !data) {
                        showToast('Collection not found', 'error');
                        return;
                    }
                    list = { ...data, type: 'custom' };
                }

                if (listType === 'custom' && window.ListUtils) {
                    const [hydrated] = await ListUtils.hydrateListMetaForLists('music', [list], {
                        client: supabase,
                        userId: currentUser?.id,
                        ownerUserId: list?.user_id || userId
                    });
                    if (hydrated) list = hydrated;
                }
                if (listType === 'custom') {
                    await ensureCollaborativeAccessForList('music', list);
                }

                const listOwnerUserId = String(list?.user_id || userId || '').trim() || userId;
                const trackIds = await fetchMediaCollectionItemIds('music', listOwnerUserId, listId, listType);
                const tierMeta = getTierMetaForList('music', list, trackIds.length);
                const detailTitle = getCollectionTitleWithKind('music', list, listType);
                const detailDescription = tierMeta.isTier
                    ? `${list.description || ''}${list.description ? ' | ' : ''}Ranked list.`
                    : (list.description || '');
                const canEditList = listType === 'custom' && canEditCustomCollection('music', listId, list);
                const canDeleteList = listType === 'custom' && canDeleteCustomCollection('music', listId, list);

                if (isMobile) {
                    const titleEl = document.getElementById('mobileMusicDetailTitle');
                    const descEl = document.getElementById('mobileMusicDetailDescription');
                    const actions = document.getElementById('mobileMusicDetailActions');
                    const editBtn = document.getElementById('mobileMusicListEditBtn');
                    const deleteBtn = document.getElementById('mobileMusicListDeleteBtn');
                    if (titleEl) titleEl.textContent = detailTitle;
                    if (descEl) descEl.textContent = detailDescription;
                    if (actions) actions.style.display = (canEditList || canDeleteList) ? 'flex' : 'none';
                    if (editBtn) editBtn.style.display = canEditList ? 'inline-flex' : 'none';
                    if (deleteBtn) deleteBtn.style.display = canDeleteList ? 'inline-flex' : 'none';
                    if (editBtn) editBtn.onclick = () => renameMusicList(listId);
                    if (deleteBtn) deleteBtn.onclick = () => deleteMusicList(listId);
                } else {
                    const iconEl = document.getElementById('musicDetailIcon');
                    const nameEl = document.getElementById('musicDetailName');
                    const descEl = document.getElementById('musicDetailDescription');
                    const actions = document.getElementById('musicDetailActions');
                    const editBtn = document.getElementById('musicListEditBtn');
                    const deleteBtn = document.getElementById('musicListDeleteBtn');
                    if (iconEl) iconEl.innerHTML = iconGlyph(list.icon, 'music');
                    if (nameEl) nameEl.textContent = detailTitle;
                    if (descEl) descEl.textContent = detailDescription;
                    if (actions) actions.style.display = (canEditList || canDeleteList) ? 'flex' : 'none';
                    if (editBtn) editBtn.style.display = canEditList ? 'inline-flex' : 'none';
                    if (deleteBtn) deleteBtn.style.display = canDeleteList ? 'inline-flex' : 'none';
                    if (editBtn) editBtn.onclick = () => renameMusicList(listId);
                    if (deleteBtn) deleteBtn.onclick = () => deleteMusicList(listId);
                }

                currentMediaDetail = { mediaType: 'music', listId, listType, isMobile };
                updateCollectionViewToggleButtons('music');
                await renderMusicItems(trackIds, listId, listType, isMobile, list, listOwnerUserId);
            }

            async function renderMusicItems(trackIds, listId, listType, isMobile, list = null, ownerUserId = null) {
                const container = isMobile ? document.getElementById('mobileMusicItems') : document.getElementById('musicItemsContainer');
                if (!container) return;
                applyCollectionViewToContainer(container, 'music');

                if (!trackIds || trackIds.length === 0) {
                    container.innerHTML = `
                        <div class="${isMobile ? 'mobile-empty-state' : 'empty-state'}">
                            <div class="${isMobile ? 'mobile-empty-icon' : 'empty-icon'}">${iconGlyph('list')}</div>
                            <h3 class="${isMobile ? 'mobile-empty-title' : 'empty-title'}">No Music Yet</h3>
                            <p class="${isMobile ? 'mobile-empty-description' : 'empty-description'}">Add tracks to this collection!</p>
                        </div>
                    `;
                    wireTierDragAndDrop(container, null, null, 'default');
                    return;
                }

                container.innerHTML = '<div class="empty-state"><div class="empty-icon"><i class="fas fa-spinner fa-spin"></i></div><h3 class="empty-title">Loading...</h3></div>';
                const { tierMeta, orderedIds: rankedTrackIds } = await resolveTierOrderedIds('music', list, listId, trackIds, {
                    listType,
                    ownerUserId
                });
                const canReorderList = canReorderCollectionItems('music', listId, listType, list);
                const canEditItems = canEditCollectionItems('music', listId, listType, list);
                const tracks = await Promise.all(rankedTrackIds.map((id) => fetchMusicDetails(id)));
                container.innerHTML = '';

                for (let i = 0; i < rankedTrackIds.length; i++) {
                    const trackId = rankedTrackIds[i];
                    const track = tracks[i];
                    const title = track?.name || 'Track';
                    const artists = String(track?.artists || 'Unknown Artist').trim() || 'Unknown Artist';
                    const album = String(track?.album_name || 'Album').trim() || 'Album';
                    const image = String(track?.image_url || '').trim() || '/newlogo.webp';
                    const openUrl = trackId ? `song.html?id=${encodeURIComponent(trackId)}` : 'music.html';
                    const canReorder = canReorderList;
                    const rankMarkup = tierMeta.isTier
                        ? buildTierRankControlMarkup(
                            i + 1,
                            rankedTrackIds.length,
                            canReorder
                        )
                        : '';

                    const itemCard = document.createElement('div');
                    itemCard.className = 'collection-item-card';
                    itemCard.onclick = () => {
                        window.location.href = openUrl;
                    };

                    itemCard.innerHTML = `
                        <img class="collection-item-image" src="${image}" alt="${ProfileManager.escapeHtml(title)}" loading="lazy" onerror="this.onerror=null;this.src='/newlogo.webp';">
                        <div class="collection-item-body">
                            <h3 class="collection-item-title">${ProfileManager.escapeHtml(title)}</h3>
                            ${canEditItems ? `
                                <button class="collection-item-remove-inline" onclick="event.stopPropagation(); ProfileManager.removeFromCollection('${trackId}', '${listId}', 'music', '${listType}')">
                                    <i class="fas fa-times"></i> Remove
                                </button>
                            ` : ''}
                            <div class="collection-item-meta">
                                <span><i class="fas fa-user"></i> ${ProfileManager.escapeHtml(artists)}</span>
                                <span><i class="fas fa-compact-disc"></i> ${ProfileManager.escapeHtml(album)}</span>
                            </div>
                            ${rankMarkup}
                        </div>
                        ${canEditItems ? `
                            <button class="collection-item-remove" onclick="event.stopPropagation(); ProfileManager.removeFromCollection('${trackId}', '${listId}', 'music', '${listType}')">
                                <i class="fas fa-times"></i>
                            </button>
                        ` : ''}
                    `;
                    if (canReorder) {
                        itemCard.dataset.tierItemId = String(trackId || '').trim();
                    }
                    container.appendChild(itemCard);
                }

                wireTierDragAndDrop(
                    container,
                    canReorderList ? 'music' : null,
                    canReorderList ? listId : null,
                    canReorderList ? listType : 'default'
                );
            }

            async function showTravelDetail(listId, listType, isMobile) {
                if (isMobile) {
                    const mainSection = document.getElementById('mobileTravelSection');
                    const detailSection = document.getElementById('mobileTravelDetailSection');
                    if (mainSection) {
                        mainSection.style.display = 'block';
                        mainSection.classList.add('active');
                        const titleEl = mainSection.querySelector('.mobile-section-title');
                        const subtitleEl = mainSection.querySelector('.mobile-section-subtitle');
                        const gridEl = document.getElementById('mobileTravelGrid');
                        if (titleEl) titleEl.style.display = 'none';
                        if (subtitleEl) subtitleEl.style.display = 'none';
                        if (gridEl) gridEl.style.display = 'none';
                    }
                    if (detailSection) {
                        detailSection.style.display = 'block';
                        detailSection.classList.add('active');
                    }
                } else {
                    const mainTab = document.getElementById('travel-tab');
                    const detailView = document.getElementById('travel-detail-view');
                    if (mainTab) mainTab.style.display = 'none';
                    if (detailView) {
                        detailView.style.display = 'block';
                        detailView.classList.add('active');
                    }
                }

                const userId = isViewingOwnProfile ? currentUser?.id : targetUserId;
                let list = null;

                if (listType === 'default') {
                    const titles = { favorites: 'Favorites', visited: 'Visited', bucketlist: 'Bucket List' };
                    const icons = { favorites: 'heart', visited: 'check', bucketlist: 'bookmark' };
                    const descriptions = {
                        favorites: 'Countries you love',
                        visited: 'Countries you visited',
                        bucketlist: 'Countries you want to visit'
                    };
                    list = { id: listId, title: titles[listId] || 'Travel', icon: icons[listId] || 'travel', description: descriptions[listId] || '', type: 'default' };
                } else {
                    const { data, error } = await supabase.from('travel_lists').select('*').eq('id', listId).single();
                    if (error || !data) {
                        showToast('Collection not found', 'error');
                        return;
                    }
                    list = { ...data, type: 'custom' };
                }

                if (listType === 'custom' && window.ListUtils) {
                    const [hydrated] = await ListUtils.hydrateListMetaForLists('travel', [list], {
                        client: supabase,
                        userId: currentUser?.id,
                        ownerUserId: list?.user_id || userId
                    });
                    if (hydrated) list = hydrated;
                }
                if (listType === 'custom') {
                    await ensureCollaborativeAccessForList('travel', list);
                }

                const listOwnerUserId = String(list?.user_id || userId || '').trim() || userId;
                const countryCodes = await fetchMediaCollectionItemIds('travel', listOwnerUserId, listId, listType);
                const tierMeta = getTierMetaForList('travel', list, countryCodes.length);
                const detailTitle = getCollectionTitleWithKind('travel', list, listType);
                const detailDescription = tierMeta.isTier
                    ? `${list.description || ''}${list.description ? ' | ' : ''}Ranked list.`
                    : (list.description || '');
                const canEditList = listType === 'custom' && canEditCustomCollection('travel', listId, list);
                const canDeleteList = listType === 'custom' && canDeleteCustomCollection('travel', listId, list);

                if (isMobile) {
                    const titleEl = document.getElementById('mobileTravelDetailTitle');
                    const descEl = document.getElementById('mobileTravelDetailDescription');
                    const actions = document.getElementById('mobileTravelDetailActions');
                    const editBtn = document.getElementById('mobileTravelListEditBtn');
                    const deleteBtn = document.getElementById('mobileTravelListDeleteBtn');
                    if (titleEl) titleEl.textContent = detailTitle;
                    if (descEl) descEl.textContent = detailDescription;
                    if (actions) actions.style.display = (canEditList || canDeleteList) ? 'flex' : 'none';
                    if (editBtn) editBtn.style.display = canEditList ? 'inline-flex' : 'none';
                    if (deleteBtn) deleteBtn.style.display = canDeleteList ? 'inline-flex' : 'none';
                    if (editBtn) editBtn.onclick = () => renameTravelList(listId);
                    if (deleteBtn) deleteBtn.onclick = () => deleteTravelList(listId);
                } else {
                    const iconEl = document.getElementById('travelDetailIcon');
                    const nameEl = document.getElementById('travelDetailName');
                    const descEl = document.getElementById('travelDetailDescription');
                    const actions = document.getElementById('travelDetailActions');
                    const editBtn = document.getElementById('travelListEditBtn');
                    const deleteBtn = document.getElementById('travelListDeleteBtn');
                    if (iconEl) iconEl.innerHTML = iconGlyph(list.icon, 'travel');
                    if (nameEl) nameEl.textContent = detailTitle;
                    if (descEl) descEl.textContent = detailDescription;
                    if (actions) actions.style.display = (canEditList || canDeleteList) ? 'flex' : 'none';
                    if (editBtn) editBtn.style.display = canEditList ? 'inline-flex' : 'none';
                    if (deleteBtn) deleteBtn.style.display = canDeleteList ? 'inline-flex' : 'none';
                    if (editBtn) editBtn.onclick = () => renameTravelList(listId);
                    if (deleteBtn) deleteBtn.onclick = () => deleteTravelList(listId);
                }

                currentMediaDetail = { mediaType: 'travel', listId, listType, isMobile };
                updateCollectionViewToggleButtons('travel');
                await renderTravelItems(countryCodes, listId, listType, isMobile, list, listOwnerUserId);
            }

            async function renderTravelItems(countryCodes, listId, listType, isMobile, list = null, ownerUserId = null) {
                const container = isMobile ? document.getElementById('mobileTravelItems') : document.getElementById('travelItemsContainer');
                if (!container) return;
                applyCollectionViewToContainer(container, 'travel');

                if (!countryCodes || countryCodes.length === 0) {
                    container.innerHTML = `
                        <div class="${isMobile ? 'mobile-empty-state' : 'empty-state'}">
                            <div class="${isMobile ? 'mobile-empty-icon' : 'empty-icon'}">${iconGlyph('travel')}</div>
                            <h3 class="${isMobile ? 'mobile-empty-title' : 'empty-title'}">No Countries Yet</h3>
                            <p class="${isMobile ? 'mobile-empty-description' : 'empty-description'}">Add countries to this collection!</p>
                        </div>
                    `;
                    wireTierDragAndDrop(container, null, null, 'default');
                    return;
                }

                const { tierMeta, orderedIds: rankedCountryCodes } = await resolveTierOrderedIds('travel', list, listId, countryCodes, {
                    listType,
                    ownerUserId
                });
                const canReorderList = canReorderCollectionItems('travel', listId, listType, list);
                const canEditItems = canEditCollectionItems('travel', listId, listType, list);
                const countryMap = await fetchTravelCountriesByCodes(rankedCountryCodes);
                container.innerHTML = '';

                for (let i = 0; i < rankedCountryCodes.length; i++) {
                    const code = normalizeCountryCode(rankedCountryCodes[i]);
                    if (!code) continue;
                    const country = countryMap.get(code) || {
                        code,
                        name: code,
                        capital: '',
                        region: '',
                        subregion: '',
                        flag: countryFlagFromCode(code)
                    };
                    const title = String(country.name || code).trim() || code;
                    const capital = String(country.capital || '').trim();
                    const region = String(country.region || '').trim();
                    const subregion = String(country.subregion || '').trim();
                    const metaRegion = [region, subregion].filter(Boolean).join(' | ');
                    const image = String(country.flag || '').trim() || countryFlagFromCode(code);
                    const canReorder = canReorderList;
                    const rankMarkup = tierMeta.isTier
                        ? buildTierRankControlMarkup(
                            i + 1,
                            rankedCountryCodes.length,
                            canReorder
                        )
                        : '';

                    const itemCard = document.createElement('div');
                    itemCard.className = 'collection-item-card';
                    itemCard.onclick = () => {
                        window.location.href = `country.html?code=${encodeURIComponent(code)}`;
                    };

                    itemCard.innerHTML = `
                        <img class="collection-item-image" src="${escapeHtml(image)}" alt="${escapeHtml(title)} flag" loading="lazy" onerror="this.onerror=null;this.src='/newlogo.webp';">
                        <div class="collection-item-body">
                            <h3 class="collection-item-title">${escapeHtml(title)}</h3>
                            ${canEditItems ? `
                                <button class="collection-item-remove-inline" onclick="event.stopPropagation(); ProfileManager.removeFromCollection('${escapeHtml(code)}', '${listId}', 'travel', '${listType}')">
                                    <i class="fas fa-times"></i> Remove
                                </button>
                            ` : ''}
                            <div class="collection-item-meta">
                                <span><i class="fas fa-map-pin"></i> ${escapeHtml(capital ? `Capital: ${capital}` : 'Capital: N/A')}</span>
                                <span><i class="fas fa-earth-americas"></i> ${escapeHtml(metaRegion || 'Region unavailable')}</span>
                            </div>
                            ${rankMarkup}
                        </div>
                        ${canEditItems ? `
                            <button class="collection-item-remove" onclick="event.stopPropagation(); ProfileManager.removeFromCollection('${escapeHtml(code)}', '${listId}', 'travel', '${listType}')">
                                <i class="fas fa-times"></i>
                            </button>
                        ` : ''}
                    `;
                    if (canReorder) {
                        itemCard.dataset.tierItemId = code;
                    }
                    container.appendChild(itemCard);
                }

                wireTierDragAndDrop(
                    container,
                    canReorderList ? 'travel' : null,
                    canReorderList ? listId : null,
                    canReorderList ? listType : 'default'
                );
            }

            async function showFashionDetail(listId, listType, isMobile) {
                if (isMobile) {
                    const mainSection = document.getElementById('mobileFashionSection');
                    const detailSection = document.getElementById('mobileFashionDetailSection');
                    if (mainSection) {
                        mainSection.style.display = 'block';
                        mainSection.classList.add('active');
                        const titleEl = mainSection.querySelector('.mobile-section-title');
                        const subtitleEl = mainSection.querySelector('.mobile-section-subtitle');
                        const gridEl = document.getElementById('mobileFashionGrid');
                        if (titleEl) titleEl.style.display = 'none';
                        if (subtitleEl) subtitleEl.style.display = 'none';
                        if (gridEl) gridEl.style.display = 'none';
                    }
                    if (detailSection) {
                        detailSection.style.display = 'block';
                        detailSection.classList.add('active');
                    }
                } else {
                    const mainTab = document.getElementById('fashion-tab');
                    const detailView = document.getElementById('fashion-detail-view');
                    if (mainTab) mainTab.style.display = 'none';
                    if (detailView) {
                        detailView.style.display = 'block';
                        detailView.classList.add('active');
                    }
                }

                const userId = isViewingOwnProfile ? currentUser?.id : targetUserId;
                let list = null;

                if (listType === 'default') {
                    const titles = { favorites: 'Favorites', owned: 'Owned', wishlist: 'Wishlist' };
                    const icons = { favorites: 'heart', owned: 'check', wishlist: 'bookmark' };
                    const descriptions = {
                        favorites: 'Brands you love',
                        owned: 'Brands you own',
                        wishlist: 'Brands you want to try'
                    };
                    list = { id: listId, title: titles[listId] || 'Fashion', icon: icons[listId] || 'fashion', description: descriptions[listId] || '', type: 'default' };
                } else {
                    const { data, error } = await supabase.from('fashion_lists').select('*').eq('id', listId).single();
                    if (error || !data) {
                        showToast('Collection not found', 'error');
                        return;
                    }
                    list = { ...data, type: 'custom' };
                }

                if (listType === 'custom' && window.ListUtils) {
                    const [hydrated] = await ListUtils.hydrateListMetaForLists('fashion', [list], {
                        client: supabase,
                        userId: currentUser?.id,
                        ownerUserId: list?.user_id || userId
                    });
                    if (hydrated) list = hydrated;
                }
                if (listType === 'custom') {
                    await ensureCollaborativeAccessForList('fashion', list);
                }

                const listOwnerUserId = String(list?.user_id || userId || '').trim() || userId;
                const brandIds = await fetchMediaCollectionItemIds('fashion', listOwnerUserId, listId, listType);
                const tierMeta = getTierMetaForList('fashion', list, brandIds.length);
                const detailTitle = getCollectionTitleWithKind('fashion', list, listType);
                const detailDescription = tierMeta.isTier
                    ? `${list.description || ''}${list.description ? ' | ' : ''}Ranked list.`
                    : (list.description || '');
                const canEditList = listType === 'custom' && canEditCustomCollection('fashion', listId, list);
                const canDeleteList = listType === 'custom' && canDeleteCustomCollection('fashion', listId, list);

                if (isMobile) {
                    const titleEl = document.getElementById('mobileFashionDetailTitle');
                    const descEl = document.getElementById('mobileFashionDetailDescription');
                    const actions = document.getElementById('mobileFashionDetailActions');
                    const editBtn = document.getElementById('mobileFashionListEditBtn');
                    const deleteBtn = document.getElementById('mobileFashionListDeleteBtn');
                    if (titleEl) titleEl.textContent = detailTitle;
                    if (descEl) descEl.textContent = detailDescription;
                    if (actions) actions.style.display = (canEditList || canDeleteList) ? 'flex' : 'none';
                    if (editBtn) editBtn.style.display = canEditList ? 'inline-flex' : 'none';
                    if (deleteBtn) deleteBtn.style.display = canDeleteList ? 'inline-flex' : 'none';
                    if (editBtn) editBtn.onclick = () => renameFashionList(listId);
                    if (deleteBtn) deleteBtn.onclick = () => deleteFashionList(listId);
                } else {
                    const iconEl = document.getElementById('fashionDetailIcon');
                    const nameEl = document.getElementById('fashionDetailName');
                    const descEl = document.getElementById('fashionDetailDescription');
                    const actions = document.getElementById('fashionDetailActions');
                    const editBtn = document.getElementById('fashionListEditBtn');
                    const deleteBtn = document.getElementById('fashionListDeleteBtn');
                    if (iconEl) iconEl.innerHTML = iconGlyph(list.icon, 'fashion');
                    if (nameEl) nameEl.textContent = detailTitle;
                    if (descEl) descEl.textContent = detailDescription;
                    if (actions) actions.style.display = (canEditList || canDeleteList) ? 'flex' : 'none';
                    if (editBtn) editBtn.style.display = canEditList ? 'inline-flex' : 'none';
                    if (deleteBtn) deleteBtn.style.display = canDeleteList ? 'inline-flex' : 'none';
                    if (editBtn) editBtn.onclick = () => renameFashionList(listId);
                    if (deleteBtn) deleteBtn.onclick = () => deleteFashionList(listId);
                }

                currentMediaDetail = { mediaType: 'fashion', listId, listType, isMobile };
                updateCollectionViewToggleButtons('fashion');
                await renderFashionItems(brandIds, listId, listType, isMobile, list, listOwnerUserId);
            }

            async function renderFashionItems(brandIds, listId, listType, isMobile, list = null, ownerUserId = null) {
                const container = isMobile ? document.getElementById('mobileFashionItems') : document.getElementById('fashionItemsContainer');
                if (!container) return;
                applyCollectionViewToContainer(container, 'fashion');

                if (!brandIds || brandIds.length === 0) {
                    container.innerHTML = `
                        <div class="${isMobile ? 'mobile-empty-state' : 'empty-state'}">
                            <div class="${isMobile ? 'mobile-empty-icon' : 'empty-icon'}">${iconGlyph('fashion')}</div>
                            <h3 class="${isMobile ? 'mobile-empty-title' : 'empty-title'}">No Brands Yet</h3>
                            <p class="${isMobile ? 'mobile-empty-description' : 'empty-description'}">Add brands to this collection!</p>
                        </div>
                    `;
                    wireTierDragAndDrop(container, null, null, 'default');
                    return;
                }

                const { tierMeta, orderedIds } = await resolveTierOrderedIds('fashion', list, listId, brandIds, {
                    listType,
                    ownerUserId
                });
                const canReorderList = canReorderCollectionItems('fashion', listId, listType, list);
                const canEditItems = canEditCollectionItems('fashion', listId, listType, list);
                const brandMap = await fetchBrandMapByIds('fashion', orderedIds);
                container.innerHTML = '';

                for (let i = 0; i < orderedIds.length; i++) {
                    const id = String(orderedIds[i] || '').trim();
                    if (!id) continue;
                    const brand = brandMap.get(id) || { id, name: 'Brand', logo: '/newlogo.webp', category: '' };
                    const title = String(brand.name || 'Brand').trim();
                    const category = String(brand.category || '').trim();
                    const country = String(brand.country || '').trim();
                    const meta = [category, country].filter(Boolean).join(' | ');
                    const image = String(brand.logo || '').trim() || '/newlogo.webp';
                    const rankMarkup = tierMeta.isTier
                        ? buildTierRankControlMarkup(
                            i + 1,
                            orderedIds.length,
                            canReorderList
                        )
                        : '';

                    const itemCard = document.createElement('div');
                    itemCard.className = 'collection-item-card';
                    itemCard.onclick = () => {
                        window.location.href = `brand.html?type=fashion&id=${encodeURIComponent(id)}`;
                    };

                    itemCard.innerHTML = `
                        <img class="collection-item-image brand-logo-stage" src="${escapeHtml(image)}" alt="${escapeHtml(title)} logo" loading="lazy" onerror="this.onerror=null;this.src='/newlogo.webp';">
                        <div class="collection-item-body">
                            <h3 class="collection-item-title">${escapeHtml(title)}</h3>
                            ${canEditItems ? `
                                <button class="collection-item-remove-inline" onclick="event.stopPropagation(); ProfileManager.removeFromCollection('${escapeHtml(id)}', '${listId}', 'fashion', '${listType}')">
                                    <i class="fas fa-times"></i> Remove
                                </button>
                            ` : ''}
                            <div class="collection-item-meta">
                                <span><i class="fas fa-tag"></i> ${escapeHtml(meta || 'Brand details unavailable')}</span>
                            </div>
                            ${rankMarkup}
                        </div>
                        ${canEditItems ? `
                            <button class="collection-item-remove" onclick="event.stopPropagation(); ProfileManager.removeFromCollection('${escapeHtml(id)}', '${listId}', 'fashion', '${listType}')">
                                <i class="fas fa-times"></i>
                            </button>
                        ` : ''}
                    `;
                    if (canReorderList) {
                        itemCard.dataset.tierItemId = id;
                    }
                    container.appendChild(itemCard);
                }

                wireTierDragAndDrop(
                    container,
                    canReorderList ? 'fashion' : null,
                    canReorderList ? listId : null,
                    canReorderList ? listType : 'default'
                );
            }

            async function showCarDetail(listId, listType, isMobile) {
                if (isMobile) {
                    const mainSection = document.getElementById('mobileCarsSection');
                    const detailSection = document.getElementById('mobileCarsDetailSection');
                    if (mainSection) {
                        mainSection.style.display = 'block';
                        mainSection.classList.add('active');
                        const titleEl = mainSection.querySelector('.mobile-section-title');
                        const subtitleEl = mainSection.querySelector('.mobile-section-subtitle');
                        const gridEl = document.getElementById('mobileCarsGrid');
                        if (titleEl) titleEl.style.display = 'none';
                        if (subtitleEl) subtitleEl.style.display = 'none';
                        if (gridEl) gridEl.style.display = 'none';
                    }
                    if (detailSection) {
                        detailSection.style.display = 'block';
                        detailSection.classList.add('active');
                    }
                } else {
                    const mainTab = document.getElementById('cars-tab');
                    const detailView = document.getElementById('cars-detail-view');
                    if (mainTab) mainTab.style.display = 'none';
                    if (detailView) {
                        detailView.style.display = 'block';
                        detailView.classList.add('active');
                    }
                }

                const userId = isViewingOwnProfile ? currentUser?.id : targetUserId;
                if (!userId) return;
                if (!supabase) supabase = ensureSupabaseClient();
                if (!supabase) return;

                let list = await fetchCustomListById('car', listId);
                if (!list) return;

                if (listType === 'custom' && window.ListUtils) {
                    const [hydrated] = await ListUtils.hydrateListMetaForLists('car', [list], {
                        client: supabase,
                        userId: currentUser?.id,
                        ownerUserId: list?.user_id || userId
                    });
                    if (hydrated) list = hydrated;
                }
                if (listType === 'custom') {
                    await ensureCollaborativeAccessForList('car', list);
                }

                const listOwnerUserId = String(list?.user_id || userId || '').trim() || userId;
                const brandIds = await fetchMediaCollectionItemIds('car', listOwnerUserId, listId, listType);
                const tierMeta = getTierMetaForList('car', list, brandIds.length);
                const detailTitle = getCollectionTitleWithKind('car', list, listType);
                const detailDescription = tierMeta.isTier
                    ? `${list.description || ''}${list.description ? ' | ' : ''}Ranked list.`
                    : (list.description || '');
                const canEditList = listType === 'custom' && canEditCustomCollection('car', listId, list);
                const canDeleteList = listType === 'custom' && canDeleteCustomCollection('car', listId, list);

                if (isMobile) {
                    const titleEl = document.getElementById('mobileCarsDetailTitle');
                    const descEl = document.getElementById('mobileCarsDetailDescription');
                    const actions = document.getElementById('mobileCarsDetailActions');
                    const editBtn = document.getElementById('mobileCarsListEditBtn');
                    const deleteBtn = document.getElementById('mobileCarsListDeleteBtn');
                    if (titleEl) titleEl.textContent = detailTitle;
                    if (descEl) descEl.textContent = detailDescription;
                    if (actions) actions.style.display = (canEditList || canDeleteList) ? 'flex' : 'none';
                    if (editBtn) editBtn.style.display = canEditList ? 'inline-flex' : 'none';
                    if (deleteBtn) deleteBtn.style.display = canDeleteList ? 'inline-flex' : 'none';
                    if (editBtn) editBtn.onclick = () => renameCarList(listId);
                    if (deleteBtn) deleteBtn.onclick = () => deleteCarList(listId);
                } else {
                    const iconEl = document.getElementById('carsDetailIcon');
                    const nameEl = document.getElementById('carsDetailName');
                    const descEl = document.getElementById('carsDetailDescription');
                    const actions = document.getElementById('carsDetailActions');
                    const editBtn = document.getElementById('carsListEditBtn');
                    const deleteBtn = document.getElementById('carsListDeleteBtn');
                    if (iconEl) iconEl.innerHTML = iconGlyph(list.icon, 'car');
                    if (nameEl) nameEl.textContent = detailTitle;
                    if (descEl) descEl.textContent = detailDescription;
                    if (actions) actions.style.display = (canEditList || canDeleteList) ? 'flex' : 'none';
                    if (editBtn) editBtn.style.display = canEditList ? 'inline-flex' : 'none';
                    if (deleteBtn) deleteBtn.style.display = canDeleteList ? 'inline-flex' : 'none';
                    if (editBtn) editBtn.onclick = () => renameCarList(listId);
                    if (deleteBtn) deleteBtn.onclick = () => deleteCarList(listId);
                }

                currentMediaDetail = { mediaType: 'car', listId, listType, isMobile };
                updateCollectionViewToggleButtons('car');
                await renderCarItems(brandIds, listId, listType, isMobile, list, listOwnerUserId);
            }

            async function renderCarItems(brandIds, listId, listType, isMobile, list = null, ownerUserId = null) {
                const container = isMobile ? document.getElementById('mobileCarsItems') : document.getElementById('carsItemsContainer');
                if (!container) return;
                applyCollectionViewToContainer(container, 'car');

                if (!brandIds || brandIds.length === 0) {
                    container.innerHTML = `
                        <div class="${isMobile ? 'mobile-empty-state' : 'empty-state'}">
                            <div class="${isMobile ? 'mobile-empty-icon' : 'empty-icon'}">${iconGlyph('car')}</div>
                            <h3 class="${isMobile ? 'mobile-empty-title' : 'empty-title'}">No Brands Yet</h3>
                            <p class="${isMobile ? 'mobile-empty-description' : 'empty-description'}">Add brands to this collection!</p>
                        </div>
                    `;
                    wireTierDragAndDrop(container, null, null, 'default');
                    return;
                }

                const { tierMeta, orderedIds } = await resolveTierOrderedIds('car', list, listId, brandIds, {
                    listType,
                    ownerUserId
                });
                const canReorderList = canReorderCollectionItems('car', listId, listType, list);
                const canEditItems = canEditCollectionItems('car', listId, listType, list);
                const brandMap = await fetchBrandMapByIds('car', orderedIds);
                container.innerHTML = '';

                for (let i = 0; i < orderedIds.length; i++) {
                    const id = String(orderedIds[i] || '').trim();
                    if (!id) continue;
                    const brand = brandMap.get(id) || { id, name: 'Brand', logo: '/newlogo.webp', category: '' };
                    const title = String(brand.name || 'Brand').trim();
                    const category = String(brand.category || '').trim();
                    const country = String(brand.country || '').trim();
                    const meta = [category, country].filter(Boolean).join(' | ');
                    const image = String(brand.logo || '').trim() || '/newlogo.webp';
                    const rankMarkup = tierMeta.isTier
                        ? buildTierRankControlMarkup(
                            i + 1,
                            orderedIds.length,
                            canReorderList
                        )
                        : '';

                    const itemCard = document.createElement('div');
                    itemCard.className = 'collection-item-card';
                    itemCard.onclick = () => {
                        window.location.href = `brand.html?type=car&id=${encodeURIComponent(id)}`;
                    };

                    itemCard.innerHTML = `
                        <img class="collection-item-image brand-logo-stage" src="${escapeHtml(image)}" alt="${escapeHtml(title)} logo" loading="lazy" onerror="this.onerror=null;this.src='/newlogo.webp';">
                        <div class="collection-item-body">
                            <h3 class="collection-item-title">${escapeHtml(title)}</h3>
                            ${canEditItems ? `
                                <button class="collection-item-remove-inline" onclick="event.stopPropagation(); ProfileManager.removeFromCollection('${escapeHtml(id)}', '${listId}', 'car', '${listType}')">
                                    <i class="fas fa-times"></i> Remove
                                </button>
                            ` : ''}
                            <div class="collection-item-meta">
                                <span><i class="fas fa-tag"></i> ${escapeHtml(meta || 'Brand details unavailable')}</span>
                            </div>
                            ${rankMarkup}
                        </div>
                        ${canEditItems ? `
                            <button class="collection-item-remove" onclick="event.stopPropagation(); ProfileManager.removeFromCollection('${escapeHtml(id)}', '${listId}', 'car', '${listType}')">
                                <i class="fas fa-times"></i>
                            </button>
                        ` : ''}
                    `;
                    if (canReorderList) {
                        itemCard.dataset.tierItemId = id;
                    }
                    container.appendChild(itemCard);
                }

                wireTierDragAndDrop(
                    container,
                    canReorderList ? 'car' : null,
                    canReorderList ? listId : null,
                    canReorderList ? listType : 'default'
                );
            }

            async function showFoodDetail(listId, listType, isMobile) {
                if (isMobile) {
                    const mainSection = document.getElementById('mobileFoodSection');
                    const detailSection = document.getElementById('mobileFoodDetailSection');
                    if (mainSection) {
                        mainSection.style.display = 'block';
                        mainSection.classList.add('active');
                        const titleEl = mainSection.querySelector('.mobile-section-title');
                        const subtitleEl = mainSection.querySelector('.mobile-section-subtitle');
                        const gridEl = document.getElementById('mobileFoodGrid');
                        if (titleEl) titleEl.style.display = 'none';
                        if (subtitleEl) subtitleEl.style.display = 'none';
                        if (gridEl) gridEl.style.display = 'none';
                    }
                    if (detailSection) {
                        detailSection.style.display = 'block';
                        detailSection.classList.add('active');
                    }
                } else {
                    const mainTab = document.getElementById('food-tab');
                    const detailView = document.getElementById('food-detail-view');
                    if (mainTab) mainTab.style.display = 'none';
                    if (detailView) {
                        detailView.style.display = 'block';
                        detailView.classList.add('active');
                    }
                }

                const userId = isViewingOwnProfile ? currentUser?.id : targetUserId;
                let list = null;

                if (listType === 'default') {
                    const titles = { favorites: 'Favorites', tried: 'Tried', want_to_try: 'Want to Try' };
                    const icons = { favorites: 'heart', tried: 'check', want_to_try: 'bookmark' };
                    const descriptions = {
                        favorites: 'Brands you love',
                        tried: 'Places you tried',
                        want_to_try: 'Places you want to try'
                    };
                    list = { id: listId, title: titles[listId] || 'Food', icon: icons[listId] || 'food', description: descriptions[listId] || '', type: 'default' };
                } else {
                    const { data, error } = await supabase.from('food_lists').select('*').eq('id', listId).single();
                    if (error || !data) {
                        showToast('Collection not found', 'error');
                        return;
                    }
                    list = { ...data, type: 'custom' };
                }

                if (listType === 'custom' && window.ListUtils) {
                    const [hydrated] = await ListUtils.hydrateListMetaForLists('food', [list], {
                        client: supabase,
                        userId: currentUser?.id,
                        ownerUserId: list?.user_id || userId
                    });
                    if (hydrated) list = hydrated;
                }
                if (listType === 'custom') {
                    await ensureCollaborativeAccessForList('food', list);
                }

                const listOwnerUserId = String(list?.user_id || userId || '').trim() || userId;
                const brandIds = await fetchMediaCollectionItemIds('food', listOwnerUserId, listId, listType);
                const tierMeta = getTierMetaForList('food', list, brandIds.length);
                const detailTitle = getCollectionTitleWithKind('food', list, listType);
                const detailDescription = tierMeta.isTier
                    ? `${list.description || ''}${list.description ? ' | ' : ''}Ranked list.`
                    : (list.description || '');
                const canEditList = listType === 'custom' && canEditCustomCollection('food', listId, list);
                const canDeleteList = listType === 'custom' && canDeleteCustomCollection('food', listId, list);

                if (isMobile) {
                    const titleEl = document.getElementById('mobileFoodDetailTitle');
                    const descEl = document.getElementById('mobileFoodDetailDescription');
                    const actions = document.getElementById('mobileFoodDetailActions');
                    const editBtn = document.getElementById('mobileFoodListEditBtn');
                    const deleteBtn = document.getElementById('mobileFoodListDeleteBtn');
                    if (titleEl) titleEl.textContent = detailTitle;
                    if (descEl) descEl.textContent = detailDescription;
                    if (actions) actions.style.display = (canEditList || canDeleteList) ? 'flex' : 'none';
                    if (editBtn) editBtn.style.display = canEditList ? 'inline-flex' : 'none';
                    if (deleteBtn) deleteBtn.style.display = canDeleteList ? 'inline-flex' : 'none';
                    if (editBtn) editBtn.onclick = () => renameFoodList(listId);
                    if (deleteBtn) deleteBtn.onclick = () => deleteFoodList(listId);
                } else {
                    const iconEl = document.getElementById('foodDetailIcon');
                    const nameEl = document.getElementById('foodDetailName');
                    const descEl = document.getElementById('foodDetailDescription');
                    const actions = document.getElementById('foodDetailActions');
                    const editBtn = document.getElementById('foodListEditBtn');
                    const deleteBtn = document.getElementById('foodListDeleteBtn');
                    if (iconEl) iconEl.innerHTML = iconGlyph(list.icon, 'food');
                    if (nameEl) nameEl.textContent = detailTitle;
                    if (descEl) descEl.textContent = detailDescription;
                    if (actions) actions.style.display = (canEditList || canDeleteList) ? 'flex' : 'none';
                    if (editBtn) editBtn.style.display = canEditList ? 'inline-flex' : 'none';
                    if (deleteBtn) deleteBtn.style.display = canDeleteList ? 'inline-flex' : 'none';
                    if (editBtn) editBtn.onclick = () => renameFoodList(listId);
                    if (deleteBtn) deleteBtn.onclick = () => deleteFoodList(listId);
                }

                currentMediaDetail = { mediaType: 'food', listId, listType, isMobile };
                updateCollectionViewToggleButtons('food');
                await renderFoodItems(brandIds, listId, listType, isMobile, list, listOwnerUserId);
            }

            async function renderFoodItems(brandIds, listId, listType, isMobile, list = null, ownerUserId = null) {
                const container = isMobile ? document.getElementById('mobileFoodItems') : document.getElementById('foodItemsContainer');
                if (!container) return;
                applyCollectionViewToContainer(container, 'food');

                if (!brandIds || brandIds.length === 0) {
                    container.innerHTML = `
                        <div class="${isMobile ? 'mobile-empty-state' : 'empty-state'}">
                            <div class="${isMobile ? 'mobile-empty-icon' : 'empty-icon'}">${iconGlyph('food')}</div>
                            <h3 class="${isMobile ? 'mobile-empty-title' : 'empty-title'}">No Brands Yet</h3>
                            <p class="${isMobile ? 'mobile-empty-description' : 'empty-description'}">Add brands to this collection!</p>
                        </div>
                    `;
                    wireTierDragAndDrop(container, null, null, 'default');
                    return;
                }

                const { tierMeta, orderedIds } = await resolveTierOrderedIds('food', list, listId, brandIds, {
                    listType,
                    ownerUserId
                });
                const canReorderList = canReorderCollectionItems('food', listId, listType, list);
                const canEditItems = canEditCollectionItems('food', listId, listType, list);
                const brandMap = await fetchBrandMapByIds('food', orderedIds);
                container.innerHTML = '';

                for (let i = 0; i < orderedIds.length; i++) {
                    const id = String(orderedIds[i] || '').trim();
                    if (!id) continue;
                    const brand = brandMap.get(id) || { id, name: 'Brand', logo: '/newlogo.webp', category: '' };
                    const title = String(brand.name || 'Brand').trim();
                    const category = String(brand.category || '').trim();
                    const country = String(brand.country || '').trim();
                    const meta = [category, country].filter(Boolean).join(' | ');
                    const image = String(brand.logo || '').trim() || '/newlogo.webp';
                    const rankMarkup = tierMeta.isTier
                        ? buildTierRankControlMarkup(
                            i + 1,
                            orderedIds.length,
                            canReorderList
                        )
                        : '';

                    const itemCard = document.createElement('div');
                    itemCard.className = 'collection-item-card';
                    itemCard.onclick = () => {
                        window.location.href = `brand.html?type=food&id=${encodeURIComponent(id)}`;
                    };

                    itemCard.innerHTML = `
                        <img class="collection-item-image brand-logo-stage" src="${escapeHtml(image)}" alt="${escapeHtml(title)} logo" loading="lazy" onerror="this.onerror=null;this.src='/newlogo.webp';">
                        <div class="collection-item-body">
                            <h3 class="collection-item-title">${escapeHtml(title)}</h3>
                            ${canEditItems ? `
                                <button class="collection-item-remove-inline" onclick="event.stopPropagation(); ProfileManager.removeFromCollection('${escapeHtml(id)}', '${listId}', 'food', '${listType}')">
                                    <i class="fas fa-times"></i> Remove
                                </button>
                            ` : ''}
                            <div class="collection-item-meta">
                                <span><i class="fas fa-tag"></i> ${escapeHtml(meta || 'Brand details unavailable')}</span>
                            </div>
                            ${rankMarkup}
                        </div>
                        ${canEditItems ? `
                            <button class="collection-item-remove" onclick="event.stopPropagation(); ProfileManager.removeFromCollection('${escapeHtml(id)}', '${listId}', 'food', '${listType}')">
                                <i class="fas fa-times"></i>
                            </button>
                        ` : ''}
                    `;
                    if (canReorderList) {
                        itemCard.dataset.tierItemId = id;
                    }
                    container.appendChild(itemCard);
                }

                wireTierDragAndDrop(
                    container,
                    canReorderList ? 'food' : null,
                    canReorderList ? listId : null,
                    canReorderList ? listType : 'default'
                );
            }

            function escapeHtml(text) {
                if (!text) return '';
                return String(text)
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#039;');
            }

            function hideBookDetail() {
                if (leaveCollectionRoute('books')) return;
                currentMediaDetail = null;
                const isMobile = window.innerWidth <= 768;
                if (isMobile) {
                    const detailSection = document.getElementById('mobileBookDetailSection');
                    const mainSection = document.getElementById('mobileBooksSection');
                    if (detailSection) detailSection.style.display = 'none';
                    if (mainSection) {
                        mainSection.style.display = 'block';
                        mainSection.classList.add('active');
                        const titleEl = mainSection.querySelector('.mobile-section-title');
                        const subtitleEl = mainSection.querySelector('.mobile-section-subtitle');
                        const gridEl = document.getElementById('mobileBooksGrid');
                        if (titleEl) titleEl.style.display = '';
                        if (subtitleEl) subtitleEl.style.display = '';
                        if (gridEl) gridEl.style.display = '';
                    }
                } else {
                    const detailView = document.getElementById('book-detail-view');
                    const mainTab = document.getElementById('books-tab');
                    if (detailView) detailView.style.display = 'none';
                    if (mainTab) {
                        mainTab.style.display = 'block';
                        mainTab.classList.add('active');
                    }
                }
            }
            // ===== CREATE/RENAME/DELETE BOOK LIST (OVERRIDES) =====
                        async function createBookList() {
                await openMediaListCreator('book');
            }

            async function renameBookList(listId) {
                await openMediaListEditor('book', listId);
            }

            async function deleteBookList(listId) {
                if (!supabase || !currentUser || !isViewingOwnProfile) return;
                const accessRecord = await fetchCustomListAccessRecord('book', listId);
                if (!accessRecord || !canDeleteCustomCollection('book', listId, accessRecord)) {
                    showToast('Only the list owner can delete this list', 'warning');
                    return;
                }

                if (!confirm('Delete this book list? This cannot be undone.')) return;

                try {
                    const userId = currentUser.id;

                    // First delete all items in the list
                    await supabase
                        .from('book_list_items')
                        .delete()
                        .eq('user_id', userId)
                        .eq('list_id', listId);

                    // Then delete the list itself
                    const { error } = await supabase
                        .from('book_lists')
                        .delete()
                        .eq('id', listId)
                        .eq('user_id', userId);

                    if (error) throw error;

                    hideBookDetail();
                    await renderBooks();
                    showToast('List deleted', 'success');
                } catch (error) {
                    console.error('Error deleting book list:', error);
                    showToast('Could not delete list', 'error');
                }
            }

            async function createMusicList() {
                await openMediaListCreator('music');
            }

            async function renameMusicList(listId) {
                await openMediaListEditor('music', listId);
            }

            async function deleteMusicList(listId) {
                if (!supabase || !currentUser || !isViewingOwnProfile) return;
                const accessRecord = await fetchCustomListAccessRecord('music', listId);
                if (!accessRecord || !canDeleteCustomCollection('music', listId, accessRecord)) {
                    showToast('Only the list owner can delete this list', 'warning');
                    return;
                }
                if (!confirm('Delete this music list? This cannot be undone.')) return;

                try {
                    const userId = currentUser.id;
                    await supabase
                        .from('music_list_items')
                        .delete()
                        .eq('user_id', userId)
                        .eq('list_id', listId);
                    const { error } = await supabase
                        .from('music_lists')
                        .delete()
                        .eq('id', listId)
                        .eq('user_id', userId);
                    if (error) throw error;

                    hideMusicDetail();
                    await renderMusic();
                    showToast('List deleted', 'success');
                } catch (error) {
                    console.error('Error deleting music list:', error);
                    showToast('Could not delete list', 'error');
                }
            }

            async function createTravelList() {
                await openMediaListCreator('travel');
            }

            async function renameTravelList(listId) {
                await openMediaListEditor('travel', listId);
            }

            async function deleteTravelList(listId) {
                if (!supabase || !currentUser || !isViewingOwnProfile) return;
                const accessRecord = await fetchCustomListAccessRecord('travel', listId);
                if (!accessRecord || !canDeleteCustomCollection('travel', listId, accessRecord)) {
                    showToast('Only the list owner can delete this list', 'warning');
                    return;
                }
                if (!confirm('Delete this travel list? This cannot be undone.')) return;

                try {
                    const userId = currentUser.id;
                    await supabase
                        .from('travel_list_items')
                        .delete()
                        .eq('user_id', userId)
                        .eq('list_id', listId);
                    const { error } = await supabase
                        .from('travel_lists')
                        .delete()
                        .eq('id', listId)
                        .eq('user_id', userId);
                    if (error) throw error;

                    hideTravelDetail();
                    await renderTravel();
                    showToast('List deleted', 'success');
                } catch (error) {
                    console.error('Error deleting travel list:', error);
                    showToast('Could not delete list', 'error');
                }
            }

            async function createFashionList() {
                await openMediaListCreator('fashion');
            }

            async function renameFashionList(listId) {
                await openMediaListEditor('fashion', listId);
            }

            async function deleteFashionList(listId) {
                if (!supabase || !currentUser || !isViewingOwnProfile) return;
                const accessRecord = await fetchCustomListAccessRecord('fashion', listId);
                if (!accessRecord || !canDeleteCustomCollection('fashion', listId, accessRecord)) {
                    showToast('Only the list owner can delete this list', 'warning');
                    return;
                }
                if (!confirm('Delete this fashion list? This cannot be undone.')) return;

                try {
                    const userId = currentUser.id;
                    await supabase
                        .from('fashion_list_items')
                        .delete()
                        .eq('user_id', userId)
                        .eq('list_id', listId);
                    const { error } = await supabase
                        .from('fashion_lists')
                        .delete()
                        .eq('id', listId)
                        .eq('user_id', userId);
                    if (error) throw error;

                    hideFashionDetail();
                    await renderFashion();
                    showToast('List deleted', 'success');
                } catch (error) {
                    console.error('Error deleting fashion list:', error);
                    showToast('Could not delete list', 'error');
                }
            }

            async function createFoodList() {
                await openMediaListCreator('food');
            }

            async function createCarList() {
                await openMediaListCreator('car');
            }

            async function renameFoodList(listId) {
                await openMediaListEditor('food', listId);
            }

            async function renameCarList(listId) {
                await openMediaListEditor('car', listId);
            }

            async function deleteFoodList(listId) {
                if (!supabase || !currentUser || !isViewingOwnProfile) return;
                const accessRecord = await fetchCustomListAccessRecord('food', listId);
                if (!accessRecord || !canDeleteCustomCollection('food', listId, accessRecord)) {
                    showToast('Only the list owner can delete this list', 'warning');
                    return;
                }
                if (!confirm('Delete this food list? This cannot be undone.')) return;

                try {
                    const userId = currentUser.id;
                    await supabase
                        .from('food_list_items')
                        .delete()
                        .eq('user_id', userId)
                        .eq('list_id', listId);
                    const { error } = await supabase
                        .from('food_lists')
                        .delete()
                        .eq('id', listId)
                        .eq('user_id', userId);
                    if (error) throw error;

                    hideFoodDetail();
                    await renderFood();
                    showToast('List deleted', 'success');
                } catch (error) {
                    console.error('Error deleting food list:', error);
                    showToast('Could not delete list', 'error');
                }
            }

            async function deleteCarList(listId) {
                if (!supabase || !currentUser || !isViewingOwnProfile) return;
                const accessRecord = await fetchCustomListAccessRecord('car', listId);
                if (!accessRecord || !canDeleteCustomCollection('car', listId, accessRecord)) {
                    showToast('Only the list owner can delete this list', 'warning');
                    return;
                }
                if (!confirm('Delete this car list? This cannot be undone.')) return;

                try {
                    const userId = currentUser.id;
                    await supabase
                        .from('car_list_items')
                        .delete()
                        .eq('user_id', userId)
                        .eq('list_id', listId);
                    const { error } = await supabase
                        .from('car_lists')
                        .delete()
                        .eq('id', listId)
                        .eq('user_id', userId);
                    if (error) throw error;

                    hideCarDetail();
                    await renderCars();
                    showToast('List deleted', 'success');
                } catch (error) {
                    console.error('Error deleting car list:', error);
                    showToast('Could not delete list', 'error');
                }
            }

            function hideRestaurantDetail() {
                if (leaveCollectionRoute('restaurants')) return;
                currentMediaDetail = null;
                const isMobile = window.innerWidth <= 768;
                if (isMobile) {
                    const detailSection = document.getElementById('mobileRestaurantDetailSection');
                    const mainSection = document.getElementById('mobileRestaurantsSection');
                    if (detailSection) detailSection.style.display = 'none';
                    if (mainSection) {
                        mainSection.style.display = 'block';
                        mainSection.classList.add('active');
                    }
                } else {
                    const detailView = document.getElementById('restaurant-detail-view');
                    const mainTab = document.getElementById('restaurants-tab');
                    if (detailView) detailView.style.display = 'none';
                    if (mainTab) {
                        mainTab.style.display = 'block';
                        mainTab.classList.add('active');
                    }
                }
            }

            function hideMovieDetail() {
                if (leaveCollectionRoute('movies')) return;
                currentMediaDetail = null;
                const isMobile = window.innerWidth <= 768;
                if (isMobile) {
                    const detailSection = document.getElementById('mobileMovieDetailSection');
                    const mainSection = document.getElementById('mobileMoviesSection');
                    if (detailSection) detailSection.style.display = 'none';
                    if (mainSection) {
                        mainSection.style.display = 'block';
                        mainSection.classList.add('active');
                        const titleEl = mainSection.querySelector('.mobile-section-title');
                        const subtitleEl = mainSection.querySelector('.mobile-section-subtitle');
                        const gridEl = document.getElementById('mobileMoviesGrid');
                        if (titleEl) titleEl.style.display = '';
                        if (subtitleEl) subtitleEl.style.display = '';
                        if (gridEl) gridEl.style.display = '';
                    }
                } else {
                    const detailView = document.getElementById('movie-detail-view');
                    const mainTab = document.getElementById('movies-tab');
                    if (detailView) detailView.style.display = 'none';
                    if (mainTab) {
                        mainTab.style.display = 'block';
                        mainTab.classList.add('active');
                    }
                }
            }

            function hideMusicDetail() {
                if (leaveCollectionRoute('music')) return;
                currentMediaDetail = null;
                const isMobile = window.innerWidth <= 768;
                if (isMobile) {
                    const detailSection = document.getElementById('mobileMusicDetailSection');
                    const mainSection = document.getElementById('mobileMusicSection');
                    if (detailSection) detailSection.style.display = 'none';
                    if (mainSection) {
                        mainSection.style.display = 'block';
                        mainSection.classList.add('active');
                        const titleEl = mainSection.querySelector('.mobile-section-title');
                        const subtitleEl = mainSection.querySelector('.mobile-section-subtitle');
                        const gridEl = document.getElementById('mobileMusicGrid');
                        if (titleEl) titleEl.style.display = '';
                        if (subtitleEl) subtitleEl.style.display = '';
                        if (gridEl) gridEl.style.display = '';
                    }
                } else {
                    const detailView = document.getElementById('music-detail-view');
                    const mainTab = document.getElementById('music-tab');
                    if (detailView) detailView.style.display = 'none';
                    if (mainTab) {
                        mainTab.style.display = 'block';
                        mainTab.classList.add('active');
                    }
                }
            }

            function hideTravelDetail() {
                if (leaveCollectionRoute('travel')) return;
                currentMediaDetail = null;
                const isMobile = window.innerWidth <= 768;
                if (isMobile) {
                    const detailSection = document.getElementById('mobileTravelDetailSection');
                    const mainSection = document.getElementById('mobileTravelSection');
                    if (detailSection) detailSection.style.display = 'none';
                    if (mainSection) {
                        mainSection.style.display = 'block';
                        mainSection.classList.add('active');
                        const titleEl = mainSection.querySelector('.mobile-section-title');
                        const subtitleEl = mainSection.querySelector('.mobile-section-subtitle');
                        const gridEl = document.getElementById('mobileTravelGrid');
                        if (titleEl) titleEl.style.display = '';
                        if (subtitleEl) subtitleEl.style.display = '';
                        if (gridEl) gridEl.style.display = '';
                    }
                } else {
                    const detailView = document.getElementById('travel-detail-view');
                    const mainTab = document.getElementById('travel-tab');
                    if (detailView) detailView.style.display = 'none';
                    if (mainTab) {
                        mainTab.style.display = 'block';
                        mainTab.classList.add('active');
                    }
                }
            }

            function hideFashionDetail() {
                if (leaveCollectionRoute('fashion')) return;
                currentMediaDetail = null;
                const isMobile = window.innerWidth <= 768;
                if (isMobile) {
                    const detailSection = document.getElementById('mobileFashionDetailSection');
                    const mainSection = document.getElementById('mobileFashionSection');
                    if (detailSection) detailSection.style.display = 'none';
                    if (mainSection) {
                        mainSection.style.display = 'block';
                        mainSection.classList.add('active');
                        const titleEl = mainSection.querySelector('.mobile-section-title');
                        const subtitleEl = mainSection.querySelector('.mobile-section-subtitle');
                        const gridEl = document.getElementById('mobileFashionGrid');
                        if (titleEl) titleEl.style.display = '';
                        if (subtitleEl) subtitleEl.style.display = '';
                        if (gridEl) gridEl.style.display = '';
                    }
                } else {
                    const detailView = document.getElementById('fashion-detail-view');
                    const mainTab = document.getElementById('fashion-tab');
                    if (detailView) detailView.style.display = 'none';
                    if (mainTab) {
                        mainTab.style.display = 'block';
                        mainTab.classList.add('active');
                    }
                }
            }

            function hideCarDetail() {
                if (leaveCollectionRoute('car')) return;
                currentMediaDetail = null;
                const isMobile = window.innerWidth <= 768;
                if (isMobile) {
                    const detailSection = document.getElementById('mobileCarsDetailSection');
                    const mainSection = document.getElementById('mobileCarsSection');
                    if (detailSection) detailSection.style.display = 'none';
                    if (mainSection) {
                        mainSection.style.display = 'block';
                        mainSection.classList.add('active');
                        const titleEl = mainSection.querySelector('.mobile-section-title');
                        const subtitleEl = mainSection.querySelector('.mobile-section-subtitle');
                        const gridEl = document.getElementById('mobileCarsGrid');
                        if (titleEl) titleEl.style.display = '';
                        if (subtitleEl) subtitleEl.style.display = '';
                        if (gridEl) gridEl.style.display = '';
                    }
                } else {
                    const detailView = document.getElementById('cars-detail-view');
                    const mainTab = document.getElementById('cars-tab');
                    if (detailView) detailView.style.display = 'none';
                    if (mainTab) {
                        mainTab.style.display = 'block';
                        mainTab.classList.add('active');
                    }
                }
            }

            function hideFoodDetail() {
                if (leaveCollectionRoute('food')) return;
                currentMediaDetail = null;
                const isMobile = window.innerWidth <= 768;
                if (isMobile) {
                    const detailSection = document.getElementById('mobileFoodDetailSection');
                    const mainSection = document.getElementById('mobileFoodSection');
                    if (detailSection) detailSection.style.display = 'none';
                    if (mainSection) {
                        mainSection.style.display = 'block';
                        mainSection.classList.add('active');
                        const titleEl = mainSection.querySelector('.mobile-section-title');
                        const subtitleEl = mainSection.querySelector('.mobile-section-subtitle');
                        const gridEl = document.getElementById('mobileFoodGrid');
                        if (titleEl) titleEl.style.display = '';
                        if (subtitleEl) subtitleEl.style.display = '';
                        if (gridEl) gridEl.style.display = '';
                    }
                } else {
                    const detailView = document.getElementById('food-detail-view');
                    const mainTab = document.getElementById('food-tab');
                    if (detailView) detailView.style.display = 'none';
                    if (mainTab) {
                        mainTab.style.display = 'block';
                        mainTab.classList.add('active');
                    }
                }
            }

            function hideTvDetail() {
                if (leaveCollectionRoute('tv')) return;
                currentMediaDetail = null;
                const isMobile = window.innerWidth <= 768;
                if (isMobile) {
                    const detailSection = document.getElementById('mobileTvDetailSection');
                    const mainSection = document.getElementById('mobileTvSection');
                    if (detailSection) detailSection.style.display = 'none';
                    if (mainSection) {
                        mainSection.style.display = 'block';
                        mainSection.classList.add('active');
                        const titleEl = mainSection.querySelector('.mobile-section-title');
                        const subtitleEl = mainSection.querySelector('.mobile-section-subtitle');
                        const gridEl = document.getElementById('mobileTvGrid');
                        if (titleEl) titleEl.style.display = '';
                        if (subtitleEl) subtitleEl.style.display = '';
                        if (gridEl) gridEl.style.display = '';
                    }
                } else {
                    const detailView = document.getElementById('tv-detail-view');
                    const mainTab = document.getElementById('tv-tab');
                    if (detailView) detailView.style.display = 'none';
                    if (mainTab) {
                        mainTab.style.display = 'block';
                        mainTab.classList.add('active');
                    }
                }
            }

            function hideAnimeDetail() {
                if (leaveCollectionRoute('anime')) return;
                currentMediaDetail = null;
                const isMobile = window.innerWidth <= 768;
                if (isMobile) {
                    const detailSection = document.getElementById('mobileAnimeDetailSection');
                    const mainSection = document.getElementById('mobileAnimeSection');
                    if (detailSection) detailSection.style.display = 'none';
                    if (mainSection) {
                        mainSection.style.display = 'block';
                        mainSection.classList.add('active');
                        const titleEl = mainSection.querySelector('.mobile-section-title');
                        const subtitleEl = mainSection.querySelector('.mobile-section-subtitle');
                        const gridEl = document.getElementById('mobileAnimeGrid');
                        if (titleEl) titleEl.style.display = '';
                        if (subtitleEl) subtitleEl.style.display = '';
                        if (gridEl) gridEl.style.display = '';
                    }
                } else {
                    const detailView = document.getElementById('anime-detail-view');
                    const mainTab = document.getElementById('anime-tab');
                    if (detailView) detailView.style.display = 'none';
                    if (mainTab) {
                        mainTab.style.display = 'block';
                        mainTab.classList.add('active');
                    }
                }
            }

            function hideGameDetail() {
                if (leaveCollectionRoute('games')) return;
                currentMediaDetail = null;
                const isMobile = window.innerWidth <= 768;
                if (isMobile) {
                    const detailSection = document.getElementById('mobileGameDetailSection');
                    const mainSection = document.getElementById('mobileGamesSection');
                    if (detailSection) detailSection.style.display = 'none';
                    if (mainSection) {
                        mainSection.style.display = 'block';
                        mainSection.classList.add('active');
                        const titleEl = mainSection.querySelector('.mobile-section-title');
                        const subtitleEl = mainSection.querySelector('.mobile-section-subtitle');
                        const gridEl = document.getElementById('mobileGamesGrid');
                        if (titleEl) titleEl.style.display = '';
                        if (subtitleEl) subtitleEl.style.display = '';
                        if (gridEl) gridEl.style.display = '';
                    }
                } else {
                    const detailView = document.getElementById('game-detail-view');
                    const mainTab = document.getElementById('games-tab');
                    if (detailView) detailView.style.display = 'none';
                    if (mainTab) {
                        mainTab.style.display = 'block';
                        mainTab.classList.add('active');
                    }
                }
            }

            function toggleCollectionMenu(id, type) {
                const dropdown = document.getElementById(`collection-${type}-${id}`);
                if (!dropdown) return;
                document.querySelectorAll('.collection-dropdown').forEach(d => {
                    if (d.id !== `collection-${type}-${id}`) {
                        d.classList.remove('show');
                    }
                });
                dropdown.classList.toggle('show');
            }

            async function removeFromCollection(itemId, collectionId, type, listType = 'custom') {
                const userId = isViewingOwnProfile ? currentUser?.id : targetUserId;
                const trigger = window.event?.currentTarget instanceof HTMLElement
                    ? window.event.currentTarget
                    : null;
                const removableNode = trigger
                    ? trigger.closest('.collection-item-card, .movie-list-movie-card, .mobile-list-restaurant-card, .mobile-journal-entry')
                    : null;
                let restoreRemovedNode = null;

                const refreshCollectionViews = () => {
                    if (type === 'restaurant') {
                        void showRestaurantDetail(collectionId, window.innerWidth <= 768);
                        void renderRestaurants();
                    } else if (type === 'movie') {
                        void showMovieDetail(collectionId, listType, window.innerWidth <= 768);
                        void renderMovies();
                    } else if (type === 'tv') {
                        void showTvDetail(collectionId, listType, window.innerWidth <= 768);
                        void renderTvShows();
                    } else if (type === 'anime') {
                        void showAnimeDetail(collectionId, listType, window.innerWidth <= 768);
                        void renderAnimeShows();
                    } else if (type === 'game') {
                        void showGameDetail(collectionId, listType, window.innerWidth <= 768);
                        void renderGames();
                    } else if (type === 'music') {
                        void showMusicDetail(collectionId, listType, window.innerWidth <= 768);
                        void renderMusic();
                    } else if (type === 'travel') {
                        void showTravelDetail(collectionId, listType, window.innerWidth <= 768);
                        void renderTravel();
                    } else if (type === 'fashion') {
                        void showFashionDetail(collectionId, listType, window.innerWidth <= 768);
                        void renderFashion();
                    } else if (type === 'food') {
                        void showFoodDetail(collectionId, listType, window.innerWidth <= 768);
                        void renderFood();
                    } else if (type === 'car') {
                        void showCarDetail(collectionId, listType, window.innerWidth <= 768);
                        void renderCars();
                    } else {
                        void showBookDetail(collectionId, listType, window.innerWidth <= 768);
                        void renderBooks();
                    }
                };

                try {
                    if (type !== 'restaurant') {
                        let canEdit = canEditCollectionItems(type, collectionId, listType);
                        if (!canEdit && String(listType || '').toLowerCase() === 'custom') {
                            const accessRecord = await fetchCustomListAccessRecord(type, collectionId);
                            canEdit = !!accessRecord && canEditCollectionItems(type, collectionId, listType, accessRecord);
                        }
                        if (!canEdit) {
                            showToast('You do not have permission to edit this list', 'warning');
                            return;
                        }
                    }

                    if (removableNode instanceof HTMLElement) {
                        const previousDisplay = removableNode.style.display;
                        const previousOpacity = removableNode.style.opacity;
                        const previousTransform = removableNode.style.transform;
                        const previousPointerEvents = removableNode.style.pointerEvents;
                        removableNode.style.pointerEvents = 'none';
                        removableNode.style.opacity = '0.22';
                        removableNode.style.transform = 'scale(0.98)';
                        window.setTimeout(() => {
                            removableNode.style.display = 'none';
                        }, 60);
                        restoreRemovedNode = () => {
                            removableNode.style.display = previousDisplay;
                            removableNode.style.opacity = previousOpacity;
                            removableNode.style.transform = previousTransform;
                            removableNode.style.pointerEvents = previousPointerEvents;
                        };
                    }

                    if (type === 'restaurant') {
                        const { error } = await supabase
                            .from('lists_restraunts')
                            .delete()
                            .eq('list_id', collectionId)
                            .eq('restraunt_id', itemId);
                        if (error) throw error;
                    } else if (type === 'movie') {
                        const query = supabase.from('movie_list_items').delete();
                        const { error } = listType === 'default'
                            ? await query.eq('user_id', userId).eq('movie_id', itemId).eq('list_type', collectionId)
                            : await query.eq('movie_id', itemId).eq('list_id', collectionId);
                        if (error) throw error;
                    } else if (type === 'tv') {
                        const query = supabase.from('tv_list_items').delete();
                        const { error } = listType === 'default'
                            ? await query.eq('user_id', userId).eq('tv_id', itemId).eq('list_type', collectionId)
                            : await query.eq('tv_id', itemId).eq('list_id', collectionId);
                        if (error) throw error;
                    } else if (type === 'anime') {
                        const query = supabase.from('anime_list_items').delete();
                        const { error } = listType === 'default'
                            ? await query.eq('user_id', userId).eq('anime_id', itemId).eq('list_type', collectionId)
                            : await query.eq('anime_id', itemId).eq('list_id', collectionId);
                        if (error) throw error;
                    } else if (type === 'game') {
                        const query = supabase.from('game_list_items').delete();
                        const { error } = listType === 'default'
                            ? await query.eq('user_id', userId).eq('game_id', itemId).eq('list_type', collectionId)
                            : await query.eq('game_id', itemId).eq('list_id', collectionId);
                        if (error) throw error;
                    } else if (type === 'music') {
                        const query = supabase.from('music_list_items').delete();
                        const { error } = listType === 'default'
                            ? await query.eq('user_id', userId).eq('track_id', itemId).eq('list_type', collectionId)
                            : await query.eq('track_id', itemId).eq('list_id', collectionId);
                        if (error) throw error;
                    } else if (type === 'travel') {
                        const query = supabase.from('travel_list_items').delete();
                        const { error } = listType === 'default'
                            ? await query.eq('user_id', userId).eq('country_code', itemId).eq('list_type', collectionId)
                            : await query.eq('country_code', itemId).eq('list_id', collectionId);
                        if (error) throw error;
                    } else if (type === 'fashion') {
                        const query = supabase.from('fashion_list_items').delete();
                        const { error } = listType === 'default'
                            ? await query.eq('user_id', userId).eq('brand_id', itemId).eq('list_type', collectionId)
                            : await query.eq('brand_id', itemId).eq('list_id', collectionId);
                        if (error) throw error;
                    } else if (type === 'food') {
                        const query = supabase.from('food_list_items').delete();
                        const { error } = listType === 'default'
                            ? await query.eq('user_id', userId).eq('brand_id', itemId).eq('list_type', collectionId)
                            : await query.eq('brand_id', itemId).eq('list_id', collectionId);
                        if (error) throw error;
                    } else if (type === 'car') {
                        const query = supabase.from('car_list_items').delete();
                        const { error } = listType === 'default'
                            ? await query.eq('user_id', userId).eq('brand_id', itemId).eq('list_type', collectionId)
                            : await query.eq('brand_id', itemId).eq('list_id', collectionId);
                        if (error) throw error;
                    } else {
                        const query = supabase.from('book_list_items').delete();
                        const { error } = listType === 'default'
                            ? await query.eq('user_id', userId).eq('book_id', itemId).eq('list_type', collectionId)
                            : await query.eq('book_id', itemId).eq('list_id', collectionId);
                        if (error) throw error;
                    }

                    showToast('Removed from collection', 'success');
                    refreshCollectionViews();
                } catch (error) {
                    if (typeof restoreRemovedNode === 'function') {
                        restoreRemovedNode();
                    }
                    console.error('Error removing item:', error);
                    showToast('Failed to remove item', 'error');
                    refreshCollectionViews();
                }
            }

            async function editCollection(id, type) {
                if (type === 'restaurant') {
                    if (typeof ProfileManager.prepareEditList === 'function') {
                        ProfileManager.prepareEditList(id);
                    }
                    return;
                }

                const accessRecord = await fetchCustomListAccessRecord(type, id);
                if (!accessRecord || !canEditCustomCollection(type, id, accessRecord)) {
                    showToast('You do not have permission to edit this list', 'warning');
                    return;
                }

                await openMediaListEditor(type, id);
            }

            async function deleteCollection(id, type) {
                if (type !== 'restaurant') {
                    const accessRecord = await fetchCustomListAccessRecord(type, id);
                    if (!accessRecord || !canDeleteCustomCollection(type, id, accessRecord)) {
                        showToast('Only the list owner can delete this list', 'warning');
                        return;
                    }
                }
                showConfirmModal(
                    'Delete Collection',
                    'Are you sure? This cannot be undone.',
                    async () => {
                        try {
                            if (type === 'restaurant') {
                                await supabase.from('lists_restraunts').delete().eq('list_id', id);
                                await supabase.from('lists').delete().eq('id', id);
                            } else if (type === 'movie') {
                                const collabCleanup = await supabase
                                    .from(LIST_COLLAB_TABLE)
                                    .delete()
                                    .eq('media_type', 'movie')
                                    .eq('list_id', String(id));
                                if (collabCleanup?.error && String(collabCleanup.error.code || '').trim() !== '42P01') {
                                    console.warn('Could not remove collaborators for movie list:', collabCleanup.error);
                                }
                                await supabase.from('movie_list_items').delete().eq('list_id', id);
                                await supabase.from('movie_lists').delete().eq('id', id);
                            } else if (type === 'tv') {
                                const collabCleanup = await supabase
                                    .from(LIST_COLLAB_TABLE)
                                    .delete()
                                    .eq('media_type', 'tv')
                                    .eq('list_id', String(id));
                                if (collabCleanup?.error && String(collabCleanup.error.code || '').trim() !== '42P01') {
                                    console.warn('Could not remove collaborators for TV list:', collabCleanup.error);
                                }
                                await supabase.from('tv_list_items').delete().eq('list_id', id);
                                await supabase.from('tv_lists').delete().eq('id', id);
                            } else if (type === 'anime') {
                                const collabCleanup = await supabase
                                    .from(LIST_COLLAB_TABLE)
                                    .delete()
                                    .eq('media_type', 'anime')
                                    .eq('list_id', String(id));
                                if (collabCleanup?.error && String(collabCleanup.error.code || '').trim() !== '42P01') {
                                    console.warn('Could not remove collaborators for anime list:', collabCleanup.error);
                                }
                                await supabase.from('anime_list_items').delete().eq('list_id', id);
                                await supabase.from('anime_lists').delete().eq('id', id);
                            } else if (type === 'game') {
                                const collabCleanup = await supabase
                                    .from(LIST_COLLAB_TABLE)
                                    .delete()
                                    .eq('media_type', 'game')
                                    .eq('list_id', String(id));
                                if (collabCleanup?.error && String(collabCleanup.error.code || '').trim() !== '42P01') {
                                    console.warn('Could not remove collaborators for game list:', collabCleanup.error);
                                }
                                await supabase.from('game_list_items').delete().eq('list_id', id);
                                await supabase.from('game_lists').delete().eq('id', id);
                            } else if (type === 'music') {
                                const collabCleanup = await supabase
                                    .from(LIST_COLLAB_TABLE)
                                    .delete()
                                    .eq('media_type', 'music')
                                    .eq('list_id', String(id));
                                if (collabCleanup?.error && String(collabCleanup.error.code || '').trim() !== '42P01') {
                                    console.warn('Could not remove collaborators for music list:', collabCleanup.error);
                                }
                                await supabase.from('music_list_items').delete().eq('list_id', id);
                                await supabase.from('music_lists').delete().eq('id', id);
                            } else if (type === 'travel') {
                                const collabCleanup = await supabase
                                    .from(LIST_COLLAB_TABLE)
                                    .delete()
                                    .eq('media_type', 'travel')
                                    .eq('list_id', String(id));
                                if (collabCleanup?.error && String(collabCleanup.error.code || '').trim() !== '42P01') {
                                    console.warn('Could not remove collaborators for travel list:', collabCleanup.error);
                                }
                                await supabase.from('travel_list_items').delete().eq('list_id', id);
                                await supabase.from('travel_lists').delete().eq('id', id);
                            } else if (type === 'fashion') {
                                const collabCleanup = await supabase
                                    .from(LIST_COLLAB_TABLE)
                                    .delete()
                                    .eq('media_type', 'fashion')
                                    .eq('list_id', String(id));
                                if (collabCleanup?.error && String(collabCleanup.error.code || '').trim() !== '42P01') {
                                    console.warn('Could not remove collaborators for fashion list:', collabCleanup.error);
                                }
                                await supabase.from('fashion_list_items').delete().eq('list_id', id);
                                await supabase.from('fashion_lists').delete().eq('id', id);
                            } else if (type === 'food') {
                                const collabCleanup = await supabase
                                    .from(LIST_COLLAB_TABLE)
                                    .delete()
                                    .eq('media_type', 'food')
                                    .eq('list_id', String(id));
                                if (collabCleanup?.error && String(collabCleanup.error.code || '').trim() !== '42P01') {
                                    console.warn('Could not remove collaborators for food list:', collabCleanup.error);
                                }
                                await supabase.from('food_list_items').delete().eq('list_id', id);
                                await supabase.from('food_lists').delete().eq('id', id);
                            } else {
                                const collabCleanup = await supabase
                                    .from(LIST_COLLAB_TABLE)
                                    .delete()
                                    .eq('media_type', 'book')
                                    .eq('list_id', String(id));
                                if (collabCleanup?.error && String(collabCleanup.error.code || '').trim() !== '42P01') {
                                    console.warn('Could not remove collaborators for book list:', collabCleanup.error);
                                }
                                await supabase.from('book_list_items').delete().eq('list_id', id);
                                await supabase.from('book_lists').delete().eq('id', id);
                            }

                            showToast('Collection deleted', 'success');

                            if (type === 'restaurant') {
                                hideRestaurantDetail();
                                await renderRestaurants();
                            } else if (type === 'movie') {
                                hideMovieDetail();
                                await renderMovies();
                            } else if (type === 'tv') {
                                hideTvDetail();
                                await renderTvShows();
                            } else if (type === 'anime') {
                                hideAnimeDetail();
                                await renderAnimeShows();
                            } else if (type === 'game') {
                                hideGameDetail();
                                await renderGames();
                            } else if (type === 'music') {
                                hideMusicDetail();
                                await renderMusic();
                            } else if (type === 'travel') {
                                hideTravelDetail();
                                await renderTravel();
                            } else if (type === 'fashion') {
                                hideFashionDetail();
                                await renderFashion();
                            } else if (type === 'food') {
                                hideFoodDetail();
                                await renderFood();
                            } else if (type === 'car') {
                                hideCarDetail();
                                await renderCars();
                            } else {
                                hideBookDetail();
                                await renderBooks();
                            }
                        } catch (error) {
                            console.error('Error deleting collection:', error);
                            showToast('Failed to delete collection', 'error');
                        }
                    }
                );
            }

            function setupCommunitySnapshotNavigation() {
                const snapshotIds = ['desktopSocialPreview', 'mobileSocialPreview'];
                snapshotIds.forEach((snapshotId) => {
                    const snapshot = document.getElementById(snapshotId);
                    if (!snapshot || snapshot.dataset.communityNavBound === '1') return;

                    snapshot.dataset.communityNavBound = '1';
                    snapshot.setAttribute('role', 'button');
                    snapshot.setAttribute('tabindex', '0');
                    snapshot.setAttribute('aria-label', 'Open community');

                    const openCommunity = () => showTab('community');
                    const isInteractiveTarget = (target) => {
                        if (!(target instanceof Element)) return false;
                        return !!target.closest('button, a, .social-preview-link, .social-preview-avatar');
                    };

                    snapshot.addEventListener('click', (event) => {
                        if (isInteractiveTarget(event.target)) return;
                        openCommunity();
                    });

                    snapshot.addEventListener('keydown', (event) => {
                        if (event.key !== 'Enter' && event.key !== ' ') return;
                        event.preventDefault();
                        openCommunity();
                    });
                });
            }

            function showCommunitySection(section) {
                const isMobile = window.innerWidth <= 768;
                
                if (isMobile) {
                    const followersBtn = document.getElementById('mobileFollowersTabBtn');
                    const followingBtn = document.getElementById('mobileFollowingTabBtn');
                    const activityBtn = document.getElementById('mobileActivityTabBtn');
                    
                    if (followersBtn) followersBtn.classList.remove('active');
                    if (followingBtn) followingBtn.classList.remove('active');
                    if (activityBtn) activityBtn.classList.remove('active');
                    
                    document.querySelectorAll('.mobile-community-tab').forEach(tab => {
                        tab.classList.remove('active');
                    });
                    
                    const targetTab = document.getElementById(`mobile${section.charAt(0).toUpperCase() + section.slice(1)}Tab`);
                    if (targetTab) {
                        targetTab.classList.add('active');
                    }
                    
                    const activeBtn = document.getElementById(`mobile${section.charAt(0).toUpperCase() + section.slice(1)}TabBtn`);
                    if (activeBtn) activeBtn.classList.add('active');
                } else {
                    const followersBtn = document.getElementById('showFollowersBtn');
                    const followingBtn = document.getElementById('showFollowingBtn');
                    const activityBtn = document.getElementById('showActivityBtn');
                    
                    if (followersBtn) followersBtn.classList.remove('active');
                    if (followingBtn) followingBtn.classList.remove('active');
                    if (activityBtn) activityBtn.classList.remove('active');
                    
                    document.querySelectorAll('.community-section').forEach(sectionEl => {
                        sectionEl.classList.remove('active');
                    });
                    
                    const targetSection = document.getElementById(`${section}Section`);
                    if (targetSection) {
                        targetSection.classList.add('active');
                    }
                    
                    const activeBtn = document.getElementById(`show${section.charAt(0).toUpperCase() + section.slice(1)}Btn`);
                    if (activeBtn) activeBtn.classList.add('active');
                }
                
                if (communitySystem) {
                    communitySystem.currentSection = section;
                    if (section === 'followers') {
                        communitySystem.loadFollowers();
                    } else if (section === 'activity') {
                        communitySystem.loadActivity();
                    } else {
                        communitySystem.loadFollowing();
                    }
                }
            }

            function showModal(modalId) {
                const modal = document.getElementById(modalId);
                if (modal) {
                    modal.classList.add('active');
                    modal.setAttribute('aria-hidden', 'false');
                    syncProfileModalViewport(modal);
                    playProfileModalFlyUp(modal);
                    syncProfileModalBodyLock();
                    
                    if (modalId === 'addEntryModal') {
                        const visitDate = document.getElementById('visitDate');
                        if (visitDate) {
                            const today = new Date().toISOString().split('T')[0];
                            visitDate.value = today;
                            visitDate.max = today;
                        }
                        setRating(0);
                    }
                    
                    if (modalId === 'editProfileModal' && userProfile) {
                        document.getElementById('editDisplayName').value = userProfile.full_name || '';
                        document.getElementById('editUsername').value = userProfile.username || '';
                        document.getElementById('editBio').value = userProfile.bio || '';
                        document.getElementById('editLocation').value = userProfile.location || '';
                        const themeInput = document.getElementById('editProfileTheme');
                        if (themeInput) themeInput.value = normalizeProfileTheme(userProfile.profile_theme);
                        const badgesInput = document.getElementById('editCustomBadges');
                        if (badgesInput) badgesInput.value = normalizeProfileBadges(userProfile.profile_badges || []).join(', ');
                        document.getElementById('editIsPrivate').checked = userProfile.is_private || false;
                    }

                    if (modalId === 'accountSettingsModal' && currentUser) {
                        const currentEmail = document.getElementById('settingsCurrentEmail');
                        const newEmail = document.getElementById('settingsNewEmail');
                        if (currentEmail) currentEmail.value = currentUser.email || '';
                        if (newEmail) newEmail.value = currentUser.email || '';
                    }
                    
                    // 4. FIX: Update avatar system to use avatar_icon column
                    if (modalId === 'avatarModal') {
                        const avatarIconGrid = document.getElementById('avatarIconGrid');
                        if (avatarIconGrid) {
                            avatarIconGrid.innerHTML = '';
                            avatarIcons.forEach(icon => {
                                const iconOption = document.createElement('div');
                                iconOption.className = 'avatar-icon-option';
                                iconOption.textContent = icon;
                                iconOption.onclick = () => {
                                    document.querySelectorAll('.avatar-icon-option').forEach(opt => {
                                        opt.classList.remove('selected');
                                    });
                                    iconOption.classList.add('selected');
                                    selectedAvatarIcon = icon;
                                };
                                if (icon === (userProfile?.avatar_icon || iconGlyphText('user'))) {
                                    iconOption.classList.add('selected');
                                    selectedAvatarIcon = icon;
                                }
                                avatarIconGrid.appendChild(iconOption);
                            });
                        }
                    }
                    
                    if (modalId === 'createListModal') {
                        const selectedValue = String(document.getElementById('selectedIcon')?.value || getDefaultListIconForContext('restaurant'));
                        document.querySelectorAll('.list-icon-option').forEach(icon => {
                            const isSelected = icon.getAttribute('data-icon') === selectedValue;
                            icon.classList.toggle('selected', isSelected);
                        });
                    }

                }
            }

            function closeModal(modalId) {
                const modal = document.getElementById(modalId);
                if (modal) {
                    modal.classList.remove('active');
                    modal.setAttribute('aria-hidden', 'true');
                    syncProfileModalBodyLock();
                    
                    if (modalId === 'addEntryModal') {
                        const form = document.getElementById('journalEntryForm');
                        if (form) form.reset();
                        setRating(0);
                        currentEditingJournalEntry = null;
                        
                        const modalTitle = document.querySelector('#addEntryModal .modal-title');
                        const submitButton = document.querySelector('#journalEntryForm button[type="submit"]');
                        
                        if (modalTitle) modalTitle.textContent = 'Add Journal Entry';
                        if (submitButton) submitButton.textContent = 'Save Entry';
                    }
                    
                    if (modalId === 'createListModal') {
                        const form = document.getElementById('createListForm');
                        if (form) form.reset();
                        const selectedInput = document.getElementById('selectedIcon');
                        if (selectedInput) selectedInput.value = getDefaultListIconForContext('restaurant');

                        document.querySelectorAll('.list-icon-option').forEach(icon => {
                            const isSelected = icon.getAttribute('data-icon') === getDefaultListIconForContext('restaurant');
                            icon.classList.toggle('selected', isSelected);
                        });
                        
                        isEditingList = false;
                        editingListId = null;
                        document.querySelector('#createListModal .modal-title').textContent = "Create New List";
                    }

                    if (modalId === 'editMediaListModal') {
                        const form = document.getElementById('editMediaListForm');
                        if (form) form.reset();
                        const icon = document.getElementById('editMediaListSelectedIcon');
                        if (icon) icon.value = editingMediaList?.fallback || 'list';
                        const titleEl = document.getElementById('editMediaListModalTitle');
                        if (titleEl) titleEl.textContent = 'Edit List';
                        const submitBtn = document.querySelector('#editMediaListForm button[type="submit"]');
                        if (submitBtn) submitBtn.textContent = 'Save Changes';
                        document.querySelectorAll('.edit-list-icon-option').forEach(opt => {
                            opt.classList.remove('selected');
                        });
                        const collaboratorInput = document.getElementById('editMediaCollaboratorUsername');
                        if (collaboratorInput) collaboratorInput.value = '';
                        editingMediaCollaborators = [];
                        setEditMediaCollaboratorsVisibility(false);
                        renderEditMediaCollaborators();
                        editingMediaList = null;
                    }

                    if (modalId === 'accountSettingsModal') {
                        const passwordForm = document.getElementById('accountPasswordForm');
                        const emailForm = document.getElementById('accountEmailForm');
                        if (passwordForm) passwordForm.reset();
                        if (emailForm && currentUser?.email) {
                            const emailInput = document.getElementById('settingsNewEmail');
                            if (emailInput) emailInput.value = currentUser.email;
                        }
                    }
                }
            }

            function showCreateListModal() {
                showModal('createListModal');
            }

            function showCreateListTypeModal() {
                showModal('createListTypeModal');
            }

            function createListForType(type) {
                closeModal('createListTypeModal');
                const normalized = String(type || '').toLowerCase();
                if (normalized === 'restaurants') {
                    if (!ENABLE_RESTAURANTS) {
                        showToast('Collections are temporarily unavailable', 'info');
                        showTab(DEFAULT_PROFILE_TAB);
                        return;
                    }
                    showTab('restaurants');
                    showCreateListModal();
                    return;
                }
                if (normalized === 'movies') {
                    showTab('movies');
                    createMovieList();
                    return;
                }
                if (normalized === 'tv') {
                    showTab('tv');
                    createTvList();
                    return;
                }
                if (normalized === 'anime') {
                    showTab('anime');
                    createAnimeList();
                    return;
                }
                if (normalized === 'games') {
                    showTab('games');
                    createGameList();
                    return;
                }
                if (normalized === 'books') {
                    showTab('books');
                    createBookList();
                    return;
                }
                if (normalized === 'music') {
                    showTab('music');
                    createMusicList();
                    return;
                }
                if (normalized === 'travel') {
                    showTab('travel');
                    createTravelList();
                    return;
                }
                if (normalized === 'fashion') {
                    showTab('fashion');
                    createFashionList();
                    return;
                }
                if (normalized === 'food') {
                    showTab('food');
                    createFoodList();
                    return;
                }
                if (normalized === 'cars') {
                    showTab('cars');
                    createCarList();
                }
            }

            // ===== MOBILE MENU FUNCTIONS =====
            function showMobileMenu() {
                showModal('mobileMenuModal');
            }

            // ===== AVATAR FUNCTIONS =====
            function showAvatarModal() {
                if (!isViewingOwnProfile) return;
                
                showModal('avatarModal');
            }

            async function saveAvatar() {
                if (!selectedAvatarIcon || !isViewingOwnProfile) {
                    showToast('Please select an avatar', 'error');
                    return;
                }

                try {
                    const nowIso = new Date().toISOString();
                    const payload = {
                        avatar_icon: selectedAvatarIcon,
                        updated_at: nowIso
                    };
                    let saved = false;

                    const byIdResult = await supabase
                        .from('user_profiles')
                        .update(payload)
                        .eq('id', currentUser.id)
                        .select('*')
                        .limit(1);
                    if (byIdResult.error && !isColumnMissingError(byIdResult.error, 'id')) {
                        throw byIdResult.error;
                    }
                    saved = Array.isArray(byIdResult.data) && byIdResult.data.length > 0;

                    if (!saved) {
                        const byUserIdResult = await supabase
                            .from('user_profiles')
                            .update(payload)
                            .eq('user_id', currentUser.id)
                            .select('*')
                            .limit(1);
                        if (byUserIdResult.error && !isColumnMissingError(byUserIdResult.error, 'user_id')) {
                            throw byUserIdResult.error;
                        }
                        saved = Array.isArray(byUserIdResult.data) && byUserIdResult.data.length > 0;
                    }

                    if (!saved) {
                        const usernameSeed = String(
                            userProfile?.username ||
                            currentUser?.email?.split('@')[0] ||
                            `user_${String(currentUser?.id || '').slice(0, 8)}`
                        ).trim();
                        const usernameCandidates = buildProfileUsernameCandidates(usernameSeed, currentUser?.id);
                        const fullNameSeed = String(
                            userProfile?.full_name ||
                            usernameCandidates[0] ||
                            'User'
                        ).trim();
                        const upsertPayload = {
                            id: currentUser.id,
                            user_id: currentUser.id,
                            username: usernameCandidates[0] || 'user',
                            full_name: fullNameSeed,
                            bio: String(userProfile?.bio || ''),
                            location: String(userProfile?.location || ''),
                            is_private: !!userProfile?.is_private,
                            avatar_icon: selectedAvatarIcon,
                            created_at: userProfile?.created_at || nowIso,
                            updated_at: nowIso
                        };

                        let upsertError = null;
                        {
                            const result = await supabase
                                .from('user_profiles')
                                .upsert(upsertPayload, { onConflict: 'id' });
                            upsertError = result.error || null;
                        }
                        if (upsertError && isColumnMissingError(upsertError, 'user_id')) {
                            const { user_id, ...fallbackPayload } = upsertPayload;
                            const retry = await supabase
                                .from('user_profiles')
                                .upsert(fallbackPayload, { onConflict: 'id' });
                            upsertError = retry.error || null;
                        }
                        if (upsertError) throw upsertError;
                    }

                    await loadUserProfile();
                    if (userProfile) {
                        userProfile.avatar_icon = selectedAvatarIcon;
                    }
                    updateProfileUI(userProfile);
                    showToast('Avatar updated successfully!', 'success');
                    closeModal('avatarModal');
                } catch (error) {
                    console.error('Error saving avatar:', error);
                    showToast('Error saving avatar', 'error');
                }
            }

            // ===== RATING FUNCTIONS =====
            function setRating(stars) {
                const starsElements = document.querySelectorAll('#ratingStars span');
                starsElements.forEach((star, index) => {
                    if (index < stars) {
                        star.classList.add('active');
                    } else {
                        star.classList.remove('active');
                    }
                });
                
                const selectedRating = document.getElementById('selectedRating');
                if (selectedRating) selectedRating.value = stars;
            }

            async function refreshCurrentUserEmail() {
                try {
                    const { data: { user }, error } = await supabase.auth.getUser();
                    if (!error && user) {
                        currentUser = user;
                    }
                } catch (_error) {}
            }

            async function updateAccountEmail(e) {
                e.preventDefault();
                const input = document.getElementById('settingsNewEmail');
                const nextEmail = String(input?.value || '').trim().toLowerCase();
                if (!nextEmail || !/\S+@\S+\.\S+/.test(nextEmail)) {
                    showToast('Enter a valid email address', 'error');
                    return;
                }
                if (nextEmail === String(currentUser?.email || '').toLowerCase()) {
                    showToast('That is already your current email', 'info');
                    return;
                }

                try {
                    const { error } = await supabase.auth.updateUser({ email: nextEmail });
                    if (error) throw error;
                    showToast('Verification email sent. Confirm it to finish changing email.', 'success');
                    await refreshCurrentUserEmail();
                    const currentEmail = document.getElementById('settingsCurrentEmail');
                    if (currentEmail) currentEmail.value = currentUser?.email || nextEmail;
                } catch (error) {
                    console.error('Update email error:', error);
                    showToast(error?.message || 'Could not update email', 'error');
                }
            }

            async function updateAccountPassword(e) {
                e.preventDefault();
                const password = String(document.getElementById('settingsNewPassword')?.value || '');
                const confirm = String(document.getElementById('settingsConfirmPassword')?.value || '');
                if (password.length < 8) {
                    showToast('Password must be at least 8 characters', 'error');
                    return;
                }
                if (password !== confirm) {
                    showToast('Passwords do not match', 'error');
                    return;
                }

                try {
                    const { error } = await supabase.auth.updateUser({ password });
                    if (error) throw error;
                    showToast('Password updated successfully', 'success');
                    const form = document.getElementById('accountPasswordForm');
                    if (form) form.reset();
                } catch (error) {
                    console.error('Update password error:', error);
                    showToast(error?.message || 'Could not update password', 'error');
                }
            }

            async function sendPasswordResetEmail() {
                const email = String(currentUser?.email || '').trim();
                if (!email) {
                    showToast('No email found for this account', 'error');
                    return;
                }

                try {
                    const { error } = await supabase.auth.resetPasswordForEmail(email, {
                        redirectTo: `${window.location.origin}/update-password.html`
                    });
                    if (error) throw error;
                    showToast('Password reset email sent', 'success');
                } catch (error) {
                    console.error('Reset password email error:', error);
                    showToast(error?.message || 'Could not send reset email', 'error');
                }
            }

            async function sendMagicLinkEmail() {
                const email = String(currentUser?.email || '').trim();
                if (!email) {
                    showToast('No email found for this account', 'error');
                    return;
                }

                try {
                    const { error } = await supabase.auth.signInWithOtp({
                        email,
                        options: {
                            shouldCreateUser: false,
                            emailRedirectTo: `${window.location.origin}/auth-callback.html`
                        }
                    });
                    if (error) throw error;
                    showToast('Magic link email sent', 'success');
                } catch (error) {
                    console.error('Magic link email error:', error);
                    showToast(error?.message || 'Could not send magic link', 'error');
                }
            }

            // ===== SETUP EVENT LISTENERS =====
            function setupEventListeners() {
                console.log('Setting up event listeners...');
                setupCommunitySnapshotNavigation();
                wireProfileTabGroups();
                bindProfileModalViewportListeners();
                
                // Remove existing listener before adding new one
                const createListForm = document.getElementById('createListForm');
                if (createListForm) {
                    // Clone and replace to remove all listeners
                    const newForm = createListForm.cloneNode(true);
                    createListForm.parentNode.replaceChild(newForm, createListForm);
                    
                    // Add single listener
                    newForm.addEventListener('submit', handleListSubmit);
                }
                
                // Rest of your event listeners...
                document.querySelectorAll('.nav-tab').forEach(btn => {
                    if (btn.classList.contains('profile-tab-group-toggle')) return;
                    btn.addEventListener('click', function() {
                        const tabName = this.getAttribute('data-tab');
                        if (!tabName) return;
                        showTab(tabName);
                    });
                });
                
                // Filter buttons
                document.querySelectorAll('.filter-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                        this.classList.add('active');
                        journalFilter = this.getAttribute('data-filter');
                        foodJournal.loadJournalEntries();
                    });
                });
                
                // Journal entry form
                const journalEntryForm = document.getElementById('journalEntryForm');
                if (journalEntryForm) {
                    journalEntryForm.addEventListener('submit', (e) => {
                        e.preventDefault();
                        foodJournal.saveJournalEntry();
                    });
                }
                
                // Edit profile form
                const editProfileForm = document.getElementById('editProfileForm');
                if (editProfileForm) {
                    editProfileForm.addEventListener('submit', async (e) => {
                        e.preventDefault();
                        await saveProfileChanges();
                    });
                }

                const accountEmailForm = document.getElementById('accountEmailForm');
                if (accountEmailForm) {
                    accountEmailForm.addEventListener('submit', updateAccountEmail);
                }

                const accountPasswordForm = document.getElementById('accountPasswordForm');
                if (accountPasswordForm) {
                    accountPasswordForm.addEventListener('submit', updateAccountPassword);
                }

                const sendResetPasswordBtn = document.getElementById('sendResetPasswordBtn');
                if (sendResetPasswordBtn) {
                    sendResetPasswordBtn.addEventListener('click', sendPasswordResetEmail);
                }

                const sendMagicLinkBtn = document.getElementById('sendMagicLinkBtn');
                if (sendMagicLinkBtn) {
                    sendMagicLinkBtn.addEventListener('click', sendMagicLinkEmail);
                }
                
                // Rating stars
                document.querySelectorAll('.rating-star').forEach(star => {
                    star.addEventListener('click', function() {
                        const rating = parseInt(this.getAttribute('data-rating'));
                        setRating(rating);
                    });
                });
                
                // List icon selection
                document.querySelectorAll('.list-icon-option').forEach(icon => {
                    icon.addEventListener('click', function() {
                        document.querySelectorAll('.list-icon-option').forEach(i => {
                            i.classList.remove('selected');
                        });
                        this.classList.add('selected');
                        const selectedIcon = document.getElementById('selectedIcon');
                        if (selectedIcon) selectedIcon.value = this.getAttribute('data-icon');
                    });
                });

                const editMediaListForm = document.getElementById('editMediaListForm');
                if (editMediaListForm) {
                    editMediaListForm.addEventListener('submit', handleEditMediaListSubmit);
                }

                document.querySelectorAll('.edit-list-icon-option').forEach(icon => {
                    icon.addEventListener('click', function() {
                        setEditMediaListIcon(this.getAttribute('data-icon'));
                    });
                });
                
                // Logout button
                const logoutBtn = document.getElementById('logoutBtn');
                if (logoutBtn) {
                    logoutBtn.addEventListener('click', async (e) => {
                        e.preventDefault();
                        showConfirmModal(
                            'Logout',
                            'Are you sure you want to logout?',
                            () => logout()
                        );
                    });
                }
                
                // Modal close buttons
                document.querySelectorAll('.modal-close').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const modal = this.closest('.modal');
                        if (modal) {
                            closeModal(modal.id);
                        }
                    });
                });
                
                // Click outside modal to close
                document.querySelectorAll('.modal').forEach(modal => {
                    modal.addEventListener('click', function(e) {
                        if (e.target === this) {
                            closeModal(this.id);
                        }
                    });
                });

                document.querySelectorAll('.confirm-modal').forEach(modal => {
                    modal.addEventListener('click', function(e) {
                        if (e.target === this) {
                            closeConfirmModal();
                        }
                    });
                });
                
                // ESC key to close modals
                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape') {
                        document.querySelectorAll('.modal.active').forEach(modal => {
                            closeModal(modal.id);
                        });
                        const confirmModal = document.getElementById('confirmModal');
                        if (confirmModal?.classList.contains('active')) {
                            closeConfirmModal();
                        }
                    }
                });
            }

            // ===== SAVE PROFILE CHANGES =====
            async function saveProfileChanges() {
                const displayName = String(document.getElementById('editDisplayName')?.value || '').trim().slice(0, 80);
                const rawUsername = document.getElementById('editUsername')?.value;
                const bio = String(document.getElementById('editBio')?.value || '').trim();
                const location = String(document.getElementById('editLocation')?.value || '').trim();
                const themeInput = document.getElementById('editProfileTheme');
                const profileTheme = themeInput ? normalizeProfileTheme(themeInput.value) : null;
                const customBadges = normalizeProfileBadges(document.getElementById('editCustomBadges')?.value || '');
                const isPrivate = document.getElementById('editIsPrivate')?.checked || false;
                
                if (!displayName || !rawUsername) {
                    showToast('Please enter display name and username', 'error');
                    return;
                }
                
                try {
                    const normalizedUsername = await ensureProfileUsernameAvailable(rawUsername, currentUser?.id);
                    const updatePayload = {
                        full_name: displayName,
                        username: normalizedUsername,
                        bio: bio,
                        location: location,
                        profile_badges: customBadges,
                        is_private: isPrivate,
                        updated_at: new Date().toISOString()
                    };
                    if (profileTheme) updatePayload.profile_theme = profileTheme;
                    let { error } = await supabase
                        .from('user_profiles')
                        .update(updatePayload)
                        .eq('id', currentUser.id);

                    if (error && (String(error.message || '').includes('profile_theme') || String(error.message || '').includes('profile_badges'))) {
                        const fallbackPayload = { ...updatePayload };
                        delete fallbackPayload.profile_theme;
                        delete fallbackPayload.profile_badges;
                        ({ error } = await supabase
                            .from('user_profiles')
                            .update(fallbackPayload)
                            .eq('id', currentUser.id));
                    }
                    
                    if (error) throw error;

                    userProfile = {
                        ...(userProfile || {}),
                        full_name: displayName,
                        username: normalizedUsername,
                        bio: bio,
                        location: location,
                        profile_badges: customBadges,
                        is_private: isPrivate
                    };
                    if (profileTheme) userProfile.profile_theme = profileTheme;
                    manualProfileBadges = [...customBadges];

                    const authMetadataResult = await supabase.auth.updateUser({
                        data: {
                            full_name: displayName,
                            username: normalizedUsername
                        }
                    });
                    if (authMetadataResult?.error) {
                        console.warn('Could not sync auth metadata after profile update:', authMetadataResult.error);
                    }
                    
                    updateProfileUI(userProfile);

                    const usernameInput = document.getElementById('editUsername');
                    if (usernameInput) usernameInput.value = normalizedUsername;
                    
                    closeModal('editProfileModal');
                    showToast('Profile updated successfully!', 'success');
                    
                } catch (error) {
                    console.error('Error updating profile:', error);
                    showToast(error?.message || 'Error updating profile', 'error');
                }
            }

            // ===== UTILITY FUNCTIONS =====
            function updateMobileStats() {
                // Stats are already updated in updateStatsUI
            }

            // 6. ADD: Debug function to check for duplicate lists
            window.checkDuplicateLists = async function() {
                console.log('=== CHECKING FOR DUPLICATE LISTS ===');
                
                const { data: lists } = await supabase
                    .from('lists')
                    .select('*')
                    .eq('user_id', currentUser.id)
                    .order('created_at');
                
                console.log('Total lists:', lists.length);
                console.log('Lists:', lists);
                
                const titleCounts = {};
                lists.forEach(list => {
                    titleCounts[list.title] = (titleCounts[list.title] || 0) + 1;
                });
                
                console.log('Title counts:', titleCounts);
                
                Object.entries(titleCounts).forEach(([title, count]) => {
                    if (count > 1) {
                        console.warn(`! DUPLICATE: "${title}" appears ${count} times!`);
                    }
                });
                
                console.log('=== END CHECK ===');
            };

            // ===== PUBLIC API =====
            return {
                initialize,
                showTab,
                showPrimaryTab,
                goToMyProfile,
                showCommunitySection,
                viewUserProfile,
                showModal,
                closeModal,
                showConfirmModal,
                closeConfirmModal,
                showCreateListModal,
                showAvatarModal,
                showCollectionDetail,
                openCollectionPage,
                setCollectionViewMode,
                hideRestaurantDetail,
                hideMobileRestaurantDetail: hideRestaurantDetail,
                hideMovieDetail,
                hideMobileMovieDetail: hideMovieDetail,
                hideTvDetail,
                hideMobileTvDetail: hideTvDetail,
                hideAnimeDetail,
                hideMobileAnimeDetail: hideAnimeDetail,
                hideGameDetail,
                hideMobileGameDetail: hideGameDetail,
                hideBookDetail,
                hideMobileBookDetail: hideBookDetail,
                hideMusicDetail,
                hideMobileMusicDetail: hideMusicDetail,
                hideTravelDetail,
                hideMobileTravelDetail: hideTravelDetail,
                hideFashionDetail,
                hideMobileFashionDetail: hideFashionDetail,
                hideFoodDetail,
                hideMobileFoodDetail: hideFoodDetail,
                hideCarDetail,
                hideMobileCarDetail: hideCarDetail,
                toggleCollectionMenu,
                createMovieList,
                createTvList,
                createAnimeList,
                createGameList,
                createBookList,
                createMusicList,
                createTravelList,
                createFashionList,
                createFoodList,
                createCarList,
                addMediaListCollaborator,
                removeMediaListCollaborator,
                renameMovieList,
                deleteMovieList,
                renameTvList,
                deleteTvList,
                renameAnimeList,
                deleteAnimeList,
                renameGameList,
                deleteGameList,
                renameBookList,
                deleteBookList,
                renameMusicList,
                deleteMusicList,
                renameTravelList,
                deleteTravelList,
                renameFashionList,
                deleteFashionList,
                renameFoodList,
                deleteFoodList,
                renameCarList,
                deleteCarList,
                removeFromCollection,
                editCollection,
                deleteCollection,
                togglePinnedCollection,
                handleListSubmit,
                saveAvatar,
                setRating,
                toggleFollow,
                showMobileMenu,
                showCreateListTypeModal,
                createListForType,
                logout,
                removeFromList,
                escapeHtml
            };
        })();

        window.ProfileManager = ProfileManager;

        // ===== INITIALIZE WHEN DOM IS LOADED =====
        document.addEventListener('DOMContentLoaded', function() {
            ProfileManager.initialize();
        });









