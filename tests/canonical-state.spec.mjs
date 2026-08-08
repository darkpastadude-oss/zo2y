import { test, expect } from '@playwright/test';
import { getSupabaseConfig, createTestUser } from './helpers.mjs';

let authSession = null;

test.beforeAll(async () => {
  try {
    authSession = await createTestUser();
  } catch (e) {
    console.warn('Auth setup failed:', e.message);
  }
});

async function injectSession(page, session) {
  const config = getSupabaseConfig();
  const projectRef = config.url.replace('https://', '').replace('.supabase.co', '');
  await page.addInitScript(({ session: s, projectRef: ref }) => {
    localStorage.setItem('zo2y-auth-v2', JSON.stringify(s));
    localStorage.setItem('zo2y-auth-persist-v2', JSON.stringify(s));
    localStorage.setItem('zo2y-auth-durable-v2', JSON.stringify({ session: s }));
    localStorage.setItem('sb-' + ref + '-auth-token', JSON.stringify({
      currentSession: s,
      expires_at: s.expires_at,
    }));
  }, { session, projectRef });
}

test.describe('Canonical State (C1-C4, D2)', () => {
  test('AppEvents and UserStore are loaded and functional', async ({ page }) => {
    if (!authSession) { test.skip(); return; }
    await injectSession(page, authSession);
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/profile.html', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);

    const result = await page.evaluate(() => ({
      hasAppEvents: typeof window.AppEvents !== 'undefined',
      hasUserStore: typeof window.UserStore !== 'undefined',
      hasOn: typeof window.AppEvents?.on === 'function',
      hasEmit: typeof window.AppEvents?.emit === 'function',
      storeGet: typeof window.UserStore?.get === 'function',
      storeSub: typeof window.UserStore?.subscribe === 'function',
      storePatch: typeof window.UserStore?.patch === 'function',
    }));
    expect(result).toEqual({
      hasAppEvents: true,
      hasUserStore: true,
      hasOn: true,
      hasEmit: true,
      storeGet: true,
      storeSub: true,
      storePatch: true,
    });
    expect(errors).toEqual([]);
  });

  test('UserStore emits profile:updated + avatar:updated on patch (C3/D2)', async ({ page }) => {
    if (!authSession) { test.skip(); return; }
    await injectSession(page, authSession);
    await page.goto('/profile.html', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForFunction(() => typeof window.UserStore !== 'undefined' && typeof window.AppEvents !== 'undefined');

    const evts = await page.evaluate(() => {
      window.__evts = [];
      window.AppEvents.on('profile:updated', (s) => window.__evts.push(['profile:updated', s && s.avatarUrl]));
      window.AppEvents.on('avatar:updated', (s) => window.__evts.push(['avatar:updated', s && s.avatarUrl]));
      const ok = window.UserStore.patch({ avatarUrl: 'https://example.com/patched-avatar.png' });
      const snap = window.UserStore.get();
      return { ok, evts: window.__evts, avatar: snap.avatarUrl };
    });
    expect(evts.ok).toBe(true);
    expect(evts.avatar).toBe('https://example.com/patched-avatar.png');
    expect(evts.evts.filter(e => e[0] === 'avatar:updated').length).toBeGreaterThanOrEqual(1);
    expect(evts.evts.filter(e => e[0] === 'profile:updated').length).toBeGreaterThanOrEqual(1);
  });

  test('profile.js seeds UserStore from DB (C1, C2)', async ({ page }) => {
    if (!authSession) { test.skip(); return; }
    await injectSession(page, authSession);
    await page.goto('/profile.html', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForFunction(() => typeof window.UserStore !== 'undefined' && window.UserStore.get().loaded === true, null, { timeout: 30000 });

    const snap = await page.evaluate(() => window.UserStore.get());
    expect(snap.loaded).toBe(true);
    expect(snap.id).toBe(authSession.user.id);
    expect(snap.username).toBe('jnns');
  });
});
