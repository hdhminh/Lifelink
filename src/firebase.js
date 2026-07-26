/**
 * firebase.js
 *
 * Initialises Firebase and exports the auth and db instances.
 * Import these in composables — never import directly into components.
 * Never import service account keys or admin SDK in frontend code.
 */

export let auth = null;
export let db = null;
export let rtdb = null;

let initPromise = null;

export const initFirebase = async () => {
  if (initPromise) return initPromise;
  
  initPromise = (async () => {
    const [
      { initializeApp },
      { getAuth },
      { getFirestore, enableIndexedDbPersistence },
      { getDatabase }
    ] = await Promise.all([
      import('firebase/app'),
      import('firebase/auth'),
      import('firebase/firestore'),
      import('firebase/database')
    ]);

    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID
    };

    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);

    try {
      await enableIndexedDbPersistence(db);
    } catch (err) {
      if (err.code === 'failed-precondition') {
        console.warn('Firestore persistence failed: multiple tabs open');
      } else if (err.code === 'unimplemented') {
        console.warn('Firestore persistence not supported in this browser');
      } else {
        console.error('Firestore persistence error:', err);
      }
    }

    try {
      rtdb = getDatabase(app, import.meta.env.VITE_FIREBASE_DATABASE_URL);
    } catch (e) {
      rtdb = {};
    }

    return { auth, db, rtdb };
  })();
  
  return initPromise;
};
