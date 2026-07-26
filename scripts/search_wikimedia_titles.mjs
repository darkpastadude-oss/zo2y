/**
 * search_wikimedia_titles.mjs
 * Search Wikimedia Commons for actual SVG logo file titles for each brand.
 * Outputs curated results that can be hand-checked.
 */
import fs from 'fs';
const delay = ms => new Promise(res => setTimeout(res, ms));
const WIKI_UA = 'zo2y-brand-fetcher/1.0 (contact@zo2y.com)';

const BRANDS = [
  // Food brands without SVG logos
  "Blaze Pizza", "Bob Evans", "Bojangles", "Buc-ee's",
  "Buffalo Wild Wings", "Carrabba's Italian Grill", "Carvel", "Casey's General Store",
  "Cava", "Culver's", "Danone",
  "First Watch", "Godiva", "Häagen-Dazs",
  "Jet's Pizza", "Jersey Mike's Subs",
  "LongHorn Steakhouse", "Lou Malnati's",
  "Little Caesars",
  "Mellow Mushroom", "MOD Pizza", "Nando's",
  "P.F. Chang's", "Panda Express", "Peet's Coffee",
  "Perkins Restaurant & Bakery", "Portillo's",
  "Red Lobster", "Round Table Pizza",
  "Shake Shack", "Smashburger", "Snooze A.M. Eatery", "Sweetgreen",
  "Torchy's Tacos",
  "Wawa Fresh Food", "White Castle", "Wingstop",
  "Zaxby's", "Zippy's",
  // Also search for Five Guys to get correct result
  "Five Guys",
];

const results = {};

for (const name of BRANDS) {
  await delay(500);
  try {
    const q = `${name} logo`;
    const url = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&srnamespace=6&srlimit=5&format=json`;
    const res = await fetch(url, { headers: { 'User-Agent': WIKI_UA } });
    const data = await res.json();
    const svgs = (data?.query?.search || []).filter(r => r.title?.toLowerCase().endsWith('.svg'));
    
    if (svgs.length > 0) {
      results[name] = svgs.map(s => s.title);
      console.log(`${name}: ${svgs.map(s => s.title).join(' | ')}`);
    } else {
      const all = (data?.query?.search || []).slice(0, 3);
      console.log(`${name}: NO SVG found. Other results: ${all.map(s => s.title).join(' | ') || 'none'}`);
    }
  } catch(e) {
    console.log(`${name}: ERROR - ${e.message}`);
  }
}

fs.writeFileSync('scripts/wikimedia_search_results.json', JSON.stringify(results, null, 2));
console.log('\nSaved to scripts/wikimedia_search_results.json');
