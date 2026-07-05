const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');
content = content.replace(/media-src 'self' https:\/\/\*\.supabase\.co blob:;/g, "media-src 'self' https://*.supabase.co blob: https://*.apple.com;");
content = content.replace(/connect-src 'self' ([^;]+);/g, "connect-src 'self' $1 https://*.apple.com https://rss.applemarketingtools.com https://*.mzstatic.com https://image.tmdb.org https://media.rawg.io;");
fs.writeFileSync('index.html', content);

let mcontent = fs.readFileSync('music.html', 'utf8');
mcontent = mcontent.replace(/media-src 'self' https:\/\/\*\.supabase\.co blob:;/g, "media-src 'self' https://*.supabase.co blob: https://*.apple.com;");
mcontent = mcontent.replace(/connect-src 'self' ([^;]+);/g, "connect-src 'self' $1 https://*.apple.com https://rss.applemarketingtools.com https://*.mzstatic.com https://image.tmdb.org https://media.rawg.io;");
fs.writeFileSync('music.html', mcontent);
