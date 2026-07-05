import { readFileSync } from 'fs';
import { resolve } from 'path';

// Step 1: Fetch raw API response
console.log('=== STAGE 1: Raw API Response ===');
const trendingRes = await fetch('https://zo2y.com/api/music/trending?limit=5&market=US');
const trendingJson = await trendingRes.json();
const rawResults = trendingJson.results || [];
console.log(`rawResults.length = ${rawResults.length}`);
if (rawResults.length > 0) {
  const first = rawResults[0];
  console.log(`\nFirst raw result keys: ${Object.keys(first).join(', ')}`);
  console.log(`  title: ${JSON.stringify(first.title)}`);
  console.log(`  name: ${JSON.stringify(first.name)}`);
  console.log(`  artist: ${JSON.stringify(first.artist)}`);
  console.log(`  artists: ${JSON.stringify(first.artists)}`);
  console.log(`  image: ${JSON.stringify(first.image)}`);
  console.log(`  album: ${JSON.stringify(first.album)}`);
  console.log(`  albumName: ${JSON.stringify(first.albumName)}`);
  console.log(`  album_type: ${JSON.stringify(first.album_type)}`);
  console.log(`  albumType: ${JSON.stringify(first.albumType)}`);
  console.log(`  provider: ${JSON.stringify(first.provider)}`);
  console.log(`  source: ${JSON.stringify(first.source)}`);
  console.log(`  id: ${JSON.stringify(first.id)}`);
  console.log(`  popularity: ${JSON.stringify(first.popularity)}`);
  console.log(`  releaseDate: ${JSON.stringify(first.releaseDate)}`);
  console.log(`  release_date: ${JSON.stringify(first.release_date)}`);
  console.log(`  previewUrl: ${JSON.stringify(first.previewUrl)}`);
  console.log(`  preview_url: ${JSON.stringify(first.preview_url)}`);
  console.log(`  externalUrl: ${JSON.stringify(first.externalUrl)}`);
  console.log(`  external_url: ${JSON.stringify(first.external_url)}`);
  console.log(`  cover: ${JSON.stringify(first.cover)}`);
  console.log(`  thumbnail: ${JSON.stringify(first.thumbnail)}`);
  console.log(`  images: ${JSON.stringify(first.images)}`);
  console.log(`  album.images: ${JSON.stringify(first.album?.images)}`);
}

// Step 2: Load normalizers and run normalizeTrack
console.log('\n=== STAGE 2: After normalizeTrack ===');
const normalizersCode = readFileSync(resolve('js/normalizers.js'), 'utf8');
// Execute normalizers in a global-like context
const vm = await import('vm');
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(normalizersCode, sandbox);

const normalizeTrack = sandbox.window.normalizeTrack;
const normalizeAlbum = sandbox.window.normalizeAlbum;

if (rawResults.length > 0) {
  const first = rawResults[0];
  const normalized = normalizeTrack(first);
  console.log(`normalized result: ${JSON.stringify(normalized, null, 2)}`);
}

// Step 3: Run mapHomeTrackRowsToItems logic
console.log('\n=== STAGE 3: After mapHomeTrackRowsToItems ===');
function getHomeMusicSource(row) {
  return String(row?.source || row?.provider || 'spotify').trim().toLowerCase() || 'spotify';
}

function mapHomeTrackRowsToItems(rows) {
  return (Array.isArray(rows) ? rows : []).map((row) => {
    if (!row) return null;
    const n = typeof normalizeTrack === 'function' ? normalizeTrack(row) : row;
    if (!n || !n.id) return null;
    return {
      id: String(n.id || ''),
      kind: 'track',
      source: getHomeMusicSource(n),
      name: n.title || n.name || '',
      subtitle: n.artist || n.artists || 'Artist',
      album: n.albumName || n.album_name || 'Unknown Album',
      album_type: String(n.albumType || n.album_type || '').trim().toLowerCase(),
      total_tracks: Number(n.trackCount || n.totalTracks || n.total_tracks || 0),
      image: String(n.image || n.thumbnail || ''),
      preview_url: n.previewUrl || n.preview_url || n.preview || '',
      external_url: n.externalUrl || n.external_url || '',
      popularity: Number(n.popularity || 0),
      genre: String(n.genre || n.genres?.[0] || '').trim(),
      release_date: String(n.releaseDate || n.release_date || '').trim()
    };
  }).filter((row) => row && row.id);
}

const mappedTracks = mapHomeTrackRowsToItems(rawResults);
console.log(`mappedTracks.length = ${mappedTracks.length}`);
if (mappedTracks.length > 0) {
  const first = mappedTracks[0];
  console.log(`\nFirst mapped track:`);
  console.log(`  id: ${JSON.stringify(first.id)}`);
  console.log(`  kind: ${JSON.stringify(first.kind)}`);
  console.log(`  name: ${JSON.stringify(first.name)}`);
  console.log(`  subtitle: ${JSON.stringify(first.subtitle)}`);
  console.log(`  album: ${JSON.stringify(first.album)}`);
  console.log(`  image: ${JSON.stringify(first.image)}`);
  console.log(`  image.startsWith("http"): ${first.image?.startsWith('http')}`);
}

// Step 4: Run homeMusicItemToRailItem logic
console.log('\n=== STAGE 4: After homeMusicItemToRailItem ===');
function homeMusicItemToRailItem(item) {
  const kind = String(item?.kind || 'track').toLowerCase();
  const isTrack = kind === 'track';
  const title = String(item?.name || '').trim();
  const artist = String(item?.subtitle || '').trim();
  const albumName = String(item?.album || '').trim() || 'Unknown Album';
  const image = String(item?.image || '').trim();
  return {
    mediaType: 'music',
    itemId: item.id || '',
    title: title || 'Track',
    subtitle: artist || 'Artist',
    extra: `Song | ${albumName}`,
    image,
    fallbackImage: '/images/fallback/music.svg',
    href: `song.html?id=${encodeURIComponent(item.id)}`
  };
}

if (mappedTracks.length > 0) {
  const railItem = homeMusicItemToRailItem(mappedTracks[0]);
  console.log(`\nFirst rail item:`);
  console.log(`  title: ${JSON.stringify(railItem.title)}`);
  console.log(`  subtitle: ${JSON.stringify(railItem.subtitle)}`);
  console.log(`  image: ${JSON.stringify(railItem.image)}`);
  console.log(`  fallbackImage: ${JSON.stringify(railItem.fallbackImage)}`);
  console.log(`  extra: ${JSON.stringify(railItem.extra)}`);
}

// Step 5: Now simulate what renderRail does with this data
console.log('\n=== STAGE 5: Simulating renderRail field extraction ===');
if (mappedTracks.length > 0) {
  const itemData = homeMusicItemToRailItem(mappedTracks[0]);
  const HOME_LOCAL_FALLBACK_IMAGE = '/newlogo.webp';

  const rawTitle = String(itemData.title || 'Untitled');
  const title = rawTitle;
  const subtitle = String(itemData.subtitle || '');
  const extra = String(itemData.extra || '');
  const image = String(itemData.image || '');
  const listImage = String(itemData.listImage || itemData.image || '');
  const logo = String(itemData.logo || '');
  const fallbackImage = String(itemData.fallbackImage || HOME_LOCAL_FALLBACK_IMAGE);
  const safeImage = image || listImage || fallbackImage;
  const coverImage = image || listImage || logo;

  console.log(`  rawTitle: ${JSON.stringify(rawTitle)}`);
  console.log(`  title: ${JSON.stringify(title)}`);
  console.log(`  image: ${JSON.stringify(image)}`);
  console.log(`  listImage: ${JSON.stringify(listImage)}`);
  console.log(`  logo: ${JSON.stringify(logo)}`);
  console.log(`  fallbackImage: ${JSON.stringify(fallbackImage)}`);
  console.log(`  safeImage: ${JSON.stringify(safeImage)}`);
  console.log(`  safeImage === fallbackImage: ${safeImage === fallbackImage}`);
  console.log(`  coverImage: ${JSON.stringify(coverImage)}`);

  // Now check: does the card show the fallback?
  const imgUsed = safeImage || fallbackImage;
  console.log(`\n  IMAGE SHOWN IN CARD: ${JSON.stringify(imgUsed)}`);
  console.log(`  IS NEWLOGO: ${imgUsed.includes('newlogo')}`);
  console.log(`  IS FALLBACK MUSIC SVG: ${imgUsed.includes('fallback/music')}`);
}

// Step 6: Check every single track for image issues
console.log('\n=== STAGE 6: Check ALL tracks for image/title issues ===');
let issues = 0;
for (let i = 0; i < mappedTracks.length; i++) {
  const item = mappedTracks[i];
  const railItem = homeMusicItemToRailItem(item);
  const noImage = !railItem.image || !railItem.image.startsWith('http');
  const noTitle = !railItem.title || railItem.title === 'Track';
  if (noImage || noTitle) {
    console.log(`  ISSUE at index ${i}: title=${JSON.stringify(railItem.title)}, image=${JSON.stringify(railItem.image?.substring(0, 60))}`);
    issues++;
  }
}
if (issues === 0) {
  console.log('  No issues found - all tracks have real titles and images');
} else {
  console.log(`  Found ${issues} tracks with issues`);
}

// Step 7: Now check what renderRail actually does with the image
console.log('\n=== STAGE 7: renderRail image path analysis ===');
console.log('In renderRail:');
console.log('  const image = escapeHtml(itemData.image || "")');
console.log('  const listImage = escapeHtml(itemData.listImage || itemData.image || "")');
console.log('  const logo = escapeHtml(itemData.logo || "")');
console.log('  const fallbackImage = escapeHtml(itemData.fallbackImage || HOME_LOCAL_FALLBACK_IMAGE)');
console.log('  const safeImage = image || listImage || fallbackImage');
console.log('');
console.log('HOME_LOCAL_FALLBACK_IMAGE = /newlogo.webp (the frog logo)');
console.log('');
console.log('If itemData.image is empty string "", then:');
console.log('  image = ""');
console.log('  listImage = "" (itemData.listImage is undefined)');
console.log('  fallbackImage = itemData.fallbackImage || /newlogo.webp');
console.log('  safeImage = "" || "" || fallbackImage = fallbackImage');
console.log('');

// Check if normalizeTrack returns image properly
console.log('\n=== STAGE 8: normalizeTrack raw vs normalized image ===');
if (rawResults.length > 0) {
  const raw = rawResults[0];
  const norm = normalizeTrack(raw);
  console.log(`raw.image = ${JSON.stringify(raw.image)}`);
  console.log(`raw.images = ${JSON.stringify(raw.images)}`);
  console.log(`raw.album = ${JSON.stringify(raw.album)}`);
  console.log(`raw.album?.images = ${JSON.stringify(raw.album?.images)}`);
  console.log(`norm.image = ${JSON.stringify(norm.image)}`);
  
  // The extractImage function checks: raw.image || raw.cover || raw.images[0] || raw.album.images[0]
  console.log('\nextractImage checks in order:');
  console.log(`  raw.image: ${JSON.stringify(raw.image)} -> ${!!raw.image}`);
  console.log(`  raw.cover: ${JSON.stringify(raw.cover)} -> ${!!raw.cover}`);
  console.log(`  raw.images: ${JSON.stringify(raw.images)} -> length=${raw.images?.length || 0}`);
  console.log(`  raw.album?.images: ${JSON.stringify(raw.album?.images)} -> length=${raw.album?.images?.length || 0}`);
}
