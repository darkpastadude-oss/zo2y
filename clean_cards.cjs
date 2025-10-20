const fs = require("fs");
const path = require("path");

const folderPath = "./cards"; // folder with ur html pages

// this is ur clean script that gets added back to every file
const cleanScript = `
<!-- List Manager - CLEAN VERSION -->
<script>
(function() {
    console.log('🚀 Loading clean list manager...');

    // create button (no async/await)
    const btn = document.createElement('button');
    btn.innerHTML = '⋮';
    btn.style.cssText = \`
        position: fixed !important; 
        top: 20px !important; 
        left: 20px !important; 
        background: #f59e0b !important; 
        color: #0b1633 !important; 
        border: none !important; 
        width: 50px !important; 
        height: 50px !important; 
        border-radius: 50% !important; 
        font-size: 24px !important; 
        font-weight: bold !important; 
        cursor: pointer !important; 
        z-index: 10000 !important; 
        box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
    \`;

    // dropdown
    const dropdown = document.createElement('div');
    dropdown.style.cssText = \`
        position: fixed; 
        top: 80px; 
        left: 20px; 
        background: #132347; 
        border: 1px solid #f59e0b; 
        border-radius: 10px; 
        padding: 15px; 
        min-width: 250px; 
        display: none; 
        z-index: 10000;
        box-shadow: 0 8px 25px rgba(0,0,0,0.3);
    \`;

    dropdown.innerHTML = \`
        <div style="color:#f59e0b; font-weight:bold; margin-bottom:10px;">Add to Lists</div>
        <div style="padding:8px 0; cursor:pointer;">❤️ Favorites</div>
        <div style="padding:8px 0; cursor:pointer;">📍 Want to Go</div>
        <div style="padding:8px 0; cursor:pointer;">🍽️ Visited</div>
        <div style="border-top:1px solid #f59e0b; margin:10px 0; padding-top:10px;">
            <div style="padding:8px 0; cursor:pointer;">➕ Create Custom List</div>
        </div>
    \`;

    // events
    btn.addEventListener('click', e => {
        e.stopPropagation();
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    });

    document.addEventListener('click', () => {
        dropdown.style.display = 'none';
    });

    dropdown.addEventListener('click', e => {
        e.stopPropagation();
        alert('List functionality will work when logged in!');
    });

    // add to page
    document.body.appendChild(btn);
    document.body.appendChild(dropdown);

    console.log('✅ CLEAN BUTTON ADDED!');
})();
</script>
`;

console.log('🧹 Starting full cleanup...');

// loop through all html files
fs.readdirSync(folderPath).forEach(file => {
    if (file.endsWith(".html")) {
        const filePath = path.join(folderPath, file);
        let content = fs.readFileSync(filePath, "utf8");

        // delete ALL scripts that have async/await/supabase/list-manager/etc.
        const nukePattern = /<script[\s\S]*?(await|async|supabase|list-menu|List Manager)[\s\S]*?<\/script>/gi;
        if (nukePattern.test(content)) {
            content = content.replace(nukePattern, '');
            console.log(`💣 Nuked bad script(s) from ${file}`);
        }

        // make sure no stray top-level await is left
        const topLevelAwait = /await\s+[a-zA-Z0-9_]/g;
        if (topLevelAwait.test(content)) {
            content = content.replace(topLevelAwait, '');
            console.log(`⚠️ Removed stray 'await' from ${file}`);
        }

        // remove duplicate clean script if already added
        const cleanDupPattern = /<!-- List Manager - CLEAN VERSION -->[\s\S]*?<\/script>/gi;
        content = content.replace(cleanDupPattern, '');

        // add clean script before </body>
        if (content.includes("</body>")) {
            content = content.replace("</body>", `${cleanScript}\n</body>`);
        } else {
            content += cleanScript;
        }

        fs.writeFileSync(filePath, content, "utf8");
        console.log(`✅ Cleaned and updated ${file}`);
    }
});

console.log('\n🎉 COMPLETE CLEANUP FINISHED!');
console.log('🚫 All async/await + supabase scripts removed');
console.log('✅ New clean button added to every HTML');
