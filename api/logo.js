import express from "express";
import dotenv from "dotenv";
import { applyApiGuardrails } from "./_guardrails.js";

dotenv.config();
dotenv.config({ path: "backend/.env" });

const app = express();
applyApiGuardrails(app, { keyPrefix: "api-logo", max: 400 });

const LOGO_DEV_BASE = "https://img.logo.dev";
const CLEARBIT_BASE = "https://logo.clearbit.com";

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

app.get("/api/logo", async (req, res) => {
  try {
    const domain = normalizeDomain(req.query?.domain);
    const sizeRaw = Number(req.query?.size || 128);
    const size = Number.isFinite(sizeRaw) ? Math.max(32, Math.min(512, sizeRaw)) : 128;
    if (!domain) {
      res.status(400).json({ error: "Missing domain" });
      return;
    }

    const primaryUrl = buildLogoDevUrl(domain, size);
    const fallbackUrl = buildClearbitUrl(domain, size);

    let response = await fetch(primaryUrl);
    if (!response.ok) {
      response = await fetch(fallbackUrl);
    }

    if (!response.ok) {
      res.status(502).json({ error: "Logo fetch failed" });
      return;
    }

    setResponseCache(res, { maxAge: 86400, staleWhileRevalidate: 604800 });
    res.setHeader("Content-Type", response.headers.get("content-type") || "image/png");
    const buffer = Buffer.from(await response.arrayBuffer());
    res.status(200).send(buffer);
  } catch (err) {
    res.status(500).json({ error: "Logo proxy error" });
  }
});

export default app;
