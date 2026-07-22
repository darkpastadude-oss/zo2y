/* === SKELETON LOADING HTML GENERATORS === */
/* Shared utility: call Skel.* to get skeleton HTML strings. */

window.Skel = (() => {

  function posterCard(extraClass = '') {
    return `<article class="card skel-card ${extraClass}">
      <div class="card-media skel-media">
        <div class="skel skel-poster-fill"></div>
      </div>
      <div class="card-meta skel-meta">
        <span class="card-type"><span class="skel skel-badge"></span></span>
        <div class="card-meta-top">
          <p class="card-name"><span class="skel skel-line skel-line-lg" style="margin:0"></span></p>
          <div class="card-menu-wrap"><span class="skel skel-btn-icon"></span></div>
        </div>
        <p class="card-sub"><span class="skel skel-line skel-line-sm" style="margin:0"></span></p>
        <p class="card-extra"><span class="skel skel-line skel-line-md" style="margin:0"></span></p>
      </div>
    </article>`;
  }

  function squareCard(extraClass = '') {
    return `<article class="card skel-card ${extraClass}">
      <div class="card-media skel-media" style="aspect-ratio:1/1">
        <div class="skel skel-poster-fill"></div>
      </div>
      <div class="card-meta skel-meta">
        <span class="card-type"><span class="skel skel-badge"></span></span>
        <div class="card-meta-top">
          <p class="card-name"><span class="skel skel-line skel-line-lg" style="margin:0"></span></p>
          <div class="card-menu-wrap"><span class="skel skel-btn-icon"></span></div>
        </div>
        <p class="card-sub"><span class="skel skel-line skel-line-sm" style="margin:0"></span></p>
      </div>
    </article>`;
  }

  function rail(count = 6, opts = {}) {
    const cls = opts.mobile ? 'skel-rail-mobile' : 'skel-rail';
    const inner = Array(count).fill(posterCard()).join('');
    return `<div class="${cls}">${inner}</div>`;
  }

  function grid(count = 8, cols = 4) {
    return Array(count).fill(posterCard()).join('');
  }

  function collectionItem() {
    return `<div class="skel-collection-item">
      <div class="skel skel-poster" style="flex:0 0 60px;width:60px;height:90px;aspect-ratio:auto"></div>
      <div class="skel-text">
        <div class="skel skel-line skel-line-lg"></div>
        <div class="skel skel-line skel-line-md"></div>
        <div class="skel skel-line skel-line-sm"></div>
      </div>
    </div>`;
  }

  function collectionList(count = 4) {
    return Array(count).fill(collectionItem()).join('');
  }

  function spotlight() {
    return `<div class="skel-spotlight">
      <div class="skel skel-backdrop"></div>
      <div class="skel-content">
        <div class="skel skel-kicker"></div>
        <div class="skel skel-title"></div>
        <div class="skel skel-line skel-line-lg" style="width:80%;height:14px"></div>
        <div class="skel skel-line skel-line-md" style="width:50%;height:14px"></div>
        <div class="skel-buttons">
          <div class="skel skel-btn"></div>
          <div class="skel skel-btn"></div>
        </div>
      </div>
    </div>`;
  }

  function reviewCard() {
    return `<div class="skel-review">
      <div class="skel-review-header">
        <div class="skel skel-review-avatar skel-circle"></div>
        <div class="skel skel-review-name"></div>
      </div>
      <div class="skel-review-stars">
        <div class="skel skel-review-star"></div>
        <div class="skel skel-review-star"></div>
        <div class="skel skel-review-star"></div>
        <div class="skel skel-review-star"></div>
        <div class="skel skel-review-star"></div>
      </div>
      <div class="skel-review-text">
        <div class="skel skel-line skel-line-full"></div>
        <div class="skel skel-line skel-line-lg"></div>
        <div class="skel skel-line skel-line-md"></div>
      </div>
    </div>`;
  }

  function reviewList(count = 3) {
    return Array(count).fill(reviewCard()).join('');
  }

  function chips(count = 4) {
    const inner = Array(count).fill('<div class="skel skel-chip"></div>').join('');
    return `<div class="skel-chips">${inner}</div>`;
  }

  function settingsList(count = 6) {
    const rows = Array(count).fill(`<div class="skel-settings-row">
      <div class="skel skel-icon skel-circle"></div>
      <div class="skel skel-label"></div>
      <div class="skel skel-toggle"></div>
    </div>`).join('');
    return `<div class="skel-settings-list">${rows}</div>`;
  }

  function showcaseRail(count = 8) {
    const cards = Array(count).fill(`<div class="skel-card-poster" style="flex:0 0 80px">
      <div class="skel skel-poster" style="height:120px;aspect-ratio:auto"></div>
      <div class="skel-meta">
        <div class="skel skel-line skel-line-md"></div>
      </div>
    </div>`).join('');
    return `<div class="skel-showcase-rail">${cards}</div>`;
  }

  function sportsGrid(count = 8) {
    const cards = Array(count).fill(`<div class="skel-sports-card">
      <div class="skel skel-circle" style="width:64px;height:64px"></div>
      <div class="skel skel-line skel-line-md" style="width:80%"></div>
    </div>`).join('');
    return `<div class="skel-sports-grid">${cards}</div>`;
  }

  function brandGrid(count = 8) {
    const cards = Array(count).fill(`<div class="skel-brand-card">
      <div class="skel skel-square" style="width:80px;height:80px;border-radius:12px"></div>
      <div class="skel skel-line skel-line-md" style="width:70%"></div>
      <div class="skel skel-line skel-line-sm" style="width:50%"></div>
    </div>`).join('');
    return `<div class="skel-sports-grid">${cards}</div>`;
  }

  function detailPage() {
    return `<div style="display:flex;gap:24px;padding:40px 20px;max-width:1200px;margin:0 auto">
      <div class="skel skel-poster" style="flex:0 0 280px;width:280px;aspect-ratio:auto;height:420px;border-radius:14px"></div>
      <div style="flex:1;display:flex;flex-direction:column;gap:12px;padding-top:20px">
        <div class="skel skel-line" style="width:40%;height:16px"></div>
        <div class="skel skel-line skel-line-lg" style="height:32px"></div>
        <div class="skel skel-line skel-line-md" style="height:14px"></div>
        <div class="skel skel-line skel-line-full" style="height:12px"></div>
        <div class="skel skel-line skel-line-lg" style="height:12px"></div>
        <div class="skel skel-line skel-line-md" style="height:12px"></div>
        <div style="display:flex;gap:10px;margin-top:16px">
          <div class="skel" style="width:140px;height:42px;border-radius:8px"></div>
          <div class="skel" style="width:140px;height:42px;border-radius:8px"></div>
        </div>
      </div>
    </div>`;
  }

  return {
    posterCard, squareCard, rail, grid, collectionItem, collectionList,
    spotlight, reviewCard, reviewList, chips, settingsList, showcaseRail,
    sportsGrid, brandGrid, detailPage
  };

})();
