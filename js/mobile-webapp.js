(() => {
  const isMobileLike = window.matchMedia('(max-width: 900px)').matches || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

  document.body?.classList.add('app-booting');
  if (isMobileLike) {
    document.documentElement.classList.add('mobile-webapp');
    document.body?.classList.add('mobile-webapp');
  }

  const loadLine = document.createElement('div');
  loadLine.id = 'appLoadLine';
  document.documentElement.appendChild(loadLine);
  document.body?.classList.add('app-loading');

  window.addEventListener('DOMContentLoaded', () => {
    document.body.classList.remove('app-booting');
    document.body.classList.add('app-ready');
    window.setTimeout(() => document.body.classList.remove('app-loading'), 180);
  });

  // Prefetch same-origin page links on hover/touch for snappier transitions.
  const prefetched = new Set();
  const queuePrefetch = (href) => {
    try {
      const target = new URL(href, window.location.origin);
      if (target.origin !== window.location.origin) return;
      if (!/\.html?$/.test(target.pathname) && target.pathname !== '/') return;
      const key = target.pathname + target.search;
      if (prefetched.has(key)) return;
      prefetched.add(key);
      const l = document.createElement('link');
      l.rel = 'prefetch';
      l.href = target.href;
      document.head.appendChild(l);
    } catch (_) {
      // ignore malformed links
    }
  };

  document.addEventListener('mouseover', (event) => {
    const anchor = event.target && event.target.closest ? event.target.closest('a[href]') : null;
    if (!anchor) return;
    queuePrefetch(anchor.href);
  }, { passive: true });

  document.addEventListener('touchstart', (event) => {
    const anchor = event.target && event.target.closest ? event.target.closest('a[href]') : null;
    if (!anchor) return;
    queuePrefetch(anchor.href);
  }, { passive: true });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // silent fail to avoid runtime noise
      });
    });
  }
})();
