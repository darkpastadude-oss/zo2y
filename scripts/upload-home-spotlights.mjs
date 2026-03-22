import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const ROOT = process.cwd();
const BUCKET_NAME = 'home-spotlights';
const FILES = [
  { local: 'assets/home-spotlights/fashion.jpg', remote: 'fashion.jpg', contentType: 'image/jpeg' },
  { local: 'assets/home-spotlights/food.jpg', remote: 'food.jpg', contentType: 'image/jpeg' },
  { local: 'assets/home-spotlights/cars.jpg', remote: 'cars.jpg', contentType: 'image/jpeg' }
];
const ENV_FILES = ['.env', '.env.local', '.env.vercel', '.env.vercel.prod'].map((file) => path.join(ROOT, file));

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const raw = fs.readFileSync(filePath, 'utf8');
  const env = {};
  raw.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const idx = trimmed.indexOf('=');
    if (idx === -1) return;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) env[key] = value;
  });
  return env;
}

function hydrateEnv() {
  const merged = {};
  ENV_FILES.forEach((filePath) => Object.assign(merged, loadEnvFile(filePath)));
  Object.entries(merged).forEach(([key, value]) => {
    if (!(key in process.env)) process.env[key] = value;
  });
}

function normalizeSupabaseUrl(value) {
  if (!value) return '';
  if (value.startsWith('http')) return value;
  return `https://${value}.supabase.co`;
}

hydrateEnv();

const SUPABASE_URL = normalizeSupabaseUrl(process.env.SUPABASE_URL);
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function ensureBucket() {
  const { data, error } = await supabase.storage.getBucket(BUCKET_NAME);
  if (data && !error) return;
  await supabase.storage.createBucket(BUCKET_NAME, {
    public: true,
    fileSizeLimit: '5MB',
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
  });
}

async function uploadFile(definition) {
  const localPath = path.join(ROOT, definition.local);
  if (!fs.existsSync(localPath)) {
    throw new Error(`Missing local spotlight asset: ${definition.local}`);
  }
  const buffer = fs.readFileSync(localPath);
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(definition.remote, buffer, {
      contentType: definition.contentType,
      upsert: true,
      cacheControl: '31536000'
    });
  if (error) {
    throw error;
  }
  return supabase.storage.from(BUCKET_NAME).getPublicUrl(definition.remote).data.publicUrl;
}

async function main() {
  await ensureBucket();
  for (const file of FILES) {
    const url = await uploadFile(file);
    console.log(`[spotlights] ${file.remote} -> ${url}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
