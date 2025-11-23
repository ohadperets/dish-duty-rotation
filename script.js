// Brother data with avatars
const brothers = {
    'Yonatan': '👨‍💼',
    'Ohad': '👨‍💻',
    'Raz': '👨‍🎓',
    'Yuval': '👨‍🔬'
};

// Check if today is Friday
function isFriday() {
    const today = new Date();
    return today.getDay() === 5; // 5 = Friday
}

// Check if already ran today in production by checking actual data
function hasRunToday() {
    const today = new Date().toDateString();
    
    // Check if there's any entry from today in the history
    return dishHistory.some(entry => {
        const entryDate = new Date(entry.date).toDateString();
        return entryDate === today;
    });
}

// ============================================
// FIREBASE DATABASE LAYER
// ============================================
const DB = {
    // Wait for Firebase to be ready
    async waitForFirebase() {
        let attempts = 0;
        while (!window.firebaseDB && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        if (!window.firebaseDB) {
            throw new Error('Firebase not initialized');
        }
    },

    // Load data from Firestore
    async loadData(environment) {
        await this.waitForFirebase();
        const { doc, getDoc } = window.firestoreModules;
        const docRef = doc(window.firebaseDB, 'dishData', environment);
        
        try {
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return docSnap.data().history || [];
            }
            return [];
        } catch (error) {
            console.error('Error loading from Firestore:', error);
            // Fallback to localStorage if Firestore fails
            const fallback = localStorage.getItem(environment === 'production' ? STORAGE_KEYS.production : STORAGE_KEYS.test);
            return fallback ? JSON.parse(fallback) : [];
        }
    },

    // Save data to Firestore
    async saveData(environment, data) {
        await this.waitForFirebase();
        const { doc, setDoc } = window.firestoreModules;
        const docRef = doc(window.firebaseDB, 'dishData', environment);
        
        try {
            await setDoc(docRef, { 
                history: data,
                lastUpdated: new Date().toISOString()
            });
            // Also save to localStorage as backup
            localStorage.setItem(
                environment === 'production' ? STORAGE_KEYS.production : STORAGE_KEYS.test,
                JSON.stringify(data)
            );
            return true;
        } catch (error) {
            console.error('Error saving to Firestore:', error);
            // Fallback to localStorage only
            localStorage.setItem(
                environment === 'production' ? STORAGE_KEYS.production : STORAGE_KEYS.test,
                JSON.stringify(data)
            );
            return false;
        }
    }
};

// Environment management
let isTestMode = false; // Start in production mode
const STORAGE_KEYS = {
    production: 'dishHistory',
    test: 'dishHistory_test'
};

// State management
let selectedBrothers = new Set();
let dishHistory = [];
let isBlocked = false;
let blockCountdown = 0;

// Custom alert function
function showCustomAlert(icon, title, message, imageSrc = null) {
    const modal = document.getElementById('custom-alert-modal');
    const iconEl = document.getElementById('alert-icon');
    const imageEl = document.getElementById('alert-image');
    const titleEl = document.getElementById('alert-title');
    const messageEl = document.getElementById('alert-message');
    
    iconEl.textContent = icon;
    titleEl.textContent = title;
    messageEl.textContent = message;
    
    // Show or hide image
    if (imageSrc) {
        imageEl.src = imageSrc;
        imageEl.classList.remove('hidden');
    } else {
        imageEl.classList.add('hidden');
    }
    
    modal.classList.remove('hidden');
}

// Close custom alert
document.getElementById('alert-ok-btn').addEventListener('click', () => {
    document.getElementById('custom-alert-modal').classList.add('hidden');
});

// Load initial data
(async function initializeApp() {
    try {
        await loadDishHistory();
        console.log('✅ App initialized with', dishHistory.length, 'entries');
        updateSubmitButtonState(); // Check Friday restriction on load
    } catch (error) {
        console.error('❌ Failed to initialize:', error);
        showCustomAlert('❌', 'Error', 'Failed to load data. Please refresh the page.');
    }
})();

// DOM elements
const brotherCards = document.querySelectorAll('.brother-card');
const submitBtn = document.getElementById('submit-btn');
const selectionScreen = document.getElementById('selection-screen');
const resultScreen = document.getElementById('result-screen');
const logScreen = document.getElementById('log-screen');
const testEnvToggle = document.getElementById('test-env-toggle');
const adminToggle = document.getElementById('admin-toggle');
const adminModal = document.getElementById('admin-modal');
const adminPanel = document.getElementById('admin-panel');
const adminPasswordInput = document.getElementById('admin-password-input');
const modeIndicator = document.getElementById('mode-indicator');

// Update submit button state
function updateSubmitButtonState() {
    // Check if it's Friday and in Production mode
    if (!isTestMode && !isFriday()) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>📅 Only on Friday</span>';
        return;
    }
    
    // Check if already ran today in production mode
    if (!isTestMode && hasRunToday()) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>✓ Already ran today</span>';
        return;
    }
    
    // Normal state - check if enough brothers selected
    if (selectedBrothers.size < 2) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Who Does the Dishes?</span><span class="btn-shine"></span>';
    } else {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Who Does the Dishes?</span><span class="btn-shine"></span>';
    }
}

// Test Environment toggle
testEnvToggle.addEventListener('click', () => {
    // Check if blocked
    if (isBlocked) {
        showCustomAlert('🚫', 'Blocked!', `Wait ${blockCountdown} more seconds...`, 'Images/Jack.png');
        return;
    }
    
    // Show security question modal
    const securityModal = document.getElementById('security-modal');
    securityModal.classList.remove('hidden');
});

// Security question options
document.querySelectorAll('.security-option-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const answer = btn.dataset.answer;
        const securityModal = document.getElementById('security-modal');
        
        if (answer === 'hadar') {
            securityModal.classList.add('hidden');
            
            isTestMode = !isTestMode;
            
            if (isTestMode) {
                testEnvToggle.classList.add('active');
                testEnvToggle.querySelector('.env-label').textContent = '✓ Go to Production';
                modeIndicator.querySelector('.mode-text').textContent = 'Test mode';
                modeIndicator.classList.add('test-mode');
            } else {
                testEnvToggle.classList.remove('active');
                testEnvToggle.querySelector('.env-label').textContent = '🧪 Go to Test';
                modeIndicator.querySelector('.mode-text').textContent = 'Production mode';
                modeIndicator.classList.remove('test-mode');
            }
            
            // Reload data for current mode
            loadDishHistory().then(() => {
                updateSubmitButtonState();
            }).catch(error => {
                console.error('Failed to load history:', error);
                alert('Failed to load data for this environment.');
            });
            
            // Reset UI if on result/log screens
            if (!resultScreen.classList.contains('hidden') || !logScreen.classList.contains('hidden')) {
                resetToSelection();
            }
        } else {
            // Wrong answer - block for 20 seconds
            securityModal.classList.add('hidden');
            isBlocked = true;
            blockCountdown = 20;
            
            showCustomAlert('❌', 'Wrong Answer!', 'Go do your homework! You are not a real Perets! 📚\n\nBlocked for 20 seconds...', 'Images/Perets.jpg');
            
            // Start countdown
            const countdownInterval = setInterval(() => {
                blockCountdown--;
                
                if (blockCountdown <= 0) {
                    clearInterval(countdownInterval);
                    isBlocked = false;
                    showCustomAlert('✅', 'Unblocked!', 'You can try again now!');
                }
            }, 1000);
        }
    });
});

// Cancel security question
document.getElementById('cancel-security').addEventListener('click', () => {
    document.getElementById('security-modal').classList.add('hidden');
});

// Admin toggle - opens admin panel
adminToggle.addEventListener('click', () => {
    adminModal.classList.remove('hidden');
    adminPasswordInput.value = '';
});

// Admin password submission
document.getElementById('admin-submit-btn').addEventListener('click', async () => {
    const password = adminPasswordInput.value;
    
    if (password === 'Op0544756518') {
        adminModal.classList.add('hidden');
        
        // Hide other screens and show admin panel
        selectionScreen.classList.add('hidden');
        resultScreen.classList.add('hidden');
        logScreen.classList.add('hidden');
        adminPanel.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        await displayAdminPanel();
    } else {
        alert('❌ Incorrect password!');
        adminPasswordInput.value = '';
    }
});

// Allow Enter key for password
adminPasswordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('admin-submit-btn').click();
    }
});

// Cancel admin access
document.getElementById('cancel-admin-access').addEventListener('click', () => {
    adminModal.classList.add('hidden');
});

// Load dish history from appropriate storage
async function loadDishHistory() {
    const environment = isTestMode ? 'test' : 'production';
    console.log('Loading dish history from Firestore:', environment);
    dishHistory = await DB.loadData(environment);
    console.log('Loaded', dishHistory.length, 'entries');
}

// Save dish history to Firestore
async function saveDishHistory() {
    const environment = isTestMode ? 'test' : 'production';
    console.log('Saving dish history to Firestore:', environment);
    const success = await DB.saveData(environment, dishHistory);
    if (success) {
        console.log('✅ Saved to Firestore successfully');
    } else {
        console.warn('⚠️ Saved to localStorage only (Firestore failed)');
    }
}

// Brother card selection
brotherCards.forEach(card => {
    card.addEventListener('click', () => {
        const brother = card.dataset.brother;
        
        if (selectedBrothers.has(brother)) {
            selectedBrothers.delete(brother);
            card.classList.remove('selected');
        } else {
            selectedBrothers.add(brother);
            card.classList.add('selected');
        }
        
        // Update submit button state
        updateSubmitButtonState();
    });
});

// Submit button - determine who does dishes
submitBtn.addEventListener('click', () => {
    if (selectedBrothers.size < 2) return;
    
    const result = determineWhoDoesTheDishes([...selectedBrothers]);
    displayResult(result);
});

// Determine who should do the dishes
function determineWhoDoesTheDishes(presentBrothers) {
    const groupKey = presentBrothers.sort().join(',');
    
    // Get history for this specific group
    const groupHistory = dishHistory.filter(entry => entry.group === groupKey);
    
    // Count dishes done by each brother in this group
    const counts = {};
    const lastDates = {};
    
    presentBrothers.forEach(brother => {
        counts[brother] = 0;
        lastDates[brother] = null;
    });
    
    groupHistory.forEach(entry => {
        if (counts.hasOwnProperty(entry.brother)) {
            counts[entry.brother]++;
            if (!lastDates[entry.brother] || new Date(entry.date) > new Date(lastDates[entry.brother])) {
                lastDates[entry.brother] = entry.date;
            }
        }
    });
    
    // Find minimum count
    const minCount = Math.min(...Object.values(counts));
    
    // Get all brothers with minimum count
    const candidates = presentBrothers.filter(brother => counts[brother] === minCount);
    
    let chosen;
    let reason;
    
    if (candidates.length === 1) {
        chosen = candidates[0];
        reason = `${chosen} has done the dishes the least times in this group (${minCount} time${minCount !== 1 ? 's' : ''}).`;
    } else {
        // If tie, choose the one who did it least recently (or never)
        const candidatesWithDates = candidates.map(brother => ({
            brother,
            lastDate: lastDates[brother] ? new Date(lastDates[brother]) : new Date(0)
        }));
        
        candidatesWithDates.sort((a, b) => a.lastDate - b.lastDate);
        chosen = candidatesWithDates[0].brother;
        
        if (lastDates[chosen]) {
            const lastDateStr = new Date(lastDates[chosen]).toLocaleDateString();
            reason = `All brothers have ${minCount} turns, but ${chosen} did it earliest (last on ${lastDateStr}).`;
        } else {
            reason = `All brothers have ${minCount} turns, but ${chosen} has never done it in this group configuration.`;
        }
    }
    
    return {
        chosen,
        reason,
        group: groupKey,
        presentBrothers,
        counts,
        lastDates
    };
}

// Display result screen
function displayResult(result) {
    selectionScreen.classList.add('hidden');
    resultScreen.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Update winner display with image
    const winnerAvatar = document.querySelector('.winner-avatar');
    winnerAvatar.innerHTML = `<img src="Images/${result.chosen}.png" alt="${result.chosen}">`;
    document.querySelector('.winner-name').textContent = result.chosen;
    document.querySelector('.explanation .reason').textContent = result.reason;
    
    // Update stats
    const statsList = document.querySelector('.stats-list');
    statsList.innerHTML = '';
    
    result.presentBrothers.forEach(brother => {
        const statItem = document.createElement('div');
        statItem.className = 'stat-item';
        
        const lastDateStr = result.lastDates[brother] 
            ? new Date(result.lastDates[brother]).toLocaleDateString()
            : 'Never';
        
        statItem.innerHTML = `
            <div class="stat-name">
                <img src="Images/${brother}.png" alt="${brother}" class="stat-brother-small-img">
                ${brother}
            </div>
            <div class="stat-info">
                <span class="stat-count">${result.counts[brother]} times</span>
                <span class="stat-date">Last: ${lastDateStr}</span>
            </div>
        `;
        statsList.appendChild(statItem);
    });
    
    // Store current result for confirmation
    window.currentResult = result;
}

// Confirm and record the dish duty
document.getElementById('confirm-btn').addEventListener('click', async () => {
    const confirmBtn = document.getElementById('confirm-btn');
    const originalText = confirmBtn.textContent;
    
    try {
        confirmBtn.textContent = 'Saving...';
        confirmBtn.disabled = true;
        
        const result = window.currentResult;
        
        // Add to history
        dishHistory.push({
            brother: result.chosen,
            group: result.group,
            date: new Date().toISOString(),
            presentBrothers: result.presentBrothers
        });
        
        // Save to Firestore
        await saveDishHistory();
        
        // Log success (no alert)
        const mode = isTestMode ? 'Test' : 'Production';
        console.log(`✅ Recorded in ${mode} mode! ${result.chosen} will do the dishes tonight.`);
    } catch (error) {
        console.error('Failed to save:', error);
        showCustomAlert('❌', 'Error', 'Failed to save. Please try again.');
        confirmBtn.textContent = originalText;
        confirmBtn.disabled = false;
        return;
    } finally {
        confirmBtn.textContent = originalText;
        confirmBtn.disabled = false;
    }
    
    // Reset to selection screen
    resetToSelection();
});

// View history log
document.getElementById('view-log-btn').addEventListener('click', () => {
    resultScreen.classList.add('hidden');
    logScreen.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    displayLog();
});

// Close admin panel
document.getElementById('close-admin-btn').addEventListener('click', () => {
    adminPanel.classList.add('hidden');
    selectionScreen.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Display admin panel with edit/delete options
async function displayAdminPanel(filterGroup = 'all', environment = 'production') {
    const adminEntries = document.getElementById('admin-entries');
    const groupFilter = document.getElementById('admin-group-filter');
    const envFilter = document.getElementById('admin-env-filter');
    
    // Load the selected environment's data from Firestore
    const adminData = await DB.loadData(environment);
    
    // Update group filter options
    const uniqueGroups = [...new Set(adminData.map(entry => entry.group))];  
    groupFilter.innerHTML = '<option value="all">All Groups</option>';
    uniqueGroups.forEach(group => {
        const option = document.createElement('option');
        option.value = group;
        option.textContent = `Group: ${group.replace(/,/g, ', ')}`;
        groupFilter.appendChild(option);
    });
    
    // Set the selected values to maintain user selection
    groupFilter.value = filterGroup;
    envFilter.value = environment;
    
    // Filter entries
    const filteredHistory = filterGroup === 'all' 
        ? adminData 
        : adminData.filter(entry => entry.group === filterGroup);
    
    // Clear entries first if showing all groups
    if (filterGroup === 'all') {
        adminEntries.innerHTML = '';
    }
    
    // If specific group selected, show editable statistics first
    if (filterGroup !== 'all') {
        // Calculate stats for this group
        const groupMembers = filterGroup.split(',');
        const stats = {};
        groupMembers.forEach(brother => {
            stats[brother] = filteredHistory.filter(e => e.brother === brother).length;
        });
        
        // Create stats section
        const statsSection = document.createElement('div');
        statsSection.className = 'group-stats-editor';
        statsSection.innerHTML = `
            <h3>📊 Edit Statistics for ${filterGroup.replace(/,/g, ', ')}</h3>
            <div class="stats-grid"></div>
            <button class="confirm-btn" id="apply-stats-btn">💾 Apply Changes</button>
            <hr style="margin: 2rem 0; border: 1px solid rgba(139, 92, 246, 0.3);">
            <h3>Individual Entries</h3>
        `;
        adminEntries.innerHTML = '';
        adminEntries.appendChild(statsSection);
        
        const statsGrid = statsSection.querySelector('.stats-grid');
        Object.entries(stats).forEach(([brother, count]) => {
            const statCard = document.createElement('div');
            statCard.className = 'stat-edit-card';
            statCard.innerHTML = `
                <div class="stat-brother-name">
                    <img src="Images/${brother}.png" alt="${brother}" class="stat-brother-img">
                    ${brother}
                </div>
                <div class="stat-controls">
                    <button class="stat-btn minus-btn" data-brother="${brother}">−</button>
                    <input type="number" class="stat-count-input" data-brother="${brother}" value="${count}" min="0" />
                    <button class="stat-btn plus-btn" data-brother="${brother}">+</button>
                    <span class="stat-times">times</span>
                </div>
            `;
            statsGrid.appendChild(statCard);
        });
        
        // Add event listeners for +/- buttons
        statsGrid.querySelectorAll('.minus-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const input = statsGrid.querySelector(`input[data-brother="${btn.dataset.brother}"]`);
                if (parseInt(input.value) > 0) {
                    input.value = parseInt(input.value) - 1;
                }
            });
        });
        
        statsGrid.querySelectorAll('.plus-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const input = statsGrid.querySelector(`input[data-brother="${btn.dataset.brother}"]`);
                input.value = parseInt(input.value) + 1;
            });
        });
        
        // Apply stats changes
        document.getElementById('apply-stats-btn').addEventListener('click', async () => {
            const applyBtn = document.getElementById('apply-stats-btn');
            const originalText = applyBtn.textContent;
            
            try {
                applyBtn.textContent = 'Saving...';
                applyBtn.disabled = true;
                
                const newStats = {};
                statsGrid.querySelectorAll('.stat-count-input').forEach(input => {
                    newStats[input.dataset.brother] = parseInt(input.value);
                });
                
                console.log('New stats:', newStats);
                console.log('Filter group:', filterGroup);
                console.log('Current adminData length:', adminData.length);
                
                // Rebuild the data for this group
                const otherEntries = adminData.filter(e => e.group !== filterGroup);
                const newGroupEntries = [];
                
                Object.entries(newStats).forEach(([brother, targetCount]) => {
                    const currentEntries = filteredHistory.filter(e => e.brother === brother);
                    const currentCount = currentEntries.length;
                    
                    console.log(`${brother}: current=${currentCount}, target=${targetCount}`);
                    
                    if (targetCount >= currentCount) {
                        // Keep existing entries and add new ones
                        newGroupEntries.push(...currentEntries);
                        for (let i = 0; i < targetCount - currentCount; i++) {
                            newGroupEntries.push({
                                brother: brother,
                                group: filterGroup,
                                date: new Date().toISOString(),
                                presentBrothers: groupMembers
                            });
                        }
                    } else if (targetCount > 0) {
                        // Keep only the most recent entries
                        newGroupEntries.push(...currentEntries.slice(-targetCount));
                    }
                    // If targetCount is 0, don't add any entries for this brother
                });
                
                console.log('Other entries:', otherEntries.length, 'New group entries:', newGroupEntries.length);
                
                // Combine and save
                const updatedData = [...otherEntries, ...newGroupEntries].sort((a, b) => 
                    new Date(a.date) - new Date(b.date)
                );
                
                console.log('Total updated data entries:', updatedData.length);
                console.log('Saving to environment:', environment);
                
                // Save to Firestore
                await DB.saveData(environment, updatedData);
                
                // Reload the current environment's data if we're viewing it
                if ((environment === 'production' && !isTestMode) || (environment === 'test' && isTestMode)) {
                    console.log('✅ Reloading dishHistory for current environment');
                    await loadDishHistory();
                    console.log('✅ dishHistory reloaded, new length:', dishHistory.length);
                }
                
                alert('✅ Statistics updated successfully!');
                await displayAdminPanel(filterGroup, environment);
            } catch (error) {
                console.error('Failed to update statistics:', error);
                alert('❌ Failed to save changes. Please try again.');
            } finally {
                applyBtn.textContent = originalText;
                applyBtn.disabled = false;
            }
        });
    }
    
    // Display entries (most recent first) with delete buttons
    [...filteredHistory].reverse().forEach((entry, reverseIndex) => {
        const actualIndex = adminData.length - 1 - reverseIndex;
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry admin-mode';
        
        const date = new Date(entry.date);
        const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        
        logEntry.innerHTML = `
            <div class="log-entry-header">
                <span class="log-entry-name">
                    <img src="Images/${entry.brother}.png" alt="${entry.brother}" class="log-brother-img">
                    ${entry.brother}
                </span>
                <span class="log-entry-date">${dateStr}</span>
            </div>
            <div class="log-entry-group">Group: ${entry.group.replace(/,/g, ', ')}</div>
            <div class="admin-controls">
                <button class="edit-entry-btn" data-index="${actualIndex}">✏️ Edit</button>
                <button class="delete-entry-btn" data-index="${actualIndex}">🗑️ Delete</button>
            </div>
        `;
        adminEntries.appendChild(logEntry);
    });
    
    // Add edit functionality
    document.querySelectorAll('.edit-entry-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.index);
            const entry = adminData[index];
            
            // Create edit modal
            const editModal = document.createElement('div');
            editModal.className = 'modal';
            editModal.innerHTML = `
                <div class="modal-content">
                    <h2>✏️ Edit Entry</h2>
                    <div class="edit-form">
                        <label>Brother:</label>
                        <select id="edit-brother">
                            <option value="Yonatan" ${entry.brother === 'Yonatan' ? 'selected' : ''}>Yonatan</option>
                            <option value="Ohad" ${entry.brother === 'Ohad' ? 'selected' : ''}>Ohad</option>
                            <option value="Raz" ${entry.brother === 'Raz' ? 'selected' : ''}>Raz</option>
                            <option value="Yuval" ${entry.brother === 'Yuval' ? 'selected' : ''}>Yuval</option>
                        </select>
                        
                        <label>Date & Time:</label>
                        <input type="datetime-local" id="edit-date" value="${new Date(entry.date).toISOString().slice(0, 16)}" />
                        
                        <label>Group Members (comma-separated):</label>
                        <input type="text" id="edit-group" value="${entry.group}" />
                        
                        <div class="modal-buttons">
                            <button class="confirm-btn" id="save-edit-btn">💾 Save Changes</button>
                            <button class="secondary-btn" id="cancel-edit-btn">Cancel</button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(editModal);
            
            // Save changes
            document.getElementById('save-edit-btn').addEventListener('click', async () => {
                const saveBtn = document.getElementById('save-edit-btn');
                const originalText = saveBtn.textContent;
                
                try {
                    saveBtn.textContent = 'Saving...';
                    saveBtn.disabled = true;
                    
                    const newBrother = document.getElementById('edit-brother').value;
                    const newDate = new Date(document.getElementById('edit-date').value).toISOString();
                    const newGroup = document.getElementById('edit-group').value.split(',').map(s => s.trim()).sort().join(',');
                    
                    adminData[index] = {
                        brother: newBrother,
                        date: newDate,
                        group: newGroup,
                        presentBrothers: newGroup.split(',')
                    };
                    
                    await DB.saveData(environment, adminData);
                    editModal.remove();
                    await displayAdminPanel(filterGroup, environment);
                    alert('✅ Entry updated successfully!');
                } catch (error) {
                    console.error('Failed to update entry:', error);
                    alert('❌ Failed to save changes. Please try again.');
                    saveBtn.textContent = originalText;
                    saveBtn.disabled = false;
                }
            });
            
            // Cancel edit
            document.getElementById('cancel-edit-btn').addEventListener('click', () => {
                editModal.remove();
            });
        });
    });
    
    // Add delete functionality
    document.querySelectorAll('.delete-entry-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const index = parseInt(btn.dataset.index);
            if (confirm('Are you sure you want to delete this entry?')) {
                const deleteBtn = btn;
                const originalText = deleteBtn.textContent;
                
                try {
                    deleteBtn.textContent = '⏳';
                    deleteBtn.disabled = true;
                    
                    adminData.splice(index, 1);
                    await DB.saveData(environment, adminData);
                    await displayAdminPanel(filterGroup, environment);
                    alert('✅ Entry deleted successfully!');
                } catch (error) {
                    console.error('Failed to delete entry:', error);
                    alert('❌ Failed to delete entry. Please try again.');
                    deleteBtn.textContent = originalText;
                    deleteBtn.disabled = false;
                }
            }
        });
    });
    
    if (filteredHistory.length === 0) {
        adminEntries.innerHTML = '<p style="text-align: center; color: #999;">No history yet!</p>';
    }
}

// Admin group filter change
document.getElementById('admin-group-filter').addEventListener('change', async (e) => {
    const envFilter = document.getElementById('admin-env-filter');
    await displayAdminPanel(e.target.value, envFilter.value);
});

// Admin environment filter change
document.getElementById('admin-env-filter').addEventListener('change', async (e) => {
    const groupFilter = document.getElementById('admin-group-filter');
    await displayAdminPanel(groupFilter.value, e.target.value);
});

// Display log entries
function displayLog(filterGroup = 'all') {
    const logEntries = document.getElementById('log-entries');
    const groupFilter = document.getElementById('group-filter');
    
    // Update group filter options
    const uniqueGroups = [...new Set(dishHistory.map(entry => entry.group))];
    groupFilter.innerHTML = '<option value="all">All Groups</option>';
    uniqueGroups.forEach(group => {
        const option = document.createElement('option');
        option.value = group;
        option.textContent = `Group: ${group.replace(/,/g, ', ')}`;
        groupFilter.appendChild(option);
    });
    
    // Filter entries
    const filteredHistory = filterGroup === 'all' 
        ? dishHistory 
        : dishHistory.filter(entry => entry.group === filterGroup);
    
    // Display entries (most recent first)
    logEntries.innerHTML = '';
    [...filteredHistory].reverse().forEach(entry => {
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        
        const date = new Date(entry.date);
        const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        
        logEntry.innerHTML = `
            <div class="log-entry-header">
                <span class="log-entry-name">
                    <img src="Images/${entry.brother}.png" alt="${entry.brother}" class="log-brother-img">
                    ${entry.brother}
                </span>
                <span class="log-entry-date">${dateStr}</span>
            </div>
            <div class="log-entry-group">Group: ${entry.group.replace(/,/g, ', ')}</div>
        `;
        logEntries.appendChild(logEntry);
    });
    
    if (filteredHistory.length === 0) {
        logEntries.innerHTML = '<p style="text-align: center; color: #999;">No history yet!</p>';
    }
}

// Group filter change
document.getElementById('group-filter').addEventListener('change', (e) => {
    displayLog(e.target.value);
});

// Close log and return to results
document.getElementById('close-log-btn').addEventListener('click', () => {
    logScreen.classList.add('hidden');
    resultScreen.classList.remove('hidden');
});

// Reset button - back to selection
document.getElementById('reset-btn').addEventListener('click', () => {
    resetToSelection();
});

// Reset to selection screen
function resetToSelection() {
    resultScreen.classList.add('hidden');
    logScreen.classList.add('hidden');
    adminPanel.classList.add('hidden');
    selectionScreen.classList.remove('hidden');
    
    // Clear selections
    selectedBrothers.clear();
    brotherCards.forEach(card => card.classList.remove('selected'));
    submitBtn.disabled = true;
}

// Click title to go home
document.getElementById('page-title').addEventListener('click', () => {
    resetToSelection();
});
