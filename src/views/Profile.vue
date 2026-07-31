<template>
  <div class="ll-page-container">
    <LoadingSpinner v-if="authLoading || (user && !userProfile)" message="Loading profile..." />
    <div v-else-if="!userProfile" class="ll-empty-state">
      <div class="ll-empty-state__icon"><i class="bi bi-person-x-fill text-muted"></i></div>
      <div class="ll-empty-state__title">Profile not available</div>
      <p class="ll-empty-state__body">Please sign in again to manage your donor profile.</p>
    </div>

    <section v-else class="ll-card ll-profile-card-premium reveal-item">
      <div
        class="ll-card__header d-flex flex-column flex-sm-row justify-content-between gap-3 align-items-sm-center"
      >
        <div>
          <h2 class="ll-section-title m-0">
            <i class="bi bi-person-circle text-wine me-2"></i> Donor Profile
          </h2>
          <p class="ll-text-meta mb-0 mt-1">
            Keep your donation details accurate for emergency matching.
          </p>
        </div>
        <div v-if="!isEditing" class="d-flex flex-wrap gap-2">
          <button class="ll-btn-secondary" type="button" @click="startEditing">
            <i class="bi bi-pencil me-1"></i> Edit Profile
          </button>
          <button
            class="ll-btn-secondary"
            type="button"
            @click="togglePasswordPanel"
          >
            <i class="bi bi-shield-lock me-1"></i>
            {{ showPasswordPanel ? 'Hide Password Form' : 'Change Password' }}
          </button>
        </div>
      </div>

      <div class="ll-card__body">
        <ProfileEditForm
          v-if="isEditing"
          :userProfile="userProfile"
          :isSaving="isSaving"
          @save="handleSave"
          @cancel="cancelEditing"
        />

        <ProfileSummary
          v-else
          :userProfile="userProfile"
          :eligibleInfo="eligibleInfo"
          :readableLastDonation="readableLastDonation"
        />

        <form
          v-if="showPasswordPanel && !isEditing"
          class="ll-password-panel mt-4"
          @submit.prevent="handlePasswordChange"
        >
          <div class="d-flex align-items-center justify-content-between gap-3 mb-3">
            <div>
              <h3 class="ll-password-title mb-1">
                <i class="bi bi-shield-lock-fill text-wine me-2"></i> Change Password
              </h3>
              <p class="ll-text-meta mb-0">Use your current password before setting a new one.</p>
            </div>
          </div>

          <div class="row g-3">
            <div class="col-md-4">
              <label for="current-password" class="form-label">Current Password</label>
              <input
                id="current-password"
                v-model="passwordForm.currentPassword"
                type="password"
                class="form-control"
                autocomplete="current-password"
              />
            </div>
            <div class="col-md-4">
              <label for="new-password" class="form-label">New Password</label>
              <input
                id="new-password"
                v-model="passwordForm.newPassword"
                type="password"
                class="form-control"
                autocomplete="new-password"
              />
            </div>
            <div class="col-md-4">
              <label for="confirm-new-password" class="form-label">Confirm New Password</label>
              <input
                id="confirm-new-password"
                v-model="passwordForm.confirmPassword"
                type="password"
                class="form-control"
                autocomplete="new-password"
              />
            </div>
          </div>

          <div class="d-flex justify-content-end gap-2 mt-3">
            <button class="ll-btn-secondary" type="button" @click="closePasswordPanel">
              Cancel
            </button>
            <button class="ll-btn-primary" type="submit" :disabled="isChangingPassword">
              <i class="bi bi-shield-lock-fill me-1"></i>
              {{ isChangingPassword ? 'Updating...' : 'Update Password' }}
            </button>
          </div>
        </form>
      </div>
    </section>
  </div>
</template>

<script setup>
/**
 * Profile.vue
 * Donor profile display and edit form with validation and async state.
 */
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { Timestamp } from 'firebase/firestore'
import { useAuth } from '@/composables/useAuth.js'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import ProfileEditForm from '@/components/profile/ProfileEditForm.vue'
import ProfileSummary from '@/components/profile/ProfileSummary.vue'
import { useToast } from '@/composables/useToast.js'
import { useEligibility } from '@/composables/useEligibility.js'

const { user, userProfile, authLoading, updateProfile, changePassword } = useAuth()
const { isEligible, nextEligibleDate, daysUntilEligible } = useEligibility()
const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const isEditing = ref(false)
const isSaving = ref(false)
const isChangingPassword = ref(false)
const showPasswordPanel = ref(false)
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

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

/**
 * Enables edit mode.
 * @returns {void}
 */
function startEditing() {
  closePasswordPanel()
  isEditing.value = true
}

/**
 * Cancels edit mode and restores source values.
 * @returns {void}
 */
function cancelEditing() {
  isEditing.value = false
}

function resetPasswordForm() {
  passwordForm.currentPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
}

function closePasswordPanel() {
  showPasswordPanel.value = false
  resetPasswordForm()
}

function togglePasswordPanel() {
  showPasswordPanel.value = !showPasswordPanel.value
  if (!showPasswordPanel.value) {
    resetPasswordForm()
  }
}

/**
 * Saves donor profile fields to Firestore.
 * @returns {Promise<void>}
 */
async function handleSave(formData) {
  isSaving.value = true
  try {
    await updateProfile({
      displayName: formData.displayName,
      bloodType: formData.bloodType,
      city: formData.city,
      phoneNumber: formData.phoneNumber,
      canDonateNow: formData.canDonateNow,
      lastDonationDate: formData.lastDonationDate
        ? Timestamp.fromDate(new Date(`${formData.lastDonationDate}T00:00:00`))
        : null
    })
    showToast('Profile saved successfully.', 'success')
    isEditing.value = false
  } catch (err) {
    showToast(err.message || 'Could not save profile.', 'danger')
  } finally {
    isSaving.value = false
  }
}

async function handlePasswordChange() {
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    showToast('New passwords do not match.', 'danger')
    return
  }

  isChangingPassword.value = true
  try {
    await changePassword(passwordForm.currentPassword, passwordForm.newPassword)
    closePasswordPanel()
    showToast('Password updated successfully.', 'success')
  } catch (err) {
    const friendlyMessage =
      err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential'
        ? 'Current password is incorrect.'
        : err.message || 'Could not update password.'
    showToast(friendlyMessage, 'danger')
  } finally {
    isChangingPassword.value = false
  }
}

import { useScrollReveal } from '@/composables/useScrollReveal.js'

const readableLastDonation = computed(() => {
  const value = userProfile.value?.lastDonationDate
  if (!value) return 'Not recorded'
  const date = value.toDate ? value.toDate() : new Date(value)
  return date.toLocaleDateString('en-AU')
})

const { reveal } = useScrollReveal()

watch(
  authLoading,
  (newVal) => {
    if (!newVal) {
      setTimeout(() => reveal('.reveal-item', 60), 100)
    }
  },
  { immediate: true }
)

watch(isEditing, async (newVal) => {
  if (!newVal) {
    await nextTick()
    setTimeout(() => reveal('.reveal-item', 60), 100)
  }
})
</script>

<style>
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

.ll-password-panel {
  border-top: 1px solid var(--ll-slate-100);
  padding-top: 1.25rem;
}

.ll-password-title {
  color: var(--ll-slate-900);
  font-size: 1rem;
  font-weight: 800;
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
  box-shadow:
    0 10px 30px rgba(142, 36, 53, 0.08),
    0 2px 4px rgba(37, 30, 33, 0.02);
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
