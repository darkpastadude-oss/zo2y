const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://gfkhjbztayjyojsgdpgk.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma2hqYnp0YXlqeW9qc2dkcGdrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUzNjMxOCwiZXhwIjoyMDkxODk2MzE4fQ.6vGwIkgDmsL5cTqKaLbnsbQ4_flcgZ7CqK_dESPgIUU');

async function listAllFiles(folder) {
  const { data, error } = await supabase.storage.from('brand-logos').list(folder, { limit: 1000 });
  if (error) return [];
  return data.filter(d => d.name !== '.emptyFolderPlaceholder').map(d => folder ? `${folder}/${d.name}` : d.name);
}

async function cleanup() {
  const tables = ['food_brands', 'car_brands', 'tech_brands', 'fashion_brands'];
  let validLogos = new Set();
  
  for (const table of tables) {
    const {data} = await supabase.from(table).select('logo_url');
    if (data) {
      data.forEach(d => {
        if (d.logo_url) validLogos.add(d.logo_url);
      });
    }
  }

  const rootFiles = await listAllFiles('');
  const foodFiles = await listAllFiles('food_brands');
  const fashionFiles = await listAllFiles('fashion_brands');
  const carFiles = await listAllFiles('car_brands');
  const techFiles = await listAllFiles('tech_brands');
  
  const allFiles = [...rootFiles, ...foodFiles, ...fashionFiles, ...carFiles, ...techFiles];
  const toDelete = allFiles.filter(f => !validLogos.has(f) && !f.endsWith('/')); // avoid folders
  
  console.log(`Total files: ${allFiles.length}`);
  console.log(`Unused files: ${toDelete.length}`);
  
  if (toDelete.length > 0) {
    console.log(toDelete.slice(0, 5));
    const {error} = await supabase.storage.from('brand-logos').remove(toDelete);
    if (!error) {
      console.log('Successfully deleted unused files');
    } else {
      console.error('Failed to delete:', error);
    }
  }
}

cleanup().then(() => console.log('Cleanup done'));
