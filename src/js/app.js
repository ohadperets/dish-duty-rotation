// Main App Controller - Manages auth, groups, and navigation
import { Auth } from './auth.js';
import { Groups } from './groups.js';

export const App = {
    currentUser: null,
    currentGroup: null,
    userGroups: [],
    
    // Initialize the app
    async init() {
        console.log('Initializing app...');
        
        // Show login screen initially
        this.showScreen('login');
        
        // Initialize auth and listen for state changes
        const user = await Auth.init();
        
        if (user) {
            console.log('User logged in:', user.email);
            await this.onUserLoggedIn(user);
        } else {
            console.log('No user logged in');
            this.showScreen('login');
        }
        
        // Setup event listeners
        this.setupEventListeners();
    },
    
    // Show specific screen
    showScreen(screenName) {
        // Hide/show login, dashboard, and setup screens
        const authScreens = ['login', 'dashboard', 'setup'];
        authScreens.forEach(screen => {
            const element = document.getElementById(`${screen}-screen`);
            if (element) {
                if (screen === screenName) {
                    element.classList.remove('hidden');
                } else {
                    element.classList.add('hidden');
                }
            }
        });
        
        // Show/hide the dish app container
        const dishAppContainer = document.getElementById('dish-app-container');
        if (dishAppContainer) {
            if (['selection', 'result', 'log', 'admin'].includes(screenName)) {
                dishAppContainer.classList.remove('hidden');
            } else {
                dishAppContainer.classList.add('hidden');
            }
        }
        
        // Show/hide screens within the dish app
        const dishScreens = ['selection', 'result', 'log', 'admin'];
        dishScreens.forEach(screen => {
            const element = document.getElementById(`${screen}-screen`);
            if (element) {
                if (screen === screenName) {
                    element.classList.remove('hidden');
                } else {
                    element.classList.add('hidden');
                }
            }
        });
    },
    
    // Handle user logged in
    async onUserLoggedIn(user) {
        this.currentUser = user;
        
        // Load user's groups
        this.userGroups = await Groups.getUserGroups(user.uid);
        console.log('User groups:', this.userGroups);
        
        // Show dashboard
        this.showScreen('dashboard');
        this.renderDashboard();
    },
    
    // Render dashboard with user's groups
    renderDashboard() {
        const groupsList = document.getElementById('groups-list');
        
        if (this.userGroups.length === 0) {
            groupsList.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: #94a3b8;">
                    <p style="font-size: 1.2rem; margin-bottom: 1rem;">No groups yet</p>
                    <p>Create a new group or join an existing one</p>
                </div>
            `;
            return;
        }
        
        groupsList.innerHTML = this.userGroups.map(group => {
            const photoUrl = group.photoUrl || '👥';
            const isUrl = photoUrl.startsWith('http');
            return `
            <div class="group-card" data-group-id="${group.groupId}">
                <div class="group-card-header">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <div class="group-photo" style="width: 50px; height: 50px; border-radius: 50%; overflow: hidden; display: flex; align-items: center; justify-content: center; background: rgba(139, 92, 246, 0.2); font-size: 1.5rem;">
                            ${isUrl ? `<img src="${photoUrl}" alt="${group.name}" style="width: 100%; height: 100%; object-fit: cover;">` : photoUrl}
                        </div>
                        <div>
                            <div class="group-name">${group.name}</div>
                            <div class="group-id">ID: ${group.groupId}</div>
                        </div>
                    </div>
                </div>
                <div class="group-role">${group.role === 'creator' ? '👑 Admin' : '👤 Member'}</div>
            </div>
        `}).join('');
        
        // Add click handlers for groups
        document.querySelectorAll('.group-card').forEach(card => {
            card.addEventListener('click', () => {
                const groupId = card.dataset.groupId;
                this.selectGroup(groupId);
            });
        });
    },
    
    // Select a group and load dish rotation
    async selectGroup(groupId) {
        const group = this.userGroups.find(g => g.groupId === groupId);
        if (!group) {
            alert('Group not found');
            return;
        }
        
        this.currentGroup = group;
        console.log('Selected group:', group);
        
        // Store selected group in sessionStorage
        sessionStorage.setItem('selectedGroupId', groupId);
        
        // Load group's dishwashers and data
        try {
            const dishwashers = await Groups.getDishwashers(groupId);
            const history = await Groups.getGroupData(groupId);
            
            // Check if group has dishwashers
            if (Object.keys(dishwashers).length === 0) {
                alert('This group has no dishwashers yet. Please add some first.');
                this.setupGroup(groupId, group.name);
                return;
            }
            
            // Render selection screen with group's dishwashers
            this.renderSelectionScreen(dishwashers);
            
            // Initialize the dish rotation app with this group's data
            if (window.initDishRotation) {
                window.initDishRotation(groupId, dishwashers, history);
            }
            
            // Show selection screen
            this.showScreen('selection');
        } catch (error) {
            console.error('Error loading group data:', error);
            alert('Failed to load group data');
        }
    },
    
    // Setup event listeners for login, dashboard actions, etc.
    setupEventListeners() {
        // Google login
        const googleBtn = document.getElementById('google-login-btn');
        if (googleBtn) {
            googleBtn.addEventListener('click', async () => {
                try {
                    const user = await Auth.signInWithGoogle();
                    await this.onUserLoggedIn(user);
                } catch (error) {
                    console.error('Google login error:', error);
                    alert('Login failed: ' + error.message);
                }
            });
        }
        
        // Facebook login
        const facebookBtn = document.getElementById('facebook-login-btn');
        if (facebookBtn) {
            facebookBtn.addEventListener('click', async () => {
                try {
                    const user = await Auth.signInWithFacebook();
                    await this.onUserLoggedIn(user);
                } catch (error) {
                    console.error('Facebook login error:', error);
                    alert('Login failed: ' + error.message);
                }
            });
        }
        
        // Logout
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                await Auth.signOut();
                this.currentUser = null;
                this.currentGroup = null;
                this.userGroups = [];
                sessionStorage.removeItem('selectedGroupId');
                this.showScreen('login');
            });
        }
        
        // Create group
        const createBtn = document.getElementById('create-group-btn');
        if (createBtn) {
            createBtn.addEventListener('click', () => {
                document.getElementById('create-group-modal').classList.remove('hidden');
            });
        }
        
        // Cancel create group
        const cancelCreateBtn = document.getElementById('cancel-create-group');
        if (cancelCreateBtn) {
            cancelCreateBtn.addEventListener('click', () => {
                document.getElementById('create-group-modal').classList.add('hidden');
                document.getElementById('group-name-input').value = '';
            });
        }
        
        // Group photo upload handler
        const groupPhotoFile = document.getElementById('group-photo-file');
        let uploadedGroupPhotoUrl = null;
        const IMGBB_API_KEY = '6e996b4be8ce9bbce89c6441155718ab';
        
        if (groupPhotoFile) {
            groupPhotoFile.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                try {
                    const reader = new FileReader();
                    reader.onloadend = async () => {
                        try {
                            const base64Data = reader.result.split(',')[1];
                            const formData = new FormData();
                            formData.append('image', base64Data);
                            
                            const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
                                method: 'POST',
                                body: formData
                            });
                            
                            if (!response.ok) throw new Error(`Upload failed: ${response.statusText}`);
                            
                            const result = await response.json();
                            if (result.success) {
                                uploadedGroupPhotoUrl = result.data.url;
                                document.getElementById('group-photo-url').value = '✓ Photo uploaded';
                                document.getElementById('group-photo-url').disabled = true;
                            } else {
                                throw new Error('ImgBB upload failed');
                            }
                        } catch (err) {
                            console.error('Error uploading to ImgBB:', err);
                            alert('Failed to upload photo: ' + err.message);
                        }
                    };
                    reader.readAsDataURL(file);
                } catch (error) {
                    console.error('Error reading file:', error);
                    alert('Failed to read photo file');
                }
            };
        }
        
        // Confirm create group
        const confirmCreateBtn = document.getElementById('confirm-create-group');
        if (confirmCreateBtn) {
            confirmCreateBtn.addEventListener('click', async () => {
                const groupName = document.getElementById('group-name-input').value.trim();
                const groupPhotoUrl = uploadedGroupPhotoUrl || document.getElementById('group-photo-url').value.trim() || '👥';
                
                if (!groupName) {
                    alert('Please enter a group name');
                    return;
                }
                
                try {
                    const groupId = await Groups.createGroup(groupName, this.currentUser.uid, groupPhotoUrl);
                    
                    // Close modal
                    document.getElementById('create-group-modal').classList.add('hidden');
                    document.getElementById('group-name-input').value = '';
                    document.getElementById('group-photo-url').value = '';
                    document.getElementById('group-photo-url').disabled = false;
                    uploadedGroupPhotoUrl = null;
                    groupPhotoFile.value = '';
                    
                    // Reload groups
                    this.userGroups = await Groups.getUserGroups(this.currentUser.uid);
                    
                    // Go to setup screen for the new group
                    this.setupGroup(groupId, groupName);
                } catch (error) {
                    console.error('Error creating group:', error);
                    alert('Failed to create group: ' + error.message);
                }
            });
        }
        
        // Join group
        const joinBtn = document.getElementById('join-group-btn');
        if (joinBtn) {
            joinBtn.addEventListener('click', async () => {
                const groupId = document.getElementById('join-group-input').value.trim();
                
                if (!groupId || groupId.length !== 5) {
                    alert('Please enter a valid 5-digit code');
                    return;
                }
                
                try {
                    await Groups.joinGroup(groupId, this.currentUser.uid);
                    alert('Successfully joined group!');
                    
                    // Reload groups
                    this.userGroups = await Groups.getUserGroups(this.currentUser.uid);
                    this.renderDashboard();
                    
                    // Clear input
                    document.getElementById('join-group-input').value = '';
                } catch (error) {
                    console.error('Error joining group:', error);
                    alert(error.message || 'Failed to join group');
                }
            });
        }
    },
    
    // Return to dashboard
    // Return to dashboard
    returnToDashboard() {
        this.currentGroup = null;
        sessionStorage.removeItem('selectedGroupId');
        this.showScreen('dashboard');
    },
    
    // Render selection screen with dishwashers
    renderSelectionScreen(dishwashers) {
        const container = document.querySelector('.brothers-grid');
        if (!container) return;
        
        container.innerHTML = Object.entries(dishwashers).map(([name, photo]) => {
            const isUrl = photo && (photo.startsWith('http://') || photo.startsWith('https://') || photo.startsWith('/'));
            return `
                <div class="brother-card" data-brother="${name}">
                    <div class="card-inner">
                        <div class="avatar">
                            ${isUrl ? `<img src="${photo}" alt="${name}" onerror="this.style.display='none'; this.parentElement.innerHTML='👤';">` : `<div style="font-size: 4rem;">${photo || '👤'}</div>`}
                        </div>
                        <h2>${name}</h2>
                        <div class="checkmark">✓</div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Reinitialize card event listeners
        if (window.initCardListeners) {
            window.initCardListeners();
        }
    },
    
    // Setup group - add dishwashers
    async setupGroup(groupId, groupName) {
        this.currentGroup = { groupId, name: groupName };
        
        document.getElementById('setup-group-name').textContent = `Setup: ${groupName}`;
        document.getElementById('setup-group-name').dataset.groupId = groupId;
        
        this.showScreen('setup');
        await this.renderDishwashers(groupId);
        
        // Setup event listeners for this screen
        this.setupGroupEventListeners(groupId);
    },
    
    // Render dishwashers list
    async renderDishwashers(groupId) {
        const dishwashers = await Groups.getDishwashers(groupId);
        const list = document.getElementById('dishwashers-list');
        
        const entries = Object.entries(dishwashers);
        
        if (entries.length === 0) {
            list.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #94a3b8;">
                    <p>No dishwashers added yet</p>
                </div>
            `;
            return;
        }
        
        list.innerHTML = entries.map(([name, photo]) => `
            <div class="dishwasher-item">
                <div class="dishwasher-info">
                    <div class="dishwasher-avatar">
                        ${photo.startsWith('http') ? `<img src="${photo}" alt="${name}">` : photo}
                    </div>
                    <div class="dishwasher-name">${name}</div>
                </div>
                <button class="remove-dishwasher-btn" data-name="${name}">Remove</button>
            </div>
        `).join('');
        
        // Add remove handlers
        document.querySelectorAll('.remove-dishwasher-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const name = btn.dataset.name;
                if (confirm(`Remove ${name}?`)) {
                    await Groups.removeDishwasher(groupId, name);
                    await this.renderDishwashers(groupId);
                }
            });
        });
    },
    
    // Setup group screen event listeners
    setupGroupEventListeners(groupId) {
        // Back to dashboard
        const backBtn = document.getElementById('back-to-dashboard-btn');
        if (backBtn) {
            backBtn.onclick = () => {
                this.renderDashboard();
                this.showScreen('dashboard');
            };
        }
        
        // Add dishwasher
        const addBtn = document.getElementById('add-dishwasher-btn');
        const photoFileInput = document.getElementById('dishwasher-photo-file');
        let uploadedPhotoUrl = null;
        
        // ImgBB API key - you can also move this to a config file
        const IMGBB_API_KEY = '6e996b4be8ce9bbce89c6441155718ab';
        
        // Handle photo file selection
        if (photoFileInput) {
            photoFileInput.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                try {
                    // Convert file to base64
                    const reader = new FileReader();
                    reader.onloadend = async () => {
                        try {
                            const base64Data = reader.result.split(',')[1]; // Remove data:image/...;base64, prefix
                            
                            // Upload to ImgBB
                            const formData = new FormData();
                            formData.append('image', base64Data);
                            
                            const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
                                method: 'POST',
                                body: formData
                            });
                            
                            if (!response.ok) {
                                throw new Error(`Upload failed: ${response.statusText}`);
                            }
                            
                            const result = await response.json();
                            if (result.success) {
                                uploadedPhotoUrl = result.data.url;
                                // Update input to show file was uploaded
                                document.getElementById('dishwasher-photo-input').value = '✓ Photo uploaded';
                                document.getElementById('dishwasher-photo-input').disabled = true;
                            } else {
                                throw new Error('ImgBB upload failed');
                            }
                        } catch (err) {
                            console.error('Error uploading to ImgBB:', err);
                            alert('Failed to upload photo: ' + err.message);
                        }
                    };
                    reader.readAsDataURL(file);
                } catch (error) {
                    console.error('Error reading file:', error);
                    alert('Failed to read photo file');
                }
            };
        }
        
        if (addBtn) {
            addBtn.onclick = async () => {
                const nameInput = document.getElementById('dishwasher-name-input');
                const photoInput = document.getElementById('dishwasher-photo-input');
                
                const name = nameInput.value.trim();
                const photo = uploadedPhotoUrl || photoInput.value.trim() || '👤';
                
                if (!name) {
                    alert('Please enter a name');
                    return;
                }
                
                try {
                    await Groups.addDishwasher(groupId, name, photo);
                    await this.renderDishwashers(groupId);
                    
                    nameInput.value = '';
                    photoInput.value = '';
                    photoInput.disabled = false;
                    uploadedPhotoUrl = null;
                    photoFileInput.value = '';
                } catch (error) {
                    console.error('Error adding dishwasher:', error);
                    alert('Failed to add dishwasher');
                }
            };
        }
        
        // Done setup
        const doneBtn = document.getElementById('done-setup-btn');
        if (doneBtn) {
            doneBtn.onclick = async () => {
                const dishwashers = await Groups.getDishwashers(groupId);
                
                if (Object.keys(dishwashers).length === 0) {
                    alert('Please add at least one dishwasher before continuing');
                    return;
                }
                
                alert(`Group setup complete! Share code: ${groupId}`);
                
                // Reload groups and go back to dashboard
                this.userGroups = await Groups.getUserGroups(this.currentUser.uid);
                this.renderDashboard();
                this.showScreen('dashboard');
            };
        }
    }
};

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
} else {
    App.init();
}

// Make App available globally
window.App = App;
