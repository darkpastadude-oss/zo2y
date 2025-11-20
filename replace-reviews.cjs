// replace-reviews.js
const fs = require('fs');
const path = require('path');

// Supabase config - USE YOUR ACTUAL CREDENTIALS
const SUPABASE_URL = 'https://gfkhjbztayjyojsgdpgk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma2hqYnp0YXlqeW9qc2dkcGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwOTYyNjQsImV4cCI6MjA3NTY3MjI2NH0.WUb2yDAwCeokdpWCPeH13FE8NhWF6G8e6ivTsgu6b2s';

// Map filenames to restaurant IDs - FIXED DUPLICATE ID
const restaurantIdMap = {
  mori: 1,
  kilo: 2,
  hameed: 3,
  bazooka: 4,
  mexican: 5,
  chikin: 6,
  vasko: 7,
  secondcup: 8,
  station: 9,
  brgr: 10,
  country: 11,
  bayoki: 12,
  maine: 13,
  barbar: 14,
  labash: 15,
  pickl: 16,
  akleh: 17,
  howlin: 18,
  sauce: 19,
  papa: 20,
  qasr: 21,
  heart: 22,
  what: 23,
  buffalo: 24,
  mince: 25,
  '88': 26,
  kansas: 27,
  ward: 28,
  willys: 29,
  butchers: 30,
  hashville: 31,
  dawgs: 32,
  holmes: 33,
  ribs: 34,
  peking: 35,
  wok: 36,
  daddy: 37,
  husk: 38,
  crispy: 39,
  lord: 40,
  chez: 41,
  mario: 42,
  crumbs: 43,
  man: 44,
  pasta: 45,
  crave: 46,
  caizo: 47,
  pablo: 48,
  panda: 49,
  tabali: 50
};

const CARDS_FOLDER = path.join(__dirname, 'cards');

function updateAllFiles() {
  // Check if cards folder exists
  if (!fs.existsSync(CARDS_FOLDER)) {
    console.log(`❌ Cards folder not found: ${CARDS_FOLDER}`);
    return;
  }

  const files = fs.readdirSync(CARDS_FOLDER).filter(f => f.endsWith('.html'));

  console.log(`Found ${files.length} files to process`);

  files.forEach(file => {
    const name = file.replace('.html', '').toLowerCase();
    const restaurantId = restaurantIdMap[name];
    
    if (!restaurantId) {
      console.log(`❌ Skipping ${file}: no ID found for "${name}"`);
      return;
    }

    const filePath = path.join(CARDS_FOLDER, file);
    
    try {
      let html = fs.readFileSync(filePath, 'utf8');

      // Remove old review sections more carefully
      const oldReviewPattern = /<section class="section reviews">[\s\S]*?<\/section>/;
      if (html.match(oldReviewPattern)) {
        html = html.replace(oldReviewPattern, '');
        console.log(`✅ Removed old reviews from ${file}`);
      }

      // Insert new reviews section at the end of <body>
      const reviewsSection = `
<!-- DYNAMIC REVIEWS SYSTEM -->
<section class="section reviews" id="reviews-section">
  <h2>Customer Reviews</h2>
  <div id="reviews-list" class="reviews-container">
    <div class="reviews-loading">Loading reviews...</div>
  </div>
  
  <h3 style="margin-top: 30px; font-size: 1.2rem;">Add Your Review</h3>
  <form class="review-form" id="review-form" style="display:none;">
    <div class="review-input-group">
      <div class="rating-input">
        <span>Rating:</span>
        <div class="stars" id="stars-container">
          <span class="star" data-rating="1">★</span>
          <span class="star" data-rating="2">★</span>
          <span class="star" data-rating="3">★</span>
          <span class="star" data-rating="4">★</span>
          <span class="star" data-rating="5">★</span>
        </div>
        <span class="rating-text" id="rating-text">Select rating</span>
      </div>
    </div>
    <textarea id="review-comment" placeholder="Share your experience..." rows="4" required maxlength="500"></textarea>
    <div class="review-form-actions">
      <button type="submit" class="btn">Submit Review</button>
      <span class="char-count">0/500</span>
    </div>
  </form>
  
  <div class="auth-prompt-review" id="auth-prompt">
    <p>Please <a href="../login.html" style="color: #FF9800; text-decoration: underline;">sign in</a> to submit a review.</p>
  </div>
</section>

<style>
.reviews-container {
  max-height: 500px;
  overflow-y: auto;
  padding-right: 10px;
  margin-bottom: 20px;
}

.review {
  border-bottom: 1px solid var(--nav-shadow);
  padding: 20px 0;
  position: relative;
}

.review:last-child {
  border-bottom: none;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
  position: relative;
}

.reviewer-name {
  font-weight: 600;
  color: var(--text);
  margin: 0;
  flex: 1;
  padding-right: 100px;
}

.review-rating {
  color: #FF9800;
  font-size: 0.9rem;
  position: absolute;
  right: 0;
  top: 0;
}

.review-comment {
  margin: 0;
  color: var(--text2);
  line-height: 1.5;
  padding-right: 0;
}

.review-date {
  font-size: 0.8rem;
  color: var(--text2);
  margin-top: 5px;
}

.review-actions {
  position: absolute;
  top: 0;
  right: 0;
}

.delete-review {
  background: none;
  border: none;
  color: #ff4444;
  cursor: pointer;
  padding: 5px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  transition: all 0.3s ease;
  margin-left: 10px;
}

.delete-review:hover {
  background: rgba(255, 68, 68, 0.1);
  transform: scale(1.1);
}

.review-input-group {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
  flex-wrap: wrap;
  justify-content: space-between;
}

.rating-input {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.stars {
  display: flex;
  gap: 2px;
}

.star {
  font-size: 1.5rem;
  color: #ddd;
  cursor: pointer;
  transition: color 0.2s ease;
  user-select: none;
}

.star:hover,
.star.active {
  color: #FF9800;
  transform: scale(1.1);
}

.rating-text {
  font-size: 0.9rem;
  color: var(--text2);
  min-width: 100px;
}

.review-form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 15px;
}

.char-count {
  font-size: 0.8rem;
  color: var(--text2);
}

.reviews-loading, .reviews-empty {
  text-align: center;
  padding: 40px 20px;
  color: var(--text2);
  font-style: italic;
}

.auth-prompt-review {
  text-align: center;
  padding: 20px;
  background: var(--card);
  border-radius: 8px;
  margin-top: 20px;
  border: 1px solid var(--nav-shadow);
}

@media (max-width: 768px) {
  .review-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .reviewer-name {
    padding-right: 0;
    margin-bottom: 8px;
  }
  
  .review-rating {
    position: static;
    margin-bottom: 8px;
  }
  
  .review-actions {
    position: static;
    align-self: flex-end;
  }
  
  .review-input-group {
    flex-direction: column;
    gap: 10px;
  }
  
  .rating-input {
    justify-content: space-between;
  }
}
</style>

<script>
// Reviews System for ${name}
class RestaurantReviews {
  constructor() {
    this.supabase = window.supabase;
    this.restaurantId = ${restaurantId};
    this.currentRating = 0;
    this.init();
  }

  async init() {
    await this.checkAuth();
    this.setupEventListeners();
    this.loadReviews();
  }

  async checkAuth() {
    try {
      const { data: { session } } = await this.supabase.auth.getSession();
      this.currentUser = session?.user || null;
      this.toggleAuthUI();
    } catch (error) {
      console.error('Auth check error:', error);
      this.currentUser = null;
    }
  }

  toggleAuthUI() {
    const authPrompt = document.getElementById('auth-prompt');
    const reviewForm = document.getElementById('review-form');
    
    if (this.currentUser) {
      if (authPrompt) authPrompt.style.display = 'none';
      if (reviewForm) reviewForm.style.display = 'block';
    } else {
      if (authPrompt) authPrompt.style.display = 'block';
      if (reviewForm) reviewForm.style.display = 'none';
    }
  }

  setupEventListeners() {
    // Star rating
    document.querySelectorAll('.star').forEach(star => {
      star.addEventListener('click', (e) => {
        this.currentRating = parseInt(e.target.dataset.rating);
        this.updateStars();
      });
    });

    // Character count
    const commentTextarea = document.getElementById('review-comment');
    if (commentTextarea) {
      commentTextarea.addEventListener('input', (e) => {
        const count = e.target.value.length;
        document.querySelector('.char-count').textContent = \`\${count}/500\`;
      });
    }

    // Review form submission
    const reviewForm = document.getElementById('review-form');
    if (reviewForm) {
      reviewForm.addEventListener('submit', (e) => this.submitReview(e));
    }
  }

  updateStars() {
    document.querySelectorAll('.star').forEach(star => {
      const rating = parseInt(star.dataset.rating);
      star.classList.toggle('active', rating <= this.currentRating);
    });
    
    const ratingTexts = ['Select rating', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
    document.getElementById('rating-text').textContent = ratingTexts[this.currentRating] || 'Select rating';
  }

  async loadReviews() {
    const reviewsContainer = document.getElementById('reviews-list');
    if (!reviewsContainer) return;

    try {
      const { data: reviews, error } = await this.supabase
        .from('reviews')
        .select('*')
        .eq('restaurant_id', this.restaurantId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      this.displayReviews(reviews || []);
    } catch (error) {
      console.error('Error loading reviews:', error);
      reviewsContainer.innerHTML = '<div class="reviews-empty">Error loading reviews</div>';
    }
  }

  async displayReviews(reviews) {
    const reviewsContainer = document.getElementById('reviews-list');
    
    if (reviews.length === 0) {
      reviewsContainer.innerHTML = '<div class="reviews-empty">No reviews yet. Be the first to share your experience!</div>';
      return;
    }

    // Get user profiles for proper usernames
    const userIds = [...new Set(reviews.map(review => review.user_id))];
    const { data: userProfiles } = await this.supabase
      .from('user_profiles')
      .select('id, username, full_name')
      .in('id', userIds);

    const userProfileMap = {};
    if (userProfiles) {
      userProfiles.forEach(profile => {
        userProfileMap[profile.id] = profile;
      });
    }

    reviewsContainer.innerHTML = reviews.map(review => {
      const userProfile = userProfileMap[review.user_id];
      const displayName = userProfile ? (userProfile.full_name || userProfile.username) : review.user_name;
      
      return \`
        <div class="review" data-review-id="\${review.id}">
          <div class="review-header">
            <h4 class="reviewer-name">\${this.escapeHtml(displayName)}</h4>
            <div class="review-rating">\${'★'.repeat(review.rating)}\${'☆'.repeat(5 - review.rating)}</div>
            \${this.currentUser && review.user_id === this.currentUser.id ? \`
              <div class="review-actions">
                <button class="delete-review" onclick="window.reviewsSystem.deleteReview(\${review.id})">
                  <i class="fas fa-trash"></i> Delete
                </button>
              </div>
            \` : ''}
          </div>
          <p class="review-comment">\${this.escapeHtml(review.comment)}</p>
          <div class="review-date">\${new Date(review.created_at).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</div>
        </div>
      \`;
    }).join('');
  }

  async submitReview(e) {
    e.preventDefault();
    
    if (!this.currentUser) {
      alert('Please sign in to submit a review');
      return;
    }

    const comment = document.getElementById('review-comment').value.trim();

    if (!comment || this.currentRating === 0) {
      alert('Please fill in all fields and select a rating');
      return;
    }

    try {
      // Get user profile for proper username
      const { data: userProfile } = await this.supabase
        .from('user_profiles')
        .select('username, full_name')
        .eq('id', this.currentUser.id)
        .single();

      const displayName = userProfile ? (userProfile.full_name || userProfile.username) : 'User';

      const { data, error } = await this.supabase
        .from('reviews')
        .insert([{
          restaurant_id: this.restaurantId,
          user_id: this.currentUser.id,
          user_name: displayName,
          rating: this.currentRating,
          comment: comment
        }])
        .select()
        .single();

      if (error) throw error;

      // Reset form
      document.getElementById('review-form').reset();
      this.currentRating = 0;
      this.updateStars();
      document.querySelector('.char-count').textContent = '0/500';

      // Reload reviews
      this.loadReviews();

      alert('Review submitted successfully!');

    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Error submitting review: ' + error.message);
    }
  }

  async deleteReview(reviewId) {
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
      const { error } = await this.supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId)
        .eq('user_id', this.currentUser.id);

      if (error) throw error;

      this.loadReviews();
      alert('Review deleted successfully');

    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Error deleting review');
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize when Supabase is ready
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(() => {
    if (window.supabase) {
      window.reviewsSystem = new RestaurantReviews();
      console.log('✅ Reviews system initialized for restaurant ID: ${restaurantId}');
    }
  }, 1000);
});
</script>
`;

      // Add before closing body tag
      html = html.replace('</body>', reviewsSection + '\n</body>');
      
      fs.writeFileSync(filePath, html);
      console.log(`✅ Updated ${file} (ID: ${restaurantId})`);
      
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error);
    }
  });
}

updateAllFiles();