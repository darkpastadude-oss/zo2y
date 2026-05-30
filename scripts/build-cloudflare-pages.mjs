import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
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

const BOOTSTRAP_SNIPPET = `<style>
html.zt-loading { opacity: 0 !important; }
html.zt-ready { opacity: 1; transition: opacity 200ms ease; }
body.zt-page-exit-active { opacity: 0 !important; transform: translateY(6px) !important; pointer-events: none !important; transition: opacity 200ms ease, transform 200ms ease !important; }
@keyframes ztFadeInUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
.zt-page-enter { animation: ztFadeInUp 250ms ease forwards; }
@media (prefers-reduced-motion: reduce) { .zt-page-exit-active { transition: none !important; opacity: 1 !important; transform: none !important; } .zt-page-enter { animation: none !important; opacity: 1 !important; transform: none !important; } }
</style>
<script>
(function(){var h=document.documentElement;h.classList.add('zt-loading');var a=0,d=0;function t(){if(a&&d){h.classList.remove('zt-loading');h.classList.add('zt-ready')}}document.addEventListener('zo2y-auth-gate-verified',function(){a=1;t()},{once:true});document.addEventListener('zo2y-auth-ready',function(){a=1;t()},{once:true});if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',function(){d=1;t()},{once:true})}else{d=1;t()}window.addEventListener('load',function(){a=1;d=1;t()},{once:true})})();
</script>`;

async function exists(target) {
  try {
    await stat(target);
    return true;
  } catch (_error) {
    return false;
  }
}

function injectBootstrap(content) {
  // Inject after <meta charset> or <meta name="viewport"> tag
  const metaMatch = content.match(/<meta[^>]+charset[^>]*\/?>\s*(?:<meta[^>]+viewport[^>]*\/?>\s*)?/i);
  if (metaMatch) {
    const idx = metaMatch.index + metaMatch[0].length;
    return content.slice(0, idx) + '\n  ' + BOOTSTRAP_SNIPPET + content.slice(idx);
  }
  // Fallback: inject after <head>
  const headMatch = content.match(/<head>\s*/i);
  if (headMatch) {
    const idx = headMatch.index + headMatch[0].length;
    return content.slice(0, idx) + '\n  ' + BOOTSTRAP_SNIPPET + content.slice(idx);
  }
  return content;
}

async function processHtmlFiles() {
  const entries = await readdir(rootDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!entry.name.endsWith('.html')) continue;
    if (SKIP_ROOT_FILES.includes(entry.name)) continue;
    if (entry.name.startsWith('tmp-')) continue;

    const filePath = path.join(rootDir, entry.name);
    let content = await readFile(filePath, 'utf-8');

    // Only inject if not already present (idempotent)
    if (!content.includes('zt-loading')) {
      content = injectBootstrap(content);
      await writeFile(filePath, content, 'utf-8');
      console.log(`Injected bootstrap into: ${entry.name}`);
    }
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

function execAsync(command, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, {
      shell: true,
      stdio: "inherit",
      ...options
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command failed (${code}): ${command}`));
    });
  });
}

// Inject bootstrap into all HTML source files before copying
console.log("Injecting page bootstrap into HTML files...");
await processHtmlFiles();

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
