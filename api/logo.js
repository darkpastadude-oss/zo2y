export const config = {
  runtime: 'nodejs'
};

export default async function handler(req, res) {
  try {
    if (req.method && req.method !== 'GET') {
      res.status(405).json({ message: 'Method not allowed' });
      return;
    }

    const query = req.query || {};
    const titleRaw = String(query.title || '').trim();
    const domainRaw = String(query.domain || '').trim().toLowerCase();
    const sizeRaw = Number(query.size || 128);
    const size = Number.isFinite(sizeRaw) ? Math.max(32, Math.min(512, sizeRaw)) : 128;

    const safeDomain = domainRaw
      .replace(/^https?:\/\//i, '')
      .replace(/^www\./i, '')
      .replace(/\/.*/, '')
      .replace(/[^a-z0-9.-]/g, '');

    const fetchSafe = typeof fetch === 'function' ? fetch : null;

    if (titleRaw && fetchSafe) {
      try {
        const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(titleRaw)}?redirect=true`;
        const summaryRes = await fetchSafe(summaryUrl, {
          headers: { 'User-Agent': 'Zo2yWikiLogo/1.0' }
        });
        if (summaryRes.ok) {
          const payload = await summaryRes.json();
          const imageUrl = payload?.thumbnail?.source || payload?.originalimage?.source || '';
          if (imageUrl) {
            res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
            res.status(302);
            res.setHeader('Location', imageUrl);
            res.end();
            return;
          }
        }
      } catch (_err) {
        // fall through to domain-based lookup
      }
    }

    if (safeDomain && fetchSafe) {
      try {
        const googleUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(safeDomain)}&sz=${size}`;
        const googleRes = await fetchSafe(googleUrl);
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
        const ddgUrl = `https://icons.duckduckgo.com/ip3/${encodeURIComponent(safeDomain)}.ico`;
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
