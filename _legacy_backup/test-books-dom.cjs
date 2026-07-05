const fs = require('fs');
const { JSDOM } = require('jsdom');

async function runTests() {
  const html = fs.readFileSync('books.html', 'utf8');
  const js = fs.readFileSync('js/pages/books.js', 'utf8');

  console.log("== Initiating DOM Test for Books ==");

  const dom = new JSDOM(html, {
    url: "http://localhost/books.html",
    runScripts: "dangerously"
  });

  const window = dom.window;
  const document = window.document;

  let fetchCalls = [];
  window.fetch = async (url) => {
    fetchCalls.push(url);
    if (url.includes('/trending')) {
      return {
        ok: true,
        json: async () => ({
          ok: true, total: 50, books: [
            { id: "1", title: "Trending Book A", author: "Author A" },
            { id: "2", title: "Trending Book B", author: "Author B" }
          ]
        })
      };
    } else if (url.includes('/search')) {
      return {
        ok: true,
        json: async () => ({
          ok: true, total: 30, books: [
            { id: "3", title: "Search Book C", author: "Author C" }
          ]
        })
      };
    }
    return { ok: true, json: async () => ({}) };
  };

  // Mock offsetHeight and grid stuff since JSDOM doesn't do layout well
  window.HTMLElement.prototype.offsetHeight = 1000;
  window.HTMLElement.prototype.offsetWidth = 1000;
  window.getComputedStyle = () => ({ gridTemplateColumns: '1fr 1fr 1fr' });

  // Execute the script
  const scriptEl = document.createElement("script");
  scriptEl.textContent = js;
  document.body.appendChild(scriptEl);

  // Wait for initial load
  await new Promise(r => setTimeout(r, 100));

  console.log("\n1. Initial Load Test");
  console.log("Fetch called:", fetchCalls[fetchCalls.length - 1]);
  console.log("Grid content:", document.getElementById("booksGrid").innerHTML.includes("Trending Book A") ? "PASS" : "FAIL");
  console.log("Spotlight title:", document.getElementById("booksSpotlightTitle").textContent === "Trending Book A" ? "PASS" : "FAIL");

  console.log("\n2. Pagination Test (Next Page)");
  document.getElementById("nextPageBtn").click();
  await new Promise(r => setTimeout(r, 100));
  console.log("Fetch called:", fetchCalls[fetchCalls.length - 1]);
  console.log("Page info:", document.getElementById("pageInfo").textContent === "Page 2 of 3" ? "PASS" : "FAIL");

  console.log("\n3. Pagination Test (Prev Page)");
  document.getElementById("prevPageBtn").click();
  await new Promise(r => setTimeout(r, 100));
  console.log("Fetch called:", fetchCalls[fetchCalls.length - 1]);
  console.log("Page info:", document.getElementById("pageInfo").textContent === "Page 1 of 3" ? "PASS" : "FAIL");

  console.log("\n4. Search Input Test (Debounce & Trigger)");
  const searchInput = document.getElementById("q");
  searchInput.value = "Harry Potter";
  searchInput.dispatchEvent(new window.Event('input'));
  await new Promise(r => setTimeout(r, 500)); // wait for debounce
  console.log("Fetch called:", fetchCalls[fetchCalls.length - 1]);
  console.log("Grid Title:", document.getElementById("gridTitle").textContent === 'Search results for "Harry Potter"' ? "PASS" : "FAIL");
  console.log("Grid content:", document.getElementById("booksGrid").innerHTML.includes("Search Book C") ? "PASS" : "FAIL");

  console.log("\n5. Filter Reset Test");
  document.getElementById("genre").value = "fantasy";
  document.getElementById("refresh").click();
  await new Promise(r => setTimeout(r, 100));
  console.log("Fetch called:", fetchCalls[fetchCalls.length - 1]);
  console.log("Grid Title:", document.getElementById("gridTitle").textContent === 'Fantasy Bestsellers' ? "PASS" : "FAIL");
}

runTests().catch(console.error);
