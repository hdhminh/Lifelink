import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EventCard from '@/components/EventCard.vue'

describe('EventCard.vue', () => {
  const sampleEvent = {
    id: 'ev1',
    title: 'Hanoi Blood Donation — Campaign',
    category: 'Campaign',
    date: '2026-08-15',
    city: 'Hanoi',
    location: 'Hoan Kiem Lake',
    description: 'Help save lives by donating blood.',
    interestedCount: 15
  }

  const sampleEventWithLocationSuffix = {
    id: 'ev2',
    title: 'HCMC Donation Drive — HCMC Hospital',
    category: 'Drive',
    date: '2026-08-20',
    city: 'HCMC',
    location: 'District 1',
    description: 'Urgent drive.',
    interestedCount: 5
  }

  const routerLinkStub = { template: '<a><slot /></a>' }

  it('renders event details correctly', () => {
    const wrapper = mount(EventCard, {
      props: { event: sampleEvent },
      global: {
        stubs: {
          RouterLink: routerLinkStub
        }
      }
    })

    expect(wrapper.text()).toContain('Hanoi Blood Donation')
    expect(wrapper.text()).toContain('Campaign')
    expect(wrapper.text()).toContain('Hanoi')
    expect(wrapper.text()).toContain('Hoan Kiem Lake')
    expect(wrapper.text()).toContain('15 people interested')
  })


  it('strips non-topic location suffix correctly via displayTitle computed prop', () => {
    const wrapper = mount(EventCard, {
      props: { event: sampleEventWithLocationSuffix },
      global: { stubs: { RouterLink: routerLinkStub } }
    })
    expect(wrapper.find('.ll-event-title').text()).toBe('HCMC Donation Drive')
  })

  it('renders dates formatted with locale en-AU', () => {
    const wrapper = mount(EventCard, {
      props: { event: sampleEvent },
      global: { stubs: { RouterLink: routerLinkStub } }
    })
    expect(wrapper.find('.ll-date-badge').text()).toBe('15 Aug 2026')
  })

  it('displays admin actions when isAdmin is true', async () => {
    const wrapper = mount(EventCard, {
      props: { event: sampleEvent, isAdmin: true },
      global: { stubs: { RouterLink: routerLinkStub } }
    })

    const buttons = wrapper.findAll('button')
    expect(buttons.length).toBe(2)
    expect(buttons[0].text()).toContain('Edit')
    expect(buttons[1].text()).toContain('Delete')

    await buttons[0].trigger('click')
    expect(wrapper.emitted('edit')).toBeTruthy()

    await buttons[1].trigger('click')
    expect(wrapper.emitted('delete')).toBeTruthy()
  })

  it('shows toggle interest option for standard users', async () => {
    const wrapper = mount(EventCard, {
      props: { event: sampleEvent, isLoggedIn: true, isInterested: false },
      global: { stubs: { RouterLink: routerLinkStub } }
    })

    const button = wrapper.find('button')
    expect(button.exists()).toBe(true)
    expect(button.text()).toBe('Interested')

    await button.trigger('click')
    expect(wrapper.emitted('toggle-interested')).toBeTruthy()
  })

  it('displays registered state when isInterested is true', () => {
    const wrapper = mount(EventCard, {
      props: { event: sampleEvent, isLoggedIn: true, isInterested: true },
      global: { stubs: { RouterLink: routerLinkStub } }
    })

    const button = wrapper.find('button')
    expect(button.text()).toContain('Interested (Registered)')
    expect(button.classes()).toContain('ll-btn-primary')
  })
})
