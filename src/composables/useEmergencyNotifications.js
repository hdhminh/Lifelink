import { onMounted, onUnmounted, watch } from 'vue'
import { collection, query, where, onSnapshot, doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { getToken, onMessage } from 'firebase/messaging'
import { db, messaging } from '@/firebase.js'
import { canDonateTo } from '@/utils/bloodCompatibility.js'
import { useEligibility } from '@/composables/useEligibility.js'
import { useAuth } from '@/composables/useAuth.js'
import { useGuestSession } from '@/composables/useGuestSession.js'
import { useGdprConsent } from '@/composables/useGdprConsent.js'
import { useToast } from '@/composables/useToast.js'

export function useEmergencyNotifications() {
  const { user, userProfile, isAdmin } = useAuth()
  const { getGuestSession } = useGuestSession()
  const { notifStatus } = useGdprConsent()
  const { isEligible } = useEligibility()
  const { showToast } = useToast()

  let requestsUnsubscribe = null
  let messageUnsubscribe = null

  async function registerFCMToken() {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (Notification.permission !== 'granted') return

    try {
      if (!messaging) return

      // Service Worker registration
      let swReg = null
      if ('serviceWorker' in navigator) {
        swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
      }

      const fcmToken = await getToken(messaging, {
        serviceWorkerRegistration: swReg || undefined
      })

      if (!fcmToken) return

      if (user.value) {
        // Save token to user profile document
        const userRef = doc(db, 'users', user.value.uid)
        await updateDoc(userRef, {
          fcmToken,
          fcmUpdatedAt: serverTimestamp()
        })
      } else {
        // Save token to guestTokens collection
        const guestId = getGuestSession().guestId
        if (guestId) {
          const guestRef = doc(db, 'guestTokens', guestId)
          await setDoc(
            guestRef,
            {
              guestSessionId: guestId,
              fcmToken,
              updatedAt: serverTimestamp()
            },
            { merge: true }
          )
        }
      }
    } catch (err) {
      console.warn('[useEmergencyNotifications] FCM token registration warning:', err)
    }
  }

  function listenForegroundFCM() {
    if (!messaging) return
    try {
      messageUnsubscribe = onMessage(messaging, (payload) => {
        const title = payload.notification?.title || '🚨 Máu khẩn cấp'
        const body = payload.notification?.body || 'Có yêu cầu hiến máu khẩn cấp mới!'
        showToast(`${title}: ${body}`, 'warning')
      })
    } catch (err) {
      console.warn('[useEmergencyNotifications] onMessage setup warning:', err)
    }
  }

  function listenToNewRequests() {
    if (requestsUnsubscribe) {
      requestsUnsubscribe()
      requestsUnsubscribe = null
    }

    const q = query(collection(db, 'emergencyRequests'), where('status', '==', 'active'))

    let isInitialLoad = true

    requestsUnsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (isInitialLoad) {
          isInitialLoad = false
          return
        }

        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const newReq = { id: change.doc.id, ...change.doc.data() }

            // Match blood compatibility and eligibility
            if (user.value && userProfile.value && !isAdmin.value) {
              const eligible = isEligible(userProfile.value.lastDonationDate)
              const compatible = canDonateTo(userProfile.value.bloodType, newReq.bloodType)

              if (eligible && compatible) {
                showToast(
                  `🚨 Compatible emergency: ${newReq.bloodType} needed at ${newReq.hospitalName}!`,
                  'warning'
                )
              }
            }
          }
        })
      },
      (err) => {
        console.error('[EmergencyNotifications] Error listening to new emergency requests:', err)
      }
    )
  }

  watch(
    notifStatus,
    (status) => {
      if (status === 'granted') {
        registerFCMToken()
      }
    },
    { immediate: true }
  )

  watch(
    user,
    (newUser) => {
      if (newUser) {
        if (notifStatus.value === 'granted') registerFCMToken()
        if (userProfile.value && !isAdmin.value) listenToNewRequests()
      } else {
        if (requestsUnsubscribe) {
          requestsUnsubscribe()
          requestsUnsubscribe = null
        }
      }
    },
    { immediate: true }
  )

  onMounted(() => {
    listenForegroundFCM()
    if (notifStatus.value === 'granted') {
      registerFCMToken()
    }
  })

  onUnmounted(() => {
    if (requestsUnsubscribe) requestsUnsubscribe()
    if (messageUnsubscribe) messageUnsubscribe()
  })
}
