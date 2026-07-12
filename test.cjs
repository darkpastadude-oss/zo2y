const q = "Wendy's Dave's Single burger";
fetch('https://html.duckduckgo.com/html/?q=' + encodeURIComponent(q + ' image'))
    .then(res => res.text())
    .then(html => {
        const match = html.match(/<img[^>]+src="(\/\/external-content\.duckduckgo\.com\/iu\/\?u=([^"]+))"/);
        if (match) {
            console.log(decodeURIComponent(match[2]));
        } else {
            console.log('No image found');
        }
    });
