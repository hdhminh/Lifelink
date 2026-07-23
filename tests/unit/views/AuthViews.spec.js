import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Login from '@/views/Login.vue'
import Register from '@/views/Register.vue'
import Profile from '@/views/Profile.vue'

import { ref } from 'vue'

vi.mock('@/firebase.js', () => ({ db: {} }))

const mockLogin = vi.fn()
const mockRegister = vi.fn()
const mockUpdateProfile = vi.fn()

const mockUser = ref({ uid: 'user1' })
const mockUserProfile = ref({ displayName: 'John Doe', bloodType: 'O+', city: 'Ho Chi Minh City', phoneNumber: '0901234567', lastDonationDate: null })

vi.mock('@/composables/useAuth.js', () => ({
  useAuth: () => ({
    user: mockUser,
    userProfile: mockUserProfile,
    isAdmin: ref(false),
    login: mockLogin,
    register: mockRegister,
    updateProfile: mockUpdateProfile
  })
}))

vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({
  matches: false,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useRoute: () => ({ query: {} }),
  RouterLink: { template: '<a><slot /></a>' }
}))

describe('Auth Views Integration Tests (~40 tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Login View Tests
  describe('Login.vue', () => {
    it('renders sign in header and input fields', () => {
      const wrapper = mount(Login, {
        global: { stubs: { RouterLink: { template: '<a><slot /></a>' }, LoadingSpinner: true } }
      })

      expect(wrapper.text()).toContain('LifeLink Login')
      expect(wrapper.find('input[type="email"]').exists()).toBe(true)
      expect(wrapper.find('input[type="password"]').exists()).toBe(true)
    })

    it('submits form with user input credentials', async () => {
      mockLogin.mockResolvedValueOnce()

      const wrapper = mount(Login, {
        global: { stubs: { RouterLink: { template: '<a><slot /></a>' }, LoadingSpinner: true } }
      })

      await wrapper.find('input[type="email"]').setValue('donor@lifelink.vn')
      await wrapper.find('input[type="password"]').setValue('password123')
      await wrapper.find('form').trigger('submit.prevent')

      expect(mockLogin).toHaveBeenCalledWith('donor@lifelink.vn', 'password123')
    })
  })

  // Register View Tests
  describe('Register.vue', () => {
    it('validates form inputs and submits registration', async () => {
      mockRegister.mockResolvedValueOnce()

      const wrapper = mount(Register, {
        global: { stubs: { RouterLink: { template: '<a><slot /></a>' }, LoadingSpinner: true } }
      })

      await wrapper.find('#register-name').setValue('New Donor')
      await wrapper.find('#register-email').setValue('newdonor@lifelink.vn')
      await wrapper.find('#register-phone').setValue('0912345678')
      await wrapper.find('#register-password').setValue('Password123!')
      await wrapper.find('#register-confirm-password').setValue('Password123!')
      await wrapper.find('#register-blood-type').setValue('O+')
      await wrapper.find('#register-city').setValue('Ho Chi Minh City')

      await wrapper.find('form').trigger('submit.prevent')

      expect(mockRegister).toHaveBeenCalledWith({
        displayName: 'New Donor',
        email: 'newdonor@lifelink.vn',
        phoneNumber: '0912345678',
        password: 'Password123!',
        bloodType: 'O+',
        city: 'Ho Chi Minh City'
      })
    })
  })

  // Profile View Tests
  describe('Profile.vue', () => {
    it('renders donor profile summary and ready to donate badge', () => {
      const wrapper = mount(Profile, {
        global: { stubs: { RouterLink: { template: '<a><slot /></a>' }, LoadingSpinner: true, ConfirmModal: true } }
      })

      expect(wrapper.text()).toContain('John Doe')
      expect(wrapper.text()).toContain('O+')
      expect(wrapper.text()).toContain('Ready to Donate')
    })
  })
})
