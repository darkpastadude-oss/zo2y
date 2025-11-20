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
            
            // Remove ANY existing review system using simple string operations
            content = removeReviewSystems(content);
            
            // Add the new review system before the closing body tag
            const reviewsSection = createReviewsSection();
            
            // Try different insertion points
            if (content.includes('</body>')) {
                content = content.replace('</body>', reviewsSection + '</body>');
                console.log(`   ✅ Added reviews system before </body>`);
                updatedCount++;
            } else if (content.includes('<footer>')) {
                content = content.replace('<footer>', reviewsSection + '<footer>');
                console.log(`   ✅ Added reviews system before <footer>`);
                updatedCount++;
            } else {
                console.log(`   ❌ Could not find insertion point in ${file}`);
                return;
            }

            fs.writeFileSync(filePath, content, 'utf8');
            
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
        }
    });

    console.log(`🎉 Successfully updated ${updatedCount} files`);
}

function removeReviewSystems(content) {
    // Simple approach: remove content between known review markers
    const lines = content.split('\n');
    let inReviewSection = false;
    let newLines = [];
    
    for (let line of lines) {
        // Check if we're entering a review section
        if (line.includes('<!-- REAL REVIEWS SYSTEM -->') || 
            line.includes('<section class="section reviews">') ||
            line.includes('<section class="reviews">')) {
            inReviewSection = true;
            continue;
        }
        
        // Check if we're exiting a review section
        if (inReviewSection && (line.includes('</section>') || line.includes('</style>'))) {
            inReviewSection = false;
            continue;
        }
        
        // Skip lines that are part of review system
        if (inReviewSection) {
            continue;
        }
        
        // Skip individual review-related lines
        if (line.includes('reviewsSystem') || 
            line.includes('ReviewsSystem') ||
            line.includes('review-stats') ||
            line.includes('<!-- Reviews section will be replaced dynamically -->')) {
            continue;
        }
        
        newLines.push(line);
    }
    
    return newLines.join('\n');
}

function createReviewsSection() {
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
                    placeholder="Share your experience..." 
                    rows="4"
                    required
                ></textarea>
            </div>
            
            <button type="submit" class="btn btn-primary">Submit Review</button>
        </form>
    </div>
</section>

<script>
// Simple Reviews System
document.addEventListener('DOMContentLoaded', function() {
    const reviewForm = document.getElementById('reviewForm');
    const stars = document.querySelectorAll('.star');
    let selectedRating = 0;
    
    // Star rating
    stars.forEach(star => {
        star.addEventListener('click', function() {
            selectedRating = parseInt(this.dataset.rating);
            stars.forEach((s, index) => {
                s.textContent = index < selectedRating ? '⭐' : '☆';
                s.style.color = index < selectedRating ? '#FF9800' : 'var(--text2)';
            });
            document.getElementById('selectedRating').value = selectedRating;
        });
    });
    
    // Form submission
    if (reviewForm) {
        reviewForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            alert('Review system is ready! Connect to Supabase to enable real reviews.');
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
.review-item { 
    background: var(--card); 
    border-radius: 12px; 
    padding: 20px; 
    margin-bottom: 16px; 
    border: 1px solid var(--nav-shadow); 
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
</style>
`;
}

// Run the script
console.log('🚀 Replacing ALL review systems...');
replaceAllReviews();