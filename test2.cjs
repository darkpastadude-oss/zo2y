const q = 'Wendys burger';
const url = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&srnamespace=6&srlimit=5&format=json`;
fetch(url)
    .then(r => r.json())
    .then(data => {
        console.log(data.query.search.map(s => s.title));
    });
