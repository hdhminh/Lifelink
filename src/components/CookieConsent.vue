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
  <div v-if="showBanner" class="cookie-consent-banner">
    <div class="cookie-consent-content">
      <h3>Cookie & Privacy Preferences</h3>
      <p>
        We use cookies to enhance your experience. Necessary cookies are required for the app to function.
        You can choose which optional cookies to allow.
      </p>

      <div class="cookie-options">
        <label class="cookie-option">
          <input type="checkbox" checked disabled />
          <span>Necessary (required)</span>
        </label>

        <label class="cookie-option">
          <input v-model="consentState.location" type="checkbox" />
          <span>Location Services</span>
        </label>

        <label class="cookie-option">
          <input v-model="consentState.analytics" type="checkbox" />
          <span>Analytics</span>
        </label>

        <label class="cookie-option">
          <input v-model="consentState.marketing" type="checkbox" />
          <span>Marketing</span>
        </label>
      </div>

      <div class="cookie-actions">
        <button class="btn-accept" @click="acceptAll">Accept All</button>
        <button class="btn-reject" @click="rejectAll">Reject All</button>
        <button class="btn-save" @click="savePreferences">Save Preferences</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cookie-consent-banner {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #FAF5EF;
  border-top: 2px solid #722F37;
  padding: 1rem;
  z-index: 9999;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.15);
}

.cookie-consent-content {
  max-width: 1200px;
  margin: 0 auto;
}

.cookie-consent-content h3 {
  color: #722F37;
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
}

.cookie-consent-content p {
  color: #333;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.cookie-options {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
}

.cookie-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  color: #333;
}

.cookie-option input[type="checkbox"] {
  accent-color: #722F37;
}

.cookie-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.btn-accept,
.btn-reject,
.btn-save {
  padding: 0.5rem 1.25rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: opacity 0.2s;
}

.btn-accept {
  background-color: #722F37;
  color: #FAF5EF;
}

.btn-reject {
  background-color: #6c757d;
  color: #fff;
}

.btn-save {
  background-color: #FAF5EF;
  color: #722F37;
  border: 1px solid #722F37;
}

.btn-accept:hover,
.btn-reject:hover,
.btn-save:hover {
  opacity: 0.85;
}
</style>
