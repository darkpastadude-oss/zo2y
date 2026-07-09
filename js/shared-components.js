(() => {
  const SITE_NAME = 'Zo2y';
  const COPY_YEAR = 2026;

  const ITEM_MENU_MODAL_HTML = `
    <div id="itemMenuModal" class="menu-modal" aria-hidden="true">
      <div class="menu-modal-content">
        <div class="menu-modal-header">
          <h3 id="menuModalTitle">Add to List</h3>
          <button class="menu-modal-close" id="closeMenuModalBtn" aria-label="Close">&times;</button>
        </div>
        <div class="menu-modal-body" id="menuModalBody">
          <div class="menu-quick-lists" id="menuQuickLists"></div>
          <div class="menu-custom-section">
            <div class="menu-custom-header">
              <span>Your Custom Lists</span>
            </div>
            <div class="menu-custom-lists" id="menuCustomLists"></div>
          </div>
        </div>
      </div>
    </div>`;

  const TOAST_CONTAINER_HTML = `
    <div class="toast-container" id="toastContainer"></div>`;

  function ensureMenuModalStyles() {
    if (document.getElementById('zo2ySharedMenuModalStyle')) return;
    const style = document.createElement('style');
    style.id = 'zo2ySharedMenuModalStyle';
    style.textContent = `
      .menu-modal { display: none; }
      .menu-empty{text-align:center;padding:20px;color:var(--muted,#8ca3c7);font-size:14px;background:var(--card-2,#172b58);border-radius:12px;border:1px dashed var(--border,rgba(255,255,255,.12))}
    `;
    document.head.appendChild(style);
  }

  function injectItemMenuModal() {
    if (document.getElementById('itemMenuModal')) return;
    ensureMenuModalStyles();
    const modal = document.createElement('div');
    modal.innerHTML = ITEM_MENU_MODAL_HTML;
    document.body.appendChild(modal.firstElementChild);
  }

  function injectToastContainer() {
    if (document.getElementById('toastContainer')) return;
    const toast = document.createElement('div');
    toast.innerHTML = TOAST_CONTAINER_HTML;
    document.body.appendChild(toast.firstElementChild);
  }

  const LIGHTBOX_MODAL_HTML = `
    <div id="galleryLightbox" class="lightbox-modal" aria-hidden="true">
      <div class="lightbox-header">
        <button class="lightbox-close" id="lightboxCloseBtn" aria-label="Close lightbox">&times;</button>
      </div>
      <div class="lightbox-track" id="lightboxTrack"></div>
    </div>`;

  function injectLightboxModal() {
    if (document.getElementById('galleryLightbox')) return;
    const modal = document.createElement('div');
    modal.innerHTML = LIGHTBOX_MODAL_HTML;
    document.body.appendChild(modal.firstElementChild);

    const lightbox = document.getElementById('galleryLightbox');
    const closeBtn = document.getElementById('lightboxCloseBtn');
    if (closeBtn && lightbox) {
      closeBtn.addEventListener('click', () => {
        lightbox.classList.remove('active');
        lightbox.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      });
    }
  }

  window.openGalleryLightbox = function(images, startIndex = 0) {
    const lightbox = document.getElementById('galleryLightbox');
    const track = document.getElementById('lightboxTrack');
    if (!lightbox || !track || !images || !images.length) return;

    track.innerHTML = images.map(img => `
      <div class="lightbox-slide">
        <img src="${img.url || img.src || img}" alt="Gallery image">
        ${img.caption ? `<div class="lightbox-slide-caption">${img.caption}</div>` : ''}
      </div>
    `).join('');

    lightbox.classList.add('active');
    lightbox.removeAttribute('aria-hidden');
    document.body.style.overflow = 'hidden';

    // Scroll to the selected image
    setTimeout(() => {
      const slides = track.querySelectorAll('.lightbox-slide');
      if (slides[startIndex]) {
        slides[startIndex].scrollIntoView({ behavior: 'instant', block: 'nearest', inline: 'start' });
      }
    }, 10);
  };

  function init() {
    const path = location.pathname;
    const isAuthPage = /\/(sign-up|login|auth-callback|onboarding|update-password|clear-auth)(\.html)?\/?$/.test(path);
    if (!isAuthPage) injectFooter();
    injectItemMenuModal();
    injectToastContainer();
    injectLightboxModal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.Zo2ySharedComponents = { injectFooter, injectItemMenuModal, injectToastContainer, injectLightboxModal };
})();
