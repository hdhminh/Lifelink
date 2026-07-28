/**
 * firebase.js
 *
 * Initialises Firebase and exports the auth and db instances.
 * Import these in composables — never import directly into components.
 * Never import service account keys or admin SDK in frontend code.
 */

import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore'
import { getDatabase } from 'firebase/database'
import { getMessaging, isSupported } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export let rtdb = null
export let messaging = null

try {
  rtdb = getDatabase(app, import.meta.env.VITE_FIREBASE_DATABASE_URL)
} catch (e) {
  rtdb = {}
}

if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      messaging = getMessaging(app)
    }
  }).catch((err) => {
    console.warn('FCM Messaging is not supported in this browser:', err)
  })
}

export const initFirebase = async () => {
  try {
    await enableIndexedDbPersistence(db)
  } catch (err) {
    if (err.code === 'failed-precondition') {
      console.warn('Firestore persistence failed: multiple tabs open')
    } else if (err.code === 'unimplemented') {
      console.warn('Firestore persistence not supported in this browser')
    } else {
      console.error('Firestore persistence error:', err)
    }
  }
  return { auth, db, rtdb, messaging }
}
