const { chromium } = require('playwright');

(async () => {
    console.log('Launching Playwright for user simulation...');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    let hasErrors = false;
    let listItemsInserted = [];
    let reviewsInserted = [];
    let customListsCreated = [];

    // Intercept console errors
    page.on('console', msg => {
        if (msg.type() === 'error') {
            const txt = msg.text();
            if (txt.includes('Failed to load resource')) return;
            if (txt.includes('Failed to fetch')) return;
            console.error(`[Browser Console ERROR] ${txt}`);
            hasErrors = true;
        }
    });

    page.on('pageerror', error => {
        console.error('[Browser Uncaught ERROR]', error);
        hasErrors = true;
    });

    // Intercept and mock Supabase API calls
    await page.route('https://gfkhjbztayjyojsgdpgk.supabase.co/**', async route => {
        const url = route.request().url();
        const method = route.request().method();
        const postData = route.request().postDataJSON() || {};

        console.log(`[Intercepted] ${method} ${url}`);

        if (url.includes('/auth/v1/user')) {
            return route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    id: 'a574a616-87f1-4bc7-83bc-355af4bda301',
                    email: 'jnn@example.com',
                    user_metadata: { username: 'jnn', full_name: 'Jnn Test User' }
                })
            });
        }

        if (url.includes('/rest/v1/user_profiles')) {
            return route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([
                    { id: 'a574a616-87f1-4bc7-83bc-355af4bda301', username: 'jnn', full_name: 'Jnn Test User' }
                ])
            });
        }

        if (url.includes('/rest/v1/user_lists')) {
            if (method === 'GET') {
                return route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify([
                        { id: 'list-watched-123', user_id: 'a574a616-87f1-4bc7-83bc-355af4bda301', name: 'Watched', category: 'movie', type: 'watched' },
                        { id: 'list-watchlist-123', user_id: 'a574a616-87f1-4bc7-83bc-355af4bda301', name: 'Watchlist', category: 'movie', type: 'watchlist' },
                        { id: 'list-favorites-123', user_id: 'a574a616-87f1-4bc7-83bc-355af4bda301', name: 'Favorites', category: 'movie', type: 'favorites' },
                        ...customListsCreated
                    ])
                });
            } else if (method === 'POST') {
                const newList = {
                    id: `custom-list-${Date.now()}`,
                    user_id: 'a574a616-87f1-4bc7-83bc-355af4bda301',
                    name: postData.name || 'My Custom List',
                    category: postData.category || 'movie',
                    type: 'custom'
                };
                customListsCreated.push(newList);
                console.log('  -> Mocked Custom List Creation:', newList);
                return route.fulfill({
                    status: 201,
                    contentType: 'application/json',
                    body: JSON.stringify(newList)
                });
            }
        }

        if (url.includes('/rest/v1/list_items')) {
            if (method === 'GET') {
                return route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify(listItemsInserted)
                });
            } else if (method === 'POST') {
                listItemsInserted.push({
                    id: `item-${Date.now()}`,
                    list_id: postData.list_id,
                    external_id: postData.external_id,
                    external_source: postData.external_source,
                    external_type: postData.external_type
                });
                console.log('  -> Mocked List Insertion:', postData);
                return route.fulfill({
                    status: 201,
                    contentType: 'application/json',
                    body: JSON.stringify({ success: true })
                });
            } else if (method === 'DELETE') {
                console.log('  -> Mocked List Item Deletion');
                return route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ success: true })
                });
            }
        }

        if (url.includes('_reviews')) {
            if (method === 'GET') {
                return route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify(reviewsInserted)
                });
            } else if (method === 'POST') {
                reviewsInserted.push({
                    id: `review-${Date.now()}`,
                    media_id: postData.media_id,
                    user_id: postData.user_id,
                    rating: postData.rating,
                    review_text: postData.review_text,
                    media_type: postData.media_type,
                    title: postData.title,
                    created_at: new Date().toISOString()
                });
                console.log('  -> Mocked Review Submission:', postData);
                return route.fulfill({
                    status: 201,
                    contentType: 'application/json',
                    body: JSON.stringify({ success: true })
                });
            }
        }

        // Catch-all for other Supabase REST API requests
        return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([])
        });
    });

    console.log('Setting up mock user session in LocalStorage...');
    await page.goto('http://localhost:8080/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
        const mockSession = {
            access_token: "mock-access-token",
            token_type: "bearer",
            expires_in: 3600,
            refresh_token: "mock-refresh-token",
            user: {
                id: "a574a616-87f1-4bc7-83bc-355af4bda301",
                aud: "authenticated",
                role: "authenticated",
                email: "jnn@example.com",
                email_confirmed_at: "2026-06-01T00:00:00Z",
                user_metadata: { username: "jnn", full_name: "Jnn Test User" }
            },
            expires_at: 9999999999
        };
        localStorage.setItem('sb-gfkhjbztayjyojsgdpgk-auth-token', JSON.stringify(mockSession));
    });

    console.log('\n--- TESTING MOVIE PAGE ---');
    console.log('Navigating to movie?id=550...');
    await page.goto('http://localhost:8080/movie?id=550', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000); // Wait for details and reviews to load

    const movieTitle = await page.textContent('#title');
    console.log(`Movie Title loaded: ${movieTitle.trim()}`);
    if (!movieTitle.includes('Fight Club')) {
        console.error('❌ Failed: Movie title "Fight Club" did not load!');
        hasErrors = true;
    }

    console.log('Testing Watchlist Button Toggle...');
    // Open the dropdown menu
    await page.click('#addWatchlistBtn');
    await page.waitForTimeout(800);

    // Click on Watchlist list type (which is a button or list item inside dropdown)
    await page.click('button[data-list-type="watchlist"]');
    await page.waitForTimeout(1000);

    // Verify list insertion was called
    const hasWatchlistItem = listItemsInserted.some(item => item.external_id === '550' && item.list_id === 'list-watchlist-123');
    if (hasWatchlistItem) {
        console.log('✅ Success: Watchlist toggled successfully!');
    } else {
        console.error('❌ Failed: Watchlist toggled, but list_items insert was not called with correct parameters!');
        hasErrors = true;
    }

    console.log('Testing review submission...');
    // Choose 5 star rating (we find elements with class star)
    const stars = await page.$$('.star');
    if (stars.length >= 5) {
        await stars[4].click(); // Click 5th star
    }
    await page.fill('#review-comment', 'Fight Club is an absolute masterpiece. 10/10!');
    await page.click('.submit-review-btn');
    await page.waitForTimeout(2000);

    const hasReview = reviewsInserted.some(r => r.media_id === 550 && r.review_text.includes('masterpiece') && r.media_type === 'movie' && r.title === 'Fight Club');
    if (hasReview) {
        console.log('✅ Success: Review submitted successfully with media_type and title!');
    } else {
        console.error('❌ Failed: Review submission payload did not contain correct media_id, review_text, media_type, or title!');
        hasErrors = true;
    }

    console.log('\n--- TESTING TV SHOW PAGE ---');
    console.log('Navigating to tvshow?id=1399...');
    await page.goto('http://localhost:8080/tvshow?id=1399', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);

    const tvTitle = await page.textContent('#title');
    console.log(`TV Show Title loaded: ${tvTitle.trim()}`);
    if (!tvTitle.includes('Game of Thrones')) {
        console.error('❌ Failed: TV show title "Game of Thrones" did not load!');
        hasErrors = true;
    }

    console.log('Testing TV show review submission...');
    const tvStars = await page.$$('.star');
    if (tvStars.length >= 5) {
        await tvStars[4].click();
    }
    await page.fill('#review-comment', 'Winter is coming. Exceptional TV show!');
    await page.click('.submit-review-btn');
    await page.waitForTimeout(2000);

    const hasTvReview = reviewsInserted.some(r => r.media_id === 1399 && r.review_text.includes('Winter') && r.media_type === 'tv' && r.title === 'Game of Thrones');
    if (hasTvReview) {
        console.log('✅ Success: TV review submitted successfully with media_type and title!');
    } else {
        console.error('❌ Failed: TV review submission payload was incorrect!');
        hasErrors = true;
    }

    console.log('\n--- TESTING ANIME PAGE ---');
    console.log('Navigating to anime?id=60625...');
    await page.goto('http://localhost:8080/anime?id=60625', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);

    const animeTitle = await page.textContent('#title');
    console.log(`Anime Title loaded: ${animeTitle.trim()}`);
    if (!animeTitle.includes('Rick and Morty')) {
        console.error('❌ Failed: Anime title "Rick and Morty" did not load!');
        hasErrors = true;
    }

    console.log('Testing Anime review submission...');
    const animeStars = await page.$$('.star');
    if (animeStars.length >= 5) {
        await animeStars[4].click();
    }
    await page.fill('#review-comment', 'Wubba lubba dub dub! Hilarious anime series.');
    await page.click('.submit-review-btn');
    await page.waitForTimeout(2000);

    const hasAnimeReview = reviewsInserted.some(r => r.media_id === 60625 && r.review_text.includes('Wubba') && r.media_type === 'anime' && r.title === 'Rick and Morty');
    if (hasAnimeReview) {
        console.log('✅ Success: Anime review submitted successfully with media_type and title!');
    } else {
        console.error('❌ Failed: Anime review submission payload was incorrect!');
        hasErrors = true;
    }

    console.log('\n--- TESTING GAME PAGE ---');
    console.log('Navigating to game?id=1009...');
    await page.goto('http://localhost:8080/game?id=1009', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);

    const gameTitle = await page.textContent('#title');
    console.log(`Game Title loaded: ${gameTitle.trim()}`);
    if (!gameTitle.includes('The Last of Us')) {
        console.error('❌ Failed: Game title did not load!');
        hasErrors = true;
    }

    console.log('Testing Game review submission...');
    const gameStars = await page.$$('.star');
    if (gameStars.length >= 5) {
        await gameStars[4].click();
    }
    await page.fill('#review-comment', 'Unbelievable story and characters. A masterpiece of gaming.');
    await page.click('.submit-review-btn');
    await page.waitForTimeout(2000);

    const hasGameReview = reviewsInserted.some(r => r.media_id === 1009 && r.review_text.includes('characters') && r.media_type === 'game' && r.title === 'The Last of Us');
    if (hasGameReview) {
        console.log('✅ Success: Game review submitted successfully with media_type and title!');
    } else {
        console.error('❌ Failed: Game review submission payload was incorrect!');
        hasErrors = true;
    }

    await browser.close();

    if (hasErrors) {
        console.log('\n❌ USER SIMULATION FAILED: Errors were detected.');
        process.exit(1);
    } else {
        console.log('\n✅ USER SIMULATION PASSED: All buttons, lists, and review flows verified successfully!');
        process.exit(0);
    }
})();
