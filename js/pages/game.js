(() => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  const els = {
    name: document.getElementById('gameName'),
    desc: document.getElementById('gameDescription'),
    backdrop: document.getElementById('gameBackdrop'),
    backdropBlur: document.getElementById('gameBackdropBlur'),
    hero: document.getElementById('gameHero'),
    meta: document.getElementById('gameMeta'),
    tags: document.getElementById('gameTags'),
    poster: document.getElementById('gameLogo'),
    gallery: document.getElementById('gameGallery'),
    gallerySec: document.getElementById('gameGallerySection'),
    related: document.getElementById('gameRelated'),
    relatedSec: document.getElementById('gameRelatedSection'),
    kicker: document.getElementById('gameKickerLabel'),
    aboutBody: document.getElementById('gameAboutBody')
  };

  async function loadGame() {
    if (!id) {
      if (els.name) els.name.textContent = 'Game not found';
      if (els.desc) els.desc.textContent = 'No game ID provided.';
      return;
    }

    try {
      const res = await fetch(`/api/igdb/games/${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error('Game not found');
      
      const game = await res.json();
      
      if (els.name) els.name.textContent = game.name || 'Unknown Game';
      
      if (els.desc && game.description) {
        els.desc.textContent = game.description;
      } else if (els.desc) {
        els.desc.textContent = 'Explore more details about this game.';
      }
      
      if (els.aboutBody && game.description) {
        els.aboutBody.textContent = game.description;
      }
      
      if (els.meta) {
        els.meta.innerHTML = `<span>${game.released ? game.released.substring(0, 4) : 'Unknown Year'}</span>`;
      }
      
      if (els.poster && game.cover) {
        els.poster.src = game.cover;
        els.poster.onerror = function() { this.src = '/images/fallback/game.svg'; };
      }
      
      if (game.background_image || game.hero) {
        const bgImg = game.background_image || game.hero;
        if (els.backdrop) els.backdrop.style.backgroundImage = `url("${bgImg}")`;
        if (els.backdropBlur) els.backdropBlur.style.backgroundImage = `url("${bgImg}")`;
        if (els.hero) els.hero.classList.remove('is-no-backdrop');
      }
      
      if (els.tags && game.genres && game.genres.length > 0) {
        els.tags.innerHTML = game.genres.map(g => `<span class="tag">${g.name || g}</span>`).join('');
      } else if (els.tags) {
        els.tags.innerHTML = '';
      }
      
      // Populate quick facts grid
      const infoGrid = document.getElementById('gameInfoGrid');
      if (infoGrid) {
        let factsHtml = '';
        if (game.developers && game.developers.length > 0) {
          factsHtml += `<div class="elevated-detail-item"><div class="elevated-detail-label">Developer</div><div class="elevated-detail-value">${game.developers.map(d=>d.name || d).join(', ')}</div></div>`;
        }
        if (game.publishers && game.publishers.length > 0) {
          factsHtml += `<div class="elevated-detail-item"><div class="elevated-detail-label">Publisher</div><div class="elevated-detail-value">${game.publishers.map(p=>p.name || p).join(', ')}</div></div>`;
        }
        if (game.released) {
          factsHtml += `<div class="elevated-detail-item"><div class="elevated-detail-label">Release Date</div><div class="elevated-detail-value">${game.released}</div></div>`;
        }
        infoGrid.innerHTML = factsHtml;
      }
      
      // Populate screenshots gallery
      if (game.screenshots && game.screenshots.length > 0) {
        if (els.gallerySec) els.gallerySec.hidden = false;
        if (els.gallery) {
          const renderImgs = game.screenshots;
          els.gallery.classList.toggle('has-multiple', renderImgs.length > 1);
          els.gallery.innerHTML = renderImgs.map((img, i) => 
            `<div class="elevated-gallery-item" data-index="${i}" ${i === 0 && renderImgs.length > 1 ? `data-remaining="${renderImgs.length - 1}"` : ''}><img src="${img.image || img}" loading="lazy" alt="Screenshot" onerror="this.style.display='none'"></div>`
          ).join('');
          els.gallery.onclick = (e) => {
            const item = e.target.closest('.elevated-gallery-item');
            if (item && window.openGalleryLightbox) {
              window.openGalleryLightbox(renderImgs.map(i => ({ url: i.image || i, caption: '' })), parseInt(item.getAttribute('data-index') || '0', 10));
            }
          };
        }
      }
      
      // Social links
      const socialSec = document.getElementById('gameSocialSection');
      const socialGrid = document.getElementById('gameSocial');
      if (socialSec && socialGrid && (game.website || game.reddit_url)) {
        socialSec.hidden = false;
        let socialHtml = '';
        if (game.website) socialHtml += `<a href="${game.website}" target="_blank" class="elevated-social-link"><i class="fa-solid fa-globe"></i> Official Website</a>`;
        if (game.reddit_url) socialHtml += `<a href="${game.reddit_url}" target="_blank" class="elevated-social-link"><i class="fa-brands fa-reddit"></i> Reddit</a>`;
        socialGrid.innerHTML = socialHtml;
      }
      
    } catch (e) {
      console.error(e);
      if (els.desc && !els.desc.textContent) els.desc.textContent = 'Failed to load game details.';
      if (els.name && !els.name.textContent) els.name.textContent = 'Game Error';
    }
  }

  document.addEventListener('DOMContentLoaded', loadGame);
})();
