// replace-reviews.js
const fs = require('fs');
const path = require('path');

// Supabase config
const SUPABASE_URL = 'https://gfkhjbztayjyojsgdpgk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma2hqYnp0YXlqeW9qc2dkcGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwOTYyNjQsImV4cCI6MjA3NTY3MjI2NH0.WUb2yDAwCeokdpWCPeH13FE8NhWF6G8e6ivTsgu6b2s';

// Map filenames to restaurant IDs
const restaurantIdMap = {
  mori: 1, kilo: 2, hameed: 3, bazooka: 4, mexican: 5, chikin: 6, vasko: 7, secondcup: 8,
  station: 9, brgr: 10, country: 11, bayoki: 12, maine: 13, barbar: 14, labash: 15, pickl: 16,
  akleh: 17, howlin: 18, sauce: 19, papa: 20, qasr: 21, heart: 22, what: 23, buffalo: 24,
  mince: 25, '88': 26, kansas: 27, ward: 28, willys: 29, butchers: 30, hashville: 31, dawgs: 32,
  holmes: 33, ribs: 34, peking: 35, wok: 36, daddy: 37, husk: 38, crispy: 39, lord: 40,
  chez: 41, mario: 42, crumbs: 43, man: 44, pasta: 45, crave: 46, caizo: 47, pablo: 48,
  panda: 49, tabali: 50
};

const CARDS_FOLDER = path.join(__dirname, 'cards');

function updateAllFiles() {
  const files = fs.readdirSync(CARDS_FOLDER).filter(f => f.endsWith('.html'));

  files.forEach(file => {
    const name = file.replace('.html', '').toLowerCase();
    const restaurantId = restaurantIdMap[name];
    if (!restaurantId) {
      console.log(`Skipping ${file}: no ID found.`);
      return;
    }

    const filePath = path.join(CARDS_FOLDER, file);
    let html = fs.readFileSync(filePath, 'utf8');

    // Remove ANY existing review sections (clean up duplicates)
    html = html.replace(/<section class="section reviews"[\s\S]*?<\/section>/gi, '');
    html = html.replace(/<!-- REVIEW SYSTEM -->[\s\S]*?<\/script>/gi, '');
    html = html.replace(/<script>[\s\S]*?Review System[\s\S]*?<\/script>/gi, '');

    // Create the new reviews section
    const reviewsSection = `<!-- REVIEW SYSTEM -->
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
// Initialize Supabase first
const supabaseUrl = 'https://gfkhjbztayjyojsgdpgk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma2hqYnp0YXlqeW9qc2dkcGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwOTYyNjQsImV4cCI6MjA3NTY3MjI2NH0.WUb2yDAwCeokdpWCPeH13FE8NhWF6G8e6ivTsgu6b2s';

// Check if Supabase is already loaded, if not load it
if (typeof supabase === 'undefined') {
  // Load Supabase from CDN
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
  script.onload = initReviewSystem;
  document.head.appendChild(script);
} else {
  initReviewSystem();
}

function initReviewSystem() {
  // Create Supabase client
  const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
  const restaurantId = ${restaurantId};
  
  console.log('Review system initialized for restaurant:', restaurantId);

  // Review System with Profile-style Authentication
  document.addEventListener('DOMContentLoaded', function() {
      let currentUser = null;
      let currentRating = 0;

      // Check authentication (same as profile page)
      async function checkAuth() {
          try {
              console.log('Checking authentication...');
              const { data: { user }, error } = await supabase.auth.getUser();
              if (error) {
                  console.error('Auth error:', error);
                  return;
              }

              if (user) {
                  currentUser = user;
                  console.log('User authenticated:', user.email);
                  document.getElementById('review-form').style.display = 'block';
                  document.getElementById('auth-prompt').style.display = 'none';
              } else {
                  console.log('User not authenticated');
                  document.getElementById('review-form').style.display = 'none';
                  document.getElementById('auth-prompt').style.display = 'block';
              }
          } catch (error) {
              console.error('Error checking auth:', error);
          }
      }

      // Load reviews
      async function loadReviews() {
          const container = document.getElementById('reviews-list');
          if (!container) {
              console.error('Reviews container not found!');
              return;
          }

          try {
              console.log('Loading reviews...');
              const { data: reviews, error } = await supabase
                  .from('reviews')
                  .select('*')
                  .eq('restaurant_id', restaurantId)
                  .order('created_at', { ascending: false });

              if (error) throw error;

              if (!reviews || reviews.length === 0) {
                  container.innerHTML = '<div class="reviews-empty">No reviews yet. Be the first to share your experience!</div>';
                  console.log('No reviews found');
                  return;
              }

              console.log('Found ' + reviews.length + ' reviews');

              // Get user profiles for proper names
              const userIds = [...new Set(reviews.map(r => r.user_id))];
              const { data: userProfiles } = await supabase
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
                  const displayName = user ? (user.full_name || user.username) : 'Anonymous User';
                  const canDelete = currentUser && currentUser.id === review.user_id;
                  
                  return '<div class="review">' +
                      '<div class="review-header">' +
                          '<h4 class="reviewer-name">' + displayName + '</h4>' +
                          '<div class="review-rating">' + '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating) + '</div>' +
                          (canDelete ? 
                              '<div class="review-actions">' +
                                  '<button class="delete-review" onclick="deleteReview(\\'' + review.id + '\\')">' +
                                      '<i class="fas fa-trash"></i> Delete' +
                                  '</button>' +
                              '</div>' 
                          : '') +
                      '</div>' +
                      '<p class="review-comment">' + review.comment + '</p>' +
                      '<div class="review-date">' + new Date(review.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long', 
                          day: 'numeric'
                      }) + '</div>' +
                  '</div>';
              }).join('');

          } catch (error) {
              console.error('Error loading reviews:', error);
              container.innerHTML = '<div class="reviews-empty">Error loading reviews</div>';
          }
      }

      // Submit review
      async function submitReview(e) {
          e.preventDefault();
          
          if (!currentUser) {
              alert('Please sign in to submit a review');
              window.location.href = '../login.html';
              return;
          }

          const comment = document.getElementById('review-comment').value.trim();
          if (!comment) {
              alert('Please write a review comment');
              return;
          }

          if (currentRating === 0) {
              alert('Please select a rating');
              return;
          }

          try {
              // Get user profile for proper name
              const { data: userProfile } = await supabase
                  .from('user_profiles')
                  .select('username, full_name')
                  .eq('id', currentUser.id)
                  .single();

              const displayName = userProfile ? (userProfile.full_name || userProfile.username) : 'User';

              const { error } = await supabase
                  .from('reviews')
                  .insert({
                      restaurant_id: restaurantId,
                      user_id: currentUser.id,
                      user_name: displayName,
                      rating: currentRating,
                      comment: comment
                  });

              if (error) throw error;

              // Reset form
              document.getElementById('review-form').reset();
              currentRating = 0;
              updateStars();
              
              const charCount = document.querySelector('.char-count');
              if (charCount) charCount.textContent = '0/500';

              // Reload reviews
              await loadReviews();
              alert('Review submitted successfully!');

          } catch (error) {
              console.error('Error submitting review:', error);
              alert('Error submitting review. Please try again.');
          }
      }

      // Delete review
      async function deleteReview(reviewId) {
          if (!currentUser || !confirm('Are you sure you want to delete this review?')) {
              return;
          }

          try {
              const { error } = await supabase
                  .from('reviews')
                  .delete()
                  .eq('id', reviewId)
                  .eq('user_id', currentUser.id);

              if (error) throw error;

              await loadReviews();
              alert('Review deleted successfully');

          } catch (error) {
              console.error('Error deleting review:', error);
              alert('Error deleting review');
          }
      }

      // Star rating
      function updateStars() {
          const stars = document.querySelectorAll('.star');
          const ratingText = document.getElementById('rating-text');
          
          stars.forEach(star => {
              const rating = parseInt(star.dataset.rating);
              star.classList.toggle('active', rating <= currentRating);
          });
          
          const texts = ['Select rating', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
          if (ratingText) {
              ratingText.textContent = texts[currentRating] || 'Select rating';
          }
      }

      // Event listeners
      document.addEventListener('click', (e) => {
          if (e.target.classList.contains('star')) {
              currentRating = parseInt(e.target.dataset.rating);
              updateStars();
          }
      });

      const reviewForm = document.getElementById('review-form');
      if (reviewForm) {
          reviewForm.addEventListener('submit', submitReview);
      }

      // Character count
      const commentTextarea = document.getElementById('review-comment');
      if (commentTextarea) {
          commentTextarea.addEventListener('input', function(e) {
              const count = e.target.value.length;
              const charCount = document.querySelector('.char-count');
              if (charCount) charCount.textContent = count + '/500';
          });
      }

      // Make deleteReview global
      window.deleteReview = deleteReview;

      // Initialize
      checkAuth();
      loadReviews();
  });
}
</script>`;

    // ALWAYS add the review section before closing body tag
    if (html.includes('</body>')) {
        html = html.replace('</body>', reviewsSection + '\n</body>');
    } else {
        // If no body tag, just append to the end
        html += reviewsSection;
    }
    
    fs.writeFileSync(filePath, html);
    console.log('ADDED REVIEW SYSTEM TO: ' + file);
  });

  console.log('\nALL FILES UPDATED!');
  console.log('Now open any restaurant page and scroll to the bottom to see the review section!');
}

updateAllFiles();