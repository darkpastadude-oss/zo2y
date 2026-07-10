(() => {
  const SITE_NAME = 'Zo2y';
  const COPY_YEAR = 2026;

  const TOAST_CONTAINER_HTML = `
    <div class="toast-container" id="toastContainer"></div>`;

  const FOOTER_HTML = `
    <footer class="zo2y-footer">
      <div class="zo2y-footer-inner">
        <span class="zo2y-footer-brand">&copy; ${COPY_YEAR} ${SITE_NAME}</span>
        <nav class="zo2y-footer-links" aria-label="Legal">
          <a href="privacy.html">Privacy</a>
          <a href="terms.html">Terms</a>
          <a href="cookies.html">Cookies</a>
          <a href="data.html">Your data</a>
          <a href="dmca.html">DMCA</a>
          <a href="support.html">Support</a>
          <a href="credits.html">Credits</a>
        </nav>
      </div>
    </footer>`;

  function injectFooter() {
    if (document.querySelector('.zo2y-footer')) return;
    const footer = document.createElement('div');
    footer.innerHTML = FOOTER_HTML;
    document.body.appendChild(footer.firstElementChild);
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
    const isProfilePage = /\/profile(\.html)?\/?$/.test(path);
    const isLandingPage = path === '/' || path === '' || /\/index(\.html)?\/?$/.test(path);

    if (!isAuthPage && !isProfilePage && !isLandingPage) {
      injectFooter();
    }
    
    injectToastContainer();
    injectLightboxModal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.Zo2ySharedComponents = { injectFooter, injectToastContainer, injectLightboxModal };
})();
