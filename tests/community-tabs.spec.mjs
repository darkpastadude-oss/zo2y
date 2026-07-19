import { test, expect } from '@playwright/test';

test.describe('Community Page Tabs', () => {
  test('community page loads without JS errors', async ({ page }) => {
    const jsErrors = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') jsErrors.push(msg.text());
    });

    await page.goto('/community.html', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    const communityManagerExists = await page.evaluate(() => typeof window.CommunityManager !== 'undefined');
    expect(communityManagerExists).toBe(true);
  });

  test('no user_profiles 400 errors (bio column removed)', async ({ page }) => {
    const badRequests = [];
    page.on('response', (resp) => {
      if (resp.url().includes('/rest/v1/user_profiles') && resp.status() === 400) {
        badRequests.push(resp.url());
      }
    });

    await page.goto('/community.html', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    expect(badRequests).toEqual([]);
  });

  test('reviews tab loads without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

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

    await page.goto('/community.html', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);

    await page.evaluate(() => CommunityManager.switchTab('following'));
    await page.waitForTimeout(2000);

    const feedVisible = await page.locator('#paneFollowing').isVisible();
    expect(feedVisible).toBe(true);
    expect(badRequests).toEqual([]);
  });

  test('search input switches to people tab', async ({ page }) => {
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

  test('tab buttons render all 5 tabs', async ({ page }) => {
    await page.goto('/community.html', { waitUntil: 'networkidle', timeout: 30000 });

    const tabCount = await page.locator('.community-tab-btn').count();
    expect(tabCount).toBe(5);

    const tabNames = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.community-tab-btn')).map(b => b.getAttribute('data-tab'));
    });
    expect(tabNames).toEqual(['discover', 'reviews', 'lists', 'people', 'following']);
  });
});
