import express from "express";
import dotenv from "dotenv";
import { applyApiGuardrails } from "./_guardrails.js";

dotenv.config();
dotenv.config({ path: "backend/.env" });

const app = express();
applyApiGuardrails(app, { keyPrefix: "api-wiki-logo", max: 400 });

const WIKI_SUMMARY_BASE = "https://en.wikipedia.org/api/rest_v1/page/summary";

function setResponseCache(res, { maxAge = 86400, staleWhileRevalidate = 604800 } = {}) {
  const age = Math.max(0, Math.floor(Number(maxAge) || 0));
  const swr = Math.max(0, Math.floor(Number(staleWhileRevalidate) || 0));
  res.setHeader("Cache-Control", `public, s-maxage=${age}, stale-while-revalidate=${swr}`);
}

function normalizeTitle(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return raw.replace(/[\r\n]/g, " ").trim();
}

function buildSummaryUrl(title) {
  const url = new URL(`${WIKI_SUMMARY_BASE}/${encodeURIComponent(title)}`);
  url.searchParams.set("redirect", "true");
  return url.toString();
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

app.get("/api/wiki-logo", async (req, res) => {
  try {
    const title = normalizeTitle(req.query?.title);
    if (!title) {
      res.status(400).json({ error: "Missing title" });
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);
    let response = null;
    try {
      const summaryUrl = buildSummaryUrl(title);
      response = await fetch(summaryUrl, {
        signal: controller.signal,
        headers: { "User-Agent": "Zo2yWikiLogo/1.0" }
      });
    } catch (_err) {
      response = null;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response || !response.ok) {
      res.status(302).setHeader("Location", "/newlogo.webp").end();
      return;
    }

    const payload = await response.json();
    const imageUrl = payload?.thumbnail?.source || payload?.originalimage?.source || "";
    if (!imageUrl) {
      res.status(302).setHeader("Location", "/newlogo.webp").end();
      return;
    }

    setResponseCache(res, { maxAge: 86400, staleWhileRevalidate: 604800 });
    res.status(302).setHeader("Location", imageUrl).end();
  } catch (_err) {
    res.status(302).setHeader("Location", "/newlogo.webp").end();
  }
});

export default function handler(req, res) {
  try {
    const query = req.query || {};
    const nextParams = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (key === "path") return;
      pushQueryParam(nextParams, key, value);
    });

    const search = nextParams.toString();
    req.url = `/api/wiki-logo${search ? `?${search}` : ""}`;
    return app(req, res);
  } catch (_err) {
    res.status(302).setHeader("Location", "/newlogo.webp").end();
  }
}
