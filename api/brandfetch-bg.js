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

export default async function handler(req, res) {
  try {
    if (req.method && req.method !== 'GET') {
      res.status(405).json({ message: 'Method not allowed' });
      return;
    }

    const query = req.query || {};
    const domain = sanitizeDomain(query.domain || '');

    if (!domain) {
      res.status(400).json({ message: 'Missing domain parameter' });
      return;
    }

    const apiKey = req.env?.BRANDFETCH_API_KEY
      || globalThis.process?.env?.BRANDFETCH_API_KEY
      || '';

    if (!apiKey) {
      res.status(200).json({ image: null });
      return;
    }

    const bfRes = await fetch(
      `https://api.brandfetch.io/v2/brands/${encodeURIComponent(domain)}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!bfRes.ok) {
      res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
      res.status(200).json({ image: null });
      return;
    }

    const data = await bfRes.json();
    const images = Array.isArray(data?.images) ? data.images : [];

    let bestImage = null;
    let bestWidth = 0;

    for (const img of images) {
      if (img.type !== 'banner') continue;
      const formats = Array.isArray(img.formats) ? img.formats : [];
      for (const fmt of formats) {
        const w = Number(fmt.width || 0);
        if (fmt.src && w >= bestWidth) {
          bestWidth = w;
          bestImage = fmt.src;
        }
      }
    }

    if (!bestImage) {
      for (const img of images) {
        const formats = Array.isArray(img.formats) ? img.formats : [];
        for (const fmt of formats) {
          const w = Number(fmt.width || 0);
          if (fmt.src && w >= bestWidth) {
            bestWidth = w;
            bestImage = fmt.src;
          }
        }
      }
    }

    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
    res.status(200).json({ image: bestImage || null });
  } catch (_err) {
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=604800');
    res.status(200).json({ image: null });
  }
}
