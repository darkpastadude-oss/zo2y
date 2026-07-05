const fs = require('fs');

// 1. Fix HTML button shadowing issue
const htmlFile = 'c:/Users/sigma/OneDrive/Desktop/zo2ys/profile.html';
let html = fs.readFileSync(htmlFile, 'utf8');

html = html.replace(/onclick="ProfileManager\.setOverviewMode/g, 'onclick="window.ProfileManager.setOverviewMode');
fs.writeFileSync(htmlFile, html);
console.log('Fixed HTML onclick shadowing.');

// 2. Apply new empty rail behaviour in profile.js
const jsFile = 'c:/Users/sigma/OneDrive/Desktop/zo2ys/js/pages/profile.js';
let js = fs.readFileSync(jsFile, 'utf8');

// The block to replace:
/*
                if (!previewUrls || !previewUrls.length) {
                    const emptyEl = document.createElement('div');
                    const iconMap = {
                        movie: 'fa-film', tv: 'fa-tv', anime: 'fa-dragon',
                        game: 'fa-gamepad', book: 'fa-book', music: 'fa-music',
                        sports: 'fa-futbol', travel: 'fa-earth-americas',
                        fashion: 'fa-shirt', food: 'fa-burger', car: 'fa-car'
                    };
                    const icon = iconMap[mediaType] || 'fa-plus';
                    emptyEl.innerHTML = \`<i class="fas \${icon}"></i> No items yet\`;
                    
                    emptyEl.style.padding = '16px';
                    emptyEl.style.color = 'rgba(255,255,255,0.3)';
                    emptyEl.style.fontSize = '0.85rem';
                    emptyEl.style.fontWeight = '500';
                    emptyEl.style.display = 'flex';
                    emptyEl.style.alignItems = 'center';
                    emptyEl.style.justifyContent = 'center';
                    emptyEl.style.gap = '8px';
                    emptyEl.style.width = '100%';

                    track.appendChild(emptyEl);
                    if (railEl) railEl.style.display = '';
                    return;
                }

                if (railEl) railEl.style.display = '';
*/

const oldEmptyBlockRegex = /if \(!previewUrls \|\| !previewUrls\.length\) \{[\s\S]*?if \(railEl\) railEl\.style\.display = '';/;

const newEmptyBlock = `if (!previewUrls || !previewUrls.length) {
                    // Skip rendering the rail track layout entirely
                    track.className = '';
                    
                    const iconMap = {
                        movie: 'fa-film', tv: 'fa-tv', anime: 'fa-dragon',
                        game: 'fa-gamepad', book: 'fa-book', music: 'fa-music',
                        sports: 'fa-futbol', travel: 'fa-earth-americas',
                        fashion: 'fa-shirt', food: 'fa-burger', car: 'fa-car'
                    };
                    const icon = iconMap[mediaType] || 'fa-plus';
                    
                    track.innerHTML = \`<div style="color: rgba(255,255,255,0.3); font-size: 0.85rem; font-weight: 500; display: flex; align-items: center; gap: 8px;"><i class="fas \${icon}"></i> Nothing here yet</div>\`;
                    
                    if (railEl) railEl.style.display = '';
                    return;
                }

                // Restore track classes if they were previously stripped
                track.className = isMobile ? 'mph2-row-track' : 'pv2-rail-track';
                
                if (railEl) railEl.style.display = '';`;

js = js.replace(oldEmptyBlockRegex, newEmptyBlock);
fs.writeFileSync(jsFile, js);
console.log('Applied new empty rail behaviour to profile.js.');
