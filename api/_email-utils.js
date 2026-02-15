import dotenv from "dotenv";

dotenv.config();
dotenv.config({ path: "backend/.env" });

const requestBuckets = new Map();

export function requirePost(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ message: "Method not allowed" });
    return false;
  }
  return true;
}

export function requireGet(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ message: "Method not allowed" });
    return false;
  }
  return true;
}

export function requireEmailApiKey(req, res) {
  const expected = String(process.env.EMAIL_API_KEY || "").trim();
  if (!expected) return true;
  const provided = String(req.headers?.["x-email-api-key"] || "").trim();
  if (!provided || provided !== expected) {
    res.status(401).json({ message: "Unauthorized" });
    return false;
  }
  return true;
}

export function requireEmailRateLimit(req, res, options = {}) {
  const windowMs = Number(options.windowMs || 60_000);
  const maxRequests = Number(options.maxRequests || 8);
  const pathKey = String(options.pathKey || req.url || "email");
  const ipRaw =
    req.headers?.["x-forwarded-for"] ||
    req.headers?.["x-real-ip"] ||
    req.socket?.remoteAddress ||
    "unknown";
  const ip = String(ipRaw).split(",")[0].trim();
  const key = `${ip}:${pathKey}`;
  const now = Date.now();
  const existing = requestBuckets.get(key);
  if (!existing || now - existing.start > windowMs) {
    requestBuckets.set(key, { start: now, count: 1 });
    return true;
  }
  existing.count += 1;
  if (existing.count > maxRequests) {
    const retryAfter = Math.max(1, Math.ceil((windowMs - (now - existing.start)) / 1000));
    res.setHeader("Retry-After", String(retryAfter));
    res.status(429).json({ message: "Rate limit exceeded. Try again shortly." });
    return false;
  }
  return true;
}

export function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

export function isValidEmail(value) {
  return /\S+@\S+\.\S+/.test(String(value || "").trim());
}

export function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch (_error) {
      return {};
    }
  }
  return {};
}
