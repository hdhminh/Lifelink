# LifeLink 🩸

[![Vite](https://img.shields.io/badge/Vite-v8.1-646CFF.svg?logo=vite)](https://vitejs.dev/)
[![Vue](https://img.shields.io/badge/Vue-v3.5-4FC08D.svg?logo=vuejs)](https://vuejs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-v12.1-FFCA28.svg?logo=firebase)](https://firebase.google.com/)
[![Leaflet](https://img.shields.io/badge/Leaflet-v1.9-199900.svg?logo=leaflet&logoColor=white)](https://leafletjs.com/)
[![Playwright](https://img.shields.io/badge/Playwright-v1.61-2E8555.svg?logo=playwright)](https://playwright.dev/)
[![Vitest](https://img.shields.io/badge/Vitest-v4.1-FCC72C.svg?logo=vitest&logoColor=white)](https://vitest.dev/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

LifeLink is a state-of-the-art, real-time emergency blood donor coordination web application tailored for Vietnam. The platform bridges the communication gap between blood donors, volunteers, and hospitals to coordinate urgent transfusions dynamically and save lives.

The application features a warm beige and deep crimson wine theme, focusing on high semantic accessibility, elegant user interface design, and sub-second real-time responsiveness.

---

## 📸 Interface Preview

### Home and Community Overview
![Homepage Hero](./docs/screenshots/homepage.png)

### Emergency Request Board
![Emergency Board](./docs/screenshots/emergency_board.png)

### Outreach Events
![Outreach Events](./docs/screenshots/event_dashboard.png)

### Admin Operations Dashboard
![Admin Dashboard](./docs/screenshots/admin_dashboard.png)

### Donor Dashboard
![Donor Dashboard](./docs/screenshots/donor_dashboard.png)

---

## 🌟 Core Features

### 1. Interactive Map & Haversine Radar Map
- **Leaflet & OpenStreetMap Integration**: Embeds an interactive map featuring all active emergency blood requests and donation events across Vietnam.
- **Haversine Proximity Radar**: Renders dynamic 3km (inner) and 10km (outer) radar circles around each emergency hospital to visualize local blood donor density.
- **Vietnam Territory Containment**: Ensures map operations and geographic boundaries are strictly constrained to domestic Vietnam territory using custom GeoJSON boundaries (`vietnam-boundary-islands.geojson`).
- **OSRM Routing Engine**: Computes and overlays real-time driving routes, estimated travel distances, and ETA times directly from the donor's current location to the target hospital, with fallback redirects to Google Maps Navigation.

### 2. Live Geolocation Tracking & Simulated Responders
- **Real-Time Geolocation Streaming**: Uses the browser's `navigator.geolocation.watchPosition` API to track donor coordinates during active emergency journeys.
- **Firebase Realtime Database (RTDB) Sync**: Streams high-frequency, ephemeral tracking data to `liveTracking/` nodes in RTDB.
- **Tab Connection Isolation**: Isolates tracking sessions using UUID-based connection keys (`{requestId}_{donorId}_{connectionId}`) to prevent state conflicts when a user opens the app in multiple tabs.
- **Data Optimization & Heartbeat**: Utilizes throttling (coordinates are only updated if the user moves >15-30m or after 5s) and a 30s heartbeat (`lastSeenAt`) to keep the tracking live and minimize DB overhead.
- **Automatic Cleanup**: Implements RTDB `onDisconnect().remove()` hooks to instantly remove disconnected responders, combined with a Firebase Scheduled Cloud Function to purge inactive responders every 5 minutes.
- **Simulation Engine**: Features an integrated demo simulation runner that auto-generates mock responders navigating toward emergency hospitals across Vietnam to preview active tracking in development.

### 3. Background Push Notifications (FCM & Service Worker)
- **Firebase Cloud Messaging (FCM)**: Connects users and guests to web push notifications, requesting consent through a custom GDPR notification modal.
- **Cloud Functions Multi-Cast**: When a hospital or administrator publishes a new active emergency, a Firestore trigger function (`onEmergencyCreated`) automatically pushes notification payloads to all registered authenticated and guest FCM tokens.
- **Background Service Worker**: Registers a background message service worker (`public/firebase-messaging-sw.js`) that intercepts FCM messages and triggers system-level notifications **even when the LifeLink application is completely closed or the browser is minimized**.
- **Interactive Notification Clicking**: Clicking a system notification automatically opens/focuses the browser window and redirects the user directly to the emergency board with the specific request focused (`/#/emergency-board?request=<id>`).

### 4. Advanced Offline Support & Queue
- **Firestore Offline Persistence**: Enables Firestore offline cache (`enableIndexedDbPersistence`) so that the application remains fully browsable (including active requests, donation events, and cached maps) when network connectivity is lost.
- **Offline Operation Queue**: Implements an operation queue (`src/utils/offlineHandler.js`) that intercepts write operations (like registering for events or confirming availability) when offline, queueing them for automatic retries (up to 3 attempts) as soon as connection is restored.
- **Network Status Banner**: Features a smooth slide-down, Wine-Beige colored network status indicator showing offline mode and pending queue counts.

### 5. Access Control Roles
- **Guests**: Browse active emergencies, view blood type compatibility matrix, register for drives, and confirm availability.
- **Donors**: Track donation history, view dynamic medical cooldowns (enforcing the 56-day Vietnamese medical gap between donations), manage profile settings, and stream live location to hospitals.
- **Admins**: View dashboard analytics, perform full CRUD operations on emergency requests and outreach events, and moderate system users.

---

## 🛠️ Tech Stack

- **Frontend Framework**: Vue 3 (Composition API, `<script setup>`)
- **Styling**: Bootstrap 5 + Scoped Vanilla CSS
- **Database & Auth**: Google Firebase (Firestore for persistent collections, Realtime Database for high-frequency live tracking, Firebase Authentication)
- **Map Library**: Leaflet.js (OpenStreetMap) + OSRM API
- **Router**: Vue Router 4 (Lazy-loaded views, navigation guards)
- **Testing Tools**: Vitest (Unit/Integration testing), Playwright (E2E testing), Firebase Emulator Suite (Rules compliance)
- **Linter & Formatter**: ESLint, Prettier, Lighthouse CI

---

## 📂 Project Structure

```text
LifeLink/
├── docs/                     # Documentation assets and screenshots
├── functions/                # Firebase Cloud Functions (FCM push notification & cleanup hooks)
│   ├── index.js              # Functions entry point
│   └── package.json          # Node dependencies for functions
├── public/                   # Static assets
│   ├── data/                 # GeoJSON boundaries (vietnam-boundary-islands.geojson)
│   ├── images/               # WebP static banners & fallbacks
│   └── firebase-messaging-sw.js # Service worker for background push notifications
├── scripts/                  # Data seeding and RSS fetching utilities
├── src/
│   ├── components/           # Reusable UI widgets (OfflineIndicator, SupportChatWidget, etc.)
│   │   └── profile/          # Profile specific widgets
│   ├── composables/          # Modular state hooks (useLocationTracking, useOnlineStatus, etc.)
│   ├── data/                 # Mock database seeds and hospital databases
│   ├── directives/           # Custom directives (v-highlight-urgency)
│   ├── router/               # Route setup and access control guards
│   ├── styles/               # CSS assets (global.css, icon subsets)
│   ├── utils/                # Pure logic helpers (Haversine, offline queue)
│   ├── views/                # Full page views (Home, DonorDashboard, LiveNetworkMap, etc.)
│   ├── App.vue               # Entry component
│   └── main.js               # Entry script
├── tests/                    # Testing suite
│   ├── unit/                 # Unit testing code for views, components, composables
│   ├── integration/          # Integration workflow tests
│   ├── rules/                # Firestore rules compliance tests
│   └── e2e/                  # Playwright Integration testing code
├── database.rules.json       # Realtime Database security rules
├── eslint.config.js          # ESLint code style rules
├── firebase.json             # Firebase deployment and emulator configuration
├── firestore.rules           # Firestore security rules
├── firestore.indexes.json    # Firestore query indexes
├── package.json              # NPM dependencies & test scripts
├── playwright.config.js      # Playwright E2E configurations
├── vite.config.js            # Vite bundler configurations
└── vitest.config.js          # Vitest testing configurations
```

---

## 🚀 Installation & Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **NPM**: v9.0.0 or higher

### Step-by-Step Guide

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-username/LifeLink.git
   cd LifeLink
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy the environment template:
   ```bash
   cp .env.example .env
   ```
   Open the `.env` file and fill in your Firebase configuration parameters:
   ```env
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   VITE_FIREBASE_DATABASE_URL=your-rtdb-database-url
   VITE_FIREBASE_VAPID_KEY=your-fcm-vapid-key
   ```

4. **Run Local Dev Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

5. **Build for Production**:
   ```bash
   npm run build
   ```

---

## 🛡️ Firebase Security Rules & Indexes

To deploy the security rules and custom indexes to your Firebase Console:

1. Install Firebase CLI globally if you haven't:
   ```bash
   npm install -g firebase-tools
   ```

2. Authenticate and select your project:
   ```bash
   firebase login
   firebase use --add <your-project-id>
   ```

3. Deploy Firestore rules and indexes:
   ```bash
   firebase deploy --only firestore
   ```

4. Deploy Realtime Database rules:
   ```bash
   firebase deploy --only database
   ```

5. Deploy Cloud Functions:
   ```bash
   firebase deploy --only functions
   ```

---

## 🧪 Testing Guide

LifeLink includes automated testing coverage spanning all levels of the application.

### Running Unit & Integration Tests (Vitest)
Unit and integration tests target pure logic helpers, composables, and vue components:
```bash
npm run test:unit
```

### Running Firestore Security Rules Tests
Rules testing spins up the local Firestore Emulator to validate reading/writing constraints:
```bash
# Ensure you have Java runtime installed for Firebase Emulators
npm run test:rules
```

### Running End-to-End Tests (Playwright)
Playwright simulates browser sessions, donor flows, and web accessibility compliance:
```bash
# Install required test browsers first
npx playwright install

# Run E2E tests in headless mode
npm run test:e2e

# Run E2E tests in interactive UI mode
npm run test:e2e:ui
```

### Run All Tests Sequentially
```bash
npm run test:all
```

---

## 🧹 Code Quality & Formatter

Ensure style guidelines are maintained before committing code changes:

- **Run ESLint Linter**:
  ```bash
  npm run lint
  ```
- **Automatically Fix Lint Errors**:
  ```bash
  npm run lint:fix
  ```
- **Code Formatter (Prettier)**:
  ```bash
  npm run format
  ```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
