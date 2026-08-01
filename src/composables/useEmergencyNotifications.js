import { onMounted, onUnmounted, watch } from 'vue'
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, setDoc, limit, serverTimestamp } from 'firebase/firestore'
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
        const firebaseConfig = {
          apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
          authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
          projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
          storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
          appId: import.meta.env.VITE_FIREBASE_APP_ID
        }
        
        const configParam = encodeURIComponent(JSON.stringify(firebaseConfig))
        swReg = await navigator.serviceWorker.register(`/firebase-messaging-sw.js?firebaseConfig=${configParam}`)
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

  let notificationsUnsubscribe = null

  function listenToNotificationsCollection() {
    if (notificationsUnsubscribe) {
      notificationsUnsubscribe()
      notificationsUnsubscribe = null
    }

    const q = collection(db, 'notifications')
    let isInitialLoad = true

    notificationsUnsubscribe = onSnapshot(
      q,
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type !== 'added') return

          const data = change.doc.data()
          const isForAdmin = data.targetRole === 'admin' && isAdmin.value
          const isForCurrentUser = user.value && data.userId === user.value.uid
          const guestSession = getGuestSession()
          const isForGuest = !user.value && guestSession && data.userId === guestSession.guestId

          if (isForAdmin || isForCurrentUser || isForGuest) {
            addNotification({
              id: change.doc.id,
              title: data.title || 'LifeLink Notification',
              body: data.message || '',
              type: data.type === 'cancellation' ? 'warning' : 'success'
            })

            if (!isInitialLoad) {
              showToast(
                `${data.title}: ${data.message}`,
                data.type === 'cancellation' ? 'warning' : 'success',
                5000
              )
            }
          }
        })

        isInitialLoad = false
      },
      (err) => {
        console.warn('[EmergencyNotifications] Error listening to notifications collection:', err)
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
    [user, userProfile],
    () => {
      maybeRegisterToken()

      if (user.value) {
        if (userProfile.value && !isAdmin.value) listenToNewRequests()
      } else {
        listenToNewRequests()
      }

      listenToNotificationsCollection()
    },
    { immediate: true }
  )

  onMounted(() => {
    listenForegroundFCM()
    maybeRegisterToken()
    listenToNotificationsCollection()
  })

  onUnmounted(() => {
    if (requestsUnsubscribe) requestsUnsubscribe()
    if (messageUnsubscribe) messageUnsubscribe()
    if (notificationsUnsubscribe) notificationsUnsubscribe()
  })
}
