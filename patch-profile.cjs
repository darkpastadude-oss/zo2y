const fs = require('fs');

let code = fs.readFileSync('js/pages/profile.js', 'utf8');

// Replace localLogo = toHttpsUrl(row?.logo_url || '')
// with a check for Supabase storage paths
code = code.replace(
  /const localLogo = toHttpsUrl\(row\?\.logo_url \|\| ''\);/g,
  `let rawLogoUrl = row?.logo_url || '';
                            let localLogo = '';
                            if (rawLogoUrl) {
                                if (/^https?:\\/\\//i.test(rawLogoUrl) || rawLogoUrl.startsWith('/') || rawLogoUrl.startsWith('data:')) {
                                    localLogo = toHttpsUrl(rawLogoUrl);
                                } else {
                                    localLogo = \`\${SUPABASE_URL}/storage/v1/object/public/brand-logos/\${rawLogoUrl}\`;
                                }
                            }`
);

fs.writeFileSync('js/pages/profile.js', code);
console.log('Patched profile.js');
