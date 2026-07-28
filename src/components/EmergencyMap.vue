<template>
  <!-- Outer Shell: Unified 16px Rounded Container with Brand Shadow -->
  <div class="ll-emergency-map-container overflow-hidden rounded-16 border shadow-sm map-style-1">
    <EmergencyMapToolbar
      :filtered-responders-length="filteredResponders.length"
      :active-layer-filter="activeLayerFilter"
      :active-layer-filter-label="activeLayerFilterLabel"
      :active-requests="activeRequests"
      :active-events="activeEvents"
      :selected-focus-type="selectedFocusType"
      :selected-focus-text="selectedFocusText"
      @set-layer-filter="setLayerFilter"
      @select-focus="selectFocus"
      @center-map-on-selected="centerMapOnSelected"
    />

    <!-- Main Grid: Left Map Surface, Right Live Activity Panel (Tall 660px canvas, rounded bottom) -->
    <div class="row g-0 ll-map-body-grid overflow-hidden bg-white map-style-19">
      <!-- Map View Surface (Tall 660px) -->
      <div class="col-lg-8 col-12 position-relative map-style-20">
        <!-- Loading overlay -->
        <div
          v-if="mapLoading"
          class="ll-map-loader-overlay d-flex flex-column justify-content-center align-items-center"
        >
          <div class="spinner-border mb-2 map-style-6" role="status"></div>
          <span class="small text-slate-600 font-weight-500"
            >Initializing Live Response Map...</span
          >
        </div>

        <!-- Map Container Div (Height: 660px) -->
        <div class="map-style-21" id="emergency-map-surface" ref="mapElement"></div>

        <!-- Floating Map Legend Overlay -->
        <div
          class="ll-map-legend p-2 px-3 bg-white border rounded shadow-sm position-absolute bottom-0 start-0 m-3 map-style-22"
        >
          <div
            class="small fw-bold text-slate-800 d-flex justify-content-between align-items-center cursor-pointer gap-3 map-style-23"
            aria-label="Toggle Legend"
            @click.stop.prevent="showLegend = !showLegend"
          >
            <span><i class="bi bi-info-circle-fill me-1 map-style-6"></i> RADAR LEGEND</span>
            <i
              class="bi text-slate-400"
              :class="showLegend ? 'bi-chevron-down' : 'bi-chevron-up'"
            ></i>
          </div>
          <div v-if="showLegend" class="d-flex flex-column gap-1 mt-2 pt-2 border-top map-style-23">
            <div class="d-flex align-items-center gap-2">
              <svg
                class="map-style-24"
                width="18"
                height="22"
                viewBox="0 0 32 38"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M16 0C7.16 0 0 7.16 0 16C0 26 14 36.6 15.3 37.7C15.7 38.1 16.3 38.1 16.7 37.7C18 36.6 32 26 32 16C32 7.16 24.84 0 16 0Z"
                  fill="#8E2435"
                />
                <circle cx="16" cy="15" r="10" fill="#ffffff" />
                <rect x="14" y="9" width="4" height="12" rx="1" fill="#8E2435" />
                <rect x="10" y="13" width="12" height="4" rx="1" fill="#8E2435" />
              </svg>
              <span>Emergency Hospital & Priority Radar</span>
            </div>
            <div class="d-flex align-items-center gap-2">
              <svg
                class="map-style-14"
                width="18"
                height="22"
                viewBox="0 0 32 38"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M16 0C7.16 0 0 7.16 0 16C0 26 14 36.6 15.3 37.7C15.7 38.1 16.3 38.1 16.7 37.7C18 36.6 32 26 32 16C32 7.16 24.84 0 16 0Z"
                  fill="#0D6EFD"
                />
                <circle cx="16" cy="15" r="9" fill="#ffffff" />
                <path
                  d="M16 10C14.5 10 13 11.2 13 12.8C13 15 16 18 16 18C16 18 19 15 19 12.8C19 11.2 17.5 10 16 10Z"
                  fill="#0D6EFD"
                />
              </svg>
              <span>Donation Drive Event Marker</span>
            </div>
            <div class="d-flex align-items-center gap-2">
              <svg
                class="map-style-14"
                width="18"
                height="22"
                viewBox="0 0 32 38"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M16 0C7.16 0 0 7.16 0 16C0 26 14 36.6 15.3 37.7C15.7 38.1 16.3 38.1 16.7 37.7C18 36.6 32 26 32 16C32 7.16 24.84 0 16 0Z"
                  fill="#198754"
                />
                <circle cx="16" cy="15" r="9" fill="#ffffff" />
                <path
                  d="M11 17.5C10.5 17.5 10.1 17.1 10.1 16.6V15.3C10.1 14.8 10.4 14.3 10.8 14.1L13 13C13.5 12.7 14.2 12.5 14.8 12.5H17.2C17.8 12.5 18.5 12.7 19 13L21.2 14.1C21.6 14.3 21.9 14.8 21.9 15.3V16.6C21.9 17.1 21.5 17.5 21 17.5H11Z"
                  fill="#198754"
                />
              </svg>
              <span>En-Route Donor Marker (Live Location)</span>
            </div>
            <div v-if="isAdmin" class="d-flex align-items-center gap-2 mt-1">
              <span class="map-style-25"></span>
              <span>Compatible Donor (Ready)</span>
            </div>
            <div v-if="isAdmin" class="d-flex align-items-center gap-2">
              <span class="map-style-26"></span>
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

      <EmergencyMapSidebar
        :filtered-responders="filteredResponders"
        :is-admin="isAdmin"
        :selected-hospital-for-radar="selectedHospitalForRadar"
        :radar-counts="radarCounts"
        :activity-logs="activityLogs"
        :confirmed-request-ids="confirmedRequestIds"
        :selected-request-id="selectedRequestId"
        @focus-responder="focusResponder"
        @center-map-on-selected="centerMapOnSelected"
      />
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
import 'maplibre-gl/dist/maplibre-gl.css'
import '@maplibre/maplibre-gl-leaflet'
import EmergencyMapToolbar from './EmergencyMapToolbar.vue'
import EmergencyMapSidebar from './EmergencyMapSidebar.vue'
import { useAuth } from '@/composables/useAuth.js'
import { useActiveResponses } from '@/composables/useActiveResponses.js'
import { useGeolocation } from '@/composables/useGeolocation.js'
import { useGuestSession } from '@/composables/useGuestSession.js'
import { getHospitalCoordinates } from '@/data/hospitalCoordinates.js'
import {
  calculateHaversineDistance,
  calculateRoadDistance,
  formatDistance
} from '@/utils/haversine.js'
import { canDonateTo } from '@/utils/bloodCompatibility.js'
import mockDonors from '@/data/mockDonors.json'

function escapeHtml(unsafe) {
  if (typeof unsafe !== 'string') return String(unsafe || '')
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
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
  confirmedRequestIds: {
    type: Array,
    default: () => []
  },
  titleText: {
    type: String,
    default: 'Live Map'
  }
})

const emit = defineEmits(['respond', 'register-event', 'open-maps'])

const { responses: activeResponses, startListening, stopListening } = useActiveResponses()
const { userLocation, locationGranted, requestLocation } = useGeolocation()
const { getGuestSession } = useGuestSession()

const mapElement = ref(null)
const mapLoading = ref(true)
const selectedRequestId = ref('')
const activeLayerFilter = ref('all') // 'all' | 'hospitals' | 'events'
const activityLogs = ref([])

const showLegend = ref(true)
const showRadarOverlay = ref(false)
const selectedHospitalForRadar = ref(null)
const radarCounts = ref({ inner: 0, outer: 0 })

const { user, isGuest, isAdmin } = useAuth()

const currentGuestId = computed(() => (!user.value ? getGuestSession().guestId : ''))
const viewerDonorId = computed(() => user.value?.uid || currentGuestId.value)

let leafletMap = null
let vectorBaseLayer = null
let vietnamBoundaryGeojson = null
let vietnamBoundaryGeojsonPromise = null
let userLocationMarker = null
let measurementPolyline = null
let vietnamBoundaryLayer = null

// Dictionaries to manage map instances
const hospitalMarkers = new Map()
const hospitalCircles = new Map()
const eventMarkers = new Map()
const donorMarkers = new Map()
const donorPolylines = new Map()
const donorRouteCache = new Map()
const donorRouteRequestTokens = new Map()
const radarMarkers = new Map()
let currentZoom = 5

const VIETNAM_MAP_BOUNDS = [
  [6.0, 101.0],
  [24.5, 117.5]
]
const VIETNAM_DEFAULT_CENTER = [15.7, 109.4]
const VIETNAM_DEFAULT_VIEW_BOUNDS = [
  [7.6, 102.2],
  [23.6, 116.5]
]
const VIETNAM_BOUNDARY_GEOJSON_URL = '/data/vietnam-boundary-islands.geojson'
const CARTO_VOYAGER_VECTOR_STYLE_URL = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json'

async function getVietnamBoundaryGeojson() {
  if (vietnamBoundaryGeojson) return vietnamBoundaryGeojson
  if (vietnamBoundaryGeojsonPromise) return vietnamBoundaryGeojsonPromise

  vietnamBoundaryGeojsonPromise = fetch(VIETNAM_BOUNDARY_GEOJSON_URL)
    .then((response) => {
      if (!response.ok) throw new Error(`GeoJSON request failed: ${response.status}`)
      return response.json()
    })
    .then((geojson) => {
      vietnamBoundaryGeojson = geojson
      return geojson
    })
    .catch((error) => {
      vietnamBoundaryGeojsonPromise = null
      throw error
    })

  return vietnamBoundaryGeojsonPromise
}

async function hideLegacyVietnamAdministrativeBorders(vectorMap) {
  try {
    const vietnamGeometry = await getVietnamBoundaryGeojson()
    if (!vectorMap?.isStyleLoaded()) return

    const outsideVietnam = ['!', ['within', vietnamGeometry]]
    const stateFilter = [
      'all',
      ['==', ['get', 'admin_level'], 4],
      ['==', ['get', 'maritime'], 0],
      outsideVietnam
    ]
    const countyFilter = [
      'all',
      ['==', ['get', 'admin_level'], 6],
      ['==', ['get', 'maritime'], 0],
      outsideVietnam
    ]

    if (vectorMap.getLayer('boundary_state')) vectorMap.setFilter('boundary_state', stateFilter)
    if (vectorMap.getLayer('boundary_county')) vectorMap.setFilter('boundary_county', countyFilter)
  } catch (error) {
    console.warn('[EmergencyMap] Vietnam boundary filtering unavailable:', error)
  }
}

function createVectorBaseLayer() {
  if (!leafletMap) return

  if (vectorBaseLayer) {
    leafletMap.removeLayer(vectorBaseLayer)
    vectorBaseLayer = null
  }

  vectorBaseLayer = L.maplibreGL({
    style: CARTO_VOYAGER_VECTOR_STYLE_URL,
    interactive: false,
    attributionControl: false,
    updateInterval: 32,
    padding: 0.1
  }).addTo(leafletMap)

  const vectorMap = vectorBaseLayer.getMaplibreMap()
  vectorMap.on('style.load', () => {
    if (vectorMap.getLayer('watername_sea')) {
      vectorMap.setLayoutProperty('watername_sea', 'visibility', 'none')
    }
    hideLegacyVietnamAdministrativeBorders(vectorMap)
  })
}

function isEventInterested(ev) {
  if (!ev) return false
  if (user.value) return ev.likedBy?.includes(user.value.uid)
  return ev.likedBy?.includes(`guest:${getGuestSession().guestId}`)
}

function cleanEventTitle(title) {
  if (!title) return ''
  return title.split(' — ')[0].trim()
}

/**
 * Robustly extracts the phone number from emergency request or event object matching the Emergency Board.
 */
function extractPhoneNumber(entity) {
  if (!entity) return '115'
  if (entity.contactPhone && String(entity.contactPhone).trim())
    return String(entity.contactPhone).trim()
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
      <div class="map-style-38">
        <span class="map-style-39"></span>
        <div class="map-style-40">
          <i class="bi bi-person-fill text-white map-style-41"></i>
        </div>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19]
  })

  const pos = [userLocation.value.lat, userLocation.value.lng]
  userLocationMarker = L.marker(pos, { icon: userIcon, zIndexOffset: 2000 }).addTo(leafletMap)
  userLocationMarker.bindPopup(`
    <div class="map-style-42">
      <strong class="map-style-43"><i class="bi bi-geo-alt-fill me-1"></i> Your Location (Donor)</strong><br>
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
    return {
      factor: 1.45,
      text: 'Heavy Traffic (Peak)',
      color: '#DC2626',
      icon: 'bi-exclamation-circle-fill'
    }
  }
  if ((hour >= 11 && hour <= 13) || hour === 17) {
    return { factor: 1.25, text: 'Moderate Traffic', color: '#D97706', icon: 'bi-info-circle-fill' }
  }
  return {
    factor: 1.05,
    text: 'Smooth Traffic Flow',
    color: '#16A34A',
    icon: 'bi-check-circle-fill'
  }
}

/**
 * Intermediate coastal highway waypoints along Vietnam's S-shape National Highway 1A / North-South Expressway.
 * Used to force OSRM routing to stay 100% inside Vietnam territory when routing across regions.
 */
const VIETNAM_COASTAL_WAYPOINTS = [
  { name: 'Lam Dong', lat: 10.9333, lng: 108.1 },
  { name: 'Khanh Hoa', lat: 12.2451, lng: 109.1943 },
  { name: 'Gia Lai', lat: 13.782, lng: 109.2194 },
  { name: 'Quang Ngai', lat: 15.1205, lng: 108.7924 },
  { name: 'Da Nang', lat: 16.0544, lng: 108.2022 },
  { name: 'Hue', lat: 16.4637, lng: 107.5909 },
  { name: 'Quang Tri', lat: 17.4764, lng: 106.602 },
  { name: 'Nghe An', lat: 18.6734, lng: 105.6813 },
  { name: 'Thanh Hoa', lat: 19.8067, lng: 105.7851 },
  { name: 'Ninh Binh', lat: 20.2539, lng: 105.975 }
]

/**
 * Builds intermediate Vietnam highway waypoints for long-distance routes between start and target coordinates.
 */
function getVietnamDomesticWaypoints(startLat, startLng, targetLat, targetLng) {
  const minLat = Math.min(startLat, targetLat)
  const maxLat = Math.max(startLat, targetLat)

  // Find all Vietnam coastal highway cities between start and target latitudes
  let waypoints = VIETNAM_COASTAL_WAYPOINTS.filter(
    (w) => w.lat > minLat + 0.5 && w.lat < maxLat - 0.5
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

function getDonorRouteCacheKey(resp) {
  return [
    Number(resp.latitude).toFixed(5),
    Number(resp.longitude).toFixed(5),
    Number(resp.hospitalLat).toFixed(5),
    Number(resp.hospitalLng).toFixed(5)
  ].join('|')
}

function getFallbackDonorRoute(resp) {
  return sanitizeVietnamCoordinates([
    [Number(resp.latitude), Number(resp.longitude)],
    [Number(resp.hospitalLat), Number(resp.hospitalLng)]
  ])
}

function upsertDonorRoutePolyline(resp, coords) {
  if (!leafletMap) return

  const key = resp.trackingKey
  if (donorPolylines.has(key)) {
    donorPolylines.get(key).setLatLngs(coords)
    return
  }

  const poly = L.polyline(coords, {
    color: '#198754',
    dashArray: '5, 10',
    weight: 3,
    opacity: 0.95,
    lineCap: 'round',
    lineJoin: 'round'
  }).addTo(leafletMap)

  donorPolylines.set(key, poly)
}

async function updateDonorRoutePolyline(resp) {
  if (!leafletMap || !resp?.hospitalLat || !resp?.hospitalLng) return

  const donorLat = Number(resp.latitude)
  const donorLng = Number(resp.longitude)
  const hospitalLat = Number(resp.hospitalLat)
  const hospitalLng = Number(resp.hospitalLng)

  if (
    !Number.isFinite(donorLat) ||
    !Number.isFinite(donorLng) ||
    !Number.isFinite(hospitalLat) ||
    !Number.isFinite(hospitalLng)
  ) {
    return
  }

  const fallbackRoute = getFallbackDonorRoute(resp)
  upsertDonorRoutePolyline(resp, fallbackRoute)

  const routeKey = getDonorRouteCacheKey(resp)
  if (donorRouteCache.has(routeKey)) {
    upsertDonorRoutePolyline(resp, donorRouteCache.get(routeKey))
    return
  }

  const directMeters = calculateRoadDistance(donorLat, donorLng, hospitalLat, hospitalLng)
  if (directMeters > 100000) return

  const requestToken = Symbol(routeKey)
  donorRouteRequestTokens.set(resp.trackingKey, requestToken)

  try {
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${donorLng},${donorLat};${hospitalLng},${hospitalLat}?overview=full&geometries=geojson`
    const res = await fetch(osrmUrl)
    if (!res.ok) return

    const data = await res.json()
    const route = data.routes?.[0]
    if (!route?.geometry?.coordinates?.length) return

    const roadRoute = sanitizeVietnamCoordinates(
      route.geometry.coordinates.map((c) => [c[1], c[0]])
    )
    donorRouteCache.set(routeKey, roadRoute)

    if (donorRouteRequestTokens.get(resp.trackingKey) === requestToken) {
      upsertDonorRoutePolyline(resp, roadRoute)
    }
  } catch (err) {
    console.warn('[EmergencyMap] donor OSRM route fallback:', err)
  }
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
  alternativePolylines.forEach((p) => leafletMap.removeLayer(p))
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
  domesticWaypoints.forEach((w) => {
    osrmCoordString += `;${w.lng},${w.lat}`
  })
  osrmCoordString += `;${endLng},${endLat}`

  // Initial fallback line constrained to Vietnam territory
  const fallbackPoints = [
    [startLat, startLng],
    ...domesticWaypoints.map((w) => [w.lat, w.lng]),
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
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${osrmCoordString}?overview=full&geometries=geojson&alternatives=3`
    const res = await fetch(osrmUrl)
    if (res.ok) {
      const data = await res.json()
      if (data.routes && data.routes.length > 0) {
        if (measurementPolyline && leafletMap) {
          leafletMap.removeLayer(measurementPolyline)
        }

        // Render driving route strictly constrained to domestic Vietnam territory
        const rawCoords = data.routes[0].geometry.coordinates.map((c) => [c[1], c[0]])
        const roadCoordinates = sanitizeVietnamCoordinates(rawCoords)

        measurementPolyline = L.polyline(roadCoordinates, {
          color,
          weight: 5,
          opacity: 0.95,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(leafletMap)

        // Render alternative routes if they exist
        for (let i = 1; i < data.routes.length; i++) {
          const altRawCoords = data.routes[i].geometry.coordinates.map((c) => [c[1], c[0]])
          const altRoadCoordinates = sanitizeVietnamCoordinates(altRawCoords)
          const altPolyline = L.polyline(altRoadCoordinates, {
            color: '#64748b',
            weight: 4,
            opacity: 0.6,
            dashArray: '5, 8',
            lineCap: 'round',
            lineJoin: 'round'
          }).addTo(leafletMap)
          alternativePolylines.push(altPolyline)
        }
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
  const roadMeters = calculateRoadDistance(
    userLocation.value.lat,
    userLocation.value.lng,
    Number(targetLat),
    Number(targetLng)
  )
  const formatted = formatDistance(roadMeters)
  const traffic = getTrafficDensityInfo()
  const estMins = Math.max(1, Math.round((roadMeters / 1000 / 25) * 60 * traffic.factor))
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
  return props.emergencyRequests.filter((r) => r.status === 'active')
})

const activeEvents = computed(() => {
  return props.events || []
})

const filteredResponders = computed(() => {
  const confirmedIds = new Set(props.confirmedRequestIds.map(String))
  const visibleResponses = activeResponses.value.filter((response) => {
    if (selectedRequestId.value && String(response.requestId) !== String(selectedRequestId.value)) {
      return false
    }

    if (isAdmin.value) return true

    const donorId = viewerDonorId.value
    if (!donorId || String(response.donorId) !== String(donorId)) return false

    return confirmedIds.has(String(response.requestId))
  })

  return visibleResponses
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
    const ev = activeEvents.value.find((e) => String(e.id) === String(rawId))
    return ev ? cleanEventTitle(ev.title) : 'Selected Event'
  }
  const req = activeRequests.value.find((r) => String(r.id) === String(selectedRequestId.value))
  return req ? `[${req.bloodType}] ${req.hospitalName}` : 'Selected Hospital'
})

function setLayerFilter(val) {
  activeLayerFilter.value = val
  renderHospitalMarkers()
  renderEventMarkers()
}

function selectFocus(val) {
  selectedRequestId.value = val
  centerMapOnSelected()
}

function formatMeters(meters) {
  return formatDistance(meters)
}

function logActivity(text) {
  const time = new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
  activityLogs.value.unshift({ time, text })
  if (activityLogs.value.length > 5) activityLogs.value.pop()
}

function truncateText(text, maxLen = 20) {
  if (!text) return ''
  if (text.length <= maxLen) return text
  return text.substring(0, maxLen - 3) + '...'
}

async function loadVietnamBoundaryLayer() {
  if (!leafletMap) return

  try {
    const geojson = await getVietnamBoundaryGeojson()
    if (!leafletMap) return

    if (vietnamBoundaryLayer) {
      leafletMap.removeLayer(vietnamBoundaryLayer)
      vietnamBoundaryLayer = null
    }

    vietnamBoundaryLayer = L.geoJSON(geojson, {
      style(feature) {
        const isArchipelago = feature?.properties?.LayerType === 'archipelago'

        return {
          color: isArchipelago ? '#9a7d65' : '#b07d76',
          weight: isArchipelago ? 1.15 : 1,
          opacity: isArchipelago ? 0.95 : 0.9,
          fillColor: isArchipelago ? '#f8f4ec' : '#f6f0ea',
          fillOpacity: isArchipelago ? 0.95 : 0,
          dashArray: null,
          interactive: true
        }
      },
      onEachFeature(feature, layer) {
        const note = feature?.properties?.Note

        if (note) {
          layer.bindPopup(`
            <div class="map-style-42">
              <strong class="map-style-43">${note}</strong><br>
              <span class="text-slate-600">GeoJSON administrative boundary layer.</span>
            </div>
          `)
        }
      }
    }).addTo(leafletMap)

    vietnamBoundaryLayer.bringToFront()
  } catch (err) {
    console.warn('[EmergencyMap] Vietnam GeoJSON boundary unavailable:', err)
  }
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
    vectorBaseLayer = null
  }
  if (!mapElement.value) return

  mapElement.value.innerHTML = ''

  leafletMap = L.map(mapElement.value, {
    center: VIETNAM_DEFAULT_CENTER,
    zoom: 5,
    minZoom: 5,
    zoomControl: true,
    attributionControl: false,
    maxBounds: VIETNAM_MAP_BOUNDS,
    maxBoundsViscosity: 1.0
  })

  leafletMap.setMaxBounds(VIETNAM_MAP_BOUNDS)
  leafletMap.fitBounds(VIETNAM_DEFAULT_VIEW_BOUNDS, { padding: [18, 18] })
  createVectorBaseLayer()

  if (typeof window !== 'undefined') {
    window.handleHospitalPopupRespond = (reqId) => {
      emit('respond', reqId)
    }
    window.handleEventPopupRegister = (eventId) => {
      emit('register-event', eventId)
    }
    window.handleRequestUserLocation = async () => {
      try {
        await requestLocation()
      } catch (err) {
        alert(locationError.value || 'Could not enable location.')
      }
    }

    window.handleHospitalPopupOpenMaps = (reqId) => {
      emit('open-maps', reqId)
    }
  }

  leafletMap.on('zoomend', () => {
    currentZoom = leafletMap.getZoom()
    renderRadarDonors()
  })

  mapLoading.value = false
  logActivity('Live Network Map active.')
  loadVietnamBoundaryLayer()
  renderUserLocationMarker()
  renderHospitalMarkers()
  renderEventMarkers()
  renderDonorMarkers()

  nextTick(() => {
    if (leafletMap) {
      leafletMap.invalidateSize(true)
    }
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

function cleanupMapGlobals() {
  if (typeof window === 'undefined') return

  delete window.handleHospitalPopupRespond
  delete window.handleEventPopupRegister
  delete window.handleRequestUserLocation
  delete window.handleHospitalPopupOpenMaps
}

/**
 * Renders Hospital Emergency Markers & Radar Circles in Leaflet.
 */
function renderHospitalMarkers() {
  if (!leafletMap) return

  hospitalMarkers.forEach((m) => leafletMap.removeLayer(m))
  hospitalCircles.forEach((cArray) => cArray.forEach((c) => leafletMap.removeLayer(c)))
  hospitalMarkers.clear()
  hospitalCircles.clear()

  if (activeLayerFilter.value === 'events') return

  const bounds = L.latLngBounds([])
  let count = 0

  activeRequests.value.forEach((req) => {
    const coords =
      req.latitude && req.longitude
        ? { lat: Number(req.latitude), lng: Number(req.longitude) }
        : getHospitalCoordinates(req.hospitalName, req.city)

    const pos = [coords.lat, coords.lng]
    bounds.extend(pos)
    count++

    const urgencyColor =
      req.urgency === 'critical' ? '#8E2435' : req.urgency === 'urgent' ? '#B45309' : '#D99B26'

    const icon = L.divIcon({
      className: 'll-hospital-leaflet-icon',
      html: `
        <div class="map-style-50">
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

    mockDonors.forEach((donor) => {
      if (canDonateTo(donor.bloodType, req.bloodType)) {
        const dist = calculateHaversineDistance(donor.lat, donor.lng, coords.lat, coords.lng)
        if (dist <= innerRadius) innerCount++
        else if (dist <= outerRadius) outerCount++
      }
    })

    const phoneNum = extractPhoneNumber(req)
    marker.bindPopup(`
      <div class="map-style-51">
        <strong class="map-style-52">${escapeHtml(req.hospitalName)}</strong>
        <span class="map-style-53">Blood Required: <strong class="map-style-54">${escapeHtml(req.bloodType)}</strong> (${escapeHtml(req.urgency)})</span>
        <span class="map-style-55">Confirmed: <strong>${escapeHtml(String(req.confirmedCount || 0))}/${escapeHtml(String(req.unitsNeeded))} units</strong></span>
        
        <div class="small text-slate-600 mt-1 mb-1 map-style-56">
          Hotline: <a href="tel:${escapeHtml(phoneNum)}" class="fw-bold text-decoration-none map-style-54">${escapeHtml(phoneNum)}</a>
        </div>
        ${getDistanceBadgeHtml(coords.lat, coords.lng, '#8E2435')}

        ${
          props.confirmedRequestIds.includes(String(req.id))
            ? `<div class="btn btn-sm text-white fw-bold mt-2 w-100 d-inline-flex align-items-center justify-content-center gap-1" style="background-color: #198754; font-size: 0.72rem; border-radius: 6px; cursor: default; pointer-events: none;">
               <i class="bi bi-check-circle-fill me-1"></i> Confirmed
             </div>`
            : `<button type="button" class="btn btn-sm text-white fw-bold mt-2 w-100 d-inline-flex align-items-center justify-content-center gap-1 map-style-57" onclick="window.handleHospitalPopupRespond('${escapeHtml(String(req.id))}')">
               <i class="bi bi-droplet-fill me-1"></i> Confirm Availability
             </button>`
        }
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

  if (selectedRequestId.value && !selectedRequestId.value.startsWith('ev_')) {
    setTimeout(() => centerMapOnSelected(), 50)
  }
}

/**
 * Renders Donation Event Markers in Leaflet with Register Interest button in popup.
 */
function renderEventMarkers() {
  if (!leafletMap) return

  eventMarkers.forEach((m) => leafletMap.removeLayer(m))
  eventMarkers.clear()

  if (activeLayerFilter.value === 'hospitals') return

  activeEvents.value.forEach((ev) => {
    const coords =
      ev.latitude && ev.longitude
        ? { lat: Number(ev.latitude), lng: Number(ev.longitude) }
        : getHospitalCoordinates(ev.location || ev.title, ev.city)

    const pos = [coords.lat, coords.lng]

    const icon = L.divIcon({
      className: 'll-event-leaflet-icon',
      html: `
        <div class="map-style-58">
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
      <div class="map-style-51">
        <strong class="map-style-59">${escapeHtml(cleanEventTitle(ev.title))}</strong>
        <span class="map-style-60">Category: <strong>${escapeHtml(ev.category || 'Drive')}</strong></span>
        <span class="map-style-61">Location: ${escapeHtml(ev.location || ev.city)}</span>
        <span class="map-style-62">Date: ${escapeHtml(ev.date || 'Upcoming')}</span>
        <div class="small text-slate-600 mt-1 mb-1 map-style-56">
          Hotline: <a href="tel:${escapeHtml(phoneNum)}" class="fw-bold text-decoration-none map-style-63">${escapeHtml(phoneNum)}</a>
        </div>
        ${getDistanceBadgeHtml(coords.lat, coords.lng, '#0D6EFD')}
        <button type="button" class="btn btn-sm text-white fw-bold mt-2 w-100 d-inline-flex align-items-center justify-content-center gap-1 ${isEventInterested(ev) ? 'map-style-64-active' : 'map-style-64'}" onclick="window.handleEventPopupRegister('${escapeHtml(String(ev.id))}')">
          <i class="bi ${isEventInterested(ev) ? 'bi-check-circle-fill' : 'bi-heart-fill'} me-1"></i> Interested
        </button>
      </div>
    `)

    marker.on('click', () => {
      selectedRequestId.value = 'ev_' + String(ev.id)
      updateMeasurementPolyline(coords.lat, coords.lng, '#0D6EFD')
    })

    eventMarkers.set('ev_' + String(ev.id), marker)
  })

  if (selectedRequestId.value && selectedRequestId.value.startsWith('ev_')) {
    setTimeout(() => centerMapOnSelected(), 50)
  }
}

/**
 * Renders Donor Markers in Leaflet.
 */
function renderDonorMarkers() {
  if (!leafletMap) return

  const currentKeys = new Set(filteredResponders.value.map((r) => r.trackingKey))

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
      donorRouteRequestTokens.delete(key)
    }
  })

  filteredResponders.value.forEach((resp) => {
    const pos = [resp.latitude, resp.longitude]
    const key = resp.trackingKey

    if (donorMarkers.has(key)) {
      const m = donorMarkers.get(key)
      m.setLatLng(pos)
      updateDonorRoutePolyline(resp)
    } else {
      const icon = L.divIcon({
        className: 'll-donor-leaflet-icon',
        html: `
          <div class="map-style-65">
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
        <div class="map-style-66">
          <strong>${escapeHtml(resp.donorName)}</strong> (${escapeHtml(resp.bloodType)})<br>
          Status: <strong>${escapeHtml(resp.status)}</strong><br>
          ETA: <strong>~${escapeHtml(String(resp.etaMins || 1))} min</strong>
        </div>
      `)
      donorMarkers.set(key, m)

      if (resp.hospitalLat && resp.hospitalLng) {
        updateDonorRoutePolyline(resp)
      }
    }
  })
}

function renderRadarDonors() {
  if (!leafletMap) return

  // Clear existing radar markers
  radarMarkers.forEach((m) => leafletMap.removeLayer(m))
  radarMarkers.clear()
  showRadarOverlay.value = false
  selectedHospitalForRadar.value = null

  // Only render if a hospital is selected
  if (!selectedRequestId.value || selectedRequestId.value.startsWith('ev_')) {
    return
  }

  const req = activeRequests.value.find((r) => String(r.id) === String(selectedRequestId.value))
  if (!req) return

  const coords =
    req.latitude && req.longitude
      ? { lat: Number(req.latitude), lng: Number(req.longitude) }
      : getHospitalCoordinates(req.hospitalName, req.city)

  const outerRadius = 10000
  const innerRadius = 3000
  let innerCount = 0
  let outerCount = 0

  // Calculate counts for the overlay card
  let renderedCount = 0
  mockDonors.forEach((donor) => {
    if (canDonateTo(donor.bloodType, req.bloodType)) {
      const dist = calculateHaversineDistance(donor.lat, donor.lng, coords.lat, coords.lng)
      if (dist <= innerRadius) innerCount++
      else if (dist <= outerRadius) outerCount++

      // Render radar markers only for Admin users and if zoomed in
      if (isAdmin.value && currentZoom > 12 && dist <= outerRadius && renderedCount < 100) {
        renderedCount++
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

        const marker = L.marker([donor.lat, donor.lng], { icon, zIndexOffset: 50 }).addTo(
          leafletMap
        )

        const cooldownStatus = donor.canDonateNow
          ? '<strong class="text-success">Ready</strong>'
          : '<strong class="text-secondary">On Cooldown</strong>'
        const phone =
          donor.phoneNumber ||
          '09' +
            String(
              Math.abs((donor.id || '').split('').reduce((a, b) => a + b.charCodeAt(0), 0)) %
                10000000
            ).padStart(8, '0')
        const safePhone = escapeHtml(phone)
        const phoneBtn = donor.canDonateNow
          ? `<div class="mt-2 pt-1 border-top"><a href="tel:${safePhone}" class="btn btn-sm text-white w-100 py-1 d-inline-flex align-items-center justify-content-center gap-1 font-weight-700 map-style-68"><i class="bi bi-telephone-fill me-1"></i> Call ${safePhone}</a></div>`
          : `<div class="mt-2 pt-1 border-top text-slate-500 map-style-69"><i class="bi bi-telephone me-1"></i> Phone: <strong>${safePhone}</strong></div>`

        marker.bindPopup(`
          <div class="map-style-70">
            <strong class="map-style-71">Donor: ${escapeHtml(donor.displayName)}</strong>
            Blood Type: <strong class="map-style-54">${escapeHtml(donor.bloodType)}</strong><br>
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
      const ev = activeEvents.value.find((e) => String(e.id) === String(rawId))
      if (ev) {
        if (activeLayerFilter.value === 'hospitals') {
          activeLayerFilter.value = 'all'
          renderHospitalMarkers()
          renderEventMarkers()
        }
        const coords =
          ev.latitude && ev.longitude
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
      const req = activeRequests.value.find((r) => String(r.id) === String(selectedRequestId.value))
      if (req) {
        if (activeLayerFilter.value === 'events') {
          activeLayerFilter.value = 'all'
          renderHospitalMarkers()
          renderEventMarkers()
        }
        const coords =
          req.latitude && req.longitude
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

watch(
  userLocation,
  () => {
    renderUserLocationMarker()
    renderHospitalMarkers()
    renderEventMarkers()
    centerMapOnSelected()
  },
  { deep: true }
)

watch(
  activeRequests,
  () => {
    renderHospitalMarkers()
  },
  { deep: true }
)

watch(
  () => props.confirmedRequestIds,
  () => {
    renderHospitalMarkers()
  },
  { deep: true }
)

watch(
  activeEvents,
  () => {
    renderEventMarkers()
  },
  { deep: true }
)

watch(
  filteredResponders,
  () => {
    renderDonorMarkers()
  },
  { deep: true }
)

watch(selectedRequestId, () => {
  centerMapOnSelected()
})

watch(activeLayerFilter, () => {
  renderHospitalMarkers()
  renderEventMarkers()
})

watch(
  () => props.isVisible,
  (visible) => {
    if (visible) {
      refreshMapSize()
    }
  },
  { immediate: true }
)

onMounted(() => {
  startListening()
  initMapEngine()
})

onUnmounted(() => {
  stopListening()
  cleanupMapGlobals()
  if (leafletMap) {
    try {
      leafletMap.remove()
    } catch (e) {
      // ignore
    }
    leafletMap = null
  }
  vectorBaseLayer = null
})

defineExpose({
  focusRequest,
  centerMapOnSelected
})
</script>

<style>
.map-style-1 {
  position: relative;
  z-index: 1;
  border-color: #eae2df !important;
  border-radius: 16px !important;
  box-shadow: 0 10px 30px rgba(142, 36, 53, 0.06) !important;
}
.map-style-2 {
  border-color: #eae2df;
  position: relative;
  z-index: 1050;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
}
.map-style-3 {
  font-size: 0.76rem;
  padding: 0.48rem 0.95rem;
  line-height: 1;
  background-color: #8e2435;
  color: #ffffff;
  font-weight: 700;
  letter-spacing: 0.5px;
}
.map-style-4 {
  opacity: 0.4;
  font-weight: 300;
}
.map-style-5 {
  min-width: 140px;
  min-height: 38px;
  font-size: 0.82rem;
  background-color: #faf5ef;
  color: #2b2225;
  border: 1px solid #eae2df;
  border-radius: 8px;
}
.map-style-6 {
  color: #8e2435;
}
.map-style-7 {
  color: #0d6efd;
}
.map-style-8 {
  font-size: 0.72rem;
  flex-shrink: 0;
}
.map-style-9 {
  min-width: 165px;
  z-index: 2000;
}
.map-style-10 {
  min-width: 170px;
  max-width: 220px;
  min-height: 38px;
  font-size: 0.82rem;
  background-color: #faf5ef;
  color: #2b2225;
  border: 1px solid #eae2df;
  border-radius: 8px;
}
.map-style-11 {
  max-width: 170px;
}
.map-style-12 {
  color: #8e2435;
  flex-shrink: 0;
}
.map-style-13 {
  color: #0d6efd;
  flex-shrink: 0;
}
.map-style-14 {
  flex-shrink: 0;
}
.map-style-15 {
  min-width: 260px;
  max-height: 340px;
  overflow-y: auto;
  z-index: 2000;
}
.map-style-16 {
  font-size: 0.68rem;
  color: #8e2435;
}
.map-style-17 {
  font-size: 0.68rem;
  color: #0d6efd;
}
.map-style-18 {
  min-height: 38px;
  padding: 0 0.9rem;
  font-size: 0.82rem;
  background-color: #faf5ef;
  color: #8e2435;
  border: 1px solid #eae2df;
  border-radius: 8px;
}
.map-style-19 {
  position: relative;
  z-index: 1;
  border-bottom-left-radius: 16px;
  border-bottom-right-radius: 16px;
}
.map-style-20 {
  height: 660px;
  min-height: 660px;
  border-bottom-left-radius: 16px;
  overflow: hidden;
}
.map-style-21 {
  width: 100%;
  height: 660px;
  min-height: 660px;
  position: relative;
  z-index: 1;
  background-color: #f8f9fa;
}
.map-style-22 {
  z-index: 1000;
  max-width: 290px;
}
.map-style-23 {
  font-size: 0.72rem;
}
.map-style-24 {
  flex-shrink: 0;
  max-width: none;
}
.map-style-25 {
  display: inline-block;
  width: 14px;
  height: 14px;
  background-color: #198754;
  border: 2px solid white;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  margin-left: 2px;
  margin-right: 2px;
}
.map-style-26 {
  display: inline-block;
  width: 14px;
  height: 14px;
  background-color: #6c757d;
  border: 2px solid white;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  margin-left: 2px;
  margin-right: 2px;
}
.map-style-27 {
  height: 660px;
  overflow-y: auto;
  border-bottom-right-radius: 16px;
}
.map-style-28 {
  font-size: 0.9rem;
  color: #8e2435;
}
.map-style-29 {
  font-size: 0.68rem;
}
.map-style-30 {
  font-size: 0.83rem;
}
.map-style-31 {
  font-size: 0.65rem;
  background-color: #8e2435;
}
.map-style-32 {
  font-size: 0.73rem;
}
.map-style-33 {
  font-size: 0.75rem;
}
.map-style-34 {
  font-size: 0.88rem;
}
.map-style-35 {
  font-size: 0.78rem;
}
.map-style-36 {
  font-size: 0.85rem;
}
.map-style-37 {
  font-size: 0.65rem;
  text-transform: uppercase;
}
.map-style-38 {
  position: relative;
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  filter: drop-shadow(0 3px 6px rgba(25, 135, 84, 0.4));
}
.map-style-39 {
  position: absolute;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background-color: rgba(25, 135, 84, 0.25);
  animation: pulse-white-dot 2s infinite;
}
.map-style-40 {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: #198754;
  border: 3px solid #ffffff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}
.map-style-41 {
  font-size: 13px;
}
.map-style-42 {
  font-family: system-ui, sans-serif;
  padding: 4px;
  font-size: 0.8rem;
}
.map-style-43 {
  color: #198754;
}

.map-style-50 {
  position: relative;
  width: 32px;
  height: 38px;
  filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.3));
  cursor: pointer;
}
.map-style-51 {
  font-family: system-ui, sans-serif;
  padding: 2px;
  width: 235px;
  min-width: 235px;
  box-sizing: border-box;
}
.map-style-52 {
  color: #8e2435;
  font-size: 0.9rem;
  display: block;
  line-height: 1.25;
  margin-bottom: 2px;
}
.map-style-53 {
  font-size: 0.78rem;
  display: block;
}
.map-style-54 {
  color: #8e2435;
}
.map-style-55 {
  font-size: 0.75rem;
  display: block;
}
.map-style-56 {
  font-size: 0.73rem;
}
.map-style-57 {
  background-color: #8e2435;
  font-size: 0.72rem;
  border-radius: 6px;
  color: white !important;
}
.map-style-57:hover {
  background-color: #6a1a27 !important;
  color: white !important;
}
.map-style-58 {
  position: relative;
  width: 30px;
  height: 36px;
  filter: drop-shadow(0 3px 6px rgba(13, 110, 253, 0.35));
  cursor: pointer;
}
.map-style-59 {
  color: #0d6efd;
  font-size: 0.88rem;
  display: block;
  line-height: 1.25;
  margin-bottom: 2px;
}
.map-style-60 {
  font-size: 0.76rem;
  color: #555;
  display: block;
}
.map-style-61 {
  font-size: 0.75rem;
  color: #555;
  display: block;
}
.map-style-62 {
  font-size: 0.75rem;
  color: #0d6efd;
  font-weight: bold;
  display: block;
}
.map-style-63 {
  color: #0d6efd;
}
.map-style-64 {
  background-color: #0d6efd;
  border-color: #0d6efd;
  font-size: 0.72rem;
  border-radius: 6px;
  min-height: 36px;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    transform 0.15s ease,
    box-shadow 0.15s ease;
}
.map-style-64:hover,
.map-style-64:focus {
  background-color: #0b5ed7 !important;
  border-color: #0b5ed7 !important;
  color: #ffffff !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(13, 110, 253, 0.18);
}
.map-style-64-active {
  background-color: #198754;
  border-color: #198754;
  font-size: 0.72rem;
  border-radius: 6px;
  min-height: 36px;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    transform 0.15s ease,
    box-shadow 0.15s ease;
}
.map-style-64-active:hover,
.map-style-64-active:focus {
  background-color: #157347 !important;
  border-color: #157347 !important;
  color: #ffffff !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(25, 135, 84, 0.18);
}
.map-style-65 {
  position: relative;
  width: 30px;
  height: 36px;
  filter: drop-shadow(0 3px 6px rgba(25, 135, 84, 0.4));
  cursor: pointer;
}
.map-style-66 {
  font-size: 0.78rem;
}

.map-style-68 {
  background-color: #198754;
  font-size: 0.72rem;
  border-radius: 6px;
}
.map-style-69 {
  font-size: 0.7rem;
}
.map-style-70 {
  font-size: 0.78rem;
  font-family: system-ui, sans-serif;
  padding: 2px;
}
.map-style-71 {
  color: #198754;
  font-size: 0.85rem;
  display: block;
  margin-bottom: 2px;
}
</style>

<style>
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
  border: 1.5px solid #8e2435;
}

.ll-legend-circle--10k {
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: rgba(142, 36, 53, 0.08);
  border: 1px dashed #8e2435;
}

.cursor-pointer {
  cursor: pointer;
}

.hover-lift {
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}
.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.leaflet-popup-content-wrapper {
  border-radius: 12px !important;
  padding: 4px !important;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15) !important;
}

.leaflet-popup-content {
  margin: 12px 14px !important;
  width: 245px !important;
  min-width: 245px !important;
  max-width: 260px !important;
  line-height: 1.4 !important;
  box-sizing: border-box !important;
}

.leaflet-control-zoom a {
  min-width: 44px !important;
  min-height: 44px !important;
  line-height: 44px !important;
  font-size: 18px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.leaflet-container a.leaflet-popup-close-button {
  top: 10px !important;
  right: 10px !important;
  font-size: 18px !important;
  color: #64748b !important;
  transition: all 0.2s ease !important;
  width: 40px !important;
  height: 40px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  text-decoration: none !important;
  border-radius: 50% !important;
}

.leaflet-container a.leaflet-popup-close-button:hover {
  color: #8e2435 !important;
  background-color: #faf5ef !important;
  transform: scale(1.1) !important;
}

@media (max-width: 576px) {
  .leaflet-popup-content-wrapper {
    padding: 2px !important;
    border-radius: 10px !important;
  }
  .leaflet-popup-content {
    margin: 8px 10px !important;
    width: 210px !important;
    min-width: 195px !important;
    max-width: 220px !important;
    font-size: 0.78rem !important;
  }
  .leaflet-popup-content button,
  .leaflet-popup-content .btn {
    padding: 0.35rem 0.5rem !important;
    font-size: 0.78rem !important;
    min-height: 36px !important;
  }
  .leaflet-control-zoom {
    margin-top: 8px !important;
    margin-left: 8px !important;
  }
  .leaflet-control-zoom a {
    min-width: 32px !important;
    min-height: 32px !important;
    line-height: 32px !important;
    font-size: 14px !important;
  }
  .leaflet-container a.leaflet-popup-close-button {
    top: 6px !important;
    right: 6px !important;
    width: 28px !important;
    height: 28px !important;
    font-size: 14px !important;
  }
}

.leaflet-overlay-pane svg {
  max-width: none !important;
}

.leaflet-marker-pane svg {
  max-width: none !important;
}

</style>
