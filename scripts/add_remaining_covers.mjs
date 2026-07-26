/**
 * add_remaining_covers.mjs
 * Adds cover images for the 30 brands still missing them
 */
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const env = {};
if (fs.existsSync('.dev.vars')) {
  fs.readFileSync('.dev.vars', 'utf8').split('\n').forEach(line => {
    const [k, ...v] = line.split('=');
    if (k && v.length) env[k.trim()] = v.join('=').trim();
  });
}
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const coversPath = path.join(process.cwd(), 'assets', 'data', 'brand_covers.json');

const EXTRA_COVERS = {
  // Fashion — watches / accessories
  "FILA": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&h=627&fit=crop&auto=format&q=80",
  "Tissot": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&h=627&fit=crop&auto=format&q=80",
  "Breitling": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&h=627&fit=crop&auto=format&q=80",
  "Longines": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&h=627&fit=crop&auto=format&q=80",
  "Casio": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&h=627&fit=crop&auto=format&q=80",
  "Sephora": "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1200&h=627&fit=crop&auto=format&q=80",
  "Montblanc": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&h=627&fit=crop&auto=format&q=80",
  "Essentials": "https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=1200&h=627&fit=crop&auto=format&q=80",
  "Swatch": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&h=627&fit=crop&auto=format&q=80",
  "Hollister": "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=627&fit=crop&auto=format&q=80",
  "Hoka One One": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&h=627&fit=crop&auto=format&q=80",
  "Seiko": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&h=627&fit=crop&auto=format&q=80",
  "AllSaints": "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&h=627&fit=crop&auto=format&q=80",
  "GANNI": "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&h=627&fit=crop&auto=format&q=80",
  "Comme des Garçons": "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&h=627&fit=crop&auto=format&q=80",
  "Marni": "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1200&h=627&fit=crop&auto=format&q=80",
  "Everlane": "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=627&fit=crop&auto=format&q=80",
  "Saint Laurent": "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1200&h=627&fit=crop&auto=format&q=80",
  "Vivienne Westwood": "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1200&h=627&fit=crop&auto=format&q=80",
  "Manolo Blahnik": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&h=627&fit=crop&auto=format&q=80",
  "Aritzia": "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=627&fit=crop&auto=format&q=80",
  "Jil Sander": "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&h=627&fit=crop&auto=format&q=80",
  "Reformation": "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=627&fit=crop&auto=format&q=80",
  // Food
  "Firehouse Subs": "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=1200&h=627&fit=crop&auto=format&q=80",
  "Hungry Howie's": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&h=627&fit=crop&auto=format&q=80",
  "Marco's Pizza": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&h=627&fit=crop&auto=format&q=80",
  "Cargill": "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=1200&h=627&fit=crop&auto=format&q=80",
  "Benihana": "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=1200&h=627&fit=crop&auto=format&q=80",
  "Culver's Frozen Custard": "https://images.unsplash.com/photo-1504630083234-14187a9df0f5?w=1200&h=627&fit=crop&auto=format&q=80",
  "7-Eleven Slurpee & Fresh": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&h=627&fit=crop&auto=format&q=80",
};

const { data: fashion } = await supabase.from('fashion_brands').select('id, name');
const { data: food } = await supabase.from('food_brands').select('id, name');
const allBrands = [...(fashion || []), ...(food || [])];

const existing = JSON.parse(fs.readFileSync(coversPath, 'utf8'));
let added = 0;

for (const brand of allBrands) {
  if (existing[brand.id]) continue;
  const cover = EXTRA_COVERS[brand.name];
  if (cover) {
    existing[brand.id] = cover;
    added++;
    console.log(`+ ${brand.name}`);
  }
}

fs.writeFileSync(coversPath, JSON.stringify(existing, null, 2));
const stillMissing = allBrands.filter(b => !existing[b.id]);
console.log(`\nAdded ${added} covers. Total: ${Object.keys(existing).length}. Still missing: ${stillMissing.length}`);
if (stillMissing.length) console.log('Missing:', stillMissing.map(b => b.name).join(', '));
