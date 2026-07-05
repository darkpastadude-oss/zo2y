const fs = require('fs');
const file = 'c:/Users/sigma/OneDrive/Desktop/zo2ys/js/pages/profile.js';
let content = fs.readFileSync(file, 'utf8');

// --- 1. Replace populateRailTrack ---
const populateRegex = /function populateRailTrack\(mediaType, previewUrls, totalItemCount\) \{[\s\S]*?(?=\n\s+async function resolveShowcaseList)/;
const newPopulate = `function populateRailTrack(mediaType, previewUrls, totalItemCount) {
                const desktopTrackId = getRailTrackId(mediaType, false);
                const mobileTrackId = getRailTrackId(mediaType, true);

                const desktopTrack = desktopTrackId ? document.getElementById(desktopTrackId) : null;
                const mobileTrack = mobileTrackId ? document.getElementById(mobileTrackId) : null;

                const opts = getRailOptions(mediaType);
                const page = TAB_PAGE_MAP[mediaType] || '#';

                [
                    { track: desktopTrack, isMobile: false },
                    { track: mobileTrack, isMobile: true }
                ].forEach(({ track, isMobile }) => {
                    if (!track) return;
                    populateRailElement(track, isMobile, mediaType, previewUrls, totalItemCount, opts, page);
                });
            }

            function populateRailElement(track, isMobile, mediaType, previewUrls, totalItemCount, opts, page) {
                if (!opts) opts = getRailOptions(mediaType);
                if (!page) page = TAB_PAGE_MAP[mediaType] || '#';

                track.innerHTML = '';
                const railEl = track.closest(isMobile ? '.mph2-row' : '.pv2-rail');

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

                const maxVisible = isMobile ? 5 : 8; // Increased limit for category rails
                const visible = previewUrls.slice(0, maxVisible);
                const total = typeof totalItemCount === 'number' ? totalItemCount : previewUrls.length;
                const extra = total - visible.length;

                visible.forEach((url, i) => {
                    const card = document.createElement('div');
                    
                    let baseClass = isMobile ? 'mph2-poster' : 'pv2-poster';
                    if (opts.isSquare) baseClass += ' is-square';
                    if (opts.isLandscape) baseClass += ' is-landscape';
                    if (opts.isBrand) baseClass += ' is-brand';
                    card.className = baseClass;
                    card.style.animationDelay = (i * 40) + 'ms';

                    const imgWrap = document.createElement('div');
                    imgWrap.className = isMobile ? 'mph2-poster-img-wrap' : 'pv2-poster-img-wrap';

                    const img = document.createElement('img');
                    img.src = url;
                    img.alt = 'Poster';
                    img.loading = 'lazy';
                    img.onerror = () => { img.src = '/newlogo.webp'; };

                    imgWrap.appendChild(img);
                    card.appendChild(imgWrap);
                    track.appendChild(card);
                });

                if (extra > 0) {
                    const more = document.createElement('div');
                    more.className = isMobile ? 'mph2-poster is-more' : 'pv2-poster is-more';
                    if (opts.isSquare) more.classList.add('is-square');
                    if (opts.isLandscape) more.classList.add('is-landscape');
                    if (opts.isBrand) more.classList.add('is-brand');
                    
                    more.innerHTML = \`
                        <div class="\${isMobile ? 'mph2-poster-img-wrap' : 'pv2-poster-img-wrap'}">
                            <div class="\${isMobile ? 'mph2-more-overlay' : 'pv2-more-overlay'}">+\${extra}</div>
                        </div>
                    \`;
                    track.appendChild(more);
                }
            }`;
content = content.replace(populateRegex, newPopulate);

// --- 2. Replace createCollectionCard ---
const createCardRegex = /async function createCollectionCard\([\s\S]*?(?=\n\s+function getPreviewAssetCacheKey)/;
const newCreateCard = `async function createCollectionCard(list, contentType, isMobile, ownerUserId = null) {
                const rail = document.createElement('div');
                rail.className = isMobile ? 'mph2-row' : 'pv2-rail';
                rail.style.marginBottom = '32px';

                const normalizedType = contentType === 'cars' ? 'car' : contentType;
                const safeListId = String(list.id || '').replace(/'/g, "\\\\'");
                const routeListType = resolveCollectionListType(normalizedType, list);
                const safeListType = String(routeListType || '').replace(/'/g, "\\\\'");
                
                let itemIds = [];
                if (normalizedType === 'restaurant') {
                    itemIds = list.restaurantIds || [];
                } else if (normalizedType === 'movie') {
                    itemIds = list.movieIds || [];
                } else if (normalizedType === 'tv') {
                    itemIds = list.tvIds || [];
                } else if (normalizedType === 'anime') {
                    itemIds = list.animeIds || [];
                } else if (normalizedType === 'game') {
                    itemIds = list.gameIds || [];
                } else if (normalizedType === 'book') {
                    itemIds = list.bookIds || [];
                } else if (normalizedType === 'fashion' || normalizedType === 'food' || normalizedType === 'car') {
                    itemIds = list.brandIds || [];
                } else if (normalizedType === 'travel') {
                    itemIds = list.countryCodes || [];
                } else {
                    itemIds = list.trackIds || [];
                }

                const { orderedIds } = await resolveTierOrderedIds(normalizedType, list, list.id, itemIds, {
                    listType: routeListType,
                    ownerUserId
                });
                
                const count = orderedIds.length;
                const iconGlyphStr = iconGlyph(list.icon, normalizedType === 'restaurant' ? 'restaurant' : (normalizedType === 'movie' ? 'movie' : (normalizedType === 'tv' ? 'tv' : (normalizedType === 'anime' ? 'anime' : (normalizedType === 'game' ? 'game' : (normalizedType === 'book' ? 'book' : (normalizedType === 'travel' ? 'travel' : (normalizedType === 'car' ? 'car' : 'music'))))))));

                if (isMobile) {
                    rail.innerHTML = \`
                        <div class="mph2-row-hd" style="cursor: pointer;" onclick="ProfileManager.openCollectionPage('\${safeListId}', '\${normalizedType}', '\${safeListType}')">
                            <span class="mph2-row-label" style="display:flex;align-items:center;gap:6px;">\${iconGlyphStr} \${list.title}</span>
                            <a class="mph2-row-viewall">view list <i class="fas fa-chevron-right"></i></a>
                        </div>
                        <div class="mph2-row-track" id="track-\${safeListId}"></div>
                    \`;
                } else {
                    rail.innerHTML = \`
                        <div class="pv2-rail-header" style="cursor: pointer;" onclick="ProfileManager.openCollectionPage('\${safeListId}', '\${normalizedType}', '\${safeListType}')">
                            <div class="pv2-rail-title" style="display:flex;align-items:center;gap:8px;">\${iconGlyphStr} \${list.title}</div>
                            <a class="pv2-rail-viewall">view list <i class="fas fa-arrow-right"></i></a>
                        </div>
                        <div class="pv2-rail-track" id="track-\${safeListId}"></div>
                    \`;
                }

                const track = rail.querySelector(isMobile ? '.mph2-row-track' : '.pv2-rail-track');
                
                const previewLimit = isMobile ? 5 : 8;
                const travelPreviewIds = normalizedType === 'travel'
                    ? Array.from(new Set(
                        [
                            ...(Array.isArray(list?.countryCodes) ? list.countryCodes : []),
                            ...orderedIds
                        ]
                            .map((id) => normalizeCountryCode(id))
                            .filter(Boolean)
                    ))
                    : [];
                const previewIds = normalizedType === 'travel'
                    ? travelPreviewIds.slice(0, previewLimit)
                    : orderedIds.slice(0, previewLimit);

                // Start empty
                populateRailElement(track, isMobile, contentType, [], count);

                if (previewIds.length) {
                    void getPreviewItems(previewIds, contentType)
                        .then((resolvedPreviewItems) => {
                            if (!rail.isConnected) return;
                            populateRailElement(track, isMobile, contentType, resolvedPreviewItems, count);
                        });
                }

                return rail;
            }`;
content = content.replace(createCardRegex, newCreateCard);

// 3. Fix category rail logic in renderCategoryGrid
// I noticed in renderCategoryGrid, it does:
// allLists.forEach(list => { (list.itemIds || []).slice(0, 3).forEach(id => allPreviewIds.add(id)); });
// Let's update that to 8 so the previews match our new preview limit!
content = content.replace(/\(list\.itemIds \|\| \[\]\)\.slice\(0, 3\)/g, '(list.itemIds || []).slice(0, 8)');

fs.writeFileSync(file, content);
console.log('Successfully updated profile.js rail and collection logic.');
