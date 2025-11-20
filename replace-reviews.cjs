const fs = require('fs');
const path = require('path');

function replaceAllReviews() {
    const cardsDir = path.join(__dirname, 'cards');
    
    if (!fs.existsSync(cardsDir)) {
        console.error('❌ cards/ directory not found!');
        return;
    }

    const files = fs.readdirSync(cardsDir).filter(file => file.endsWith('.html'));
    console.log(`📁 Found ${files.length} HTML files`);

    let updatedCount = 0;

    files.forEach(file => {
        const filePath = path.join(cardsDir, file);
        console.log(`🔧 Processing: ${file}`);
        
        try {
            let content = fs.readFileSync(filePath, 'utf8');
            
            // Remove ANY existing review system completely
            content = removeAllReviewContent(content);
            
            // Add the new clean review system
            const reviewsSection = createCleanReviewsSection();
            
            // Insert before closing body tag
            if (content.includes('</body>')) {
                content = content.replace('</body>', reviewsSection + '\n</body>');
                console.log(`   ✅ Added clean review system`);
                updatedCount++;
            } else {
                // If no body tag, add at the end
                content += reviewsSection;
                console.log(`   ✅ Added clean review system at end`);
                updatedCount++;
            }

            fs.writeFileSync(filePath, content, 'utf8');
            
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
        }
    });

    console.log(`🎉 Successfully updated ${updatedCount} files`);
}

function removeAllReviewContent(content) {
    // Remove everything between review markers
    const reviewStartMarkers = [
        '<!-- REAL REVIEWS SYSTEM -->',
        '<!-- ==================== -->',
        '<section class="section reviews">'
    ];
    
    const reviewEndMarkers = [
        '</section>',
        '</style>'
    ];
    
    let lines = content.split('\n');
    let cleanLines = [];
    let skipMode = false;
    
    for (let line of lines) {
        // Check if we should start skipping
        if (reviewStartMarkers.some(marker => line.includes(marker))) {
            skipMode = true;
            continue;
        }
        
        // Check if we should stop skipping
        if (skipMode && reviewEndMarkers.some(marker => line.includes(marker))) {
            skipMode = false;
            continue;
        }
        
        // Skip lines in review sections
        if (skipMode) {
            continue;
        }
        
        // Skip individual review-related lines
        if (line.includes('reviewsSystem') || 
            line.includes('ReviewsSystem') ||
            line.includes('review-stats') ||
            line.includes('review-toast') ||
            line.includes('customer-reviews')) {
            continue;
        }
        
        cleanLines.push(line);
    }
    
    return cleanLines.join('\n');
}

function createCleanReviewsSection() {
    return `
<!-- REAL REVIEWS SYSTEM -->
<section class="section reviews">
    <h2>Customer Reviews</h2>
    
    <div class="review-stats">
        <div class="overall-rating">
            <div class="rating-large">0.0</div>
            <div class="rating-stars-large">⭐⭐⭐⭐⭐</div>
            <div class="rating-count">0 reviews</div>
        </div>
    </div>

    <div id="reviewsList">
        <div class="empty-reviews">
            <p>No reviews yet. Be the first to share your experience!</p>
        </div>
    </div>

    <div class="add-review-section">
        <h3>Write a Review</h3>
        <form class="review-form" id="reviewForm">
            <div class="rating-input">
                <label>Your Rating:</label>
                <div class="star-rating" id="starRating">
                    <span class="star" data-rating="1">☆</span>
                    <span class="star" data-rating="2">☆</span>
                    <span class="star" data-rating="3">☆</span>
                    <span class="star" data-rating="4">☆</span>
                    <span class="star" data-rating="5">☆</span>
                </div>
                <input type="hidden" id="selectedRating" name="rating" required>
            </div>
            
            <div class="form-group">
                <label for="reviewComment">Your Review:</label>
                <textarea 
                    id="reviewComment" 
                    name="comment" 
                    placeholder="Share your experience with this restaurant..." 
                    rows="4"
                    required
                ></textarea>
            </div>
            
            <button type="submit" class="btn btn-primary">
                Submit Review
            </button>
        </form>
    </div>
</section>

<script>
// Simple Reviews System
document.addEventListener('DOMContentLoaded', function() {
    console.log('Review system loaded');
    
    // Basic star rating functionality
    const stars = document.querySelectorAll('.star');
    let selectedRating = 0;
    
    stars.forEach(star => {
        star.addEventListener('click', function() {
            selectedRating = parseInt(this.dataset.rating);
            updateStars(selectedRating);
            document.getElementById('selectedRating').value = selectedRating;
        });
    });
    
    function updateStars(rating) {
        stars.forEach((star, index) => {
            if (index < rating) {
                star.textContent = '⭐';
                star.style.color = '#FF9800';
            } else {
                star.textContent = '☆';
                star.style.color = 'var(--text2)';
            }
        });
    }
    
    // Form submission
    const reviewForm = document.getElementById('reviewForm');
    if (reviewForm) {
        reviewForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const rating = parseInt(document.getElementById('selectedRating').value);
            const comment = document.getElementById('reviewComment').value.trim();
            
            if (!rating || !comment) {
                alert('Please provide both a rating and comment');
                return;
            }
            
            alert('Review functionality ready! Connect to Supabase for real reviews.');
            // Reset form
            reviewForm.reset();
            updateStars(0);
        });
    }
});
</script>

<style>
.review-stats { 
    display: flex; 
    align-items: center; 
    gap: 30px; 
    margin-bottom: 30px; 
    padding: 20px; 
    background: var(--card); 
    border-radius: 12px; 
    border: 1px solid var(--nav-shadow); 
}
.overall-rating { 
    text-align: center; 
}
.rating-large { 
    font-size: 3rem; 
    font-weight: 700; 
    color: var(--accent); 
    line-height: 1; 
}
.rating-stars-large { 
    color: #FF9800; 
    font-size: 1.5rem; 
    margin: 10px 0; 
}
.rating-count { 
    color: var(--text2); 
    font-size: 0.9rem; 
}
.add-review-section { 
    background: var(--card); 
    border-radius: 12px; 
    padding: 24px; 
    margin-top: 30px; 
    border: 1px solid var(--nav-shadow); 
}
.rating-input { 
    margin-bottom: 20px; 
}
.rating-input label { 
    display: block; 
    margin-bottom: 8px; 
    font-weight: 600; 
}
.star-rating { 
    display: flex; 
    gap: 4px; 
}
.star { 
    font-size: 2rem; 
    cursor: pointer; 
    transition: all 0.2s ease; 
    user-select: none; 
}
.star:hover { 
    transform: scale(1.1); 
}
.empty-reviews { 
    text-align: center; 
    padding: 40px 20px; 
    color: var(--text2); 
}

@media (max-width: 768px) {
    .review-stats { 
        flex-direction: column; 
        gap: 20px; 
    }
    .star { 
        font-size: 1.5rem; 
    }
}
</style>`;
}

// Run the script
console.log('🚀 Replacing ALL review systems with clean version...');
replaceAllReviews();