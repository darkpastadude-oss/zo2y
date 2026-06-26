(() => {
  const SITE_NAME = 'Zo2y';
  const COPY_YEAR = 2026;

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

  function injectFooter() {
    if (document.querySelector('.zo2y-footer')) return;
    const footer = document.createElement('div');
    footer.innerHTML = FOOTER_HTML;
    document.body.appendChild(footer.firstElementChild);
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
    injectFooter();
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

/* ── description truncation utility ─────────────────────────────── */
(() => {
  if (window.setupDescriptionTruncation) return;

  /**
   * 3-line rule: if description is 4+ rendered lines → show "Read more".
   * Otherwise → hide it.  Re-checks on font load, resize, and mutation.
   */
  window.setupDescriptionTruncation = function (opts) {
    const {
      desc,
      toggle,
      wrap = null,
      collapsedLabel = 'read more',
      expandedLabel = 'show less'
    } = opts || {};

    if (!desc || !toggle) return function () {};

    const labelEl =
      toggle.querySelector('.elevated-readmore-label') ||
      toggle.querySelector('span');

    let isExpanded = false;

    /* ── core measurement ── */
    const measure = () => {
      if (isExpanded) {
        desc.classList.remove('is-clamped');
        if (wrap) wrap.classList.remove('is-clamped');
        toggle.hidden = false;
        if (labelEl) labelEl.textContent = expandedLabel;
        toggle.setAttribute('aria-expanded', 'true');
        return;
      }

      /* Remove clamp so we see the full content */
      desc.classList.remove('is-clamped');
      if (wrap) wrap.classList.remove('is-clamped');
      void desc.offsetHeight;

      /* Compute line-height from computed style */
      const cs = window.getComputedStyle(desc);
      const lineHeight = parseFloat(cs.lineHeight) ||
        (parseFloat(cs.fontSize) * 1.5);
      const maxLines = 3;

      const naturalHeight = desc.scrollHeight;
      const truncated = naturalHeight > lineHeight * maxLines + 1;

      if (truncated) {
        desc.classList.add('is-clamped');
        if (wrap) wrap.classList.add('is-clamped');
        toggle.hidden = false;
        if (labelEl) labelEl.textContent = collapsedLabel;
        toggle.setAttribute('aria-expanded', 'false');
      } else {
        desc.classList.remove('is-clamped');
        if (wrap) wrap.classList.remove('is-clamped');
        toggle.hidden = true;
      }
    };

    /* ── scheduled measurements at increasing delays ── */
    const scheduleChecks = () => {
      requestAnimationFrame(() => requestAnimationFrame(measure));
      setTimeout(measure, 0);
      setTimeout(measure, 150);
      setTimeout(measure, 400);
      setTimeout(measure, 800);
      setTimeout(measure, 1500);
    };

    /* Wait for fonts then kick off checks */
    const fontsReady = document.fonts && document.fonts.ready
      ? document.fonts.ready
      : Promise.resolve();
    fontsReady.then(scheduleChecks);

    /* ── resize handling ── */
    let resizeRaf = 0;
    const onResize = () => {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(measure);
    };
    window.addEventListener('resize', onResize);

    /* ── ResizeObserver (fires when desc content changes size) ── */
    let ro = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(onResize);
      ro.observe(desc);
    }

    /* ── MutationObserver (fires when desc text content changes) ── */
    let mo = null;
    if (typeof MutationObserver !== 'undefined') {
      mo = new MutationObserver(() => {
        requestAnimationFrame(measure);
      });
      mo.observe(desc, { childList: true, characterData: true, subtree: true });
    }

    /* ── toggle click ── */
    const onClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      isExpanded = !isExpanded;
      measure();
    };
    toggle.addEventListener('click', onClick);

    return function cleanup() {
      cancelAnimationFrame(resizeRaf);
      window.removeEventListener('resize', onResize);
      if (ro) ro.disconnect();
      if (mo) mo.disconnect();
      toggle.removeEventListener('click', onClick);
    };
  };
})();
