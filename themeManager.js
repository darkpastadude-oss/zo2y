// themeManager.js
// This script ONLY applies the saved theme. It runs on every page.

document.addEventListener('DOMContentLoaded', function() {
    // 1. Check for a saved theme preference from the homepage
    const savedTheme = localStorage.getItem('zo2y-theme'); 
    
    // 2. If a preference exists, apply it immediately
    if (savedTheme) {
        console.log("Applying saved theme: ", savedTheme);
        document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
        // 3. If it's the user's first visit, use their system preference
        console.log("No saved theme. Using system preference.");
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const systemTheme = prefersDark ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', systemTheme);
    }
});