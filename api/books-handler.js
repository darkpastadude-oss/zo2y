import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "../backend/lib/supabase-admin.js";
import {
  DISCOVERY_SECTIONS,
  runBookPipeline,
  DEFAULT_BOOK_COVER,
  toHttpsUrl
} from "../js/books-data-layer.js";

dotenv.config();
dotenv.config({ path: "backend/.env" });
dotenv.config({ path: "backend/authRoutes/.env" });

const GOOGLE_BOOKS_BASE = "https://www.googleapis.com/books/v1";
const SUPABASE_KEY_HEADER = "x-zo2y-supabase-key";

// Server-side cache for discovery responses.
const DISCOVERY_CACHE = new Map();
const DISCOVERY_CACHE_TTL_MS = 10 * 60 * 1000;

// ----------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------
function getBooksKey() { return String(process.env.GOOGLE_BOOKS_KEY || "").trim(); }
function clampInt(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}
function readQuery(req) {
  if (req.query && typeof req.query === "object") return req.query;
  try {
    const url = new URL(req.url || "", "http://localhost");
    return Object.fromEntries(url.searchParams.entries());
  } catch (_error) { return {}; }
}
function readPathParts(query) {
  const rawPath = query?.path;
  if (Array.isArray(rawPath)) return rawPath.filter(Boolean);
  return String(rawPath || "").split("/").filter(Boolean);
}
function pushQueryParam(params, key, value) {
  if (value === undefined || value === null) return;
  if (Array.isArray(value)) {
    value.forEach((entry) => { if (entry !== undefined && entry !== null) params.append(key, String(entry)); });
    return;
  }
  params.append(key, String(value));
}
function normalizeKey(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

async function fetchWithRetry(url, init = {}, attempts = 3) {
  let lastError = null;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000 + attempt * 1200);
    try {
      const res = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(timeoutId);
      const retryable = res.status === 429 || res.status >= 500;
      if (!retryable || attempt === attempts - 1) return res;
      lastError = new Error(`HTTP ${res.status}`);
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error;
    }
    if (attempt < attempts - 1) await new Promise((r) => setTimeout(r, 280 * (attempt + 1)));
  }
  if (lastError) throw lastError;
  throw new Error("Upstream request failed");
}


// ----------------------------------------------------------------------
// Supabase helpers (kept from previous implementation - DO NOT remove)
// ----------------------------------------------------------------------
function getSupabasePublicKeyFromReq(req) {
  const headerGetter = req && typeof req.get === "function" ? req : null;
  const headersObj = req?.headers && typeof req.headers === "object" ? req.headers : {};
  const direct = headerGetter ? String(headerGetter.get(SUPABASE_KEY_HEADER) || "").trim() : "";
  const alt = headerGetter ? String(headerGetter.get("apikey") || headerGetter.get("x-supabase-anon-key") || "").trim() : "";
  const fromObj =
    String(headersObj[SUPABASE_KEY_HEADER] || headersObj[SUPABASE_KEY_HEADER.toLowerCase()] || "").trim()
    || String(headersObj.apikey || headersObj["x-supabase-anon-key"] || "").trim();
  return String(direct || alt || fromObj || "").trim();
}
function getBearerToken(req) {
  const raw = String(req?.headers?.authorization || req?.headers?.Authorization || "").trim();
  if (!/^bearer\s+/i.test(raw)) return "";
  return raw.replace(/^bearer\s+/i, "").trim();
}
async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return null;
  const text = Buffer.concat(chunks).toString("utf8");
  try { return JSON.parse(text); } catch (_e) { return null; }
}
function normalizePublishedDate(value) {
  if (value === undefined || value === null) return null;
  if (typeof value === "number" && Number.isFinite(value)) {
    const year = Math.floor(value);
    if (year > 0) return `${year}-01-01`;
  }
  const raw = String(value || "").trim();
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const yearMatch = raw.match(/\d{4}/);
  if (yearMatch) return `${yearMatch[0]}-01-01`;
  return null;
}
function normalizeAuthors(value) {
  if (Array.isArray(value)) {
    const joined = value.map((e) => String(e || "").trim()).filter(Boolean).join(", ");
    return joined || null;
  }
  const text = String(value || "").trim();
  return text || null;
}
function normalizeCategories(value) {
  if (!value) return [];
  const raw = Array.isArray(value) ? value : [value];
  return raw.map((e) => String(e || "").trim()).filter(Boolean).slice(0, 40);
}
function sanitizeBookPayload(body = {}) {
  const id = String(body.id || body.book_id || body.bookId || "").trim();
  if (!id) return null;
  const titleRaw = String(body.title || body.name || "").trim();
  const title = titleRaw || `Book ${id}`;
  const authors = normalizeAuthors(body.authors || body.author_name || body.author || body.subtitle);
  const thumbnail = toHttpsUrl(body.thumbnail || body.image || body.cover || "");
  const publishedDate = normalizePublishedDate(
    body.published_date || body.first_publish_date || body.first_publish_year || body.published || body.year
  );
  const categories = normalizeCategories(body.categories || body.subject);
  const description = String(body.description || "").trim();
  const pageCount = Number(body.page_count || body.pageCount || 0);
  const publisher = String(body.publisher || "").trim();
  return {
    id, title,
    authors: authors || null,
    thumbnail: thumbnail || null,
    published_date: publishedDate,
    categories: categories.length ? categories : null,
    description: description || null,
    page_count: Number.isFinite(pageCount) && pageCount > 0 ? Math.floor(pageCount) : null,
    publisher: publisher || null,
    updated_at: new Date().toISOString()
  };
}
async function testBooksAuth({ supabaseUrl, apikey, bearerToken }) {
  if (!supabaseUrl || !apikey || !bearerToken) {
    return { ok: false, configured: false, status: 0, message: "Missing SUPABASE_URL / apikey / bearer token" };
  }
  const url = `${supabaseUrl.replace(/\/+$/, "")}/rest/v1/books?select=id&limit=1`;
  try {
    const upstream = await fetch(url, {
      method: "GET",
      headers: { apikey, Authorization: `Bearer ${bearerToken}`, "Content-Type": "application/json" }
    });
    if (upstream.ok) return { ok: true, configured: true, status: upstream.status };
    const text = await upstream.text().catch(() => "");
    return { ok: false, configured: true, status: upstream.status, message: text || `Books query failed (${upstream.status})` };
  } catch (error) {
    return { ok: false, configured: true, status: 0, message: error?.message || "Network error" };
  }
}

// ======================================================================
// MAIN HANDLER
// ======================================================================
export default async function handler(req, res) {
  const query = readQuery(req);
  const pathParts = readPathParts(query);
  const rawSection = String(pathParts[0] || "").trim().toLowerCase();
  const section = rawSection.replace(/\.json$/i, "");

  if (!section) {
    return res.json({ ok: true, service: "books-proxy", version: "v3", configured: !!getBooksKey() });
  }

  // -------- diagnostics (unchanged) --------
  if (section === "diagnostics") {
    const supabaseUrl = String(process.env.SUPABASE_URL || "").trim();
    const serviceRoleSet = Boolean(String(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || "").trim());
    const anonFromEnv = String(process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
    const anonFromHeader = getSupabasePublicKeyFromReq(req);
    const apikey = anonFromEnv || anonFromHeader;
    const bearerToken = getBearerToken(req);
    const rlsProbe = bearerToken && apikey && supabaseUrl
      ? await testBooksAuth({ supabaseUrl, apikey, bearerToken })
      : { ok: false, configured: false, status: 0, message: "Send Authorization + apikey to test auth" };
    return res.json({
      ok: true,
      supabase: {
        url_set: Boolean(supabaseUrl),
        service_role_set: serviceRoleSet,
        anon_key_set: Boolean(anonFromEnv),
        anon_key_from_header: Boolean(anonFromHeader)
      },
      rls_probe: rlsProbe,
      hint_rls_fix_sql: "sql/books_rls_write_policy.sql"
    });
  }

  // -------- sync (unchanged write path) --------
  if (section === "sync" && String(req.method || "").toUpperCase() === "POST") {
    try {
      let client = getSupabaseAdminClient();
      const body = await readJsonBody(req);
      const payload = sanitizeBookPayload(body || {});
      if (!payload) return res.status(400).json({ ok: false, message: "Missing book id" });
      if (!client) {
        const supabaseUrl = String(process.env.SUPABASE_URL || "").trim();
        const supabaseAnonKey = String(process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim() || getSupabasePublicKeyFromReq(req);
        const bearerToken = getBearerToken(req);
        if (supabaseUrl && supabaseAnonKey && bearerToken) {
          client = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: `Bearer ${bearerToken}` } },
            auth: { persistSession: false, autoRefreshToken: false }
          });
        } else {
          return res.status(503).json({
            ok: false, message: "Supabase admin not configured",
            hint: `Provide SUPABASE_SERVICE_ROLE_KEY, or send Authorization + ${SUPABASE_KEY_HEADER} with a Supabase publishable/anon key.`,
            required_env: ["SUPABASE_URL"], required_secrets: ["SUPABASE_SERVICE_ROLE_KEY"],
            supabase_url_set: Boolean(supabaseUrl),
            supabase_anon_set: Boolean(supabaseAnonKey)
          });
        }
      }
      const { error } = await client.from("books").upsert(payload, { onConflict: "id" });
      if (error) {
        const isRls = String(error?.code || "").trim() === "42501"
          || String(error?.message || "").toLowerCase().includes("row-level security")
          || String(error?.message || "").toLowerCase().includes("permission");
        return res.status(isRls ? 403 : 500).json({
          ok: false, message: error.message || "Book sync failed", code: error.code || null,
          details: error.details || null, hint: isRls ? "RLS blocked book upsert. Apply sql/books_rls_write_policy.sql" : null
        });
      }
      return res.json({ ok: true });
    } catch (error) {
      console.error("Book sync error:", error?.message);
      return res.status(500).json({ ok: false, message: "Book sync failed" });
    }
  }

  // -------- SEARCH (now: full pipeline with enrichment + ranking + edition grouping) --------
  if (section === "search") {
    try {
      const limit = clampInt(query.limit, 1, 40, 24);
      const page = clampInt(query.page, 1, 1000, 1);
      const orderByRaw = String(query.orderBy || "").trim().toLowerCase();
      const orderBy = orderByRaw === "newest" ? "newest" : "relevance";
      const result = await runBookPipeline({
        q: query.q, title: query.title, author: query.author, subject: query.subject,
        first_publish_year: query.first_publish_year, year: query.year,
        year_from: query.year_from, year_to: query.year_to,
        language: query.language || "en", limit, page, orderBy
      }, { strict: false, enrichCovers: true, groupEditions: true }, getBooksKey());
      res.setHeader("Cache-Control", "public, max-age=120, s-maxage=300, stale-while-revalidate=600");
      return res.json({
        ok: true, books: result.books,
        meta: { source: result.source, page, limit, numFound: Math.max(Number(result.numFound || 0), result.books.length) }
      });
    } catch (error) {
      return res.status(502).json({ message: error?.message || "Book search failed" });
    }
  }

  // -------- POPULAR (strict junk filter + enrichment + ranking) --------
  if (section === "popular") {
    try {
      const limit = clampInt(query.limit, 1, 40, 24);
      const page = clampInt(query.page, 1, 1000, 1);
      const subject = String(query.subject || "").trim();
      const result = await runBookPipeline({
        q: String(query.q || "").trim() || (subject ? `popular ${subject} books` : "bestseller fiction"),
        subject: subject,
        limit, page,
        language: String(query.language || "en").trim() || "en",
        orderBy: String(query.orderBy || "relevance").trim() || "relevance"
      }, { strict: true, enrichCovers: true, groupEditions: true }, getBooksKey());
      res.setHeader("Cache-Control", "public, max-age=180, s-maxage=600, stale-while-revalidate=1200");
      return res.json({
        ok: true, books: result.books,
        meta: { source: result.source, page, limit, numFound: Math.max(Number(result.numFound || 0), result.books.length) }
      });
    } catch (error) {
      return res.status(502).json({ message: error?.message || "Popular books request failed" });
    }
  }

  // -------- TRENDING (Google Books primary - no more Open Library primary) --------
  if (section === "trending") {
    try {
      const limit = clampInt(query.limit, 1, 40, 24);
      const result = await runBookPipeline({
        q: "trending fiction novel bestseller 2026",
        orderBy: "relevance", limit, page: 1, language: "en"
      }, { strict: true, enrichCovers: true, groupEditions: true }, getBooksKey());
      res.setHeader("Cache-Control", "public, max-age=180, s-maxage=600, stale-while-revalidate=1200");
      return res.json({
        ok: true, books: result.books,
        meta: { source: result.source, period: "weekly", limit, numFound: Math.max(Number(result.numFound || 0), result.books.length) }
      });
    } catch (error) {
      return res.status(502).json({ message: error?.message || "Trending books request failed" });
    }
  }

  // -------- DISCOVER (NEW: sectioned discovery, server-cached) --------
  if (section === "discover") {
    try {
      const cacheKey = "discover:all";
      const now = Date.now();
      const cached = DISCOVERY_CACHE.get(cacheKey);
      if (cached && (now - cached.t) < DISCOVERY_CACHE_TTL_MS) {
        res.setHeader("Cache-Control", "public, max-age=120, s-maxage=600, stale-while-revalidate=1800");
        return res.json(cached.v);
      }
      const sections = await Promise.allSettled(DISCOVERY_SECTIONS.map(async (sec) => {
        const result = await runBookPipeline({
          q: sec.query || (sec.subject ? `popular ${sec.subject} books` : "bestseller fiction"),
          subject: sec.subject || "",
          orderBy: sec.orderBy || "relevance",
          limit: sec.limit || 18,
          page: 1, language: "en"
        }, { strict: true, enrichCovers: true, groupEditions: true }, getBooksKey());
        return {
          id: sec.id, label: sec.label, desc: sec.desc,
          books: result.books
        };
      }));
      const payload = {
        ok: true,
        sections: sections
          .map((s) => s.status === "fulfilled" ? s.value : null)
          .filter((s) => s && s.books && s.books.length)
      };
      DISCOVERY_CACHE.set(cacheKey, { v: payload, t: now });
      // Trim cache so it doesn't grow forever.
      if (DISCOVERY_CACHE.size > 32) {
        const oldest = DISCOVERY_CACHE.keys().next().value;
        if (oldest) DISCOVERY_CACHE.delete(oldest);
      }
      res.setHeader("Cache-Control", "public, max-age=120, s-maxage=600, stale-while-revalidate=1800");
      return res.json(payload);
    } catch (error) {
      return res.status(502).json({ ok: false, message: error?.message || "Discover request failed" });
    }
  }

  // -------- Catch-all proxy (volumes/ID etc.) --------
  if (section) {
    try {
      const key = getBooksKey();
      const relativePath = pathParts.join("/");
      const url = new URL(`${GOOGLE_BOOKS_BASE}/${relativePath}`);
      Object.entries(query || {}).forEach(([paramKey, value]) => {
        if (paramKey === "path") return;
        pushQueryParam(url.searchParams, paramKey, value);
      });
      if (key && !url.searchParams.get("key")) url.searchParams.set("key", key);
      let lastError = null;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          const booksRes = await fetch(url.toString());
          const text = await booksRes.text();
          const retryable = booksRes.status === 429 || booksRes.status >= 500;
          if (!retryable || attempt === 2) {
            res.status(booksRes.status);
            res.setHeader("content-type", booksRes.headers.get("content-type") || "application/json; charset=utf-8");
            return res.send(text);
          }
          lastError = new Error(`Google Books error ${booksRes.status}: ${text}`);
        } catch (error) {
          lastError = error;
        }
        if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
      }
      return res.status(502).json({ message: "Books proxy upstream failure" });
    } catch (error) {
      console.error("Books proxy error:", error.message);
      return res.status(500).json({ message: "Books proxy error" });
    }
  }

  return res.status(404).json({ message: "Not found" });
}
