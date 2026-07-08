import { test, expect } from '@playwright/test';
import {
  getSupabaseConfig,
  createTestUser,
  supabaseQuery,
  supabaseInsert,
  supabaseDelete,
  supabaseUpsert,
} from './helpers.mjs';

let authSession = null;
let testUserId = null;

test.beforeAll(async () => {
  try {
    authSession = await createTestUser();
    testUserId = authSession.user.id;
  } catch (e) {
    console.warn('Auth setup failed:', e.message);
  }
});

async function injectSessionViaInitScript(page, session) {
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

test.describe('Profile List Loading', () => {
  test('profile page loads (may redirect to login if no auth)', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/profile.html', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    const url = page.url();
    const isOnProfile = url.includes('profile');
    const isOnLogin = url.includes('login') || url.includes('sign');
    expect(isOnProfile || isOnLogin).toBe(true);
  });

  test('profile page has rail track elements when authed', async ({ page }) => {
    if (!authSession) { test.skip(); return; }
    await injectSessionViaInitScript(page, authSession);
    await page.goto('/profile.html', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    const trackCount = await page.evaluate(() => {
      return document.querySelectorAll('.pv2-rail-track').length;
    });
    expect(trackCount).toBeGreaterThanOrEqual(8);
  });

  test('list-utils.js loads and exposes ListUtils when authed', async ({ page }) => {
    if (!authSession) { test.skip(); return; }
    await injectSessionViaInitScript(page, authSession);
    await page.goto('/profile.html', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    const hasListUtils = await page.evaluate(() => typeof window.ListUtils !== 'undefined');
    expect(hasListUtils).toBe(true);
  });

  test('profile-showcase.js loads without duplicate declaration', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/profile.html', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);

    const duplicateErrors = errors.filter(e => e.includes('has already been declared'));
    expect(duplicateErrors).toEqual([]);
  });
});

async function safeInsert(table, row) {
  const config = getSupabaseConfig();
  const { createClient } = await import('@supabase/supabase-js');
  const client = createClient(config.url, config.key, {
    global: { headers: { Authorization: `Bearer ${authSession.access_token}` } },
  });
  const { data, error } = await client.from(table).insert(row).select().single();
  if (error) throw error;
  return data;
}

async function safeDelete(table, filters) {
  const config = getSupabaseConfig();
  const { createClient } = await import('@supabase/supabase-js');
  const client = createClient(config.url, config.key, {
    global: { headers: { Authorization: `Bearer ${authSession.access_token}` } },
  });
  let query = client.from(table).delete();
  for (const [key, value] of Object.entries(filters)) {
    query = query.eq(key, value);
  }
  const { error } = await query;
  if (error) throw error;
}

async function safeQuery(table, filters = {}, select = '*') {
  const config = getSupabaseConfig();
  const { createClient } = await import('@supabase/supabase-js');
  const client = createClient(config.url, config.key, {
    global: { headers: { Authorization: `Bearer ${authSession.access_token}` } },
  });
  let query = client.from(table).select(select);
  for (const [key, value] of Object.entries(filters)) {
    query = query.eq(key, value);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

test.describe('Profile List Operations (Authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    if (!authSession) { test.skip(); return; }
    await injectSessionViaInitScript(page, authSession);
    await page.goto('/profile.html', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
  });

  test('authenticated profile stays on profile page', async ({ page }) => {
    const url = page.url();
    expect(url).toContain('profile');
  });

  test('can query list_items table directly via Supabase', async () => {
    if (!testUserId) return;
    const items = await safeQuery('list_items', { user_id: testUserId });
    expect(Array.isArray(items)).toBe(true);
  });

  test('can query user_lists table directly via Supabase', async () => {
    if (!testUserId) return;
    const lists = await safeQuery('user_lists', { user_id: testUserId });
    expect(Array.isArray(lists)).toBe(true);
  });

  test('can add item to list_items default list and remove it', async () => {
    if (!testUserId) return;

    await safeDelete('list_items', {
      user_id: testUserId,
      media_type: 'movie',
      item_id: '999999',
    });

    const testRow = {
      user_id: testUserId,
      media_type: 'movie',
      item_id: '999999',
      list_type: 'favorites',
    };

    const inserted = await safeInsert('list_items', testRow);
    expect(inserted).toBeTruthy();

    const found = await safeQuery('list_items', {
      user_id: testUserId,
      media_type: 'movie',
      item_id: '999999',
    });
    expect(found.length).toBeGreaterThanOrEqual(1);

    await safeDelete('list_items', {
      user_id: testUserId,
      media_type: 'movie',
      item_id: '999999',
    });

    const afterDelete = await safeQuery('list_items', {
      user_id: testUserId,
      media_type: 'movie',
      item_id: '999999',
    });
    expect(afterDelete.length).toBe(0);
  });

  test('can create custom list in user_lists and add items to it', async () => {
    if (!testUserId) return;

    const listRow = {
      user_id: testUserId,
      media_type: 'movie',
      name: 'Test Playwright List',
    };
    const created = await safeInsert('user_lists', listRow);
    expect(created).toBeTruthy();
    expect(created.id).toBeTruthy();

    const itemRow = {
      user_id: testUserId,
      media_type: 'movie',
      item_id: '857',
      list_id: created.id,
    };
    const itemInserted = await safeInsert('list_items', itemRow);
    expect(itemInserted).toBeTruthy();

    const items = await safeQuery('list_items', {
      list_id: created.id,
    });
    expect(items.length).toBe(1);
    expect(items[0].item_id).toBe('857');

    await safeDelete('list_items', { list_id: created.id });
    await safeDelete('user_lists', { id: created.id });
  });

  test('can toggle favorites (add then remove)', async () => {
    if (!testUserId) return;

    await safeDelete('list_items', {
      user_id: testUserId,
      media_type: 'movie',
      item_id: '680',
      list_type: 'favorites',
    });

    const testRow = {
      user_id: testUserId,
      media_type: 'movie',
      item_id: '680',
      list_type: 'favorites',
    };

    await safeInsert('list_items', testRow);
    const favs = await safeQuery('list_items', {
      user_id: testUserId,
      media_type: 'movie',
      list_type: 'favorites',
    });
    expect(favs.some(i => i.item_id === '680')).toBe(true);

    await safeDelete('list_items', {
      user_id: testUserId,
      media_type: 'movie',
      item_id: '680',
      list_type: 'favorites',
    });
    const afterRemove = await safeQuery('list_items', {
      user_id: testUserId,
      media_type: 'movie',
      item_id: '680',
      list_type: 'favorites',
    });
    expect(afterRemove.length).toBe(0);
  });

  test('review can be added and removed from unified reviews table', async () => {
    if (!testUserId) return;

    const config = getSupabaseConfig();
    const { createClient } = await import('@supabase/supabase-js');
    const authedClient = createClient(config.url, config.key, {
      global: { headers: { Authorization: `Bearer ${authSession.access_token}` } },
    });

    const reviewRow = {
      user_id: testUserId,
      media_type: 'movie',
      item_id: '550',
      rating: 5,
      body: 'Playwright test review',
    };
    const { data: inserted, error: insertError } = await authedClient
      .from('reviews').upsert(reviewRow, { onConflict: 'user_id,media_type,item_id' }).select().single();
    expect(insertError).toBeNull();
    expect(inserted).toBeTruthy();

    const { data: reviews } = await authedClient
      .from('reviews').select('*').eq('user_id', testUserId).eq('media_type', 'movie').eq('item_id', '550');
    expect(reviews.length).toBe(1);
    expect(reviews[0].body).toBe('Playwright test review');

    await authedClient.from('reviews').delete().eq('id', inserted.id);
    const { data: afterDelete } = await authedClient
      .from('reviews').select('*').eq('id', inserted.id);
    expect(afterDelete.length).toBe(0);
  });

  test('no requests to old table names in network', async ({ page }) => {
    const oldTableRequests = [];
    page.on('request', (req) => {
      const url = req.url();
      if (
        url.includes('movie_list_items') ||
        url.includes('tv_list_items') ||
        url.includes('anime_list_items') ||
        url.includes('game_list_items') ||
        url.includes('book_list_items') ||
        url.includes('music_list_items') ||
        url.includes('travel_list_items') ||
        url.includes('food_list_items') ||
        url.includes('fashion_list_items') ||
        url.includes('car_list_items') ||
        url.includes('movie_reviews') ||
        url.includes('tv_reviews') ||
        url.includes('anime_reviews') ||
        url.includes('game_reviews') ||
        url.includes('book_reviews') ||
        url.includes('music_reviews') ||
        url.includes('travel_reviews')
      ) {
        oldTableRequests.push(url);
      }
    });

    await page.waitForTimeout(2000);
    expect(oldTableRequests).toEqual([]);
  });
});
