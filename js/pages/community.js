/* ============================================================
   ZO2Y COMMUNITY ARCHITECTURE (DATA-DRIVEN & COMPONENT-BASED)
   ============================================================ */

const CommunityManager = (function() {
    'use strict';

    let supabase = null;
    let currentUser = null;
    let currentUserSavedMedia = new Set();
    let currentCategory = 'all';
    let currentFilter = 'all';

    async function initSupabase() {
        if (window.supabaseClient) {
            supabase = window.supabaseClient;
        } else if (window.ZO2Y_SUPABASE_CLIENT) {
            supabase = window.ZO2Y_SUPABASE_CLIENT;
        } else if (window.supabase && typeof window.supabase.from === 'function') {
            supabase = window.supabase;
        }

        if (supabase && supabase.auth && typeof supabase.auth.getUser === 'function') {
            try {
                const { data } = await supabase.auth.getUser();
                currentUser = data?.user || null;
                if (currentUser) {
                    await loadCurrentUserSavedMedia();
                }
            } catch (_e) {}
        }
    }

    async function loadCurrentUserSavedMedia() {
        if (!currentUser || !supabase) return;
        try {
            const { data: items } = await supabase
                .from('user_list_items')
                .select('item_id, media_type')
                .eq('user_id', currentUser.id);
            if (items) {
                items.forEach(i => currentUserSavedMedia.add(`${i.media_type}:${i.item_id}`));
            }
        } catch (_e) {}
    }

    // ============================================================
    // REUSABLE DATA-DRIVEN COMPONENTS
    // ============================================================

    // 1. UserCard Component
    const UserCard = {
        calculateTasteMatch(userMediaSet) {
            if (!currentUserSavedMedia.size || !userMediaSet || !userMediaSet.size) return null;
            let overlap = 0;
            userMediaSet.forEach(key => {
                if (currentUserSavedMedia.has(key)) overlap++;
            });
            const total = Math.max(currentUserSavedMedia.size, userMediaSet.size);
            if (!total) return null;
            const matchScore = Math.round((overlap / total) * 100);
            return matchScore > 0 ? matchScore : null;
        },

        render(user, options = {}) {
            const name = (user.full_name || user.username || 'member').toLowerCase();
            const username = (user.username || 'user').toLowerCase();
            const location = (user.location || '').toLowerCase();
            const avatar = (user.avatar_icon || name.charAt(0)).toLowerCase();
            const tasteTags = (user.profile_badges || []).map(b => String(b).toLowerCase());
            const mediaCovers = options.mediaCovers || [];
            const tasteMatch = options.userMediaSet ? UserCard.calculateTasteMatch(options.userMediaSet) : null;

            return `
                <div class="user-card-mini">
                    <div class="user-card-mini-top">
                        <div class="user-identity-left">
                            <div class="user-avatar-wrap">
                                <div class="user-avatar-circle">${escapeHtml(avatar)}</div>
                            </div>
                            <div class="user-meta-info">
                                <div class="user-handle-name">@${escapeHtml(username)}</div>
                                ${location ? `<div class="user-country-info"><i class="fas fa-globe-americas"></i> ${escapeHtml(location)}</div>` : ''}
                                ${tasteTags.length ? `
                                    <div class="taste-chips-row">
                                        ${tasteTags.slice(0, 4).map(t => `<span class="taste-chip">${escapeHtml(t)}</span>`).join('')}
                                    </div>
                                ` : ''}
                            </div>
                        </div>

                        <div class="user-card-right">
                            ${tasteMatch !== null ? `
                                <div class="taste-match-badge">
                                    <div class="taste-match-score">${tasteMatch}%</div>
                                    <div class="taste-match-label">taste match</div>
                                </div>
                            ` : ''}
                            <div class="user-action-btns">
                                <button class="btn btn-primary btn-sm" onclick="CommunityManager.toggleFollowUser('${user.id}', this)">follow</button>
                                <button class="btn btn-secondary btn-sm" onclick="window.location.href='profile.html?user=${user.id}'">profile</button>
                            </div>
                        </div>
                    </div>

                    ${mediaCovers.length ? `
                        <div class="user-overlapping-covers">
                            ${mediaCovers.slice(0, 4).map(c => `
                                <img class="mini-media-cover" src="${c.url}" alt="${escapeHtml(c.title || '')}" onclick="window.location.href='${c.media_type || 'movie'}.html?id=${c.id}'" loading="lazy" />
                            `).join('')}
                        </div>
                    ` : ''}

                    <div class="user-stats-footer">
                        <span><strong>${user.reviews_count || 0}</strong> reviews</span>
                        <span>·</span>
                        <span><strong>${user.lists_count || 0}</strong> lists</span>
                        <span>·</span>
                        <span><strong>${user.saved_count || 0}</strong> saved</span>
                    </div>
                </div>
            `;
        }
    };

    // 2. ReviewCard Component
    const ReviewCard = {
        render(review) {
            const userName = (review.user_name || 'member').toLowerCase();
            const itemTitle = (review.item_title || 'item').toLowerCase();
            const text = (review.review_text || review.content || '').toLowerCase();
            const rating = review.rating ? `★ ${review.rating}/5` : '';

            return `
                <div class="user-card-mini mb-12">
                    <div class="d-flex align-items-center gap-10 mb-8">
                        <div class="user-avatar-circle" style="width:36px;height:36px;font-size:0.9rem;">${escapeHtml(userName.charAt(0))}</div>
                        <div>
                            <div class="user-handle-name" style="font-size:0.9rem;">${escapeHtml(userName)}</div>
                            <div style="font-size:0.75rem;color:var(--color-text-secondary);">reviewed <strong>${escapeHtml(itemTitle)}</strong> ${rating ? ' · ' + rating : ''}</div>
                        </div>
                    </div>
                    ${text ? `<div style="font-size:0.88rem;color:#cbd5e1;">"${escapeHtml(text)}"</div>` : ''}
                </div>
            `;
        }
    };

    // 3. ListCard Component
    const ListCard = {
        render(list) {
            const title = (list.title || 'untitled list').toLowerCase();
            const creator = (list.user_name || 'member').toLowerCase();

            return `
                <div class="community-card-poster" onclick="window.location.href='profile.html'">
                    <div class="community-card-title">${escapeHtml(title)}</div>
                    <div style="font-size:0.75rem;color:var(--color-text-secondary);padding:0 8px 8px;">by ${escapeHtml(creator)}</div>
                </div>
            `;
        }
    };

    // 4. MediaRail Component
    const MediaRail = {
        render(items, pageType = 'movie') {
            if (!items || !items.length) return '';
            return items.map(item => `
                <div class="community-card-poster" onclick="window.location.href='${pageType}.html?id=${item.id}'">
                    <img class="community-card-img" src="${item.poster_path ? 'https://image.tmdb.org/t/p/w500' + item.poster_path : (item.cover_url || '/newlogo.webp')}" alt="${escapeHtml(item.title || item.name || '')}" loading="lazy" />
                    <div class="community-card-title">${escapeHtml((item.title || item.name || 'untitled').toLowerCase())}</div>
                </div>
            `).join('');
        }
    };

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

    // === DISCOVER ENGINE (MEDIA-FIRST FROM LIVE APIS & DATABASE) ===
    async function loadDiscoverFeed() {
        fetchNewReleases('all');
        fetchHiddenGems();
        fetchLatestReviews();
        fetchPeopleToFollow();
        fetchCommunityLists();
    }

    // 🔥 New Releases (TMDB / RAWG Live APIs)
    async function fetchNewReleases(category = 'all') {
        const rail = document.getElementById('railNewReleases');
        if (!rail) return;
        currentCategory = category;

        try {
            let endpoint = '/api/tmdb/movie/now_playing?language=en-US&page=1';
            let pageType = 'movie';
            if (category === 'tv') {
                endpoint = '/api/tmdb/tv/on_the_air?language=en-US&page=1';
                pageType = 'tvshow';
            }

            const res = await fetch(endpoint);
            if (!res.ok) throw new Error('API error');
            const data = await res.json();
            const results = (data.results || []).slice(0, 10);

            if (!results.length) {
                rail.innerHTML = '<div class="skel-rail-placeholder">no new releases available right now.</div>';
                return;
            }

            rail.innerHTML = MediaRail.render(results, pageType);
        } catch (_e) {
            rail.innerHTML = '<div class="skel-rail-placeholder">explore trending releases across media.</div>';
        }
    }

    function filterNewReleases(cat, btn) {
        document.querySelectorAll('.media-category-pills .category-pill').forEach(p => p.classList.remove('active'));
        if (btn) btn.classList.add('active');
        fetchNewReleases(cat);
    }

    // 🎲 Hidden Gems (Randomized Discoveries via Live API)
    async function fetchHiddenGems() {
        const rail = document.getElementById('railHiddenGems');
        if (!rail) return;

        try {
            const page = Math.floor(Math.random() * 5) + 1;
            const res = await fetch(`/api/tmdb/movie/top_rated?language=en-US&page=${page}`);
            if (!res.ok) throw new Error('API error');
            const data = await res.json();
            const results = (data.results || []).sort(() => Math.random() - 0.5).slice(0, 8);

            rail.innerHTML = MediaRail.render(results, 'movie');
        } catch (_e) {
            rail.innerHTML = '<div class="skel-rail-placeholder">discover hidden gems.</div>';
        }
    }

    function shuffleHiddenGems() {
        fetchHiddenGems();
    }

    // 📝 Latest Reviews Feed (Queries real Supabase DB; if empty -> CTA)
    async function fetchLatestReviews() {
        const container = document.getElementById('latestReviewsFeed');
        const section = document.getElementById('sectionLatestReviews');
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
                .limit(4);

            if (!reviews || !reviews.length) {
                renderEmptyReviewState(container);
                return;
            }

            container.innerHTML = reviews.map(r => ReviewCard.render(r)).join('');
        } catch (_e) {
            renderEmptyReviewState(container);
        }
    }

    function renderEmptyReviewState(container) {
        container.innerHTML = `
            <div class="community-empty-box">
                <div class="empty-icon"><i class="fas fa-pen-nib"></i></div>
                <div class="empty-title">be the first to review something.</div>
                <div class="empty-desc">share your taste on movies, games, books, or music.</div>
                <a href="index.html" class="btn btn-primary btn-sm"><i class="fas fa-plus"></i> write review</a>
            </div>
        `;
    }

    // 👥 People To Follow (Only shown if real users exist in DB)
    async function fetchPeopleToFollow() {
        const container = document.getElementById('discoverPeopleList');
        const section = document.getElementById('sectionPeopleToFollow');
        if (!container) return;

        if (!supabase) {
            if (section) section.style.display = 'none';
            return;
        }

        try {
            const { data: users } = await supabase
                .from('user_profiles')
                .select('id, username, full_name, bio, avatar_icon, location, profile_badges')
                .limit(4);

            if (!users || !users.length) {
                if (section) section.style.display = 'none';
                return;
            }

            if (section) section.style.display = 'block';
            container.innerHTML = users.map(u => UserCard.render(u)).join('');
        } catch (_e) {
            if (section) section.style.display = 'none';
        }
    }

    // ⭐ Community Lists (Only shown if real public lists exist in DB)
    async function fetchCommunityLists() {
        const rail = document.getElementById('railCommunityLists');
        const section = document.getElementById('sectionCommunityLists');
        if (!rail) return;

        if (!supabase) {
            if (section) section.style.display = 'none';
            return;
        }

        try {
            const { data: lists } = await supabase
                .from('user_lists')
                .select('*')
                .eq('is_private', false)
                .limit(6);

            if (!lists || !lists.length) {
                if (section) section.style.display = 'none';
                return;
            }

            if (section) section.style.display = 'block';
            rail.innerHTML = lists.map(l => ListCard.render(l)).join('');
        } catch (_e) {
            if (section) section.style.display = 'none';
        }
    }

    // === SEARCH USERS & MEDIA ===
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
            grid.innerHTML = '<div class="community-empty-box"><div class="empty-title">search for members</div></div>';
            return;
        }

        try {
            let queryBuilder = supabase
                .from('user_profiles')
                .select('id, username, full_name, bio, avatar_icon, location, profile_badges')
                .limit(10);

            if (query) {
                queryBuilder = queryBuilder.or(`username.ilike.%${query}%,full_name.ilike.%${query}%`);
            }

            const { data: users } = await queryBuilder;

            if (!users || !users.length) {
                grid.innerHTML = `<div class="community-empty-box"><div class="empty-title">no members found ${query ? `matching "${escapeHtml(query)}"` : ''}</div></div>`;
                return;
            }

            grid.innerHTML = users.map(u => UserCard.render(u)).join('');
        } catch (_e) {
            grid.innerHTML = '<div class="community-empty-box"><div class="empty-title">search unavailable</div></div>';
        }
    }

    function setSearchFilter(filter, btn) {
        currentFilter = filter;
        document.querySelectorAll('#peopleFilterPills .filter-pill').forEach(p => p.classList.remove('active'));
        if (btn) btn.classList.add('active');
        const input = document.getElementById('communitySearchInput');
        searchUsers(input?.value || '');
    }

    function toggleFollowUser(userId, btn) {
        if (btn) {
            const isFollowing = btn.classList.contains('btn-secondary');
            if (isFollowing) {
                btn.classList.remove('btn-secondary');
                btn.classList.add('btn-primary');
                btn.textContent = 'follow';
            } else {
                btn.classList.remove('btn-primary');
                btn.classList.add('btn-secondary');
                btn.textContent = 'following';
            }
        }
    }

    function loadPeople() {
        const grid = document.getElementById('peopleSearchResultsGrid');
        if (grid && !grid.innerHTML.trim()) {
            searchUsers('');
        }
    }

    function loadAllReviews() {
        fetchLatestReviews();
    }

    function loadAllLists() {
        fetchCommunityLists();
    }

    function escapeHtml(str) {
        return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // === INITIALIZE ===
    document.addEventListener('DOMContentLoaded', async function() {
        await initSupabase();
        loadDiscoverFeed();
    });

    return {
        switchTab,
        handleSearch,
        clearSearch,
        filterNewReleases,
        shuffleHiddenGems,
        setSearchFilter,
        toggleFollowUser
    };
})();
