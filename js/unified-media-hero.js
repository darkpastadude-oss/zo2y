// js/unified-media-hero.js
(() => {
  const TYPE_ICONS = {
    rating: 'fa-solid fa-star',
    year: 'fa-solid fa-calendar',
    platform: 'fa-solid fa-gamepad',
    developer: 'fa-solid fa-building',
    runtime: 'fa-solid fa-clock',
    genre: 'fa-solid fa-tags',
    director: 'fa-solid fa-video',
    network: 'fa-solid fa-tv',
    episodes: 'fa-solid fa-list-ol'
  };

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function renderUnifiedMediaHero(container, config) {
    if (!container || !config) return;

    const {
      type = 'media',
      title = 'Unknown Title',
      posterUrl = '',
      backdropUrl = '',
      description = '',
      posterFit = '',
      metadata = [],
      actions = []
    } = config;

    const metaHtml = metadata.filter(m => m && m.value).map(m => {
      const icon = TYPE_ICONS[m.type] || 'fa-solid fa-circle-info';
      return `<span class="umh-meta-chip"><i class="${icon}"></i> ${escapeHtml(m.value)}</span>`;
    }).join('');

    const actionsHtml = actions.map(act => {
      const isPrimary = act.primary ? 'primary' : '';
      const tag = act.href ? 'a' : 'button';
      const hrefAttr = act.href ? `href="${escapeHtml(act.href)}" target="_blank" rel="noopener"` : '';
      const idAttr = act.id ? `id="${escapeHtml(act.id)}"` : '';
      const onclickAttr = act.onclick ? `onclick="${escapeHtml(act.onclick)}"` : '';
      return `<${tag} ${idAttr} class="umh-btn ${isPrimary}" ${hrefAttr} ${onclickAttr}>
        ${act.icon ? `<i class="${escapeHtml(act.icon)}"></i>` : ''}
        <span>${escapeHtml(act.label)}</span>
      </${tag}>`;
    }).join('');

    const hasPoster = !!posterUrl;
    const frameClass = hasPoster ? 'umh-poster-frame is-missing' : 'umh-poster-frame is-missing';

    const html = `
      <div class="umh-container ${backdropUrl ? '' : 'is-loaded'}">
        <div class="umh-backdrop-wrap">
          <div class="umh-backdrop" style="background-image: url('${escapeHtml(backdropUrl)}')"></div>
          <div class="umh-backdrop-overlay"></div>
        </div>
        <div class="umh-content-wrapper">
          <div class="umh-poster-frame ${posterUrl ? 'is-missing' : ''}">
            ${posterUrl ? `
              <img class="umh-poster ${posterFit === 'contain' ? 'umh-poster-contain' : ''}" src="${escapeHtml(posterUrl)}" alt="${escapeHtml(title)} poster" loading="eager" onload="this.closest('.umh-poster-frame').classList.remove('is-missing')" onerror="this.style.display='none'; this.closest('.umh-poster-frame').classList.add('is-missing')">
            ` : ''}
            <div class="umh-poster-fallback">
              <i class="fa-solid fa-image fa-2x"></i>
              <span>No Poster</span>
            </div>
          </div>
          
          <div class="umh-title-meta">
            <h1 class="umh-title">${escapeHtml(title)}</h1>
            <div class="umh-meta-row">${metaHtml}</div>
          </div>

          <div class="umh-actions-desc">
            <div class="umh-actions-bar">${actionsHtml}</div>
            
            ${description ? `
            <div class="umh-description-wrap">
              <div class="umh-description is-clamped" id="umhDesc">${escapeHtml(description)}</div>
              <button class="umh-readmore" onclick="const d = document.getElementById('umhDesc'); d.classList.toggle('is-clamped'); this.querySelector('i').classList.toggle('fa-chevron-down'); this.querySelector('i').classList.toggle('fa-chevron-up'); this.querySelector('span').textContent = d.classList.contains('is-clamped') ? 'read more' : 'read less';">
                <span>read more</span>
                <i class="fa-solid fa-chevron-down"></i>
              </button>
            </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;

    if (backdropUrl) {
      const img = new Image();
      img.onload = () => {
        const wrap = container.querySelector('.umh-container');
        if (wrap) wrap.classList.add('is-loaded');
      };
      img.onerror = () => {
        const wrap = container.querySelector('.umh-container');
        if (wrap) wrap.classList.add('is-loaded');
      };
      img.src = backdropUrl;
    }
  }

  window.renderUnifiedMediaHero = renderUnifiedMediaHero;
})();
