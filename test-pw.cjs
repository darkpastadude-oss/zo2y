const { chromium } = require('playwright');

(async () => {
    console.log('Launching Playwright...');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    let hasErrors = false;

    page.on('console', msg => {
        if (msg.type() === 'error' || msg.type() === 'warning') {
            if (msg.text().includes('Failed to load resource')) return;
            console.log(`[Browser ${msg.type().toUpperCase()}] ${msg.text()}`);
            if (msg.type() === 'error') hasErrors = true;
        }
    });

    page.on('pageerror', error => {
        console.error('[Browser ERROR]', error);
        hasErrors = true;
    });

    page.on('requestfailed', request => {
        const url = request.url();
        const status = request.response() ? request.response().status() : 'No Status';
        if (url.includes('supabase.co') && typeof status === 'number' && status >= 400) {
            console.error(`[Supabase 400+ Error] ${status} on ${url}`);
            hasErrors = true;
        }
    });

    const pagesToTest = ['index.html', 'profile.html', 'travel.html', 'books.html'];

    for (const p of pagesToTest) {
        console.log(`\nNavigating to ${p}...`);
        try {
            await page.goto(`http://localhost:8080/${p}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(3000); // Give JS time to execute queries
            console.log(`${p} Loaded.`);
        } catch (e) {
            console.error(`Failed loading ${p}:`, e);
        }
    }

    await browser.close();
    
    if (hasErrors) {
        console.log('\n❌ TEST FAILED: Errors were detected in the console.');
        process.exit(1);
    } else {
        console.log('\n✅ TEST PASSED: No Supabase or Console errors!');
    }
})();
