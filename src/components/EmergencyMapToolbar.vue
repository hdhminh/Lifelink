<template>
  <!-- Map Header Status Toolbar (LifeLink Brand Wine Red Surface with Rounded 16px Top Corners) -->
  <div
    class="ll-map-toolbar d-flex flex-wrap justify-content-between align-items-center gap-2 p-3 px-4 border-bottom bg-white map-style-2"
  >
    <div class="d-flex align-items-center">
      <!-- Unified Sleek Wine-Red LIVE Pill Badge -->
      <span
        class="badge rounded-pill d-inline-flex align-items-center gap-2 shadow-xs map-style-3 ll-live-badge"
      >
        <span class="ll-white-dot-pulse"></span>
        <span>LIVE</span>
        <span class="map-style-4 ll-live-divider">|</span>
        <span class="ll-live-text">{{ filteredRespondersLength }} ACTIVE RESPONDERS</span>
      </span>
    </div>

    <button
      v-if="showMobileResponseButton"
      type="button"
      class="ll-mobile-response-toolbar-btn d-md-none"
      :aria-label="isMobileResponseOpen ? 'Close live response status' : 'Open live response status'"
      @click="$emit('open-mobile-response')"
    >
      <i class="bi bi-people-fill"></i>
      <span>{{ filteredRespondersLength }} En Route</span>
      <i :class="isMobileResponseOpen ? 'bi bi-chevron-down' : 'bi bi-chevron-up'"></i>
    </button>

    <div class="ll-map-toolbar-controls d-flex align-items-center gap-2 ms-auto">
      <!-- Custom Layer Filter Dropdown -->
      <div class="dropdown position-relative">
        <button
          class="btn btn-sm d-inline-flex align-items-center justify-content-between gap-2 shadow-xs map-style-5"
          type="button"
          aria-label="Filter map layers by hospitals or events"
          @click.stop="toggleLayerDropdown"
        >
          <span class="d-inline-flex align-items-center text-truncate">
            <i
              v-if="activeLayerFilter === 'all'"
              class="bi bi-layers-fill text-slate-600 me-2"
            ></i>
            <i
              v-else-if="activeLayerFilter === 'hospitals'"
              class="bi bi-hospital me-2 map-style-6"
            ></i>
            <i v-else class="bi bi-calendar-event me-2 map-style-7"></i>
            {{ activeLayerFilterLabel }}
          </span>
          <i
            class="bi bi-chevron-down text-slate-400 ms-1 map-style-8"
          ></i>
        </button>
        <ul
          v-if="showLayerDropdown"
          class="dropdown-menu show shadow-md p-1 mt-1 position-absolute end-0 map-style-9"
        >
          <li>
            <button
              type="button"
              class="dropdown-item small d-flex align-items-center py-2"
              aria-label="Show all location layers"
              @click="setLayerFilter('all')"
            >
              <i class="bi bi-layers-fill text-slate-600 me-2"></i> All Locations
            </button>
          </li>
          <li>
            <button
              type="button"
              class="dropdown-item small d-flex align-items-center py-2"
              aria-label="Filter by emergency hospitals"
              @click="setLayerFilter('hospitals')"
            >
              <i class="bi bi-hospital me-2 map-style-6"></i> Hospitals ({{
                activeRequests.length
              }})
            </button>
          </li>
          <li>
            <button
              type="button"
              class="dropdown-item small d-flex align-items-center py-2"
              aria-label="Filter by donation events"
              @click="setLayerFilter('events')"
            >
              <i class="bi bi-calendar-event me-2 map-style-7"></i> Events ({{
                activeEvents.length
              }})
            </button>
          </li>
        </ul>
      </div>

      <!-- Custom Location Focus Dropdown -->
      <div class="dropdown position-relative">
        <button
          class="btn btn-sm d-inline-flex align-items-center justify-content-between gap-2 shadow-xs map-style-10"
          type="button"
          aria-label="Select focus location on map"
          @click.stop="toggleFocusDropdown"
        >
          <span class="d-inline-flex align-items-center text-truncate map-style-11">
            <i
              v-if="selectedFocusType === 'hospital'"
              class="bi bi-hospital me-2 map-style-12"
            ></i>
            <i
              v-else-if="selectedFocusType === 'event'"
              class="bi bi-calendar-event me-2 map-style-13"
            ></i>
            <i v-else class="bi bi-geo-alt me-2 text-slate-400 map-style-14"></i>
            <span class="text-truncate">{{ selectedFocusText }}</span>
          </span>
          <i
            class="bi bi-chevron-down text-slate-400 ms-1 map-style-8"
          ></i>
        </button>

        <div
          v-if="showFocusDropdown"
          class="dropdown-menu show shadow-md p-1 mt-1 position-absolute end-0 map-style-15"
        >
          <button
            type="button"
            class="dropdown-item small py-2 text-slate-600 border-bottom"
            aria-label="Show all locations"
            @click="selectFocus('')"
          >
            <i class="bi bi-geo-alt me-2"></i> All Locations (Default View)
          </button>

          <div
            class="dropdown-header text-uppercase font-weight-700 mt-1 mb-1 map-style-16"
          >
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
            <i class="bi bi-hospital me-2 map-style-12"></i>
            <span class="text-truncate">[{{ req.bloodType }}] {{ req.hospitalName }}</span>
          </button>

          <div
            class="dropdown-header text-uppercase font-weight-700 mt-2 mb-1 map-style-17"
          >
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
            <i class="bi bi-calendar-event me-2 map-style-13"></i>
            <span class="text-truncate">{{ cleanEventTitle(ev.title) }}</span>
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  filteredRespondersLength: { type: Number, default: 0 },
  activeLayerFilter: { type: String, default: 'all' },
  activeLayerFilterLabel: { type: String, default: 'All Locations' },
  activeRequests: { type: Array, default: () => [] },
  activeEvents: { type: Array, default: () => [] },
  selectedFocusType: { type: String, default: 'none' },
  selectedFocusText: { type: String, default: 'Select Location Focus' },
  showMobileResponseButton: { type: Boolean, default: false },
  isMobileResponseOpen: { type: Boolean, default: false }
})

const emit = defineEmits(['set-layer-filter', 'select-focus', 'open-mobile-response'])

const showLayerDropdown = ref(false)
const showFocusDropdown = ref(false)

function toggleLayerDropdown() {
  showLayerDropdown.value = !showLayerDropdown.value
  showFocusDropdown.value = false
}

function toggleFocusDropdown() {
  showFocusDropdown.value = !showFocusDropdown.value
  showLayerDropdown.value = false
}

function setLayerFilter(val) {
  emit('set-layer-filter', val)
  showLayerDropdown.value = false
}

function selectFocus(val) {
  emit('select-focus', val)
  showFocusDropdown.value = false
}

function cleanEventTitle(title) {
  if (!title) return ''
  return title.split(' — ')[0].trim()
}

function closeDropdownsOnClickOutside(e) {
  if (!e.target.closest('.dropdown')) {
    showLayerDropdown.value = false
    showFocusDropdown.value = false
  }
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    document.addEventListener('click', closeDropdownsOnClickOutside)
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    document.removeEventListener('click', closeDropdownsOnClickOutside)
  }
})
</script>

<style scoped>
@media (max-width: 767px) {
  .ll-map-toolbar {
    padding: 0.5rem 0.75rem !important;
    gap: 0.5rem !important;
    flex-wrap: wrap !important;
    overflow: visible;
  }
  .ll-map-toolbar > .d-flex:first-child {
    flex: 0 0 auto;
  }
  .ll-mobile-response-toolbar-btn {
    box-sizing: border-box !important;
    border: 0 !important;
    border-radius: 999px !important;
    width: auto !important;
    height: 23px !important;
    min-height: 23px !important;
    max-height: 23px !important;
    padding: 0 0.55rem !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 4px !important;
    background: #8E2435 !important;
    color: #ffffff !important;
    box-shadow: 0 2px 8px rgba(142, 36, 53, 0.25) !important;
    font-size: 0.72rem !important;
    font-weight: 700 !important;
    line-height: 1 !important;
    letter-spacing: 0.03em !important;
    white-space: nowrap !important;
    vertical-align: middle !important;
    outline: none !important;
    flex: 0 0 auto !important;
  }
  .ll-mobile-response-toolbar-btn:focus,
  .ll-mobile-response-toolbar-btn:focus-visible,
  .ll-mobile-response-toolbar-btn:active {
    outline: none !important;
    box-shadow: 0 2px 8px rgba(142, 36, 53, 0.25) !important;
  }
  .ll-mobile-response-toolbar-btn i {
    font-size: 0.68rem !important;
    line-height: 1 !important;
  }
  .ll-map-toolbar-controls {
    flex: 1 1 100%;
    min-width: 0;
    margin-left: 0 !important;
    display: grid !important;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.35fr);
    gap: 0.45rem !important;
    align-items: stretch !important;
  }
  .ll-live-divider,
  .ll-live-text,
  .ll-recenter-text {
    display: none !important;
  }
  .btn-sm {
    width: 100%;
    min-width: 0 !important;
    max-width: 100% !important;
    min-height: 36px !important;
    font-size: 0.75rem !important;
    padding: 0.3rem 0.5rem !important;
    white-space: nowrap;
  }
  .btn-sm .text-truncate {
    max-width: 100%;
  }
  .dropdown {
    min-width: 0;
  }
  .map-style-15 {
    left: auto !important;
    right: 0 !important;
    max-width: calc(100vw - 48px);
  }
}

@media (max-width: 420px) {
  .ll-map-toolbar-controls {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr);
    flex-basis: 100%;
  }
}
</style>
