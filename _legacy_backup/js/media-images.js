/**
 * Centralized Media Image Utility
 * Handles generating, caching, validating, and falling back for all media artwork.
 */
const MediaImages = (function() {
    const TMDB_POSTER_BASE = "https://image.tmdb.org/t/p/w500";
    const TMDB_BACKDROP_BASE = "https://image.tmdb.org/t/p/w1280";
    const IGDB_IMAGE_BASE = "https://images.igdb.com/igdb/image/upload/t_1080p";
    const OPEN_LIBRARY_COVER_BASE = "https://covers.openlibrary.org/b/id";
    const FALLBACK_IMAGE = "/newlogo.webp";

    // Session cache for images (so back navigation is instant)
    const imageCache = new Map();

    /**
     * Tries to load an image, returns a promise that resolves with the URL if successful,
     * or rejects if the image fails to load.
     */
    function validateImage(url) {
        if (!url) return Promise.reject("No URL");
        if (imageCache.has(url)) {
            return imageCache.get(url) ? Promise.resolve(url) : Promise.reject("Previously failed");
        }
        
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                imageCache.set(url, true);
                resolve(url);
            };
            img.onerror = () => {
                imageCache.set(url, false);
                reject();
            };
            img.src = url;
        });
    }

    /**
     * Tries multiple image URLs in order. Returns the first one that loads.
     */
    async function tryImagesWithFallbacks(urls) {
        for (const url of urls) {
            if (!url) continue;
            try {
                const validUrl = await validateImage(url);
                return validUrl;
            } catch (e) {
                // Continue to next fallback
            }
        }
        return FALLBACK_IMAGE; // Last resort
    }

    return {
        /**
         * Get a movie/tv poster
         */
        getPoster: async function(mediaType, item) {
            const fallbacks = [];
            
            if (mediaType === 'movie' || mediaType === 'tv') {
                if (item.poster_path) fallbacks.push(`${TMDB_POSTER_BASE}${item.poster_path}`);
                if (item.backdrop_path) fallbacks.push(`${TMDB_POSTER_BASE}${item.backdrop_path}`); // fallback to backdrop crop
            } else if (mediaType === 'anime') {
                if (item.poster_path) fallbacks.push(item.poster_path.startsWith('http') ? item.poster_path : `${TMDB_POSTER_BASE}${item.poster_path}`);
                if (item.image_url) fallbacks.push(item.image_url);
            } else if (mediaType === 'game') {
                if (item.cover_id) fallbacks.push(`${IGDB_IMAGE_BASE}/${item.cover_id}.jpg`);
                if (item.background_image) fallbacks.push(item.background_image); // RAWG style
            } else if (mediaType === 'book') {
                if (item.cover_i) fallbacks.push(`${OPEN_LIBRARY_COVER_BASE}/${item.cover_i}-L.jpg`);
            }
            if (item.image_url) fallbacks.push(item.image_url);

            return tryImagesWithFallbacks(fallbacks);
        },

        /**
         * Get a backdrop for headers. 
         * Strict fallback priority: backdrop -> another favorite's backdrop -> poster -> gradient
         */
        getBackdrop: async function(mediaType, item, fallbackItems = []) {
            const urlsToTry = [];

            // 1. Target item's backdrop
            if ((mediaType === 'movie' || mediaType === 'tv') && item.backdrop_path) {
                urlsToTry.push(`${TMDB_BACKDROP_BASE}${item.backdrop_path}`);
            } else if (mediaType === 'game' && item.artworks && item.artworks.length > 0) {
                urlsToTry.push(`${IGDB_IMAGE_BASE}/${item.artworks[0]}.jpg`);
            } else if (item.backdrop_url) {
                urlsToTry.push(item.backdrop_url);
            }

            // 2. Try another favorite's backdrop
            for (const fallbackItem of fallbackItems) {
                if (!fallbackItem) continue;
                if ((mediaType === 'movie' || mediaType === 'tv') && fallbackItem.backdrop_path) {
                    urlsToTry.push(`${TMDB_BACKDROP_BASE}${fallbackItem.backdrop_path}`);
                } else if (mediaType === 'game' && fallbackItem.artworks && fallbackItem.artworks.length > 0) {
                    urlsToTry.push(`${IGDB_IMAGE_BASE}/${fallbackItem.artworks[0]}.jpg`);
                } else if (fallbackItem.backdrop_url) {
                    urlsToTry.push(fallbackItem.backdrop_url);
                }
            }

            // 3. Fallback to Target item's poster
            if (mediaType === 'movie' || mediaType === 'tv') {
                if (item.poster_path) urlsToTry.push(`${TMDB_POSTER_BASE}${item.poster_path}`);
            } else if (mediaType === 'game') {
                if (item.cover_id) urlsToTry.push(`${IGDB_IMAGE_BASE}/${item.cover_id}.jpg`);
            } else if (mediaType === 'book' && item.cover_i) {
                urlsToTry.push(`${OPEN_LIBRARY_COVER_BASE}/${item.cover_i}-L.jpg`);
            }

            const url = await tryImagesWithFallbacks(urlsToTry);
            return url === FALLBACK_IMAGE ? null : url;
        },

        clearCache: () => imageCache.clear()
    };
})();
window.MediaImages = MediaImages;
