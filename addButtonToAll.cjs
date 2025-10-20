const fs = require("fs");
const path = require("path");

const folderPath = "./cards"; // Change this to your cards folder path
const scriptCode = `
<!-- List Manager Button -->
<script>
// Auto-inject list manager
(function() {
    const supabaseUrl = "https://gfkhjbztayjyojsgdpgk.supabase.co";
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma2hqYnp0YXlqeW9qc2dkcGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwOTYyNjQsImV4cCI6MjA3NTY3MjI2NH0.WUb2yDAwCeokdpWCPeH13FE8NhWF6G8e6ivTsgu6b2s";
    
    class RestaurantListManager {
        constructor() {
            this.supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
            this.restaurantId = this.getRestaurantIdFromSlug();
            this.userLists = [];
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
                this.injectListMenu();
            }
        }

        async checkAuth() {
            const { data: { session } } = await this.supabase.auth.getSession();
            this.currentUser = session?.user || null;
        }

        async loadUserLists() {
            const { data: lists } = await this.supabase
                .from('lists').select('*').eq('user_id', this.currentUser.id);
            this.userLists = lists || [];
        }

        injectListMenu() {
            const styles = \`
                .list-menu-btn {
                    position: fixed; top: 20px; right: 20px; background: #f59e0b; 
                    color: #0b1633; border: none; width: 50px; height: 50px; 
                    border-radius: 50%; font-size: 24px; font-weight: bold; 
                    cursor: pointer; z-index: 10000; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                    transition: all 0.3s ease;
                }
                .list-menu-btn:hover { transform: scale(1.1); background: #ffb84d; }
                .list-dropdown {
                    position: fixed; top: 80px; right: 20px; background: #132347; 
                    border: 1px solid #f59e0b; border-radius: 10px; padding: 15px; 
                    min-width: 250px; display: none; z-index: 10000;
                    box-shadow: 0 8px 25px rgba(0,0,0,0.3);
                }
                .list-item { display: flex; align-items: center; gap: 10px; padding: 8px 0; 
                    cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.1); }
                .list-item:last-child { border-bottom: none; }
                .list-item:hover { color: #f59e0b; }
                .list-checkbox { width: 18px; height: 18px; border: 2px solid #f59e0b;
                    border-radius: 4px; display: flex; align-items: center; justify-content: center; }
                .list-checkbox.checked { background: #f59e0b; }
                .list-checkbox.checked::after { content: "✓"; color: #0b1633; 
                    font-size: 12px; font-weight: bold; }
                .new-list-input { width: 100%; padding: 8px; background: #0b1633;
                    border: 1px solid #f59e0b; border-radius: 6px; color: white; margin: 10px 0; }
                .add-list-btn { background: #f59e0b; color: #0b1633; border: none;
                    padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: bold; 
                    width: 100%; margin-top: 10px; }
            \`;

            const styleSheet = document.createElement('style');
            styleSheet.textContent = styles;
            document.head.appendChild(styleSheet);

            const menuBtn = document.createElement('button');
            menuBtn.className = 'list-menu-btn';
            menuBtn.innerHTML = '⋮';
            menuBtn.title = 'Add to Lists';

            const dropdown = document.createElement('div');
            dropdown.className = 'list-dropdown';

            menuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
                if (dropdown.style.display === 'block') this.updateDropdown(dropdown);
            });

            document.addEventListener('click', () => dropdown.style.display = 'none');
            dropdown.addEventListener('click', (e) => e.stopPropagation());

            document.body.appendChild(menuBtn);
            document.body.appendChild(dropdown);
        }

        async updateDropdown(dropdown) {
            dropdown.innerHTML = '<h4 style="margin:0 0 10px 0;color:#f59e0b">Add to Lists</h4>';

            // Default lists
            const lists = [
                { id: 'favorites', name: '❤️ Favorites' },
                { id: 'visited', name: '🍽️ Visited' },
                { id: 'wantToGo', name: '📍 Want to Go' }
            ];

            for (const list of lists) {
                const isInList = await this.checkIfInList(list.id);
                const item = document.createElement('div');
                item.className = 'list-item';
                item.innerHTML = \`<div class="list-checkbox \${isInList ? 'checked' : ''}"></div><span>\${list.name}</span>\`;
                item.onclick = () => this.toggleList(list.id);
                dropdown.appendChild(item);
            }

            // Custom lists
            if (this.userLists.length) {
                const divider = document.createElement('div');
                divider.style.cssText = 'border-top:1px solid #f59e0b;margin:10px 0;padding-top:10px;';
                dropdown.appendChild(divider);

                this.userLists.filter(list => !['Favorites','Visited','Want to Go'].includes(list.title))
                    .forEach(list => {
                        const isInList = await this.checkIfCustomList(list.id);
                        const item = document.createElement('div');
                        item.className = 'list-item';
                        item.innerHTML = \`<div class="list-checkbox \${isInList ? 'checked' : ''}"></div><span>\${list.title}</span>\`;
                        item.onclick = () => this.toggleCustomList(list.id);
                        dropdown.appendChild(item);
                    });
            }

            // New list input
            const newDiv = document.createElement('div');
            newDiv.style.cssText = 'border-top:1px solid #f59e0b;margin:10px 0;padding-top:10px;';
            newDiv.innerHTML = \`
                <input type="text" class="new-list-input" placeholder="New list name" id="newListName">
                <button class="add-list-btn">Create New List</button>
            \`;
            newDiv.querySelector('button').onclick = () => this.createNewList();
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
            if (!this.currentUser || !this.restaurantId) return;
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
            } else {
                await this.supabase.from('lists_restraunts').insert([
                    { list_id: list.id, restraunt_id: this.restaurantId }
                ]);
            }
            this.updateDropdown(document.querySelector('.list-dropdown'));
        }

        async toggleCustomList(listId) {
            if (!this.currentUser || !this.restaurantId) return;
            const isInList = await this.checkIfCustomList(listId);
            if (isInList) {
                await this.supabase.from('lists_restraunts').delete()
                    .match({ list_id: listId, restraunt_id: this.restaurantId });
            } else {
                await this.supabase.from('lists_restraunts').insert([
                    { list_id: listId, restraunt_id: this.restaurantId }
                ]);
            }
            this.updateDropdown(document.querySelector('.list-dropdown'));
        }

        async createNewList() {
            const input = document.getElementById('newListName');
            const name = input.value.trim();
            if (!name) return;
            const { data: newList } = await this.supabase.from('lists')
                .insert([{ user_id: this.currentUser.id, title: name }]).select().single();
            if (newList) {
                this.userLists.push(newList);
                input.value = '';
                this.updateDropdown(document.querySelector('.list-dropdown'));
            }
        }
    }

    setTimeout(() => new RestaurantListManager(), 1000);
})();
</script>
`;

console.log('🚀 Adding list buttons to all restaurant pages...');

fs.readdirSync(folderPath).forEach((file) => {
    if (file.endsWith(".html")) {
        const filePath = path.join(folderPath, file);
        let content = fs.readFileSync(filePath, "utf8");

        // Only add if not already there
        if (!content.includes('list-menu-btn')) {
            content = content.replace("</body>", `${scriptCode}</body>`);
            fs.writeFileSync(filePath, content, "utf8");
            console.log(`✅ Added to ${file}`);
        } else {
            console.log(`⏭️  Already exists in ${file}`);
        }
    }
});

console.log('🎉 Done! All restaurant pages updated.');