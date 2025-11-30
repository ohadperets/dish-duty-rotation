// Authentication Layer
export const Auth = {
    currentUser: null,
    
    // Wait for Firebase to be ready
    async waitForFirebase() {
        let attempts = 0;
        while (!window.firebaseAuth && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        if (!window.firebaseAuth) {
            throw new Error('Firebase Auth not initialized');
        }
    },

    // Initialize auth state listener
    async init() {
        await this.waitForFirebase();
        const { onAuthStateChanged } = window.authModules;
        
        return new Promise((resolve) => {
            onAuthStateChanged(window.firebaseAuth, (user) => {
                this.currentUser = user;
                resolve(user);
            });
        });
    },

    // Sign in with Google
    async signInWithGoogle() {
        await this.waitForFirebase();
        const { signInWithPopup, GoogleAuthProvider } = window.authModules;
        const provider = new GoogleAuthProvider();
        
        try {
            const result = await signInWithPopup(window.firebaseAuth, provider);
            this.currentUser = result.user;
            await this.saveUserToDb(result.user);
            return result.user;
        } catch (error) {
            console.error('Google sign-in error:', error);
            throw error;
        }
    },

    // Sign in with Facebook
    async signInWithFacebook() {
        await this.waitForFirebase();
        const { signInWithPopup, FacebookAuthProvider } = window.authModules;
        const provider = new FacebookAuthProvider();
        
        try {
            const result = await signInWithPopup(window.firebaseAuth, provider);
            this.currentUser = result.user;
            await this.saveUserToDb(result.user);
            return result.user;
        } catch (error) {
            console.error('Facebook sign-in error:', error);
            throw error;
        }
    },

    // Sign in with Email/Password
    async signInWithEmail(email, password) {
        await this.waitForFirebase();
        const { signInWithEmailAndPassword } = window.authModules;
        
        try {
            const result = await signInWithEmailAndPassword(window.firebaseAuth, email, password);
            this.currentUser = result.user;
            await this.saveUserToDb(result.user);
            return result.user;
        } catch (error) {
            console.error('Email sign-in error:', error);
            throw error;
        }
    },

    // Sign up with Email/Password
    async signUpWithEmail(email, password) {
        await this.waitForFirebase();
        const { createUserWithEmailAndPassword } = window.authModules;
        
        try {
            const result = await createUserWithEmailAndPassword(window.firebaseAuth, email, password);
            this.currentUser = result.user;
            await this.saveUserToDb(result.user);
            return result.user;
        } catch (error) {
            console.error('Email signup error:', error);
            throw error;
        }
    },

    // Sign out
    async signOut() {
        await this.waitForFirebase();
        const { signOut } = window.authModules;
        await signOut(window.firebaseAuth);
        this.currentUser = null;
    },

    // Save user to Firestore
    async saveUserToDb(user) {
        const { doc, setDoc, serverTimestamp } = window.firestoreModules;
        const userRef = doc(window.firebaseDB, 'users', user.uid);
        
        try {
            await setDoc(userRef, {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                lastLogin: serverTimestamp()
            }, { merge: true });
        } catch (error) {
            console.error('Error saving user:', error);
        }
    }
};
