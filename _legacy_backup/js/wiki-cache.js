(() => {
  if (window.__zo2yWikiCache) return;

  const DB_NAME = 'zo2y-wiki-cache-v1';
  const DB_VERSION = 1;
  const STORE_NAME = 'wiki';
  const NOCOVER_STORE = 'wiki_empty';
  const TTL = 7 * 24 * 60 * 60 * 1000;
  const NOCOVER_TTL = 3 * 24 * 60 * 60 * 1000;
  const LS_PREFIX = 'zo2y_wiki_v1:';
  const LS_EMPTY_PREFIX = 'zo2y_wiki_empty_v1:';
  const IMG_PREFIX = 'zo2y_wiki_img_v1:';
  const IMG_TTL = 14 * 24 * 60 * 60 * 1000;
  const INMEM = new Map();
  const IMG_INMEM = new Map();

  let lsOk = false;
  try { lsOk = !!window.localStorage; } catch (_) {}

  let dbPromise = null;
  function openDB() {
    if (dbPromise) return dbPromise;
    if (!window.indexedDB) {
      dbPromise = Promise.resolve(null);
      return dbPromise;
    }
    dbPromise = new Promise((resolve) => {
      try {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(STORE_NAME))
            db.createObjectStore(STORE_NAME, { keyPath: 'k' });
          if (!db.objectStoreNames.contains(NOCOVER_STORE))
            db.createObjectStore(NOCOVER_STORE, { keyPath: 'k' });
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      } catch (_) { resolve(null); }
    });
    return dbPromise;
  }

  function k(name) {
    return String(name || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
  }

  function lsGet(prefix, key) {
    if (!lsOk) return null;
    try {
      const raw = localStorage.getItem(prefix + key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (Date.now() - parsed.t > TTL) {
        localStorage.removeItem(prefix + key);
        return null;
      }
      return parsed;
    } catch (_) { return null; }
  }

  function lsSet(prefix, key, val) {
    if (!lsOk) return;
    try { localStorage.setItem(prefix + key, JSON.stringify(val)); } catch (_) {}
  }

  function lsDel(prefix, key) {
    if (!lsOk) return;
    try { localStorage.removeItem(prefix + key); } catch (_) {}
  }

  async function idbGet(store, key) {
    const db = await openDB();
    if (!db) return null;
    try {
      const tx = db.transaction(store, 'readonly');
      const req = tx.objectStore(store).get(key);
      return await new Promise((res) => {
        req.onsuccess = () => res(req.result || null);
        req.onerror = () => res(null);
      });
    } catch (_) { return null; }
  }

  async function idbPut(store, val) {
    const db = await openDB();
    if (!db) return;
    try {
      const tx = db.transaction(store, 'readwrite');
      tx.objectStore(store).put(val);
      await new Promise((res) => { tx.oncomplete = () => res(); tx.onerror = () => res(); });
    } catch (_) {}
  }

  async function getWiki(name) {
    const key = k(name);
    if (!key) return null;
    if (INMEM.has(key)) return INMEM.get(key);

    const ls = lsGet(LS_PREFIX, key);
    if (ls && ls.d) {
      INMEM.set(key, ls.d);
      return ls.d;
    }
    const idb = await idbGet(STORE_NAME, key);
    if (idb && idb.d) {
      INMEM.set(key, idb.d);
      lsSet(LS_PREFIX, key, { d: idb.d, t: Date.now() });
      return idb.d;
    }
    const empty = lsGet(LS_EMPTY_PREFIX, key) || await idbGet(NOCOVER_STORE, key);
    if (empty) {
      INMEM.set(key, null);
      return null;
    }
    return null;
  }

  async function setWiki(name, data) {
    const key = k(name);
    if (!key) return;
    if (!data) {
      INMEM.set(key, null);
      lsSet(LS_EMPTY_PREFIX, key, { t: Date.now() });
      await idbPut(NOCOVER_STORE, { k: key, t: Date.now() });
      return;
    }
    INMEM.set(key, data);
    lsSet(LS_PREFIX, key, { d: data, t: Date.now() });
    await idbPut(STORE_NAME, { k: key, d: data, t: Date.now() });
    lsDel(LS_EMPTY_PREFIX, key);
  }

  function getImageUrl(originalUrl) {
    if (!originalUrl) return '';
    if (IMG_INMEM.has(originalUrl)) return IMG_INMEM.get(originalUrl);
    if (!lsOk) return originalUrl;
    try {
      const raw = localStorage.getItem(IMG_PREFIX + originalUrl);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Date.now() - parsed.t < IMG_TTL) {
          IMG_INMEM.set(originalUrl, parsed.u);
          return parsed.u;
        }
      }
    } catch (_) {}
    return originalUrl;
  }

  function setImageUrl(originalUrl, finalUrl) {
    if (!originalUrl || !finalUrl) return;
    IMG_INMEM.set(originalUrl, finalUrl);
    lsSet(IMG_PREFIX, originalUrl, { u: finalUrl, t: Date.now() });
  }

  function preloadImage(url) {
    if (!url) return Promise.resolve();
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    link.crossOrigin = 'anonymous';
    link.fetchPriority = 'high';
    document.head.appendChild(link);
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.fetchPriority = 'high';
      img.onload = () => resolve();
      img.onerror = () => resolve();
      img.src = url;
    });
  }

  function clearAll() {
    INMEM.clear();
    IMG_INMEM.clear();
  }

  window.__zo2yWikiCache = {
    getWiki,
    setWiki,
    getImageUrl,
    setImageUrl,
    preloadImage,
    clearAll
  };
})();
