function normalizeBaseUrl(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

function boolFromEnv(value, fallback = true) {
  if (value === undefined || value === null || String(value).trim() === "") return fallback;
  const normalized = String(value).trim().toLowerCase();
  return !["0", "false", "no", "off"].includes(normalized);
}

const BASE_URL = normalizeBaseUrl(process.env.BASE_URL || "http://127.0.0.1:5000");
const SKIP_REDIRECTS = boolFromEnv(process.env.SMOKE_SKIP_REDIRECTS, true);
const REDIRECT_PROBE_PATH = String(process.env.SMOKE_REDIRECT_PROBE_PATH || "/").trim() || "/";

const checks = [
  { name: "home", url: "/" },
  { name: "index", url: "/index.html" },
  { name: "health", url: "/api/health" },
  { name: "analytics-health", url: "/api/analytics/health" },
  { name: "support-health", url: "/api/support/health" },
  { name: "igdb-health", url: "/api/igdb" },
  { name: "music-health", url: "/api/music" }
];

function buildUrl(baseUrl, path) {
  return `${baseUrl}${path}`;
}

async function resolveCanonicalBaseUrl(baseUrl) {
  if (!SKIP_REDIRECTS) return baseUrl;

  let currentBase = normalizeBaseUrl(baseUrl);
  const visited = new Set();

  for (let hops = 0; hops < 4; hops += 1) {
    if (visited.has(currentBase)) break;
    visited.add(currentBase);

    try {
      const response = await fetch(buildUrl(currentBase, REDIRECT_PROBE_PATH), {
        method: "GET",
        redirect: "manual"
      });
      const isRedirect = [301, 302, 303, 307, 308].includes(response.status);
      if (!isRedirect) break;

      const location = response.headers.get("location");
      if (!location) break;

      const nextUrl = new URL(location, buildUrl(currentBase, REDIRECT_PROBE_PATH));
      const nextBase = `${nextUrl.protocol}//${nextUrl.host}`;
      if (!nextBase || nextBase === currentBase) break;
      currentBase = nextBase;
    } catch (_error) {
      break;
    }
  }

  return currentBase;
}

async function runCheck(baseUrl, item) {
  const started = Date.now();
  const response = await fetch(buildUrl(baseUrl, item.url));
  const elapsed = Date.now() - started;
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`${item.name} failed (${response.status}) ${item.url} ${body.slice(0, 300)}`);
  }
  return { ...item, elapsed };
}

async function main() {
  const resolvedBaseUrl = await resolveCanonicalBaseUrl(BASE_URL);

  if (resolvedBaseUrl !== BASE_URL) {
    console.log(`Smoke checks against ${BASE_URL} (canonical ${resolvedBaseUrl})`);
  } else {
    console.log(`Smoke checks against ${resolvedBaseUrl}`);
  }

  const results = [];
  for (const item of checks) {
    const result = await runCheck(resolvedBaseUrl, item);
    results.push(result);
    console.log(`OK  ${item.name} ${item.url} ${result.elapsed}ms`);
  }
  const avg = Math.round(results.reduce((sum, r) => sum + r.elapsed, 0) / Math.max(1, results.length));
  console.log(`Done. ${results.length} checks passed. Avg latency: ${avg}ms`);
}

main().catch((error) => {
  console.error(`Smoke checks failed: ${error.message}`);
  process.exit(1);
});
