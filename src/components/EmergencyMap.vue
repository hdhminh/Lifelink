<template>
  <div class="ll-emergency-map-container" style="position: relative; z-index: 1;">
    <!-- Map Header Status Toolbar (LifeLink Brand Wine Red Surface) -->
    <div class="ll-map-toolbar d-flex flex-wrap justify-content-between align-items-center gap-2 p-3 rounded-top-lg border border-bottom-0" style="background-color: #ffffff; border-color: #EAE2DF; position: relative; z-index: 1050;">
      <div class="d-flex align-items-center gap-2">
        <span class="ll-live-dot ll-live-dot--pulse" style="background-color: #8E2435;"></span>
        <h5 class="m-0 font-weight-700 d-inline-flex align-items-center" style="font-size: 1.05rem; line-height: 1.2; color: #8E2435 !important;">
          <i class="bi bi-geo-alt-fill me-1" style="color: #8E2435;"></i> {{ titleText }}
        </h5>
        <span class="badge rounded-pill ms-1 d-inline-flex align-items-center" style="font-size: 0.75rem; padding: 0.4rem 0.75rem; line-height: 1; background-color: #8E2435; color: #ffffff;">
          {{ filteredResponders.length }} Active Responder{{ filteredResponders.length !== 1 ? 's' : '' }}
        </span>
      </div>

      <div class="d-flex align-items-center gap-2 ms-auto">
        <!-- Custom Layer Filter Dropdown -->
        <div class="dropdown position-relative">
          <button
            class="btn btn-sm d-inline-flex align-items-center justify-content-between gap-2 shadow-xs"
            style="min-width: 140px; min-height: 38px; font-size: 0.82rem; background-color: #FAF5EF; color: #2B2225; border: 1px solid #EAE2DF; border-radius: 6px;"
            type="button"
            @click.stop="toggleLayerDropdown"
          >
            <span class="d-inline-flex align-items-center text-truncate">
              <i v-if="activeLayerFilter === 'all'" class="bi bi-layers-fill text-slate-600 me-2"></i>
              <i v-else-if="activeLayerFilter === 'hospitals'" class="bi bi-hospital me-2" style="color: #8E2435;"></i>
              <i v-else class="bi bi-calendar-event me-2" style="color: #0D6EFD;"></i>
              {{ activeLayerFilterLabel }}
            </span>
            <i class="bi bi-chevron-down text-slate-400 ms-1" style="font-size: 0.72rem; flex-shrink: 0;"></i>
          </button>
          <ul v-if="showLayerDropdown" class="dropdown-menu show shadow-md p-1 mt-1 position-absolute end-0" style="min-width: 165px; z-index: 2000;">
            <li>
              <button type="button" class="dropdown-item small d-flex align-items-center py-2" @click="setLayerFilter('all')">
                <i class="bi bi-layers-fill text-slate-600 me-2"></i> All Locations
              </button>
            </li>
            <li>
              <button type="button" class="dropdown-item small d-flex align-items-center py-2" @click="setLayerFilter('hospitals')">
                <i class="bi bi-hospital me-2" style="color: #8E2435;"></i> Hospitals ({{ activeRequests.length }})
              </button>
            </li>
            <li>
              <button type="button" class="dropdown-item small d-flex align-items-center py-2" @click="setLayerFilter('events')">
                <i class="bi bi-calendar-event me-2" style="color: #0D6EFD;"></i> Events ({{ activeEvents.length }})
              </button>
            </li>
          </ul>
        </div>

        <!-- Custom Location Focus Dropdown -->
        <div class="dropdown position-relative">
          <button
            class="btn btn-sm d-inline-flex align-items-center justify-content-between gap-2 shadow-xs"
            style="min-width: 170px; max-width: 220px; min-height: 38px; font-size: 0.82rem; background-color: #FAF5EF; color: #2B2225; border: 1px solid #EAE2DF; border-radius: 6px;"
            type="button"
            @click.stop="toggleFocusDropdown"
          >
            <span class="d-inline-flex align-items-center text-truncate" style="max-width: 170px;">
              <i v-if="selectedFocusType === 'hospital'" class="bi bi-hospital me-2" style="color: #8E2435; flex-shrink: 0;"></i>
              <i v-else-if="selectedFocusType === 'event'" class="bi bi-calendar-event me-2" style="color: #0D6EFD; flex-shrink: 0;"></i>
              <i v-else class="bi bi-geo-alt me-2 text-slate-400" style="flex-shrink: 0;"></i>
              <span class="text-truncate">{{ selectedFocusText }}</span>
            </span>
            <i class="bi bi-chevron-down text-slate-400 ms-1" style="font-size: 0.72rem; flex-shrink: 0;"></i>
          </button>
          
          <div v-if="showFocusDropdown" class="dropdown-menu show shadow-md p-1 mt-1 position-absolute end-0" style="min-width: 260px; max-height: 340px; overflow-y: auto; z-index: 2000;">
            <button type="button" class="dropdown-item small py-2 text-slate-600 border-bottom" @click="selectFocus('')">
              <i class="bi bi-geo-alt me-2"></i> All Locations (Default View)
            </button>

            <div class="dropdown-header text-uppercase font-weight-700 mt-1 mb-1" style="font-size: 0.68rem; color: #8E2435;">
              <i class="bi bi-hospital me-1"></i> EMERGENCY HOSPITALS
            </div>
            <button
              v-for="req in activeRequests"
              :key="req.id"
              type="button"
              class="dropdown-item small py-1 px-2 d-flex align-items-center"
              @click="selectFocus(req.id)"
            >
              <i class="bi bi-hospital me-2" style="color: #8E2435; flex-shrink: 0;"></i>
              <span class="text-truncate">[{{ req.bloodType }}] {{ req.hospitalName }}</span>
            </button>

            <div class="dropdown-header text-uppercase font-weight-700 mt-2 mb-1" style="font-size: 0.68rem; color: #0D6EFD;">
              <i class="bi bi-calendar-event me-1"></i> DONATION EVENTS
            </div>
            <button
              v-for="ev in activeEvents"
              :key="'ev_' + ev.id"
              type="button"
              class="dropdown-item small py-1 px-2 d-flex align-items-center"
              @click="selectFocus('ev_' + ev.id)"
            >
              <i class="bi bi-calendar-event me-2" style="color: #0D6EFD; flex-shrink: 0;"></i>
              <span class="text-truncate">{{ cleanEventTitle(ev.title) }}</span>
            </button>
          </div>
        </div>

        <button
          type="button"
          class="btn btn-sm d-inline-flex align-items-center gap-1 font-weight-600 shadow-xs"
          style="min-height: 38px; padding: 0 0.9rem; font-size: 0.82rem; background-color: #FAF5EF; color: #8E2435; border: 1px solid #EAE2DF; border-radius: 6px;"
          title="Recenter map"
          @click="centerMapOnSelected"
        >
          <i class="bi bi-crosshair me-1"></i> Recenter
        </button>
      </div>
    </div>

    <!-- Main Grid: Left Map Surface, Right Live Activity Panel (Tall 660px canvas) -->
    <div class="row g-0 ll-map-body-grid border border-top-0 rounded-bottom-lg overflow-hidden bg-white shadow-sm" style="position: relative; z-index: 1;">
      <!-- Map View Surface (Tall 660px) -->
      <div class="col-lg-8 col-12 position-relative" style="height: 660px; min-height: 660px;">
        <!-- Loading overlay -->
        <div v-if="mapLoading" class="ll-map-loader-overlay d-flex flex-column justify-content-center align-items-center">
          <div class="spinner-border mb-2" style="color: #8E2435;" role="status"></div>
          <span class="small text-slate-600 font-weight-500">Initializing Live Response Map...</span>
        </div>

        <!-- Map Container Div (Height: 660px) -->
        <div id="emergency-map-surface" ref="mapElement" style="width: 100%; height: 660px; min-height: 660px; position: relative; z-index: 1; background-color: #f8f9fa;"></div>

        <!-- Floating Map Legend Overlay -->
        <div class="ll-map-legend p-2 px-3 bg-white border rounded shadow-sm position-absolute bottom-0 start-0 m-3" style="z-index: 1000;">
          <div class="small fw-bold text-slate-800 mb-1" style="font-size: 0.72rem;">
            <i class="bi bi-info-circle-fill me-1" style="color: #8E2435;"></i> RADAR LEGEND
          </div>
          <div class="d-flex flex-column gap-1" style="font-size: 0.72rem;">
            <div class="d-flex align-items-center gap-2">
              <svg width="18" height="22" viewBox="0 0 32 38" fill="none" xmlns="http://www.w3.org/2000/svg" style="flex-shrink: 0;">
                <path d="M16 0C7.16 0 0 7.16 0 16C0 26 14 36.6 15.3 37.7C15.7 38.1 16.3 38.1 16.7 37.7C18 36.6 32 26 32 16C32 7.16 24.84 0 16 0Z" fill="#8E2435"/>
                <circle cx="16" cy="15" r="10" fill="#ffffff"/>
                <rect x="14" y="9" width="4" height="12" rx="1" fill="#8E2435"/>
                <rect x="10" y="13" width="12" height="4" rx="1" fill="#8E2435"/>
              </svg>
              <span>Emergency Hospital & Priority Radar</span>
            </div>
            <div class="d-flex align-items-center gap-2">
              <svg width="18" height="22" viewBox="0 0 32 38" fill="none" xmlns="http://www.w3.org/2000/svg" style="flex-shrink: 0;">
                <path d="M16 0C7.16 0 0 7.16 0 16C0 26 14 36.6 15.3 37.7C15.7 38.1 16.3 38.1 16.7 37.7C18 36.6 32 26 32 16C32 7.16 24.84 0 16 0Z" fill="#0D6EFD"/>
                <circle cx="16" cy="15" r="9" fill="#ffffff"/>
                <path d="M16 10C14.5 10 13 11.2 13 12.8C13 15 16 18 16 18C16 18 19 15 19 12.8C19 11.2 17.5 10 16 10Z" fill="#0D6EFD"/>
              </svg>
              <span>Donation Drive Event Marker</span>
            </div>
            <div class="d-flex align-items-center gap-2">
              <svg width="18" height="22" viewBox="0 0 32 38" fill="none" xmlns="http://www.w3.org/2000/svg" style="flex-shrink: 0;">
                <path d="M16 0C7.16 0 0 7.16 0 16C0 26 14 36.6 15.3 37.7C15.7 38.1 16.3 38.1 16.7 37.7C18 36.6 32 26 32 16C32 7.16 24.84 0 16 0Z" fill="#198754"/>
                <circle cx="16" cy="15" r="9" fill="#ffffff"/>
                <path d="M11 17.5C10.5 17.5 10.1 17.1 10.1 16.6V15.3C10.1 14.8 10.4 14.3 10.8 14.1L13 13C13.5 12.7 14.2 12.5 14.8 12.5H17.2C17.8 12.5 18.5 12.7 19 13L21.2 14.1C21.6 14.3 21.9 14.8 21.9 15.3V16.6C21.9 17.1 21.5 17.5 21 17.5H11Z" fill="#198754"/>
              </svg>
              <span>En-Route Donor Marker (Live Location)</span>
            </div>
            <div class="d-flex align-items-center gap-2">
              <span class="ll-legend-circle ll-legend-circle--3k"></span>
              <span>Inner Radar (3km — Priority Zone)</span>
            </div>
            <div class="d-flex align-items-center gap-2">
              <span class="ll-legend-circle ll-legend-circle--10k"></span>
              <span>Outer Radar (10km — Extended Zone)</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Side Live Activity Stream Panel (Tall 660px) -->
      <div class="col-lg-4 col-12 border-start border-slate-200 p-3 bg-slate-50 d-flex flex-column" style="height: 660px; overflow-y: auto;">
        <h6 class="fw-bold mb-3 d-flex justify-content-between align-items-center" style="font-size: 0.9rem; color: #8E2435;">
          <span><i class="bi bi-radar me-1"></i> RESPONSE STATUS</span>
          <span class="badge bg-slate-200 text-slate-700" style="font-size: 0.68rem;">
            {{ filteredResponders.length }} En-Route
          </span>
        </h6>

        <!-- No responders state -->
        <div v-if="filteredResponders.length === 0" class="text-center py-4 px-3 bg-white rounded border border-slate-200 flex-grow-1 d-flex flex-column justify-content-center align-items-center">
          <div class="mb-2 text-slate-300 fs-1"><i class="bi bi-geo-alt"></i></div>
          <h6 class="fw-bold text-slate-700 mb-1" style="font-size: 0.88rem;">Searching for Active Responders</h6>
          <p class="small text-slate-500 mb-0" style="font-size: 0.78rem;">
            Radar active across 10 km radius. Responders will appear here live when they accept emergency requests and share location.
          </p>
        </div>

        <!-- Responders list cards -->
        <div v-else class="d-flex flex-column gap-2 flex-grow-1">
          <div
            v-for="resp in filteredResponders"
            :key="resp.trackingKey"
            class="p-3 bg-white border border-slate-200 rounded shadow-xs position-relative hover-lift cursor-pointer"
            @click="focusResponder(resp)"
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
                {{ resp.status === 'approaching' ? 'Approaching' : 'En Route' }}
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
            <li
              v-for="(log, idx) in activityLogs"
              :key="idx"
              class="mb-1 text-slate-600 d-flex align-items-center gap-1 cursor-pointer hover-text-wine"
              @click="centerMapOnSelected"
            >
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
 * EmergencyMap.vue (Unified Live Network Map)
 * Single reusable map component rendering Hospital Emergency Requests, Donation Events, and Live Responders.
 * All UI labels, tooltips, popups, and legends use real Bootstrap Icons and clean titles.
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
  events: {
    type: Array,
    default: () => []
  },
  isVisible: {
    type: Boolean,
    default: true
  },
  titleText: {
    type: String,
    default: 'Live Map'
  }
})

const emit = defineEmits(['respond', 'register-event'])

const { responses: activeResponses, startListening, stopListening } = useActiveResponses()

const mapElement = ref(null)
const mapLoading = ref(true)
const selectedRequestId = ref('')
const activeLayerFilter = ref('all') // 'all' | 'hospitals' | 'events'
const activityLogs = ref([])

const showLayerDropdown = ref(false)
const showFocusDropdown = ref(false)

let leafletMap = null

// Dictionaries to manage map instances
const hospitalMarkers = new Map()
const hospitalCircles = new Map()
const eventMarkers = new Map()
const donorMarkers = new Map()
const donorPolylines = new Map()

function cleanEventTitle(title) {
  if (!title) return ''
  return title.split(' — ')[0].trim()
}

const activeRequests = computed(() => {
  return props.emergencyRequests.filter(r => r.status === 'active')
})

const activeEvents = computed(() => {
  return props.events || []
})

const filteredResponders = computed(() => {
  if (!selectedRequestId.value) return activeResponses.value
  return activeResponses.value.filter(r => String(r.requestId) === String(selectedRequestId.value))
})

const activeLayerFilterLabel = computed(() => {
  if (activeLayerFilter.value === 'hospitals') return `Hospitals (${activeRequests.value.length})`
  if (activeLayerFilter.value === 'events') return `Events (${activeEvents.value.length})`
  return 'All Locations'
})

const selectedFocusType = computed(() => {
  if (!selectedRequestId.value) return 'none'
  return selectedRequestId.value.startsWith('ev_') ? 'event' : 'hospital'
})

const selectedFocusText = computed(() => {
  if (!selectedRequestId.value) return 'Select Location Focus'
  if (selectedRequestId.value.startsWith('ev_')) {
    const rawId = selectedRequestId.value.replace('ev_', '')
    const ev = activeEvents.value.find(e => String(e.id) === String(rawId))
    return ev ? cleanEventTitle(ev.title) : 'Selected Event'
  }
  const req = activeRequests.value.find(r => String(r.id) === String(selectedRequestId.value))
  return req ? `[${req.bloodType}] ${req.hospitalName}` : 'Selected Hospital'
})

function toggleLayerDropdown() {
  showLayerDropdown.value = !showLayerDropdown.value
  showFocusDropdown.value = false
}

function toggleFocusDropdown() {
  showFocusDropdown.value = !showFocusDropdown.value
  showLayerDropdown.value = false
}

function setLayerFilter(val) {
  activeLayerFilter.value = val
  showLayerDropdown.value = false
  renderHospitalMarkers()
  renderEventMarkers()
}

function selectFocus(val) {
  selectedRequestId.value = val
  showFocusDropdown.value = false
  centerMapOnSelected()
}

function closeDropdownsOnClickOutside(e) {
  if (!e.target.closest('.dropdown')) {
    showLayerDropdown.value = false
    showFocusDropdown.value = false
  }
}

function formatMeters(meters) {
  return formatDistance(meters)
}

function logActivity(text) {
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  activityLogs.value.unshift({ time, text })
  if (activityLogs.value.length > 5) activityLogs.value.pop()
}

function truncateText(text, maxLen = 20) {
  if (!text) return ''
  if (text.length <= maxLen) return text
  return text.substring(0, maxLen - 3) + '...'
}

/**
 * Initializes Leaflet Map Engine without attribution bar (attributionControl: false).
 */
function initMapEngine() {
  mapLoading.value = true

  if (leafletMap) {
    try {
      leafletMap.remove()
    } catch (e) {
      // ignore
    }
    leafletMap = null
  }

  if (!mapElement.value) return

  mapElement.value.innerHTML = ''

  leafletMap = L.map(mapElement.value, {
    center: [16.0, 107.5],
    zoom: 6,
    minZoom: 5,
    zoomControl: true,
    attributionControl: false
  })

  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    minZoom: 5,
    subdomains: 'abcd'
  }).addTo(leafletMap)

  leafletMap.setMaxBounds([
    [4.0, 96.0],
    [26.0, 116.0]
  ])

  if (typeof window !== 'undefined') {
    window.handleHospitalPopupRespond = (reqId) => {
      emit('respond', reqId)
    }
    window.handleEventPopupRegister = (eventId) => {
      emit('register-event', eventId)
    }
  }

  mapLoading.value = false
  logActivity('Live Network Map active.')
  renderHospitalMarkers()
  renderEventMarkers()
  renderDonorMarkers()

  nextTick(() => {
    if (leafletMap) leafletMap.invalidateSize(true)
  })
  setTimeout(() => {
    if (leafletMap) leafletMap.invalidateSize(true)
  }, 100)
  setTimeout(() => {
    if (leafletMap) leafletMap.invalidateSize(true)
  }, 300)
  setTimeout(() => {
    if (leafletMap) leafletMap.invalidateSize(true)
  }, 600)
}

/**
 * Renders Hospital Emergency Markers & Radar Circles in Leaflet.
 */
function renderHospitalMarkers() {
  if (!leafletMap) return

  hospitalMarkers.forEach(m => leafletMap.removeLayer(m))
  hospitalCircles.forEach(cArray => cArray.forEach(c => leafletMap.removeLayer(c)))
  hospitalMarkers.clear()
  hospitalCircles.clear()

  if (activeLayerFilter.value === 'events') return

  const bounds = L.latLngBounds([])
  let count = 0

  activeRequests.value.forEach((req) => {
    const coords = (req.latitude && req.longitude)
      ? { lat: Number(req.latitude), lng: Number(req.longitude) }
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

    const marker = L.marker(pos, { icon, zIndexOffset: 1000 }).addTo(leafletMap)
    marker.bindPopup(`
      <div style="font-family: system-ui, sans-serif; padding: 4px; max-width: 220px;">
        <strong style="color: #8E2435; font-size: 0.9rem;">${req.hospitalName}</strong><br>
        <span style="font-size: 0.78rem;">Blood Required: <strong style="color: #8E2435;">${req.bloodType}</strong> (${req.urgency})</span><br>
        <span style="font-size: 0.75rem;">Confirmed: <strong>${req.confirmedCount || 0}/${req.unitsNeeded} units</strong></span><br>
        <button type="button" class="btn btn-sm text-white fw-bold mt-2 w-100" style="background-color: #8E2435; font-size: 0.72rem; border-radius: 6px;" onclick="window.handleHospitalPopupRespond('${req.id}')">
          🩸 Confirm Availability
        </button>
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

    hospitalMarkers.set(String(req.id), marker)
    hospitalCircles.set(String(req.id), [innerCircle, outerCircle])
  })

  if (count > 0 && !selectedRequestId.value) {
    leafletMap.fitBounds(bounds, { padding: [30, 30] })
  }
}

/**
 * Renders Donation Event Markers in Leaflet with Register Interest button in popup.
 */
function renderEventMarkers() {
  if (!leafletMap) return

  eventMarkers.forEach(m => leafletMap.removeLayer(m))
  eventMarkers.clear()

  if (activeLayerFilter.value === 'hospitals') return

  activeEvents.value.forEach((ev) => {
    const coords = (ev.latitude && ev.longitude)
      ? { lat: Number(ev.latitude), lng: Number(ev.longitude) }
      : getHospitalCoordinates(ev.location || ev.title, ev.city)

    const pos = [coords.lat, coords.lng]

    const icon = L.divIcon({
      className: 'll-event-leaflet-icon',
      html: `
        <div style="position: relative; width: 30px; height: 36px; filter: drop-shadow(0 3px 6px rgba(13,110,253,0.35)); cursor: pointer;">
          <svg width="30" height="36" viewBox="0 0 32 38" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 0C7.16 0 0 7.16 0 16C0 26 14 36.6 15.3 37.7C15.7 38.1 16.3 38.1 16.7 37.7C18 36.6 32 26 32 16C32 7.16 24.84 0 16 0Z" fill="#0D6EFD"/>
            <circle cx="16" cy="15" r="9" fill="#ffffff"/>
            <path d="M16 10C14.5 10 13 11.2 13 12.8C13 15 16 18 16 18C16 18 19 15 19 12.8C19 11.2 17.5 10 16 10Z" fill="#0D6EFD"/>
          </svg>
        </div>
      `,
      iconSize: [30, 36],
      iconAnchor: [15, 36]
    })

    const marker = L.marker(pos, { icon, zIndexOffset: 100 }).addTo(leafletMap)
    marker.bindPopup(`
      <div style="font-family: system-ui, sans-serif; padding: 4px; max-width: 220px;">
        <strong style="color: #0D6EFD; font-size: 0.88rem;">${cleanEventTitle(ev.title)}</strong><br>
        <span style="font-size: 0.76rem; color: #555;">Category: <strong>${ev.category || 'Drive'}</strong></span><br>
        <span style="font-size: 0.75rem; color: #555;">Location: ${ev.location || ev.city}</span><br>
        <span style="font-size: 0.75rem; color: #0D6EFD; font-weight: bold;">Date: ${ev.date || 'Upcoming'}</span><br>
        <button type="button" class="btn btn-sm text-white fw-bold mt-2 w-100" style="background-color: #0D6EFD; font-size: 0.72rem; border-radius: 6px;" onclick="window.handleEventPopupRegister('${ev.id}')">
          ❤️ Register Interest
        </button>
      </div>
    `)

    eventMarkers.set('ev_' + String(ev.id), marker)
  })
}

/**
 * Renders Donor Markers in Leaflet.
 */
function renderDonorMarkers() {
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
          <div style="position: relative; width: 30px; height: 36px; filter: drop-shadow(0 3px 6px rgba(25,135,84,0.4)); cursor: pointer;">
            <svg width="30" height="36" viewBox="0 0 32 38" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 0C7.16 0 0 7.16 0 16C0 26 14 36.6 15.3 37.7C15.7 38.1 16.3 38.1 16.7 37.7C18 36.6 32 26 32 16C32 7.16 24.84 0 16 0Z" fill="#198754"/>
              <circle cx="16" cy="15" r="9" fill="#ffffff"/>
              <path d="M11 17.5C10.5 17.5 10.1 17.1 10.1 16.6V15.3C10.1 14.8 10.4 14.3 10.8 14.1L13 13C13.5 12.7 14.2 12.5 14.8 12.5H17.2C17.8 12.5 18.5 12.7 19 13L21.2 14.1C21.6 14.3 21.9 14.8 21.9 15.3V16.6C21.9 17.1 21.5 17.5 21 17.5H11Z" fill="#198754"/>
            </svg>
          </div>
        `,
        iconSize: [30, 36],
        iconAnchor: [15, 36]
      })

      const m = L.marker(pos, { icon }).addTo(leafletMap)
      m.bindPopup(`
        <div style="font-size: 0.78rem;">
          <strong>${resp.donorName}</strong> (${resp.bloodType})<br>
          Status: <strong>${resp.status}</strong><br>
          ETA: <strong>~${resp.etaMins || 1} min</strong>
        </div>
      `)
      donorMarkers.set(key, m)

      if (resp.hospitalLat && resp.hospitalLng) {
        const poly = L.polyline([pos, [resp.hospitalLat, resp.hospitalLng]], {
          color: '#198754',
          dashArray: '5, 10',
          weight: 3
        }).addTo(leafletMap)
        donorPolylines.set(key, poly)
      }
    }
  })
}

function centerMapOnSelected() {
  if (!leafletMap) return

  if (selectedRequestId.value) {
    if (selectedRequestId.value.startsWith('ev_')) {
      const rawId = selectedRequestId.value.replace('ev_', '')
      const ev = activeEvents.value.find(e => String(e.id) === String(rawId))
      if (ev) {
        const coords = (ev.latitude && ev.longitude)
          ? { lat: Number(ev.latitude), lng: Number(ev.longitude) }
          : getHospitalCoordinates(ev.location || ev.title, ev.city)
        leafletMap.setView([coords.lat, coords.lng], 15, { animate: true })
        const m = eventMarkers.get(selectedRequestId.value)
        if (m) m.openPopup()
        logActivity(`Focused on event: ${cleanEventTitle(ev.title)}`)
      }
    } else {
      const req = activeRequests.value.find(r => String(r.id) === String(selectedRequestId.value))
      if (req) {
        const coords = (req.latitude && req.longitude)
          ? { lat: Number(req.latitude), lng: Number(req.longitude) }
          : getHospitalCoordinates(req.hospitalName, req.city)
        leafletMap.setView([coords.lat, coords.lng], 15, { animate: true })
        const marker = hospitalMarkers.get(String(req.id))
        if (marker) marker.openPopup()
        logActivity(`Focused on hospital: ${req.hospitalName}`)
      }
    }
  } else {
    renderHospitalMarkers()
    renderEventMarkers()
  }
}

function focusRequest(requestId) {
  selectedRequestId.value = String(requestId)
  centerMapOnSelected()
}

function focusResponder(resp) {
  if (leafletMap && resp.latitude && resp.longitude) {
    leafletMap.setView([resp.latitude, resp.longitude], 15)
    const m = donorMarkers.get(resp.trackingKey)
    if (m) m.openPopup()
  }
}

function refreshMapSize() {
  nextTick(() => {
    setTimeout(() => {
      if (leafletMap) {
        leafletMap.invalidateSize(true)
        renderHospitalMarkers()
        renderEventMarkers()
        renderDonorMarkers()
      }
    }, 50)
    setTimeout(() => {
      if (leafletMap) {
        leafletMap.invalidateSize(true)
      }
    }, 250)
  })
}

watch(activeRequests, () => {
  renderHospitalMarkers()
}, { deep: true })

watch(activeEvents, () => {
  renderEventMarkers()
}, { deep: true })

watch(filteredResponders, () => {
  renderDonorMarkers()
}, { deep: true })

watch(selectedRequestId, () => {
  centerMapOnSelected()
})

watch(activeLayerFilter, () => {
  renderHospitalMarkers()
  renderEventMarkers()
})

watch(() => props.isVisible, (visible) => {
  if (visible) {
    refreshMapSize()
  }
}, { immediate: true })

onMounted(() => {
  startListening()
  initMapEngine()
  if (typeof window !== 'undefined') {
    window.addEventListener('click', closeDropdownsOnClickOutside)
  }
})

onUnmounted(() => {
  stopListening()
  if (typeof window !== 'undefined') {
    window.removeEventListener('click', closeDropdownsOnClickOutside)
  }
  if (leafletMap) {
    try {
      leafletMap.remove()
    } catch (e) {
      // ignore
    }
    leafletMap = null
  }
})

defineExpose({
  focusRequest,
  centerMapOnSelected
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
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: rgba(142, 36, 53, 0.2);
  border: 1.5px solid #8E2435;
}

.ll-legend-circle--10k {
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: rgba(142, 36, 53, 0.08);
  border: 1px dashed #8E2435;
}

.cursor-pointer {
  cursor: pointer;
}

.hover-lift {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
</style>
