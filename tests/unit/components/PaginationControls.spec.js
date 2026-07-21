import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PaginationControls from '@/components/PaginationControls.vue'

describe('PaginationControls.vue', () => {
  it('does not render pagination when totalPages is 1', () => {
    const wrapper = mount(PaginationControls, {
      props: { currentPage: 1, totalPages: 1 }
    })
    expect(wrapper.find('nav').exists()).toBe(false)
  })

  it('renders correct page buttons and handles events', async () => {
    const wrapper = mount(PaginationControls, {
      props: { currentPage: 2, totalPages: 5 }
    })

    const buttons = wrapper.findAll('.ll-page-button')
    // Previous, Page 1, 2, 3, 4, 5, Next -> 7 buttons total
    expect(buttons.length).toBe(7)
    
    // Page 2 should be active
    const activeBtn = wrapper.find('.ll-page-button--active')
    expect(activeBtn.text()).toBe('2')

    // Click page 4 and assert emit
    const page4Btn = buttons.find(btn => btn.text() === '4')
    await page4Btn.trigger('click')
    expect(wrapper.emitted('page-change')[0]).toEqual([4])
  })

  it('disables previous button on page 1', () => {
    const wrapper = mount(PaginationControls, {
      props: { currentPage: 1, totalPages: 3 }
    })
    const prevBtn = wrapper.findAll('.ll-page-button')[0]
    expect(prevBtn.attributes('disabled')).toBeDefined()
  })

  it('disables next button on final page', () => {
    const wrapper = mount(PaginationControls, {
      props: { currentPage: 3, totalPages: 3 }
    })
    const buttons = wrapper.findAll('.ll-page-button')
    const nextBtn = buttons[buttons.length - 1]
    expect(nextBtn.attributes('disabled')).toBeDefined()
  })

  it('renders ellipsis for broad page counts', () => {
    const wrapper = mount(PaginationControls, {
      props: { currentPage: 5, totalPages: 10 }
    })
    const ellipsis = wrapper.findAll('.ll-page-ellipsis')
    expect(ellipsis.length).toBe(2) // ellipsis at start and end
  })
})
