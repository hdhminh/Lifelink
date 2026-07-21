import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import RequestCard from '@/components/RequestCard.vue'
import { vHighlightUrgency } from '@/directives/highlightUrgency.js'

describe('RequestCard.vue', () => {
  const sampleRequest = {
    id: 'req1',
    hospitalName: 'Cho Ray Hospital',
    city: 'Ho Chi Minh City',
    bloodType: 'O-',
    unitsNeeded: 3,
    confirmedCount: 1,
    description: 'Transfusion needed for orthopedic surgery.',
    urgency: 'critical',
    contactInfo: '0901234567',
    createdAt: {
      toDate: () => new Date('2026-07-20T10:00:00Z')
    }
  }

  const sampleRequestDefaultContact = {
    id: 'req2',
    hospitalName: 'Hue Central Hospital',
    city: 'Hue',
    bloodType: 'A+',
    unitsNeeded: 2,
    confirmedCount: 0,
    description: 'A+ blood shortage.',
    urgency: 'urgent',
    contactInfo: '', // should default to 115
    createdAt: {
      toDate: () => new Date(Date.now() - 3600 * 1000) // 1 hour ago
    }
  }

  const sampleRequestInvalidContactText = {
    id: 'req3',
    hospitalName: 'Da Nang General',
    city: 'Da Nang',
    bloodType: 'B-',
    unitsNeeded: 1,
    confirmedCount: 0,
    description: 'Need B- donor.',
    urgency: 'moderate',
    contactInfo: 'Call coordinator ASAP', // should fallback to 115
    createdAt: {
      toDate: () => new Date()
    }
  }

  const mountOptions = {
    global: {
      directives: {
        'highlight-urgency': vHighlightUrgency
      }
    }
  }

  it('renders request details correctly', () => {
    const wrapper = mount(RequestCard, {
      ...mountOptions,
      props: { request: sampleRequest }
    })

    expect(wrapper.text()).toContain('Cho Ray Hospital')
    expect(wrapper.text()).toContain('Ho Chi Minh City')
    expect(wrapper.text()).toContain('O-')
    expect(wrapper.text()).toContain('Transfusion needed for orthopedic surgery.')
    expect(wrapper.find('.ll-progress-bar').exists()).toBe(true)
  })

  it('parses representative contact phone correctly', () => {
    const wrapper = mount(RequestCard, {
      ...mountOptions,
      props: { request: sampleRequest }
    })
    const phoneLink = wrapper.find('a[href^="tel:"]')
    expect(phoneLink.attributes('href')).toBe('tel:0901234567')
    expect(phoneLink.text()).toContain('Call 0901234567')
    expect(wrapper.text()).toContain('Contact us')
  })

  it('falls back to 115 for empty contact info', () => {
    const wrapper = mount(RequestCard, {
      ...mountOptions,
      props: { request: sampleRequestDefaultContact }
    })
    const phoneLink = wrapper.find('a[href^="tel:"]')
    expect(phoneLink.attributes('href')).toBe('tel:115')
    expect(phoneLink.text()).toContain('Call 115')
  })

  it('falls back to 115 for invalid/non-numeric contact text', () => {
    const wrapper = mount(RequestCard, {
      ...mountOptions,
      props: { request: sampleRequestInvalidContactText }
    })
    const phoneLink = wrapper.find('a[href^="tel:"]')
    expect(phoneLink.attributes('href')).toBe('tel:115')
    expect(phoneLink.text()).toContain('Call 115')
  })

  it('displays admin layout button set when isAdmin is true', async () => {
    const wrapper = mount(RequestCard, {
      ...mountOptions,
      props: { request: sampleRequest, isAdmin: true }
    })

    const buttons = wrapper.findAll('button')
    const editBtn = buttons.find(b => b.text().includes('Edit'))
    const deleteBtn = buttons.find(b => b.text().includes('Delete'))

    expect(editBtn.exists()).toBe(true)
    expect(deleteBtn.exists()).toBe(true)

    await editBtn.trigger('click')
    expect(wrapper.emitted('edit')).toBeTruthy()
  })

  it('shows fulfill toggle for standard users', async () => {
    const wrapper = mount(RequestCard, {
      ...mountOptions,
      props: { request: sampleRequest, isLoggedIn: true, isConfirmed: false }
    })
    const fulfillBtn = wrapper.find('.ll-btn-primary.ll-btn-block')
    expect(fulfillBtn.text()).toContain('Confirm Availability')

    await fulfillBtn.trigger('click')
    expect(wrapper.emitted('confirm')).toBeTruthy()
  })
})
