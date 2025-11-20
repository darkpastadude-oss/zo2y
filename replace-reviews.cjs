<!-- REVIEW SYSTEM -->
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

<script type="module">
  import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

  const SUPABASE_URL = "https://gfkhjbztayjyojsgdpgk.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma2hqYnp0YXlqeW9qc2dkcGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwOTYyNjQsImV4cCI6MjA3NTY3MjI2NH0.WUb2yDAwCeokdpWCPeH13FE8NhWF6G8e6ivTsgu6b2s";

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  
  const restaurantId = 1; // change this per restaurant page
  let currentUser = null;
  let currentRating = 0;

  async function checkAuth() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (user) {
      currentUser = user;
      document.getElementById('review-form').style.display = 'block';
      document.getElementById('auth-prompt').style.display = 'none';
    }
  }

  async function loadReviews() {
    const container = document.getElementById('reviews-list');
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });

    if (!reviews || reviews.length === 0) {
      container.innerHTML = '<div class="reviews-empty">No reviews yet. Be the first to share your experience!</div>';
      return;
    }

    const userIds = [...new Set(reviews.map(r => r.user_id))];
    const { data: userProfiles } = await supabase
      .from('user_profiles')
      .select('id, username, full_name')
      .in('id', userIds);

    const userMap = {};
    if (userProfiles) userProfiles.forEach(p => userMap[p.id] = p);

    container.innerHTML = reviews.map(r => {
      const user = userMap[r.user_id];
      const displayName = user ? (user.full_name || user.username) : 'Anonymous User';
      const canDelete = currentUser && currentUser.id === r.user_id;
      return `
        <div class="review">
          <div class="review-header">
            <h4 class="reviewer-name">${displayName}</h4>
            <div class="review-rating">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</div>
            ${canDelete ? `<button class="delete-review" onclick="deleteReview('${r.id}')">Delete</button>` : ''}
          </div>
          <p class="review-comment">${r.comment}</p>
          <div class="review-date">${new Date(r.created_at).toLocaleDateString()}</div>
        </div>
      `;
    }).join('');
  }

  async function submitReview(e) {
    e.preventDefault();
    if (!currentUser) return alert('Sign in first');

    const comment = document.getElementById('review-comment').value.trim();
    if (!comment) return alert('Write a comment');
    if (currentRating === 0) return alert('Pick a rating');

    const { data: userProfile } = await supabase.from('user_profiles').select('username, full_name').eq('id', currentUser.id).single();
    const displayName = userProfile ? (userProfile.full_name || userProfile.username) : 'User';

    await supabase.from('reviews').insert({
      restaurant_id: restaurantId,
      user_id: currentUser.id,
      user_name: displayName,
      rating: currentRating,
      comment
    });

    document.getElementById('review-form').reset();
    currentRating = 0;
    updateStars();
    loadReviews();
  }

  async function deleteReview(id) {
    if (!currentUser || !confirm('Delete this review?')) return;
    await supabase.from('reviews').delete().eq('id', id).eq('user_id', currentUser.id);
    loadReviews();
  }

  function updateStars() {
    const stars = document.querySelectorAll('.star');
    stars.forEach(star => star.classList.toggle('active', parseInt(star.dataset.rating) <= currentRating));
    const texts = ['Select rating','Poor','Fair','Good','Very Good','Excellent'];
    document.getElementById('rating-text').textContent = texts[currentRating];
  }

  document.addEventListener('click', e => {
    if (e.target.classList.contains('star')) {
      currentRating = parseInt(e.target.dataset.rating);
      updateStars();
    }
  });

  document.getElementById('review-form').addEventListener('submit', submitReview);
  document.getElementById('review-comment').addEventListener('input', e => {
    document.querySelector('.char-count').textContent = `${e.target.value.length}/500`;
  });

  window.deleteReview = deleteReview;

  document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadReviews();
  });
</script>
