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
                    const res = await fetch(`https://books.google.com/books/v1/volumes/${encodeURIComponent(rawId)}`);
                    if (res.ok) {
                        const data = await res.json();
                        const info = data.volumeInfo || {};
                        if (info && info.title) {
                            mediaMap.set(rawId, {
                                title: info.title,
                                image_url: info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || existing?.image_url || ''
                            });
                        }
                    }
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
                    const res = await fetch(`/api/restcountries/alpha?codes=${encodeURIComponent(rawId)}&fields=name,flags`);
                    if (res.ok) {
                        const data = await res.json();
                        const country = Array.isArray(data) ? data[0] : data;
                        if (country && (country.name?.common || country.name)) {
                            mediaMap.set(rawId, {
                                title: country.name?.common || country.name,
                                image_url: country.flags?.png || country.flags?.svg || existing?.image_url || ''
                            });
                        }
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

    // === ACTIVITY CARD COMPONENT ===
    const ActivityCard = {
        render: function(item) {
            const userName = (item.username || item.full_name || 'member');
            const userId = item.user_id || '';
            const mediaType = (item.media_type || 'movie').toLowerCase();
            const itemId = item.item_id || '';
            const listType = (item.list_type || '').toLowerCase();
            const listName = item.list_name || '';
            const activityType = (item.activityType || '').toLowerCase();
            const itemTitle = item.title || item.item_title || item.name || 'an item';
            const coverUrl = item.image_url || item.cover_url || item.image || item.thumbnail || '';
            const ts = item.created_at || item.inserted_at || '';

            const targetUrl = itemLink(mediaType, itemId);
            const profileUrl = userId ? `profile.html?id=${encodeURIComponent(userId)}` : '#';

            let verbHtml = '';
            const itemLinkHtml = `<a href="${targetUrl}" class="review-item-link" onclick="event.stopPropagation()">${escapeHtml(itemTitle)}</a>`;

            if (activityType === 'review') {
                verbHtml = `left a review on ${itemLinkHtml}`;
            } else if (activityType === 'create_list') {
                const listTitle = item.list_name || item.name || item.title || 'a custom list';
                verbHtml = `created list <strong>${escapeHtml(listTitle)}</strong>`;
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

            return `
                <div class="community-activity-card" onclick="if('${targetUrl}' !== '#') window.location.href='${targetUrl}'">
                    <div class="activity-card-left">
                        <div class="activity-avatar-circle" onclick="event.stopPropagation(); window.location.href='${profileUrl}'">${escapeHtml(userName.charAt(0).toUpperCase())}</div>
                        <div class="activity-card-info">
                            <div class="activity-card-text">
                                <a href="${profileUrl}" class="review-user-link" onclick="event.stopPropagation()">@${escapeHtml(usernameClean(userName))}</a> ${verbHtml}
                            </div>
                            <div class="activity-card-item">
                                ${ts ? `<span class="activity-card-time">${escapeHtml(timeAgo(ts))}</span>` : ''}
                            </div>
                        </div>
                    </div>
                    ${coverUrl ? `<img class="activity-cover-img" src="${escapeHtml(coverUrl)}" alt="${escapeHtml(itemTitle)}" loading="lazy" />` : (activityType === 'create_list' ? `<div class="activity-list-icon-badge"><i class="fas fa-layer-group text-accent"></i></div>` : '')}
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
            // Query list_items, reviews, and user_lists in parallel with safe fallbacks
            const [listItems, reviews, createdLists] = await Promise.all([
                safeTableQuery(client, 'list_items', '*', 35),
                safeTableQuery(client, 'reviews', '*', 35),
                safeTableQuery(client, 'user_lists', '*', 20)
            ]);

            if (!listItems.length && !reviews.length && !createdLists.length) {
                renderEmptyActivityState(container);
                return;
            }

            // Map list_id to custom list names
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

            // Fetch user profiles for all user_ids
            const userIds = [...new Set([
                ...listItems.map(i => i.user_id),
                ...reviews.map(r => r.user_id),
                ...createdLists.map(l => l.user_id)
            ].filter(Boolean))];

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

            // Merge into unified activity records
            const activityItems = [];

            listItems.forEach(item => {
                activityItems.push({
                    ...item,
                    activityType: 'list',
                    list_name: customListNames.get(item.list_id) || item.list_name || '',
                    username: usersMap.get(item.user_id) || 'member',
                    created_at: item.created_at || item.inserted_at || item.updated_at
                });
            });

            reviews.forEach(review => {
                activityItems.push({
                    ...review,
                    activityType: 'review',
                    username: usersMap.get(review.user_id) || 'member',
                    created_at: review.created_at || review.inserted_at
                });
            });

            createdLists.forEach(list => {
                activityItems.push({
                    ...list,
                    activityType: 'create_list',
                    list_name: list.name || list.title || 'a custom list',
                    username: usersMap.get(list.user_id) || 'member',
                    created_at: list.created_at || list.inserted_at
                });
            });

            // Sort merged array descending by timestamp
            activityItems.sort((a, b) => {
                const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
                const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
                return timeB - timeA;
            });

            const topActivities = activityItems.slice(0, 40);

            // Hydrate metadata (titles & posters) across all media types
            await hydrateMediaMetadata(topActivities);

            container.innerHTML = topActivities.map(a => ActivityCard.render(a)).join('');
        } catch (_e) {
            renderEmptyActivityState(container);
        }
    }

    function renderEmptyActivityState(container) {
        container.innerHTML = `
            <div class="community-empty-box">
                <div class="empty-icon"><i class="fas fa-rss"></i></div>
                <div class="empty-title">no activity yet.</div>
                <div class="empty-desc">when members add media to their lists, it will show up here.</div>
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
        } else if (tabName === 'activity') {
            loadActivityFeed();
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
        bindSearchInput();
    });

    return {
        switchTab: switchTab,
        loadReviewsFeed: loadReviewsFeed,
        loadActivityFeed: loadActivityFeed,
        loadPeopleFeed: loadPeopleFeed,
        loadFollowingFeed: loadFollowingFeed,
        toggleFollow: toggleFollow
    };
})();
