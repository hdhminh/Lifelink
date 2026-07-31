# LifeLink 🩸

LifeLink is a real-time emergency blood donor coordination web platform tailored for Vietnam. It connects blood donors, volunteers, and hospitals to coordinate urgent transfusions and save lives.

🔗 **Live Web App:** [https://lifelink-vn.web.app](https://lifelink-vn.web.app)

---

## 🌟 Core Features

- **Interactive Map & Priority Radar**: Embeds a Leaflet map showing hospital emergency requests and donation events across Vietnam. Uses the Haversine formula to draw 3km and 10km priority radar circles.
- **Live Location Tracking**: Tracks donor coordinates via browser GPS, streaming to Firebase Realtime Database (RTDB) with connection isolation (UUIDs) and automatic cleanup of inactive responders.
- **Background Push Notifications**: Sends multicast push alerts via Firebase Cloud Messaging (FCM). Handles background alerts using a **Service Worker** (`public/firebase-messaging-sw.js`) so users receive notifications **even when the app is completely closed**.
- **Advanced Offline Support**: Persists Firestore queries in browser IndexedDB cache. Employs an offline operation queue (`offlineHandler.js`) with auto-retry logic to sync database writes when connection returns.
- **Access Control Roles**: Provides role-tailored views and dashboards for Guests, Donors, and Administrators.

---

## 🚀 Quick Start Guide

### 1. Installation
```bash
git clone https://github.com/hdhminh/Lifelink.git
cd Lifelink
npm install
```

### 2. Configure Environment variables
Copy the template `.env.example` to `.env` and fill in your Firebase configuration parameters:
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_DATABASE_URL=your-rtdb-database-url
```

### 3. Run Dev Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Running Tests
```bash
npm run test:unit      # Run unit and integration tests (Vitest)
npm run test:rules     # Run database rules tests (Local Emulator)
npm run test:e2e       # Run browser End-to-End tests (Playwright)
```

---

## 📄 License
Licensed under the MIT License.
