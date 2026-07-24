<template>
  <div class="ll-emergency-map-container">
    <!-- Map Header Status Toolbar (LifeLink Brand Wine Red Surface) -->
    <div class="ll-map-toolbar d-flex flex-wrap justify-content-between align-items-center gap-3 p-3 rounded-top-lg border border-bottom-0" style="background-color: #ffffff; border-color: #EAE2DF;">
      <div class="d-flex align-items-center gap-2">
        <span class="ll-live-dot ll-live-dot--pulse" style="background-color: #8E2435;"></span>
        <h5 class="m-0 font-weight-700" style="font-size: 1.05rem; color: #8E2435 !important;">
          <i class="bi bi-geo-alt-fill me-1" style="color: #8E2435;"></i> Live Emergency Response Map
        </h5>
        <span class="badge rounded-pill ms-2" style="font-size: 0.72rem; background-color: #8E2435; color: #ffffff;">
          {{ activeResponses.length }} Active Responder{{ activeResponses.length !== 1 ? 's' : '' }}
        </span>
        <span v-if="isUsingLeaflet" class="badge bg-secondary rounded-pill ms-1" style="font-size: 0.65rem;">
          OpenStreetMap Engine
        </span>
      </div>

      <div class="d-flex align-items-center gap-2">
        <select
          v-model="selectedRequestId"
          class="form-select form-select-sm"
          style="min-width: 200px; background-color: #FAF5EF; color: #2B2225; border-color: #EAE2DF;"
          aria-label="Select emergency request focus"
        >
          <option value="" style="background-color: #ffffff; color: #2B2225;">All Active Hospitals ({{ activeRequests.length }})</option>
          <option v-for="req in activeRequests" :key="req.id" :value="req.id" style="background-color: #ffffff; color: #2B2225;">
            [{{ req.bloodType }}] {{ req.hospitalName }} ({{ req.urgency }})
          </option>
        </select>

        <button
          type="button"
          class="btn btn-sm d-flex align-items-center gap-1 font-weight-600"
          style="background-color: #FAF5EF; color: #8E2435; border: 1px solid #EAE2DF;"
          title="Recenter map"
          @click="centerMapOnSelected"
        >
          <i class="bi bi-crosshair me-1"></i> Recenter
        </button>
      </div>
    </div>

    <!-- Main Grid: Left Map Surface, Right Live Activity Panel -->
    <div class="row g-0 ll-map-body-grid border border-top-0 rounded-bottom-lg overflow-hidden bg-white shadow-sm">
      <!-- Map View Surface -->
      <div class="col-lg-8 col-12 position-relative" style="min-height: 520px;">
        <!-- Loading overlay -->
        <div v-if="mapLoading" class="ll-map-loader-overlay d-flex flex-column justify-content-center align-items-center">
          <div class="spinner-border mb-2" style="color: #8E2435;" role="status"></div>
          <span class="small text-slate-600 font-weight-500">Initializing Live Response Map...</span>
        </div>

        <div v-else-if="mapError" class="ll-map-error-overlay p-4 text-center">
          <i class="bi bi-exclamation-triangle-fill fs-2 mb-2 d-block" style="color: #8E2435;"></i>
          <h6 class="fw-bold text-slate-800">{{ mapError }}</h6>
          <button type="button" class="btn btn-sm mt-2 text-white font-weight-600" style="background-color: #8E2435;" @click="initLeafletMap">
            Switch to OpenStreetMap
          </button>
        </div>

        <!-- Map Container Div -->
        <div id="emergency-map-surface" ref="mapElement" class="w-100 h-100 position-absolute top-0 start-0 z-index-1"></div>

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
        <h6 class="fw-bold mb-3 d-flex justify-content-between align-items-center" style="font-size: 0.9rem; color: #8E2435;">
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
                <span class="badge ms-1 text-white" style="font-size: 0.65rem; background-color: #8E2435;">{{ resp.bloodType }}</span>
              </div>
              <span
                :class="resp.status === 'approaching' ? 'badge bg-success' : 'badge bg-primary'"
                style="font-size: 0.65rem; text-transform: uppercase;"
              >
                {{ resp.status === 'approaching' ? '⚡ Approaching' : '🚗 En Route' }}
              </span>
            </div>

            <div class="small text-slate-600 mb-1" style="font-size: 0.78rem;">
              <i class="bi bi-hospital me-1" style="color: #8E2435;"></i> {{ resp.hospitalName }}
            </div>

            <div class="d-flex justify-content-between align-items-center mt-2 pt-2 border-top border-slate-100" style="font-size: 0.75rem;">
              <span class="text-slate-500">
                <i class="bi bi-geo-alt me-1" style="color: #8E2435;"></i> Distance: <strong>{{ formatMeters(resp.distanceMeters) }}</strong>
              </span>
              <span class="font-weight-700" style="color: #8E2435;">
                <i class="bi bi-clock-history me-1"></i> ETA: <strong>~{{ resp.etaMins || 1 }} min</strong>
              </span>
            </div>
          </div>
        </div>

        <!-- Live Activity Log Ticker -->
        <div class="mt-3 pt-3 border-top border-slate-200">
          <div class="small font-weight-700 text-slate-700 mb-2" style="font-size: 0.75rem;">
            <i class="bi bi-broadcast me-1" style="color: #8E2435;"></i> RECENT ACTIVITY LOG
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
 * Core real-time response map component built with Google Maps & Leaflet OpenStreetMap fallback.
 * Uses LifeLink brand Wine Red palette (#8E2435).
 */

import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useActiveResponses } from '@/composables/useActiveResponses.js'
import { getHospitalCoordinates } from '@/data/hospitalCoordinates.js'
import { formatDistance } from '@/utils/haversine.js'

const props = defineProps({
  emergencyRequests: {
    type: Array,
    default: () => []
  },
  isVisible: {
    type: Boolean,
    default: true
  }
})


const { responses: activeResponses, startListening, stopListening } = useActiveResponses()

const mapElement = ref(null)
const mapLoading = ref(true)
const mapError = ref(null)
const selectedRequestId = ref('')
const activityLogs = ref([])
const isUsingLeaflet = ref(false)

let googleMap = null
let googleInstance = null
let leafletMap = null

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

function loadGoogleMapsScript(apiKey) {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.google && window.google.maps) {
      resolve(window.google)
      return
    }
    const existing = document.getElementById('google-maps-script-tag')
    if (existing) {
      if (window.google && window.google.maps) {
        resolve(window.google)
      } else {
        existing.addEventListener('load', () => resolve(window.google))
        existing.addEventListener('error', (e) => reject(e))
      }
      return
    }
    const script = document.createElement('script')
    script.id = 'google-maps-script-tag'
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
    script.async = true
    script.defer = true
    script.onload = () => resolve(window.google)
    script.onerror = (err) => reject(err)
    document.head.appendChild(script)
  })
}

/**
 * Initializes Google Maps Engine with automatic Leaflet fallback.
 */
async function initGoogleMap() {
  mapLoading.value = true
  mapError.value = null
  isUsingLeaflet.value = false

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

  if (typeof window !== 'undefined') {
    window.gm_authFailure = () => {
      console.warn('[EmergencyMap] Google Maps gm_authFailure triggered. Switching to Leaflet engine...')
      initLeafletMap()
    }
  }

  if (!apiKey) {
    initLeafletMap()
    return
  }

  try {
    googleInstance = await loadGoogleMapsScript(apiKey)

    const center = { lat: 10.7548, lng: 106.6601 }

    googleMap = new googleInstance.maps.Map(mapElement.value, {
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
    console.warn('[EmergencyMap] Google Maps load warning, falling back to Leaflet:', err)
    initLeafletMap()
  }
}

/**
 * Fallback Leaflet OpenStreetMap Engine.
 */
function initLeafletMap() {
  isUsingLeaflet.value = true
  mapError.value = null
  mapLoading.value = false

  if (leafletMap) {
    leafletMap.remove()
    leafletMap = null
  }

  if (!mapElement.value) return

  leafletMap = L.map(mapElement.value).setView([10.7548, 106.6601], 12)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(leafletMap)

  logActivity('OpenStreetMap Engine active.')
  renderLeafletHospitalMarkers()
  renderLeafletDonorMarkers()
}

/**
 * Renders Hospital Markers & Radar Circles in Leaflet.
 */
function renderLeafletHospitalMarkers() {
  if (!leafletMap) return

  hospitalMarkers.forEach(m => leafletMap.removeLayer(m))
  hospitalCircles.forEach(cArray => cArray.forEach(c => leafletMap.removeLayer(c)))
  hospitalMarkers.clear()
  hospitalCircles.clear()

  const bounds = L.latLngBounds([])
  let count = 0

  activeRequests.value.forEach((req) => {
    const coords = (req.latitude && req.longitude)
      ? { lat: req.latitude, lng: req.longitude }
      : getHospitalCoordinates(req.hospitalName, req.city)

    const pos = [coords.lat, coords.lng]
    bounds.extend(pos)
    count++

    const urgencyColor = req.urgency === 'critical' ? '#8E2435' : (req.urgency === 'urgent' ? '#B45309' : '#D99B26')

    const icon = L.divIcon({
      className: 'll-hospital-leaflet-icon',
      html: `
        <div style="position: relative; width: 32px; height: 38px; filter: drop-shadow(0 3px 6px rgba(0,0,0,0.3)); cursor: pointer;">
          <svg width="32" height="38" viewBox="0 0 32 38" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 0C7.16 0 0 7.16 0 16C0 26 14 36.6 15.3 37.7C15.7 38.1 16.3 38.1 16.7 37.7C18 36.6 32 26 32 16C32 7.16 24.84 0 16 0Z" fill="${urgencyColor}"/>
            <circle cx="16" cy="15" r="10" fill="#ffffff"/>
            <rect x="14" y="9" width="4" height="12" rx="1" fill="${urgencyColor}"/>
            <rect x="10" y="13" width="12" height="4" rx="1" fill="${urgencyColor}"/>
          </svg>
        </div>
      `,
      iconSize: [32, 38],
      iconAnchor: [16, 38]
    })


    const marker = L.marker(pos, { icon }).addTo(leafletMap)
    marker.bindPopup(`
      <div style="font-family: system-ui, sans-serif; padding: 4px;">
        <strong style="color: #8E2435; font-size: 0.9rem;">🏥 ${req.hospitalName}</strong><br>
        <span style="font-size: 0.78rem;">Blood: <strong style="color: #8E2435;">${req.bloodType}</strong> (${req.urgency})</span><br>
        <span style="font-size: 0.75rem;">Confirmed: <strong>${req.confirmedCount || 0}/${req.unitsNeeded}</strong></span>
      </div>
    `)

    const innerCircle = L.circle(pos, {
      color: urgencyColor,
      fillColor: urgencyColor,
      fillOpacity: 0.15,
      radius: 3000
    }).addTo(leafletMap)

    const outerCircle = L.circle(pos, {
      color: urgencyColor,
      fillColor: urgencyColor,
      fillOpacity: 0.05,
      dashArray: '4, 8',
      radius: 10000
    }).addTo(leafletMap)

    hospitalMarkers.set(req.id, marker)
    hospitalCircles.set(req.id, [innerCircle, outerCircle])
  })

  if (count > 0) {
    leafletMap.fitBounds(bounds, { padding: [30, 30] })
  }
}

/**
 * Renders Donor Markers in Leaflet.
 */
function renderLeafletDonorMarkers() {
  if (!leafletMap) return

  const currentKeys = new Set(filteredResponders.value.map(r => r.trackingKey))

  donorMarkers.forEach((m, key) => {
    if (!currentKeys.has(key)) {
      leafletMap.removeLayer(m)
      donorMarkers.delete(key)
    }
  })
  donorPolylines.forEach((p, key) => {
    if (!currentKeys.has(key)) {
      leafletMap.removeLayer(p)
      donorPolylines.delete(key)
    }
  })

  filteredResponders.value.forEach((resp) => {
    const pos = [resp.latitude, resp.longitude]
    const key = resp.trackingKey

    if (donorMarkers.has(key)) {
      const m = donorMarkers.get(key)
      m.setLatLng(pos)
      if (donorPolylines.has(key) && resp.hospitalLat && resp.hospitalLng) {
        const poly = donorPolylines.get(key)
        poly.setLatLngs([pos, [resp.hospitalLat, resp.hospitalLng]])
      }
    } else {
      const icon = L.divIcon({
        className: 'll-donor-leaflet-icon',
        html: `
          <div style="position: relative; width: 30px; height: 36px; filter: drop-shadow(0 3px 6px rgba(13,110,253,0.35)); cursor: pointer;">
            <svg width="30" height="36" viewBox="0 0 32 38" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 0C7.16 0 0 7.16 0 16C0 26 14 36.6 15.3 37.7C15.7 38.1 16.3 38.1 16.7 37.7C18 36.6 32 26 32 16C32 7.16 24.84 0 16 0Z" fill="#0D6EFD"/>
              <circle cx="16" cy="15" r="9" fill="#ffffff"/>
              <path d="M11 17.5C10.5 17.5 10.1 17.1 10.1 16.6V15.3C10.1 14.8 10.4 14.3 10.8 14.1L13 13C13.5 12.7 14.2 12.5 14.8 12.5H17.2C17.8 12.5 18.5 12.7 19 13L21.2 14.1C21.6 14.3 21.9 14.8 21.9 15.3V16.6C21.9 17.1 21.5 17.5 21 17.5H11Z" fill="#0D6EFD"/>
            </svg>
          </div>
        `,
        iconSize: [30, 36],
        iconAnchor: [15, 36]
      })


      const m = L.marker(pos, { icon }).addTo(leafletMap)
      m.bindPopup(`
        <div style="font-size: 0.78rem;">
          <strong>🚗 ${resp.donorName}</strong> (${resp.bloodType})<br>
          Status: <strong>${resp.status}</strong><br>
          ETA: <strong>~${resp.etaMins || 1} min</strong>
        </div>
      `)
      donorMarkers.set(key, m)

      if (resp.hospitalLat && resp.hospitalLng) {
        const poly = L.polyline([pos, [resp.hospitalLat, resp.hospitalLng]], {
          color: '#0d6efd',
          dashArray: '5, 10',
          weight: 3
        }).addTo(leafletMap)
        donorPolylines.set(key, poly)
      }
    }
  })
}

/**
 * Renders Hospital Markers & Radar Circles in Google Maps.
 */
function renderHospitalMarkers() {
  if (isUsingLeaflet.value) {
    renderLeafletHospitalMarkers()
    return
  }
  if (!googleMap || !googleInstance) return

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

    const urgencyColor = req.urgency === 'critical' ? '#8E2435' : (req.urgency === 'urgent' ? '#B45309' : '#D99B26')

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

    const infoWindow = new googleInstance.maps.InfoWindow({
      content: `
        <div style="padding: 6px; font-family: system-ui, sans-serif; max-width: 220px;">
          <strong style="color: #8E2435; font-size: 0.9rem;">🏥 ${req.hospitalName}</strong>
          <div style="font-size: 0.75rem; color: #555; margin-top: 4px;">
            Blood Needed: <strong style="color: #8E2435;">${req.bloodType}</strong><br>
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

    const innerCircle = new googleInstance.maps.Circle({
      strokeColor: urgencyColor,
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: urgencyColor,
      fillOpacity: 0.15,
      map: googleMap,
      center: pos,
      radius: 3000
    })

    const outerCircle = new googleInstance.maps.Circle({
      strokeColor: urgencyColor,
      strokeOpacity: 0.4,
      strokeWeight: 1,
      fillColor: urgencyColor,
      fillOpacity: 0.05,
      map: googleMap,
      center: pos,
      radius: 10000
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
 * Renders Donor Markers in Google Maps.
 */
function renderDonorMarkers() {
  if (isUsingLeaflet.value) {
    renderLeafletDonorMarkers()
    return
  }
  if (!googleMap || !googleInstance) return

  const currentKeys = new Set(filteredResponders.value.map(r => r.trackingKey))

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

  filteredResponders.value.forEach((resp) => {
    const donorPos = { lat: resp.latitude, lng: resp.longitude }
    const key = resp.trackingKey

    if (donorMarkers.has(key)) {
      const existingMarker = donorMarkers.get(key)
      existingMarker.setPosition(donorPos)

      if (donorPolylines.has(key) && resp.hospitalLat && resp.hospitalLng) {
        const line = donorPolylines.get(key)
        line.setPath([donorPos, { lat: resp.hospitalLat, lng: resp.hospitalLng }])
      }
    } else {
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
  if (selectedRequestId.value) {
    const req = activeRequests.value.find(r => r.id === selectedRequestId.value)
    if (req) {
      const coords = (req.latitude && req.longitude)
        ? { lat: req.latitude, lng: req.longitude }
        : getHospitalCoordinates(req.hospitalName, req.city)

      if (isUsingLeaflet.value && leafletMap) {
        leafletMap.setView([coords.lat, coords.lng], 14)
      } else if (googleMap) {
        googleMap.setCenter(coords)
        googleMap.setZoom(14)
      }
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

watch(() => props.isVisible, (visible) => {
  if (visible) {
    nextTick(() => {
      if (isUsingLeaflet.value && leafletMap) {
        leafletMap.invalidateSize()
        renderLeafletHospitalMarkers()
        renderLeafletDonorMarkers()
      } else if (googleMap && googleInstance) {
        googleInstance.maps.event.trigger(googleMap, 'resize')
        renderHospitalMarkers()
        renderDonorMarkers()
      }
    })
  }
})

onMounted(() => {
  startListening()
  initGoogleMap()
})


onUnmounted(() => {
  stopListening()
  if (googleMap) {
    hospitalMarkers.forEach(m => m.setMap && m.setMap(null))
    hospitalCircles.forEach(cArr => cArr.forEach(c => c.setMap && c.setMap(null)))
    donorMarkers.forEach(m => m.setMap && m.setMap(null))
    donorPolylines.forEach(l => l.setMap && l.setMap(null))
  }
  if (leafletMap) {
    leafletMap.remove()
    leafletMap = null
  }
})
</script>

<style scoped>
.ll-emergency-map-container {
  font-family: var(--ll-font-family, system-ui, sans-serif);
}

.ll-live-dot--pulse {
  width: 10px;
  height: 10px;
  background-color: #8E2435;
  border-radius: 50%;
  box-shadow: 0 0 0 0 rgba(142, 36, 53, 0.7);
  animation: pulse-wine 1.6s infinite;
}

@keyframes pulse-wine {
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(142, 36, 53, 0.7);
  }
  70% {
    transform: scale(1.1);
    box-shadow: 0 0 0 8px rgba(142, 36, 53, 0);
  }
  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(142, 36, 53, 0);
  }
}

.ll-map-loader-overlay,
.ll-map-error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.94);
  z-index: 10;
}

.ll-legend-circle--3k {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgba(142, 36, 53, 0.2);
  border: 1.5px solid #8E2435;
}

.ll-legend-circle--10k {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgba(142, 36, 53, 0.08);
  border: 1px dashed #8E2435;
}

.hover-lift {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
</style>
