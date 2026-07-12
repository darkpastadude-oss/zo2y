import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gfkhjbztayjyojsgdpgk.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma2hqYnp0YXlqeW9qc2dkcGdrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUzNjMxOCwiZXhwIjoyMDkxODk2MzE4fQ.6vGwIkgDmsL5cTqKaLbnsbQ4_flcgZ7CqK_dESPgIUU';
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// From api/logo.js — TITLE_OVERRIDES
const TITLE_OVERRIDES = new Map([
  ['arbys', "Arby's"], ['arby\'s', "Arby's"], ['chipotle', 'Chipotle Mexican Grill'],
  ['dunkin', "Dunkin'"], ['dunkin donuts', "Dunkin'"], ['chick-fil-a', 'Chick-fil-A'],
  ['chick fil a', 'Chick-fil-A'], ['popeyes', 'Popeyes'], ['burger king', 'Burger King'],
  ['kfc', 'KFC'], ['mcdonalds', "McDonald's"], ['mcdonald\'s', "McDonald's"],
  ['wendys', "Wendy's"], ['wendy\'s', "Wendy's"], ['subway', 'Subway (restaurant)'],
  ['taco bell', 'Taco Bell'], ['panda express', 'Panda Express'], ['dominos', "Domino's"],
  ['domino\'s', "Domino's"], ['pizza hut', 'Pizza Hut'], ['panera', 'Panera Bread'],
  ['panera bread', 'Panera Bread'], ['starbucks', 'Starbucks'], ['shake shack', 'Shake Shack'],
  ['bmw', 'BMW'], ['mercedes', 'Mercedes-Benz'], ['mercedes-benz', 'Mercedes-Benz'],
  ['volkswagen', 'Volkswagen'], ['toyota', 'Toyota'], ['honda', 'Honda'],
  ['ford', 'Ford Motor Company'], ['chevrolet', 'Chevrolet'], ['hyundai', 'Hyundai Motor Company'],
  ['kia', 'Kia'], ['audi', 'Audi'], ['lexus', 'Lexus'], ['tesla', 'Tesla, Inc.'],
  ['porsche', 'Porsche'], ['ferrari', 'Ferrari'], ['lamborghini', 'Lamborghini'],
  ['jaguar', 'Jaguar Cars'], ['volvo', 'Volvo Cars'], ['subaru', 'Subaru'],
  ['mazda', 'Mazda'], ['peugeot', 'Peugeot'], ['renault', 'Renault'], ['fiat', 'Fiat'],
  ['skoda', 'Skoda Auto'], ['seat', 'SEAT'], ['mini', 'Mini (marque)'],
  ['jeep', 'Jeep'], ['cadillac', 'Cadillac'], ['buick', 'Buick'], ['dodge', 'Dodge'],
  ['chrysler', 'Chrysler'], ['acura', 'Acura'], ['genesis', 'Genesis Motor'],
  ['polestar', 'Polestar'], ['rivian', 'Rivian'], ['maserati', 'Maserati'],
  ['bugatti', 'Bugatti'], ['mclaren', 'McLaren'], ['citroen', 'Citroen'],
  ['opel', 'Opel'], ['lincoln', 'Lincoln Motor Company'], ['saab', 'Saab Automobile'],
  ['lancia', 'Lancia'], ['wagamama', 'Wagamama'], ['nandos', 'Nando\'s'],
  ['yosushi', 'YO! Sushi'], ['redrobin', 'Red Robin'],
  ['thecapitalgrille', 'The Capital Grille'],
  ['thecheesecakefactory', 'The Cheesecake Factory'],
  ['timhortons', 'Tim Hortons'], ['redlobster', 'Red Lobster'],
  ['dairyqueen', 'Dairy Queen'], ['dennys', 'Denny\'s'],
  ['littlecaesars', 'Little Caesars'], ['smoothieking', 'Smoothie King'],
  ['sonicdrivein', 'Sonic Drive-In'], ['jackinthebox', 'Jack in the Box'],
  ['papajohns', 'Papa John\'s'], ['peets', 'Peet\'s Coffee'],
  ['culvers', 'Culver\'s'], ['raisingcanes', 'Raising Cane\'s'],
  ['wingstop', 'Wingstop'], ['zaxbys', 'Zaxby\'s'],
  ['whataburger', 'Whataburger'], ['whitecastle', 'White Castle'],
  ['txchicken', 'Texas Chicken'], ['torchystacos', 'Torchy\'s Tacos'],
  ['buffalowildwings', 'Buffalo Wild Wings'], ['sweetgreen', 'Sweetgreen'],
  ['carrabbas', 'Carrabba\'s Italian Grill'],
  ['chilis', 'Chili\'s'], ['crackerbarrel', 'Cracker Barrel'],
  ['subway', 'Subway (restaurant)'],
  // Car brands
  ['nissan', 'Nissan'], ['mitsubishi', 'Mitsubishi Motors'], ['suzuki', 'Suzuki'],
  ['bentley', 'Bentley'], ['rolls-royce', 'Rolls-Royce Motor Cars'],
  ['aston martin', 'Aston Martin'], ['alfa romeo', 'Alfa Romeo'],
  ['land rover', 'Land Rover'], ['ramtrucks', 'RAM Trucks'],
  ['abarth', 'Abarth'], ['daihatsu', 'Daihatsu'], ['proton', 'Proton'],
  ['tatamotors', 'Tata Motors'], ['mahindra', 'Mahindra'],
  ['isuzu', 'Isuzu'], ['geely', 'Geely'], ['byd', 'BYD Auto'],
  ['nio', 'NIO'], ['xiaopeng', 'XPeng'], ['zeekrlife', 'Zeekr'],
  ['vinfast', 'VinFast'], ['lucidmotors', 'Lucid Motors'],
  ['saicmotor', 'SAIC Motor'], ['changan', 'Changan Automobile'],
  ['rimac-automobili', 'Rimac'], ['scania', 'Scania'],
  ['westernstartrucks', 'Western Star']
]);

function normalizeCommonsLogo(value, size = 256) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (raw.startsWith('http')) {
    if (!/wikimedia|wikipedia/i.test(raw)) return raw;
    const parts = raw.split('/');
    const filename = parts[parts.length - 1];
    return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}?width=${size}`;
  }
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(raw)}?width=${size}`;
}

async function fetchWikiLogoByDomain(domain, size = 256) {
  const cleanDomain = String(domain || '').trim().toLowerCase();
  if (!cleanDomain) return '';
  const domainPattern = cleanDomain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const sparql = `
    SELECT ?logo WHERE {
      ?item wdt:P856 ?site .
      FILTER(REGEX(LCASE(STR(?site)), "^https?://(www\\.)?${domainPattern}(/|$)"))
      ?item wdt:P154 ?logo .
    } LIMIT 1
  `;
  try {
    const url = `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(sparql)}`;
    const resp = await fetch(url, { headers: { 'User-Agent': 'Zo2yLogoScript/1.0', 'Accept': 'application/sparql-results+json' }, signal: AbortSignal.timeout(10000) });
    if (!resp.ok) return '';
    const json = await resp.json();
    const value = json?.results?.bindings?.[0]?.logo?.value;
    return value ? normalizeCommonsLogo(value, size) : '';
  } catch { return ''; }
}

async function fetchWikiLogoByTitle(title, size = 256) {
  if (!title) return '';
  const normalizedTitle = TITLE_OVERRIDES.get(String(title).trim().toLowerCase()) || title;
  try {
    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(normalizedTitle)}?redirect=true`;
    const summaryResp = await fetch(summaryUrl, { headers: { 'User-Agent': 'Zo2yLogoScript/1.0' }, signal: AbortSignal.timeout(8000) });
    if (!summaryResp.ok) return '';
    const payload = await summaryResp.json();
    const wikibaseId = payload?.wikibase_item;
    if (!wikibaseId) return '';
    const entityUrl = `https://www.wikidata.org/wiki/Special:EntityData/${encodeURIComponent(wikibaseId)}.json`;
    const entityResp = await fetch(entityUrl, { headers: { 'User-Agent': 'Zo2yLogoScript/1.0' }, signal: AbortSignal.timeout(8000) });
    if (!entityResp.ok) return '';
    const entityPayload = await entityResp.json();
    const entity = entityPayload?.entities?.[wikibaseId];
    const logoClaim = entity?.claims?.P154?.[0];
    const logoFile = logoClaim?.mainsnak?.datavalue?.value;
    return logoFile ? normalizeCommonsLogo(logoFile, size) : '';
  } catch { return ''; }
}

async function resolveLogo(name, domain) {
  // 1. Try Wikidata SPARQL by domain
  const byDomain = await fetchWikiLogoByDomain(domain);
  if (byDomain) return byDomain;
  // 2. Try Wikipedia summary → wikibase → P154
  const byTitle = await fetchWikiLogoByTitle(name);
  if (byTitle) return byTitle;
  // 3. Try with override title
  const overrideTitle = TITLE_OVERRIDES.get(String(name).trim().toLowerCase());
  if (overrideTitle && overrideTitle !== name) {
    const byOverride = await fetchWikiLogoByTitle(overrideTitle);
    if (byOverride) return byOverride;
  }
  return '';
}

async function processTable(tableName) {
  console.log(`\n--- ${tableName} ---`);
  const { data: brands, error } = await supabase
    .from(tableName)
    .select('id, slug, name, domain, logo_url')
    .is('logo_url', null);
  if (error) { console.error(`Fetch error: ${error.message}`); return; }
  if (!brands.length) { console.log('No brands with NULL logo_url'); return; }
  console.log(`${brands.length} brands need logos`);

  let updated = 0, failed = 0;
  for (const brand of brands) {
    const logoUrl = await resolveLogo(brand.name, brand.domain);
    if (logoUrl) {
      const { error: updErr } = await supabase.from(tableName).update({ logo_url: logoUrl }).eq('id', brand.id);
      if (updErr) { console.error(`  FAIL ${brand.slug}: ${updErr.message}`); failed++; }
      else { console.log(`  OK ${brand.slug}: ${logoUrl.substring(0, 90)}...`); updated++; }
    } else {
      console.log(`  SKIP ${brand.slug}: no logo found`);
      failed++;
    }
  }
  console.log(`${tableName}: ${updated} updated, ${failed} skipped/failed`);
}

async function main() {
  await processTable('food_brands');
  await processTable('car_brands');
  console.log('\n--- Verification ---');
  for (const table of ['food_brands', 'car_brands']) {
    const { data: withNull } = await supabase.from(table).select('slug').is('logo_url', null);
    const { data: withLogo } = await supabase.from(table).select('slug').not('logo_url', 'is', null);
    console.log(`${table}: ${withLogo.length} with logo, ${withNull.length} still NULL`);
    if (withNull.length > 0 && withNull.length <= 10) {
      console.log(`  NULL: ${withNull.map(r => r.slug).join(', ')}`);
    }
  }
}

main();
