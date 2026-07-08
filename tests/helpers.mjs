import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gfkhjbztayjyojsgdpgk.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_Rw-VlOLSWfzsycF4JMFUvg_vNlaMwVd';
const TEST_EMAIL = process.env.TEST_EMAIL || '';
const TEST_PASSWORD = process.env.TEST_PASSWORD || '';

export function getSupabaseConfig() {
  return { url: SUPABASE_URL, key: SUPABASE_KEY };
}

export async function createTestUser() {
  if (!TEST_EMAIL || !TEST_PASSWORD) {
    throw new Error('TEST_EMAIL and TEST_PASSWORD env vars required');
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const { data, error } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });
  if (error) throw error;
  return data.session;
}

export async function injectSession(page, session) {
  await page.evaluate((s) => {
    const config = window.__ZO2Y_SUPABASE_CONFIG || {};
    const projectRef = config.projectRef || 'gfkhjbztayjyojsgdpgk';
    localStorage.setItem('zo2y-auth-v2', JSON.stringify(s));
    localStorage.setItem('zo2y-auth-persist-v2', JSON.stringify(s));
    localStorage.setItem('zo2y-auth-durable-v2', JSON.stringify({ session: s }));
    localStorage.setItem('sb-' + projectRef + '-auth-token', JSON.stringify({
      currentSession: s,
      expires_at: s.expires_at,
    }));
  }, session);
}

export async function clearSession(page) {
  await page.evaluate(() => {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('zo2y-auth') || key.startsWith('sb-'))) {
        keys.push(key);
      }
    }
    keys.forEach(k => localStorage.removeItem(k));
  });
}

export async function supabaseQuery(table, filters = {}, select = '*') {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  let query = supabase.from(table).select(select);
  for (const [key, value] of Object.entries(filters)) {
    query = query.eq(key, value);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function supabaseInsert(table, row) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const { data, error } = await supabase.from(table).insert(row).select().single();
  if (error) throw error;
  return data;
}

export async function supabaseDelete(table, filters) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  let query = supabase.from(table).delete();
  for (const [key, value] of Object.entries(filters)) {
    query = query.eq(key, value);
  }
  const { error } = await query;
  if (error) throw error;
}

export async function supabaseUpsert(table, row, onConflict) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const { data, error } = await supabase.from(table).upsert(row, {
    onConflict,
    ignoreDuplicates: true,
  }).select();
  if (error) throw error;
  return data;
}
