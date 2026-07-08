const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.addInitScript(() => {
    window.ZO2Y_AUTH = {
      getVerifiedUser: async () => ({ id: 'c1b18d2d-70f9-4bba-9577-3e117769919b' })
    };
    // Also mock supabase client in case it's needed
    window.__ZO2Y_ENSURE_SUPABASE_CLIENT = async () => ({
      auth: { getUser: async () => ({ data: { user: { id: 'c1b18d2d-70f9-4bba-9577-3e117769919b' } }, error: null }) },
      from: () => ({ select: () => ({ eq: () => ({ order: () => ({ limit: () => ({ then: cb => cb({ data: [], error: null }) }) }) }) }) })
    });
  });
  
  let errors = [];
  page.on('response', response => {
    if (response.status() >= 400 && response.url().includes('supabase.co')) {
      errors.push(response.status() + ' ' + response.url());
    }
  });
  page.on('pageerror', err => {
    errors.push('PageError: ' + err.message);
  });
  
  await page.goto('http://127.0.0.1:8082/profile.html?id=c1b18d2d-70f9-4bba-9577-3e117769919b', { waitUntil: 'networkidle' }).catch(e => console.log('Goto Error:', e));
  console.log('Page loaded. URL is now: ' + page.url());
  
  if (errors.length > 0) {
    console.log('Errors found:');
    errors.forEach(e => console.log(e));
  } else {
    console.log('No errors found!');
  }
  
  await browser.close();
})();
