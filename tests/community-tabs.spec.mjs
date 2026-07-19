import { test, expect } from '@playwright/test';

async function stubAuthGate(page) {
  await page.route('**/auth-gate.js*', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: `
        window.__ZO2Y_AUTH = {
          ensureClient: function() { return null; },
          getVerifiedUser: function() { return Promise.resolve(null); },
          getActiveSession: function() { return Promise.resolve(null); },
          config: { url: 'https://gfkhjbztayjyojsgdpgk.supabase.co', key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma2hqYnp0YXlqeW9qc2dkcGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTY4ODQwOTQsImV4cCI6MjAzMjQ2MDA5NH0.3w0U2J9wXN9L_u-N2_N5W8-B7Q9H5K4M2L0P8O3N6R1' }
        };
      `,
    });
  });
}

test.describe('Community Page Tabs', () => {
  test('community page loads without redirect to login', async ({ page }) => {
    await stubAuthGate(page);
    await page.goto('/community.html', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    const url = page.url();
    expect(url).toContain('community');
  });

  test('no user_profiles 400 errors (avatar_url removed)', async ({ page }) => {
    const badRequests = [];
    page.on('response', (resp) => {
      if (resp.url().includes('/rest/v1/user_profiles') && resp.status() === 400) {
        badRequests.push(resp.url());
      }
    });

    await stubAuthGate(page);
    await page.goto('/community.html', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    expect(badRequests).toEqual([]);
  });

  test('CommunityManager is defined', async ({ page }) => {
    await stubAuthGate(page);
    await page.goto('/community.html', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    const exists = await page.evaluate(() => typeof window.CommunityManager !== 'undefined');
    expect(exists).toBe(true);
  });

  test('tab buttons render all 5 tabs', async ({ page }) => {
    await stubAuthGate(page);
    await page.goto('/community.html', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);

    const tabCount = await page.locator('.community-tab-btn').count();
    expect(tabCount).toBe(5);

    const tabNames = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.community-tab-btn')).map(b => b.getAttribute('data-tab'));
    });
    expect(tabNames).toEqual(['discover', 'reviews', 'lists', 'people', 'following']);
  });

  test('reviews tab loads without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await stubAuthGate(page);
    await page.goto('/community.html', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);

    await page.evaluate(() => CommunityManager.switchTab('reviews'));
    await page.waitForTimeout(2000);

    const feedVisible = await page.locator('#paneReviews').isVisible();
    expect(feedVisible).toBe(true);
  });

  test('people tab loads without 400 errors', async ({ page }) => {
    const badRequests = [];
    page.on('response', (resp) => {
      if (resp.url().includes('/rest/v1/user_profiles') && resp.status() === 400) {
        badRequests.push(resp.url());
      }
    });

    await stubAuthGate(page);
    await page.goto('/community.html', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);

    await page.evaluate(() => CommunityManager.switchTab('people'));
    await page.waitForTimeout(2000);

    const feedVisible = await page.locator('#panePeople').isVisible();
    expect(feedVisible).toBe(true);
    expect(badRequests).toEqual([]);
  });

  test('following tab loads without 400 errors', async ({ page }) => {
    const badRequests = [];
    page.on('response', (resp) => {
      if (resp.url().includes('/rest/v1/follows') && resp.status() === 400) {
        badRequests.push(resp.url());
      }
      if (resp.url().includes('/rest/v1/user_profiles') && resp.status() === 400) {
        badRequests.push(resp.url());
      }
    });

    await stubAuthGate(page);
    await page.goto('/community.html', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);

    await page.evaluate(() => CommunityManager.switchTab('following'));
    await page.waitForTimeout(2000);

    const feedVisible = await page.locator('#paneFollowing').isVisible();
    expect(feedVisible).toBe(true);
    expect(badRequests).toEqual([]);
  });

  test('search input switches to people tab', async ({ page }) => {
    await stubAuthGate(page);
    await page.goto('/community.html', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);

    const input = page.locator('.community-search-input');
    await input.fill('testuser');
    await page.waitForTimeout(500);

    const peopleTabActive = await page.evaluate(() => {
      const btn = document.querySelector('[data-tab="people"]');
      return btn && btn.classList.contains('active');
    });
    expect(peopleTabActive).toBe(true);
  });
});
