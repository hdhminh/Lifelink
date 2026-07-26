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
    if (data.hospitalName === 'Cho Ray Hospital' && data.bloodType === 'O-') {
      await updateDoc(doc(db, 'emergencyRequests', rDoc.id), { bloodType: 'O+' });
      updated++;
      console.log('Fixed Cho Ray request to O+');
    } else if (data.hospitalName.includes('Gia Dinh People') && data.bloodType === 'O-') {
      await updateDoc(doc(db, 'emergencyRequests', rDoc.id), { bloodType: 'A+' });
      updated++;
      console.log('Fixed Gia Dinh request to A+');
    }
  }
  
  const confSnap = await getDocs(collection(db, 'confirmations'));
  for (const cDoc of confSnap.docs) {
    const data = cDoc.data();
    if (data.hospitalName === 'Cho Ray Hospital' && data.bloodType === 'O-') {
        // Wait, confirmations should have the DONOR's blood type. 
        // We shouldn't change the donor's blood type here, because they are mock donors and they already have their blood type.
        // Actually, we shouldn't touch the confirmations bloodType.
    }
  }
  
  console.log('Updated ' + updated + ' requests.');
  process.exit(0);
}

run().catch(console.error);

