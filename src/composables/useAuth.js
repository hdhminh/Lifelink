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
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '@/firebase.js'
import { useGuestSession } from '@/composables/useGuestSession.js'
import { normalizeLocationRecord } from '@/data/vietnamLocations.js'
import {
  clearAuthenticatedSession,
  markAuthenticatedSession
} from '@/utils/authSessionStorage.js'

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
  return snap.exists() ? normalizeLocationRecord({ id: snap.id, ...snap.data() }) : null
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
      // Auth state race condition fix: sign out and clear user if profile fetch fails
      try {
        await signOut(auth)
      } catch (signOutErr) {
        console.error('Failed to sign out after profile fetch error:', signOutErr)
      }
      user.value = null
      userProfile.value = null
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
  const isGuest = computed(() => !user.value)

  /**
   * Signs in with email and password.
   * Intercepts sample credentials to auto-register them if not yet present in Firebase.
   * @param {string} email - User email.
   * @param {string} password - User password.
   * @returns {Promise<void>}
   */
  async function login(email, password) {
    const credential = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password)
    const profile = await fetchUserProfile(credential.user.uid)
    markAuthenticatedSession(profile?.role || 'donor')
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
      city: normalizeLocationRecord({ city }).city,
      phoneNumber: phoneNumber || '',
      canDonateNow: true,
      lastDonationDate: null,
      createdAt: serverTimestamp()
    })
    userProfile.value = await fetchUserProfile(uid)
    markAuthenticatedSession(userProfile.value?.role || 'donor')
    const { clearGuestSession } = useGuestSession()
    clearGuestSession()
  }

  /**
   * Signs out the current user.
   * @returns {Promise<void>}
   */
  async function logout() {
    clearAuthenticatedSession()
    await signOut(auth)
  }

  /**
   * Updates fields on the current user's Firestore profile.
   * @param {Object} updates - Partial user fields.
   * @returns {Promise<void>}
   */
  async function updateProfile(updates) {
    if (!user.value) throw new Error('Not authenticated')
    // Filter updateProfile fields to prevent unauthorized field modifications
    const allowedFields = [
      'displayName',
      'bloodType',
      'city',
      'phoneNumber',
      'canDonateNow',
      'lastDonationDate'
    ]
    const filteredUpdates = {}
    for (const key of Object.keys(updates)) {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = updates[key]
      }
    }
    if (filteredUpdates.city) {
      filteredUpdates.city = normalizeLocationRecord({ city: filteredUpdates.city }).city
    }
    await updateDoc(doc(db, 'users', user.value.uid), filteredUpdates)
    userProfile.value = await fetchUserProfile(user.value.uid)
  }

  return {
    user,
    userProfile,
    isAdmin,
    isDonor,
    isGuest,
    authLoading,
    login,
    register,
    logout,
    updateProfile
  }
}
