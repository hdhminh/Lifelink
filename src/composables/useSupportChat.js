/**
 * useSupportChat.js
 *
 * Real-time two-way support chat system between guests/users and administrators.
 * Uses Firebase Firestore sub-collections (supportThreads/{threadId}/messages)
 * with batched writes to keep thread metadata and messages in sync.
 *
 * Thread lifecycle:
 * 1. Participant sends first message → thread document is created via merge.
 * 2. Messages are appended as sub-collection documents.
 * 3. Admin or participant marks thread as read by updating timestamp fields.
 */

import { ref } from 'vue'
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch
} from 'firebase/firestore'
import { db } from '@/firebase.js'

/** @constant {string} THREADS_COLLECTION - Firestore root collection for support threads. */
const THREADS_COLLECTION = 'supportThreads'

/**
 * Returns a Firestore document reference for a support thread.
 * @param {string} threadId - Thread document ID (usually participantId or guestId).
 * @returns {import('firebase/firestore').DocumentReference}
 */
function getThreadRef(threadId) {
  return doc(db, THREADS_COLLECTION, threadId)
}

/**
 * Returns the messages sub-collection reference for a thread.
 * @param {string} threadId - Parent thread document ID.
 * @returns {import('firebase/firestore').CollectionReference}
 */
function getMessagesCollection(threadId) {
  return collection(db, THREADS_COLLECTION, threadId, 'messages')
}

/**
 * Builds the initial thread document seed data.
 * @param {{ participantId: string, participantType: string, participantDisplayName?: string, participantEmail?: string }} opts
 * @returns {Object} Thread seed fields with server timestamps.
 */
function buildThreadSeed({
  participantId,
  participantType,
  participantDisplayName,
  participantEmail
}) {
  return {
    participantId,
    participantType,
    participantDisplayName: participantDisplayName || (participantType === 'guest' ? 'Guest User' : 'User'),
    participantEmail: participantEmail || (participantType === 'guest' ? 'Guest Session' : ''),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastMessage: '',
    lastMessageAt: serverTimestamp(),
    lastMessageSenderRole: 'participant',
    adminLastReadAt: null,
    participantLastReadAt: serverTimestamp()
  }
}

/**
 * Composable providing real-time support chat operations.
 * All message sends use Firestore writeBatch to atomically update both
 * the thread metadata and the message sub-document.
 * @returns {Object} Chat API methods and reactive loading/error state.
 */
export function useSupportChat() {
  const loading = ref(false)
  const error = ref(null)

  /**
   * Ensures a support thread document exists; creates it if missing.
   * @param {string} threadId - Thread document ID.
   * @param {Object} threadSeed - Seed data for thread creation.
   * @returns {Promise<void>}
   */
  async function ensureThread(threadId, threadSeed) {
    const threadRef = getThreadRef(threadId)
    const snap = await getDoc(threadRef)
    if (!snap.exists()) {
      await setDoc(threadRef, buildThreadSeed(threadSeed))
    }
  }

  /**
   * Sends a message from a participant (guest or user) and updates thread metadata.
   * @param {Object} opts - Message options.
   * @param {string} opts.threadId - Thread document ID.
   * @param {string} opts.text - Message text content.
   * @returns {Promise<void>}
   */
  async function sendParticipantMessage({
    threadId,
    participantId,
    participantType,
    participantDisplayName,
    participantEmail,
    text,
    senderName
  }) {
    loading.value = true
    error.value = null
    try {
      const batch = writeBatch(db)
      const threadRef = getThreadRef(threadId)
      const messageRef = doc(getMessagesCollection(threadId))
      const threadSeed = buildThreadSeed({
        participantId,
        participantType,
        participantDisplayName,
        participantEmail
      })

      batch.set(threadRef, {
        ...threadSeed,
        lastMessage: text,
        lastMessageAt: serverTimestamp(),
        lastMessageSenderRole: 'participant',
        participantLastReadAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true })

      batch.set(messageRef, {
        threadId,
        senderId: participantId,
        senderRole: participantType === 'guest' ? 'guest' : 'user',
        senderName: senderName || threadSeed.participantDisplayName,
        text,
        createdAt: serverTimestamp()
      })

      await batch.commit()
    } catch (err) {
      error.value = err.message || 'Could not send support message.'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Sends an automated system/bot message to a support thread.
   * @param {Object} opts - Message options including system sender identity.
   * @returns {Promise<void>}
   */
  async function sendSystemMessage({
    threadId,
    participantId,
    participantType,
    participantDisplayName,
    participantEmail,
    text,
    senderId = 'support_bot',
    senderRole = 'support_bot',
    senderName = 'Support Bot'
  }) {
    loading.value = true
    error.value = null
    try {
      const batch = writeBatch(db)
      const threadRef = getThreadRef(threadId)
      const messageRef = doc(getMessagesCollection(threadId))
      const threadSeed = buildThreadSeed({
        participantId,
        participantType,
        participantDisplayName,
        participantEmail
      })

      batch.set(threadRef, {
        ...threadSeed,
        lastMessage: text,
        lastMessageAt: serverTimestamp(),
        lastMessageSenderRole: senderRole,
        updatedAt: serverTimestamp()
      }, { merge: true })

      batch.set(messageRef, {
        threadId,
        senderId,
        senderRole,
        senderName,
        text,
        createdAt: serverTimestamp()
      })

      await batch.commit()
    } catch (err) {
      error.value = err.message || 'Could not send system message.'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Sends a message from the admin and marks the thread as admin-read.
   * @param {Object} opts - Message options.
   * @returns {Promise<void>}
   */
  async function sendAdminMessage({
    threadId,
    participantId,
    participantType,
    participantDisplayName,
    participantEmail,
    text
  }) {
    loading.value = true
    error.value = null
    try {
      const batch = writeBatch(db)
      const threadRef = getThreadRef(threadId)
      const messageRef = doc(getMessagesCollection(threadId))
      const threadSeed = buildThreadSeed({
        participantId,
        participantType,
        participantDisplayName,
        participantEmail
      })

      batch.set(threadRef, {
        ...threadSeed,
        lastMessage: text,
        lastMessageAt: serverTimestamp(),
        lastMessageSenderRole: 'admin',
        adminLastReadAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true })

      batch.set(messageRef, {
        threadId,
        senderId: 'admin',
        senderRole: 'admin',
        senderName: 'System Administrator',
        text,
        createdAt: serverTimestamp()
      })

      await batch.commit()
    } catch (err) {
      error.value = err.message || 'Could not send admin message.'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Starts a real-time listener on messages within a thread, ordered by creation time.
   * @param {string} threadId - Thread to listen to.
   * @param {Function} onData - Callback receiving an array of message objects.
   * @param {Function} onFailure - Error callback.
   * @returns {Function} Firestore unsubscribe function.
   */
  function listenToThreadMessages(threadId, onData, onFailure) {
    const q = query(getMessagesCollection(threadId), orderBy('createdAt', 'asc'))
    return onSnapshot(q, (snap) => {
      onData(snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })))
    }, onFailure)
  }

  /**
   * Starts a real-time listener on all support threads, ordered by last message time.
   * @param {Function} onData - Callback receiving an array of thread objects.
   * @param {Function} onFailure - Error callback.
   * @returns {Function} Firestore unsubscribe function.
   */
  function listenToThreads(onData, onFailure) {
    const q = query(collection(db, THREADS_COLLECTION), orderBy('lastMessageAt', 'desc'))
    return onSnapshot(q, (snap) => {
      onData(snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })))
    }, onFailure)
  }

  /**
   * Updates the admin's last-read timestamp for a specific thread.
   * @param {string} threadId - Thread to mark as read.
   * @returns {Promise<void>}
   */
  async function markAdminThreadRead(threadId) {
    await updateDoc(getThreadRef(threadId), {
      adminLastReadAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
  }

  /**
   * Updates the participant's last-read timestamp for a specific thread.
   * @param {string} threadId - Thread to mark as read.
   * @returns {Promise<void>}
   */
  async function markParticipantThreadRead(threadId) {
    await updateDoc(getThreadRef(threadId), {
      participantLastReadAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
  }

  return {
    loading,
    error,
    ensureThread,
    sendParticipantMessage,
    sendSystemMessage,
    sendAdminMessage,
    listenToThreadMessages,
    listenToThreads,
    markAdminThreadRead,
    markParticipantThreadRead
  }
}
