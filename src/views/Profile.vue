<template>
  <div class="ll-page-container">
    <LoadingSpinner v-if="authLoading || (user && !userProfile)" message="Loading profile..." />
    <div v-else-if="!userProfile" class="ll-empty-state">
      <div class="ll-empty-state__icon"><i class="bi bi-person-x-fill text-muted"></i></div>
      <div class="ll-empty-state__title">Profile not available</div>
      <p class="ll-empty-state__body">Please sign in again to manage your donor profile.</p>
    </div>

    <section v-else class="ll-card ll-profile-card-premium reveal-item">
      <div class="ll-card__header d-flex flex-column flex-sm-row justify-content-between gap-3 align-items-sm-center">
        <div>
          <h2 class="ll-section-title m-0"><i class="bi bi-person-circle text-wine me-2"></i> Donor Profile</h2>
          <p class="ll-text-meta mb-0 mt-1">Keep your donation details accurate for emergency matching.</p>
        </div>
        <button v-if="!isEditing" class="ll-btn-secondary" type="button" @click="startEditing"><i class="bi bi-pencil me-1"></i> Edit Profile</button>
      </div>

      <div class="ll-card__body">

        <form v-if="isEditing" @submit.prevent="handleSave" novalidate>
          <div class="row g-3">
            <div class="col-md-6 ll-form-group">
              <label for="profile-name">Full Name</label>
              <input id="profile-name" v-model.trim="form.displayName" class="form-control" :class="{ 'is-invalid': errors.displayName }" type="text" autocomplete="name">
              <div v-if="errors.displayName" class="invalid-feedback d-block">{{ errors.displayName }}</div>
            </div>
            <div class="col-md-6 ll-form-group">
              <label for="profile-blood-type">Blood Type</label>
              <select id="profile-blood-type" v-model="form.bloodType" class="form-select" :class="{ 'is-invalid': errors.bloodType }" aria-label="Blood Type">
                <option value="">Select type</option>
                <option v-for="type in bloodTypes" :key="type" :value="type">{{ type }}</option>
              </select>
              <div v-if="errors.bloodType" class="invalid-feedback d-block">{{ errors.bloodType }}</div>
            </div>
          </div>

          <div class="row g-3">
            <div class="col-md-6 ll-form-group">
              <label for="profile-city">City</label>
              <input id="profile-city" v-model.trim="form.city" class="form-control" :class="{ 'is-invalid': errors.city }" type="text" autocomplete="address-level2">
              <div v-if="errors.city" class="invalid-feedback d-block">{{ errors.city }}</div>
            </div>
            <div class="col-md-6 ll-form-group">
              <label for="profile-last-donation">Last Donation Date</label>
              <input id="profile-last-donation" v-model="form.lastDonationDate" class="form-control" type="date" aria-label="Last Donation Date">
            </div>
          </div>

          <div class="row g-3">
            <div class="col-md-6 ll-form-group">
              <label for="profile-phone">Phone Number</label>
              <input id="profile-phone" v-model.trim="form.phoneNumber" class="form-control" :class="{ 'is-invalid': errors.phoneNumber }" type="tel" placeholder="e.g. 0901234567" autocomplete="tel">
              <div v-if="errors.phoneNumber" class="invalid-feedback d-block">{{ errors.phoneNumber }}</div>
            </div>
            <div class="col-md-6 ll-form-group">
              <label for="profile-available">Availability</label>
              <select id="profile-available" v-model="form.canDonateNow" class="form-select" aria-label="Availability">
                <option :value="true">Available to Donate</option>
                <option :value="false">Not Currently Available</option>
              </select>
            </div>
          </div>

          <div class="d-flex flex-column flex-sm-row gap-2 justify-content-end mt-4">
            <button class="ll-btn-secondary" type="button" @click="cancelEditing">Cancel</button>
            <button class="ll-btn-primary" type="submit" :disabled="isSaving">{{ isSaving ? 'Saving...' : 'Save Profile' }}</button>
          </div>
        </form>

        <div v-else class="row g-4 align-items-center">
          <div class="col-lg-4 text-center reveal-item">
            <!-- Modern Glowing Circular Droplet Badge -->
            <div class="ll-profile-glowing-circle mx-auto">
              <div class="ll-glowing-drop">
                <i class="bi bi-droplet-fill"></i>
                <span class="ll-blood-letter">{{ userProfile.bloodType }}</span>
              </div>
            </div>
            <p class="ll-text-meta mt-3 mb-0 text-uppercase font-weight-700 letter-spacing-1">Verified Blood Group</p>

            <!-- Cooldown Indicator Card -->
            <div class="mt-4 p-3 rounded border text-start animate-fade-in" :class="eligibleInfo.eligible ? 'bg-success-bg border-success-subtle' : 'bg-warning-bg border-warning-subtle'" style="transition: all var(--ll-transition-fast);">
              <div class="d-flex align-items-center gap-2">
                <i :class="eligibleInfo.eligible ? 'bi bi-check-circle-fill text-success' : 'bi bi-hourglass-split text-warning'" style="font-size: 1.25rem;"></i>
                <div>
                  <strong class="text-slate-900 small d-block" style="font-size: 0.85rem; font-weight: 700;">{{ eligibleInfo.statusTitle }}</strong>
                  <span class="text-slate-500 extra-small" style="font-size: 0.75rem; display: block; margin-top: 2px;">{{ eligibleInfo.statusBody }}</span>
                </div>
              </div>
              <div v-if="!eligibleInfo.eligible" class="mt-2">
                <div class="ll-progress" style="height: 6px; background-color: var(--ll-slate-100); border-radius: 3px; overflow: hidden;" aria-label="Donation cooldown progress">
                  <div class="ll-progress-bar bg-warning" :style="{ width: `${eligibleInfo.progressPercent}%`, height: '100%', transition: 'width 0.4s ease-out' }"></div>
                </div>
                <div class="d-flex justify-content-between mt-1 text-slate-400 extra-small" style="font-size: 0.7rem;">
                  <span>Last: {{ readableLastDonation }}</span>
                  <span>{{ eligibleInfo.daysLeft }} days left</span>
                </div>
              </div>
            </div>
          </div>
          <div class="col-lg-8 reveal-item">
            <div class="ll-profile-list-premium">
              <div class="ll-profile-row">
                <span class="ll-profile-label">Name</span>
                <span class="ll-profile-val">{{ userProfile.displayName }}</span>
              </div>
              <div class="ll-profile-row">
                <span class="ll-profile-label">Email</span>
                <span class="ll-profile-val">{{ userProfile.email }}</span>
              </div>
              <div class="ll-profile-row">
                <span class="ll-profile-label">Phone Number</span>
                <span class="ll-profile-val">{{ userProfile.phoneNumber || 'Not recorded' }}</span>
              </div>
              <div class="ll-profile-row">
                <span class="ll-profile-label">Location City</span>
                <span class="ll-profile-val">{{ userProfile.city }}</span>
              </div>
              <div class="ll-profile-row">
                <span class="ll-profile-label">Status</span>
                <span class="ll-profile-val">
                  <span :class="['ll-status-pill', userProfile.canDonateNow ? 'll-status-pill--active' : 'll-status-pill--inactive']">
                    <span class="ll-status-dot"></span>
                    {{ userProfile.canDonateNow ? 'Ready to Donate' : 'Temporarily Unavailable' }}
                  </span>
                </span>
              </div>
              <div class="ll-profile-row">
                <span class="ll-profile-label">Last Blood Donation</span>
                <span class="ll-profile-val">{{ readableLastDonation }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
/**
 * Profile.vue
 * Donor profile display and edit form with validation and async state.
 */
import { reactive, ref, computed, watch, nextTick } from 'vue'
import { Timestamp } from 'firebase/firestore'
import { useAuth } from '@/composables/useAuth.js'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import { useToast } from '@/composables/useToast.js'
import { useEligibility } from '@/composables/useEligibility.js'

const { user, userProfile, authLoading, updateProfile } = useAuth()
const { isEligible, nextEligibleDate, daysUntilEligible } = useEligibility()
const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const isEditing = ref(false)
const isSaving = ref(false)
const errors = reactive({})
const { showToast } = useToast()

const eligibleInfo = computed(() => {
  const lastDate = userProfile.value?.lastDonationDate
  const eligible = isEligible(lastDate)
  if (eligible) {
    return {
      eligible: true,
      statusTitle: 'Ready to Donate',
      statusBody: 'You are eligible to confirm availability for emergency requests.',
      progressPercent: 100,
      daysLeft: 0
    }
  } else {
    const daysLeft = daysUntilEligible(lastDate)
    const nextDate = nextEligibleDate(lastDate)
    const percent = Math.min(100, Math.max(0, ((56 - daysLeft) / 56) * 100))
    return {
      eligible: false,
      statusTitle: 'Cooldown Active',
      statusBody: `Next eligible: ${nextDate ? nextDate.toLocaleDateString('en-AU') : ''}`,
      progressPercent: percent,
      daysLeft
    }
  }
})

const form = reactive({
  displayName: '',
  bloodType: '',
  city: '',
  phoneNumber: '',
  canDonateNow: false,
  lastDonationDate: ''
})

const readableLastDonation = computed(() => {
  const value = userProfile.value?.lastDonationDate
  if (!value) return 'Not recorded'
  const date = value.toDate ? value.toDate() : new Date(value)
  return date.toLocaleDateString('en-AU')
})

/**
 * Converts a Firestore timestamp or date string to YYYY-MM-DD.
 * @param {Object|string|null} value - Timestamp or date.
 * @returns {string} Date input value.
 */
function toDateInput(value) {
  if (!value) return ''
  const date = value.toDate ? value.toDate() : new Date(value)
  return date.toISOString().slice(0, 10)
}

/**
 * Loads current profile values into the edit form.
 * @returns {void}
 */
function populateForm() {
  if (!userProfile.value) return
  Object.assign(form, {
    displayName: userProfile.value.displayName || '',
    bloodType: userProfile.value.bloodType || '',
    city: userProfile.value.city || '',
    phoneNumber: userProfile.value.phoneNumber || '',
    canDonateNow: !!userProfile.value.canDonateNow,
    lastDonationDate: toDateInput(userProfile.value.lastDonationDate)
  })
}

/**
 * Enables edit mode.
 * @returns {void}
 */
function startEditing() {
  populateForm()
  isEditing.value = true
}

/**
 * Cancels edit mode and restores source values.
 * @returns {void}
 */
function cancelEditing() {
  isEditing.value = false
  populateForm()
}

/**
 * Validates donor profile edits.
 * @returns {boolean} Whether the profile form is valid.
 */
function validate() {
  Object.keys(errors).forEach(key => delete errors[key])
  const phonePattern = /^(0|\+84|84)(3|5|7|8|9)([0-9]{8})$/
  if (!form.displayName || form.displayName.length < 2) errors.displayName = 'Name must be at least 2 characters.'
  if (!bloodTypes.includes(form.bloodType)) errors.bloodType = 'Please select a valid blood type.'
  if (!form.city) errors.city = 'City is required.'
  if (!form.phoneNumber) {
    errors.phoneNumber = 'Phone number is required.'
  } else if (!phonePattern.test(form.phoneNumber)) {
    errors.phoneNumber = 'Please enter a valid Vietnamese phone number (e.g. 0901234567 or +84901234567).'
  }
  return Object.keys(errors).length === 0
}

/**
 * Saves donor profile fields to Firestore.
 * @returns {Promise<void>}
 */
async function handleSave() {
  if (!validate()) return
  isSaving.value = true
  try {
    await updateProfile({
      displayName: form.displayName,
      bloodType: form.bloodType,
      city: form.city,
      phoneNumber: form.phoneNumber,
      canDonateNow: form.canDonateNow,
      lastDonationDate: form.lastDonationDate ? Timestamp.fromDate(new Date(`${form.lastDonationDate}T00:00:00`)) : null
    })
    showToast('Profile saved successfully.', 'success')
    isEditing.value = false
  } catch (err) {
    showToast(err.message || 'Could not save profile.', 'danger')
  } finally {
    isSaving.value = false
  }
}

import { useScrollReveal } from '@/composables/useScrollReveal.js'

const { reveal } = useScrollReveal()

watch(userProfile, populateForm, { immediate: true })

watch(authLoading, (newVal) => {
  if (!newVal) {
    reveal('.reveal-item', 60)
  }
}, { immediate: true })

watch(isEditing, async (newVal) => {
  if (!newVal) {
    await nextTick()
    reveal('.reveal-item', 60)
  }
})
</script>

<style scoped>
.text-wine {
  color: var(--ll-wine-red);
}
.letter-spacing-1 {
  letter-spacing: 0.05em;
}

.ll-profile-card-premium {
  background-color: #ffffff;
  border: 1px solid var(--ll-slate-200);
  box-shadow: var(--ll-shadow-sm);
}

/* Glowing Blood Drop circular badge */
.ll-profile-glowing-circle {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--ll-wine-light) 0%, #ffffff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: 0 10px 30px rgba(142, 36, 53, 0.08), 0 2px 4px rgba(37, 30, 33, 0.02);
  transition: transform var(--ll-transition);
}

.ll-profile-glowing-circle:hover {
  transform: scale(1.03);
}

.ll-glowing-drop {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: var(--ll-wine-red);
}

.ll-glowing-drop i {
  font-size: 2.75rem;
  line-height: 1;
  filter: drop-shadow(0 2px 8px rgba(142, 36, 53, 0.25));
}

.ll-blood-letter {
  font-family: 'Outfit', sans-serif;
  font-size: 1.6rem;
  font-weight: 800;
  margin-top: -0.25rem;
  color: var(--ll-espresso);
}

/* Premium Grid List details */
.ll-profile-list-premium {
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
}

.ll-profile-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 0.95rem;
  border-bottom: 1px solid var(--ll-slate-100);
}

.ll-profile-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.ll-profile-label {
  font-weight: 600;
  color: var(--ll-slate-500);
  font-size: 0.9rem;
}

.ll-profile-val {
  font-weight: 500;
  color: var(--ll-slate-900);
  font-size: 0.975rem;
}

/* Glowing status pill */
.ll-status-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0.35rem 0.95rem;
  border-radius: 99px;
  font-size: 0.825rem;
  font-weight: 600;
}

.ll-status-pill--active {
  background-color: var(--ll-success-bg);
  color: var(--ll-success-text);
  border: 1px solid rgba(46, 125, 99, 0.15);
}

.ll-status-pill--inactive {
  background-color: var(--ll-slate-100);
  color: var(--ll-slate-500);
  border: 1px solid var(--ll-slate-200);
}

.ll-status-pill--active .ll-status-dot {
  width: 8px;
  height: 8px;
  background-color: var(--ll-success);
  border-radius: 50%;
  box-shadow: 0 0 8px var(--ll-success);
}

.ll-status-pill--inactive .ll-status-dot {
  width: 8px;
  height: 8px;
  background-color: var(--ll-slate-400);
  border-radius: 50%;
}
</style>
