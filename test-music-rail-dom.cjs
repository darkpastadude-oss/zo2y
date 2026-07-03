const fs = require('fs');
const { JSDOM } = require('jsdom');

async function runTests() {
  const html = fs.readFileSync('index.html', 'utf8');

  console.log("== DOM Test: Music Rail in index.html ==");

  const dom = new JSDOM(html, {
    url: "http://localhost/index.html",
    runScripts: "dangerously"
  });

  const window = dom.window;
  const document = window.document;

  // 1. Verify #musicRail element exists
  console.log("\n1. Music rail element exists");
  const musicRail = document.getElementById('musicRail');
  console.log("   #musicRail found:", musicRail ? "PASS" : "FAIL");

  // 2. Verify it's placed right after the books rail
  console.log("\n2. Music rail is placed after books rail");
  const booksRail = document.getElementById('booksRail');
  const musicRailParent = musicRail ? musicRail.closest('.rail-wrap') : null;
  const booksRailParent = booksRail ? booksRail.closest('.rail-wrap') : null;
  if (booksRailParent && musicRailParent) {
    const docPos = booksRailParent.compareDocumentPosition(musicRailParent);
    const DOCUMENT_POSITION_FOLLOWING = 0x04;
    const isAfter = !!(docPos & DOCUMENT_POSITION_FOLLOWING);
    console.log("   Position check:", isAfter ? "PASS" : "FAIL");
  } else {
    console.log("   Position check: FAIL (missing rail wraps)");
  }

  // 3. Verify music rail title contains "Music" and links to music.html
  console.log("\n3. Music rail title and link");
  const musicRailWrap = musicRail ? musicRail.closest('.rail-wrap') : null;
  const musicTitle = musicRailWrap ? musicRailWrap.querySelector('.rail-title') : null;
  if (musicTitle) {
    const titleText = musicTitle.textContent;
    const hasMusicLabel = titleText.includes('Music');
    const hasLink = !!musicTitle.querySelector('a[href="music.html"]');
    console.log("   Has 'Music' label:", hasMusicLabel ? "PASS" : "FAIL");
    console.log("   Links to music.html:", hasLink ? "PASS" : "FAIL");
  } else {
    console.log("   Title check: FAIL (no title found)");
  }

  // 4. Verify the music rail is within the Media section
  console.log("\n4. Music rail is within Media section");
  const mediaSection = document.querySelector('section[aria-label="Media"]');
  const isInMediaSection = mediaSection && mediaSection.contains(musicRail);
  console.log("   In Media section:", isInMediaSection ? "PASS" : "FAIL");

  // 5. Verify #musicRail is empty div (populated by JS at runtime)
  console.log("\n5. Music rail is an empty container (JS-populated)");
  const isEmpty = musicRail && musicRail.innerHTML.trim() === '';
  console.log("   Empty container:", isEmpty ? "PASS" : "FAIL");

  // 6. Verify the loadMusic function exists in index.js
  console.log("\n6. loadMusic function exists in index.js");
  const indexJs = fs.readFileSync('js/pages/index.js', 'utf8');
  const hasLoadMusic = indexJs.includes('async function loadMusic(');
  const hasMusicRailChannel = indexJs.includes("railId: 'musicRail'");
  console.log("   loadMusic defined:", hasLoadMusic ? "PASS" : "FAIL");
  console.log("   musicRail channel registered:", hasMusicRailChannel ? "PASS" : "FAIL");

  // 7. Verify music data fetches from correct API endpoints
  console.log("\n7. Music data fetches from correct API endpoints");
  const hasTrending = indexJs.includes('/api/music/trending');
  const hasNewReleases = indexJs.includes('/api/music/new-releases');
  console.log("   Fetches trending:", hasTrending ? "PASS" : "FAIL");
  console.log("   Fetches new releases:", hasNewReleases ? "PASS" : "FAIL");

  // 8. Verify shuffle is applied to cached music items
  console.log("\n8. Shuffle applied to cached music items");
  const hasShuffle = indexJs.includes('shuffleArray(cached).slice(0, targetCount)');
  console.log("   shuffleArray on cache:", hasShuffle ? "PASS" : "FAIL");

  // 9. Verify music images use eager loading (bypass deferred)
  console.log("\n9. Music images use eager loading");
  const hasEagerMusic = indexJs.includes("mediaTypeRaw === 'music' ? 'eager' : imagePolicy.loading");
  console.log("   Eager loading for music:", hasEagerMusic ? "PASS" : "FAIL");

  // 10. Verify referrer policy skip for music images
  console.log("\n10. Referrer policy skipped for music images");
  const hasSkipReferrer = indexJs.includes("mediaTypeRaw === 'music' ? { skipReferrerPolicy: true }");
  console.log("    skipReferrerPolicy for music:", hasSkipReferrer ? "PASS" : "FAIL");

  console.log("\n== All checks complete ==");
}

runTests().catch(console.error);
