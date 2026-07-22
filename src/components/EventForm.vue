<template>
  <form class="ll-card" @submit.prevent="handleSubmit" novalidate>
    <div class="ll-card__header">
      <h5 class="m-0">{{ isEditing ? 'Edit Donation Event' : 'New Donation Event' }}</h5>
    </div>
    <div class="ll-card__body">
      <div class="ll-form-group">
        <label for="event-title">Title</label>
        <input id="event-title" v-model.trim="form.title" class="form-control" :class="{ 'is-invalid': errors.title }" type="text" aria-label="Event Title" autocomplete="off">
        <div v-if="errors.title" class="invalid-feedback d-block">{{ errors.title }}</div>
      </div>

      <div class="row g-3">
        <div class="col-md-6 ll-form-group">
          <label for="event-date">Date</label>
          <input id="event-date" v-model="form.date" class="form-control" :class="{ 'is-invalid': errors.date }" type="date" aria-label="Event Date">
          <div v-if="errors.date" class="invalid-feedback d-block">{{ errors.date }}</div>
        </div>
        <div class="col-md-6 ll-form-group">
          <label for="event-category">Category</label>
          <select id="event-category" v-model="form.category" class="form-select" :class="{ 'is-invalid': errors.category }" aria-label="Event Category">
            <option value="">Select category</option>
            <option value="Drive">Drive</option>
            <option value="Campaign">Campaign</option>
            <option value="Workshop">Workshop</option>
          </select>
          <div v-if="errors.category" class="invalid-feedback d-block">{{ errors.category }}</div>
        </div>
      </div>

      <div class="row g-3">
        <div class="col-md-6 ll-form-group">
          <label for="event-location">Location</label>
          <input id="event-location" v-model.trim="form.location" class="form-control" :class="{ 'is-invalid': errors.location }" type="text" aria-label="Event Location" autocomplete="off">
          <div v-if="errors.location" class="invalid-feedback d-block">{{ errors.location }}</div>
        </div>
        <div class="col-md-6 ll-form-group">
          <label for="event-city">City</label>
          <input id="event-city" v-model.trim="form.city" class="form-control" :class="{ 'is-invalid': errors.city }" type="text" aria-label="Event City" autocomplete="address-level2">
          <div v-if="errors.city" class="invalid-feedback d-block">{{ errors.city }}</div>
        </div>
      </div>

      <div class="ll-form-group mb-0">
        <label for="event-description">Description</label>
        <textarea id="event-description" v-model.trim="form.description" class="form-control" :class="{ 'is-invalid': errors.description }" rows="4"></textarea>
        <div v-if="errors.description" class="invalid-feedback d-block">{{ errors.description }}</div>
      </div>
    </div>
    <div class="ll-card__footer d-flex flex-column flex-sm-row gap-2 justify-content-end">
      <button type="button" class="ll-btn-secondary" @click="emit('cancel')">Cancel</button>
      <button type="submit" class="ll-btn-primary">{{ isEditing ? 'Save Changes' : 'Create Event' }}</button>
    </div>
  </form>
</template>

<script setup>
/**
 * EventForm.vue
 * Validated create/edit form for donation events.
 */
import { reactive, watch } from 'vue'

const props = defineProps({
  initialData: { type: Object, default: null },
  isEditing: { type: Boolean, default: false }
})

const emit = defineEmits(['submit', 'cancel'])
const categories = ['Drive', 'Campaign', 'Workshop']
const form = reactive({ title: '', date: '', location: '', city: '', category: '', description: '' })
const errors = reactive({})

/**
 * Copies initial event data into the form.
 * @returns {void}
 */
function populateForm() {
  Object.assign(form, {
    title: props.initialData?.title || '',
    date: props.initialData?.date || '',
    location: props.initialData?.location || '',
    city: props.initialData?.city || '',
    category: props.initialData?.category || '',
    description: props.initialData?.description || ''
  })
}

/**
 * Validates all event form fields.
 * @returns {boolean} Whether the event form is valid.
 */
function validate() {
  Object.keys(errors).forEach(key => delete errors[key])
  if (!form.title || form.title.length < 3) errors.title = 'Title must be at least 3 characters.'
  if (!form.date) errors.date = 'Date is required.'
  if (!form.location) errors.location = 'Location is required.'
  if (!form.city) errors.city = 'City is required.'
  if (!categories.includes(form.category)) errors.category = 'Please select a valid category.'
  if (!form.description || form.description.length < 10) errors.description = 'Description must be at least 10 characters.'
  return Object.keys(errors).length === 0
}

/**
 * Emits validated event data to the parent view.
 * @returns {void}
 */
function handleSubmit() {
  if (!validate()) return
  emit('submit', { ...form })
}

watch(() => props.initialData, populateForm, { immediate: true })
</script>
