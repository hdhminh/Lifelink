<template>
  <div class="ll-auth-page">
    <form ref="loginCard" class="ll-auth-card" @submit.prevent="handleLogin" novalidate>
      <div class="ll-auth-card__logo">
        <h2>LifeLink Login</h2>
        <p class="ll-text-meta mb-0">Access your donor dashboard and emergency board.</p>
      </div>

      <div class="ll-form-group">
        <label for="login-email" class="form-label">Email</label>
        <div class="position-relative">
          <input 
            id="login-email" 
            v-model.trim="formEmail" 
            class="form-control" 
            :class="{ 'is-invalid': errors.email }" 
            type="email" 
            placeholder="Enter your email"
            autocomplete="email"
          >
        </div>
        <div v-if="errors.email" class="invalid-feedback d-block">{{ errors.email }}</div>
      </div>

      <div class="ll-form-group">
        <label for="login-password" class="form-label">Password</label>
        <div class="position-relative">
          <input 
            id="login-password" 
            v-model="formPassword" 
            class="form-control pe-5" 
            :class="{ 'is-invalid': errors.password }" 
            :type="showPassword ? 'text' : 'password'" 
            placeholder="Enter your password"
            autocomplete="current-password"
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
        <div v-if="errors.password" class="invalid-feedback d-block">{{ errors.password }}</div>
      </div>

      <button class="ll-btn-primary ll-btn-block mt-3" type="submit" :disabled="isLoading">
        {{ isLoading ? 'Logging in...' : 'Login' }}
      </button>

      <p class="ll-text-meta text-center mt-3 mb-0">
        New donor?
        <RouterLink to="/register" class="ll-auth-link">Create an account</RouterLink>
      </p>
    </form>
  </div>
</template>

<script setup>
/**
 * Login.vue
 * Firebase email/password login form with validation and loading/error states.
 */
import { reactive, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth.js'
import { useToast } from '@/composables/useToast.js'

const { login } = useAuth()
const { showToast } = useToast()
const router = useRouter()
const route = useRoute()

const loginCard = ref(null)
const formEmail = ref('')
const formPassword = ref('')
const showPassword = ref(false)
const isLoading = ref(false)

const errors = reactive({
  email: '',
  password: ''
})

/**
 * Validates form inputs before submitting.
 * @returns {boolean} True if all fields are valid.
 */
function validateForm() {
  errors.email = ''
  errors.password = ''
  let isValid = true

  if (!formEmail.value) {
    errors.email = 'Email address is required.'
    isValid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formEmail.value)) {
    errors.email = 'Please enter a valid email address.'
    isValid = false
  }

  if (!formPassword.value) {
    errors.password = 'Password is required.'
    isValid = false
  }

  return isValid
}

/**
 * Maps Firebase auth error codes to user-friendly Vietnamese/English messages.
 * @param {string} code - Firebase error code.
 * @returns {string} Friendly error message.
 */
function mapFirebaseError(code) {
  const messages = {
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/invalid-credential': 'Email or password is incorrect.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.'
  }
  return messages[code] || 'Login failed. Please try again.'
}

/**
 * Submits the login request and redirects on success.
 * @returns {Promise<void>}
 */
async function handleLogin() {
  if (!validateForm()) return
  isLoading.value = true
  try {
    await login(formEmail.value, formPassword.value)
    showToast('Signed in successfully.', 'success')
    const redirect = route.query.redirect || '/dashboard'
    router.push(redirect)
  } catch (err) {
    console.error('[Login] handleLogin error:', err)
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
</style>
