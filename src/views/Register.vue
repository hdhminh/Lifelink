<template>
  <div class="ll-auth-page">
    <form ref="registerCard" class="ll-auth-card" novalidate @submit.prevent="handleRegister">
      <div class="ll-auth-card__logo">
        <h2>Register as Donor</h2>
        <p class="ll-text-meta mb-0">Create a profile for emergency blood coordination.</p>
      </div>

      <div class="ll-form-group">
        <label for="register-name" class="form-label">Full Name</label>
        <div class="position-relative">
          <input
            id="register-name"
            v-model.trim="form.displayName"
            class="form-control"
            :class="{ 'is-invalid': errors.displayName }"
            type="text"
            placeholder="e.g. Nguyen Van A"
            autocomplete="name"
          />
        </div>
        <div v-if="errors.displayName" class="invalid-feedback d-block">
          {{ errors.displayName }}
        </div>
      </div>

      <div class="ll-form-group">
        <label for="register-email" class="form-label">Email</label>
        <div class="position-relative">
          <input
            id="register-email"
            v-model.trim="form.email"
            class="form-control"
            :class="{ 'is-invalid': errors.email }"
            type="email"
            placeholder="e.g. name@example.com"
            autocomplete="email"
          />
        </div>
        <div v-if="errors.email" class="invalid-feedback d-block">{{ errors.email }}</div>
      </div>

      <div class="ll-form-group">
        <label for="register-phone" class="form-label">Phone Number</label>
        <div class="position-relative">
          <input
            id="register-phone"
            v-model.trim="form.phoneNumber"
            class="form-control"
            :class="{ 'is-invalid': errors.phoneNumber }"
            type="tel"
            placeholder="e.g. 0901234567"
            autocomplete="tel"
          />
        </div>
        <div v-if="errors.phoneNumber" class="invalid-feedback d-block">
          {{ errors.phoneNumber }}
        </div>
      </div>

      <div class="ll-form-group">
        <label for="register-password" class="form-label">Password</label>
        <div class="position-relative">
          <input
            id="register-password"
            v-model="form.password"
            class="form-control pe-5"
            :class="{ 'is-invalid': errors.password }"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Create a password"
            autocomplete="new-password"
          />
          <button
            type="button"
            class="ll-password-toggle-btn"
            title="Toggle password visibility"
            @click="showPassword = !showPassword"
          >
            <i :class="showPassword ? 'bi bi-eye-slash-fill' : 'bi bi-eye-fill'"></i>
          </button>
        </div>

        <!-- Password Strength & Suggestions -->
        <div v-if="form.password" class="mt-2 small text-start">
          <div class="d-flex justify-content-between align-items-center mb-1">
            <span class="text-slate-500 font-sans" style="font-size: 0.78rem"
              >Password Strength:</span
            >
            <span
              class="fw-bold font-mono"
              :class="{
                'text-danger': passwordScore < 2,
                'text-warning': passwordScore === 2 || passwordScore === 3,
                'text-success': passwordScore === 4
              }"
              style="font-size: 0.78rem"
            >
              {{ passwordScoreText }}
            </span>
          </div>

          <!-- Strength Meter Bar -->
          <div class="progress mb-2" style="height: 4px; background-color: var(--ll-slate-100)">
            <div
              class="progress-bar transition-all"
              :class="{
                'bg-danger': passwordScore < 2,
                'bg-warning': passwordScore === 2 || passwordScore === 3,
                'bg-success': passwordScore === 4
              }"
              :style="{ width: (passwordScore / 4) * 100 + '%' }"
            ></div>
          </div>

          <!-- Password Improvement Checklist -->
          <ul
            v-if="passwordSuggestions.length > 0"
            class="list-unstyled mb-0 text-slate-500"
            style="font-size: 0.76rem; line-height: 1.4"
          >
            <li
              v-for="(suggestion, idx) in passwordSuggestions"
              :key="idx"
              class="d-flex align-items-center gap-1 mb-1 text-slate-500"
            >
              <i class="bi bi-info-circle text-slate-400"></i> {{ suggestion }}
            </li>
          </ul>
        </div>

        <div v-if="errors.password" class="invalid-feedback d-block">{{ errors.password }}</div>
      </div>

      <div class="ll-form-group">
        <label for="register-confirm" class="form-label">Confirm Password</label>
        <div class="position-relative">
          <input
            id="register-confirm"
            v-model="form.confirmPassword"
            class="form-control"
            :class="{ 'is-invalid': errors.confirmPassword }"
            type="password"
            placeholder="Confirm your password"
            autocomplete="new-password"
          />
        </div>
        <div v-if="errors.confirmPassword" class="invalid-feedback d-block">
          {{ errors.confirmPassword }}
        </div>
      </div>

      <div class="ll-form-group">
        <label class="form-label">Blood Type</label>
        <div class="ll-blood-grid">
          <button
            v-for="bType in bloodTypes"
            :key="bType"
            type="button"
            class="ll-blood-btn"
            :class="{ active: form.bloodType === bType }"
            @click="form.bloodType = bType"
          >
            {{ bType }}
          </button>
        </div>
        <div v-if="errors.bloodType" class="invalid-feedback d-block mt-2">
          {{ errors.bloodType }}
        </div>
      </div>

      <div class="ll-form-group">
        <label for="register-city" class="form-label">City / Region</label>
        <select
          id="register-city"
          v-model="form.city"
          class="form-select"
          :class="{ 'is-invalid': errors.city }"
        >
          <option value="" disabled>Select your city...</option>
          <option v-for="c in cities" :key="c" :value="c">{{ c }}</option>
        </select>
        <div v-if="errors.city" class="invalid-feedback d-block">{{ errors.city }}</div>
      </div>

      <button class="ll-btn-primary ll-btn-block mt-4" type="submit" :disabled="isLoading">
        {{ isLoading ? 'Creating Account...' : 'Register as Donor' }}
      </button>

      <p class="ll-text-meta text-center mt-3 mb-0">
        Already registered?
        <RouterLink to="/login" class="ll-auth-link">Sign in</RouterLink>
      </p>
    </form>
  </div>
</template>

<script setup>
/**
 * Register.vue
 * Donor registration form supporting Firebase Auth user creation,
 * blood type selection, city selection, and phone number validation.
 */
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth.js'
import { useToast } from '@/composables/useToast.js'
import { VIETNAM_PROVINCES_2025 } from '@/data/vietnamLocations.js'

const { register } = useAuth()
const { showToast } = useToast()
const router = useRouter()

const registerCard = ref(null)
const showPassword = ref(false)
const isLoading = ref(false)

const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const cities = [...VIETNAM_PROVINCES_2025, 'Other']

const form = reactive({
  displayName: '',
  email: '',
  phoneNumber: '',
  password: '',
  confirmPassword: '',
  bloodType: '',
  city: ''
})

const errors = reactive({
  displayName: '',
  email: '',
  phoneNumber: '',
  password: '',
  confirmPassword: '',
  bloodType: '',
  city: ''
})

/**
 * Computes password strength score from 0 to 4 based on criteria.
 */
const passwordScore = computed(() => {
  const pwd = form.password
  if (!pwd) return 0

  let score = 0
  if (pwd.length >= 6) score++
  if (pwd.length >= 10) score++
  if (/[A-Z]/.test(pwd) || /[0-9]/.test(pwd)) score++
  if (/[^A-Za-z0-9]/.test(pwd)) score++

  return Math.min(score, 4)
})

/**
 * Returns human-readable password strength label.
 */
const passwordScoreText = computed(() => {
  switch (passwordScore.value) {
    case 0:
    case 1:
      return 'Weak'
    case 2:
    case 3:
      return 'Medium'
    case 4:
      return 'Strong'
    default:
      return 'Weak'
  }
})

/**
 * Computes password improvement suggestions.
 */
const passwordSuggestions = computed(() => {
  const pwd = form.password
  const suggestions = []

  if (!pwd) return suggestions
  if (pwd.length < 8) suggestions.push('Use at least 8 characters for better security.')
  if (!/[0-9]/.test(pwd)) suggestions.push('Include at least one number.')
  if (!/[A-Z]/.test(pwd)) suggestions.push('Include at least one uppercase letter.')

  return suggestions
})

function validateForm() {
  Object.keys(errors).forEach((k) => (errors[k] = ''))
  let isValid = true

  if (!form.displayName) {
    errors.displayName = 'Full name is required.'
    isValid = false
  }

  if (!form.email) {
    errors.email = 'Email address is required.'
    isValid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Please enter a valid email address.'
    isValid = false
  }

  if (!form.phoneNumber) {
    errors.phoneNumber = 'Phone number is required.'
    isValid = false
  } else if (!/^[0-9+\s\-]{8,15}$/.test(form.phoneNumber)) {
    errors.phoneNumber = 'Please enter a valid phone number (8-15 digits).'
    isValid = false
  }

  if (!form.password) {
    errors.password = 'Password is required.'
    isValid = false
  } else if (form.password.length < 6) {
    errors.password = 'Password must be at least 6 characters.'
    isValid = false
  }

  if (form.confirmPassword !== form.password) {
    errors.confirmPassword = 'Passwords do not match.'
    isValid = false
  }

  if (!form.bloodType) {
    errors.bloodType = 'Please select your blood type.'
    isValid = false
  }

  if (!form.city) {
    errors.city = 'Please select your city.'
    isValid = false
  }

  return isValid
}

function mapFirebaseError(code) {
  const messages = {
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/weak-password': 'Password is too weak. Please use at least 6 characters.'
  }
  return messages[code] || 'Registration failed. Please try again.'
}

async function handleRegister() {
  if (!validateForm()) return
  isLoading.value = true
  try {
    await register({
      email: form.email,
      password: form.password,
      displayName: form.displayName,
      phoneNumber: form.phoneNumber,
      bloodType: form.bloodType,
      city: form.city
    })
    showToast('Account created! Welcome to LifeLink.', 'success')
    router.push('/dashboard')
  } catch (err) {
    console.error('[Register] handleRegister error:', err)
    const friendlyError = mapFirebaseError(err.code)
    showToast(friendlyError, 'danger')
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.ll-auth-link {
  color: var(--ll-wine-red);
  font-weight: 600;
}

.position-relative {
  position: relative;
}

.ll-password-toggle-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  padding: 0;
  color: var(--ll-slate-500);
  cursor: pointer;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ll-password-toggle-btn:hover {
  color: var(--ll-wine-red);
}

.ll-blood-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.ll-blood-btn {
  padding: 0.5rem;
  background-color: var(--ll-surface);
  border: 1px solid var(--ll-slate-200);
  border-radius: var(--ll-radius-sm);
  color: var(--ll-slate-700);
  font-weight: 700;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all var(--ll-transition-fast);
}

.ll-blood-btn:hover {
  border-color: var(--ll-wine-red);
  color: var(--ll-wine-red);
}

.ll-blood-btn.active {
  background-color: var(--ll-wine-red);
  border-color: var(--ll-wine-red);
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(142, 36, 53, 0.3);
}
</style>
