const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://gfkhjbztayjyojsgdpgk.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma2hqYnp0YXlqeW9qc2dkcGdrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUzNjMxOCwiZXhwIjoyMDkxODk2MzE4fQ.6vGwIkgDmsL5cTqKaLbnsbQ4_flcgZ7CqK_dESPgIUU');

async function fixLogos() {
  const tables = ['food_brands', 'car_brands', 'tech_brands', 'fashion_brands'];
  
  for (const table of tables) {
    console.log(`Checking ${table}...`);
    const {data: brands} = await supabase.from(table).select('id, name, domain, logo_url');
    if (!brands) continue;
    
    for (const brand of brands) {
      if (!brand.logo_url) continue;
      
      const url = `https://gfkhjbztayjyojsgdpgk.supabase.co/storage/v1/object/public/brand-logos/${brand.logo_url}`;
      const res = await fetch(url, {method: 'HEAD'});
      
      if (!res.ok) {
        console.log(`Missing: ${brand.name} -> ${brand.logo_url}`);
        
        const domain = brand.domain || brand.logo_url.split('/').pop().replace('-com', '.com').replace(/\.(png|jpg|jpeg|svg)$/, '');
        const clearbitUrl = `https://logo.clearbit.com/${domain}`;
        console.log(`Fetching from ${clearbitUrl}...`);
        
        try {
          const logoRes = await fetch(clearbitUrl);
          if (logoRes.ok) {
            const buffer = await logoRes.arrayBuffer();
            const contentType = logoRes.headers.get('content-type') || 'image/png';
            
            let ext = 'png';
            if (contentType.includes('jpeg') || contentType.includes('jpg')) ext = 'jpg';
            if (contentType.includes('svg')) ext = 'svg';
            
            const newPath = `${table}/${domain.replace(/\./g, '-')}.${ext}`;
            
            console.log(`Uploading to ${newPath}...`);
            const { error: uploadError } = await supabase.storage.from('brand-logos').upload(newPath, buffer, {
              contentType,
              upsert: true
            });
            
            if (!uploadError) {
              console.log(`Updating DB to ${newPath}...`);
              await supabase.from(table).update({ logo_url: newPath }).eq('id', brand.id);
            } else {
              console.error(`Upload error:`, uploadError);
            }
          } else {
            console.log(`Clearbit failed for ${domain}: ${logoRes.status}`);
          }
        } catch (e) {
          console.error(e.message);
        }
      }
    }
  }
}

fixLogos().then(() => console.log('Done all tables'));
