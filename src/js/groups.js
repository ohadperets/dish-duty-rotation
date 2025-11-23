// Group Management Layer
export const Groups = {
    
    // Generate random 5-digit group ID
    generateGroupId() {
        return Math.floor(10000 + Math.random() * 90000).toString();
    },

    // Create a new group
    async createGroup(groupName, creatorUid, photoUrl = '👥') {
        const { doc, setDoc, getDoc, serverTimestamp } = window.firestoreModules;
        
        let groupId;
        let attempts = 0;
        
        // Generate unique group ID
        while (attempts < 10) {
            groupId = this.generateGroupId();
            const groupRef = doc(window.firebaseDB, 'groups', groupId);
            const groupSnap = await getDoc(groupRef);
            
            if (!groupSnap.exists()) {
                break;
            }
            attempts++;
        }
        
        if (attempts >= 10) {
            throw new Error('Failed to generate unique group ID');
        }
        
        try {
            // Create group document
            const groupRef = doc(window.firebaseDB, 'groups', groupId);
            await setDoc(groupRef, {
                groupId,
                name: groupName,
                photoUrl,
                creatorUid,
                createdAt: serverTimestamp()
            });
            
            // Add creator as member
            const memberRef = doc(window.firebaseDB, 'groupMembers', `${groupId}_${creatorUid}`);
            await setDoc(memberRef, {
                groupId,
                uid: creatorUid,
                role: 'creator',
                joinedAt: serverTimestamp()
            });
            
            // Initialize empty dish data with empty dishwashers
            const dishDataRef = doc(window.firebaseDB, 'groupData', groupId);
            await setDoc(dishDataRef, {
                dishwashers: {},  // Empty object for dishwashers
                history: [],
                lastUpdated: serverTimestamp()
            });
            
            return groupId;
        } catch (error) {
            console.error('Error creating group:', error);
            throw error;
        }
    },

    // Join existing group
    async joinGroup(groupId, uid) {
        const { doc, getDoc, setDoc, serverTimestamp } = window.firestoreModules;
        
        try {
            // Check if group exists
            const groupRef = doc(window.firebaseDB, 'groups', groupId);
            const groupSnap = await getDoc(groupRef);
            
            if (!groupSnap.exists()) {
                throw new Error('Group not found');
            }
            
            // Check if already a member
            const memberRef = doc(window.firebaseDB, 'groupMembers', `${groupId}_${uid}`);
            const memberSnap = await getDoc(memberRef);
            
            if (memberSnap.exists()) {
                throw new Error('Already a member of this group');
            }
            
            // Add as member
            await setDoc(memberRef, {
                groupId,
                uid,
                role: 'member',
                joinedAt: serverTimestamp()
            });
            
            return groupSnap.data();
        } catch (error) {
            console.error('Error joining group:', error);
            throw error;
        }
    },

    // Get user's groups
    async getUserGroups(uid) {
        const { collection, query, where, getDocs } = window.firestoreModules;
        
        try {
            const membersRef = collection(window.firebaseDB, 'groupMembers');
            const q = query(membersRef, where('uid', '==', uid));
            const querySnapshot = await getDocs(q);
            
            const groupIds = [];
            querySnapshot.forEach((doc) => {
                groupIds.push({
                    groupId: doc.data().groupId,
                    role: doc.data().role
                });
            });
            
            // Get group details
            const groups = [];
            for (const item of groupIds) {
                const groupDoc = await this.getGroup(item.groupId);
                if (groupDoc) {
                    groups.push({
                        ...groupDoc,
                        role: item.role
                    });
                }
            }
            
            return groups;
        } catch (error) {
            console.error('Error getting user groups:', error);
            return [];
        }
    },

    // Get group details
    async getGroup(groupId) {
        const { doc, getDoc } = window.firestoreModules;
        
        try {
            const groupRef = doc(window.firebaseDB, 'groups', groupId);
            const groupSnap = await getDoc(groupRef);
            
            if (groupSnap.exists()) {
                return groupSnap.data();
            }
            return null;
        } catch (error) {
            console.error('Error getting group:', error);
            return null;
        }
    },

    // Get group data (dish rotation data)
    async getGroupData(groupId) {
        const { doc, getDoc } = window.firestoreModules;
        
        try {
            const dataRef = doc(window.firebaseDB, 'groupData', groupId);
            const dataSnap = await getDoc(dataRef);
            
            if (dataSnap.exists()) {
                return dataSnap.data().history || [];
            }
            return [];
        } catch (error) {
            console.error('Error getting group data:', error);
            return [];
        }
    },

    // Save group data
    async saveGroupData(groupId, dishwashers, history) {
        const { doc, setDoc, serverTimestamp } = window.firestoreModules;
        
        try {
            const dataRef = doc(window.firebaseDB, 'groupData', groupId);
            await setDoc(dataRef, {
                dishwashers,
                history,
                lastUpdated: serverTimestamp()
            });
        } catch (error) {
            console.error('Error saving group data:', error);
            throw error;
        }
    },

    // Add dishwasher to group
    async addDishwasher(groupId, name, photoUrl) {
        const { doc, getDoc, updateDoc } = window.firestoreModules;
        
        try {
            const dataRef = doc(window.firebaseDB, 'groupData', groupId);
            const dataSnap = await getDoc(dataRef);
            
            if (!dataSnap.exists()) {
                throw new Error('Group data not found');
            }
            
            const data = dataSnap.data();
            const dishwashers = data.dishwashers || {};
            
            // Add new dishwasher
            dishwashers[name] = photoUrl || '👤';
            
            await updateDoc(dataRef, { dishwashers });
            return dishwashers;
        } catch (error) {
            console.error('Error adding dishwasher:', error);
            throw error;
        }
    },

    // Remove dishwasher from group
    async removeDishwasher(groupId, name) {
        const { doc, getDoc, updateDoc } = window.firestoreModules;
        
        try {
            const dataRef = doc(window.firebaseDB, 'groupData', groupId);
            const dataSnap = await getDoc(dataRef);
            
            if (!dataSnap.exists()) {
                throw new Error('Group data not found');
            }
            
            const data = dataSnap.data();
            const dishwashers = data.dishwashers || {};
            
            // Remove dishwasher
            delete dishwashers[name];
            
            await updateDoc(dataRef, { dishwashers });
            return dishwashers;
        } catch (error) {
            console.error('Error removing dishwasher:', error);
            throw error;
        }
    },

    // Get dishwashers for a group
    async getDishwashers(groupId) {
        const { doc, getDoc } = window.firestoreModules;
        
        try {
            const dataRef = doc(window.firebaseDB, 'groupData', groupId);
            const dataSnap = await getDoc(dataRef);
            
            if (dataSnap.exists()) {
                return dataSnap.data().dishwashers || {};
            }
            return {};
        } catch (error) {
            console.error('Error getting dishwashers:', error);
            return {};
        }
    }
};
