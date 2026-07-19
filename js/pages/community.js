/* ============================================================
   ZO2Y COMMUNITY & DISCOVERY MANAGER (STAGE 1 DISCOVERY ENGINE)
   ============================================================ */

const CommunityManager = (function() {
    'use strict';

    let supabase = null;
    let currentUser = null;

    async function initSupabase() {
        if (window.supabase) {
            supabase = window.supabase;
        } else if (window.supabaseClient) {
            supabase = window.supabaseClient;
        }
        if (supabase) {
            const { data } = await supabase.auth.getUser();
            currentUser = data?.user || null;
        }
    }

    // === TAB SWITCHING ===
    function switchTab(tabName) {
        document.querySelectorAll('.community-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
        });
        document.querySelectorAll('.community-tab-pane').forEach(pane => {
            pane.classList.toggle('active', pane.id === 'pane' + tabName.charAt(0).toUpperCase() + tabName.slice(1));
        });

        if (tabName === 'people') {
            loadPeople();
        } else if (tabName === 'reviews') {
            loadAllReviews();
        } else if (tabName === 'lists') {
            loadAllLists();
        }
    }

    // === STAGE ONE DISCOVER ENGINE ===
    async function loadDiscoverFeed() {
        fetchNewReleases();
        fetchPopularThisWeek();
        fetchLatestReviews();
        fetchPeopleToFollow();
        fetchFeaturedLists();
    }

    // 🔥 New Releases (TMDB / RAWG Live APIs)
    async function fetchNewReleases() {
        const rail = document.getElementById('railNewReleases');
        if (!rail) return;

        try {
            // Fetch TMDB movies
            const res = await fetch('/api/tmdb/movie/now_playing?language=en-US&page=1');
            if (!res.ok) throw new Error('API error');
            const data = await res.json();
            const results = (data.results || []).slice(0, 10);

            if (!results.length) {
                rail.innerHTML = '<div class="skel-rail-placeholder">No new releases available right now.</div>';
                return;
            }

            rail.innerHTML = results.map(item => `
                <div class="community-card-poster" onclick="window.location.href='movie.html?id=${item.id}'">
                    <img class="community-card-img" src="${item.poster_path ? 'https://image.tmdb.org/tapi/v1/image/w500' + item.poster_path : '/newlogo.webp'}" alt="${item.title || ''}" loading="lazy" />
                    <div class="community-card-title">${item.title || item.name || 'Untitled'}</div>
                </div>
            `).join('');
        } catch (_e) {
            rail.innerHTML = '<div class="skel-rail-placeholder">Explore top trending media on Zo2y.</div>';
        }
    }

    // ⭐ Popular This Week
    async function fetchPopularThisWeek() {
        const rail = document.getElementById('railPopularThisWeek');
        if (!rail) return;

        try {
            const res = await fetch('/api/tmdb/movie/popular?language=en-US&page=1');
            if (!res.ok) throw new Error('API error');
            const data = await res.json();
            const results = (data.results || []).slice(0, 10);

            rail.innerHTML = results.map(item => `
                <div class="community-card-poster" onclick="window.location.href='movie.html?id=${item.id}'">
                    <img class="community-card-img" src="${item.poster_path ? 'https://image.tmdb.org/tapi/v1/image/w500' + item.poster_path : '/newlogo.webp'}" alt="${item.title || ''}" loading="lazy" />
                    <div class="community-card-title">${item.title || 'Popular Media'}</div>
                </div>
            `).join('');
        } catch (_e) {
            rail.innerHTML = '<div class="skel-rail-placeholder">Discover community favorites.</div>';
        }
    }

    // 📝 Latest Reviews Feed (With Graceful Empty State)
    async function fetchLatestReviews() {
        const container = document.getElementById('latestReviewsFeed');
        if (!container) return;

        if (!supabase) {
            renderEmptyReviewState(container);
            return;
        }

        try {
            const { data: reviews } = await supabase
                .from('user_reviews')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5);

            if (!reviews || !reviews.length) {
                renderEmptyReviewState(container);
                return;
            }

            container.innerHTML = reviews.map(r => `
                <div class="user-taste-card mb-10">
                    <div class="user-avatar-circle">${(r.user_name || 'U').charAt(0).toUpperCase()}</div>
                    <div class="user-card-info">
                        <div class="user-card-name">${r.user_name || 'Community Member'}</div>
                        <div class="user-card-username">Reviewed <strong>${r.item_title || 'Title'}</strong> - ${r.rating ? '★ ' + r.rating + '/5' : 'Rated'}</div>
                        <div style="font-size: 0.85rem; color: #cbd5e1; margin-top: 4px;">"${r.review_text || r.content || ''}"</div>
                    </div>
                </div>
            `).join('');

        } catch (_e) {
            renderEmptyReviewState(container);
        }
    }

    function renderEmptyReviewState(container) {
        container.innerHTML = `
            <div class="community-empty-box">
                <div class="empty-icon"><i class="fas fa-pen-nib"></i></div>
                <div class="empty-title">Be the first person to review something on Zo2y</div>
                <div class="empty-desc">Share your taste and thoughts on movies, games, books, or music.</div>
                <a href="index.html" class="btn btn-primary btn-sm"><i class="fas fa-plus"></i> Write First Review</a>
            </div>
        `;
    }

    // 👥 People To Follow (With Generated Taste Preview Tags)
    async function fetchPeopleToFollow() {
        const container = document.getElementById('discoverPeopleList');
        if (!container) return;

        if (!supabase) {
            renderFallbackPeople(container);
            return;
        }

        try {
            const { data: users } = await supabase
                .from('user_profiles')
                .select('id, username, full_name, bio, avatar_icon, profile_badges')
                .limit(6);

            if (!users || !users.length) {
                renderFallbackPeople(container);
                return;
            }

            container.innerHTML = users.map(u => {
                const name = u.full_name || u.username || 'Member';
                const tasteTags = generateTastePreviewTags(u);
                return `
                    <div class="user-taste-card">
                        <div class="user-avatar-circle">${u.avatar_icon || name.charAt(0).toUpperCase()}</div>
                        <div class="user-card-info">
                            <div class="user-card-name">${name}</div>
                            <div class="user-card-username">@${u.username || 'user'}</div>
                            <div class="taste-tags-wrap">
                                ${tasteTags.map(t => `<span class="taste-chip">${t}</span>`).join('')}
                            </div>
                        </div>
                        <button class="btn btn-secondary btn-sm" onclick="window.location.href='profile.html?user=${u.id}'">View Profile</button>
                    </div>
                `;
            }).join('');
        } catch (_e) {
            renderFallbackPeople(container);
        }
    }

    function generateTastePreviewTags(user) {
        const defaultPool = ['Sci-Fi', 'RPG', 'Psychological', 'Cinematic', 'Indie', 'Hip-Hop', 'Thriller'];
        if (user && user.profile_badges && user.profile_badges.length) {
            return user.profile_badges.slice(0, 3);
        }
        // Deterministic pick based on username length
        const offset = (user?.username || 'user').length % 3;
        return defaultPool.slice(offset, offset + 3);
    }

    function renderFallbackPeople(container) {
        container.innerHTML = `
            <div class="user-taste-card">
                <div class="user-avatar-circle">Z</div>
                <div class="user-card-info">
                    <div class="user-card-name">Zo2y Pioneer</div>
                    <div class="user-card-username">@pioneer</div>
                    <div class="taste-tags-wrap">
                        <span class="taste-chip">Sci-Fi</span>
                        <span class="taste-chip">RPG</span>
                        <span class="taste-chip">Indie</span>
                    </div>
                </div>
                <a href="profile.html" class="btn btn-secondary btn-sm">Profile</a>
            </div>
        `;
    }

    // ⭐ Featured Lists
    async function fetchFeaturedLists() {
        const rail = document.getElementById('railFeaturedLists');
        if (!rail) return;

        try {
            const res = await fetch('/api/tmdb/movie/top_rated?language=en-US&page=1');
            if (!res.ok) throw new Error('API error');
            const data = await res.json();
            const results = (data.results || []).slice(0, 8);

            rail.innerHTML = results.map(item => `
                <div class="community-card-poster" onclick="window.location.href='movie.html?id=${item.id}'">
                    <img class="community-card-img" src="${item.poster_path ? 'https://image.tmdb.org/tapi/v1/image/w500' + item.poster_path : '/newlogo.webp'}" alt="${item.title || ''}" loading="lazy" />
                    <div class="community-card-title">Essential ${item.title || 'Collection'}</div>
                </div>
            `).join('');
        } catch (_e) {
            rail.innerHTML = '<div class="skel-rail-placeholder">Explore community taste collections.</div>';
        }
    }

    // === SEARCH USERS ===
    function handleSearch(query) {
        const clearBtn = document.getElementById('searchClearBtn');
        if (clearBtn) clearBtn.classList.toggle('visible', !!query.trim());

        if (query.trim().length > 1) {
            switchTab('people');
            searchUsers(query.trim());
        }
    }

    function clearSearch() {
        const input = document.getElementById('communitySearchInput');
        if (input) input.value = '';
        const clearBtn = document.getElementById('searchClearBtn');
        if (clearBtn) clearBtn.classList.remove('visible');
        switchTab('discover');
    }

    async function searchUsers(query) {
        const grid = document.getElementById('peopleSearchResultsGrid');
        if (!grid) return;

        if (!supabase) {
            grid.innerHTML = '<div class="community-empty-box"><div class="empty-title">Search for user profiles</div></div>';
            return;
        }

        try {
            const { data: users } = await supabase
                .from('user_profiles')
                .select('id, username, full_name, bio, avatar_icon, profile_badges')
                .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
                .limit(12);

            if (!users || !users.length) {
                grid.innerHTML = `<div class="community-empty-box"><div class="empty-title">No members found matching "${query}"</div></div>`;
                return;
            }

            grid.innerHTML = users.map(u => {
                const name = u.full_name || u.username || 'Member';
                const tasteTags = generateTastePreviewTags(u);
                return `
                    <div class="user-taste-card">
                        <div class="user-avatar-circle">${u.avatar_icon || name.charAt(0).toUpperCase()}</div>
                        <div class="user-card-info">
                            <div class="user-card-name">${name}</div>
                            <div class="user-card-username">@${u.username || 'user'}</div>
                            <div class="taste-tags-wrap">
                                ${tasteTags.map(t => `<span class="taste-chip">${t}</span>`).join('')}
                            </div>
                        </div>
                        <button class="btn btn-primary btn-sm" onclick="window.location.href='profile.html?user=${u.id}'">View Profile</button>
                    </div>
                `;
            }).join('');
        } catch (_e) {
            grid.innerHTML = `<div class="community-empty-box"><div class="empty-title">Search failed. Try again.</div></div>`;
        }
    }

    async function loadPeople() {
        const grid = document.getElementById('peopleSearchResultsGrid');
        if (grid && !grid.innerHTML.trim()) {
            searchUsers('');
        }
    }

    async function loadAllReviews() {
        const feed = document.getElementById('allReviewsFeed');
        if (feed) fetchLatestReviews();
    }

    async function loadAllLists() {
        const grid = document.getElementById('allListsGrid');
        if (grid) fetchFeaturedLists();
    }

    // === INITIALIZE ===
    document.addEventListener('DOMContentLoaded', async function() {
        await initSupabase();
        loadDiscoverFeed();
    });

    return {
        switchTab,
        handleSearch,
        clearSearch
    };
})();
