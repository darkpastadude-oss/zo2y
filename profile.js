// Profile Management System
class ProfileManager {
    constructor() {
        this.currentUser = null;
        this.userData = null;
        this.init();
    }

    init() {
        this.loadUserData();
        this.setupEventListeners();
        this.loadProfileData();
    }

    loadUserData() {
        const userData = localStorage.getItem('zo2y-currentUser');
        if (!userData) {
            window.location.href = 'login.html';
            return;
        }
        this.currentUser = JSON.parse(userData);
        
        // Load extended user profile
        this.userData = JSON.parse(localStorage.getItem(`zo2y-profile-${this.currentUser.id}`)) || this.createDefaultProfile();
    }

    createDefaultProfile() {
        return {
            id: this.currentUser.id,
            displayName: this.currentUser.name,
            bio: 'Food enthusiast exploring local gems',
            avatar: this.currentUser.name.charAt(0).toUpperCase(),
            favoriteCuisines: [],
            friends: [],
            customLists: [],
            activity: [],
            stats: {
                reviews: 0,
                friends: 0,
                lists: 0
            },
            preferences: {
                theme: 'light',
                notifications: true
            }
        };
    }

    setupEventListeners() {
        // Friend search
        document.getElementById('friendSearch').addEventListener('input', (e) => {
            this.searchFriends(e.target.value);
        });
    }

    loadProfileData() {
        if (!this.userData) return;

        // Update UI with user data
        document.getElementById('userDisplayName').textContent = this.userData.displayName;
        document.getElementById('userBio').textContent = this.userData.bio;
        document.getElementById('userAvatar').textContent = this.userData.avatar;
        
        // Update stats
        document.getElementById('reviewsCount').textContent = this.userData.stats.reviews;
        document.getElementById('friendsCount').textContent = this.userData.friends.length;
        document.getElementById('listsCount').textContent = this.userData.customLists.length;

        // Load activity feed
        this.loadActivityFeed();
        
        // Load user lists
        this.loadUserLists();
        
        // Load friends
        this.loadFriends();
        
        // Load settings
        this.loadSettings();
    }

    loadActivityFeed() {
        const activityFeed = document.getElementById('activityFeed');
        if (!this.userData.activity.length) {
            activityFeed.innerHTML = '<p style="color: var(--muted); text-align: center; padding: 40px;">No activity yet</p>';
            return;
        }

        activityFeed.innerHTML = this.userData.activity.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    ${this.getActivityIcon(activity.type)}
                </div>
                <div>
                    <strong>${activity.message}</strong>
                    <div style="color: var(--muted); font-size: 0.9rem;">${this.formatTime(activity.timestamp)}</div>
                </div>
            </div>
        `).join('');
    }

    getActivityIcon(type) {
        const icons = {
            'review': '⭐',
            'friend_add': '👥',
            'list_create': '📝',
            'restaurant_add': '🍽️'
        };
        return icons[type] || '📢';
    }

    formatTime(timestamp) {
        return new Date(timestamp).toLocaleDateString();
    }

    loadUserLists() {
        const userLists = document.getElementById('userLists');
        if (!this.userData.customLists.length) {
            userLists.innerHTML = '<p style="color: var(--muted); text-align: center; padding: 40px; grid-column: 1 / -1;">No lists created yet</p>';
            return;
        }

        userLists.innerHTML = this.userData.customLists.map(list => `
            <div class="card">
                <h3>${list.name}</h3>
                <p style="color: var(--muted); margin: 10px 0;">${list.description}</p>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: var(--accent); font-weight: 600;">${list.restaurants.length} restaurants</span>
                    <button class="btn" onclick="viewList('${list.id}')">View</button>
                </div>
            </div>
        `).join('');
    }

    loadFriends() {
        const friendsList = document.getElementById('friendsList');
        if (!this.userData.friends.length) {
            friendsList.innerHTML = '<p style="color: var(--muted); text-align: center; padding: 40px; grid-column: 1 / -1;">No friends yet</p>';
            return;
        }

        friendsList.innerHTML = this.userData.friends.map(friend => `
            <div class="friend-card card">
                <div class="friend-avatar">${friend.avatar}</div>
                <h4>${friend.name}</h4>
                <p style="color: var(--muted); font-size: 0.9rem;">${friend.mutualFriends} mutual friends</p>
                <button class="btn" style="margin-top: 10px;" onclick="viewFriendProfile('${friend.id}')">View Profile</button>
            </div>
        `).join('');
    }

    loadSettings() {
        document.getElementById('displayName').value = this.userData.displayName;
        document.getElementById('userBioInput').value = this.userData.bio;
        
        // Load favorite cuisines
        const cuisineSelect = document.getElementById('favoriteCuisines');
        Array.from(cuisineSelect.options).forEach(option => {
            option.selected = this.userData.favoriteCuisines.includes(option.value);
        });
    }

    searchFriends(query) {
        if (!query.trim()) {
            document.getElementById('friendSearchResults').innerHTML = '';
            return;
        }

        // Mock friend search - in real app, this would call an API
        const mockResults = [
            { id: 'friend1', name: 'FoodieFriend', avatar: 'F', mutualFriends: 3 },
            { id: 'friend2', name: 'BurgerLover', avatar: 'B', mutualFriends: 1 }
        ].filter(friend => 
            friend.name.toLowerCase().includes(query.toLowerCase())
        );

        const resultsHTML = mockResults.map(friend => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid var(--border);">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 30px; height: 30px; border-radius: 50%; background: var(--accent); display: flex; align-items: center; justify-content: center; font-weight: bold;">${friend.avatar}</div>
                    <div>
                        <strong>${friend.name}</strong>
                        <div style="color: var(--muted); font-size: 0.8rem;">${friend.mutualFriends} mutual friends</div>
                    </div>
                </div>
                <button class="btn btn-primary" onclick="sendFriendRequest('${friend.id}')">Add Friend</button>
            </div>
        `).join('');

        document.getElementById('friendSearchResults').innerHTML = resultsHTML || '<p style="color: var(--muted); text-align: center; padding: 20px;">No users found</p>';
    }

    updateProfile() {
        const displayName = document.getElementById('displayName').value;
        const bio = document.getElementById('userBioInput').value;

        this.userData.displayName = displayName;
        this.userData.bio = bio;

        this.saveProfile();
        this.loadProfileData();
        
        alert('Profile updated successfully!');
    }

    savePreferences() {
        const cuisineSelect = document.getElementById('favoriteCuisines');
        const selectedCuisines = Array.from(cuisineSelect.selectedOptions).map(option => option.value);
        
        this.userData.favoriteCuisines = selectedCuisines;
        this.saveProfile();
        
        alert('Preferences saved!');
    }

    selectAvatar(avatar) {
        this.userData.avatar = avatar;
        this.saveProfile();
        this.loadProfileData();
        closeAvatarModal();
    }

    createNewList() {
        const name = document.getElementById('newListName').value;
        const description = document.getElementById('newListDesc').value;

        if (!name.trim()) {
            alert('Please enter a list name');
            return;
        }

        const newList = {
            id: 'list-' + Date.now(),
            name: name,
            description: description,
            restaurants: [],
            createdAt: new Date().toISOString()
        };

        this.userData.customLists.push(newList);
        this.userData.stats.lists = this.userData.customLists.length;
        
        // Add activity
        this.addActivity('list_create', `Created list "${name}"`);
        
        this.saveProfile();
        this.loadProfileData();
        closeCreateListModal();
        
        alert('List created successfully!');
    }

    addActivity(type, message) {
        this.userData.activity.unshift({
            type: type,
            message: message,
            timestamp: new Date().toISOString()
        });
        
        // Keep only last 50 activities
        this.userData.activity = this.userData.activity.slice(0, 50);
    }

    saveProfile() {
        localStorage.setItem(`zo2y-profile-${this.currentUser.id}`, JSON.stringify(this.userData));
    }
}

// Global functions for HTML onclick events
let profileManager;

function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName + '-tab').classList.add('active');
    
    // Add active class to clicked tab
    event.target.classList.add('active');
}

function openAvatarModal() {
    document.getElementById('avatarModal').style.display = 'block';
}

function closeAvatarModal() {
    document.getElementById('avatarModal').style.display = 'none';
}

function openCreateListModal() {
    document.getElementById('createListModal').style.display = 'block';
}

function closeCreateListModal() {
    document.getElementById('createListModal').style.display = 'none';
}

function openAddFriendModal() {
    document.getElementById('addFriendModal').style.display = 'block';
}

function closeAddFriendModal() {
    document.getElementById('addFriendModal').style.display = 'none';
}

function logout() {
    localStorage.removeItem('zo2y-currentUser');
    window.location.href = 'login.html';
}

function sendFriendRequest(friendId) {
    // In a real app, this would send a friend request
    alert('Friend request sent!');
    closeAddFriendModal();
}

function viewList(listId) {
    // Navigate to list detail page
    alert(`Viewing list ${listId} - This would open a detailed view`);
}

function viewFriendProfile(friendId) {
    // Navigate to friend's profile
    alert(`Viewing friend ${friendId} - This would open their profile`);
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    profileManager = new ProfileManager();
});