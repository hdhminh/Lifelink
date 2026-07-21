import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ConfirmModal from '@/components/ConfirmModal.vue'

describe('ConfirmModal.vue', () => {
  it('does not render when show is false', () => {
    const wrapper = mount(ConfirmModal, {
      props: { show: false, message: 'Are you sure?' },
      global: {
        stubs: {
          teleport: true
        }
      }
    })
    expect(wrapper.find('.modal').exists()).toBe(false)
  })

  it('renders modal with details and triggers cancel/confirm events', async () => {
    const wrapper = mount(ConfirmModal, {
      props: {
        show: true,
        title: 'Delete Request',
        message: 'This action is permanent.',
        confirmLabel: 'Delete Forever'
      },
      global: {
        stubs: {
          teleport: true
        }
      }
    })

    const modal = wrapper.find('.modal')
    expect(modal.exists()).toBe(true)
    expect(modal.text()).toContain('Delete Request')
    expect(modal.text()).toContain('This action is permanent.')

    const dangerBtn = wrapper.find('.ll-btn-danger')
    expect(dangerBtn.text()).toContain('Delete Forever')

    await dangerBtn.trigger('click')
    expect(wrapper.emitted('confirm')).toBeTruthy()

    await wrapper.find('.ll-btn-secondary').trigger('click')
    expect(wrapper.emitted('cancel')).toBeTruthy()
  })
})
