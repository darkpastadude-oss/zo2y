import express from "express";
import dotenv from "dotenv";
import { applyApiGuardrails } from "../backend/lib/api-guardrails.js";

dotenv.config();
dotenv.config({ path: "backend/.env" });

const app = express();
applyApiGuardrails(app, { keyPrefix: "api-logo", max: 400 });

const GOOGLE_FAVICON_BASE = "https://www.google.com/s2/favicons";
const LOGO_DEV_BASE = "https://img.logo.dev";
const CLEARBIT_BASE = "https://logo.clearbit.com";
const WIKI_SUMMARY_BASE = "https://en.wikipedia.org/api/rest_v1/page/summary";

function setResponseCache(res, { maxAge = 86400, staleWhileRevalidate = 604800 } = {}) {
  const age = Math.max(0, Math.floor(Number(maxAge) || 0));
  const swr = Math.max(0, Math.floor(Number(staleWhileRevalidate) || 0));
  res.setHeader("Cache-Control", `public, s-maxage=${age}, stale-while-revalidate=${swr}`);
}

function getLogoToken() {
  return String(
    process.env.LOGO_DEV_TOKEN ||
    process.env.LOGO_DEV_KEY ||
    process.env.LOGO_DEV_API_KEY ||
    ""
  ).trim();
}

function normalizeDomain(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return "";
  return raw
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/.*/, "")
    .replace(/[^a-z0-9.-]/g, "");
}

function normalizeTitle(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return raw.replace(/[\r\n]/g, " ").trim();
}

function buildLogoDevUrl(domain, size) {
  const token = getLogoToken();
  const url = new URL(`${LOGO_DEV_BASE}/${domain}`);
  if (size) url.searchParams.set("size", String(size));
  if (token) url.searchParams.set("token", token);
  return url.toString();
}

function buildClearbitUrl(domain, size) {
  const url = new URL(`${CLEARBIT_BASE}/${domain}`);
  if (size) url.searchParams.set("size", String(size));
  return url.toString();
}

function buildGoogleFaviconUrl(domain, size) {
  const url = new URL(GOOGLE_FAVICON_BASE);
  url.searchParams.set("domain", domain);
  url.searchParams.set("sz", String(size || 128));
  return url.toString();
}

function buildWikiSummaryUrl(title) {
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

app.get("/api/logo", async (req, res) => {
  try {
    const domain = normalizeDomain(req.query?.domain);
    const title = normalizeTitle(req.query?.title);
    const sizeRaw = Number(req.query?.size || 128);
    const size = Number.isFinite(sizeRaw) ? Math.max(32, Math.min(512, sizeRaw)) : 128;
    if (!domain && !title) {
      res.status(400).json({ error: "Missing domain" });
      return;
    }

    if (title) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);
      try {
        const summaryUrl = buildWikiSummaryUrl(title);
        const summaryRes = await fetch(summaryUrl, {
          signal: controller.signal,
          headers: { "User-Agent": "Zo2yWikiLogo/1.0" }
        });
        if (summaryRes.ok) {
          const payload = await summaryRes.json();
          const imageUrl = payload?.thumbnail?.source || payload?.originalimage?.source || "";
          if (imageUrl) {
            setResponseCache(res, { maxAge: 86400, staleWhileRevalidate: 604800 });
            res.status(302).setHeader("Location", imageUrl).end();
            return;
          }
        }
      } catch (_err) {
        // fall through to domain-based lookup
      } finally {
        clearTimeout(timeoutId);
      }
    }

    if (!domain) {
      res.status(302).setHeader("Location", "/newlogo.webp").end();
      return;
    }

    const googleUrl = buildGoogleFaviconUrl(domain, size);
    const primaryUrl = buildLogoDevUrl(domain, size);
    const fallbackUrl = buildClearbitUrl(domain, size);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);
    let response = null;
    try {
      response = await fetch(googleUrl, { signal: controller.signal });
      if (!response.ok) {
        response = await fetch(primaryUrl, { signal: controller.signal });
      }
      if (!response.ok) {
        response = await fetch(fallbackUrl, { signal: controller.signal });
      }
    } catch (_err) {
      response = null;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response || !response.ok) {
      res.status(302).setHeader("Location", "/newlogo.webp").end();
      return;
    }

    setResponseCache(res, { maxAge: 86400, staleWhileRevalidate: 604800 });
    res.setHeader("Content-Type", response.headers.get("content-type") || "image/png");
    const buffer = Buffer.from(await response.arrayBuffer());
    res.status(200).send(buffer);
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
    req.url = `/api/logo${search ? `?${search}` : ""}`;
    return app(req, res);
  } catch (_err) {
    res.status(302).setHeader("Location", "/newlogo.webp").end();
  }
}
