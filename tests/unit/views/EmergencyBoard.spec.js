import { ref } from 'vue'
import { mount } from '@vue/test-utils'
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
const mockFilterRequests = vi.fn().mockReturnValue([
  { id: 'req1', hospitalName: 'Cho Ray', bloodType: 'O+', city: 'Ho Chi Minh City', urgency: 'critical', confirmedCount: 0, unitsNeeded: 5 }
])

const mockRequests = ref([])
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

describe('EmergencyBoard.vue View Integration Tests (~30 tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('starts emergency listener on mount and stops listener on unmount', () => {
    const wrapper = mount(EmergencyBoard, {
      global: {
        stubs: {
          RouterLink: { template: '<a><slot /></a>' },
          RequestCard: true,
          RequestForm: true,
          LoadingSpinner: true,
          AlertMessage: true,
          ConfirmModal: true,
          PaginationControls: true,
          Teleport: true
        }
      }
    })

    expect(mockStartListening).toHaveBeenCalledTimes(1)

    wrapper.unmount()
    expect(mockStopListening).toHaveBeenCalledTimes(1)
  })

  it('renders filter controls and clear filters button', () => {
    const wrapper = mount(EmergencyBoard, {
      global: {
        stubs: {
          RouterLink: { template: '<a><slot /></a>' },
          RequestCard: true,
          RequestForm: true,
          LoadingSpinner: true,
          AlertMessage: true,
          ConfirmModal: true,
          PaginationControls: true,
          Teleport: true
        }
      }
    })

    expect(wrapper.text()).toContain('Emergency Request Board')
    expect(wrapper.find('#filter-city').exists()).toBe(true)
    expect(wrapper.text()).toContain('Required Blood Type')
    expect(wrapper.text()).toContain('Urgency Tier')
  })
})
