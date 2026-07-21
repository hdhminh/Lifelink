import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, writeBatch, serverTimestamp } from 'firebase/firestore';
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

const adminEmail = process.env.LIFELINK_ADMIN_EMAIL || 'admin@lifelink.vn';
const adminPassword = requireEnv('LIFELINK_ADMIN_PASSWORD');

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const seedRequests = [
  {
    hospitalName: 'Cho Ray Hospital',
    city: 'Ho Chi Minh City',
    bloodType: 'O-',
    urgency: 'critical',
    unitsNeeded: 5,
    confirmedCount: 0,
    status: 'active',
    description: 'A patient in emergency surgery after a severe traffic accident requires immediate O negative blood transfusion.',
    contactInfo: '0989123456',
    createdAt: new Date()
  },
  {
    hospitalName: 'Bach Mai Hospital',
    city: 'Ha Noi',
    bloodType: 'AB+',
    urgency: 'urgent',
    unitsNeeded: 3,
    confirmedCount: 1,
    status: 'active',
    description: 'A patient undergoing complex cardiac bypass surgery needs AB positive blood.',
    contactInfo: '0912345678',
    createdAt: new Date()
  },
  {
    hospitalName: 'Da Nang General Hospital',
    city: 'Da Nang',
    bloodType: 'B+',
    urgency: 'moderate',
    unitsNeeded: 2,
    confirmedCount: 0,
    status: 'active',
    description: 'Scheduled orthopedic procedure requires backup B positive blood units.',
    contactInfo: '0939123456',
    createdAt: new Date()
  },
  {
    hospitalName: 'Hue Central Hospital',
    city: 'Hue',
    bloodType: 'A-',
    urgency: 'urgent',
    unitsNeeded: 4,
    confirmedCount: 2,
    status: 'active',
    description: 'Pediatric patient undergoing oncology treatment needs matching A negative blood units.',
    contactInfo: '0909123456',
    createdAt: new Date()
  },
  {
    hospitalName: 'Can Tho General Hospital',
    city: 'Can Tho',
    bloodType: 'O+',
    urgency: 'moderate',
    unitsNeeded: 4,
    confirmedCount: 1,
    status: 'active',
    description: 'Obstetrics department requires emergency supply of O positive blood.',
    contactInfo: '0905123456',
    createdAt: new Date()
  }
];

async function seedRequestsDb() {
  console.log('Authenticating as Admin...');
  await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
  console.log('Admin authenticated successfully.');

  console.log('Fetching emergencyRequests collection to check if empty...');
  const querySnapshot = await getDocs(collection(db, 'emergencyRequests'));
  
  if (querySnapshot.size > 0) {
    console.log(`emergencyRequests collection already has ${querySnapshot.size} documents. Skipping seeding.`);
    return;
  }

  console.log('Seeding emergency requests...');
  const batch = writeBatch(db);
  for (const req of seedRequests) {
    const docRef = doc(collection(db, 'emergencyRequests'));
    batch.set(docRef, req);
  }
  await batch.commit();
  console.log('Successfully seeded emergency requests.');
}

seedRequestsDb().catch(err => {
  console.error('Error seeding requests:', err);
  process.exit(1);
});
