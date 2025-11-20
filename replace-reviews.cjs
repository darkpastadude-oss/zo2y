// replace-reviews.js
const fs = require('fs');
const path = require('path');

// Function to replace the reviews section in a single file
function replaceReviewsInFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Find the restaurant name for the restaurant_id mapping
        const restaurantNameMatch = content.match(/<title>([^<]+)</);
        const restaurantName = restaurantNameMatch ? restaurantNameMatch[1].split('-')[0].trim().toLowerCase() : '';
        
        // Map restaurant names to IDs (you'll need to update this based on your actual restaurant IDs)
        const restaurantIdMap = {
            'buffalo burger': 24,
            'mori': 1,
            'kilo': 2,
            // Add all your restaurants here with their correct IDs
        };
        
        const restaurantId = restaurantIdMap[restaurantName] || 1; // Default to 1 if not found
        
        // The new reviews section with dynamic functionality
        const newReviewsSection = `
<section class="section reviews" id="reviews-section">
  <h2>Customer Reviews</h2>
  <div id="reviews-list" class="reviews-container">
    <div class="reviews-loading">Loading reviews...</div>
  </div>
  
  <h3 style="margin-top: 30px; font-size: 1.2rem;">Add Your Review</h3>
  <form class="review-form" id="review-form">
    <div class="review-input-group">
      <input type="text" placeholder="Your Name" id="reviewer-name" required maxlength="50">
      <div class="rating-input">
        <span>Rating:</span>
        <div class="stars">
          ${[1,2,3,4,5].map(i => `<span class="star" data-rating="${i}">★</span>`).join('')}
        </div>
        <span class="rating-text">Select rating</span>
      </div>
    </div>
    <textarea placeholder="Share your experience..." id="review-comment" rows="4" required maxlength="500"></textarea>
    <div class="review-form-actions">
      <button type="submit" class="btn">Submit Review</button>
      <span class="char-count">0/500</span>
    </div>
  </form>
  
  <div class="auth-prompt-review" id="auth-prompt" style="display: none;">
    <p>Please <a href="../login.html" style="color: #FF9800; text-decoration: underline;">sign in</a> to submit a review.</p>
  </div>
</section>

<style>
.reviews-container {
  max-height: 500px;
  overflow-y: auto;
  padding-right: 10px;
}

.review {
  border-bottom: 1px solid var(--nav-shadow);
  padding: 15px 0;
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
}

.reviewer-name {
  font-weight: 600;
  color: var(--text);
  margin: 0;
}

.review-rating {
  color: #FF9800;
  font-size: 0.9rem;
}

.review-comment {
  margin: 0;
  color: var(--text2);
  line-height: 1.5;
}

.review-date {
  font-size: 0.8rem;
  color: var(--text2);
  margin-top: 5px;
}

.review-input-group {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.review-input-group input {
  flex: 1;
  min-width: 200px;
}

.rating-input {
  display: flex;
  align-items: center;
  gap: 10px;
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
}

.star:hover,
.star.active {
  color: #FF9800;
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

.review-actions {
  position: absolute;
  top: 15px;
  right: 0;
}

.delete-review {
  background: none;
  border: none;
  color: #ff4444;
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
  font-size: 0.8rem;
}

.delete-review:hover {
  background: rgba(255, 68, 68, 0.1);
}

.auth-prompt-review {
  text-align: center;
  padding: 20px;
  background: var(--card);
  border-radius: 8px;
  margin-top: 20px;
}

/* Scrollbar styling */
.reviews-container::-webkit-scrollbar {
  width: 6px;
}

.reviews-container::-webkit-scrollbar-track {
  background: var(--nav-bg);
  border-radius: 3px;
}

.reviews-container::-webkit-scrollbar-thumb {
  background: #FF9800;
  border-radius: 3px;
}

.reviews-container::-webkit-scrollbar-thumb:hover {
  background: #F57C00;
}
</style>
`;

        // Replace the entire reviews section
        const oldReviewsRegex = /<section class="section reviews">[\s\S]*?<\/section>/;
        if (content.match(oldReviewsRegex)) {
            content = content.replace(oldReviewsRegex, newReviewsSection);
            
            // Add the JavaScript for reviews functionality before the closing body tag
            const reviewsScript = `
<script>
// Reviews System
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
    document.querySelector('.rating-text').textContent = ratingTexts[this.currentRating] || 'Select rating';
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

  displayReviews(reviews) {
    const reviewsContainer = document.getElementById('reviews-list');
    
    if (reviews.length === 0) {
      reviewsContainer.innerHTML = '<div class="reviews-empty">No reviews yet. Be the first to share your experience!</div>';
      return;
    }

    reviewsContainer.innerHTML = reviews.map(review => \`
      <div class="review" data-review-id="\${review.id}">
        <div class="review-header">
          <h4 class="reviewer-name">\${this.escapeHtml(review.user_name)}</h4>
          <div class="review-rating">\${'★'.repeat(review.rating)}\${'☆'.repeat(5 - review.rating)}</div>
        </div>
        <p class="review-comment">\${this.escapeHtml(review.comment)}</p>
        <div class="review-date">\${new Date(review.created_at).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</div>
        \${this.currentUser && review.user_id === this.currentUser.id ? \`
          <div class="review-actions">
            <button class="delete-review" onclick="reviewsSystem.deleteReview(\${review.id})">Delete</button>
          </div>
        \` : ''}
      </div>
    \`).join('');
  }

  async submitReview(e) {
    e.preventDefault();
    
    if (!this.currentUser) {
      alert('Please sign in to submit a review');
      return;
    }

    const userName = document.getElementById('reviewer-name').value.trim();
    const comment = document.getElementById('review-comment').value.trim();

    if (!userName || !comment || this.currentRating === 0) {
      alert('Please fill in all fields and select a rating');
      return;
    }

    try {
      const { data, error } = await this.supabase
        .from('reviews')
        .insert([{
          restaurant_id: this.restaurantId,
          user_id: this.currentUser.id,
          user_name: userName,
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

      // Show success message
      this.showNotification('Review submitted successfully!', 'success');

    } catch (error) {
      console.error('Error submitting review:', error);
      this.showNotification('Error submitting review: ' + error.message, 'error');
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
      this.showNotification('Review deleted successfully', 'info');

    } catch (error) {
      console.error('Error deleting review:', error);
      this.showNotification('Error deleting review', 'error');
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  showNotification(message, type = 'info') {
    // Use the existing notification system from your list manager
    if (window.RestaurantListManager) {
      new RestaurantListManager().showNotification(message, type);
    } else {
      alert(message);
    }
  }
}

// Initialize reviews system when Supabase is ready
window.addEventListener('DOMContentLoaded', function() {
  setTimeout(() => {
    window.reviewsSystem = new RestaurantReviews();
  }, 1000);
});
</script>
`;

            // Add the script before the closing body tag
            if (content.includes('</body>')) {
                content = content.replace('</body>', reviewsScript + '\n</body>');
            }
            
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ Updated reviews in: ${filePath}`);
            return true;
        } else {
            console.log(`❌ No reviews section found in: ${filePath}`);
            return false;
        }
    } catch (error) {
        console.error(`Error processing ${filePath}:`, error);
        return false;
    }
}

// Function to process all HTML files in the cards folder
function processAllRestaurantFiles() {
    const cardsFolder = './cards'; // Update this path to your cards folder
    const files = fs.readdirSync(cardsFolder);
    let processedCount = 0;

    files.forEach(file => {
        if (file.endsWith('.html')) {
            const filePath = path.join(cardsFolder, file);
            if (replaceReviewsInFile(filePath)) {
                processedCount++;
            }
        }
    });

    console.log(`\n🎉 Successfully updated ${processedCount} files`);
}

// Run the script
processAllRestaurantFiles();