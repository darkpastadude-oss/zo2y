async function getTopArtists() {
    const dzRes = await fetch(`https://api.deezer.com/chart/0/artists?limit=10`);
    const dzJson = await dzRes.json();
    console.log(dzJson.data.map(a => a.name));
}
getTopArtists();
