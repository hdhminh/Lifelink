import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import RequestForm from '@/components/RequestForm.vue'

describe('RequestForm.vue', () => {
  it('renders form in create request mode by default', () => {
    const wrapper = mount(RequestForm)
    expect(wrapper.text()).toContain('New Emergency Request')
    expect(wrapper.text()).toContain('Create Request')
  })

  it('populates fields when initialData is passed in edit mode', () => {
    const initialData = {
      hospitalName: 'Cho Ray Hospital',
      city: 'Ho Chi Minh City',
      bloodType: 'O-',
      urgency: 'critical',
      unitsNeeded: 5,
      description: 'Emergency transfusion needed',
      contactInfo: '0912345678'
    }

    const wrapper = mount(RequestForm, {
      props: { initialData, isEditing: true }
    })

    expect(wrapper.text()).toContain('Edit Emergency Request')
    const hospitalInput = wrapper.find('#request-hospital').element
    expect(hospitalInput.value).toBe('Cho Ray Hospital')
  })

  it('validates required fields before submitting', async () => {
    const wrapper = mount(RequestForm)
    await wrapper.find('form').trigger('submit.prevent')

    expect(wrapper.text()).toContain('Hospital name must be at least 3 characters.')
    expect(wrapper.text()).toContain('City is required.')
    expect(wrapper.text()).toContain('Please choose a valid blood type.')
    expect(wrapper.text()).toContain('Description must be at least 10 characters.')
    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('emits submit event with valid form payload', async () => {
    const wrapper = mount(RequestForm)

    await wrapper.find('#request-hospital').setValue('Binh Dan Hospital')
    await wrapper.find('#request-city').setValue('Ho Chi Minh City')
    await wrapper.find('#request-blood-type').setValue('A+')
    await wrapper.find('#request-urgency').setValue('urgent')
    await wrapper.find('#request-units').setValue(3)
    await wrapper.find('#request-description').setValue('Emergency blood needed for surgical procedure.')
    await wrapper.find('#request-contact').setValue('0987654321')

    await wrapper.find('form').trigger('submit.prevent')

    const emitted = wrapper.emitted('submit')
    expect(emitted).toBeDefined()
    expect(emitted[0][0]).toMatchObject({
      hospitalName: 'Binh Dan Hospital',
      city: 'Ho Chi Minh City',
      bloodType: 'A+',
      urgency: 'urgent',
      unitsNeeded: 3,
      description: 'Emergency blood needed for surgical procedure.',
      contactInfo: '0987654321'
    })
  })

  it('emits cancel event when cancel button is clicked', async () => {
    const wrapper = mount(RequestForm)
    const cancelBtn = wrapper.findAll('button').find(b => b.text().includes('Cancel'))

    await cancelBtn?.trigger('click')
    expect(wrapper.emitted('cancel')).toBeDefined()
  })
})
