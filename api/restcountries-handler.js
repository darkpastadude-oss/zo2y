const REST_COUNTRIES_BASE = "https://restcountries.com/v3.1";

function readQuery(req) {
  if (req.query && typeof req.query === "object") return req.query;
  try {
    const url = new URL(req.url || "", "http://localhost");
    return Object.fromEntries(url.searchParams.entries());
  } catch (_error) {
    return {};
  }
}

function readPathParts(query) {
  const rawPath = query?.path;
  if (Array.isArray(rawPath)) return rawPath.filter(Boolean);
  return String(rawPath || "")
    .split("/")
    .filter(Boolean);
}

function pushQueryParam(params, key, value) {
  if (value === undefined || value === null) return;
  if (Array.isArray(value)) {
    value.forEach((entry) => {
      if (entry === undefined || entry === null) return;
      params.append(key, String(entry));
    });
    return;
  }
  params.append(key, String(value));
}

export default async function handler(req, res) {
  const query = readQuery(req);
  const pathParts = readPathParts(query);
  const relativePath = pathParts.join("/");

  if (!relativePath) {
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    return res.json({ ok: true, service: "restcountries-proxy" });
  }

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const url = new URL(`${REST_COUNTRIES_BASE}/${relativePath}`);
      Object.entries(query || {}).forEach(([key, value]) => {
        if (key === "path") return;
        pushQueryParam(url.searchParams, key, value);
      });

      const upstream = await fetch(url.toString(), {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(9000)
      });

      const text = await upstream.text();

      if (!upstream.ok && upstream.status >= 500 && attempt === 0) {
        await new Promise((r) => setTimeout(r, 800));
        continue;
      }

      const isAll = relativePath.startsWith("all");
      const maxAge = isAll ? 3600 : 86400;
      res.setHeader("Cache-Control", `public, s-maxage=${maxAge}, stale-while-revalidate=${maxAge * 3}`);
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.status(upstream.status);
      return res.send(text);
    } catch (error) {
      if (attempt === 0) {
        await new Promise((r) => setTimeout(r, 800));
        continue;
      }
      res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
      return res.status(502).json({
        ok: false,
        message: error?.name === "TimeoutError" ? "Upstream timeout" : "Proxy error"
      });
    }
  }

  res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
  return res.status(502).json({ ok: false, message: "Upstream unavailable" });
}
