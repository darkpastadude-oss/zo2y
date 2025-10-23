const fs = require("fs");
const path = require("path");

const folderPath = "./cards";
const scriptCode = `
<!-- Load Supabase First -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

<!-- List Manager Button -->
<script>
// Wait for page to load
window.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Page loaded, initializing list manager...');
    
    // Initialize Supabase
    const supabaseUrl = "https://gfkhjbztayjyojsgdpgk.supabase.co";
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma2hqYnp0YXlqeW9qc2dkcGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwOTYyNjQsImV4cCI6MjA3NTY3MjI2NH0.WUb2yDAwCeokdpWCPeH13FE8NhWF6G8e6ivTsgu6b2s";
    
    const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
    window.supabase = supabase;
    
    console.log('✅ Supabase initialized');
    
    // List Manager Class
    class RestaurantListManager {
        constructor() {
            this.supabase = supabase;
            this.restaurantId = this.getRestaurantIdFromSlug();
            this.userLists = [];
            this.customLists = [];
            this.init();
        }

        getRestaurantIdFromSlug() {
            const path = window.location.pathname;
            const slug = path.split('/').pop().replace('.html', '');
            const slugToId = {
                'mori':1,'kilo':2,'hameed':3,'bazooka':4,'mexican':5,'chikin':6,'vasko':7,
                'secondcup':8,'station':9,'brgr':10,'country':11,'bayoki':12,'maine':13,
                'barbar':14,'labash':15,'pickl':16,'akleh':17,'howlin':18,'sauce':19,
                'papa':20,'qasr':21,'heart':22,'what':23,'buffalo':24,'mince':25,'88':26,
                'kansas':27,'ward':28,'willys':29,'butchers':30,'hashville':31,'dawgs':32,
                'holmes':33,'ribs':34,'peking':35,'wok':36,'daddy':37,'husk':38,'crispy':39,
                'lord':40,'chez':41,'mario':42,'crumbs':43,'man':44,'pasta':45,'crave':46
            };
            return slugToId[slug] || null;
        }

        async init() {
            await this.checkAuth();
            if (this.currentUser) {
                await this.loadUserLists();
            }
            this.injectListMenu();
        }

        async checkAuth() {
            try {
                const { data: { session } } = await this.supabase.auth.getSession();
                this.currentUser = session?.user || null;
            } catch (error) {
                console.error('Auth error:', error);
                this.currentUser = null;
            }
        }

        async loadUserLists() {
            try {
                const { data: lists } = await this.supabase
                    .from('lists').select('*').eq('user_id', this.currentUser.id);
                this.userLists = lists || [];
                
                // Separate custom lists from default lists
                this.customLists = this.userLists.filter(list => 
                    !['Favorites', 'Visited', 'Want to Go'].includes(list.title)
                );
            } catch (error) {
                console.error('Error loading lists:', error);
                this.userLists = [];
                this.customLists = [];
            }
        }

        injectListMenu() {
            // Create the floating action button
            const fab = document.createElement('div');
            fab.className = 'list-manager-fab';
            fab.innerHTML = \`
                <div class="fab-main">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 5v14M5 12h14"/>
                    </svg>
                </div>
                <div class="fab-tooltip">Save to Lists</div>
            \`;
            
            // Add FAB styles
            const styles = \`
                .list-manager-fab {
                    position: fixed !important;
                    bottom: 30px !important;
                    right: 30px !important;
                    z-index: 10000 !important;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
                }
                
                .fab-main {
                    width: 60px !important;
                    height: 60px !important;
                    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%) !important;
                    border-radius: 50% !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    cursor: pointer !important;
                    box-shadow: 0 8px 25px rgba(245, 158, 11, 0.4) !important;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                    border: none !important;
                    color: white !important;
                    position: relative !important;
                    overflow: hidden !important;
                }
                
                .fab-main::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
                    transition: left 0.5s;
                }
                
                .fab-main:hover::before {
                    left: 100%;
                }
                
                .fab-main:hover {
                    transform: scale(1.1) rotate(90deg) !important;
                    box-shadow: 0 12px 35px rgba(245, 158, 11, 0.6) !important;
                }
                
                .fab-main:active {
                    transform: scale(0.95) !important;
                }
                
                .fab-tooltip {
                    position: absolute !important;
                    bottom: 70px !important;
                    right: 0 !important;
                    background: #1e293b !important;
                    color: white !important;
                    padding: 8px 12px !important;
                    border-radius: 6px !important;
                    font-size: 12px !important;
                    font-weight: 500 !important;
                    white-space: nowrap !important;
                    opacity: 0 !important;
                    transform: translateY(10px) !important;
                    transition: all 0.3s ease !important;
                    pointer-events: none !important;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
                }
                
                .fab-main:hover + .fab-tooltip {
                    opacity: 1 !important;
                    transform: translateY(0) !important;
                }
                
                .list-dropdown {
                    position: fixed;
                    bottom: 100px;
                    right: 30px;
                    background: #0f172a;
                    border: 1px solid #334155;
                    border-radius: 16px;
                    padding: 20px;
                    min-width: 320px;
                    max-width: 400px;
                    display: none;
                    z-index: 10000;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.4);
                    backdrop-filter: blur(20px);
                    transform-origin: bottom right;
                    animation: dropdownSlide 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                
                @keyframes dropdownSlide {
                    from {
                        opacity: 0;
                        transform: scale(0.8) translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }
                
                .list-dropdown.show {
                    display: block !important;
                }
                
                .dropdown-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 20px;
                    padding-bottom: 15px;
                    border-bottom: 1px solid #334155;
                }
                
                .dropdown-title {
                    font-size: 18px;
                    font-weight: 700;
                    color: #f59e0b;
                    margin: 0;
                }
                
                .close-btn {
                    background: none;
                    border: none;
                    color: #64748b;
                    cursor: pointer;
                    padding: 8px;
                    border-radius: 8px;
                    transition: all 0.2s ease;
                }
                
                .close-btn:hover {
                    background: #1e293b;
                    color: #f59e0b;
                }
                
                .list-section {
                    margin-bottom: 20px;
                }
                
                .list-section-title {
                    font-size: 11px;
                    color: #94a3b8;
                    text-transform: uppercase;
                    font-weight: 600;
                    margin-bottom: 12px;
                    letter-spacing: 0.5px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .list-section-title::after {
                    content: '';
                    flex: 1;
                    height: 1px;
                    background: #334155;
                    margin-left: 8px;
                }
                
                .list-item { 
                    display: flex; 
                    align-items: center; 
                    gap: 12px; 
                    padding: 12px 10px; 
                    cursor: pointer; 
                    border-radius: 10px;
                    transition: all 0.2s ease;
                    margin-bottom: 4px;
                }
                
                .list-item:hover { 
                    background: rgba(245, 158, 11, 0.1); 
                    transform: translateX(4px);
                }
                
                .list-checkbox { 
                    width: 20px; 
                    height: 20px; 
                    border: 2px solid #475569;
                    border-radius: 6px; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    flex-shrink: 0;
                    transition: all 0.2s ease;
                    position: relative;
                }
                
                .list-checkbox.checked { 
                    background: #f59e0b; 
                    border-color: #f59e0b;
                    animation: checkPop 0.3s ease;
                }
                
                @keyframes checkPop {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.2); }
                    100% { transform: scale(1); }
                }
                
                .list-checkbox.checked::after { 
                    content: "✓"; 
                    color: #0f172a; 
                    font-size: 12px; 
                    font-weight: bold; 
                }
                
                .list-item-text {
                    flex: 1;
                    font-size: 14px;
                    font-weight: 500;
                    color: #e2e8f0;
                }
                
                .list-item:hover .list-item-text {
                    color: #f59e0b;
                }
                
                .new-list-section {
                    border-top: 1px solid #334155;
                    padding-top: 20px;
                    margin-top: 15px;
                }
                
                .new-list-input { 
                    width: 100%; 
                    padding: 12px 16px; 
                    background: #1e293b;
                    border: 1px solid #475569; 
                    border-radius: 10px; 
                    color: white; 
                    margin-bottom: 12px;
                    font-size: 14px;
                    transition: all 0.2s ease;
                }
                
                .new-list-input:focus {
                    outline: none;
                    border-color: #f59e0b;
                    box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
                }
                
                .add-list-btn { 
                    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); 
                    color: #0f172a; 
                    border: none;
                    padding: 12px 20px; 
                    border-radius: 10px; 
                    cursor: pointer; 
                    font-weight: 600; 
                    width: 100%; 
                    font-size: 14px;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }
                
                .add-list-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4);
                }
                
                .add-list-btn:active {
                    transform: translateY(0);
                }
                
                .list-divider {
                    height: 1px;
                    background: linear-gradient(90deg, transparent, #334155, transparent);
                    margin: 16px 0;
                }
                
                .empty-custom-lists {
                    text-align: center;
                    color: #64748b;
                    font-size: 13px;
                    padding: 20px;
                    font-style: italic;
                }
                
                .auth-prompt {
                    text-align: center;
                    padding: 30px 20px;
                    color: #94a3b8;
                }
                
                .auth-prompt .icon {
                    font-size: 48px;
                    margin-bottom: 12px;
                    opacity: 0.5;
                }
                
                .auth-prompt .text {
                    font-size: 14px;
                    margin-bottom: 16px;
                }
                
                .login-btn {
                    background: #f59e0b;
                    color: #0f172a;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                
                .login-btn:hover {
                    background: #ffb84d;
                }
                
                /* Pulse animation for new lists */
                @keyframes pulseGlow {
                    0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7); }
                    70% { box-shadow: 0 0 0 10px rgba(245, 158, 11, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
                }
                
                .pulse {
                    animation: pulseGlow 2s infinite;
                }
            \`;
            
            const styleSheet = document.createElement('style');
            styleSheet.textContent = styles;
            document.head.appendChild(styleSheet);
            
            // Create dropdown
            const dropdown = document.createElement('div');
            dropdown.className = 'list-dropdown';
            
            // FAB click handler
            fab.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.classList.toggle('show');
                if (dropdown.classList.contains('show')) {
                    this.updateDropdown(dropdown);
                    // Add pulse animation to FAB when dropdown is open
                    fab.querySelector('.fab-main').classList.add('pulse');
                } else {
                    fab.querySelector('.fab-main').classList.remove('pulse');
                }
            });
            
            // Close dropdown when clicking outside
            document.addEventListener('click', () => {
                dropdown.classList.remove('show');
                fab.querySelector('.fab-main').classList.remove('pulse');
            });
            
            dropdown.addEventListener('click', (e) => e.stopPropagation());
            
            // Add to page
            document.body.appendChild(fab);
            document.body.appendChild(dropdown);
            
            console.log('✅ List Manager FAB Added!');
        }

        async updateDropdown(dropdown) {
            dropdown.innerHTML = \`
                <div class="dropdown-header">
                    <h3 class="dropdown-title">💫 Save to Lists</h3>
                    <button class="close-btn" onclick="this.closest('.list-dropdown').classList.remove('show')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
            \`;

            if (!this.currentUser) {
                dropdown.innerHTML += \`
                    <div class="auth-prompt">
                        <div class="icon">🔐</div>
                        <div class="text">Sign in to save restaurants to your lists</div>
                        <button class="login-btn" onclick="window.location.href='../login.html'">
                            Sign In
                        </button>
                    </div>
                \`;
                return;
            }

            // Quick Actions Section
            const quickSection = document.createElement('div');
            quickSection.className = 'list-section';
            quickSection.innerHTML = '<div class="list-section-title">🌟 Quick Actions</div>';
            
            const quickLists = [
                { id: 'favorites', name: '❤️ Favorites', icon: '❤️' },
                { id: 'wantToGo', name: '📍 Want to Go', icon: '📍' },
                { id: 'visited', name: '🍽️ Visited', icon: '🍽️' }
            ];

            for (const list of quickLists) {
                const isInList = await this.checkIfInList(list.id);
                const item = document.createElement('div');
                item.className = 'list-item';
                item.innerHTML = \`
                    <div class="list-checkbox \${isInList ? 'checked' : ''}"></div>
                    <span class="list-item-text">\${list.name}</span>
                \`;
                item.onclick = () => this.toggleList(list.id);
                quickSection.appendChild(item);
            }
            
            dropdown.appendChild(quickSection);

            // Custom Lists Section
            if (this.customLists.length > 0) {
                const divider = document.createElement('div');
                divider.className = 'list-divider';
                dropdown.appendChild(divider);

                const customSection = document.createElement('div');
                customSection.className = 'list-section';
                customSection.innerHTML = '<div class="list-section-title">📁 Your Collections</div>';

                for (const list of this.customLists) {
                    const isInList = await this.checkIfCustomList(list.id);
                    const item = document.createElement('div');
                    item.className = 'list-item';
                    item.innerHTML = \`
                        <div class="list-checkbox \${isInList ? 'checked' : ''}"></div>
                        <span class="list-item-text">\${list.title}</span>
                    \`;
                    item.onclick = () => this.toggleCustomList(list.id);
                    customSection.appendChild(item);
                }
                
                dropdown.appendChild(customSection);
            } else {
                const divider = document.createElement('div');
                divider.className = 'list-divider';
                dropdown.appendChild(divider);
                
                const emptySection = document.createElement('div');
                emptySection.className = 'empty-custom-lists';
                emptySection.innerHTML = 'No custom lists yet. Create your first one below! ✨';
                dropdown.appendChild(emptySection);
            }

            // Create New List Section
            const newDiv = document.createElement('div');
            newDiv.className = 'new-list-section';
            newDiv.innerHTML = \`
                <div class="list-section-title">🆕 Create New</div>
                <input type="text" class="new-list-input" placeholder="What should we call your new list?" id="newListName">
                <button class="add-list-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 5v14M5 12h14"/>
                    </svg>
                    Create Custom List
                </button>
            \`;
            
            const input = newDiv.querySelector('input');
            const button = newDiv.querySelector('button');
            
            button.onclick = () => this.createNewList();
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.createNewList();
                }
            });
            
            dropdown.appendChild(newDiv);
        }

        async checkIfInList(listType) {
            if (!this.currentUser || !this.restaurantId) return false;
            const title = { favorites: 'Favorites', visited: 'Visited', wantToGo: 'Want to Go' }[listType];
            const { data: list } = await this.supabase.from('lists').select('id')
                .eq('user_id', this.currentUser.id).eq('title', title).single();
            if (!list) return false;
            const { data: listRestaurants } = await this.supabase.from('lists_restraunts')
                .select('id').eq('list_id', list.id).eq('restraunt_id', this.restaurantId).single();
            return !!listRestaurants;
        }

        async checkIfCustomList(listId) {
            if (!this.currentUser || !this.restaurantId) return false;
            const { data: listRestaurants } = await this.supabase.from('lists_restraunts')
                .select('id').eq('list_id', listId).eq('restraunt_id', this.restaurantId).single();
            return !!listRestaurants;
        }

        async toggleList(listType) {
            if (!this.currentUser || !this.restaurantId) {
                this.showNotification('Please log in to use lists', 'warning');
                return;
            }
            
            const title = { favorites: 'Favorites', visited: 'Visited', wantToGo: 'Want to Go' }[listType];
            let { data: list } = await this.supabase.from('lists').select('id')
                .eq('user_id', this.currentUser.id).eq('title', title).single();
                
            if (!list) {
                const { data: newList } = await this.supabase.from('lists')
                    .insert([{ user_id: this.currentUser.id, title: title }]).select().single();
                list = newList;
            }
            
            const isInList = await this.checkIfInList(listType);
            if (isInList) {
                await this.supabase.from('lists_restraunts').delete()
                    .match({ list_id: list.id, restraunt_id: this.restaurantId });
                this.showNotification(\`Removed from \${title}\`, 'info');
            } else {
                await this.supabase.from('lists_restraunts').insert([
                    { list_id: list.id, restraunt_id: this.restaurantId }
                ]);
                this.showNotification(\`Added to \${title} ✅\`, 'success');
            }
            
            this.updateDropdown(document.querySelector('.list-dropdown'));
        }

        async toggleCustomList(listId) {
            if (!this.currentUser || !this.restaurantId) {
                this.showNotification('Please log in to use lists', 'warning');
                return;
            }
            
            const list = this.customLists.find(l => l.id === listId);
            const isInList = await this.checkIfCustomList(listId);
            
            if (isInList) {
                await this.supabase.from('lists_restraunts').delete()
                    .match({ list_id: listId, restraunt_id: this.restaurantId });
                this.showNotification(\`Removed from \${list.title}\`, 'info');
            } else {
                await this.supabase.from('lists_restraunts').insert([
                    { list_id: listId, restraunt_id: this.restaurantId }
                ]);
                this.showNotification(\`Added to \${list.title} ✅\`, 'success');
            }
            
            this.updateDropdown(document.querySelector('.list-dropdown'));
        }

        async createNewList() {
            const input = document.getElementById('newListName');
            const name = input.value.trim();
            
            if (!name) {
                this.showNotification('Please enter a list name', 'warning');
                return;
            }

            if (!this.currentUser) {
                this.showNotification('Please log in to create lists', 'warning');
                return;
            }

            try {
                const { data: newList } = await this.supabase.from('lists')
                    .insert([{ user_id: this.currentUser.id, title: name }]).select().single();
                
                if (newList) {
                    this.customLists.push(newList);
                    input.value = '';
                    this.showNotification(\`✨ "\${name}" created!\`, 'success');
                    this.updateDropdown(document.querySelector('.list-dropdown'));
                }
            } catch (error) {
                this.showNotification('Error creating list: ' + error.message, 'error');
            }
        }

        showNotification(message, type = 'info') {
            const colors = {
                success: '#10b981',
                error: '#ef4444',
                warning: '#f59e0b',
                info: '#3b82f6'
            };
            
            const notification = document.createElement('div');
            notification.style.cssText = \`
                position: fixed;
                top: 30px;
                right: 30px;
                background: \${colors[type] || colors.info};
                color: white;
                padding: 16px 24px;
                border-radius: 12px;
                z-index: 10001;
                font-weight: 600;
                box-shadow: 0 8px 25px rgba(0,0,0,0.3);
                transform: translateX(100%);
                transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                max-width: 300px;
                word-wrap: break-word;
            \`;
            notification.textContent = message;
            document.body.appendChild(notification);
            
            // Animate in
            setTimeout(() => {
                notification.style.transform = 'translateX(0)';
            }, 10);
            
            setTimeout(() => {
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    notification.remove();
                }, 400);
            }, 3000);
        }
    }

    // Initialize the list manager
    setTimeout(() => {
        new RestaurantListManager();
    }, 1000);
    
});
</script>
`;

console.log('🚀 Adding premium list manager to all restaurant pages...');

fs.readdirSync(folderPath).forEach((file) => {
    if (file.endsWith(".html")) {
        const filePath = path.join(folderPath, file);
        let content = fs.readFileSync(filePath, "utf8");

        // Remove any existing list manager scripts
        const scriptRegex = /<!-- (Load Supabase First|List Manager Button)[\s\S]*?<\/script>\s*<\/body>/;
        if (scriptRegex.test(content)) {
            content = content.replace(scriptRegex, '</body>');
        }
        
        // Add the new premium script
        content = content.replace("</body>", `${scriptCode}</body>`);
        fs.writeFileSync(filePath, content, "utf8");
        console.log(`✅ Added premium FAB to ${file}`);
    }
});

console.log('🎉 PREMIUM UPGRADE COMPLETE! New features:');
console.log('💫 Floating Action Button (bottom-right corner)');
console.log('✨ Smooth animations and hover effects');
console.log('🎨 Modern glass-morphism design');
console.log('🔔 Enhanced notifications with animations');
console.log('🌟 Better organization with sections');
console.log('🛡️ Auth handling with beautiful prompts');
console.log('📱 Perfect positioning that avoids UI conflicts');
console.log('⚡ All original functionality preserved and enhanced!');