const fs = require('fs');
const path = require('path');

// Restaurant ID mapping
const restaurantIdMap = {
    'mori': 1, 'kilo': 2, 'hameed': 3, 'bazooka': 4, 'mexican': 5, 'chikin': 6, 'vasko': 7, 'secondcup': 8,
    'station': 9, 'brgr': 10, 'country': 11, 'bayoki': 12, 'maine': 13, 'barbar': 14, 'labash': 15, 'pickl': 16,
    'akleh': 17, 'howlin': 18, 'sauce': 19, 'papa': 20, 'qasr': 21, 'heart': 22, 'what': 23, 'buffalo': 24,
    'mince': 25, '88': 26, 'kansas': 27, 'ward': 28, 'willys': 29, 'butchers': 30, 'hashville': 31, 'dawgs': 32,
    'holmes': 33, 'ribs': 34, 'peking': 35, 'wok': 36, 'daddy': 37, 'husk': 38, 'crispy': 39, 'lord': 40,
    'chez': 41, 'mario': 42, 'crumbs': 43, 'man': 44, 'pasta': 45, 'crave': 46, 'caizo': 47, 'pablo': 48,
    'panda': 49, 'tabali': 50
};

// Function to generate review system code for a specific restaurant
function generateReviewSystem(restaurantId) {
    return `<!-- REVIEW SYSTEM -->
<section class="section reviews" id="reviews-section">
  <h2>Customer Reviews</h2>
  <div id="reviews-list"><div class="reviews-loading">Loading reviews...</div></div>

  <h3>Add Your Review</h3>
  <form id="review-form" style="display:none;">
    <div>
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
    <p>Please <a href="../login.html">sign in</a> to submit a review.</p>
  </div>
</section>

<script type="module">
  import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.26.0/dist/supabase.min.js";
  const supabase = createClient("https://gfkhjbztayjyojsgdpgk.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma2hqYnp0YXlqeW9qc2dkcGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwOTYyNjQsImV4cCI6MjA3NTY3MjI2NH0.WUb2yDAwCeokdpWCPeH13FE8NhWF6G8e6ivTsgu6b2s");
  const restaurantId = ${restaurantId};

  let currentUser = null, currentRating = 0;

  async function checkAuth() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      currentUser = user;
      document.getElementById('review-form').style.display = user ? 'block' : 'none';
      document.getElementById('auth-prompt').style.display = user ? 'none' : 'block';
    } catch(e){ console.error(e); }
  }

  async function loadReviews() {
    const container = document.getElementById('reviews-list');
    try {
      const { data: reviews } = await supabase.from('reviews')
        .select('*').eq('restaurant_id', restaurantId).order('created_at', { ascending: false });

      if (!reviews?.length) { container.innerHTML='<div class="reviews-empty">No reviews yet.</div>'; return; }

      const userIds = [...new Set(reviews.map(r=>r.user_id))];
      const { data: users } = await supabase.from('user_profiles').select('id, username, full_name').in('id', userIds);
      const userMap = {}; users?.forEach(u=>userMap[u.id]=u);

      container.innerHTML = reviews.map(r=>{
        const u = userMap[r.user_id], name = u?.full_name||u?.username||'Anonymous';
        const canEditDelete = currentUser && currentUser.id === r.user_id;
        return \\\`<div class="review">
            <div class="review-header">
              <h4 class="reviewer-name">\\\${name}</h4>
              <div class="review-rating">\\\${'★'.repeat(r.rating)+'☆'.repeat(5-r.rating)}</div>
              \\\${canEditDelete ? '<button class="review-edit" onclick="editReview(\\\\\\'\\\${r.id}\\\\\\')">Edit</button> <button class="review-delete" onclick="deleteReview(\\\\\\'\\\${r.id}\\\\\\')">Delete</button>' : ''}
            </div>
            <p class="review-comment">\\\${r.comment}</p>
            <div class="review-date">\\\${new Date(r.created_at).toLocaleDateString()}</div>
          </div>\\\`;
      }).join('');
    } catch(e){ console.error(e); container.innerHTML='<div class="reviews-empty">Error loading reviews</div>'; }
  }

  async function submitReview(e){
    e.preventDefault();
    if(!currentUser) return alert('Sign in first');
    const comment = document.getElementById('review-comment').value.trim();
    if(!comment||currentRating===0) return alert('Rating and comment required');

    try{
      const { data: profile } = await supabase.from('user_profiles').select('username, full_name').eq('id', currentUser.id).single();
      const displayName = profile?.full_name||profile?.username||'User';
      const { error } = await supabase.from('reviews').insert({restaurant_id: restaurantId, user_id: currentUser.id, user_name: displayName, rating: currentRating, comment});
      if(error) throw error;
      document.getElementById('review-form').reset();
      currentRating = 0;
      updateStars();
      await loadReviews();
      alert('Review submitted!');
    } catch(e){ console.error(e); alert('Error submitting review'); }
  }

  async function deleteReview(id){
    if(!currentUser||!confirm('Delete review?')) return;
    try{
      const { error } = await supabase.from('reviews').delete().eq('id',id).eq('user_id',currentUser.id);
      if(error) throw error;
      await loadReviews();
      alert('Deleted!');
    } catch(e){ console.error(e); alert('Error deleting review'); }
  }

  function editReview(id){
    const reviewDiv = document.querySelector(\\\`button[onclick="editReview('\\\${id}')\\\`]\\\`).closest('.review');
    const commentP = reviewDiv.querySelector('.review-comment');
    const oldComment = commentP.textContent;
    const newComment = prompt('Edit your review:', oldComment);
    if(newComment && newComment !== oldComment){
      supabase.from('reviews').update({comment: newComment}).eq('id',id).then(()=> loadReviews());
    }
  }

  function updateStars(){
    document.querySelectorAll('.star').forEach(s=>s.classList.toggle('active',parseInt(s.dataset.rating)<=currentRating));
    const texts=['Select','Poor','Fair','Good','Very Good','Excellent'];
    const rt=document.getElementById('rating-text'); if(rt) rt.textContent=texts[currentRating]||'Select rating';
  }

  document.addEventListener('click', e=>{ if(e.target.classList.contains('star')){currentRating=parseInt(e.target.dataset.rating); updateStars();}});
  document.getElementById('review-form')?.addEventListener('submit', submitReview);
  document.getElementById('review-comment')?.addEventListener('input', e=>{ document.querySelector('.char-count').textContent = e.target.value.length+'/500'; });

  window.deleteReview = deleteReview;
  window.editReview = editReview;

  document.addEventListener('DOMContentLoaded', ()=>{ checkAuth(); loadReviews(); });
</script>`;
}

// Function to process HTML files in the cards directory
function processHTMLFiles(directory) {
    // Check if directory exists
    if (!fs.existsSync(directory)) {
        console.log(`Directory ${directory} does not exist.`);
        return 0;
    }

    const files = fs.readdirSync(directory);
    let processedCount = 0;

    files.forEach(file => {
        const filePath = path.join(directory, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            // Recursively process subdirectories
            processedCount += processHTMLFiles(filePath);
        } else if (path.extname(file) === '.html') {
            // Process HTML files
            console.log(`Processing: ${filePath}`);

            try {
                let content = fs.readFileSync(filePath, 'utf8');
                
                // Get restaurant ID from filename
                const fileName = file.replace('.html', '').toLowerCase();
                const restaurantId = restaurantIdMap[fileName] || 1;
                
                // Generate the review system code for this restaurant
                const reviewSystemCode = generateReviewSystem(restaurantId);

                // Check if the file already has a review section
                if (content.includes('<!-- REVIEW SYSTEM -->')) {
                    // Try multiple patterns to find and replace the review system
                    const patterns = [
                        /<!-- REVIEW SYSTEM -->[\s\S]*?<\/script>/,
                        /<!-- REVIEW SYSTEM -->[\s\S]*?window\.editReview = editReview;[\s\S]*?<\/script>/,
                        /<section class="section reviews" id="reviews-section">[\s\S]*?<\/script>/
                    ];

                    let replaced = false;
                    for (const pattern of patterns) {
                        if (pattern.test(content)) {
                            content = content.replace(pattern, reviewSystemCode);
                            console.log(`✓ Updated review system in: ${file}`);
                            processedCount++;
                            replaced = true;
                            break;
                        }
                    }

                    if (!replaced) {
                        console.log(`✗ Could not find complete review system in: ${file}`);
                    }
                } else {
                    // Find a good place to insert the review system (before closing body tag)
                    const bodyCloseTag = content.indexOf('</body>');
                    if (bodyCloseTag !== -1) {
                        content = content.slice(0, bodyCloseTag) + '\n' + reviewSystemCode + '\n' + content.slice(bodyCloseTag);
                        console.log(`✓ Added review system to: ${file}`);
                        processedCount++;
                    } else {
                        // If no body tag, add before the closing html tag
                        const htmlCloseTag = content.indexOf('</html>');
                        if (htmlCloseTag !== -1) {
                            content = content.slice(0, htmlCloseTag) + '\n' + reviewSystemCode + '\n' + content.slice(htmlCloseTag);
                            console.log(`✓ Added review system to: ${file}`);
                            processedCount++;
                        } else {
                            // Add at the end
                            content += '\n' + reviewSystemCode;
                            console.log(`✓ Added review system to end of: ${file}`);
                            processedCount++;
                        }
                    }
                }

                // Write the updated content back to the file
                fs.writeFileSync(filePath, content, 'utf8');
            } catch (error) {
                console.error(`Error processing ${filePath}:`, error.message);
            }
        }
    });

    return processedCount;
}

// Start processing from the cards directory
const cardsDir = path.join(process.cwd(), 'cards');
console.log('Starting to process HTML files in cards directory...');

if (fs.existsSync(cardsDir)) {
    const processedCount = processHTMLFiles(cardsDir);
    console.log(`Finished! Processed ${processedCount} HTML files in the cards directory.`);
} else {
    console.log(`Cards directory not found at: ${cardsDir}`);
    console.log('Current directory structure:');
    try {
        const files = fs.readdirSync(process.cwd());
        console.log(files);
    } catch (err) {
        console.log('Cannot read current directory');
    }
}