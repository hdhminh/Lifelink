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
      <strong>🍪 Cookie Preferences</strong>
      <button class="cookie-close-btn" @click="rejectAll" aria-label="Close">&times;</button>
    </div>
    <p class="cookie-toast-text">
      We use cookies to improve your experience.
    </p>

    <div class="cookie-options">
      <label class="cookie-option">
        <input type="checkbox" checked disabled />
        <span>Necessary</span>
      </label>
      <label class="cookie-option">
        <input v-model="consentState.location" type="checkbox" />
        <span>Location</span>
      </label>
      <label class="cookie-option">
        <input v-model="consentState.analytics" type="checkbox" />
        <span>Analytics</span>
      </label>
    </div>

    <div class="cookie-actions">
      <button class="btn-save" @click="savePreferences">Save</button>
      <button class="btn-accept" @click="acceptAll">Accept All</button>
    </div>
  </div>
</template>

<style scoped>
.cookie-consent-toast {
  position: fixed;
  bottom: 20px;
  left: 20px;
  width: 320px;
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

.cookie-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.cookie-option {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  cursor: pointer;
  font-size: 0.8rem;
  color: #333;
}

.cookie-option input[type="checkbox"] {
  accent-color: #722F37;
}

.cookie-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.btn-accept,
.btn-save {
  padding: 0.4rem 0.75rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-accept {
  background-color: #722F37;
  color: #FAF5EF;
}

.btn-save {
  background-color: transparent;
  color: #722F37;
  border: 1px solid #722F37;
}

.btn-accept:hover,
.btn-save:hover {
  opacity: 0.85;
}
</style>
