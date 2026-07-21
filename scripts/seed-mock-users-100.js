import { initializeApp } from 'firebase/app';
import { getFirestore, collection, writeBatch, doc, getDocs, query, where } from 'firebase/firestore';
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

const firstNames = ['John', 'Emily', 'Michael', 'Sarah', 'David', 'Jessica', 'James', 'Rachel', 'Alex', 'Nguyen', 'Tran', 'Le', 'Pham', 'Vu', 'Hoang', 'Do', 'Dang', 'Bui'];
const middleNames = ['', 'Van', 'Thanh', 'Minh', 'Huu', 'Duc', 'Quang', 'Ngoc', 'Kim', 'Thi', 'Phuong', 'Edward', 'Marie', 'Lee'];
const lastNames = ['Smith', 'Jones', 'Johnson', 'Brown', 'Miller', 'Davis', 'Wilson', 'Taylor', 'Anderson', 'Thomas', 'Anh', 'Dung', 'Tuan', 'Lan', 'Vy', 'Ha', 'Phong'];
const citiesList = ['Ho Chi Minh City', 'Ha Noi', 'Da Nang', 'Can Tho', 'Hue'];
const bloodTypes = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];

async function seedMockUsers() {
  console.log('Authenticating as Admin...');
  await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
  console.log('Admin authenticated successfully.');

  console.log('Fetching existing mock users for cleanup...');
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('email', '>=', 'mock_'), where('email', '<=', 'mock_\uf8ff'));
  const snapshot = await getDocs(q);

  if (snapshot.size > 0) {
    console.log(`Cleaning up ${snapshot.size} old mock users...`);
    let batch = writeBatch(db);
    let count = 0;
    for (const d of snapshot.docs) {
      batch.delete(doc(db, 'users', d.id));
      count++;
    }
    await batch.commit();
    console.log('Cleanup completed.');
  }

  console.log('Generating 98 mock user profiles...');
  const mockUsers = [];
  for (let i = 1; i <= 98; i++) {
    const uid = `mock_user_${i}_${Math.random().toString(36).substring(2, 9)}`;
    const fn = firstNames[(i * 3 + 7) % firstNames.length];
    const mn = middleNames[(i * 2 + 1) % middleNames.length];
    const ln = lastNames[(i * 5 + 4) % lastNames.length];
    const mockName = mn ? `${fn} ${mn} ${ln}` : `${fn} ${ln}`;
    const email = `mock_user_${i}@mock.lifelink.vn`;
    const city = citiesList[(i * 3) % citiesList.length];
    const bloodType = bloodTypes[(i * 7) % bloodTypes.length];
    
    mockUsers.push({
      uid,
      displayName: mockName,
      email,
      city,
      bloodType,
      role: 'donor',
      createdAt: new Date()
    });
  }

  console.log('Writing 98 mock users to Firestore...');
  let batch = writeBatch(db);
  for (const user of mockUsers) {
    const userDocRef = doc(db, 'users', user.uid);
    batch.set(userDocRef, user);
  }
  await batch.commit();
  console.log('Successfully seeded 98 mock users to Firebase Cloud.');
}

seedMockUsers().catch(err => {
  console.error('Error seeding mock users:', err);
  process.exit(1);
});
