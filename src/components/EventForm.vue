<template>
  <form class="ll-card" novalidate @submit.prevent="handleSubmit">
    <div class="ll-card__header">
      <h5 class="m-0">{{ isEditing ? 'Edit Donation Event' : 'New Donation Event' }}</h5>
    </div>
    <div class="ll-card__body">
      <div class="ll-form-group">
        <label for="event-title">Title</label>
        <input
          id="event-title"
          v-model.trim="form.title"
          class="form-control"
          :class="{ 'is-invalid': errors.title }"
          type="text"
          aria-label="Event Title"
          autocomplete="off"
        />
        <div v-if="errors.title" class="invalid-feedback d-block">{{ errors.title }}</div>
      </div>

      <div class="row g-3">
        <div class="col-md-6 ll-form-group">
          <label for="event-date">Date</label>
          <input
            id="event-date"
            v-model="form.date"
            class="form-control"
            :class="{ 'is-invalid': errors.date }"
            type="date"
            aria-label="Event Date"
          />
          <div v-if="errors.date" class="invalid-feedback d-block">{{ errors.date }}</div>
        </div>
        <div class="col-md-6 ll-form-group">
          <label for="event-category">Category</label>
          <select
            id="event-category"
            v-model="form.category"
            class="form-select"
            :class="{ 'is-invalid': errors.category }"
            aria-label="Event Category"
          >
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
          <input
            id="event-location"
            v-model.trim="form.location"
            class="form-control"
            :class="{ 'is-invalid': errors.location }"
            type="text"
            aria-label="Event Location"
            autocomplete="off"
          />
          <div v-if="errors.location" class="invalid-feedback d-block">{{ errors.location }}</div>
        </div>
        <div class="col-md-6 ll-form-group">
          <label for="event-city">City</label>
          <select
            id="event-city"
            v-model="form.city"
            class="form-select"
            :class="{ 'is-invalid': errors.city }"
            aria-label="Event City"
          >
            <option value="">Select city</option>
            <option v-for="city in cityOptions" :key="city" :value="city">{{ city }}</option>
          </select>
          <div v-if="errors.city" class="invalid-feedback d-block">{{ errors.city }}</div>
        </div>
      </div>

      <div class="ll-form-group mb-0">
        <label for="event-description">Description</label>
        <textarea
          id="event-description"
          v-model.trim="form.description"
          class="form-control"
          :class="{ 'is-invalid': errors.description }"
          rows="4"
        ></textarea>
        <div v-if="errors.description" class="invalid-feedback d-block">
          {{ errors.description }}
        </div>
      </div>
    </div>
    <div class="ll-card__footer d-flex flex-column flex-sm-row gap-2 justify-content-end">
      <button type="button" class="ll-btn-secondary" @click="emit('cancel')">Cancel</button>
      <button type="submit" class="ll-btn-primary">
        {{ isEditing ? 'Save Changes' : 'Create Event' }}
      </button>
    </div>
  </form>
</template>

<script setup>
/**
 * EventForm.vue
 * Validated create/edit form for donation events.
 */
import { reactive, watch } from 'vue'
import { VIETNAM_PROVINCES_2025, normalizeEventRecord } from '@/data/vietnamLocations.js'

const props = defineProps({
  initialData: { type: Object, default: null },
  isEditing: { type: Boolean, default: false }
})

const emit = defineEmits(['submit', 'cancel'])
const categories = ['Drive', 'Campaign', 'Workshop']
const cityOptions = VIETNAM_PROVINCES_2025
const form = reactive({
  title: '',
  date: '',
  location: '',
  city: '',
  category: '',
  description: ''
})
const errors = reactive({})

/**
 * Copies initial event data into the form.
 * @returns {void}
 */
function populateForm() {
  const initial = normalizeEventRecord(props.initialData || {})
  Object.assign(form, {
    title: initial.title || '',
    date: initial.date || '',
    location: initial.location || '',
    city: initial.city || '',
    category: initial.category || '',
    description: initial.description || ''
  })
}

/**
 * Validates all event form fields.
 * @returns {boolean} Whether the event form is valid.
 */
function validate() {
  Object.keys(errors).forEach((key) => delete errors[key])
  if (!form.title || form.title.length < 3) errors.title = 'Title must be at least 3 characters.'
  if (!form.date) errors.date = 'Date is required.'
  if (!form.location) errors.location = 'Location is required.'
  if (!form.city) errors.city = 'City is required.'
  if (!categories.includes(form.category)) errors.category = 'Please select a valid category.'
  if (!form.description || form.description.length < 10)
    errors.description = 'Description must be at least 10 characters.'
  return Object.keys(errors).length === 0
}

/**
 * Emits validated event data to the parent view.
 * @returns {void}
 */
function handleSubmit() {
  if (!validate()) return
  emit('submit', normalizeEventRecord({ ...form }))
}

watch(() => props.initialData, populateForm, { immediate: true })
</script>
