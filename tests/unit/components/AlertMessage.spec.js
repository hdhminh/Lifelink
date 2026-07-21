import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import AlertMessage from '@/components/AlertMessage.vue'

describe('AlertMessage.vue', () => {
  it('renders standard alert message', () => {
    const wrapper = mount(AlertMessage, {
      props: { message: 'Alert content', type: 'warning' }
    })
    expect(wrapper.text()).toContain('Alert content')
    expect(wrapper.classes()).toContain('ll-alert--warning')
    expect(wrapper.find('i').classes()).toContain('bi-exclamation-triangle-fill')
  })

  it('can be dismissed when dismissible is true', async () => {
    const wrapper = mount(AlertMessage, {
      props: { message: 'Dismissible alert', dismissible: true }
    })
    const closeBtn = wrapper.find('.ll-alert__close')
    expect(closeBtn.exists()).toBe(true)

    await closeBtn.trigger('click')
    expect(wrapper.find('.ll-alert').exists()).toBe(false)
  })

  it('is not dismissible when dismissible is false', () => {
    const wrapper = mount(AlertMessage, {
      props: { message: 'Non-dismissible alert', dismissible: false }
    })
    expect(wrapper.find('.ll-alert__close').exists()).toBe(false)
  })

  it('triggers auto-dismiss on success alerts', async () => {
    vi.useFakeTimers()
    const wrapper = mount(AlertMessage, {
      props: { message: 'Action succeeded', type: 'success' }
    })
    expect(wrapper.find('.ll-alert').exists()).toBe(true)

    vi.advanceTimersByTime(5000)
    await wrapper.vm.$nextTick()
    
    expect(wrapper.find('.ll-alert').exists()).toBe(false)
    vi.useRealTimers()
  })
})
