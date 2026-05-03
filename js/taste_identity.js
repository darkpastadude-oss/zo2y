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

    // Compute taste profile from user items (weighted by intent-based list weight)
    function computeTasteProfile(items) {
        const scoreMap = {};
        
        items.forEach(item => {
            const tags = getItemTags(item);
            // Use finalWeight which combines list intent (80%) + rating (20%)
            const weight = item.finalWeight || item.listWeight || 0.5;
            
            tags.forEach(tag => {
                if (!scoreMap[tag]) {
                    scoreMap[tag] = 0;
                }
                scoreMap[tag] += weight;
            });
        });
        
        // Normalize to 0-1 scale
        const maxScore = Math.max(...Object.values(scoreMap), 1);
        Object.keys(scoreMap).forEach(tag => {
            scoreMap[tag] = scoreMap[tag] / maxScore;
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

    // Deterministic identity generation based on tone + style axes
    function generateDeterministicIdentity(scoreMap) {
        // Define tone axes
        const toneTraits = ['dark', 'emotional', 'chaotic'];
        // Define style axes
        const styleTraits = ['intellectual', 'cinematic', 'mainstream', 'experimental'];
        
        // Find highest tone
        let highestTone = null;
        let highestToneScore = 0;
        toneTraits.forEach(trait => {
            if (scoreMap[trait] && scoreMap[trait] > highestToneScore) {
                highestToneScore = scoreMap[trait];
                highestTone = trait;
            }
        });
        
        // Find highest style
        let highestStyle = null;
        let highestStyleScore = 0;
        styleTraits.forEach(trait => {
            if (scoreMap[trait] && scoreMap[trait] > highestStyleScore) {
                highestStyleScore = scoreMap[trait];
                highestStyle = trait;
            }
        });
        
        // Fallback if no matches
        if (!highestTone) highestTone = 'emotional';
        if (!highestStyle) highestStyle = 'cinematic';
        
        // Deterministic identity mapping
        const identityMap = {
            'dark_intellectual': { name: 'The Shadow Analyst', icon: '🧠' },
            'dark_cinematic': { name: 'The Noir Visionary', icon: '🎬' },
            'dark_mainstream': { name: 'The Dark Binger', icon: '🌑' },
            'dark_experimental': { name: 'The Avant-Garde Shadow', icon: '🖤' },
            'emotional_intellectual': { name: 'The Cinematic Overthinker', icon: '🎭' },
            'emotional_cinematic': { name: 'The Heartfelt Critic', icon: '💜' },
            'emotional_mainstream': { name: 'The Feel-Good Fan', icon: '✨' },
            'emotional_experimental': { name: 'The Emotional Explorer', icon: '🌊' },
            'chaotic_intellectual': { name: 'The Chaos Theorist', icon: '🌀' },
            'chaotic_cinematic': { name: 'The Wild Card', icon: '🃏' },
            'chaotic_mainstream': { name: 'The Adrenaline Addict', icon: '⚡' },
            'chaotic_experimental': { name: 'The Experimental Maverick', icon: '🎨' }
        };
        
        const key = `${highestTone}_${highestStyle}`;
        const identity = identityMap[key] || { name: 'The Curious Explorer', icon: '🔍' };
        
        return {
            ...identity,
            tone: highestTone,
            style: highestStyle
        };
    }

    // Generate description based on traits (placeholder for LLM integration)
    function generateDescription(traits, topItems) {
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
            'nostalgic': 'nostalgic and comforting',
            'cinematic': 'cinematic and visually striking',
            'intellectual': 'intellectually stimulating',
            'mainstream': 'accessible and popular',
            'experimental': 'bold and unconventional',
            'chaotic': 'unpredictable and wild'
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

    // Get top picks based on intent weight and trait alignment
    function getTopPicks(items, count = 3, scoreMap = {}) {
        if (!items || items.length === 0) return [];
        
        // Calculate final score for each item
        const scoredItems = items.map(item => {
            // Use intent-based finalWeight as base score
            let finalScore = item.finalWeight || item.listWeight || 0.5;
            
            // Add trait matching bonus
            const itemTraits = getItemTags(item);
            let traitMatches = 0;
            
            Object.keys(scoreMap).forEach(trait => {
                if (itemTraits.includes(trait)) {
                    traitMatches += scoreMap[trait];
                }
            });
            
            finalScore += (traitMatches * 2);
            
            return {
                ...item,
                finalScore: finalScore
            };
        });
        
        // Sort by final score
        const sorted = scoredItems.sort((a, b) => b.finalScore - a.finalScore);
        
        return sorted.slice(0, count);
    }

    // Calculate rarity using cosine similarity against global averages (intent-based)
    function calculateRarity(scoreMap, items) {
        if (!scoreMap || Object.keys(scoreMap).length === 0) return "Analyzing...";
        
        const totalItems = items ? items.length : 0;
        if (totalItems === 0) return "Discovering...";

        // Calculate intent-based rarity factors
        const favoriteCount = items.filter(i => i.isFavorite).length;
        const customListCount = items.filter(i => i.listType === 'custom').length;
        const watchlistCount = items.filter(i => i.isWatchlist).length;
        
        // Niche favorites = actually rare
        // Mainstream watchlist = doesn't fake uniqueness
        const intentScore = (favoriteCount * 1.0) + (customListCount * 0.8) - (watchlistCount * 0.3);
        const intentRatio = intentScore / Math.max(totalItems, 1);

        // Simulated global averages (in production, fetch from database)
        const globalAverages = {
            'dark': 0.4,
            'emotional': 0.6,
            'philosophical': 0.3,
            'complex': 0.35,
            'intense': 0.5,
            'light': 0.55,
            'epic': 0.45,
            'beautiful': 0.4,
            'realistic': 0.5,
            'fantasy': 0.35,
            'sci-fi': 0.3,
            'action': 0.6,
            'romantic': 0.5,
            'adventurous': 0.45,
            'psychological': 0.25,
            'atmospheric': 0.3,
            'inspiring': 0.4,
            'competitive': 0.35,
            'whimsical': 0.25,
            'nostalgic': 0.4,
            'cinematic': 0.45,
            'intellectual': 0.3,
            'mainstream': 0.6,
            'experimental': 0.2,
            'chaotic': 0.25
        };

        // Calculate cosine similarity
        let dotProduct = 0;
        let userMagnitude = 0;
        let globalMagnitude = 0;

        Object.keys(scoreMap).forEach(trait => {
            const userScore = scoreMap[trait] || 0;
            const globalScore = globalAverages[trait] || 0.5;
            
            dotProduct += userScore * globalScore;
            userMagnitude += userScore * userScore;
            globalMagnitude += globalScore * globalScore;
        });

        userMagnitude = Math.sqrt(userMagnitude);
        globalMagnitude = Math.sqrt(globalMagnitude);

        if (userMagnitude === 0 || globalMagnitude === 0) return "Top 50%";

        const similarity = dotProduct / (userMagnitude * globalMagnitude);
        
        // Convert similarity to rarity percentile (inverse)
        let rarityPercentile = Math.round((1 - similarity) * 100);
        
        // Adjust based on intent ratio (high intent = more rare)
        if (intentRatio > 0.5) rarityPercentile -= 10;
        if (intentRatio > 0.7) rarityPercentile -= 15;
        if (intentRatio < 0.2) rarityPercentile += 10;
        
        return `Top ${Math.max(1, Math.min(99, rarityPercentile))}%`;
    }

    // Calculate compatibility based on intent signals and niche score
    function calculateCompatibility(scoreMap, items) {
        if (!scoreMap || Object.keys(scoreMap).length === 0) return "N/A";
        
        const totalItems = items ? items.length : 0;
        if (totalItems === 0) return "N/A";

        // Calculate intent-based signals
        const favoriteCount = items.filter(i => i.isFavorite).length;
        const watchlistCount = items.filter(i => i.isWatchlist).length;
        const customListCount = items.filter(i => i.listType === 'custom').length;
        
        // High favorites + low watchlist = picky (strong intent)
        const intentRatio = favoriteCount / Math.max(totalItems, 1);
        const watchlistRatio = watchlistCount / Math.max(totalItems, 1);
        
        // Calculate niche vs mainstream score
        const nicheTraits = ['philosophical', 'psychological', 'atmospheric', 'complex', 'whimsical', 'experimental', 'avant-garde', 'chaotic'];
        const mainstreamTraits = ['action', 'fun', 'light', 'emotional', 'romantic', 'comedy', 'adventure', 'mainstream'];
        
        let nicheScore = 0;
        let mainstreamScore = 0;
        
        Object.keys(scoreMap).forEach(trait => {
            if (nicheTraits.includes(trait)) {
                nicheScore += scoreMap[trait];
            }
            if (mainstreamTraits.includes(trait)) {
                mainstreamScore += scoreMap[trait];
            }
        });

        const isNiche = nicheScore > mainstreamScore;
        const isPicky = intentRatio > 0.4 && watchlistRatio < 0.3; // Strong favorites, weak watchlist

        if (isNiche && isPicky) return "Low (you're picky)";
        if (isNiche) return "Medium (unique tastes)";
        if (mainstreamScore > 0.6 && watchlistRatio > 0.4) return "High (you like popular stuff)";
        if (isPicky) return "Medium (selective)";
        return "High (easy to match)";
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
                    tone: 'emotional',
                    style: 'cinematic'
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

        const scoreMap = computeTasteProfile(userItems);
        const topTraits = getTopTraits(scoreMap);
        const identity = generateDeterministicIdentity(scoreMap);
        const description = generateDescription(topTraits, userItems.slice(0, 3));
        const topPicks = getTopPicks(userItems, 3, scoreMap);
        const rarity = calculateRarity(scoreMap, userItems);
        const compatibility = calculateCompatibility(scoreMap, userItems);

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
                backgroundColor: '#0f0f11',
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

    // Render taste card to DOM (matches new CSS structure)
    function renderTasteCard(containerId, profile) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Handle empty top picks
        const topPicksHtml = profile.topPicks && profile.topPicks.length > 0 
            ? profile.topPicks.map(item => {
                const posterUrl = item.poster || item.image || item.cover_url || 
                                 item.poster_path || item.poster_url || '/newlogo.webp';
                return `<img src="${posterUrl}" alt="${item.title || item.name}" onerror="this.src='/newlogo.webp'" />`;
            }).join('')
            : `<div class="tc-grid-empty"><p>Save items to see your top picks here</p></div>`;

        const traitsHtml = profile.traits.slice(0, 4).map(trait => 
            `<span>${trait}</span>`
        ).join('');

        const isMobile = window.innerWidth <= 768;
        const cardClass = isMobile ? 'taste-card compact' : 'taste-card';

        container.innerHTML = `
            <div class="${cardClass}" id="tasteCardElement" onclick="TasteIdentity.toggleExpand(event)">
                <div class="tc-header">YOUR TASTE IDENTITY</div>
                <h1 class="tc-title">${profile.identity.name}</h1>
                <p class="tc-desc">${profile.description}</p>
                <div class="tc-tags">${traitsHtml}</div>
                <div class="tc-section">TOP PICKS</div>
                <div class="tc-grid">${topPicksHtml}</div>
                <div class="tc-stats">
                    <div>
                        <span class="label">Rarity</span>
                        <span class="value">${profile.rarity}</span>
                    </div>
                    <div>
                        <span class="label">Compatibility</span>
                        <span class="value">${profile.compatibility}</span>
                    </div>
                </div>
                <button class="tc-share" onclick="event.stopPropagation(); TasteIdentity.exportTasteCard('tasteCardElement')">
                    Share your taste
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
        toggleExpand
    };
})();
