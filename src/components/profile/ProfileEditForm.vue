<template>
  <form novalidate @submit.prevent="handleSave">
    <div class="row g-3">
      <div class="col-md-6 ll-form-group">
        <label for="profile-name">Full Name</label>
        <input
          id="profile-name"
          v-model.trim="form.displayName"
          class="form-control"
          :class="{ 'is-invalid': errors.displayName }"
          type="text"
          autocomplete="name"
        />
        <div v-if="errors.displayName" class="invalid-feedback d-block">
          {{ errors.displayName }}
        </div>
      </div>
      <div class="col-md-6 ll-form-group">
        <label for="profile-blood-type">Blood Type</label>
        <select
          id="profile-blood-type"
          v-model="form.bloodType"
          class="form-select"
          :class="{ 'is-invalid': errors.bloodType }"
          aria-label="Blood Type"
        >
          <option value="">Select type</option>
          <option v-for="type in bloodTypes" :key="type" :value="type">{{ type }}</option>
        </select>
        <div v-if="errors.bloodType" class="invalid-feedback d-block">
          {{ errors.bloodType }}
        </div>
      </div>
    </div>

    <div class="row g-3">
      <div class="col-md-6 ll-form-group">
        <label for="profile-city">City</label>
        <input
          id="profile-city"
          v-model.trim="form.city"
          class="form-control"
          :class="{ 'is-invalid': errors.city }"
          type="text"
          autocomplete="address-level2"
        />
        <div v-if="errors.city" class="invalid-feedback d-block">{{ errors.city }}</div>
      </div>
      <div class="col-md-6 ll-form-group">
        <label for="profile-last-donation">Last Donation Date</label>
        <input
          id="profile-last-donation"
          v-model="form.lastDonationDate"
          class="form-control"
          type="date"
          aria-label="Last Donation Date"
        />
      </div>
    </div>

    <div class="row g-3">
      <div class="col-md-6 ll-form-group">
        <label for="profile-phone">Phone Number</label>
        <input
          id="profile-phone"
          v-model.trim="form.phoneNumber"
          class="form-control"
          :class="{ 'is-invalid': errors.phoneNumber }"
          type="tel"
          placeholder="e.g. 0901234567"
          autocomplete="tel"
        />
        <div v-if="errors.phoneNumber" class="invalid-feedback d-block">
          {{ errors.phoneNumber }}
        </div>
      </div>
      <div class="col-md-6 ll-form-group">
        <label for="profile-available">Availability</label>
        <select
          id="profile-available"
          v-model="form.canDonateNow"
          class="form-select"
          aria-label="Availability"
        >
          <option :value="true">Available to Donate</option>
          <option :value="false">Not Currently Available</option>
        </select>
      </div>
    </div>

    <div class="d-flex flex-column flex-sm-row gap-2 justify-content-end mt-4">
      <button class="ll-btn-secondary" type="button" @click="$emit('cancel')">Cancel</button>
      <button class="ll-btn-primary" type="submit" :disabled="isSaving">
        {{ isSaving ? 'Saving...' : 'Save Profile' }}
      </button>
    </div>
  </form>
</template>

<script setup>
import { reactive, watch, onMounted } from 'vue'

const props = defineProps({
  userProfile: {
    type: Object,
    required: true
  },
  isSaving: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['save', 'cancel'])

const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const errors = reactive({})

const form = reactive({
  displayName: '',
  bloodType: '',
  city: '',
  phoneNumber: '',
  canDonateNow: false,
  lastDonationDate: ''
})

function toDateInput(value) {
  if (!value) return ''
  const date = value.toDate ? value.toDate() : new Date(value)
  return date.toISOString().slice(0, 10)
}

function populateForm() {
  if (!props.userProfile) return
  Object.assign(form, {
    displayName: props.userProfile.displayName || '',
    bloodType: props.userProfile.bloodType || '',
    city: props.userProfile.city || '',
    phoneNumber: props.userProfile.phoneNumber || '',
    canDonateNow: !!props.userProfile.canDonateNow,
    lastDonationDate: toDateInput(props.userProfile.lastDonationDate)
  })
}

function validate() {
  Object.keys(errors).forEach((key) => delete errors[key])
  const phonePattern = /^(0|\+84|84)(3|5|7|8|9)([0-9]{8})$/
  if (!form.displayName || form.displayName.length < 2)
    errors.displayName = 'Name must be at least 2 characters.'
  if (!bloodTypes.includes(form.bloodType)) errors.bloodType = 'Please select a valid blood type.'
  if (!form.city) errors.city = 'City is required.'
  if (!form.phoneNumber) {
    errors.phoneNumber = 'Phone number is required.'
  } else if (!phonePattern.test(form.phoneNumber)) {
    errors.phoneNumber =
      'Please enter a valid Vietnamese phone number (e.g. 0901234567 or +84901234567).'
  }
  return Object.keys(errors).length === 0
}

function handleSave() {
  if (!validate()) return
  emit('save', { ...form })
}

onMounted(() => {
  populateForm()
})

watch(() => props.userProfile, populateForm, { deep: true })
</script>
