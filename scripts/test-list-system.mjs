import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import playwright from "playwright";

const DIST_DIR = new URL("../dist", import.meta.url).pathname;
const PORT = 9876;
const BASE = `http://localhost:${PORT}`;

const FORBIDDEN_PATTERNS = [
  { pattern: /external_type/i, desc: "list_items.external_type (column removed)" },
  { pattern: /list_collaborators/i, desc: "list_collaborators (table dropped)" },
  { pattern: /list_tier_meta/i, desc: "list_tier_meta (table dropped)" },
];

const MIME = {
  ".html": "text/html", ".js": "application/javascript", ".css": "text/css",
  ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp",
  ".svg": "image/svg+xml", ".ico": "image/x-icon", ".json": "application/json",
};

function serveFile(req, res) {
  let urlPath = new URL(req.url, BASE).pathname;
  if (urlPath === "/") urlPath = "/index.html";
  const filePath = path.join(DIST_DIR, urlPath);
  if (!existsSync(filePath)) {
    res.writeHead(404);
    res.end("Not found: " + urlPath);
    return;
  }
  const ext = path.extname(filePath).toLowerCase();
  const mime = MIME[ext] || "application/octet-stream";
  res.writeHead(200, { "Content-Type": mime, "Cache-Control": "no-cache" });
  res.end(readFileSync(filePath));
}

const PAGES = [
  "/index.html", "/movies.html", "/movie.html", "/games.html", "/game.html",
  "/tvshows.html", "/tvshow.html", "/animes.html", "/anime.html",
  "/books.html", "/book.html", "/music.html", "/song.html",
  "/travel.html", "/sports.html", "/team.html",
  "/fashion.html", "/food.html", "/cars.html",
  "/profile.html", "/brand.html",
];

async function main() {
  const server = createServer(serveFile);
  await new Promise((r) => server.listen(PORT, r));
  console.log(`Server on ${BASE}`);

  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, bypassCSP: true });

  let totalForbidden = 0;
  let pagesPassed = 0;
  let pagesFailed = 0;

  for (const pagePath of PAGES) {
    const page = await context.newPage();
    const forbiddenFound = new Set();
    const consoleErrors = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const txt = msg.text();
        consoleErrors.push(txt);
        for (const fp of FORBIDDEN_PATTERNS) {
          if (fp.pattern.test(txt)) forbiddenFound.add(fp.desc);
        }
      }
    });

    await page.goto(`${BASE}${pagePath}`, { waitUntil: "load", timeout: 8000 }).catch((e) => {
      consoleErrors.push("NAV_ERROR: " + e.message);
    });
    await page.waitForTimeout(1000);

    if (forbiddenFound.size > 0) {
      pagesFailed++;
      console.log(`\nFAIL ${pagePath}`);
      console.log(`  Forbidden: ${[...forbiddenFound].join(", ")}`);
      consoleErrors.forEach(e => {
        if (FORBIDDEN_PATTERNS.some(fp => fp.pattern.test(e))) console.log(`  ${e.slice(0, 200)}`);
      });
      totalForbidden += forbiddenFound.size;
    } else {
      const nonTrivial = consoleErrors.filter(e =>
        !e.includes("favicon") && !e.includes("google") && !e.includes("supabase") &&
        !e.includes("Failed to load") && !e.includes("404")
      );
      if (nonTrivial.length > 0) {
        console.log(`WARN ${pagePath} (${nonTrivial.length} console errors)`);
        nonTrivial.slice(0, 3).forEach(e => console.log(`  ${e.slice(0, 200)}`));
      } else {
        console.log(`OK   ${pagePath}`);
      }
      pagesPassed++;
    }

    await page.close();
  }

  await browser.close();
  await new Promise((r) => server.close(r));

  console.log(`\n=== RESULTS ===`);
  console.log(`Passed: ${pagesPassed}/${PAGES.length}`);
  console.log(`Failed (forbidden): ${pagesFailed}/${PAGES.length}`);
  if (totalForbidden > 0) process.exit(1);
}

main().catch(e => { console.error("FATAL:", e); process.exit(1); });
