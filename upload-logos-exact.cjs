// upload-logos-simple.cjs
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gfkhjbztayjyojsgdpgk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma2hqYnp0YXlqeW9qc2dkcGdrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDA5NjI2NCwiZXhwIjoyMDc1NjcyMjY0fQ.8nKCAE6R7s3bxNBo5uXNhFZqZqxUd3tJGKKmNmKtdt4';

const supabase = createClient(supabaseUrl, supabaseKey);

const IMAGES_DIR = './images';

// Exact mapping based on your files
const slugToFilename = {
    '88': '88.jpg',
    'akleh': 'akleh.jpg',
    'barbar': 'barbar.png',
    'bayoki': 'bayoki.png',
    'bazooka': 'bazooka.jpg',
    'brgr': 'brgr.jpg',
    'buffalo': 'buffalo.jpg',
    'butchers': 'butchers.jpg',
    'caizo': 'caizo.jpg',
    'chez': 'chez.jpg',
    'chikin': 'chikin.png',
    'country': 'country.jpg',
    'crave': 'crave.png',
    'crispy': 'crispy.jpg',
    'crumbs': 'crumbs.jpg',
    'daddy': 'daddy.png',
    'dawgs': 'dawgs.jpg',
    'hameed': 'hameed.png',
    'hashville': 'hashville.png',
    'heart': 'heart.jpg',
    'holmes': 'holmes.jpg',
    'howlin': 'howlin.png',
    'husk': 'husk.jpg',
    'kansas': 'kansas.png',
    'kilo': 'kilo.png',
    'labash': 'labash.jpg',
    'lord': 'lord.png',
    'maine': 'maine.jpg',
    'man': 'man.png',
    'mario': 'mario.jpg',
    'mexican': 'mexican.jpg',
    'mince': 'mince.jpg',
    'mori': 'mori.png',
    'pablo': 'pablo.png',
    'panda': 'panda.png',
    'papa': 'papa.png',
    'pasta': 'pasta2go.png',
    'peking': 'peking.png',
    'pickl': 'pickl.jpg',
    'qasr': 'qasr.png',
    'ribs': 'ribs.jpg',
    'sauce': 'sauce.jpg',
    'secondcup': 'secondcup.png',
    'station': 'station.png',
    'tabali': 'tabali.jpg',
    'vasko': 'vasko.jpg',
    'ward': 'ward.png',
    'what': 'what.png',
    'willys': 'willys.png',
    'wok': 'wok.png',
};

async function uploadAllLogos() {
    console.log('🚀 Starting logo upload...');
    console.log(`📁 Checking: ${IMAGES_DIR}`);
    
    // Check if directory exists
    if (!fs.existsSync(IMAGES_DIR)) {
        console.error(`❌ Images directory not found: ${IMAGES_DIR}`);
        console.log('Make sure you run this from your project root.');
        console.log('Current directory:', process.cwd());
        return;
    }
    
    const results = [];
    const uploadedUrls = [];
    
    console.log(`\n📤 Uploading ${Object.keys(slugToFilename).length} logos...`);
    console.log('='.repeat(50));
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const [slug, filename] of Object.entries(slugToFilename)) {
        const filePath = path.join(IMAGES_DIR, filename);
        
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            console.log(`⚠️  Skipping ${slug}: ${filename} not found`);
            results.push({ slug, filename, status: 'not_found' });
            continue;
        }
        
        try {
            const fileBuffer = fs.readFileSync(filePath);
            const fileSizeKB = (fileBuffer.length / 1024).toFixed(1);
            
            console.log(`📤 ${slug.padEnd(15)} ${filename.padEnd(20)} (${fileSizeKB} KB)`);
            
            // Try to upload
            const { data, error } = await supabase.storage
                .from('restaurant-logos')
                .upload(filename, fileBuffer, {
                    contentType: getContentType(filename),
                    upsert: true
                });
            
            if (error) {
                // If bucket doesn't exist, try to create it
                if (error.message.includes('bucket') || error.message.includes('not found')) {
                    console.log('   Creating bucket...');
                    
                    // Try to create bucket via REST API
                    const createResponse = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${supabaseKey}`,
                            'Content-Type': 'application/json',
                            'apikey': supabaseKey
                        },
                        body: JSON.stringify({
                            name: 'restaurant-logos',
                            public: true,
                            file_size_limit: 10485760,
                            allowed_mime_types: ['image/jpeg', 'image/png', 'image/webp']
                        })
                    });
                    
                    if (createResponse.ok) {
                        console.log('   ✅ Bucket created, retrying upload...');
                        
                        // Wait a bit for bucket to be ready
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        
                        // Try upload again
                        const { data: retryData, error: retryError } = await supabase.storage
                            .from('restaurant-logos')
                            .upload(filename, fileBuffer, {
                                contentType: getContentType(filename),
                                upsert: true
                            });
                        
                        if (retryError) {
                            throw retryError;
                        }
                    } else {
                        throw new Error('Failed to create bucket');
                    }
                } else if (error.message.includes('already exists') || error.message.includes('Duplicate')) {
                    console.log('   ✅ Already exists');
                } else {
                    throw error;
                }
            }
            
            // Get public URL
            const { data: urlData } = supabase.storage
                .from('restaurant-logos')
                .getPublicUrl(filename);
            
            const logoUrl = urlData.publicUrl;
            
            console.log(`   ✅ ${logoUrl}`);
            
            results.push({
                slug,
                filename,
                status: 'success',
                url: logoUrl
            });
            
            uploadedUrls.push({
                slug,
                url: logoUrl
            });
            
            successCount++;
            
        } catch (error) {
            console.error(`   ❌ Error: ${error.message}`);
            results.push({
                slug,
                filename,
                status: 'error',
                error: error.message
            });
            errorCount++;
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 UPLOAD COMPLETE!');
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    
    // Generate SQL
    const sqlStatements = uploadedUrls.map(item => 
        `WHEN slug = '${item.slug}' THEN '${item.url}'`
    ).join('\n    ');
    
    const sql = `-- Generated ${new Date().toLocaleString()}
-- Copy and run this in Supabase SQL Editor

UPDATE restraunts 
SET logo_url = CASE 
    ${sqlStatements}
    ELSE logo_url 
END;

-- Verify the update
SELECT id, slug, name, logo_url FROM restraunts ORDER BY id;`;
    
    console.log('\n📝 GENERATED SQL:');
    console.log('='.repeat(50));
    console.log(sql);
    
    // Save SQL to file
    fs.writeFileSync('./update-logos.sql', sql);
    console.log('\n💾 SQL saved to: update-logos.sql');
    
    // Save results
    const summary = {
        timestamp: new Date().toISOString(),
        total: Object.keys(slugToFilename).length,
        successful: successCount,
        errors: errorCount,
        results: results
    };
    
    fs.writeFileSync('./upload-results.json', JSON.stringify(summary, null, 2));
    console.log('📊 Results saved to: upload-results.json');
    
    // Manual upload instructions
    if (errorCount > 0) {
        console.log('\n⚠️  MANUAL UPLOAD OPTION:');
        console.log('If uploads failed, you can manually upload:');
        console.log('1. Go to: https://gfkhjbztayjyojsgdpgk.supabase.co');
        console.log('2. Navigate to Storage → Create bucket "restaurant-logos"');
        console.log('3. Make it public');
        console.log('4. Upload all files from your images/ folder');
    }
}

function getContentType(filename) {
    const ext = path.extname(filename).toLowerCase();
    if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
    if (ext === '.png') return 'image/png';
    if (ext === '.webp') return 'image/webp';
    if (ext === '.gif') return 'image/gif';
    return 'image/jpeg';
}

// Run the script
uploadAllLogos().catch(error => {
    console.error('❌ Fatal error:', error);
    console.log('\n💡 TROUBLESHOOTING:');
    console.log('1. Check your Supabase credentials');
    console.log('2. Make sure Storage is enabled in Supabase');
    console.log('3. Try creating the bucket manually first');
    console.log('4. Check your internet connection');
    process.exit(1);
});