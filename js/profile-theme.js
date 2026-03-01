document.addEventListener('DOMContentLoaded', () => {
    const themeSelect = document.getElementById('theme-select');
    const settingsBtn = document.getElementById('settings-btn');
    const closeSettingsBtn = document.getElementById('close-settings');
    const modal = document.getElementById('settings-modal');

    if (!themeSelect || !settingsBtn || !closeSettingsBtn || !modal) {
        console.log('Theme UI not present on this page.');
        return;
    }

    const THEMES = ['profile-theme-navy', 'profile-theme-ocean', 'profile-theme-sunset', 'profile-theme-forest'];

    // 1. Function to apply theme to the BODY tag
    function applyTheme(themeName) {
        // Remove any existing theme classes
        THEMES.forEach(t => document.body.classList.remove(t));
        
        // Add the new theme class if it's a valid one
        if (THEMES.includes(themeName)) {
            document.body.classList.add(themeName);
        } else {
            // Fallback to a default theme if the stored one is invalid
            document.body.classList.add('profile-theme-navy');
        }
    }

    // 2. Load saved theme from Local Storage on startup
    const savedTheme = localStorage.getItem('profile-theme') || 'profile-theme-navy';
    themeSelect.value = savedTheme;
    applyTheme(savedTheme);

    // 3. Handle Dropdown Change
    themeSelect.addEventListener('change', (e) => {
        const selectedTheme = e.target.value;
        localStorage.setItem('profile-theme', selectedTheme);
        applyTheme(selectedTheme);
    });

    // 4. UI Logic: Open/Close Modal
    settingsBtn.addEventListener('click', () => {
        modal.classList.add('active');
    });

    closeSettingsBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    // Close modal if clicking outside the content box
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
});
