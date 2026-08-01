<template>
  <div class="ll-page-container">
    <div class="ll-section-header">
      <div>
        <div class="d-flex flex-wrap align-items-center gap-3 mb-1">
          <h1 class="ll-section-title mb-0">
            <i class="bi bi-exclamation-triangle-fill me-2" style="color: #8e2435"></i> Emergency
            Requests
          </h1>

          <span class="ll-live-badge">
            <span class="ll-live-dot" aria-hidden="true"></span>
            LIVE
          </span>
          <span class="ll-text-meta">{{ filteredRequests.length }} active requests</span>
        </div>
        <p class="ll-text-meta mb-0 mt-1">
          Browse and respond to urgent real-time blood donation needs.
        </p>
      </div>

      <div class="d-flex align-items-center gap-2">
        <button v-if="isAdmin" class="ll-btn-primary" type="button" @click="openCreateForm">
          <i class="bi bi-plus-lg me-1"></i> New Request
        </button>
      </div>
    </div>

    <div aria-live="polite" aria-atomic="true" class="visually-hidden">
      {{ requests.length }} active emergency requests loaded.
    </div>

    <section class="ll-toolbar p-4 bg-white border rounded-lg shadow-sm mb-4">
      <h2 class="fw-bold mb-3 text-slate-800" style="font-size: 1.05rem">
        <i class="bi bi-funnel-fill text-wine me-2"></i>Filter Requests
      </h2>

      <div class="row g-3">
        <!-- Blood Type Chips -->
        <div class="col-12">
          <label class="ll-text-label mb-2 d-block">Required Blood Type</label>
          <div class="d-flex flex-wrap gap-2">
            <button
              v-for="bt in ['Any', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']"
              :key="bt"
              type="button"
              :aria-label="`Filter by blood type ${bt}`"
              :class="[
                'll-chip',
                { 'll-chip--active': (bt === 'Any' && !filterBloodType) || filterBloodType === bt }
              ]"
              @click="filterBloodType = bt === 'Any' ? '' : bt"
            >
              {{ bt }}
            </button>
          </div>
        </div>

        <!-- City Text Filter & Urgency Level Chips -->
        <div class="col-12" :class="user && userProfile && !isAdmin ? 'col-md-3' : 'col-md-4'">
          <label for="filter-city" class="ll-text-label mb-2 d-block">City Location</label>
          <div class="ll-search-wrapper">
            <i class="bi bi-search ll-search-icon"></i>
            <input
              id="filter-city"
              v-model="filterCity"
              class="form-control"
              type="text"
              placeholder="Search by city..."
              aria-label="Search by city"
              autocomplete="address-level2"
            />
          </div>
        </div>

        <div class="col-12" :class="user && userProfile && !isAdmin ? 'col-md-4' : 'col-md-6'">
          <label class="ll-text-label mb-2 d-block">Urgency Tier</label>
          <div class="d-flex flex-wrap gap-2">
            <button
              v-for="level in ['All', 'Critical', 'Urgent', 'Moderate']"
              :key="level"
              type="button"
              :aria-label="`Filter by urgency level ${level}`"
              :class="[
                'll-chip',
                {
                  'll-chip--active':
                    (level === 'All' && !filterUrgency) || filterUrgency === level.toLowerCase()
                }
              ]"
              @click="filterUrgency = level === 'All' ? '' : level.toLowerCase()"
            >
              {{ level }}
            </button>
          </div>
        </div>

        <div v-if="user && userProfile && !isAdmin" class="col-12 col-md-3">
          <label class="ll-text-label mb-2 d-block">Compatibility</label>
          <div class="d-flex flex-wrap gap-2">
            <button
              type="button"
              :class="['ll-chip', { 'll-chip--active': filterCompatibleOnly }]"
              @click="filterCompatibleOnly = !filterCompatibleOnly"
            >
              <i class="bi bi-heart-pulse-fill text-wine me-1"></i> Compatible Only
            </button>
          </div>
        </div>

        <div class="col-12 col-md-2 d-flex align-items-end">
          <button class="ll-btn-secondary w-100" type="button" @click="clearFilters">
            <i class="bi bi-eraser-fill"></i> Reset
          </button>
        </div>
      </div>
    </section>

    <LoadingSpinner v-if="loading" message="Loading emergency requests..." />
    <AlertMessage v-else-if="error" type="danger" :message="error" :dismissible="false" />

    <div v-else>
      <!-- Board Grid View -->
      <div class="row g-4">
        <!-- Left Column: Live requests grid -->
        <div class="col-lg-8 col-12">
          <div v-if="filteredRequests.length === 0" class="ll-empty-state">
            <div class="ll-empty-state__icon"><i class="bi bi-droplet-fill text-danger"></i></div>
            <div class="ll-empty-state__title">No active emergency requests</div>
            <p class="ll-empty-state__body">
              {{ hasFilters ? 'Try clearing your filters.' : 'Check back soon.' }}
            </p>
          </div>
          <div v-else ref="requestListContainer" class="row g-4">
            <div
              v-for="request in paginatedRequests"
              :key="request.id"
              class="col-md-6 col-12 emergency-grid-item"
            >
              <RequestCard
                :request="request"
                :is-admin="isAdmin"
                :confirming="confirmLoading"
                :en-route-count="getEnRouteCountForRequest(request.id)"
                :has-confirmed="confirmedRequestIds.includes(String(request.id))"
                @confirm="handleConfirm(request.id)"
                @open-maps="handleOpenMaps(request.id)"
                @edit="openEditForm(request)"
                @request-delete="handleDelete(request.id)"
                @status-change="handleStatusChange(request)"
                @focus-map="handleFocusMap"
                @view-donors="handleViewDonors(request)"
              />
            </div>
          </div>
        </div>

        <!-- Right Column: Hotline directory sidebar -->
        <div class="col-lg-4 col-12">
          <aside class="ll-card p-4 mb-4">
            <h3 class="fw-bold mb-2 text-wine h5">
              <i class="bi bi-telephone-fill me-2"></i>Emergency Hotlines
            </h3>
            <p class="small text-slate-500 mb-4">
              Vietnam local emergency coordinators and medical rescue networks.
            </p>

            <div class="ll-hotline-list">
              <div class="ll-hotline-item d-flex justify-content-between align-items-center">
                <div>
                  <span class="fw-bold d-block text-slate-900">Medical Service</span>
                  <span class="small text-slate-500">Ambulance & Red Cross</span>
                </div>
                <a
                  href="tel:115"
                  class="ll-btn-primary ll-btn-sm text-decoration-none px-3 font-weight-700"
                  >115</a
                >
              </div>

              <div
                class="ll-hotline-item d-flex justify-content-between align-items-center border-top pt-3 mt-3"
              >
                <div>
                  <span class="fw-bold d-block text-slate-900">Police Dispatch</span>
                  <span class="small text-slate-500">Local emergency reporting</span>
                </div>
                <a
                  href="tel:113"
                  class="ll-btn-secondary ll-btn-sm text-decoration-none px-3 font-weight-700"
                  >113</a
                >
              </div>

              <div
                class="ll-hotline-item d-flex justify-content-between align-items-center border-top pt-3 mt-3"
              >
                <div>
                  <span class="fw-bold d-block text-slate-900">Fire & Rescue</span>
                  <span class="small text-slate-500">Rapid physical support</span>
                </div>
                <a
                  href="tel:114"
                  class="ll-btn-secondary ll-btn-sm text-decoration-none px-3 font-weight-700"
                  >114</a
                >
              </div>
            </div>
          </aside>

          <PaginationControls
            :current-page="currentPage"
            :total-pages="totalPages"
            @page-change="handlePageChange"
          />
        </div>
      </div>
    </div>

    <!-- Modals -->

    <div v-if="showForm && isAdmin" class="ll-form-overlay">
      <div class="ll-page-container ll-board-form-container">
        <RequestForm
          :initial-data="editingRequest"
          :is-editing="!!editingRequest"
          @submit="handleFormSubmit"
          @cancel="closeForm"
        />
      </div>
    </div>

    <!-- Confirm Modal for Deletion -->
    <ConfirmModal
      :show="showDeleteModal"
      title="Delete Request"
      message="Are you sure you want to permanently delete this request? This cannot be undone."
      confirm-label="Delete"
      @confirm="confirmDelete"
      @cancel="showDeleteModal = false"
    />

    <!-- Confirmation Modals Component -->
    <ConfirmationModals
      ref="modalsRef"
      :requests="requests"
      :confirmed-request-ids="confirmedRequestIds"
      @confirmed="handleConfirmedRequest"
    />

    <!-- Confirmed Donors List Modal (Admin) -->
    <ConfirmedDonorsList
      :show="showDonorsModal"
      :request-id="donorsModalRequestId"
      :hospital-name="donorsModalHospitalName"
      @close="showDonorsModal = false"
      @updated="startListening"
    />

  </div>
</template>

<script setup>
/**
 * EmergencyBoard.vue
 * Stage 3 real-time emergency request board using Firestore onSnapshot.
 */
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { collection, query, where, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { ref as dbRef, remove, get, query as dbQuery, orderByChild, equalTo } from 'firebase/database'
import { db } from '@/firebase.js'
import { rtdb } from '@/firebase.js'
import { useAuth } from '@/composables/useAuth.js'
import { useEmergencyRequests } from '@/composables/useEmergencyRequests.js'
import { useConfirmDonation } from '@/composables/useConfirmDonation.js'
import { useGeolocation } from '@/composables/useGeolocation.js'
import { useGuestSession } from '@/composables/useGuestSession.js'
import { useRouter, useRoute } from 'vue-router'
import { animate, stagger } from 'motion'
import RequestCard from '@/components/RequestCard.vue'
import RequestForm from '@/components/RequestForm.vue'
import EmergencyMap from '@/components/EmergencyMap.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import AlertMessage from '@/components/AlertMessage.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import ConfirmationModals from '@/components/ConfirmationModals.vue'
import ConfirmedDonorsList from '@/components/ConfirmedDonorsList.vue'
import PaginationControls from '@/components/PaginationControls.vue'
import { useToast } from '@/composables/useToast.js'
import { canDonateTo } from '@/utils/bloodCompatibility.js'
import { useActiveResponses } from '@/composables/useActiveResponses.js'
import { useLocationTracking } from '@/composables/useLocationTracking.js'
import { getHospitalCoordinates, HOSPITAL_DATABASE } from '@/data/hospitalCoordinates.js'

const { user, userProfile, isAdmin } = useAuth()
const guestSession = useGuestSession()
const guestId = ref(guestSession.getGuestSession().guestId)
const router = useRouter()
const route = useRoute()
const modalsRef = ref(null)
const { getEnRouteCountForRequest } = useActiveResponses()

const props = defineProps({
  defaultView: {
    type: String,
    default: ''
  }
})

const viewMode = ref(props.defaultView || 'board')

const {
  requests,
  loading,
  error,
  startListening,
  stopListening,
  filterRequests,
  createRequest,
  updateRequest,
  deleteRequest
} = useEmergencyRequests()
const {
  loading: confirmLoading,
  confirmAvailability,
  confirmGuestAvailability,
  cancelConfirmationsForRequest
} = useConfirmDonation()
const { buildMapsUrl } = useGeolocation()
const { getGuestSession, updateGuestSession } = guestSession
const { isTracking, startTracking, stopTracking, markArrived } = useLocationTracking()

// -------------------------------------------------------------
// Live Simulation Mode
// -------------------------------------------------------------
const isSimulating = ref(false)
let simulationInterval = null

const BLOOD_TYPES = ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-']
const URGENCY_LEVELS = ['critical', 'urgent', 'moderate']

async function spawnRandomEmergency() {
  const hospital = HOSPITAL_DATABASE[Math.floor(Math.random() * HOSPITAL_DATABASE.length)]
  const bloodType = BLOOD_TYPES[Math.floor(Math.random() * BLOOD_TYPES.length)]
  const urgency = URGENCY_LEVELS[Math.floor(Math.random() * URGENCY_LEVELS.length)]

  const mockRequest = {
    hospitalName: hospital.name,
    city: hospital.city,
    bloodType: bloodType,
    urgency: urgency,
    unitsNeeded: Math.floor(Math.random() * 5) + 2,
    patientInfo: 'Emergency patient requires urgent blood transfusion.',
    contactPhone: '09' + Math.floor(10000000 + Math.random() * 90000000), // Random 10-digit phone
    isMock: true
  }

  try {
    await createRequest(mockRequest, user.value ? user.value.uid : 'guest-simulation')
  } catch (err) {
    console.warn('Simulation failed to spawn request', err)
  }
}

function toggleSimulation() {
  isSimulating.value = !isSimulating.value
  if (isSimulating.value) {
    spawnRandomEmergency() // Spawn one immediately
    simulationInterval = setInterval(spawnRandomEmergency, 8000) // Spawn every 8 seconds
  } else {
    if (simulationInterval) {
      clearInterval(simulationInterval)
      simulationInterval = null
    }
  }
}

const { showToast } = useToast()

function handleConfirm(requestId) {
  if (modalsRef.value) {
    modalsRef.value.handleConfirm(requestId)
  }
}

function handleOpenMaps(requestId) {
  if (modalsRef.value) {
    modalsRef.value.openMapsForRequest(requestId)
  }
}

function handleConfirmedRequest(requestId) {
  const id = String(requestId)
  if (!confirmedRequestIds.value.includes(id)) {
    confirmedRequestIds.value = [...confirmedRequestIds.value, id]
  }
}

const mapComponentRef = ref(null)

function handleFocusMap(requestId) {
  router.push({ path: '/map', query: { request: requestId } })
}

const confirmedRequestIds = ref([])

let unsubscribeConfirmations = null

watch(
  [() => user.value, () => guestId.value],
  ([newUser, newGuestId]) => {
    if (unsubscribeConfirmations) {
      unsubscribeConfirmations()
      unsubscribeConfirmations = null
    }

    // We will listen to both collections if possible
    let userUnsub = null
    let guestUnsub = null
    const localUserIds = []
    const localGuestIds = []

    const syncIds = () => {
      confirmedRequestIds.value = [...new Set([...localUserIds, ...localGuestIds])]
    }

    if (newUser) {
      const q = query(collection(db, 'confirmations'), where('donorId', '==', newUser.uid))
      userUnsub = onSnapshot(q, (snap) => {
        localUserIds.length = 0
        snap.docs.forEach(d => localUserIds.push(String(d.data().requestId)))
        syncIds()
      })
    }

    if (newGuestId) {
      const q2 = query(collection(db, 'guestConfirmations'), where('guestSessionId', '==', newGuestId))
      guestUnsub = onSnapshot(q2, (snap) => {
        localGuestIds.length = 0
        snap.docs.forEach(d => localGuestIds.push(String(d.data().requestId)))
        syncIds()
      })
    }

    unsubscribeConfirmations = () => {
      if (userUnsub) userUnsub()
      if (guestUnsub) guestUnsub()
    }
  },
  { immediate: true }
)

const filterBloodType = ref('')
const filterCity = ref('')
const filterUrgency = ref('')
const filterCompatibleOnly = ref(false)
const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Any']

const currentPage = ref(1)
const ITEMS_PER_PAGE = 4

watch([filterBloodType, filterCity, filterUrgency, filterCompatibleOnly], () => {
  currentPage.value = 1
})

watch([filterBloodType, filterCity, filterUrgency], () => {
  if (!user.value) {
    const updates = {
      emergencyFilters: {
        bloodType: filterBloodType.value,
        city: filterCity.value,
        urgency: filterUrgency.value
      }
    }
    if (filterBloodType.value) {
      updates.preferredBloodType = filterBloodType.value
    }
    updateGuestSession(updates)
  }
})

const filteredRequests = computed(() => {
  let list = filterRequests(filterBloodType.value, filterCity.value, filterUrgency.value)

  // Apply compatible only filter if active
  if (userProfile.value && filterCompatibleOnly.value) {
    list = list.filter((req) => canDonateTo(userProfile.value.bloodType, req.bloodType))
  }

  // Keep confirmed requests visible, they will be disabled via has-confirmed prop
  
  return [...list].sort((a, b) => {
    if (userProfile.value && !isAdmin.value) {
      const compatA = canDonateTo(userProfile.value.bloodType, a.bloodType)
      const compatB = canDonateTo(userProfile.value.bloodType, b.bloodType)
      if (compatA !== compatB) {
        return compatA ? -1 : 1
      }
    }
    return getTimeValue(b.createdAt) - getTimeValue(a.createdAt)
  })
})

function getTimeValue(value) {
  if (!value) return 0
  if (typeof value.toMillis === 'function') return value.toMillis()
  if (typeof value.seconds === 'number') return value.seconds * 1000
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? 0 : date.getTime()
}

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredRequests.value.length / ITEMS_PER_PAGE))
)
const paginatedRequests = computed(() => {
  const start = (currentPage.value - 1) * ITEMS_PER_PAGE
  return filteredRequests.value.slice(start, start + ITEMS_PER_PAGE)
})

function handlePageChange(newPage) {
  if (newPage >= 1 && newPage <= totalPages.value) {
    currentPage.value = newPage
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const hasFilters = computed(
  () =>
    filterBloodType.value || filterCity.value || filterUrgency.value || filterCompatibleOnly.value
)

function clearFilters() {
  filterBloodType.value = ''
  filterCity.value = ''
  filterUrgency.value = ''
  filterCompatibleOnly.value = false
}

const showForm = ref(false)
const editingRequest = ref(null)

function openCreateForm() {
  editingRequest.value = null
  showForm.value = true
}

function openEditForm(request) {
  editingRequest.value = { ...request }
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editingRequest.value = null
}

async function handleFormSubmit(formData) {
  try {
    if (editingRequest.value) {
      await updateRequest(editingRequest.value.id, formData)
      showToast('Request updated successfully.', 'success')
    } else {
      await createRequest(formData, user.value.uid)
      showToast('Request created successfully.', 'success')
    }
    closeForm()
  } catch (err) {
    showToast(err.message || 'Request operation failed.', 'danger')
  }
}

const showDeleteModal = ref(false)
const deletingRequestId = ref(null)

function handleDelete(requestId) {
  deletingRequestId.value = requestId
  showDeleteModal.value = true
}

const showDonorsModal = ref(false)
const donorsModalRequestId = ref('')
const donorsModalHospitalName = ref('')

function handleViewDonors(request) {
  donorsModalRequestId.value = request.id
  donorsModalHospitalName.value = request.hospitalName
  showDonorsModal.value = true
}

// Set all confirmations associated with a request to status: 'cancelled' in Firestore
async function cancelAllConfirmationsForRequest(requestId, reason = 'request_cancelled') {
  try {
    await cancelConfirmationsForRequest(requestId, user.value?.uid, reason)
  } catch (err) {
    console.warn('[EmergencyBoard] Error cancelling request confirmations in Firestore:', err)
  }
}

// Remove all RTDB liveTracking entries for a given requestId
async function cleanTrackingForRequest(requestId) {
  try {
    const trackingRef = dbRef(rtdb, 'liveTracking')
    const snap = await get(trackingRef)
    if (snap.exists()) {
      const removes = []
      snap.forEach((child) => {
        if (child.val().requestId === requestId) {
          removes.push(remove(dbRef(rtdb, `liveTracking/${child.key}`)))
        }
      })
      await Promise.all(removes)
    }
  } catch (err) {
    console.warn('[EmergencyBoard] RTDB cleanup error:', err)
  }
}

async function confirmDelete() {
  if (!deletingRequestId.value) return
  try {
    await cancelAllConfirmationsForRequest(deletingRequestId.value, 'request_deleted')
    await cleanTrackingForRequest(deletingRequestId.value)
    await deleteRequest(deletingRequestId.value)
    showToast('Request deleted successfully.', 'success')
  } catch (err) {
    showToast(err.message || 'Could not delete request.', 'danger')
  } finally {
    showDeleteModal.value = false
    deletingRequestId.value = null
  }
}

async function handleStatusChange(request) {
  try {
    const nextStatus = request.status === 'active' ? 'fulfilled' : 'active'
    await updateRequest(request.id, { status: nextStatus })
    if (nextStatus === 'fulfilled') {
      await cancelAllConfirmationsForRequest(request.id, 'request_fulfilled')
      await cleanTrackingForRequest(request.id)
    }
    showToast(`Request marked as ${nextStatus}.`, 'success')
  } catch (err) {
    showToast(err.message || 'Could not update status.', 'danger')
  }
}

const requestListContainer = ref(null)

function animateCards() {
  nextTick(() => {
    if (!requestListContainer.value) return
    const cards = requestListContainer.value.querySelectorAll('.emergency-grid-item')
    animate(
      cards,
      { opacity: [0, 1], y: [16, 0] },
      { delay: stagger(0.06), duration: 0.45, easing: [0.23, 1, 0.32, 1] }
    )
  })
}

watch(loading, (newLoading) => {
  if (!newLoading) {
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      animateCards()
    } else {
      nextTick(() => {
        document.querySelectorAll('.emergency-grid-item').forEach((el) => {
          el.style.opacity = '1'
        })
      })
    }
  }
})

watch(() => route.query.respond, (reqId) => {
  if (reqId) {
    setTimeout(() => {
      handleConfirm(reqId)
      router.replace({ query: { ...route.query, respond: undefined } })
    }, 100)
  }
}, { immediate: true })

watch(
  [filterBloodType, filterCity, filterUrgency, filterCompatibleOnly, currentPage, viewMode],
  () => {
    if (viewMode.value === 'board') {
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        animateCards()
      } else {
        nextTick(() => {
          document.querySelectorAll('.emergency-grid-item').forEach((el) => {
            el.style.opacity = '1'
          })
        })
      }
    }
  }
)

onMounted(() => {
  startListening()
  if (!user.value) {
    const session = getGuestSession()
    if (session.emergencyFilters) {
      filterBloodType.value = session.emergencyFilters.bloodType || ''
      filterCity.value = session.emergencyFilters.city || ''
      filterUrgency.value = session.emergencyFilters.urgency || ''
    }
    if (session.preferredBloodType && !filterBloodType.value) {
      filterBloodType.value = session.preferredBloodType
    }
  }

  if (!loading.value) {
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      animateCards()
    } else {
      nextTick(() => {
        document.querySelectorAll('.emergency-grid-item').forEach((el) => {
          el.style.opacity = '1'
        })
      })
    }
  }
})

onUnmounted(() => {
  stopListening()
  if (unsubscribeConfirmations) {
    unsubscribeConfirmations()
  }
})
</script>

<style>
.ll-board-form-container {
  max-width: 720px;
  padding-top: 3rem;
  padding-bottom: 3rem;
}
.text-wine {
  color: var(--ll-wine-red);
}
.font-weight-700 {
  font-weight: 700;
}

/* Modal and Success Confirmation Styles */
.ll-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  z-index: 1055;
}
.modal {
  z-index: 1060;
}
.ll-modal-content {
  border: 1px solid var(--ll-slate-200);
  border-radius: var(--ll-radius-lg);
  box-shadow: var(--ll-shadow-lg);
  background: var(--ll-surface);
}
.bg-success-bg {
  background: var(--ll-success-bg);
}
.text-success {
  color: var(--ll-success-text) !important;
}

/* Custom Interactive Selection Chips */
.ll-chips-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.ll-chip {
  background-color: var(--ll-surface);
  border: 1px solid var(--ll-slate-200);
  border-radius: 6px;
  padding: 0.4rem 1rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--ll-slate-700);
  cursor: pointer;
  transition: all var(--ll-transition-fast);
  outline: none;
}
.ll-chip:hover {
  border-color: var(--ll-wine-red);
  color: var(--ll-wine-red);
  background-color: var(--ll-wine-light);
}
.ll-chip--active {
  background-color: var(--ll-wine-red) !important;
  border-color: var(--ll-wine-red) !important;
  color: #ffffff !important;
  box-shadow: 0 4px 12px rgba(142, 36, 53, 0.2);
}
.ll-chip:active {
  transform: scale(0.95);
}

.ll-btn-wine-active {
  background-color: var(--ll-wine-red, #8e2435) !important;
  color: #ffffff !important;
  box-shadow: 0 2px 6px rgba(142, 36, 53, 0.25);
}

.emergency-grid-item {
  opacity: 1;
}

@media (max-width: 767px) {
  .ll-toolbar {
    padding: 0.75rem !important;
  }
  .ll-chip {
    padding: 0.3rem 0.65rem;
    font-size: 0.78rem;
  }
  .col-lg-4 aside.ll-card {
    padding: 0.75rem !important;
  }
  .ll-section-header {
    margin-bottom: 0.75rem;
  }
}
</style>
