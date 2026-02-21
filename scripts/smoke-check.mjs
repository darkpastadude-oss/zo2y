const BASE_URL = String(process.env.BASE_URL || "http://127.0.0.1:5000").replace(/\/+$/, "");

const checks = [
  { name: "home", url: "/" },
  { name: "index", url: "/index.html" },
  { name: "health", url: "/api/health" },
  { name: "analytics-health", url: "/api/analytics/health" },
  { name: "support-health", url: "/api/support/health" },
  { name: "igdb-health", url: "/api/igdb" },
  { name: "music-health", url: "/api/music" }
];

async function runCheck(item) {
  const started = Date.now();
  const response = await fetch(`${BASE_URL}${item.url}`);
  const elapsed = Date.now() - started;
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`${item.name} failed (${response.status}) ${item.url} ${body.slice(0, 300)}`);
  }
  return { ...item, elapsed };
}

async function main() {
  console.log(`Smoke checks against ${BASE_URL}`);
  const results = [];
  for (const item of checks) {
    const result = await runCheck(item);
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

