# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: community-tabs.spec.mjs >> Community Page Tabs >> community page loads without JS errors
- Location: tests\community-tabs.spec.mjs:4:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - link "Back to landing" [ref=e5] [cursor=pointer]:
        - /url: /index.html?next=index.html
        - img "Zo2y home" [ref=e6]
      - link "sign up" [ref=e7] [cursor=pointer]:
        - /url: sign-up.html
    - generic [ref=e8]:
      - heading "Log in" [level=2] [ref=e9]
      - button "Sign in with Google" [ref=e10] [cursor=pointer]:
        - img [ref=e11]
        - text: Sign in with Google
      - generic [ref=e17]: or continue with email
      - generic [ref=e18]:
        - generic [ref=e19]:
          - generic [ref=e20]: 
          - textbox "Email" [ref=e21]
        - generic [ref=e22]:
          - generic [ref=e23]: 
          - textbox "Password" [ref=e24]
        - generic [ref=e25]:
          - generic [ref=e26]:
            - checkbox "Remember me" [ref=e27]
            - text: Remember me
          - link "Forgot password?" [ref=e28] [cursor=pointer]:
            - /url: "#"
        - button " Log In" [ref=e29] [cursor=pointer]:
          - generic [ref=e30]: 
          - text: Log In
      - generic [ref=e31]:
        - text: Don't have an account?
        - link "Sign up" [ref=e32] [cursor=pointer]:
          - /url: /sign-up.html?next=community
  - dialog "Cookie consent" [ref=e33]:
    - generic [ref=e34]:
      - generic [ref=e35]: 
      - text: Cookies on Zo2y
    - paragraph [ref=e36]:
      - text: We use strictly necessary cookies to keep you signed in and secure. With your consent we also use functional and analytics cookies. We don't use advertising trackers.
      - link "Learn more" [ref=e37] [cursor=pointer]:
        - /url: cookies.html
      - text: ·
      - link "Privacy" [ref=e38] [cursor=pointer]:
        - /url: privacy.html
    - generic [ref=e39]:
      - button "Accept all" [ref=e40] [cursor=pointer]
      - button "Customize" [ref=e41] [cursor=pointer]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Community Page Tabs', () => {
  4   |   test('community page loads without JS errors', async ({ page }) => {
  5   |     const jsErrors = [];
  6   |     page.on('pageerror', (err) => jsErrors.push(err.message));
  7   |     page.on('console', (msg) => {
  8   |       if (msg.type() === 'error') jsErrors.push(msg.text());
  9   |     });
  10  | 
  11  |     await page.goto('/community.html', { waitUntil: 'networkidle', timeout: 30000 });
  12  |     await page.waitForTimeout(2000);
  13  | 
  14  |     const communityManagerExists = await page.evaluate(() => typeof window.CommunityManager !== 'undefined');
> 15  |     expect(communityManagerExists).toBe(true);
      |                                    ^ Error: expect(received).toBe(expected) // Object.is equality
  16  |   });
  17  | 
  18  |   test('no user_profiles 400 errors (bio column removed)', async ({ page }) => {
  19  |     const badRequests = [];
  20  |     page.on('response', (resp) => {
  21  |       if (resp.url().includes('/rest/v1/user_profiles') && resp.status() === 400) {
  22  |         badRequests.push(resp.url());
  23  |       }
  24  |     });
  25  | 
  26  |     await page.goto('/community.html', { waitUntil: 'networkidle', timeout: 30000 });
  27  |     await page.waitForTimeout(3000);
  28  | 
  29  |     expect(badRequests).toEqual([]);
  30  |   });
  31  | 
  32  |   test('reviews tab loads without errors', async ({ page }) => {
  33  |     const errors = [];
  34  |     page.on('pageerror', (err) => errors.push(err.message));
  35  | 
  36  |     await page.goto('/community.html', { waitUntil: 'networkidle', timeout: 30000 });
  37  |     await page.waitForTimeout(1000);
  38  | 
  39  |     await page.evaluate(() => CommunityManager.switchTab('reviews'));
  40  |     await page.waitForTimeout(2000);
  41  | 
  42  |     const feedVisible = await page.locator('#paneReviews').isVisible();
  43  |     expect(feedVisible).toBe(true);
  44  |   });
  45  | 
  46  |   test('people tab loads without 400 errors', async ({ page }) => {
  47  |     const badRequests = [];
  48  |     page.on('response', (resp) => {
  49  |       if (resp.url().includes('/rest/v1/user_profiles') && resp.status() === 400) {
  50  |         badRequests.push(resp.url());
  51  |       }
  52  |     });
  53  | 
  54  |     await page.goto('/community.html', { waitUntil: 'networkidle', timeout: 30000 });
  55  |     await page.waitForTimeout(1000);
  56  | 
  57  |     await page.evaluate(() => CommunityManager.switchTab('people'));
  58  |     await page.waitForTimeout(2000);
  59  | 
  60  |     const feedVisible = await page.locator('#panePeople').isVisible();
  61  |     expect(feedVisible).toBe(true);
  62  |     expect(badRequests).toEqual([]);
  63  |   });
  64  | 
  65  |   test('following tab loads without 400 errors', async ({ page }) => {
  66  |     const badRequests = [];
  67  |     page.on('response', (resp) => {
  68  |       if (resp.url().includes('/rest/v1/follows') && resp.status() === 400) {
  69  |         badRequests.push(resp.url());
  70  |       }
  71  |       if (resp.url().includes('/rest/v1/user_profiles') && resp.status() === 400) {
  72  |         badRequests.push(resp.url());
  73  |       }
  74  |     });
  75  | 
  76  |     await page.goto('/community.html', { waitUntil: 'networkidle', timeout: 30000 });
  77  |     await page.waitForTimeout(1000);
  78  | 
  79  |     await page.evaluate(() => CommunityManager.switchTab('following'));
  80  |     await page.waitForTimeout(2000);
  81  | 
  82  |     const feedVisible = await page.locator('#paneFollowing').isVisible();
  83  |     expect(feedVisible).toBe(true);
  84  |     expect(badRequests).toEqual([]);
  85  |   });
  86  | 
  87  |   test('search input switches to people tab', async ({ page }) => {
  88  |     await page.goto('/community.html', { waitUntil: 'networkidle', timeout: 30000 });
  89  |     await page.waitForTimeout(1000);
  90  | 
  91  |     const input = page.locator('.community-search-input');
  92  |     await input.fill('testuser');
  93  |     await page.waitForTimeout(500);
  94  | 
  95  |     const peopleTabActive = await page.evaluate(() => {
  96  |       const btn = document.querySelector('[data-tab="people"]');
  97  |       return btn && btn.classList.contains('active');
  98  |     });
  99  |     expect(peopleTabActive).toBe(true);
  100 |   });
  101 | 
  102 |   test('tab buttons render all 5 tabs', async ({ page }) => {
  103 |     await page.goto('/community.html', { waitUntil: 'networkidle', timeout: 30000 });
  104 | 
  105 |     const tabCount = await page.locator('.community-tab-btn').count();
  106 |     expect(tabCount).toBe(5);
  107 | 
  108 |     const tabNames = await page.evaluate(() => {
  109 |       return Array.from(document.querySelectorAll('.community-tab-btn')).map(b => b.getAttribute('data-tab'));
  110 |     });
  111 |     expect(tabNames).toEqual(['discover', 'reviews', 'lists', 'people', 'following']);
  112 |   });
  113 | });
  114 | 
```