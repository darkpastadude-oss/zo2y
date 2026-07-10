export default async function omdbHandler(request, env) {
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const url = new URL(request.url);
  const imdbId = url.searchParams.get('i');

  if (!imdbId) {
    return new Response(JSON.stringify({ error: 'Missing imdb id parameter (i)' }), { status: 400 });
  }

  const apiKey = env.OMDB_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'OMDB API key not configured' }), { status: 500 });
  }

  try {
    const omdbUrl = `https://www.omdbapi.com/?apikey=${apiKey}&i=${imdbId}`;
    const response = await fetch(omdbUrl);
    
    if (!response.ok) {
      throw new Error(`OMDB API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=604800', // Cache for 7 days
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
