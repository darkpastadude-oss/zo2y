
    (function() {
      'use strict';
      
      // ---------- CONFIG ----------
      const SUPABASE_URL = 'https://gfkhjbztayjyojsgdpgk.supabase.co';
      const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma2hqYnp0YXlqeW9qc2dkcGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwOTYyNjQsImV4cCI6MjA3NTY3MjI2NH0.WUb2yDAwCeokdpWCPeH13FE8NhWF6G8e6ivTsgu6b2s';
      
      // Wait for Supabase to load before creating client
      let supabase;
      function initSupabase() {
        if (window.supabase && window.supabase.createClient) {
          supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
            auth: {
              flowType: 'pkce',
              persistSession: true,
              autoRefreshToken: true,
              detectSessionInUrl: true
            }
          });
          console.log('✅ Supabase client initialized');
          return true;
        }
        return false;
      }
      
      // ---------- GLOBAL STATE ----------
      const state = {
        restaurants: [],
        filteredRestaurants: [],
        categories: new Map(),
        cloudKitchens: new Set(),
        currentPage: 1,
        pageSize: 20,
        totalPages: 1,
        isLoading: false,
        activeFilters: {
          search: '',
          category: 'all',
          quickFilter: 'all',
          sort: 'rating-desc'
        },
        restaurantImages: new Map(),
        currentModalRestaurant: null,
        currentUser: null,
        isLoggedIn: false,
        // Store restaurant list statuses for instant access
        restaurantListStatuses: new Map(),
        listManager: {
          userLists: [],
          customLists: [],
          currentLists: {
            favorites: null,
            visited: null,
            wantToGo: null
          },
          
          async init() { 
            console.log('🔄 Initializing list manager...');
            if (!state.isLoggedIn || !state.currentUser || !supabase) {
              console.log('❌ List manager not initialized: Not logged in');
              return;
            }
            
            await this.loadUserLists();
            // Load all restaurant statuses immediately - CRITICAL OPTIMIZATION
            await this.loadAllRestaurantStatuses();
            console.log('✅ List manager initialized');
          },
          
          async loadUserLists() {
            try {
              console.log('📋 Loading user lists...');
              if (!state.currentUser || !supabase) return;

              const { data: lists, error } = await supabase
                .from('lists')
                .select('*')
                .eq('user_id', state.currentUser.id);
              
              if (error) throw error;
              
              this.userLists = lists || [];
              this.customLists = this.userLists.filter(list => 
                !['Favorites', 'Visited', 'Want to Go'].includes(list.title)
              );
              console.log(`📋 Found ${this.userLists.length} lists (${this.customLists.length} custom)`);
              
              await this.setupDefaultLists();
              await this.loadListRestaurants();
              
            } catch (error) {
              console.error('Error loading lists:', error);
            }
          },
          
          async setupDefaultLists() {
            if (!state.currentUser || !supabase) return;
            
            this.currentLists.favorites = this.userLists.find(list => list.title === 'Favorites');
            this.currentLists.visited = this.userLists.find(list => list.title === 'Visited'); 
            this.currentLists.wantToGo = this.userLists.find(list => list.title === 'Want to Go');
            
            if (!this.currentLists.favorites) {
              this.currentLists.favorites = await this.createList('Favorites', 'My favorite restaurants');
            }
            if (!this.currentLists.visited) {
              this.currentLists.visited = await this.createList('Visited', 'Restaurants I have visited');
            }
            if (!this.currentLists.wantToGo) {
              this.currentLists.wantToGo = await this.createList('Want to Go', 'Restaurants I want to try');
            }
          },
          
          async createList(title, description) {
            if (!state.currentUser || !supabase) return null;
            
            const { data: newList, error } = await supabase
              .from('lists')
              .insert([
                {
                  user_id: state.currentUser.id,
                  title: title,
                  description: description,
                  icon: '📋',
                  is_default: title === 'Favorites' || title === 'Visited' || title === 'Want to Go'
                }
              ])
              .select()
              .single();
            
            if (error) {
              console.error('Error creating list:', error);
              return null;
            }
            
            this.userLists.push(newList);
            if (!newList.is_default) {
              this.customLists.push(newList);
            }
            return newList;
          },
          
          async loadListRestaurants() {
            if (!supabase) return;
            
            for (const listType in this.currentLists) {
              const list = this.currentLists[listType];
              if (list) {
                const { data: listRestaurants, error } = await supabase
                  .from('lists_restraunts')
                  .select('restraunt_id')
                  .eq('list_id', list.id);
                
                if (!error && listRestaurants) {
                  list.restaurants = listRestaurants.map(item => item.restraunt_id);
                } else {
                  list.restaurants = [];
                }
              }
            }
            
            // Also load custom lists restaurants
            for (const list of this.customLists) {
              const { data: listRestaurants, error } = await supabase
                .from('lists_restraunts')
                .select('restraunt_id')
                .eq('list_id', list.id);
              
              if (!error && listRestaurants) {
                list.restaurants = listRestaurants.map(item => item.restraunt_id);
              } else {
                list.restaurants = [];
              }
            }
          },
          
          // NEW: Load all restaurant statuses at once - CRITICAL OPTIMIZATION
          async loadAllRestaurantStatuses() {
            console.log('📊 Loading all restaurant statuses...');
            if (!supabase || !state.isLoggedIn || !state.currentUser) {
              console.log('❌ Cannot load statuses: Not authenticated');
              return;
            }
            
            try {
              // Get list IDs for the current user
              const listIds = [
                this.currentLists.favorites?.id,
                this.currentLists.visited?.id,
                this.currentLists.wantToGo?.id,
                ...this.customLists.map(list => list.id)
              ].filter(Boolean);
              
              if (listIds.length === 0) {
                console.log('📊 No lists found for user');
                // Initialize empty statuses for all restaurants
                state.restaurants.forEach(restaurant => {
                  state.restaurantListStatuses.set(restaurant.id, {
                    favorites: false,
                    visited: false,
                    wantToGo: false,
                    customLists: []
                  });
                });
                return;
              }
              
              // Get all restaurants in user's lists in a single query
              const { data: allListRestaurants, error } = await supabase
                .from('lists_restraunts')
                .select('list_id, restraunt_id')
                .in('list_id', listIds);
              
              if (error) throw error;
              
              // Initialize statuses for all restaurants first
              state.restaurants.forEach(restaurant => {
                state.restaurantListStatuses.set(restaurant.id, {
                  favorites: false,
                  visited: false,
                  wantToGo: false,
                  customLists: []
                });
              });
              
              // Group by restaurant ID and update statuses
              allListRestaurants?.forEach(item => {
                const restaurantId = item.restraunt_id;
                let status = state.restaurantListStatuses.get(restaurantId);
                
                if (!status) {
                  status = {
                    favorites: false,
                    visited: false,
                    wantToGo: false,
                    customLists: []
                  };
                }
                
                // Check which list this restaurant is in
                if (item.list_id === this.currentLists.favorites?.id) {
                  status.favorites = true;
                }
                if (item.list_id === this.currentLists.visited?.id) {
                  status.visited = true;
                }
                if (item.list_id === this.currentLists.wantToGo?.id) {
                  status.wantToGo = true;
                }
                
                // Check if it's in any custom lists
                const customList = this.customLists.find(l => l.id === item.list_id);
                if (customList) {
                  status.customLists.push({
                    id: customList.id,
                    name: customList.title,
                    icon: customList.icon || '📋'
                  });
                }
                
                state.restaurantListStatuses.set(restaurantId, status);
              });
              
              console.log(`✅ Loaded list statuses for ${state.restaurantListStatuses.size} restaurants`);
              
              // Immediately update all UI elements
              renderRestaurants();
              
            } catch (error) {
              console.error('Error loading restaurant statuses:', error);
              // Initialize empty statuses as fallback
              state.restaurants.forEach(restaurant => {
                state.restaurantListStatuses.set(restaurant.id, {
                  favorites: false,
                  visited: false,
                  wantToGo: false,
                  customLists: []
                });
              });
            }
          },
          
          async toggleInList(listType, restaurantId) {
            if (!supabase) return false;
            
            let list;
            if (listType === 'favorites') {
              list = this.currentLists.favorites;
            } else if (listType === 'visited') {
              list = this.currentLists.visited;
            } else if (listType === 'wantToGo') {
              list = this.currentLists.wantToGo;
            } else {
              // For custom lists, listType is the list ID
              list = this.customLists.find(l => l.id === listType);
            }
            
            if (!list) {
              console.error('List not found:', listType);
              return false;
            }
            
            const isInList = this.isInList(listType, restaurantId);
            
            try {
              if (isInList) {
                const { error } = await supabase
                  .from('lists_restraunts')
                  .delete()
                  .match({
                    list_id: list.id,
                    restraunt_id: restaurantId
                  });
                
                if (error) throw error;
                
                // Update local state immediately
                this.updateLocalStatus(listType, restaurantId, false);
                showNotification(`Removed from ${list.title}`, 'info');
                return false;
                
              } else {
                const { error } = await supabase
                  .from('lists_restraunts')
                  .insert([
                    {
                      list_id: list.id,
                      restraunt_id: restaurantId,
                      added_at: new Date().toISOString()
                    }
                  ]);
                
                if (error) throw error;
                
                // Update local state immediately
                this.updateLocalStatus(listType, restaurantId, true);
                showNotification(`Added to ${list.title}`, 'success');
                return true;
              }
              
            } catch (error) {
              console.error('Error updating list:', error);
              showNotification('Failed to update list', 'error');
              return isInList;
            }
          },
          
          // Update local status immediately with custom lists support
          updateLocalStatus(listType, restaurantId, isAdded) {
            const currentStatus = state.restaurantListStatuses.get(restaurantId) || {
              favorites: false,
              visited: false,
              wantToGo: false,
              customLists: []
            };
            
            if (listType === 'favorites') {
              currentStatus.favorites = isAdded;
            } else if (listType === 'visited') {
              currentStatus.visited = isAdded;
            } else if (listType === 'wantToGo') {
              currentStatus.wantToGo = isAdded;
            } else {
              // Handle custom lists
              const list = this.customLists.find(l => l.id === listType);
              if (list) {
                if (isAdded) {
                  // Add to custom lists if not already there
                  if (!currentStatus.customLists.some(l => l.id === list.id)) {
                    currentStatus.customLists.push({
                      id: list.id,
                      name: list.title,
                      icon: list.icon || '📋'
                    });
                  }
                } else {
                  // Remove from custom lists
                  currentStatus.customLists = currentStatus.customLists.filter(l => l.id !== list.id);
                }
              }
            }
            
            state.restaurantListStatuses.set(restaurantId, currentStatus);
            
            // Immediately update the UI
            renderRestaurants();
          },
          
          isInList(listType, restaurantId) {
            // Check local cache first for instant response
            const status = state.restaurantListStatuses.get(restaurantId);
            if (status) {
              if (listType === 'favorites') return status.favorites;
              if (listType === 'visited') return status.visited;
              if (listType === 'wantToGo') return status.wantToGo;
              // For custom lists, check by ID
              if (typeof listType === 'string' && listType !== 'favorites' && listType !== 'visited' && listType !== 'wantToGo') {
                return status.customLists.some(list => list.id === listType);
              }
            }
            
            // Fallback to checking lists
            let list;
            if (listType === 'favorites') {
              list = this.currentLists.favorites;
            } else if (listType === 'visited') {
              list = this.currentLists.visited;
            } else if (listType === 'wantToGo') {
              list = this.currentLists.wantToGo;
            } else {
              list = this.customLists.find(l => l.id === listType);
            }
            
            return list?.restaurants?.includes(restaurantId) || false;
          },
          
          getRestaurantListStatus(restaurantId) {
            if (!state.isLoggedIn) {
              return {
                favorites: false,
                wantToGo: false,
                visited: false,
                customLists: []
              };
            }
            
            // Get from cache for instant response
            const cachedStatus = state.restaurantListStatuses.get(restaurantId);
            if (cachedStatus) {
              return cachedStatus;
            }
            
            // If not in cache, return empty status
            return {
              favorites: false,
              wantToGo: false,
              visited: false,
              customLists: []
            };
          }
        },
        showAllMode: false,
        isPaginationVisible: false,
        lastScrollPosition: 0,
        sentinelObserver: null
      };
      // ---------- OPTIMIZED INITIALIZATION ----------
      async function initializeAuth() {
        console.log('?? Initializing auth...');
        
        if (!supabase) {
          console.error('Supabase client not initialized');
          setGuestState();
          return;
        }
        
        try {
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('Session error:', sessionError);
            setGuestState();
            return;
          }
          
          if (!session?.user) {
            console.log('?? No active session, setting guest state');
            setGuestState();
            return;
          }
          
          console.log('? User found in session:', session.user.email);
          state.currentUser = session.user;
          state.isLoggedIn = true;
          
          const profileReady = await ensureUserProfileExists(session.user);
          
          if (profileReady) {
            await state.listManager.init();
            setLoggedInState(session.user);
          } else {
            setLoggedInState(session.user);
          }
          
        } catch (error) {
          console.error('? Auth initialization error:', error);
          setGuestState();
        }
        
        supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('?? Auth state change:', event);
          
          if (event === 'SIGNED_OUT') {
            state.currentUser = null;
            state.isLoggedIn = false;
            state.restaurantListStatuses.clear();
            setGuestState();
          } else if (event === 'SIGNED_IN' && session?.user) {
            state.currentUser = session.user;
            state.isLoggedIn = true;
            
            await ensureUserProfileExists(session.user);
            await state.listManager.init();
            setLoggedInState(session.user);
            
            // Refresh UI to show list badges
            renderRestaurants();
          }
        });
      }
      async function ensureUserProfileExists(user, retries = 3) {
        console.log('🔍 Ensuring profile exists for:', user.id);
        
        if (!supabase) return false;
        
        for (let attempt = 1; attempt <= retries; attempt++) {
          console.log(`Attempt ${attempt}/${retries}`);
          
          try {
            if (attempt > 1) {
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
            
            const { data: profile, error: checkError } = await supabase
              .from('user_profiles')
              .select('id, username, full_name, avatar_icon')
              .eq('id', user.id)
              .maybeSingle();
            
            if (profile) {
              console.log('✅ Profile exists:', profile);
              return true;
            }
            
            if (checkError && checkError.code !== 'PGRST116') {
              console.error('Profile check error:', checkError);
            }
            
            console.log('📝 Creating profile for user...');
            
            const userData = user.user_metadata || {};
            const email = user.email || '';
            
            let username = (
              userData.full_name || 
              userData.name || 
              email.split('@')[0] || 
              'user'
            ).toLowerCase()
              .replace(/\s+/g, '_')
              .replace(/[^a-z0-9_]/g, '')
              .substring(0, 30);
            
            const timestamp = Date.now().toString(36).substring(-4);
            username = `${username}_${timestamp}`;
            
            const profileData = {
              id: user.id,
              username: username,
              full_name: userData.full_name || userData.name || username,
              avatar_icon: '🍔',
              bio: '',
              location: '',
              is_private: false
            };
            
            console.log('Profile data:', profileData);
            
            const { data: newProfile, error: createError } = await supabase
              .from('user_profiles')
              .insert([profileData])
              .select()
              .maybeSingle();
            
            if (createError) {
              console.error('❌ Profile creation error:', createError);
              
              if (createError.code === '23505') {
                console.log('Profile already exists (created by trigger)');
                return true;
              }
              
              if (attempt === retries) {
                console.error('All retry attempts failed');
                return false;
              }
              continue;
            }
            
            if (newProfile) {
              console.log('✅ Profile created successfully:', newProfile);
              return true;
            }
            
          } catch (error) {
            console.error('Unexpected error:', error);
            if (attempt === retries) {
              return false;
            }
          }
        }
        
        return false;
      }
      
                  function setLoggedInState(user) {
        try {
          let displayName = 'User';
          const userData = user.user_metadata || {};
          
          displayName = userData.full_name || 
                       userData.name || 
                       user.email?.split('@')[0] || 
                       'User';
          
          const authBtn = document.getElementById('authBtn');
          if (authBtn) {
            authBtn.innerHTML = `<i class="fas fa-user"></i><span>${displayName}</span>`;
            authBtn.onclick = () => {
              window.location.href = 'profile.html';
            };
          }
        } catch (error) {
          console.error('Error setting logged in state:', error);
          setGuestState();
        }
      }
      
      function setGuestState() {
        const authBtn = document.getElementById('authBtn');
        if (authBtn) {
          authBtn.innerHTML = `<i class="fas fa-user"></i><span>Account</span>`;
          authBtn.onclick = () => {
            window.location.href = 'login.html';
          };
        }
        showGuestPromptOnce();
      }
      // ---------- OPTIMIZED RESTAURANT DATA LOADING ----------
      async function loadRestaurantsData() {
        console.log('🍽️ Loading restaurant data...');
        
        if (!supabase) {
          console.error('Supabase client not initialized');
          showEmptyState();
          return;
        }
        
        try {
          // OPTIMIZATION: Load everything in parallel
          const [cloudKitchensResult, restaurantImagesResult, restaurantsResult] = 
            await Promise.allSettled([
              loadCloudKitchens(),
              loadRestaurantImages(),
              supabase
                .from('restraunts')
                .select('id, slug, name, category, description, rating, logo_url, image')
                .order('rating', { ascending: false })
                .limit(100) // Load more for pagination
            ]);
          
          if (restaurantsResult.status === 'fulfilled' && restaurantsResult.value.data) {
            const data = restaurantsResult.value.data;
            
            state.restaurants = data.map(restaurant => ({
              id: restaurant.id,
              slug: restaurant.slug,
              name: restaurant.name,
              category: restaurant.category || 'Restaurant',
              description: restaurant.description || 'Delicious food served with care',
              rating: restaurant.rating || 0,
              logo_url: restaurant.logo_url,
              coverImage: getCoverImageUrl(restaurant.slug) || restaurant.image,
              isCloudKitchen: state.cloudKitchens.has(restaurant.id)
            }));
            
            console.log(`✅ Loaded ${state.restaurants.length} restaurants`);
            
            // Initialize empty statuses for all restaurants
            state.restaurants.forEach(restaurant => {
              if (!state.restaurantListStatuses.has(restaurant.id)) {
                state.restaurantListStatuses.set(restaurant.id, {
                  favorites: false,
                  visited: false,
                  wantToGo: false,
                  customLists: []
                });
              }
            });
            
            // Now load list statuses if user is logged in
            if (state.isLoggedIn) {
              // This will update the badges after statuses are loaded
              await state.listManager.loadAllRestaurantStatuses();
            }
            
            // Render restaurants - badges will be added after statuses are loaded
            await loadCategories();
            populateCategoryDropdown();
            updateItemsPerPageDropdown();
            applyFilters();
            
          } else {
            showEmptyState();
          }
          
        } catch (error) {
          console.error('❌ Error loading restaurants:', error);
          showNotification('Failed to load restaurants', 'error');
          showEmptyState();
        }
      }
      
      async function loadCloudKitchens() {
        try {
          if (!supabase) return;
          
          const { data: cloudKitchens, error } = await supabase
            .from('cloud_kitchens')
            .select('restaurant_id')
            .limit(50);
          
          if (error) {
            console.warn('Error loading cloud kitchens:', error);
            return;
          }
          
          if (cloudKitchens && cloudKitchens.length > 0) {
            state.cloudKitchens.clear();
            cloudKitchens.forEach(ck => {
              state.cloudKitchens.add(ck.restaurant_id);
            });
          }
        } catch (error) {
          console.error('Error loading cloud kitchens:', error);
        }
      }
      
      async function loadRestaurantImages() {
        try {
          if (!supabase) return;
          
          const [galleryData, restaurantsData] = await Promise.all([
            supabase
              .from('restaurant_gallery')
              .select('restaurant_slug, image_url, image_type')
              .limit(200),
            supabase
              .from('restraunts')
              .select('slug, image, logo_url')
              .limit(100)
          ]);
          
          state.restaurantImages.clear();
          
          if (galleryData.data) {
            galleryData.data.forEach(item => {
              if (!state.restaurantImages.has(item.restaurant_slug)) {
                state.restaurantImages.set(item.restaurant_slug, {
                  cover: null,
                  logo: null
                });
              }
              
              const images = state.restaurantImages.get(item.restaurant_slug);
              
              if (item.image_type === 'cover' && item.image_url) {
                images.cover = item.image_url;
              }
              
              if (item.image_type === 'logo' && item.image_url) {
                images.logo = item.image_url;
              }
            });
          }
          
          if (restaurantsData.data) {
            restaurantsData.data.forEach(restaurant => {
              if (!state.restaurantImages.has(restaurant.slug)) {
                state.restaurantImages.set(restaurant.slug, {
                  cover: restaurant.image || null,
                  logo: restaurant.logo_url || null
                });
              }
            });
          }
          
        } catch (error) {
          console.error('Error loading restaurant images:', error);
        }
      }
      
      function getCoverImageUrl(restaurantSlug) {
        const images = state.restaurantImages.get(restaurantSlug);
        return images?.cover || null;
      }
      
      function getLogoUrl(restaurant) {
        const images = state.restaurantImages.get(restaurant.slug);
        if (images?.logo) {
          return images.logo;
        }
        
        if (restaurant.logo_url) {
          return restaurant.logo_url;
        }
        
        return null;
      }
      
      function showEmptyState() {
        const grid = document.getElementById('restaurantGrid');
        if (!grid) return;
        
        grid.innerHTML = '';
        grid.classList.remove('skeleton-grid');
        
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
          <i class="fas fa-utensils"></i>
          <h3>No restaurants found</h3>
          <p>Try adjusting your search or filters</p>
          <button class="btn" id="resetEmpty" style="margin-top: 12px;">Reset All Filters</button>
        `;
        
        grid.appendChild(emptyState);
        
        const resetBtn = document.getElementById('resetEmpty');
        if (resetBtn) {
          resetBtn.addEventListener('click', resetAllFilters);
        }
        
        hidePagination();
      }
      
      async function loadCategories() {
        try {
          const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('sort_order', { ascending: true });
          
          if (error) {
            console.warn('No categories table found, using fallback categories');
            createFallbackCategories();
            return;
          }
          
          state.categories.clear();
          
          if (data && data.length > 0) {
            data.forEach(cat => {
              state.categories.set(cat.id, {
                id: cat.id,
                name: cat.name,
                slug: cat.slug,
                icon: cat.icon,
                description: cat.description,
                sort_order: cat.sort_order || 0
              });
            });
          } else {
            createFallbackCategories();
          }
          
        } catch (error) {
          console.error('Error loading categories:', error);
          createFallbackCategories();
        }
      }
      
      function createFallbackCategories() {
        state.categories.clear();
        const fallbackCategories = [
          { id: 1, name: 'Burgers', slug: 'burgers', icon: '🍔', sort_order: 1 },
          { id: 2, name: 'Chicken', slug: 'chicken', icon: '🍗', sort_order: 2 },
          { id: 3, name: 'Middle Eastern', slug: 'middle-eastern', icon: '🥙', sort_order: 3 },
          { id: 4, name: 'Pizza', slug: 'pizza', icon: '🍕', sort_order: 4 },
          { id: 5, name: 'Asian', slug: 'asian', icon: '🍜', sort_order: 5 },
          { id: 6, name: 'Mexican', slug: 'mexican', icon: '🌮', sort_order: 6 },
          { id: 7, name: 'Cafe & Bakery', slug: 'cafe-bakery', icon: '☕', sort_order: 7 },
          { id: 8, name: 'Fast Food', slug: 'fast-food', icon: '🍟', sort_order: 8 },
          { id: 9, name: 'Seafood', slug: 'seafood', icon: '🐟', sort_order: 9 },
          { id: 10, name: 'International', slug: 'international', icon: '🌍', sort_order: 10 }
        ];
        
        fallbackCategories.forEach(cat => {
          state.categories.set(cat.id, cat);
        });
      }
      
      function populateCategoryDropdown() {
        const select = document.getElementById('categorySelect');
        if (!select) return;
        
        select.innerHTML = '<option value="all">All Categories</option>';
        
        const sortedCategories = Array.from(state.categories.values())
          .sort((a, b) => {
            if (a.sort_order !== undefined && b.sort_order !== undefined) {
              return a.sort_order - b.sort_order;
            }
            return a.name.localeCompare(b.name);
          });
        
        sortedCategories.forEach(cat => {
          const option = document.createElement('option');
          option.value = cat.id;
          option.textContent = `${cat.icon || '🍴'} ${cat.name}`;
          select.appendChild(option);
        });
      }
      
      function updateItemsPerPageDropdown() {
        const select = document.getElementById('itemsPerPage');
        if (!select) return;
        
        select.innerHTML = '';
        
        const option20 = document.createElement('option');
        option20.value = '20';
        option20.textContent = '20';
        select.appendChild(option20);
        
        const option40 = document.createElement('option');
        option40.value = '40';
        option40.textContent = '40';
        select.appendChild(option40);
        
        const option60 = document.createElement('option');
        option60.value = '60';
        option60.textContent = '60';
        select.appendChild(option60);
        
        const optionAll = document.createElement('option');
        optionAll.value = state.restaurants.length.toString();
        optionAll.textContent = 'All';
        select.appendChild(optionAll);
        
        try {
          const savedItems = localStorage.getItem('zo2y_items_per_page');
          if (savedItems) {
            const validOptions = Array.from(select.options).map(opt => opt.value);
            if (validOptions.includes(savedItems)) {
              select.value = savedItems;
              state.pageSize = parseInt(savedItems);
              state.showAllMode = (savedItems === state.restaurants.length.toString());
            }
          }
        } catch (e) {}
      }
      
      // ---------- RESTAURANT CARD CREATION ----------
      function createRestaurantCard(restaurant) {
        const card = document.createElement('div');
        card.className = 'restaurant-card';
        card.dataset.id = restaurant.id;
        
        const rating = restaurant.rating || 0;
        const categoryIcon = getCategoryIconFallback(restaurant.category);
        const category = restaurant.category || 'Restaurant';
        const logoUrl = getLogoUrl(restaurant);
        const status = state.listManager.getRestaurantListStatus(restaurant.id);
        const hasCoverImage = restaurant.coverImage && restaurant.coverImage !== '';
        const isCloudKitchen = restaurant.isCloudKitchen || false;
        const cloudBadge = isCloudKitchen ? createCloudBadge(restaurant.id) : '';
        
        let listBadges = '';
        
        // Add default list badges
        if (status.favorites) {
          listBadges += `
            <div class="list-badge">
              ❤️
              <div class="list-badge-tooltip">Favorited</div>
            </div>
          `;
        }
        
        if (status.wantToGo) {
          listBadges += `
            <div class="list-badge">
              📍
              <div class="list-badge-tooltip">Want to go to</div>
            </div>
          `;
        }
        
        if (status.visited) {
          listBadges += `
            <div class="list-badge">
              ✓
              <div class="list-badge-tooltip">Visited</div>
            </div>
          `;
        }
        
        // Add custom list badges (max 2 to avoid clutter)
        const customListCount = status.customLists.length;
        if (customListCount > 0) {
          // Show first custom list with count badge
          const firstList = status.customLists[0];
          listBadges += `
            <div class="list-badge">
              ${firstList.icon || '📋'}
              <div class="list-badge-tooltip">
                <strong>${firstList.name}</strong>
                ${customListCount > 1 ? `<br>+ ${customListCount - 1} more list${customListCount > 2 ? 's' : ''}` : ''}
              </div>
            </div>
          `;
        }
        
        // FIXED: Changed all data-src to src with loading="eager" for instant loading
        card.innerHTML = `
          <a href="restaurant.html?slug=${restaurant.slug}" class="card-link">
            <div class="card-image">
              ${hasCoverImage ? `
                <img class="restaurant-image" 
                     src="${restaurant.coverImage}" 
                     alt="${restaurant.name}" 
                     loading="eager"
                     width="300" 
                     height="200">
              ` : ''}
              ${logoUrl ? `
                <div class="logo-overlay">
                  <img src="${logoUrl}" 
                       alt="${restaurant.name} logo" 
                       width="48" 
                       height="48"
                       loading="eager">
                </div>
              ` : ''}
              
              ${listBadges ? `<div class="list-badges-container">${listBadges}</div>` : ''}
              
              ${cloudBadge}
              
              <div class="menu-btn-container">
                <button class="menu-btn" aria-label="Restaurant actions">
                  <i class="fas fa-ellipsis-h"></i>
                  <div class="menu-btn-tooltip">Save to lists</div>
                </button>
              </div>
            </div>
            <div class="card-content">
              <div class="card-header">
                <div class="card-title-wrapper">
                  <h3 class="card-title">${restaurant.name}</h3>
                </div>
                <div class="card-rating">
                  <i class="fas fa-star"></i>
                  ${rating.toFixed(1)}
                </div>
              </div>
              <div class="card-category">
                <span>${categoryIcon}</span>
                ${category}
              </div>
              <p class="card-description">${restaurant.description || 'Delicious food served with care'}</p>
              <div class="card-footer">
                <div class="card-location">Click to view details</div>
              </div>
            </div>
          </a>
        `;
        
        const menuBtn = card.querySelector('.menu-btn');
        if (menuBtn) {
          menuBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            showModal({
              id: restaurant.id,
              name: restaurant.name,
              slug: restaurant.slug
            });
          });
        }
        
        return card;
      }
      
      function createCloudBadge(restaurantId) {
        if (!state.cloudKitchens.has(restaurantId)) return '';
        
        return `
          <div class="cloud-badge" aria-label="Cloud Kitchen">
            <i class="fas fa-cloud"></i>
            <div class="cloud-tooltip">
              Cloud Kitchen
            </div>
          </div>
        `;
      }
      
      function getCategoryIconFallback(categoryName) {
        const icons = {
          'Burgers': '🍔',
          'Chicken': '🍗',
          'Middle Eastern': '🥙',
          'Pizza': '🍕',
          'Asian': '🍜',
          'Mexican': '🌮',
          'Cafe & Bakery': '☕',
          'Fast Food': '🍟',
          'Seafood': '🐟',
          'Breakfast': '🥞',
          'Desserts': '🍰',
          'Indian': '🍛',
          'BBQ & Ribs': '🥩',
          'International': '🌍'
        };
        
        return icons[categoryName] || '🍴';
      }
      
      // ---------- FILTERING & SORTING ----------
      function applyFilters() {
        let filtered = [...state.restaurants];
        
        if (state.activeFilters.search) {
          const searchTerm = state.activeFilters.search.toLowerCase();
          filtered = filtered.filter(r => 
            r.name.toLowerCase().includes(searchTerm) ||
            (r.description && r.description.toLowerCase().includes(searchTerm)) ||
            (r.category && r.category.toLowerCase().includes(searchTerm))
          );
        }
        
        if (state.activeFilters.category !== 'all') {
          const categoryId = parseInt(state.activeFilters.category);
          filtered = filtered.filter(r => {
            // First check if restaurant has category_id
            if (r.category_id) {
              return r.category_id === categoryId;
            }
            // Fallback to category name matching
            const category = state.categories.get(categoryId);
            return category && r.category === category.name;
          });
        }
        
        filtered = applyQuickFilter(filtered, state.activeFilters.quickFilter);
        filtered = sortRestaurants(filtered, state.activeFilters.sort);
        
        state.filteredRestaurants = filtered;
        state.currentPage = 1;
        state.totalPages = Math.ceil(filtered.length / state.pageSize);
        
        renderRestaurants();
        updateCounts();
        updatePagination();
      }
      
      function applyQuickFilter(restaurants, filterType) {
        switch(filterType) {
          case 'trending':
            return restaurants.filter(r => (r.rating || 0) >= 4.3);
          case 'top-rated':
            return restaurants.filter(r => (r.rating || 0) >= 4.5);
          case 'new':
            return restaurants.filter(r => Math.random() > 0.7);
          default:
            return restaurants;
        }
      }
      
      function sortRestaurants(restaurants, sortType) {
        const sorted = [...restaurants];
        
        switch(sortType) {
          case 'rating-desc':
            return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
          case 'rating-asc':
            return sorted.sort((a, b) => (a.rating || 0) - (b.rating || 0));
          case 'name-asc':
            return sorted.sort((a, b) => a.name.localeCompare(b.name));
          case 'name-desc':
            return sorted.sort((a, b) => b.name.localeCompare(a.name));
          default:
            return sorted;
        }
      }
      
      // ---------- RENDERING ----------
      function showLoadingSkeleton() {
        const grid = document.getElementById('restaurantGrid');
        if (!grid) return;
        
        grid.innerHTML = '';
        grid.classList.add('skeleton-grid');
        
        for (let i = 0; i < 8; i++) {
          const skeleton = document.createElement('div');
          skeleton.className = 'skeleton-card';
          skeleton.innerHTML = `
            <div class="skeleton-image"></div>
            <div class="skeleton-content">
              <div class="skeleton-line" style="width: 70%"></div>
              <div class="skeleton-line short"></div>
              <div class="skeleton-line"></div>
              <div class="skeleton-line" style="width: 40%"></div>
            </div>
          `;
          grid.appendChild(skeleton);
        }
      }
      
      async function renderRestaurants() {
        const grid = document.getElementById('restaurantGrid');
        if (!grid) return;
        
        if (state.filteredRestaurants.length === 0) {
          showEmptyState();
          return;
        }
        
        grid.classList.remove('skeleton-grid');
        
        let itemsToShow;
        if (state.showAllMode) {
          // Show all restaurants
          itemsToShow = state.filteredRestaurants;
        } else {
          // Show paginated results
          const startIdx = (state.currentPage - 1) * state.pageSize;
          const endIdx = Math.min(startIdx + state.pageSize, state.filteredRestaurants.length);
          itemsToShow = state.filteredRestaurants.slice(startIdx, endIdx);
        }
        
        grid.innerHTML = '';
        
        // Create document fragment for better performance
        const fragment = document.createDocumentFragment();
        
        for (const restaurant of itemsToShow) {
          const card = createRestaurantCard(restaurant);
          fragment.appendChild(card);
        }
        
        grid.appendChild(fragment);
        
        // Add sentinel for pagination only if not in "show all" mode
        if (!state.showAllMode && state.totalPages > 1 && state.currentPage < state.totalPages) {
          addPaginationSentinel();
        } else {
          removePaginationSentinel();
          hidePagination();
        }
      }
      
      // ---------- PAGINATION ----------
      function updatePagination() {
        const totalPages = state.totalPages;
        
        // Update mobile pagination info
        const mobilePageInfo = document.getElementById('mobilePageInfo');
        if (mobilePageInfo) {
          mobilePageInfo.innerHTML = `Page <span class="page-number">${state.currentPage}</span> of <span class="page-number">${totalPages}</span>`;
        }
        
        const mobilePrevBtn = document.getElementById('mobilePrevBtn');
        const mobileNextBtn = document.getElementById('mobileNextBtn');
        
        if (mobilePrevBtn) mobilePrevBtn.disabled = state.currentPage === 1 || state.showAllMode;
        if (mobileNextBtn) mobileNextBtn.disabled = state.currentPage === totalPages || state.showAllMode;
        
        if (mobilePrevBtn) {
          mobilePrevBtn.onclick = () => {
            if (state.currentPage > 1 && !state.showAllMode) {
              state.currentPage--;
              renderRestaurants();
              updatePagination();
              updateCounts();
              window.scrollTo({ top: 0, behavior: 'smooth' });
              hidePagination();
            }
          };
        }
        
        if (mobileNextBtn) {
          mobileNextBtn.onclick = () => {
            if (state.currentPage < totalPages && !state.showAllMode) {
              state.currentPage++;
              renderRestaurants();
              updatePagination();
              updateCounts();
              window.scrollTo({ top: 0, behavior: 'smooth' });
              hidePagination();
            }
          };
        }
        
        // Hide pagination initially
        hidePagination();
      }
      
      function addPaginationSentinel() {
        // Remove existing sentinel if any
        removePaginationSentinel();
        
        // Create a sentinel element at the bottom of the grid
        const grid = document.getElementById('restaurantGrid');
        if (!grid) return;
        
        const sentinel = document.createElement('div');
        sentinel.className = 'pagination-sentinel';
        
        grid.appendChild(sentinel);
        
        // Setup intersection observer to show pagination when sentinel is near
        if (state.sentinelObserver) {
          state.sentinelObserver.disconnect();
        }
        
        state.sentinelObserver = new IntersectionObserver(
          (entries) => {
            entries.forEach(entry => {
              if (entry.isIntersecting && !state.showAllMode && state.currentPage < state.totalPages) {
                showPagination();
              }
            });
          },
          {
            root: null,
            rootMargin: '200px 0px', // Show 200px before sentinel reaches viewport
            threshold: 0.1
          }
        );
        
        state.sentinelObserver.observe(sentinel);
      }
      
      function removePaginationSentinel() {
        if (state.sentinelObserver) {
          state.sentinelObserver.disconnect();
          state.sentinelObserver = null;
        }
        
        const sentinel = document.querySelector('.pagination-sentinel');
        if (sentinel) {
          sentinel.remove();
        }
      }
      
      function showPagination() {
        // Don't show pagination if showing all restaurants or only have one page
        if (state.showAllMode || state.totalPages <= 1 || state.currentPage >= state.totalPages) {
          hidePagination();
          return;
        }
        
        const pagination = document.getElementById('mobilePagination');
        if (pagination) {
          pagination.classList.add('visible');
          state.isPaginationVisible = true;
        }
      }
      
      function hidePagination() {
        const pagination = document.getElementById('mobilePagination');
        if (pagination) {
          pagination.classList.remove('visible');
          state.isPaginationVisible = false;
        }
      }
      
      // ---------- UI UPDATES ----------
      function updateCounts() {
        const showingText = document.getElementById('showingText');
        
        if (!showingText) return;
        
        const totalFiltered = state.filteredRestaurants.length;
        
        if (totalFiltered === 0) {
          showingText.textContent = 'No restaurants found';
        } else if (state.showAllMode) {
          showingText.textContent = `Showing all ${totalFiltered} restaurants`;
        } else {
          const startIdx = (state.currentPage - 1) * state.pageSize + 1;
          const endIdx = Math.min(startIdx + state.pageSize - 1, totalFiltered);
          
          if (startIdx === endIdx) {
            showingText.textContent = `Showing restaurant ${startIdx} of ${totalFiltered}`;
          } else {
            showingText.textContent = `Showing ${startIdx}-${endIdx} of ${totalFiltered} restaurants`;
          }
        }
      }
      
      // ---------- SCROLL HIDE/SHOW FUNCTIONALITY ----------
      let lastScrollTop = 0;
      const scrollThreshold = 100;
      
      function initScrollHideShow() {
        window.addEventListener('scroll', handleHeaderScroll);
      }
      
      function handleHeaderScroll() {
        const header = document.querySelector('header');
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > scrollThreshold) {
          if (scrollTop > lastScrollTop) {
            // Scrolling down - hide both
            header.classList.add('header-hidden');
            header.classList.remove('header-visible');
          } else {
            // Scrolling up - show both
            header.classList.remove('header-hidden');
            header.classList.add('header-visible');
          }
        } else {
          // Near top - always show
          header.classList.remove('header-hidden');
          header.classList.add('header-visible');
        }
        
        lastScrollTop = scrollTop;
        
        // Also handle pagination visibility
        handleScroll();
      }
      
      function handleScroll() {
        // Don't show pagination if showing all restaurants
        if (state.showAllMode) {
          hidePagination();
          return;
        }
        
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight;
        const clientHeight = document.documentElement.clientHeight;
        const scrollBottom = scrollHeight - scrollTop - clientHeight;
        
        // Hide pagination when scrolling up near the top
        if (scrollTop < 100 && state.isPaginationVisible) {
          hidePagination();
        }
        
        // Show pagination when near bottom (150px from bottom) and we have more pages
        if (scrollBottom < 150 && state.totalPages > 1 && state.currentPage < state.totalPages) {
          showPagination();
        }
        
        state.lastScrollPosition = scrollTop;
      }
      
      // ---------- NOTIFICATION SYSTEM ----------
      function showNotification(message, type = "info", duration = 2500) {
        const container = document.getElementById("notificationContainer");
        if (!container) return;
        
        const notification = document.createElement("div");
        notification.className = `custom-notification notification-${type}`;
        
        let iconClass;
        if (type === "success") {
          iconClass = "fas fa-check-circle";
        } else if (type === "error") {
          iconClass = "fas fa-exclamation-circle";
        } else if (type === "warning") {
          iconClass = "fas fa-exclamation-triangle";
        } else {
          iconClass = "fas fa-info-circle";
        }
        
        notification.innerHTML = `
          <i class="notification-icon ${iconClass}"></i>
          <span class="notification-message">${message}</span>
          <button class="notification-close" aria-label="Close notification">×</button>
        `;
        
        container.appendChild(notification);
        
        setTimeout(() => {
          notification.classList.add("notification-show");
        }, 10);
        
        notification.querySelector('.notification-close').addEventListener('click', () => {
          notification.classList.remove("notification-show");
          setTimeout(() => {
            if (notification.parentNode) {
              notification.parentNode.removeChild(notification);
            }
          }, 400);
        });
        
        setTimeout(() => {
          if (notification.parentNode) {
            notification.classList.remove("notification-show");
            setTimeout(() => notification.remove(), 400);
          }
        }, duration);
      }      // ---------- AUTH PROMPT ----------
      function showAuthPrompt() {
        const modal = document.getElementById('authPromptModal');
        if (modal) modal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }

      let guestPromptShown = false;
      function showGuestPromptOnce() {
        if (state.isLoggedIn || guestPromptShown) return;
        guestPromptShown = true;
        showAuthPrompt();
      }

      // ---------- MODAL FUNCTIONS ----------
      function showModal(restaurantData) {
        if (!restaurantData) return;
        
        if (!state.isLoggedIn) {
          showAuthPrompt();
          return;
        }
        
        state.currentModalRestaurant = restaurantData;
        document.getElementById('modalRestaurantName').textContent = restaurantData.name;
        
        updateModalButtons(restaurantData.id);
        
        const modal = document.getElementById('actionsModal');
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
      
      function hideModal() {
        const modal = document.getElementById('actionsModal');
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
      }
      
      function updateModalButtons(restaurantId) {
        const status = state.listManager.getRestaurantListStatus(restaurantId);
        
        const favoritesBtn = document.getElementById('modalFavoritesBtn');
        const wantToGoBtn = document.getElementById('modalWantToGoBtn');
        const visitedBtn = document.getElementById('modalVisitedBtn');
        const customListsBtn = document.getElementById('modalCustomListsBtn');
        
        if (favoritesBtn) {
          favoritesBtn.innerHTML = `<i class="fas fa-heart"></i><span>${status.favorites ? 'Remove from Favorites' : 'Add to Favorites'}</span>`;
          favoritesBtn.classList.toggle('active', status.favorites);
        }
        
        if (wantToGoBtn) {
          wantToGoBtn.innerHTML = `<i class="fas fa-map-marker-alt"></i><span>${status.wantToGo ? 'Remove from Want to Go' : 'Add to Want to Go'}</span>`;
          wantToGoBtn.classList.toggle('active', status.wantToGo);
        }
        
        if (visitedBtn) {
          visitedBtn.innerHTML = `<i class="fas fa-utensils"></i><span>${status.visited ? 'Remove from Visited' : 'Mark as Visited'}</span>`;
          visitedBtn.classList.toggle('active', status.visited);
        }
        
        if (customListsBtn) {
          const customListCount = status.customLists.length;
          customListsBtn.innerHTML = `<i class="fas fa-list"></i><span>Custom Lists ${customListCount > 0 ? `(${customListCount})` : ''}</span><i class="fas fa-chevron-right"></i>`;
        }
      }
      
      // FIXED: Custom Lists Modal - No freezing with proper initialization
      function setupCustomListsModal() {
        const customListsBtn = document.getElementById('modalCustomListsBtn');
        const closeListsBtn = document.getElementById('closeListsBtn');
        const createListBtn = document.getElementById('createListBtn');
        const cancelEditListBtn = document.getElementById('cancelEditListBtn');
        const saveListsBtn = document.getElementById('saveListsBtn');
        const newListNameInput = document.getElementById('newListName');
        const newListIconInput = document.getElementById('newListIcon');
        const listsListContainer = document.getElementById('listsListContainer');
        const customListsModal = document.getElementById('customListsModal');
        const iconOptions = customListsModal ? customListsModal.querySelectorAll('.list-icon-option') : [];
        
        // FIXED: Add proper initialization check
        if (!customListsBtn || !listsListContainer) {
          console.warn('Custom lists modal elements not found');
          return;
        }
        
        let selectedLists = new Set();
        let editingListId = null;

        function setSelectedIcon(icon) {
          if (!newListIconInput) return;
          newListIconInput.value = icon || '📋';
          if (iconOptions && iconOptions.length > 0) {
            iconOptions.forEach(option => {
              option.classList.toggle('selected', option.getAttribute('data-icon') === newListIconInput.value);
            });
          }
        }

        function resetListForm() {
          if (newListNameInput) newListNameInput.value = '';
          setSelectedIcon('📋');
          editingListId = null;
          if (createListBtn) {
            createListBtn.innerHTML = '<i class="fas fa-plus"></i> Create';
          }
          if (cancelEditListBtn) {
            cancelEditListBtn.style.display = 'none';
          }
        }

        function startEditList(list) {
          if (!list || !newListNameInput) return;
          editingListId = list.id;
          newListNameInput.value = list.title || '';
          setSelectedIcon(list.icon || '📋');
          if (createListBtn) {
            createListBtn.innerHTML = '<i class="fas fa-save"></i> Update';
          }
          if (cancelEditListBtn) {
            cancelEditListBtn.style.display = 'inline-flex';
          }
          newListNameInput.focus();
        }

        if (iconOptions && iconOptions.length > 0) {
          iconOptions.forEach(option => {
            option.addEventListener('click', () => {
              setSelectedIcon(option.getAttribute('data-icon'));
            });
          });
        }
        
        customListsBtn.addEventListener('click', async () => {
          if (!state.currentModalRestaurant) {
            showNotification('No restaurant selected', 'error');
            return;
          }
          
          // FIXED: ALWAYS hide the main modal first
          hideModal();
          
          // FIXED: ALWAYS refresh lists before showing
          if (state.isLoggedIn && state.listManager) {
            await state.listManager.loadUserLists();
          }
          
          // Load restaurant status
          try {
            const restaurantId = state.currentModalRestaurant.id;
            const status = state.listManager.getRestaurantListStatus(restaurantId);
            
            selectedLists.clear();
            // Add custom lists to selectedLists
            status.customLists.forEach(list => {
              selectedLists.add(list.id);
            });
          } catch (error) {
            console.error('Error loading list status:', error);
            selectedLists.clear();
          }
          
          // Render the lists
          resetListForm();
          renderCustomLists();
          
          // Show modal
          const modal = document.getElementById('customListsModal');
          if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
          }
        });
        
        if (closeListsBtn) {
          closeListsBtn.addEventListener('click', () => {
            const modal = document.getElementById('customListsModal');
            if (modal) {
              modal.classList.remove('active');
              document.body.style.overflow = 'auto';
            }
            resetListForm();
          });
        }

        if (cancelEditListBtn) {
          cancelEditListBtn.addEventListener('click', (event) => {
            event.preventDefault();
            resetListForm();
          });
        }
        
        function renderCustomLists() {
          if (!state.currentModalRestaurant || !listsListContainer) return;
          
          listsListContainer.innerHTML = '';
          
          if (!state.isLoggedIn || state.listManager.customLists.length === 0) {
            listsListContainer.innerHTML = `
              <div class="empty-lists">
                <i class="fas fa-list"></i>
                <h4>No custom lists yet</h4>
                <p>Create your first custom list to organize restaurants by occasion, cuisine, or mood!</p>
              </div>
            `;
            return;
          }
          
          const listsList = document.createElement('div');
          listsList.className = 'lists-list';
          
          state.listManager.customLists.forEach(list => {
            const listItem = document.createElement('div');
            listItem.className = 'list-item';
            if (selectedLists.has(list.id)) {
              listItem.classList.add('active');
            }
            
            const isChecked = selectedLists.has(list.id);
            
            listItem.innerHTML = `
              <div class="list-info">
                <div class="list-icon">${list.icon || '📋'}</div>
                <div class="list-name">${list.title}</div>
              </div>
              <div class="list-actions">
                <button class="list-edit-btn" type="button" data-list-id="${list.id}">
                  <i class="fas fa-edit"></i>
                </button>
                <div class="list-checkbox ${isChecked ? 'checked' : ''}"></div>
              </div>
            `;
            
            const editBtn = listItem.querySelector('.list-edit-btn');
            if (editBtn) {
              editBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                startEditList(list);
              });
            }

            listItem.addEventListener('click', () => {
              if (selectedLists.has(list.id)) {
                selectedLists.delete(list.id);
                listItem.classList.remove('active');
                listItem.querySelector('.list-checkbox').classList.remove('checked');
              } else {
                selectedLists.add(list.id);
                listItem.classList.add('active');
                listItem.querySelector('.list-checkbox').classList.add('checked');
              }
            });
            
            listsList.appendChild(listItem);
          });
          
          listsListContainer.appendChild(listsList);
        }
        
        if (createListBtn) {
          createListBtn.addEventListener('click', async () => {
            if (!newListNameInput || !state.currentUser || !supabase) return;
            
            const listName = newListNameInput.value.trim();
            if (!listName) {
              showNotification('Please enter a list name', 'error');
              return;
            }

            const selectedIcon = newListIconInput?.value || '📋';
            const existingList = state.listManager.customLists.find(list => 
              list.title?.toLowerCase() === listName.toLowerCase() && list.id !== editingListId
            );
            if (existingList) {
              showNotification(`"${listName}" already exists`, 'error');
              return;
            }
            
            try {
              if (editingListId) {
                const { error } = await supabase
                  .from('lists')
                  .update({
                    title: listName,
                    icon: selectedIcon,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', editingListId);

                if (error) throw error;

                const listIndex = state.listManager.customLists.findIndex(list => list.id === editingListId);
                if (listIndex > -1) {
                  state.listManager.customLists[listIndex] = {
                    ...state.listManager.customLists[listIndex],
                    title: listName,
                    icon: selectedIcon
                  };
                }

                const userListIndex = state.listManager.userLists.findIndex(list => list.id === editingListId);
                if (userListIndex > -1) {
                  state.listManager.userLists[userListIndex] = {
                    ...state.listManager.userLists[userListIndex],
                    title: listName,
                    icon: selectedIcon
                  };
                }

                showNotification(`Updated list "${listName}"`, 'success');
                resetListForm();
                renderCustomLists();
                return;
              }
              const { data: newList, error } = await supabase
                .from('lists')
                .insert([
                  {
                    user_id: state.currentUser.id,
                    title: listName,
                    description: `My ${listName} list`,
                    icon: selectedIcon,
                    is_default: false,
                    created_at: new Date().toISOString()
                  }
                ])
                .select()
                .single();
              
              if (error) throw error;
              
              // Add to local lists
              state.listManager.customLists.push(newList);
              state.listManager.userLists.push(newList);
              
              resetListForm();
              
              // Reload the lists
              renderCustomLists();
              
              showNotification(`Created list "${listName}"`, 'success');
              
            } catch (error) {
              console.error('Error saving list:', error);
              showNotification('Error saving list', 'error');
            }
          });
        }
        
        if (saveListsBtn) {
          saveListsBtn.addEventListener('click', async () => {
            if (!state.currentModalRestaurant) return;
            
            const restaurantId = state.currentModalRestaurant.id;
            const restaurantName = state.currentModalRestaurant.name;
            
            try {
              // Get current status to compare
              const currentStatus = state.listManager.getRestaurantListStatus(restaurantId);
              const currentListIds = currentStatus.customLists.map(list => list.id);
              
              // Find lists to add and remove
              const listsToAdd = Array.from(selectedLists).filter(listId => 
                !currentListIds.includes(listId)
              );
              
              const listsToRemove = currentListIds.filter(listId => 
                !selectedLists.has(listId)
              );
              
              // Process additions
              for (const listId of listsToAdd) {
                await state.listManager.toggleInList(listId, restaurantId);
              }
              
              // Process removals
              for (const listId of listsToRemove) {
                await state.listManager.toggleInList(listId, restaurantId);
              }
              
              // Close modal
              const modal = document.getElementById('customListsModal');
              if (modal) {
                modal.classList.remove('active');
                document.body.style.overflow = 'auto';
              }
              
              showNotification(`Updated lists for ${restaurantName}`, 'success');
              
            } catch (error) {
              console.error('Error saving lists:', error);
              showNotification('Error saving lists', 'error');
            }
          });
        }
      }
      
      // ---------- EVENT LISTENERS ----------
      function setupEventListeners() {
        console.log('🔧 Setting up event listeners...');
        
        const searchInput = document.getElementById('search');
        const clearSearchBtn = document.getElementById('clearSearch');
        
        if (searchInput && clearSearchBtn) {
          const debouncedSearch = debounce(() => {
            state.activeFilters.search = searchInput.value.trim();
            applyFilters();
          }, 300);
          
          searchInput.addEventListener('input', () => {
            clearSearchBtn.style.display = searchInput.value ? 'block' : 'none';
            debouncedSearch();
          });
          
          clearSearchBtn.addEventListener('click', () => {
            searchInput.value = '';
            clearSearchBtn.style.display = 'none';
            state.activeFilters.search = '';
            applyFilters();
          });
        }
        
        const categorySelect = document.getElementById('categorySelect');
        if (categorySelect) {
          categorySelect.addEventListener('change', (e) => {
            state.activeFilters.category = e.target.value;
            applyFilters();
          });
        }
        
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
          sortSelect.addEventListener('change', (e) => {
            state.activeFilters.sort = e.target.value;
            applyFilters();
          });
        }
        
        const itemsPerPageSelect = document.getElementById('itemsPerPage');
        if (itemsPerPageSelect) {
          itemsPerPageSelect.addEventListener('change', (e) => {
            const newPageSize = parseInt(e.target.value);
            state.pageSize = newPageSize;
            state.currentPage = 1;
            state.showAllMode = (e.target.value === state.restaurants.length.toString());
            state.totalPages = Math.ceil(state.filteredRestaurants.length / state.pageSize);
            
            // Save preference
            try {
              localStorage.setItem('zo2y_items_per_page', e.target.value);
            } catch (e) {}
            
            applyFilters();
          });
        }
        
        document.querySelectorAll('.filter-chip').forEach(chip => {
          chip.addEventListener('click', (e) => {
            const filterType = e.target.dataset.filter;
            
            document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            e.target.classList.add('active');
            
            state.activeFilters.quickFilter = filterType;
            applyFilters();
          });
        });
        
        const resetBtn = document.getElementById('resetFilters');
        if (resetBtn) {
          resetBtn.addEventListener('click', resetAllFilters);
        }
        
        initializeViewControls();
        
        // Actions modal buttons
        const modalFavoritesBtn = document.getElementById('modalFavoritesBtn');
        const modalWantToGoBtn = document.getElementById('modalWantToGoBtn');
        const modalVisitedBtn = document.getElementById('modalVisitedBtn');
        const modalCustomListsBtn = document.getElementById('modalCustomListsBtn');
        const modalCancelBtn = document.getElementById('modalCancelBtn');
        
        if (modalFavoritesBtn) {
          modalFavoritesBtn.addEventListener('click', async () => {
            if (!state.currentModalRestaurant) return;
            await state.listManager.toggleInList('favorites', state.currentModalRestaurant.id);
            updateModalButtons(state.currentModalRestaurant.id);
            renderRestaurants();
            hideModal();
          });
        }
        
        if (modalWantToGoBtn) {
          modalWantToGoBtn.addEventListener('click', async () => {
            if (!state.currentModalRestaurant) return;
            await state.listManager.toggleInList('wantToGo', state.currentModalRestaurant.id);
            updateModalButtons(state.currentModalRestaurant.id);
            renderRestaurants();
            hideModal();
          });
        }
        
        if (modalVisitedBtn) {
          modalVisitedBtn.addEventListener('click', async () => {
            if (!state.currentModalRestaurant) return;
            await state.listManager.toggleInList('visited', state.currentModalRestaurant.id);
            updateModalButtons(state.currentModalRestaurant.id);
            renderRestaurants();
            hideModal();
          });
        }
        
        if (modalCustomListsBtn) {
          modalCustomListsBtn.addEventListener('click', () => {
            if (!state.currentModalRestaurant) {
              showNotification('No restaurant selected', 'error');
              return;
            }
            
            hideModal();
            
            setTimeout(() => {
              const modal = document.getElementById('customListsModal');
              if (modal) {
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
              }
            }, 100);
          });
        }
        
        if (modalCancelBtn) {
          modalCancelBtn.addEventListener('click', hideModal);
        }
        
        // Set up custom lists modal
        setupCustomListsModal();
        
        // Auth prompt modal buttons
        const authPromptSignupBtn = document.getElementById('authPromptSignupBtn');
        const authPromptLoginBtn = document.getElementById('authPromptLoginBtn');
        const authPromptCloseBtn = document.getElementById('authPromptCloseBtn');
        
        if (authPromptSignupBtn) {
          authPromptSignupBtn.addEventListener('click', () => {
            window.location.href = 'sign-up.html';
          });
        }
        
        if (authPromptLoginBtn) {
          authPromptLoginBtn.addEventListener('click', () => {
            window.location.href = 'login.html';
          });
        }
        
        if (authPromptCloseBtn) {
          authPromptCloseBtn.addEventListener('click', () => {
            const modal = document.getElementById('authPromptModal');
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
          });
        }
        
        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') {
            hideModal();
            const customModal = document.getElementById('customListsModal');
            if (customModal && customModal.classList.contains('active')) {
              customModal.classList.remove('active');
              document.body.style.overflow = 'auto';
            }
            const authModal = document.getElementById('authPromptModal');
            if (authModal && authModal.classList.contains('active')) {
              authModal.classList.remove('active');
              document.body.style.overflow = 'auto';
            }
          }
        });
        
        // Scroll event to show/hide pagination based on scroll position
        window.addEventListener('scroll', handleScroll);
        
        // Window resize for responsive adjustments
        window.addEventListener('resize', () => {
          if (state.filteredRestaurants.length > 0) {
            renderRestaurants();
          }
        });
        
        
        initScrollHideShow();
      }
      
      function initializeViewControls() {
        const gridButtons = document.querySelectorAll('.grid-btn');
        const grid = document.getElementById('restaurantGrid');
        
        if (!grid || gridButtons.length === 0) return;
        
        gridButtons.forEach(btn => {
          btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            
            gridButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            grid.classList.remove('grid-single', 'grid-double', 'grid-triple');
            grid.classList.add(`grid-${view}`);
            
            try {
              localStorage.setItem('zo2y_grid_view', view);
            } catch (e) {}
            
            if (state.filteredRestaurants.length > 0) {
              renderRestaurants();
            }
          });
        });
        
        try {
          const savedView = localStorage.getItem('zo2y_grid_view') || 'double';
          const savedBtn = document.querySelector(`.grid-btn[data-view="${savedView}"]`);
          if (savedBtn) {
            savedBtn.click();
          }
        } catch (e) {}
      }
      
      function resetAllFilters() {
        const searchInput = document.getElementById('search');
        const clearSearchBtn = document.getElementById('clearSearch');
        const categorySelect = document.getElementById('categorySelect');
        const sortSelect = document.getElementById('sortSelect');
        
        if (searchInput) searchInput.value = '';
        if (clearSearchBtn) clearSearchBtn.style.display = 'none';
        if (categorySelect) categorySelect.value = 'all';
        if (sortSelect) sortSelect.value = 'rating-desc';
        
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        const allFilter = document.querySelector('[data-filter="all"]');
        if (allFilter) allFilter.classList.add('active');
        
        state.activeFilters = {
          search: '',
          category: 'all',
          quickFilter: 'all',
          sort: 'rating-desc'
        };
        
        state.currentPage = 1;
        
        applyFilters();
        showNotification('Filters reset', 'info');
      }
      
      function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
          const later = () => {
            clearTimeout(timeout);
            func(...args);
          };
          clearTimeout(timeout);
          timeout = setTimeout(later, wait);
        };
      }
      
      // ---------- OPTIMIZED INIT FUNCTION ----------
      async function init() {
        console.log('🚀 Initializing restaurants page...');
        
        // Wait for Supabase to load first
        if (!initSupabase()) {
          console.warn('⚠️ Supabase not loaded yet, retrying...');
          setTimeout(init, 100);
          return;
        }
        
        try {
          // OPTIMIZATION: Parallel initialization
          setupEventListeners();
          
          
          showLoadingSkeleton();
          
          // Run auth and data loading in parallel
          await Promise.allSettled([
            initializeAuth(),
            loadRestaurantsData()
          ]);
          
          console.log('✅ Restaurants page initialization complete');
          
        } catch (error) {
          console.error('❌ Initialization error:', error);
          showNotification('Failed to initialize page', 'error');
          
          const grid = document.getElementById('restaurantGrid');
          if (grid) {
            grid.innerHTML = '<div style="text-align:center; padding:40px; color:var(--muted)">Failed to load content</div>';
            grid.classList.remove('skeleton-grid');
          }
        }
      }
      
      // OPTIMIZATION: Execute immediately if DOM ready, no delays
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
      } else {
        init();
      }
      
    })();
  
