import analyticsHandler from "../../api/analytics-handler.js";
import authHandler from "../../api/auth-handler.js";
import booksHandler from "../../api/books-handler.js";
import emailsHandler from "../../api/emails-handler.js";
import healthHandler from "../../api/health.js";
import homeFeedHandler from "../../api/home-feed.js";
import igdbHandler from "../../api/igdb-handler.js";
import logoHandler from "../../api/logo.js";
import musicHandler from "../../api/music-handler.js";
import openlibraryHandler from "../../api/openlibrary-handler.js";
import sportsdbHandler from "../../api/sportsdb-handler.js";
import supportHandler from "../../api/support-handler.js";
import tmdbHandler from "../../api/tmdb-handler.js";

const COMMON_HEADERS = {
  "X-Robots-Tag": "max-image-preview:none, noimageindex",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-Permitted-Cross-Domain-Policies": "none",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
  "Cross-Origin-Resource-Policy": "same-site",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  "Content-Security-Policy": "default-src 'self'; base-uri 'self'; form-action 'self' https:; frame-ancestors 'none'; object-src 'none'; img-src 'self' data: https:; media-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; font-src 'self' data: https:; connect-src 'self' https: wss:; frame-src https:; worker-src 'self' blob:; upgrade-insecure-requests",
  "Origin-Agent-Cluster": "?1"
};

const ROUTE_HANDLERS = new Map([
  ["analytics", analyticsHandler],
  ["auth", authHandler],
  ["books", booksHandler],
  ["emails", emailsHandler],
  ["health", healthHandler],
  ["home-feed", homeFeedHandler],
  ["igdb", igdbHandler],
  ["logo", logoHandler],
  ["music", musicHandler],
  ["openlibrary", openlibraryHandler],
  ["sportsdb", sportsdbHandler],
  ["support", supportHandler],
  ["tmdb", tmdbHandler]
]);

const WRITE_ROUTE_PREFIXES = new Set(["analytics", "auth", "emails", "support"]);
const WRITE_RATE_BUCKETS = new Map();
const BOT_UA_PATTERNS = [
  /bot/i,
  /crawler/i,
  /spider/i,
  /headless/i,
  /phantom/i,
  /playwright/i,
  /selenium/i,
  /python-requests/i,
  /python/i,
  /curl/i,
  /wget/i,
  /go-http-client/i,
  /postman/i,
  /insomnia/i,
  /okhttp/i,
  /axios/i,
  /node-fetch/i,
  /libwww/i,
  /scrap/i
];

function getLowerCaseHeaders(request) {
  const out = {};
  request.headers.forEach((value, key) => {
    out[String(key || "").toLowerCase()] = value;
  });
  return out;
}

async function buildNodeLikeRequest(request, env) {
  const url = new URL(request.url);
  const headers = getLowerCaseHeaders(request);
  const contentType = String(headers["content-type"] || "").toLowerCase();
  const bodyText = ["GET", "HEAD"].includes(request.method) ? "" : await request.text();
  let parsedBody = undefined;
  if (bodyText) {
    if (contentType.includes("application/json")) {
      try {
        parsedBody = JSON.parse(bodyText);
      } catch (_error) {
        parsedBody = undefined;
      }
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      parsedBody = Object.fromEntries(new URLSearchParams(bodyText).entries());
    }
  }
  const bodyBuffer = bodyText ? Buffer.from(bodyText, "utf8") : Buffer.alloc(0);
  const req = {
    method: request.method,
    url: request.url,
    originalUrl: `${url.pathname}${url.search}`,
    path: url.pathname,
    query: Object.fromEntries(url.searchParams.entries()),
    headers,
    body: parsedBody,
    socket: {
      remoteAddress: headers["cf-connecting-ip"] || headers["x-forwarded-for"] || ""
    },
    cf: request.cf || {},
    env,
    get(name) {
      return headers[String(name || "").toLowerCase()] || "";
    },
    async *[Symbol.asyncIterator]() {
      if (!bodyBuffer.length) return;
      yield bodyBuffer;
    }
  };
  return req;
}

function createNodeLikeResponse() {
  const headers = new Headers(COMMON_HEADERS);
  let statusCode = 200;
  let body = "";

  const res = {
    headersSent: false,
    statusCode,
    setHeader(key, value) {
      headers.set(String(key), String(value));
      return this;
    },
    getHeader(key) {
      return headers.get(String(key));
    },
    status(code) {
      statusCode = Number(code || 200) || 200;
      this.statusCode = statusCode;
      return this;
    },
    json(payload) {
      headers.set("content-type", "application/json; charset=utf-8");
      body = JSON.stringify(payload);
      this.headersSent = true;
      return this;
    },
    send(payload) {
      if (payload === undefined || payload === null) {
        body = "";
      } else if (typeof payload === "string") {
        body = payload;
      } else if (payload instanceof Uint8Array) {
        body = payload;
      } else {
        headers.set("content-type", "application/json; charset=utf-8");
        body = JSON.stringify(payload);
      }
      this.headersSent = true;
      return this;
    },
    end(payload = "") {
      body = payload;
      this.headersSent = true;
      return this;
    }
  };

  return {
    res,
    toResponse() {
      return new Response(body, {
        status: statusCode,
        headers
      });
    }
  };
}

function bindEnvToProcess(env) {
  if (!globalThis.process) globalThis.process = { env: {} };
  if (!globalThis.process.env) globalThis.process.env = {};
  Object.entries(env || {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    globalThis.process.env[key] = typeof value === "string" ? value : String(value);
  });
}

function isWriteMethod(method) {
  const upper = String(method || "").toUpperCase();
  return upper === "POST" || upper === "PUT" || upper === "PATCH" || upper === "DELETE";
}

function parseHost(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    return new URL(raw).host.toLowerCase();
  } catch (_error) {
    return raw.replace(/^https?:\/\//i, "").split("/")[0].toLowerCase();
  }
}

function getClientIp(headers = {}) {
  const forwarded = String(headers["cf-connecting-ip"] || headers["x-forwarded-for"] || "").trim();
  return forwarded.split(",")[0].trim() || "unknown";
}

function isLikelyBotWrite(headers = {}, cf = {}) {
  if (cf?.botManagement?.verifiedBot) return true;
  const botScore = Number(cf?.botManagement?.score || 0);
  if (botScore > 0 && botScore <= 10) return true;
  const ua = String(headers["user-agent"] || "").trim();
  if (!ua) return true;
  return BOT_UA_PATTERNS.some((pattern) => pattern.test(ua));
}

function hasAllowedWriteOrigin(request, headers = {}) {
  const requestHost = parseHost(request.url);
  const allowedHosts = new Set([
    requestHost,
    "zo2y.com",
    "www.zo2y.com",
    "zo2y.pages.dev"
  ]);
  const originHost = parseHost(headers.origin);
  const refererHost = parseHost(headers.referer);
  if (originHost && allowedHosts.has(originHost)) return true;
  if (refererHost && allowedHosts.has(refererHost)) return true;
  return false;
}

function enforceWriteRateLimit(section, headers = {}) {
  const ip = getClientIp(headers);
  const now = Date.now();
  const key = `${section}:${ip}`;
  const current = WRITE_RATE_BUCKETS.get(key);
  const config = section === "analytics"
    ? { windowMs: 60_000, max: 120 }
    : { windowMs: 10 * 60_000, max: 24 };

  if (!current || (now - current.startedAt) > config.windowMs) {
    WRITE_RATE_BUCKETS.set(key, { startedAt: now, count: 1 });
    return null;
  }

  current.count += 1;
  if (current.count > config.max) {
    const retryAfter = Math.max(1, Math.ceil((config.windowMs - (now - current.startedAt)) / 1000));
    return {
      retryAfter,
      remaining: 0,
      limit: config.max
    };
  }
  if (WRITE_RATE_BUCKETS.size > 4000) {
    const oldest = WRITE_RATE_BUCKETS.keys().next().value;
    if (oldest) WRITE_RATE_BUCKETS.delete(oldest);
  }
  return {
    remaining: Math.max(0, config.max - current.count),
    limit: config.max
  };
}

function buildJsonResponse(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...COMMON_HEADERS,
      "content-type": "application/json; charset=utf-8",
      ...extraHeaders
    }
  });
}

function getRouteTarget(pathParts = []) {
  const [section, ...rest] = Array.isArray(pathParts) ? pathParts : [];
  const handler = ROUTE_HANDLERS.get(String(section || "").toLowerCase()) || null;
  if (!handler) return null;
  return {
    handler,
    queryPath: rest.join("/")
  };
}

export async function onRequest(context) {
  bindEnvToProcess(context.env);
  const pathParts = Array.isArray(context.params?.path)
    ? context.params.path.filter(Boolean)
    : String(context.params?.path || "").split("/").filter(Boolean);
  const route = getRouteTarget(pathParts);
  if (!route) {
    return buildJsonResponse({ message: "Not found" }, 404);
  }

  const section = String(pathParts[0] || "").toLowerCase();
  const headers = getLowerCaseHeaders(context.request);
  if (WRITE_ROUTE_PREFIXES.has(section) && isWriteMethod(context.request.method)) {
    if (!hasAllowedWriteOrigin(context.request, headers)) {
      return buildJsonResponse({
        message: "Write requests must come from Zo2y."
      }, 403, { "Cache-Control": "no-store" });
    }
    if (isLikelyBotWrite(headers, context.request.cf || {})) {
      return buildJsonResponse({
        message: "Automated write traffic is blocked."
      }, 403, { "Cache-Control": "no-store" });
    }
    const rateLimit = enforceWriteRateLimit(section, headers);
    if (rateLimit?.retryAfter) {
      return buildJsonResponse({
        message: "Too many requests. Try again shortly."
      }, 429, {
        "Retry-After": String(rateLimit.retryAfter),
        "Cache-Control": "no-store"
      });
    }
  }

  const req = await buildNodeLikeRequest(context.request, context.env);
  if (route.queryPath) req.query.path = route.queryPath;
  const { res, toResponse } = createNodeLikeResponse();
  if (WRITE_ROUTE_PREFIXES.has(section) && isWriteMethod(context.request.method)) {
    res.setHeader("Cache-Control", "no-store");
  }
  await route.handler(req, res);
  return toResponse();
}
