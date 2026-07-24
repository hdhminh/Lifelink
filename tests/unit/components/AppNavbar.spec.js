import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import AppNavbar from '@/components/AppNavbar.vue'

vi.mock('@/composables/useAuth.js', () => ({
  useAuth: () => ({
    user: { uid: 'user123' },
    userProfile: { displayName: 'John Doe', bloodType: 'O+', role: 'donor' },
    isAdmin: false,
    logout: vi.fn().mockResolvedValue()
  })
}))

vi.mock('@/composables/useToast.js', () => ({
  useToast: () => ({
    showToast: vi.fn()
  })
}))

describe('AppNavbar.vue', () => {
  const routerLinkStub = { template: '<a><slot /></a>' }

  it('renders application title and navbar component correctly', () => {
    const wrapper = mount(AppNavbar, {
      global: {
        stubs: {
          RouterLink: routerLinkStub
        }
      }
    })

    expect(wrapper.text()).toContain('LifeLink')
    expect(wrapper.text()).toContain('Emergency')
    expect(wrapper.text()).toContain('Events')

  })

  it('displays profile dashboard link and logout option when user is logged in', () => {
    const wrapper = mount(AppNavbar, {
      global: {
        stubs: {
          RouterLink: routerLinkStub
        }
      }
    })

    expect(wrapper.text()).toContain('Profile')
    expect(wrapper.text()).toContain('Logout')
  })

  it('renders mobile navigation toggle button', () => {
    const wrapper = mount(AppNavbar, {
      global: {
        stubs: {
          RouterLink: routerLinkStub
        }
      }
    })

    const toggleBtn = wrapper.find('.navbar-toggler')
    expect(toggleBtn.exists()).toBe(true)
    expect(toggleBtn.attributes('data-bs-toggle')).toBe('collapse')
    expect(toggleBtn.attributes('data-bs-target')).toBe('#navbarMain')
  })
})
