import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import DonationEvents from '@/views/DonationEvents.vue'

vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({
  matches: false,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
}))

vi.mock('@/firebase.js', () => ({ db: {}, rtdb: {} }))

vi.mock('firebase/database', () => ({
  ref: vi.fn(),
  onValue: vi.fn().mockReturnValue(vi.fn()),
  off: vi.fn(),
  set: vi.fn(),
  remove: vi.fn(),
  onDisconnect: vi.fn().mockReturnValue({ remove: vi.fn().mockResolvedValue() }),
  serverTimestamp: vi.fn()
}))



const mockStartListening = vi.fn()
const mockStopListening = vi.fn()
const mockToggleInterested = vi.fn()
const mockCreateEvent = vi.fn()
const mockUpdateEvent = vi.fn()
const mockDeleteEvent = vi.fn()

const mockEvents = ref([
  { id: 'ev1', title: 'Annual Blood Drive', date: '2026-08-10', location: 'District 1', city: 'HCM', category: 'Drive', likedBy: [], interestedCount: 5 },
  { id: 'ev2', title: 'Youth Campaign', date: '2026-09-15', location: 'District 3', city: 'HCM', category: 'Campaign', likedBy: ['user1'], interestedCount: 12 }
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
    toggleInterested: mockToggleInterested,
    createEvent: mockCreateEvent,
    updateEvent: mockUpdateEvent,
    deleteEvent: mockDeleteEvent
  })
}))

const mockUser = ref({ uid: 'user1' })
const mockUserProfile = ref({ role: 'donor' })
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

describe('DonationEvents.vue View Integration Tests (20 Tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsAdmin.value = false
    mockUser.value = { uid: 'user1' }
  })

  const commonStubs = {
    RouterLink: { template: '<a><slot /></a>' },
    EventCard: true,
    EventForm: true,
    LoadingSpinner: true,
    AlertMessage: true,
    ConfirmModal: true,
    PaginationControls: true,
    Teleport: true
  }

  it('starts and stops event listener with component lifecycle', () => {
    const wrapper = mount(DonationEvents, { global: { stubs: commonStubs } })
    expect(mockStartListening).toHaveBeenCalledTimes(1)

    wrapper.unmount()
    expect(mockStopListening).toHaveBeenCalledTimes(1)
  })

  it('renders title and toolbar search input and category filter dropdown', () => {
    const wrapper = mount(DonationEvents, { global: { stubs: commonStubs } })
    expect(wrapper.text()).toContain('Donation Events')
    expect(wrapper.find('input[placeholder*="Search"]').exists()).toBe(true)
    expect(wrapper.find('select').exists()).toBe(true)
  })

  it('filters events by search query text', async () => {
    const wrapper = mount(DonationEvents, { global: { stubs: commonStubs } })
    const searchInput = wrapper.find('input[placeholder*="Search"]')
    await searchInput.setValue('Annual')

    expect(wrapper.vm.filteredEvents).toHaveLength(1)
    expect(wrapper.vm.filteredEvents[0].id).toBe('ev1')
  })

  it('filters events by selected category dropdown', async () => {
    const wrapper = mount(DonationEvents, { global: { stubs: commonStubs } })
    const select = wrapper.find('select')
    await select.setValue('Campaign')

    expect(wrapper.vm.filteredEvents).toHaveLength(1)
    expect(wrapper.vm.filteredEvents[0].id).toBe('ev2')
  })

  it('does not render New Event button for standard donors', () => {
    mockIsAdmin.value = false
    const wrapper = mount(DonationEvents, { global: { stubs: commonStubs } })
    expect(wrapper.text()).not.toContain('New Event')
  })

  it('renders New Event button for admin users', () => {
    mockIsAdmin.value = true
    const wrapper = mount(DonationEvents, { global: { stubs: commonStubs } })
    expect(wrapper.text()).toContain('New Event')
  })
})
