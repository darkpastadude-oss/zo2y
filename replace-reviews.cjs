const fs = require('fs');
const path = require('path');

class ReviewsAdder {
    constructor() {
        this.cardsDir = path.join(__dirname, 'cards');
        
        // Update these with your actual restaurant database IDs
        this.restaurantIds = {
            'howlin-birds': 1,
            'mori': 2,
            'kilo': 3,
            'hameed': 4,
            'bazooka': 5,
            'mexican-corn': 6,
            'chikin-worx': 7,
            'vasko': 8,
            'second-cup': 9,
            'pizza-station': 10,
            'brgr': 11
        };
    }

    async addReviewsToAllFiles() {
        try {
            if (!fs.existsSync(this.cardsDir)) {
                console.error('❌ cards/ directory not found!');
                return;
            }

            const files = fs.readdirSync(this.cardsDir);
            const htmlFiles = files.filter(file => file.endsWith('.html'));

            console.log(`📁 Found ${htmlFiles.length} HTML files in cards directory\\n`);

            let updatedCount = 0;

            for (const file of htmlFiles) {
                const filePath = path.join(this.cardsDir, file);
                const updated = await this.addReviewsSection(filePath);
                if (updated) {
                    updatedCount++;
                    console.log(`✅ Added reviews to: ${file}`);
                }
            }

            console.log(`\\n🎉 Successfully added reviews to ${updatedCount} out of ${htmlFiles.length} files`);

        } catch (error) {
            console.error('Error updating files:', error);
        }
    }

    async addReviewsSection(filePath) {
        try {
            let content = fs.readFileSync(filePath, 'utf8');

            // Check if review system already exists
            if (content.includes('REAL REVIEWS SYSTEM')) {
                console.log(`⏩ Skipping ${path.basename(filePath)} - already has review system`);
                return true;
            }

            // Create the new reviews system
            const newReviewsSystem = this.createReviewsSystem();

            // Find where to insert the reviews section - typically before the footer
            // Look for the footer or closing body tag
            if (content.includes('</footer>')) {
                // Insert before footer
                content = content.replace('</footer>', newReviewsSystem + '\\n</footer>');
            } else if (content.includes('</body>')) {
                // Insert before closing body tag
                content = content.replace('</body>', newReviewsSystem + '\\n</body>');
            } else {
                // Last resort: insert at the end
                content += newReviewsSystem;
            }

            // Write updated content back to file
            fs.writeFileSync(filePath, content, 'utf8');
            return true;

        } catch (error) {
            console.error(`Error updating file ${path.basename(filePath)}:`, error.message);
            return false;
        }
    }

    createReviewsSystem() {
        return `
<!-- ==================== -->
<!-- REAL REVIEWS SYSTEM -->
<!-- ==================== -->

<section class="section reviews">
    <h2>Customer Reviews</h2>
    
    <div class="review-stats" id="reviewStats">
        <div class="overall-rating">
            <div class="rating-large" id="overallRating">0.0</div>
            <div class="rating-stars-large" id="overallStars">⭐⭐⭐⭐⭐</div>
            <div class="rating-count" id="reviewCount">0 reviews</div>
        </div>
        <div class="rating-breakdown" id="ratingBreakdown"></div>
    </div>

    <div id="reviewsList">
        <div class="empty-reviews">
            <div class="empty-icon">💬</div>
            <h3>No Reviews Yet</h3>
            <p>Be the first to share your experience!</p>
        </div>
    </div>

    <div class="add-review-section" id="addReviewSection">
        <h3>Write a Review</h3>
        <form class="review-form" id="reviewForm">
            <div class="rating-input">
                <label>Your Rating:</label>
                <div class="star-rating" id="starRating">
                    <span class="star" data-rating="1">☆</span>
                    <span class="star" data-rating="2">☆</span>
                    <span class="star" data-rating="3">☆</span>
                    <span class="star" data-rating="4">☆</span>
                    <span class="star" data-rating="5">☆</span>
                </div>
                <input type="hidden" id="selectedRating" name="rating" required>
            </div>
            
            <div class="form-group">
                <label for="reviewComment">Your Review:</label>
                <textarea 
                    id="reviewComment" 
                    name="comment" 
                    placeholder="Share your experience with this restaurant..." 
                    rows="4"
                    required
                ></textarea>
            </div>
            
            <button type="submit" class="btn btn-primary">
                <i class="fas fa-paper-plane"></i> Submit Review
            </button>
        </form>
    </div>
</section>

<script>
// Reviews System
class ReviewsSystem {
    constructor() {
        this.supabaseUrl = "https://gfkhjbztayjyojsgdpgk.supabase.co";
        this.supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma2hqYnp0YXlqeW9qc2dkcGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwOTYyNjQsImV4cCI6MjA3NTY3MjI2NH0.WUb2yDAwCeokdpWCPeH13FE8NhWF6G8e6ivTsgu6b2s";
        this.supabase = window.supabase.createClient(this.supabaseUrl, this.supabaseKey);
        this.currentUser = null;
        this.restaurantId = null;
        this.reviews = [];
    }

    async init() {
        await this.getCurrentUser();
        this.restaurantId = this.getRestaurantId();
        if (this.restaurantId) {
            await this.loadReviews();
            this.renderReviews();
            this.calculateRatings();
            this.setupEventListeners();
            this.updateUIForLogin();
        }
    }

    async getCurrentUser() {
        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            this.currentUser = user;
        } catch (error) {
            console.log('No user logged in');
        }
    }

    getRestaurantId() {
        const path = window.location.pathname;
        const slug = path.split('/').pop().replace('.html', '');
        const restaurantIds = ${JSON.stringify(this.restaurantIds, null, 4)};
        return restaurantIds[slug] || 1;
    }

    async loadReviews() {
        if (!this.restaurantId) return;
        try {
            const { data, error } = await this.supabase
                .from('reviews')
                .select('*')
                .eq('restaurant_id', this.restaurantId)
                .order('created_at', { ascending: false });
            if (error) throw error;
            this.reviews = data || [];
        } catch (error) {
            console.error('Error loading reviews:', error);
            this.reviews = [];
        }
    }

    renderReviews() {
        const container = document.getElementById('reviewsList');
        if (!container) return;

        if (this.reviews.length === 0) {
            container.innerHTML = \`
                <div class="empty-reviews">
                    <div class="empty-icon">💬</div>
                    <h3>No Reviews Yet</h3>
                    <p>Be the first to share your experience!</p>
                </div>
            \`;
            return;
        }

        container.innerHTML = this.reviews.map(review => \`
            <div class="review-item">
                <div class="review-header">
                    <div class="reviewer-info">
                        <div class="reviewer-avatar">
                            \${review.user_name ? review.user_name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div class="reviewer-details">
                            <div class="reviewer-name">\${review.user_name || 'Anonymous User'}</div>
                            <div class="review-date">\${this.formatDate(review.created_at)}</div>
                        </div>
                    </div>
                    <div class="review-rating">
                        \${'⭐'.repeat(review.rating)}
                    </div>
                </div>
                <div class="review-content">
                    <p>\${review.comment || 'No comment provided.'}</p>
                </div>
                \${this.canEditReview(review) ? \`
                    <div class="review-actions">
                        <button class="btn btn-sm btn-secondary" onclick="reviewsSystem.editReview(\${review.id})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="reviewsSystem.deleteReview(\${review.id})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                \` : ''}
            </div>
        \`).join('');
    }

    canEditReview(review) {
        return this.currentUser && review.user_id === this.currentUser.id;
    }

    calculateRatings() {
        if (this.reviews.length === 0) {
            this.updateRatingDisplay(0, 0);
            return;
        }

        const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = totalRating / this.reviews.length;
        
        const distribution = {5: 0, 4: 0, 3: 0, 2: 0, 1: 0};
        this.reviews.forEach(review => {
            distribution[review.rating]++;
        });

        this.updateRatingDisplay(averageRating, this.reviews.length);
        this.updateRatingBars(distribution);
    }

    updateRatingDisplay(averageRating, totalReviews) {
        const overallRating = document.getElementById('overallRating');
        const overallStars = document.getElementById('overallStars');
        const reviewCount = document.getElementById('reviewCount');

        if (overallRating) overallRating.textContent = averageRating.toFixed(1);
        if (overallStars) overallStars.innerHTML = '⭐'.repeat(Math.round(averageRating));
        if (reviewCount) reviewCount.textContent = \`\${totalReviews} review\${totalReviews !== 1 ? 's' : ''}\`;
    }

    updateRatingBars(distribution) {
        const container = document.getElementById('ratingBreakdown');
        if (!container) return;

        const totalReviews = this.reviews.length;
        
        container.innerHTML = [5, 4, 3, 2, 1].map(rating => {
            const count = distribution[rating] || 0;
            const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
            
            return \`
                <div class="rating-bar">
                    <span class="rating-bar-label">\${rating} stars</span>
                    <div class="rating-bar-track">
                        <div class="rating-bar-fill" style="width: \${percentage}%"></div>
                    </div>
                    <span class="rating-bar-count">\${count}</span>
                </div>
            \`;
        }).join('');
    }

    setupEventListeners() {
        const stars = document.querySelectorAll('.star');
        stars.forEach(star => {
            star.addEventListener('click', () => this.setRating(parseInt(star.dataset.rating)));
        });

        const reviewForm = document.getElementById('reviewForm');
        if (reviewForm) {
            reviewForm.addEventListener('submit', (e) => this.submitReview(e));
        }
    }

    updateUIForLogin() {
        const addReviewSection = document.getElementById('addReviewSection');
        if (!addReviewSection) return;

        if (!this.currentUser) {
            addReviewSection.innerHTML = \`
                <div class="login-prompt">
                    <h3>Want to share your experience?</h3>
                    <p>Please log in to write a review and help other food lovers discover great places!</p>
                    <button onclick="window.location.href='../login.html'" class="btn btn-primary">
                        <i class="fas fa-sign-in-alt"></i> Log In to Review
                    </button>
                </div>
            \`;
        }
    }

    setRating(rating) {
        const selectedRatingInput = document.getElementById('selectedRating');
        if (selectedRatingInput) selectedRatingInput.value = rating;
        
        const stars = document.querySelectorAll('.star');
        stars.forEach((star, index) => {
            if (index < rating) {
                star.textContent = '⭐';
                star.style.color = '#FF9800';
            } else {
                star.textContent = '☆';
                star.style.color = 'var(--text2)';
            }
        });
    }

    async submitReview(event) {
        event.preventDefault();
        
        if (!this.currentUser) {
            alert('Please log in to write a review');
            return;
        }

        const rating = parseInt(document.getElementById('selectedRating')?.value);
        const comment = document.getElementById('reviewComment')?.value.trim();

        if (!rating || !comment) {
            alert('Please provide both a rating and comment');
            return;
        }

        try {
            const { data: profile } = await this.supabase
                .from('user_profiles')
                .select('full_name, username')
                .eq('id', this.currentUser.id)
                .single();

            const userName = profile?.full_name || profile?.username || this.currentUser.email.split('@')[0];

            const { error } = await this.supabase
                .from('reviews')
                .insert({
                    restaurant_id: this.restaurantId,
                    user_id: this.currentUser.id,
                    user_name: userName,
                    rating: rating,
                    comment: comment,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;

            await this.loadReviews();
            this.renderReviews();
            this.calculateRatings();
            document.getElementById('reviewForm').reset();
            this.setRating(0);
            alert('Review submitted successfully!');

        } catch (error) {
            console.error('Error submitting review:', error);
            alert('Error submitting review');
        }
    }

    async editReview(reviewId) {
        const review = this.reviews.find(r => r.id === reviewId);
        if (!review) return;

        const newComment = prompt('Edit your review:', review.comment);
        if (newComment === null) return;

        try {
            const { error } = await this.supabase
                .from('reviews')
                .update({
                    comment: newComment,
                    updated_at: new Date().toISOString()
                })
                .eq('id', reviewId);

            if (error) throw error;

            await this.loadReviews();
            this.renderReviews();
            alert('Review updated successfully!');

        } catch (error) {
            alert('Error updating review');
        }
    }

    async deleteReview(reviewId) {
        if (!confirm('Are you sure you want to delete this review?')) return;

        try {
            const { error } = await this.supabase
                .from('reviews')
                .delete()
                .eq('id', reviewId);

            if (error) throw error;

            await this.loadReviews();
            this.renderReviews();
            this.calculateRatings();
            alert('Review deleted successfully!');

        } catch (error) {
            alert('Error deleting review');
        }
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', { 
            year: 'numeric', month: 'long', day: 'numeric' 
        });
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.reviewsSystem = new ReviewsSystem();
    window.reviewsSystem.init();
});
</script>

<style>
.review-stats { 
    display: flex; 
    align-items: center; 
    gap: 30px; 
    margin-bottom: 30px; 
    padding: 20px; 
    background: var(--card); 
    border-radius: 12px; 
    border: 1px solid var(--nav-shadow); 
}
.overall-rating { 
    text-align: center; 
}
.rating-large { 
    font-size: 3rem; 
    font-weight: 700; 
    color: var(--accent); 
    line-height: 1; 
}
.rating-stars-large { 
    color: #FF9800; 
    font-size: 1.5rem; 
    margin: 10px 0; 
}
.rating-count { 
    color: var(--text2); 
    font-size: 0.9rem; 
}
.rating-breakdown { 
    flex: 1; 
}
.rating-bar { 
    display: flex; 
    align-items: center; 
    gap: 10px; 
    margin-bottom: 8px; 
}
.rating-bar-label { 
    width: 60px; 
    font-size: 0.9rem; 
    color: var(--text2); 
}
.rating-bar-track { 
    flex: 1; 
    height: 8px; 
    background: var(--nav-shadow); 
    border-radius: 4px; 
    overflow: hidden; 
}
.rating-bar-fill { 
    height: 100%; 
    background: #FF9800; 
    border-radius: 4px; 
    transition: width 0.3s ease; 
}
.rating-bar-count { 
    width: 30px; 
    font-size: 0.8rem; 
    color: var(--text2); 
    text-align: right; 
}
.review-item { 
    background: var(--card); 
    border-radius: 12px; 
    padding: 20px; 
    margin-bottom: 16px; 
    border: 1px solid var(--nav-shadow); 
    transition: all 0.3s ease; 
}
.review-item:hover { 
    transform: translateY(-2px); 
    box-shadow: 0 4px 12px rgba(0,0,0,0.1); 
}
.review-header { 
    display: flex; 
    justify-content: space-between; 
    align-items: flex-start; 
    margin-bottom: 12px; 
}
.reviewer-info { 
    display: flex; 
    align-items: center; 
    gap: 12px; 
}
.reviewer-avatar { 
    width: 40px; 
    height: 40px; 
    border-radius: 50%; 
    background: var(--accent); 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    font-weight: 600; 
    color: #0b1633; 
    font-size: 0.9rem; 
}
.reviewer-details { 
    display: flex; 
    flex-direction: column; 
}
.reviewer-name { 
    font-weight: 600; 
    margin-bottom: 2px; 
}
.review-date { 
    font-size: 0.8rem; 
    color: var(--text2); 
}
.review-rating { 
    color: #FF9800; 
    font-size: 1.1rem; 
}
.review-content { 
    margin-bottom: 12px; 
    line-height: 1.6; 
}
.review-actions { 
    display: flex; 
    gap: 8px; 
    justify-content: flex-end; 
}
.add-review-section { 
    background: var(--card); 
    border-radius: 12px; 
    padding: 24px; 
    margin-top: 30px; 
    border: 1px solid var(--nav-shadow); 
}
.rating-input { 
    margin-bottom: 20px; 
}
.rating-input label { 
    display: block; 
    margin-bottom: 8px; 
    font-weight: 600; 
}
.star-rating { 
    display: flex; 
    gap: 4px; 
}
.star { 
    font-size: 2rem; 
    cursor: pointer; 
    transition: all 0.2s ease; 
    user-select: none; 
}
.star:hover { 
    transform: scale(1.1); 
}
.login-prompt { 
    text-align: center; 
    padding: 40px 20px; 
    background: var(--card); 
    border-radius: 12px; 
}
.empty-reviews { 
    text-align: center; 
    padding: 40px 20px; 
    color: var(--text2); 
}
.empty-icon { 
    font-size: 4rem; 
    margin-bottom: 16px; 
    opacity: 0.5; 
}

@media (max-width: 768px) {
    .review-stats { 
        flex-direction: column; 
        text-align: center; 
        gap: 20px; 
    }
    .rating-breakdown { 
        width: 100%; 
    }
    .review-header { 
        flex-direction: column; 
        gap: 12px; 
    }
    .star { 
        font-size: 1.5rem; 
    }
}
</style>
`;
    }
}

// Run the script
console.log('🚀 Adding reviews system to all restaurant pages...\\n');
const adder = new ReviewsAdder();
adder.addReviewsToAllFiles();