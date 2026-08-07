// strip-debug.mjs — production cleanup.
// Removes from the 4 auth/profile source files:
//   1) standalone `pd('...')` statements + the `pd` function def (profile.js)
//   2) pure-diag `try { if (window.__zo2yDiag ... } catch (_e) {}` statements
//   3) `console.debug` lines that are part of debug-only helpers
// Strategy: tokenize (skip strings/templates/comments), find try statements,
// classify PURE (first stmt is diag-only), remove largest-first, dedupe.
import { readFileSync, writeFileSync } from 'fs';

const TARGETS = process.argv.slice(2);
if (TARGETS.length === 0) {
  console.error('usage: node scripts/strip-debug.mjs <file1> [file2 ...]');
  process.exit(1);
}

const debug = (label, src) => {
  if (process.env.STRIP_VERBOSE) {
    const lines = src.split('\n');
    console.log(label, 'lines=', lines.length);
  }
};

function tokenize(src) {
  const toks = [];
  let i = 0;
  const n = src.length;
  let bufStart = 0;
  const pushCode = (end) => {
    if (end > bufStart) toks.push({ type: 'code', start: bufStart, end });
  };
  while (i < n) {
    const c = src[i];
    const c2 = src[i + 1];
    if (c === '/' && c2 === '/') {
      pushCode(i);
      let j = i;
      while (j < n && src[j] !== '\n') j += 1;
      toks.push({ type: 'comment', start: i, end: j + 1 });
      i = j + 1;
      bufStart = i;
    } else if (c === '/' && c2 === '*') {
      pushCode(i);
      let j = i + 2;
      while (j < n && !(src[j] === '*' && src[j + 1] === '/')) j += 1;
      toks.push({ type: 'comment', start: i, end: Math.min(j + 2, n) });
      i = Math.min(j + 2, n);
      bufStart = i;
    } else if (c === "'" || c === '"') {
      pushCode(i);
      let j = i + 1;
      while (j < n) {
        if (src[j] === '\\') { j += 2; continue; }
        if (src[j] === c) { j += 1; break; }
        j += 1;
      }
      toks.push({ type: 'str', start: i, end: Math.min(j, n) });
      i = Math.min(j, n);
      bufStart = i;
    } else if (c === '`') {
      pushCode(i);
      let j = i + 1;
      while (j < n) {
        if (src[j] === '\\') { j += 2; continue; }
        if (src[j] === '`') { j += 1; break; }
        if (src[j] === '$' && src[j + 1] === '{') {
          j += 2;
          let depth = 1;
          while (j < n && depth > 0) {
            if (src[j] === '\\') { j += 2; continue; }
            if (src[j] === '{') depth += 1;
            else if (src[j] === '}') depth -= 1;
            if (depth === 0) break;
            j += 1;
          }
          j += 1;
          continue;
        }
        j += 1;
      }
      toks.push({ type: 'tpl', start: i, end: Math.min(j, n) });
      i = Math.min(j, n);
      bufStart = i;
    } else {
      i += 1;
    }
  }
  pushCode(n);
  return toks;
}

const ignoredRanges = (toks) =>
  toks.filter((t) => t.type !== 'code').map((t) => [t.start, t.end]);

function skipIgnored(src, ignored, pos) {
  const n = src.length;
  let i = pos;
  while (i < n) {
    const hit = ignored.find((r) => i >= r[0] && i < r[1]);
    if (hit) { i = hit[1]; continue; }
    if (/\s/.test(src[i])) { i += 1; continue; }
    break;
  }
  return i;
}

function findCodeSegments(src, toks) {
  return toks.filter((t) => t.type === 'code');
}

// Find all `try` keywords that are followed by `{`.
function findTryStatements(src, codeSegs) {
  const out = [];
  for (const seg of codeSegs) {
    const s = src.slice(seg.start, seg.end);
    const re = /\btry\b/g;
    let m;
    while ((m = re.exec(s)) !== null) {
      const tryPos = seg.start + m.index;
      let bracePos = tryPos + 3;
      while (bracePos < src.length && /\s/.test(src[bracePos])) bracePos += 1;
      if (src[bracePos] === '{') out.push({ tryPos, bracePos });
    }
  }
  return out;
}

// Find end of balanced { ... } starting at bracePos (the `{`).
function matchBraces(src, ignored, bracePos) {
  const n = src.length;
  let depth = 1;
  let i = bracePos + 1;
  while (i < n) {
    if (ignored.some((r) => i >= r[0] && i < r[1])) { i = skipIgnored(src, ignored, i); continue; }
    const c = src[i];
    if (c === '{') depth += 1;
    else if (c === '}') { depth -= 1; if (depth === 0) return i; }
    i += 1;
  }
  return -1;
}

// Read the first code word after skipping whitespace/comments.
function nextWord(src, ignored, from) {
  const i = skipIgnored(src, ignored, from);
  let j = i;
  while (j < src.length && /[A-Za-z0-9_$]/.test(src[j])) j += 1;
  return { word: src.slice(i, j), at: i, end: j };
}

// Find statement end of `try ...` (try body + optional catch/finally blocks).
function tryStatementEnd(src, ignored, bracePos) {
  const bodyEnd = matchBraces(src, ignored, bracePos);
  if (bodyEnd === -1) return -1;
  let i = bodyEnd + 1;
  let end = bodyEnd;
  for (;;) {
    const kw = nextWord(src, ignored, i);
if (kw.word === 'catch') {
      let p = skipIgnored(src, ignored, kw.end);
      if (src[p] === '(') {
        const closeParen = matchParen(src, ignored, p);
        if (closeParen === -1) return -1;
        p = closeParen + 1;
      }
      const b = nextWord(src, ignored, p);
      if (src[b.at] !== '{') return -1;
      const cbEnd = matchBraces(src, ignored, b.at);
      if (cbEnd === -1) return -1;
      end = cbEnd; i = cbEnd + 1;
} else if (kw.word === 'finally') {
      let p = skipIgnored(src, ignored, kw.end);
      if (src[p] !== '{') return -1;
      const fbEnd = matchBraces(src, ignored, p);
      if (fbEnd === -1) return -1;
      end = fbEnd; i = fbEnd + 1;
    } else {
      break;
    }
  }
  return end;
}

function matchParen(src, ignored, openPos) {
  const n = src.length;
  let depth = 1;
  let i = openPos + 1;
  while (i < n) {
    if (ignored.some((r) => i >= r[0] && i < r[1])) { i = skipIgnored(src, ignored, i); continue; }
    const c = src[i];
    if (c === '(') depth += 1;
    else if (c === ')') { depth -= 1; if (depth === 0) return i; }
    i += 1;
  }
  return -1;
}

// Get text between try `{` and its matching `}`.
function tryBody(src, ignored, bracePos) {
  const end = matchBraces(src, ignored, bracePos);
  if (end === -1) return null;
  return src.slice(bracePos + 1, end);
}

// PURE = first code statement in the body is diag-only.
function isPureDiag(body) {
  const firstTrim = body.replace(/^\s*\/\/[^\n]*\n/, '').trim();
  return (
    /^if\s*\(\s*window\.__zo2yDiag/.test(firstTrim) ||
    /^window\.__zo2yDiag\b/.test(firstTrim) ||
    /^cid\s*=\s*window\.__zo2yDiag/.test(firstTrim)
  );
}

// Find `pd(` statement spans in a file (profile.js). Returns ranges covering
// the full `pd(...)` statement INCLUDING trailing `;` (when on same line).
function findPdStatements(src, toks) {
  const ignored = ignoredRanges(toks);
  const out = [];
  for (const seg of toks.filter((t) => t.type === 'code')) {
    const s = src.slice(seg.start, seg.end);
    const re = /\bpd\(/g;
    let m;
    while ((m = re.exec(s)) !== null) {
      const start = seg.start + m.index;
      // Only treat as statement if preceded by start/`;`/`{`/`}`/whitespace
      const before = src.slice(Math.max(0, start - 40), start);
      if (!/(^|[;{}]\s*|\n\s*)$/.test(before)) continue;
      const closeParen = matchParen(src, ignored, start + 2);
      if (closeParen === -1) continue;
      let end = closeParen + 1;
      if (src[end] === ';') end += 1;
      out.push({ start, end, kind: 'pd' });
    }
  }
  return out;
}

// Find `function pd(...) {...}` definition span.
function findPdFunction(src, toks) {
  const ignored = ignoredRanges(toks);
  for (const seg of toks.filter((t) => t.type === 'code')) {
    const s = src.slice(seg.start, seg.end);
    const re = /function\s+pd\s*\(/g;
    let m;
    while ((m = re.exec(s)) !== null) {
      const start = seg.start + m.index;
      const openParen = skipWhitespace(src, start + m[0].length - 1);
      if (src[openParen] !== '(') continue;
      const closeParen = matchParen(src, ignored, openParen);
      if (closeParen === -1) continue;
      const b = nextWord(src, ignored, closeParen + 1);
      if (src[b.at] !== '{') continue;
      const bodyEnd = matchBraces(src, ignored, b.at);
      if (bodyEnd === -1) continue;
      return { start, end: bodyEnd + 1, kind: 'pdfn' };
    }
  }
  return null;
}

function skipWhitespace(src, pos) {
  let i = pos;
  while (i < src.length && /\s/.test(src[i])) i += 1;
  return i;
}

function stripFile(file) {
  const src = readFileSync(file, 'utf8');
  const toks = tokenize(src);
  const ignored = ignoredRanges(toks);
  const codeSegs = findCodeSegments(src, toks);
  const ranges = [];

  // 1. pd function def + pd statements (profile.js only)
  if (file.endsWith('profile.js')) {
    const fn = findPdFunction(src, toks);
    if (fn) ranges.push(fn);
    for (const r of findPdStatements(src, toks)) ranges.push(r);
  }

  // 2. pure-diag try statements
  const tryStmts = findTryStatements(src, codeSegs);
  for (const ts of tryStmts) {
    const body = tryBody(src, ignored, ts.bracePos);
    if (!body) continue;
    if (!isPureDiag(body)) continue;
    const stmtEnd = tryStatementEnd(src, ignored, ts.bracePos);
    if (stmtEnd === -1) continue;
    // require the statement to contain the diag token and look like `... } catch ...`
    const stmtText = src.slice(ts.tryPos, stmtEnd + 1);
    if (!stmtText.includes('__zo2yDiag')) continue;
    ranges.push({ start: ts.tryPos, end: stmtEnd + 1, kind: 'try' });
  }

  // Dedupe: drop any range inside another range (keep the outer), then drop
  // ranges whose content overlaps a pd/range boundary incorrectly.
  ranges.sort((a, b) => a.start - b.start);
  const kept = [];
  for (const r of ranges) {
    const insideExisting = kept.some((k) => r.start >= k.start && r.end <= k.end);
    if (!insideExisting) {
      // also drop if overlapping but not contained (safety)
      const overlaps = kept.some((k) => r.start < k.end && k.start < r.end);
      if (!overlaps) kept.push(r);
    }
  }

  // Apply: build new string by removing ranges, descending.
  const sorted = kept.slice().sort((a, b) => b.start - a.start);
  let out = src;
  for (const r of sorted) {
    out = out.slice(0, r.start) + out.slice(r.end);
  }
  const removedChars = sorted.reduce((a, r) => a + (r.end - r.start), 0);
  console.log(file, 'removed=', sorted.length, 'blocks', removedChars, 'chars');
  for (const r of sorted) {
    const snippet = src.slice(r.start, Math.min(r.end, r.start + 60)).replace(/\n/g, ' ');
    console.log('   -', r.kind, 'line', src.slice(0, r.start).split('\n').length, '::', snippet);
  }
  writeFileSync(file, out, 'utf8');
}

for (const f of TARGETS) stripFile(f);