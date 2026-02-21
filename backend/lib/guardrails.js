import crypto from "crypto";

const rateLimitBuckets = new Map();

function nowMs() {
  return Date.now();
}

function pruneRateLimitBuckets(maxSize = 4000) {
  if (rateLimitBuckets.size <= maxSize) return;
  const keys = rateLimitBuckets.keys();
  while (rateLimitBuckets.size > maxSize) {
    const key = keys.next().value;
    if (!key) break;
    rateLimitBuckets.delete(key);
  }
}

export function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  const realIp = req.headers["x-real-ip"];
  const socketIp = req.socket?.remoteAddress || "";
  const raw = forwarded || realIp || socketIp || "unknown";
  return String(raw).split(",")[0].trim() || "unknown";
}

export function hashValue(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  return crypto.createHash("sha256").update(text).digest("hex");
}

export function attachRequestContext(req, res, next) {
  const existing = String(req.get("x-request-id") || "").trim();
  const requestId = existing || crypto.randomUUID();
  req.requestId = requestId;
  req.requestStartAt = nowMs();
  res.setHeader("x-request-id", requestId);
  next();
}

export function applySecurityHeaders(_req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
}

export function requestLogger(req, res, next) {
  const shouldLog = String(process.env.LOG_HTTP || "true").toLowerCase() !== "false";
  if (!shouldLog) return next();

  const started = nowMs();
  res.on("finish", () => {
    const elapsed = nowMs() - started;
    const status = Number(res.statusCode || 0);
    const level = status >= 500 ? "ERROR" : status >= 400 ? "WARN" : "INFO";
    const ip = getClientIp(req);
    const msg = `[${level}] ${req.method} ${req.originalUrl || req.url} ${status} ${elapsed}ms ip=${ip} req_id=${req.requestId || "-"}`;
    // eslint-disable-next-line no-console
    console.log(msg);
  });

  next();
}

export function createRateLimiter(options = {}) {
  const windowMs = Number(options.windowMs || 60_000);
  const max = Number(options.max || 120);
  const keyPrefix = String(options.keyPrefix || "api");
  const skip = typeof options.skip === "function" ? options.skip : () => false;

  return function rateLimitMiddleware(req, res, next) {
    if (skip(req)) return next();

    const ip = getClientIp(req);
    const bucketKey = `${keyPrefix}:${req.method}:${req.path}:${ip}`;
    const now = nowMs();
    const current = rateLimitBuckets.get(bucketKey);

    if (!current || (now - current.startAt) > windowMs) {
      rateLimitBuckets.set(bucketKey, { startAt: now, count: 1 });
      res.setHeader("x-ratelimit-limit", String(max));
      res.setHeader("x-ratelimit-remaining", String(Math.max(0, max - 1)));
      return next();
    }

    current.count += 1;
    const remaining = Math.max(0, max - current.count);
    res.setHeader("x-ratelimit-limit", String(max));
    res.setHeader("x-ratelimit-remaining", String(remaining));

    if (current.count > max) {
      const retryAfter = Math.max(1, Math.ceil((windowMs - (now - current.startAt)) / 1000));
      res.setHeader("Retry-After", String(retryAfter));
      return res.status(429).json({
        message: "Rate limit exceeded. Try again shortly.",
        request_id: req.requestId || null
      });
    }

    pruneRateLimitBuckets();
    return next();
  };
}

export function notFoundJson(req, res) {
  return res.status(404).json({
    message: "Not found",
    request_id: req.requestId || null,
    path: req.originalUrl || req.url
  });
}

export function jsonErrorHandler(error, req, res, _next) {
  // eslint-disable-next-line no-console
  console.error("[ERROR] request failed", {
    request_id: req.requestId || null,
    method: req.method,
    path: req.originalUrl || req.url,
    message: String(error?.message || error)
  });

  if (res.headersSent) return;
  res.status(500).json({
    message: "Internal server error",
    request_id: req.requestId || null
  });
}

