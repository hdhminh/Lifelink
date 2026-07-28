<script setup>
import { ref } from 'vue'
import { useGdprConsent } from '../composables/useGdprConsent.js'

const {
  showBanner,
  gpsStatus,
  notifStatus,
  grantConsent,
  revokeConsent
} = useGdprConsent()

const locationSelected = ref(true)
const notifSelected = ref(true)

function acceptSelected() {
  grantConsent({
    location: gpsStatus.value === 'granted' ? true : (gpsStatus.value === 'denied' ? false : locationSelected.value),
    notifications: notifStatus.value === 'granted' ? true : (notifStatus.value === 'denied' ? false : notifSelected.value)
  })
}

function declineAll() {
  revokeConsent()
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
        <div>
          <span v-if="gpsStatus === 'granted'" class="badge bg-success-subtle text-success border border-success-subtle">
            <i class="bi bi-check me-1"></i>Granted
          </span>
          <span v-else-if="gpsStatus === 'denied'" class="badge bg-secondary-subtle text-secondary border">
            Blocked (Check Settings)
          </span>
          <div v-else class="form-check form-switch m-0">
            <input
              id="gps-consent-switch"
              v-model="locationSelected"
              class="form-check-input switch-wine"
              type="checkbox"
              role="switch"
            />
          </div>
        </div>
      </div>

      <!-- Notification -->
      <div class="cookie-opt-item">
        <div class="d-flex align-items-center gap-2">
          <i class="bi bi-bell-fill text-wine"></i>
          <div>
            <div class="fw-semibold">Push Notifications</div>
            <div class="small text-muted">Receive emergency blood alerts when app is closed</div>
          </div>
        </div>
        <div>
          <span v-if="notifStatus === 'granted'" class="badge bg-success-subtle text-success border border-success-subtle">
            <i class="bi bi-check me-1"></i>Granted
          </span>
          <span v-else-if="notifStatus === 'denied'" class="badge bg-secondary-subtle text-secondary border">
            Blocked (Check Settings)
          </span>
          <div v-else class="form-check form-switch m-0">
            <input
              id="notif-consent-switch"
              v-model="notifSelected"
              class="form-check-input switch-wine"
              type="checkbox"
              role="switch"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="cookie-actions">
      <button class="btn btn-sm btn-outline-wine text-nowrap" @click="declineAll">
        Decline All
      </button>
      <button class="btn btn-sm btn-wine text-nowrap" @click="acceptSelected">
        <i class="bi bi-check-lg me-1"></i>Accept & Continue
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
  box-shadow: 0 8px 30px rgba(142, 36, 53, 0.15);
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  font-family: inherit;
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
