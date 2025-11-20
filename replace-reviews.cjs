// fix-reviews-complete.js
const fs = require('fs');
const path = require('path');

const CARDS_FOLDER = path.join(__dirname, 'cards');

// Supabase config
const SUPABASE_URL = 'https://gfkhjbztayjyojsgdpgk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma2hqYnp0YXlqeW9qc2dkcGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwOTYyNjQsImV4cCI6MjA3NTY3MjI2NH0.WUb2yDAwCeokdpWCPeH13FE8NhWF6G8e6ivTsgu6b2s';

const restaurantIdMap = {
  mori: 1, kilo: 2, hameed: 3, bazooka: 4, mexican: 5, chikin: 6, vasko: 7, secondcup: 8,
  station: 9, brgr: 10, country: 11, bayoki: 12, maine: 13, barbar: 14, labash: 15, pickl: 16,
  akleh: 17, howlin: 18, sauce: 19, papa: 20, qasr: 21, heart: 22, what: 23, buffalo: 24,
  mince: 25, '88': 26, kansas: 27, ward: 28, willys: 29, butchers: 30, hashville: 31, dawgs: 32,
  holmes: 33, ribs: 34, peking: 35, wok: 36, daddy: 37, husk: 38, crispy: 39, lord: 40,
  chez: 41, mario: 42, crumbs: 43, man: 44, pasta: 45, crave: 46, caizo: 47, pablo: 48,
  panda: 49, tabali: 50
};

function cleanupFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let originalLength = content.length;
        
        console.log(`\n🔧 Cleaning up: ${path.basename(filePath)}`);
        
        // Remove ALL review-related scripts
        const reviewScriptPatterns = [
            /<script>[\s\S]*?RestaurantReviews[\s\S]*?<\/script>/gi,
            /<script>[\s\S]*?reviewsSystem[\s\S]*?<\/script>/gi,
            /<script>[\s\S]*?class RestaurantReviews[\s\S]*?<\/script>/gi,
            /<script>[\s\S]*?window\.reviewsSystem[\s\S]*?<\/script>/gi,
            /<script type="module">[\s\S]*?reviews[\s\S]*?<\/script>/gi,
            /<script>[\s\S]*?\/\/ Reviews System[\s\S]*?<\/script>/gi,
            /<script>[\s\S]*?\/\/ SINGLE REVIEW SYSTEM[\s\S]*?<\/script>/gi
        ];
        
        let scriptsRemoved = 0;
        reviewScriptPatterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) {
                scriptsRemoved += matches.length;
                content = content.replace(pattern, '');
            }
        });
        
        // Remove duplicate review sections (keep only one)
        const reviewSectionPattern = /<section class="section reviews"[\s\S]*?<\/section>/gi;
        const sectionMatches = content.match(reviewSectionPattern);
        
        let sectionsRemoved = 0;
        if (sectionMatches && sectionMatches.length > 1) {
            // Keep only the first occurrence
            sectionsRemoved = sectionMatches.length - 1;
            let firstMatch = true;
            content = content.replace(reviewSectionPattern, (match) => {
                if (firstMatch) {
                    firstMatch = false;
                    return match;
                }
                return '';
            });
        }
        
        // Clean up extra whitespace
        content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
        content = content.replace(/<script><\/script>/g, '');
        
        const newLength = content.length;
        
        if (scriptsRemoved > 0 || sectionsRemoved > 0) {
            console.log(`✅ Removed: ${scriptsRemoved} scripts, ${sectionsRemoved} sections`);
            console.log(`📉 Reduced by: ${originalLength - newLength} bytes`);
            
            fs.writeFileSync(filePath, content, 'utf8');
            return true;
        } else {
            console.log(`✅ No duplicates found`);
            return false;
        }
        
    } catch (error) {
        console.error(`❌ Error cleaning file:`, error);
        return false;
    }
}

function addCleanReviewSystem(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        const name = path.basename(filePath, '.html').toLowerCase();
        const restaurantId = restaurantIdMap[name];
        
        if (!restaurantId) {
            console.log(`❌ Skipping: No ID for ${name}`);
            return false;
        }

        // Check if a clean review system already exists
        if (content.includes('CLEAN_REVIEW_SYSTEM_V1')) {
            console.log(`⏩ Clean system already exists in: ${path.basename(filePath)}`);
            return false;
        }

        // Remove any remaining review sections before adding new one
        content = content.replace(/<section class="section reviews"[\s\S]*?<\/section>/gi, '');

        const cleanReviewSystem = `
<!-- CLEAN_REVIEW_SYSTEM_V1 -->
<section class="section reviews" id="reviews-section">
  <h2>Customer Reviews</h2>
  <div id="reviews-list">
    <div class="reviews-loading">Loading reviews...</div>
  </div>
  
  <h3 style="margin-top: 30px; font-size: 1.2rem;">Add Your Review</h3>
  <form id="review-form" style="display:none;">
    <div style="margin-bottom: 20px;">
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 15px; flex-wrap: wrap;">
        <span style="font-weight: 500;">Rating:</span>
        <div class="stars">
          <span class="star" data-rating="1">★</span>
          <span class="star" data-rating="2">★</span>
          <span class="star" data-rating="3">★</span>
          <span class="star" data-rating="4">★</span>
          <span class="star" data-rating="5">★</span>
        </div>
        <span id="rating-text" style="color: var(--text2); min-width: 100px;">Select rating</span>
      </div>
    </div>
    <textarea 
      id="review-comment" 
      placeholder="Share your experience..." 
      rows="4" 
      style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid var(--nav-shadow); background: var(--input-bg); color: var(--input-text); font-family: inherit;"
      required
      maxlength="500"
    ></textarea>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px;">
      <button type="submit" class="btn">Submit Review</button>
      <span class="char-count" style="font-size: 0.8rem; color: var(--text2);">0/500</span>
    </div>
  </form>
  <div id="auth-prompt" style="text-align: center; padding: 20px; background: var(--card); border-radius: 8px; margin-top: 20px; border: 1px solid var(--nav-shadow);">
    <p>Please <a href="../login.html" style="color: #FF9800; text-decoration: underline;">sign in</a> to submit a review.</p>
  </div>
</section>

<style>
.stars { display: flex; gap: 4px; }
.star { 
  font-size: 1.8rem; 
  color: #ddd; 
  cursor: pointer; 
  transition: all 0.2s ease; 
  user-select: none;
}
.star:hover, .star.active { 
  color: #FF9800; 
  transform: scale(1.2); 
}
.review { 
  border-bottom: 1px solid var(--nav-shadow); 
  padding: 20px 0; 
  position: relative; 
}
.review:last-child { border-bottom: none; }
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
  position: absolute; 
  right: 0; 
  top: 0; 
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
  border: 1px solid transparent;
}
.delete-review:hover { 
  background: rgba(255, 68, 68, 0.1); 
  border-color: #ff4444;
}
.reviews-loading, .reviews-empty { 
  text-align: center; 
  padding: 40px 20px; 
  color: var(--text2); 
  font-style: italic; 
}

@media (max-width: 768px) {
  .review-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  .reviewer-name {
    padding-right: 0;
  }
  .review-rating {
    position: static;
  }
  .review-actions {
    position: static;
    align-self: flex-end;
  }
}
</style>

<script>
// SINGLE CLEAN REVIEW SYSTEM - DO NOT DUPLICATE
if (!window.cleanReviewSystemLoaded) {
  window.cleanReviewSystemLoaded = true;
  
  class CleanRestaurantReviews {
    constructor() {
      this.supabase = window.supabase;
      this.restaurantId = ${restaurantId};
      this.currentRating = 0;
      console.log('🔄 Loading clean review system for restaurant:', this.restaurantId);
      this.init();
    }

    async init() {
      await this.checkAuth();
      this.setupEventListeners();
      await this.loadReviews();
    }

    async checkAuth() {
      const { data: { session } } = await this.supabase.auth.getSession();
      this.currentUser = session?.user || null;
      
      const reviewForm = document.getElementById('review-form');
      const authPrompt = document.getElementById('auth-prompt');
      
      if (reviewForm && authPrompt) {
        reviewForm.style.display = this.currentUser ? 'block' : 'none';
        authPrompt.style.display = this.currentUser ? 'none' : 'block';
      }
    }

    setupEventListeners() {
      // Star rating
      document.addEventListener('click', (e) => {
        if (e.target.classList.contains('star')) {
          this.currentRating = parseInt(e.target.dataset.rating);
          this.updateStars();
        }
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

      // Form submission
      const reviewForm = document.getElementById('review-form');
      if (reviewForm) {
        reviewForm.addEventListener('submit', (e) => this.submitReview(e));
      }
    }

    updateStars() {
      const stars = document.querySelectorAll('.star');
      const ratingText = document.getElementById('rating-text');
      
      stars.forEach(star => {
        const rating = parseInt(star.dataset.rating);
        star.classList.toggle('active', rating <= this.currentRating);
      });
      
      const texts = ['Select rating', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
      if (ratingText) {
        ratingText.textContent = texts[this.currentRating] || 'Select rating';
      }
    }

    async loadReviews() {
      const container = document.getElementById('reviews-list');
      if (!container) return;

      try {
        const { data: reviews, error } = await this.supabase
          .from('reviews')
          .select('*')
          .eq('restaurant_id', this.restaurantId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (!reviews || reviews.length === 0) {
          container.innerHTML = '<div class="reviews-empty">No reviews yet. Be the first to share your experience!</div>';
          return;
        }

        // Get user profiles for proper names
        const userIds = [...new Set(reviews.map(r => r.user_id))];
        const { data: userProfiles } = await this.supabase
          .from('user_profiles')
          .select('id, username, full_name')
          .in('id', userIds);

        const userMap = {};
        if (userProfiles) {
          userProfiles.forEach(profile => {
            userMap[profile.id] = profile;
          });
        }

        container.innerHTML = reviews.map(review => {
          const user = userMap[review.user_id];
          const displayName = user ? (user.full_name || user.username) : review.user_name;
          const canDelete = this.currentUser && this.currentUser.id === review.user_id;
          
          return \`
            <div class="review">
              <div class="review-header">
                <h4 class="reviewer-name">\${this.escapeHtml(displayName)}</h4>
                <div class="review-rating">\${'★'.repeat(review.rating)}\${'☆'.repeat(5 - review.rating)}</div>
                \${canDelete ? \`
                  <div class="review-actions">
                    <button class="delete-review" onclick="window.cleanReviews.deleteReview('\${review.id}')">
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

      } catch (error) {
        console.error('Error loading reviews:', error);
        container.innerHTML = '<div class="reviews-empty">Error loading reviews</div>';
      }
    }

    async submitReview(e) {
      e.preventDefault();
      
      if (!this.currentUser) {
        alert('Please sign in to submit a review');
        return;
      }

      const commentEl = document.getElementById('review-comment');
      const comment = commentEl ? commentEl.value.trim() : '';

      if (!comment) {
        alert('Please write a review comment');
        return;
      }

      if (this.currentRating === 0) {
        alert('Please select a rating');
        return;
      }

      try {
        // Get user profile for proper name
        const { data: userProfile } = await this.supabase
          .from('user_profiles')
          .select('username, full_name')
          .eq('id', this.currentUser.id)
          .single();

        const displayName = userProfile ? (userProfile.full_name || userProfile.username) : 'User';

        const { error } = await this.supabase
          .from('reviews')
          .insert({
            restaurant_id: this.restaurantId,
            user_id: this.currentUser.id,
            user_name: displayName,
            rating: this.currentRating,
            comment: comment
          });

        if (error) throw error;

        // Reset form
        const reviewForm = document.getElementById('review-form');
        if (reviewForm) reviewForm.reset();
        
        this.currentRating = 0;
        this.updateStars();
        
        const charCount = document.querySelector('.char-count');
        if (charCount) charCount.textContent = '0/500';

        // Reload reviews
        await this.loadReviews();

        alert('Review submitted successfully! 🎉');

      } catch (error) {
        console.error('Error submitting review:', error);
        alert('Error submitting review. Please try again.');
      }
    }

    async deleteReview(reviewId) {
      if (!this.currentUser || !confirm('Are you sure you want to delete this review?')) {
        return;
      }

      try {
        const { error } = await this.supabase
          .from('reviews')
          .delete()
          .eq('id', reviewId)
          .eq('user_id', this.currentUser.id);

        if (error) throw error;

        await this.loadReviews();
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

  // Initialize when page is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        if (window.supabase) {
          window.cleanReviews = new CleanRestaurantReviews();
        }
      }, 1000);
    });
  } else {
    setTimeout(() => {
      if (window.supabase) {
        window.cleanReviews = new CleanRestaurantReviews();
      }
    }, 1000);
  }
}
</script>
`;

        // Add before closing body tag
        if (content.includes('</body>')) {
            content = content.replace('</body>', cleanReviewSystem + '\n</body>');
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ Added clean review system to: ${path.basename(filePath)}`);
            return true;
        }
        
    } catch (error) {
        console.error(`❌ Error adding system to ${filePath}:`, error);
    }
    return false;
}

function processAllFiles() {
    if (!fs.existsSync(CARDS_FOLDER)) {
        console.log('❌ Cards folder not found');
        return;
    }

    const files = fs.readdirSync(CARDS_FOLDER).filter(f => f.endsWith('.html'));
    
    console.log('🧹 STEP 1: Cleaning up duplicate scripts...');
    let cleanedCount = 0;
    files.forEach(file => {
        const filePath = path.join(CARDS_FOLDER, file);
        if (cleanupFile(filePath)) {
            cleanedCount++;
        }
    });

    console.log(`\n🧹 Cleaned ${cleanedCount} files`);

    console.log('\n🚀 STEP 2: Adding clean review systems...');
    let addedCount = 0;
    files.forEach(file => {
        const filePath = path.join(CARDS_FOLDER, file);
        if (addCleanReviewSystem(filePath)) {
            addedCount++;
        }
    });

    console.log(`\n✅ Added clean systems to ${addedCount} files`);
    console.log('\n🎉 All done! Your review systems are now clean and working.');
}

// Run the complete process
processAllFiles();