<template>
  <div>
    <!-- Double Confirmation Modal for Donation -->
    <ConfirmModal
      :show="showConfirmDonationModal"
      title="Confirm Availability"
      message="Are you sure you want to confirm your availability to donate blood for this emergency request? The hospital coordinator will be notified and will contact you directly."
      confirm-label="Confirm Availability"
      @confirm="commitConfirmDonation"
      @cancel="showConfirmDonationModal = false"
    />

    <!-- Maps Confirmation Modal (In-app Success + Navigation Request) -->
    <Teleport to="body">
      <div
        v-if="showMapsConfirmModal"
        class="ll-modal-backdrop"
        @click="closeMapsConfirmModal"
      ></div>
      <div
        v-if="showMapsConfirmModal"
        class="modal d-block"
        tabindex="-1"
        role="dialog"
        aria-modal="true"
      >
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content ll-modal-content text-center p-4">
            <div class="mb-3">
              <div
                class="mx-auto d-flex align-items-center justify-content-center rounded-circle bg-success-bg text-success"
                style="width: 64px; height: 64px"
              >
                <i class="bi bi-check-circle-fill" style="font-size: 2.5rem"></i>
              </div>
            </div>
            <h5 class="fw-bold text-slate-900 mb-2">Confirmation Successful!</h5>
            <p class="text-slate-500 mb-4 px-2" style="font-size: 0.95rem">
              Would you like to open Google Maps for immediate directions to the hospital?
            </p>
            <!-- Only show map navigation buttons if NOT already on the map page -->
            <div v-if="!isOnMapPage" class="d-flex flex-column gap-2">
              <button
                type="button"
                class="btn ll-btn-primary w-100 d-flex align-items-center justify-content-center gap-2"
                style="color: #fff"
                @click="handleShareAndOpenMaps"
              >
                <i class="bi bi-broadcast"></i> Share Live Location & Go to Map
              </button>
              <button
                type="button"
                class="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-2"
                @click="handleOpenMaps"
              >
                <i class="bi bi-geo-alt-fill"></i> Just Open Google Maps
              </button>
              <button
                type="button"
                class="btn btn-link text-slate-400 text-decoration-none py-1"
                @click="closeMapsConfirmModal"
              >
                No, thanks
              </button>
            </div>
            <!-- On map page: just a dismiss button -->
            <div v-else class="d-flex flex-column gap-2">
              <button
                type="button"
                class="btn ll-btn-primary w-100 d-flex align-items-center justify-content-center gap-2"
                style="color: #fff"
                @click="handleShareAndTrack"
              >
                <i class="bi bi-broadcast"></i> Share Live Location
              </button>
              <button
                type="button"
                class="btn btn-link text-slate-400 text-decoration-none py-1"
                @click="closeMapsConfirmModal"
              >
                No, thanks
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Guest One-Time Confirmation Modal -->
    <Teleport to="body">
      <div
        v-if="showGuestConfirmModal"
        class="ll-modal-backdrop"
        @click="showGuestConfirmModal = false"
      ></div>
      <div
        v-if="showGuestConfirmModal"
        class="modal d-block"
        tabindex="-1"
        role="dialog"
        aria-modal="true"
      >
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content ll-modal-content p-4">
            <!-- Header -->
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h5 class="fw-bold text-slate-900 m-0">
                <i class="bi bi-heart-fill text-danger me-2"></i>One-Time Confirmation
              </h5>
              <button
                type="button"
                class="btn-close"
                aria-label="Close"
                @click="showGuestConfirmModal = false"
              ></button>
            </div>

            <!-- Form Screen -->
            <div>
              <p class="text-slate-500 mb-3 small">
                Confirm your availability for <strong>{{ guestConfirmHospital }}</strong> in
                <strong>{{ guestConfirmCity }}</strong
                >.
              </p>

              <AlertMessage v-if="guestConfirmError" type="danger" :message="guestConfirmError" />

              <div class="mb-3">
                <label for="guest-name" class="form-label small fw-bold">Full Name *</label>
                <input
                  id="guest-name"
                  v-model="guestConfirmName"
                  type="text"
                  class="form-control"
                  placeholder="e.g. Nguyen Van A"
                  required
                />
              </div>
              <div class="mb-3">
                <label for="guest-phone" class="form-label small fw-bold"
                  >Phone Number (Optional)</label
                >
                <input
                  id="guest-phone"
                  v-model="guestConfirmPhone"
                  type="tel"
                  class="form-control"
                  placeholder="e.g. +84 901234567"
                  autocomplete="tel"
                />
              </div>

              <div class="d-flex gap-2 mt-4">
                <button
                  type="button"
                  class="ll-btn-secondary w-50"
                  @click="showGuestConfirmModal = false"
                >
                  Cancel
                </button>
                <button type="button" class="ll-btn-primary w-50" @click="commitGuestConfirm">
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth.js'
import { useGuestSession } from '@/composables/useGuestSession.js'
import { useConfirmDonation } from '@/composables/useConfirmDonation.js'
import { useGeolocation } from '@/composables/useGeolocation.js'
import { useLocationTracking } from '@/composables/useLocationTracking.js'
import { useToast } from '@/composables/useToast.js'
import { getHospitalCoordinates } from '@/data/hospitalCoordinates.js'
import ConfirmModal from '@/components/ConfirmModal.vue'
import AlertMessage from '@/components/AlertMessage.vue'

const props = defineProps({
  requests: {
    type: Array,
    required: true
  },
  confirmedRequestIds: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['confirmed'])

const { user, userProfile } = useAuth()
const { getGuestSession } = useGuestSession()
const { confirmAvailability, confirmGuestAvailability } = useConfirmDonation()
const { buildMapsUrl } = useGeolocation()
const { startTracking, stopTracking, getStoredTrackingSession } = useLocationTracking()
const { showToast } = useToast()
const router = useRouter()
const route = useRoute()

const isOnMapPage = computed(() => route.path === '/map')
const resumeAttemptedForKey = ref('')

const showConfirmDonationModal = ref(false)
const confirmingRequestId = ref(null)

const showGuestConfirmModal = ref(false)
const guestConfirmName = ref('')
const guestConfirmPhone = ref('')
const guestConfirmRequestId = ref('')
const guestConfirmHospital = ref('')
const guestConfirmCity = ref('')
const guestConfirmError = ref('')

const showMapsConfirmModal = ref(false)
const pendingMapUrl = ref('')
const pendingRequestForTracking = ref(null)

function closeMapsConfirmModal() {
  showMapsConfirmModal.value = false
  pendingMapUrl.value = ''
  pendingRequestForTracking.value = null
}

function handleOpenMaps() {
  if (pendingMapUrl.value) {
    window.open(pendingMapUrl.value, '_blank')
  }
  closeMapsConfirmModal()
}

async function handleShareAndOpenMaps() {
  const reqId = pendingRequestForTracking.value?.id
  if (pendingRequestForTracking.value) {
    startTrackingForRequest(pendingRequestForTracking.value)
  }

  closeMapsConfirmModal()

  // Navigate to internal /map page (NOT external Google Maps)
  if (router.currentRoute.value.path !== '/map') {
    router.push({ path: '/map', query: { request: reqId } })
  }
}

async function handleShareAndTrack() {
  // On map page: just share location without opening maps
  if (pendingRequestForTracking.value) {
    startTrackingForRequest(pendingRequestForTracking.value)
  }
  closeMapsConfirmModal()
}

function startTrackingForRequest(req, fallbackSession = null) {
  if (!req) return

  const guestSession = !user.value ? getGuestSession() : null
  const donorId = user.value?.uid || fallbackSession?.donorId || guestSession?.guestId
  if (!donorId) return

  const coords = getHospitalCoordinates(req.hospitalName, req.city)
  startTracking({
    requestId: req.id,
    donorId,
    donorName:
      userProfile.value?.displayName ||
      fallbackSession?.donorName ||
      guestConfirmName.value.trim() ||
      'Guest Donor',
    bloodType:
      userProfile.value?.bloodType ||
      fallbackSession?.bloodType ||
      'Guest',
    hospitalLocation: { ...coords, hospitalName: req.hospitalName, city: req.city }
  })
}

watch(
  [
    () => props.requests,
    () => props.confirmedRequestIds,
    () => user.value,
    () => userProfile.value,
    () => getGuestSession().guestId
  ],
  () => {
    const session = getStoredTrackingSession()
    if (!session) return

    const activeDonorId = user.value?.uid || getGuestSession().guestId
    if (!activeDonorId || String(session.donorId) !== String(activeDonorId)) {
      stopTracking()
      return
    }

    const confirmedIds = props.confirmedRequestIds.map(String)
    if (confirmedIds.length === 0) return

    const sessionRequestId = String(session.requestId)
    if (!confirmedIds.includes(sessionRequestId)) {
      stopTracking()
      return
    }

    const req = props.requests.find((item) => String(item.id) === sessionRequestId)
    if (!req) return

    const resumeKey = `${sessionRequestId}_${session.donorId}`
    if (resumeAttemptedForKey.value === resumeKey) return

    resumeAttemptedForKey.value = resumeKey
    startTrackingForRequest(req, session)
  },
  { immediate: true, deep: true }
)

async function commitGuestConfirm() {
  if (!guestConfirmName.value.trim()) {
    guestConfirmError.value = 'Please enter your name.'
    return
  }
  const reqId = guestConfirmRequestId.value
  try {
    await confirmGuestAvailability(reqId, {
      guestSessionId: getGuestSession().guestId,
      guestName: guestConfirmName.value.trim(),
      guestPhone: guestConfirmPhone.value.trim() || 'N/A'
    })
    emit('confirmed', reqId)
    showGuestConfirmModal.value = false
    openMapsForRequest(reqId)
    showToast('Availability confirmed successfully.', 'success')
  } catch (err) {
    console.error('Failed to commit guest confirmation:', err)
    guestConfirmError.value = 'Could not confirm. Please check your network and try again.'
  }
}

async function commitConfirmDonation() {
  if (!confirmingRequestId.value || !user.value || !userProfile.value) return
  const reqId = confirmingRequestId.value
  const targetRequest = props.requests.find((r) => r.id === reqId)
  try {
    await confirmAvailability(reqId, {
      donorId: user.value.uid,
      donorName: userProfile.value.displayName,
      donorPhone: userProfile.value.phoneNumber || 'N/A',
      bloodType: userProfile.value.bloodType
    })

    showToast('Availability confirmed successfully! The board will update live.', 'success')
    if (targetRequest) {
      openMapsForRequest(targetRequest.id)
    }
  } catch (err) {
    showToast(err.message || 'Confirmation failed.', 'danger')
  } finally {
    showConfirmDonationModal.value = false
    confirmingRequestId.value = null
  }
}

function openMapsForRequest(requestId) {
  const req = props.requests.find((r) => String(r.id) === String(requestId))
  if (req) {
    const mapUrl = buildMapsUrl((req.hospitalName || 'Emergency Request') + ', ' + (req.city || ''))
    pendingMapUrl.value = mapUrl
    pendingRequestForTracking.value = req
    showMapsConfirmModal.value = true
  }
}

function handleConfirm(requestId) {
  const req = props.requests.find((r) => r.id === requestId)
  if (!req) return

  if (!user.value) {
    guestConfirmRequestId.value = requestId
    guestConfirmHospital.value = req.hospitalName || 'Hospital'
    guestConfirmCity.value = req.city || ''
    guestConfirmName.value = ''
    guestConfirmPhone.value = ''
    guestConfirmError.value = ''
    showGuestConfirmModal.value = true
    return
  }
  confirmingRequestId.value = requestId
  showConfirmDonationModal.value = true
}

defineExpose({
  handleConfirm,
  openMapsForRequest
})
</script>
