import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const firebaseConfig = {
  apiKey: requireEnv('VITE_FIREBASE_API_KEY'),
  authDomain: requireEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: requireEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: requireEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: requireEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: requireEnv('VITE_FIREBASE_APP_ID')
};

const adminEmail = process.env.LIFELINK_ADMIN_EMAIL || 'admin@lifelink.vn';
const adminPassword = requireEnv('LIFELINK_ADMIN_PASSWORD');

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function clearEvents() {
  console.log('Signing in as Admin...');
  try {
    await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
    console.log('Admin signed in successfully.');
  } catch (err) {
    if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
      console.log('Admin account does not exist in Auth. Registering admin...');
      const credential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
      const uid = credential.user.uid;
      
      console.log('Creating Admin user profile document in users collection...');
      await setDoc(doc(db, 'users', uid), {
        uid,
        displayName: 'Demo Admin',
        email: adminEmail,
        role: 'admin',
        bloodType: 'O-',
        city: 'Ho Chi Minh City',
        createdAt: serverTimestamp()
      });
      console.log('Admin registered successfully.');
    } else {
      throw err;
    }
  }
  
  console.log('Fetching events collection...');
  const querySnapshot = await getDocs(collection(db, 'events'));
  console.log(`Found ${querySnapshot.size} events. Deleting...`);
  
  for (const document of querySnapshot.docs) {
    await deleteDoc(doc(db, 'events', document.id));
    console.log(`Deleted event: ${document.id}`);
  }
  console.log('Events collection cleared successfully!');
  process.exit(0);
}

clearEvents().catch((err) => {
  console.error('Fatal error during execution:', err);
  process.exit(1);
});
