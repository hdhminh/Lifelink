import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const adminEmail = process.env.LIFELINK_ADMIN_EMAIL || 'admin@lifelink.vn';
const adminPassword = requireEnv('LIFELINK_ADMIN_PASSWORD');

const seedEvents = [
  {
    title: 'Red Journey 2026 — Opening Ceremony & Blood Drive',
    date: '2026-06-11',
    city: 'Ho Chi Minh City',
    category: 'Campaign',
    location: 'Youth Cultural Center HCMC',
    description: 'National launch of the 14th edition of the Red Journey voluntary blood donation campaign and opening drive.',
    interestedCount: 0,
    likedBy: [],
    createdAt: serverTimestamp()
  },
  {
    title: '"Red Highlands" Blood Donation Festival — Dak Lak',
    date: '2026-07-02',
    city: 'Buon Ma Thuot',
    category: 'Campaign',
    location: 'Dak Lak Provincial Cultural Center',
    description: 'Regional blood donation festival under the national Red Journey 2026 campaign to address summer shortages.',
    interestedCount: 0,
    likedBy: [],
    createdAt: serverTimestamp()
  },
  {
    title: '"Ancestral Land Pink Drop" Drive — Phu Tho',
    date: '2026-07-10',
    city: 'Viet Tri',
    category: 'Drive',
    location: 'Phu Tho Provincial Sports Stadium',
    description: 'Voluntary blood collection festival organized in collaboration with the provincial Red Cross and NIHBT.',
    interestedCount: 0,
    likedBy: [],
    createdAt: serverTimestamp()
  },
  {
    title: '"Da River Pink Drop" Festival — Hoa Binh',
    date: '2026-07-15',
    city: 'Hoa Binh',
    category: 'Drive',
    location: 'Hoa Binh Provincial Cultural Palace',
    description: 'Annual community blood donation drive in Hoa Binh province supporting the national Red Journey campaign.',
    interestedCount: 0,
    likedBy: [],
    createdAt: serverTimestamp()
  },
  {
    title: '"Lang Land Pink Drop" Festival — Lang Son',
    date: '2026-07-22',
    city: 'Lang Son',
    category: 'Campaign',
    location: 'Lang Son Provincial Convention Center',
    description: 'Humanitarian blood drive and public awareness campaign on voluntary blood donation and Thalassemia in Lang Son.',
    interestedCount: 0,
    likedBy: [],
    createdAt: serverTimestamp()
  },
  {
    title: '"Alluvial Pink Drop" Drive — Can Tho',
    date: '2026-07-28',
    city: 'Can Tho',
    category: 'Drive',
    location: 'Luu Huu Phuoc Park Can Tho',
    description: 'The largest blood donation festival in the Mekong Delta region, marking the concluding leg of Red Journey 2026.',
    interestedCount: 0,
    likedBy: [],
    createdAt: serverTimestamp()
  }
];

async function seed() {
  console.log('Signing in...');
  await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
  console.log('Seeding events...');
  for (const evt of seedEvents) {
    await addDoc(collection(db, 'events'), evt);
    console.log(`Added event: ${evt.title}`);
  }
  console.log('Seeding complete!');
  process.exit(0);
}

seed().catch(console.error);
