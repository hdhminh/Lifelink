import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val) {
    env[key.trim()] = val.join('=').trim().replace(/^`"|`"$/g, '');
  }
});

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function run() {
  await signInWithEmailAndPassword(auth, 'admin@lifelink.vn', 'admin123');
  
  const q = query(collection(db, 'emergencyRequests'), where('hospitalName', '==', 'Da Nang General Hospital'));
  const snap = await getDocs(q);
  
  console.log('--- Da Nang Requests ---');
  snap.docs.forEach(doc => {
    console.log('Request ID:', doc.id);
    console.log('Confirmed Count:', doc.data().confirmedCount);
    console.log('CreatedAt:', doc.data().createdAt?.toDate());
  });

  const q2 = query(collection(db, 'confirmations'), where('hospitalName', '==', 'Da Nang General Hospital'));
  const snap2 = await getDocs(q2);
  
  console.log('\n--- Da Nang Confirmations ---');
  snap2.docs.forEach(doc => {
    console.log('Confirmation ID:', doc.id);
    console.log('Donor ID:', doc.data().donorId);
    console.log('Donor Name:', doc.data().donorName);
    console.log('Status:', doc.data().status);
    console.log('Request ID:', doc.data().requestId);
  });
  
  process.exit(0);
}

run().catch(console.error);
