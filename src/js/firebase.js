// Firebase Database Layer
import { STORAGE_KEYS } from '../config/constants.js';

export const DB = {
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
            const fallback = localStorage.getItem(
                environment === 'production' ? STORAGE_KEYS.production : STORAGE_KEYS.test
            );
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
