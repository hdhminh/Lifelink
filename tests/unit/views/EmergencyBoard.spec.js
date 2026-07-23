import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import EmergencyBoard from '@/views/EmergencyBoard.vue'

vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({
  matches: false,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
}))

vi.mock('@/firebase.js', () => ({ db: {} }))

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  onSnapshot: vi.fn().mockReturnValue(vi.fn())
}))

const mockStartListening = vi.fn()
const mockStopListening = vi.fn()
const mockFilterRequests = vi.fn().mockImplementation((bloodType, city, urgency) => {
  const all = [
    { id: 'req1', hospitalName: 'Cho Ray', bloodType: 'O+', city: 'Ho Chi Minh City', urgency: 'critical', confirmedCount: 0, unitsNeeded: 5 },
    { id: 'req2', hospitalName: 'Bach Mai', bloodType: 'A+', city: 'Hanoi', urgency: 'urgent', confirmedCount: 2, unitsNeeded: 3 }
  ]
  return all.filter(r => (!bloodType || r.bloodType === bloodType) && (!city || r.city.includes(city)) && (!urgency || r.urgency === urgency))
})

const mockRequests = ref([
  { id: 'req1', hospitalName: 'Cho Ray', bloodType: 'O+', city: 'Ho Chi Minh City', urgency: 'critical', confirmedCount: 0, unitsNeeded: 5 },
  { id: 'req2', hospitalName: 'Bach Mai', bloodType: 'A+', city: 'Hanoi', urgency: 'urgent', confirmedCount: 2, unitsNeeded: 3 }
])
const mockLoading = ref(false)
const mockError = ref(null)

vi.mock('@/composables/useEmergencyRequests.js', () => ({
  useEmergencyRequests: () => ({
    requests: mockRequests,
    loading: mockLoading,
    error: mockError,
    startListening: mockStartListening,
    stopListening: mockStopListening,
    filterRequests: mockFilterRequests,
    createRequest: vi.fn(),
    updateRequest: vi.fn(),
    deleteRequest: vi.fn()
  })
}))

const mockUser = ref({ uid: 'user1' })
const mockUserProfile = ref({ bloodType: 'O+', role: 'donor' })
const mockIsAdmin = ref(false)

vi.mock('@/composables/useAuth.js', () => ({
  useAuth: () => ({
    user: mockUser,
    userProfile: mockUserProfile,
    isAdmin: mockIsAdmin
  })
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useRoute: () => ({ query: {} }),
  RouterLink: { template: '<a><slot /></a>' }
}))

describe('EmergencyBoard.vue View Integration Tests (30 Tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsAdmin.value = false
    mockUser.value = { uid: 'user1' }
  })

  const commonStubs = {
    RouterLink: { template: '<a><slot /></a>' },
    RequestCard: true,
    RequestForm: true,
    LoadingSpinner: true,
    AlertMessage: true,
    ConfirmModal: true,
    PaginationControls: true,
    Teleport: true
  }

  it('starts emergency listener on mount and stops listener on unmount', () => {
    const wrapper = mount(EmergencyBoard, { global: { stubs: commonStubs } })
    expect(mockStartListening).toHaveBeenCalledTimes(1)
    wrapper.unmount()
    expect(mockStopListening).toHaveBeenCalledTimes(1)
  })

  it('renders section title and request counters', () => {
    const wrapper = mount(EmergencyBoard, { global: { stubs: commonStubs } })
    expect(wrapper.text()).toContain('Emergency Request Board')
    expect(wrapper.text()).toContain('2 active requests')
  })

  it('renders filter controls for city, blood type and urgency', () => {
    const wrapper = mount(EmergencyBoard, { global: { stubs: commonStubs } })
    expect(wrapper.find('#filter-city').exists()).toBe(true)
    expect(wrapper.text()).toContain('Required Blood Type')
    expect(wrapper.text()).toContain('Urgency Tier')
  })

  it('does not render New Request button for standard logged-in donors', () => {
    mockIsAdmin.value = false
    const wrapper = mount(EmergencyBoard, { global: { stubs: commonStubs } })
    expect(wrapper.text()).not.toContain('New Request')
  })

  it('renders New Request button for admin users', () => {
    mockIsAdmin.value = true
    const wrapper = mount(EmergencyBoard, { global: { stubs: commonStubs } })
    expect(wrapper.text()).toContain('New Request')
  })

  it('updates city filter model when user types in city input', async () => {
    const wrapper = mount(EmergencyBoard, { global: { stubs: commonStubs } })
    const cityInput = wrapper.find('#filter-city')
    await cityInput.setValue('Hanoi')
    expect(wrapper.vm.filterCity).toBe('Hanoi')
  })

  it('resets pagination current page to 1 when filter changes', async () => {
    const wrapper = mount(EmergencyBoard, { global: { stubs: commonStubs } })
    wrapper.vm.currentPage = 3
    await wrapper.find('#filter-city').setValue('Hanoi')
    expect(wrapper.vm.currentPage).toBe(1)
  })

  it('clears all filters when clear filters button is clicked', async () => {
    const wrapper = mount(EmergencyBoard, { global: { stubs: commonStubs } })
    wrapper.vm.filterBloodType = 'O+'
    wrapper.vm.filterCity = 'HCM'
    wrapper.vm.filterUrgency = 'critical'

    wrapper.vm.clearFilters()
    expect(wrapper.vm.filterBloodType).toBe('')
    expect(wrapper.vm.filterCity).toBe('')
    expect(wrapper.vm.filterUrgency).toBe('')
  })
})
