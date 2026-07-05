/**
 * audit-logos.cjs
 * Fetches every brand/team from Supabase, downloads its logo,
 * and reports suspicious ones (screenshots, wrong size, broken, etc.)
 */

const https = require('https');
const http  = require('http');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gfkhjbztayjyojsgdpgk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma2hqYnp0YXlqeW9qc2dkcGdrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUzNjMxOCwiZXhwIjoyMDkxODk2MzE4fQ.6vGwIkgDmsL5cTqKaLbnsbQ4_flcgZ7CqK_dESPgIUU';
const STORAGE_BASE = `${SUPABASE_URL}/storage/v1/object/public/brand-logos`;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, { timeout: 15000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({
        status: res.statusCode,
        contentType: res.headers['content-type'] || '',
        buffer: Buffer.concat(chunks),
      }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function logoUrl(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${STORAGE_BASE}/${path}`;
}

// Detect if a PNG/JPEG looks like a screenshot (wide landscape image)
// We parse PNG IHDR or JPEG SOF to get width/height
function parseDimensions(buf, contentType) {
  try {
    if (contentType.includes('svg')) return { w: null, h: null, format: 'svg' };

    // PNG: bytes 16-23 = width (4) + height (4)
    if (buf[0] === 0x89 && buf[1] === 0x50) {
      const w = buf.readUInt32BE(16);
      const h = buf.readUInt32BE(20);
      return { w, h, format: 'png' };
    }

    // JPEG: scan for SOF marker
    if (buf[0] === 0xFF && buf[1] === 0xD8) {
      let offset = 2;
      while (offset < buf.length - 8) {
        if (buf[offset] !== 0xFF) break;
        const marker = buf[offset + 1];
        const len = buf.readUInt16BE(offset + 2);
        if ((marker >= 0xC0 && marker <= 0xC3) || (marker >= 0xC5 && marker <= 0xC7) ||
            (marker >= 0xC9 && marker <= 0xCB) || (marker >= 0xCD && marker <= 0xCF)) {
          const h = buf.readUInt16BE(offset + 5);
          const w = buf.readUInt16BE(offset + 7);
          return { w, h, format: 'jpeg' };
        }
        offset += 2 + len;
      }
    }

    // WebP
    if (buf.slice(0, 4).toString() === 'RIFF' && buf.slice(8, 12).toString() === 'WEBP') {
      // VP8 chunk
      if (buf.slice(12, 16).toString() === 'VP8 ') {
        const w = buf.readUInt16LE(26) & 0x3FFF;
        const h = buf.readUInt16LE(28) & 0x3FFF;
        return { w, h, format: 'webp' };
      }
      return { w: null, h: null, format: 'webp' };
    }
  } catch (_) {}
  return { w: null, h: null, format: 'unknown' };
}

function diagnose(name, buf, contentType, sizeBytes) {
  const issues = [];

  if (!buf || buf.length === 0) { issues.push('EMPTY_RESPONSE'); return issues; }

  const { w, h, format } = parseDimensions(buf, contentType);

  // Very large files are probably screenshots
  if (sizeBytes > 200_000) issues.push(`LARGE_FILE(${Math.round(sizeBytes/1024)}KB)`);

  // Very small files are probably broken
  if (sizeBytes < 500 && format !== 'svg') issues.push(`TINY_FILE(${sizeBytes}B)`);

  // Landscape aspect ratio → likely a screenshot or banner, not a logo
  if (w && h) {
    const ratio = w / h;
    if (ratio > 3.5) issues.push(`LANDSCAPE_SCREENSHOT(${w}x${h})`);
    else if (ratio > 2.0) issues.push(`WIDE_BANNER(${w}x${h})`);
    // Very tall
    if (h > 0 && ratio < 0.15) issues.push(`VERY_TALL(${w}x${h})`);
    // Huge resolution
    if (w > 1500 || h > 1500) issues.push(`HUGE_RESOLUTION(${w}x${h})`);
  }

  // Not an image content type
  if (!contentType.match(/image\/(png|jpeg|svg|webp|gif)/)) {
    issues.push(`BAD_CONTENT_TYPE(${contentType})`);
  }

  return issues;
}

async function auditTable(tableName, nameField = 'name') {
  const { data, error } = await supabase
    .from(tableName)
    .select('id, name, logo_url')
    .order('name');

  if (error) {
    console.error(`  ERROR fetching ${tableName}: ${error.message}`);
    return [];
  }

  const results = [];
  for (const row of data) {
    const url = logoUrl(row.logo_url);
    const entry = {
      table: tableName,
      id: row.id,
      name: row.name,
      logo_url: row.logo_url,
      full_url: url,
      status: null,
      issues: [],
      sizeBytes: 0,
      contentType: '',
    };

    if (!url) {
      entry.status = 'MISSING';
      entry.issues = ['NO_LOGO_URL'];
      results.push(entry);
      continue;
    }

    try {
      const resp = await fetchUrl(url);
      entry.status = resp.status;
      entry.contentType = resp.contentType;
      entry.sizeBytes = resp.buffer.length;

      if (resp.status !== 200) {
        entry.issues.push(`HTTP_${resp.status}`);
      } else {
        entry.issues = diagnose(row.name, resp.buffer, resp.contentType, resp.buffer.length);
      }
    } catch (e) {
      entry.status = 'ERROR';
      entry.issues = [`FETCH_ERROR: ${e.message}`];
    }

    results.push(entry);
    const ok = entry.issues.length === 0;
    const icon = ok ? '✓' : '✗';
    const issueStr = entry.issues.length ? ` → ${entry.issues.join(', ')}` : '';
    console.log(`  ${icon} [${row.name}] ${entry.sizeBytes}B ${entry.contentType.split(';')[0]}${issueStr}`);
  }
  return results;
}

async function main() {
  console.log('========================================');
  console.log('  LOGO AUDIT - ALL BRAND TABLES');
  console.log('========================================\n');

  const tables = [
    'fashion_brands',
    'food_brands',
    'car_brands',
    'sports_teams',
  ];

  const allResults = [];

  for (const table of tables) {
    console.log(`\n── ${table.toUpperCase()} ──`);
    const res = await auditTable(table);
    allResults.push(...res);
  }

  // Summary
  const ok = allResults.filter(r => r.issues.length === 0);
  const bad = allResults.filter(r => r.issues.length > 0);

  console.log('\n\n========================================');
  console.log('  AUDIT SUMMARY');
  console.log('========================================');
  console.log(`Total entries: ${allResults.length}`);
  console.log(`✓ Clean:       ${ok.length}`);
  console.log(`✗ Problematic: ${bad.length}`);

  if (bad.length > 0) {
    console.log('\n── PROBLEMATIC LOGOS ──');
    for (const r of bad) {
      console.log(`  [${r.table}] ${r.name}`);
      console.log(`    logo_url:  ${r.logo_url}`);
      console.log(`    issues:    ${r.issues.join(', ')}`);
    }
  }

  // Write JSON report
  const report = { timestamp: new Date().toISOString(), total: allResults.length, clean: ok.length, problematic: bad.length, entries: allResults };
  require('fs').writeFileSync('logo-audit-report.json', JSON.stringify(report, null, 2));
  console.log('\nFull report saved to: logo-audit-report.json');
}

main().catch(console.error);
