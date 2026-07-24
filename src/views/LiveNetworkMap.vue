<template>
  <div class="ll-page-container" style="min-height: 85vh;">
    <div class="ll-section-header reveal-header mb-3">
      <div>
        <h1 class="ll-section-title">
          <i class="bi bi-geo-alt-fill me-2" style="color: #8E2435;"></i> Live Network Map
        </h1>
        <p class="ll-text-meta mb-0">
          Interactive map displaying active hospital emergency requests, live responder tracking, and upcoming donation drives across Vietnam.
        </p>
      </div>
    </div>

    <AlertMessage v-if="requestsError || eventsError" type="danger" :message="requestsError || eventsError" />

    <div class="reveal-item">
      <EmergencyMap
        ref="mapRef"
        :emergency-requests="requests"
        :events="events"
        :is-visible="true"
        title-text="Nationwide Response & Events Map"
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
import { useEmergencyRequests } from '@/composables/useEmergencyRequests.js'
import { useDonationEvents } from '@/composables/useDonationEvents.js'
import EmergencyMap from '@/components/EmergencyMap.vue'
import AlertMessage from '@/components/AlertMessage.vue'

const route = useRoute()
const router = useRouter()
const mapRef = ref(null)

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
  router.push({ path: '/emergency-board', query: { respond: requestId } })
}

watch([requests, () => route.query.request], () => {
  if (route.query.request && mapRef.value) {
    nextTick(() => {
      mapRef.value.focusRequest(route.query.request)
    })
  }
})

onMounted(() => {
  startRequests()
  startEvents()
  if (route.query.request) {
    nextTick(() => {
      if (mapRef.value) {
        mapRef.value.focusRequest(route.query.request)
      }
    })
  }
})

onUnmounted(() => {
  stopRequests()
  stopEvents()
})
</script>
