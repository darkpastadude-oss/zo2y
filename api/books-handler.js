import express from "express";
import dotenv from "dotenv";
import { applyApiGuardrails } from "./_guardrails.js";

dotenv.config();
dotenv.config({ path: "backend/.env" });
dotenv.config({ path: "backend/authRoutes/.env" });

const app = express();
applyApiGuardrails(app, { keyPrefix: "api-books", max: 220 });
const GOOGLE_BOOKS_BASE = "https://www.googleapis.com/books/v1";
const OPEN_LIBRARY_BASE = "https://openlibrary.org";

function getBooksKey() {
  return String(process.env.GOOGLE_BOOKS_KEY || "").trim();
}

function clampInt(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function toHttpsUrl(value) {
  return String(value || "").replace(/^http:\/\//i, "https://").trim();
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

function buildGoogleQuery(params = {}) {
  const qRaw = String(params?.q || "").trim();
  const title = String(params?.title || "").trim();
  const author = String(params?.author || "").trim();
  const subject = String(params?.subject || "").trim();
  const year = String(params?.first_publish_year || params?.year || "").trim();
  const chunks = [];
  if (qRaw) chunks.push(qRaw);
  if (title) chunks.push(`intitle:"${title}"`);
  if (author) chunks.push(`inauthor:"${author}"`);
  if (subject) chunks.push(`subject:${subject}`);
  if (year) chunks.push(year);
  return chunks.join(" ").trim();
}

function buildOpenLibraryCoverUrl(doc = {}, size = "L") {
  const safeSize = ["S", "M", "L"].includes(String(size || "").toUpperCase())
    ? String(size || "L").toUpperCase()
    : "L";
  const coverId = Number(doc?.cover_i || 0) || 0;
  if (coverId > 0) {
    return `https://covers.openlibrary.org/b/id/${encodeURIComponent(String(coverId))}-${safeSize}.jpg`;
  }
  const isbnRaw = Array.isArray(doc?.isbn) ? String(doc.isbn[0] || "").trim() : "";
  const isbn = isbnRaw.replace(/[^0-9Xx]/g, "");
  if (isbn) {
    return `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(isbn)}-${safeSize}.jpg`;
  }
  return "";
}

function normalizeGoogleBookDoc(volume, idx = 0) {
  const info = volume?.volumeInfo || {};
  const title = String(info?.title || `Book ${idx + 1}`).trim();
  if (!title) return null;
  const authorNames = Array.isArray(info?.authors)
    ? info.authors.map((name) => String(name || "").trim()).filter(Boolean)
    : [];
  const published = String(info?.publishedDate || "").trim();
  const yearMatch = published.match(/\d{4}/);
  const year = yearMatch ? Number(yearMatch[0]) : null;
  const categories = Array.isArray(info?.categories)
    ? info.categories.map((entry) => String(entry || "").trim()).filter(Boolean)
    : [];
  const publisher = String(info?.publisher || "").trim();
  const identifiers = Array.isArray(info?.industryIdentifiers) ? info.industryIdentifiers : [];
  const isbn = identifiers
    .map((entry) => String(entry?.identifier || "").replace(/[^0-9Xx]/g, ""))
    .filter(Boolean);
  const thumb = toHttpsUrl(info?.imageLinks?.thumbnail || info?.imageLinks?.smallThumbnail || "");
  const previewLink = toHttpsUrl(info?.previewLink || "");
  const infoLink = toHttpsUrl(info?.infoLink || "");

  return {
    key: "",
    title,
    author_name: authorNames.length ? authorNames : ["Unknown author"],
    first_publish_year: Number.isFinite(year) ? year : null,
    isbn,
    subject: categories,
    publisher: publisher ? [publisher] : [],
    cover_i: null,
    coverImage: thumb || "",
    _googleThumbnail: thumb || "",
    _googleVolumeId: String(volume?.id || "").trim(),
    _source: "google-books",
    _previewLink: previewLink,
    _infoLink: infoLink
  };
}

function normalizeOpenLibraryDoc(doc, idx = 0) {
  const title = String(doc?.title || `Book ${idx + 1}`).trim();
  if (!title) return null;
  const authorNames = Array.isArray(doc?.author_name)
    ? doc.author_name.map((name) => String(name || "").trim()).filter(Boolean)
    : [];
  const coverId = Number(doc?.cover_i || 0) || null;
  const firstYear = Number(doc?.first_publish_year || 0) || null;
  const isbn = Array.isArray(doc?.isbn)
    ? doc.isbn.map((entry) => String(entry || "").replace(/[^0-9Xx]/g, "")).filter(Boolean)
    : [];
  const publishers = Array.isArray(doc?.publisher)
    ? doc.publisher.map((entry) => String(entry || "").trim()).filter(Boolean)
    : [];
  const subjects = Array.isArray(doc?.subject)
    ? doc.subject.map((entry) => String(entry || "").trim()).filter(Boolean)
    : [];
  const key = String(doc?.key || "").trim();
  const coverImage = buildOpenLibraryCoverUrl({ cover_i: coverId, isbn }, "L");

  return {
    key,
    title,
    author_name: authorNames.length ? authorNames : ["Unknown author"],
    first_publish_year: firstYear,
    isbn,
    subject: subjects,
    publisher: publishers,
    cover_i: coverId,
    coverImage: coverImage || "",
    _googleThumbnail: "",
    _googleVolumeId: "",
    _source: "openlibrary"
  };
}

function dedupeDocs(rows = [], limit = 20) {
  const seen = new Set();
  const out = [];
  for (const row of rows) {
    if (!row) continue;
    const title = String(row?.title || "").trim().toLowerCase();
    const author = String((Array.isArray(row?.author_name) ? row.author_name[0] : "") || "").trim().toLowerCase();
    const key = `${title}::${author}`;
    if (!title || seen.has(key)) continue;
    seen.add(key);
    out.push(row);
    if (out.length >= limit) break;
  }
  return out;
}

function hasUsableCover(doc) {
  const googleThumb = toHttpsUrl(doc?._googleThumbnail || doc?.coverImage || "");
  if (googleThumb) return true;
  return !!buildOpenLibraryCoverUrl(doc, "L");
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
    if (attempt < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, 280 * (attempt + 1)));
    }
  }
  if (lastError) throw lastError;
  throw new Error("Upstream request failed");
}

async function fetchGoogleDocs(params = {}) {
  const key = getBooksKey();
  const query = buildGoogleQuery(params);
  if (!query) return { docs: [], numFound: 0, source: "google-books" };

  const limit = clampInt(params.limit, 1, 40, 20);
  const page = clampInt(params.page, 1, 1000, 1);
  const startIndex = clampInt(params.startIndex, 0, 2000, (page - 1) * limit);
  const orderBy = String(params.orderBy || "").trim();
  let lang = String(params.language || params.lang || "en").trim().toLowerCase();
  if (lang === "eng") lang = "en";
  if (lang.length > 2) lang = lang.slice(0, 2);

  const url = new URL(`${GOOGLE_BOOKS_BASE}/volumes`);
  url.searchParams.set("q", query);
  url.searchParams.set("printType", "books");
  if (lang) url.searchParams.set("langRestrict", lang);
  url.searchParams.set("maxResults", String(limit));
  url.searchParams.set("startIndex", String(Math.max(0, startIndex)));
  if (orderBy === "newest" || orderBy === "relevance") {
    url.searchParams.set("orderBy", orderBy);
  }
  if (key) url.searchParams.set("key", key);

  const upstream = await fetchWithRetry(url.toString(), { headers: { Accept: "application/json" } }, 3);
  if (!upstream.ok) {
    return { docs: [], numFound: 0, source: "google-books" };
  }

  const json = await upstream.json();
  const items = Array.isArray(json?.items) ? json.items : [];
  const docs = items.map((entry, idx) => normalizeGoogleBookDoc(entry, idx)).filter(Boolean);
  const totalItems = Number(json?.totalItems || 0);
  return {
    docs,
    numFound: Number.isFinite(totalItems) && totalItems > 0 ? totalItems : docs.length,
    source: "google-books"
  };
}

async function fetchOpenLibraryDocs(params = {}) {
  const limit = clampInt(params.limit, 1, 40, 20);
  const page = clampInt(params.page, 1, 1000, 1);
  const q = String(params.q || "").trim();
  const title = String(params.title || "").trim();
  const author = String(params.author || "").trim();
  const subject = String(params.subject || "").trim();
  const year = String(params.first_publish_year || params.year || "").trim();

  const url = new URL(`${OPEN_LIBRARY_BASE}/search.json`);
  if (q) url.searchParams.set("q", q);
  if (!q && title) url.searchParams.set("title", title);
  if (author) url.searchParams.set("author", author);
  if (subject) url.searchParams.set("subject", subject);
  if (year) url.searchParams.set("first_publish_year", year);
  if (!q && !title && !author && !subject && !year) {
    url.searchParams.set("q", "bestseller");
  }
  if (String(params.language || "").trim()) {
    url.searchParams.set("language", String(params.language).trim());
  } else {
    url.searchParams.set("language", "eng");
  }
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("page", String(page));

  const upstream = await fetchWithRetry(url.toString(), { headers: { Accept: "application/json" } }, 3);
  if (!upstream.ok) {
    return { docs: [], numFound: 0, source: "openlibrary" };
  }
  const json = await upstream.json();
  const docsRaw = Array.isArray(json?.docs) ? json.docs : [];
  const docs = docsRaw.map((doc, idx) => normalizeOpenLibraryDoc(doc, idx)).filter(Boolean);
  return {
    docs,
    numFound: Number(json?.numFound || 0) || docs.length,
    source: "openlibrary"
  };
}

async function enrichMissingCoversWithGoogle(docs = [], maxLookups = 8) {
  if (!Array.isArray(docs) || !docs.length) return docs;
  const indexed = docs.map((doc, index) => ({ doc, index }));
  const candidates = indexed.filter(({ doc }) => !hasUsableCover(doc)).slice(0, maxLookups);
  if (!candidates.length) return docs;

  const patches = await Promise.all(
    candidates.map(async ({ doc, index }) => {
      const qParts = [];
      const title = String(doc?.title || "").trim();
      const author = String((Array.isArray(doc?.author_name) ? doc.author_name[0] : "") || "").trim();
      if (title) qParts.push(`intitle:"${title}"`);
      if (author) qParts.push(`inauthor:"${author}"`);
      const q = qParts.join(" ").trim() || [title, author].filter(Boolean).join(" ");
      if (!q) return { index, patch: null };
      try {
        const google = await fetchGoogleDocs({ q, limit: 1, page: 1, orderBy: "relevance" });
        const best = Array.isArray(google.docs) ? google.docs[0] : null;
        if (!best) return { index, patch: null };
        return {
          index,
          patch: {
            ...doc,
            isbn: Array.isArray(doc?.isbn) && doc.isbn.length ? doc.isbn : best.isbn || [],
            first_publish_year: doc?.first_publish_year || best.first_publish_year || null,
            _googleThumbnail: toHttpsUrl(best._googleThumbnail || best.coverImage || ""),
            _googleVolumeId: String(best._googleVolumeId || "").trim(),
            coverImage: toHttpsUrl(best.coverImage || best._googleThumbnail || "")
          }
        };
      } catch (_err) {
        return { index, patch: null };
      }
    })
  );

  if (!patches.some((entry) => entry?.patch)) return docs;
  const nextDocs = docs.slice();
  patches.forEach((entry) => {
    if (!entry?.patch) return;
    nextDocs[entry.index] = entry.patch;
  });
  return nextDocs;
}

app.get("/api/books/search", async (req, res) => {
  try {
    const limit = clampInt(req.query.limit, 1, 40, 20);
    const page = clampInt(req.query.page, 1, 1000, 1);
    const params = {
      q: req.query.q,
      title: req.query.title,
      author: req.query.author,
      subject: req.query.subject,
      first_publish_year: req.query.first_publish_year,
      year: req.query.year,
      language: req.query.language,
      limit,
      page,
      orderBy: "relevance"
    };

    const google = await fetchGoogleDocs(params);
    let source = google.source;
    let docs = Array.isArray(google.docs) ? google.docs : [];
    let numFound = Number(google.numFound || 0);

    if (docs.length < limit) {
      const open = await fetchOpenLibraryDocs(params);
      if (Array.isArray(open.docs) && open.docs.length) {
        docs = dedupeDocs([...docs, ...open.docs], limit);
        numFound = Math.max(numFound, Number(open.numFound || docs.length), docs.length);
        source = docs.length > (google.docs?.length || 0) ? "google-books+openlibrary" : source;
      }
    }

    return res.json({
      ok: true,
      source,
      page,
      limit,
      numFound: Math.max(numFound, docs.length),
      docs,
      items: docs
    });
  } catch (error) {
    return res.status(502).json({ message: error?.message || "Book search failed" });
  }
});

app.get("/api/books/popular", async (req, res) => {
  try {
    const limit = clampInt(req.query.limit, 1, 40, 20);
    const page = clampInt(req.query.page, 1, 1000, 1);
    const subject = String(req.query.subject || "fiction").trim() || "fiction";
    const q = String(req.query.q || "").trim() || `subject:${subject}`;
    const google = await fetchGoogleDocs({
      q,
      limit,
      page,
      language: String(req.query.language || "en").trim() || "en",
      orderBy: String(req.query.orderBy || "relevance").trim() || "relevance"
    });

    let docs = Array.isArray(google.docs) ? google.docs : [];
    let source = google.source;
    let numFound = Number(google.numFound || 0);

    if (docs.length < limit) {
      const open = await fetchOpenLibraryDocs({
        q: String(req.query.fallback_q || req.query.q || subject || "fiction"),
        subject,
        limit,
        page: 1,
        language: "eng"
      });
      if (Array.isArray(open.docs) && open.docs.length) {
        docs = dedupeDocs([...docs, ...open.docs], limit);
        numFound = Math.max(numFound, Number(open.numFound || docs.length), docs.length);
        source = "google-books+openlibrary";
      }
    }

    res.setHeader("Cache-Control", "public, max-age=120, s-maxage=600, stale-while-revalidate=1200");
    return res.json({
      ok: true,
      source,
      query: q,
      page,
      limit,
      numFound: Math.max(numFound, docs.length),
      docs,
      items: docs
    });
  } catch (error) {
    return res.status(502).json({ message: error?.message || "Popular books request failed" });
  }
});

app.get("/api/books/trending", async (req, res) => {
  try {
    const periodRaw = String(req.query.period || "weekly").trim().toLowerCase();
    const period = ["daily", "weekly", "monthly"].includes(periodRaw) ? periodRaw : "weekly";
    const limit = clampInt(req.query.limit, 1, 40, 20);

    const url = new URL(`${OPEN_LIBRARY_BASE}/trending/${period}.json`);
    const upstream = await fetchWithRetry(url.toString(), { headers: { Accept: "application/json" } }, 3);
    const json = upstream.ok ? await upstream.json() : {};
    const works = Array.isArray(json?.works) ? json.works : [];
    let docs = dedupeDocs(
      works.map((work, idx) => normalizeOpenLibraryDoc(work, idx)).filter(Boolean),
      limit
    );

    if (!docs.length) {
      const popular = await fetchGoogleDocs({
        q: "subject:fiction",
        orderBy: "relevance",
        limit,
        page: 1,
        language: "en"
      });
      docs = Array.isArray(popular.docs) ? popular.docs : [];
      res.setHeader("Cache-Control", "public, max-age=120, s-maxage=600, stale-while-revalidate=1200");
      return res.json({
        ok: true,
        source: "google-books-fallback",
        period,
        limit,
        numFound: docs.length,
        docs,
        items: docs
      });
    }

    res.setHeader("Cache-Control", "public, max-age=120, s-maxage=600, stale-while-revalidate=1200");
    return res.json({
      ok: true,
      source: "openlibrary-trending",
      period,
      limit,
      numFound: docs.length,
      docs,
      items: docs
    });
  } catch (error) {
    return res.status(502).json({ message: error?.message || "Trending books request failed" });
  }
});

app.get("/api/books/*", async (req, res) => {
  try {
    const key = getBooksKey();
    const relativePath = req.path.replace(/^\/api\/books\//, "");
    const url = new URL(`${GOOGLE_BOOKS_BASE}/${relativePath}`);
    Object.entries(req.query || {}).forEach(([paramKey, value]) => pushQueryParam(url.searchParams, paramKey, value));
    if (key && !url.searchParams.get("key")) {
      url.searchParams.set("key", key);
    }

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
      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
      }
    }

    return res.status(502).json({ message: lastError?.message || "Books proxy upstream failure" });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Books proxy error" });
  }
});

app.get("/api/books", (req, res) => {
  const key = getBooksKey();
  res.json({ ok: true, service: "books-proxy", configured: !!key });
});

export default function handler(req, res) {
  const query = req.query || {};
  const rawPath = query.path;
  const pathParts = Array.isArray(rawPath)
    ? rawPath
    : String(rawPath || "")
      .split("/")
      .filter(Boolean);

  const nextParams = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (key === "path") return;
    pushQueryParam(nextParams, key, value);
  });

  const suffix = pathParts.length ? `/${pathParts.join("/")}` : "";
    const search = nextParams.toString();
  req.url = `/api/books${suffix}${search ? `?${search}` : ""}`;
  return app(req, res);
}
