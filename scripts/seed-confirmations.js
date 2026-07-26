import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc, query, where, serverTimestamp } from 'firebase/firestore';
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

const mockDonors = JSON.parse(fs.readFileSync('src/data/mockDonors.json', 'utf-8'));

async function run() {
  await signInWithEmailAndPassword(auth, 'admin@lifelink.vn', 'admin123');

  // Delete all old mock confirmations
  const allConfSnap = await getDocs(collection(db, 'confirmations'));
  for (const d of allConfSnap.docs) {
    if (d.data().donorName && d.data().donorName.includes('Mock Donor')) {
      await deleteDoc(doc(db, 'confirmations', d.id));
    }
  }

  const reqSnap = await getDocs(collection(db, 'emergencyRequests'));
  let usedDonors = [];
  
  for (const rDoc of reqSnap.docs) {
    const rData = rDoc.data();
    if (rData.confirmedCount > 0) {
      const confQuery = query(collection(db, 'confirmations'), where('requestId', '==', rDoc.id));
      const confSnap = await getDocs(confQuery);
      
      if (confSnap.empty) {
        for(let i=0; i<rData.confirmedCount; i++) {
          let randomDonor = mockDonors.find(m => !usedDonors.includes(m.id)) || mockDonors[Math.floor(Math.random() * mockDonors.length)];
          usedDonors.push(randomDonor.id);
          
          await setDoc(doc(db, 'confirmations', rDoc.id + '_' + randomDonor.id), {
            requestId: rDoc.id,
            donorId: randomDonor.id,
            donorName: randomDonor.displayName,
            bloodType: rData.bloodType || 'A+',
            hospitalName: rData.hospitalName || '',
            city: rData.city || '',
            status: 'confirmed',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
      }
    }
  }
  console.log('Done.');
  process.exit(0);
}

run().catch(console.error);

