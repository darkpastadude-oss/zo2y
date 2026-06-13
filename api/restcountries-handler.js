import countriesData from "../data/countries-v3.js";

const COUNTRIES = Array.isArray(countriesData) ? countriesData : [];
const COUNTRY_BY_CCA2 = new Map();
const COUNTRY_BY_CCA3 = new Map();
COUNTRIES.forEach((c) => {
  if (c.cca2) COUNTRY_BY_CCA2.set(c.cca2.toUpperCase(), c);
  if (c.cca3) COUNTRY_BY_CCA3.set(c.cca3.toUpperCase(), c);
});

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

function pickFields(row, fields) {
  if (!fields || !fields.length) return row;
  const out = {};
  for (const f of fields) {
    if (f in row) out[f] = row[f];
  }
  return out;
}

function parseFields(query) {
  const raw = String(query.fields || "").trim();
  if (!raw) return null;
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

export default async function handler(req, res) {
  const query = readQuery(req);
  const pathParts = readPathParts(query);
  const section = String(pathParts[0] || "").toLowerCase();
  const param = String(pathParts[1] || "").trim();
  const fields = parseFields(query);

  res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=604800");

  if (!section) {
    return res.json({ ok: true, service: "restcountries-proxy", count: COUNTRIES.length });
  }

  if (section === "all") {
    const filtered = COUNTRIES.map((c) => pickFields(c, fields));
    return res.json(filtered);
  }

  if (section === "region" && param) {
    const region = param.toLowerCase();
    const matched = COUNTRIES.filter((c) => {
      return String(c.region || "").toLowerCase() === region ||
        String(c.subregion || "").toLowerCase() === region;
    }).map((c) => pickFields(c, fields));
    return res.json(matched);
  }

  if (section === "alpha" && param) {
    const code = param.toUpperCase();
    const row = COUNTRY_BY_CCA2.get(code) || COUNTRY_BY_CCA3.get(code);
    if (!row) {
      return res.status(404).json([{ message: "Not Found" }]);
    }
    return res.json([pickFields(row, fields)]);
  }

  return res.status(404).json([{ message: "Not Found" }]);
}
