import { test, expect } from '@playwright/test';

test.describe('Books infinite scroll', () => {
  test('loads more books on scroll', async ({ page }) => {
    // Block auth-gate so it doesn't redirect to login
    await page.route('**/auth-gate.js*', (route) => route.abort());
    await page.route('**/bootstrap-auth.js*', (route) => route.abort());

    const errors = [];
    const consoleMessages = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => consoleMessages.push(`[${msg.type()}] ${msg.text()}`));

    await page.goto('/books.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    const url = page.url();
    console.log('Current URL:', url);

    const title = await page.title();
    console.log('Page title:', title);

    // Check grid HTML
    const gridHtml = await page.evaluate(() => {
      const grid = document.getElementById('booksGrid');
      return grid ? grid.innerHTML.substring(0, 500) : 'GRID NOT FOUND';
    });
    console.log('Grid HTML:', gridHtml);

    // Check if Skel is available
    const hasSkel = await page.evaluate(() => typeof Skel !== 'undefined');
    console.log('Skel available:', hasSkel);

    // Check if Zo2yBookProvider is available
    const hasProvider = await page.evaluate(() => typeof window.Zo2yBookProvider !== 'undefined');
    console.log('Zo2yBookProvider available:', hasProvider);

    // Print console messages
    console.log('Console messages:', consoleMessages.slice(0, 20).join('\n'));
    console.log('Page errors:', errors.join('\n'));

    const cardCount = await page.locator('.card').count();
    console.log('Total card count:', cardCount);
  });
});
