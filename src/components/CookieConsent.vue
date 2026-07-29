<script setup>
import { ref } from 'vue'
import { useGdprConsent } from '../composables/useGdprConsent.js'

const {
  showBanner,
  consentState,
  gpsStatus,
  notifStatus,
  grantConsent,
  declineAllConsent,
  requestGPSPermission,
  requestNotificationPermission
} = useGdprConsent()

const locationSelected = ref(consentState.value.location !== false)
const notifSelected = ref(consentState.value.notifications !== false)
const requesting = ref(false)

async function acceptSelected() {
  requesting.value = true
  try {
    // Accept & Continue enables the optional permissions again after a previous Decline All.
    locationSelected.value = true
    notifSelected.value = true

    // 1. Request Notification First (Strict user-gesture requirement)
    if (notifSelected.value && notifStatus.value !== 'granted' && notifStatus.value !== 'denied') {
      await requestNotificationPermission()
    }
    // 2. Request GPS Second (More lenient, can follow the notification gesture)
    if (locationSelected.value && gpsStatus.value !== 'granted' && gpsStatus.value !== 'denied') {
      await requestGPSPermission()
    }
  } catch (err) {
    console.warn('[CookieConsent] Permission request error:', err)
  } finally {
    grantConsent({
      location: locationSelected.value,
      notifications: notifSelected.value
    })
    requesting.value = false
  }
}

function declineAll() {
  declineAllConsent()
}
</script>

<template>
  <div v-if="showBanner" class="cookie-consent-toast" role="dialog" aria-label="Cookie & Application Permissions">
    <div class="cookie-toast-header">
      <div class="d-flex align-items-center gap-2">
        <i class="bi bi-shield-check fs-5 text-wine"></i>
        <strong class="text-wine fs-6">LifeLink & Privacy Preferences</strong>
      </div>
      <button class="cookie-close-btn" @click="declineAll" aria-label="Close">&times;</button>
    </div>

    <p class="cookie-toast-text">
      We use cookies and device permissions to coordinate emergency blood donations efficiently:
    </p>

    <div class="cookie-options">
      <!-- Essential Cookies -->
      <div class="cookie-opt-item">
        <div class="d-flex align-items-center gap-2">
          <i class="bi bi-check-circle-fill text-wine"></i>
          <span class="fw-semibold">Essential System Cookies</span>
        </div>
        <span class="badge bg-light text-dark border">Required</span>
      </div>

      <!-- GPS Location -->
      <div class="cookie-opt-item">
        <div class="d-flex align-items-center gap-2">
          <i class="bi bi-geo-alt-fill text-wine"></i>
          <div>
            <div class="fw-semibold">GPS Location</div>
            <div class="small text-muted">Calculate distance to target hospital</div>
          </div>
        </div>
        <div class="form-check form-switch m-0">
          <input
            id="gps-consent-switch"
            v-model="locationSelected"
            class="form-check-input switch-wine"
            type="checkbox"
            role="switch"
            aria-label="Enable GPS Location"
          />
        </div>
      </div>

      <!-- Notification -->
      <div class="cookie-opt-item">
        <div class="d-flex align-items-center gap-2">
          <i class="bi bi-bell-fill text-wine"></i>
          <div>
            <div class="fw-semibold">Push Notifications</div>
            <div class="small text-muted">Alerts when app is closed</div>
          </div>
        </div>
        <div class="form-check form-switch m-0">
          <input
            id="notif-consent-switch"
            v-model="notifSelected"
            class="form-check-input switch-wine"
            type="checkbox"
            role="switch"
            aria-label="Enable Push Notifications"
          />
        </div>
      </div>
    </div>

    <div class="cookie-actions">
      <button class="btn btn-sm btn-outline-wine text-nowrap" @click="declineAll">
        Decline All
      </button>
      <button class="btn btn-sm btn-wine text-nowrap" :disabled="requesting" @click="acceptSelected">
        <i class="bi bi-check-lg me-1"></i>{{ requesting ? 'Requesting...' : 'Accept & Continue' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.cookie-consent-toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 380px;
  max-width: calc(100vw - 32px);
  background-color: #ffffff;
  border-radius: 12px;
  border: 1px solid rgba(142, 36, 53, 0.2);
  padding: 1.1rem;
  z-index: 9999;
  box-shadow: 0 8px 30px rgba(142, 36, 53, 0.2);
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  font-family: inherit;
}

@media (max-width: 576px) {
  .cookie-consent-toast {
    left: 0;
    right: 0;
    bottom: 0;
    width: 100vw;
    max-width: 100vw;
    border-radius: 16px 16px 0 0;
    padding: 1rem 1.25rem 1.25rem 1.25rem;
    box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.25);
  }
}

.cookie-toast-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.text-wine {
  color: #8E2435 !important;
}

.cookie-close-btn {
  background: none;
  border: none;
  font-size: 1.35rem;
  line-height: 1;
  color: #8E2435;
  cursor: pointer;
  padding: 0;
}

.cookie-toast-text {
  color: #4A5568;
  font-size: 0.825rem;
  margin: 0;
  line-height: 1.45;
}

.cookie-options {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  background-color: #FAF5F6;
  border-radius: 8px;
  padding: 0.65rem 0.85rem;
  border: 1px solid rgba(142, 36, 53, 0.08);
}

.cookie-opt-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.825rem;
}

.switch-wine:checked {
  background-color: #8E2435;
  border-color: #8E2435;
}

.cookie-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.btn-wine {
  background-color: #8E2435;
  color: #ffffff;
  border: 1px solid #8E2435;
  font-weight: 600;
  border-radius: 6px;
  padding: 0.4rem 0.85rem;
  font-size: 0.825rem;
  transition: all 0.2s ease;
}

.btn-wine:hover {
  background-color: #721C29;
  border-color: #721C29;
  color: #ffffff;
}

.btn-outline-wine {
  background-color: transparent;
  color: #8E2435;
  border: 1px solid #8E2435;
  font-weight: 600;
  border-radius: 6px;
  padding: 0.4rem 0.85rem;
  font-size: 0.825rem;
  transition: all 0.2s ease;
}

.btn-outline-wine:hover {
  background-color: #FAF5F6;
  color: #721C29;
}
</style>
