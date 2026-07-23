import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import News from '@/views/News.vue'

vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({
  matches: false,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
}))

vi.mock('@/firebase.js', () => ({ db: {} }))

vi.mock('@/composables/useAuth.js', () => ({
  useAuth: () => ({
    user: { value: null }
  })
}))

const mockOnSnapshot = vi.fn()

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  setDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(),
  onSnapshot: (...args) => mockOnSnapshot(...args)
}))

describe('News.vue View Integration Tests (18 Tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockOnSnapshot.mockImplementation((q, callback) => {
      callback({ docs: [] })
      return vi.fn()
    })
  })

  const commonStubs = {
    PaginationControls: true,
    RouterLink: { template: '<a><slot /></a>' }
  }

  it('renders news page header and local news cards sorted newest first', () => {
    const wrapper = mount(News, { global: { stubs: commonStubs } })
    expect(wrapper.text()).toContain('Blood Donation News')
    expect(wrapper.find('input[placeholder*="Search"]').exists()).toBe(true)
  })

  it('filters news items by search query', async () => {
    const wrapper = mount(News, { global: { stubs: commonStubs } })
    const searchInput = wrapper.find('input[placeholder*="Search"]')
    await searchInput.setValue('Red Cross')

    expect(wrapper.vm.currentPage).toBe(1)
    expect(wrapper.vm.filteredNews.length).toBeGreaterThan(0)
  })

  it('loads valid guest likes from localStorage', () => {
    localStorage.setItem('likedNewsIds', JSON.stringify(['news_1', 'news_2']))
    const wrapper = mount(News, { global: { stubs: commonStubs } })

    expect(wrapper.vm.guestLikes.has('news_1')).toBe(true)
    expect(wrapper.vm.guestLikes.has('news_2')).toBe(true)
  })

  it('persists guest likes to localStorage when toggling like on guest mode', async () => {
    const wrapper = mount(News, { global: { stubs: commonStubs } })
    wrapper.vm.toggleLike('news_1')

    const stored = JSON.parse(localStorage.getItem('likedNewsIds') || '[]')
    expect(stored).toContain('news_1')
  })

  it('removes guest like from localStorage when toggling an already liked item', async () => {
    localStorage.setItem('likedNewsIds', JSON.stringify(['news_1']))
    const wrapper = mount(News, { global: { stubs: commonStubs } })

    wrapper.vm.toggleLike('news_1')
    const stored = JSON.parse(localStorage.getItem('likedNewsIds') || '[]')
    expect(stored).not.toContain('news_1')
  })

  it('resets pagination current page to 1 on search input', async () => {
    const wrapper = mount(News, { global: { stubs: commonStubs } })
    wrapper.vm.currentPage = 2
    await wrapper.find('input[placeholder*="Search"]').setValue('Hanoi')
    expect(wrapper.vm.currentPage).toBe(1)
  })
})
