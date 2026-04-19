(() => {
  const STORAGE_KEY = 'zo2y_home_explore_tab_v1';
  const TAB_ATTR = 'data-explore-tab';
  const PANEL_ATTR = 'data-explore-panel';

  function getStoredTab() {
    try {
      const raw = String(localStorage.getItem(STORAGE_KEY) || '').trim().toLowerCase();
      return raw === 'lifestyle' ? 'lifestyle' : (raw === 'media' ? 'media' : '');
    } catch (_err) {
      return '';
    }
  }

  function setStoredTab(value) {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch (_err) {}
  }

  function setActiveTab(root, tabKey, options = {}) {
    const key = String(tabKey || '').trim().toLowerCase();
    if (key !== 'media' && key !== 'lifestyle') return;

    const tabs = Array.from(root.querySelectorAll(`[${TAB_ATTR}]`));
    const panels = Array.from(root.querySelectorAll(`[${PANEL_ATTR}]`));
    if (!tabs.length || !panels.length) return;

    tabs.forEach((tab) => {
      const tabValue = String(tab.getAttribute(TAB_ATTR) || '').trim().toLowerCase();
      const isActive = tabValue === key;
      tab.classList.toggle('is-active', isActive);
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
      if (isActive && options.focus === true) {
        try {
          tab.focus({ preventScroll: true });
        } catch (_err) {
          tab.focus();
        }
      }
    });

    panels.forEach((panel) => {
      const panelValue = String(panel.getAttribute(PANEL_ATTR) || '').trim().toLowerCase();
      const isActive = panelValue === key;
      panel.classList.toggle('is-active', isActive);
      panel.toggleAttribute('hidden', !isActive);
    });

    setStoredTab(key);
  }

  function init() {
    const root = document.querySelector('.explore');
    if (!root) return;

    const preferred = getStoredTab();
    if (preferred) setActiveTab(root, preferred);
    else {
      const activeTab = root.querySelector(`.explore-tab.is-active[${TAB_ATTR}]`);
      const activeKey = String(activeTab?.getAttribute(TAB_ATTR) || '').trim().toLowerCase();
      if (activeKey) setStoredTab(activeKey);
    }

    root.querySelectorAll(`.explore-tab[${TAB_ATTR}]`).forEach((btn) => {
      btn.addEventListener('click', () => {
        setActiveTab(root, btn.getAttribute(TAB_ATTR) || '');
      });

      btn.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        const tabs = Array.from(root.querySelectorAll(`.explore-tab[${TAB_ATTR}]`));
        if (!tabs.length) return;
        const index = Math.max(0, tabs.indexOf(btn));
        const dir = e.key === 'ArrowRight' ? 1 : -1;
        const next = tabs[(index + dir + tabs.length) % tabs.length];
        if (!next) return;
        e.preventDefault();
        setActiveTab(root, next.getAttribute(TAB_ATTR) || '', { focus: true });
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();

