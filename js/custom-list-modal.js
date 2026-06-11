(function () {
  'use strict';

  var STYLE_ID = 'zo2yCustomListModalStyle';
  var SIGN_IN_PROMPT_ID = 'zo2ySignInPromptModal';

  var SIGN_IN_HTML = '<div class="zo2y-signin-prompt-content">'
    + '<div class="zo2y-signin-prompt-header">'
    + '<i class="fa-solid fa-lock"></i>'
    + '<h3>Sign in required</h3>'
    + '</div>'
    + '<p>Sign in or create an account to save items to lists and build your collection.</p>'
    + '<div class="zo2y-signin-prompt-actions">'
    + '<a class="zo2y-signin-btn-primary" href="login.html">Log in</a>'
    + '<a class="zo2y-signin-btn-secondary" href="sign-up.html">Sign up</a>'
    + '</div>'
    + '<button class="zo2y-signin-prompt-close" type="button" aria-label="Close">&times;</button>'
    + '</div>';

  function ensureStyles() {
    if (typeof document === 'undefined') return;
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent =
      '#' + SIGN_IN_PROMPT_ID + ' {'
      + 'display: none;'
      + 'position: fixed;'
      + 'z-index: 10001;'
      + 'top: 0; left: 0; right: 0; bottom: 0;'
      + 'background: rgba(0, 0, 0, 0.7);'
      + 'backdrop-filter: blur(6px);'
      + '-webkit-backdrop-filter: blur(6px);'
      + 'align-items: center;'
      + 'justify-content: center;'
      + 'padding: 20px;'
      + '}'
      + '#' + SIGN_IN_PROMPT_ID + '.active { display: flex; }'
      + '.zo2y-signin-prompt-content {'
      + 'position: relative;'
      + 'background: var(--card, #132347);'
      + 'border: 1px solid var(--border, rgba(255,255,255,0.12));'
      + 'border-radius: 18px;'
      + 'padding: 32px 28px;'
      + 'max-width: 360px;'
      + 'width: 100%;'
      + 'text-align: center;'
      + 'box-shadow: 0 16px 48px rgba(0,0,0,0.35);'
      + 'animation: zo2ySignInFlyUp 0.25s cubic-bezier(0.22, 1, 0.36, 1);'
      + '}'
      + '@keyframes zo2ySignInFlyUp {'
      + 'from { opacity: 0; transform: translateY(20px) scale(0.97); }'
      + 'to { opacity: 1; transform: translateY(0) scale(1); }'
      + '}'
      + '.zo2y-signin-prompt-header {'
      + 'margin-bottom: 14px;'
      + '}'
      + '.zo2y-signin-prompt-header i {'
      + 'font-size: 32px;'
      + 'color: var(--accent, #f59e0b);'
      + 'margin-bottom: 10px;'
      + 'display: block;'
      + '}'
      + '.zo2y-signin-prompt-header h3 {'
      + 'font-size: 20px;'
      + 'font-weight: 700;'
      + 'color: var(--white, #fff);'
      + 'margin: 0;'
      + '}'
      + '.zo2y-signin-prompt-content > p {'
      + 'font-size: 14px;'
      + 'color: var(--muted, #8ca3c7);'
      + 'line-height: 1.5;'
      + 'margin: 0 0 20px;'
      + '}'
      + '.zo2y-signin-prompt-actions {'
      + 'display: flex;'
      + 'gap: 10px;'
      + 'justify-content: center;'
      + '}'
      + '.zo2y-signin-btn-primary,'
      + '.zo2y-signin-btn-secondary {'
      + 'display: inline-flex;'
      + 'align-items: center;'
      + 'justify-content: center;'
      + 'padding: 10px 22px;'
      + 'border-radius: 10px;'
      + 'font-size: 14px;'
      + 'font-weight: 600;'
      + 'text-decoration: none;'
      + 'cursor: pointer;'
      + 'transition: all 0.2s ease;'
      + 'border: 1px solid transparent;'
      + '}'
      + '.zo2y-signin-btn-primary {'
      + 'background: var(--gradient, linear-gradient(135deg, #f59e0b, #ffb84d));'
      + 'color: #0b1633;'
      + '}'
      + '.zo2y-signin-btn-primary:hover {'
      + 'filter: brightness(1.1);'
      + 'transform: translateY(-1px);'
      + '}'
      + '.zo2y-signin-btn-secondary {'
      + 'background: transparent;'
      + 'color: var(--white, #fff);'
      + 'border-color: var(--border, rgba(255,255,255,0.12));'
      + '}'
      + '.zo2y-signin-btn-secondary:hover {'
      + 'border-color: var(--accent, #f59e0b);'
      + 'color: var(--accent, #f59e0b);'
      + '}'
      + '.zo2y-signin-prompt-close {'
      + 'position: absolute;'
      + 'top: 10px; right: 14px;'
      + 'background: transparent;'
      + 'border: none;'
      + 'color: var(--muted, #8ca3c7);'
      + 'font-size: 22px;'
      + 'cursor: pointer;'
      + 'width: 32px; height: 32px;'
      + 'display: flex;'
      + 'align-items: center;'
      + 'justify-content: center;'
      + 'border-radius: 8px;'
      + 'transition: all 0.2s ease;'
      + '}'
      + '.zo2y-signin-prompt-close:hover {'
      + 'background: rgba(255,255,255,0.1);'
      + 'color: var(--white, #fff);'
      + '}'
      + '@media (max-width: 480px) {'
      + '.zo2y-signin-prompt-content {'
      + 'padding: 28px 22px;'
      + 'max-width: calc(100vw - 32px);'
      + '}'
      + '}';
    document.head.appendChild(style);
  }

  function ensureSignInPromptModal() {
    if (typeof document === 'undefined') return;
    var existing = document.getElementById(SIGN_IN_PROMPT_ID);
    if (existing) return existing;
    var el = document.createElement('div');
    el.id = SIGN_IN_PROMPT_ID;
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = SIGN_IN_HTML;
    document.body.appendChild(el);

    el.addEventListener('click', function (e) {
      if (e.target === el) closeSignInPrompt();
    });
    var closeBtn = el.querySelector('.zo2y-signin-prompt-close');
    if (closeBtn) closeBtn.addEventListener('click', closeSignInPrompt);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeSignInPrompt();
    });
    return el;
  }

  function showSignInPrompt() {
    var modal = document.getElementById(SIGN_IN_PROMPT_ID) || ensureSignInPromptModal();
    if (modal) {
      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeSignInPrompt() {
    var modal = document.getElementById(SIGN_IN_PROMPT_ID);
    if (modal) {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
    }
    document.body.style.overflow = '';
  }

  function ensureModals() {
    ensureSignInPromptModal();
  }

  ensureStyles();
  ensureModals();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureModals);
  }

  window.ZO2Y_CUSTOM_LIST_MODAL = {
    showSignInPrompt: showSignInPrompt,
    closeSignInPrompt: closeSignInPrompt,
    ensureModals: ensureModals
  };
})();
