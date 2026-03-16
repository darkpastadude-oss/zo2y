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

async function fetchWikiLogo(title, size) {
  if (!title) return '';
  const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}?redirect=true`;
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
  return toCommonsFilePath(logoFile, size);
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

    if (titleRaw && typeof fetch === 'function') {
      try {
        const logoUrl = await fetchWikiLogo(titleRaw, size);
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
    res.setHeader('Location', '/newlogo.webp');
    res.end();
  } catch (_err) {
    res.status(302);
    res.setHeader('Location', '/newlogo.webp');
    res.end();
  }
}
