const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  let networkCalls = [];
  let consoleErrors = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  // Inject a mock auth object globally before any scripts load
  await page.addInitScript(() => {
    window.ZO2Y_AUTH = {
      getVerifiedUser: async () => ({ id: 'c1b18d2d-70f9-4bba-9577-3e117769919b', email: 'test@example.com' }),
      waitForSupabase: async () => { return true; }
    };
  });

  await page.route('**/*', async (route) => {
    const request = route.request();
    const url = request.url();
    
    // Track bad requests
    if (url.includes('supabase.co/rest/v1/') || url.includes('/api/igdb')) {
      networkCalls.push(url);
    }

    if (url.includes('auth/v1/user')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'c1b18d2d-70f9-4bba-9577-3e117769919b', email: 'test@example.com' })
      });
    }

    // Pass everything else through
    route.continue();
  });

  page.on('response', response => {
    if (response.status() >= 400 && response.url().includes('supabase.co')) {
      console.log('Bad Response: ' + response.status() + ' ' + response.url());
    }
  });
  
  await page.goto('http://127.0.0.1:8083/profile.html', { waitUntil: 'networkidle', timeout: 30000 }).catch(e => console.log('Goto Error:', e));
  
  console.log('Page loaded. URL is now: ' + page.url());
  
  if (consoleErrors.length > 0) {
    console.log('Console Errors found:');
    consoleErrors.forEach(e => console.log(e));
  } else {
    console.log('No console errors found!');
  }
  
  await browser.close();
})();
