import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val) {
    env[key.trim()] = val.join('=').trim().replace(/^"|"$/g, '');
  }
});

const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  appId: env.VITE_FIREBASE_APP_ID
});
const db = getFirestore(app);
const auth = getAuth(app);

async function run() {
  await signInWithEmailAndPassword(auth, 'admin@lifelink.vn', 'admin123');
  
  const reqSnap = await getDocs(collection(db, 'emergencyRequests'));
  let updated = 0;
  for (const rDoc of reqSnap.docs) {
    const data = rDoc.data();
    if (data.hospitalName === 'Cho Ray Hospital' && data.description.includes('O negative')) {
      const newDesc = data.description.replace('O negative', 'O positive');
      await updateDoc(doc(db, 'emergencyRequests', rDoc.id), { description: newDesc });
      updated++;
      console.log('Fixed Cho Ray desc');
    } else if (data.hospitalName.includes('Gia Dinh People') && data.description.includes('O negative')) {
      const newDesc = data.description.replace('O negative', 'A positive');
      await updateDoc(doc(db, 'emergencyRequests', rDoc.id), { description: newDesc });
      updated++;
      console.log('Fixed Gia Dinh desc');
    }
  }
  
  console.log('Updated ' + updated + ' requests.');
  process.exit(0);
}

run().catch(console.error);

