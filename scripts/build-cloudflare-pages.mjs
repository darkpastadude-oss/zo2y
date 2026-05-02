import { cp, mkdir, readdir, rm, stat } from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const distDir = path.join(rootDir, "dist");

const ALLOWED_ROOT_FILE_EXTENSIONS = new Set([
  ".html",
  ".css",
  ".xml",
  ".txt",
  ".svg",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".ico",
  ".webmanifest"
]);

const ALLOWED_ROOT_FILES = new Set([
  "_headers",
  "favicon.ico",
  "manifest.webmanifest",
  "robots.txt",
  "sitemap.xml",
  "sw.js"
]);

const SKIP_ROOT_FILES = [
  "package.json",
  "package-lock.json",
  "vercel.json",
  "index.ts"
];

const COPY_DIRS = new Set([
  "assets",
  "css",
  "images",
  "js"
]);

async function exists(target) {
  try {
    await stat(target);
    return true;
  } catch (_error) {
    return false;
  }
}

async function copyRootStaticFiles() {
  const entries = await readdir(rootDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    if (entry.isDirectory()) {
      if (!COPY_DIRS.has(entry.name)) continue;
      await cp(path.join(rootDir, entry.name), path.join(distDir, entry.name), { recursive: true });
      continue;
    }

    const ext = path.extname(entry.name).toLowerCase();
    if (SKIP_ROOT_FILES.includes(entry.name)) continue;
    if (entry.name.startsWith("tmp-")) continue;
    if (!ALLOWED_ROOT_FILES.has(entry.name) && !ALLOWED_ROOT_FILE_EXTENSIONS.has(ext)) continue;
    await cp(path.join(rootDir, entry.name), path.join(distDir, entry.name));
  }
}

await rm(distDir, { recursive: true, force: true });
await mkdir(distDir, { recursive: true });

// Inject environment variables into source files before copying
console.log("Injecting environment variables...");
await execAsync("node scripts/inject-env-config.mjs");

await copyRootStaticFiles();

if (!(await exists(path.join(distDir, "_headers")))) {
  throw new Error("Expected dist/_headers to exist after Cloudflare static build.");
}

console.log("Cloudflare Pages static build complete:", distDir);
