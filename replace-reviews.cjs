<!-- REVIEW SYSTEM -->
<section class="section reviews" id="reviews-section">
  <h2>Customer Reviews</h2>
  <div id="reviews-list"><div class="reviews-loading">Loading reviews...</div></div>
  
  <h3>Add Your Review</h3>
  <form id="review-form" style="display:none;">
    <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:12px;">
      <span style="font-weight:500;">Rating:</span>
      <div class="stars">
        <span class="star" data-rating="1">★</span>
        <span class="star" data-rating="2">★</span>
        <span class="star" data-rating="3">★</span>
        <span class="star" data-rating="4">★</span>
        <span class="star" data-rating="5">★</span>
      </div>
      <span id="rating-text" style="min-width:100px;">Select rating</span>
    </div>
    <textarea id="review-comment" placeholder="Share your experience..." rows="4" maxlength="500" required></textarea>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;">
      <button type="submit" class="btn">Submit Review</button>
      <span class="char-count">0/500</span>
    </div>
  </form>

  <div id="auth-prompt" style="padding:15px;text-align:center;">
    <p>Please <a href="../login.html">sign in</a> to submit a review.</p>
  </div>
</section>

<script type="module">
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://gfkhjbztayjyojsgdpgk.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma2hqYnp0YXlqeW9qc2dkcGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwOTYyNjQsImV4cCI6MjA3NTY3MjI2NH0.WUb2yDAwCeokdpWCPeH13FE8NhWF6G8e6ivTsgu6b2s";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const restaurantIdMap = {
  mori:1,kilo:2,hameed:3,bazooka:4,mexican:5,chikin:6,vasko:7,secondcup:8,
  station:9,brgr:10,country:11,bayoki:12,maine:13,barbar:14,labash:15,pickl:16,
  akleh:17,howlin:18,sauce:19,papa:20,qasr:21,heart:22,what:23,buffalo:24,
  mince:25,'88':26,kansas:27,ward:28,willys:29,butchers:30,hashville:31,dawgs:32,
  holmes:33,ribs:34,peking:35,wok:36,daddy:37,husk:38,crispy:39,lord:40,
  chez:41,mario:42,crumbs:43,man:44,pasta:45,crave:46,caizo:47,pablo:48,
  panda:49,tabali:50
};

const fileName = window.location.pathname.split("/").pop().replace(".html","").toLowerCase();
const restaurantId = restaurantIdMap[fileName];

let currentUser = null;
let currentRating = 0;

// AUTH CHECK
async function checkAuth(){
  const { data: { user } } = await supabase.auth.getUser();
  currentUser = user;
  document.getElementById('review-form').style.display = user ? 'block' : 'none';
  document.getElementById('auth-prompt').style.display = user ? 'none' : 'block';
}

// LOAD REVIEWS
async function loadReviews(){
  const container = document.getElementById('reviews-list');
  try{
    const { data: reviews } = await supabase.from('reviews')
      .select('*').eq('restaurant_id', restaurantId).order('created_at',{ascending:false});

    if(!reviews || reviews.length===0){
      container.innerHTML = '<div class="reviews-empty">No reviews yet. Be the first!</div>';
      return;
    }

    const userIds = [...new Set(reviews.map(r=>r.user_id))];
    const { data: users } = await supabase.from('user_profiles')
      .select('id, username, full_name').in('id', userIds);

    const userMap = {};
    users?.forEach(u=>userMap[u.id]=u);

    container.innerHTML = reviews.map(r=>{
      const u = userMap[r.user_id];
      const name = u?.full_name||u?.username||'Anonymous';
      const canEdit = currentUser && currentUser.id===r.user_id;

      return `<div class="review" data-id="${r.id}">
        <div class="review-header" style="display:flex;justify-content:space-between;align-items:center;">
          <div>
            <strong>${name}</strong>
            <span style="margin-left:10px;color:#FF9800">${'★'.repeat(r.rating)+'☆'.repeat(5-r.rating)}</span>
          </div>
          ${canEdit?`<div class="review-actions">
            <button class="edit-btn" data-id="${r.id}">Edit</button>
            <button class="delete-btn" data-id="${r.id}">Delete</button>
          </div>`:''}
        </div>
        <p class="review-comment">${r.comment}</p>
        <small style="color:gray">${new Date(r.created_at).toLocaleDateString()}</small>
      </div>`;
    }).join('');
  }catch(err){ console.error(err); container.innerHTML='<div class="reviews-empty">Error loading reviews</div>'; }
}

// SUBMIT REVIEW
async function submitReview(e){
  e.preventDefault();
  if(!currentUser) return alert('Sign in first');
  const comment = document.getElementById('review-comment').value.trim();
  if(!comment || currentRating===0) return alert('Rating & comment required');

  try{
    const { data: profile } = await supabase.from('user_profiles').select('username, full_name').eq('id', currentUser.id).single();
    const name = profile?.full_name||profile?.username||'User';
    await supabase.from('reviews').insert({restaurant_id:restaurantId,user_id:currentUser.id,user_name:name,rating:currentRating,comment});
    document.getElementById('review-form').reset();
    currentRating=0;
    updateStars();
    document.querySelector('.char-count').textContent='0/500';
    await loadReviews();
  }catch(err){ console.error(err); alert('Error submitting review'); }
}

// DELETE REVIEW
async function deleteReview(id){
  if(!currentUser || !confirm('Delete this review?')) return;
  try{
    await supabase.from('reviews').delete().eq('id',id).eq('user_id',currentUser.id);
    await loadReviews();
  }catch(err){ console.error(err); alert('Error deleting review'); }
}

// EDIT REVIEW
async function editReview(id){
  const reviewEl = document.querySelector(`.review[data-id="${id}"]`);
  const commentEl = reviewEl.querySelector('.review-comment');
  const oldComment = commentEl.textContent;

  const newComment = prompt('Edit your review:', oldComment);
  if(newComment===null) return;

  try{
    await supabase.from('reviews').update({ comment:newComment }).eq('id',id).eq('user_id',currentUser.id);
    await loadReviews();
  }catch(err){ console.error(err); alert('Error editing review'); }
}

// STAR RATING
function updateStars(){
  document.querySelectorAll('.star').forEach(s=>{
    const r = parseInt(s.dataset.rating);
    s.classList.toggle('active', r<=currentRating);
  });
  const texts=['Select','Poor','Fair','Good','Very Good','Excellent'];
  const rt=document.getElementById('rating-text');
  if(rt) rt.textContent = texts[currentRating] || 'Select';
}

// EVENT LISTENERS
document.addEventListener('click',e=>{
  if(e.target.classList.contains('star')){
    currentRating=parseInt(e.target.dataset.rating);
    updateStars();
  }
  if(e.target.classList.contains('delete-btn')) deleteReview(e.target.dataset.id);
  if(e.target.classList.contains('edit-btn')) editReview(e.target.dataset.id);
});

const form=document.getElementById('review-form'); if(form) form.addEventListener('submit', submitReview);
const ta=document.getElementById('review-comment'); if(ta) ta.addEventListener('input',e=>document.querySelector('.char-count').textContent=e.target.value.length+'/500');

window.deleteReview = deleteReview;
window.editReview = editReview;

document.addEventListener('DOMContentLoaded',()=>{
  checkAuth();
  loadReviews();
});
</script>
