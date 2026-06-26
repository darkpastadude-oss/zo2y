(() => {
  if (window.setupDescriptionTruncation) return;

  /**
   * Sets up visual-overflow detection for a clamped description element.
   *
   * @param {Object} opts
   * @param {HTMLElement} opts.desc      - The description <p> / <div> (gets .is-clamped)
   * @param {HTMLElement} opts.toggle    - The read-more button
   * @param {HTMLElement} [opts.wrap]    - Optional wrapper that also gets .is-clamped
   * @param {string} [opts.collapsedLabel] - Text when collapsed (default "read more")
   * @param {string} [opts.expandedLabel]  - Text when expanded  (default "show less")
   * @returns {Function} cleanup - call to remove listeners
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

    /* ---------- measurement ---------- */

    const measure = () => {
      if (isExpanded) {
        desc.classList.remove('is-clamped');
        if (wrap) wrap.classList.remove('is-clamped');
        toggle.hidden = false;
        if (labelEl) labelEl.textContent = expandedLabel;
        toggle.setAttribute('aria-expanded', 'true');
        return;
      }

      desc.classList.add('is-clamped');
      if (wrap) wrap.classList.add('is-clamped');
      void desc.offsetHeight;
      const clampedHeight = desc.clientHeight;

      desc.classList.remove('is-clamped');
      if (wrap) wrap.classList.remove('is-clamped');
      void desc.offsetHeight;
      const naturalHeight = desc.scrollHeight;

      const truncated = naturalHeight > clampedHeight + 2;

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

    /* ---------- initial measurement (fonts + layout settled) ---------- */

    const fontsReady = document.fonts && document.fonts.ready
      ? document.fonts.ready
      : Promise.resolve();

    fontsReady.then(() => {
      requestAnimationFrame(() => requestAnimationFrame(measure));
    });

    /* ---------- resize handling ---------- */

    let resizeRaf = 0;
    const onResize = () => {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(measure);
    };
    window.addEventListener('resize', onResize);

    let ro = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(onResize);
      ro.observe(desc);
    }

    /* ---------- toggle click ---------- */

    const onClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      isExpanded = !isExpanded;
      measure();
    };
    toggle.addEventListener('click', onClick);

    /* ---------- cleanup ---------- */

    return function cleanup() {
      cancelAnimationFrame(resizeRaf);
      window.removeEventListener('resize', onResize);
      if (ro) ro.disconnect();
      toggle.removeEventListener('click', onClick);
    };
  };
})();
