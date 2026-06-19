import handler from './api/books-handler.js';
async function testQuery(q, orderBy = 'relevance', limit=5) {
  console.log('--- TEST: ' + q + ' ---');
  await handler({
    method: 'GET',
    url: '/api/books/search?q=' + encodeURIComponent(q) + '&limit=' + limit + '&orderBy=' + orderBy,
    query: { path: ['search'], q: q, limit: limit, orderBy: orderBy }
  }, {
    setHeader: () => {},
    status: (s) => ({ json: (j) => console.log('STATUS', s, j) }),
    json: (j) => console.log('JSON:', j.books ? j.books.map(b => b.title + ' (' + (b.author||'') + ')').join(' | ') : j)
  });
}
async function run() {
  await testQuery('subject:fiction', 'relevance');
  await testQuery('subject:fiction bestseller', 'relevance');
  await testQuery('subject:fiction bestseller newest', 'newest');
  await testQuery('inauthor:"Stephen King" OR inauthor:"Sarah J. Maas"', 'relevance');
  await testQuery('subject:fiction 2024', 'relevance');
}
run().catch(console.error);
