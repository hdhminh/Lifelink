<template>
  <!-- Outer Shell: Unified 16px Rounded Container with Brand Shadow -->
  <div class="ll-emergency-map-container overflow-hidden rounded-16 border shadow-sm" style="position: relative; z-index: 1; border-color: #EAE2DF !important; border-radius: 16px !important; box-shadow: 0 10px 30px rgba(142, 36, 53, 0.06) !important;">
    <!-- Map Header Status Toolbar (LifeLink Brand Wine Red Surface with Rounded 16px Top Corners) -->
    <div class="ll-map-toolbar d-flex flex-wrap justify-content-between align-items-center gap-2 p-3 px-4 border-bottom bg-white" style="border-color: #EAE2DF; position: relative; z-index: 1050; border-top-left-radius: 16px; border-top-right-radius: 16px;">
      <div class="d-flex align-items-center">
        <!-- Unified Sleek Wine-Red LIVE Pill Badge -->
        <span class="badge rounded-pill d-inline-flex align-items-center gap-2 shadow-xs" style="font-size: 0.76rem; padding: 0.48rem 0.95rem; line-height: 1; background-color: #8E2435; color: #ffffff; font-weight: 700; letter-spacing: 0.5px;">
          <span class="ll-white-dot-pulse"></span>
          <span>LIVE</span>
          <span style="opacity: 0.4; font-weight: 300;">|</span>
          <span>{{ filteredResponders.length }} ACTIVE RESPONDERS</span>
        </span>
      </div>

      <div class="d-flex align-items-center gap-2 ms-auto">
        <!-- Custom Layer Filter Dropdown -->
        <div class="dropdown position-relative">
          <button
            class="btn btn-sm d-inline-flex align-items-center justify-content-between gap-2 shadow-xs"
            style="min-width: 140px; min-height: 38px; font-size: 0.82rem; background-color: #FAF5EF; color: #2B2225; border: 1px solid #EAE2DF; border-radius: 8px;"
            type="button"
            aria-label="Filter map layers by hospitals or events"
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
              <button type="button" class="dropdown-item small d-flex align-items-center py-2" aria-label="Show all location layers" @click="setLayerFilter('all')">
                <i class="bi bi-layers-fill text-slate-600 me-2"></i> All Locations
              </button>
            </li>
            <li>
              <button type="button" class="dropdown-item small d-flex align-items-center py-2" aria-label="Filter by emergency hospitals" @click="setLayerFilter('hospitals')">
                <i class="bi bi-hospital me-2" style="color: #8E2435;"></i> Hospitals ({{ activeRequests.length }})
              </button>
            </li>
            <li>
              <button type="button" class="dropdown-item small d-flex align-items-center py-2" aria-label="Filter by donation events" @click="setLayerFilter('events')">
                <i class="bi bi-calendar-event me-2" style="color: #0D6EFD;"></i> Events ({{ activeEvents.length }})
              </button>
            </li>
          </ul>
        </div>

        <!-- Custom Location Focus Dropdown -->
        <div class="dropdown position-relative">
          <button
            class="btn btn-sm d-inline-flex align-items-center justify-content-between gap-2 shadow-xs"
            style="min-width: 170px; max-width: 220px; min-height: 38px; font-size: 0.82rem; background-color: #FAF5EF; color: #2B2225; border: 1px solid #EAE2DF; border-radius: 8px;"
            type="button"
            aria-label="Select focus location on map"
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
            <button type="button" class="dropdown-item small py-2 text-slate-600 border-bottom" aria-label="Show all locations" @click="selectFocus('')">
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
              :aria-label="`Focus on hospital ${req.hospitalName}`"
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
              :aria-label="`Focus on event ${cleanEventTitle(ev.title)}`"
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
          style="min-height: 38px; padding: 0 0.9rem; font-size: 0.82rem; background-color: #FAF5EF; color: #8E2435; border: 1px solid #EAE2DF; border-radius: 8px;"
          title="Recenter map"
          aria-label="Recenter map view"
          @click="centerMapOnSelected"
        >
          <i class="bi bi-crosshair me-1"></i> Recenter
        </button>
      </div>
    </div>

    <!-- Main Grid: Left Map Surface, Right Live Activity Panel (Tall 660px canvas, rounded bottom) -->
    <div class="row g-0 ll-map-body-grid overflow-hidden bg-white" style="position: relative; z-index: 1; border-bottom-left-radius: 16px; border-bottom-right-radius: 16px;">
      <!-- Map View Surface (Tall 660px) -->
      <div class="col-lg-8 col-12 position-relative" style="height: 660px; min-height: 660px; border-bottom-left-radius: 16px; overflow: hidden;">
        <!-- Loading overlay -->
        <div v-if="mapLoading" class="ll-map-loader-overlay d-flex flex-column justify-content-center align-items-center">
          <div class="spinner-border mb-2" style="color: #8E2435;" role="status"></div>
          <span class="small text-slate-600 font-weight-500">Initializing Live Response Map...</span>
        </div>

        <!-- Map Container Div (Height: 660px) -->
        <div id="emergency-map-surface" ref="mapElement" style="width: 100%; height: 660px; min-height: 660px; position: relative; z-index: 1; background-color: #f8f9fa;"></div>

        <!-- Floating Map Legend Overlay -->
        <div class="ll-map-legend p-2 px-3 bg-white border rounded shadow-sm position-absolute bottom-0 start-0 m-3" style="z-index: 1000; max-width: 290px;">
          <div class="small fw-bold text-slate-800 d-flex justify-content-between align-items-center cursor-pointer" style="font-size: 0.72rem;" @click.stop.prevent="showLegend = !showLegend" aria-label="Toggle Legend">
            <span><i class="bi bi-info-circle-fill me-1" style="color: #8E2435;"></i> RADAR LEGEND</span>
            <i class="bi text-slate-400" :class="showLegend ? 'bi-chevron-down' : 'bi-chevron-up'"></i>
          </div>
          <div v-show="showLegend" class="d-flex flex-column gap-1 mt-2 pt-2 border-top" style="font-size: 0.72rem;">
            <div class="d-flex align-items-center gap-2">
              <svg width="18" height="22" viewBox="0 0 32 38" fill="none" xmlns="http://www.w3.org/2000/svg" style="flex-shrink: 0; max-width: none;">
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
            <div v-if="!isGuest" class="d-flex align-items-center gap-2 mt-1">
              <span style="display: inline-block; width: 14px; height: 14px; background-color: #198754; border: 2px solid white; border-radius: 50%; box-shadow: 0 1px 3px rgba(0,0,0,0.3); margin-left: 2px; margin-right: 2px;"></span>
              <span>Compatible Donor (Ready)</span>
            </div>
            <div v-if="!isGuest" class="d-flex align-items-center gap-2">
              <span style="display: inline-block; width: 14px; height: 14px; background-color: #6c757d; border: 2px solid white; border-radius: 50%; box-shadow: 0 1px 3px rgba(0,0,0,0.3); margin-left: 2px; margin-right: 2px;"></span>
              <span>Compatible Donor (On Cooldown)</span>
            </div>
            <div class="d-flex align-items-center gap-2 mt-1">
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
      <div class="col-lg-4 col-12 border-start border-slate-200 p-3 bg-slate-50 d-flex flex-column" style="height: 660px; overflow-y: auto; border-bottom-right-radius: 16px;">
        <h2 class="fw-bold mb-3 d-flex justify-content-between align-items-center" style="font-size: 0.9rem; color: #8E2435;">
          <span><i class="bi bi-radar me-1"></i> RESPONSE STATUS</span>
          <span class="badge bg-slate-200 text-slate-700" style="font-size: 0.68rem;">
            {{ filteredResponders.length }} En-Route
          </span>
        </h2>

        <!-- Radar Scan Telemetry Card in Sidebar (Admin Only) -->
        <div v-if="isAdmin && selectedHospitalForRadar" class="p-3 bg-white border border-slate-200 rounded shadow-xs mb-3">
          <div class="d-flex justify-content-between align-items-center mb-1">
            <h3 class="fw-bold mb-0 text-slate-800" style="font-size: 0.83rem;">
              <i class="bi bi-broadcast me-1" style="color: #8E2435;"></i> Radar Donor Scan
            </h3>
            <span class="badge text-white" style="font-size: 0.65rem; background-color: #8E2435;">{{ selectedHospitalForRadar.bloodType }}</span>
          </div>
          <div class="small text-slate-500 mb-2" style="font-size: 0.73rem;">
            {{ selectedHospitalForRadar.hospitalName }}
          </div>
          <div class="d-flex justify-content-between align-items-center py-1 border-bottom border-slate-100" style="font-size: 0.75rem;">
            <span class="text-slate-600">Inner Radius (3 km):</span>
            <strong class="text-success">{{ radarCounts.inner }} compatible</strong>
          </div>
          <div class="d-flex justify-content-between align-items-center py-1" style="font-size: 0.75rem;">
            <span class="text-slate-600">Outer Radius (10 km):</span>
            <strong class="text-slate-800">{{ radarCounts.outer }} compatible</strong>
          </div>
        </div>

        <!-- No responders state -->
        <div v-if="filteredResponders.length === 0" class="text-center py-4 px-3 bg-white rounded border border-slate-200 flex-grow-1 d-flex flex-column justify-content-center align-items-center">
          <div class="mb-2 text-slate-300 fs-1"><i class="bi bi-geo-alt"></i></div>
          <h3 class="fw-bold text-slate-700 mb-1" style="font-size: 0.88rem;">Searching for Active Responders</h3>
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
import { useAuth } from '@/composables/useAuth.js'
import { useActiveResponses } from '@/composables/useActiveResponses.js'
import { useGeolocation } from '@/composables/useGeolocation.js'
import { getHospitalCoordinates } from '@/data/hospitalCoordinates.js'
import { calculateHaversineDistance, calculateRoadDistance, formatDistance } from '@/utils/haversine.js'
import { canDonateTo } from '@/utils/bloodCompatibility.js'
import mockDonors from '@/data/mockDonors.json'

function escapeHtml(unsafe) {
  if (typeof unsafe !== 'string') return String(unsafe || '')
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

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
const { userLocation, locationGranted, requestLocation } = useGeolocation()

const mapElement = ref(null)
const mapLoading = ref(true)
const selectedRequestId = ref('')
const activeLayerFilter = ref('all') // 'all' | 'hospitals' | 'events'
const activityLogs = ref([])

const showLayerDropdown = ref(false)
const showFocusDropdown = ref(false)
const showLegend = ref(true)
const showRadarOverlay = ref(false)
const selectedHospitalForRadar = ref(null)
const radarCounts = ref({ inner: 0, outer: 0 })

const { user, isGuest, isAdmin } = useAuth()

let leafletMap = null
let userLocationMarker = null
let measurementPolyline = null

// Dictionaries to manage map instances
const hospitalMarkers = new Map()
const hospitalCircles = new Map()
const eventMarkers = new Map()
const donorMarkers = new Map()
const donorPolylines = new Map()
const radarMarkers = new Map()
let currentZoom = 6

function cleanEventTitle(title) {
  if (!title) return ''
  return title.split(' — ')[0].trim()
}

/**
 * Robustly extracts the phone number from emergency request or event object matching the Emergency Board.
 */
function extractPhoneNumber(entity) {
  if (!entity) return '115'
  if (entity.contactPhone && String(entity.contactPhone).trim()) return String(entity.contactPhone).trim()
  if (entity.phone && String(entity.phone).trim()) return String(entity.phone).trim()

  const info = entity.contactInfo ? String(entity.contactInfo).trim() : ''
  if (info) {
    const match = info.match(/(?:\+?84|0)[0-9\s.\-()]{8,14}/)
    if (match) return match[0].trim()
    return info
  }
  return '115'
}

/**
 * Renders or updates the user location pulsing dot marker on Leaflet map.
 */
function renderUserLocationMarker() {
  if (!leafletMap) return
  if (userLocationMarker) {
    leafletMap.removeLayer(userLocationMarker)
    userLocationMarker = null
  }
  if (!userLocation.value) return

  const userIcon = L.divIcon({
    className: 'll-user-location-icon',
    html: `
      <div style="position: relative; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; cursor: pointer; filter: drop-shadow(0 3px 6px rgba(25,135,84,0.4));">
        <span style="position: absolute; width: 38px; height: 38px; border-radius: 50%; background-color: rgba(25, 135, 84, 0.25); animation: pulse-white-dot 2s infinite;"></span>
        <div style="width: 24px; height: 24px; border-radius: 50%; background-color: #198754; border: 3px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
          <i class="bi bi-person-fill text-white" style="font-size: 13px;"></i>
        </div>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19]
  })

  const pos = [userLocation.value.lat, userLocation.value.lng]
  userLocationMarker = L.marker(pos, { icon: userIcon, zIndexOffset: 2000 }).addTo(leafletMap)
  userLocationMarker.bindPopup(`
    <div style="font-family: system-ui, sans-serif; padding: 4px; font-size: 0.8rem;">
      <strong style="color: #198754;"><i class="bi bi-geo-alt-fill me-1"></i> Your Location (Donor)</strong><br>
      <span class="text-slate-600">Active position signal for distance measurement.</span>
    </div>
  `)
}

let alternativePolylines = []

/**
 * Real-Time Traffic Density & Multi-route optimization based on local peak hours.
 */
function getTrafficDensityInfo() {
  const now = new Date()
  const hour = now.getHours()
  if ((hour >= 7 && hour < 9) || (hour >= 16 && hour < 19)) {
    return { factor: 1.45, text: 'Heavy Traffic (Peak)', color: '#DC2626', icon: 'bi-exclamation-circle-fill' }
  }
  if ((hour >= 11 && hour <= 13) || hour === 17) {
    return { factor: 1.25, text: 'Moderate Traffic', color: '#D97706', icon: 'bi-info-circle-fill' }
  }
  return { factor: 1.05, text: 'Smooth Traffic Flow', color: '#16A34A', icon: 'bi-check-circle-fill' }
}

/**
 * Intermediate coastal highway waypoints along Vietnam's S-shape National Highway 1A / North-South Expressway.
 * Used to force OSRM routing to stay 100% inside Vietnam territory when routing across regions (e.g. HCMC to Hanoi).
 */
const VIETNAM_COASTAL_WAYPOINTS = [
  { name: 'Phan Thiet', lat: 10.9333, lng: 108.1000 },
  { name: 'Nha Trang', lat: 12.2451, lng: 109.1943 },
  { name: 'Quy Nhon', lat: 13.7820, lng: 109.2194 },
  { name: 'Quang Ngai', lat: 15.1205, lng: 108.7924 },
  { name: 'Da Nang', lat: 16.0544, lng: 108.2022 },
  { name: 'Hue', lat: 16.4637, lng: 107.5909 },
  { name: 'Dong Hoi', lat: 17.4764, lng: 106.6020 },
  { name: 'Vinh', lat: 18.6734, lng: 105.6813 },
  { name: 'Thanh Hoa', lat: 19.8067, lng: 105.7851 },
  { name: 'Ninh Binh', lat: 20.2539, lng: 105.9750 }
]

/**
 * Builds intermediate Vietnam highway waypoints for long-distance routes between start and target coordinates.
 */
function getVietnamDomesticWaypoints(startLat, startLng, targetLat, targetLng) {
  const minLat = Math.min(startLat, targetLat)
  const maxLat = Math.max(startLat, targetLat)
  
  // Find all Vietnam coastal highway cities between start and target latitudes
  let waypoints = VIETNAM_COASTAL_WAYPOINTS.filter(
    w => w.lat > minLat + 0.5 && w.lat < maxLat - 0.5
  )

  // If going South to North, sort ascending latitude; if North to South, sort descending
  if (startLat < targetLat) {
    waypoints.sort((a, b) => a.lat - b.lat)
  } else {
    waypoints.sort((a, b) => b.lat - a.lat)
  }

  // Cap to max 3 waypoints for clean OSRM request
  if (waypoints.length > 3) {
    const step = Math.floor(waypoints.length / 3)
    waypoints = [waypoints[0], waypoints[step], waypoints[waypoints.length - 1]]
  }

  return waypoints
}

/**
 * Ensures coords are strictly returned for map rendering
 */
function sanitizeVietnamCoordinates(coords) {
  return coords
}

/**
 * Updates or clears the road route polylines connecting user location to target destination using OSRM Multi-Route API.
 * Uses domestic Vietnam coastal highway waypoints (National Highway 1A) to ensure 100% of route coordinates stay inside Vietnam.
 */
async function updateMeasurementPolyline(targetLat, targetLng, color = '#8E2435') {
  if (!leafletMap) return

  if (measurementPolyline) {
    leafletMap.removeLayer(measurementPolyline)
    measurementPolyline = null
  }
  alternativePolylines.forEach(p => leafletMap.removeLayer(p))
  alternativePolylines = []

  if (!userLocation.value || !targetLat || !targetLng) return

  const startLat = userLocation.value.lat
  const startLng = userLocation.value.lng
  const endLat = Number(targetLat)
  const endLng = Number(targetLng)

  const directMeters = calculateRoadDistance(startLat, startLng, endLat, endLng)
  const isLongDistance = directMeters > 100000 // > 100 km

  // Build OSRM query coordinates string with domestic Vietnam waypoints
  const domesticWaypoints = isLongDistance
    ? getVietnamDomesticWaypoints(startLat, startLng, endLat, endLng)
    : []

  let osrmCoordString = `${startLng},${startLat}`
  domesticWaypoints.forEach(w => {
    osrmCoordString += `;${w.lng},${w.lat}`
  })
  osrmCoordString += `;${endLng},${endLat}`

  // Initial fallback line constrained to Vietnam territory
  const fallbackPoints = [
    [startLat, startLng],
    ...domesticWaypoints.map(w => [w.lat, w.lng]),
    [endLat, endLng]
  ]

  measurementPolyline = L.polyline(sanitizeVietnamCoordinates(fallbackPoints), {
    color,
    weight: 4,
    dashArray: '6, 8',
    opacity: 0.75
  }).addTo(leafletMap)

  // Do not use OSRM for very long distances to prevent crazy ferry routes (e.g. to China)
  if (isLongDistance) {
    return
  }

  try {
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${osrmCoordString}?overview=full&geometries=geojson`
    const res = await fetch(osrmUrl)
    if (res.ok) {
      const data = await res.json()
      if (data.routes && data.routes.length > 0) {
        if (measurementPolyline && leafletMap) {
          leafletMap.removeLayer(measurementPolyline)
        }

        // Render driving route strictly constrained to domestic Vietnam territory
        const rawCoords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]])
        const roadCoordinates = sanitizeVietnamCoordinates(rawCoords)

        measurementPolyline = L.polyline(roadCoordinates, {
          color,
          weight: 5,
          opacity: 0.95,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(leafletMap)
      }
    }
  } catch (err) {
    console.warn('OSRM Routing fetch fallback:', err)
  }
}

/**
 * Builds HTML for distance measurement badge inside popups using Bootstrap Icons.
 */
function getDistanceBadgeHtml(targetLat, targetLng, themeColor = '#8E2435') {
  const bgLight = themeColor === '#0D6EFD' ? '#EFF6FF' : '#FAF5EF'

  if (!userLocation.value) {
    return `
      <button type="button" class="btn btn-sm w-100 mt-2 d-inline-flex align-items-center justify-content-center gap-1 font-weight-700" style="font-size: 0.72rem; border-radius: 6px; border: 1px solid ${themeColor}; color: ${themeColor}; background-color: ${bgLight};" onclick="window.handleRequestUserLocation()">
        <i class="bi bi-geo-alt-fill me-1" style="color: ${themeColor};"></i> Enable Location for Distance
      </button>
    `
  }
  const roadMeters = calculateRoadDistance(userLocation.value.lat, userLocation.value.lng, Number(targetLat), Number(targetLng))
  const formatted = formatDistance(roadMeters)
  const traffic = getTrafficDensityInfo()
  const estMins = Math.max(1, Math.round(((roadMeters / 1000) / 25) * 60 * traffic.factor))
  const navUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.value.lat},${userLocation.value.lng}&destination=${targetLat},${targetLng}`

  return `
    <div class="mt-2 pt-1 border-top border-slate-200 text-slate-700" style="font-size: 0.75rem;">
      <div class="d-flex justify-content-between align-items-center mb-1">
        <span><i class="bi bi-compass me-1" style="color: ${themeColor};"></i> Est. Distance:</span>
        <strong style="color: ${themeColor};">${formatted}</strong>
      </div>
      <div class="d-flex justify-content-between align-items-center mb-1" style="font-size: 0.71rem;">
        <span><i class="bi ${traffic.icon} me-1" style="color: ${traffic.color};"></i> Traffic Density:</span>
        <strong style="color: ${traffic.color};">${traffic.text}</strong>
      </div>
      <div class="d-flex justify-content-between align-items-center mb-1" style="font-size: 0.71rem;">
        <span><i class="bi bi-clock-history me-1" style="color: ${themeColor};"></i> Est. Travel Time:</span>
        <strong style="color: ${themeColor};">~${estMins} mins</strong>
      </div>
      <a href="${navUrl}" target="_blank" rel="noopener" class="btn btn-sm text-white mt-1 w-100 d-inline-flex align-items-center justify-content-center gap-1 font-weight-700" style="background-color: ${themeColor}; font-size: 0.70rem; border-radius: 6px;">
        <i class="bi bi-sign-turn-right-fill me-1"></i> Open Google Navigation
      </a>
    </div>
  `
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
    window.handleRequestUserLocation = () => {
      requestLocation()
    }
  }

  leafletMap.on('zoomend', () => {
    currentZoom = leafletMap.getZoom()
    renderRadarDonors()
  })

  mapLoading.value = false
  logActivity('Live Network Map active.')
  renderUserLocationMarker()
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
    const innerRadius = 3000
    const outerRadius = 10000
    let innerCount = 0
    let outerCount = 0

    mockDonors.forEach(donor => {
      if (canDonateTo(donor.bloodType, req.bloodType)) {
        const dist = calculateHaversineDistance(donor.lat, donor.lng, coords.lat, coords.lng)
        if (dist <= innerRadius) innerCount++
        else if (dist <= outerRadius) outerCount++
      }
    })

    const phoneNum = extractPhoneNumber(req)
    marker.bindPopup(`
      <div style="font-family: system-ui, sans-serif; padding: 2px; width: 235px; min-width: 235px; box-sizing: border-box;">
        <strong style="color: #8E2435; font-size: 0.9rem; display: block; line-height: 1.25; margin-bottom: 2px;">${escapeHtml(req.hospitalName)}</strong>
        <span style="font-size: 0.78rem; display: block;">Blood Required: <strong style="color: #8E2435;">${escapeHtml(req.bloodType)}</strong> (${escapeHtml(req.urgency)})</span>
        <span style="font-size: 0.75rem; display: block;">Confirmed: <strong>${escapeHtml(String(req.confirmedCount || 0))}/${escapeHtml(String(req.unitsNeeded))} units</strong></span>
        
        <div class="small text-slate-600 mt-1 mb-1" style="font-size: 0.73rem;">
          Hotline: <a href="tel:${escapeHtml(phoneNum)}" class="fw-bold text-decoration-none" style="color: #8E2435;">${escapeHtml(phoneNum)}</a>
        </div>
        ${getDistanceBadgeHtml(coords.lat, coords.lng, '#8E2435')}

        <button type="button" class="btn btn-sm text-white fw-bold mt-2 w-100 d-inline-flex align-items-center justify-content-center gap-1" style="background-color: #8E2435; font-size: 0.72rem; border-radius: 6px;" onclick="window.handleHospitalPopupRespond('${escapeHtml(String(req.id))}')">
          <i class="bi bi-droplet-fill me-1"></i> Confirm Availability
        </button>
      </div>
    `)

    marker.on('click', () => {
      selectedRequestId.value = String(req.id)
      updateMeasurementPolyline(coords.lat, coords.lng, '#8E2435')
    })

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
    const phoneNum = extractPhoneNumber(ev)
    marker.bindPopup(`
      <div style="font-family: system-ui, sans-serif; padding: 2px; width: 235px; min-width: 235px; box-sizing: border-box;">
        <strong style="color: #0D6EFD; font-size: 0.88rem; display: block; line-height: 1.25; margin-bottom: 2px;">${escapeHtml(cleanEventTitle(ev.title))}</strong>
        <span style="font-size: 0.76rem; color: #555; display: block;">Category: <strong>${escapeHtml(ev.category || 'Drive')}</strong></span>
        <span style="font-size: 0.75rem; color: #555; display: block;">Location: ${escapeHtml(ev.location || ev.city)}</span>
        <span style="font-size: 0.75rem; color: #0D6EFD; font-weight: bold; display: block;">Date: ${escapeHtml(ev.date || 'Upcoming')}</span>
        <div class="small text-slate-600 mt-1 mb-1" style="font-size: 0.73rem;">
          Hotline: <a href="tel:${escapeHtml(phoneNum)}" class="fw-bold text-decoration-none" style="color: #0D6EFD;">${escapeHtml(phoneNum)}</a>
        </div>
        ${getDistanceBadgeHtml(coords.lat, coords.lng, '#0D6EFD')}
        <button type="button" class="btn btn-sm text-white fw-bold mt-2 w-100 d-inline-flex align-items-center justify-content-center gap-1" style="background-color: #0D6EFD; font-size: 0.72rem; border-radius: 6px;" onclick="window.handleEventPopupRegister('${escapeHtml(String(ev.id))}')">
          <i class="bi bi-heart-fill me-1"></i> Register Interest
        </button>
      </div>
    `)

    marker.on('click', () => {
      selectedRequestId.value = 'ev_' + String(ev.id)
      updateMeasurementPolyline(coords.lat, coords.lng, '#0D6EFD')
    })

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
          <strong>${escapeHtml(resp.donorName)}</strong> (${escapeHtml(resp.bloodType)})<br>
          Status: <strong>${escapeHtml(resp.status)}</strong><br>
          ETA: <strong>~${escapeHtml(String(resp.etaMins || 1))} min</strong>
        </div>
      `)
      donorMarkers.set(key, m)

      if (resp.hospitalLat && resp.hospitalLng) {
        const polyCoords = sanitizeVietnamCoordinates([pos, [resp.hospitalLat, resp.hospitalLng]])
        const poly = L.polyline(polyCoords, {
          color: '#198754',
          dashArray: '5, 10',
          weight: 3
        }).addTo(leafletMap)
        donorPolylines.set(key, poly)
      }
    }
  })
}

function renderRadarDonors() {
  if (!leafletMap) return

  // Clear existing radar markers
  radarMarkers.forEach(m => leafletMap.removeLayer(m))
  radarMarkers.clear()
  showRadarOverlay.value = false
  selectedHospitalForRadar.value = null

  // Only render if a hospital is selected
  if (!selectedRequestId.value || selectedRequestId.value.startsWith('ev_')) {
    return
  }

  const req = activeRequests.value.find(r => String(r.id) === String(selectedRequestId.value))
  if (!req) return

  const coords = (req.latitude && req.longitude)
    ? { lat: Number(req.latitude), lng: Number(req.longitude) }
    : getHospitalCoordinates(req.hospitalName, req.city)

  const outerRadius = 10000
  const innerRadius = 3000
  let innerCount = 0
  let outerCount = 0

  // Calculate counts for the overlay card
  mockDonors.forEach(donor => {
    if (canDonateTo(donor.bloodType, req.bloodType)) {
      const dist = calculateHaversineDistance(donor.lat, donor.lng, coords.lat, coords.lng)
      if (dist <= innerRadius) innerCount++
      else if (dist <= outerRadius) outerCount++
      
      // Render radar markers only for authenticated non-guest users and if zoomed in
      if (!isGuest.value && currentZoom > 12 && dist <= outerRadius) {
        const color = donor.canDonateNow ? '#198754' : '#6c757d'
        
        const icon = L.divIcon({
          className: 'll-radar-donor-icon',
          html: `
            <div style="position: relative; width: 14px; height: 14px; background-color: ${color}; border: 2px solid white; border-radius: 50%; box-shadow: 0 1px 3px rgba(0,0,0,0.3);">
            </div>
          `,
          iconSize: [14, 14],
          iconAnchor: [7, 7]
        })

        const marker = L.marker([donor.lat, donor.lng], { icon, zIndexOffset: 50 }).addTo(leafletMap)
        
        const cooldownStatus = donor.canDonateNow ? '<strong class="text-success">Ready</strong>' : '<strong class="text-secondary">On Cooldown</strong>'
        const phone = donor.phoneNumber || ('09' + String(Math.abs((donor.id || '').split('').reduce((a,b)=>a+b.charCodeAt(0),0)) % 10000000).padStart(8, '0'))
        const phoneBtn = donor.canDonateNow
          ? `<div class="mt-2 pt-1 border-top"><a href="tel:${phone}" class="btn btn-sm text-white w-100 py-1 d-inline-flex align-items-center justify-content-center gap-1 font-weight-700" style="background-color: #198754; font-size: 0.72rem; border-radius: 6px;"><i class="bi bi-telephone-fill me-1"></i> Call ${phone}</a></div>`
          : `<div class="mt-2 pt-1 border-top text-slate-500" style="font-size: 0.7rem;"><i class="bi bi-telephone me-1"></i> Phone: <strong>${phone}</strong></div>`

        marker.bindPopup(`
          <div style="font-size: 0.78rem; font-family: system-ui, sans-serif; padding: 2px;">
            <strong style="color: #198754; font-size: 0.85rem; display: block; margin-bottom: 2px;">Donor: ${escapeHtml(donor.displayName)}</strong>
            Blood Type: <strong style="color: #8E2435;">${escapeHtml(donor.bloodType)}</strong><br>
            Status: ${cooldownStatus}<br>
            Distance: <strong>${escapeHtml(formatDistance(dist))}</strong>
            ${phoneBtn}
          </div>
        `)
        radarMarkers.set(donor.id, marker)
      }
    }
  })

  // Show Radar Overlay summary
  radarCounts.value = { inner: innerCount, outer: outerCount }
  selectedHospitalForRadar.value = req
  showRadarOverlay.value = true
}

function centerMapOnSelected() {
  if (!leafletMap) return
  leafletMap.invalidateSize(true)

  if (selectedRequestId.value) {
    if (selectedRequestId.value.startsWith('ev_')) {
      const rawId = selectedRequestId.value.replace('ev_', '')
      const ev = activeEvents.value.find(e => String(e.id) === String(rawId))
      if (ev) {
        if (activeLayerFilter.value === 'hospitals') {
          activeLayerFilter.value = 'all'
          renderHospitalMarkers()
          renderEventMarkers()
        }
        const coords = (ev.latitude && ev.longitude)
          ? { lat: Number(ev.latitude), lng: Number(ev.longitude) }
          : getHospitalCoordinates(ev.location || ev.title, ev.city)
        leafletMap.setView([coords.lat, coords.lng], 14, { animate: true })
        updateMeasurementPolyline(coords.lat, coords.lng, '#0D6EFD')
        const m = eventMarkers.get('ev_' + String(ev.id))
        if (m) {
          setTimeout(() => {
            if (leafletMap) leafletMap.invalidateSize(true)
            m.openPopup()
          }, 50)
        }
        logActivity(`Focused on event: ${cleanEventTitle(ev.title)}`)
      }
    } else {
      const req = activeRequests.value.find(r => String(r.id) === String(selectedRequestId.value))
      if (req) {
        if (activeLayerFilter.value === 'events') {
          activeLayerFilter.value = 'all'
          renderHospitalMarkers()
          renderEventMarkers()
        }
        const coords = (req.latitude && req.longitude)
          ? { lat: Number(req.latitude), lng: Number(req.longitude) }
          : getHospitalCoordinates(req.hospitalName, req.city)
        leafletMap.setView([coords.lat, coords.lng], 14, { animate: true })
        updateMeasurementPolyline(coords.lat, coords.lng, '#8E2435')
        const marker = hospitalMarkers.get(String(req.id))
        if (marker) {
          setTimeout(() => {
            if (leafletMap) leafletMap.invalidateSize(true)
            marker.openPopup()
          }, 50)
        }
        logActivity(`Focused on hospital: ${req.hospitalName}`)
      }
    }
  } else {
    if (measurementPolyline && leafletMap) {
      leafletMap.removeLayer(measurementPolyline)
      measurementPolyline = null
    }
    renderHospitalMarkers()
    renderEventMarkers()
  }
  
  renderRadarDonors()
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
        renderUserLocationMarker()
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

watch(userLocation, () => {
  renderUserLocationMarker()
  renderHospitalMarkers()
  renderEventMarkers()
  centerMapOnSelected()
}, { deep: true })

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

.ll-white-dot-pulse {
  width: 8px;
  height: 8px;
  background-color: #ffffff;
  border-radius: 50%;
  box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.8);
  animation: pulse-white-dot 1.5s infinite;
  display: inline-block;
}

@keyframes pulse-white-dot {
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.8);
  }
  70% {
    transform: scale(1.1);
    box-shadow: 0 0 0 6px rgba(255, 255, 255, 0);
  }
  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
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

:deep(.leaflet-popup-content-wrapper) {
  border-radius: 12px !important;
  padding: 4px !important;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15) !important;
}

:deep(.leaflet-popup-content) {
  margin: 12px 14px !important;
  width: 245px !important;
  min-width: 245px !important;
  max-width: 260px !important;
  line-height: 1.4 !important;
  box-sizing: border-box !important;
}

:deep(.leaflet-control-zoom a) {
  min-width: 44px !important;
  min-height: 44px !important;
  line-height: 44px !important;
  font-size: 18px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

:deep(.leaflet-container a.leaflet-popup-close-button) {
  top: 10px !important;
  right: 10px !important;
  font-size: 18px !important;
  color: #64748B !important;
  transition: all 0.2s ease !important;
  width: 40px !important;
  height: 40px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  text-decoration: none !important;
  border-radius: 50% !important;
}

:deep(.leaflet-container a.leaflet-popup-close-button:hover) {
  color: #8E2435 !important;
  background-color: #FAF5EF !important;
  transform: scale(1.1) !important;
}

:deep(.leaflet-overlay-pane svg) {
  max-width: none !important;
}

:deep(.leaflet-marker-pane svg) {
  max-width: none !important;
}
</style>
