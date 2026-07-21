import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

describe('LoadingSpinner.vue', () => {
  it('renders with default message', () => {
    const wrapper = mount(LoadingSpinner)
    expect(wrapper.text()).toContain('Loading...')
    expect(wrapper.find('.ll-spinner').exists()).toBe(true)
  })

  it('renders custom message', () => {
    const wrapper = mount(LoadingSpinner, {
      props: { message: 'Fetching donors...' }
    })
    expect(wrapper.text()).toContain('Fetching donors...')
  })
})
