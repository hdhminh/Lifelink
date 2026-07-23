import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppFooter from '@/components/AppFooter.vue'

describe('AppFooter.vue', () => {
  it('renders footer brand title and copyright text', () => {
    const wrapper = mount(AppFooter, {
      global: {
        stubs: {
          RouterLink: {
            template: '<a><slot /></a>'
          }
        }
      }
    })

    expect(wrapper.text()).toContain('LifeLink')
    expect(wrapper.text()).toContain('Emergency donor coordination network')
    expect(wrapper.text()).toContain('Emergency Blood Donor Network © 2026')
    expect(wrapper.text()).toContain('LifeLink Vietnam')
  })

  it('contains links to key navigation routes', () => {
    const wrapper = mount(AppFooter, {
      global: {
        stubs: {
          RouterLink: {
            template: '<a><slot /></a>'
          }
        }
      }
    })

    const text = wrapper.text()
    expect(text).toContain('Emergency Board')
    expect(text).toContain('Events')
    expect(text).toContain('News')
    expect(text).toContain('About')
  })
})
