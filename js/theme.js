document.addEventListener('DOMContentLoaded', () => {
    const themeSelect = document.getElementById('theme-select');
    const settingsBtn = document.getElementById('settings-btn');
    const closeSettingsBtn = document.getElementById('close-settings');
    const modal = document.getElementById('settings-modal');

    if (!themeSelect || !settingsBtn || !closeSettingsBtn || !modal) {
        console.error('Theme settings UI elements not found. Make sure the HTML is correct.');
        return;
    }

    // 1. Function to apply theme to the HTML tag
    function applyTheme(themeName) {
        const html = document.documentElement;
        
        if (themeName === 'system') {
            // Check OS preference
            const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            html.setAttribute('data-theme', systemDark ? 'dark' : 'light');
        } else {
            html.setAttribute('data-theme', themeName);
        }
    }

    // 2. Load saved theme from Local Storage on startup
    const savedTheme = localStorage.getItem('site-theme') || 'system';
    themeSelect.value = savedTheme;
    applyTheme(savedTheme);

    // 3. Handle Dropdown Change
    themeSelect.addEventListener('change', (e) => {
        const selectedTheme = e.target.value;
        localStorage.setItem('site-theme', selectedTheme);
        applyTheme(selectedTheme);
    });

    // 4. Listen for System Preference Changes (if user selected 'system')
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (localStorage.getItem('site-theme') === 'system') {
            applyTheme('system');
        }
    });

    // 5. UI Logic: Open/Close Modal
    settingsBtn.addEventListener('click', () => {
        modal.classList.remove('hidden');
    });

    closeSettingsBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    // Close modal if clicking outside the content box
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
        }
    });
});
