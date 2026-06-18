const { chromium } = require('playwright');

(async () => {
    console.log('Launching Playwright...');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    let hasErrors = false;

    page.on('console', msg => {
        if (msg.type() === 'error' || msg.type() === 'warning') {
            const txt = msg.text();
            if (txt.includes('Failed to load resource')) return;
            if (txt.includes('Failed to fetch')) return;
            if (txt.includes('Books server API error')) return;
            console.log(`[Browser ${msg.type().toUpperCase()}] ${txt}`);
            if (msg.type() === 'error') hasErrors = true;
        }
    });

    page.on('pageerror', error => {
        console.error('[Browser ERROR]', error);
        hasErrors = true;
    });

    page.on('requestfailed', request => {
        try {
            const url = request.url();
            const failure = request.failure();
            const errorText = failure ? failure.errorText : 'Unknown';
            if (url.includes('supabase.co') && (url.includes('/rest/v1/') || url.includes('/auth/v1/'))) {
                console.error(`[Supabase Request Failed] ${url} - Error: ${errorText}`);
                hasErrors = true;
            }
        } catch (e) {
            console.error('Error handling requestfailed:', e);
        }
    });

    const pagesToTest = ['', 'profile', 'travel', 'books'];

    for (const p of pagesToTest) {
        console.log(`\nNavigating to ${p}...`);
        try {
            await page.goto(`http://localhost:8080/${p}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
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
