const fs = require('fs');
const file = 'c:/Users/sigma/OneDrive/Desktop/zo2ys/js/pages/profile.js';
let content = fs.readFileSync(file, 'utf8');

const injection = `
            async function renderCategoryGrid(contentType, userId, checkToken) {
                try {
                    const allLists = await window.ProfileShowcase.getAllListsForType(contentType, userId);
                    const containerId = contentType === 'tv' ? 'pv2TvShowsGrid' : (contentType === 'game' ? 'pv2GamesGrid' : (contentType === 'book' ? 'pv2BooksGrid' : (contentType === 'music' ? 'pv2MusicGrid' : (contentType === 'movie' ? 'pv2MoviesGrid' : (contentType === 'anime' ? 'pv2AnimeGrid' : \`pv2\${contentType.charAt(0).toUpperCase() + contentType.slice(1)}Grid\`)))));
                    const container = document.getElementById(containerId);
                    
                    if (container) {
                        container.innerHTML = '';
                        if (!allLists || allLists.length === 0) {
                            container.innerHTML = '<div class="rail-empty-inline" style="text-align:center;">📺 nothing here yet</div>';
                        } else {
                            for (const list of allLists) {
                                const isMobile = window.innerWidth <= 768;
                                const card = await createCollectionCard(list, contentType, isMobile, userId);
                                if (card) container.appendChild(card);
                            }
                        }
                    }
                    return allLists || [];
                } catch (e) {
                    console.error('Error in renderCategoryGrid', e);
                    return [];
                }
            }
`;

const targetRegex = /async function renderMovies\(\)\s*\{/;
if (targetRegex.test(content)) {
    content = content.replace(targetRegex, injection + '\n            async function renderMovies() {');
    fs.writeFileSync(file, content);
    console.log('Restored renderCategoryGrid successfully.');
} else {
    console.log('Could not find renderMovies to inject before.');
}
