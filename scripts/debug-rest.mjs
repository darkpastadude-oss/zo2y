import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const ENV_FILES = [path.join(ROOT, 'backend', '.env')];
function loadEnvFile(p) {
  if (!fs.existsSync(p)) return;
  const raw = fs.readFileSync(p, 'utf8');
  raw.split(/\r?\n/).forEach(line => {
    const t = line.trim();
    if (!t || t.startsWith('#')) return;
    const i = t.indexOf('=');
    if (i === -1) return;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    process.env[k] = v;
  });
}
ENV_FILES.forEach(loadEnvFile);

const url = (process.env.SUPABASE_URL?.startsWith('http') ? process.env.SUPABASE_URL : `https://${process.env.SUPABASE_URL}.supabase.co`) || '';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

console.log('URL:', url);
console.log('KEY prefix:', key.substring(0, 30) + '...');
console.log('KEY length:', key.length);

// Use fetch directly to Supabase REST API
// Check the supabase project health endpoint first
console.log('\nChecking Supabase project health...');
try {
  const healthRes = await fetch(url + '/rest/v1/', {
    headers: { 'apikey': key, 'Authorization': 'Bearer ' + key }
  });
  console.log('Health status:', healthRes.status);
} catch(e) {
  console.log('Health error:', e.message);
}

// Try without Authorization header (anon only)
console.log('\nTrying with apikey only...');
const res2 = await fetch(url + '/rest/v1/teams?select=id,name,logo_url&limit=3', {
  headers: { 'apikey': key, 'Accept': 'application/json' }
});
console.log('Status (apikey only):', res2.status);
if (res2.ok) {
  const data = await res2.json();
  console.log('Rows:', data.length);
} else {
  const text = await res2.text();
  console.log('Error:', text.substring(0, 200));
}

// Try without any key
console.log('\nTrying with anon key from known value...');
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma2hqYnp0YXlqeW9qc2dkcGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwOTYyNjQsImV4cCI6MjA3NTY3MjI2NH0.FAKE_KEY_HERE';
// Just trying standard access
const res3 = await fetch(url + '/rest/v1/teams?select=id,name,logo_url&limit=3', {
  headers: { 'apikey': key, 'Authorization': 'Bearer ' + key, 'Accept': 'application/json' }
});
console.log('Status (full auth):', res3.status);
const text3 = await res3.text();
console.log('Response:', text3.substring(0, 300));
