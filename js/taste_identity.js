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

    // Get top picks from user items
    function getTopPicks(items, count = 3) {
        if (!items || items.length === 0) return [];

        // Sort by rating if available, otherwise by recent
        const sorted = [...items].sort((a, b) => {
            if (a.rating && b.rating) {
                return b.rating - a.rating;
            }
            return 0;
        });

        return sorted.slice(0, count);
    }

    // Calculate rarity score (simulated)
    function calculateRarity(traits) {
        if (!traits || traits.length === 0) return "Top 50%";

        // Simulate rarity based on trait combination
        const rareTraits = ['philosophical', 'psychological', 'atmospheric', 'complex', 'whimsical'];
        const commonTraits = ['action', 'fun', 'light', 'emotional'];

        let rareCount = traits.filter(t => rareTraits.includes(t)).length;
        let commonCount = traits.filter(t => commonTraits.includes(t)).length;

        if (rareCount >= 3) return "Top 5%";
        if (rareCount >= 2) return "Top 12%";
        if (rareCount >= 1 && commonCount <= 1) return "Top 18%";
        if (rareCount >= 1) return "Top 25%";
        if (commonCount >= 3) return "Top 45%";
        return "Top 35%";
    }

    // Calculate compatibility (simulated)
    function calculateCompatibility(traits) {
        if (!traits || traits.length === 0) return "N/A";

        const nicheTraits = ['philosophical', 'psychological', 'atmospheric', 'complex', 'whimsical', 'stylized'];
        const mainstreamTraits = ['action', 'fun', 'light', 'emotional', 'romantic'];

        let nicheCount = traits.filter(t => nicheTraits.includes(t)).length;
        let mainstreamCount = traits.filter(t => mainstreamTraits.includes(t)).length;

        if (nicheCount >= 3) return "LOW (you're picky)";
        if (nicheCount >= 2) return "MEDIUM (you have specific tastes)";
        if (mainstreamCount >= 3) return "HIGH (easy to match)";
        return "MEDIUM (balanced tastes)";
    }

    // Main function to generate full taste identity
    async function generateTasteIdentity(items) {
        await loadTagsData();
        
        userItems = items || [];
        
        // Always return unlocked state - show default data if no ratings yet
        if (userItems.length === 0) {
            return {
                unlocked: true,
                identity: {
                    name: "The Explorer",
                    icon: "🔍",
                    traits: ['curious', 'open-minded', 'adventurous'],
                    description: "Your taste journey is just beginning. Start rating items to discover your unique taste identity."
                },
                traits: ['curious', 'open-minded', 'adventurous'],
                description: "Your taste journey is just beginning. Start rating items to discover your unique taste identity.",
                topPicks: [],
                rarity: "Discovering...",
                compatibility: "N/A",
                scoreMap: {},
                isDefault: true
            };
        }

        const scoreMap = computeTasteProfile(userItems);
        const topTraits = getTopTraits(scoreMap);
        const identity = matchIdentity(topTraits);
        const description = generateDescription(topTraits);
        const topPicks = getTopPicks(userItems);
        const rarity = calculateRarity(topTraits);
        const compatibility = calculateCompatibility(topTraits);

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
            ? profile.topPicks.map(item => `
                <div class="taste-pick-item">
                    <img src="${item.poster || item.image || '/newlogo.webp'}" alt="${item.title || item.name}" />
                    <span class="taste-pick-name">${item.title || item.name}</span>
                </div>
            `).join('')
            : `<div class="taste-picks-empty"><p>Rate items to see your top picks here</p></div>`;

        const traitsHtml = profile.traits.map(trait => `
            <span class="taste-tag">${trait}</span>
        `).join('');

        container.innerHTML = `
            <div class="taste-card" id="tasteCardElement">
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
                
                <button class="taste-share-btn" onclick="TasteIdentity.exportTasteCard('tasteCardElement')">
                    <i class="fas fa-share-alt"></i> Share Your Taste
                </button>
            </div>
        `;
    }

    return {
        generateTasteIdentity,
        exportTasteCard,
        renderTasteCard,
        loadTagsData,
        computeTasteProfile,
        getTopTraits,
        matchIdentity
    };
})();
