const puppeteer = require('puppeteer');

(async () => {
    console.log('Launching browser...');
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();

    page.on('console', msg => {
        if (msg.type() === 'error' || msg.type() === 'warning') {
            console.log(`[Browser ${msg.type().toUpperCase()}] ${msg.text()}`);
        }
    });

    page.on('pageerror', error => {
        console.error('[Browser ERROR]', error);
    });

    page.on('requestfailed', request => {
        const status = request.response() ? request.response().status() : 'No Status';
        const url = request.url();
        if (url.includes('supabase.co') && status >= 400) {
            console.error(`[Supabase Request Failed] ${status} ${url}`);
        }
    });

    console.log('Navigating to index.html...');
    await page.goto('http://localhost:8080/index.html', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
    console.log('Index OK.');

    console.log('Navigating to profile.html...');
    await page.goto('http://localhost:8080/profile.html', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
    console.log('Profile OK.');

    console.log('Navigating to travel.html...');
    await page.goto('http://localhost:8080/travel.html', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
    console.log('Travel OK.');

    console.log('Navigating to books.html...');
    await page.goto('http://localhost:8080/books.html', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
    console.log('Books OK.');

    await browser.close();
    console.log('Done testing!');
})();
