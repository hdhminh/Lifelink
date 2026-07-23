/**
 * useDonationEvents.js
 *
 * Manages donation event records with a real-time listener and
 * optimistic interested toggles.
 */

import { ref } from 'vue'
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  increment,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '@/firebase.js'

const cachedEvents = ref([])

export function useDonationEvents() {
  const events = ref(cachedEvents.value)
  const loading = ref(cachedEvents.value.length === 0)
  const error = ref(null)
  let unsubscribeFn = null

  function sortEvents(list) {
    return [...list].sort((a, b) => new Date(a.date) - new Date(b.date))
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
    unsubscribeFn = onSnapshot(q, (snap) => {
      const sorted = sortEvents(snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })))
      cachedEvents.value = sorted
      events.value = sorted
      loading.value = false
    }, (err) => {
      error.value = 'Failed to load events. Please try again.'
      loading.value = false
      console.error('[useDonationEvents] startListening error:', err)
    })
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
    const index = events.value.findIndex(e => e.id === eventId)
    if (index === -1) return

    const event = events.value[index]
    const alreadyLiked = event.likedBy?.includes(userId)
    const snapshot = {
      likedBy: [...(event.likedBy || [])],
      interestedCount: event.interestedCount || 0
    }

    if (alreadyLiked) {
      events.value[index].likedBy = snapshot.likedBy.filter(id => id !== userId)
      events.value[index].interestedCount = Math.max(0, snapshot.interestedCount - 1)
    } else {
      events.value[index].likedBy = [...snapshot.likedBy, userId]
      events.value[index].interestedCount = snapshot.interestedCount + 1
    }

    try {
      if (alreadyLiked) {
        await updateDoc(eventRef, {
          likedBy: arrayRemove(userId),
          interestedCount: increment(-1),
          updatedAt: serverTimestamp()
        })
      } else {
        await updateDoc(eventRef, {
          likedBy: arrayUnion(userId),
          interestedCount: increment(1),
          updatedAt: serverTimestamp()
        })
      }
    } catch (err) {
      events.value[index].likedBy = snapshot.likedBy
      events.value[index].interestedCount = snapshot.interestedCount
      error.value = 'Could not update your Interested status.'
      console.error('[useDonationEvents] toggleInterested error:', err)
      throw err
    }
  }

  async function createEvent(data) {
    loading.value = true
    error.value = null
    try {
      await addDoc(collection(db, 'events'), {
        ...data,
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
        ...updates,
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
      events.value = events.value.filter(e => e.id !== eventId)
    } catch (err) {
      error.value = 'Could not delete the donation event.'
      console.error('[useDonationEvents] deleteEvent error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    events,
    loading,
    error,
    startListening,
    stopListening,
    fetchEvents,
    toggleInterested,
    createEvent,
    updateEvent,
    deleteEvent
  }
}
