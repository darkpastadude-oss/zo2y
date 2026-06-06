import {
  attachRequestContext,
  applySecurityHeaders,
  requestLogger,
  jsonErrorHandler,
  getClientIp,
  hashValue,
  redactQuery
} from "../backend/lib/guardrails.js";

const MAX_BODY_BYTES = 16 * 1024;

export default async function handler(req, res) {
  // We do NOT use createRateLimiter / applySecurityHeaders chain here
  // because this is called by the browser via Report-Only headers;
  // the body is an opaque JSON document and we should be lenient.
  attachRequestContext(req, res, () => {});
  applySecurityHeaders(req, res, () => {});
  requestLogger(req, res, () => {});

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method not allowed" });
  }

  // Read raw body (csp reports come as application/csp-report or
  // application/reports+json; we accept both, capped at 16 KB).
  let raw = "";
  try {
    await new Promise((resolve) => {
      let total = 0;
      req.on("data", (chunk) => {
        total += chunk.length;
        if (total > MAX_BODY_BYTES) {
          req.destroy();
          resolve();
          return;
        }
        raw += chunk.toString("utf8");
      });
      req.on("end", resolve);
      req.on("error", resolve);
    });
  } catch (_err) {
    return res.status(400).json({ message: "Bad body" });
  }
  if (!raw) {
    return res.status(204).end();
  }

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch (_err) {
    return res.status(400).json({ message: "Invalid JSON" });
  }

  // Extract a small set of fields so we don't dump arbitrary content
  // into our logs / DB.
  const reports = Array.isArray(payload) ? payload : [payload];
  const safe = [];
  for (const r of reports) {
    if (!r || typeof r !== "object") continue;
    const csp = r["csp-report"] || r;
    safe.push({
      document_uri: String(csp["document-uri"] || "").slice(0, 500),
      violated_directive: String(csp["violated-directive"] || "").slice(0, 200),
      effective_directive: String(csp["effective-directive"] || "").slice(0, 200),
      blocked_uri: String(csp["blocked-uri"] || "").slice(0, 500),
      original_policy: String(csp["original-policy"] || "").slice(0, 2000),
      source_file: String(csp["source-file"] || "").slice(0, 500),
      line_number: Number.isFinite(csp["line-number"]) ? csp["line-number"] : null,
      column_number: Number.isFinite(csp["column-number"]) ? csp["column-number"] : null,
      disposition: String(csp["disposition"] || "").slice(0, 50)
    });
    if (safe.length >= 5) break;
  }

  // eslint-disable-next-line no-console
  console.warn("[CSP-REPORT]", {
    request_id: req.requestId || null,
    ip: hashValue(getClientIp(req)) || null,
    path: redactQuery(req.originalUrl || req.url || ""),
    reports: safe
  });

  return res.status(204).end();
}
