export const config = {
  runtime: 'nodejs'
};

function sanitizeDomain(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/.*/, '')
    .replace(/[^a-z0-9.-]/g, '');
}

function toCommonsFilePath(filename, size) {
  const safeName = String(filename || '').replace(/\s+/g, '_');
  const width = Number.isFinite(size) ? size : 256;
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(safeName)}?width=${width}`;
}

const TITLE_OVERRIDES = new Map([
  ['american eagle', 'American Eagle Outfitters'],
  ['american eagle outfitters', 'American Eagle Outfitters'],
  ['ae', 'American Eagle Outfitters'],
  ['arbys', "Arby's"],
  ['arby\'s', "Arby's"],
  ['chipotle', 'Chipotle Mexican Grill'],
  ['cava', 'Cava Group'],
  ['dunkin', "Dunkin'"],
  ['dunkin donuts', "Dunkin'"],
  ['chick-fil-a', 'Chick-fil-A'],
  ['chick fil a', 'Chick-fil-A'],
  ['popeyes', 'Popeyes'],
  ['burger king', 'Burger King'],
  ['kfc', 'KFC'],
  ['mcdonalds', "McDonald's"],
  ['mcdonald\'s', "McDonald's"],
  ['wendys', "Wendy's"],
  ['wendy\'s', "Wendy's"],
  ['in-n-out', 'In-N-Out Burger'],
  ['in n out', 'In-N-Out Burger'],
  ['subway', 'Subway (restaurant)'],
  ['taco bell', 'Taco Bell'],
  ['panda express', 'Panda Express'],
  ['dominos', "Domino's"],
  ['domino\'s', "Domino's"],
  ['pizza hut', 'Pizza Hut'],
  ['panera', 'Panera Bread'],
  ['panera bread', 'Panera Bread'],
  ['starbucks', 'Starbucks'],
  ['five guys', 'Five Guys'],
  ['shake shack', 'Shake Shack'],
  ['chipotle mexican grill', 'Chipotle Mexican Grill'],
  ['nike', 'Nike, Inc.'],
  ['adidas', 'Adidas'],
  ['new balance', 'New Balance'],
  ['under armour', 'Under Armour'],
  ['lululemon', 'Lululemon Athletica'],
  ['supreme', 'Supreme (skateboard shop)'],
  ['off-white', 'Off-White (brand)'],
  ['off white', 'Off-White (brand)'],
  ['h&m', 'H&M'],
  ['hm', 'H&M'],
  ['arcteryx', 'Arc\'teryx'],
  ['arc\'teryx', 'Arc\'teryx'],
  ['aritzia', 'Aritzia'],
  ['allbirds', 'Allbirds'],
  ['asos', 'ASOS'],
  ['asics', 'ASICS'],
  ['stone island', 'Stone Island'],
  ['the north face', 'The North Face'],
  ['patagonia', 'Patagonia (clothing)'],
  ['gucci', 'Gucci'],
  ['prada', 'Prada'],
  ['louis vuitton', 'Louis Vuitton'],
  ['burberry', 'Burberry'],
  ['balenciaga', 'Balenciaga'],
  ['moncler', 'Moncler'],
  ['hermes', 'Hermès'],
  ['dior', 'Dior'],
  ['versace', 'Versace'],
  ['ralph lauren', 'Ralph Lauren Corporation'],
  ['calvin klein', 'Calvin Klein'],
  ['tommy hilfiger', 'Tommy Hilfiger'],
  ['coach', 'Coach (company)'],
  ['converse', 'Converse (shoe company)'],
  ['vans', 'Vans'],
  ['puma', 'Puma (brand)'],
  ['reebok', 'Reebok'],
  ['fila', 'Fila (company)'],
  ['gap', 'Gap Inc.'],
  ['old navy', 'Old Navy'],
  ['bananarepublic', 'Banana Republic'],
  ['banana republic', 'Banana Republic'],
  ['forever 21', 'Forever 21'],
  ['shein', 'Shein'],
  ['uniqlo', 'Uniqlo'],
  ['zara', 'Zara (retailer)'],
  ['cos', 'COS (fashion brand)'],
  ['arket', 'Arket'],
  ['bmw', 'BMW'],
  ['mercedes', 'Mercedes-Benz'],
  ['mercedes-benz', 'Mercedes-Benz'],
  ['vw', 'Volkswagen'],
  ['volkswagen', 'Volkswagen'],
  ['toyota', 'Toyota'],
  ['honda', 'Honda'],
  ['ford', 'Ford Motor Company'],
  ['chevrolet', 'Chevrolet'],
  ['nissan', 'Nissan'],
  ['hyundai', 'Hyundai Motor Company'],
  ['kia', 'Kia'],
  ['audi', 'Audi'],
  ['lexus', 'Lexus'],
  ['tesla', 'Tesla, Inc.'],
  ['porsche', 'Porsche'],
  ['ferrari', 'Ferrari'],
  ['lamborghini', 'Lamborghini'],
  ['land rover', 'Land Rover'],
  ['jaguar', 'Jaguar Cars'],
  ['volvo', 'Volvo Cars'],
  ['subaru', 'Subaru'],
  ['mazda', 'Mazda'],
  ['mitsubishi', 'Mitsubishi Motors'],
  ['suzuki', 'Suzuki'],
  ['peugeot', 'Peugeot'],
  ['renault', 'Renault'],
  ['fiat', 'Fiat'],
  ['alfa romeo', 'Alfa Romeo'],
  ['skoda', 'Skoda Auto'],
  ['seat', 'SEAT'],
  ['bentley', 'Bentley'],
  ['rolls-royce', 'Rolls-Royce Motor Cars'],
  ['mini', 'Mini (marque)'],
  ['jeep', 'Jeep'],
  ['gmc', 'GMC (automobile)'],
  ['cadillac', 'Cadillac'],
  ['buick', 'Buick'],
  ['dodge', 'Dodge'],
  ['chrysler', 'Chrysler'],
  ['acura', 'Acura'],
  ['infiniti', 'Infiniti'],
  ['genesis', 'Genesis Motor'],
  ['polestar', 'Polestar'],
  ['rivian', 'Rivian'],
  ['lucid', 'Lucid Motors'],
  ['byd', 'BYD Auto'],
  ['maserati', 'Maserati'],
  ['bugatti', 'Bugatti'],
  ['mclaren', 'McLaren'],
  ['aston martin', 'Aston Martin'],
  ['citroen', 'Citroen'],
  ['opel', 'Opel'],
  ['vauxhall', 'Vauxhall Motors'],
  ['lincoln', 'Lincoln Motor Company'],
  ['saab', 'Saab Automobile'],
  ['lancia', 'Lancia']
]);

const DOMAIN_TITLE_OVERRIDES = new Map([
  ['ae.com', 'American Eagle Outfitters'],
  ['americaneagle.com', 'American Eagle Outfitters'],
  ['aritzia.com', 'Aritzia'],
  ['arcteryx.com', 'Arc\'teryx'],
  ['arket.com', 'Arket'],
  ['erewhon.com', 'Erewhon'],
  ['hm.com', 'H&M'],
  ['supremenewyork.com', 'Supreme (skateboard shop)'],
  ['offwhite.com', 'Off-White (brand)'],
  ['lululemon.com', 'Lululemon Athletica'],
  ['patagonia.com', 'Patagonia (clothing)'],
  ['thenorthface.com', 'The North Face'],
  ['newbalance.com', 'New Balance'],
  ['underarmour.com', 'Under Armour'],
  ['allbirds.com', 'Allbirds'],
  ['asos.com', 'ASOS'],
  ['asics.com', 'ASICS'],
  ['nike.com', 'Nike, Inc.'],
  ['adidas.com', 'Adidas'],
  ['gucci.com', 'Gucci'],
  ['prada.com', 'Prada'],
  ['louisvuitton.com', 'Louis Vuitton'],
  ['burberry.com', 'Burberry'],
  ['balenciaga.com', 'Balenciaga'],
  ['mcdonalds.com', "McDonald's"],
  ['burgerking.com', 'Burger King'],
  ['kfc.com', 'KFC'],
  ['tacobell.com', 'Taco Bell'],
  ['dominos.com', "Domino's"],
  ['pizzahut.com', 'Pizza Hut'],
  ['subway.com', 'Subway (restaurant)'],
  ['starbucks.com', 'Starbucks'],
  ['chipotle.com', 'Chipotle Mexican Grill'],
  ['panerabread.com', 'Panera Bread'],
  ['chick-fil-a.com', 'Chick-fil-A'],
  ['fiveguys.com', 'Five Guys'],
  ['shakeshack.com', 'Shake Shack'],
  ['dunkin.com', "Dunkin'"],
  ['wendys.com', "Wendy's"],
  ['in-n-out.com', 'In-N-Out Burger'],
  ['toyota.com', 'Toyota'],
  ['honda.com', 'Honda'],
  ['ford.com', 'Ford Motor Company'],
  ['chevrolet.com', 'Chevrolet'],
  ['nissan-global.com', 'Nissan'],
  ['hyundai.com', 'Hyundai Motor Company'],
  ['kia.com', 'Kia'],
  ['bmw.com', 'BMW'],
  ['mercedes-benz.com', 'Mercedes-Benz'],
  ['audi.com', 'Audi'],
  ['lexus.com', 'Lexus'],
  ['tesla.com', 'Tesla, Inc.'],
  ['porsche.com', 'Porsche'],
  ['ferrari.com', 'Ferrari'],
  ['lamborghini.com', 'Lamborghini'],
  ['landrover.com', 'Land Rover'],
  ['jaguar.com', 'Jaguar Cars'],
  ['volvocars.com', 'Volvo Cars'],
  ['subaru.com', 'Subaru'],
  ['mazda.com', 'Mazda'],
  ['mitsubishi-motors.com', 'Mitsubishi Motors'],
  ['suzuki.com', 'Suzuki'],
  ['peugeot.com', 'Peugeot'],
  ['renault.com', 'Renault'],
  ['fiat.com', 'Fiat'],
  ['alfaromeo.com', 'Alfa Romeo'],
  ['skoda-auto.com', 'Skoda Auto'],
  ['seat.com', 'SEAT'],
  ['bentleymotors.com', 'Bentley'],
  ['rolls-roycemotorcars.com', 'Rolls-Royce Motor Cars'],
  ['mini.com', 'Mini (marque)'],
  ['jeep.com', 'Jeep'],
  ['gmc.com', 'GMC (automobile)'],
  ['cadillac.com', 'Cadillac'],
  ['buick.com', 'Buick'],
  ['dodge.com', 'Dodge'],
  ['chrysler.com', 'Chrysler'],
  ['acura.com', 'Acura'],
  ['infinitiusa.com', 'Infiniti'],
  ['genesis.com', 'Genesis Motor'],
  ['polestar.com', 'Polestar'],
  ['rivian.com', 'Rivian'],
  ['lucidmotors.com', 'Lucid Motors'],
  ['byd.com', 'BYD Auto'],
  ['maserati.com', 'Maserati'],
  ['bugatti.com', 'Bugatti'],
  ['mclaren.com', 'McLaren'],
  ['astonmartin.com', 'Aston Martin'],
  ['citroen.com', 'Citroen'],
  ['opel.com', 'Opel'],
  ['vauxhall.co.uk', 'Vauxhall Motors'],
  ['lincoln.com', 'Lincoln Motor Company']
]);

function normalizeCommonsLogo(value, size) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (raw.includes('Special:FilePath/')) {
    const url = raw.split('?')[0];
    return `${url}?width=${Number.isFinite(size) ? size : 256}`;
  }
  if (raw.startsWith('http')) {
    const parts = raw.split('/');
    const filename = parts[parts.length - 1];
    return toCommonsFilePath(filename, size);
  }
  return toCommonsFilePath(raw, size);
}

function escapeRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function fetchWikiLogo(title, size) {
  if (!title) return '';
  const normalizedTitle = TITLE_OVERRIDES.get(String(title || '').trim().toLowerCase()) || title;
  const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(normalizedTitle)}?redirect=true`;
  const summaryRes = await fetch(summaryUrl, {
    headers: { 'User-Agent': 'Zo2yWikiLogo/1.0' }
  });
  if (!summaryRes.ok) return '';
  const payload = await summaryRes.json();
  const wikibaseId = payload?.wikibase_item;
  if (!wikibaseId) return '';

  const entityUrl = `https://www.wikidata.org/wiki/Special:EntityData/${encodeURIComponent(wikibaseId)}.json`;
  const entityRes = await fetch(entityUrl, {
    headers: { 'User-Agent': 'Zo2yWikiLogo/1.0' }
  });
  if (!entityRes.ok) return '';
  const entityPayload = await entityRes.json();
  const entity = entityPayload?.entities?.[wikibaseId];
  const logoClaim = entity?.claims?.P154?.[0];
  const logoFile = logoClaim?.mainsnak?.datavalue?.value;
  if (!logoFile) return '';
  return normalizeCommonsLogo(logoFile, size);
}

async function fetchWikiLogoByDomain(domain, size) {
  const cleanDomain = String(domain || '').trim().toLowerCase();
  if (!cleanDomain) return '';
  const domainPattern = escapeRegex(cleanDomain);
  const sparql = `
    SELECT ?logo WHERE {
      ?item wdt:P856 ?site .
      FILTER(REGEX(LCASE(STR(?site)), "^https?://(www\\.)?${domainPattern}(/|$)"))
      ?item wdt:P154 ?logo .
    } LIMIT 1
  `;
  const url = `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(sparql)}`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Zo2yWikiLogo/1.0',
      'Accept': 'application/sparql-results+json'
    }
  });
  if (!response.ok) return '';
  const json = await response.json();
  const value = json?.results?.bindings?.[0]?.logo?.value;
  if (!value) return '';
  return normalizeCommonsLogo(value, size);
}

export default async function handler(req, res) {
  try {
    if (req.method && req.method !== 'GET') {
      res.status(405).json({ message: 'Method not allowed' });
      return;
    }

    const query = req.query || {};
    const titleRaw = String(query.title || '').trim();
    const domainRaw = sanitizeDomain(query.domain || '');
    const sizeRaw = Number(query.size || 256);
    const size = Number.isFinite(sizeRaw) ? Math.max(64, Math.min(512, sizeRaw)) : 256;
    const logoOnly = String(query.mode || '').toLowerCase() === 'logo';
    const domainOverride = DOMAIN_TITLE_OVERRIDES.get(domainRaw) || '';
    const normalizedTitle = domainOverride || titleRaw;
    const skipDomainLookup = !!domainOverride;

    if (domainRaw && logoOnly && !skipDomainLookup && typeof fetch === 'function') {
      try {
        const logoUrl = await fetchWikiLogoByDomain(domainRaw, size);
        if (logoUrl) {
          res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
          res.status(302);
          res.setHeader('Location', logoUrl);
          res.end();
          return;
        }
      } catch (_err) {
        // continue to fallback
      }
    }

    if (normalizedTitle && typeof fetch === 'function') {
      try {
        const logoUrl = await fetchWikiLogo(normalizedTitle, size);
        if (logoUrl) {
          res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
          res.status(302);
          res.setHeader('Location', logoUrl);
          res.end();
          return;
        }
      } catch (_err) {
        // fall through to domain-based lookup
      }
    }

    if (!logoOnly && domainRaw && typeof fetch === 'function') {
      try {
        const googleUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domainRaw)}&sz=${size}`;
        const googleRes = await fetch(googleUrl);
        if (googleRes.ok) {
          res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
          res.setHeader('Content-Type', googleRes.headers.get('content-type') || 'image/png');
          const buffer = Buffer.from(await googleRes.arrayBuffer());
          res.status(200);
          res.end(buffer);
          return;
        }
      } catch (_err) {
        // continue to fallback
      }

      try {
        const ddgUrl = `https://icons.duckduckgo.com/ip3/${encodeURIComponent(domainRaw)}.ico`;
        res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
        res.status(302);
        res.setHeader('Location', ddgUrl);
        res.end();
        return;
      } catch (_err) {
        // final fallback below
      }
    }

    res.status(302);
    res.setHeader('Location', logoOnly ? '/logo-placeholder.svg' : '/newlogo.webp');
    res.end();
  } catch (_err) {
    res.status(302);
    res.setHeader('Location', '/logo-placeholder.svg');
    res.end();
  }
}
