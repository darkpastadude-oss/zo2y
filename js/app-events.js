/**
 * AppEvents — global runtime signal bus (Product Contract D2).
 *
 * The ONLY runtime signal for cross-component updates:
 *   Supabase → Services → Canonical State → Components
 *
 * Components subscribe to the fixed event set below; they never poll
 * or guess. Keep the event set small.
 *
 * Fixed events:
 *   auth:ready              — Auth.ready() resolved
 *   auth:signed_out         — user signed out, all user state cleared
 *   auth:session_refreshed  — token refreshed, canonical id unchanged
 *   profile:loaded          — profile data loaded from DB into UserStore
 *   profile:updated         — profile mutated (avatar/banner/username/save)
 *   avatar:updated          — avatar changed (payload: { avatarUrl })
 *   banner:updated          — banner changed (payload: { bannerUrl, config })
 *   lists:updated           — any list add/remove completed
 *   media:updated           — a media item detail changed
 */
const AppEvents = (function () {
  const listeners = new Map();

  function on(event, handler) {
    if (typeof handler !== 'function') throw new Error('AppEvents.on: handler must be a function');
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event).add(handler);
    return function off() {
      un(event, handler);
    };
  }

  function once(event, handler) {
    const off = on(event, function wrapped(payload) {
      off();
      handler(payload);
    });
    return off;
  }

  function un(event, handler) {
    const set = listeners.get(event);
    if (!set) return;
    set.delete(handler);
    if (set.size === 0) listeners.delete(event);
  }

  function emit(event, payload) {
    const set = listeners.get(event);
    if (!set || set.size === 0) return 0;
    let count = 0;
    for (const handler of Array.from(set)) {
      try {
        handler(payload);
        count += 1;
      } catch (err) {
        // A broken subscriber must never break the event source.
        // eslint-disable-next-line no-console
        console.error('AppEvents listener error for', event, err);
      }
    }
    return count;
  }

  function hasListeners(event) {
    const set = listeners.get(event);
    return !!(set && set.size > 0);
  }

  function clear(event) {
    if (event) {
      listeners.delete(event);
    } else {
      listeners.clear();
    }
  }

  return { on, once, off: un, emit, hasListeners, clear };
})();

window.AppEvents = AppEvents;