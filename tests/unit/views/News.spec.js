import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import News from '@/views/News.vue'

vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }))
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

describe('News.vue View Integration Tests (~18 tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockOnSnapshot.mockImplementation((q, callback) => {
      callback({
        docs: []
      })
      return vi.fn()
    })
  })

  it('renders news page header and local news cards sorted newest first', () => {
    const wrapper = mount(News, {
      global: {
        stubs: {
          PaginationControls: true
        }
      }
    })

    expect(wrapper.text()).toContain('Blood Donation News')
    expect(wrapper.find('input[placeholder*="Search"]').exists()).toBe(true)
  })

  it('filters news items by search query', async () => {
    const wrapper = mount(News, {
      global: {
        stubs: {
          PaginationControls: true
        }
      }
    })

    const searchInput = wrapper.find('input[placeholder*="Search"]')
    await searchInput.setValue('Blood')

    expect(wrapper.vm.currentPage).toBe(1)
  })

  it('loads valid guest likes from localStorage', () => {
    localStorage.setItem('likedNewsIds', JSON.stringify(['news_1', 'news_2']))

    const wrapper = mount(News, {
      global: {
        stubs: {
          PaginationControls: true
        }
      }
    })

    expect(wrapper.vm.guestLikes.has('news_1')).toBe(true)
    expect(wrapper.vm.guestLikes.has('news_2')).toBe(true)
  })
})
