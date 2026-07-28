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

    <ConfirmModal
      :show="showEventInterestModal"
      :title="isRemovingEventInterest ? 'Remove Event Interest' : 'Mark Interested'"
      :message="
        isRemovingEventInterest
          ? `Are you sure you want to remove your interest for '${pendingInterestEvent?.title}'?`
          : `Are you sure you want to mark interest for '${pendingInterestEvent?.title}'?`
      "
      :confirm-label="isRemovingEventInterest ? 'Remove Interest' : 'Interested'"
      @confirm="commitEventInterestToggle"
      @cancel="cancelEventInterestToggle"
    />

    <!-- Confirmation Modals Component -->
    <ConfirmationModals
      ref="modalsRef"
      :requests="requests"
      :confirmed-request-ids="confirmedRequestIds"
      @confirmed="handleConfirmedRequest"
    />

    <div>
      <EmergencyMap
        ref="mapRef"
        :emergency-requests="requests"
        :events="events"
        :confirmed-request-ids="confirmedRequestIds"
        :is-visible="true"
        title-text="Live Map"
        @respond="handleRespond"
        @open-maps="handleOpenMaps"
        @register-event="handleEventRegister"
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
import { useToast } from '@/composables/useToast.js'
import EmergencyMap from '@/components/EmergencyMap.vue'
import AlertMessage from '@/components/AlertMessage.vue'
import ConfirmationModals from '@/components/ConfirmationModals.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'

const route = useRoute()
const router = useRouter()
const mapRef = ref(null)
const modalsRef = ref(null)

const { user } = useAuth()
const guestSession = useGuestSession()
const guestId = ref(guestSession.getGuestSession().guestId)
const { showToast } = useToast()
const showEventInterestModal = ref(false)
const pendingInterestEvent = ref(null)
const isRemovingEventInterest = ref(false)

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
      const q2 = query(collection(db, 'guestConfirmations'), where('guestSessionId', '==', newGuestId))
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
  stopListening: stopEvents,
  toggleInterested,
  toggleGuestInterested
} = useDonationEvents()

function handleRespond(requestId) {
  if (modalsRef.value) {
    modalsRef.value.handleConfirm(requestId)
  }
}

function handleOpenMaps(requestId) {
  if (modalsRef.value) {
    modalsRef.value.openMapsForRequest(requestId)
  }
}

function handleConfirmedRequest(requestId) {
  const id = String(requestId)
  if (!confirmedRequestIds.value.includes(id)) {
    confirmedRequestIds.value = [...confirmedRequestIds.value, id]
  }
}

async function handleEventRegister(eventId) {
  const targetEvent = events.value.find((event) => String(event.id) === String(eventId))
  if (!targetEvent) return

  const session = guestSession.getGuestSession()
  const guestInterestId = `guest:${session.guestId}`
  const guestInterested = targetEvent.likedBy?.includes(guestInterestId)
  pendingInterestEvent.value = targetEvent
  isRemovingEventInterest.value = user.value
    ? targetEvent.likedBy?.includes(user.value.uid)
    : guestInterested
  showEventInterestModal.value = true
}

async function commitEventInterestToggle() {
  const targetEvent = pendingInterestEvent.value
  if (!targetEvent) return
  const eventId = String(targetEvent.id)
  const wasInterested = isRemovingEventInterest.value
  showEventInterestModal.value = false
  pendingInterestEvent.value = null

  if (user.value) {
    try {
      await toggleInterested(eventId, user.value.uid)
      showToast(
        wasInterested
          ? `Removed interest for "${targetEvent.title}".`
          : `Marked interested in "${targetEvent.title}".`,
        wasInterested ? 'info' : 'success'
      )
    } catch (err) {
      showToast('Failed to update event interest.', 'danger')
    }
    return
  }

  const session = guestSession.getGuestSession()
  try {
    await toggleGuestInterested(eventId, session.guestId)
    const currentList = [...(session.interestedEvents || [])]
    const index = currentList.map(String).indexOf(eventId)
    if (index === -1) {
      currentList.push(eventId)
      showToast(`Marked interested in "${targetEvent.title}".`, 'success')
    } else {
      currentList.splice(index, 1)
      showToast(`Removed interest for "${targetEvent.title}".`, 'info')
    }
    guestSession.updateGuestSession({ interestedEvents: currentList })
  } catch (err) {
    showToast('Failed to update event interest.', 'danger')
  }
}

function cancelEventInterestToggle() {
  showEventInterestModal.value = false
  pendingInterestEvent.value = null
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
