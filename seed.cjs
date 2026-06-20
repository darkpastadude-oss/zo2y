const fs = require('fs');
const path = require('path');
const https = require('https');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gfkhjbztayjyojsgdpgk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma2hqYnp0YXlqeW9qc2dkcGdrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUzNjMxOCwiZXhwIjoyMDkxODk2MzE4fQ.6vGwIkgDmsL5cTqKaLbnsbQ4_flcgZ7CqK_dESPgIUU';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const teamsToSeed = [
  { id: 'nat-sn', name: 'Senegal', sport: 'Football', league: 'FIFA World Cup', logo_url: '/assets/logos/football/national-teams/sn.png' },
  { id: 'nat-gb-wls', name: 'Wales', sport: 'Football', league: 'FIFA World Cup', logo_url: '/assets/logos/football/national-teams/gb-wls.png' },
  { id: 'nat-sa', name: 'Saudi Arabia', sport: 'Football', league: 'FIFA World Cup', logo_url: '/assets/logos/football/national-teams/sa.svg' },
  { id: 'nat-pl', name: 'Poland', sport: 'Football', league: 'FIFA World Cup', logo_url: '/assets/logos/football/national-teams/pl.png' },
  { id: 'nat-dk', name: 'Denmark', sport: 'Football', league: 'FIFA World Cup', logo_url: '/assets/logos/football/national-teams/dk.png' },
  { id: 'nat-tn', name: 'Tunisia', sport: 'Football', league: 'FIFA World Cup', logo_url: '/assets/logos/football/national-teams/tn.png' },
  { id: 'nat-cr', name: 'Costa Rica', sport: 'Football', league: 'FIFA World Cup', logo_url: '/assets/logos/football/national-teams/cr.png' },
  { id: 'nat-rs', name: 'Serbia', sport: 'Football', league: 'FIFA World Cup', logo_url: '/assets/logos/football/national-teams/rs.png' },
  { id: 'nat-ch', name: 'Switzerland', sport: 'Football', league: 'FIFA World Cup', logo_url: '/assets/logos/football/national-teams/ch.png' },
  { id: 'nat-cm', name: 'Cameroon', sport: 'Football', league: 'FIFA World Cup', logo_url: '/assets/logos/football/national-teams/cm.png' },
  { id: 'nat-gh', name: 'Ghana', sport: 'Football', league: 'FIFA World Cup', logo_url: '/assets/logos/football/national-teams/gh.png' }
];

async function seedTeams() {
  console.log('Seeding missing World Cup teams...');
  for (const team of teamsToSeed) {
    const { error } = await supabase.from('teams').upsert(team, { onConflict: 'id' });
    if (error) console.error(`Error seeding ${team.name}:`, error.message);
    else console.log(`Seeded ${team.name}`);
  }
}

function downloadImage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return resolve(downloadImage(res.headers.location));
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Status ${res.statusCode}`));
      }
      const data = [];
      res.on('data', chunk => data.push(chunk));
      res.on('end', () => resolve(Buffer.concat(data)));
    }).on('error', reject);
  });
}

async function fixBrands() {
  const brandsToFix = [
    { name: 'Chipotle', url: 'https://logo.clearbit.com/chipotle.com', path: 'food_brands/chipotle-com.png', oldPath: 'food_brands/chipotle-com.svg' },
    { name: 'Buffalo Wild Wings', url: 'https://logo.clearbit.com/buffalowildwings.com', path: 'food_brands/buffalowildwings-com.png', oldPath: 'food_brands/buffalowildwings-com.svg' }
  ];

  for (const brand of brandsToFix) {
    try {
      console.log(`Fixing ${brand.name}...`);
      const buffer = await downloadImage(brand.url);
      
      const { error: uploadError } = await supabase.storage.from('brand-logos').upload(brand.path, buffer, {
        contentType: 'image/png',
        upsert: true
      });
      if (uploadError) {
        console.error(`Upload error for ${brand.name}:`, uploadError.message);
        continue;
      }
      
      const { error: dbError } = await supabase.from('brands').update({ logo_url: brand.path }).eq('name', brand.name);
      if (dbError) {
        console.error(`DB update error for ${brand.name}:`, dbError.message);
        continue;
      }

      await supabase.storage.from('brand-logos').remove([brand.oldPath]);
      console.log(`Successfully fixed ${brand.name}!`);
    } catch (err) {
      console.error(`Error fixing ${brand.name}:`, err.message);
    }
  }
}

async function main() {
  await seedTeams();
  await fixBrands();
}

main().catch(console.error);
