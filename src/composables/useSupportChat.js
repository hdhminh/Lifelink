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

const THREADS_COLLECTION = 'supportThreads'

function getThreadRef(threadId) {
  return doc(db, THREADS_COLLECTION, threadId)
}

function getMessagesCollection(threadId) {
  return collection(db, THREADS_COLLECTION, threadId, 'messages')
}

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

export function useSupportChat() {
  const loading = ref(false)
  const error = ref(null)

  async function ensureThread(threadId, threadSeed) {
    const threadRef = getThreadRef(threadId)
    const snap = await getDoc(threadRef)
    if (!snap.exists()) {
      await setDoc(threadRef, buildThreadSeed(threadSeed))
    }
  }

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

  function listenToThreadMessages(threadId, onData, onFailure) {
    const q = query(getMessagesCollection(threadId), orderBy('createdAt', 'asc'))
    return onSnapshot(q, (snap) => {
      onData(snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })))
    }, onFailure)
  }

  function listenToThreads(onData, onFailure) {
    const q = query(collection(db, THREADS_COLLECTION), orderBy('lastMessageAt', 'desc'))
    return onSnapshot(q, (snap) => {
      onData(snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })))
    }, onFailure)
  }

  async function markAdminThreadRead(threadId) {
    await updateDoc(getThreadRef(threadId), {
      adminLastReadAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
  }

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
