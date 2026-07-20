/* ============================================================
   ZO2Y COMMUNITY - UNIFIED REVIEWS, USER SEARCH & FOLLOWS ENGINE
   ============================================================ */

window.CommunityManager = (function() {
    'use strict';

    let supabase = null;
    let currentUser = null;
    let followingSet = new Set();
    let followersSet = new Set();
    let activityFilter = 'all';
    let cachedFollowingProfiles = [];
    let cachedFollowersProfiles = [];
    let activityReactions = {};
    let activityReplies = {};

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
        } else if (window.ZO2Y_AUTH && typeof window.ZO2Y_AUTH.ensureClient === 'function') {
            try {
                const shared = window.ZO2Y_AUTH.ensureClient();
                if (shared && typeof shared.from === 'function') supabase = shared;
            } catch (_e) {}
        }
        if (!supabase) {
            const cfg = getSupabaseConfig();
            try {
                supabase = window.supabase.createClient(cfg.url, cfg.key);
            } catch (_e) {}
        }
        return supabase;
    }

    async function getCurrentUser() {
        if (currentUser) return currentUser;
        try {
            if (window.ZO2Y_AUTH && typeof window.ZO2Y_AUTH.getVerifiedUser === 'function') {
                const client = getSupabaseClient();
                currentUser = await window.ZO2Y_AUTH.getVerifiedUser(client);
                if (currentUser) return currentUser;
            }
        } catch (_e) {}
        const client = getSupabaseClient();
        if (!client) return null;
        try {
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
                .select('followed_id')
                .eq('follower_id', user.id);
            if (Array.isArray(data)) {
                followingSet = new Set(data.map(f => String(f.followed_id)));
            }
        } catch (_e) {}
    }

    // Load followers list for logged in user
    async function loadFollowersSet() {
        const user = await getCurrentUser();
        const client = getSupabaseClient();
        if (!user || !client) return;
        try {
            const { data } = await client
                .from('follows')
                .select('follower_id')
                .eq('followed_id', user.id);
            if (Array.isArray(data)) {
                followersSet = new Set(data.map(f => String(f.follower_id)));
            }
        } catch (_e) {}
    }

    function setActivityFilter(filter) {
        activityFilter = filter || 'all';
        document.querySelectorAll('.activity-filter-btn').forEach(function(btn) {
            btn.classList.toggle('active', btn.getAttribute('data-activity-filter') === activityFilter);
        });
        const container = document.getElementById('activityListFeed');
        if (container) {
            container.innerHTML = '<div class="activity-loading"><i class="fas fa-spinner fa-spin"></i> loading...</div>';
        }
        loadActivityFeed();
    }

    // === MEDIA & LIFESTYLE METADATA HYDRATION ENGINE ===
    function isValidTitle(t, mediaType) {
        if (!t) return false;
        const str = String(t).trim().toLowerCase();
        if (!str || str === 'untitled' || str === 'an item' || str === 'item') return false;
        if (str.startsWith(String(mediaType || 'media').toLowerCase()) && str.includes('#')) return false;
        if (str.includes('#') && (
            str.startsWith('movie') || str.startsWith('tv') || str.startsWith('game') ||
            str.startsWith('book') || str.startsWith('music') || str.startsWith('song') ||
            str.startsWith('anime') || str.startsWith('travel') || str.startsWith('sports') ||
            str.startsWith('fashion') || str.startsWith('food') || str.startsWith('car')
        )) return false;
        return true;
    }

    async function hydrateMediaMetadata(items) {
        if (!Array.isArray(items) || !items.length) return;
        const client = getSupabaseClient();
        
        const mediaMap = new Map(); // key = item_id -> { title, image_url }

        // Batch query list_items for cached titles & posters across all media/lifestyle categories
        const uniqueItemIds = [...new Set(items.map(it => String(it.item_id || it.track_id || it.book_id || '')).filter(Boolean))];
        if (client && uniqueItemIds.length) {
            try {
                const { data: cachedListItems } = await client
                    .from('list_items')
                    .select('item_id, media_type, title, image_url')
                    .in('item_id', uniqueItemIds);
                if (Array.isArray(cachedListItems)) {
                    cachedListItems.forEach(row => {
                        if (row && row.item_id) {
                            const existing = mediaMap.get(String(row.item_id)) || {};
                            const validTitle = isValidTitle(row.title, row.media_type) ? row.title : existing.title || '';
                            const validImg = row.image_url && !row.image_url.includes('fallback') ? row.image_url : existing.image_url || row.image_url || '';
                            if (validTitle || validImg) {
                                mediaMap.set(String(row.item_id), {
                                    title: validTitle,
                                    image_url: validImg
                                });
                            }
                        }
                    });
                }
            } catch (_e) {}

            // Query books table for books
            const bookIds = items.filter(it => (it.media_type || '').toLowerCase() === 'book').map(it => String(it.item_id || '')).filter(Boolean);
            if (bookIds.length) {
                try {
                    const { data: books } = await client
                        .from('books')
                        .select('id, title, thumbnail')
                        .in('id', bookIds);
                    if (Array.isArray(books)) {
                        books.forEach(b => {
                            if (b && b.id && b.title) {
                                const existing = mediaMap.get(String(b.id)) || {};
                                mediaMap.set(String(b.id), {
                                    title: b.title,
                                    image_url: b.thumbnail || existing.image_url || ''
                                });
                            }
                        });
                    }
                } catch (_e) {}
            }

            // Query tracks table for music
            const trackIds = items.filter(it => ['music', 'song', 'track', 'album'].includes((it.media_type || '').toLowerCase())).map(it => String(it.item_id || '')).filter(Boolean);
            if (trackIds.length) {
                try {
                    const { data: tracks } = await client
                        .from('tracks')
                        .select('id, name, image_url')
                        .in('id', trackIds);
                    if (Array.isArray(tracks)) {
                        tracks.forEach(t => {
                            if (t && t.id && t.name) {
                                const existing = mediaMap.get(String(t.id)) || {};
                                mediaMap.set(String(t.id), {
                                    title: t.name,
                                    image_url: t.image_url || existing.image_url || ''
                                });
                            }
                        });
                    }
                } catch (_e) {}
            }

            // Query teams table for sports
            const teamIds = items.filter(it => ['sports', 'sport', 'team'].includes((it.media_type || '').toLowerCase())).map(it => String(it.item_id || '')).filter(Boolean);
            if (teamIds.length) {
                try {
                    const { data: teams } = await client
                        .from('teams')
                        .select('id, name, logo_url, strTeamBadge')
                        .in('id', teamIds);
                    if (Array.isArray(teams)) {
                        teams.forEach(t => {
                            if (t && t.id && t.name) {
                                const existing = mediaMap.get(String(t.id)) || {};
                                mediaMap.set(String(t.id), {
                                    title: t.name,
                                    image_url: t.logo_url || t.strTeamBadge || existing.image_url || ''
                                });
                            }
                        });
                    }
                } catch (_e) {}
            }

            // Query fashion_brands for fashion
            const fashionIds = items.filter(it => (it.media_type || '').toLowerCase() === 'fashion').map(it => String(it.item_id || '')).filter(Boolean);
            if (fashionIds.length) {
                try {
                    const { data: brands } = await client
                        .from('fashion_brands')
                        .select('id, name, logo_url')
                        .in('id', fashionIds);
                    if (Array.isArray(brands)) {
                        brands.forEach(b => {
                            if (b && b.id && b.name) {
                                const existing = mediaMap.get(String(b.id)) || {};
                                mediaMap.set(String(b.id), {
                                    title: b.name,
                                    image_url: b.logo_url || existing.image_url || ''
                                });
                            }
                        });
                    }
                } catch (_e) {}
            }

            // Query food_brands for food
            const foodIds = items.filter(it => (it.media_type || '').toLowerCase() === 'food').map(it => String(it.item_id || '')).filter(Boolean);
            if (foodIds.length) {
                try {
                    const { data: foods } = await client
                        .from('food_brands')
                        .select('id, name, logo_url')
                        .in('id', foodIds);
                    if (Array.isArray(foods)) {
                        foods.forEach(f => {
                            if (f && f.id && f.name) {
                                const existing = mediaMap.get(String(f.id)) || {};
                                mediaMap.set(String(f.id), {
                                    title: f.name,
                                    image_url: f.logo_url || existing.image_url || ''
                                });
                            }
                        });
                    }
                } catch (_e) {}
            }
        }

        // Fetch missing metadata from external APIs in parallel
        await Promise.all(items.map(async (item) => {
            const rawId = String(item.item_id || item.track_id || item.book_id || '').trim();
            if (!rawId) return;

            const existing = mediaMap.get(rawId);
            const currentTitle = item.title || item.item_title || item.name || existing?.title;
            const currentImage = item.image_url || item.cover_url || item.image || item.thumbnail || existing?.image_url;

            if (isValidTitle(currentTitle, item.media_type) && currentImage) {
                return; // Already has valid title & poster image
            }

            const type = (item.media_type || 'movie').toLowerCase();

            try {
                if (type === 'movie') {
                    const res = await fetch(`/api/tmdb/movie/${encodeURIComponent(rawId)}?language=en`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data && (data.title || data.original_title)) {
                            mediaMap.set(rawId, {
                                title: data.title || data.original_title,
                                image_url: data.poster_path ? 'https://image.tmdb.org/t/p/w300' + data.poster_path : (existing?.image_url || '')
                            });
                        }
                    }
                } else if (type === 'tv' || type === 'tvshow' || type === 'anime') {
                    const res = await fetch(`/api/tmdb/tv/${encodeURIComponent(rawId)}?language=en`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data && (data.name || data.original_name)) {
                            mediaMap.set(rawId, {
                                title: data.name || data.original_name,
                                image_url: data.poster_path ? 'https://image.tmdb.org/t/p/w300' + data.poster_path : (existing?.image_url || '')
                            });
                        }
                    }
                } else if (type === 'game') {
                    const res = await fetch(`/api/igdb/games/${encodeURIComponent(rawId)}`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data && data.name) {
                            mediaMap.set(rawId, {
                                title: data.name,
                                image_url: data.cover || data.hero || data.background_image || existing?.image_url || ''
                            });
                        }
                    }
                } else if (type === 'book') {
                    try {
                        const { data } = await client.from('books').select('id, title, thumbnail, cover_url').eq('id', rawId).maybeSingle();
                        if (data && (data.thumbnail || data.cover_url)) {
                            mediaMap.set(rawId, {
                                title: data.title || existing?.title || '',
                                image_url: data.thumbnail || data.cover_url || existing?.image_url || ''
                            });
                        }
                    } catch (_e) {}
                } else if (type === 'music' || type === 'song' || type === 'track' || type === 'album') {
                    const res = await fetch(`https://itunes.apple.com/lookup?id=${encodeURIComponent(rawId)}`);
                    if (res.ok) {
                        const data = await res.json();
                        const result = data.results && data.results[0];
                        if (result && (result.trackName || result.collectionName)) {
                            mediaMap.set(rawId, {
                                title: result.trackName || result.collectionName,
                                image_url: (result.artworkUrl100 || '').replace('100x100bb', '300x300bb') || existing?.image_url || ''
                            });
                        }
                    }
                } else if (type === 'travel') {
                    var code = String(rawId || '').toUpperCase().trim();
                    if (code && code.length === 2) {
                        mediaMap.set(rawId, {
                            title: existing?.title || code,
                            image_url: 'https://flagcdn.com/w160/' + code.toLowerCase() + '.png'
                        });
                    }
                } else if (type === 'sports' || type === 'sport' || type === 'team') {
                    const res = await fetch(`https://www.thesportsdb.com/api/v1/json/3/lookupteam.php?id=${encodeURIComponent(rawId)}`);
                    if (res.ok) {
                        const data = await res.json();
                        const team = data.teams && data.teams[0];
                        if (team && (team.strTeam || team.strAlternate)) {
                            mediaMap.set(rawId, {
                                title: team.strTeam || team.strAlternate,
                                image_url: team.strTeamBadge || team.strTeamLogo || existing?.image_url || ''
                            });
                        }
                    }
                } else if (type === 'fashion' || type === 'food' || type === 'car') {
                    // Lifestyle items: try local DB tables handled above; skip external API
                }
            } catch (_err) {}
        }));

        // Assign back to item objects
        items.forEach(item => {
            const rawId = String(item.item_id || item.track_id || item.book_id || '').trim();
            const meta = mediaMap.get(rawId);
            if (meta) {
                if (meta.title && !isValidTitle(item.title, item.media_type)) {
                    item.title = meta.title;
                    item.item_title = meta.title;
                    item.name = meta.title;
                }
                if (meta.image_url && !item.image_url) {
                    item.image_url = meta.image_url;
                    item.cover_url = meta.image_url;
                    item.image = meta.image_url;
                    item.thumbnail = meta.image_url;
                }
            }
        });
    }

    // === REUSABLE REVIEW CARD COMPONENT ===
    const ReviewCard = {
        render: function(review) {
            const userName = (review.username || review.user_name || review.full_name || 'zo2y member');
            const userId = review.user_id || '';
            const mediaType = (review.media_type || 'movie').toLowerCase();
            const itemId = review.item_id || review.track_id || review.book_id || '';
            const itemTitle = review.title || review.item_title || review.name || `${mediaType} #${itemId}`;
            const rating = review.rating ? parseFloat(review.rating) : null;
            const reviewText = review.body || review.review_text || review.content || review.comment || '';
            const coverUrl = review.image_url || review.cover_url || review.item_image || review.image || review.thumbnail || '';
            const reviewId = review.id || '';

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

            let interactionsHtml = '';
            if (reviewId) {
                interactionsHtml = `
                    <div class="activity-card-interactions" data-feed-id="${escapeHtml(reviewId)}">
                        <button class="activity-interact-btn" data-action="like" data-feed-id="${escapeHtml(reviewId)}" onclick="event.stopPropagation(); CommunityManager.toggleActivityReaction('${escapeHtml(reviewId)}', 'like', this)">
                            <i class="fas fa-thumbs-up"></i>
                            <span class="activity-interact-count" data-like-count>0</span>
                        </button>
                        <button class="activity-interact-btn" data-action="dislike" data-feed-id="${escapeHtml(reviewId)}" onclick="event.stopPropagation(); CommunityManager.toggleActivityReaction('${escapeHtml(reviewId)}', 'dislike', this)">
                            <i class="fas fa-thumbs-down"></i>
                            <span class="activity-interact-count" data-dislike-count>0</span>
                        </button>
                        <button class="activity-interact-btn" data-action="reply" data-feed-id="${escapeHtml(reviewId)}" onclick="event.stopPropagation(); CommunityManager.toggleReplyThread('${escapeHtml(reviewId)}')">
                            <i class="fas fa-comment"></i>
                            <span class="activity-interact-count" data-reply-count>0</span>
                        </button>
                    </div>
                    <div class="activity-reply-thread" data-reply-thread="${escapeHtml(reviewId)}">
                        <div class="activity-reply-list" data-reply-list="${escapeHtml(reviewId)}"></div>
                        <div class="activity-reply-input-row">
                            <textarea class="activity-reply-input" data-reply-input="${escapeHtml(reviewId)}" placeholder="write a reply..." maxlength="500" rows="1" onclick="event.stopPropagation()"></textarea>
                            <button class="activity-reply-submit" onclick="event.stopPropagation(); CommunityManager.submitActivityReply('${escapeHtml(reviewId)}', this)">post</button>
                        </div>
                    </div>
                `;
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
                            <img class="review-cover-img" src="${escapeHtml(coverUrl)}" alt="${escapeHtml(itemTitle)}" loading="lazy" />
                            <div class="review-text-content">
                                "${escapeHtml(reviewText || 'rated this item')}"
                            </div>
                        </div>
                    ` : `
                        <div class="review-text-content pt-4">
                            "${escapeHtml(reviewText || 'rated this item')}"
                        </div>
                    `}
                    ${interactionsHtml}
                </div>
            `;
        }
    };

    // === SAFE TABLE QUERY HELPER ===
    async function safeTableQuery(client, tableName, fields = '*', limitCount = 35) {
        if (!client || typeof client.from !== 'function') return [];
        try {
            let res1 = await client.from(tableName).select(fields).order('created_at', { ascending: false }).limit(limitCount);
            if (!res1.error && Array.isArray(res1.data) && res1.data.length) return res1.data;

            let res2 = await client.from(tableName).select(fields).order('inserted_at', { ascending: false }).limit(limitCount);
            if (!res2.error && Array.isArray(res2.data) && res2.data.length) return res2.data;

            let res3 = await client.from(tableName).select(fields).order('id', { ascending: false }).limit(limitCount);
            if (!res3.error && Array.isArray(res3.data) && res3.data.length) return res3.data;

            let res4 = await client.from(tableName).select(fields).limit(limitCount);
            if (!res4.error && Array.isArray(res4.data)) return res4.data;
        } catch (_err) {}
        return [];
    }

    // === REUSABLE USER CARD COMPONENT ===
    const UserCard = {
        render: function(profile) {
            const userId = String(profile.id || '');
            const username = usernameClean(profile.username || profile.full_name || 'member');
            const fullName = profile.full_name || username;
            const isFollowing = followingSet.has(userId);
            const isSelf = currentUser && String(currentUser.id) === userId;
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
                    ${!isSelf ? `
                        <button class="btn-follow-toggle ${isFollowing ? 'following' : ''}" 
                                onclick="event.stopPropagation(); CommunityManager.toggleFollow('${userId}', this)" 
                                type="button">
                            <i class="fas ${isFollowing ? 'fa-user-check' : 'fa-user-plus'}"></i>
                            <span>${isFollowing ? 'following' : 'follow'}</span>
                        </button>
                    ` : ''}
                </div>
            `;
        }
    };

    // === ACTIVITY CARD COMPONENT ===
    const ActivityCard = {
        render: function(item) {
            const userName = (item.username || item.full_name || 'member');
            const userId = item.user_id || item.actor_id || '';
            const mediaType = (item.media_type || 'movie').toLowerCase();
            const itemId = item.item_id || '';
            const listType = (item.list_type || '').toLowerCase();
            const listName = item.list_name || '';
            const eventType = (item.event_type || item.activityType || '').toLowerCase();
            const rawTitle = item.title || item.item_title || item.name || '';
            const itemTitle = isValidTitle(rawTitle, mediaType) ? rawTitle : '';
            const coverUrl = item.image_url || item.cover_url || item.image || item.thumbnail || '';
            const ts = item.created_at || item.inserted_at || '';

            const mediaLabel = {
                movie: 'movie', tv: 'show', tvshow: 'show', anime: 'anime',
                game: 'game', book: 'book', music: 'music', song: 'song',
                track: 'track', album: 'album', travel: 'destination',
                sports: 'team', sport: 'team', team: 'team',
                fashion: 'fashion item', food: 'food item', car: 'car'
            }[mediaType] || mediaType || 'item';

            const targetUrl = itemLink(mediaType, itemId);
            const profileUrl = userId ? `profile.html?id=${encodeURIComponent(userId)}` : '#';

            let verbHtml = '';
            const displayName = itemTitle || `a ${mediaLabel}`;
            const itemLinkHtml = itemId
                ? `<a href="${targetUrl}" class="review-item-link" onclick="event.stopPropagation()">${escapeHtml(displayName)}</a>`
                : `<span class="review-item-link">${escapeHtml(displayName)}</span>`;

            if (eventType === 'review' || eventType === 'review_add') {
                verbHtml = `left a review on ${itemLinkHtml}`;
            } else if (eventType === 'review_edit') {
                verbHtml = `edited a review for ${itemLinkHtml}`;
            } else if (eventType === 'review_delete') {
                verbHtml = `deleted a review for ${itemLinkHtml}`;
            } else if (eventType === 'create_list' || eventType === 'list_create') {
                const listTitle = item.list_name || item.name || item.title || 'a custom list';
                verbHtml = `created list <strong>${escapeHtml(listTitle)}</strong>`;
            } else if (eventType === 'list_delete') {
                const listTitle = item.list_name || item.name || item.title || 'a custom list';
                verbHtml = `deleted list <strong>${escapeHtml(listTitle)}</strong>`;
            } else if (eventType === 'list_remove') {
                if (listName) {
                    verbHtml = `removed ${itemLinkHtml} from <strong>${escapeHtml(listName)}</strong>`;
                } else {
                    verbHtml = `removed ${itemLinkHtml} from a list`;
                }
            } else if (listName) {
                verbHtml = `added ${itemLinkHtml} to <strong>${escapeHtml(listName)}</strong>`;
            } else if (listType === 'favorites' || listType === 'favorite') {
                verbHtml = `added ${itemLinkHtml} to favorites`;
            } else if (listType === 'watched') {
                verbHtml = `added ${itemLinkHtml} to watched`;
            } else if (listType === 'watching') {
                verbHtml = `is watching ${itemLinkHtml}`;
            } else if (listType === 'playing') {
                verbHtml = `is playing ${itemLinkHtml}`;
            } else if (listType === 'read') {
                verbHtml = `marked ${itemLinkHtml} as read`;
            } else if (listType === 'reading') {
                verbHtml = `is reading ${itemLinkHtml}`;
            } else if (listType === 'listening') {
                verbHtml = `is listening to ${itemLinkHtml}`;
            } else if (listType === 'watchlist') {
                verbHtml = `added ${itemLinkHtml} to watchlist`;
            } else if (listType === 'planned' || listType === 'want_to_watch' || listType === 'wishlist') {
                verbHtml = `added ${itemLinkHtml} to wishlist`;
            } else {
                verbHtml = `added ${itemLinkHtml} to ${escapeHtml(listType || 'a list')}`;
            }

            const mediaIconClass = {
                movie: 'fa-film', tv: 'fa-tv', tvshow: 'fa-tv', anime: 'fa-film',
                game: 'fa-gamepad', book: 'fa-book', music: 'fa-music', song: 'fa-music',
                track: 'fa-music', album: 'fa-compact-disc', travel: 'fa-plane',
                sports: 'fa-football', sport: 'fa-football', team: 'fa-football',
                fashion: 'fa-shirt', food: 'fa-utensils', car: 'fa-car'
            }[mediaType] || 'fa-layer-group';

            const isReview = eventType === 'review' || eventType === 'review_add' || eventType === 'review_edit';
            const feedId = item.id || '';

            const coverClassMap = {
                movie: 'activity-cover-poster', tv: 'activity-cover-poster', tvshow: 'activity-cover-poster',
                anime: 'activity-cover-poster', book: 'activity-cover-poster', game: 'activity-cover-poster',
                travel: 'activity-cover-wide', destination: 'activity-cover-wide',
                food: 'activity-cover-square', fashion: 'activity-cover-square', car: 'activity-cover-square',
                sports: 'activity-cover-square', sport: 'activity-cover-square', team: 'activity-cover-square',
                music: 'activity-cover-album', song: 'activity-cover-album', track: 'activity-cover-album',
                album: 'activity-cover-album'
            };
            const coverClass = coverClassMap[mediaType] || 'activity-cover-poster';

            let interactionsHtml = '';
            if (isReview && feedId) {
                interactionsHtml = `
                    <div class="activity-card-interactions" data-feed-id="${escapeHtml(feedId)}">
                        <button class="activity-interact-btn" data-action="like" data-feed-id="${escapeHtml(feedId)}" onclick="event.stopPropagation(); CommunityManager.toggleActivityReaction('${escapeHtml(feedId)}', 'like', this)">
                            <i class="fas fa-thumbs-up"></i>
                            <span class="activity-interact-count" data-like-count>0</span>
                        </button>
                        <button class="activity-interact-btn" data-action="dislike" data-feed-id="${escapeHtml(feedId)}" onclick="event.stopPropagation(); CommunityManager.toggleActivityReaction('${escapeHtml(feedId)}', 'dislike', this)">
                            <i class="fas fa-thumbs-down"></i>
                            <span class="activity-interact-count" data-dislike-count>0</span>
                        </button>
                        <button class="activity-interact-btn" data-action="reply" data-feed-id="${escapeHtml(feedId)}" onclick="event.stopPropagation(); CommunityManager.toggleReplyThread('${escapeHtml(feedId)}')">
                            <i class="fas fa-comment"></i>
                            <span class="activity-interact-count" data-reply-count>0</span>
                        </button>
                    </div>
                    <div class="activity-reply-thread" data-reply-thread="${escapeHtml(feedId)}">
                        <div class="activity-reply-list" data-reply-list="${escapeHtml(feedId)}"></div>
                        <div class="activity-reply-input-row">
                            <textarea class="activity-reply-input" data-reply-input="${escapeHtml(feedId)}" placeholder="write a reply..." maxlength="500" rows="1" onclick="event.stopPropagation()"></textarea>
                            <button class="activity-reply-submit" onclick="event.stopPropagation(); CommunityManager.submitActivityReply('${escapeHtml(feedId)}', this)">post</button>
                        </div>
                    </div>
                `;
            }

            return `
                <div class="community-activity-card" onclick="if('${targetUrl}' !== '#') window.location.href='${targetUrl}'">
                    <div class="activity-card-left">
                        <div class="activity-avatar-circle" onclick="event.stopPropagation(); window.location.href='${profileUrl}'">${escapeHtml(userName.charAt(0).toUpperCase())}</div>
                        <div class="activity-card-info">
                            <div class="activity-card-text">
                                <a href="${profileUrl}" class="review-user-link" onclick="event.stopPropagation()">@${escapeHtml(usernameClean(userName))}</a> ${verbHtml}
                            </div>
                            <div class="activity-card-meta">
                                <span class="activity-media-type-badge"><i class="fas ${mediaIconClass}"></i> ${escapeHtml(mediaType)}</span>
                                ${ts ? `<span class="activity-card-time">${escapeHtml(timeAgo(ts))}</span>` : ''}
                            </div>
                            ${interactionsHtml}
                        </div>
                    </div>
                    ${coverUrl ? `<img class="activity-cover-img ${coverClass}" src="${escapeHtml(coverUrl)}" alt="${escapeHtml(itemTitle || mediaLabel)}" loading="lazy" />` : ((eventType === 'create_list' || eventType === 'list_create') ? `<div class="activity-list-icon-badge"><i class="fas fa-layer-group text-accent"></i></div>` : `<div class="activity-list-icon-badge"><i class="fas ${mediaIconClass} text-accent"></i></div>`)}
                </div>
            `;
        }
    };

    // === ACTIVITY FEED ENGINE ===
    async function loadActivityFeed(retriesLeft = 3) {
        const container = document.getElementById('activityListFeed') || document.getElementById('activityFeed');
        if (!container) return;

        const client = getSupabaseClient();
        if (!client) {
            if (retriesLeft > 0) {
                setTimeout(() => loadActivityFeed(retriesLeft - 1), 350);
            } else {
                renderEmptyActivityState(container);
            }
            return;
        }

        try {
            const user = await getCurrentUser();
            if (activityFilter !== 'all') {
                await loadFollowingSet();
                await loadFollowersSet();
            }

            const filterSet = activityFilter === 'following' ? followingSet
                : activityFilter === 'followers' ? followersSet
                : null;

            let activityItems = await loadFromActivityFeed(client, filterSet);

            if (!activityItems) {
                activityItems = await loadFromRawTables(client, filterSet);
            }

            if (!activityItems || !activityItems.length) {
                renderEmptyActivityState(container);
                return;
            }

            activityItems.sort((a, b) => {
                const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
                const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
                return timeB - timeA;
            });

            const topActivities = activityItems.slice(0, 40);

            await hydrateMediaMetadata(topActivities);

            container.innerHTML = topActivities.map(a => ActivityCard.render(a)).join('');
            await loadActivityInteractions();
        } catch (_e) {
            renderEmptyActivityState(container);
        }
    }

    async function loadFromActivityFeed(client, filterSet) {
        try {
            let req = client
                .from('user_activity_feed')
                .select('id, actor_id, event_type, media_type, item_id, list_type, list_id, rating, review_text, metadata, created_at')
                .order('created_at', { ascending: false })
                .limit(60);

            const { data: rows, error } = await req;
            if (error) return null;

            let items = Array.isArray(rows) ? rows : [];

            if (filterSet !== null) {
                if (!filterSet.size) return [];
                items = items.filter(row => filterSet.has(String(row.actor_id || '')));
            }

            const userIds = [...new Set(items.map(r => r.actor_id).filter(Boolean))];
            const usersMap = await fetchUserNames(client, userIds);

            const listIdSet = new Set();
            items.forEach(row => {
                const listId = String(row.list_id || '').trim();
                const mediaType = String(row.media_type || '').trim().toLowerCase();
                if (listId && mediaType) listIdSet.add(listId);
            });

            const customListNames = new Map();
            if (listIdSet.size) {
                try {
                    const { data } = await client.from('user_lists').select('id, name').in('id', Array.from(listIdSet));
                    if (Array.isArray(data)) {
                        data.forEach(l => { if (l && l.id) customListNames.set(String(l.id), l.name); });
                    }
                } catch (_te) {}
            }

            const mappedItems = items.map(row => {
                const mediaType = String(row.media_type || '').toLowerCase();
                const listId = String(row.list_id || '').trim();
                const listTitle = customListNames.get(listId)
                    || (row.metadata && row.metadata.list_title) || '';
                return {
                    ...row,
                    user_id: row.actor_id,
                    event_type: row.event_type,
                    title: (row.metadata && row.metadata.item_title) || '',
                    list_name: listTitle,
                    username: usersMap.get(String(row.actor_id)) || 'member',
                    image_url: (row.metadata && row.metadata.image_url) || ''
                };
            });

            const missingIds = mappedItems.filter(it => {
                const id = String(it.item_id || '').trim();
                const hasTitle = isValidTitle(it.title, it.media_type);
                const hasImage = !!(it.image_url);
                return id && (!hasTitle || !hasImage);
            });

            if (missingIds.length && client) {
                const itemIds = [...new Set(missingIds.map(it => String(it.item_id || '')).filter(Boolean))];
                if (itemIds.length) {
                    try {
                        const { data: listItems } = await client
                            .from('list_items')
                            .select('item_id, title, image_url')
                            .in('item_id', itemIds);
                        if (Array.isArray(listItems)) {
                            const lookup = new Map(listItems.map(li => [String(li.item_id), li]));
                            mappedItems.forEach(it => {
                                const id = String(it.item_id || '').trim();
                                if (!id) return;
                                const cached = lookup.get(id);
                                if (!cached) return;
                                if (!isValidTitle(it.title, it.media_type) && cached.title) {
                                    it.title = cached.title;
                                }
                                if (!it.image_url && cached.image_url) {
                                    it.image_url = cached.image_url;
                                }
                            });
                        }
                    } catch (_le) {}
                }
            }

            return mappedItems;
        } catch (_e) {
            return null;
        }
    }

    async function loadFromRawTables(client, filterSet) {
        const [listItems, reviews, createdLists] = await Promise.all([
            safeTableQuery(client, 'list_items', '*', 35),
            safeTableQuery(client, 'reviews', '*', 35),
            safeTableQuery(client, 'user_lists', '*', 20)
        ]);

        if (!listItems.length && !reviews.length && !createdLists.length) return [];

        const filteredBySet = (userId) => {
            if (filterSet === null) return true;
            if (!filterSet.size) return false;
            return filterSet.has(String(userId || ''));
        };

        const listIds = [...new Set(listItems.map(i => i.list_id).filter(Boolean))];
        const customListNames = new Map();
        if (listIds.length) {
            try {
                const { data: listsData } = await client.from('user_lists').select('id, name').in('id', listIds);
                if (Array.isArray(listsData)) {
                    listsData.forEach(l => { if (l && l.id) customListNames.set(l.id, l.name); });
                }
            } catch (_le) {}
        }

        const userIds = [...new Set([
            ...listItems.map(i => i.user_id),
            ...reviews.map(r => r.user_id),
            ...createdLists.map(l => l.user_id)
        ].filter(Boolean))];

        const usersMap = await fetchUserNames(client, userIds);

        const activityItems = [];

        listItems.forEach(item => {
            if (!filteredBySet(item.user_id)) return;
            activityItems.push({
                ...item,
                event_type: 'list_add',
                list_name: customListNames.get(item.list_id) || item.list_name || '',
                username: usersMap.get(item.user_id) || 'member',
                created_at: item.created_at || item.inserted_at || item.updated_at
            });
        });

        reviews.forEach(review => {
            if (!filteredBySet(review.user_id)) return;
            activityItems.push({
                ...review,
                event_type: 'review_add',
                username: usersMap.get(review.user_id) || 'member',
                created_at: review.created_at || review.inserted_at
            });
        });

        createdLists.forEach(list => {
            if (!filteredBySet(list.user_id)) return;
            activityItems.push({
                ...list,
                event_type: 'list_create',
                list_name: list.name || list.title || 'a custom list',
                username: usersMap.get(list.user_id) || 'member',
                created_at: list.created_at || list.inserted_at
            });
        });

        return activityItems;
    }

    async function fetchUserNames(client, userIds) {
        const map = new Map();
        if (!userIds.length || !client) return map;
        try {
            const { data: profiles } = await client
                .from('user_profiles')
                .select('id, username, full_name')
                .in('id', userIds);
            if (Array.isArray(profiles)) {
                profiles.forEach(p => {
                    if (p && p.id) map.set(p.id, p.username || p.full_name || 'member');
                });
            }
        } catch (_pe) {}
        return map;
    }

    function renderEmptyActivityState(container) {
        const emptyForFilter = activityFilter === 'following'
            ? { title: 'no activity from people you follow.', desc: 'follow some members to see their updates here.' }
            : activityFilter === 'followers'
            ? { title: 'no activity from your followers.', desc: 'when members follow you and start saving, their activity appears here.' }
            : { title: 'no activity yet.', desc: 'when members add media to their lists, it will show up here.' };

        container.innerHTML = `
            <div class="community-empty-box">
                <div class="empty-icon"><i class="fas fa-rss"></i></div>
                <div class="empty-title">${emptyForFilter.title}</div>
                <div class="empty-desc">${emptyForFilter.desc}</div>
                <a href="index.html" class="btn-empty-action"><i class="fas fa-plus"></i> explore media</a>
            </div>
        `;
    }

    // === REVIEWS QUERY ENGINE (written reviews only) ===
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
            const reviews = await safeTableQuery(client, 'reviews', '*', 35);

            if (!Array.isArray(reviews) || !reviews.length) {
                renderEmptyReviewsState(container);
                return;
            }

            const writtenOnly = reviews.filter(r => {
                const body = (r.body || r.review_text || r.content || r.comment || '').trim();
                return body.length > 0;
            });

            if (!writtenOnly.length) {
                renderEmptyReviewsState(container);
                return;
            }

            const userIds = [...new Set(writtenOnly.map(r => r.user_id).filter(Boolean))];
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

            const enrichedReviews = writtenOnly.slice(0, 20).map(r => ({
                ...r,
                username: usersMap.get(r.user_id) || r.user_name || r.username || 'member'
            }));

            // Hydrate titles and posters across all media types
            await hydrateMediaMetadata(enrichedReviews);

            container.innerHTML = enrichedReviews.map(r => ReviewCard.render(r)).join('');
            await loadActivityInteractions();
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
                let req = client.from('user_profiles').select('id, username, full_name').not('username', 'is', null);
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
                url.searchParams.set('select', 'id,username,full_name');
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

            if (profiles && profiles.length) {
                const seenIds = new Set();
                profiles = profiles.filter(p => {
                    const id = String(p.id || '');
                    if (!id || seenIds.has(id)) return false;
                    seenIds.add(id);
                    return true;
                });
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

            const seen = new Set();
            const unique = profiles.filter(p => {
                const id = String(p.id || '');
                if (!id || seen.has(id)) return false;
                seen.add(id);
                return true;
            });

            container.innerHTML = unique.map(p => UserCard.render(p)).join('');
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
                .select('followed_id')
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

            const ids = follows.map(f => f.followed_id);
            const { data: profiles } = await client
                .from('user_profiles')
                .select('id, username, full_name')
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
            cachedFollowingProfiles = profiles;
            container.innerHTML = profiles.map(p => UserCard.render(p)).join('');
        } catch (_e) {}
    }

    // === FOLLOWERS FEED ENGINE ===
    async function loadFollowersFeed() {
        const container = document.getElementById('followersListFeed');
        if (!container) return;

        const user = await getCurrentUser();
        const client = getSupabaseClient();
        if (!user || !client) {
            container.innerHTML = `
                <div class="community-empty-box">
                    <div class="empty-icon"><i class="fas fa-user-lock"></i></div>
                    <div class="empty-title">sign in to view members following you.</div>
                    <a href="login.html" class="btn-empty-action"><i class="fas fa-sign-in-alt"></i> sign in</a>
                </div>
            `;
            return;
        }

        try {
            const { data: follows, error } = await client
                .from('follows')
                .select('follower_id')
                .eq('followed_id', user.id);

            if (error || !follows || !follows.length) {
                container.innerHTML = `
                    <div class="community-empty-box">
                        <div class="empty-icon"><i class="fas fa-user-friends"></i></div>
                        <div class="empty-title">no followers yet.</div>
                        <div class="empty-desc">when members follow your profile, they will show up here.</div>
                    </div>
                `;
                return;
            }

            const ids = follows.map(f => f.follower_id);
            const { data: profiles } = await client
                .from('user_profiles')
                .select('id, username, full_name')
                .in('id', ids);

            if (!profiles || !profiles.length) {
                container.innerHTML = `
                    <div class="community-empty-box">
                        <div class="empty-icon"><i class="fas fa-user-friends"></i></div>
                        <div class="empty-title">no followers yet.</div>
                    </div>
                `;
                return;
            }

            cachedFollowersProfiles = profiles;
            container.innerHTML = profiles.map(p => UserCard.render(p)).join('');
        } catch (_e) {
            container.innerHTML = `
                <div class="community-empty-box">
                    <div class="empty-icon"><i class="fas fa-user-friends"></i></div>
                    <div class="empty-title">no followers yet.</div>
                </div>
            `;
        }
    }

    // === INTERACTIVE FOLLOW / UNFOLLOW TOGGLE ===
    async function toggleFollow(targetUserId, buttonEl) {
        const user = await getCurrentUser();
        const client = getSupabaseClient();
        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        if (String(user.id) === String(targetUserId)) {
            return; // Disallow following self
        }

        const isFollowing = followingSet.has(targetUserId);

        try {
            if (isFollowing) {
                followingSet.delete(targetUserId);
                updateFollowButton(buttonEl, false);
                await client.from('follows').delete().eq('follower_id', user.id).eq('followed_id', targetUserId);
            } else {
                followingSet.add(targetUserId);
                updateFollowButton(buttonEl, true);
                await client.from('follows').insert({ follower_id: user.id, followed_id: targetUserId });
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

    // === CLIENT-SIDE PEOPLE SEARCH ===
    function searchPeople(query) {
        const container = document.getElementById('peopleListFeed');
        if (!container) return;
        const cleanQ = String(query || '').trim().replace(/^@+/, '').toLowerCase();
        if (!cleanQ) {
            loadPeopleFeed();
            return;
        }
        loadPeopleFeed(cleanQ);
    }

    function searchFollowing(query) {
        const container = document.getElementById('followingListFeed');
        if (!container) return;
        const cleanQ = String(query || '').trim().replace(/^@+/, '').toLowerCase();
        if (!cleanQ) {
            container.innerHTML = cachedFollowingProfiles.length
                ? cachedFollowingProfiles.map(p => UserCard.render(p)).join('')
                : '<div class="community-empty-box"><div class="empty-icon"><i class="fas fa-user-check"></i></div><div class="empty-title">you are not following anyone yet.</div></div>';
            return;
        }
        const filtered = cachedFollowingProfiles.filter(p => {
            const username = String(p.username || '').toLowerCase();
            const fullName = String(p.full_name || '').toLowerCase();
            return username.includes(cleanQ) || fullName.includes(cleanQ);
        });
        if (!filtered.length) {
            container.innerHTML = '<div class="community-empty-box"><div class="empty-icon"><i class="fas fa-user-check"></i></div><div class="empty-title">no matches found.</div><div class="empty-desc">try a different search term.</div></div>';
            return;
        }
        container.innerHTML = filtered.map(p => UserCard.render(p)).join('');
    }

    function searchFollowers(query) {
        const container = document.getElementById('followersListFeed');
        if (!container) return;
        const cleanQ = String(query || '').trim().replace(/^@+/, '').toLowerCase();
        if (!cleanQ) {
            container.innerHTML = cachedFollowersProfiles.length
                ? cachedFollowersProfiles.map(p => UserCard.render(p)).join('')
                : '<div class="community-empty-box"><div class="empty-icon"><i class="fas fa-user-friends"></i></div><div class="empty-title">no followers yet.</div></div>';
            return;
        }
        const filtered = cachedFollowersProfiles.filter(p => {
            const username = String(p.username || '').toLowerCase();
            const fullName = String(p.full_name || '').toLowerCase();
            return username.includes(cleanQ) || fullName.includes(cleanQ);
        });
        if (!filtered.length) {
            container.innerHTML = '<div class="community-empty-box"><div class="empty-icon"><i class="fas fa-user-friends"></i></div><div class="empty-title">no matches found.</div><div class="empty-desc">try a different search term.</div></div>';
            return;
        }
        container.innerHTML = filtered.map(p => UserCard.render(p)).join('');
    }

    // === ACTIVITY INTERACTIONS (LIKE / DISLIKE / REPLY TO REVIEW + REPLY TO REPLY) ===
    async function loadActivityInteractions() {
        const client = getSupabaseClient();
        const user = await getCurrentUser();
        if (!client) return;

        const feedIds = [];
        document.querySelectorAll('[data-feed-id]').forEach(function(el) {
            const id = el.getAttribute('data-feed-id');
            if (id && !feedIds.includes(id)) feedIds.push(id);
        });
        if (!feedIds.length) return;

        try {
            const [reactResult, replyResult] = await Promise.all([
                client.from('review_reactions').select('id, review_id, target_type, target_id, user_id, reaction_type').in('review_id', feedIds),
                client.from('review_replies').select('id, review_id, user_id, body, created_at, parent_reply_id').in('review_id', feedIds).order('created_at', { ascending: true })
            ]);

            const reactions = Array.isArray(reactResult?.data) ? reactResult.data : [];
            const replies = Array.isArray(replyResult?.data) ? replyResult.data : [];

            const userIDs = [...new Set([
                ...reactions.map(r => r.user_id).filter(Boolean),
                ...replies.map(r => r.user_id).filter(Boolean)
            ])];
            const userMap = await fetchUserNames(client, userIDs);

            feedIds.forEach(function(feedId) {
                const cardReactions = reactions.filter(r => String(r.review_id) === String(feedId) && String(r.target_type || 'review') === 'review');
                const likeCount = cardReactions.filter(r => r.reaction_type === 'like').length;
                const dislikeCount = cardReactions.filter(r => r.reaction_type === 'dislike').length;
                const myReaction = user ? (cardReactions.find(r => String(r.user_id) === String(user.id))?.reaction_type || '') : '';

                const likeBtn = document.querySelector('[data-action="like"][data-feed-id="' + feedId + '"]');
                const dislikeBtn = document.querySelector('[data-action="dislike"][data-feed-id="' + feedId + '"]');
                const likeCountEl = document.querySelector('[data-feed-id="' + feedId + '"] [data-like-count]');
                const dislikeCountEl = document.querySelector('[data-feed-id="' + feedId + '"] [data-dislike-count]');

                if (likeCountEl) likeCountEl.textContent = likeCount || '';
                if (dislikeCountEl) dislikeCountEl.textContent = dislikeCount || '';
                if (likeBtn) likeBtn.classList.toggle('active-like', myReaction === 'like');
                if (dislikeBtn) dislikeBtn.classList.toggle('active-dislike', myReaction === 'dislike');

                const cardReplies = replies.filter(r => String(r.review_id) === String(feedId));
                const topLevel = cardReplies.filter(r => !r.parent_reply_id);
                const replyCountEl = document.querySelector('[data-feed-id="' + feedId + '"] [data-reply-count]');
                if (replyCountEl) replyCountEl.textContent = cardReplies.length || '';

                const replyList = document.querySelector('[data-reply-list="' + feedId + '"]');
                if (replyList) {
                    replyList.innerHTML = topLevel.map(function(reply) {
                        return renderReplyItem(reply, feedId, cardReplies, reactions, userMap, user, 0);
                    }).join('');
                }
            });
        } catch (_e) {}
    }

    function renderReplyItem(reply, feedId, allReplies, allReactions, userMap, user, depth) {
        const username = userMap.get(String(reply.user_id)) || 'member';
        const isSelf = user && String(user.id) === String(reply.user_id);
        const replyReactions = allReactions.filter(r => String(r.target_type || '') === 'reply' && String(r.target_id || '') === String(reply.id || ''));
        const replyLikeCount = replyReactions.filter(r => r.reaction_type === 'like').length;
        const replyDislikeCount = replyReactions.filter(r => r.reaction_type === 'dislike').length;
        const myReplyReaction = user ? (replyReactions.find(r => String(r.user_id) === String(user.id))?.reaction_type || '') : '';
        const children = allReplies.filter(r => String(r.parent_reply_id || '') === String(reply.id || ''));
        const depthClass = depth > 0 ? ' is-depth-' + Math.min(depth, 5) : '';

        let html = '<div class="activity-reply-item' + depthClass + '" data-reply-id="' + escapeHtml(reply.id) + '">'
            + '<div class="activity-reply-head">'
            + '<a href="profile.html?id=' + encodeURIComponent(reply.user_id) + '" class="activity-reply-user" onclick="event.stopPropagation()">@' + escapeHtml(username) + '</a>'
            + '<span class="activity-reply-date">' + escapeHtml(timeAgo(reply.created_at)) + '</span>'
            + '</div>'
            + '<div class="activity-reply-body">' + escapeHtml(reply.body) + '</div>'
            + '<div class="activity-reply-actions">'
            + '<button class="activity-reply-action-btn' + (myReplyReaction === 'like' ? ' active-like' : '') + '" onclick="event.stopPropagation(); CommunityManager.toggleReplyReaction(\'' + escapeHtml(reply.id) + '\', \'like\', \'' + escapeHtml(feedId) + '\', this)"><i class="fas fa-thumbs-up"></i>' + (replyLikeCount ? ' ' + replyLikeCount : '') + '</button>'
            + '<button class="activity-reply-action-btn' + (myReplyReaction === 'dislike' ? ' active-dislike' : '') + '" onclick="event.stopPropagation(); CommunityManager.toggleReplyReaction(\'' + escapeHtml(reply.id) + '\', \'dislike\', \'' + escapeHtml(feedId) + '\', this)"><i class="fas fa-thumbs-down"></i>' + (replyDislikeCount ? ' ' + replyDislikeCount : '') + '</button>'
            + '<button class="activity-reply-action-btn" onclick="event.stopPropagation(); CommunityManager.openNestedReply(\'' + escapeHtml(reply.id) + '\', \'' + escapeHtml(feedId) + '\', \'' + escapeHtml(username) + '\')"><i class="fas fa-reply"></i> reply</button>'
            + (isSelf ? '<button class="activity-reply-action-btn activity-reply-delete" onclick="event.stopPropagation(); CommunityManager.deleteActivityReply(\'' + escapeHtml(reply.id) + '\', \'' + escapeHtml(feedId) + '\')"><i class="fas fa-trash"></i></button>' : '')
            + '</div>'
            + '<div class="nested-reply-form" data-nested-form="' + escapeHtml(reply.id) + '">'
            + '<div class="activity-reply-input-row">'
            + '<textarea class="activity-reply-input" data-nested-input="' + escapeHtml(reply.id) + '" placeholder="reply to @' + escapeHtml(username) + '..." maxlength="500" rows="1" onclick="event.stopPropagation()"></textarea>'
            + '<button class="activity-reply-submit" onclick="event.stopPropagation(); CommunityManager.submitNestedReply(\'' + escapeHtml(feedId) + '\', \'' + escapeHtml(reply.id) + '\', this)">post</button>'
            + '</div>'
            + '</div>'
            + '</div>';

        if (children.length) {
            html += '<div class="activity-reply-children">';
            children.forEach(function(child) {
                html += renderReplyItem(child, feedId, allReplies, allReactions, userMap, user, depth + 1);
            });
            html += '</div>';
        }

        return html;
    }

    async function toggleActivityReaction(feedId, reactionType, btnEl) {
        const user = await getCurrentUser();
        const client = getSupabaseClient();
        if (!user) { window.location.href = 'login.html'; return; }
        if (!client || !feedId) return;

        const countEl = btnEl.querySelector('.activity-interact-count');
        const wasActive = btnEl.classList.contains('active-like') || btnEl.classList.contains('active-dislike');
        const isActiveType = reactionType === 'like' ? btnEl.classList.contains('active-like') : btnEl.classList.contains('active-dislike');
        const isToggleOff = isActiveType;

        const otherType = reactionType === 'like' ? 'dislike' : 'like';
        const otherBtn = document.querySelector('[data-action="' + otherType + '"][data-feed-id="' + feedId + '"]');
        const otherCountEl = otherBtn ? otherBtn.querySelector('.activity-interact-count') : null;

        if (isToggleOff) {
            btnEl.classList.remove('active-like', 'active-dislike');
            if (countEl) countEl.textContent = '';
        } else {
            btnEl.classList.add(reactionType === 'like' ? 'active-like' : 'active-dislike');
            if (countEl) countEl.textContent = '1';
            if (otherBtn && otherBtn.classList.contains('active-' + otherType)) {
                otherBtn.classList.remove('active-like', 'active-dislike');
                if (otherCountEl) otherCountEl.textContent = '';
            }
        }

        try {
            const { data: existing } = await client
                .from('review_reactions')
                .select('id, reaction_type')
                .eq('review_id', feedId)
                .eq('user_id', user.id)
                .maybeSingle();

            if (existing && existing.reaction_type === reactionType) {
                await client.from('review_reactions').delete().eq('id', existing.id);
            } else if (existing) {
                await client.from('review_reactions').update({ reaction_type: reactionType }).eq('id', existing.id);
            } else {
                await client.from('review_reactions').insert({
                    review_source: 'activity',
                    review_id: feedId,
                    target_type: 'review',
                    target_id: feedId,
                    user_id: user.id,
                    reaction_type: reactionType
                });
            }
            await loadActivityInteractions();
        } catch (_e) {
            await loadActivityInteractions();
        }
    }

    async function toggleReplyReaction(replyId, reactionType, feedId, btnEl) {
        const user = await getCurrentUser();
        const client = getSupabaseClient();
        if (!user) { window.location.href = 'login.html'; return; }
        if (!client || !replyId) return;

        const wasActive = btnEl.classList.contains('active-like') || btnEl.classList.contains('active-dislike');
        const isActiveType = reactionType === 'like' ? btnEl.classList.contains('active-like') : btnEl.classList.contains('active-dislike');
        const isToggleOff = isActiveType;

        if (isToggleOff) {
            btnEl.classList.remove('active-like', 'active-dislike');
        } else {
            btnEl.classList.add(reactionType === 'like' ? 'active-like' : 'active-dislike');
            const otherType = reactionType === 'like' ? 'dislike' : 'like';
            const sibling = btnEl.parentElement.querySelector('[onclick*="toggleReplyReaction"][onclick*="' + otherType + '"]');
            if (sibling) sibling.classList.remove('active-like', 'active-dislike');
        }

        try {
            const { data: existing } = await client
                .from('review_reactions')
                .select('id, reaction_type')
                .eq('target_type', 'reply')
                .eq('target_id', replyId)
                .eq('user_id', user.id)
                .maybeSingle();

            if (existing && existing.reaction_type === reactionType) {
                await client.from('review_reactions').delete().eq('id', existing.id);
            } else if (existing) {
                await client.from('review_reactions').update({ reaction_type: reactionType }).eq('id', existing.id);
            } else {
                await client.from('review_reactions').insert({
                    review_source: 'activity',
                    review_id: feedId,
                    target_type: 'reply',
                    target_id: replyId,
                    user_id: user.id,
                    reaction_type: reactionType
                });
            }
            await loadActivityInteractions();
        } catch (_e) {
            await loadActivityInteractions();
        }
    }

    function toggleReplyThread(feedId) {
        const thread = document.querySelector('[data-reply-thread="' + feedId + '"]');
        if (!thread) return;
        thread.classList.toggle('open');
        if (thread.classList.contains('open')) {
            const input = thread.querySelector('[data-reply-input]');
            if (input) input.focus();
        }
    }

    function openNestedReply(replyId, feedId, username) {
        const form = document.querySelector('[data-nested-form="' + replyId + '"]');
        if (!form) return;
        const isOpen = form.classList.contains('open');
        document.querySelectorAll('.nested-reply-form.open').forEach(function(f) { f.classList.remove('open'); });
        if (!isOpen) {
            form.classList.add('open');
            const input = form.querySelector('[data-nested-input]');
            if (input) input.focus();
        }
    }

    async function submitActivityReply(feedId, btnEl) {
        const user = await getCurrentUser();
        const client = getSupabaseClient();
        if (!user) { window.location.href = 'login.html'; return; }
        if (!client || !feedId) return;

        const input = document.querySelector('[data-reply-input="' + feedId + '"]');
        const body = String(input?.value || '').trim();
        if (!body) return;

        if (input) input.value = '';
        try {
            await client.from('review_replies').insert({
                review_source: 'activity',
                review_id: feedId,
                user_id: user.id,
                body: body
            });
            await loadActivityInteractions();
        } catch (_e) {}
    }

    async function submitNestedReply(feedId, parentReplyId, btnEl) {
        const user = await getCurrentUser();
        const client = getSupabaseClient();
        if (!user) { window.location.href = 'login.html'; return; }
        if (!client || !feedId || !parentReplyId) return;

        const input = document.querySelector('[data-nested-input="' + parentReplyId + '"]');
        const body = String(input?.value || '').trim();
        if (!body) return;

        if (input) input.value = '';
        const form = document.querySelector('[data-nested-form="' + parentReplyId + '"]');
        if (form) form.classList.remove('open');
        try {
            await client.from('review_replies').insert({
                review_source: 'activity',
                review_id: feedId,
                parent_reply_id: parentReplyId,
                user_id: user.id,
                body: body
            });
            await loadActivityInteractions();
        } catch (_e) {}
    }

    async function deleteActivityReply(replyId, feedId) {
        const user = await getCurrentUser();
        const client = getSupabaseClient();
        if (!user || !client) return;
        if (!confirm('delete this reply?')) return;

        try {
            await client.from('review_replies').delete().eq('id', replyId).eq('user_id', user.id);
            await loadActivityInteractions();
        } catch (_e) {}
    }

    // === COMMUNITY LISTS RAIL ENGINE ===
    var listsMode = 'media';
    var listsFilter = 'all';
    var listsFeedCache = [];

    var CML_MEDIA_TYPES = {
        movie: true, tv: true, anime: true, game: true, book: true, music: true,
        sports: true, travel: true, fashion: true, food: true, car: true
    };
    var CML_MEDIA_TYPES_LIFESTYLE = { sports: true, travel: true, fashion: true, food: true, car: true };
    var CML_MEDIA_LABELS = {
        movie: 'movies', tv: 'tv shows', anime: 'anime', game: 'games',
        book: 'books', music: 'music', sports: 'sports', travel: 'travel',
        fashion: 'fashion', food: 'food', car: 'cars'
    };
    var CML_SQUARE_TYPES = { music: true, sports: true, fashion: true, food: true };
    var CML_LANDSCAPE_TYPES = { travel: true, car: true };
    var CML_BRAND_TYPES = { sports: true, fashion: true, food: true, car: true };

    function shuffleArray(arr) {
        for (var i = arr.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
        }
        return arr;
    }

    function setListsMode(mode) {
        listsMode = mode || 'media';
        var mediaPanel = document.getElementById('cmlMediaPanel');
        var lifestylePanel = document.getElementById('cmlLifestylePanel');
        var mediaBtn = document.getElementById('cmlModeMedia');
        var lifestyleBtn = document.getElementById('cmlModeLifestyle');
        var indicator = document.getElementById('cmlModeIndicator');
        if (!mediaPanel || !lifestylePanel) return;
        if (mode === 'media') {
            mediaPanel.style.display = '';
            lifestylePanel.style.display = 'none';
            mediaBtn.classList.add('active');
            lifestyleBtn.classList.remove('active');
            mediaBtn.setAttribute('aria-selected', 'true');
            lifestyleBtn.setAttribute('aria-selected', 'false');
            if (indicator) {
                indicator.style.width = mediaBtn.offsetWidth + 'px';
                indicator.style.transform = 'translateX(0)';
            }
        } else {
            mediaPanel.style.display = 'none';
            lifestylePanel.style.display = '';
            lifestyleBtn.classList.add('active');
            mediaBtn.classList.remove('active');
            lifestyleBtn.setAttribute('aria-selected', 'true');
            mediaBtn.setAttribute('aria-selected', 'false');
            if (indicator) {
                indicator.style.width = lifestyleBtn.offsetWidth + 'px';
                indicator.style.transform = 'translateX(' + (mediaBtn.offsetWidth + 2) + 'px)';
            }
        }
        updateFilterDropdownForMode();
    }

    function updateFilterDropdownForMode() {
        var mediaTypes = ['all', 'movie', 'tv', 'anime', 'game', 'book', 'music'];
        var lifestyleTypes = ['all', 'sports', 'travel', 'food', 'fashion', 'car'];
        var activeTypes = listsMode === 'media' ? mediaTypes : lifestyleTypes;
        document.querySelectorAll('.cml-filter-opt').forEach(function(opt) {
            var filter = opt.getAttribute('data-cml-filter');
            opt.style.display = activeTypes.includes(filter) ? '' : 'none';
        });
        if (!activeTypes.includes(listsFilter)) {
            setListsFilter('all');
        }
    }

    function initListsModeIndicator() {
        var mediaBtn = document.getElementById('cmlModeMedia');
        var indicator = document.getElementById('cmlModeIndicator');
        if (!mediaBtn || !indicator) return;
        indicator.style.width = mediaBtn.offsetWidth + 'px';
        indicator.style.transform = 'translateX(0)';
    }

    function toggleFilterDropdown() {
        var dd = document.getElementById('cmlFilterDropdown');
        var btn = document.getElementById('cmlFilterBtn');
        if (!dd || !btn) return;
        var isOpen = dd.classList.contains('is-open');
        dd.classList.toggle('is-open', !isOpen);
        btn.classList.toggle('is-active', !isOpen);
    }

    function closeFilterDropdown() {
        var dd = document.getElementById('cmlFilterDropdown');
        var btn = document.getElementById('cmlFilterBtn');
        if (dd) dd.classList.remove('is-open');
        if (btn) btn.classList.remove('is-active');
    }

    function setListsFilter(filter) {
        listsFilter = filter || 'all';
        document.querySelectorAll('.cml-filter-opt').forEach(function(opt) {
            opt.classList.toggle('active', opt.getAttribute('data-cml-filter') === listsFilter);
        });
        renderListsRails();
        closeFilterDropdown();
    }

    function buildRailPosterCard(imageUrl, profileUrl, mediaType) {
        var cls = 'cml-poster';
        if (mediaType === 'music' || mediaType === 'sports' || mediaType === 'fashion' || mediaType === 'food') cls += ' is-square';
        if (mediaType === 'travel' || mediaType === 'car') cls += ' is-landscape';
        if (mediaType === 'sports' || mediaType === 'fashion' || mediaType === 'food' || mediaType === 'car') cls += ' is-brand';
        var src = imageUrl || '/newlogo.webp';
        return '<div class="' + cls + '" onclick="window.location.href=\'' + escapeHtml(profileUrl) + '\'">'
            + '<div class="cml-poster-img-wrap">'
            + '<img class="cml-poster-img" src="' + escapeHtml(src) + '" alt="" loading="lazy" onerror="this.src=\'/newlogo.webp\'" />'
            + '</div>'
            + '</div>';
    }

    var CML_RAIL_ICONS = {
        movie: 'fa-film', tv: 'fa-tv', anime: 'fa-dragon', game: 'fa-gamepad',
        book: 'fa-book', music: 'fa-music', sports: 'fa-futbol',
        travel: 'fa-earth-americas', fashion: 'fa-shirt', food: 'fa-burger', car: 'fa-car'
    };
    var CML_DEFAULT_LIST_ICONS = {
        favorites: 'fa-heart', watched: 'fa-eye', watchlist: 'fa-bookmark',
        read: 'fa-book', readlist: 'fa-book-open', playing: 'fa-gamepad',
        listening: 'fa-headphones', owned: 'fa-star'
    };

    function renderListsRails() {
        var mediaPanel = document.getElementById('cmlMediaPanel');
        var lifestylePanel = document.getElementById('cmlLifestylePanel');
        if (!mediaPanel || !lifestylePanel) return;

        var rails = listsFeedCache || [];

        if (listsFilter !== 'all') {
            rails = rails.filter(function(r) { return r.media_type === listsFilter; });
        }

        var mediaRails = [];
        var lifestyleRails = [];
        rails.forEach(function(rail) {
            if (CML_MEDIA_TYPES_LIFESTYLE[rail.media_type]) {
                lifestyleRails.push(rail);
            } else {
                mediaRails.push(rail);
            }
        });

        mediaPanel.innerHTML = mediaRails.length ? mediaRails.map(function(rail) {
            var profileUrl = rail.user_id ? 'profile.html?id=' + encodeURIComponent(rail.user_id) : '#';
            var mediaIcon = CML_RAIL_ICONS[rail.media_type] || 'fa-layer-group';
            var listIcon = rail.list_name === 'favorites' ? (CML_DEFAULT_LIST_ICONS.favorites || 'fa-heart') : '';
            var headerIcon = listIcon || mediaIcon;
            var isCustom = rail.list_name !== 'favorites' && rail.list_name !== 'collection';
            var customBadge = isCustom ? ' <span class="cml-custom-badge">custom list</span>' : '';
            var cardsHtml = rail.items.map(function(item) {
                return buildRailPosterCard(item.image_url, profileUrl, rail.media_type);
            }).join('');
            return '<div class="cml-rail" data-cml-rail-media="' + escapeHtml(rail.media_type) + '">'
                + '<div class="cml-rail-header">'
                + '<div class="cml-rail-title"><i class="fas ' + headerIcon + ' cml-rail-icon"></i><a href="' + escapeHtml(profileUrl) + '" class="cml-rail-user-link" onclick="event.stopPropagation()">@' + escapeHtml(rail.username) + '</a> ' + escapeHtml(rail.media_label) + ' . ' + escapeHtml(rail.list_name) + customBadge + '</div>'
                + '</div>'
                + '<div class="cml-rail-track">' + cardsHtml + '</div>'
                + '</div>';
        }).join('') : '<div class="cml-rail-empty"><i class="fas fa-film"></i><span class="cml-rail-empty-text">nothing here yet</span></div>';

        lifestylePanel.innerHTML = lifestyleRails.length ? lifestyleRails.map(function(rail) {
            var profileUrl = rail.user_id ? 'profile.html?id=' + encodeURIComponent(rail.user_id) : '#';
            var mediaIcon = CML_RAIL_ICONS[rail.media_type] || 'fa-layer-group';
            var isCustom = rail.list_name !== 'favorites' && rail.list_name !== 'collection';
            var customBadge = isCustom ? ' <span class="cml-custom-badge">custom list</span>' : '';
            var cardsHtml = rail.items.map(function(item) {
                return buildRailPosterCard(item.image_url, profileUrl, rail.media_type);
            }).join('');
            return '<div class="cml-rail" data-cml-rail-media="' + escapeHtml(rail.media_type) + '">'
                + '<div class="cml-rail-header">'
                + '<div class="cml-rail-title"><i class="fas ' + mediaIcon + ' cml-rail-icon"></i><a href="' + escapeHtml(profileUrl) + '" class="cml-rail-user-link" onclick="event.stopPropagation()">@' + escapeHtml(rail.username) + '</a> ' + escapeHtml(rail.media_label) + ' . ' + escapeHtml(rail.list_name) + customBadge + '</div>'
                + '</div>'
                + '<div class="cml-rail-track">' + cardsHtml + '</div>'
                + '</div>';
        }).join('') : '<div class="cml-rail-empty"><i class="fas fa-futbol"></i><span class="cml-rail-empty-text">nothing here yet</span></div>';
    }

    async function hydrateRailPosters(rails) {
        var TMDB_POSTER = 'https://image.tmdb.org/t/p/w500';
        var TMDB_PROXY = '/api/tmdb';
        var client = getSupabaseClient();
        if (!client) return;

        var toHydrate = { movie: [], tv: [], anime: [], game: [], book: [], music: [], fashion: [], food: [], car: [], sports: [], travel: [] };
        rails.forEach(function(rail) {
            rail.items.forEach(function(item) {
                if (!item.image_url && item.item_id) {
                    var mt = item.media_type || rail.media_type;
                    if (toHydrate[mt]) toHydrate[mt].push(item);
                }
            });
        });

        var hydrateTMDB = async function(mediaType, endpoint) {
            var items = toHydrate[mediaType];
            if (!items.length) return;
            var uniqueIds = [];
            var idSet = {};
            items.forEach(function(item) {
                if (!idSet[item.item_id]) { idSet[item.item_id] = true; uniqueIds.push(item.item_id); }
            });
            var results = await Promise.all(uniqueIds.map(async function(id) {
                try {
                    var res = await fetch(TMDB_PROXY + '/' + endpoint + '/' + id + '?language=en');
                    if (!res.ok) return { id: id, poster: null };
                    var data = await res.json();
                    return { id: id, poster: data.poster_path ? TMDB_POSTER + data.poster_path : null };
                } catch (_e) { return { id: id, poster: null }; }
            }));
            var map = {};
            results.forEach(function(r) { map[r.id] = r.poster; });
            items.forEach(function(item) { item.image_url = map[item.item_id] || ''; });
        };

        var hydrateBrandTable = async function(mediaType, table) {
            var items = toHydrate[mediaType];
            if (!items.length) return;
            var uniqueIds = [];
            var idSet = {};
            items.forEach(function(item) {
                if (!idSet[item.item_id]) { idSet[item.item_id] = true; uniqueIds.push(item.item_id); }
            });
            try {
                var result = await client.from(table).select('id, logo_url, name, domain').in('id', uniqueIds);
                var map = {};
                (result.data || []).forEach(function(row) {
                    var url = row.logo_url || '';
                    if (url && !url.startsWith('http')) {
                        var supabaseUrl = getSupabaseConfig().url || '';
                        url = supabaseUrl + '/storage/v1/object/public/brand-logos/' + url;
                    }
                    map[row.id] = url || '';
                });
                items.forEach(function(item) { item.image_url = map[item.item_id] || ''; });
            } catch (_e) {}
        };

        var hydrateTravelFlags = function() {
            var items = toHydrate.travel;
            if (!items.length) return;
            items.forEach(function(item) {
                var code = String(item.item_id || '').toUpperCase().trim();
                if (code && code.length === 2) {
                    item.image_url = 'https://flagcdn.com/w160/' + code.toLowerCase() + '.png';
                }
            });
        };

        var hydrateGameCovers = async function() {
            var items = toHydrate.game;
            if (!items.length) return;
            var uniqueIds = [];
            var idSet = {};
            items.forEach(function(item) {
                if (!idSet[item.item_id]) { idSet[item.item_id] = true; uniqueIds.push(item.item_id); }
            });
            try {
                var result = await client.from('games').select('id, cover_url, hero_url').in('id', uniqueIds);
                var map = {};
                (result.data || []).forEach(function(row) {
                    map[row.id] = row.cover_url || row.hero_url || '';
                });
                items.forEach(function(item) { item.image_url = map[item.item_id] || ''; });
            } catch (_e) {}
        };

        var hydrateBookCovers = async function() {
            var items = toHydrate.book;
            if (!items.length) return;
            var uniqueIds = [];
            var idSet = {};
            items.forEach(function(item) {
                if (!idSet[item.item_id]) { idSet[item.item_id] = true; uniqueIds.push(item.item_id); }
            });
            try {
                var result = await client.from('books').select('id, thumbnail, cover_url').in('id', uniqueIds);
                var map = {};
                (result.data || []).forEach(function(row) {
                    map[row.id] = row.thumbnail || row.cover_url || '';
                });
                items.forEach(function(item) { item.image_url = map[item.item_id] || ''; });
            } catch (_e) {}
        };

        var hydrateMusicCovers = async function() {
            var items = toHydrate.music;
            if (!items.length) return;
            var uniqueIds = [];
            var idSet = {};
            items.forEach(function(item) {
                if (!idSet[item.item_id]) { idSet[item.item_id] = true; uniqueIds.push(item.item_id); }
            });
            try {
                var result = await client.from('tracks').select('id, image_url').in('id', uniqueIds);
                var map = {};
                (result.data || []).forEach(function(row) {
                    map[row.id] = row.image_url || '';
                });
                items.forEach(function(item) { item.image_url = map[item.item_id] || ''; });
            } catch (_e) {}
        };

        var hydrateSportsTeams = async function() {
            var items = toHydrate.sports;
            if (!items.length) return;
            var uniqueIds = [];
            var idSet = {};
            items.forEach(function(item) {
                if (!idSet[item.item_id]) { idSet[item.item_id] = true; uniqueIds.push(item.item_id); }
            });
            try {
                var result = await client.from('teams').select('id, logo_url').in('id', uniqueIds);
                var map = {};
                (result.data || []).forEach(function(row) { map[row.id] = row.logo_url || ''; });
                items.forEach(function(item) { item.image_url = map[item.item_id] || ''; });
            } catch (_e) {}
        };

        await Promise.all([
            hydrateTMDB('movie', 'movie'),
            hydrateTMDB('tv', 'tv'),
            hydrateTMDB('anime', 'tv'),
            hydrateGameCovers(),
            hydrateBookCovers(),
            hydrateMusicCovers(),
            hydrateBrandTable('fashion', 'fashion_brands'),
            hydrateBrandTable('food', 'food_brands'),
            hydrateBrandTable('car', 'car_brands'),
            hydrateSportsTeams(),
            Promise.resolve().then(hydrateTravelFlags)
        ]);
    }

    function renderListsSkeleton() {
        var mediaPanel = document.getElementById('cmlMediaPanel');
        var lifestylePanel = document.getElementById('cmlLifestylePanel');
        if (!mediaPanel || !lifestylePanel) return;
        var html = '';
        for (var i = 0; i < 3; i++) {
            html += '<div class="cml-skeleton-rail">'
                + '<div class="cml-skeleton-header"><div class="cml-skeleton-avatar"></div><div class="cml-skeleton-title"></div></div>'
                + '<div class="cml-skeleton-track">'
                + '<div class="cml-skeleton-card"></div><div class="cml-skeleton-card"></div><div class="cml-skeleton-card"></div>'
                + '<div class="cml-skeleton-card"></div><div class="cml-skeleton-card"></div><div class="cml-skeleton-card"></div>'
                + '</div></div>';
        }
        mediaPanel.innerHTML = html;
        lifestylePanel.innerHTML = '';
    }

    async function loadListsFeed() {
        var client = getSupabaseClient();
        if (!client) return;

        renderListsSkeleton();

        try {
            var result = await client
                .from('list_items')
                .select('user_id, list_type, list_id, item_id, title, image_url, media_type, created_at')
                .order('created_at', { ascending: false })
                .limit(1000);

            if (result.error) {
                console.warn('loadListsFeed list_items error:', result.error.message);
                renderListsRails();
                return;
            }

            var rows = Array.isArray(result.data) ? result.data : [];
            if (!rows.length) {
                listsFeedCache = [];
                renderListsRails();
                return;
            }

            var customListIds = [];
            rows.forEach(function(r) {
                if (r.list_id && customListIds.indexOf(String(r.list_id)) === -1) {
                    customListIds.push(String(r.list_id));
                }
            });

            var listNamesMap = {};
            if (customListIds.length) {
                var listTables = ['user_lists'];
                for (var ti = 0; ti < listTables.length; ti++) {
                    try {
                        var lr = await client.from(listTables[ti]).select('id, user_id, media_type, name').in('id', customListIds);
                        if (Array.isArray(lr.data)) {
                            lr.data.forEach(function(l) {
                                listNamesMap[String(l.id)] = { name: l.name || 'collection', user_id: l.user_id, media_type: l.media_type };
                            });
                        }
                    } catch (_lte) {}
                }
            }

            var railGroups = {};
            rows.forEach(function(item) {
                var mt = String(item.media_type || '').toLowerCase();
                if (!mt || !CML_MEDIA_TYPES[mt]) return;
                var hasListId = !!item.list_id;
                var hasListType = !!item.list_type;

                if (hasListId) {
                    var listId = String(item.list_id);
                    var key = 'custom_' + listId;
                    if (!railGroups[key]) {
                        var resolved = listNamesMap[listId] || {};
                        railGroups[key] = {
                            user_id: item.user_id,
                            media_type: mt,
                            media_label: CML_MEDIA_LABELS[mt] || mt,
                            list_name: resolved.name || 'collection',
                            items: []
                        };
                    }
                    var img = String(item.image_url || '').trim() || '';
                    railGroups[key].items.push({ image_url: img, title: item.title || '', item_id: item.item_id || '', media_type: mt });
                } else if (hasListType && item.list_type === 'favorites') {
                    var favKey = 'fav_' + item.user_id + '_' + mt;
                    if (!railGroups[favKey]) {
                        railGroups[favKey] = {
                            user_id: item.user_id,
                            media_type: mt,
                            media_label: CML_MEDIA_LABELS[mt] || mt,
                            list_name: 'favorites',
                            items: []
                        };
                    }
                    var favImg = String(item.image_url || '').trim() || '';
                    railGroups[favKey].items.push({ image_url: favImg, title: item.title || '', item_id: item.item_id || '', media_type: mt });
                }
            });

            var rails = Object.keys(railGroups).map(function(k) { return railGroups[k]; }).filter(function(r) { return r.items.length > 0; });

            await hydrateRailPosters(rails);

            shuffleArray(rails);

            var userIds = [];
            var userIdSet = {};
            rails.forEach(function(r) {
                var uid = String(r.user_id || '');
                if (uid && !userIdSet[uid]) { userIdSet[uid] = true; userIds.push(uid); }
            });

            var userMap = await fetchUserNames(client, userIds);
            rails.forEach(function(r) {
                r.username = userMap.get(String(r.user_id)) || 'member';
            });

            listsFeedCache = rails;
            renderListsRails();
        } catch (e) {
            console.error('loadListsFeed error:', e);
        }
    }

    document.addEventListener('click', function(e) {
        var wrap = e.target.closest('.cml-filter-wrap');
        if (!wrap) closeFilterDropdown();
    });

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
        } else if (tabName === 'followers') {
            loadFollowersFeed();
        } else if (tabName === 'activity') {
            loadActivityFeed();
        } else if (tabName === 'lists') {
            loadListsFeed();
            setTimeout(function() {
                initListsModeIndicator();
                updateFilterDropdownForMode();
            }, 50);
        }
    }

    function itemLink(mediaType, itemId) {
        if (!itemId) return '#';
        const type = (mediaType || 'movie').toLowerCase();
        if (type === 'game') return 'game.html?id=' + encodeURIComponent(itemId);
        if (type === 'tv' || type === 'tvshow') return 'tvshow.html?id=' + encodeURIComponent(itemId);
        if (type === 'anime') return 'anime.html?id=' + encodeURIComponent(itemId);
        if (type === 'book') return 'book.html?id=' + encodeURIComponent(itemId);
        if (type === 'music' || type === 'song' || type === 'album' || type === 'track') return 'song.html?id=' + encodeURIComponent(itemId);
        if (type === 'travel') return 'country.html?country=' + encodeURIComponent(String(itemId).toUpperCase());
        if (type === 'fashion') return 'fashion.html?id=' + encodeURIComponent(itemId);
        if (type === 'food') return 'food.html?id=' + encodeURIComponent(itemId);
        return 'movie.html?id=' + encodeURIComponent(itemId);
    }

    function usernameClean(name) {
        return String(name || '').replace(/^@+/, '').trim();
    }

    function escapeHtml(str) {
        return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function timeAgo(dateStr) {
        if (!dateStr) return '';
        const now = Date.now();
        const then = new Date(dateStr).getTime();
        if (isNaN(then)) return '';
        const diff = Math.floor((now - then) / 1000);
        if (diff < 60) return 'just now';
        if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
        if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
        if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
        return new Date(dateStr).toLocaleDateString();
    }

    // Auto-init on page load
    document.addEventListener('DOMContentLoaded', function() {
        const activeTabBtn = document.querySelector('.community-tab-btn.active');
        const activeTab = activeTabBtn ? activeTabBtn.getAttribute('data-tab') : 'discover';
        if (activeTab === 'activity') {
            loadActivityFeed();
        } else if (activeTab === 'reviews') {
            loadReviewsFeed();
        } else {
            loadReviewsFeed();
        }
        loadFollowingSet();
        loadFollowersSet();
        initListsModeIndicator();
        updateFilterDropdownForMode();
    });

    window.addEventListener('load', function() {
        initListsModeIndicator();
        updateFilterDropdownForMode();
    });

    return {
        switchTab: switchTab,
        loadReviewsFeed: loadReviewsFeed,
        loadActivityFeed: loadActivityFeed,
        loadPeopleFeed: loadPeopleFeed,
        loadFollowingFeed: loadFollowingFeed,
        loadFollowersFeed: loadFollowersFeed,
        toggleFollow: toggleFollow,
        setActivityFilter: setActivityFilter,
        searchPeople: searchPeople,
        searchFollowing: searchFollowing,
        searchFollowers: searchFollowers,
        toggleActivityReaction: toggleActivityReaction,
        toggleReplyReaction: toggleReplyReaction,
        toggleReplyThread: toggleReplyThread,
        openNestedReply: openNestedReply,
        submitActivityReply: submitActivityReply,
        submitNestedReply: submitNestedReply,
        deleteActivityReply: deleteActivityReply,
        loadListsFeed: loadListsFeed,
        setListsMode: setListsMode,
        setListsFilter: setListsFilter,
        toggleFilterDropdown: toggleFilterDropdown
    };
})();
