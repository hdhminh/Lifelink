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

  it('renders event details correctly', () => {
    const wrapper = mount(EventCard, {
      props: { event: sampleEvent }
    })

    expect(wrapper.text()).toContain('Hanoi Blood Donation — Campaign')
    expect(wrapper.text()).toContain('Campaign')
    expect(wrapper.text()).toContain('Hanoi')
    expect(wrapper.text()).toContain('Hoan Kiem Lake')
    expect(wrapper.text()).toContain('15 people interested')
  })

  it('strips non-topic location suffix correctly via displayTitle computed prop', () => {
    const wrapper = mount(EventCard, {
      props: { event: sampleEventWithLocationSuffix }
    })
    // Suffix '— HCMC Hospital' is not a topic, so it should be stripped
    expect(wrapper.find('.ll-event-title').text()).toBe('HCMC Donation Drive')
  })

  it('renders dates formatted with locale en-AU', () => {
    const wrapper = mount(EventCard, {
      props: { event: sampleEvent }
    })
    expect(wrapper.find('.ll-date-badge').text()).toBe('15 Aug 2026')
  })

  it('displays admin actions when isAdmin is true', async () => {
    const wrapper = mount(EventCard, {
      props: { event: sampleEvent, isAdmin: true }
    })

    const buttons = wrapper.findAll('button')
    const editBtn = buttons.find(b => b.text().includes('Edit'))
    const deleteBtn = buttons.find(b => b.text().includes('Delete'))

    expect(editBtn.exists()).toBe(true)
    expect(deleteBtn.exists()).toBe(true)

    await editBtn.trigger('click')
    expect(wrapper.emitted('edit')).toBeTruthy()

    await deleteBtn.trigger('click')
    expect(wrapper.emitted('delete')).toBeTruthy()
  })

  it('shows toggle interest option for standard users', async () => {
    const wrapper = mount(EventCard, {
      props: { event: sampleEvent, isLoggedIn: true, isInterested: false }
    })

    const interestBtn = wrapper.find('.ll-btn-block')
    expect(interestBtn.text()).toBe('Interested')

    await interestBtn.trigger('click')
    expect(wrapper.emitted('toggle-interested')).toBeTruthy()
  })

  it('displays registered state when isInterested is true', () => {
    const wrapper = mount(EventCard, {
      props: { event: sampleEvent, isLoggedIn: true, isInterested: true }
    })
    const interestBtn = wrapper.find('.ll-btn-block')
    expect(interestBtn.text()).toContain('Interested (Registered)')
    expect(interestBtn.classes()).toContain('ll-btn-primary')
  })
})
