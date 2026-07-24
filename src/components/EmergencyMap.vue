<template>
  <div class="ll-emergency-map-container">
    <!-- Map Header Status Toolbar -->
    <div class="ll-map-toolbar d-flex flex-wrap justify-content-between align-items-center gap-3 p-3 bg-slate-900 text-white rounded-top-lg">
      <div class="d-flex align-items-center gap-2">
        <span class="ll-live-dot ll-live-dot--pulse"></span>
        <h5 class="m-0 font-weight-700 text-white" style="font-size: 1.05rem;">
          <i class="bi bi-geo-alt-fill text-danger me-1"></i> Live Emergency Response Map
        </h5>
        <span class="badge bg-danger rounded-pill ms-2" style="font-size: 0.7rem;">
          {{ activeResponses.length }} Active Responder{{ activeResponses.length !== 1 ? 's' : '' }}
        </span>
      </div>

      <div class="d-flex align-items-center gap-2">
        <select
          v-model="selectedRequestId"
          class="form-select form-select-sm bg-slate-800 text-white border-slate-700"
          style="min-width: 200px;"
          aria-label="Select emergency request focus"
        >
          <option value="">All Active Hospitals ({{ activeRequests.length }})</option>
          <option v-for="req in activeRequests" :key="req.id" :value="req.id">
            [{{ req.bloodType }}] {{ req.hospitalName }} ({{ req.urgency }})
          </option>
        </select>

        <button
          type="button"
          class="btn btn-sm btn-outline-light d-flex align-items-center gap-1"
          title="Recenter map"
          @click="centerMapOnSelected"
        >
          <i class="bi bi-crosshair"></i> Recenter
        </button>
      </div>
    </div>

    <!-- Main Grid: Left Map Surface, Right Live Activity Panel -->
    <div class="row g-0 ll-map-body-grid border border-top-0 rounded-bottom-lg overflow-hidden bg-white shadow-sm">
      <!-- Google Map View Surface -->
      <div class="col-lg-8 col-12 position-relative" style="min-height: 520px;">
        <!-- Loading overlay -->
        <div v-if="mapLoading" class="ll-map-loader-overlay d-flex flex-column justify-content-center align-items-center">
          <div class="spinner-border text-danger mb-2" role="status"></div>
          <span class="small text-slate-600 font-weight-500">Initializing Google Maps Engine...</span>
        </div>

        <div v-else-if="mapError" class="ll-map-error-overlay p-4 text-center">
          <i class="bi bi-exclamation-triangle-fill text-warning fs-2 mb-2 d-block"></i>
          <h6 class="fw-bold text-slate-800">{{ mapError }}</h6>
          <p class="small text-slate-500 mb-0">Please check your network or VITE_GOOGLE_MAPS_API_KEY environment variable.</p>
        </div>

        <!-- Google Map Container Div -->
        <div id="google-emergency-map" ref="mapElement" class="w-100 h-100 position-absolute top-0 start-0"></div>

        <!-- Floating Map Legend Overlay -->
        <div class="ll-map-legend p-2 px-3 bg-white border rounded shadow-sm position-absolute bottom-0 start-0 m-3 z-index-2">
          <div class="small fw-bold text-slate-800 mb-1" style="font-size: 0.72rem;">RADAR & MARKER LEGEND</div>
          <div class="d-flex flex-column gap-1" style="font-size: 0.7rem;">
            <div class="d-flex align-items-center gap-2">
              <span class="ll-legend-icon ll-legend-icon--hospital">🏥</span> Hospital Location & Priority Radar
            </div>
            <div class="d-flex align-items-center gap-2">
              <span class="ll-legend-icon ll-legend-icon--donor">🚗</span> En-Route Donor Marker (Live Location)
            </div>
            <div class="d-flex align-items-center gap-2">
              <span class="ll-legend-circle ll-legend-circle--3k"></span> Inner Radar (3km — Priority Zone)
            </div>
            <div class="d-flex align-items-center gap-2">
              <span class="ll-legend-circle ll-legend-circle--10k"></span> Outer Radar (10km — Extended Zone)
            </div>
          </div>
        </div>
      </div>

      <!-- Right Side Live Activity Stream Panel -->
      <div class="col-lg-4 col-12 border-start border-slate-200 p-3 bg-slate-50 d-flex flex-column" style="max-height: 580px; overflow-y: auto;">
        <h6 class="fw-bold text-wine mb-3 d-flex justify-content-between align-items-center" style="font-size: 0.9rem;">
          <span><i class="bi bi-radar me-1"></i> RESPONSE STATUS</span>
          <span class="badge bg-slate-200 text-slate-700" style="font-size: 0.68rem;">
            {{ filteredResponders.length }} En-Route
          </span>
        </h6>

        <!-- No responders state -->
        <div v-if="filteredResponders.length === 0" class="text-center py-5 px-3 bg-white rounded border border-slate-200 flex-grow-1 d-flex flex-column justify-content-center align-items-center">
          <div class="mb-2 text-slate-300 fs-1"><i class="bi bi-geo-alt"></i></div>
          <h6 class="fw-bold text-slate-700 mb-1" style="font-size: 0.88rem;">Searching for Responders</h6>
          <p class="small text-slate-500 mb-0" style="font-size: 0.78rem;">
            Radar active across 10 km radius. Responders will appear here live when they accept requests and share location.
          </p>
        </div>

        <!-- Responders list cards -->
        <div v-else class="d-flex flex-column gap-2 flex-grow-1">
          <div
            v-for="resp in filteredResponders"
            :key="resp.trackingKey"
            class="p-3 bg-white border border-slate-200 rounded shadow-xs position-relative hover-lift"
          >
            <div class="d-flex justify-content-between align-items-start mb-1">
              <div>
                <strong class="text-slate-900 font-weight-700" style="font-size: 0.85rem;">{{ resp.donorName }}</strong>
                <span class="badge bg-danger ms-1" style="font-size: 0.65rem;">{{ resp.bloodType }}</span>
              </div>
              <span
                :class="resp.status === 'approaching' ? 'badge bg-success' : 'badge bg-primary'"
                style="font-size: 0.65rem; text-transform: uppercase;"
              >
                {{ resp.status === 'approaching' ? '⚡ Approaching' : '🚗 En Route' }}
              </span>
            </div>

            <div class="small text-slate-600 mb-1" style="font-size: 0.78rem;">
              <i class="bi bi-hospital me-1 text-wine"></i> {{ resp.hospitalName }}
            </div>

            <div class="d-flex justify-content-between align-items-center mt-2 pt-2 border-top border-slate-100" style="font-size: 0.75rem;">
              <span class="text-slate-500">
                <i class="bi bi-geo-alt text-wine me-1"></i> Distance: <strong>{{ formatMeters(resp.distanceMeters) }}</strong>
              </span>
              <span class="text-wine font-weight-700">
                <i class="bi bi-clock-history me-1"></i> ETA: <strong>~{{ resp.etaMins || 1 }} min</strong>
              </span>
            </div>
          </div>
        </div>

        <!-- Live Activity Log Ticker -->
        <div class="mt-3 pt-3 border-top border-slate-200">
          <div class="small font-weight-700 text-slate-700 mb-2" style="font-size: 0.75rem;">
            <i class="bi bi-broadcast me-1 text-danger"></i> RECENT ACTIVITY LOG
          </div>
          <ul class="list-unstyled mb-0" style="font-size: 0.72rem;">
            <li v-for="(log, idx) in activityLogs" :key="idx" class="mb-1 text-slate-600 d-flex align-items-center gap-1">
              <span class="text-slate-400 font-monospace">[{{ log.time }}]</span>
              <span>{{ log.text }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * EmergencyMap.vue
 * Core real-time response map component built with Google Maps JavaScript API.
 * Renders live hospital markers with urgency radar circles, animated donor location markers,
 * and polyline path connections.
 */

import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { Loader } from '@googlemaps/js-api-loader'
import { useActiveResponses } from '@/composables/useActiveResponses.js'
import { getHospitalCoordinates } from '@/data/hospitalCoordinates.js'
import { formatDistance } from '@/utils/haversine.js'

const props = defineProps({
  emergencyRequests: {
    type: Array,
    default: () => []
  }
})

const { responses: activeResponses, startListening, stopListening } = useActiveResponses()

const mapElement = ref(null)
const mapLoading = ref(true)
const mapError = ref(null)
const selectedRequestId = ref('')
const activityLogs = ref([])

let googleMap = null
let googleInstance = null

// Dictionaries to manage map instances
const hospitalMarkers = new Map()
const hospitalCircles = new Map()
const donorMarkers = new Map()
const donorPolylines = new Map()
const infoWindows = new Map()

const activeRequests = computed(() => {
  return props.emergencyRequests.filter(r => r.status === 'active')
})

const filteredResponders = computed(() => {
  if (!selectedRequestId.value) return activeResponses.value
  return activeResponses.value.filter(r => r.requestId === selectedRequestId.value)
})

function formatMeters(meters) {
  return formatDistance(meters)
}

function logActivity(text) {
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  activityLogs.value.unshift({ time, text })
  if (activityLogs.value.length > 5) activityLogs.value.pop()
}

/**
 * Initializes Google Maps Engine.
 */
async function initGoogleMap() {
  mapLoading.value = true
  mapError.value = null

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    mapError.value = 'Google Maps API Key is missing. Please set VITE_GOOGLE_MAPS_API_KEY in .env file.'
    mapLoading.value = false
    return
  }

  try {
    setOptions({
      key: apiKey,
      v: 'weekly'
    })

    const { Map } = await importLibrary('maps')
    googleInstance = window.google

    // Default map center (Vietnam)
    const center = { lat: 10.7548, lng: 106.6601 } // HCMC default

    googleMap = new Map(mapElement.value, {
      center,
      zoom: 12,
      mapTypeId: 'roadmap',
      disableDefaultUI: false,
      zoomControl: true,
      streetViewControl: false,
      mapTypeControl: false,
      styles: [
        {
          featureType: 'poi.medical',
          elementType: 'geometry',
          stylers: [{ color: '#fde8e8' }]
        }
      ]
    })

    mapLoading.value = false
    logActivity('Google Maps Engine initialized.')
    renderHospitalMarkers()
    renderDonorMarkers()
  } catch (err) {
    console.error('[EmergencyMap] Google Maps load error:', err)
    mapError.value = 'Could not load Google Maps. Please verify your API Key and internet connection.'
    mapLoading.value = false
  }
}

/**
 * Renders Hospital Markers & Radar Proximity Circles.
 */
function renderHospitalMarkers() {
  if (!googleMap || !googleInstance) return

  // Clear existing hospital markers & circles
  hospitalMarkers.forEach(m => m.setMap(null))
  hospitalCircles.forEach(cArray => cArray.forEach(c => c.setMap(null)))
  hospitalMarkers.clear()
  hospitalCircles.clear()

  const bounds = new googleInstance.maps.LatLngBounds()
  let hasValidCoords = false

  activeRequests.value.forEach((req) => {
    const coords = (req.latitude && req.longitude)
      ? { lat: req.latitude, lng: req.longitude }
      : getHospitalCoordinates(req.hospitalName, req.city)

    const pos = { lat: coords.lat, lng: coords.lng }
    bounds.extend(pos)
    hasValidCoords = true

    // Color theme based on urgency
    const urgencyColor = req.urgency === 'critical' ? '#dc3545' : (req.urgency === 'urgent' ? '#fd7e14' : '#ffc107')

    // Hospital Marker Pin
    const marker = new googleInstance.maps.Marker({
      position: pos,
      map: googleMap,
      title: req.hospitalName,
      icon: {
        path: googleInstance.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: urgencyColor,
        fillOpacity: 1,
        strokeWeight: 3,
        strokeColor: '#ffffff'
      }
    })

    // Info Window
    const infoWindow = new googleInstance.maps.InfoWindow({
      content: `
        <div style="padding: 6px; font-family: system-ui, sans-serif; max-width: 220px;">
          <strong style="color: #8b0000; font-size: 0.9rem;">🏥 ${req.hospitalName}</strong>
          <div style="font-size: 0.75rem; color: #555; margin-top: 4px;">
            Blood Needed: <strong style="color: #dc3545;">${req.bloodType}</strong><br>
            Urgency: <span style="text-transform: uppercase; font-weight: bold; color: ${urgencyColor};">${req.urgency}</span><br>
            Confirmed: <strong>${req.confirmedCount || 0} / ${req.unitsNeeded}</strong> units
          </div>
        </div>
      `
    })

    marker.addListener('click', () => {
      infoWindows.forEach(iw => iw.close())
      infoWindow.open(googleMap, marker)
      selectedRequestId.value = req.id
    })

    hospitalMarkers.set(req.id, marker)
    infoWindows.set(req.id, infoWindow)

    // Radar Circles (3km inner priority, 10km outer search)
    const innerCircle = new googleInstance.maps.Circle({
      strokeColor: urgencyColor,
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: urgencyColor,
      fillOpacity: 0.15,
      map: googleMap,
      center: pos,
      radius: 3000 // 3km
    })

    const outerCircle = new googleInstance.maps.Circle({
      strokeColor: urgencyColor,
      strokeOpacity: 0.4,
      strokeWeight: 1,
      fillColor: urgencyColor,
      fillOpacity: 0.05,
      map: googleMap,
      center: pos,
      radius: 10000 // 10km
    })

    hospitalCircles.set(req.id, [innerCircle, outerCircle])
  })

  if (hasValidCoords && activeRequests.value.length > 0) {
    googleMap.fitBounds(bounds)
    if (activeRequests.value.length === 1) {
      googleMap.setZoom(13)
    }
  }
}

/**
 * Renders En-Route Donor Markers & Polyline Routes.
 */
function renderDonorMarkers() {
  if (!googleMap || !googleInstance) return

  const currentKeys = new Set(filteredResponders.value.map(r => r.trackingKey))

  // Remove markers that are no longer active
  donorMarkers.forEach((marker, key) => {
    if (!currentKeys.has(key)) {
      marker.setMap(null)
      donorMarkers.delete(key)
      logActivity(`Responder marker removed (${key.substring(0, 6)})`)
    }
  })

  donorPolylines.forEach((line, key) => {
    if (!currentKeys.has(key)) {
      line.setMap(null)
      donorPolylines.delete(key)
    }
  })

  // Render / Update active donor markers
  filteredResponders.value.forEach((resp) => {
    const donorPos = { lat: resp.latitude, lng: resp.longitude }
    const key = resp.trackingKey

    if (donorMarkers.has(key)) {
      // Update existing marker position smoothly
      const existingMarker = donorMarkers.get(key)
      existingMarker.setPosition(donorPos)

      // Update polyline path
      if (donorPolylines.has(key) && resp.hospitalLat && resp.hospitalLng) {
        const line = donorPolylines.get(key)
        line.setPath([donorPos, { lat: resp.hospitalLat, lng: resp.hospitalLng }])
      }
    } else {
      // Create new donor marker
      logActivity(`🚗 Donor ${resp.donorName} (${resp.bloodType}) joined route`)

      const marker = new googleInstance.maps.Marker({
        position: donorPos,
        map: googleMap,
        title: `${resp.donorName} (${resp.bloodType})`,
        icon: {
          path: googleInstance.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 6,
          fillColor: '#0d6efd',
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: '#ffffff'
        }
      })

      const infoWindow = new googleInstance.maps.InfoWindow({
        content: `
          <div style="padding: 4px; font-size: 0.78rem;">
            <strong>🚗 ${resp.donorName}</strong> (${resp.bloodType})<br>
            Status: <span style="color: #0d6efd; font-weight: bold;">${resp.status}</span><br>
            Distance: <strong>${formatDistance(resp.distanceMeters)}</strong><br>
            ETA: <strong>~${resp.etaMins || 1} min</strong>
          </div>
        `
      })

      marker.addListener('click', () => {
        infoWindow.open(googleMap, marker)
      })

      donorMarkers.set(key, marker)

      // Polyline path to hospital
      if (resp.hospitalLat && resp.hospitalLng) {
        const polyline = new googleInstance.maps.Polyline({
          path: [donorPos, { lat: resp.hospitalLat, lng: resp.hospitalLng }],
          geodesic: true,
          strokeColor: '#0d6efd',
          strokeOpacity: 0.7,
          strokeWeight: 3,
          map: googleMap
        })
        donorPolylines.set(key, polyline)
      }
    }
  })
}

function centerMapOnSelected() {
  if (!googleMap) return
  if (selectedRequestId.value) {
    const req = activeRequests.value.find(r => r.id === selectedRequestId.value)
    if (req) {
      const coords = (req.latitude && req.longitude)
        ? { lat: req.latitude, lng: req.longitude }
        : getHospitalCoordinates(req.hospitalName, req.city)
      googleMap.setCenter(coords)
      googleMap.setZoom(14)
    }
  } else {
    renderHospitalMarkers()
  }
}

watch(activeRequests, () => {
  renderHospitalMarkers()
}, { deep: true })

watch(filteredResponders, () => {
  renderDonorMarkers()
}, { deep: true })

watch(selectedRequestId, () => {
  centerMapOnSelected()
})

onMounted(() => {
  startListening()
  initGoogleMap()
})

onUnmounted(() => {
  stopListening()
  hospitalMarkers.forEach(m => m.setMap(null))
  hospitalCircles.forEach(cArr => cArr.forEach(c => c.setMap(null)))
  donorMarkers.forEach(m => m.setMap(null))
  donorPolylines.forEach(l => l.setMap(null))
})
</script>

<style scoped>
.ll-emergency-map-container {
  font-family: var(--ll-font-family, system-ui, sans-serif);
}

.ll-live-dot--pulse {
  width: 10px;
  height: 10px;
  background-color: #dc3545;
  border-radius: 50%;
  box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.7);
  animation: pulse-red 1.6s infinite;
}

@keyframes pulse-red {
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.7);
  }
  70% {
    transform: scale(1.1);
    box-shadow: 0 0 0 8px rgba(220, 53, 69, 0);
  }
  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(220, 53, 69, 0);
  }
}

.ll-map-loader-overlay,
.ll-map-error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.92);
  z-index: 10;
}

.ll-legend-circle--3k {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgba(220, 53, 69, 0.2);
  border: 1.5px solid #dc3545;
}

.ll-legend-circle--10k {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgba(220, 53, 69, 0.08);
  border: 1px dashed #dc3545;
}

.hover-lift {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
</style>
