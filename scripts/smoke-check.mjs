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
  { name: "home", url: "/", expectIncludes: ["Zo2y"] },
  { name: "index", url: "/index.html", expectIncludes: ["All your interests in one place"] },
  { name: "login", url: "/login.html", expectIncludes: ["Return to your account.", "Log in"] },
  { name: "signup", url: "/sign-up.html", expectIncludes: ["Create account", "Sign up with Google"] },
  { name: "movies", url: "/movies.html", expectIncludes: ["Movies"] },
  { name: "tvshows", url: "/tvshows.html", expectIncludes: ["TV"] },
  { name: "games", url: "/games.html", expectIncludes: ["Games"] },
  { name: "books", url: "/books.html", expectIncludes: ["Books"] },
  { name: "travel", url: "/travel.html", expectIncludes: ["Travel"] },
  { name: "profile", url: "/profile.html", expectIncludes: ["Profile"] },
  { name: "privacy", url: "/privacy.html", expectIncludes: ["Privacy Policy"] },
  { name: "terms", url: "/terms.html", expectIncludes: ["Terms of Service"] },
  { name: "support", url: "/support.html", expectIncludes: ["Support"] },
  { name: "health", url: "/api/health", expectJsonKeys: ["ok", "service"] },
  { name: "analytics-health", url: "/api/analytics/health", expectJsonKeys: ["ok", "service"] },
  { name: "support-health", url: "/api/support/health", expectJsonKeys: ["ok", "service"] },
  { name: "igdb-health", url: "/api/igdb", expectStatus: 200 },
  { name: "music-health", url: "/api/music", expectStatus: 200 }
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
  const expectedStatus = Number(item.expectStatus || 200);
  if (response.status !== expectedStatus && !response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`${item.name} failed (${response.status}) ${item.url} ${body.slice(0, 300)}`);
  }
  if (Array.isArray(item.expectIncludes) && item.expectIncludes.length) {
    const body = await response.text();
    for (const token of item.expectIncludes) {
      if (!body.includes(token)) {
        throw new Error(`${item.name} missing expected content "${token}"`);
      }
    }
  } else if (Array.isArray(item.expectJsonKeys) && item.expectJsonKeys.length) {
    const json = await response.json();
    for (const key of item.expectJsonKeys) {
      if (!(key in json)) {
        throw new Error(`${item.name} missing expected json key "${key}"`);
      }
    }
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
