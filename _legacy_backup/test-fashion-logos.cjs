const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://gfkhjbztayjyojsgdpgk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma2hqYnp0YXlqeW9qc2dkcGdrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUzNjMxOCwiZXhwIjoyMDkxODk2MzE4fQ.6vGwIkgDmsL5cTqKaLbnsbQ4_flcgZ7CqK_dESPgIUU'
);

const CACHE_BUST = '20260622a';
const BASE_URL = 'https://gfkhjbztayjyojsgdpgk.supabase.co/storage/v1/object/public/brand-logos';

async function testFashionLogos() {
  console.log('=== Fashion Brand Logo Verification ===\n');
  let passed = 0;
  let failed = 0;
  let warnings = 0;

  // 1. Fetch all fashion brands
  const { data: brands, error } = await supabase
    .from('fashion_brands')
    .select('id, name, logo_url, domain')
    .order('name');

  if (error) {
    console.error('FATAL: Cannot fetch fashion_brands:', error.message);
    process.exit(1);
  }
  console.log(`Found ${brands.length} fashion brands in database\n`);

  // 2. Check each brand
  for (const brand of brands) {
    const logoUrl = (brand.logo_url || '').trim();

    // Check: logo_url is not empty
    if (!logoUrl) {
      console.log(`  FAIL [${brand.name}] — logo_url is empty`);
      failed++;
      continue;
    }

    // Check: logo_url is a bucket path (not clearbit or other external URL)
    const isBucketPath = !logoUrl.startsWith('http') && !logoUrl.startsWith('/') && !logoUrl.startsWith('data:');
    if (!isBucketPath) {
      console.log(`  WARN [${brand.name}] — logo_url is not a bucket path: ${logoUrl}`);
      warnings++;
    }

    // Build full URL with cache bust
    const fullUrl = logoUrl.startsWith('http')
      ? logoUrl
      : `${BASE_URL}/${logoUrl}?v=${CACHE_BUST}`;

    // HEAD request to check accessibility
    try {
      const res = await fetch(fullUrl, { method: 'HEAD', redirect: 'follow' });
      if (res.ok) {
        const ct = res.headers.get('content-type') || 'unknown';
        const isImage = ct.startsWith('image/');
        if (isImage) {
          console.log(`  OK   [${brand.name}] — ${res.status} ${ct.split(';')[0]}`);
          passed++;
        } else {
          console.log(`  WARN [${brand.name}] — ${res.status} but content-type is ${ct}`);
          warnings++;
          passed++;
        }
      } else {
        console.log(`  FAIL [${brand.name}] — ${res.status} for ${logoUrl}`);
        failed++;
      }
    } catch (e) {
      console.log(`  FAIL [${brand.name}] — network error: ${e.message}`);
      failed++;
    }
  }

  // 3. Verify cache bust URL format
  console.log('\n=== Cache Bust Verification ===');
  const sampleBrands = brands.slice(0, 5);
  for (const brand of sampleBrands) {
    const logoUrl = (brand.logo_url || '').trim();
    if (!logoUrl || logoUrl.startsWith('http')) continue;
    const expectedUrl = `${BASE_URL}/${logoUrl}?v=${CACHE_BUST}`;
    const res = await fetch(expectedUrl, { method: 'HEAD' });
    const hasCacheBust = expectedUrl.includes(`?v=${CACHE_BUST}`);
    console.log(`  ${brand.name}: cache_bust=${hasCacheBust} status=${res.status}`);
  }

  // 4. Verify fallback image exists
  console.log('\n=== Fallback Image Verification ===');
  try {
    const res = await fetch(`https://gfkhjbztayjyojsgdpgk.supabase.co/storage/v1/object/public/brand-logos/newlogo.webp`, { method: 'HEAD' });
    // Also check local
    const localRes = await fetch('http://localhost:3000/newlogo.webp', { method: 'HEAD' }).catch(() => null);
    console.log(`  newlogo.webp in bucket: ${res.status}`);
    if (localRes) console.log(`  newlogo.webp local: ${localRes.status}`);
  } catch (e) {
    console.log(`  WARN: Could not verify fallback image: ${e.message}`);
  }

  // 5. Summary
  console.log(`\n=== Summary ===`);
  console.log(`Total brands: ${brands.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Warnings: ${warnings}`);
  console.log(`\nResult: ${failed === 0 ? 'ALL LOGOS OK' : 'SOME LOGOS FAILED'}`);
  process.exit(failed > 0 ? 1 : 0);
}

testFashionLogos();
