// final-working-reviews.js
const fs = require('fs');
const path = require('path');

function replaceReviewsInFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Find the restaurant name for the restaurant_id mapping
        const restaurantNameMatch = content.match(/<title>([^<]+)</);
        const restaurantName = restaurantNameMatch ? restaurantNameMatch[1].split('-')[0].trim().toLowerCase() : '';
        
        // Map restaurant names to IDs
        const restaurantIdMap = {
            'buffalo burger': 24, 'mori': 1, 'kilo': 2, 'hameed': 3, 'bazooka': 4, 'mexican': 5,
            'chikin': 6, 'vasko': 7, 'secondcup': 8, 'station': 9, 'brgr': 10, 'country': 11,
            'bayoki': 12, 'maine': 13, 'barbar': 14, 'labash': 15, 'pickl': 16, 'akleh': 17,
            'howlin': 18, 'sauce': 19, 'papa': 20, 'qasr': 21, 'heart': 22, 'what': 23,
            'mince': 25, '88': 26, 'kansas': 27, 'ward': 28, 'willys': 29, 'butchers': 30,
            'hashville': 31, 'dawgs': 32, 'holmes': 33, 'ribs': 34, 'peking': 35, 'wok': 36,
            'daddy': 37, 'husk': 38, 'crispy': 39, 'lord': 40, 'chez': 41, 'mario': 42,
            'crumbs': 43, 'man': 44, 'pasta': 45, 'crave': 46, 'caizo': 47, 'pablo': 48,
            'panda': 49, 'tabali': 50
        };
        
        const restaurantId = restaurantIdMap[restaurantName] || 1;

        // The new reviews section
        const newReviewsSection = `
<section class="section reviews" id="reviews-section">
  <h2>Customer Reviews</h2>
  <div id="reviews-list" class="reviews-container">
    <div class="reviews-loading">Loading reviews...</div>
  </div>
  
  <h3 style="margin-top: 30px; font-size: 1.2rem;">Add Your Review</h3>
  <form class="review-form" id="review-form">
    <div class="review-input-group">
      <div class="rating-input">
        <span>Rating:</span>
        <div class="stars">
          <span class="star" data-rating="1">★</span>
          <span class="star" data-rating="2">★</span>
          <span class="star" data-rating="3">★</span>
          <span class="star" data-rating="4">★</span>
          <span class="star" data-rating="5">★</span>
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
  margin-bottom: 12px; 
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
  font-size: 1rem; 
  font-weight: 600;
}

.review-comment { 
  margin: 0; 
  color: var(--text2); 
  line-height: 1.6; 
  margin-bottom: 8px;
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
  padding: 6px 10px; 
  border-radius: 6px; 
  font-size: 0.8rem; 
  transition: all 0.3s ease; 
  margin-left: 10px; 
  border: 1px solid transparent;
}

.delete-review:hover { 
  background: rgba(255, 68, 68, 0.1); 
  transform: scale(1.05); 
  border-color: #ff4444;
}

.review-input-group { 
  display: flex; 
  gap: 15px; 
  margin-bottom: 20px; 
  flex-wrap: wrap; 
  justify-content: space-between; 
}

.rating-input { 
  display: flex; 
  align-items: center; 
  gap: 12px; 
  flex: 1; 
}

.stars { 
  display: flex; 
  gap: 4px; 
}

.star { 
  font-size: 1.8rem; 
  color: #ddd; 
  cursor: pointer; 
  transition: all 0.2s ease; 
  user-select: none; 
}

.star:hover, 
.star.active { 
  color: #FF9800; 
  transform: scale(1.2); 
}

.rating-text { 
  font-size: 0.9rem; 
  color: var(--text2); 
  min-width: 120px; 
  font-weight: 500;
}

.review-form-actions { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  margin-top: 20px; 
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
  padding: 30px; 
  background: var(--card); 
  border-radius: 12px; 
  margin-top: 20px; 
  border: 1px solid var(--nav-shadow); 
}

/* Custom Toast Notifications */
.zo2y-toast {
  position: fixed;
  top: 30px;
  right: 30px;
  background: var(--card);
  border: 1px solid var(--nav-shadow);
  border-left: 4px solid #FF9800;
  border-radius: 12px;
  padding: 18px 22px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 12px 35px rgba(0,0,0,0.4);
  z-index: 10000;
  transform: translateX(400px);
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  max-width: 380px;
  backdrop-filter: blur(15px);
  font-family: 'Segoe UI', sans-serif;
}

.zo2y-toast.show {
  transform: translateX(0);
}

.zo2y-toast.success {
  border-left-color: #10b981;
  background: linear-gradient(135deg, var(--card) 0%, rgba(16, 185, 129, 0.05) 100%);
}

.zo2y-toast.error {
  border-left-color: #ef4444;
  background: linear-gradient(135deg, var(--card) 0%, rgba(239, 68, 68, 0.05) 100%);
}

.zo2y-toast.warning {
  border-left-color: #f59e0b;
  background: linear-gradient(135deg, var(--card) 0%, rgba(245, 158, 11, 0.05) 100%);
}

.zo2y-toast.info {
  border-left-color: #3b82f6;
  background: linear-gradient(135deg, var(--card) 0%, rgba(59, 130, 246, 0.05) 100%);
}

.toast-icon {
  font-size: 22px;
  flex-shrink: 0;
  width: 24px;
  text-align: center;
}

.zo2y-toast.success .toast-icon { 
  color: #10b981; 
}

.zo2y-toast.error .toast-icon { 
  color: #ef4444; 
}

.zo2y-toast.warning .toast-icon { 
  color: #f59e0b; 
}

.zo2y-toast.info .toast-icon { 
  color: #3b82f6; 
}

.toast-content {
  flex: 1;
}

.toast-title {
  font-weight: 700;
  margin-bottom: 6px;
  color: var(--text);
  font-size: 1rem;
}

.toast-message {
  font-size: 14px;
  color: var(--text2);
  line-height: 1.5;
}

.toast-close {
  background: none;
  border: none;
  color: var(--text2);
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  transition: all 0.2s ease;
  flex-shrink: 0;
  font-size: 16px;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toast-close:hover {
  background: rgba(255,255,255,0.1);
  color: var(--text);
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

@media (max-width: 768px) {
  .review-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
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
    margin-top: 10px;
  }
  
  .review-input-group {
    flex-direction: column;
    gap: 15px;
  }
  
  .rating-input {
    justify-content: space-between;
  }
  
  .zo2y-toast {
    top: 20px;
    right: 20px;
    left: 20px;
    max-width: none;
  }
}
</style>
`;

        // The JavaScript for reviews functionality
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
        const charCount = document.querySelector('.char-count');
        if (charCount) charCount.textContent = \`\${count}/500\`;
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
    const ratingTextElement = document.querySelector('.rating-text');
    if (ratingTextElement) {
      ratingTextElement.textContent = ratingTexts[this.currentRating] || 'Select rating';
    }
  }

  async loadReviews() {
    const reviewsContainer = document.getElementById('reviews-list');
    if (!reviewsContainer) return;

    try {
      reviewsContainer.innerHTML = '<div class="reviews-loading">Loading reviews...</div>';

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
    if (!reviewsContainer) return;
    
    if (reviews.length === 0) {
      reviewsContainer.innerHTML = '<div class="reviews-empty">No reviews yet. Be the first to share your experience!</div>';
      return;
    }

    // Get user profiles for all reviews
    const userIds = [...new Set(reviews.map(review => review.user_id))];
    const { data: userProfiles, error: profileError } = await this.supabase
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
      const displayName = userProfile ? (userProfile.full_name || userProfile.username) : 'Anonymous User';
      
      return \`
        <div class="review" data-review-id="\${review.id}">
          <div class="review-header">
            <h4 class="reviewer-name">\${this.escapeHtml(displayName)}</h4>
            <div class="review-rating">\${'★'.repeat(review.rating)}\${'☆'.repeat(5 - review.rating)}</div>
            \${this.currentUser && review.user_id === this.currentUser.id ? \`
              <div class="review-actions">
                <button class="delete-review" onclick="reviewsSystem.deleteReview(\${review.id})">
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
      this.showNotification('Please sign in to submit a review', 'warning');
      return;
    }

    const commentElement = document.getElementById('review-comment');
    if (!commentElement) {
      this.showNotification('Review form not found', 'error');
      return;
    }

    const comment = commentElement.value.trim();

    if (!comment) {
      this.showNotification('Please write a review comment', 'warning');
      return;
    }

    if (this.currentRating === 0) {
      this.showNotification('Please select a rating', 'warning');
      return;
    }

    try {
      // Get user profile for the display name
      const { data: userProfile, error: profileError } = await this.supabase
        .from('user_profiles')
        .select('username, full_name')
        .eq('id', this.currentUser.id)
        .single();

      const displayName = userProfile ? (userProfile.full_name || userProfile.username) : 'Anonymous User';

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
      const reviewForm = document.getElementById('review-form');
      if (reviewForm) reviewForm.reset();
      
      this.currentRating = 0;
      this.updateStars();
      
      const charCount = document.querySelector('.char-count');
      if (charCount) charCount.textContent = '0/500';

      // Reload reviews
      this.loadReviews();

      // Show success message
      this.showNotification('Review submitted successfully! 🎉', 'success');

    } catch (error) {
      console.error('Error submitting review:', error);
      this.showNotification('Error submitting review. Please try again.', 'error');
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
    // Remove any existing toasts
    const existingToasts = document.querySelectorAll('.zo2y-toast');
    existingToasts.forEach(toast => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.remove();
        }
      }, 300);
    });

    const toast = document.createElement('div');
    toast.className = \`zo2y-toast \${type}\`;
    
    const icons = {
      success: '✓',
      error: '⚠',
      warning: '⚠', 
      info: 'ℹ'
    };
    
    const titles = {
      success: 'Success!',
      error: 'Error!',
      warning: 'Warning!',
      info: 'Notice'
    };
    
    toast.innerHTML = \`
      <div class="toast-icon">\${icons[type]}</div>
      <div class="toast-content">
        <div class="toast-title">\${titles[type]}</div>
        <div class="toast-message">\${message}</div>
      </div>
      <button class="toast-close">×</button>
    \`;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);
    
    // Manual close
    toast.querySelector('.toast-close').addEventListener('click', () => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.remove();
        }
      }, 300);
    });
    
    // Auto remove after duration
    setTimeout(() => {
      if (toast.parentNode) {
        toast.classList.remove('show');
        setTimeout(() => {
          if (toast.parentNode) {
            toast.remove();
          }
        }, 300);
      }
    }, 5000);
  }
}

// Initialize reviews system when page loads
document.addEventListener('DOMContentLoaded', function() {
  // Wait for Supabase to be available
  const initReviews = () => {
    if (window.supabase) {
      window.reviewsSystem = new RestaurantReviews();
    } else {
      setTimeout(initReviews, 100);
    }
  };
  
  setTimeout(initReviews, 1000);
});
</script>
`;

        // Find and replace any existing reviews section
        let found = false;
        
        // Try multiple patterns to find reviews section
        const patterns = [
            /<section class="section reviews">[\s\S]*?<\/section>/,
            /<section class="reviews">[\s\S]*?<\/section>/,
            /<section[^>]*>[\s\S]*?Customer Reviews[\s\S]*?<\/section>/,
            /<h2>Customer Reviews<\/h2>[\s\S]*?<\/section>/
        ];

        for (const pattern of patterns) {
            if (content.match(pattern)) {
                content = content.replace(pattern, newReviewsSection);
                found = true;
                break;
            }
        }

        // If no pattern matched, look for the section by content
        if (!found) {
            const reviewsIndex = content.indexOf('Customer Reviews');
            if (reviewsIndex !== -1) {
                // Find section boundaries
                let sectionStart = content.lastIndexOf('<section', reviewsIndex);
                let sectionEnd = content.indexOf('</section>', reviewsIndex);
                
                if (sectionStart !== -1 && sectionEnd !== -1) {
                    sectionEnd += 10; // Include </section>
                    const oldSection = content.substring(sectionStart, sectionEnd);
                    content = content.replace(oldSection, newReviewsSection);
                    found = true;
                }
            }
        }

        if (found) {
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

// Process all files
function processAllRestaurantFiles() {
    const cardsFolder = './cards';
    if (!fs.existsSync(cardsFolder)) {
        console.log(`❌ Cards folder not found: ${cardsFolder}`);
        return;
    }
    
    const files = fs.readdirSync(cardsFolder);
    let processedCount = 0;

    console.log(`Processing ${files.length} files...`);

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