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

  function ensureMenuModalStyles() {
    if (document.getElementById('zo2ySharedMenuModalStyle')) return;
    const style = document.createElement('style');
    style.id = 'zo2ySharedMenuModalStyle';
    style.textContent = `
      .menu-modal{display:none;position:fixed;z-index:10000;top:0;left:0;width:100dvw;height:100dvh;background:rgba(0,0,0,.75);backdrop-filter:blur(5px);padding:0;align-items:center;justify-content:center}
      .menu-modal.active{display:flex}
      .menu-modal-content{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:var(--card,#132347);border:1px solid var(--border,rgba(255,255,255,.12));border-radius:20px;width:100%;max-width:380px;max-height:80vh;overflow-y:auto;box-shadow:0 12px 34px rgba(0,0,0,.28)}
      .menu-modal-header{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid var(--border,rgba(255,255,255,.12))}
      .menu-modal-header h3{font-size:18px;font-weight:600;color:var(--white,#fff);margin:0}
      .menu-modal-close{background:transparent;border:none;color:var(--muted,#8ca3c7);font-size:24px;cursor:pointer;width:32px;height:32px;display:inline-flex;align-items:center;justify-content:center;border-radius:8px;transition:all .2s}
      .menu-modal-close:hover{background:rgba(255,255,255,.1);color:var(--white,#fff)}
      .menu-modal-body{padding:16px 20px}
      .menu-quick-lists{display:flex;flex-direction:column;gap:8px;margin-bottom:20px}
      .menu-quick-item{display:flex;align-items:center;justify-content:space-between;width:100%;padding:12px 16px;background:var(--card-2,#172b58);border:1px solid var(--border,rgba(255,255,255,.12));border-radius:12px;color:var(--text,#fff);cursor:pointer;font:inherit;text-align:left;appearance:none;-webkit-appearance:none;min-height:48px;touch-action:manipulation;-webkit-tap-highlight-color:transparent;user-select:none;position:relative;overflow:hidden;transition:background-color .18s,border-color .18s,transform .12s,box-shadow .18s,opacity .18s;will-change:transform}
      .menu-quick-item:hover{border-color:var(--accent,#f59e0b);background:rgba(245,158,11,.1)}
      .menu-quick-item:active{transform:scale(.985)}
      .menu-quick-item.active{border-color:var(--accent,#f59e0b);background:rgba(245,158,11,.15)}
      .menu-quick-item[aria-busy=true]{opacity:.72;pointer-events:none}
      .menu-quick-left{display:flex;align-items:center;gap:12px}
      .menu-quick-left i{width:20px;color:var(--accent,#f59e0b)}
      .menu-quick-left span{font-weight:500;color:var(--white,#fff)}
      .menu-quick-state{color:var(--accent,#f59e0b);font-size:13px;font-weight:600;transition:transform .18s,opacity .18s}
      .menu-custom-section{border-top:1px solid var(--border,rgba(255,255,255,.12));padding-top:16px}
      .menu-custom-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;color:var(--muted,#8ca3c7);font-size:14px}
      .menu-custom-lists{display:flex;flex-direction:column;gap:8px;max-height:200px;overflow-y:auto}
      .menu-custom-item{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:var(--card-2,#172b58);border:1px solid var(--border,rgba(255,255,255,.12));border-radius:10px;cursor:pointer;transition:all .2s}
      .menu-custom-item:hover{border-color:var(--accent,#f59e0b)}
      .menu-custom-item.active{border-color:var(--accent,#f59e0b);background:rgba(245,158,11,.1)}
      .menu-custom-left{display:flex;align-items:center;gap:10px}
      .menu-custom-left i{width:18px;color:var(--accent,#f59e0b);font-size:14px}
      .menu-custom-left span{font-size:14px;color:var(--white,#fff)}
      .menu-custom-state{color:var(--accent,#f59e0b);font-size:12px;font-weight:600}
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
