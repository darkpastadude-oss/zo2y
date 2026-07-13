async function checkArtists() {
    const query = 'pop rap latin rock';
    const limit = 10;
    const offset = 0;
    const res = await fetch(`https://api.deezer.com/search/artist?q=${encodeURIComponent(query)}&limit=${limit}&index=${offset}`, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    const json = await res.json();
    const artists = (json.data || []).map(a => ({
      title: a.name,
      popularity: a.nb_fan
    }));
    artists.sort((a, b) => b.popularity - a.popularity);
    console.log(artists);
}
checkArtists();
