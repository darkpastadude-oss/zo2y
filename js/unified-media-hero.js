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
      typeLabel = 'Spotlight',
      title = 'Unknown Title',
      posterUrl = '',
      backdropUrl = '',
      description = '',
      metadata = [],
      actions = []
    } = config;

    let typeIcon = 'fa-solid fa-star';
    if (type === 'game') typeIcon = 'fa-solid fa-gamepad';
    if (type === 'movie') typeIcon = 'fa-solid fa-film';
    if (type === 'tv') typeIcon = 'fa-solid fa-tv';

    const kickerHtml = `
      <span class="umh-kicker">
        <i class="${typeIcon}"></i>
        ${escapeHtml(typeLabel)}
      </span>
    `;

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

    const html = `
      <div class="umh-container">
        <div class="umh-backdrop-wrap">
          <div class="umh-backdrop" style="background-image: url('${escapeHtml(backdropUrl)}')"></div>
          <div class="umh-backdrop-overlay"></div>
        </div>
        <div class="umh-content-wrapper">
          <div class="umh-poster-frame">
            <img class="umh-poster" src="${escapeHtml(posterUrl)}" alt="${escapeHtml(title)} poster" loading="eager" onerror="this.style.display='none'">
            <div class="umh-poster-fallback">
              <i class="fa-solid fa-image fa-2x"></i>
              <span>No Poster</span>
            </div>
          </div>
          <div class="umh-info">
            ${kickerHtml}
            <h1 class="umh-title">${escapeHtml(title)}</h1>
            <div class="umh-meta-row">${metaHtml}</div>
            <div class="umh-actions-bar">${actionsHtml}</div>
            <div class="umh-description">${escapeHtml(description)}</div>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  window.renderUnifiedMediaHero = renderUnifiedMediaHero;
})();
