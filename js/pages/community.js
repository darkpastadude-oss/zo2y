/* ============================================================
   ZO2Y COMMUNITY - REVIEWS ENGINE & TAB MANAGER
   ============================================================ */

window.CommunityManager = (function() {
    'use strict';

    let supabase = null;

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

    // === REUSABLE REVIEW CARD COMPONENT ===
    const ReviewCard = {
        render: function(review) {
            const userName = (review.user_name || review.username || review.user_handle || 'member').toLowerCase();
            const itemTitle = (review.item_title || review.title || review.media_title || 'title').toLowerCase();
            const mediaType = (review.media_type || 'movie').toLowerCase();
            const itemId = review.item_id || review.media_id || '';
            const rating = review.rating ? parseFloat(review.rating) : null;
            const reviewText = (review.review_text || review.content || review.comment || '').toLowerCase();
            const coverUrl = review.item_image || review.cover_url || review.poster || review.image || '';

            // Route mapping to exact detail pages
            let targetPage = 'movie.html';
            if (mediaType === 'game') targetPage = 'game.html';
            else if (mediaType === 'tv' || mediaType === 'tvshow') targetPage = 'tvshow.html';
            else if (mediaType === 'book') targetPage = 'book.html';
            else if (mediaType === 'music' || mediaType === 'song' || mediaType === 'album') targetPage = 'song.html';

            const itemUrl = itemId ? `${targetPage}?id=${encodeURIComponent(itemId)}` : '#';

            // Star Rating Stars
            let starsHtml = '';
            if (rating) {
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
                            <div class="review-avatar-circle">${escapeHtml(userName.charAt(0).toUpperCase())}</div>
                            <div>
                                <div class="review-user-name">@${escapeHtml(usernameClean(userName))}</div>
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
                                "${escapeHtml(reviewText)}"
                            </div>
                        </div>
                    ` : `
                        <div class="review-text-content pt-4">
                            "${escapeHtml(reviewText)}"
                        </div>
                    `}
                </div>
            `;
        }
    };

    // === REVIEWS QUERY ENGINE (ROBUST RETRIES & FALLBACKS) ===
    async function loadReviewsFeed(retriesLeft = 3) {
        const container = document.getElementById('allReviewsFeed');
        if (!container) return;

        const client = getSupabaseClient();
        if (!client) {
            if (retriesLeft > 0) {
                setTimeout(() => loadReviewsFeed(retriesLeft - 1), 300);
            } else {
                renderEmptyReviewsState(container);
            }
            return;
        }

        try {
            // 1. Try 'user_reviews' table
            let { data: reviews, error } = await client
                .from('user_reviews')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(12);

            // 2. Fallback to 'reviews' table
            if (error || !reviews || !reviews.length) {
                const res1 = await client
                    .from('reviews')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(12);
                if (!res1.error && res1.data && res1.data.length) {
                    reviews = res1.data;
                }
            }

            // 3. Fallback to 'media_reviews' table
            if (!reviews || !reviews.length) {
                const res2 = await client
                    .from('media_reviews')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(12);
                if (!res2.error && res2.data && res2.data.length) {
                    reviews = res2.data;
                }
            }

            if (!reviews || !reviews.length) {
                renderEmptyReviewsState(container);
                return;
            }

            container.innerHTML = reviews.map(r => ReviewCard.render(r)).join('');
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
    });

    return {
        switchTab: switchTab,
        loadReviewsFeed: loadReviewsFeed
    };
})();
