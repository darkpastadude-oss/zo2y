(function () {
  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function normalizeForMatch(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function damerauLevenshtein(a, b, maxDistance) {
    const s = normalizeForMatch(a);
    const t = normalizeForMatch(b);
    const md = Number.isFinite(maxDistance) ? maxDistance : 3;
    if (!s || !t) return Number.POSITIVE_INFINITY;
    if (Math.abs(s.length - t.length) > md) return Number.POSITIVE_INFINITY;
    const w = t.length + 1;
    const dp = new Array((s.length + 1) * w).fill(0);
    const idx = (i, j) => i * w + j;
    for (let i = 0; i <= s.length; i++) dp[idx(i, 0)] = i;
    for (let j = 0; j <= t.length; j++) dp[idx(0, j)] = j;
    for (let i = 1; i <= s.length; i++) {
      let bestInRow = Number.POSITIVE_INFINITY;
      for (let j = 1; j <= t.length; j++) {
        const cost = s[i - 1] === t[j - 1] ? 0 : 1;
        let v = Math.min(
          dp[idx(i - 1, j)] + 1,
          dp[idx(i, j - 1)] + 1,
          dp[idx(i - 1, j - 1)] + cost
        );
        if (i > 1 && j > 1 && s[i - 1] === t[j - 2] && s[i - 2] === t[j - 1]) {
          v = Math.min(v, dp[idx(i - 2, j - 2)] + cost);
        }
        dp[idx(i, j)] = v;
        if (v < bestInRow) bestInRow = v;
      }
      if (bestInRow > md) return Number.POSITIVE_INFINITY;
    }
    return dp[idx(s.length, t.length)];
  }

  function ensureStyles() {
    if (document.getElementById('zo2y-didyoumean-global-styles')) return;
    const style = document.createElement('style');
    style.id = 'zo2y-didyoumean-global-styles';
    style.textContent = `
      .zo2y-didyoumean {
        margin-top: 6px;
        font-size: 13px;
        color: rgba(140,163,199,0.95);
        display: none;
      }
      .zo2y-didyoumean button {
        border: 0;
        background: transparent;
        color: #f59e0b;
        font-weight: 700;
        cursor: pointer;
        padding: 0;
      }
    `;
    document.head.appendChild(style);
  }

  function getCandidatesNearInput(input) {
    const dropdown = document.querySelector('.universal-search-dropdown');
    if (dropdown) {
      return Array.from(dropdown.querySelectorAll('.universal-search-title'))
        .map((n) => String(n.textContent || '').trim())
        .filter(Boolean);
    }
    const listId = input.getAttribute('list');
    if (listId) {
      const list = document.getElementById(listId);
      if (list) {
        return Array.from(list.querySelectorAll('option'))
          .map((o) => String(o.value || o.textContent || '').trim())
          .filter(Boolean);
      }
    }
    return [];
  }

  function attach(input) {
    if (!input || input.dataset.zo2yDidYouMeanGlobalInit === '1') return;
    input.dataset.zo2yDidYouMeanGlobalInit = '1';
    ensureStyles();

    const container = input.closest('.controls, .search-wrap, .nav-search, .hero-actions') || input.parentElement;
    if (!container) return;
    if (!(container instanceof HTMLElement)) return;

    let el = container.querySelector('.zo2y-didyoumean');
    if (!el) {
      el = document.createElement('div');
      el.className = 'zo2y-didyoumean';
      el.setAttribute('aria-live', 'polite');
      container.appendChild(el);
    }

    const hide = () => {
      el.textContent = '';
      el.style.display = 'none';
    };

    const update = () => {
      const q = String(input.value || '').trim();
      if (!q || q.length < 3) return hide();
      const candidates = Array.from(new Set(getCandidatesNearInput(input))).slice(0, 60);
      if (!candidates.length) return hide();

      let best = '';
      let bestScore = Number.POSITIVE_INFINITY;
      for (const c of candidates) {
        const score = damerauLevenshtein(q, c, 3);
        if (score < bestScore) {
          bestScore = score;
          best = c;
        }
      }
      if (!best || !Number.isFinite(bestScore) || bestScore > 2) return hide();
      if (normalizeForMatch(best) === normalizeForMatch(q)) return hide();

      el.innerHTML = `Did you mean <button type="button">${escapeHtml(best)}</button>?`;
      el.style.display = 'block';
      el.querySelector('button')?.addEventListener('click', () => {
        input.value = best;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.focus();
        hide();
      }, { once: true });
    };

    input.addEventListener('input', () => window.setTimeout(update, 0));
    input.addEventListener('focus', () => window.setTimeout(update, 0));
    input.addEventListener('blur', () => window.setTimeout(hide, 250));
  }

  function scan() {
    document.querySelectorAll('input.search-input, input[type=\"search\"], input[type=\"text\"]').forEach((input) => {
      const placeholder = String(input.getAttribute('placeholder') || '').toLowerCase();
      if (!placeholder.includes('search') && !String(input.id || '').toLowerCase().includes('search')) return;
      attach(input);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scan, { once: true });
  } else {
    scan();
  }

  if (typeof MutationObserver === 'function') {
    const observer = new MutationObserver(() => scan());
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }
})();

