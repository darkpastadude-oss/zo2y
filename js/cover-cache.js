(() => {
  if (window.__zo2yCoverCache) return;

  const DB_NAME = 'zo2y-cover-cache-v1';
  const DB_VERSION = 1;
  const STORE_NAME = 'covers';
  const NOCOVER_STORE = 'nocover';
  const COVER_TTL = 21 * 24 * 60 * 60 * 1000;
  const NOCOVER_TTL = 7 * 24 * 60 * 60 * 1000;
  const LS_PREFIX = 'zo2y_cover_v2:';
  const LS_NOCOVER_PREFIX = 'zo2y_nocover_v2:';
  const INMEM = new Map();

  let dbPromise = null;
  let lsOk = false;
  try { lsOk = !!window.localStorage; } catch (_) {}

  function key(title) {
    return String(title || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
  }

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

  function lsGet(prefix, k) {
    if (!lsOk) return null;
    try {
      const raw = localStorage.getItem(prefix + k);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (Date.now() - parsed.t > (prefix === LS_PREFIX ? COVER_TTL : NOCOVER_TTL)) {
        localStorage.removeItem(prefix + k);
        return null;
      }
      return parsed;
    } catch (_) { return null; }
  }

  function lsSet(prefix, k, val) {
    if (!lsOk) return;
    try { localStorage.setItem(prefix + k, JSON.stringify(val)); } catch (_) {}
  }

  function lsDel(prefix, k) {
    if (!lsOk) return;
    try { localStorage.removeItem(prefix + k); } catch (_) {}
  }

  async function idbGet(storeName, k) {
    const db = await openDB();
    if (!db) return null;
    try {
      const tx = db.transaction(storeName, 'readonly');
      const req = tx.objectStore(storeName).get(k);
      return await new Promise((res, rej) => {
        req.onsuccess = () => res(req.result || null);
        req.onerror = () => res(null);
      });
    } catch (_) { return null; }
  }

  async function idbPut(storeName, val) {
    const db = await openDB();
    if (!db) return;
    try {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).put(val);
      await new Promise((res, rej) => {
        tx.oncomplete = () => res();
        tx.onerror = () => res();
      });
    } catch (_) {}
  }

  async function idbDel(storeName, k) {
    const db = await openDB();
    if (!db) return;
    try {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).delete(k);
      await new Promise((res) => { tx.oncomplete = () => res(); tx.onerror = () => res(); });
    } catch (_) {}
  }

  async function getCachedCover(title) {
    const k = key(title);
    if (!k) return '';
    if (INMEM.has(k)) return INMEM.get(k) || '';

    const ls = lsGet(LS_PREFIX, k);
    if (ls && ls.u) {
      INMEM.set(k, ls.u);
      return ls.u;
    }

    const idb = await idbGet(STORE_NAME, k);
    if (idb && idb.u) {
      INMEM.set(k, idb.u);
      lsSet(LS_PREFIX, k, { u: idb.u, t: Date.now() });
      return idb.u;
    }

    return '';
  }

  async function setCachedCover(title, url) {
    const k = key(title);
    if (!k || !url) return;
    INMEM.set(k, url);
    const val = { u: url, t: Date.now() };
    lsSet(LS_PREFIX, k, val);
    await idbPut(STORE_NAME, { k, u: url, t: Date.now() });
    await idbDel(NOCOVER_STORE, k);
    lsDel(LS_NOCOVER_PREFIX, k);
  }

  async function isNoCover(title) {
    const k = key(title);
    if (!k) return false;
    if (INMEM.get(k)) return false;

    const ls = lsGet(LS_NOCOVER_PREFIX, k);
    if (ls) return true;

    const idb = await idbGet(NOCOVER_STORE, k);
    if (idb) {
      const savedAt = Number(idb?.t || 0);
      if (Number.isFinite(savedAt) && (Date.now() - savedAt) > NOCOVER_TTL) {
        await idbDel(NOCOVER_STORE, k);
        return false;
      }
      lsSet(LS_NOCOVER_PREFIX, k, { t: savedAt || Date.now() });
      return true;
    }
    return false;
  }

  async function markNoCover(title) {
    const k = key(title);
    if (!k) return;
    INMEM.set(k, '');
    const val = { t: Date.now() };
    lsSet(LS_NOCOVER_PREFIX, k, val);
    await idbPut(NOCOVER_STORE, { k, t: Date.now() });
    await idbDel(STORE_NAME, k);
    lsDel(LS_PREFIX, k);
  }

  function clearCache() {
    INMEM.clear();
  }

  window.__zo2yCoverCache = {
    getCachedCover,
    setCachedCover,
    isNoCover,
    markNoCover,
    clearCache
  };
})();
