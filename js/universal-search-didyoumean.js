(function () {
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
    if (document.getElementById('universal-search-didyoumean-styles')) return;
    const style = document.createElement('style');
    style.id = 'universal-search-didyoumean-styles';
    style.textContent = `
      .universal-search-didyoumean {
        position: absolute;
        left: 0;
        top: 100%;
        margin-top: 6px;
        font-size: 12px;
        color: #8ca3c7;
        display: none;
        pointer-events: auto;
      }
      .universal-search-didyoumean button {
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

  function attachDidYouMeanToInput(input) {
    if (!input || input.dataset.zo2yDidYouMeanInit === '1') return;
    input.dataset.zo2yDidYouMeanInit = '1';
    ensureStyles();

    const host = input.parentElement || input;
    if (host && host instanceof HTMLElement) {
      const computed = window.getComputedStyle(host);
      if (computed.position === 'static') host.style.position = 'relative';
    }

    const el = document.createElement('div');
    el.className = 'universal-search-didyoumean';
    el.setAttribute('aria-live', 'polite');
    host.appendChild(el);

    const hide = () => {
      el.textContent = '';
      el.style.display = 'none';
    };

    const update = () => {
      const q = String(input.value || '').trim();
      if (!q || q.length < 3) return hide();

      const dropdown = document.querySelector('.universal-search-dropdown');
      if (!dropdown) return hide();

      const titles = Array.from(dropdown.querySelectorAll('.universal-search-title'))
        .map((n) => String(n.textContent || '').trim())
        .filter(Boolean);
      const uniq = Array.from(new Set(titles)).slice(0, 40);
      if (!uniq.length) return hide();

      let best = '';
      let bestScore = Number.POSITIVE_INFINITY;
      for (const c of uniq) {
        const score = damerauLevenshtein(q, c, 3);
        if (score < bestScore) {
          bestScore = score;
          best = c;
        }
      }
      if (!best || !Number.isFinite(bestScore) || bestScore > 2) return hide();
      if (normalizeForMatch(best) === normalizeForMatch(q)) return hide();

      el.innerHTML = `Did you mean <button type="button">${best.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</button>?`;
      el.style.display = 'block';
      el.querySelector('button')?.addEventListener('click', () => {
        input.value = best;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.focus();
        hide();
      }, { once: true });
    };

    input.addEventListener('input', () => {
      window.setTimeout(update, 0);
    });

    input.addEventListener('blur', () => {
      window.setTimeout(hide, 250);
    });

    const observer = new MutationObserver(() => update());
    observer.observe(document.body, { childList: true, subtree: true });
  }

  const original = window.initUniversalSearch;
  if (typeof original !== 'function' || window.__ZO2Y_UNIVERSAL_SEARCH_DIDYOUMEAN_READY) return;
  window.__ZO2Y_UNIVERSAL_SEARCH_DIDYOUMEAN_READY = true;

  window.initUniversalSearch = function patchedInitUniversalSearch(options) {
    const res = original.call(this, options);
    try {
      const input = typeof options?.input === 'string'
        ? document.querySelector(options.input)
        : options?.input;
      attachDidYouMeanToInput(input);
    } catch (_err) {}
    return res;
  };
})();

