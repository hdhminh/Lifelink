import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EmergencyMap from '@/components/EmergencyMap.vue'

describe('EmergencyMap.vue Unit Tests', () => {
  const dummyRequests = [
    { id: 'req_1', status: 'active', hospitalName: 'Cho Ray Hospital', bloodType: 'O+', unitsNeeded: 3, urgency: 'critical', city: 'Ho Chi Minh City' },
    { id: 'req_2', status: 'active', hospitalName: 'Bach Mai Hospital', bloodType: 'A-', unitsNeeded: 2, urgency: 'urgent', city: 'Ha Noi' }
  ]

  const dummyEvents = [
    { id: 'ev_1', title: 'Red Journey 2026', date: '2026-08-01', location: 'Youth Cultural Center HCMC', city: 'Ho Chi Minh City' }
  ]

  it('renders correctly with default props', () => {
    const wrapper = mount(EmergencyMap, {
      props: {
        emergencyRequests: dummyRequests,
        events: dummyEvents,
        isVisible: true
      }
    })

    expect(wrapper.exists()).toBe(true)
    expect(wrapper.text()).toContain('LIVE')
    expect(wrapper.text()).toContain('ACTIVE RESPONDERS')
    expect(wrapper.text()).toContain('All Locations')
  })

  it('displays response status header and legend items', () => {
    const wrapper = mount(EmergencyMap, {
      props: {
        emergencyRequests: dummyRequests,
        events: dummyEvents,
        isVisible: true
      }
    })

    expect(wrapper.text()).toContain('RESPONSE STATUS')
    expect(wrapper.text()).toContain('RADAR LEGEND')
    expect(wrapper.text()).toContain('Emergency Hospital & Priority Radar')
  })

  it('toggles dropdown menus when filter buttons are clicked', async () => {
    const wrapper = mount(EmergencyMap, {
      props: {
        emergencyRequests: dummyRequests,
        events: dummyEvents,
        isVisible: true
      }
    })

    const buttons = wrapper.findAll('button')
    const layerFilterBtn = buttons.find(b => b.text().includes('All Locations'))

    if (layerFilterBtn) {
      await layerFilterBtn.trigger('click')
      expect(wrapper.html()).toContain('Hospitals')
    }
  })
})
