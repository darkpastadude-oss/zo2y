/* ============================================================
   ZO2Y COMMUNITY - UNIFIED REVIEWS, USER SEARCH & FOLLOWS ENGINE
   ============================================================ */

window.CommunityManager = (function() {
    'use strict';

    let supabase = null;
    let currentUser = null;
    let followingSet = new Set();
    let searchDebounceTimer = null;

    function getSupabaseConfig() {
        return window.__ZO2Y_SUPABASE_CONFIG || {
            url: 'https://gfkhjbztayjyojsgdpgk.supabase.co',
            key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma2hqYnp0YXlqeW9qc2dkcGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTY4ODQwOTQsImV4cCI6MjAzMjQ2MDA5NH0.3w0U2J9wXN9L_u-N2_N5W8-B7Q9H5K4M2L0P8O3N6R1'
        };
    }

    function getSupabaseClient() {
        if (supabase && typeof supabase.from === 'function') return supabase;
        if (window.supabaseClient && typeof window.supabaseClient.from === 'function') {
            supabase = window.supabaseClient;
        } else if (window.ZO2Y_SUPABASE_CLIENT && typeof window.ZO2Y_SUPABASE_CLIENT.from === 'function') {
            supabase = window.ZO2Y_SUPABASE_CLIENT;
        } else if (window.supabase && typeof window.supabase.from === 'function') {
            supabase = window.supabase;
        }
        return supabase;
    }

    async function getCurrentUser() {
        if (currentUser) return currentUser;
        const client = getSupabaseClient();
        if (!client) return null;
        try {
            if (window.ZO2Y_AUTH && typeof window.ZO2Y_AUTH.getCurrentUser === 'function') {
                currentUser = await window.ZO2Y_AUTH.getCurrentUser();
                if (currentUser) return currentUser;
            }
            const { data } = await client.auth.getUser();
            currentUser = data?.user || null;
        } catch (_e) {}
        return currentUser;
    }

    // Load following list for logged in user
    async function loadFollowingSet() {
        const user = await getCurrentUser();
        const client = getSupabaseClient();
        if (!user || !client) return;
        try {
            const { data } = await client
                .from('follows')
                .select('following_id')
                .eq('follower_id', user.id);
            if (Array.isArray(data)) {
                followingSet = new Set(data.map(f => String(f.following_id)));
            }
        } catch (_e) {}
    }

    // === REUSABLE REVIEW CARD COMPONENT ===
    const ReviewCard = {
        render: function(review) {
            const userName = (review.username || review.user_name || review.full_name || 'zo2y member').toLowerCase();
            const userId = review.user_id || '';
            const itemTitle = (review.title || review.item_title || review.name || `${review.media_type || 'media'} #${review.item_id || ''}`).toLowerCase();
            const mediaType = (review.media_type || 'movie').toLowerCase();
            const itemId = review.item_id || review.track_id || review.book_id || '';
            const rating = review.rating ? parseFloat(review.rating) : null;
            const reviewText = (review.body || review.review_text || review.content || review.comment || '').toLowerCase();
            const coverUrl = review.image_url || review.cover_url || review.item_image || review.image || review.thumbnail || '';

            let targetPage = 'movie.html';
            if (mediaType === 'game') targetPage = 'game.html';
            else if (mediaType === 'tv' || mediaType === 'tvshow') targetPage = 'tvshow.html';
            else if (mediaType === 'book') targetPage = 'book.html';
            else if (mediaType === 'music' || mediaType === 'song' || mediaType === 'album') targetPage = 'song.html';

            const itemUrl = itemId ? `${targetPage}?id=${encodeURIComponent(itemId)}` : '#';
            const userProfileUrl = userId ? `profile.html?id=${encodeURIComponent(userId)}&u=${encodeURIComponent(usernameClean(userName))}` : `profile.html?u=${encodeURIComponent(usernameClean(userName))}`;

            let starsHtml = '';
            if (rating && rating > 0) {
                const fullStars = Math.floor(rating);
                for (let i = 0; i < 5; i++) {
                    if (i < fullStars) {
                        starsHtml += '<i class="fas fa-star text-accent"></i> ';
                    } else {
                        starsHtml += '<i class="far fa-star text-muted"></i> ';
                    }
                }
            }

            return `
                <div class="community-review-card" onclick="if('${itemUrl}' !== '#') window.location.href='${itemUrl}'">
                    <div class="review-card-header">
                        <div class="review-user-info">
                            <div class="review-avatar-circle" onclick="event.stopPropagation(); window.location.href='${userProfileUrl}'">${escapeHtml(userName.charAt(0).toUpperCase())}</div>
                            <div>
                                <div class="review-user-name">
                                    <a href="${userProfileUrl}" class="review-user-link" onclick="event.stopPropagation()">@${escapeHtml(usernameClean(userName))}</a>
                                </div>
                                <div class="review-item-meta">
                                    reviewed <a href="${itemUrl}" class="review-item-link" onclick="event.stopPropagation()">${escapeHtml(itemTitle)}</a>
                                </div>
                            </div>
                        </div>
                        ${starsHtml ? `<div class="review-stars-wrap">${starsHtml}</div>` : ''}
                    </div>
                    ${coverUrl ? `
                        <div class="review-card-body-with-cover">
                            <img class="review-cover-img" src="${coverUrl}" alt="${escapeHtml(itemTitle)}" loading="lazy" />
                            <div class="review-text-content">
                                "${escapeHtml(reviewText || 'rated this item')}"
                            </div>
                        </div>
                    ` : `
                        <div class="review-text-content pt-4">
                            "${escapeHtml(reviewText || 'rated this item')}"
                        </div>
                    `}
                </div>
            `;
        }
    };

    // === REUSABLE USER CARD COMPONENT ===
    const UserCard = {
        render: function(profile) {
            const userId = String(profile.id || '');
            const username = usernameClean(profile.username || profile.full_name || 'member');
            const fullName = profile.full_name || username;
            const isFollowing = followingSet.has(userId);
            const profileUrl = userId ? `profile.html?id=${encodeURIComponent(userId)}&u=${encodeURIComponent(username)}` : `profile.html?u=${encodeURIComponent(username)}`;

            return `
                <div class="community-user-card" onclick="window.location.href='${profileUrl}'">
                    <div class="user-card-left">
                        <div class="user-avatar-circle">${escapeHtml(username.charAt(0).toUpperCase())}</div>
                        <div class="user-card-info">
                            <div class="user-card-name">
                                <a href="${profileUrl}" class="user-profile-link" onclick="event.stopPropagation()">@${escapeHtml(username)}</a>
                            </div>
                            <div class="user-card-fullname">${escapeHtml(fullName)}</div>
                        </div>
                    </div>
                    <button class="btn-follow-toggle ${isFollowing ? 'following' : ''}" 
                            onclick="event.stopPropagation(); CommunityManager.toggleFollow('${userId}', this)" 
                            type="button">
                        <i class="fas ${isFollowing ? 'fa-user-check' : 'fa-user-plus'}"></i>
                        <span>${isFollowing ? 'following' : 'follow'}</span>
                    </button>
                </div>
            `;
        }
    };

    // === REVIEWS QUERY ENGINE ===
    async function loadReviewsFeed(retriesLeft = 3) {
        const container = document.getElementById('allReviewsFeed');
        if (!container) return;

        const client = getSupabaseClient();
        if (!client) {
            if (retriesLeft > 0) {
                setTimeout(() => loadReviewsFeed(retriesLeft - 1), 350);
            } else {
                renderEmptyReviewsState(container);
            }
            return;
        }

        try {
            const combinedReviews = [];
            const tablesToQuery = [
                { name: 'reviews', type: null },
                { name: 'list_items', type: null },
                { name: 'movie_list_items', type: 'movie' },
                { name: 'game_list_items', type: 'game' },
                { name: 'book_list_items', type: 'book' },
                { name: 'music_list_items', type: 'music' }
            ];

            const results = await Promise.allSettled(
                tablesToQuery.map(t =>
                    client
                        .from(t.name)
                        .select('*')
                        .order('created_at', { ascending: false })
                        .limit(10)
                )
            );

            results.forEach((res, idx) => {
                if (res.status === 'fulfilled' && res.value && Array.isArray(res.value.data)) {
                    const defaultType = tablesToQuery[idx].type;
                    res.value.data.forEach(item => {
                        if (item) {
                            combinedReviews.push({
                                ...item,
                                media_type: item.media_type || defaultType || 'movie'
                            });
                        }
                    });
                }
            });

            combinedReviews.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

            if (!combinedReviews.length) {
                renderEmptyReviewsState(container);
                return;
            }

            const userIds = [...new Set(combinedReviews.map(r => r.user_id).filter(Boolean))];
            const usersMap = new Map();

            if (userIds.length) {
                try {
                    const { data: profiles } = await client
                        .from('user_profiles')
                        .select('id, username, full_name')
                        .in('id', userIds);
                    if (Array.isArray(profiles)) {
                        profiles.forEach(p => {
                            if (p && p.id) {
                                usersMap.set(p.id, p.username || p.full_name || 'member');
                            }
                        });
                    }
                } catch (_pe) {}
            }

            const enrichedReviews = combinedReviews.slice(0, 20).map(r => {
                const resolvedUser = usersMap.get(r.user_id) || r.user_name || r.username || 'member';
                return {
                    ...r,
                    username: resolvedUser
                };
            });

            container.innerHTML = enrichedReviews.map(r => ReviewCard.render(r)).join('');
        } catch (_e) {
            renderEmptyReviewsState(container);
        }
    }

    function renderEmptyReviewsState(container) {
        container.innerHTML = `
            <div class="community-empty-box">
                <div class="empty-icon"><i class="fas fa-pen-nib"></i></div>
                <div class="empty-title">be the first to review something.</div>
                <div class="empty-desc">share your thoughts on movies, games, books, or music.</div>
                <a href="index.html" class="btn-empty-action"><i class="fas fa-plus"></i> write review</a>
            </div>
        `;
    }

    // === USER / PEOPLE SEARCH ENGINE (WITH POSTGREST PARENTHESES SYNTAX & REST FALLBACK) ===
    async function loadPeopleFeed(query = '') {
        const container = document.getElementById('peopleListFeed');
        if (!container) return;

        const client = getSupabaseClient();
        await loadFollowingSet();

        const cleanQ = String(query || '').trim().replace(/^@+/, '');

        try {
            let profiles = null;

            if (client) {
                let req = client.from('user_profiles').select('id, username, full_name, avatar_url, bio');
                if (cleanQ) {
                    const ilike = `%${cleanQ.replace(/%/g, '')}%`;
                    req = req.or(`(username.ilike.${ilike},full_name.ilike.${ilike})`);
                } else {
                    req = req.order('created_at', { ascending: false });
                }
                const res = await req.limit(16);
                if (!res.error && Array.isArray(res.data)) {
                    profiles = res.data;
                }
            }

            // Fallback REST fetch if client query returned empty/error
            if (!profiles || !profiles.length) {
                const cfg = getSupabaseConfig();
                const url = new URL(`${cfg.url}/rest/v1/user_profiles`);
                url.searchParams.set('select', 'id,username,full_name,avatar_url,bio');
                if (cleanQ) {
                    const ilike = `%${cleanQ.replace(/%/g, '')}%`;
                    url.searchParams.set('or', `(username.ilike.${ilike},full_name.ilike.${ilike})`);
                } else {
                    url.searchParams.set('order', 'created_at.desc');
                }
                url.searchParams.set('limit', '16');

                const resp = await fetch(url.toString(), {
                    headers: {
                        'apikey': cfg.key,
                        'Authorization': `Bearer ${cfg.key}`
                    }
                });
                if (resp.ok) {
                    const json = await resp.json().catch(() => []);
                    if (Array.isArray(json)) {
                        profiles = json;
                    }
                }
            }

            if (!profiles || !profiles.length) {
                container.innerHTML = `
                    <div class="community-empty-box">
                        <div class="empty-icon"><i class="fas fa-users"></i></div>
                        <div class="empty-title">${cleanQ ? 'no members found matching "' + escapeHtml(cleanQ) + '".' : 'no members found.'}</div>
                        <div class="empty-desc">try searching for another username or full name.</div>
                    </div>
                `;
                return;
            }

            container.innerHTML = profiles.map(p => UserCard.render(p)).join('');
        } catch (_e) {
            container.innerHTML = `
                <div class="community-empty-box">
                    <div class="empty-icon"><i class="fas fa-users"></i></div>
                    <div class="empty-title">search members by taste.</div>
                    <div class="empty-desc">find people who love the same movies, games, books, and music as you.</div>
                </div>
            `;
        }
    }

    // === FOLLOWING FEED ENGINE ===
    async function loadFollowingFeed() {
        const container = document.getElementById('followingListFeed');
        if (!container) return;

        const user = await getCurrentUser();
        const client = getSupabaseClient();
        if (!user || !client) {
            container.innerHTML = `
                <div class="community-empty-box">
                    <div class="empty-icon"><i class="fas fa-user-lock"></i></div>
                    <div class="empty-title">sign in to view members you follow.</div>
                    <a href="login.html" class="btn-empty-action"><i class="fas fa-sign-in-alt"></i> sign in</a>
                </div>
            `;
            return;
        }

        try {
            const { data: follows, error } = await client
                .from('follows')
                .select('following_id')
                .eq('follower_id', user.id);

            if (error || !follows || !follows.length) {
                container.innerHTML = `
                    <div class="community-empty-box">
                        <div class="empty-icon"><i class="fas fa-user-check"></i></div>
                        <div class="empty-title">you are not following anyone yet.</div>
                        <div class="empty-desc">discover members in the people tab and follow them to see their updates.</div>
                    </div>
                `;
                return;
            }

            const ids = follows.map(f => f.following_id);
            const { data: profiles } = await client
                .from('user_profiles')
                .select('id, username, full_name, avatar_url, bio')
                .in('id', ids);

            if (!profiles || !profiles.length) {
                container.innerHTML = `
                    <div class="community-empty-box">
                        <div class="empty-icon"><i class="fas fa-user-check"></i></div>
                        <div class="empty-title">you are not following anyone yet.</div>
                    </div>
                `;
                return;
            }

            followingSet = new Set(ids.map(String));
            container.innerHTML = profiles.map(p => UserCard.render(p)).join('');
        } catch (_e) {}
    }

    // === INTERACTIVE FOLLOW / UNFOLLOW TOGGLE ===
    async function toggleFollow(targetUserId, buttonEl) {
        const user = await getCurrentUser();
        const client = getSupabaseClient();
        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        const isFollowing = followingSet.has(targetUserId);

        try {
            if (isFollowing) {
                followingSet.delete(targetUserId);
                updateFollowButton(buttonEl, false);
                await client.from('follows').delete().eq('follower_id', user.id).eq('following_id', targetUserId);
            } else {
                followingSet.add(targetUserId);
                updateFollowButton(buttonEl, true);
                await client.from('follows').insert({ follower_id: user.id, following_id: targetUserId });
            }
        } catch (err) {
            console.error('Follow toggle error:', err);
        }
    }

    function updateFollowButton(buttonEl, isFollowing) {
        if (!buttonEl) return;
        buttonEl.classList.toggle('following', isFollowing);
        const icon = buttonEl.querySelector('i');
        const label = buttonEl.querySelector('span');
        if (icon) icon.className = `fas ${isFollowing ? 'fa-user-check' : 'fa-user-plus'}`;
        if (label) label.textContent = isFollowing ? 'following' : 'follow';
    }

    // === SEARCH INPUT HANDLER ===
    function bindSearchInput() {
        const input = document.querySelector('.community-search-input');
        if (!input) return;

        input.removeAttribute('readonly');
        input.addEventListener('input', function(e) {
            const query = e.target.value || '';
            clearTimeout(searchDebounceTimer);
            searchDebounceTimer = setTimeout(() => {
                if (query.trim()) {
                    switchTab('people');
                    loadPeopleFeed(query);
                }
            }, 250);
        });
    }

    // === TAB SWITCHING MANAGER ===
    function switchTab(tabName) {
        document.querySelectorAll('.community-tab-btn').forEach(function(btn) {
            const isTarget = btn.getAttribute('data-tab') === tabName;
            btn.classList.toggle('active', isTarget);
        });

        document.querySelectorAll('.community-tab-pane').forEach(function(pane) {
            const paneId = 'pane' + tabName.charAt(0).toUpperCase() + tabName.slice(1);
            pane.classList.toggle('active', pane.id === paneId);
        });

        if (tabName === 'reviews') {
            loadReviewsFeed();
        } else if (tabName === 'people') {
            loadPeopleFeed();
        } else if (tabName === 'following') {
            loadFollowingFeed();
        }
    }

    function usernameClean(name) {
        return String(name || '').replace(/^@+/, '').trim();
    }

    function escapeHtml(str) {
        return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // Auto-init on page load
    document.addEventListener('DOMContentLoaded', function() {
        loadReviewsFeed();
        loadFollowingSet();
        bindSearchInput();
    });

    return {
        switchTab: switchTab,
        loadReviewsFeed: loadReviewsFeed,
        loadPeopleFeed: loadPeopleFeed,
        loadFollowingFeed: loadFollowingFeed,
        toggleFollow: toggleFollow
    };
})();
