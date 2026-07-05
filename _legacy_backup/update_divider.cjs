const fs = require('fs');

let js = fs.readFileSync('js/pages/profile.js', 'utf8');

const regex = /const divider = document\.createElement\('div'\);\s*divider\.style\.height = '1px';\s*divider\.style\.background = 'var\(--border\)';\s*divider\.style\.margin = '8px 0 0 0';\s*divider\.style\.opacity = '0\.5';\s*container\.appendChild\(divider\);/g;

const replacement = `const dividerContainer = document.createElement('div');
                                        dividerContainer.style.marginBottom = '24px';
                                        
                                        const customListsTitle = document.createElement('div');
                                        customListsTitle.innerText = 'custom lists';
                                        customListsTitle.style.color = 'var(--muted)';
                                        customListsTitle.style.fontSize = '0.85rem';
                                        customListsTitle.style.fontWeight = '600';
                                        customListsTitle.style.marginBottom = '8px';
                                        
                                        const divider = document.createElement('div');
                                        divider.style.height = '1px';
                                        divider.style.background = 'var(--border)';
                                        divider.style.opacity = '0.5';
                                        
                                        dividerContainer.appendChild(customListsTitle);
                                        dividerContainer.appendChild(divider);
                                        container.appendChild(dividerContainer);`;

js = js.replace(regex, replacement);

fs.writeFileSync('js/pages/profile.js', js);
console.log('Updated custom list divider logic.');
