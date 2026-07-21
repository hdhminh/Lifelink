import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { vHighlightUrgency } from '@/directives/highlightUrgency.js'
import { defineComponent } from 'vue'

describe('v-highlight-urgency directive', () => {
  const TestComponent = defineComponent({
    props: ['level'],
    directives: {
      'highlight-urgency': vHighlightUrgency
    },
    template: `<div v-highlight-urgency="level" id="test-element">Badge</div>`
  })

  it('applies critical class correctly', () => {
    const wrapper = mount(TestComponent, {
      props: { level: 'critical' }
    })
    const el = wrapper.find('#test-element')
    expect(el.classes()).toContain('ll-urgency-critical')
    expect(el.classes()).not.toContain('ll-urgency-urgent')
    expect(el.classes()).not.toContain('ll-urgency-moderate')
  })

  it('applies urgent class correctly', () => {
    const wrapper = mount(TestComponent, {
      props: { level: 'Urgent' } // Test case-insensitivity
    })
    const el = wrapper.find('#test-element')
    expect(el.classes()).toContain('ll-urgency-urgent')
  })

  it('applies moderate class correctly', () => {
    const wrapper = mount(TestComponent, {
      props: { level: 'MODERATE' }
    })
    const el = wrapper.find('#test-element')
    expect(el.classes()).toContain('ll-urgency-moderate')
  })

  it('updates class when bound value changes', async () => {
    const wrapper = mount(TestComponent, {
      props: { level: 'moderate' }
    })
    const el = wrapper.find('#test-element')
    expect(el.classes()).toContain('ll-urgency-moderate')

    await wrapper.setProps({ level: 'critical' })
    expect(el.classes()).toContain('ll-urgency-critical')
    expect(el.classes()).not.toContain('ll-urgency-moderate')
  })

  it('does not crash or set classes for invalid values', () => {
    const wrapper = mount(TestComponent, {
      props: { level: 'unknown-status' }
    })
    const el = wrapper.find('#test-element')
    expect(el.classes()).not.toContain('ll-urgency-critical')
    expect(el.classes()).not.toContain('ll-urgency-urgent')
    expect(el.classes()).not.toContain('ll-urgency-moderate')
  })
})
