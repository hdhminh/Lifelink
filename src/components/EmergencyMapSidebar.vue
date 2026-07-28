<template>
  <!-- Right Side Live Activity Stream Panel -->
  <div
    class="col-lg-4 col-12 border-start border-slate-200 p-3 bg-slate-50 d-flex flex-column map-style-27"
  >
    <h2 class="fw-bold mb-3 d-flex justify-content-between align-items-center map-style-28">
      <span><i class="bi bi-radar me-1 text-wine"></i> RESPONSE STATUS</span>
      <div class="d-flex gap-1 align-items-center">
        <span
          v-if="confirmedForSelectedRequest > 0"
          class="badge text-white"
          style="background-color: #198754; font-size: 0.72rem;"
          title="Confirmed donors"
        >
          {{ confirmedForSelectedRequest }} Confirmed
        </span>
        <span class="badge bg-slate-200 text-slate-700 map-style-29">
          {{ filteredResponders.length }} En Route
        </span>
      </div>
    </h2>

    <!-- Radar Scan Telemetry Card in Sidebar (Admin Only) -->
    <div
      v-if="isAdmin && selectedHospitalForRadar"
      class="p-3 bg-white border border-slate-200 rounded shadow-xs mb-3"
    >
      <div class="d-flex justify-content-between align-items-center mb-1">
        <h3 class="fw-bold mb-0 text-slate-800 map-style-30">
          <i class="bi bi-broadcast me-1 text-wine"></i> Radar Donor Scan
        </h3>
        <span class="badge text-white bg-wine">{{
          selectedHospitalForRadar.bloodType
        }}</span>
      </div>
      <div class="small text-slate-500 mb-2 map-style-32">
        {{ selectedHospitalForRadar.hospitalName }}
      </div>
      <div
        class="d-flex justify-content-between align-items-center py-1 border-bottom border-slate-100 map-style-33"
      >
        <span class="text-slate-600">Inner Radius (3 km):</span>
        <strong class="text-success">{{ radarCounts.inner }} compatible donors</strong>
      </div>
      <div class="d-flex justify-content-between align-items-center py-1 map-style-33">
        <span class="text-slate-600">Outer Radius (10 km):</span>
        <strong class="text-slate-800">{{ radarCounts.outer }} compatible donors</strong>
      </div>
    </div>

    <!-- No responders state -->
    <div
      v-if="filteredResponders.length === 0"
      class="text-center py-4 px-3 bg-white rounded border border-slate-200 flex-grow-1 d-flex flex-column justify-content-center align-items-center"
    >
      <div class="mb-2 text-wine fs-1"><i class="bi bi-geo-alt"></i></div>
      <h3 class="fw-bold text-slate-700 mb-1 map-style-34">
        Searching for Active Responders
      </h3>
      <p class="small text-slate-500 mb-0 map-style-35">
        Radar active across 10 km radius. Responders will appear here live when they accept emergency requests and share location.
      </p>
    </div>

    <!-- Responders list cards -->
    <div v-else class="d-flex flex-column gap-2 flex-grow-1 overflow-auto">
      <div
        v-for="resp in filteredResponders"
        :key="resp.trackingKey"
        class="p-3 bg-white border border-slate-200 rounded shadow-xs position-relative hover-lift cursor-pointer"
        @click="$emit('focus-responder', resp)"
      >
        <div class="d-flex justify-content-between align-items-center mb-1">
          <div>
            <strong class="text-slate-900 font-weight-700 map-style-36">
              {{ resp.donorName }}
            </strong>
            <span class="badge ms-1 text-white bg-wine">
              {{ resp.bloodType }}
            </span>
          </div>

          <div class="d-flex align-items-center gap-1">
            <!-- Signal Quality / Live Status Badge -->
            <span
              v-if="resp.lastSeenAgo < 15 && resp.signalQuality === 'good'"
              class="badge bg-success-subtle text-success border border-success-subtle d-inline-flex align-items-center gap-1"
            >
              <span class="pulse-dot"></span> LIVE
            </span>
            <span
              v-else
              class="badge bg-warning-subtle text-dark border border-warning-subtle d-inline-flex align-items-center gap-1"
              :title="'Updated ' + (resp.lastSeenAgo || 0) + 's ago'"
            >
              <i class="bi bi-wifi-off"></i> WEAK GPS ({{ resp.lastSeenAgo || 0 }}s)
            </span>

            <span
              :class="resp.status === 'approaching' ? 'badge bg-success' : 'badge bg-wine'"
            >
              {{ resp.status === 'approaching' ? 'Approaching' : 'En Route' }}
            </span>
          </div>
        </div>

        <div class="small text-slate-600 mb-1 map-style-35">
          <i class="bi bi-hospital me-1 text-wine"></i> {{ resp.hospitalName }}
        </div>

        <div
          class="d-flex justify-content-between align-items-center mt-2 pt-2 border-top border-slate-100 map-style-33"
        >
          <span class="text-slate-500">
            <i class="bi bi-geo-alt me-1 text-wine"></i>
            <span v-if="resp.latitude != null">Distance: <strong>{{ formatMeters(resp.distanceMeters) }}</strong></span>
            <span v-else class="text-warning"><i class="bi bi-clock me-1"></i>Awaiting GPS...</span>
          </span>
          <span class="font-weight-700">
            <i class="bi bi-clock-history me-1 text-wine"></i> ETA:
            <strong>{{ resp.latitude != null ? `~${resp.etaMins || 1} min` : 'TBD' }}</strong>
          </span>
        </div>
      </div>
    </div>

    <!-- Live Activity Log Ticker -->
    <div class="mt-3 pt-3 border-top border-slate-200">
      <div class="small font-weight-700 text-slate-700 mb-2 map-style-33">
        <i class="bi bi-broadcast me-1 text-wine"></i> RECENT ACTIVITY LOG
      </div>
      <ul class="list-unstyled mb-0 map-style-23">
        <li
          v-for="(log, idx) in activityLogs"
          :key="idx"
          class="mb-1 text-slate-600 d-flex align-items-center gap-1 cursor-pointer hover-text-wine"
          @click="$emit('center-map-on-selected')"
        >
          <span class="text-slate-400 font-monospace">[{{ log.time }}]</span>
          <span>{{ log.text }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatDistance } from '@/utils/haversine.js'

const props = defineProps({
  filteredResponders: { type: Array, default: () => [] },
  isAdmin: { type: Boolean, default: false },
  selectedHospitalForRadar: { type: Object, default: null },
  radarCounts: { type: Object, default: () => ({ inner: 0, outer: 0 }) },
  activityLogs: { type: Array, default: () => [] },
  confirmedRequestIds: { type: Array, default: () => [] },
  selectedRequestId: { type: String, default: '' }
})

const confirmedForSelectedRequest = computed(() => {
  if (!props.selectedRequestId || props.selectedRequestId.startsWith('ev_')) {
    return props.confirmedRequestIds.length
  }
  return props.confirmedRequestIds.includes(String(props.selectedRequestId)) ? 1 : 0
})

const emit = defineEmits(['focus-responder', 'center-map-on-selected'])

function formatMeters(meters) {
  return formatDistance(meters)
}
</script>

<style scoped>
.text-wine {
  color: #8E2435 !important;
}

.bg-wine {
  background-color: #8E2435 !important;
}

.pulse-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #198754;
  box-shadow: 0 0 0 rgba(25, 135, 84, 0.4);
  animation: pulse-animation 1.5s infinite;
}

@keyframes pulse-animation {
  0% {
    box-shadow: 0 0 0 0 rgba(25, 135, 84, 0.6);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(25, 135, 84, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(25, 135, 84, 0);
  }
}
</style>
