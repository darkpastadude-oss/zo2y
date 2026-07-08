const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  let errors = [];
  page.on('response', response => {
    if (response.status() >= 400 && response.url().includes('supabase.co')) {
      errors.push(response.status() + ' ' + response.url());
    }
  });
  page.on('pageerror', err => {
    errors.push('PageError: ' + err.message);
  });
  
  await page.goto('http://127.0.0.1:8081/profile.html?id=c1b18d2d-70f9-4bba-9577-3e117769919b', { waitUntil: 'networkidle' }).catch(e => console.log('Goto Error:', e));
  console.log('Page loaded. URL is now: ' + page.url());
  
  if (errors.length > 0) {
    console.log('Errors found:');
    errors.forEach(e => console.log(e));
  } else {
    console.log('No errors found!');
  }
  
  await browser.close();
})();
