/**
 * useAuth.js
 *
 * Manages Firebase Auth state and the user's Firestore profile.
 * Module-level refs are used so all components share one auth state.
 */

import { ref, computed } from 'vue'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth'
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore'
import { auth, db } from '@/firebase.js'
import { useGuestSession } from '@/composables/useGuestSession.js'

const user = ref(null)
const userProfile = ref(null)
const authLoading = ref(true)

/**
 * Fetches a user document from Firestore.
 * @param {string} uid - Firebase Auth UID.
 * @returns {Promise<Object|null>} Firestore profile data or null.
 */
async function fetchUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

onAuthStateChanged(auth, async (firebaseUser) => {
  user.value = firebaseUser
  if (firebaseUser) {
    authLoading.value = true
    try {
      const profile = await fetchUserProfile(firebaseUser.uid)
      userProfile.value = profile
    } catch (err) {
      console.error('Failed to fetch user profile:', err)
    } finally {
      authLoading.value = false
    }
  } else {
    userProfile.value = null
    authLoading.value = false
  }
})

export function useAuth() {
  const isAdmin = computed(() => userProfile.value?.role === 'admin')
  const isDonor = computed(() => !!user.value && userProfile.value?.role === 'donor')

  /**
   * Signs in with email and password.
   * Intercepts sample credentials to auto-register them if not yet present in Firebase.
   * @param {string} email - User email.
   * @param {string} password - User password.
   * @returns {Promise<void>}
   */
  async function login(email, password) {
    await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password)
    const { clearGuestSession } = useGuestSession()
    clearGuestSession()
  }

  /**
   * Creates a Firebase account and Firestore donor profile.
   * @param {{ email: string, password: string, displayName: string, bloodType: string, city: string, phoneNumber: string }} formData - Registration data.
   * @returns {Promise<void>}
   */
  async function register({ email, password, displayName, bloodType, city, phoneNumber }) {
    const credential = await createUserWithEmailAndPassword(auth, email, password)
    const uid = credential.user.uid

    await setDoc(doc(db, 'users', uid), {
      uid,
      displayName,
      email,
      role: 'donor',
      bloodType,
      city,
      phoneNumber: phoneNumber || '',
      canDonateNow: true,
      lastDonationDate: null,
      createdAt: serverTimestamp()
    })
    userProfile.value = await fetchUserProfile(uid)
    const { clearGuestSession } = useGuestSession()
    clearGuestSession()
  }

  /**
   * Signs out the current user.
   * @returns {Promise<void>}
   */
  async function logout() {
    await signOut(auth)
  }

  /**
   * Updates fields on the current user's Firestore profile.
   * @param {Object} updates - Partial user fields.
   * @returns {Promise<void>}
   */
  async function updateProfile(updates) {
    if (!user.value) throw new Error('Not authenticated')
    await updateDoc(doc(db, 'users', user.value.uid), updates)
    userProfile.value = await fetchUserProfile(user.value.uid)
  }

  return {
    user,
    userProfile,
    isAdmin,
    isDonor,
    authLoading,
    login,
    register,
    logout,
    updateProfile
  }
}
