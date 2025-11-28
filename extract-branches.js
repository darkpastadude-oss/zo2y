// COMPLETE BRANCH LOCATION EXTRACTOR
class BranchLocationExtractor {
    constructor() {
        this.allRestaurants = {};
        this.geocodingCache = {};
    }

    async extractAllRestaurantLocations() {
        console.log('🚀 Starting automated branch extraction from all restaurant files...');
        
        const restaurantSlugs = [
            'mori', 'kilo', 'hameed', 'bazooka', 'mexican', 'chikin', 'vasko',
            'secondcup', 'station', 'brgr', 'country', 'bayoki', 'maine', 'barbar',
            'labash', 'pickl', 'akleh', 'howlin', 'sauce', 'papa', 'qasr', 'heart',
            'what', 'buffalo', 'mince', '88', 'kansas', 'ward', 'willys', 'butchers',
            'hashville', 'dawgs', 'holmes', 'ribs', 'peking', 'wok', 'daddy', 'husk',
            'crispy', 'lord', 'chez', 'mario', 'crumbs', 'man', 'pasta', 'crave'
        ];

        let extractedCount = 0;
        
        for (const slug of restaurantSlugs) {
            const success = await this.extractRestaurantBranches(slug);
            if (success) extractedCount++;
            await new Promise(resolve => setTimeout(resolve, 200)); // Avoid rate limits
        }

        console.log(`✅ Extracted branches from ${extractedCount}/${restaurantSlugs.length} restaurants`);
        this.saveToLocalStorage();
        return this.allRestaurants;
    }

    async extractRestaurantBranches(slug) {
        try {
            const response = await fetch(`cards/${slug}.html`);
            if (!response.ok) {
                console.warn(`⚠️ File not found: cards/${slug}.html`);
                return false;
            }
            
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // Extract restaurant name
            const restaurantName = doc.querySelector('.hero h1')?.textContent?.trim() || this.formatSlug(slug);
            
            // Extract branches from branch cards
            const branchCards = doc.querySelectorAll('.branch-card');
            const branches = [];
            
            for (const card of branchCards) {
                const branchName = card.querySelector('h3')?.textContent?.trim();
                const address = card.querySelector('p')?.textContent?.trim();
                const directionsLink = card.querySelector('a[href*="maps.google.com"]')?.href;
                
                if (branchName && address) {
                    const coordinates = await this.geocodeAddress(address, `${restaurantName} - ${branchName}`);
                    
                    branches.push({
                        id: `${slug}-${this.slugify(branchName)}`,
                        name: branchName,
                        address: address,
                        lat: coordinates.lat,
                        lng: coordinates.lng,
                        area: this.extractArea(address),
                        directions: directionsLink,
                        restaurantSlug: slug
                    });
                }
            }
            
            if (branches.length > 0) {
                this.allRestaurants[slug] = {
                    name: restaurantName,
                    slug: slug,
                    branches: branches,
                    totalBranches: branches.length
                };
                console.log(`✅ ${restaurantName}: ${branches.length} branches extracted`);
                return true;
            } else {
                console.warn(`⚠️ ${restaurantName}: No branches found in HTML`);
                return false;
            }
            
        } catch (error) {
            console.error(`❌ Error extracting ${slug}:`, error.message);
            return false;
        }
    }

    async geocodeAddress(address, locationName) {
        const cacheKey = this.slugify(address);
        if (this.geocodingCache[cacheKey]) {
            return this.geocodingCache[cacheKey];
        }

        try {
            // Use OpenStreetMap Nominatim API
            const encodedAddress = encodeURIComponent(`${address}, Cairo, Egypt`);
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&countrycodes=eg&addressdetails=1`,
                {
                    headers: {
                        'Accept-Language': 'en',
                        'User-Agent': 'Zo2yFoodApp/1.0'
                    }
                }
            );
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            
            if (data && data.length > 0) {
                const result = {
                    lat: parseFloat(data[0].lat),
                    lng: parseFloat(data[0].lon),
                    accuracy: data[0].addresstype
                };
                
                console.log(`📍 Geocoded: ${locationName} → ${result.lat}, ${result.lng}`);
                this.geocodingCache[cacheKey] = result;
                return result;
            } else {
                throw new Error('No results found');
            }
        } catch (error) {
            console.warn(`🗺️ Geocoding failed for "${locationName}": ${error.message}`);
        }

        // Fallback to area-based coordinates
        return this.getFallbackCoordinates(address);
    }

    extractArea(address) {
        const areas = {
            'First Settlement': 'New Cairo',
            'Sheikh Zayed': 'Sheikh Zayed', 
            'Nasr City': 'Nasr City',
            'Maadi': 'Maadi',
            'Dokki': 'Dokki',
            'Rehab': 'Rehab City',
            'Madinaty': 'Madinaty',
            'Heliopolis': 'Heliopolis',
            'Zamalek': 'Zamalek',
            'Mohandseen': 'Mohandseen',
            'Downtown': 'Downtown Cairo',
            'New Cairo': 'New Cairo',
            'Alexandria': 'Alexandria',
            '6 October': '6 October City',
            'Giza': 'Giza'
        };
        
        for (const [area, normalized] of Object.entries(areas)) {
            if (address.includes(area)) return normalized;
        }
        
        return 'Cairo';
    }

    getFallbackCoordinates(address) {
        const areaCoordinates = {
            'First Settlement': { lat: 30.0189, lng: 31.5017 },
            'New Cairo': { lat: 30.0189, lng: 31.5017 },
            'Sheikh Zayed': { lat: 30.0469, lng: 31.0048 },
            'Nasr City': { lat: 30.0626, lng: 31.3347 },
            'Maadi': { lat: 29.9627, lng: 31.2590 },
            'Dokki': { lat: 30.0408, lng: 31.2022 },
            'Rehab': { lat: 30.0931, lng: 31.4080 },
            'Madinaty': { lat: 30.1236, lng: 31.4786 },
            'Heliopolis': { lat: 30.0886, lng: 31.3257 },
            'Zamalek': { lat: 30.0600, lng: 31.2189 },
            'Mohandseen': { lat: 30.0525, lng: 31.2025 },
            'Downtown Cairo': { lat: 30.0444, lng: 31.2357 },
            'Alexandria': { lat: 31.2001, lng: 29.9187 },
            '6 October': { lat: 29.9361, lng: 30.9269 },
            'Giza': { lat: 30.0131, lng: 31.2089 }
        };
        
        for (const [area, coords] of Object.entries(areaCoordinates)) {
            if (address.includes(area)) {
                console.log(`🗺️ Using fallback coordinates for area: ${area}`);
                return coords;
            }
        }
        
        return { lat: 30.0444, lng: 31.2357 }; // Cairo center
    }

    formatSlug(slug) {
        return slug.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    slugify(text) {
        return text.toString().toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '');
    }

    saveToLocalStorage() {
        try {
            localStorage.setItem('zo2yRestaurantLocations', JSON.stringify(this.allRestaurants));
            localStorage.setItem('zo2yLocationsTimestamp', new Date().toISOString());
            console.log('💾 Saved restaurant locations to localStorage');
        } catch (error) {
            console.error('❌ Failed to save to localStorage:', error);
        }
    }

    loadFromLocalStorage() {
        try {
            const saved = localStorage.getItem('zo2yRestaurantLocations');
            if (saved) {
                this.allRestaurants = JSON.parse(saved);
                const timestamp = localStorage.getItem('zo2yLocationsTimestamp');
                console.log(`📂 Loaded restaurant locations from cache (${timestamp})`);
                return this.allRestaurants;
            }
        } catch (error) {
            console.error('❌ Failed to load from localStorage:', error);
        }
        return null;
    }

    clearCache() {
        localStorage.removeItem('zo2yRestaurantLocations');
        localStorage.removeItem('zo2yLocationsTimestamp');
        this.allRestaurants = {};
        this.geocodingCache = {};
        console.log('🗑️ Cleared location cache');
    }

    getStats() {
        let totalBranches = 0;
        let totalRestaurants = 0;
        
        Object.values(this.allRestaurants).forEach(restaurant => {
            totalRestaurants++;
            totalBranches += restaurant.branches.length;
        });
        
        return {
            totalRestaurants,
            totalBranches,
            cached: Object.keys(this.allRestaurants).length > 0
        };
    }
}