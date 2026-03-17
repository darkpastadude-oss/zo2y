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
  ['nike', 'Nike, Inc.'],
  ['adidas', 'Adidas']
]);

const DOMAIN_TITLE_OVERRIDES = new Map([
  ['ae.com', 'American Eagle Outfitters'],
  ['americaneagle.com', 'American Eagle Outfitters'],
  ['aritzia.com', 'Aritzia'],
  ['arcteryx.com', 'Arc\'teryx'],
  ['arket.com', 'Arket'],
  ['erewhon.com', 'Erewhon']
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
  const sparql = `
    SELECT ?logo WHERE {
      ?item wdt:P856 ?site .
      FILTER(CONTAINS(LCASE(STR(?site)), "${cleanDomain}"))
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

    if (domainRaw && logoOnly && typeof fetch === 'function') {
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
