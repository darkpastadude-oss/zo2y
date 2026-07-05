(function initZo2yDidYouMean(global) {
  if (global.ZO2Y_DID_YOU_MEAN) return;

  function normalize(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]+/g, '')
      .replace(/[\u0027\u2019]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function levenshtein(a, b, limit = 50) {
    const s = normalize(a);
    const t = normalize(b);
    if (!s || !t) return Number.POSITIVE_INFINITY;
    if (s === t) return 0;
    if (Math.abs(s.length - t.length) > limit) return Number.POSITIVE_INFINITY;
    const v0 = new Array(t.length + 1);
    const v1 = new Array(t.length + 1);
    for (let i = 0; i <= t.length; i += 1) v0[i] = i;
    for (let i = 0; i < s.length; i += 1) {
      v1[0] = i + 1;
      let rowMin = v1[0];
      for (let j = 0; j < t.length; j += 1) {
        const cost = s[i] === t[j] ? 0 : 1;
        v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost);
        if (v1[j + 1] < rowMin) rowMin = v1[j + 1];
      }
      if (rowMin > limit) return Number.POSITIVE_INFINITY;
      for (let j = 0; j <= t.length; j += 1) v0[j] = v1[j];
    }
    return v0[t.length];
  }

  function suggest(query, candidates = [], options = {}) {
    const q = String(query || '').trim();
    const list = Array.isArray(candidates) ? candidates : [];
    if (!q || !list.length) return '';
    const max = Math.max(2, Math.min(10, Number(options.maxDistance || 4) || 4));
    const maxLen = Math.max(1, normalize(q).length);

    let best = '';
    let bestScore = Number.POSITIVE_INFINITY;
    for (const candidate of list) {
      const text = String(candidate || '').trim();
      if (!text) continue;
      const d = levenshtein(q, text, max + 6);
      if (!Number.isFinite(d)) continue;
      const ratio = d / Math.max(maxLen, normalize(text).length, 1);
      const score = d + ratio;
      if (d <= max && score < bestScore) {
        bestScore = score;
        best = text;
      }
    }
    return best;
  }

  global.ZO2Y_DID_YOU_MEAN = {
    normalize,
    levenshtein,
    suggest
  };
})(window);

