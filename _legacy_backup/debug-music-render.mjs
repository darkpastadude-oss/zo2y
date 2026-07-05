import { readFileSync } from 'fs';
import { resolve } from 'path';

// Execute normalizers in a global-like context
const vm = await import('vm');
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(readFileSync(resolve('js/normalizers.js'), 'utf8'), sandbox);
const normalizeTrack = sandbox.window.normalizeTrack;

// Step 1: Fetch raw API
const trendingRes = await fetch('https://zo2y.com/api/music/trending?limit=3&market=US');
const trendingJson = await trendingRes.json();
const rawResults = trendingJson.results || [];
console.log(`=== Raw API returned ${rawResults.length} tracks ===`);

// Step 2: Replicate EXACT functions from index.js
function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

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

// Step 3: Run the full pipeline
const mappedTracks = mapHomeTrackRowsToItems(rawResults);
const railItems = mappedTracks.map(homeMusicItemToRailItem);

console.log(`\n=== Pipeline output: ${railItems.length} items ===`);
for (const item of railItems) {
  console.log(`  title: "${item.title}" | subtitle: "${item.subtitle}" | image: ${item.image ? item.image.substring(0, 60) + '...' : '(empty)'}`);
}

// Step 4: Simulate EXACT renderRail logic
const HOME_LOCAL_FALLBACK_IMAGE = '/newlogo.webp';
const HOME_MEDIA_META = {
  music: { label: 'Music', icon: 'fa-music', accent: '#a855f7' }
};

function getHomeMediaMeta(mediaType) {
  const type = String(mediaType || '').toLowerCase();
  return HOME_MEDIA_META[type] || { label: 'Item', icon: 'fa-star', accent: '#f59e0b' };
}

console.log(`\n=== Simulating renderRail for each item ===`);
for (const itemData of railItems) {
  const mediaTypeRaw = String(itemData.mediaType || '').toLowerCase();
  const media = getHomeMediaMeta(mediaTypeRaw);

  console.log(`\n--- Item: "${itemData.title}" ---`);
  console.log(`  mediaTypeRaw: "${mediaTypeRaw}"`);
  console.log(`  media.label: "${media.label}", media.icon: "${media.icon}"`);

  const rawTitle = String(itemData.title || 'Untitled');
  const title = escapeHtml(rawTitle);
  const subtitle = escapeHtml(itemData.subtitle || media.label);
  const extra = escapeHtml(itemData.extra || '');
  const image = escapeHtml(itemData.image || '');
  const flagImage = escapeHtml(itemData.flagImage || '');
  const listImage = escapeHtml(itemData.listImage || itemData.image || '');
  const logo = escapeHtml(itemData.logo || '');
  const fallbackImage = escapeHtml(itemData.fallbackImage || HOME_LOCAL_FALLBACK_IMAGE);
  const safeImage = image || listImage || fallbackImage;

  console.log(`  After escapeHtml:`);
  console.log(`    image: "${image}"`);
  console.log(`    listImage: "${listImage}"`);
  console.log(`    fallbackImage: "${fallbackImage}"`);
  console.log(`    safeImage: "${safeImage}"`);
  console.log(`    safeImage === fallbackImage: ${safeImage === fallbackImage}`);

  const hasVisualImage = !!safeImage;
  const imgWidth = 300;
  const imgHeight = 450;

  // Simulate buildHomeImageAttrs
  const shouldDefer = false; // simplified - eager load
  const imgSrc = shouldDefer ? 'PLACEHOLDER' : safeImage;
  console.log(`    img src in HTML: "${imgSrc.substring(0, 80)}..."`);
  console.log(`    card-type label: "${escapeHtml(media.label)}"`);
  console.log(`    card-name title: "${title}"`);
  console.log(`    card-sub subtitle: "${subtitle}"`);
  console.log(`    card-extra: "${extra}"`);
}

// Step 5: Check for the exact issue - trace what would be in the card-type span
console.log(`\n=== Critical Check: What goes into card-type ===`);
for (const itemData of railItems) {
  const mediaTypeRaw = String(itemData.mediaType || '').toLowerCase();
  const media = getHomeMediaMeta(mediaTypeRaw);
  const cardTypeHtml = `<span class="card-type"><i class="fa-solid ${media.icon}"></i> ${escapeHtml(media.label)}</span>`;
  console.log(`  Item "${itemData.title}": card-type HTML = ${cardTypeHtml}`);
}

// Step 6: Check what happens if normalizeTrack returns data differently
console.log(`\n=== What if normalizeTrack is NOT available? ===`);
// Simulate when normalizeTrack is undefined
const n = undefined;
const fallbackRow = rawResults[0];
const nFallback = fallbackRow; // raw row used directly
console.log(`  If normalizeTrack unavailable, raw row keys: ${Object.keys(nFallback).join(', ')}`);
console.log(`  raw row has 'title': ${!!nFallback.title}, 'name': ${!!nFallback.name}`);
console.log(`  raw row.title: "${nFallback.title}"`);
console.log(`  raw row.name: "${nFallback.name}"`);
console.log(`  raw row.image: "${String(nFallback.image).substring(0, 60)}..."`);
// In this case, name would be undefined, so title || name || '' = title || '' = "Janice STFU"
// That's fine - title is still correct from raw data

// Step 7: Now test what happens if the loadMusic function is NOT in index.js
// (i.e., the code hasn't been deployed yet)
console.log(`\n=== What if loadMusic function doesn't exist in browser? ===`);
console.log(`  If loadMusic is undefined, the channel loader would fail silently.`);
console.log(`  renderOrDeferHomeRail would get empty items, showing "No items right now."`);
console.log(`  But the screenshot shows CARDS with images, so something IS rendering.`);

// Step 8: Check if maybe the music rail is being rendered by a DIFFERENT code path
console.log(`\n=== Checking for alternative rendering paths ===`);
const indexJs = readFileSync(resolve('js/pages/index.js'), 'utf8');
const musicRailRefs = indexJs.split('\n').map((line, i) => ({ line: i + 1, text: line.trim() }))
  .filter(({ text }) => text.includes('musicRail'));
console.log(`  Lines mentioning musicRail in index.js:`);
musicRailRefs.forEach(({ line, text }) => console.log(`    L${line}: ${text.substring(0, 120)}`));

// Step 9: Check if CSS might be hiding/showing certain elements
console.log(`\n=== CSS class check ===`);
const indexCss = readFileSync(resolve('css/pages/index.css'), 'utf8');
const cardTypeRules = indexCss.split('\n').map((line, i) => ({ line: i + 1, text: line.trim() }))
  .filter(({ text }) => text.includes('card-type') || text.includes('.card-name') || text.includes('.card-sub'));
console.log(`  CSS rules mentioning card-type, card-name, card-sub:`);
cardTypeRules.forEach(({ line, text }) => console.log(`    L${line}: ${text.substring(0, 120)}`));
