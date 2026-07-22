<template>
  <form class="ll-card" @submit.prevent="handleSubmit" novalidate>
    <div class="ll-card__header">
      <h5 class="m-0 text-wine"><i class="bi bi-file-earmark-medical me-2"></i>{{ isEditing ? 'Edit Emergency Request' : 'New Emergency Request' }}</h5>
    </div>
    <div class="ll-card__body">
      <!-- Hospital Searchable Autocomplete -->
      <div class="ll-form-group position-relative">
        <label for="request-hospital">Hospital Name</label>
        <div class="position-relative">
          <input
            id="request-hospital"
            v-model.trim="form.hospitalName"
            class="form-control"
            :class="{ 'is-invalid': errors.hospitalName }"
            type="text"
            placeholder="Type hospital name (e.g. Cho Ray Hospital)"
            autocomplete="off"
            @focus="showHospitalSuggestions = true"
            @blur="hideHospitalDropdown"
          >
          <ul v-if="showHospitalSuggestions && filteredHospitals.length" class="ll-autocomplete-dropdown">
            <li
              v-for="h in filteredHospitals"
              :key="h.name"
              @mousedown="selectHospital(h)"
            >
              <i class="bi bi-hospital text-wine me-2"></i> {{ h.name }} <span class="text-muted small">({{ h.city }})</span>
            </li>
          </ul>
        </div>
        <div v-if="errors.hospitalName" class="invalid-feedback d-block">{{ errors.hospitalName }}</div>
      </div>

      <div class="row g-3">
        <!-- City Searchable Autocomplete -->
        <div class="col-md-6 ll-form-group position-relative">
          <label for="request-city">City</label>
          <div class="position-relative">
            <input
              id="request-city"
              v-model.trim="form.city"
              class="form-control"
              :class="{ 'is-invalid': errors.city }"
              type="text"
              placeholder="Type or select city"
              autocomplete="off"
              @focus="showCitySuggestions = true"
              @blur="hideCityDropdown"
            >
            <ul v-if="showCitySuggestions && filteredCities.length" class="ll-autocomplete-dropdown">
              <li
                v-for="c in filteredCities"
                :key="c"
                @mousedown="selectCity(c)"
              >
                <i class="bi bi-geo-alt text-wine me-2"></i> {{ c }}
              </li>
            </ul>
          </div>
          <div v-if="errors.city" class="invalid-feedback d-block">{{ errors.city }}</div>
        </div>
        <div class="col-md-6 ll-form-group">
          <label for="request-blood-type">Blood Type</label>
          <select id="request-blood-type" v-model="form.bloodType" class="form-select" :class="{ 'is-invalid': errors.bloodType }" aria-label="Blood Type">
            <option value="">Select blood type</option>
            <option v-for="type in bloodTypes" :key="type" :value="type">{{ type }}</option>
          </select>
          <div v-if="errors.bloodType" class="invalid-feedback d-block">{{ errors.bloodType }}</div>
        </div>
      </div>

      <div class="row g-3">
        <div class="col-md-6 ll-form-group">
          <label for="request-urgency">Urgency</label>
          <select id="request-urgency" v-model="form.urgency" class="form-select" :class="{ 'is-invalid': errors.urgency }" aria-label="Urgency Level">
            <option value="">Select urgency</option>
            <option value="critical">Critical</option>
            <option value="urgent">Urgent</option>
            <option value="moderate">Moderate</option>
          </select>
          <div v-if="errors.urgency" class="invalid-feedback d-block">{{ errors.urgency }}</div>
        </div>
        <div class="col-md-6 ll-form-group">
          <label for="request-units">Units Needed</label>
          <input id="request-units" v-model.number="form.unitsNeeded" class="form-control" :class="{ 'is-invalid': errors.unitsNeeded }" type="number" min="1" max="20" aria-label="Units Needed" autocomplete="off">
          <div v-if="errors.unitsNeeded" class="invalid-feedback d-block">{{ errors.unitsNeeded }}</div>
        </div>
      </div>

      <div class="ll-form-group">
        <label for="request-description">Description</label>
        <textarea id="request-description" v-model.trim="form.description" class="form-control" :class="{ 'is-invalid': errors.description }" rows="4" placeholder="Brief details about emergency patient..." aria-label="Description"></textarea>
        <div v-if="errors.description" class="invalid-feedback d-block">{{ errors.description }}</div>
      </div>

      <div class="ll-form-group">
        <label for="request-contact">Representative Phone Number (Optional, defaults to 115)</label>
        <input id="request-contact" v-model.trim="form.contactInfo" class="form-control" :class="{ 'is-invalid': errors.contactInfo }" type="text" placeholder="e.g. 0901234567" aria-label="Representative Phone Number" autocomplete="tel">
        <div v-if="errors.contactInfo" class="invalid-feedback d-block">{{ errors.contactInfo }}</div>
      </div>

      <!-- Publish Date and Time Field -->
      <div class="ll-form-group">
        <label for="request-publish-date">Publish Date &amp; Time (Leave empty to use current time)</label>
        <input 
          id="request-publish-date" 
          v-model="form.createdAt" 
          class="form-control" 
          type="datetime-local"
          aria-label="Publish Date and Time"
        >
      </div>
    </div>
    <div class="ll-card__footer d-flex flex-column flex-sm-row gap-2 justify-content-end">
      <button type="button" class="ll-btn-secondary" @click="emit('cancel')">Cancel</button>
      <button type="submit" class="ll-btn-primary">{{ isEditing ? 'Save Changes' : 'Create Request' }}</button>
    </div>
  </form>
</template>

<script setup>
/**
 * RequestForm.vue
 * Validated create/edit form for emergency blood requests.
 * Autocomplete system for Vietnam hospitals and major cities included.
 */
import { reactive, watch, ref, computed } from 'vue'

const props = defineProps({
  initialData: { type: Object, default: null },
  isEditing: { type: Boolean, default: false }
})

const emit = defineEmits(['submit', 'cancel'])
const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Any']
const urgencyLevels = ['critical', 'urgent', 'moderate']

const form = reactive({
  hospitalName: '',
  city: '',
  bloodType: '',
  urgency: '',
  unitsNeeded: 1,
  description: '',
  contactInfo: '',
  createdAt: ''
})
const errors = reactive({})

// Autocomplete database
const cities = [
  'Ho Chi Minh City',
  'Ha Noi',
  'Da Nang',
  'Hue',
  'Can Tho',
  'Hai Phong',
  'Nha Trang'
]

const hospitals = [
  { name: 'Cho Ray Hospital', city: 'Ho Chi Minh City' },
  { name: 'FV Hospital', city: 'Ho Chi Minh City' },
  { name: 'Vinmec Central Park Hospital', city: 'Ho Chi Minh City' },
  { name: 'Gia Dinh People\'s Hospital', city: 'Ho Chi Minh City' },
  { name: 'Blood Transfusion Hematology Hospital', city: 'Ho Chi Minh City' },
  { name: 'University Medical Center HCMC', city: 'Ho Chi Minh City' },
  { name: 'HCMC People\'s Hospital 115', city: 'Ho Chi Minh City' },
  
  { name: 'Bach Mai Hospital', city: 'Ha Noi' },
  { name: 'Viet Duc Hospital', city: 'Ha Noi' },
  { name: 'Vinmec Times City Hospital', city: 'Ha Noi' },
  { name: 'Vietnam National Children\'s Hospital', city: 'Ha Noi' },
  { name: 'Hanoi French Hospital', city: 'Ha Noi' },
  { name: 'National Institute of Hematology and Blood Transfusion', city: 'Ha Noi' },
  
  { name: 'Da Nang General Hospital', city: 'Da Nang' },
  { name: 'Vinmec Da Nang Hospital', city: 'Da Nang' },
  { name: 'Da Nang Family Hospital', city: 'Da Nang' },
  
  { name: 'Hue Central Hospital', city: 'Hue' },
  
  { name: 'Can Tho General Hospital', city: 'Can Tho' },
  { name: 'Can Tho Central General Hospital', city: 'Can Tho' },
  
  { name: 'Hai Phong International Hospital', city: 'Hai Phong' },
  { name: 'Viet Tiep Friendship Hospital', city: 'Hai Phong' },
  
  { name: 'Khanh Hoa Province General Hospital', city: 'Nha Trang' },
  { name: 'Vinmec Nha Trang Hospital', city: 'Nha Trang' }
]

const showCitySuggestions = ref(false)
const showHospitalSuggestions = ref(false)

const filteredCities = computed(() => {
  const query = form.city.toLowerCase().trim()
  if (!query) return cities
  return cities.filter(c => c.toLowerCase().includes(query))
})

const filteredHospitals = computed(() => {
  const query = form.hospitalName.toLowerCase().trim()
  // Filter by selected city first if available
  const list = form.city
    ? hospitals.filter(h => h.city.toLowerCase() === form.city.toLowerCase())
    : hospitals

  if (!query) return list.slice(0, 8)
  return list.filter(h => h.name.toLowerCase().includes(query)).slice(0, 8)
})

function selectCity(city) {
  form.city = city
  showCitySuggestions.value = false
}

function selectHospital(hospital) {
  form.hospitalName = hospital.name
  form.city = hospital.city
  showHospitalSuggestions.value = false
}

function hideCityDropdown() {
  setTimeout(() => { showCitySuggestions.value = false }, 180)
}

function hideHospitalDropdown() {
  setTimeout(() => { showHospitalSuggestions.value = false }, 180)
}

function formatDateTimeLocal(value) {
  if (!value) return ''
  const date = value.toDate ? value.toDate() : new Date(value)
  if (isNaN(date.getTime())) return ''
  
  const yyyy = date.getFullYear()
  const MM = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  
  return `${yyyy}-${MM}-${dd}T${hh}:${mm}`
}

function populateForm() {
  Object.assign(form, {
    hospitalName: props.initialData?.hospitalName || '',
    city: props.initialData?.city || '',
    bloodType: props.initialData?.bloodType || '',
    urgency: props.initialData?.urgency || '',
    unitsNeeded: props.initialData?.unitsNeeded || 1,
    description: props.initialData?.description || '',
    contactInfo: props.initialData?.contactInfo || '',
    createdAt: formatDateTimeLocal(props.initialData?.createdAt)
  })
}

function validate() {
  Object.keys(errors).forEach(key => delete errors[key])
  if (!form.hospitalName || form.hospitalName.length < 3) errors.hospitalName = 'Hospital name must be at least 3 characters.'
  if (!form.city) errors.city = 'City is required.'
  if (!bloodTypes.includes(form.bloodType)) errors.bloodType = 'Please choose a valid blood type.'
  if (!urgencyLevels.includes(form.urgency)) errors.urgency = 'Please choose an urgency level.'
  if (!Number.isInteger(form.unitsNeeded) || form.unitsNeeded < 1 || form.unitsNeeded > 20) errors.unitsNeeded = 'Units needed must be an integer from 1 to 20.'
  if (!form.description || form.description.length < 10) errors.description = 'Description must be at least 10 characters.'
  if (form.contactInfo) {
    const phonePattern = /^[0-9\s+-]{3,15}$/
    if (!phonePattern.test(form.contactInfo)) {
      errors.contactInfo = 'Please enter a valid phone number or leave blank.'
    }
  }
  return Object.keys(errors).length === 0
}

function handleSubmit() {
  if (!validate()) return
  const data = { ...form }
  if (!data.contactInfo || !data.contactInfo.trim()) {
    data.contactInfo = '115'
  }
  if (data.createdAt) {
    data.createdAt = new Date(data.createdAt)
  } else {
    delete data.createdAt
  }
  emit('submit', data)
}

watch(() => props.initialData, populateForm, { immediate: true })
</script>

<style scoped>
.text-wine {
  color: var(--ll-wine-red);
}

.ll-autocomplete-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #ffffff;
  border: 1px solid var(--ll-slate-200);
  border-radius: var(--ll-radius-md);
  box-shadow: var(--ll-shadow-md);
  z-index: 1000;
  max-height: 200px;
  overflow-y: auto;
  margin: 0;
  padding: 0.5rem 0;
  list-style: none;
}
.ll-autocomplete-dropdown li {
  padding: 0.65rem 1rem;
  font-size: 0.9rem;
  color: var(--ll-slate-700);
  cursor: pointer;
  transition: all var(--ll-transition-fast);
}
.ll-autocomplete-dropdown li:hover {
  background-color: var(--ll-wine-light);
  color: var(--ll-wine-red);
}
</style>
