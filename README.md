# LifeLink 🩸

LifeLink is a real-time emergency blood donor coordination web platform tailored for Vietnam. It connects blood donors, volunteers, and hospitals to coordinate urgent transfusions and save lives.

[![Vite](https://img.shields.io/badge/Vite-v8.1-646CFF.svg?logo=vite)](https://vitejs.dev/)
[![Vue](https://img.shields.io/badge/Vue-v3.5-4FC08D.svg?logo=vuejs)](https://vuejs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-v12.1-FFCA28.svg?logo=firebase)](https://firebase.google.com/)
[![Leaflet](https://img.shields.io/badge/Leaflet-v1.9-199900.svg?logo=leaflet&logoColor=white)](https://leafletjs.com/)
[![Playwright](https://img.shields.io/badge/Playwright-v1.61-2E8555.svg?logo=playwright)](https://playwright.dev/)
[![Vitest](https://img.shields.io/badge/Vitest-v4.1-FCC72C.svg?logo=vitest&logoColor=white)](https://vitest.dev/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## 📦 Core Features

- **Interactive Map & Priority Radar**: Renders a Leaflet map indicating emergency requests and outreach drives. Features a Haversine formula radar map with 3km and 10km radius zones.
- **Live Location Tracking**: Tracks donor GPS coordinates via `navigator.geolocation`, streaming them to Firebase Realtime Database with connection-isolated session identifiers and server-side disconnect purges.
- **Background Push Notifications**: Firebase Cloud Messaging triggers system notifications via a background Service Worker, alerting matched donors even when the application is completely closed.
- **Advanced Offline Support**: Built-in IndexedDB caching for offline queries via Firestore persistence, coupled with an offline operation queue that handles transaction retries once internet connectivity is restored.
- **Access Control Roles**: Custom views and authentication controls configured for Guest, Donor, and Administrator roles.

---

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v18.0.0 or higher)
- NPM (v9.0.0 or higher)

### Setup Steps
1. **Clone the Repository**
   ```bash
   git clone https://github.com/hdhminh/Lifelink.git
   cd Lifelink
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file from the template:
   ```bash
   cp .env.example .env
   ```
   Add your Firebase API keys and configurations:
   ```env
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   VITE_FIREBASE_DATABASE_URL=your-database-url
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Testing

Ensure all tests pass before making production builds or contributions:

- **Unit & Integration Tests (Vitest)**
  ```bash
  npm run test:unit
  ```

- **Firestore Security Rules Tests**
  ```bash
  npm run test:rules
  ```

- **End-to-End Tests (Playwright)**
  ```bash
  npm run test:e2e
  ```

- **Run All Tests**
  ```bash
  npm run test:all
  ```

---

## 📄 License
Distributed under the MIT License. See [LICENSE](LICENSE) for details.
