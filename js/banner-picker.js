/* =========================================================
   BANNER PICKER ENGINE (V2 REDESIGN)
========================================================= */
window.BannerPicker = (function() {
    let isOpen = false;
    let currentMode = 'static'; // 'static' or 'rotate'
    let activeCategory = 'suggested';
    let searchQuery = '';
    
    // State
    let selectedMedia = null; // { id, type, title, year }
    let activeBackdrops = [];
    
    let draftStaticItem = null; // { media_type, media_id, title, url, pos_y }
    let draftRotateQueue = []; // array of items
    
    let recentlyUsed = [];
    try {
        const stored = localStorage.getItem('zo2y_recently_used_banners');
        if (stored) recentlyUsed = JSON.parse(stored);
    } catch(e){}

    let hasChanges = false;
    let isDraggingPos = false;
    let dragStartY = 0;
    let initialPosY = 15;

    // Elements
    const getEl = (id) => document.getElementById(id);

    function init() {
        // Init cropper events on the live preview
        const liveBanner = getEl('bpLiveBanner');
        if (liveBanner) {
            liveBanner.addEventListener('mousedown', onDragStart);
            liveBanner.addEventListener('touchstart', onDragStart, {passive: true});
            window.addEventListener('mousemove', onDragMove);
            window.addEventListener('touchmove', onDragMove, {passive: false});
            window.addEventListener('mouseup', onDragEnd);
            window.addEventListener('touchend', onDragEnd);
        }
    }

    function openPicker() {
        isOpen = true;
        
        // Sync draft state with userProfile
        currentMode = (window.userProfile && window.userProfile.backdrop_mode === 'rotate') ? 'rotate' : 'static';
        getEl('bpModeStatic').checked = currentMode === 'static';
        getEl('bpModeRotate').checked = currentMode === 'rotate';
        
        const existingItems = (window.userProfile && window.userProfile.banner_items) ? window.userProfile.banner_items : [];
        if (currentMode === 'static' && existingItems.length > 0) {
            draftStaticItem = {...existingItems[0]};
            draftRotateQueue = [...existingItems];
        } else {
            draftRotateQueue = [...existingItems];
            if (existingItems.length > 0) draftStaticItem = {...existingItems[0]};
        }

        hasChanges = false;
        updateApplyBtn();

        // Update live preview with current user data
        const username = window.userProfile ? window.userProfile.username : 'user';
        const name = window.userProfile ? window.userProfile.full_name || username : 'User';
        getEl('bpLiveName').textContent = name;
        getEl('bpLiveUsername').textContent = '@' + username;
        getEl('bpLiveAvatar').innerHTML = getEl('profileAvatar') ? getEl('profileAvatar').innerHTML : '@';

        if (draftStaticItem) {
            updateLivePreview(draftStaticItem.url, draftStaticItem.pos_y || 15);
        } else {
            updateLivePreview('', 15);
        }

        getEl('bannerPickerModal').classList.add('show');
        document.body.style.overflow = 'hidden';

        loadCategory('suggested');
        renderSidebar();
    }

    function closePicker() {
        isOpen = false;
        getEl('bannerPickerModal').classList.remove('show');
        document.body.style.overflow = '';
        
        // Update mini preview on edit tab
        if (hasChanges) {
            // we don't update until apply, but if they cancel, we revert
        }
    }

    function setMode(mode) {
        currentMode = mode;
        if (mode === 'static') {
            getEl('bpQueueContainer').style.display = 'none';
            if (selectedMedia) getEl('bpAvailableContainer').style.display = 'block';
        } else {
            getEl('bpAvailableContainer').style.display = 'none';
            getEl('bpQueueContainer').style.display = 'block';
            renderQueue();
        }
        markChanged();
    }

    function onSearchFocus() {
        // Mobile keyboard scroll fix
        if (window.innerWidth <= 900) {
            setTimeout(() => {
                getEl('bannerPickerModal').scrollTo({ top: 0, behavior: 'smooth' });
            }, 300);
        }
    }

    let searchTimeout;
    function onSearchInput(e) {
        searchQuery = e.target.value.trim();
        clearTimeout(searchTimeout);
        if (!searchQuery) {
            loadCategory('suggested');
            return;
        }
        searchTimeout = setTimeout(() => {
            performSearch(searchQuery);
        }, 400);
    }

    function setSearch(query) {
        getEl('bpSearchInput').value = query;
        onSearchInput({ target: { value: query } });
    }

    async function performSearch(query) {
        hideAllSections();
        getEl('bpSearchSection').style.display = 'block';
        getEl('bpSearchTitle').textContent = \`Searching for "\${query}"...\`;
        getEl('bpSearchTitle').textContent = `Searching for "${query}"...`;
        
        const grid = getEl('bpSearchGrid');
        grid.innerHTML = generateSkeletons(10, 'poster');
        getEl('bpEmptyState').style.display = 'none';

        try {
            // Use TMDB Proxy
            const res = await fetch(`/api/tmdb/search/multi?query=${encodeURIComponent(query)}&language=en`);
            const data = await res.json();
            const results = data.results ? data.results.filter(r => r.media_type === 'movie' || r.media_type === 'tv') : [];
            
            if (results.length === 0) {
                grid.innerHTML = '';
                getEl('bpEmptyState').style.display = 'block';
                getEl('bpSearchTitle').style.display = 'none';
                return;
            }
            getEl('bpSearchTitle').style.display = 'block';
            getEl('bpSearchTitle').textContent = 'Search Results';
            
            grid.innerHTML = results.map(item => `
                <div class="bp-poster-card" onclick="BannerPicker.selectMedia('${item.media_type}', '${item.id}', '${escapeHtml(item.title || item.name)}', '${(item.release_date || item.first_air_date || '').split('-')[0]}')">
                    <div class="bp-poster-img-wrap">
                        ${item.poster_path ? `<img src="https://image.tmdb.org/t/p/w342${item.poster_path}" loading="lazy">` : `<div style="width:100%;height:100%;background:rgba(255,255,255,0.05);"></div>`}
                    </div>
                    <div class="bp-poster-title">${escapeHtml(item.title || item.name)}</div>
                    <div class="bp-poster-meta">${item.media_type.toUpperCase()} ${(item.release_date || item.first_air_date) ? '• ' + (item.release_date || item.first_air_date).split('-')[0] : ''}</div>
                </div>
            `).join('');
        } catch(e) {
            grid.innerHTML = '';
            getEl('bpEmptyState').style.display = 'block';
        }
    }

    async function loadCategory(cat) {
        activeCategory = cat;
        renderSidebar();
        hideAllSections();
        
        if (cat === 'suggested') {
            getEl('bpSuggestedSection').style.display = 'block';
            renderRecentlyUsed();
            
            // Load some default popular movies/games for suggested
            const grid = getEl('bpSuggestedGrid');
            grid.innerHTML = generateSkeletons(6, 'poster');
            
            try {
                // Fetch popular movies as a fallback for suggestions
                const res = await fetch('/api/tmdb/movie/popular?language=en-US&page=1');
                const data = await res.json();
                if (data && data.results) {
                    grid.innerHTML = data.results.slice(0, 12).map(item => \`
                        <div class="bp-poster-card" onclick="BannerPicker.selectMedia('movie', '\${item.id}', '\${escapeHtml(item.title || item.name)}', '\${(item.release_date || '').split('-')[0]}')">
                            <div class="bp-poster-img-wrap">
                                <img src="https://image.tmdb.org/t/p/w342\${item.poster_path}" loading="lazy">
                            </div>
                            <div class="bp-poster-title">\${escapeHtml(item.title || item.name)}</div>
                            <div class="bp-poster-meta">MOVIE</div>
                        </div>
                    \`).join('');
                }
            } catch(e) {
                grid.innerHTML = '<p class="text-muted">Could not load suggestions.</p>';
            }
        } else {
            getEl('bpCategorySection').style.display = 'block';
            getEl('bpCategoryTitle').textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
            getEl('bpCategoryGrid').innerHTML = generateSkeletons(12, 'poster');
            // Mock category load for now (in full implementation, fetch per category)
            setTimeout(() => {
                getEl('bpCategoryGrid').innerHTML = '<p class="text-muted">Use search to find specific items.</p>';
            }, 500);
        }
    }

    async function selectMedia(type, id, title, year) {
        selectedMedia = { type, id, title, year };
        hideAllSections();
        getEl('bpMediaSection').style.display = 'block';
        getEl('bpLivePreviewWrap').style.display = 'block'; // Ensure live preview is visible

        let icon = '🎬';
        if (type === 'game') icon = '🎮';
        if (type === 'tv' || type === 'anime') icon = '📺';
        if (type === 'brand') icon = '👕';
        
        const catName = type.toUpperCase();
        getEl('bpBreadcrumb').innerHTML = \`\${icon} \${catName} &gt; <span>\${escapeHtml(title)}</span> \${year ? '&gt; ' + year : ''}\`;

        // If Rotate Mode, add to queue
        if (currentMode === 'rotate') {
            getEl('bpQueueContainer').style.display = 'block';
            getEl('bpAvailableContainer').style.display = 'none';
            
            // Auto add to queue if not exists
            if (!draftRotateQueue.find(q => String(q.media_id) === String(id) && q.media_type === type)) {
                // We need a URL for it. We'll fetch one.
                const url = await window.ProfileManager.ProfileBackdropEngine.fetchBackdropUrl({media_type: type, media_id: id});
                draftRotateQueue.push({
                    media_type: type,
                    media_id: id,
                    title: title,
                    url: url || '',
                    pos_y: 15
                });
                markChanged();
            }
            renderQueue();
            return;
        }

        // Static mode: fetch all backdrops
        getEl('bpQueueContainer').style.display = 'none';
        getEl('bpAvailableContainer').style.display = 'block';
        const grid = getEl('bpBackdropGrid');
        grid.innerHTML = generateSkeletons(6, 'backdrop');

        try {
            let urls = [];
            if (type === 'movie' || type === 'tv' || type === 'anime') {
                const endpoint = type === 'movie' ? 'movie' : 'tv';
                const res = await fetch(\`/api/tmdb/\${endpoint}/\${id}/images\`);
                const data = await res.json();
                if (data && data.backdrops && data.backdrops.length > 0) {
                    // Sort by vote_average or just take top 20
                    urls = data.backdrops.slice(0, 20).map(b => \`https://image.tmdb.org/t/p/w1280\${b.file_path}\`);
                }
            } else {
                // Fallback: just fetch the single one we have
                const url = await window.ProfileManager.ProfileBackdropEngine.fetchBackdropUrl({media_type: type, media_id: id});
                if (url) urls = [url];
            }

            if (urls.length === 0) {
                grid.innerHTML = '<p class="text-muted">No high-res backdrops found for this title.</p>';
                return;
            }

            activeBackdrops = urls;
            grid.innerHTML = urls.map((url, idx) => \`
                <div class="bp-backdrop-card \${draftStaticItem && draftStaticItem.url === url ? 'selected' : ''}" onclick="BannerPicker.selectBackdrop('\${url}')">
                    <img src="\${url}" loading="lazy">
                </div>
            \`).join('');
            
        } catch(e) {
            grid.innerHTML = '<p class="text-muted">Failed to load backdrops.</p>';
        }
    }

    function selectBackdrop(url) {
        if (!selectedMedia) return;
        draftStaticItem = {
            media_type: selectedMedia.type,
            media_id: selectedMedia.id,
            title: selectedMedia.title,
            url: url,
            pos_y: 15
        };
        
        // Update Grid UI
        const cards = getEl('bpBackdropGrid').querySelectorAll('.bp-backdrop-card');
        cards.forEach(c => c.classList.remove('selected'));
        const target = Array.from(cards).find(c => c.querySelector('img').src === url);
        if (target) target.classList.add('selected');

        updateLivePreview(url, 15);
        markChanged();
        addToRecentlyUsed(draftStaticItem);
    }

    function updateLivePreview(url, posY) {
        const img = getEl('bpLiveImage');
        if (!img) return;
        
        if (img.src !== url && url) {
            // Crossfade
            img.classList.add('fade-out');
            setTimeout(() => {
                img.src = url;
                img.style.objectPosition = \`center \${posY}%\`;
                img.onload = () => img.classList.remove('fade-out');
            }, 200);
        } else {
            img.style.objectPosition = \`center \${posY}%\`;
        }
    }

    // --- Drag to crop logic ---
    function onDragStart(e) {
        if (!getEl('bannerPickerModal').classList.contains('show')) return;
        if (currentMode !== 'static' || !draftStaticItem) return;
        isDraggingPos = true;
        dragStartY = e.touches ? e.touches[0].clientY : e.clientY;
        initialPosY = draftStaticItem.pos_y || 15;
        if (e.cancelable) e.preventDefault();
    }
    function onDragMove(e) {
        if (!isDraggingPos) return;
        if (e.cancelable) e.preventDefault();
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const deltaY = clientY - dragStartY;
        const containerHeight = getEl('bpLiveBanner').offsetHeight;
        let deltaPercent = (deltaY / containerHeight) * 100;
        let newPosY = initialPosY - deltaPercent;
        if (newPosY < 0) newPosY = 0;
        if (newPosY > 100) newPosY = 100;
        
        draftStaticItem.pos_y = newPosY;
        updateLivePreview(draftStaticItem.url, newPosY);
        markChanged();
    }
    function onDragEnd() {
        isDraggingPos = false;
    }

    // --- Rotation Queue ---
    function renderQueue() {
        const list = getEl('bpQueueList');
        if (!list) return;
        if (draftRotateQueue.length === 0) {
            list.innerHTML = '<p class="text-muted">Search for media to add to your rotation.</p>';
            return;
        }
        
        list.innerHTML = draftRotateQueue.map((item, idx) => \`
            <div class="bp-queue-item" data-index="\${idx}">
                <i class="fas fa-bars bp-queue-handle"></i>
                <img src="\${item.url}" class="bp-queue-img">
                <div class="bp-queue-info">
                    <div class="bp-queue-title">\${escapeHtml(item.title)}</div>
                    <div class="bp-queue-meta">\${item.media_type.toUpperCase()}</div>
                </div>
                <button class="bp-queue-remove" onclick="BannerPicker.removeFromQueue(\${idx})"><i class="fas fa-trash"></i></button>
            </div>
        \`).join('');
    }

    function removeFromQueue(idx) {
        draftRotateQueue.splice(idx, 1);
        renderQueue();
        markChanged();
    }

    // --- Helpers ---
    function hideAllSections() {
        getEl('bpSuggestedSection').style.display = 'none';
        getEl('bpSearchSection').style.display = 'none';
        getEl('bpCategorySection').style.display = 'none';
        getEl('bpMediaSection').style.display = 'none';
        if (currentMode === 'rotate') getEl('bpLivePreviewWrap').style.display = 'none';
    }

    function renderSidebar() {
        const cats = [
            { id: 'suggested', name: 'Suggested', icon: '⭐' },
            { id: 'movies', name: 'Movies', icon: '🎬' },
            { id: 'tv', name: 'TV Shows', icon: '📺' },
            { id: 'games', name: 'Games', icon: '🎮' },
            { id: 'anime', name: 'Anime', icon: '⚔️' },
            { id: 'books', name: 'Books', icon: '📚' },
            { id: 'music', name: 'Music', icon: '🎵' },
            { id: 'fashion', name: 'Fashion', icon: '👕' }
        ];
        getEl('bpSidebar').innerHTML = cats.map(c => \`
            <div class="bp-cat-btn \${activeCategory === c.id ? 'active' : ''}" onclick="BannerPicker.loadCategory('\${c.id}')">
                <i>\${c.icon}</i> \${c.name}
            </div>
        \`).join('');
    }

    function generateSkeletons(count, type) {
        let html = '';
        for(let i=0; i<count; i++) {
            if (type === 'poster') {
                html += \`<div class="bp-poster-card"><div class="bp-poster-img-wrap bp-skeleton"></div><div style="height:12px;width:70%;margin-bottom:4px;" class="bp-skeleton"></div><div style="height:10px;width:40%;" class="bp-skeleton"></div></div>\`;
            } else {
                html += \`<div class="bp-backdrop-card bp-skeleton"></div>\`;
            }
        }
        return html;
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/[&<>'"]/g, match => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
        }[match]));
    }

    function markChanged() {
        hasChanges = true;
        updateApplyBtn();
    }

    function updateApplyBtn() {
        const btn = getEl('bpApplyBtn');
        if (btn) btn.disabled = !hasChanges;
    }

    // --- Recently Used ---
    function addToRecentlyUsed(item) {
        recentlyUsed = recentlyUsed.filter(r => r.url !== item.url);
        recentlyUsed.unshift(item);
        if (recentlyUsed.length > 5) recentlyUsed.pop();
        localStorage.setItem('zo2y_recently_used_banners', JSON.stringify(recentlyUsed));
    }

    function renderRecentlyUsed() {
        const grid = getEl('bpRecentlyUsedGrid');
        const title = getEl('bpRecentlyUsedTitle');
        if (!grid || !title) return;
        if (recentlyUsed.length === 0) {
            grid.style.display = 'none';
            title.style.display = 'none';
            return;
        }
        grid.style.display = 'grid';
        title.style.display = 'block';
        grid.innerHTML = recentlyUsed.map(item => \`
            <div class="bp-backdrop-card" onclick="BannerPicker.selectMedia('\${item.media_type}', '\${item.media_id}', '\${escapeHtml(item.title)}'); setTimeout(()=>BannerPicker.selectBackdrop('\${item.url}'), 500);">
                <img src="\${item.url}" loading="lazy">
                <div style="position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,0.7);padding:6px;font-size:0.75rem;">\${escapeHtml(item.title)}</div>
            </div>
        \`).join('');
    }

    // --- Save Pipeline ---
    async function applyBanner() {
        if (!hasChanges) return;
        
        const finalItems = currentMode === 'static' ? (draftStaticItem ? [draftStaticItem] : []) : draftRotateQueue;
        
        // Update userProfile locally
        if (!window.userProfile) window.userProfile = {};
        window.userProfile.backdrop_mode = currentMode;
        window.userProfile.banner_items = finalItems;

        // Update Appearance Mini Preview
        const miniBackdrop = getEl('appearanceMiniBackdrop');
        if (miniBackdrop && finalItems.length > 0) {
            miniBackdrop.style.backgroundImage = \`url('\${finalItems[0].url}')\`;
            miniBackdrop.style.backgroundPosition = \`center \${finalItems[0].pos_y || 15}%\`;
        } else if (miniBackdrop) {
            miniBackdrop.style.backgroundImage = 'none';
        }

        // Send to server
        if (window.sb && window.ZO2Y_AUTH && window.ZO2Y_AUTH.session) {
            const userId = window.ZO2Y_AUTH.session.user.id;
            const updatePayload = {
                backdrop_mode: currentMode,
                banner_items: finalItems
            };
            if (currentMode === 'static' && finalItems.length > 0) {
                updatePayload.banner_position_y = finalItems[0].pos_y || 15;
            }
            
            // Try to use ProfileManager.saveProfileChanges if it exists, else direct
            if (window.ProfileManager && typeof window.ProfileManager.saveProfileChanges === 'function') {
                // Actually, saveProfileChanges uses form fields. Let's just do a direct upsert here.
                const { error } = await window.sb.from('user_profiles').update(updatePayload).eq('id', userId);
                if (error) console.error("Error saving banner:", error);
            }
        }

        // Live update the actual profile UI
        if (window.ProfileManager && window.ProfileManager.ProfileBackdropEngine && typeof window.ProfileManager.ProfileBackdropEngine.init === 'function') {
            window.ProfileManager.ProfileBackdropEngine.stop();
            window.ProfileManager.ProfileBackdropEngine.init(true);
        }

        closePicker();
    }

    // Initialize on load
    document.addEventListener('DOMContentLoaded', init);

    return {
        openPicker,
        closePicker,
        setMode,
        onSearchInput,
        onSearchFocus,
        setSearch,
        loadCategory,
        selectMedia,
        selectBackdrop,
        removeFromQueue,
        applyBanner,
        init
    };
})();
\n