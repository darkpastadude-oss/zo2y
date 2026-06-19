import handler from './api/books-handler.js';
async function testQuery(q, orderBy = 'relevance', limit=5) {
  console.log('--- TEST: ' + q + ' ---');
  await handler({
    method: 'GET',
    url: '/api/books/popular?limit=' + limit + '&orderBy=' + orderBy,
    query: { path: ['popular'], limit: limit, orderBy: orderBy }
  }, {
    setHeader: () => {},
    status: (s) => ({ json: (j) => console.log('STATUS', s, j) }),
    json: (j) => console.log('JSON:', j.books ? j.books.map(b => b.title + ' (' + (b.author||'') + ')').join(' | ') : j)
  });
}
async function run() {
  await testQuery('popular defaults', 'relevance');
}
run().catch(console.error);
