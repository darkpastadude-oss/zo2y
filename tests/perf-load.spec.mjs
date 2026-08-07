import { test } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gfkhjbztayjyojsgdpgk.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_Rw-VlOLSWfzsycF4JMFUvg_vNlaMwVd';
const TEST_EMAIL = process.env.TEST_EMAIL || '';
const TEST_PASSWORD = process.env.TEST_PASSWORD || '';

function getProjectRef() {
  return SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');
}

async function getSession() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const { data, error } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });
  if (error) throw error;
  return data.session;
}

test('measure profile cold-load timings (authed)', async ({ page }) => {
  const session = await getSession();
  const projectRef = getProjectRef();
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
const failedReq = [];
const tStart = Date.now();
page.on('requestfailed', (req) => failedReq.push((Date.now() - tStart) + 'ms ' + req.url() + ' :: ' + String(req.failure() && req.failure().errorText) + ' :: ' + req.method()));
const navs = [];
page.on('framenavigated', (frame) => {
  if (frame === page.mainFrame()) navs.push((Date.now() - tStart) + 'ms ' + frame.url());
});

  await page.addInitScript(({ session: s, projectRef: ref }) => {
    localStorage.setItem('zo2y-auth-v2', JSON.stringify(s));
    localStorage.setItem('zo2y-auth-persist-v2', JSON.stringify(s));
    localStorage.setItem('zo2y-auth-durable-v2', JSON.stringify({ session: s }));
    localStorage.setItem('sb-' + ref + '-auth-token', JSON.stringify({
      currentSession: s,
      expires_at: s.expires_at,
    }));
    window.__PERF = { startedAt: Date.now() };
  }, { session, projectRef });

  const t0 = Date.now();
  await page.goto('/profile.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
  const domReady = Date.now() - t0;

  // First paint of the shell
  await page.waitForSelector('.pv2-rail-track', { timeout: 20000 });
  const shellVisible = Date.now() - t0;

  const perf = await page.evaluate(() => {
    const w = window;
    return {
      startedAt: (w.__BZO && w.__BZO.startedAt) ? w.__BZO.startedAt : null,
      profileSrc: typeof w.__ZO2Y_PROFILE_SRC !== 'undefined' ? w.__ZO2Y_PROFILE_SRC : null,
      railsRendered: document.querySelectorAll('.pv2-rail-track').length,
    };
  });

  await page.waitForTimeout(4000);
  const settled = Date.now() - t0;

  console.log('PERF profile.html nav->domready=' + domReady + 'ms shellVisible=' + shellVisible + 'ms settled=' + settled + 'ms');
  console.log('PERF railsRendered=' + perf.railsRendered + ' profileSrc=' + perf.profileSrc);
  console.log('PERF errors=' + JSON.stringify(errors));
  const earlyFails = failedReq.filter((f) => parseInt(f.split(' ')[0], 10) < settled);
  console.log('PERF failedReqs duringLoad=' + JSON.stringify(earlyFails));
  console.log('PERF navs=' + JSON.stringify(navs));
});