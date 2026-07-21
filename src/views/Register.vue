<template>
  <div class="ll-auth-page">
    <form ref="registerCard" class="ll-auth-card" style="opacity: 0" @submit.prevent="handleRegister" novalidate>
      <div class="ll-auth-card__logo">
        <h2>Register as Donor</h2>
        <p class="ll-text-meta mb-0">Create a profile for emergency blood coordination.</p>
      </div>

      <div class="ll-form-group">
        <label for="register-name">Full Name</label>
        <input id="register-name" v-model.trim="form.displayName" class="form-control" :class="{ 'is-invalid': errors.displayName }" type="text" autocomplete="name">
        <div v-if="errors.displayName" class="invalid-feedback d-block">{{ errors.displayName }}</div>
      </div>

      <div class="ll-form-group">
        <label for="register-email">Email</label>
        <input id="register-email" v-model.trim="form.email" class="form-control" :class="{ 'is-invalid': errors.email }" type="email" autocomplete="email">
        <div v-if="errors.email" class="invalid-feedback d-block">{{ errors.email }}</div>
      </div>

      <div class="ll-form-group">
        <label for="register-phone">Phone Number</label>
        <input id="register-phone" v-model.trim="form.phoneNumber" class="form-control" :class="{ 'is-invalid': errors.phoneNumber }" type="tel" placeholder="e.g. 0901234567" autocomplete="tel">
        <div v-if="errors.phoneNumber" class="invalid-feedback d-block">{{ errors.phoneNumber }}</div>
      </div>

      <div class="ll-form-group">
        <label for="register-password">Password</label>
        <div class="position-relative">
          <input 
            id="register-password" 
            v-model="form.password" 
            class="form-control pe-5" 
            :class="{ 'is-invalid': errors.password }" 
            :type="showPassword ? 'text' : 'password'" 
            autocomplete="new-password"
          >
          <button 
            type="button" 
            class="ll-password-toggle-btn"
            @click="showPassword = !showPassword"
            title="Toggle password visibility"
          >
            <i :class="showPassword ? 'bi bi-eye-slash-fill' : 'bi bi-eye-fill'"></i>
          </button>
        </div>
        
        <!-- Password Strength & Suggestions -->
        <div v-if="form.password" class="mt-2 small text-start">
          <div class="d-flex justify-content-between align-items-center mb-1">
            <span class="text-slate-500">Strength:</span>
            <span :class="passwordStrength.class" class="fw-bold d-inline-flex align-items-center gap-1">
              <i :class="passwordStrength.icon" aria-hidden="true"></i>
              {{ passwordStrength.text }}
            </span>
          </div>
          <div 
            class="ll-password-suggestions p-2 rounded border mt-1"
            :style="suggestionsStyle"
          >
            <div class="d-flex align-items-center mb-1 gap-2" :class="hasMinLength ? 'll-suggestion-satisfied' : 'll-suggestion-unmet'">
              <i :class="hasMinLength ? 'bi bi-check-circle-fill' : 'bi bi-circle'"></i>
              <span>At least 8 characters</span>
            </div>
            <div class="d-flex align-items-center mb-1 gap-2" :class="hasMixedCase ? 'll-suggestion-satisfied' : 'll-suggestion-unmet'">
              <i :class="hasMixedCase ? 'bi bi-check-circle-fill' : 'bi bi-circle'"></i>
              <span>Uppercase & lowercase letters</span>
            </div>
            <div class="d-flex align-items-center mb-1 gap-2" :class="hasNumber ? 'll-suggestion-satisfied' : 'll-suggestion-unmet'">
              <i :class="hasNumber ? 'bi bi-check-circle-fill' : 'bi bi-circle'"></i>
              <span>At least one number (0-9)</span>
            </div>
            <div class="d-flex align-items-center gap-2" :class="hasSpecialChar ? 'll-suggestion-satisfied' : 'll-suggestion-unmet'">
              <i :class="hasSpecialChar ? 'bi bi-check-circle-fill' : 'bi bi-circle'"></i>
              <span>Special character (e.g. @, #, $, ...)</span>
            </div>
          </div>
        </div>
        <div v-if="errors.password" class="invalid-feedback d-block">{{ errors.password }}</div>
      </div>

      <div class="ll-form-group">
        <label for="register-confirm-password">Confirm Password</label>
        <div class="position-relative">
          <input 
            id="register-confirm-password" 
            v-model="form.confirmPassword" 
            class="form-control pe-5" 
            :class="{ 'is-invalid': errors.confirmPassword }" 
            :type="showConfirmPassword ? 'text' : 'password'" 
            autocomplete="new-password"
          >
          <button 
            type="button" 
            class="ll-password-toggle-btn"
            @click="showConfirmPassword = !showConfirmPassword"
            title="Toggle password visibility"
          >
            <i :class="showConfirmPassword ? 'bi bi-eye-slash-fill' : 'bi bi-eye-fill'"></i>
          </button>
        </div>
        <div v-if="errors.confirmPassword" class="invalid-feedback d-block">{{ errors.confirmPassword }}</div>
      </div>

      <div class="row g-3">
        <div class="col-md-6 ll-form-group">
          <label for="register-blood-type">Blood Type</label>
          <select id="register-blood-type" v-model="form.bloodType" class="form-select" :class="{ 'is-invalid': errors.bloodType }">
            <option value="">Select type</option>
            <option v-for="type in bloodTypes" :key="type" :value="type">{{ type }}</option>
          </select>
          <div v-if="errors.bloodType" class="invalid-feedback d-block">{{ errors.bloodType }}</div>
        </div>
        <div class="col-md-6 ll-form-group">
          <label for="register-city">City</label>
          <select id="register-city" v-model="form.city" class="form-select" :class="{ 'is-invalid': errors.city }">
            <option value="">Select city</option>
            <option v-for="city in cities" :key="city" :value="city">{{ city }}</option>
          </select>
          <div v-if="errors.city" class="invalid-feedback d-block">{{ errors.city }}</div>
        </div>
      </div>

      <button class="ll-btn-primary ll-btn-block" type="submit" :disabled="isLoading">
        {{ isLoading ? 'Creating account...' : 'Create Donor Account' }}
      </button>

      <p class="ll-text-meta text-center mt-3 mb-0">
        Already registered?
        <RouterLink to="/login" class="ll-auth-link">Login</RouterLink>
      </p>
    </form>
  </div>
</template>

<script setup>
/**
 * Register.vue
 * Firebase donor registration form with validation and profile creation.
 */
import { reactive, ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth.js'
import { useToast } from '@/composables/useToast.js'
import { animate } from 'motion'

const registerCard = ref(null)

onMounted(() => {
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    animate(
      registerCard.value,
      { opacity: [0, 1], y: [24, 0] },
      { duration: 0.5, easing: [0.23, 1, 0.32, 1] }
    )
  } else {
    registerCard.value.style.opacity = '1'
  }
})

const { register } = useAuth()
const router = useRouter()
const { showToast } = useToast()
const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const cities = ['Ho Chi Minh City', 'Ha Noi', 'Da Nang', 'Can Tho', 'Hue', 'Hai Phong', 'Other']

const form = reactive({
  displayName: '',
  email: '',
  phoneNumber: '',
  password: '',
  confirmPassword: '',
  bloodType: '',
  city: ''
})
const errors = reactive({})
const isLoading = ref(false)

const showPassword = ref(false)
const showConfirmPassword = ref(false)

const hasMinLength = computed(() => form.password.length >= 8)
const hasNumber = computed(() => /\d/.test(form.password))
const hasMixedCase = computed(() => /[a-z]/.test(form.password) && /[A-Z]/.test(form.password))
const hasSpecialChar = computed(() => /[@$!%*?&]/.test(form.password))

const passwordStrength = computed(() => {
  const pwd = form.password
  if (!pwd) return { text: 'None', class: 'text-slate-400', icon: 'bi bi-shield', score: 0 }
  
  let score = 0
  if (hasMinLength.value) score++
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++
  if (/\d/.test(pwd)) score++
  if (/[@$!%*?&]/.test(pwd)) score++
  
  if (score <= 1) return { text: 'Weak', class: 'll-strength-weak', icon: 'bi bi-shield-fill-x', score }
  if (score <= 3) return { text: 'Medium', class: 'll-strength-medium', icon: 'bi bi-shield-fill-exclamation', score }
  return { text: 'Strong', class: 'll-strength-strong', icon: 'bi bi-shield-fill-check', score }
})

const suggestionsStyle = computed(() => {
  const score = passwordStrength.value.score
  if (score === 0) {
    return {
      backgroundColor: '#f8f9fa',
      borderColor: '#e9ecef'
    }
  }
  if (score <= 1) {
    return {
      backgroundColor: '#fff5f5',
      borderColor: '#ffe3e3'
    }
  }
  if (score <= 3) {
    return {
      backgroundColor: '#fffbeb',
      borderColor: '#fef3c7'
    }
  }
  return {
    backgroundColor: '#f0fdf4',
    borderColor: '#dcfce7'
  }
})

/**
 * Validates donor registration fields.
 * @returns {boolean} Whether the registration form is valid.
 */
function validateForm() {
  Object.keys(errors).forEach(key => delete errors[key])
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const phonePattern = /^(0|\+84|84)(3|5|7|8|9)([0-9]{8})$/

  if (!form.displayName || form.displayName.length < 2) errors.displayName = 'Name must be at least 2 characters.'
  if (!emailPattern.test(form.email)) errors.email = 'Please enter a valid email address.'
  if (!form.phoneNumber) {
    errors.phoneNumber = 'Phone number is required.'
  } else if (!phonePattern.test(form.phoneNumber)) {
    errors.phoneNumber = 'Please enter a valid Vietnamese phone number (e.g. 0901234567 or +84901234567).'
  }
  if (!form.password || form.password.length < 8) errors.password = 'Password must be at least 8 characters.'
  if (form.confirmPassword !== form.password) errors.confirmPassword = 'Passwords must match.'
  if (!bloodTypes.includes(form.bloodType)) errors.bloodType = 'Please select your blood type.'
  if (!form.city) errors.city = 'Please select your city.'
  return Object.keys(errors).length === 0
}

/**
 * Maps Firebase auth errors to user-friendly copy.
 * @param {string} code - Firebase error code.
 * @returns {string} Friendly message.
 */
function mapFirebaseError(code) {
  const messages = {
    'auth/email-already-in-use': 'This email is already registered.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/weak-password': 'Password is too weak. Use at least 8 characters.'
  }
  return messages[code] || 'Registration failed. Please try again.'
}

/**
 * Creates the donor account and navigates to the dashboard.
 * @returns {Promise<void>}
 */
async function handleRegister() {
  if (!validateForm()) return
  isLoading.value = true
  try {
    await register({
      email: form.email,
      password: form.password,
      displayName: form.displayName,
      bloodType: form.bloodType,
      city: form.city,
      phoneNumber: form.phoneNumber
    })
    showToast('Registration successful! Welcome to LifeLink.', 'success')
    router.push({ name: 'Dashboard' })
  } catch (err) {
    showToast(mapFirebaseError(err.code), 'danger')
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

.ll-password-suggestions {
  transition: all var(--ll-transition);
}

.ll-password-suggestions div {
  font-size: 0.8rem;
  transition: color var(--ll-transition);
}

.ll-password-suggestions i {
  font-size: 0.9rem;
  transition: transform var(--ll-transition);
}

.ll-suggestion-satisfied {
  color: #198754 !important;
}

.ll-suggestion-unmet {
  color: var(--ll-slate-400) !important;
}

.ll-strength-weak {
  color: #dc3545 !important;
}

.ll-strength-medium {
  color: #f57c00 !important;
}

.ll-strength-strong {
  color: #198754 !important;
}
</style>
