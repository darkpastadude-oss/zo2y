/* ============================================================
   ZO2Y COMMUNITY - MOBILE COMPRESSED VIEWPORT-FIRST SHELL
   ============================================================ */

(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', function() {
        const toggleBtn = document.getElementById('communitySearchToggleBtn');
        const searchWrap = document.getElementById('communitySearchBarWrap');

        if (toggleBtn && searchWrap) {
            toggleBtn.addEventListener('click', function() {
                toggleBtn.classList.toggle('active');
                searchWrap.classList.toggle('open');
            });
        }
    });
})();
