const fs = require('fs');
const https = require('https');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gfkhjbztayjyojsgdpgk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma2hqYnp0YXlqeW9qc2dkcGdrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUzNjMxOCwiZXhwIjoyMDkxODk2MzE4fQ.6vGwIkgDmsL5cTqKaLbnsbQ4_flcgZ7CqK_dESPgIUU';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function downloadSupabaseStorage(bucket, path) {
  const { data, error } = await supabase.storage.from(bucket).download(path);
  if (error) throw error;
  return data.arrayBuffer();
}

async function renameSvgToPng() {
  const brandsToFix = [
    { name: 'Chipotle', oldPath: 'food_brands/chipotle-com.svg', newPath: 'food_brands/chipotle-com.png', table: 'food_brands' },
    { name: 'Buffalo Wild Wings', oldPath: 'food_brands/buffalowildwings-com.svg', newPath: 'food_brands/buffalowildwings-com.png', table: 'food_brands' }
  ];

  for (const brand of brandsToFix) {
    try {
      console.log(`Renaming ${brand.name}...`);
      const buffer = await downloadSupabaseStorage('brand-logos', brand.oldPath);
      
      const { error: uploadError } = await supabase.storage.from('brand-logos').upload(brand.newPath, buffer, {
        contentType: 'image/svg+xml', // Still technically an SVG but named .png to bypass attachment forced headers
        upsert: true
      });
      if (uploadError) {
        console.error(`Upload error for ${brand.name}:`, uploadError.message);
        continue;
      }
      
      const { error: dbError } = await supabase.from(brand.table).update({ logo_url: brand.newPath }).eq('name', brand.name);
      if (dbError) {
        console.error(`DB update error for ${brand.name}:`, dbError.message);
        continue;
      }

      await supabase.storage.from('brand-logos').remove([brand.oldPath]);
      console.log(`Successfully renamed and updated DB for ${brand.name}!`);
    } catch (err) {
      console.error(`Error fixing ${brand.name}:`, err.message);
    }
  }
}

renameSvgToPng().catch(console.error);
