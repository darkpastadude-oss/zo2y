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
    <div id="itemMenuModal" class="menu-modal authenticated-only" aria-hidden="true">
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

  function injectFooter() {
    if (document.querySelector('.zo2y-footer')) return;
    const footer = document.createElement('div');
    footer.innerHTML = FOOTER_HTML;
    document.body.appendChild(footer.firstElementChild);
  }

  function injectItemMenuModal() {
    if (document.getElementById('itemMenuModal')) return;
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

  function init() {
    injectFooter();
    injectItemMenuModal();
    injectToastContainer();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.Zo2ySharedComponents = { injectFooter, injectItemMenuModal, injectToastContainer };
})();
