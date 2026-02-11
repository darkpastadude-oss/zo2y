import { createClient } from "@supabase/supabase-js";

const GOOGLE_BOOKS_BASE = "https://www.googleapis.com/books/v1/volumes";
const PAGE_SIZE = 40;
const UPSERT_BATCH = 200;

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function normalizeThumbnail(url) {
  if (!url) return null;
  let safe = String(url).trim();
  if (safe.startsWith("//")) safe = `https:${safe}`;
  if (safe.startsWith("http:")) safe = safe.replace(/^http:/i, "https:");
  safe = safe.replace(/([?&])zoom=\d+/i, "");
  safe = safe.replace(/&edge=curl/gi, "");
  if (safe.includes("books.google")) {
    const separator = safe.includes("?") ? "&" : "?";
    safe = `${safe}${separator}fife=w800-h1200&source=gbs_api`;
  }
  return safe;
}

function getBestThumbnail(volumeInfo) {
  const links = volumeInfo?.imageLinks || {};
  return (
    normalizeThumbnail(links.extraLarge) ||
    normalizeThumbnail(links.large) ||
    normalizeThumbnail(links.medium) ||
    normalizeThumbnail(links.small) ||
    normalizeThumbnail(links.thumbnail) ||
    normalizeThumbnail(links.smallThumbnail) ||
    null
  );
}

function stripHtml(html) {
  if (!html) return "";
  return String(html).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      out[key] = "true";
      continue;
    }
    out[key] = next;
    i += 1;
  }
  return out;
}

function getQueries(flags) {
  if (flags.queries) {
    return flags.queries
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  }
  if (flags.subjects) {
    return flags.subjects
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean)
      .map((x) => `subject:${x}`);
  }
  return [
    "subject:fiction",
    "subject:mystery",
    "subject:fantasy",
    "subject:romance",
    "subject:history",
    "subject:science",
    "subject:biography",
  ];
}

async function fetchGoogleBooks({ key, query, startIndex, lang }) {
  const url = new URL(GOOGLE_BOOKS_BASE);
  url.searchParams.set("q", query);
  url.searchParams.set("maxResults", String(PAGE_SIZE));
  url.searchParams.set("startIndex", String(startIndex));
  url.searchParams.set("printType", "books");
  url.searchParams.set("key", key);
  if (lang) url.searchParams.set("langRestrict", lang);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Google Books API error ${response.status} for query: ${query}`);
  }
  return response.json();
}

function toBookRow(item) {
  const info = item?.volumeInfo || {};
  return {
    id: item.id,
    title: info.title || "",
    authors: Array.isArray(info.authors) ? info.authors : [],
    thumbnail: getBestThumbnail(info),
    published_date: info.publishedDate || null,
    categories: Array.isArray(info.categories) ? info.categories : [],
    description: stripHtml(info.description || ""),
    page_count: Number.isFinite(info.pageCount) ? info.pageCount : null,
    publisher: info.publisher || null,
    updated_at: new Date().toISOString(),
  };
}

async function upsertInChunks(supabase, rows) {
  let inserted = 0;
  for (let i = 0; i < rows.length; i += UPSERT_BATCH) {
    const chunk = rows.slice(i, i + UPSERT_BATCH);
    const { error } = await supabase.from("books").upsert(chunk, { onConflict: "id" });
    if (error) throw error;
    inserted += chunk.length;
  }
  return inserted;
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const GOOGLE_BOOKS_KEY = requiredEnv("GOOGLE_BOOKS_KEY");
  const SUPABASE_URL = requiredEnv("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");

  const pages = Math.max(1, Number.parseInt(flags.pages || "5", 10));
  const lang = flags.lang || "";
  const dryRun = flags["dry-run"] === "true";
  const queries = getQueries(flags);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const byId = new Map();
  let fetchedItems = 0;

  for (const query of queries) {
    for (let page = 0; page < pages; page += 1) {
      const startIndex = page * PAGE_SIZE;
      const payload = await fetchGoogleBooks({
        key: GOOGLE_BOOKS_KEY,
        query,
        startIndex,
        lang,
      });

      const items = Array.isArray(payload.items) ? payload.items : [];
      fetchedItems += items.length;
      for (const item of items) {
        if (!item?.id) continue;
        byId.set(item.id, toBookRow(item));
      }

      if (items.length < PAGE_SIZE) break;
    }
  }

  const rows = Array.from(byId.values());
  if (dryRun) {
    console.log(`[DRY RUN] fetched=${fetchedItems} unique=${rows.length}`);
    return;
  }

  const upserted = await upsertInChunks(supabase, rows);
  console.log(`Import complete. fetched=${fetchedItems} unique=${rows.length} upserted=${upserted}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});

