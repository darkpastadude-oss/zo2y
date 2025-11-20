// aggressive-replace-reviews.js
const fs = require('fs');
const path = require('path');

// Function to find and replace ANY review section in a single file
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
.reviews-container { max-height: 500px; overflow-y: auto; padding-right: 10px; }
.review { border-bottom: 1px solid var(--nav-shadow); padding: 15px 0; position: relative; }
.review:last-child { border-bottom: none; }
.review-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; position: relative; }
.reviewer-name { font-weight: 600; color: var(--text); margin: 0; flex: 1; padding-right: 80px; }
.review-rating { color: #FF9800; font-size: 0.9rem; position: absolute; right: 0; top: 0; }
.review-comment { margin: 0; color: var(--text2); line-height: 1.5; padding-right: 0; }
.review-date { font-size: 0.8rem; color: var(--text2); margin-top: 5px; }
.review-actions { position: absolute; top: 0; right: 0; }
.delete-review { background: none; border: none; color: #ff4444; cursor: pointer; padding: 5px 8px; border-radius: 4px; font-size: 0.8rem; transition: all 0.3s ease; margin-left: 10px; }
.delete-review:hover { background: rgba(255, 68, 68, 0.1); transform: scale(1.1); }
.review-input-group { display: flex; gap: 15px; margin-bottom: 15px; flex-wrap: wrap; justify-content: space-between; }
.rating-input { display: flex; align-items: center; gap: 10px; flex: 1; }
.stars { display: flex; gap: 2px; }
.star { font-size: 1.5rem; color: #ddd; cursor: pointer; transition: color 0.2s ease; user-select: none; }
.star:hover, .star.active { color: #FF9800; transform: scale(1.1); }
.rating-text { font-size: 0.9rem; color: var(--text2); min-width: 100px; }
.review-form-actions { display: flex; justify-content: space-between; align-items: center; margin-top: 15px; }
.char-count { font-size: 0.8rem; color: var(--text2); }
.reviews-loading, .reviews-empty { text-align: center; padding: 40px 20px; color: var(--text2); font-style: italic; }
.auth-prompt-review { text-align: center; padding: 20px; background: var(--card); border-radius: 8px; margin-top: 20px; border: 1px solid var(--nav-shadow); }
.custom-toast { position: fixed; top: 20px; right: 20px; background: var(--card); border: 1px solid var(--nav-shadow); border-left: 4px solid #FF9800; border-radius: 8px; padding: 16px 20px; display: flex; align-items: center; gap: 12px; box-shadow: 0 8px 25px rgba(0,0,0,0.3); z-index: 10000; transform: translateX(400px); transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1); max-width: 350px; backdrop-filter: blur(10px); }
.custom-toast.show { transform: translateX(0); }
.custom-toast.success { border-left-color: #10b981; }
.custom-toast.error { border-left-color: #ef4444; }
.custom-toast.warning { border-left-color: #f59e0b; }
.custom-toast.info { border-left-color: #3b82f6; }
.toast-icon { font-size: 20px; flex-shrink: 0; }
.toast-success .toast-icon { color: #10b981; }
.toast-error .toast-icon { color: #ef4444; }
.toast-warning .toast-icon { color: #f59e0b; }
.toast-info .toast-icon { color: #3b82f6; }
.toast-content { flex: 1; }
.toast-title { font-weight: 600; margin-bottom: 4px; color: var(--text); }
.toast-message { font-size: 14px; color: var(--text2); line-height: 1.4; }
.toast-close { background: none; border: none; color: var(--text2); cursor: pointer; padding: 4px; border-radius: 4px; transition: all 0.2s ease; flex-shrink: 0; }
.toast-close:hover { background: rgba(255,255,255,0.1); color: var(--text); }
.reviews-container::-webkit-scrollbar { width: 6px; }
.reviews-container::-webkit-scrollbar-track { background: var(--nav-bg); border-radius: 3px; }
.reviews-container::-webkit-scrollbar-thumb { background: #FF9800; border-radius: 3px; }
.reviews-container::-webkit-scrollbar-thumb:hover { background: #F57C00; }
@media (max-width: 768px) {
  .review-header { flex-direction: column; align-items: flex-start; }
  .reviewer-name { padding-right: 0; margin-bottom: 8px; }
  .review-rating { position: static; margin-bottom: 8px; }
  .review-actions { position: static; align-self: flex-end; }
  .review-input-group { flex-direction: column; gap: 10px; }
  .rating-input { justify-content: space-between; }
  .custom-toast { top: 10px; right: 10px; left: 10px; max-width: none; }
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

    const comment = document.getElementById('review-comment').value.trim();

    if (!comment || this.currentRating === 0) {
      this.showNotification('Please fill in all fields and select a rating', 'warning');
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
    // Remove any existing toasts
    const existingToasts = document.querySelectorAll('.custom-toast');
    existingToasts.forEach(toast => toast.remove());

    const toast = document.createElement('div');
    toast.className = \`custom-toast \${type}\`;
    
    const icons = {
      success: 'fas fa-check-circle',
      error: 'fas fa-exclamation-circle',
      warning: 'fas fa-exclamation-triangle',
      info: 'fas fa-info-circle'
    };
    
    const titles = {
      success: 'Success!',
      error: 'Error!',
      warning: 'Warning!',
      info: 'Info'
    };
    
    toast.innerHTML = \`
      <i class="\${icons[type]} toast-icon"></i>
      <div class="toast-content">
        <div class="toast-title">\${titles[type]}</div>
        <div class="toast-message">\${message}</div>
      </div>
      <button class="toast-close">&times;</button>
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

// Initialize reviews system when Supabase is ready
window.addEventListener('DOMContentLoaded', function() {
  setTimeout(() => {
    if (window.supabase) {
      window.reviewsSystem = new RestaurantReviews();
    } else {
      console.error('Supabase not loaded');
    }
  }, 1000);
});
</script>
`;

        // STRATEGY: Find ANYTHING that looks like reviews and replace it
        
        // 1. First, let's find the exact structure by looking for common patterns
        let oldContent = '';
        
        // Look for common review section patterns
        const reviewPatterns = [
            // Pattern 1: Section with reviews class
            /<section[^>]*class="[^"]*reviews[^"]*"[^>]*>[\s\S]*?<\/section>/i,
            // Pattern 2: Any section containing "Customer Reviews"
            /<section[^>]*>[\s\S]*?Customer Reviews[\s\S]*?<\/section>/i,
            // Pattern 3: Any section containing "Add Your Review" 
            /<section[^>]*>[\s\S]*?Add Your Review[\s\S]*?<\/section>/i,
            // Pattern 4: Any div containing reviews
            /<div[^>]*>[\s\S]*?Customer Reviews[\s\S]*?<\/div>/i,
            // Pattern 5: Look for the specific content from your screenshot
            /<h2>Customer Reviews<\/h2>[\s\S]*?Submit Review[\s\S]*?<\/section>/i,
            // Pattern 6: Look for review form
            /<form[^>]*>[\s\S]*?Submit Review[\s\S]*?<\/form>/i
        ];

        for (const pattern of reviewPatterns) {
            const match = content.match(pattern);
            if (match) {
                oldContent = match[0];
                console.log(`✅ Found review section with pattern in ${filePath}`);
                break;
            }
        }

        // 2. If no pattern matched, try to find by content markers
        if (!oldContent) {
            const reviewsIndex = content.indexOf('Customer Reviews');
            if (reviewsIndex !== -1) {
                console.log(`📍 Found "Customer Reviews" text in ${filePath}, attempting smart replacement`);
                
                // Find the start of the section
                let sectionStart = content.lastIndexOf('<section', reviewsIndex);
                if (sectionStart === -1) sectionStart = content.lastIndexOf('<div', reviewsIndex);
                
                // Find the end of the section
                let sectionEnd = content.indexOf('</section>', reviewsIndex);
                if (sectionEnd === -1) sectionEnd = content.indexOf('</div>', reviewsIndex);
                if (sectionEnd === -1) sectionEnd = content.indexOf('<footer', reviewsIndex);
                if (sectionEnd === -1) sectionEnd = content.indexOf('<section', reviewsIndex + 100);
                
                if (sectionStart !== -1 && sectionEnd !== -1 && sectionEnd > sectionStart) {
                    oldContent = content.substring(sectionStart, sectionEnd + (content.substring(sectionEnd, sectionEnd + 10).includes('</section>') ? 10 : 6));
                }
            }
        }

        // 3. If we found something to replace, replace it
        if (oldContent) {
            content = content.replace(oldContent, newReviewsSection);
            console.log(`✅ Replaced review section in: ${filePath}`);
        } else {
            // 4. LAST RESORT: Find where to insert the new reviews section
            console.log(`❌ No review section found in ${filePath}, attempting to insert before footer`);
            
            // Look for common insertion points
            const footerIndex = content.indexOf('<footer');
            const closingBodyIndex = content.indexOf('</body>');
            const scriptIndex = content.indexOf('<script>', content.indexOf('</section>'));
            
            let insertIndex = footerIndex !== -1 ? footerIndex : 
                            closingBodyIndex !== -1 ? closingBodyIndex : 
                            scriptIndex !== -1 ? scriptIndex : -1;
            
            if (insertIndex !== -1) {
                content = content.slice(0, insertIndex) + newReviewsSection + content.slice(insertIndex);
                console.log(`✅ Inserted new review section in: ${filePath}`);
            } else {
                console.log(`❌ Could not find insertion point in: ${filePath}`);
                return false;
            }
        }

        // Add the script before the closing body tag
        if (content.includes('</body>')) {
            content = content.replace('</body>', reviewsScript + '\n</body>');
        }
        
        fs.writeFileSync(filePath, content, 'utf8');
        return true;
        
    } catch (error) {
        console.error(`Error processing ${filePath}:`, error);
        return false;
    }
}

// Function to process all HTML files in the cards folder
function processAllRestaurantFiles() {
    const cardsFolder = './cards';
    if (!fs.existsSync(cardsFolder)) {
        console.log(`❌ Cards folder not found: ${cardsFolder}`);
        return;
    }
    
    const files = fs.readdirSync(cardsFolder);
    let processedCount = 0;
    let errorCount = 0;

    console.log(`Found ${files.length} files in cards folder`);

    files.forEach(file => {
        if (file.endsWith('.html')) {
            const filePath = path.join(cardsFolder, file);
            if (replaceReviewsInFile(filePath)) {
                processedCount++;
            } else {
                errorCount++;
            }
        }
    });

    console.log(`\n🎉 FINAL RESULTS:`);
    console.log(`✅ Successfully updated: ${processedCount} files`);
    console.log(`❌ Failed to update: ${errorCount} files`);
    
    if (errorCount > 0) {
        console.log(`\n💡 TIP: If many files failed, the review section might have a different structure.`);
        console.log(`   Run the debug script to see what's actually in your files.`);
    }
}

// Run the aggressive script
processAllRestaurantFiles();