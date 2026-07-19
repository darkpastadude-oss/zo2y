import { test, expect } from '@playwright/test';

test('diagnose community data', async ({ page }) => {
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

  const responses = [];

  page.on('response', async (resp) => {
    if (resp.url().includes('supabase.co/rest/v1/')) {
      let body = null;
      try { body = await resp.json(); } catch (_e) {}
      responses.push({
        url: resp.url().replace(/.*\/rest\/v1\//, ''),
        status: resp.status(),
        rowCount: Array.isArray(body) ? body.length : null,
        keys: Array.isArray(body) && body[0] ? Object.keys(body[0]).join(',') : null,
        sample: Array.isArray(body) && body[0] ? JSON.stringify(body[0]).slice(0, 400) : null,
        error: !Array.isArray(body) && body ? JSON.stringify(body).slice(0, 400) : null
      });
    }
  });

  await page.goto('/community.html', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Click activity tab
  await page.evaluate(() => CommunityManager.switchTab('activity'));
  await page.waitForTimeout(3000);

  // Click reviews tab  
  await page.evaluate(() => CommunityManager.switchTab('reviews'));
  await page.waitForTimeout(3000);

  console.log('\n=== ALL RESPONSES ===');
  responses.forEach(r => {
    console.log(`[${r.status}] ${r.url} → ${r.rowCount} rows`);
    if (r.keys) console.log('  columns:', r.keys);
    if (r.sample) console.log('  sample:', r.sample);
    if (r.error) console.log('  error:', r.error);
  });

  const reviewContent = await page.evaluate(() => {
    const feed = document.getElementById('allReviewsFeed');
    return feed ? feed.innerHTML.slice(0, 500) : 'NO FEED';
  });
  console.log('\n=== REVIEWS DOM ===');
  console.log(reviewContent);

  const activityContent = await page.evaluate(() => {
    const feed = document.getElementById('activityListFeed');
    return feed ? feed.innerHTML.slice(0, 500) : 'NO FEED';
  });
  console.log('\n=== ACTIVITY DOM ===');
  console.log(activityContent);
});
