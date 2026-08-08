/**
 * UserStore — canonical runtime user state (Product Contract C1–C4).
 *
 * The ONLY runtime authority for id / username / avatarUrl / bannerUrl.
 *   Database → UserStore → UI
 *
 * Components subscribe; they never read private copies. Every mutation
 * updates the store, emits `profile:updated` (plus narrow events), so the
 * header, profile page, and banner picker all render the same value.
 *
 * Usage (page init):
 *   UserStore.seed(sessionUser)          // id from auth, before DB query
 *   UserStore.update(profileRow)         // DB row → canonical (authoritative)
 *
 * Mutation (via ProfileService, never from components):
 *   UserStore.patch({ avatarUrl })       // emits profile:updated + avatar:updated
 *
 * Subscribe:
 *   const off = UserStore.subscribe('profile:updated', (state, prev) => {...})
 */
const UserStore = (function () {
  const state = {
    id: null,
    username: '',
    avatarUrl: '',
    bannerUrl: '',
    loaded: false,
  };

  const listeners = new Set();

  function snapshot() {
    return {
      id: state.id,
      username: state.username,
      avatarUrl: state.avatarUrl,
      bannerUrl: state.bannerUrl,
      loaded: state.loaded,
    };
  }

  function notify() {
    const snap = snapshot();
    for (const handler of Array.from(listeners)) {
      try {
        handler(snap, prevSnapshot);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('UserStore listener error', err);
      }
    }
  }

  let prevSnapshot = snapshot();

  function set(patch, opts) {
    const before = snapshot();
    let changed = false;
    for (const key of Object.keys(patch)) {
      if (key in state && state[key] !== patch[key]) {
        state[key] = patch[key];
        changed = true;
      }
    }
    if (!changed) return false;
    prevSnapshot = before;
    notify();
    if (window.AppEvents) {
      if ('avatarUrl' in patch) {
        window.AppEvents.emit('avatar:updated', { avatarUrl: state.avatarUrl });
      }
      if ('bannerUrl' in patch) {
        window.AppEvents.emit('banner:updated', { bannerUrl: state.bannerUrl });
      }
      if (!opts || !opts.silent) {
        window.AppEvents.emit('profile:updated', snapshot());
      }
    }
    return true;
  }

  /**
   * seed(sessionUser) — call as soon as auth resolves. Sets the id from the
   * auth session BEFORE any DB query so pages can gate on an id being present.
   */
  function seed(sessionUser) {
    const id = String((sessionUser && sessionUser.id) || '').trim() || null;
    if (!id) return false;
    return set({ id }, { silent: true });
  }

  /**
   * update(profileRow) — apply a DB row (user_profiles / JWT claims fallback).
   * Authoritative: overwrites username/avatar/banner/loaded.
   */
  function update(profileRow) {
    const row = profileRow || {};
    const patch = {
      username: String(row.username || row.user_name || '').trim(),
      avatarUrl: String(row.avatar_url || row.avatarUrl || '').trim(),
      bannerUrl: String(row.banner_url || row.bannerUrl || '').trim(),
      loaded: true,
    };
    if (row.id) patch.id = String(row.id).trim();
    return set(patch);
  }

  /**
   * patch(partial) — a targeted mutation (avatar/banner/username).
   * Emits profile:updated + narrow events. Silent variants used during
   * internal hydration so components don't re-render for intermediate state.
   */
  function patch(partial, opts) {
    return set(partial, opts);
  }

  function get() {
    return snapshot();
  }

  function subscribe(handler) {
    if (typeof handler !== 'function') throw new Error('UserStore.subscribe: handler must be a function');
    listeners.add(handler);
    return function off() {
      listeners.delete(handler);
    };
  }

  function reset() {
    set({
      id: null,
      username: '',
      avatarUrl: '',
      bannerUrl: '',
      loaded: false,
    }, { silent: true });
    if (window.AppEvents) window.AppEvents.emit('auth:signed_out', {});
  }

  return {
    seed,
    update,
    patch,
    get,
    subscribe,
    reset,
  };
})();

window.UserStore = UserStore;