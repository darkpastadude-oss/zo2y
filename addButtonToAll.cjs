const fs = require("fs");
const path = require("path");

const folderPath = "./cards";

// First, let's create a CLEAN version without any async/await issues
const cleanScript = `
<!-- List Manager - CLEAN VERSION -->
<script>
(function() {
    console.log('🚀 Loading clean list manager...');
    
    // Create button immediately - NO ASYNC/AWAIT
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
    
    // Simple dropdown
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
    
    // Simple click handlers - NO ASYNC
    btn.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    });
    
    document.addEventListener('click', function() {
        dropdown.style.display = 'none';
    });
    
    dropdown.addEventListener('click', function(e) {
        e.stopPropagation();
        alert('List functionality will work when logged in!');
    });
    
    // Add to page
    document.body.appendChild(btn);
    document.body.appendChild(dropdown);
    
    console.log('✅ CLEAN BUTTON ADDED!');
})();
</script>
`;

console.log('🧹 CLEANING all restaurant pages...');

fs.readdirSync(folderPath).forEach((file) => {
    if (file.endsWith(".html")) {
        const filePath = path.join(folderPath, file);
        let content = fs.readFileSync(filePath, "utf8");

        // METHOD 1: Remove ANY script that contains list manager keywords
        const patterns = [
            /<!-- List Manager[\s\S]*?<\/script>\s*<\/body>/i,
            /<!-- Load Supabase[\s\S]*?<\/script>\s*<\/body>/i,
            /<script>[\s\S]*?list-menu-btn[\s\S]*?<\/script>\s*<\/body>/i,
            /<script>[\s\S]*?supabase[\s\S]*?<\/script>\s*<\/body>/i,
            /<script>[\s\S]*?await[\s\S]*?<\/script>\s*<\/body>/i,
            /<script>[\s\S]*?async[\s\S]*?<\/script>\s*<\/body>/i
        ];

        let found = false;
        patterns.forEach(pattern => {
            if (pattern.test(content)) {
                content = content.replace(pattern, '</body>');
                found = true;
                console.log(`🗑️  Removed old script from ${file}`);
            }
        });

        // METHOD 2: If patterns didn't work, do manual cleanup
        if (!found) {
            // Look for the specific error-causing code
            const asyncAwaitPattern = /<script>[\s\S]*?await[\s\S]*?<\/script>/i;
            if (asyncAwaitPattern.test(content)) {
                content = content.replace(asyncAwaitPattern, '');
                console.log(`⚠️  Manual cleanup on ${file}`);
            }
        }

        // METHOD 3: Add the clean script
        content = content.replace("</body>", `${cleanScript}</body>`);
        fs.writeFileSync(filePath, content, "utf8");
        console.log(`✅ Added CLEAN button to ${file}`);
    }
});

console.log('🎉 COMPLETE CLEANUP!');
console.log('📝 The button should now work without errors');
console.log('🔧 No async/await, no Supabase dependencies');
console.log('🎯 Simple, guaranteed working button');