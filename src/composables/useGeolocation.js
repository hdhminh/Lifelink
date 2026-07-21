import { ref } from 'vue'

const userLocation = ref(null)
const locationGranted = ref(false)
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

export function useGeolocation() {
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
