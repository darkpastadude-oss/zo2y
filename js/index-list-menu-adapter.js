/**
 * Adapter that connects the legacy initIndexStyleListMenu interface
 * to the new UnifiedLists component.
 */
(function () {
  let bridgeConfig = null;

  function init(conf) {
    if (!conf) return;
    bridgeConfig = conf;
    
    const mediaType = conf.mediaType;
    const itemIdAttr = conf.itemIdAttr || 'data-item-id';

    // Hook up all cards to the new UnifiedLists menu
    if (typeof document !== 'undefined') {
      const cards = document.querySelectorAll('.card');
      cards.forEach(card => {
        const menuBtn = card.querySelector('.menu-btn');
        if (menuBtn) {
          // Prevent multiple bindings
          if (menuBtn.dataset.unifiedBound) return;
          menuBtn.dataset.unifiedBound = 'true';
          
          menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const itemId = card.getAttribute(itemIdAttr) || card.dataset.id;
            if (itemId && window.UnifiedLists) {
              window.UnifiedLists.openMenu(menuBtn, itemId, mediaType);
            }
          });
        }
      });
    }
  }

  function openMenuFromCard(card) {
    if (!card || !bridgeConfig) return;
    const itemId = card.getAttribute(bridgeConfig.itemIdAttr || 'data-item-id') || card.dataset.id;
    const menuBtn = card.querySelector('.menu-btn') || card;
    if (itemId && window.UnifiedLists) {
      window.UnifiedLists.openMenu(menuBtn, itemId, bridgeConfig.mediaType);
    }
  }

  window.initIndexStyleListMenu = init;
  window.openIndexStyleListMenu = openMenuFromCard;
  window.openItemMenuFromCard = openMenuFromCard;

})();

