const fs = require('fs');
const path = require('path');

// The fixed review system code
const reviewSystemCode = `<!-- REVIEW SYSTEM -->
<section class="section reviews" id="reviews-section">
  <h2>Customer Reviews</h2>
  <div id="reviews-list"><div class="reviews-loading">Loading reviews...</div></div>

  <h3>Add / Edit Your Review</h3>
  <form id="review-form" style="display:none;">
    <div class="rating-wrapper">
      <span>Rating:</span>
      <div class="stars">
        <span class="star" data-rating="1">★</span>
        <span class="star" data-rating="2">★</span>
        <span class="star" data-rating="3">★</span>
        <span class="star" data-rating="4">★</span>
        <span class="star" data-rating="5">★</span>
      </div>
      <span id="rating-text">Select rating</span>
    </div>
    <textarea id="review-comment" placeholder="Share your experience..." rows="4" maxlength="500"></textarea>
    <div>
      <button type="submit">Submit Review</button>
      <span class="char-count">0/500</span>
    </div>
  </form>

  <div id="auth-prompt">
    <p>Please <a href="login.html">sign in</a> to submit a review.</p>
  </div>
</section>

<script type="module">
  import { createClient } from "https://esm.sh/@supabase/supabase-js@2.26.0";

  const SUPABASE_URL = "https://gfkhjbztayjyojsgdpgk.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma2hqYnp0YXlqeW9qc2dkcGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwOTYyNjQsImV4cCI6MjA3NTY3MjI2NH0.WUb2yDAwCeokdpWCPeH13FE8NhWF6G8e6ivTsgu6b2s";

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // map filenames to restaurant IDs
  const restaurantIdMap = {
    mori: 1, kilo: 2, hameed: 3, bazooka: 4, mexican: 5, chikin: 6, vasko: 7, secondcup: 8,
    station: 9, brgr: 10, country: 11, bayoki: 12, maine: 13, barbar: 14, labash: 15, pickl: 16,
    akleh: 17, howlin: 18, sauce: 19, papa: 20, qasr: 21, heart: 22, what: 23, buffalo: 24,
    mince: 25, '88': 26, kansas: 27, ward: 28, willys: 29, butchers: 30, hashville: 31, dawgs: 32,
    holmes: 33, ribs: 34, peking: 35, wok: 36, daddy: 37, husk: 38, crispy: 39, lord: 40,
    chez: 41, mario: 42, crumbs: 43, man: 44, pasta: 45, crave: 46, caizo: 47, pablo: 48,
    panda: 49, tabali: 50
  };

  const currentFile = window.location.pathname.split("/").pop().replace(".html","").toLowerCase();
  const restaurantId = restaurantIdMap[currentFile];

  let currentUser = null;
  let currentRating = 0;
  let editingReviewId = null;

  async function checkAuth() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      currentUser = user || null;
      document.getElementById('review-form').style.display = user ? 'block' : 'none';
      document.getElementById('auth-prompt').style.display = user ? 'none' : 'block';
    } catch(err){ console.error(err); }
  }

  async function loadReviews() {
    const container = document.getElementById('reviews-list');
    if(!container) return;
    try {
      const { data: reviews } = await supabase
        .from('reviews')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });

      if(!reviews || reviews.length===0){
        container.innerHTML = '<div class="reviews-empty">No reviews yet. Be the first!</div>';
        return;
      }

      const userIds = [...new Set(reviews.map(r=>r.user_id))];
      const { data: users } = await supabase
        .from('user_profiles')
        .select('id, username, full_name')
        .in('id', userIds);

      const userMap = {};
      users?.forEach(u => userMap[u.id] = u);

      container.innerHTML = reviews.map(r => {
        const u = userMap[r.user_id];
        const name = u ? (u.full_name || u.username) : 'Anonymous';
        const canEdit = currentUser && currentUser.id === r.user_id;
        return \`<div class="review" id="review-\${r.id}">
                  <div class="review-header">
                    <h4 class="reviewer-name">\${name}</h4>
                    <div class="review-rating">\${'★'.repeat(r.rating)+'☆'.repeat(5-r.rating)}</div>
                    \${canEdit?\`
                    <div class="review-actions">
                      <button onclick="startEditReview('\${r.id}',\'\${r.comment.replace(/'/g, "\\\\'")}\',\${r.rating})">Edit</button>
                      <button onclick="deleteReview('\${r.id}')">Delete</button>
                    </div>\`:''}
                  </div>
                  <p class="review-comment">\${r.comment}</p>
                  <div class="review-date">\${new Date(r.created_at).toLocaleDateString()}</div>
                </div>\`;
      }).join('');
    } catch(err){ console.error(err); container.innerHTML='<div class="reviews-empty">Error loading reviews</div>'; }
  }

  function updateStars(){
    document.querySelectorAll('.star').forEach(s=>{
      const r=parseInt(s.dataset.rating);
      s.classList.toggle('active', r <= currentRating);
    });
    const texts=['Select rating','Poor','Fair','Good','Very Good','Excellent'];
    const rt=document.getElementById('rating-text');
    if(rt) rt.textContent = texts[currentRating] || 'Select rating';
  }

  async function submitReview(e){
    e.preventDefault();
    if(!currentUser) return alert('Sign in first');
    const comment = document.getElementById('review-comment').value.trim();
    if(!comment) return alert('Write something');
    if(currentRating===0) return alert('Select a rating');

    try {
      const payload = {restaurant_id: restaurantId, user_id: currentUser.id, rating: currentRating, comment};
      if(editingReviewId){
        const { error } = await supabase.from('reviews').update(payload).eq('id', editingReviewId);
        if(error) throw error;
        editingReviewId = null;
      } else {
        const { error } = await supabase.from('reviews').insert(payload);
        if(error) throw error;
      }
      document.getElementById('review-form').reset();
      currentRating = 0;
      updateStars();
      document.querySelector('.char-count').textContent='0/500';
      await loadReviews();
    } catch(err){ console.error(err); alert('Error submitting review'); }
  }

  async function deleteReview(id){
    if(!currentUser || !confirm('Delete review?')) return;
    try{
      const { error } = await supabase.from('reviews').delete().eq('id', id).eq('user_id', currentUser.id);
      if(error) throw error;
      await loadReviews();
    }catch(err){ console.error(err); alert('Error deleting review'); }
  }

  window.deleteReview = deleteReview;

  window.startEditReview = (id, comment, rating) => {
    editingReviewId = id;
    currentRating = rating;
    document.getElementById('review-comment').value = comment;
    updateStars();
    window.scrollTo({top: document.getElementById('review-form').offsetTop - 20, behavior: 'smooth'});
  }

  document.addEventListener('click', e=>{
    if(e.target.classList.contains('star')){
      currentRating = parseInt(e.target.dataset.rating);
      updateStars();
    }
  });

  const form = document.getElementById('review-form');
  if(form) form.addEventListener('submit', submitReview);
  const ta = document.getElementById('review-comment');
  if(ta) ta.addEventListener('input', e => document.querySelector('.char-count').textContent = e.target.value.length+'/500');

  document.addEventListener('DOMContentLoaded', ()=>{
    checkAuth();
    loadReviews();
  });
</script>

<style>
  .review-actions { display:flex; gap:10px; margin-left:auto; }
  .review-header { display:flex; align-items:center; gap:15px; flex-wrap:wrap; }
  .stars .star { cursor:pointer; font-size:1.2rem; color:#ccc; }
  .stars .star.active { color:#FF9800; }
  .review { border: 1px solid #eaeaea; border-radius: 8px; padding: 20px; margin-bottom: 20px; background-color: #fdfdfd; }
  .review:hover { box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05); transform: translateY(-2px); transition: all 0.3s ease; }
  .reviewer-name { font-weight: 600; color: #2c3e50; font-size: 1.1rem; }
  .review-rating { color: #FF9800; font-size: 1.1rem; margin: 0 15px; }
  .review-comment { margin-bottom: 10px; color: #555; line-height: 1.5; }
  .review-date { font-size: 0.85rem; color: #888; }
  .reviews-loading, .reviews-empty { text-align: center; padding: 30px; color: #7f8c8d; font-style: italic; }
  .rating-wrapper { display: flex; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px; }
  .stars { display: flex; gap: 5px; }
  .star { cursor: pointer; font-size: 1.8rem; color: #ddd; transition: color 0.2s; }
  .star:hover, .star.active { color: #FF9800; }
  #rating-text { font-weight: 500; color: #7f8c8d; min-width: 120px; }
  #review-comment { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px; margin-bottom: 10px; font-size: 1rem; resize: vertical; }
  #review-comment:focus { outline: none; border-color: #3498db; box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2); }
  .char-count { font-size: 0.85rem; color: #7f8c8d; float: right; }
  button[type="submit"] { background-color: #3498db; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 1rem; font-weight: 600; }
  button[type="submit"]:hover { background-color: #2980b9; }
  #auth-prompt { text-align: center; padding: 20px; background-color: #f8f9fa; border-radius: 8px; margin-top: 20px; }
  #auth-prompt a { color: #3498db; text-decoration: none; font-weight: 600; }
  #auth-prompt a:hover { text-decoration: underline; }
  @media (max-width: 600px) {
    .review-header { flex-direction: column; align-items: flex-start; }
    .review-actions { margin-top: 10px; width: 100%; justify-content: flex-end; }
    .rating-wrapper { flex-direction: column; align-items: flex-start; }
  }
</style>`;

// Function to process HTML files
function processHTMLFiles(directory) {
  const files = fs.readdirSync(directory);
  
  files.forEach(file => {
    const filePath = path.join(directory, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Recursively process subdirectories
      processHTMLFiles(filePath);
    } else if (path.extname(file) === '.html') {
      // Process HTML files
      console.log(`Processing: ${filePath}`);
      
      try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Check if the file already has a review section
        if (content.includes('<!-- REVIEW SYSTEM -->')) {
          // Replace existing review system - match from <!-- REVIEW SYSTEM --> to </style>
          const reviewSystemRegex = /<!-- REVIEW SYSTEM -->[\s\S]*?<\/style>/;
          if (reviewSystemRegex.test(content)) {
            content = content.replace(reviewSystemRegex, reviewSystemCode);
            console.log(`✓ Updated review system in: ${file}`);
          } else {
            console.log(`✗ Could not find complete review system in: ${file}`);
          }
        } else {
          // Find a good place to insert the review system (before closing body tag)
          const bodyCloseTag = content.indexOf('</body>');
          if (bodyCloseTag !== -1) {
            content = content.slice(0, bodyCloseTag) + '\n' + reviewSystemCode + '\n' + content.slice(bodyCloseTag);
            console.log(`✓ Added review system to: ${file}`);
          } else {
            // If no body tag, add at the end
            content += '\n' + reviewSystemCode;
            console.log(`✓ Added review system to end of: ${file}`);
          }
        }
        
        // Write the updated content back to the file
        fs.writeFileSync(filePath, content, 'utf8');
      } catch (error) {
        console.error(`Error processing ${filePath}:`, error.message);
      }
    }
  });
}

// Start processing from current directory
const startDir = process.cwd();
console.log('Starting to process HTML files...');
processHTMLFiles(startDir);
console.log('Finished processing HTML files.');