/* =========================================================
   js/interaction-manager.js
   Unified interaction manager for Zo2y applications.
   Standardizes click/press and Pointer Events API drag logic.
   ========================================================= */

(() => {
  'use strict';

  const InteractionManager = {
    /**
     * Bind a clean single press / click event to an element.
     * @param {HTMLElement|string} elementOrId
     * @param {Function} handler
     */
    onPress(elementOrId, handler) {
      const el = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
      if (!el || typeof handler !== 'function') return;
      el.addEventListener('click', (e) => {
        handler(e);
      });
    },

    /**
     * Bind pointer-based drag interaction (Pointer Events API).
     * @param {HTMLElement|string} elementOrId
     * @param {Object} callbacks - { onStart, onMove, onEnd }
     */
    onDrag(elementOrId, { onStart, onMove, onEnd } = {}) {
      const el = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
      if (!el) return;

      const handlePointerDown = (e) => {
        if (e.button !== undefined && e.button !== 0) return;
        if (onStart && onStart(e) === false) return;

        if (el.setPointerCapture && e.pointerId !== undefined) {
          try { el.setPointerCapture(e.pointerId); } catch (_) {}
        }

        const handlePointerMove = (evt) => {
          if (onMove) onMove(evt);
        };

        const handlePointerUp = (evt) => {
          if (el.releasePointerCapture && evt.pointerId !== undefined) {
            try { el.releasePointerCapture(evt.pointerId); } catch (_) {}
          }
          window.removeEventListener('pointermove', handlePointerMove);
          window.removeEventListener('pointerup', handlePointerUp);
          window.removeEventListener('pointercancel', handlePointerUp);
          if (onEnd) onEnd(evt);
        };

        window.addEventListener('pointermove', handlePointerMove, { passive: false });
        window.addEventListener('pointerup', handlePointerUp);
        window.addEventListener('pointercancel', handlePointerUp);
      };

      el.addEventListener('pointerdown', handlePointerDown);
    }
  };

  window.InteractionManager = InteractionManager;
})();
