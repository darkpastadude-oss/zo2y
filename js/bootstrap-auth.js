// Bootstrap script to restore auth session before app UI renders
(function bootstrapAuth() {
  // Initialize boot state
  if (typeof window !== 'undefined') {
    window.__AUTH_READY = false;
    window.__ZO2Y_AUTH_STATE = null; // null = loading, true = authenticated, false = not authenticated
  }

  var overlay = document.getElementById('authBootstrapOverlay');
  function revealAppRoot() {
    try {
      var appRoot = document.getElementById('appRoot');
      if (appRoot) appRoot.style.display = '';
    } catch (_err) {}
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('zo2y-auth-ready', function () {
      revealAppRoot();
    });
  }

   async function run() {
     var revealTimer = setTimeout(function () {
       window.__ZO2Y_AUTH_STATE = window.__ZO2Y_AUTH_STATE || null;
       window.__AUTH_READY = true;
       revealAppRoot();
       try {
         if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
       } catch (_e) {}
     }, 4000);
     if (typeof window.__ZO2Y_BOOTSTRAP_RESTORE_SESSION === 'function') {
       try {
         // Check if user intentionally logged out - if so, don't restore session
         try {
           if (sessionStorage.getItem('zo2y-intentional-logout') === 'true') {
             // Clear the intentional logout flag and return null session
             sessionStorage.removeItem('zo2y-intentional-logout');
             clearTimeout(revealTimer);
             window.__ZO2Y_AUTH_STATE = false;
             window.__AUTH_READY = true;
             revealAppRoot();
             try {
               if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
             } catch (_e) {}
             try {
               var evt = new Event('zo2y-auth-ready');
               window.dispatchEvent(evt);
             } catch (_e2) {}
             return; // Exit early to prevent session restoration
           }
         } catch (_e) {}
         
         var session = await window.__ZO2Y_BOOTSTRAP_RESTORE_SESSION();
         clearTimeout(revealTimer);
         if (session && session.access_token) {
           window.__ZO2Y_AUTH_STATE = true;
         } else {
           window.__ZO2Y_AUTH_STATE = false;
         }
       } catch (_err) {
         clearTimeout(revealTimer);
         window.__ZO2Y_AUTH_STATE = false;
       }
     } else {
       clearTimeout(revealTimer);
       window.__ZO2Y_AUTH_STATE = null;
     }
     window.__AUTH_READY = true;
     revealAppRoot();
     try {
       var evt = new Event('zo2y-auth-ready');
       window.dispatchEvent(evt);
     } catch (_e2) {}
   }
      } catch (_err) {
        clearTimeout(revealTimer);
        window.__ZO2Y_AUTH_STATE = false;
      }
    } else {
      clearTimeout(revealTimer);
      window.__ZO2Y_AUTH_STATE = null;
    }
    window.__AUTH_READY = true;
    revealAppRoot();
    try {
      if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    } catch (_e) {}
    try {
      var evt = new Event('zo2y-auth-ready');
      window.dispatchEvent(evt);
    } catch (_e2) {}
  }
  run();
})();

