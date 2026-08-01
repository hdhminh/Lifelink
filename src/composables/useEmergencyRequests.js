/**
 * useEmergencyRequests.js
 *
 * Manages emergency request data, including the Stage 3 real-time listener.
 * Each caller receives an instance-level listener and cleanup function.
 */

import { ref, onUnmounted } from 'vue'
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
import { ref as dbRef, get as rtdbGet, update as rtdbUpdate } from 'firebase/database'
import { db } from '@/firebase.js'
import { normalizeLocationRecord } from '@/data/vietnamLocations.js'

const cachedRequests = ref([])
let isSyncingConfirmedCounts = false

async function syncAllRequestConfirmedCounts() {
  if (isSyncingConfirmedCounts) return
  isSyncingConfirmedCounts = true
  try {
    const [snap1, snap2] = await Promise.all([
      getDocs(collection(db, 'confirmations')),
      getDocs(collection(db, 'guestConfirmations'))
    ])
    const countsMap = new Map()

    snap1.docs.forEach(d => {
      const data = d.data()
      if (data.requestId && data.status !== 'cancelled') {
        const reqId = String(data.requestId)
        countsMap.set(reqId, (countsMap.get(reqId) || 0) + 1)
      }
    })

    snap2.docs.forEach(d => {
      const data = d.data()
      if (data.requestId && data.status !== 'cancelled') {
        const reqId = String(data.requestId)
        countsMap.set(reqId, (countsMap.get(reqId) || 0) + 1)
      }
    })

    const requestsSnap = await getDocs(collection(db, 'emergencyRequests'))
    for (const reqDoc of requestsSnap.docs) {
      const reqData = reqDoc.data()
      const reqId = String(reqDoc.id)
      const realActiveCount = countsMap.get(reqId) || 0
      if (reqData.confirmedCount !== realActiveCount) {
        await updateDoc(doc(db, 'emergencyRequests', reqDoc.id), {
          confirmedCount: realActiveCount,
          updatedAt: serverTimestamp()
        })
      }
    }
  } catch (err) {
    console.warn('[useEmergencyRequests] syncAllRequestConfirmedCounts error:', err)
  } finally {
    isSyncingConfirmedCounts = false
  }
}

async function getRealtimeDatabaseInstance() {
  try {
    const firebaseModule = await import('@/firebase.js')
    return firebaseModule.rtdb || null
  } catch {
    return null
  }
}

function getTimeValue(value) {
  if (!value) return 0
  if (typeof value.toMillis === 'function') return value.toMillis()
  if (typeof value.seconds === 'number') return value.seconds * 1000
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? 0 : date.getTime()
}

function sortRequestsByNewest(list) {
  return [...list].sort((a, b) => getTimeValue(b.createdAt) - getTimeValue(a.createdAt))
}

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
    syncAllRequestConfirmedCounts()
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
        const list = snapshot.docs.map((docSnap) => {
          const data = docSnap.data()
          return normalizeLocationRecord({
            id: docSnap.id,
            ...data
          })
        })
        const sorted = sortRequestsByNewest(list)
        cachedRequests.value = sorted
        requests.value = sorted
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
      requests.value = sortRequestsByNewest(snap.docs.map((docSnap) =>
        normalizeLocationRecord({ id: docSnap.id, ...docSnap.data() })
      ))
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
    return requests.value.filter((req) => {
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
      const dataToSave = normalizeLocationRecord({ ...data })
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
        ...normalizeLocationRecord(updates),
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
      // 1. Delete associated confirmations
      const confSnap = await getDocs(
        query(collection(db, 'confirmations'), where('requestId', '==', requestId))
      )
      for (const confDoc of confSnap?.docs || []) {
        await deleteDoc(confDoc.ref)
      }

      // 2. Delete associated guest confirmations
      const guestSnap = await getDocs(
        query(collection(db, 'guestConfirmations'), where('requestId', '==', requestId))
      )
      for (const guestDoc of guestSnap?.docs || []) {
        await deleteDoc(guestDoc.ref)
      }

      // 3. Remove RTDB liveTracking nodes for this request
      const rtdbInstance = await getRealtimeDatabaseInstance()
      if (rtdbInstance) {
        const liveTrackingRef = dbRef(rtdbInstance, 'liveTracking')
        const rtdbSnap = await rtdbGet(liveTrackingRef)
        if (rtdbSnap.exists()) {
          const updates = {}
          rtdbSnap.forEach((child) => {
            const val = child.val()
            if (val && val.requestId === requestId) {
              updates[child.key] = null
            }
          })
          if (Object.keys(updates).length > 0) {
            await rtdbUpdate(liveTrackingRef, updates)
          }
        }
      }

      // 4. Delete the request document itself
      await deleteDoc(doc(db, 'emergencyRequests', requestId))
    } catch (err) {
      error.value = 'Could not delete the emergency request.'
      console.error('[useEmergencyRequests] deleteRequest error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  onUnmounted(() => {
    stopListening()
  })

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
