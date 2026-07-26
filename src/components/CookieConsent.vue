<script setup>
import { useGdprConsent } from '../composables/useGdprConsent.js'

const { consentState, showBanner, grantConsent, revokeConsent } = useGdprConsent()

function acceptAll() {
  grantConsent()
}

function rejectAll() {
  revokeConsent()
}

function savePreferences() {
  grantConsent({
    location: consentState.value.location,
    analytics: consentState.value.analytics,
    marketing: consentState.value.marketing
  })
}
</script>

<template>
  <div v-if="showBanner" class="cookie-consent-toast">
    <div class="cookie-toast-header">
      <div class="d-flex align-items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"/>
          <path d="M8.5 8.5v.01"/>
          <path d="M16 12.5v.01"/>
          <path d="M12 16v.01"/>
          <path d="M11 12.5v.01"/>
        </svg>
        <strong>Cookie Preferences</strong>
      </div>
      <button class="cookie-close-btn" @click="rejectAll" aria-label="Close">&times;</button>
    </div>
    <p class="cookie-toast-text">
      We use cookies to improve your experience and analyze site traffic.
    </p>

    <div class="cookie-actions">
      <button class="btn-decline" @click="rejectAll">Decline</button>
      <button class="btn-accept" @click="acceptAll">Accept All</button>
    </div>
  </div>
</template>

<style scoped>
.cookie-consent-toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 360px;
  max-width: calc(100vw - 40px);
  background-color: #FAF5EF;
  border-radius: 8px;
  border: 1px solid #722F37;
  padding: 1rem;
  z-index: 9999;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.cookie-toast-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #722F37;
  font-size: 1rem;
}

.cookie-close-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  line-height: 1;
  color: #722F37;
  cursor: pointer;
  padding: 0;
}

.cookie-toast-text {
  color: #555;
  font-size: 0.85rem;
  margin: 0;
  line-height: 1.4;
}

.cookie-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.btn-accept,
.btn-decline {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-accept {
  background-color: #722F37;
  color: #FAF5EF;
}

.btn-decline {
  background-color: transparent;
  color: #722F37;
  border: 1px solid #722F37;
}

.btn-accept:hover,
.btn-decline:hover {
  opacity: 0.85;
}
</style>
