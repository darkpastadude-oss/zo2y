const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://gfkhjbztayjyojsgdpgk.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma2hqYnp0YXlqeW9qc2dkcGdrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUzNjMxOCwiZXhwIjoyMDkxODk2MzE4fQ.6vGwIkgDmsL5cTqKaLbnsbQ4_flcgZ7CqK_dESPgIUU');

async function run() {
  const {data: food} = await supabase.from('food_brands').select('id, name, logo_url');
  const {data: fashion} = await supabase.from('fashion_brands').select('id, name, logo_url');
  
  let bad = [];
  for (const f of [...food, ...fashion]) {
    if (!f.logo_url) continue;
    const url = `https://gfkhjbztayjyojsgdpgk.supabase.co/storage/v1/object/public/brand-logos/${f.logo_url}`;
    try {
      const res = await fetch(url);
      const text = await res.text();
      
      // If it's an SVG, it should start with <?xml or <svg.
      // If it's a PNG/JPG, reading as text might garble it, but it shouldn't look like an HTML error page.
      if (text.trim().startsWith('<html') || text.includes('NoSuchKey') || text.includes('{"statusCode":"404"')) {
        bad.push({name: f.name, reason: 'Error page or HTML', url: f.logo_url});
      }
    } catch(e) {}
  }
  
  console.log('BAD FILES:', bad.length);
  if (bad.length > 0) {
    console.log(bad.slice(0, 5));
  }
}

run();
