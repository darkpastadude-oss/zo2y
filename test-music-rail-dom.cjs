const fs = require('fs');
const { JSDOM } = require('jsdom');

async function runTests() {
  const html = fs.readFileSync('index.html', 'utf8');
  const indexJs = fs.readFileSync('js/pages/index.js', 'utf8');

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

  // 3. Verify music rail title and link
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

  // 5. Verify #musicRail is populated by inline script (JS-populated)
  console.log("\n5. Music rail is JS-populated by inline script");
  const railContent = musicRail ? musicRail.innerHTML.trim() : '';
  const isPopulated = railContent.length > 0;
  console.log("   Rail has content:", isPopulated ? "PASS" : "FAIL");

  // 6. Verify inline script exists with music loader
  console.log("\n6. Inline music rail script exists");
  const hasInlineScript = html.includes("var rail = document.getElementById('musicRail')");
  console.log("   Inline script found:", hasInlineScript ? "PASS" : "FAIL");

  // 7. Verify the script uses music.html's exact loader functions
  console.log("\n7. Script uses music.html's loader pattern");
  const hasTrendingFetch = html.includes("/api/music/trending");
  const hasNewReleasesFetch = html.includes("/api/music/new-releases");
  const hasNormalizeTrack = html.includes("normalizeTrack");
  const hasNormalizeAlbum = html.includes("normalizeAlbum");
  console.log("   Fetches trending:", hasTrendingFetch ? "PASS" : "FAIL");
  console.log("   Fetches new releases:", hasNewReleasesFetch ? "PASS" : "FAIL");
  console.log("   Uses normalizeTrack:", hasNormalizeTrack ? "PASS" : "FAIL");
  console.log("   Uses normalizeAlbum:", hasNormalizeAlbum ? "PASS" : "FAIL");

  // 8. Verify cards use simple img tags (not buildHomeImageAttrs)
  console.log("\n8. Cards use simple img tags (no deferred loading)");
  const hasSimpleImg = html.includes('loading="lazy" referrerpolicy="no-referrer" decoding="async"');
  console.log("   Simple <img> tag:", hasSimpleImg ? "PASS" : "FAIL");

  // 9. Verify music is NOT in getHomeChannels (removed from index.js)
  console.log("\n9. Music NOT in index.js getHomeChannels");
  const musicNotInChannels = !indexJs.includes("railId: 'musicRail'");
  console.log("   Removed from channels:", musicNotInChannels ? "PASS" : "FAIL");

  // 10. Verify shuffle function in inline script
  console.log("\n10. Shuffle function in inline script");
  const hasShuffle = html.includes("function shuffle(a)");
  console.log("    shuffle function:", hasShuffle ? "PASS" : "FAIL");

  console.log("\n== All checks complete ==");
}

runTests().catch(console.error);
