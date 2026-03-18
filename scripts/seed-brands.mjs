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

function normalizeDomain(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return '';
  return raw
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/.*$/, '');
}

function dedupeBrands(items = []) {
  const seen = new Map();
  items.forEach((item) => {
    const domain = normalizeDomain(item.domain);
    const key = domain || slugify(item.slug || item.name);
    if (!key) return;
    if (!seen.has(key)) {
      seen.set(key, { ...item, domain: domain || item.domain });
    }
  });
  return Array.from(seen.values());
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
  { name: 'Off-White', domain: 'offwhite.com', category: 'Streetwear', country: 'Italy', founded: '2012', description: 'Luxury streetwear label.', tags: ['streetwear', 'luxury'] },
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
  { name: 'Moncler', domain: 'moncler.com', category: 'Luxury Outerwear', country: 'Italy', founded: '1952', description: 'Luxury outerwear brand.', tags: ['outerwear', 'luxury'] },
  { name: 'Gap', domain: 'gap.com', category: 'Casual', country: 'USA', founded: '1969', description: 'American casualwear retailer.', tags: ['casual'] },
  { name: 'Old Navy', domain: 'oldnavy.gap.com', category: 'Casual', country: 'USA', founded: '1994', description: 'Affordable casualwear brand.', tags: ['casual'] },
  { name: 'Abercrombie & Fitch', domain: 'abercrombie.com', category: 'Casual', country: 'USA', founded: '1892', description: 'Casual apparel brand.', tags: ['casual'] },
  { name: 'Hollister', domain: 'hollisterco.com', category: 'Casual', country: 'USA', founded: '2000', description: 'Casual teen apparel.', tags: ['casual'] },
  { name: 'American Eagle', domain: 'ae.com', category: 'Casual', country: 'USA', founded: '1977', description: 'Casual apparel and denim.', tags: ['casual', 'denim'] },
  { name: 'Urban Outfitters', domain: 'urbanoutfitters.com', category: 'Streetwear', country: 'USA', founded: '1970', description: 'Lifestyle and streetwear.', tags: ['streetwear'] },
  { name: 'Forever 21', domain: 'forever21.com', category: 'Fast Fashion', country: 'USA', founded: '1984', description: 'Fast fashion retailer.', tags: ['fast fashion'] },
  { name: 'Mango', domain: 'mango.com', category: 'Fast Fashion', country: 'Spain', founded: '1984', description: 'Spanish fashion retailer.', tags: ['fast fashion'] },
  { name: 'SHEIN', domain: 'shein.com', category: 'Fast Fashion', country: 'China', founded: '2008', description: 'Online fast fashion.', tags: ['fast fashion'] },
  { name: 'Reebok', domain: 'reebok.com', category: 'Sportswear', country: 'UK', founded: '1958', description: 'Sportswear brand.', tags: ['sportswear'] },
  { name: 'ASICS', domain: 'asics.com', category: 'Sportswear', country: 'Japan', founded: '1949', description: 'Performance footwear and apparel.', tags: ['sportswear'] },
  { name: 'Skechers', domain: 'skechers.com', category: 'Footwear', country: 'USA', founded: '1992', description: 'Comfort footwear brand.', tags: ['footwear'] },
  { name: 'Fila', domain: 'fila.com', category: 'Sportswear', country: 'Italy', founded: '1911', description: 'Sportswear brand.', tags: ['sportswear'] },
  { name: 'Columbia', domain: 'columbia.com', category: 'Outdoor', country: 'USA', founded: '1938', description: 'Outdoor apparel brand.', tags: ['outdoor'] },
  { name: 'Arc\'teryx', domain: 'arcteryx.com', category: 'Outdoor', country: 'Canada', founded: '1989', description: 'Technical outdoor gear.', tags: ['outdoor'] },
  { name: 'Salomon', domain: 'salomon.com', category: 'Outdoor', country: 'France', founded: '1947', description: 'Outdoor and ski brand.', tags: ['outdoor'] },
  { name: 'Timberland', domain: 'timberland.com', category: 'Footwear', country: 'USA', founded: '1952', description: 'Boots and outdoor apparel.', tags: ['footwear', 'outdoor'] },
  { name: 'Dr. Martens', domain: 'drmartens.com', category: 'Footwear', country: 'UK', founded: '1947', description: 'Iconic boots and shoes.', tags: ['footwear'] },
  { name: 'Birkenstock', domain: 'birkenstock.com', category: 'Footwear', country: 'Germany', founded: '1774', description: 'Comfort footwear brand.', tags: ['footwear'] },
  { name: 'Chanel', domain: 'chanel.com', category: 'Luxury', country: 'France', founded: '1910', description: 'Luxury fashion house.', tags: ['luxury'] },
  { name: 'Dior', domain: 'dior.com', category: 'Luxury', country: 'France', founded: '1946', description: 'Luxury fashion house.', tags: ['luxury'] },
  { name: 'Hermes', domain: 'hermes.com', category: 'Luxury', country: 'France', founded: '1837', description: 'Luxury fashion house.', tags: ['luxury'] },
  { name: 'Burberry', domain: 'burberry.com', category: 'Luxury', country: 'UK', founded: '1856', description: 'British luxury fashion.', tags: ['luxury'] },
  { name: 'Saint Laurent', domain: 'ysl.com', category: 'Luxury', country: 'France', founded: '1961', description: 'Luxury fashion house.', tags: ['luxury'] },
  { name: 'Versace', domain: 'versace.com', category: 'Luxury', country: 'Italy', founded: '1978', description: 'Italian luxury fashion.', tags: ['luxury'] },
  { name: 'Givenchy', domain: 'givenchy.com', category: 'Luxury', country: 'France', founded: '1952', description: 'French luxury fashion.', tags: ['luxury'] },
  { name: 'Fendi', domain: 'fendi.com', category: 'Luxury', country: 'Italy', founded: '1925', description: 'Italian luxury fashion.', tags: ['luxury'] },
  { name: 'Dolce & Gabbana', domain: 'dolcegabbana.com', category: 'Luxury', country: 'Italy', founded: '1985', description: 'Italian luxury fashion.', tags: ['luxury'] },
  { name: 'Bottega Veneta', domain: 'bottegaveneta.com', category: 'Luxury', country: 'Italy', founded: '1966', description: 'Italian luxury fashion.', tags: ['luxury'] },
  { name: 'Balmain', domain: 'balmain.com', category: 'Luxury', country: 'France', founded: '1945', description: 'French luxury fashion.', tags: ['luxury'] },
  { name: 'Hugo Boss', domain: 'hugoboss.com', category: 'Designer', country: 'Germany', founded: '1924', description: 'German designer label.', tags: ['designer'] },
  { name: 'Tommy Hilfiger', domain: 'tommy.com', category: 'Designer', country: 'USA', founded: '1985', description: 'American lifestyle brand.', tags: ['designer'] },
  { name: 'Valentino', domain: 'valentino.com', category: 'Luxury', country: 'Italy', founded: '1960', description: 'Italian luxury fashion.', tags: ['luxury'] },
  { name: 'Celine', domain: 'celine.com', category: 'Luxury', country: 'France', founded: '1945', description: 'French luxury fashion.', tags: ['luxury'] },
  { name: 'Kenzo', domain: 'kenzo.com', category: 'Luxury', country: 'France', founded: '1970', description: 'French luxury fashion.', tags: ['luxury'] },
  { name: 'UGG', domain: 'ugg.com', category: 'Footwear', country: 'USA', founded: '1978', description: 'Sheepskin footwear brand.', tags: ['footwear'] },
  { name: 'Bulgari', domain: 'bulgari.com', category: 'Luxury', country: 'Italy', founded: '1884', description: 'Italian luxury house.', tags: ['luxury'] },
  { name: 'Massimo Dutti', domain: 'massimodutti.com', category: 'Fashion', country: 'Spain', founded: '1985', description: 'Premium fashion label.', tags: ['fashion'] },
  { name: 'Bershka', domain: 'bershka.com', category: 'Fast Fashion', country: 'Spain', founded: '1998', description: 'Youth fashion retailer.', tags: ['fast fashion'] },
  { name: 'Pull&Bear', domain: 'pullandbear.com', category: 'Fast Fashion', country: 'Spain', founded: '1991', description: 'Casual fashion retailer.', tags: ['fast fashion'] },
  { name: 'Stradivarius', domain: 'stradivarius.com', category: 'Fast Fashion', country: 'Spain', founded: '1994', description: 'Womenswear fashion.', tags: ['fast fashion'] },
  { name: 'COS', domain: 'cos.com', category: 'Fashion', country: 'UK', founded: '2007', description: 'Modern, minimalist fashion.', tags: ['fashion'] },
  { name: '& Other Stories', domain: 'stories.com', category: 'Fashion', country: 'Sweden', founded: '2013', description: 'Contemporary fashion label.', tags: ['fashion'] },
  { name: 'Arket', domain: 'arket.com', category: 'Fashion', country: 'Sweden', founded: '2017', description: 'Modern essentials and lifestyle.', tags: ['fashion'] },
  { name: 'Weekday', domain: 'weekday.com', category: 'Streetwear', country: 'Sweden', founded: '2002', description: 'Streetwear and denim.', tags: ['streetwear', 'denim'] },
  { name: 'J.Crew', domain: 'jcrew.com', category: 'Casual', country: 'USA', founded: '1947', description: 'Classic American style.', tags: ['casual'] },
  { name: 'Banana Republic', domain: 'bananarepublic.com', category: 'Designer', country: 'USA', founded: '1978', description: 'Premium casual apparel.', tags: ['designer'] },
  { name: 'Champion', domain: 'champion.com', category: 'Sportswear', country: 'USA', founded: '1919', description: 'Athletic apparel brand.', tags: ['sportswear'] },
  { name: 'Lacoste', domain: 'lacoste.com', category: 'Designer', country: 'France', founded: '1933', description: 'French apparel brand.', tags: ['designer'] },
  { name: 'Gant', domain: 'gant.com', category: 'Designer', country: 'USA', founded: '1949', description: 'American sportswear brand.', tags: ['designer'] },
  { name: 'Diesel', domain: 'diesel.com', category: 'Denim', country: 'Italy', founded: '1978', description: 'Italian denim brand.', tags: ['denim'] },
  { name: 'Guess', domain: 'guess.com', category: 'Designer', country: 'USA', founded: '1981', description: 'American fashion brand.', tags: ['designer'] },
  { name: 'Carhartt', domain: 'carhartt.com', category: 'Workwear', country: 'USA', founded: '1889', description: 'Workwear and streetwear.', tags: ['workwear'] },
  { name: 'Dickies', domain: 'dickies.com', category: 'Workwear', country: 'USA', founded: '1922', description: 'Workwear brand.', tags: ['workwear'] },
  { name: 'Stussy', domain: 'stussy.com', category: 'Streetwear', country: 'USA', founded: '1980', description: 'Iconic streetwear label.', tags: ['streetwear'] },
  { name: 'BAPE', domain: 'bape.com', category: 'Streetwear', country: 'Japan', founded: '1993', description: 'Japanese streetwear brand.', tags: ['streetwear'] },
  { name: 'Palace', domain: 'palaceskateboards.com', category: 'Streetwear', country: 'UK', founded: '2009', description: 'Skatewear and streetwear.', tags: ['streetwear'] }
  ,
  { name: 'Alo Yoga', domain: 'aloyoga.com', category: 'Athleisure', country: 'USA', founded: '2007', description: 'Yoga and athleisure brand.', tags: ['athleisure'] },
  { name: 'Fear of God', domain: 'fearofgod.com', category: 'Streetwear', country: 'USA', founded: '2013', description: 'Luxury streetwear brand.', tags: ['streetwear', 'luxury'] },
  { name: 'Maison Margiela', domain: 'maisonmargiela.com', category: 'Luxury', country: 'France', founded: '1988', description: 'Avant-garde fashion house.', tags: ['luxury'] },
  { name: 'Miu Miu', domain: 'miumiu.com', category: 'Luxury', country: 'Italy', founded: '1993', description: 'Luxury fashion brand.', tags: ['luxury'] },
  { name: 'Tory Burch', domain: 'toryburch.com', category: 'Designer', country: 'USA', founded: '2004', description: 'American designer brand.', tags: ['designer'] },
  { name: 'Michael Kors', domain: 'michaelkors.com', category: 'Designer', country: 'USA', founded: '1981', description: 'American luxury brand.', tags: ['designer'] },
  { name: 'Kate Spade', domain: 'katespade.com', category: 'Designer', country: 'USA', founded: '1993', description: 'Accessories and fashion brand.', tags: ['designer'] },
  { name: 'Burton', domain: 'burton.com', category: 'Outdoor', country: 'USA', founded: '1977', description: 'Snowboard and outdoor apparel.', tags: ['outdoor'] },
  { name: 'Oakley', domain: 'oakley.com', category: 'Sportswear', country: 'USA', founded: '1975', description: 'Sports eyewear and apparel.', tags: ['sportswear'] },
  { name: 'Loro Piana', domain: 'loropiana.com', category: 'Luxury', country: 'Italy', founded: '1924', description: 'Italian luxury textiles.', tags: ['luxury'] },
  { name: 'Gymshark', domain: 'gymshark.com', category: 'Athleisure', country: 'UK', founded: '2012', description: 'Fitness apparel brand.', tags: ['athleisure'] },
  { name: 'Boohoo', domain: 'boohoo.com', category: 'Fast Fashion', country: 'UK', founded: '2006', description: 'Online fast fashion retailer.', tags: ['fast fashion'] },
  { name: 'PrettyLittleThing', domain: 'prettylittlething.com', category: 'Fast Fashion', country: 'UK', founded: '2012', description: 'Online fashion retailer.', tags: ['fast fashion'] },
  { name: 'Missguided', domain: 'missguided.co.uk', category: 'Fast Fashion', country: 'UK', founded: '2009', description: 'Online fashion retailer.', tags: ['fast fashion'] },
  { name: 'Revolve', domain: 'revolve.com', category: 'Fashion', country: 'USA', founded: '2003', description: 'Online fashion retailer.', tags: ['fashion'] },
  { name: 'Farfetch', domain: 'farfetch.com', category: 'Luxury', country: 'UK', founded: '2007', description: 'Luxury fashion marketplace.', tags: ['luxury'] },
  { name: 'SSENSE', domain: 'ssense.com', category: 'Luxury', country: 'Canada', founded: '2003', description: 'Luxury fashion retailer.', tags: ['luxury'] },
  { name: 'Net-a-Porter', domain: 'net-a-porter.com', category: 'Luxury', country: 'UK', founded: '2000', description: 'Luxury fashion retailer.', tags: ['luxury'] },
  { name: 'Zalando', domain: 'zalando.com', category: 'Fashion', country: 'Germany', founded: '2008', description: 'Online fashion retailer.', tags: ['fashion'] },
  { name: 'Nordstrom', domain: 'nordstrom.com', category: 'Retail', country: 'USA', founded: '1901', description: 'Department store retailer.', tags: ['retail'] },
  { name: 'Macy\'s', domain: 'macys.com', category: 'Retail', country: 'USA', founded: '1858', description: 'Department store retailer.', tags: ['retail'] },
  { name: 'Aerie', domain: 'aerie.com', category: 'Casual', country: 'USA', founded: '2006', description: 'Lingerie and apparel brand.', tags: ['casual'] },
  { name: 'Aeropostale', domain: 'aeropostale.com', category: 'Casual', country: 'USA', founded: '1973', description: 'Casual apparel retailer.', tags: ['casual'] },
  { name: 'Express', domain: 'express.com', category: 'Casual', country: 'USA', founded: '1980', description: 'Modern casual apparel.', tags: ['casual'] },
  { name: 'Crocs', domain: 'crocs.com', category: 'Footwear', country: 'USA', founded: '2002', description: 'Comfort footwear brand.', tags: ['footwear'] },
  { name: 'Clarks', domain: 'clarks.com', category: 'Footwear', country: 'UK', founded: '1825', description: 'British footwear brand.', tags: ['footwear'] },
  { name: 'Hoka', domain: 'hoka.com', category: 'Footwear', country: 'USA', founded: '2009', description: 'Running footwear brand.', tags: ['footwear'] },
  { name: 'On', domain: 'on.com', category: 'Footwear', country: 'Switzerland', founded: '2010', description: 'Swiss running brand.', tags: ['footwear'] },
  { name: 'Brooks', domain: 'brooksrunning.com', category: 'Footwear', country: 'USA', founded: '1914', description: 'Running footwear brand.', tags: ['footwear'] },
  { name: 'Saucony', domain: 'saucony.com', category: 'Footwear', country: 'USA', founded: '1898', description: 'Running footwear brand.', tags: ['footwear'] },
  { name: 'Merrell', domain: 'merrell.com', category: 'Footwear', country: 'USA', founded: '1981', description: 'Outdoor footwear brand.', tags: ['footwear', 'outdoor'] },
  { name: 'Salvatore Ferragamo', domain: 'ferragamo.com', category: 'Luxury', country: 'Italy', founded: '1927', description: 'Italian luxury brand.', tags: ['luxury'] },
  { name: 'Alexander McQueen', domain: 'alexandermcqueen.com', category: 'Luxury', country: 'UK', founded: '1992', description: 'British luxury fashion house.', tags: ['luxury'] },
  { name: 'Tiffany & Co.', domain: 'tiffany.com', category: 'Luxury', country: 'USA', founded: '1837', description: 'Luxury jewelry brand.', tags: ['luxury'] },
  { name: 'Pandora', domain: 'pandora.net', category: 'Accessories', country: 'Denmark', founded: '1982', description: 'Jewelry brand.', tags: ['accessories'] },
  { name: 'Swarovski', domain: 'swarovski.com', category: 'Accessories', country: 'Austria', founded: '1895', description: 'Crystal jewelry brand.', tags: ['accessories'] },
  { name: 'Ray-Ban', domain: 'ray-ban.com', category: 'Accessories', country: 'USA', founded: '1937', description: 'Eyewear brand.', tags: ['accessories'] },
  { name: 'Victoria\'s Secret', domain: 'victoriassecret.com', category: 'Lingerie', country: 'USA', founded: '1977', description: 'Lingerie and apparel brand.', tags: ['lingerie'] }
];

const extraFashionBrands = [
  { name: 'Topshop', domain: 'topshop.com', category: 'Fashion', country: 'UK', founded: '1964', description: 'British fashion retailer.', tags: ['fashion'] },
  { name: 'Monki', domain: 'monki.com', category: 'Fashion', country: 'Sweden', founded: '2006', description: 'Scandinavian fashion label.', tags: ['fashion'] },
  { name: 'Everlane', domain: 'everlane.com', category: 'Basics', country: 'USA', founded: '2010', description: 'Modern essentials brand.', tags: ['basics'] },
  { name: 'Madewell', domain: 'madewell.com', category: 'Denim', country: 'USA', founded: '1937', description: 'Denim and casualwear brand.', tags: ['denim', 'casual'] },
  { name: 'Reformation', domain: 'thereformation.com', category: 'Fashion', country: 'USA', founded: '2009', description: 'Sustainable womenswear label.', tags: ['fashion', 'sustainability'] },
  { name: 'Free People', domain: 'freepeople.com', category: 'Fashion', country: 'USA', founded: '1984', description: 'Bohemian lifestyle brand.', tags: ['fashion'] },
  { name: 'Anthropologie', domain: 'anthropologie.com', category: 'Retail', country: 'USA', founded: '1992', description: 'Lifestyle fashion retailer.', tags: ['retail', 'fashion'] },
  { name: 'Sezane', domain: 'sezane.com', category: 'Fashion', country: 'France', founded: '2013', description: 'Parisian ready-to-wear label.', tags: ['fashion'] },
  { name: 'AllSaints', domain: 'allsaints.com', category: 'Fashion', country: 'UK', founded: '1994', description: 'British contemporary label.', tags: ['fashion'] },
  { name: 'Theory', domain: 'theory.com', category: 'Designer', country: 'USA', founded: '1997', description: 'Modern tailored essentials.', tags: ['designer'] },
  { name: 'Helmut Lang', domain: 'helmutlang.com', category: 'Designer', country: 'USA', founded: '1986', description: 'Minimalist fashion label.', tags: ['designer'] },
  { name: 'Rag & Bone', domain: 'rag-bone.com', category: 'Designer', country: 'USA', founded: '2002', description: 'Modern New York label.', tags: ['designer'] },
  { name: 'FRAME', domain: 'frame-store.com', category: 'Denim', country: 'USA', founded: '2012', description: 'Premium denim and ready-to-wear.', tags: ['denim', 'fashion'] },
  { name: 'SKIMS', domain: 'skims.com', category: 'Lingerie', country: 'USA', founded: '2019', description: 'Shapewear and essentials brand.', tags: ['lingerie'] },
  { name: 'Spanx', domain: 'spanx.com', category: 'Lingerie', country: 'USA', founded: '2000', description: 'Shapewear and apparel brand.', tags: ['lingerie'] },
  { name: 'Savage X Fenty', domain: 'savagex.com', category: 'Lingerie', country: 'USA', founded: '2018', description: 'Inclusive lingerie brand.', tags: ['lingerie'] },
  { name: 'Vuori', domain: 'vuoriclothing.com', category: 'Athleisure', country: 'USA', founded: '2015', description: 'Performance lifestyle apparel.', tags: ['athleisure'] },
  { name: 'Outdoor Voices', domain: 'outdoorvoices.com', category: 'Athleisure', country: 'USA', founded: '2013', description: 'Recreational activewear brand.', tags: ['athleisure'] },
  { name: 'Fjallraven', domain: 'fjallraven.com', category: 'Outdoor', country: 'Sweden', founded: '1960', description: 'Outdoor gear and apparel.', tags: ['outdoor'] },
  { name: 'Helly Hansen', domain: 'hellyhansen.com', category: 'Outdoor', country: 'Norway', founded: '1877', description: 'Sailing and outdoor apparel.', tags: ['outdoor'] },
  { name: 'Mammut', domain: 'mammut.com', category: 'Outdoor', country: 'Switzerland', founded: '1862', description: 'Alpine outdoor brand.', tags: ['outdoor'] },
  { name: 'Barbour', domain: 'barbour.com', category: 'Outerwear', country: 'UK', founded: '1894', description: 'British outerwear label.', tags: ['outerwear'] },
  { name: 'Ted Baker', domain: 'tedbaker.com', category: 'Designer', country: 'UK', founded: '1988', description: 'British designer label.', tags: ['designer'] },
  { name: 'Superdry', domain: 'superdry.com', category: 'Casual', country: 'UK', founded: '2003', description: 'British casualwear brand.', tags: ['casual'] },
  { name: 'Brunello Cucinelli', domain: 'brunellocucinelli.com', category: 'Luxury', country: 'Italy', founded: '1978', description: 'Italian luxury house.', tags: ['luxury'] },
  { name: 'Zegna', domain: 'zegna.com', category: 'Luxury', country: 'Italy', founded: '1910', description: 'Italian luxury menswear house.', tags: ['luxury'] },
  { name: 'Canali', domain: 'canali.com', category: 'Luxury', country: 'Italy', founded: '1934', description: 'Italian tailoring brand.', tags: ['luxury'] },
  { name: 'Mackage', domain: 'mackage.com', category: 'Outerwear', country: 'Canada', founded: '1999', description: 'Luxury outerwear label.', tags: ['outerwear', 'luxury'] },
  { name: 'Moose Knuckles', domain: 'mooseknucklescanada.com', category: 'Outerwear', country: 'Canada', founded: '2009', description: 'Canadian luxury outerwear.', tags: ['outerwear', 'luxury'] },
  { name: 'A.P.C.', domain: 'apc-us.com', category: 'Designer', country: 'France', founded: '1987', description: 'Minimal French fashion label.', tags: ['designer'] },
  { name: 'AMI Paris', domain: 'amiparis.com', category: 'Designer', country: 'France', founded: '2011', description: 'Parisian contemporary fashion.', tags: ['designer'] },
  { name: 'Jacquemus', domain: 'jacquemus.com', category: 'Luxury', country: 'France', founded: '2009', description: 'French luxury fashion label.', tags: ['luxury'] },
  { name: 'Kith', domain: 'kith.com', category: 'Streetwear', country: 'USA', founded: '2011', description: 'Streetwear and lifestyle label.', tags: ['streetwear'] },
  { name: 'Represent', domain: 'representclo.com', category: 'Streetwear', country: 'UK', founded: '2011', description: 'British streetwear brand.', tags: ['streetwear'] },
  { name: 'Sandro', domain: 'sandro-paris.com', category: 'Designer', country: 'France', founded: '1984', description: 'Parisian contemporary label.', tags: ['designer'] },
  { name: 'Maje', domain: 'maje.com', category: 'Designer', country: 'France', founded: '1998', description: 'Paris fashion brand.', tags: ['designer'] },
  { name: 'Marine Serre', domain: 'marineserre.com', category: 'Luxury', country: 'France', founded: '2017', description: 'Paris luxury label.', tags: ['luxury'] },
  { name: 'Noah', domain: 'noahny.com', category: 'Streetwear', country: 'USA', founded: '2015', description: 'New York streetwear brand.', tags: ['streetwear'] },
  { name: 'Pleasures', domain: 'pleasuresnow.com', category: 'Streetwear', country: 'USA', founded: '2015', description: 'Streetwear and graphic apparel.', tags: ['streetwear'] },
  { name: 'Rhone', domain: 'rhone.com', category: 'Athleisure', country: 'USA', founded: '2014', description: 'Performance lifestyle apparel.', tags: ['athleisure'] }
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
  { name: 'Texas Roadhouse', domain: 'texasroadhouse.com', category: 'Restaurants', country: 'USA', founded: '1993', description: 'Steakhouse chain.', tags: ['restaurants'] },
  { name: 'Arby\'s', domain: 'arbys.com', category: 'Fast Food', country: 'USA', founded: '1964', description: 'Roast beef sandwiches.', tags: ['fast food'] },
  { name: 'Sonic', domain: 'sonicdrivein.com', category: 'Fast Food', country: 'USA', founded: '1953', description: 'Drive-in fast food.', tags: ['fast food'] },
  { name: 'Jack in the Box', domain: 'jackinthebox.com', category: 'Fast Food', country: 'USA', founded: '1951', description: 'Fast food chain.', tags: ['fast food'] },
  { name: 'Whataburger', domain: 'whataburger.com', category: 'Fast Food', country: 'USA', founded: '1950', description: 'Burger chain.', tags: ['fast food'] },
  { name: 'Culver\'s', domain: 'culvers.com', category: 'Fast Food', country: 'USA', founded: '1984', description: 'Butter burgers and custard.', tags: ['fast food'] },
  { name: 'Raising Cane\'s', domain: 'raisingcanes.com', category: 'Fast Food', country: 'USA', founded: '1996', description: 'Chicken finger chain.', tags: ['chicken', 'fast food'] },
  { name: 'Jersey Mike\'s', domain: 'jerseymikes.com', category: 'Fast Casual', country: 'USA', founded: '1956', description: 'Sub sandwiches.', tags: ['sandwiches'] },
  { name: 'Jimmy John\'s', domain: 'jimmyjohns.com', category: 'Fast Casual', country: 'USA', founded: '1983', description: 'Sub sandwiches.', tags: ['sandwiches'] },
  { name: 'Firehouse Subs', domain: 'firehousesubs.com', category: 'Fast Casual', country: 'USA', founded: '1994', description: 'Hot subs.', tags: ['sandwiches'] },
  { name: 'QDOBA', domain: 'qdoba.com', category: 'Fast Casual', country: 'USA', founded: '1995', description: 'Mexican fast casual.', tags: ['mexican', 'fast casual'] },
  { name: 'El Pollo Loco', domain: 'elpolloloco.com', category: 'Fast Food', country: 'USA', founded: '1975', description: 'Grilled chicken chain.', tags: ['chicken', 'fast food'] },
  { name: 'Zaxby\'s', domain: 'zaxbys.com', category: 'Fast Food', country: 'USA', founded: '1990', description: 'Chicken fingers and wings.', tags: ['chicken', 'fast food'] },
  { name: 'Wingstop', domain: 'wingstop.com', category: 'Fast Food', country: 'USA', founded: '1994', description: 'Wing chain.', tags: ['chicken', 'fast food'] },
  { name: 'Panda Express', domain: 'pandaexpress.com', category: 'Fast Food', country: 'USA', founded: '1983', description: 'Chinese fast food.', tags: ['fast food'] },
  { name: 'Peet\'s Coffee', domain: 'peets.com', category: 'Coffee', country: 'USA', founded: '1966', description: 'Coffee roaster and cafe.', tags: ['coffee'] },
  { name: 'Dairy Queen', domain: 'dairyqueen.com', category: 'Dessert', country: 'USA', founded: '1940', description: 'Ice cream and fast food.', tags: ['dessert'] },
  { name: 'Bojangles', domain: 'bojangles.com', category: 'Fast Food', country: 'USA', founded: '1977', description: 'Southern chicken chain.', tags: ['chicken', 'fast food'] },
  { name: 'Jollibee', domain: 'jollibee.com', category: 'Fast Food', country: 'Philippines', founded: '1978', description: 'Global fast food chain.', tags: ['fast food'] },
  { name: 'Greggs', domain: 'greggs.co.uk', category: 'Bakery', country: 'UK', founded: '1939', description: 'Bakery chain.', tags: ['bakery'] },
  { name: 'Chili\'s', domain: 'chilis.com', category: 'Restaurants', country: 'USA', founded: '1975', description: 'Casual dining chain.', tags: ['restaurants'] },
  { name: 'Buffalo Wild Wings', domain: 'buffalowildwings.com', category: 'Restaurants', country: 'USA', founded: '1982', description: 'Sports bar and wings.', tags: ['restaurants'] },
  { name: 'Outback Steakhouse', domain: 'outback.com', category: 'Restaurants', country: 'USA', founded: '1988', description: 'Steakhouse chain.', tags: ['restaurants'] },
  { name: 'P.F. Chang\'s', domain: 'pfchangs.com', category: 'Restaurants', country: 'USA', founded: '1993', description: 'Asian bistro chain.', tags: ['restaurants'] },
  { name: 'Red Lobster', domain: 'redlobster.com', category: 'Restaurants', country: 'USA', founded: '1968', description: 'Seafood restaurant chain.', tags: ['restaurants'] },
  { name: 'CAVA', domain: 'cava.com', category: 'Fast Casual', country: 'USA', founded: '2006', description: 'Mediterranean fast casual.', tags: ['fast casual'] },
  { name: 'Sweetgreen', domain: 'sweetgreen.com', category: 'Fast Casual', country: 'USA', founded: '2007', description: 'Salads and bowls.', tags: ['fast casual'] },
  { name: 'Noodles & Company', domain: 'noodles.com', category: 'Fast Casual', country: 'USA', founded: '1995', description: 'Noodle-focused chain.', tags: ['fast casual'] },
  { name: 'Panda Express', domain: 'pandaexpress.com', category: 'Fast Casual', country: 'USA', founded: '1983', description: 'Chinese-American fast casual.', tags: ['fast casual'] },
  { name: 'Carl\'s Jr.', domain: 'carlsjr.com', category: 'Fast Food', country: 'USA', founded: '1941', description: 'Burger chain.', tags: ['fast food'] },
  { name: 'Hardee\'s', domain: 'hardees.com', category: 'Fast Food', country: 'USA', founded: '1960', description: 'Burger chain.', tags: ['fast food'] },
  { name: 'Whataburger', domain: 'whataburger.com', category: 'Fast Food', country: 'USA', founded: '1950', description: 'Burger chain.', tags: ['fast food'] },
  { name: 'Culver\'s', domain: 'culvers.com', category: 'Fast Food', country: 'USA', founded: '1984', description: 'Butter burgers and custard.', tags: ['fast food'] },
  { name: 'Raising Cane\'s', domain: 'raisingcanes.com', category: 'Fast Food', country: 'USA', founded: '1996', description: 'Chicken finger chain.', tags: ['chicken', 'fast food'] },
  { name: 'Zaxby\'s', domain: 'zaxbys.com', category: 'Fast Food', country: 'USA', founded: '1990', description: 'Chicken chain.', tags: ['chicken', 'fast food'] },
  { name: 'Wingstop', domain: 'wingstop.com', category: 'Fast Food', country: 'USA', founded: '1994', description: 'Wing chain.', tags: ['chicken', 'fast food'] },
  { name: 'Papa Murphy\'s', domain: 'papamurphys.com', category: 'Pizza', country: 'USA', founded: '1995', description: 'Take-and-bake pizza chain.', tags: ['pizza'] },
  { name: 'Jimmy John\'s', domain: 'jimmyjohns.com', category: 'Fast Food', country: 'USA', founded: '1983', description: 'Sandwich chain.', tags: ['sandwiches'] },
  { name: 'Firehouse Subs', domain: 'firehousesubs.com', category: 'Fast Food', country: 'USA', founded: '1994', description: 'Sandwich chain.', tags: ['sandwiches'] },
  { name: 'Jersey Mike\'s', domain: 'jerseymikes.com', category: 'Fast Food', country: 'USA', founded: '1956', description: 'Subs and sandwiches.', tags: ['sandwiches'] },
  { name: 'El Pollo Loco', domain: 'elpolloloco.com', category: 'Fast Food', country: 'USA', founded: '1975', description: 'Mexican-style chicken.', tags: ['chicken'] },
  { name: 'Qdoba', domain: 'qdoba.com', category: 'Fast Casual', country: 'USA', founded: '1995', description: 'Mexican fast casual.', tags: ['fast casual'] },
  { name: 'Wendy\'s', domain: 'wendys.com', category: 'Fast Food', country: 'USA', founded: '1969', description: 'Burger chain.', tags: ['fast food'] },
  { name: 'Chick-fil-A', domain: 'chick-fil-a.com', category: 'Fast Food', country: 'USA', founded: '1946', description: 'Chicken sandwich chain.', tags: ['chicken', 'fast food'] },
  { name: 'Popeyes', domain: 'popeyes.com', category: 'Fast Food', country: 'USA', founded: '1972', description: 'Fried chicken chain.', tags: ['chicken', 'fast food'] },
  { name: 'Jack in the Box', domain: 'jackinthebox.com', category: 'Fast Food', country: 'USA', founded: '1951', description: 'Burger chain.', tags: ['fast food'] },
  { name: 'Del Taco', domain: 'deltaco.com', category: 'Fast Food', country: 'USA', founded: '1964', description: 'Mexican-American fast food.', tags: ['fast food'] },
  { name: 'Sonic Drive-In', domain: 'sonicdrivein.com', category: 'Fast Food', country: 'USA', founded: '1953', description: 'Drive-in fast food.', tags: ['fast food'] },
  { name: 'Little Caesars', domain: 'littlecaesars.com', category: 'Pizza', country: 'USA', founded: '1959', description: 'Pizza chain.', tags: ['pizza'] },
  { name: 'Papa John\'s', domain: 'papajohns.com', category: 'Pizza', country: 'USA', founded: '1984', description: 'Pizza delivery chain.', tags: ['pizza'] },
  { name: 'Krispy Kreme', domain: 'krispykreme.com', category: 'Dessert', country: 'USA', founded: '1937', description: 'Doughnut chain.', tags: ['dessert'] },
  { name: 'Cinnabon', domain: 'cinnabon.com', category: 'Dessert', country: 'USA', founded: '1985', description: 'Cinnamon roll chain.', tags: ['dessert'] },
  { name: 'Auntie Anne\'s', domain: 'auntieannes.com', category: 'Dessert', country: 'USA', founded: '1988', description: 'Pretzel chain.', tags: ['dessert'] },
  { name: 'Tim Hortons', domain: 'timhortons.com', category: 'Coffee', country: 'Canada', founded: '1964', description: 'Coffee and doughnuts.', tags: ['coffee'] },
  { name: 'Church\'s Chicken', domain: 'churchs.com', category: 'Fast Food', country: 'USA', founded: '1952', description: 'Fried chicken chain.', tags: ['chicken', 'fast food'] },
  { name: 'In-N-Out Burger', domain: 'in-n-out.com', category: 'Fast Food', country: 'USA', founded: '1948', description: 'Burger chain.', tags: ['fast food'] },
  { name: 'Five Guys', domain: 'fiveguys.com', category: 'Fast Food', country: 'USA', founded: '1986', description: 'Burger chain.', tags: ['fast food'] },
  { name: 'Shake Shack', domain: 'shakeshack.com', category: 'Fast Casual', country: 'USA', founded: '2004', description: 'Burger and shakes.', tags: ['fast casual'] },
  { name: 'Whataburger', domain: 'whataburger.com', category: 'Fast Food', country: 'USA', founded: '1950', description: 'Burger chain.', tags: ['fast food'] },
  { name: 'Olive Garden', domain: 'olivegarden.com', category: 'Restaurants', country: 'USA', founded: '1982', description: 'Italian-American restaurant chain.', tags: ['restaurants'] },
  { name: 'Texas Roadhouse', domain: 'texasroadhouse.com', category: 'Restaurants', country: 'USA', founded: '1993', description: 'Steakhouse chain.', tags: ['restaurants'] },
  { name: 'Cracker Barrel', domain: 'crackerbarrel.com', category: 'Restaurants', country: 'USA', founded: '1969', description: 'Country restaurant chain.', tags: ['restaurants'] },
  { name: 'Denny\'s', domain: 'dennys.com', category: 'Restaurants', country: 'USA', founded: '1953', description: 'Diner-style restaurant.', tags: ['restaurants'] },
  { name: 'IHOP', domain: 'ihop.com', category: 'Restaurants', country: 'USA', founded: '1958', description: 'Pancake house chain.', tags: ['restaurants'] },
  { name: 'Cheesecake Factory', domain: 'thecheesecakefactory.com', category: 'Restaurants', country: 'USA', founded: '1978', description: 'Restaurant and bakery chain.', tags: ['restaurants'] },
  { name: 'Costa Coffee', domain: 'costacoffee.com', category: 'Coffee', country: 'UK', founded: '1971', description: 'Coffeehouse chain.', tags: ['coffee'] },
  { name: 'Pret A Manger', domain: 'pret.com', category: 'Fast Casual', country: 'UK', founded: '1983', description: 'Sandwich and coffee chain.', tags: ['fast casual'] },
  { name: 'Peet\'s Coffee', domain: 'peets.com', category: 'Coffee', country: 'USA', founded: '1966', description: 'Coffee roaster and cafe.', tags: ['coffee'] },
  { name: 'Caribou Coffee', domain: 'cariboucoffee.com', category: 'Coffee', country: 'USA', founded: '1992', description: 'Coffeehouse chain.', tags: ['coffee'] }
];

const extraFoodBrands = [
  { name: 'A&W Restaurants', domain: 'awrestaurants.com', category: 'Fast Food', country: 'USA', founded: '1919', description: 'Root beer and burger chain.', tags: ['fast food'] },
  { name: 'Portillo\'s', domain: 'portillos.com', category: 'Fast Casual', country: 'USA', founded: '1963', description: 'Chicago-style fast casual chain.', tags: ['fast casual'] },
  { name: 'White Castle', domain: 'whitecastle.com', category: 'Fast Food', country: 'USA', founded: '1921', description: 'Slider-focused fast food chain.', tags: ['fast food'] },
  { name: 'Checkers & Rally\'s', domain: 'checkers.com', category: 'Fast Food', country: 'USA', founded: '1986', description: 'Drive-thru burger chain.', tags: ['fast food'] },
  { name: 'Moe\'s Southwest Grill', domain: 'moes.com', category: 'Fast Casual', country: 'USA', founded: '2000', description: 'Tex-Mex fast casual chain.', tags: ['fast casual', 'mexican'] },
  { name: 'Torchy\'s Tacos', domain: 'torchystacos.com', category: 'Fast Casual', country: 'USA', founded: '2006', description: 'Taco-focused fast casual chain.', tags: ['fast casual', 'mexican'] },
  { name: 'The Habit Burger Grill', domain: 'habitburger.com', category: 'Fast Casual', country: 'USA', founded: '1969', description: 'Chargrilled burger chain.', tags: ['fast casual'] },
  { name: 'Freddy\'s Frozen Custard & Steakburgers', domain: 'freddys.com', category: 'Fast Casual', country: 'USA', founded: '2002', description: 'Burger and custard chain.', tags: ['fast casual'] },
  { name: 'Auntie Anne\'s', domain: 'auntieannes.com', category: 'Dessert', country: 'USA', founded: '1988', description: 'Pretzel and snack chain.', tags: ['dessert'] },
  { name: 'Crumbl', domain: 'crumblcookies.com', category: 'Dessert', country: 'USA', founded: '2017', description: 'Cookie bakery chain.', tags: ['dessert'] },
  { name: 'Insomnia Cookies', domain: 'insomniacookies.com', category: 'Dessert', country: 'USA', founded: '2003', description: 'Late-night cookie chain.', tags: ['dessert'] },
  { name: 'Jamba', domain: 'jamba.com', category: 'Drinks', country: 'USA', founded: '1990', description: 'Smoothie and juice chain.', tags: ['drinks'] },
  { name: 'Smoothie King', domain: 'smoothieking.com', category: 'Drinks', country: 'USA', founded: '1973', description: 'Smoothie chain.', tags: ['drinks'] },
  { name: 'Dutch Bros', domain: 'dutchbros.com', category: 'Coffee', country: 'USA', founded: '1992', description: 'Drive-thru coffee chain.', tags: ['coffee'] },
  { name: 'Blue Bottle Coffee', domain: 'bluebottlecoffee.com', category: 'Coffee', country: 'USA', founded: '2002', description: 'Specialty coffee chain.', tags: ['coffee'] },
  { name: 'Philz Coffee', domain: 'philzcoffee.com', category: 'Coffee', country: 'USA', founded: '2003', description: 'Pour-over coffee chain.', tags: ['coffee'] },
  { name: 'Joe & The Juice', domain: 'joejuice.com', category: 'Drinks', country: 'Denmark', founded: '2002', description: 'Juice and sandwich chain.', tags: ['drinks'] },
  { name: 'Wagamama', domain: 'wagamama.com', category: 'Restaurants', country: 'UK', founded: '1992', description: 'Asian-inspired restaurant chain.', tags: ['restaurants'] },
  { name: 'YO! Sushi', domain: 'yosushi.com', category: 'Restaurants', country: 'UK', founded: '1997', description: 'Sushi restaurant chain.', tags: ['restaurants'] },
  { name: 'Din Tai Fung', domain: 'din-tai-fung.com', category: 'Restaurants', country: 'Taiwan', founded: '1958', description: 'Global dumpling restaurant chain.', tags: ['restaurants'] },
  { name: 'Nobu', domain: 'noburestaurants.com', category: 'Restaurants', country: 'USA', founded: '1994', description: 'Luxury restaurant chain.', tags: ['restaurants'] },
  { name: 'LongHorn Steakhouse', domain: 'longhornsteakhouse.com', category: 'Restaurants', country: 'USA', founded: '1981', description: 'Steakhouse chain.', tags: ['restaurants'] },
  { name: 'Bonefish Grill', domain: 'bonefishgrill.com', category: 'Restaurants', country: 'USA', founded: '2000', description: 'Seafood restaurant chain.', tags: ['restaurants'] },
  { name: 'Carrabba\'s Italian Grill', domain: 'carrabbas.com', category: 'Restaurants', country: 'USA', founded: '1986', description: 'Italian restaurant chain.', tags: ['restaurants'] },
  { name: 'BJ\'s Restaurant & Brewhouse', domain: 'bjsrestaurants.com', category: 'Restaurants', country: 'USA', founded: '1978', description: 'Brewpub and restaurant chain.', tags: ['restaurants'] },
  { name: 'Captain D\'s', domain: 'captainds.com', category: 'Fast Food', country: 'USA', founded: '1969', description: 'Seafood fast-food chain.', tags: ['fast food'] },
  { name: 'Long John Silver\'s', domain: 'ljsilvers.com', category: 'Fast Food', country: 'USA', founded: '1969', description: 'Seafood fast-food chain.', tags: ['fast food'] },
  { name: 'Del Taco', domain: 'deltaco.com', category: 'Fast Food', country: 'USA', founded: '1964', description: 'Mexican-American fast-food chain.', tags: ['fast food', 'mexican'] },
  { name: 'Texas Chicken', domain: 'txchicken.com', category: 'Fast Food', country: 'USA', founded: '1952', description: 'International fried chicken chain.', tags: ['fast food', 'chicken'] },
  { name: 'Hungry Jack\'s', domain: 'hungryjacks.com.au', category: 'Fast Food', country: 'Australia', founded: '1971', description: 'Australian burger chain.', tags: ['fast food'] },
  { name: 'MOS Burger', domain: 'mos.jp', category: 'Fast Food', country: 'Japan', founded: '1972', description: 'Japanese burger chain.', tags: ['fast food'] },
  { name: 'Paris Baguette', domain: 'parisbaguette.com', category: 'Bakery', country: 'South Korea', founded: '1988', description: 'Bakery cafe chain.', tags: ['bakery'] },
  { name: 'Tous les Jours', domain: 'tljus.com', category: 'Bakery', country: 'South Korea', founded: '1997', description: 'Bakery cafe chain.', tags: ['bakery'] },
  { name: 'Caffe Nero', domain: 'caffenero.com', category: 'Coffee', country: 'UK', founded: '1997', description: 'Coffeehouse chain.', tags: ['coffee'] },
  { name: 'Pretzelmaker', domain: 'pretzelmaker.com', category: 'Dessert', country: 'USA', founded: '1991', description: 'Pretzel chain.', tags: ['dessert'] },
  { name: 'Sbarro', domain: 'sbarro.com', category: 'Pizza', country: 'USA', founded: '1956', description: 'Pizza-by-the-slice chain.', tags: ['pizza'] },
  { name: 'Dave\'s Hot Chicken', domain: 'daveshotchicken.com', category: 'Fast Casual', country: 'USA', founded: '2017', description: 'Hot chicken fast casual chain.', tags: ['fast casual', 'chicken'] },
  { name: 'Zippy\'s', domain: 'zippys.com', category: 'Restaurants', country: 'USA', founded: '1966', description: 'Hawaiian restaurant chain.', tags: ['restaurants'] },
  { name: 'Gregorys Coffee', domain: 'gregoryscoffee.com', category: 'Coffee', country: 'USA', founded: '2006', description: 'Coffeehouse chain.', tags: ['coffee'] },
  { name: 'Braum\'s', domain: 'braums.com', category: 'Dessert', country: 'USA', founded: '1968', description: 'Ice cream and dairy-based quick service chain.', tags: ['dessert'] }
];

const carBrands = [
  { name: 'Toyota', domain: 'toyota.com', category: 'Automaker', country: 'Japan', founded: '1937', description: 'Global automaker.', tags: ['automaker'] },
  { name: 'Honda', domain: 'honda.com', category: 'Automaker', country: 'Japan', founded: '1948', description: 'Japanese automaker.', tags: ['automaker'] },
  { name: 'Volkswagen', domain: 'volkswagen.com', category: 'Automaker', country: 'Germany', founded: '1937', description: 'German automaker.', tags: ['automaker'] },
  { name: 'Ford', domain: 'ford.com', category: 'Automaker', country: 'USA', founded: '1903', description: 'American automaker.', tags: ['automaker'] },
  { name: 'Chevrolet', domain: 'chevrolet.com', category: 'Automaker', country: 'USA', founded: '1911', description: 'American automaker.', tags: ['automaker'] },
  { name: 'Nissan', domain: 'nissan-global.com', category: 'Automaker', country: 'Japan', founded: '1933', description: 'Japanese automaker.', tags: ['automaker'] },
  { name: 'Hyundai', domain: 'hyundai.com', category: 'Automaker', country: 'South Korea', founded: '1967', description: 'Korean automaker.', tags: ['automaker'] },
  { name: 'Kia', domain: 'kia.com', category: 'Automaker', country: 'South Korea', founded: '1944', description: 'Korean automaker.', tags: ['automaker'] },
  { name: 'BMW', domain: 'bmw.com', category: 'Luxury', country: 'Germany', founded: '1916', description: 'German luxury automaker.', tags: ['luxury'] },
  { name: 'Mercedes-Benz', domain: 'mercedes-benz.com', category: 'Luxury', country: 'Germany', founded: '1926', description: 'German luxury automaker.', tags: ['luxury'] },
  { name: 'Audi', domain: 'audi.com', category: 'Luxury', country: 'Germany', founded: '1909', description: 'German luxury automaker.', tags: ['luxury'] },
  { name: 'Lexus', domain: 'lexus.com', category: 'Luxury', country: 'Japan', founded: '1989', description: 'Luxury vehicle brand.', tags: ['luxury'] },
  { name: 'Tesla', domain: 'tesla.com', category: 'EV', country: 'USA', founded: '2003', description: 'Electric vehicle maker.', tags: ['ev'] },
  { name: 'Porsche', domain: 'porsche.com', category: 'Luxury', country: 'Germany', founded: '1931', description: 'Sports car manufacturer.', tags: ['luxury'] },
  { name: 'Ferrari', domain: 'ferrari.com', category: 'Luxury', country: 'Italy', founded: '1939', description: 'Italian sports car manufacturer.', tags: ['luxury'] },
  { name: 'Lamborghini', domain: 'lamborghini.com', category: 'Luxury', country: 'Italy', founded: '1963', description: 'Italian sports car manufacturer.', tags: ['luxury'] },
  { name: 'Land Rover', domain: 'landrover.com', category: 'Luxury', country: 'UK', founded: '1948', description: 'SUV and off-road vehicles.', tags: ['luxury', 'suv'] },
  { name: 'Jaguar', domain: 'jaguar.com', category: 'Luxury', country: 'UK', founded: '1922', description: 'Luxury vehicle brand.', tags: ['luxury'] },
  { name: 'Volvo', domain: 'volvocars.com', category: 'Automaker', country: 'Sweden', founded: '1927', description: 'Swedish automaker.', tags: ['automaker'] },
  { name: 'Subaru', domain: 'subaru.com', category: 'Automaker', country: 'Japan', founded: '1953', description: 'Japanese automaker.', tags: ['automaker'] },
  { name: 'Mazda', domain: 'mazda.com', category: 'Automaker', country: 'Japan', founded: '1920', description: 'Japanese automaker.', tags: ['automaker'] },
  { name: 'Mitsubishi', domain: 'mitsubishi-motors.com', category: 'Automaker', country: 'Japan', founded: '1970', description: 'Japanese automaker.', tags: ['automaker'] },
  { name: 'Suzuki', domain: 'globalsuzuki.com', category: 'Automaker', country: 'Japan', founded: '1909', description: 'Japanese automaker.', tags: ['automaker'] },
  { name: 'Peugeot', domain: 'peugeot.com', category: 'Automaker', country: 'France', founded: '1810', description: 'French automaker.', tags: ['automaker'] },
  { name: 'Renault', domain: 'renault.com', category: 'Automaker', country: 'France', founded: '1899', description: 'French automaker.', tags: ['automaker'] },
  { name: 'Fiat', domain: 'fiat.com', category: 'Automaker', country: 'Italy', founded: '1899', description: 'Italian automaker.', tags: ['automaker'] },
  { name: 'Alfa Romeo', domain: 'alfaromeo.com', category: 'Luxury', country: 'Italy', founded: '1910', description: 'Italian automaker.', tags: ['luxury'] },
  { name: 'Skoda', domain: 'skoda-auto.com', category: 'Automaker', country: 'Czech Republic', founded: '1895', description: 'Czech automaker.', tags: ['automaker'] },
  { name: 'SEAT', domain: 'seat.com', category: 'Automaker', country: 'Spain', founded: '1950', description: 'Spanish automaker.', tags: ['automaker'] },
  { name: 'Bentley', domain: 'bentleymotors.com', category: 'Luxury', country: 'UK', founded: '1919', description: 'Luxury vehicle brand.', tags: ['luxury'] },
  { name: 'Rolls-Royce', domain: 'rolls-roycemotorcars.com', category: 'Luxury', country: 'UK', founded: '1904', description: 'Ultra-luxury vehicles.', tags: ['luxury'] }
  ,
  { name: 'Mini', domain: 'mini.com', category: 'Automaker', country: 'UK', founded: '1959', description: 'Compact car brand.', tags: ['automaker'] },
  { name: 'Smart', domain: 'smart.com', category: 'Automaker', country: 'Germany', founded: '1994', description: 'Compact city cars.', tags: ['automaker'] },
  { name: 'Jeep', domain: 'jeep.com', category: 'SUV', country: 'USA', founded: '1941', description: 'SUV and off-road brand.', tags: ['suv'] },
  { name: 'Ram', domain: 'ramtrucks.com', category: 'Trucks', country: 'USA', founded: '2010', description: 'Truck brand.', tags: ['trucks'] },
  { name: 'GMC', domain: 'gmc.com', category: 'Automaker', country: 'USA', founded: '1911', description: 'American automaker.', tags: ['automaker'] },
  { name: 'Cadillac', domain: 'cadillac.com', category: 'Luxury', country: 'USA', founded: '1902', description: 'Luxury vehicle brand.', tags: ['luxury'] },
  { name: 'Buick', domain: 'buick.com', category: 'Automaker', country: 'USA', founded: '1903', description: 'American automaker.', tags: ['automaker'] },
  { name: 'Dodge', domain: 'dodge.com', category: 'Automaker', country: 'USA', founded: '1900', description: 'American automaker.', tags: ['automaker'] },
  { name: 'Chrysler', domain: 'chrysler.com', category: 'Automaker', country: 'USA', founded: '1925', description: 'American automaker.', tags: ['automaker'] },
  { name: 'Acura', domain: 'acura.com', category: 'Luxury', country: 'Japan', founded: '1986', description: 'Luxury vehicle brand.', tags: ['luxury'] },
  { name: 'Infiniti', domain: 'infinitiusa.com', category: 'Luxury', country: 'Japan', founded: '1989', description: 'Luxury vehicle brand.', tags: ['luxury'] },
  { name: 'Genesis', domain: 'genesis.com', category: 'Luxury', country: 'South Korea', founded: '2015', description: 'Luxury vehicle brand.', tags: ['luxury'] },
  { name: 'Polestar', domain: 'polestar.com', category: 'EV', country: 'Sweden', founded: '2017', description: 'Electric performance brand.', tags: ['ev'] },
  { name: 'Rivian', domain: 'rivian.com', category: 'EV', country: 'USA', founded: '2009', description: 'Electric adventure vehicles.', tags: ['ev'] },
  { name: 'Lucid', domain: 'lucidmotors.com', category: 'EV', country: 'USA', founded: '2007', description: 'Luxury EV maker.', tags: ['ev'] },
  { name: 'BYD', domain: 'byd.com', category: 'EV', country: 'China', founded: '1995', description: 'Chinese automaker and EV leader.', tags: ['ev'] },
  { name: 'Geely', domain: 'geely.com', category: 'Automaker', country: 'China', founded: '1986', description: 'Chinese automaker.', tags: ['automaker'] },
  { name: 'Great Wall Motors', domain: 'gwm-global.com', category: 'Automaker', country: 'China', founded: '1984', description: 'Chinese automaker.', tags: ['automaker'] },
  { name: 'Chery', domain: 'cheryinternational.com', category: 'Automaker', country: 'China', founded: '1997', description: 'Chinese automaker.', tags: ['automaker'] },
  { name: 'FAW', domain: 'faw.com.cn', category: 'Automaker', country: 'China', founded: '1953', description: 'Chinese automaker.', tags: ['automaker'] },
  { name: 'SAIC', domain: 'saicmotor.com', category: 'Automaker', country: 'China', founded: '1997', description: 'Chinese automaker.', tags: ['automaker'] },
  { name: 'MG', domain: 'mgmotor.com', category: 'Automaker', country: 'UK', founded: '1924', description: 'Automaker brand.', tags: ['automaker'] },
  { name: 'Maserati', domain: 'maserati.com', category: 'Luxury', country: 'Italy', founded: '1914', description: 'Italian luxury automaker.', tags: ['luxury'] },
  { name: 'Bugatti', domain: 'bugatti.com', category: 'Luxury', country: 'France', founded: '1909', description: 'Hypercar manufacturer.', tags: ['luxury'] },
  { name: 'McLaren', domain: 'mclaren.com', category: 'Luxury', country: 'UK', founded: '1985', description: 'British supercar maker.', tags: ['luxury'] },
  { name: 'Aston Martin', domain: 'astonmartin.com', category: 'Luxury', country: 'UK', founded: '1913', description: 'British luxury automaker.', tags: ['luxury'] },
  { name: 'Citroen', domain: 'citroen.com', category: 'Automaker', country: 'France', founded: '1919', description: 'French automaker.', tags: ['automaker'] },
  { name: 'Opel', domain: 'opel.com', category: 'Automaker', country: 'Germany', founded: '1862', description: 'German automaker.', tags: ['automaker'] },
  { name: 'Vauxhall', domain: 'vauxhall.co.uk', category: 'Automaker', country: 'UK', founded: '1903', description: 'British automaker.', tags: ['automaker'] },
  { name: 'Lincoln', domain: 'lincoln.com', category: 'Luxury', country: 'USA', founded: '1917', description: 'American luxury automaker.', tags: ['luxury'] },
  { name: 'Isuzu', domain: 'isuzu.com', category: 'Automaker', country: 'Japan', founded: '1916', description: 'Japanese automaker.', tags: ['automaker'] },
  { name: 'Daihatsu', domain: 'daihatsu.com', category: 'Automaker', country: 'Japan', founded: '1907', description: 'Japanese automaker.', tags: ['automaker'] },
  { name: 'Mahindra', domain: 'mahindra.com', category: 'Automaker', country: 'India', founded: '1945', description: 'Indian automaker.', tags: ['automaker'] },
  { name: 'Tata Motors', domain: 'tatamotors.com', category: 'Automaker', country: 'India', founded: '1945', description: 'Indian automaker.', tags: ['automaker'] },
  { name: 'Proton', domain: 'proton.com', category: 'Automaker', country: 'Malaysia', founded: '1983', description: 'Malaysian automaker.', tags: ['automaker'] },
  { name: 'Perodua', domain: 'perodua.com.my', category: 'Automaker', country: 'Malaysia', founded: '1993', description: 'Malaysian automaker.', tags: ['automaker'] },
  { name: 'Holden', domain: 'holden.com.au', category: 'Automaker', country: 'Australia', founded: '1856', description: 'Australian automaker.', tags: ['automaker'] },
  { name: 'Koenigsegg', domain: 'koenigsegg.com', category: 'Luxury', country: 'Sweden', founded: '1994', description: 'Swedish hypercar maker.', tags: ['luxury'] },
  { name: 'Pagani', domain: 'pagani.com', category: 'Luxury', country: 'Italy', founded: '1992', description: 'Italian hypercar maker.', tags: ['luxury'] },
  { name: 'Lotus', domain: 'lotuscars.com', category: 'Luxury', country: 'UK', founded: '1952', description: 'British sports cars.', tags: ['luxury'] }
  ,
  { name: 'Dacia', domain: 'dacia.com', category: 'Automaker', country: 'Romania', founded: '1966', description: 'Value-focused automaker.', tags: ['automaker'] },
  { name: 'Cupra', domain: 'cupraofficial.com', category: 'Automaker', country: 'Spain', founded: '2018', description: 'Performance car brand.', tags: ['automaker'] },
  { name: 'Saab', domain: 'saab.com', category: 'Automaker', country: 'Sweden', founded: '1945', description: 'Swedish automaker.', tags: ['automaker'] },
  { name: 'Lancia', domain: 'lancia.com', category: 'Automaker', country: 'Italy', founded: '1906', description: 'Italian automaker.', tags: ['automaker'] },
  { name: 'Scania', domain: 'scania.com', category: 'Trucks', country: 'Sweden', founded: '1891', description: 'Commercial vehicle manufacturer.', tags: ['trucks'] },
  { name: 'MAN', domain: 'man.eu', category: 'Trucks', country: 'Germany', founded: '1758', description: 'Commercial vehicle manufacturer.', tags: ['trucks'] },
  { name: 'Iveco', domain: 'iveco.com', category: 'Trucks', country: 'Italy', founded: '1975', description: 'Commercial vehicle manufacturer.', tags: ['trucks'] },
  { name: 'Kenworth', domain: 'kenworth.com', category: 'Trucks', country: 'USA', founded: '1923', description: 'Truck manufacturer.', tags: ['trucks'] },
  { name: 'Peterbilt', domain: 'peterbilt.com', category: 'Trucks', country: 'USA', founded: '1939', description: 'Truck manufacturer.', tags: ['trucks'] },
  { name: 'Hino', domain: 'hino-global.com', category: 'Trucks', country: 'Japan', founded: '1942', description: 'Commercial vehicle manufacturer.', tags: ['trucks'] },
  { name: 'Navistar', domain: 'navistar.com', category: 'Trucks', country: 'USA', founded: '1986', description: 'Commercial vehicle manufacturer.', tags: ['trucks'] },
  { name: 'Changan', domain: 'changan.com', category: 'Automaker', country: 'China', founded: '1862', description: 'Chinese automaker.', tags: ['automaker'] }
];

function toSupabaseRow(brand) {
  const domain = normalizeDomain(brand.domain);
  return {
    name: brand.name,
    slug: slugify(brand.slug || domain || brand.name),
    domain,
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
  const fashionResult = await upsertBrands('fashion_brands', dedupeBrands([...fashionBrands, ...extraFashionBrands]));
  console.log(`Fashion upserts: ${fashionResult.length}`);

  console.log('Seeding food brands...');
  const foodResult = await upsertBrands('food_brands', dedupeBrands([...foodBrands, ...extraFoodBrands]));
  console.log(`Food upserts: ${foodResult.length}`);

  console.log('Seeding car brands...');
  const carResult = await upsertBrands('car_brands', dedupeBrands(carBrands));
  console.log(`Car upserts: ${carResult.length}`);

  console.log('Done.');
}

run().catch((err) => {
  console.error('Seed error:', err?.message || err);
  process.exit(1);
});
