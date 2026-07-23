# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: community-tabs.spec.mjs >> Community Page Tabs >> tab buttons render all 6 tabs
- Location: tests\community-tabs.spec.mjs:37:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 6
Received: 7
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - text:     
  - main [ref=e2]:
    - link " profile" [ref=e5] [cursor=pointer]:
      - /url: profile.html
      - generic [ref=e6]: 
      - text: profile
    - tablist [ref=e9]:
      - button "discover" [ref=e10] [cursor=pointer]:  discover
      - button "activity" [ref=e11] [cursor=pointer]:  activity
      - button "reviews" [ref=e12] [cursor=pointer]:  reviews
      - button "lists" [ref=e13] [cursor=pointer]:  lists
      - button "people" [ref=e14] [cursor=pointer]:  people
      - button "following" [ref=e15] [cursor=pointer]:  following
      - button "followers" [ref=e16] [cursor=pointer]:  followers
    - generic [ref=e18]:
      - generic [ref=e19]:
        - generic [ref=e20]:
          - generic [ref=e22]:
            - button " media" [ref=e23] [cursor=pointer]:
              - generic [ref=e24]: 
              - text: media
            - button " lifestyle" [ref=e25] [cursor=pointer]:
              - generic [ref=e26]: 
              - text: lifestyle
          - generic [ref=e27]:
            - generic [ref=e29]: Popular Review
            - generic [ref=e31]: no reviews yet. be the first.
          - generic [ref=e34]: Newest Members
          - generic [ref=e36]:
            - generic [ref=e38]: Recent Reviews
            - generic [ref=e40]: no reviews yet. be the first.
          - generic [ref=e41]:
            - generic [ref=e43]: Popular Lists
            - generic [ref=e45]: no lists yet.
          - generic [ref=e46]:
            - generic [ref=e48]:
              - generic [ref=e49]: Top Rated
              - generic [ref=e50]: movies & tv
            - generic [ref=e52]:
              - generic [ref=e53]:
                - generic [ref=e54]: Coming Soon
                - generic [ref=e55]: upcoming releases
              - generic [ref=e57]: no upcoming releases found.
            - generic [ref=e59]:
              - generic [ref=e60]: Critically Acclaimed
              - generic [ref=e61]: games
            - generic [ref=e64]:
              - generic [ref=e65]: Critically Acclaimed
              - generic [ref=e66]: books
            - generic [ref=e69]:
              - generic [ref=e70]: Top Artists
              - generic [ref=e71]: trending now
            - generic [ref=e73]:
              - generic [ref=e74]:
                - generic [ref=e75]: Editor's Pick
                - generic [ref=e76]: featured review
              - generic [ref=e78]: no featured content yet.
            - generic [ref=e79]:
              - generic [ref=e80]:
                - generic [ref=e81]: Recent Activity
                - generic [ref=e82]: latest updates
              - generic [ref=e84]: no recent activity.
        - text:                  
      - complementary [ref=e85]:
        - generic [ref=e86]:
          - generic [ref=e87]: Community
          - generic [ref=e88]:
            - generic [ref=e89]:
              - generic [ref=e90]: "-"
              - generic [ref=e91]: Members
            - generic [ref=e92]:
              - generic [ref=e93]: "-"
              - generic [ref=e94]: Lists
            - generic [ref=e95]:
              - generic [ref=e96]: "-"
              - generic [ref=e97]: Reviews
            - generic [ref=e98]:
              - generic [ref=e99]: "-"
              - generic [ref=e100]: Items
        - generic [ref=e101]:
          - generic [ref=e102]: Today's Activity
          - generic [ref=e104]:
            - generic [ref=e105]:
              - generic [ref=e106]: "0"
              - generic [ref=e107]: actions
            - generic [ref=e108]:
              - generic [ref=e109]: "0"
              - generic [ref=e110]: reviews
            - generic [ref=e111]:
              - generic [ref=e112]: "0"
              - generic [ref=e113]: lists
        - generic [ref=e114]:
          - generic [ref=e115]: Currently Popular
          - generic [ref=e117]: no reviews yet.
        - generic [ref=e118]:
          - generic [ref=e119]: Most Active
          - generic [ref=e121]: no activity yet.
        - generic [ref=e122]:
          - generic [ref=e123]: Trending Lists
          - generic [ref=e125]: no lists yet.
  - complementary "Desktop navigation" [ref=e126]:
    - link "Home" [ref=e127] [cursor=pointer]:
      - /url: index.html
      - generic [ref=e132]:
        - img "Zo2y logo" [ref=e133]
        - img [ref=e134]
      - generic [ref=e135]: zo2y
    - button "Collapse navigation menu" [expanded] [ref=e136] [cursor=pointer]:
      - generic [ref=e137]: 
    - generic [ref=e138]:
      - searchbox "Search all media" [ref=e139]
      - button "Search" [ref=e140]:
        - generic [ref=e141]: 
    - text: 
    - link " community" [ref=e142] [cursor=pointer]:
      - /url: community.html
      - generic [ref=e143]: 
      - generic [ref=e144]: community
    - navigation "Desktop sections" [ref=e145]:
      - link " home" [ref=e146] [cursor=pointer]:
        - /url: index.html
        - generic [ref=e147]: 
        - generic [ref=e148]: home
      - generic [ref=e149]:
        - generic [ref=e150]: media
        - link " movies" [ref=e151] [cursor=pointer]:
          - /url: movies.html?v=20260322m
          - generic [ref=e152]: 
          - generic [ref=e153]: movies
        - link " tv shows" [ref=e154] [cursor=pointer]:
          - /url: tvshows.html
          - generic [ref=e155]: 
          - generic [ref=e156]: tv shows
        - link " anime" [ref=e157] [cursor=pointer]:
          - /url: animes.html
          - generic [ref=e158]: 
          - generic [ref=e159]: anime
        - link " games" [ref=e160] [cursor=pointer]:
          - /url: games.html
          - generic [ref=e161]: 
          - generic [ref=e162]: games
        - link " books" [ref=e163] [cursor=pointer]:
          - /url: books.html
          - generic [ref=e164]: 
          - generic [ref=e165]: books
        - link " music" [ref=e166] [cursor=pointer]:
          - /url: music.html
          - generic [ref=e167]: 
          - generic [ref=e168]: music
      - generic [ref=e169]:
        - generic [ref=e170]: lifestyle
        - link " travel" [ref=e171] [cursor=pointer]:
          - /url: travel.html
          - generic [ref=e172]: 
          - generic [ref=e173]: travel
        - link " sports" [ref=e174] [cursor=pointer]:
          - /url: sports.html
          - generic [ref=e175]: 
          - generic [ref=e176]: sports
        - link " fashion" [ref=e177] [cursor=pointer]:
          - /url: fashion.html
          - generic [ref=e178]: 
          - generic [ref=e179]: fashion
        - link " food" [ref=e180] [cursor=pointer]:
          - /url: food.html
          - generic [ref=e181]: 
          - generic [ref=e182]: food
        - link " cars" [ref=e183] [cursor=pointer]:
          - /url: cars.html
          - generic [ref=e184]: 
          - generic [ref=e185]: cars
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | async function stubAuthGate(page) {
  4   |   await page.route('**/auth-gate.js*', (route) => {
  5   |     route.fulfill({
  6   |       status: 200,
  7   |       contentType: 'application/javascript',
  8   |       body: `
  9   |         window.__ZO2Y_AUTH = {
  10  |           ensureClient: function() { return null; },
  11  |           getVerifiedUser: function() { return Promise.resolve(null); },
  12  |           getActiveSession: function() { return Promise.resolve(null); },
  13  |           config: { url: 'https://gfkhjbztayjyojsgdpgk.supabase.co', key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma2hqYnp0YXlqeW9qc2dkcGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTY4ODQwOTQsImV4cCI6MjAzMjQ2MDA5NH0.3w0U2J9wXN9L_u-N2_N5W8-B7Q9H5K4M2L0P8O3N6R1' }
  14  |         };
  15  |       `,
  16  |     });
  17  |   });
  18  | }
  19  | 
  20  | test.describe('Community Page Tabs', () => {
  21  |   test('community page loads without redirect to login', async ({ page }) => {
  22  |     await stubAuthGate(page);
  23  |     await page.goto('/community.html', { waitUntil: 'networkidle', timeout: 30000 });
  24  |     await page.waitForTimeout(2000);
  25  |     const url = page.url();
  26  |     expect(url).toContain('community');
  27  |   });
  28  | 
  29  |   test('CommunityManager is defined', async ({ page }) => {
  30  |     await stubAuthGate(page);
  31  |     await page.goto('/community.html', { waitUntil: 'networkidle', timeout: 30000 });
  32  |     await page.waitForTimeout(2000);
  33  |     const exists = await page.evaluate(() => typeof window.CommunityManager !== 'undefined');
  34  |     expect(exists).toBe(true);
  35  |   });
  36  | 
  37  |   test('tab buttons render all 6 tabs', async ({ page }) => {
  38  |     await stubAuthGate(page);
  39  |     await page.goto('/community.html', { waitUntil: 'networkidle', timeout: 30000 });
  40  |     await page.waitForTimeout(1000);
  41  |     const tabCount = await page.locator('.community-tab-btn').count();
> 42  |     expect(tabCount).toBe(6);
      |                      ^ Error: expect(received).toBe(expected) // Object.is equality
  43  | 
  44  |     const tabNames = await page.evaluate(() => {
  45  |       return Array.from(document.querySelectorAll('.community-tab-btn')).map(b => b.getAttribute('data-tab'));
  46  |     });
  47  |     expect(tabNames).toEqual(['discover', 'activity', 'reviews', 'lists', 'people', 'following']);
  48  |   });
  49  | 
  50  |   test('no user_profiles 400 errors (avatar_url removed)', async ({ page }) => {
  51  |     const badRequests = [];
  52  |     page.on('response', (resp) => {
  53  |       if (resp.url().includes('/rest/v1/user_profiles') && resp.status() === 400) {
  54  |         badRequests.push(resp.url());
  55  |       }
  56  |     });
  57  | 
  58  |     await stubAuthGate(page);
  59  |     await page.goto('/community.html', { waitUntil: 'networkidle', timeout: 30000 });
  60  |     await page.waitForTimeout(3000);
  61  |     expect(badRequests).toEqual([]);
  62  |   });
  63  | 
  64  |   test('reviews tab loads without errors', async ({ page }) => {
  65  |     const errors = [];
  66  |     page.on('pageerror', (err) => errors.push(err.message));
  67  | 
  68  |     await stubAuthGate(page);
  69  |     await page.goto('/community.html', { waitUntil: 'networkidle', timeout: 30000 });
  70  |     await page.waitForTimeout(1000);
  71  | 
  72  |     await page.evaluate(() => CommunityManager.switchTab('reviews'));
  73  |     await page.waitForTimeout(2000);
  74  | 
  75  |     const feedVisible = await page.locator('#paneReviews').isVisible();
  76  |     expect(feedVisible).toBe(true);
  77  |   });
  78  | 
  79  |   test('activity tab loads without errors', async ({ page }) => {
  80  |     const errors = [];
  81  |     page.on('pageerror', (err) => errors.push(err.message));
  82  | 
  83  |     await stubAuthGate(page);
  84  |     await page.goto('/community.html', { waitUntil: 'networkidle', timeout: 30000 });
  85  |     await page.waitForTimeout(1000);
  86  | 
  87  |     await page.evaluate(() => CommunityManager.switchTab('activity'));
  88  |     await page.waitForTimeout(2000);
  89  | 
  90  |     const feedVisible = await page.locator('#paneActivity').isVisible();
  91  |     expect(feedVisible).toBe(true);
  92  |   });
  93  | 
  94  |   test('people tab loads without 400 errors', async ({ page }) => {
  95  |     const badRequests = [];
  96  |     page.on('response', (resp) => {
  97  |       if (resp.url().includes('/rest/v1/user_profiles') && resp.status() === 400) {
  98  |         badRequests.push(resp.url());
  99  |       }
  100 |     });
  101 | 
  102 |     await stubAuthGate(page);
  103 |     await page.goto('/community.html', { waitUntil: 'networkidle', timeout: 30000 });
  104 |     await page.waitForTimeout(1000);
  105 | 
  106 |     await page.evaluate(() => CommunityManager.switchTab('people'));
  107 |     await page.waitForTimeout(2000);
  108 | 
  109 |     const feedVisible = await page.locator('#panePeople').isVisible();
  110 |     expect(feedVisible).toBe(true);
  111 |     expect(badRequests).toEqual([]);
  112 |   });
  113 | 
  114 |   test('following tab loads without 400 errors', async ({ page }) => {
  115 |     const badRequests = [];
  116 |     page.on('response', (resp) => {
  117 |       if (resp.url().includes('/rest/v1/follows') && resp.status() === 400) {
  118 |         badRequests.push(resp.url());
  119 |       }
  120 |       if (resp.url().includes('/rest/v1/user_profiles') && resp.status() === 400) {
  121 |         badRequests.push(resp.url());
  122 |       }
  123 |     });
  124 | 
  125 |     await stubAuthGate(page);
  126 |     await page.goto('/community.html', { waitUntil: 'networkidle', timeout: 30000 });
  127 |     await page.waitForTimeout(1000);
  128 | 
  129 |     await page.evaluate(() => CommunityManager.switchTab('following'));
  130 |     await page.waitForTimeout(2000);
  131 | 
  132 |     const feedVisible = await page.locator('#paneFollowing').isVisible();
  133 |     expect(feedVisible).toBe(true);
  134 |     expect(badRequests).toEqual([]);
  135 |   });
  136 | 
  137 |   test('search input switches to people tab', async ({ page }) => {
  138 |     await stubAuthGate(page);
  139 |     await page.goto('/community.html', { waitUntil: 'networkidle', timeout: 30000 });
  140 |     await page.waitForTimeout(1000);
  141 | 
  142 |     const input = page.locator('.community-search-input');
```