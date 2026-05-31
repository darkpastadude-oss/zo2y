(function () {
  var AUTH_STORAGE_KEY = 'zo2y-auth-v2';
  var PERSIST_AUTH_STORAGE_KEY = 'zo2y-auth-persist-v2';
  var DURABLE_AUTH_STORAGE_KEY = 'zo2y-auth-durable-v2';
  var LEGACY_AUTH_STORAGE_KEY = 'supabase-auth-key';
  var OLD_PERSIST_AUTH_STORAGE_KEY = 'zo2y-auth-persist';

  var config = window.__ZO2Y_SUPABASE_CONFIG || {};
  var SUPABASE_URL = String(config.url || '').trim();
  var SUPABASE_KEY = String(config.key || '').trim();

  var client = null;

  function getAuthStorageKeys(key) {
    var value = String(key || '').trim();
    if (!value) return [];
    if (value === AUTH_STORAGE_KEY || value === PERSIST_AUTH_STORAGE_KEY || value === DURABLE_AUTH_STORAGE_KEY || value === LEGACY_AUTH_STORAGE_KEY || value === OLD_PERSIST_AUTH_STORAGE_KEY) {
      return [AUTH_STORAGE_KEY, PERSIST_AUTH_STORAGE_KEY, DURABLE_AUTH_STORAGE_KEY];
    }
    return [value];
  }

  function ensureSupabaseClient() {
    if (client) return client;
    if (window.__ZO2Y_SUPABASE_CLIENT) {
      client = window.__ZO2Y_SUPABASE_CLIENT;
      return client;
    }
    if (!window.supabase || typeof window.supabase.createClient !== 'function') return null;
    var storageBridge = window.__ZO2Y_AUTH_STORAGE_BRIDGE || {
      getItem: function (key) {
        var keys = getAuthStorageKeys(key);
        for (var i = 0; i < keys.length; i++) {
          try { var v = window.localStorage ? window.localStorage.getItem(keys[i]) : null; if (v) return v; } catch (e) {}
        }
        for (var i = 0; i < keys.length; i++) {
          try { var v = window.sessionStorage ? window.sessionStorage.getItem(keys[i]) : null; if (v) return v; } catch (e) {}
        }
        return null;
      },
      setItem: function (key, value) {
        var keys = getAuthStorageKeys(key);
        for (var i = 0; i < keys.length; i++) {
          try { if (window.localStorage) window.localStorage.setItem(keys[i], value); } catch (e) {}
        }
        for (var i = 0; i < keys.length; i++) {
          try { if (window.sessionStorage) window.sessionStorage.setItem(keys[i], value); } catch (e) {}
        }
      },
      removeItem: function (key) {
        var keys = getAuthStorageKeys(key);
        for (var i = 0; i < keys.length; i++) {
          try { if (window.sessionStorage) window.sessionStorage.removeItem(keys[i]); } catch (e) {}
        }
        for (var i = 0; i < keys.length; i++) {
          try { if (window.localStorage) window.localStorage.removeItem(keys[i]); } catch (e) {}
        }
      }
    };
    window.__ZO2Y_AUTH_STORAGE_BRIDGE = storageBridge;
    try {
      client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: {
          storage: storageBridge,
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
          storageKey: AUTH_STORAGE_KEY
        }
      });
      window.__ZO2Y_SUPABASE_CLIENT = client;
      return client;
    } catch (e) {
      return null;
    }
  }

  window.__ZO2Y_ENSURE_SUPABASE_CLIENT = ensureSupabaseClient;
  window.__ZO2Y_GET_SUPABASE_CLIENT = ensureSupabaseClient;
})();
