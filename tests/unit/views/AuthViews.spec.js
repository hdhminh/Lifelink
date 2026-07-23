import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import Login from '@/views/Login.vue'
import Register from '@/views/Register.vue'
import Profile from '@/views/Profile.vue'

vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({
  matches: false,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
}))

const mockLogin = vi.fn()
const mockRegister = vi.fn()
const mockLogout = vi.fn()
const mockUpdateProfile = vi.fn()
const mockUser = ref(null)
const mockUserProfile = ref(null)
const mockLoading = ref(false)
const mockError = ref(null)

vi.mock('@/composables/useAuth.js', () => ({
  useAuth: () => ({
    user: mockUser,
    userProfile: mockUserProfile,
    loading: mockLoading,
    error: mockError,
    login: mockLogin,
    register: mockRegister,
    logout: mockLogout,
    updateProfile: mockUpdateProfile
  })
}))

const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useRoute: () => ({ query: {} }),
  RouterLink: { template: '<a><slot /></a>' }
}))

describe('Auth Views Integration Tests (4 Tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUser.value = null
    mockUserProfile.value = null
    mockLoading.value = false
    mockError.value = null
  })

  const commonStubs = {
    RouterLink: { template: '<a><slot /></a>' },
    LoadingSpinner: true,
    AlertMessage: true
  }

  describe('Login.vue', () => {
    it('renders sign in header and input fields', () => {
      const wrapper = mount(Login, { global: { stubs: commonStubs } })
      expect(wrapper.text()).toContain('LifeLink Login')
      expect(wrapper.find('#login-email').exists()).toBe(true)
      expect(wrapper.find('#login-password').exists()).toBe(true)
    })

    it('binds email and password inputs to component state', async () => {
      const wrapper = mount(Login, { global: { stubs: commonStubs } })
      await wrapper.find('#login-email').setValue('donor@lifelink.vn')
      await wrapper.find('#login-password').setValue('Password123!')

      expect(wrapper.vm.formEmail).toBe('donor@lifelink.vn')
      expect(wrapper.vm.formPassword).toBe('Password123!')
    })
  })

  describe('Register.vue', () => {
    it('renders register header and form fields', () => {
      const wrapper = mount(Register, { global: { stubs: commonStubs } })
      expect(wrapper.text()).toContain('Register as Donor')
      expect(wrapper.find('input[type="email"]').exists()).toBe(true)
    })
  })

  describe('Profile.vue', () => {
    it('renders donor profile summary and ready to donate badge', () => {
      mockUser.value = { uid: 'user1', email: 'donor@lifelink.vn' }
      mockUserProfile.value = { displayName: 'Jane Donor', bloodType: 'O+', city: 'Hanoi', canDonateNow: true }

      const wrapper = mount(Profile, { global: { stubs: commonStubs } })
      expect(wrapper.text()).toContain('Jane Donor')
      expect(wrapper.text()).toContain('O+')
      expect(wrapper.text()).toContain('Hanoi')
    })
  })
})
