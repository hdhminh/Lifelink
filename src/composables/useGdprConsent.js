import { ref, watch } from 'vue'

const STORAGE_KEY = 'lifelink_gdpr_consent'

const consentState = ref({
  necessary: true,
  location: true,
  notifications: true,
  analytics: false,
  marketing: false
})

const hasConsented = ref(false)
const showBanner = ref(true)

const gpsStatus = ref('unknown') // 'granted' | 'denied' | 'prompt' | 'unknown'
const notifStatus = ref('unknown') // 'granted' | 'denied' | 'default' | 'unknown'

async function checkPermissions() {
  if (typeof window === 'undefined') return

  // Check Geolocation permission state
  try {
    if (navigator.permissions && navigator.permissions.query) {
      const geoPerm = await navigator.permissions.query({ name: 'geolocation' })
      gpsStatus.value = geoPerm.state // 'granted', 'denied', 'prompt'
      geoPerm.onchange = () => {
        gpsStatus.value = geoPerm.state
      }
    } else {
      gpsStatus.value = 'prompt'
    }
  } catch (e) {
    gpsStatus.value = 'prompt'
  }

  // Check Notification permission state
  try {
    if ('Notification' in window) {
      notifStatus.value = Notification.permission // 'granted', 'denied', 'default'
    } else {
      notifStatus.value = 'denied'
    }
  } catch (e) {
    notifStatus.value = 'unknown'
  }
}

// Request Native Geolocation Prompt
async function requestGPSPermission() {
  if (typeof window === 'undefined' || !('geolocation' in navigator)) {
    gpsStatus.value = 'denied'
    return false
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      () => {
        gpsStatus.value = 'granted'
        resolve(true)
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          gpsStatus.value = 'denied'
        }
        resolve(false)
      },
      { timeout: 10000 }
    )
  })
}

// Request Native Notification Prompt
async function requestNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    notifStatus.value = 'denied'
    return false
  }
  try {
    const res = await Notification.requestPermission()
    notifStatus.value = res
    return res === 'granted'
  } catch (e) {
    return false
  }
}

// Load consent from localStorage on init
function loadConsent() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      consentState.value = {
        necessary: true,
        location: parsed.location !== undefined ? parsed.location : true,
        notifications: parsed.notifications !== undefined ? parsed.notifications : true,
        analytics: parsed.analytics || false,
        marketing: parsed.marketing || false
      }
      hasConsented.value = true
      showBanner.value = false
    }
  } catch (e) {
    console.warn('Failed to load GDPR consent:', e)
  }
}

// Save consent to localStorage
function saveConsent() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(consentState.value))
  } catch (e) {
    console.warn('Failed to save GDPR consent:', e)
  }
}

// Watch for consent changes
watch(consentState, saveConsent, { deep: true })

// Initialize
checkPermissions()
loadConsent()

export function grantConsent(prefs = null) {
  if (prefs) {
    consentState.value = {
      necessary: true,
      location: prefs.location !== undefined ? prefs.location : true,
      notifications: prefs.notifications !== undefined ? prefs.notifications : true,
      analytics: prefs.analytics || false,
      marketing: prefs.marketing || false
    }
  } else {
    consentState.value = {
      necessary: true,
      location: true,
      notifications: true,
      analytics: true,
      marketing: true
    }
  }

  // State is now strictly saved to localStorage
  // Native prompts are triggered directly from the UI to preserve gesture context

  hasConsented.value = true
  showBanner.value = false
}

export function revokeConsent() {
  consentState.value = {
    necessary: true,
    location: false,
    notifications: false,
    analytics: false,
    marketing: false
  }
  hasConsented.value = false
  showBanner.value = true
}

export function declineAllConsent() {
  consentState.value = {
    necessary: true,
    location: false,
    notifications: false,
    analytics: false,
    marketing: false
  }
  hasConsented.value = true
  showBanner.value = false
}

export function hasConsent(type) {
  return consentState.value[type] || false
}

export function showSettings() {
  showBanner.value = true
}

export function useGdprConsent() {
  return {
    consentState,
    hasConsented,
    showBanner,
    gpsStatus,
    notifStatus,
    checkPermissions,
    requestGPSPermission,
    requestNotificationPermission,
    grantConsent,
    revokeConsent,
    declineAllConsent,
    hasConsent,
    showSettings
  }
}
