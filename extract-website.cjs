// extract-websites-enhanced.cjs
const fs = require('fs');
const path = require('path');

// Configuration
const CARDS_DIR = './cards';
const OUTPUT_DIR = './extracted_links';
const MAIN_CSV = './all_restaurant_links.csv';

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Enhanced extraction for your specific HTML structure
function extractLinksFromHTML(htmlContent, fileName) {
    const links = {
        website: '',
        instagram: '',
        facebook: '',
        twitter: '',
        hotline: '',
        order_online: ''
    };
    
    // Extract restaurant name from your specific template
    const titleMatch = htmlContent.match(/<title>([^<]+)<\/title>/i);
    let restaurantName = fileName.replace('.html', '').replace(/_/g, ' ');
    
    if (titleMatch && titleMatch[1]) {
        const title = titleMatch[1];
        restaurantName = title.split(' - ')[0] || 
                         title.split(' | ')[0] || 
                         restaurantName;
    }
    
    console.log(`🔍 Processing: ${restaurantName}`);
    
    // SPECIAL PATTERN 1: Look for your specific button structure
    // <a href="https://www.elkbabgi.com/" target="_blank" class="btn secondary">Order Online</a>
    const buttonPatterns = [
        // Pattern for "Order Online" buttons
        /<a\s+[^>]*href="([^"]*)"[^>]*class="[^"]*\bsecondary\b[^"]*"[^>]*>Order Online<\/a>/i,
        
        // Pattern for "View Full Menu" or similar
        /<a\s+[^>]*href="([^"]*)"[^>]*class="[^"]*\bsecondary\b[^"]*"[^>]*>View (?:Full )?Menu<\/a>/i,
        
        // General website links in buttons
        /<a\s+[^>]*href="([^"]*)"[^>]*class="[^"]*\bbtn\b[^"]*"[^>]*>(?:Website|Site|View Website)<\/a>/i
    ];
    
    for (const pattern of buttonPatterns) {
        const match = htmlContent.match(pattern);
        if (match && match[1]) {
            const url = match[1].trim();
            if (url && !url.startsWith('tel:') && !url.startsWith('mailto:')) {
                links.website = url;
                console.log(`   🌐 Found website button: ${url}`);
                break;
            }
        }
    }
    
    // SPECIAL PATTERN 2: Look for hotline in hero section
    // <a href="tel:19991" class="btn">Call Hotline: 19991</a>
    const heroHotlineRegex = /<a\s+href="tel:([^"]*)"[^>]*class="[^"]*\bbtn\b[^"]*"[^>]*>Call Hotline:?\s*([^<]*)<\/a>/i;
    const heroMatch = htmlContent.match(heroHotlineRegex);
    if (heroMatch) {
        links.hotline = heroMatch[1] || heroMatch[2];
        console.log(`   📞 Found hero hotline: ${links.hotline}`);
    }
    
    // SPECIAL PATTERN 3: Look for hotline in contact section
    // <strong>Hotline:</strong> <a href="tel:19991">19991</a>
    const contactHotlineRegex = /<strong>Hotline:<\/strong>\s*<a\s+href="tel:([^"]*)">([^<]*)<\/a>/i;
    const contactMatch = htmlContent.match(contactHotlineRegex);
    if (contactMatch && !links.hotline) {
        links.hotline = contactMatch[1] || contactMatch[2];
        console.log(`   📞 Found contact hotline: ${links.hotline}`);
    }
    
    // METHOD: Look for social media URLs anywhere in the HTML
    const urlRegex = /(https?:\/\/[^\s"'<>]+)/gi;
    const allUrls = htmlContent.match(urlRegex) || [];
    
    allUrls.forEach(url => {
        const cleanUrl = url.replace(/['"<>]/g, '').trim();
        
        if (cleanUrl.includes('instagram.com/') && !links.instagram) {
            links.instagram = normalizeSocialUrl(cleanUrl);
            console.log(`   📸 Found Instagram URL: ${links.instagram}`);
        }
        
        if (cleanUrl.includes('facebook.com/') && !links.facebook) {
            links.facebook = normalizeSocialUrl(cleanUrl);
            console.log(`   📘 Found Facebook URL: ${links.facebook}`);
        }
        
        if ((cleanUrl.includes('twitter.com/') || cleanUrl.includes('x.com/')) && !links.twitter) {
            links.twitter = normalizeSocialUrl(cleanUrl);
            console.log(`   🐦 Found Twitter/X URL: ${links.twitter}`);
        }
        
        // If no website yet and this looks like a restaurant website
        if (!links.website && !cleanUrl.includes('instagram.com') && 
            !cleanUrl.includes('facebook.com') && !cleanUrl.includes('twitter.com') &&
            !cleanUrl.includes('x.com') && !cleanUrl.includes('google.com') &&
            !cleanUrl.includes('maps.google.com')) {
            
            // Check if URL looks like a restaurant website
            if (cleanUrl.includes('.com') || cleanUrl.includes('.net') || cleanUrl.includes('.eg')) {
                links.website = cleanUrl;
                console.log(`   🌐 Found possible website: ${cleanUrl}`);
            }
        }
    });
    
    return {
        restaurant: restaurantName,
        slug: fileName.replace('.html', ''),
        ...links
    };
}

// ... rest of the functions remain the same as above ...

// Normalize social media URLs
function normalizeSocialUrl(url) {
    if (!url) return '';
    let cleanUrl = url.split('?')[0];
    if (!cleanUrl.startsWith('http')) {
        cleanUrl = 'https://' + cleanUrl;
    }
    return cleanUrl.trim();
}

// Clean text
function cleanText(text) {
    return text.replace(/<[^>]*>/g, '').trim();
}

// Convert links to CSV row
function linksToCSV(links) {
    return [
        escapeCSV(links.restaurant),
        escapeCSV(links.slug),
        escapeCSV(links.website),
        escapeCSV(links.instagram),
        escapeCSV(links.facebook),
        escapeCSV(links.twitter),
        escapeCSV(links.hotline),
        escapeCSV(getPrimaryLink(links))
    ].join(',');
}

// Get the primary link to display on the button
function getPrimaryLink(links) {
    if (links.website && links.website !== links.instagram) {
        return 'website';
    } else if (links.instagram) {
        return 'instagram';
    } else if (links.facebook) {
        return 'facebook';
    } else if (links.twitter) {
        return 'twitter';
    }
    return 'none';
}

// Escape CSV values
function escapeCSV(value) {
    if (value === null || value === undefined || value === '') {
        return '""';
    }
    const stringValue = String(value);
    const escapedValue = stringValue.replace(/"/g, '""');
    if (escapedValue.includes(',') || escapedValue.includes('"') || escapedValue.includes('\n')) {
        return `"${escapedValue}"`;
    }
    return escapedValue;
}

// Main processing function
function processAllRestaurants() {
    console.log('🚀 Starting enhanced website extraction...');
    
    if (!fs.existsSync(CARDS_DIR)) {
        console.error(`❌ Directory not found: ${CARDS_DIR}`);
        return;
    }
    
    const files = fs.readdirSync(CARDS_DIR)
        .filter(file => file.toLowerCase().endsWith('.html'))
        .sort();
    
    console.log(`📊 Found ${files.length} HTML files`);
    
    if (files.length === 0) {
        console.error('❌ No HTML files found');
        return;
    }
    
    const allLinks = [];
    
    for (const file of files) {
        try {
            console.log(`\n--- ${file} ---`);
            const filePath = path.join(CARDS_DIR, file);
            const htmlContent = fs.readFileSync(filePath, 'utf8');
            
            const result = extractLinksFromHTML(htmlContent, file);
            allLinks.push(result);
            
        } catch (error) {
            console.error(`❌ Error: ${error.message}`);
        }
    }
    
    // Save combined CSV
    if (allLinks.length > 0) {
        const headers = ['Restaurant', 'Slug', 'Website', 'Instagram', 'Facebook', 'Twitter', 'Hotline', 'Primary Link'];
        const rows = allLinks.map(links => linksToCSV(links));
        const combinedCSV = [headers.join(','), ...rows].join('\n');
        
        fs.writeFileSync(MAIN_CSV, combinedCSV, 'utf8');
        console.log(`\n✅ Saved ${allLinks.length} restaurant links to ${MAIN_CSV}`);
        
        // Show summary
        const withWebsite = allLinks.filter(l => l.website).length;
        const withInstagram = allLinks.filter(l => l.instagram).length;
        const withHotline = allLinks.filter(l => l.hotline).length;
        
        console.log(`\n📊 Summary:`);
        console.log(`   Websites: ${withWebsite}`);
        console.log(`   Instagram: ${withInstagram}`);
        console.log(`   Hotlines: ${withHotline}`);
        console.log(`   No links: ${allLinks.length - withWebsite - withInstagram}`);
    }
}

// Run it
processAllRestaurants();