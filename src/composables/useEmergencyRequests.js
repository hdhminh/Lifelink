/**
 * useEmergencyRequests.js
 *
 * Manages emergency request data, including the Stage 3 real-time listener.
 * Each caller receives an instance-level listener and cleanup function.
 */

import { ref } from 'vue'
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  doc,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '@/firebase.js'

const cachedRequests = ref([])

export function useEmergencyRequests() {
  const requests = ref(cachedRequests.value)
  const loading = ref(cachedRequests.value.length === 0)
  const error = ref(null)
  let unsubscribeFn = null

  /**
   * Starts the active emergency requests Firestore onSnapshot listener.
   * @returns {void}
   */
  function startListening() {
    stopListening()
    if (cachedRequests.value.length > 0) {
      requests.value = cachedRequests.value
      loading.value = false
    } else {
      loading.value = true
    }
    error.value = null

    const q = query(
      collection(db, 'emergencyRequests'),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    )

    unsubscribeFn = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        }))
        cachedRequests.value = list
        requests.value = list
        loading.value = false
      },
      (err) => {
        error.value = 'Could not load emergency requests. Please check your connection.'
        loading.value = false
        console.error('[useEmergencyRequests] onSnapshot error:', err)
      }
    )
  }

  /**
   * Stops the active Firestore listener and prevents stale reads.
   * @returns {void}
   */
  function stopListening() {
    if (unsubscribeFn) {
      unsubscribeFn()
      unsubscribeFn = null
    }
  }

  /**
   * Fetches all emergency requests once for the admin table.
   * @returns {Promise<void>}
   */
  async function fetchAllRequests() {
    loading.value = true
    error.value = null
    try {
      const q = query(collection(db, 'emergencyRequests'), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      requests.value = snap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }))
    } catch (err) {
      error.value = 'Could not load requests for the admin panel.'
      console.error('[useEmergencyRequests] fetchAllRequests error:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Filters the live requests array client-side.
   * @param {string} bloodType - Blood type filter or empty string.
   * @param {string} city - City text filter or empty string.
   * @param {string} urgency - Urgency filter or empty string.
   * @returns {Array<Object>} Filtered requests.
   */
  function filterRequests(bloodType, city, urgency) {
    return requests.value.filter(req => {
      const matchBloodType = !bloodType || req.bloodType === bloodType || req.bloodType === 'Any'
      const requestCity = req.city || ''
      const matchCity = !city || requestCity.toLowerCase().includes(city.toLowerCase())
      const matchUrgency = !urgency || req.urgency === urgency
      return matchBloodType && matchCity && matchUrgency
    })
  }

  /**
   * Creates a new emergency request.
   * @param {Object} data - Request data without system fields.
   * @param {string} adminUid - Admin UID.
   * @returns {Promise<void>}
   */
  async function createRequest(data, adminUid) {
    loading.value = true
    error.value = null
    try {
      const dataToSave = { ...data }
      const customCreatedAt = dataToSave.createdAt
      delete dataToSave.createdAt

      await addDoc(collection(db, 'emergencyRequests'), {
        ...dataToSave,
        confirmedCount: 0,
        status: 'active',
        createdBy: adminUid,
        createdAt: customCreatedAt || serverTimestamp(),
        updatedAt: serverTimestamp()
      })
    } catch (err) {
      error.value = 'Could not create the emergency request.'
      console.error('[useEmergencyRequests] createRequest error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Updates an existing emergency request.
   * @param {string} requestId - Request document ID.
   * @param {Object} updates - Fields to update.
   * @returns {Promise<void>}
   */
  async function updateRequest(requestId, updates) {
    loading.value = true
    error.value = null
    try {
      await updateDoc(doc(db, 'emergencyRequests', requestId), {
        ...updates,
        updatedAt: serverTimestamp()
      })
    } catch (err) {
      error.value = 'Could not update the emergency request.'
      console.error('[useEmergencyRequests] updateRequest error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Permanently deletes an emergency request.
   * @param {string} requestId - Request document ID.
   * @returns {Promise<void>}
   */
  async function deleteRequest(requestId) {
    loading.value = true
    error.value = null
    try {
      await deleteDoc(doc(db, 'emergencyRequests', requestId))
    } catch (err) {
      error.value = 'Could not delete the emergency request.'
      console.error('[useEmergencyRequests] deleteRequest error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    requests,
    loading,
    error,
    startListening,
    stopListening,
    fetchAllRequests,
    filterRequests,
    createRequest,
    updateRequest,
    deleteRequest
  }
}
