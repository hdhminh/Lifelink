import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EventForm from '@/components/EventForm.vue'

describe('EventForm.vue', () => {
  it('renders form in create mode by default', () => {
    const wrapper = mount(EventForm)
    expect(wrapper.text()).toContain('New Donation Event')
    expect(wrapper.text()).toContain('Create Event')
  })

  it('populates fields when initialData is passed in edit mode', () => {
    const initialData = {
      title: 'Blood Drive 2026',
      date: '2026-08-15',
      location: 'Cho Ray Hospital',
      city: 'Ho Chi Minh City',
      category: 'Drive',
      description: 'Annual donation drive'
    }

    const wrapper = mount(EventForm, {
      props: { initialData, isEditing: true }
    })

    expect(wrapper.text()).toContain('Edit Donation Event')
    const titleInput = wrapper.find('#event-title').element
    expect(titleInput.value).toBe('Blood Drive 2026')
  })

  it('validates required fields before submitting', async () => {
    const wrapper = mount(EventForm)
    const form = wrapper.find('form')

    await form.trigger('submit.prevent')

    expect(wrapper.text()).toContain('Title must be at least 3 characters.')
    expect(wrapper.text()).toContain('Date is required.')
    expect(wrapper.text()).toContain('Location is required.')
    expect(wrapper.text()).toContain('City is required.')
    expect(wrapper.text()).toContain('Please select a valid category.')
    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('emits submit event with valid form payload', async () => {
    const wrapper = mount(EventForm)

    await wrapper.find('#event-title').setValue('Emergency Blood Drive')
    await wrapper.find('#event-date').setValue('2026-09-01')
    await wrapper.find('#event-location').setValue('District 1 Hospital')
    await wrapper.find('#event-city').setValue('Ho Chi Minh City')
    await wrapper.find('#event-category').setValue('Campaign')
    await wrapper.find('#event-description').setValue('Urgent blood drive for hospital supply.')

    await wrapper.find('form').trigger('submit.prevent')

    const emitted = wrapper.emitted('submit')
    expect(emitted).toBeDefined()
    expect(emitted[0][0]).toEqual({
      title: 'Emergency Blood Drive',
      date: '2026-09-01',
      location: 'District 1 Hospital',
      city: 'Ho Chi Minh City',
      category: 'Campaign',
      description: 'Urgent blood drive for hospital supply.'
    })
  })

  it('emits cancel event when cancel button is clicked', async () => {
    const wrapper = mount(EventForm)
    const cancelBtn = wrapper.findAll('button').find(b => b.text().includes('Cancel'))

    await cancelBtn?.trigger('click')
    expect(wrapper.emitted('cancel')).toBeDefined()
  })
})
