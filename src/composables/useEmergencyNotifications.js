import { onUnmounted, watch } from 'vue'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '@/firebase.js'
import { canDonateTo } from '@/utils/bloodCompatibility.js'
import { useEligibility } from '@/composables/useEligibility.js'
import { useAuth } from '@/composables/useAuth.js'
import { useToast } from '@/composables/useToast.js'

export function useEmergencyNotifications() {
  const { user, userProfile, isAdmin } = useAuth()
  const { isEligible } = useEligibility()
  const { showToast } = useToast()

  let requestsUnsubscribe = null

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
    user,
    (newUser) => {
      if (newUser && userProfile.value && !isAdmin.value) {
        listenToNewRequests()
      } else {
        if (requestsUnsubscribe) {
          requestsUnsubscribe()
          requestsUnsubscribe = null
        }
      }
    },
    { immediate: true }
  )

  watch(userProfile, (newProfile) => {
    if (newProfile && user.value && !isAdmin.value && !requestsUnsubscribe) {
      listenToNewRequests()
    }
  })

  onUnmounted(() => {
    if (requestsUnsubscribe) requestsUnsubscribe()
  })
}
