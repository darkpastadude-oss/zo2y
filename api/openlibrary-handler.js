import express from "express";
import { applyApiGuardrails } from "./_guardrails.js";

const app = express();
applyApiGuardrails(app, { keyPrefix: "api-openlibrary", max: 240 });

const OPEN_LIBRARY_BASE = "https://openlibrary.org";

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

async function fetchWithRetry(url, init = {}, attempts = 4) {
  let lastError = null;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000 + (attempt * 1000));
    try {
      const res = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) return res;
      const retryable = res.status === 429 || res.status >= 500;
      if (!retryable) return res;
      lastError = new Error(`Open Library error ${res.status}`);
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error;
    }
    if (attempt < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
    }
  }
  throw lastError || new Error("Open Library request failed");
}

app.get("/api/openlibrary/*", async (req, res) => {
  try {
    const relativePath = req.path.replace(/^\/api\/openlibrary\//, "");
    const sanitizedPath = String(relativePath || "").replace(/^\/+/, "");
    const target = new URL(`${OPEN_LIBRARY_BASE}/${sanitizedPath}`);
    Object.entries(req.query || {}).forEach(([paramKey, value]) => pushQueryParam(target.searchParams, paramKey, value));

    const upstream = await fetchWithRetry(target.toString(), {
      headers: { Accept: "application/json" }
    });
    const text = await upstream.text();
    res.status(upstream.status);
    res.setHeader("content-type", upstream.headers.get("content-type") || "application/json; charset=utf-8");
    res.setHeader("cache-control", upstream.ok ? "public, s-maxage=300, stale-while-revalidate=600" : "no-store");
    return res.send(text);
  } catch (error) {
    return res.status(502).json({ message: error?.message || "Open Library proxy failed" });
  }
});

app.get("/api/openlibrary", (_req, res) => {
  res.json({ ok: true, service: "openlibrary-proxy" });
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
  req.url = `/api/openlibrary${suffix}${search ? `?${search}` : ""}`;
  return app(req, res);
}

