import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import EmergencyMap from '@/components/EmergencyMap.vue'

describe('EmergencyMap.vue Complex Edge Cases Unit Tests', () => {
  const mockRequests = [
    { id: 'req_101', status: 'active', hospitalName: 'Cho Ray Hospital', bloodType: 'O-', unitsNeeded: 5, confirmedCount: 1, urgency: 'critical', city: 'Ho Chi Minh City', latitude: 10.7548, longitude: 106.6601 },
    { id: 'req_102', status: 'active', hospitalName: 'Bach Mai Hospital', bloodType: 'AB+', unitsNeeded: 2, confirmedCount: 0, urgency: 'urgent', city: 'Ha Noi', latitude: 21.0000, longitude: 105.8426 }
  ]

  const mockEvents = [
    { id: 'ev_201', title: '"Red Journey 2026" — HCMC', category: 'Drive', date: '2026-09-01', location: 'Youth Cultural Center', city: 'Ho Chi Minh City', latitude: 10.7828, longitude: 106.6983 },
    { id: 'ev_202', title: '"Lang Land Pink Drop" — Lang Son', category: 'Festival', date: '2026-09-15', location: 'Lang Son Convention Center', city: 'Lang Son', latitude: 21.8528, longitude: 106.7618 }
  ]

  it('renders unified LIVE pill badge with active responders count', () => {
    const wrapper = mount(EmergencyMap, {
      props: {
        emergencyRequests: mockRequests,
        events: mockEvents,
        isVisible: true
      }
    })

    expect(wrapper.text()).toContain('LIVE')
    expect(wrapper.text()).toContain('ACTIVE RESPONDERS')
    expect(wrapper.find('.ll-white-dot-pulse').exists()).toBe(true)
  })

  it('handles non-existent selection focus IDs gracefully without throwing errors', async () => {
    const wrapper = mount(EmergencyMap, {
      props: {
        emergencyRequests: mockRequests,
        events: mockEvents,
        isVisible: true
      }
    })

    expect(() => {
      wrapper.vm.selectFocus('ev_invalid_999999')
    }).not.toThrow()

    expect(() => {
      wrapper.vm.selectFocus('req_nonexistent_88888')
    }).not.toThrow()
  })

  it('handles empty emergencyRequests and events arrays cleanly', () => {
    const wrapper = mount(EmergencyMap, {
      props: {
        emergencyRequests: [],
        events: [],
        isVisible: true
      }
    })

    expect(wrapper.exists()).toBe(true)
    expect(wrapper.text()).toContain('Searching for Active Responders')
  })

  it('switches layer filter between all, hospitals, and events', async () => {
    const wrapper = mount(EmergencyMap, {
      props: {
        emergencyRequests: mockRequests,
        events: mockEvents,
        isVisible: true
      }
    })

    wrapper.vm.setLayerFilter('hospitals')
    expect(wrapper.vm.activeLayerFilter).toBe('hospitals')

    wrapper.vm.setLayerFilter('events')
    expect(wrapper.vm.activeLayerFilter).toBe('events')

    wrapper.vm.setLayerFilter('all')
    expect(wrapper.vm.activeLayerFilter).toBe('all')
  })

  it('registers global window popup callback handlers on map initialization', () => {
    mount(EmergencyMap, {
      props: {
        emergencyRequests: mockRequests,
        events: mockEvents,
        isVisible: true
      }
    })

    expect(typeof window.handleHospitalPopupRespond).toBe('function')
    expect(typeof window.handleEventPopupRegister).toBe('function')
  })

  it('emits respond event when handleHospitalPopupRespond callback is invoked', () => {
    const wrapper = mount(EmergencyMap, {
      props: {
        emergencyRequests: mockRequests,
        events: mockEvents,
        isVisible: true
      }
    })

    window.handleHospitalPopupRespond('req_101')
    expect(wrapper.emitted('respond')).toBeTruthy()
    expect(wrapper.emitted('respond')[0]).toEqual(['req_101'])
  })

  it('emits register-event when handleEventPopupRegister callback is invoked', () => {
    const wrapper = mount(EmergencyMap, {
      props: {
        emergencyRequests: mockRequests,
        events: mockEvents,
        isVisible: true
      }
    })

    window.handleEventPopupRegister('ev_201')
    expect(wrapper.emitted('register-event')).toBeTruthy()
    expect(wrapper.emitted('register-event')[0]).toEqual(['ev_201'])
  })
})
