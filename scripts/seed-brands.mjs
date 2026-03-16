import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const ROOT = process.cwd();
const ENV_FILES = [
  '.env',
  '.env.local',
  '.env.vercel',
  '.env.vercel.prod'
].map((file) => path.join(ROOT, file));

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const raw = fs.readFileSync(filePath, 'utf8');
  const env = {};
  raw.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const idx = trimmed.indexOf('=');
    if (idx === -1) return;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      env[key] = value;
    }
  });
  return env;
}

function hydrateEnv() {
  const merged = {};
  ENV_FILES.forEach((filePath) => {
    Object.assign(merged, loadEnvFile(filePath));
  });
  Object.entries(merged).forEach(([key, value]) => {
    if (!(key in process.env)) process.env[key] = value;
  });
}

function normalizeSupabaseUrl(value) {
  if (!value) return '';
  if (value.startsWith('http')) return value;
  return `https://${value}.supabase.co`;
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

hydrateEnv();

const SUPABASE_URL = normalizeSupabaseUrl(process.env.SUPABASE_URL);
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const fashionBrands = [
  { name: 'Nike', domain: 'nike.com', category: 'Sportswear', country: 'USA', founded: '1964', description: 'Global sportswear brand.', tags: ['sportswear', 'sneakers'] },
  { name: 'Adidas', domain: 'adidas.com', category: 'Sportswear', country: 'Germany', founded: '1949', description: 'Athletic apparel and footwear.', tags: ['sportswear', 'sneakers'] },
  { name: 'Zara', domain: 'zara.com', category: 'Fast Fashion', country: 'Spain', founded: '1975', description: 'Spanish fashion retailer.', tags: ['fast fashion'] },
  { name: 'Uniqlo', domain: 'uniqlo.com', category: 'Basics', country: 'Japan', founded: '1949', description: 'Japanese casualwear brand.', tags: ['basics'] },
  { name: 'H&M', domain: 'hm.com', category: 'Fast Fashion', country: 'Sweden', founded: '1947', description: 'Global fashion retailer.', tags: ['fast fashion'] },
  { name: 'Gucci', domain: 'gucci.com', category: 'Luxury', country: 'Italy', founded: '1921', description: 'Italian luxury fashion.', tags: ['luxury'] },
  { name: 'Prada', domain: 'prada.com', category: 'Luxury', country: 'Italy', founded: '1913', description: 'Luxury fashion house.', tags: ['luxury'] },
  { name: 'Louis Vuitton', domain: 'louisvuitton.com', category: 'Luxury', country: 'France', founded: '1854', description: 'French luxury fashion.', tags: ['luxury'] },
  { name: 'Supreme', domain: 'supremenewyork.com', category: 'Streetwear', country: 'USA', founded: '1994', description: 'Streetwear brand.', tags: ['streetwear'] },
  { name: 'Off-White', domain: 'off---white.com', category: 'Streetwear', country: 'Italy', founded: '2012', description: 'Luxury streetwear label.', tags: ['streetwear', 'luxury'] },
  { name: 'Balenciaga', domain: 'balenciaga.com', category: 'Luxury', country: 'France', founded: '1917', description: 'Luxury fashion house.', tags: ['luxury'] },
  { name: 'Stone Island', domain: 'stoneisland.com', category: 'Streetwear', country: 'Italy', founded: '1982', description: 'Technical outerwear.', tags: ['outerwear'] },
  { name: 'The North Face', domain: 'thenorthface.com', category: 'Outdoor', country: 'USA', founded: '1966', description: 'Outdoor apparel and gear.', tags: ['outdoor'] },
  { name: 'Patagonia', domain: 'patagonia.com', category: 'Outdoor', country: 'USA', founded: '1973', description: 'Outdoor clothing company.', tags: ['outdoor', 'sustainability'] },
  { name: 'Levi\'s', domain: 'levi.com', category: 'Denim', country: 'USA', founded: '1853', description: 'Iconic denim brand.', tags: ['denim'] },
  { name: 'Calvin Klein', domain: 'calvinklein.us', category: 'Designer', country: 'USA', founded: '1968', description: 'American designer brand.', tags: ['designer'] },
  { name: 'Ralph Lauren', domain: 'ralphlauren.com', category: 'Designer', country: 'USA', founded: '1967', description: 'Classic American style.', tags: ['designer'] },
  { name: 'Coach', domain: 'coach.com', category: 'Accessories', country: 'USA', founded: '1941', description: 'Leather goods and accessories.', tags: ['accessories'] },
  { name: 'Converse', domain: 'converse.com', category: 'Footwear', country: 'USA', founded: '1908', description: 'Classic sneaker brand.', tags: ['footwear'] },
  { name: 'Vans', domain: 'vans.com', category: 'Streetwear', country: 'USA', founded: '1966', description: 'Skate-inspired footwear.', tags: ['streetwear', 'footwear'] },
  { name: 'Puma', domain: 'puma.com', category: 'Sportswear', country: 'Germany', founded: '1948', description: 'Sportswear brand.', tags: ['sportswear'] },
  { name: 'New Balance', domain: 'newbalance.com', category: 'Sportswear', country: 'USA', founded: '1906', description: 'Athletic footwear and apparel.', tags: ['sportswear'] },
  { name: 'Aritzia', domain: 'aritzia.com', category: 'Womenswear', country: 'Canada', founded: '1984', description: 'Modern womenswear retailer.', tags: ['womenswear'] },
  { name: 'ASOS', domain: 'asos.com', category: 'Fast Fashion', country: 'UK', founded: '2000', description: 'Online fashion retailer.', tags: ['fast fashion'] },
  { name: 'Lululemon', domain: 'lululemon.com', category: 'Athleisure', country: 'Canada', founded: '1998', description: 'Athleisure apparel brand.', tags: ['athleisure'] },
  { name: 'Under Armour', domain: 'underarmour.com', category: 'Sportswear', country: 'USA', founded: '1996', description: 'Performance apparel brand.', tags: ['sportswear'] },
  { name: 'Allbirds', domain: 'allbirds.com', category: 'Footwear', country: 'USA', founded: '2015', description: 'Comfort footwear brand.', tags: ['footwear'] },
  { name: 'Canada Goose', domain: 'canadagoose.com', category: 'Outerwear', country: 'Canada', founded: '1957', description: 'Luxury outerwear brand.', tags: ['outerwear'] },
  { name: 'Moncler', domain: 'moncler.com', category: 'Luxury Outerwear', country: 'Italy', founded: '1952', description: 'Luxury outerwear brand.', tags: ['outerwear', 'luxury'] }
];

const foodBrands = [
  { name: 'McDonald\'s', domain: 'mcdonalds.com', category: 'Fast Food', country: 'USA', founded: '1940', description: 'American fast-food chain.', tags: ['burgers', 'fast food'] },
  { name: 'KFC', domain: 'kfc.com', category: 'Fast Food', country: 'USA', founded: '1952', description: 'Fried chicken specialists.', tags: ['chicken', 'fast food'] },
  { name: 'Burger King', domain: 'burgerking.com', category: 'Fast Food', country: 'USA', founded: '1954', description: 'Home of the Whopper.', tags: ['burgers', 'fast food'] },
  { name: 'Subway', domain: 'subway.com', category: 'Fast Food', country: 'USA', founded: '1965', description: 'Sandwich chain.', tags: ['sandwiches', 'fast food'] },
  { name: 'Taco Bell', domain: 'tacobell.com', category: 'Fast Food', country: 'USA', founded: '1962', description: 'Mexican-inspired fast food.', tags: ['tacos', 'fast food'] },
  { name: 'Domino\'s', domain: 'dominos.com', category: 'Pizza', country: 'USA', founded: '1960', description: 'Pizza delivery chain.', tags: ['pizza'] },
  { name: 'Pizza Hut', domain: 'pizzahut.com', category: 'Pizza', country: 'USA', founded: '1958', description: 'Pizza restaurant chain.', tags: ['pizza'] },
  { name: 'Starbucks', domain: 'starbucks.com', category: 'Coffee', country: 'USA', founded: '1971', description: 'Coffeehouse chain.', tags: ['coffee'] },
  { name: 'Chipotle', domain: 'chipotle.com', category: 'Fast Casual', country: 'USA', founded: '1993', description: 'Fast casual Mexican grill.', tags: ['mexican', 'fast casual'] },
  { name: 'Chick-fil-A', domain: 'chick-fil-a.com', category: 'Fast Food', country: 'USA', founded: '1946', description: 'Chicken sandwich chain.', tags: ['chicken', 'fast food'] },
  { name: 'Wendy\'s', domain: 'wendys.com', category: 'Fast Food', country: 'USA', founded: '1969', description: 'Fast-food hamburger chain.', tags: ['burgers', 'fast food'] },
  { name: 'Shake Shack', domain: 'shakeshack.com', category: 'Fast Casual', country: 'USA', founded: '2004', description: 'Modern burger stand.', tags: ['burgers', 'fast casual'] },
  { name: 'Popeyes', domain: 'popeyes.com', category: 'Fast Food', country: 'USA', founded: '1972', description: 'Louisiana-style fried chicken.', tags: ['chicken', 'fast food'] },
  { name: 'Five Guys', domain: 'fiveguys.com', category: 'Fast Casual', country: 'USA', founded: '1986', description: 'Burgers and fries.', tags: ['burgers', 'fast casual'] },
  { name: 'In-N-Out', domain: 'in-n-out.com', category: 'Fast Food', country: 'USA', founded: '1948', description: 'West Coast burger chain.', tags: ['burgers', 'fast food'] },
  { name: 'Dunkin\'', domain: 'dunkin.com', category: 'Coffee', country: 'USA', founded: '1950', description: 'Coffee and donuts.', tags: ['coffee', 'donuts'] },
  { name: 'Tim Hortons', domain: 'timhortons.com', category: 'Coffee', country: 'Canada', founded: '1964', description: 'Coffee and baked goods.', tags: ['coffee'] },
  { name: 'Panera Bread', domain: 'panerabread.com', category: 'Fast Casual', country: 'USA', founded: '1987', description: 'Bakery-cafe chain.', tags: ['bakery', 'fast casual'] },
  { name: 'Pret A Manger', domain: 'pret.com', category: 'Fast Casual', country: 'UK', founded: '1986', description: 'Fresh sandwiches and salads.', tags: ['sandwiches', 'fast casual'] },
  { name: 'Nando\'s', domain: 'nandos.com', category: 'Fast Casual', country: 'South Africa', founded: '1987', description: 'Flame-grilled peri-peri chicken.', tags: ['chicken', 'fast casual'] },
  { name: 'Domino\'s Pizza', domain: 'dominos.com', category: 'Pizza', country: 'USA', founded: '1960', description: 'Pizza delivery chain.', tags: ['pizza'] },
  { name: 'Little Caesars', domain: 'littlecaesars.com', category: 'Pizza', country: 'USA', founded: '1959', description: 'Pizza chain.', tags: ['pizza'] },
  { name: 'Papa Johns', domain: 'papajohns.com', category: 'Pizza', country: 'USA', founded: '1984', description: 'Pizza delivery chain.', tags: ['pizza'] },
  { name: 'Krispy Kreme', domain: 'krispykreme.com', category: 'Dessert', country: 'USA', founded: '1937', description: 'Donuts and coffee.', tags: ['dessert', 'donuts'] },
  { name: 'Baskin-Robbins', domain: 'baskinrobbins.com', category: 'Dessert', country: 'USA', founded: '1945', description: 'Ice cream chain.', tags: ['dessert', 'ice cream'] },
  { name: 'Cold Stone', domain: 'coldstonecreamery.com', category: 'Dessert', country: 'USA', founded: '1988', description: 'Ice cream and mix-ins.', tags: ['dessert', 'ice cream'] },
  { name: 'Starbucks Reserve', domain: 'starbucks.com', category: 'Coffee', country: 'USA', founded: '2014', description: 'Premium coffee experience.', tags: ['coffee'] },
  { name: 'Cinnabon', domain: 'cinnabon.com', category: 'Dessert', country: 'USA', founded: '1985', description: 'Cinnamon rolls and coffee.', tags: ['dessert'] },
  { name: 'Costa Coffee', domain: 'costacoffee.com', category: 'Coffee', country: 'UK', founded: '1971', description: 'Coffeehouse chain.', tags: ['coffee'] },
  { name: 'IHOP', domain: 'ihop.com', category: 'Restaurants', country: 'USA', founded: '1958', description: 'Family dining chain.', tags: ['restaurants'] },
  { name: 'Denny\'s', domain: 'dennys.com', category: 'Restaurants', country: 'USA', founded: '1953', description: 'Diner chain.', tags: ['restaurants'] },
  { name: 'Applebee\'s', domain: 'applebees.com', category: 'Restaurants', country: 'USA', founded: '1980', description: 'Casual dining chain.', tags: ['restaurants'] },
  { name: 'Olive Garden', domain: 'olivegarden.com', category: 'Restaurants', country: 'USA', founded: '1982', description: 'Italian-American casual dining.', tags: ['restaurants'] },
  { name: 'Texas Roadhouse', domain: 'texasroadhouse.com', category: 'Restaurants', country: 'USA', founded: '1993', description: 'Steakhouse chain.', tags: ['restaurants'] }
];

function toSupabaseRow(brand) {
  return {
    name: brand.name,
    slug: slugify(brand.slug || brand.name),
    domain: brand.domain,
    logo_url: brand.domain ? `https://logo.clearbit.com/${brand.domain}` : null,
    description: brand.description,
    category: brand.category,
    country: brand.country,
    founded: brand.founded,
    tags: brand.tags || []
  };
}

async function upsertBrands(table, rows) {
  const payload = rows.map(toSupabaseRow);
  const { data, error } = await supabase.from(table).upsert(payload, { onConflict: 'slug' }).select('id, slug');
  if (error) throw error;
  return data || [];
}

async function run() {
  console.log('Seeding fashion brands...');
  const fashionResult = await upsertBrands('fashion_brands', fashionBrands);
  console.log(`Fashion upserts: ${fashionResult.length}`);

  console.log('Seeding food brands...');
  const foodResult = await upsertBrands('food_brands', foodBrands);
  console.log(`Food upserts: ${foodResult.length}`);

  console.log('Done.');
}

run().catch((err) => {
  console.error('Seed error:', err?.message || err);
  process.exit(1);
});
