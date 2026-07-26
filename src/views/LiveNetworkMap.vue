<template>
  <div class="ll-page-container" style="min-height: 85vh">
    <div class="ll-section-header mb-3">
      <div>
        <h1 class="ll-section-title">
          <i class="bi bi-geo-alt-fill me-2" style="color: #8e2435"></i> Live Network Map
        </h1>
        <p class="ll-text-meta mb-0">
          Interactive map displaying active hospital emergency requests, live responder tracking,
          and upcoming donation drives across Vietnam.
        </p>
      </div>
    </div>

    <AlertMessage
      v-if="requestsError || eventsError"
      type="danger"
      :message="requestsError || eventsError"
    />

    <!-- Confirmation Modals Component -->
    <ConfirmationModals ref="modalsRef" :requests="requests" />

    <div>
      <EmergencyMap
        ref="mapRef"
        :emergency-requests="requests"
        :events="events"
        :confirmed-request-ids="confirmedRequestIds"
        :is-visible="true"
        title-text="Live Map"
        @respond="handleRespond"
      />
    </div>
  </div>
</template>

<script setup>
/**
 * LiveNetworkMap.vue
 * Dedicated top-level standalone view for the Live Network Map (/map).
 * Displays both Emergency Requests and Donation Events on a single interactive map.
 */

import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '@/firebase.js'
import { useAuth } from '@/composables/useAuth.js'
import { useGuestSession } from '@/composables/useGuestSession.js'
import { useEmergencyRequests } from '@/composables/useEmergencyRequests.js'
import { useDonationEvents } from '@/composables/useDonationEvents.js'
import EmergencyMap from '@/components/EmergencyMap.vue'
import AlertMessage from '@/components/AlertMessage.vue'
import ConfirmationModals from '@/components/ConfirmationModals.vue'

const route = useRoute()
const router = useRouter()
const mapRef = ref(null)
const modalsRef = ref(null)

const { user } = useAuth()
const { guestId } = useGuestSession()

const confirmedRequestIds = ref([])
let unsubscribeConfirmations = null

watch(
  [() => user.value, () => guestId.value],
  ([newUser, newGuestId]) => {
    if (unsubscribeConfirmations) {
      unsubscribeConfirmations()
      unsubscribeConfirmations = null
    }

    let userUnsub = null
    let guestUnsub = null

    let localUserIds = []
    let localGuestIds = []

    const syncIds = () => {
      confirmedRequestIds.value = [...new Set([...localUserIds, ...localGuestIds])]
    }

    if (newUser) {
      const q = query(collection(db, 'confirmations'), where('donorId', '==', newUser.uid))
      userUnsub = onSnapshot(q, (snap) => {
        localUserIds = snap.docs.map((doc) => doc.data().requestId)
        syncIds()
      })
    }
    if (newGuestId && !newUser) {
      const q2 = query(collection(db, 'confirmations'), where('guestId', '==', newGuestId))
      guestUnsub = onSnapshot(q2, (snap) => {
        localGuestIds = snap.docs.map((doc) => doc.data().requestId)
        syncIds()
      })
    }

    unsubscribeConfirmations = () => {
      if (userUnsub) userUnsub()
      if (guestUnsub) guestUnsub()
    }
  },
  { immediate: true }
)

const {
  requests,
  error: requestsError,
  startListening: startRequests,
  stopListening: stopRequests
} = useEmergencyRequests()

const {
  events,
  error: eventsError,
  startListening: startEvents,
  stopListening: stopEvents
} = useDonationEvents()

function handleRespond(requestId) {
  if (modalsRef.value) {
    modalsRef.value.handleConfirm(requestId)
  }
}

watch([requests, events, () => route.query.request, () => route.query.event], () => {
  nextTick(() => {
    if (mapRef.value) {
      if (route.query.request) {
        mapRef.value.focusRequest(route.query.request)
      } else if (route.query.event) {
        mapRef.value.focusRequest('ev_' + route.query.event)
      }
    }
  })
})

onMounted(() => {
  startRequests()
  startEvents()
  nextTick(() => {
    if (mapRef.value) {
      if (route.query.request) {
        mapRef.value.focusRequest(route.query.request)
      } else if (route.query.event) {
        mapRef.value.focusRequest('ev_' + route.query.event)
      }
    }
  })
})

onUnmounted(() => {
  stopRequests()
  stopEvents()
  if (unsubscribeConfirmations) {
    unsubscribeConfirmations()
  }
})
</script>
