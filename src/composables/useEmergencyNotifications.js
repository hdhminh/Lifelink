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
import { useNotificationCenter } from '@/composables/useNotificationCenter.js'

export function useEmergencyNotifications() {
  const { user, userProfile, isAdmin } = useAuth()
  const { getGuestSession } = useGuestSession()
  const { notifStatus } = useGdprConsent()
  const { isEligible } = useEligibility()
  const { showToast } = useToast()
  const { addNotification } = useNotificationCenter()

  let requestsUnsubscribe = null
  let messageUnsubscribe = null

  async function waitForMessagingInstance(timeoutMs = 3000) {
    const startedAt = Date.now()
    while (!messaging && Date.now() - startedAt < timeoutMs) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    return messaging
  }

  async function registerFCMToken() {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (Notification.permission !== 'granted') return

    try {
      const messagingInstance = await waitForMessagingInstance()
      if (!messagingInstance) {
        console.warn('[useEmergencyNotifications] Firebase Messaging is not ready.')
        return
      }

      let swReg = null
      if ('serviceWorker' in navigator) {
        swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
        await navigator.serviceWorker.ready
      }

      const tokenOptions = {
        serviceWorkerRegistration: swReg || undefined
      }

      if (import.meta.env.VITE_FIREBASE_VAPID_KEY) {
        tokenOptions.vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY
      }

      const fcmToken = await getToken(messagingInstance, tokenOptions)

      if (!fcmToken) {
        console.warn('[useEmergencyNotifications] FCM returned an empty token.')
        return
      }

      if (user.value) {
        await updateDoc(doc(db, 'users', user.value.uid), {
          fcmToken,
          fcmUpdatedAt: serverTimestamp()
        })
      } else {
        const guestId = getGuestSession().guestId
        if (guestId) {
          await setDoc(
            doc(db, 'guestTokens', guestId),
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

  function maybeRegisterToken() {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (notifStatus.value === 'granted' || Notification.permission === 'granted') {
      registerFCMToken()
    }
  }

  function listenForegroundFCM() {
    try {
      waitForMessagingInstance().then((messagingInstance) => {
        if (!messagingInstance) return
        messageUnsubscribe = onMessage(messagingInstance, (payload) => {
          const title = payload.notification?.title || 'Emergency blood request'
          const body = payload.notification?.body || 'A new emergency blood request is available.'
          addNotification({
            title,
            body,
            type: 'warning',
            url: payload.data?.url || '/#/emergency-board'
          })
          showToast(`${title}: ${body}`, 'warning')
        })
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
          if (change.type !== 'added') return

          const newReq = { id: change.doc.id, ...change.doc.data() }

          if (user.value && userProfile.value && !isAdmin.value) {
            const eligible = isEligible(userProfile.value.lastDonationDate)
            const compatible = canDonateTo(userProfile.value.bloodType, newReq.bloodType)

            if (eligible && compatible) {
              addNotification({
                title: 'Compatible emergency request',
                body: `${newReq.bloodType} needed at ${newReq.hospitalName}.`,
                type: 'warning',
                url: `/#/emergency-board?request=${newReq.id}`
              })
              showToast(
                `Compatible emergency: ${newReq.bloodType} needed at ${newReq.hospitalName}!`,
                'warning'
              )
            }
          } else if (!user.value) {
            addNotification({
              title: 'Emergency blood request',
              body: `${newReq.bloodType} needed at ${newReq.hospitalName}.`,
              type: 'warning',
              url: `/#/emergency-board?request=${newReq.id}`
            })
            showToast(
              `Emergency blood request: ${newReq.bloodType} needed at ${newReq.hospitalName}!`,
              'warning'
            )
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
      if (status === 'granted') registerFCMToken()
    },
    { immediate: true }
  )

  watch(
    user,
    (newUser) => {
      maybeRegisterToken()

      if (newUser) {
        if (userProfile.value && !isAdmin.value) listenToNewRequests()
      } else {
        listenToNewRequests()
      }
    },
    { immediate: true }
  )

  onMounted(() => {
    listenForegroundFCM()
    maybeRegisterToken()
  })

  onUnmounted(() => {
    if (requestsUnsubscribe) requestsUnsubscribe()
    if (messageUnsubscribe) messageUnsubscribe()
  })
}
