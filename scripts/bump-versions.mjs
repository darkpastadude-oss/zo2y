// bump-versions.mjs — replace cache-buster versions in HTML safely.
// Uses Buffer/utf8 (Node preserves multibyte chars), no BOM, no line-ending
// changes (only does exact SPA style Replace on matched strings).
import { readdirSync, readFileSync, writeFileSync, statSync } from 'fs';
import { join } from 'path';

const map = {
  'auth-gate.js?v=20260805A': 'auth-gate.js?v=20260808A',
  'auth-gate.js?v=20260807B': 'auth-gate.js?v=20260808A',
  'bootstrap-auth.js?v=20260803C': 'bootstrap-auth.js?v=20260808A',
  'bootstrap-auth.js?v=20260807B': 'bootstrap-auth.js?v=20260808A',
  'shared-header.js?v=20260721B': 'shared-header.js?v=20260808A',
  'shared-header.js?v=20260807B': 'shared-header.js?v=20260808A',
  'js/boot-diag.js?v=20260807C': '',
};

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) {
      if (e === 'node_modules' || e === '.git' || e === 'dist' || e === 'scripts' || e === 'test-results' || e === '.wrangler') continue;
      walk(p, out);
    } else if (p.endsWith('.html')) {
      out.push(p);
    }
  }
  return out;
}

const files = walk('.');
let touched = 0;
for (const f of files) {
  let src = readFileSync(f, 'utf8');
  const orig = src;
  for (const [k, v] of Object.entries(map)) {
    if (v === '') {
      // remove the whole script tag line
      src = src.replace(new RegExp(`\\s*<script src="[^"]*${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"></script>`, 'i'), '');
    } else {
      src = src.split(k).join(v);
    }
  }
  if (src !== orig) {
    writeFileSync(f, src, 'utf8');
    touched += 1;
    console.log('updated', f);
  }
}
console.log('touched', touched, 'files');