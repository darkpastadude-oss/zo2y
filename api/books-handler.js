import express from "express";
import dotenv from "dotenv";
import { applyApiGuardrails } from "./_guardrails.js";

dotenv.config();
dotenv.config({ path: "backend/.env" });
dotenv.config({ path: "backend/authRoutes/.env" });

const app = express();
applyApiGuardrails(app, { keyPrefix: "api-books", max: 220 });
const GOOGLE_BOOKS_BASE = "https://www.googleapis.com/books/v1";

function getBooksKey() {
  return String(process.env.GOOGLE_BOOKS_KEY || "").trim();
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
