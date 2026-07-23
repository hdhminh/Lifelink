/**
 * useGeolocation.js
 *
 * Provides reactive geolocation state shared across all components.
 * Persists the user's permission decision in localStorage so the browser
 * prompt is only shown once per session.
 */

import { ref } from 'vue'

/** @type {import('vue').Ref<{lat: number, lng: number}|null>} User's last known coordinates. */
const userLocation = ref(null)

/** @type {import('vue').Ref<boolean>} Whether the user has granted geolocation permission. */
const locationGranted = ref(false)

/** @type {import('vue').Ref<string|null>} Human-readable error message, if any. */
const locationError = ref(null)

// Automatically attempt to fetch location on initial load if permission was previously granted
if (typeof window !== 'undefined' && localStorage.getItem('ll_geo_granted') === 'true') {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      userLocation.value = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      }
      locationGranted.value = true
    },
    (err) => {
      console.warn('Auto geolocation failed:', err)
      locationGranted.value = false
    }
  )
}

/**
 * Composable exposing geolocation utilities and reactive state.
 * @returns {{ userLocation: import('vue').Ref, locationGranted: import('vue').Ref<boolean>, locationError: import('vue').Ref<string|null>, requestLocation: () => Promise, buildMapsUrl: (destination: string) => string }}
 */
export function useGeolocation() {
  /**
   * Prompts the user for geolocation permission and resolves with coordinates.
   * Stores the grant/deny decision in localStorage for future page loads.
   * @returns {Promise<{lat: number, lng: number}>} Resolved coordinates.
   */
  function requestLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        locationError.value = 'Geolocation is not supported by your browser.'
        reject(new Error(locationError.value))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          userLocation.value = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
          locationGranted.value = true
          locationError.value = null
          localStorage.setItem('ll_geo_granted', 'true')
          resolve(userLocation.value)
        },
        (err) => {
          let msg = 'Could not retrieve your location.'
          if (err.code === err.PERMISSION_DENIED) {
            msg = 'Location permission was denied.'
          }
          locationError.value = msg
          locationGranted.value = false
          localStorage.setItem('ll_geo_granted', 'false')
          reject(err)
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      )
    })
  }

  /**
   * Builds a Google Maps directions or search URL.
   * If the user's location is known, generates a directions link;
   * otherwise falls back to a search query.
   * @param {string} destination - Hospital name or address string.
   * @returns {string} Google Maps URL.
   */
  function buildMapsUrl(destination) {
    if (userLocation.value) {
      return `https://www.google.com/maps/dir/?api=1&origin=${userLocation.value.lat},${userLocation.value.lng}&destination=${encodeURIComponent(destination)}`
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`
  }

  return {
    userLocation,
    locationGranted,
    locationError,
    requestLocation,
    buildMapsUrl
  }
}
