import analyticsHandler from "../../api/analytics-handler.js";
import authHandler from "../../api/auth-handler.js";
import booksHandler from "../../api/books-handler.js";
import emailsHandler from "../../api/emails-handler.js";
import healthHandler from "../../api/health.js";
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
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  "Content-Security-Policy": "default-src 'self'; base-uri 'self'; form-action 'self' https:; frame-ancestors 'none'; object-src 'none'; img-src 'self' data: https:; media-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; font-src 'self' data: https:; connect-src 'self' https: wss:; frame-src https:; worker-src 'self' blob:; upgrade-insecure-requests"
};

const ROUTE_HANDLERS = new Map([
  ["analytics", analyticsHandler],
  ["auth", authHandler],
  ["books", booksHandler],
  ["emails", emailsHandler],
  ["health", healthHandler],
  ["igdb", igdbHandler],
  ["logo", logoHandler],
  ["music", musicHandler],
  ["openlibrary", openlibraryHandler],
  ["sportsdb", sportsdbHandler],
  ["support", supportHandler],
  ["tmdb", tmdbHandler]
]);

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
    return new Response(JSON.stringify({ message: "Not found" }), {
      status: 404,
      headers: {
        ...COMMON_HEADERS,
        "content-type": "application/json; charset=utf-8"
      }
    });
  }

  const req = await buildNodeLikeRequest(context.request, context.env);
  if (route.queryPath) req.query.path = route.queryPath;
  const { res, toResponse } = createNodeLikeResponse();
  await route.handler(req, res);
  return toResponse();
}
