/**
 * Profile Showcase Service
 *
 * Manages which lists appear on a user's profile and their ordering.
 * Requires Supabase client to be passed in on initialization.
 *
 * Tables used:
 *   profile_showcase  — which lists are shown on profile per media type
 *   *_lists          — display_order column for list ordering
 *   *_list_items     — display_order column for item ordering
 */
const ProfileShowcase = (function () {
    let sb = null;

    const CUSTOM_LIST_TABLES = {
        movie: 'movie_lists', tv: 'tv_lists', anime: 'anime_lists',
        game: 'game_lists', book: 'book_lists', music: 'artist_lists',
        travel: 'travel_lists', fashion: 'fashion_lists', food: 'food_lists',
        car: 'car_lists', sports: 'sports_lists'
    };

    const ITEM_TABLES = {
        movie: 'movie_list_items', tv: 'tv_list_items', anime: 'anime_list_items',
        game: 'game_list_items', book: 'book_list_items', music: 'artist_list_items',
        travel: 'travel_list_items', fashion: 'fashion_list_items',
        food: 'food_list_items', car: 'car_list_items', sports: 'sports_list_items'
    };

    const ITEM_FIELDS = {
        movie: 'movie_id', tv: 'tv_id', anime: 'anime_id',
        game: 'game_id', book: 'book_id',         music: 'artist_id',
        travel: 'country_code', fashion: 'brand_id', food: 'brand_id',
        car: 'brand_id', sports: 'team_id'
    };

    const DEFAULT_LIST_IDS = ['favorites', 'watched', 'watchlist'];

    function init(supabaseClient) {
        sb = supabaseClient;
    }

    // ============================================================
    // PROFILE SHOWCASE
    // ============================================================

    async function getProfileShowcase(userId) {
        if (!sb || !userId) return [];
        const { data, error } = await sb
            .from('profile_showcase')
            .select('*')
            .eq('user_id', userId)
            .order('display_order', { ascending: true });
        if (error) {
            console.error('getProfileShowcase error:', error);
            return [];
        }
        return data || [];
    }

    async function setProfileShowcase(userId, mediaType, listId, options = {}) {
        if (!sb || !userId || !mediaType || !listId) return false;
        const row = {
            user_id: userId,
            media_type: mediaType,
            list_id: listId,
            display_order: options.display_order ?? 0,
            is_hidden: options.is_hidden ?? false
        };
        const { error } = await sb
            .from('profile_showcase')
            .upsert(row, { onConflict: 'user_id,media_type,list_id' });
        if (error) {
            console.error('setProfileShowcase error:', error);
            return false;
        }
        return true;
    }

    async function removeFromShowcase(userId, mediaType, listId) {
        if (!sb || !userId || !mediaType || !listId) return false;
        const { error } = await sb
            .from('profile_showcase')
            .delete()
            .eq('user_id', userId)
            .eq('media_type', mediaType)
            .eq('list_id', listId);
        return !error;
    }

    async function reorderProfileShowcase(userId, orderedIds) {
        if (!sb || !userId || !Array.isArray(orderedIds)) return false;
        const updates = orderedIds.map((id, index) =>
            sb.from('profile_showcase')
                .update({ display_order: index })
                .eq('user_id', userId)
                .eq('id', id)
        );
        const results = await Promise.all(updates);
        return results.every(r => !r.error);
    }

    async function toggleShowcaseHidden(userId, mediaType, listId, isHidden) {
        if (!sb || !userId) return false;
        const { error } = await sb
            .from('profile_showcase')
            .update({ is_hidden: isHidden })
            .eq('user_id', userId)
            .eq('media_type', mediaType)
            .eq('list_id', listId);
        return !error;
    }

    // ============================================================
    // LIST REORDERING
    // ============================================================

    async function reorderLists(mediaType, userId, orderedListIds) {
        const table = CUSTOM_LIST_TABLES[mediaType];
        if (!table || !sb || !userId) return false;
        const updates = orderedListIds.map((id, index) =>
            sb.from(table)
                .update({ display_order: index })
                .eq('id', id)
                .eq('user_id', userId)
        );
        const results = await Promise.all(updates);
        return results.every(r => !r.error);
    }

    // ============================================================
    // ITEM REORDERING
    // ============================================================

    async function reorderListItems(mediaType, listId, listType, userId, orderedItemIds) {
        const table = ITEM_TABLES[mediaType];
        const itemField = ITEM_FIELDS[mediaType];
        if (!table || !itemField || !sb || !userId) return false;

        const updates = orderedItemIds.map((itemId, index) => {
            let query = sb.from(table)
                .update({ display_order: index })
                .eq(itemField, itemId)
                .eq('user_id', userId);

            if (listType && listType !== 'custom') {
                query = query.eq('list_type', listType);
            } else if (listId) {
                query = query.eq('list_id', listId);
            }
            return query;
        });

        const results = await Promise.all(updates);
        return results.every(r => !r.error);
    }

    // ============================================================
    // LIST TITLE RESOLUTION
    // ============================================================

    async function getListTitle(mediaType, listId, userId) {
        if (!listId || listId === 'custom') return null;

        if (DEFAULT_LIST_IDS.includes(listId)) {
            const titles = {
                favorites: 'Favorites',
                watched: 'Watched',
                watchlist: 'Watchlist',
                read: 'Read',
                readlist: 'Reading List',
                currently_reading: 'Currently Reading'
            };
            return titles[listId] || listId;
        }

        const table = CUSTOM_LIST_TABLES[mediaType];
        if (!table || !sb) return null;

        const { data } = await sb
            .from(table)
            .select('title')
            .eq('id', listId)
            .eq('user_id', userId)
            .maybeSingle();

        return data?.title || null;
    }

    function getDefaultListTitle(listId) {
        const titles = {
            favorites: 'Favorites',
            watched: 'Watched',
            watchlist: 'Watchlist',
            read: 'Read',
            readlist: 'Reading List',
            currently_reading: 'Currently Reading'
        };
        return titles[listId] || listId;
    }

    // ============================================================
    // GET ALL LISTS FOR A MEDIA TYPE (defaults + custom)
    // ============================================================

    async function getAllListsForType(mediaType, userId) {
        const result = [];

        const defaultLists = getDefaultListsForType(mediaType);
        const counts = await Promise.all(defaultLists.map(dl =>
            getItemCountForDefaultList(mediaType, dl.id, userId).catch(() => 0)
        ));
        defaultLists.forEach((dl, i) => {
            result.push({ ...dl, count: counts[i], is_default: true });
        });

        const table = CUSTOM_LIST_TABLES[mediaType];
        if (table && sb && userId) {
            const { data } = await sb
                .from(table)
                .select('*')
                .eq('user_id', userId)
                .order('display_order', { ascending: true });
            if (data) {
                for (const list of data) {
                    result.push({ ...list, is_default: false });
                }
            }
        }

        return result;
    }

    function getDefaultListsForType(mediaType) {
        const map = {
            movie: [
                { id: 'favorites', title: 'Favorites', icon: 'heart' },
                { id: 'watched', title: 'Watched', icon: 'check' },
                { id: 'watchlist', title: 'Watchlist', icon: 'bookmark' }
            ],
            tv: [
                { id: 'favorites', title: 'Favorites', icon: 'heart' },
                { id: 'watched', title: 'Watched', icon: 'check' },
                { id: 'watchlist', title: 'Watchlist', icon: 'bookmark' }
            ],
            anime: [
                { id: 'favorites', title: 'Favorites', icon: 'heart' },
                { id: 'watched', title: 'Watched', icon: 'check' },
                { id: 'watchlist', title: 'Watchlist', icon: 'bookmark' }
            ],
            game: [
                { id: 'favorites', title: 'Favorites', icon: 'heart' },
                { id: 'played', title: 'Played', icon: 'check' },
                { id: 'wishlist', title: 'Wishlist', icon: 'bookmark' }
            ],
            book: [
                { id: 'favorites', title: 'Favorites', icon: 'heart' },
                { id: 'read', title: 'Read', icon: 'check' },
                { id: 'readlist', title: 'Reading List', icon: 'bookmark' }
            ],
            music: [
                { id: 'favorites', title: 'Favorites', icon: 'heart' },
                { id: 'listened', title: 'Listened', icon: 'headphones' },
                { id: 'listenlist', title: 'Listenlist', icon: 'bookmark' }
            ],
            travel: [
                { id: 'favorites', title: 'Favorites', icon: 'heart' },
                { id: 'visited', title: 'Visited', icon: 'check' },
                { id: 'bucketlist', title: 'Bucket List', icon: 'bookmark' }
            ],
            fashion: [
                { id: 'favorites', title: 'Favorites', icon: 'heart' },
                { id: 'wishlist', title: 'Wishlist', icon: 'bookmark' },
                { id: 'owned', title: 'Owned', icon: 'check' }
            ],
            food: [
                { id: 'favorites', title: 'Favorites', icon: 'heart' },
                { id: 'wishlist', title: 'Wishlist', icon: 'bookmark' },
                { id: 'tried', title: 'Tried', icon: 'check' }
            ],
            car: [
                { id: 'favorites', title: 'Favorites', icon: 'heart' },
                { id: 'wishlist', title: 'Wishlist', icon: 'bookmark' },
                { id: 'owned', title: 'Owned', icon: 'check' }
            ],
            sports: [
                // Sports uses a fundamentally different architecture from other categories.
                // Instead of the standard *_list_items table pattern, sports stores
                // team favorites in a dedicated `user_favorite_teams` junction table
                // and renders them directly via renderSports(). The sports_lists table
                // and sports_list_items table exist in the schema but are not used by
                // the profile rendering pipeline. This single default list is intentional.
                { id: 'favorites', title: 'Favorites', icon: 'heart' }
            ]
        };
        return map[mediaType] || [{ id: 'favorites', title: 'Favorites', icon: 'heart' }];
    }

    async function getItemCountForDefaultList(mediaType, listId, userId) {
        const table = ITEM_TABLES[mediaType];
        if (!table || !sb || !userId) return 0;
        const { count } = await sb
            .from(table)
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('list_type', listId);
        return count || 0;
    }

    // ============================================================
    // ENSURE DEFAULT SHOWCASE (for new users)
    // ============================================================

    async function ensureDefaultShowcase(userId) {
        if (!sb || !userId) return;
        const existing = await getProfileShowcase(userId);
        if (existing.length > 0) return;

        const types = ['movie', 'tv', 'anime', 'game', 'book', 'music'];
        const inserts = [];
        for (let i = 0; i < types.length; i++) {
            inserts.push({
                user_id: userId,
                media_type: types[i],
                list_id: 'favorites',
                display_order: i,
                is_hidden: false
            });
        }
        await sb.from('profile_showcase').upsert(inserts, { onConflict: 'user_id,media_type,list_id' });
    }

    return {
        init,
        getProfileShowcase,
        setProfileShowcase,
        removeFromShowcase,
        reorderProfileShowcase,
        toggleShowcaseHidden,
        reorderLists,
        reorderListItems,
        getListTitle,
        getDefaultListTitle,
        getAllListsForType,
        getDefaultListsForType,
        ensureDefaultShowcase,
        DEFAULT_LIST_IDS,
        CUSTOM_LIST_TABLES,
        ITEM_TABLES,
        ITEM_FIELDS
    };
})();

if (typeof window !== 'undefined') {
    window.ProfileShowcase = ProfileShowcase;
}
