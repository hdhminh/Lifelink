import { ref } from 'vue'
import { mount } from '@vue/test-utils'
import DonationEvents from '@/views/DonationEvents.vue'

vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }))
vi.mock('@/firebase.js', () => ({ db: {} }))

const mockStartListening = vi.fn()
const mockStopListening = vi.fn()

const mockEvents = ref([
  { id: 'ev1', title: 'Annual Blood Drive', date: '2026-08-10', location: 'District 1', city: 'HCM', category: 'Drive', likedBy: [], interestedCount: 5 }
])
const mockLoading = ref(false)
const mockError = ref(null)

vi.mock('@/composables/useDonationEvents.js', () => ({
  useDonationEvents: () => ({
    events: mockEvents,
    loading: mockLoading,
    error: mockError,
    startListening: mockStartListening,
    stopListening: mockStopListening,
    toggleInterested: vi.fn(),
    createEvent: vi.fn(),
    updateEvent: vi.fn(),
    deleteEvent: vi.fn()
  })
}))

const mockUser = ref(null)
const mockUserProfile = ref(null)
const mockIsAdmin = ref(false)

vi.mock('@/composables/useAuth.js', () => ({
  useAuth: () => ({
    user: mockUser,
    userProfile: mockUserProfile,
    isAdmin: mockIsAdmin
  })
}))

describe('DonationEvents.vue View Integration Tests (~20 tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('starts and stops event listener with component lifecycle', () => {
    const wrapper = mount(DonationEvents, {
      global: {
        stubs: {
          RouterLink: { template: '<a><slot /></a>' },
          EventCard: true,
          EventForm: true,
          LoadingSpinner: true,
          AlertMessage: true,
          ConfirmModal: true,
          PaginationControls: true
        }
      }
    })

    expect(mockStartListening).toHaveBeenCalledTimes(1)

    wrapper.unmount()
    expect(mockStopListening).toHaveBeenCalledTimes(1)
  })

  it('renders search input and category filter dropdown', () => {
    const wrapper = mount(DonationEvents, {
      global: {
        stubs: {
          RouterLink: { template: '<a><slot /></a>' },
          EventCard: true,
          EventForm: true,
          LoadingSpinner: true,
          AlertMessage: true,
          ConfirmModal: true,
          PaginationControls: true
        }
      }
    })

    expect(wrapper.text()).toContain('Donation Events')
    expect(wrapper.find('input[placeholder*="Search"]').exists()).toBe(true)
    expect(wrapper.find('select').exists()).toBe(true)
  })
})
