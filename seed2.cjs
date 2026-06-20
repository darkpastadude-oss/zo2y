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

async function fixBrands() {
  const brandsToFix = [
    { name: 'Chipotle', path: 'food_brands/chipotle-com.svg' },
    { name: 'Buffalo Wild Wings', path: 'food_brands/buffalowildwings-com.svg' }
  ];

  for (const brand of brandsToFix) {
    try {
      console.log(`Fixing ${brand.name}...`);
      const buffer = await downloadSupabaseStorage('brand-logos', brand.path);
      
      const { error: uploadError } = await supabase.storage.from('brand-logos').upload(brand.path, buffer, {
        contentType: 'image/svg+xml',
        upsert: true
      });
      if (uploadError) {
        console.error(`Upload error for ${brand.name}:`, uploadError.message);
        continue;
      }
      
      console.log(`Successfully fixed ${brand.name}!`);
    } catch (err) {
      console.error(`Error fixing ${brand.name}:`, err.message);
    }
  }
}

fixBrands().catch(console.error);
