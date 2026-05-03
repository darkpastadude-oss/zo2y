(function () {
  'use strict';

  var POPUP_ID = 'zo2y-username-popup';
  var DISMISSAL_KEY = 'zo2y_username_popup_dismissed';
  var USERNAME_REQUIRED_KEY = 'zo2y_username_required';

  function createPopup() {
    var existing = document.getElementById(POPUP_ID);
    if (existing) return existing;

    var popup = document.createElement('div');
    popup.id = POPUP_ID;
    popup.innerHTML = `
      <div class="username-popup-overlay"></div>
      <div class="username-popup-modal">
        <div class="username-popup-header">
          <h2>choose your username</h2>
          <button class="username-popup-close" aria-label="close">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="username-popup-body">
          <p class="username-popup-sub">pick a unique username to use across zo2y</p>
          <div class="username-input-row">
            <input 
              type="text" 
              id="usernamePopupInput" 
              class="username-popup-input" 
              placeholder="your username" 
              maxlength="30" 
              autocomplete="username"
              autocapitalize="off"
              spellcheck="false"
            />
            <button id="usernamePopupSave" class="username-popup-btn" type="button">
              <i class="fas fa-check"></i>
              <span>save</span>
            </button>
          </div>
          <div class="username-popup-hint">3-30 characters, letters, numbers, underscores only. no spaces.</div>
          <div id="usernamePopupStatus" class="username-popup-status"></div>
        </div>
      </div>
    `;

    document.body.appendChild(popup);
    return popup;
  }

  function addStyles() {
    var styleId = 'username-popup-styles';
    if (document.getElementById(styleId)) return;

    var style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      #${POPUP_ID} {
        position: fixed;
        inset: 0;
        z-index: 10000;
        display: none;
        align-items: center;
        justify-content: center;
      }
      
      #${POPUP_ID}.visible {
        display: flex;
      }
      
      .username-popup-overlay {
        position: absolute;
        inset: 0;
        background: rgba(11, 22, 51, 0.85);
        backdrop-filter: blur(4px);
      }
      
      .username-popup-modal {
        position: relative;
        width: min(480px, 90%);
        max-width: 480px;
        background: linear-gradient(135deg, #132347 0%, #0b1633 100%);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 20px;
        padding: 24px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        animation: usernamePopupSlideIn 0.3s ease-out;
      }
      
      @keyframes usernamePopupSlideIn {
        from {
          opacity: 0;
          transform: translateY(20px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
      
      .username-popup-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;
      }
      
      .username-popup-header h2 {
        margin: 0;
        font-size: 22px;
        font-weight: 700;
        color: #fff;
        letter-spacing: -0.02em;
      }
      
      .username-popup-close {
        width: 36px;
        height: 36px;
        border: none;
        background: rgba(255, 255, 255, 0.08);
        border-radius: 10px;
        color: #8ca3c7;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }
      
      .username-popup-close:hover {
        background: rgba(245, 158, 11, 0.2);
        color: #f59e0b;
      }
      
      .username-popup-sub {
        margin: 0 0 20px;
        color: #8ca3c7;
        font-size: 14px;
        line-height: 1.5;
      }
      
      .username-input-row {
        display: grid;
        grid-template-columns: 1fr 100px;
        gap: 10px;
        margin-bottom: 12px;
      }
      
      .username-popup-input {
        width: 100%;
        height: 48px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 12px;
        background: #10224a;
        color: #fff;
        padding: 0 14px;
        font-size: 15px;
        outline: none;
        transition: all 0.2s ease;
      }
      
      .username-popup-input:focus {
        border-color: rgba(245, 158, 11, 0.6);
        box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.15);
      }
      
      .username-popup-btn {
        height: 48px;
        border: none;
        border-radius: 12px;
        background: linear-gradient(135deg, #f59e0b 0%, #ffb84d 100%);
        color: #0b1633;
        font-weight: 700;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        transition: all 0.2s ease;
      }
      
      .username-popup-btn:hover:not(:disabled) {
        transform: translateY(-1px);
        filter: saturate(1.1);
      }
      
      .username-popup-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      .username-popup-hint {
        color: #6b7d9a;
        font-size: 12px;
        line-height: 1.4;
      }
      
      .username-popup-status {
        min-height: 18px;
        margin-top: 10px;
        font-size: 13px;
      }
      
      .username-popup-status.error {
        color: #ffb4b4;
      }
      
      .username-popup-status.success {
        color: #b9ffe4;
      }
      
      @media (max-width: 520px) {
        .username-input-row {
          grid-template-columns: 1fr;
        }
        
        .username-popup-btn {
          width: 100%;
        }
      }
    `;
    
    document.head.appendChild(style);
  }

  function normalizeUsername(value) {
    return String(value || '')
      .trim()
      .replace(/^@+/, '')
      .toLowerCase()
      .replace(/['\u2019]/g, '')
      .replace(/[^a-z0-9_]/g, '');
  }

  function isValidUsername(value) {
    return /^[a-z0-9_]{3,30}$/.test(String(value || ''));
  }

  function setStatus(message, type) {
    var statusEl = document.getElementById('usernamePopupStatus');
    if (!statusEl) return;
    statusEl.className = 'username-popup-status' + (type ? ' ' + type : '');
    statusEl.textContent = message || '';
  }

  function showPopup() {
    var popup = createPopup();
    popup.classList.add('visible');
    var input = document.getElementById('usernamePopupInput');
    if (input) input.focus();
  }

  function hidePopup() {
    var popup = document.getElementById(POPUP_ID);
    if (popup) popup.classList.remove('visible');
  }

  function isDismissed() {
    return localStorage.getItem(DISMISSAL_KEY) === 'true';
  }

  function markDismissed() {
    localStorage.setItem(DISMISSAL_KEY, 'true');
  }

  function setUsernameRequired(required) {
    localStorage.setItem(USERNAME_REQUIRED_KEY, required ? 'true' : 'false');
  }

  function isUsernameRequired() {
    return localStorage.getItem(USERNAME_REQUIRED_KEY) === 'true';
  }

  async function checkUsernameAvailability(username) {
    try {
      var response = await fetch('/api/auth/check-username?username=' + encodeURIComponent(username));
      var data = await response.json();
      return data && data.available === true;
    } catch (error) {
      console.error('Error checking username availability:', error);
      return false;
    }
  }

  async function saveUsername(username) {
    try {
      var accessToken = null;
      
      // Try to get access token from auth-gate
      if (window.ZO2Y_AUTH && window.ZO2Y_AUTH.getActiveSession) {
        var client = window.ZO2Y_AUTH.ensureClient();
        if (client) {
          var session = await window.ZO2Y_AUTH.getActiveSession(client, { refreshIfNeeded: true });
          if (session && session.access_token) {
            accessToken = session.access_token;
          }
        }
      }
      
      var headers = {
        'Content-Type': 'application/json'
      };
      
      if (accessToken) {
        headers['Authorization'] = 'Bearer ' + accessToken;
      }
      
      var response = await fetch('/api/auth/save-username', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ username: username })
      });
      var data = await response.json();
      return data && data.success === true;
    } catch (error) {
      console.error('Error saving username:', error);
      return false;
    }
  }

  async function handleSave() {
    var input = document.getElementById('usernamePopupInput');
    var saveBtn = document.getElementById('usernamePopupSave');
    
    if (!input || !saveBtn) return;
    
    var username = normalizeUsername(input.value || '');
    
    if (!isValidUsername(username)) {
      setStatus('Username must be 3-30 characters using letters, numbers, or underscores only.', 'error');
      return;
    }
    
    saveBtn.disabled = true;
    setStatus('Checking availability...', '');
    
    var available = await checkUsernameAvailability(username);
    
    if (!available) {
      setStatus('That username is already taken. Try another.', 'error');
      saveBtn.disabled = false;
      return;
    }
    
    setStatus('Saving username...', '');
    
    var saved = await saveUsername(username);
    
    if (saved) {
      setStatus('Username saved!', 'success');
      markDismissed();
      setUsernameRequired(false);
      setTimeout(function () {
        hidePopup();
        // Reload page to update UI with new username
        window.location.reload();
      }, 1000);
    } else {
      setStatus('Could not save username. Please try again.', 'error');
      saveBtn.disabled = false;
    }
  }

  async function checkUserNeedsUsername() {
    try {
      if (!window.ZO2Y_AUTH || !window.ZO2Y_AUTH.getActiveSession) return false;
      var client = window.ZO2Y_AUTH.ensureClient();
      if (!client) return false;
      var session = await window.ZO2Y_AUTH.getActiveSession(client, { refreshIfNeeded: true });
      if (!session || !session.user) return false;

      // Check user metadata first
      if (session.user.user_metadata && session.user.user_metadata.needs_username === true) {
        return true;
      }

      // Check if user has a username in their profile
      var accessToken = session.access_token;
      var response = await fetch('/api/auth/check-username', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer ' + accessToken
        }
      });
      
      if (response.ok) {
        var data = await response.json();
        // If user already has a username, don't show popup
        if (data && data.has_username === true) {
          return false;
        }
      }

      // If we can't determine, check if explicitly required
      return isUsernameRequired();
    } catch (_err) {
      return isUsernameRequired();
    }
  }

  async function init() {
    addStyles();
    
    var popup = createPopup();
    var closeBtn = document.querySelector('.username-popup-close');
    var saveBtn = document.getElementById('usernamePopupSave');
    var input = document.getElementById('usernamePopupInput');
    
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        if (isUsernameRequired()) {
          setStatus('You need to choose a username to continue.', 'error');
          return;
        }
        hidePopup();
        markDismissed();
      });
    }
    
    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        void handleSave();
      });
    }
    
    if (input) {
      input.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
          event.preventDefault();
          void handleSave();
        }
      });
      
      input.addEventListener('input', function () {
        setStatus('', '');
      });
    }
    
    // Check if user needs username
    var needsUsername = await checkUserNeedsUsername();
    if (!needsUsername) return;

    setTimeout(function () {
      showPopup();
    }, 300);
  }

  // Expose functions for external use
  window.ZO2Y_USERNAME_POPUP = {
    show: showPopup,
    hide: hidePopup,
    setRequired: setUsernameRequired,
    isRequired: isUsernameRequired,
    init: init
  };

  // Auto-init on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { void init(); });
  } else {
    void init();
  }
})();
