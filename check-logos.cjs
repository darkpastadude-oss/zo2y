const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://gfkhjbztayjyojsgdpgk.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma2hqYnp0YXlqeW9qc2dkcGdrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUzNjMxOCwiZXhwIjoyMDkxODk2MzE4fQ.6vGwIkgDmsL5cTqKaLbnsbQ4_flcgZ7CqK_dESPgIUU');

async function run() {
  const {data: food} = await supabase.from('food_brands').select('id, name, logo_url');
  const {data: fashion} = await supabase.from('fashion_brands').select('id, name, logo_url');
  
  let missing = [];
  for (const f of [...food, ...fashion]) {
    if (!f.logo_url) {
      missing.push({ name: f.name, reason: 'No logo_url' });
      continue;
    }
    const url = `https://gfkhjbztayjyojsgdpgk.supabase.co/storage/v1/object/public/brand-logos/${f.logo_url}`;
    try {
      const res = await fetch(url, { method: 'HEAD' });
      if (!res.ok) {
        missing.push({ name: f.name, table: f.id ? 'DB' : '', url });
      }
    } catch(e) {
      missing.push({ name: f.name, reason: e.message });
    }
  }
  
  console.log('MISSING LOGOS:', missing);
}
run();
