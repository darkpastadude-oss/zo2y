const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const fs = require('fs');

const html = fs.readFileSync('c:/Users/sigma/OneDrive/Desktop/zo2ys/profile.html', 'utf8');

const virtualConsole = new jsdom.VirtualConsole();
virtualConsole.on("error", (err) => {
  console.error("DOM Console Error:", err);
});
virtualConsole.on("warn", (warn) => {
  console.warn("DOM Console Warn:", warn);
});
virtualConsole.on("info", (info) => {
  console.info("DOM Console Info:", info);
});

const dom = new JSDOM(html, { 
    runScripts: "dangerously", 
    virtualConsole,
    url: "http://localhost/profile.html"
});

// Wait briefly for inline scripts to run
setTimeout(() => {
    try {
        const btn = dom.window.document.getElementById('pv2ModeMedia');
        if (btn) {
            console.log('Simulating click on pv2ModeMedia button...');
            btn.click();
            console.log('Click executed.');
        } else {
            console.log('Button not found.');
        }
        
        if (typeof dom.window.ProfileManager !== 'undefined') {
            console.log('ProfileManager is present on window.');
            if (typeof dom.window.ProfileManager.setOverviewMode === 'function') {
                console.log('setOverviewMode is correctly defined as a function on window.ProfileManager.');
            } else {
                console.error('setOverviewMode is missing from window.ProfileManager.');
            }
        } else {
            console.error('window.ProfileManager is undefined.');
        }

    } catch (e) {
        console.error('Test threw an error:', e.message);
    }
}, 500);
