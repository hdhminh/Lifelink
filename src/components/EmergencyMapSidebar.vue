<template>
  <!-- Right Side Live Activity Stream Panel -->
  <div
    class="col-lg-4 col-12 border-start border-slate-200 p-3 bg-slate-50 d-flex flex-column map-style-27 ll-map-sidebar"
    :class="{ 'll-sidebar-mobile-open': isMobileOpen }"
  >
    <div class="ll-map-sidebar-header d-flex justify-content-between align-items-center gap-2 mb-3">
      <h2 class="ll-map-sidebar-title fw-bold m-0 d-flex align-items-center map-style-28">
        <i class="bi bi-radar me-1 text-wine"></i><span>RESPONSE STATUS</span>
      </h2>
      <div class="ll-map-sidebar-stats d-flex gap-1 align-items-center flex-shrink-0">
        <span
          v-if="confirmedForSelectedRequest > 0"
          class="badge text-white ll-confirmed-badge"
          title="Confirmed donors"
        >
          {{ confirmedForSelectedRequest }} Confirmed
        </span>
        <span class="badge bg-slate-200 text-slate-700 map-style-29">
          {{ filteredResponders.length }} En Route
        </span>
      </div>
      <button 
        type="button" 
        class="btn-close d-md-none ms-2" 
        aria-label="Close" 
        @click="$emit('close-mobile')"
      ></button>
    </div>

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
        class="ll-response-card p-2 bg-white border border-slate-200 rounded shadow-xs position-relative hover-lift cursor-pointer"
        @click="$emit('focus-responder', resp)"
      >
        <div class="d-flex justify-content-between align-items-center mb-1 gap-2">
          <div>
            <strong class="text-slate-900 font-weight-700 map-style-36">
              {{ resp.donorName }}
            </strong>
            <span class="badge ms-1 text-white bg-wine">
              {{ resp.bloodType }}
            </span>
          </div>

          <div class="d-flex align-items-center gap-1 flex-shrink-0">
            <span
              :class="resp.status === 'approaching' ? 'badge bg-success' : 'badge bg-wine'"
              :title="resp.lastSeenAgo != null ? 'GPS updated ' + resp.lastSeenAgo + 's ago' : 'Live response'"
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
  selectedRequestId: { type: String, default: '' },
  isMobileOpen: { type: Boolean, default: false }
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

.ll-map-sidebar-header {
  min-height: 28px;
}

.map-style-28 {
  color: #8E2435;
  font-size: 0.9rem;
  line-height: 1.15;
  white-space: nowrap;
}

:global(.ll-map-sidebar-title) {
  color: #8E2435 !important;
  font-size: 0.9rem !important;
  line-height: 1.15 !important;
  white-space: nowrap !important;
}

.ll-confirmed-badge {
  background-color: #198754 !important;
  font-size: 0.68rem;
  line-height: 1.1;
  white-space: nowrap;
}

.ll-map-sidebar-stats .badge.bg-slate-200 {
  background-color: #e9e1dd !important;
  color: #5d4c51 !important;
  line-height: 1.1;
  white-space: nowrap;
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

@media (max-width: 767px) {
  .ll-map-sidebar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 1050;
    height: 60vh;
    border-radius: 16px 16px 0 0;
    transform: translateY(100%);
    transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1), box-shadow 0.3s;
    opacity: 0;
    pointer-events: none;
    box-shadow: none;
    background: #f4eeea !important;
    border: 1px solid #d9c8c3 !important;
  }
  .ll-map-sidebar.ll-sidebar-mobile-open {
    transform: translateY(0);
    opacity: 1;
    pointer-events: auto;
    box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.15);
  }

  .ll-map-sidebar-header {
    padding: 0.15rem 0.1rem 0.35rem;
  }

  .map-style-28 {
    font-size: 0.8rem;
  }

  :global(.ll-map-sidebar-title) {
    font-size: 0.8rem !important;
  }

  .ll-map-sidebar .p-3.bg-white {
    background-color: #ffffff !important;
    border-color: #d9c8c3 !important;
  }
}
</style>
