const fs = require("fs");
const path = require("path");

const folderPath = "./cards";
const scriptCode = `
<!-- List Manager Button -->
<script>
// Simple guaranteed working button
(function() {
    console.log('🚀 List Manager Script Loaded');
    
    // Create button immediately - NO SUPABASE DEPENDENCY
    const btn = document.createElement('button');
    btn.innerHTML = '⋮';
    btn.className = 'list-menu-btn';
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
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
    \`;
    
    // Add dropdown styles
    const styles = \`
        .list-dropdown {
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
        }
        .list-dropdown.show {
            display: block !important;
        }
        .list-item { 
            display: flex; 
            align-items: center; 
            gap: 10px; 
            padding: 8px 0; 
            cursor: pointer; 
            border-bottom: 1px solid rgba(255,255,255,0.1); 
        }
        .list-item:last-child { border-bottom: none; }
        .list-item:hover { color: #f59e0b; }
    \`;
    
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
    
    // Create dropdown
    const dropdown = document.createElement('div');
    dropdown.className = 'list-dropdown';
    dropdown.innerHTML = \`
        <div style="color:#f59e0b; font-weight:bold; margin-bottom:10px;">Add to Lists</div>
        <div class="list-item">❤️ Favorites</div>
        <div class="list-item">📍 Want to Go</div>
        <div class="list-item">🍽️ Visited</div>
        <div style="border-top:1px solid #f59e0b; margin:10px 0; padding-top:10px;">
            <input type="text" placeholder="New list name" style="width:100%; padding:8px; background:#0b1633; border:1px solid #f59e0b; border-radius:6px; color:white; margin-bottom:10px;">
            <button style="background:#f59e0b; color:#0b1633; border:none; padding:8px 16px; border-radius:6px; cursor:pointer; width:100%; font-weight:bold;">Create List</button>
        </div>
    \`;
    
    // Button click handler
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('show');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
        dropdown.classList.remove('show');
    });
    
    dropdown.addEventListener('click', (e) => e.stopPropagation());
    
    // Add to page
    document.body.appendChild(btn);
    document.body.appendChild(dropdown);
    
    console.log('✅ BUTTON ADDED - Should be visible in top-left corner!');
    
})();
</script>
`;

console.log('🚀 Adding guaranteed working buttons to all pages...');

fs.readdirSync(folderPath).forEach((file) => {
    if (file.endsWith(".html")) {
        const filePath = path.join(folderPath, file);
        let content = fs.readFileSync(filePath, "utf8");

        // Remove any existing list manager scripts
        const scriptRegex = /<!-- List Manager Button[\s\S]*?<\/script>\s*<\/body>/;
        if (scriptRegex.test(content)) {
            content = content.replace(scriptRegex, '</body>');
            console.log(`🔄 Replaced existing script in ${file}`);
        }
        
        // Add the new working script
        content = content.replace("</body>", `${scriptCode}</body>`);
        fs.writeFileSync(filePath, content, "utf8");
        console.log(`✅ Added button to ${file}`);
    }
});

console.log('🎉 COMPLETE! Refresh your restaurant pages.');
console.log('📍 The button should be in the TOP-LEFT corner (orange circle with ⋮)');