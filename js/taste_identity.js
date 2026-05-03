// ===== TASTE IDENTITY SYSTEM =====

const TasteIdentity = (function() {
    let tagsData = null;
    let userItems = [];
    let tasteProfile = null;

    // Load tags data
    async function loadTagsData() {
        if (tagsData) return tagsData;
        
        try {
            const response = await fetch('/js/data/tags_data.json');
            tagsData = await response.json();
            return tagsData;
        } catch (error) {
            console.error('Failed to load tags data:', error);
            return { media_tags: {}, identity_archetypes: [] };
        }
    }

    // Normalize item title to match tags data keys
    function normalizeTitle(title) {
        if (!title) return '';
        return title.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '_')
            .trim();
    }

    // Get tags for a media item
    function getItemTags(item) {
        if (!tagsData || !tagsData.media_tags) return [];
        
        const normalizedTitle = normalizeTitle(item.title || item.name);
        const tags = tagsData.media_tags[normalizedTitle];
        
        // Fallback: try to match by partial title
        if (!tags) {
            const partialMatch = Object.keys(tagsData.media_tags).find(key => 
                normalizedTitle.includes(key) || key.includes(normalizedTitle)
            );
            if (partialMatch) {
                return tagsData.media_tags[partialMatch];
            }
        }
        
        return tags || [];
    }

    // Compute taste profile from user items
    function computeTasteProfile(items) {
        const scoreMap = {};
        
        items.forEach(item => {
            const tags = getItemTags(item);
            const weight = item.rating ? (item.rating / 5) : 1;
            
            tags.forEach(tag => {
                if (!scoreMap[tag]) {
                    scoreMap[tag] = 0;
                }
                scoreMap[tag] += weight;
            });
        });
        
        return scoreMap;
    }

    // Get top traits from score map
    function getTopTraits(scoreMap, count = 5) {
        const sorted = Object.entries(scoreMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, count)
            .map(entry => entry[0]);
        
        return sorted;
    }

    // Match user traits to identity archetype
    function matchIdentity(userTraits) {
        if (!tagsData || !tagsData.identity_archetypes) {
            return {
                name: "The Explorer",
                icon: "🔍",
                traits: userTraits.slice(0, 3),
                description: "Your taste is unique and still being discovered."
            };
        }

        let bestMatch = null;
        let bestScore = 0;

        tagsData.identity_archetypes.forEach(archetype => {
            const archetypeTraits = archetype.traits || [];
            let matchScore = 0;

            userTraits.forEach(userTrait => {
                if (archetypeTraits.includes(userTrait)) {
                    matchScore += 1;
                }
            });

            if (matchScore > bestScore) {
                bestScore = matchScore;
                bestMatch = archetype;
            }
        });

        // If no good match, return a default based on top trait
        if (!bestMatch || bestScore === 0) {
            const topTrait = userTraits[0] || 'eclectic';
            return {
                name: "The Curious Mind",
                icon: "🧐",
                traits: userTraits.slice(0, 3),
                description: `You have a unique taste with a focus on ${topTrait} content.`
            };
        }

        return bestMatch;
    }

    // Generate description based on traits
    function generateDescription(traits) {
        if (!traits || traits.length === 0) {
            return "Your taste profile is still developing. Rate more items to unlock your full taste identity.";
        }

        const traitMap = {
            'dark': 'dark and moody',
            'emotional': 'emotional and touching',
            'philosophical': 'thought-provoking and deep',
            'complex': 'complex and layered',
            'intense': 'intense and gripping',
            'light': 'lighthearted and fun',
            'epic': 'epic and grand',
            'beautiful': 'beautifully crafted',
            'realistic': 'grounded and realistic',
            'fantasy': 'imaginative and fantastical',
            'sci-fi': 'futuristic and visionary',
            'action': 'action-packed',
            'romantic': 'romantic and heartfelt',
            'adventurous': 'adventurous and exciting',
            'psychological': 'psychologically engaging',
            'atmospheric': 'atmospheric and immersive',
            'inspiring': 'inspiring and uplifting',
            'competitive': 'competitive and strategic',
            'whimsical': 'whimsical and creative',
            'nostalgic': 'nostalgic and comforting'
        };

        const traitDescriptions = traits.slice(0, 3).map(trait => 
            traitMap[trait] || trait
        );

        if (traitDescriptions.length === 1) {
            return `You enjoy ${traitDescriptions[0]} content.`;
        } else if (traitDescriptions.length === 2) {
            return `You enjoy ${traitDescriptions[0]} and ${traitDescriptions[1]} content.`;
        } else {
            return `You enjoy ${traitDescriptions[0]}, ${traitDescriptions[1]}, and ${traitDescriptions[2]} content.`;
        }
    }

    // Get top picks based on behavior signals + trait matching
    function getTopPicks(items, count = 3, scoreMap = {}) {
        if (!items || items.length === 0) return [];
        
        // Calculate final score for each item
        const scoredItems = items.map(item => {
            let finalScore = item.itemScore || 0;
            
            // Add trait matching bonus
            if (item.title && scoreMap) {
                const itemTraits = getItemTraits(item.title, item.media_type);
                let traitMatches = 0;
                
                Object.keys(scoreMap).forEach(trait => {
                    if (itemTraits.includes(trait)) {
                        traitMatches++;
                    }
                });
                
                finalScore += (traitMatches * 2);
            }
            
            return {
                ...item,
                finalScore: finalScore
            };
        });
        
        // Filter out weak items (score < 2)
        const strongItems = scoredItems.filter(item => item.finalScore >= 2);
        
        // If no strong items, just return recent items
        if (strongItems.length === 0) {
            const recentItems = [...items]
                .filter(item => item.isRecent)
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            return recentItems.slice(0, count);
        }
        
        // Sort by final score
        const sorted = strongItems.sort((a, b) => b.finalScore - a.finalScore);
        
        return sorted.slice(0, count);
    }

    // Get traits for an item (simplified version)
    function getItemTraits(title, mediaType) {
        if (!title) return [];
        
        const titleLower = title.toLowerCase();
        const traits = [];
        
        // Simple keyword matching for common traits
        const traitKeywords = {
            'dark': ['dark', 'noir', 'shadow', 'night', 'gothic', 'horror', 'thriller'],
            'emotional': ['love', 'romance', 'drama', 'heart', 'feel', 'tear', 'cry'],
            'intense': ['action', 'war', 'fight', 'battle', 'intense', 'extreme'],
            'philosophical': ['mind', 'philosophy', 'think', 'question', 'meaning', 'exist'],
            'atmospheric': ['atmosphere', 'mood', 'vibe', 'dream', 'surreal'],
            'complex': ['complex', 'mystery', 'puzzle', 'twist', 'intricate'],
            'light': ['comedy', 'fun', 'happy', 'joy', 'laugh', 'light'],
            'adventure': ['adventure', 'journey', 'quest', 'explore', 'travel']
        };
        
        Object.entries(traitKeywords).forEach(([trait, keywords]) => {
            if (keywords.some(keyword => titleLower.includes(keyword))) {
                traits.push(trait);
            }
        });
        
        return traits;
    }

    // Calculate rarity score based on item diversity and trait uniqueness
    function calculateRarity(traits, items) {
        if (!traits || traits.length === 0) return "Analyzing...";
        
        const totalItems = items ? items.length : 0;
        if (totalItems === 0) return "Discovering...";

        // Calculate diversity based on media types
        const mediaTypes = new Set(items.map(item => item.media_type));
        const diversityScore = mediaTypes.size;

        // Trait uniqueness based on how niche the traits are
        const nicheTraits = ['philosophical', 'psychological', 'atmospheric', 'complex', 'whimsical', 'experimental', 'avant-garde'];
        const commonTraits = ['action', 'fun', 'light', 'emotional', 'romantic', 'comedy'];
        
        let nicheCount = traits.filter(t => nicheTraits.includes(t.toLowerCase())).length;
        let commonCount = traits.filter(t => commonTraits.includes(t.toLowerCase())).length;

        // Calculate rarity percentage based on multiple factors
        let rarityScore = 50; // Base score
        
        // Adjust for niche traits
        rarityScore -= (nicheCount * 8);
        
        // Adjust for common traits
        rarityScore += (commonCount * 5);
        
        // Adjust for diversity
        rarityScore -= (diversityScore * 3);
        
        // Adjust for total items (more items = more accurate rarity)
        if (totalItems > 50) rarityScore -= 5;
        if (totalItems > 100) rarityScore -= 5;

        // Clamp between 1 and 99
        rarityScore = Math.max(1, Math.min(99, rarityScore));

        return `Top ${rarityScore}%`;
    }

    // Calculate compatibility based on trait specificity
    function calculateCompatibility(traits, items) {
        if (!traits || traits.length === 0) return "N/A";
        
        const totalItems = items ? items.length : 0;
        if (totalItems === 0) return "N/A";

        const nicheTraits = ['philosophical', 'psychological', 'atmospheric', 'complex', 'whimsical', 'stylized', 'experimental'];
        const mainstreamTraits = ['action', 'fun', 'light', 'emotional', 'romantic', 'comedy', 'adventure'];

        let nicheCount = traits.filter(t => nicheTraits.includes(t.toLowerCase())).length;
        let mainstreamCount = traits.filter(t => mainstreamTraits.includes(t.toLowerCase())).length;

        // Calculate compatibility based on trait balance
        const totalTraits = traits.length;
        const nicheRatio = nicheCount / totalTraits;
        const mainstreamRatio = mainstreamCount / totalTraits;

        if (nicheRatio >= 0.6) return "LOW (you're picky)";
        if (nicheRatio >= 0.4) return "MEDIUM (you have specific tastes)";
        if (mainstreamRatio >= 0.6) return "HIGH (easy to match)";
        if (mainstreamRatio >= 0.4) return "MEDIUM-HIGH (balanced)";
        return "MEDIUM (unique mix)";
    }

    // Main function to generate full taste identity
    async function generateTasteIdentity(items) {
        await loadTagsData();
        
        userItems = items || [];
        
        // Handle edge case: no items at all
        if (userItems.length === 0) {
            return {
                unlocked: true,
                identity: {
                    name: "The Explorer",
                    icon: "🔍",
                    traits: ['curious', 'open-minded', 'adventurous'],
                    description: "Your taste journey is just beginning. Start saving items to discover your unique taste identity."
                },
                traits: ['curious', 'open-minded', 'adventurous'],
                description: "Your taste journey is just beginning. Start saving items to discover your unique taste identity.",
                topPicks: [],
                rarity: "Discovering...",
                compatibility: "N/A",
                scoreMap: {},
                isDefault: true
            };
        }

        // Handle edge case: minimal interaction (no favorites, few completed items)
        const hasFavorites = userItems.some(item => item.isFavorite);
        const hasCompleted = userItems.some(item => item.isCompleted);
        const strongItems = userItems.filter(item => (item.itemScore || 0) >= 2);
        
        if (!hasFavorites && !hasCompleted && strongItems.length < 3) {
            // Show "current vibe" instead of deep analysis
            const recentItems = [...userItems]
                .filter(item => item.isRecent)
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 3);
            
            return {
                unlocked: true,
                identity: {
                    name: "The Explorer",
                    icon: "🔍",
                    traits: ['curious', 'exploring', 'discovering'],
                    description: "You're currently exploring. Save more favorites and complete items to unlock your full taste profile."
                },
                traits: ['curious', 'exploring', 'discovering'],
                description: "You're currently exploring. Save more favorites and complete items to unlock your full taste profile.",
                topPicks: recentItems,
                rarity: "Building...",
                compatibility: "N/A",
                scoreMap: {},
                isDefault: true
            };
        }

        const scoreMap = computeTasteProfile(userItems);
        const topTraits = getTopTraits(scoreMap);
        const identity = matchIdentity(topTraits);
        const description = generateDescription(topTraits);
        const topPicks = getTopPicks(userItems, 3, scoreMap);
        const rarity = calculateRarity(topTraits, userItems);
        const compatibility = calculateCompatibility(topTraits, userItems);

        tasteProfile = {
            unlocked: true,
            identity: identity,
            traits: topTraits,
            description: description,
            topPicks: topPicks,
            rarity: rarity,
            compatibility: compatibility,
            scoreMap: scoreMap,
            isDefault: false
        };

        return tasteProfile;
    }

    // Export taste card as image
    async function exportTasteCard(elementId) {
        const element = document.getElementById(elementId);
        if (!element) {
            console.error('Taste card element not found');
            return;
        }

        try {
            // Load html2canvas dynamically
            if (typeof html2canvas === 'undefined') {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
                document.head.appendChild(script);
                
                await new Promise((resolve) => {
                    script.onload = resolve;
                });
            }

            const canvas = await html2canvas(element, {
                backgroundColor: '#0b1633',
                scale: 2,
                useCORS: true,
                allowTaint: true
            });

            // Convert to blob and download
            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.download = 'taste-identity.png';
                link.href = url;
                link.click();
                URL.revokeObjectURL(url);
            });
        } catch (error) {
            console.error('Failed to export taste card:', error);
            alert('Failed to export image. Please try again.');
        }
    }

    // Render taste card to DOM
    function renderTasteCard(containerId, profile) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Handle empty top picks
        const topPicksHtml = profile.topPicks && profile.topPicks.length > 0 
            ? profile.topPicks.map(item => {
                // Get poster URL with fallback
                const posterUrl = item.poster || item.image || item.cover_url || 
                                 item.poster_path || item.poster_url || '/newlogo.webp';
                return `
                <div class="taste-pick-item">
                    <img src="${posterUrl}" alt="${item.title || item.name}" onerror="this.src='/newlogo.webp'" />
                    <span class="taste-pick-name">${item.title || item.name}</span>
                </div>
            `}).join('')
            : `<div class="taste-picks-empty"><p>Save items to see your top picks here</p></div>`;

        const traitsHtml = profile.traits.map(trait => `
            <span class="taste-tag">${trait}</span>
        `).join('');

        const isMobile = window.innerWidth <= 768;
        const cardClass = isMobile ? 'taste-card compact' : 'taste-card';

        container.innerHTML = `
            <div class="${cardClass}" id="tasteCardElement" onclick="TasteIdentity.toggleExpand(event)">
                <div class="taste-header">
                    <span>YOUR TASTE IDENTITY</span>
                    <h1 class="taste-title">
                        <span class="taste-icon">${profile.identity.icon}</span>
                        ${profile.identity.name}
                    </h1>
                </div>
                
                <p class="taste-description">${profile.description}</p>
                
                <div class="taste-tags">
                    ${traitsHtml}
                </div>
                
                <div class="taste-section">
                    <h3 class="taste-section-title">TOP PICKS</h3>
                    <div class="taste-picks">
                        ${topPicksHtml}
                    </div>
                </div>
                
                <div class="taste-stats">
                    <div class="taste-stat">
                        <span class="taste-stat-label">RARITY</span>
                        <span class="taste-stat-value">${profile.rarity}</span>
                    </div>
                    <div class="taste-stat">
                        <span class="taste-stat-label">COMPATIBILITY</span>
                        <span class="taste-stat-value">${profile.compatibility}</span>
                    </div>
                </div>
                
                <button class="taste-share-btn" onclick="event.stopPropagation(); TasteIdentity.exportTasteCard('tasteCardElement')">
                    <i class="fas fa-share-alt"></i> Share Your Taste
                </button>
            </div>
        `;
    }

    // Toggle expand on mobile
    function toggleExpand(event) {
        if (window.innerWidth <= 768) {
            const card = event.currentTarget;
            card.classList.toggle('compact');
            card.classList.toggle('expanded');
        }
    }

    return {
        generateTasteIdentity,
        exportTasteCard,
        renderTasteCard,
        loadTagsData,
        computeTasteProfile,
        getTopTraits,
        matchIdentity,
        toggleExpand
    };
})();
