/**
 * useDonationEvents.js
 *
 * Manages donation event records with a real-time listener and
 * optimistic interested toggles.
 */

import { ref, onUnmounted } from 'vue'
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  runTransaction,
  arrayUnion,
  arrayRemove,
  increment,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '@/firebase.js'
import { normalizeEventRecord } from '@/data/vietnamLocations.js'

const cachedEvents = ref([])

function getTimeValue(value) {
  if (!value) return 0
  if (typeof value.toMillis === 'function') return value.toMillis()
  if (typeof value.seconds === 'number') return value.seconds * 1000
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? 0 : date.getTime()
}

export function getGuestInterestId(guestSessionId) {
  return guestSessionId ? `guest:${guestSessionId}` : ''
}

export function isGuestInterestId(value) {
  return typeof value === 'string' && value.startsWith('guest:')
}

export function getGuestDisplayCode(value) {
  const raw = String(value || '').replace(/^guest:/, '')
  return raw.split('_')[1]?.slice(0, 4).toUpperCase() || raw.slice(0, 4).toUpperCase() || 'GUEST'
}

export function useDonationEvents() {
  const events = ref(cachedEvents.value)
  const loading = ref(cachedEvents.value.length === 0)
  const error = ref(null)
  let unsubscribeFn = null

  function sortEvents(list) {
    return [...list].sort((a, b) => {
      const dateDiff = new Date(a.date) - new Date(b.date)
      if (dateDiff !== 0) return dateDiff
      return getTimeValue(b.createdAt) - getTimeValue(a.createdAt)
    })
  }

  function startListening() {
    stopListening()
    if (cachedEvents.value.length > 0) {
      events.value = cachedEvents.value
      loading.value = false
    } else {
      loading.value = true
    }
    error.value = null

    const q = query(collection(db, 'events'), orderBy('date', 'asc'))
    unsubscribeFn = onSnapshot(
      q,
      (snap) => {
        const sorted = sortEvents(
          snap.docs.map((docSnap) => normalizeEventRecord({ id: docSnap.id, ...docSnap.data() }))
        )
        cachedEvents.value = sorted
        events.value = sorted
        loading.value = false
      },
      (err) => {
        error.value = 'Failed to load events. Please try again.'
        loading.value = false
        console.error('[useDonationEvents] startListening error:', err)
      }
    )
  }

  function stopListening() {
    if (unsubscribeFn) {
      unsubscribeFn()
      unsubscribeFn = null
    }
  }

  async function fetchEvents() {
    if (!events.value.length && !unsubscribeFn) {
      startListening()
    }
  }

  async function toggleInterested(eventId, userId) {
    const eventRef = doc(db, 'events', eventId)
    const index = events.value.findIndex((e) => e.id === eventId)
    if (index === -1) return

    const event = events.value[index]
    const alreadyLiked = event.likedBy?.includes(userId)
    const snapshot = {
      likedBy: [...(event.likedBy || [])],
      interestedCount: event.interestedCount || 0
    }

    // Optimistic UI update
    if (alreadyLiked) {
      events.value[index].likedBy = snapshot.likedBy.filter((id) => id !== userId)
      events.value[index].interestedCount = Math.max(0, snapshot.interestedCount - 1)
    } else {
      events.value[index].likedBy = [...snapshot.likedBy, userId]
      events.value[index].interestedCount = snapshot.interestedCount + 1
    }

    try {
      await runTransaction(db, async (transaction) => {
        const eventSnap = await transaction.get(eventRef)
        if (!eventSnap.exists()) {
          throw new Error('Event not found.')
        }

        const data = eventSnap.data()
        const serverLikedBy = data.likedBy || []
        const serverAlreadyLiked = serverLikedBy.includes(userId)

        if (serverAlreadyLiked) {
          transaction.update(eventRef, {
            likedBy: arrayRemove(userId),
            interestedCount: increment(-1),
            updatedAt: serverTimestamp()
          })
        } else {
          transaction.update(eventRef, {
            likedBy: arrayUnion(userId),
            interestedCount: increment(1),
            updatedAt: serverTimestamp()
          })
        }
      })
    } catch (err) {
      // Roll back optimistic UI update
      events.value[index].likedBy = snapshot.likedBy
      events.value[index].interestedCount = snapshot.interestedCount
      error.value = 'Could not update your Interested status.'
      console.error('[useDonationEvents] toggleInterested error:', err)
      throw err
    }
  }

  async function toggleGuestInterested(eventId, guestSessionId) {
    const guestInterestId = getGuestInterestId(guestSessionId)
    if (!guestInterestId) return
    return toggleInterested(eventId, guestInterestId)
  }

  async function createEvent(data) {
    loading.value = true
    error.value = null
    try {
      await addDoc(collection(db, 'events'), {
        ...normalizeEventRecord(data),
        interestedCount: 0,
        likedBy: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
    } catch (err) {
      error.value = 'Could not create the donation event.'
      console.error('[useDonationEvents] createEvent error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateEvent(eventId, updates) {
    loading.value = true
    error.value = null
    try {
      await updateDoc(doc(db, 'events', eventId), {
        ...normalizeEventRecord(updates),
        updatedAt: serverTimestamp()
      })
    } catch (err) {
      error.value = 'Could not update the donation event.'
      console.error('[useDonationEvents] updateEvent error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteEvent(eventId) {
    loading.value = true
    error.value = null
    try {
      await deleteDoc(doc(db, 'events', eventId))
      events.value = events.value.filter((e) => e.id !== eventId)
    } catch (err) {
      error.value = 'Could not delete the donation event.'
      console.error('[useDonationEvents] deleteEvent error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  onUnmounted(() => {
    stopListening()
  })

  return {
    events,
    loading,
    error,
    startListening,
    stopListening,
    fetchEvents,
    toggleInterested,
    toggleGuestInterested,
    createEvent,
    updateEvent,
    deleteEvent
  }
}
