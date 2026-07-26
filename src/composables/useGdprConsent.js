import { ref, watch } from 'vue'

const STORAGE_KEY = 'lifelink_gdpr_consent'

const consentState = ref({
  necessary: true,
  location: false,
  analytics: false,
  marketing: false
})

const hasConsented = ref(false)
const showBanner = ref(true)

// Load consent from localStorage on init
function loadConsent() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      consentState.value = {
        necessary: true,
        location: parsed.location || false,
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
loadConsent()

export function grantConsent(prefs = null) {
  if (prefs) {
    consentState.value = {
      necessary: true,
      location: prefs.location || false,
      analytics: prefs.analytics || false,
      marketing: prefs.marketing || false
    }
  } else {
    consentState.value = {
      necessary: true,
      location: true,
      analytics: true,
      marketing: true
    }
  }
  hasConsented.value = true
  showBanner.value = false
}

export function revokeConsent() {
  consentState.value = {
    necessary: true,
    location: false,
    analytics: false,
    marketing: false
  }
  hasConsented.value = false
  showBanner.value = true
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
    grantConsent,
    revokeConsent,
    hasConsent,
    showSettings
  }
}
