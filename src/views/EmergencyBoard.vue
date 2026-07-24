<template>
  <div class="ll-page-container">
    <div class="ll-section-header">
      <div class="d-flex flex-wrap align-items-center gap-3">
        <h1 class="ll-section-title"><i class="bi bi-exclamation-triangle-fill text-danger me-2"></i> Emergency Request Board</h1>
        <span class="ll-live-badge">
          <span class="ll-live-dot" aria-hidden="true"></span>
          LIVE
        </span>
        <span class="ll-text-meta">{{ filteredRequests.length }} active requests</span>
      </div>

      <div class="d-flex align-items-center gap-2">
        <div class="ll-view-switch p-1 rounded-pill bg-white border border-slate-200 shadow-xs d-inline-flex align-items-center">
          <button
            type="button"
            :class="['btn btn-sm rounded-pill px-3 py-1 font-weight-700 border-0', viewMode === 'board' ? 'll-btn-wine-active' : 'text-slate-600']"
            @click="viewMode = 'board'"
          >
            <i class="bi bi-grid-fill me-1"></i> Board View
          </button>
          <button
            type="button"
            :class="['btn btn-sm rounded-pill px-3 py-1 font-weight-700 border-0', viewMode === 'map' ? 'll-btn-wine-active' : 'text-slate-600']"
            @click="viewMode = 'map'"
          >
            <i class="bi bi-geo-alt-fill me-1"></i> Live Map
          </button>
        </div>
        <button v-if="isAdmin" class="ll-btn-primary" type="button" @click="openCreateForm"><i class="bi bi-plus-lg me-1"></i> New Request</button>
      </div>
    </div>



    <div aria-live="polite" aria-atomic="true" class="visually-hidden">
      {{ requests.length }} active emergency requests loaded.
    </div>

    <section class="ll-toolbar p-4 bg-white border rounded-lg shadow-sm mb-4">
      <h5 class="fw-bold mb-3 text-slate-800" style="font-size: 1.05rem;"><i class="bi bi-funnel-fill text-wine me-2"></i>Filter Requests</h5>
      
      <div class="row g-4">
        <!-- Blood Type Chips -->
        <div class="col-12">
          <label class="ll-text-label mb-2 d-block">Required Blood Type</label>
          <div class="d-flex flex-wrap gap-2">
            <button
              v-for="bt in ['Any', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']"
              :key="bt"
              type="button"
              :class="['ll-chip', { 'll-chip--active': (bt === 'Any' && !filterBloodType) || (filterBloodType === bt) }]"
              @click="filterBloodType = (bt === 'Any' ? '' : bt)"
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
            <input id="filter-city" v-model="filterCity" class="form-control" type="text" placeholder="Search by city..." aria-label="Search by city" autocomplete="address-level2">
          </div>
        </div>

        <div class="col-12" :class="user && userProfile && !isAdmin ? 'col-md-4' : 'col-md-6'">
          <label class="ll-text-label mb-2 d-block">Urgency Tier</label>
          <div class="d-flex flex-wrap gap-2">
            <button
              v-for="level in ['All', 'Critical', 'Urgent', 'Moderate']"
              :key="level"
              type="button"
              :class="['ll-chip', { 'll-chip--active': (level === 'All' && !filterUrgency) || (filterUrgency === level.toLowerCase()) }]"
              @click="filterUrgency = (level === 'All' ? '' : level.toLowerCase())"
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
      <!-- Live Response Map View -->
      <div v-show="viewMode === 'map'" class="mb-5">
        <EmergencyMap :emergency-requests="requests" :is-visible="viewMode === 'map'" />
      </div>

      <!-- Board Grid View -->
      <div v-show="viewMode === 'board'" class="row g-4">

      <!-- Left Column: Live requests grid -->
      <div class="col-lg-8 col-12">
        <div v-if="filteredRequests.length === 0" class="ll-empty-state">
          <div class="ll-empty-state__icon"><i class="bi bi-droplet-fill text-danger"></i></div>
          <div class="ll-empty-state__title">No active emergency requests</div>
          <p class="ll-empty-state__body">{{ hasFilters ? 'Try clearing your filters.' : 'Check back soon.' }}</p>
        </div>
        <div v-else class="row g-4" ref="requestListContainer">
          <div v-for="request in paginatedRequests" :key="request.id" class="col-md-6 col-12 emergency-grid-item">
            <RequestCard
              :request="request"
              :is-admin="isAdmin"
              :confirming="confirmLoading"
              :en-route-count="getEnRouteCountForRequest(request.id)"
              @confirm="handleConfirm(request.id)"
              @edit="openEditForm(request)"
              @delete="handleDelete(request.id)"
              @status-change="handleStatusChange(request)"
            />
          </div>
        </div>
      </div>


      <!-- Right Column: Hotline directory sidebar -->
      <div class="col-lg-4 col-12">
        <aside class="ll-card p-4 mb-4">
          <h5 class="fw-bold mb-2 text-wine"><i class="bi bi-telephone-fill me-2"></i>Emergency Hotlines</h5>
          <p class="small text-slate-500 mb-4">Vietnam local emergency coordinators and medical rescue networks.</p>
          
          <div class="ll-hotline-list">
            <div class="ll-hotline-item d-flex justify-content-between align-items-center">
              <div>
                <span class="fw-bold d-block text-slate-900">Medical Service</span>
                <span class="small text-slate-500">Ambulance & Red Cross</span>
              </div>
              <a href="tel:115" class="ll-btn-primary ll-btn-sm text-decoration-none px-3 font-weight-700">115</a>
            </div>
            
            <div class="ll-hotline-item d-flex justify-content-between align-items-center border-top pt-3 mt-3">
              <div>
                <span class="fw-bold d-block text-slate-900">Police Dispatch</span>
                <span class="small text-slate-500">Local emergency reporting</span>
              </div>
              <a href="tel:113" class="ll-btn-secondary ll-btn-sm text-decoration-none px-3 font-weight-700">113</a>
            </div>
            
            <div class="ll-hotline-item d-flex justify-content-between align-items-center border-top pt-3 mt-3">
              <div>
                <span class="fw-bold d-block text-slate-900">Fire & Rescue</span>
                <span class="small text-slate-500">Rapid physical support</span>
              </div>
              <a href="tel:114" class="ll-btn-secondary ll-btn-sm text-decoration-none px-3 font-weight-700">114</a>
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
      <div v-if="showMapsConfirmModal" class="ll-modal-backdrop" @click="closeMapsConfirmModal"></div>
      <div v-if="showMapsConfirmModal" class="modal d-block" tabindex="-1" role="dialog" aria-modal="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content ll-modal-content text-center p-4">
            <div class="mb-3">
              <div class="mx-auto d-flex align-items-center justify-content-center rounded-circle bg-success-bg text-success" style="width: 64px; height: 64px;">
                <i class="bi bi-check-circle-fill" style="font-size: 2.5rem;"></i>
              </div>
            </div>
            <h5 class="fw-bold text-slate-900 mb-2">Confirmation Successful!</h5>
            <p class="text-slate-500 mb-4 px-2" style="font-size: 0.95rem;">
              Would you like to open Google Maps for immediate directions to the hospital?
            </p>
            <div class="d-flex flex-column gap-2">
              <button type="button" class="btn ll-btn-primary w-100 d-flex align-items-center justify-content-center gap-2" @click="handleOpenMaps">
                <i class="bi bi-geo-alt-fill"></i> Open Google Maps
              </button>
              <button type="button" class="btn btn-link text-slate-400 text-decoration-none py-1" @click="closeMapsConfirmModal">
                No, thanks
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Guest One-Time Confirmation Modal -->
    <Teleport to="body">
      <div v-if="showGuestConfirmModal" class="ll-modal-backdrop" @click="showGuestConfirmModal = false"></div>
      <div v-if="showGuestConfirmModal" class="modal d-block" tabindex="-1" role="dialog" aria-modal="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content ll-modal-content p-4">
            <!-- Header -->
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h5 class="fw-bold text-slate-900 m-0"><i class="bi bi-heart-fill text-danger me-2"></i>One-Time Confirmation</h5>
              <button type="button" class="btn-close" @click="showGuestConfirmModal = false" aria-label="Close"></button>
            </div>
            
            <!-- Success Screen -->
            <div v-if="guestConfirmSuccess" class="text-center">
              <div class="mb-3">
                <div class="mx-auto d-flex align-items-center justify-content-center rounded-circle bg-success-bg text-success" style="width: 64px; height: 64px;">
                  <i class="bi bi-check-circle-fill" style="font-size: 2.5rem;"></i>
                </div>
              </div>
              <h5 class="fw-bold text-slate-900 mb-2">Confirmation Successful!</h5>
              <p class="text-slate-500 mb-4 px-2" style="font-size: 0.95rem;">
                Thank you for your life-saving contribution. Would you like to open Google Maps for immediate directions to {{ guestConfirmHospital }}?
              </p>
              <div class="d-flex flex-column gap-2">
                <button type="button" class="btn ll-btn-primary w-100 d-flex align-items-center justify-content-center gap-2" @click="handleOpenGuestMaps">
                  <i class="bi bi-geo-alt-fill"></i> Open Google Maps
                </button>
                <button type="button" class="btn btn-link text-slate-400 text-decoration-none py-1" @click="showGuestConfirmModal = false">
                  No, thanks
                </button>
              </div>
            </div>

            <!-- Form Screen -->
            <div v-else>
              <p class="text-slate-500 mb-3 small">
                Confirm your availability for <strong>{{ guestConfirmHospital }}</strong> in {{ guestConfirmCity }}. No registration is required.
              </p>
              
              <div v-if="guestConfirmError" class="alert alert-danger py-2 px-3 small mb-3">
                {{ guestConfirmError }}
              </div>

              <div class="mb-3">
                <label for="guest-name" class="form-label fw-bold small text-slate-700">Full Name *</label>
                <input
                  id="guest-name"
                  v-model="guestConfirmName"
                  type="text"
                  class="form-control"
                  placeholder="e.g. John Doe"
                  autocomplete="name"
                  required
                >
              </div>

              <div class="mb-3">
                <label for="guest-phone" class="form-label fw-bold small text-slate-700">Phone Number (Optional)</label>
                <input
                  id="guest-phone"
                  v-model="guestConfirmPhone"
                  type="tel"
                  class="form-control"
                  placeholder="e.g. +84 901234567"
                  autocomplete="tel"
                >
              </div>

              <div class="d-flex gap-2 mt-4">
                <button type="button" class="ll-btn-secondary w-50" @click="showGuestConfirmModal = false">Cancel</button>
                <button type="button" class="ll-btn-primary w-50" @click="commitGuestConfirm">Confirm</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
/**
 * EmergencyBoard.vue
 * Stage 3 real-time emergency request board using Firestore onSnapshot.
 */
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '@/firebase.js'
import { useAuth } from '@/composables/useAuth.js'
import { useEmergencyRequests } from '@/composables/useEmergencyRequests.js'
import { useConfirmDonation } from '@/composables/useConfirmDonation.js'
import { useGeolocation } from '@/composables/useGeolocation.js'
import { useGuestSession } from '@/composables/useGuestSession.js'
import { useRouter } from 'vue-router'
import { animate, stagger } from 'motion'
import RequestCard from '@/components/RequestCard.vue'
import RequestForm from '@/components/RequestForm.vue'
import EmergencyMap from '@/components/EmergencyMap.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import AlertMessage from '@/components/AlertMessage.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import PaginationControls from '@/components/PaginationControls.vue'
import { useToast } from '@/composables/useToast.js'
import { canDonateTo } from '@/utils/bloodCompatibility.js'
import { useActiveResponses } from '@/composables/useActiveResponses.js'

const { user, userProfile, isAdmin } = useAuth()
const router = useRouter()
const { getEnRouteCountForRequest } = useActiveResponses()

const viewMode = ref(isAdmin.value ? 'map' : 'board')

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
  confirmGuestAvailability
} = useConfirmDonation()
const { buildMapsUrl } = useGeolocation()
const { getGuestSession, updateGuestSession } = useGuestSession()

const { showToast } = useToast()

const showMapsConfirmModal = ref(false)
const pendingMapUrl = ref('')

function closeMapsConfirmModal() {
  showMapsConfirmModal.value = false
  pendingMapUrl.value = ''
}

function handleOpenMaps() {
  if (pendingMapUrl.value) {
    window.open(pendingMapUrl.value, '_blank')
  }
  closeMapsConfirmModal()
}

const confirmedRequestIds = ref([])
let unsubscribeConfirmations = null

watch(user, (newUser) => {
  if (unsubscribeConfirmations) {
    unsubscribeConfirmations()
    unsubscribeConfirmations = null
  }
  if (newUser) {
    const q = query(
      collection(db, 'confirmations'),
      where('donorId', '==', newUser.uid)
    )
    unsubscribeConfirmations = onSnapshot(q, (snap) => {
      confirmedRequestIds.value = snap.docs.map(doc => doc.data().requestId)
    }, (err) => {
      console.error('[EmergencyBoard] Error listening to user confirmations:', err)
    })
  } else {
    confirmedRequestIds.value = []
  }
}, { immediate: true })

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
  const urgencyOrder = { critical: 0, urgent: 1, moderate: 2 }
  let list = filterRequests(filterBloodType.value, filterCity.value, filterUrgency.value)
  
  // Apply compatible only filter if active
  if (userProfile.value && filterCompatibleOnly.value) {
    list = list.filter(req => canDonateTo(userProfile.value.bloodType, req.bloodType))
  }
  
  // Hide already confirmed requests for the current user
  const unconfirmed = list.filter(req => !confirmedRequestIds.value.includes(req.id))
  
  return unconfirmed.sort((a, b) => {
    // 1. Sort compatible requests to top for logged-in donors
    if (userProfile.value && !isAdmin.value) {
      const compatA = canDonateTo(userProfile.value.bloodType, a.bloodType)
      const compatB = canDonateTo(userProfile.value.bloodType, b.bloodType)
      if (compatA !== compatB) {
        return compatA ? -1 : 1
      }
    }
    // 2. Sort by urgency level
    return urgencyOrder[a.urgency] - urgencyOrder[b.urgency]
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredRequests.value.length / ITEMS_PER_PAGE)))
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

const hasFilters = computed(() => filterBloodType.value || filterCity.value || filterUrgency.value || filterCompatibleOnly.value)

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

async function confirmDelete() {
  if (!deletingRequestId.value) return
  try {
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
    showToast(`Request marked as ${nextStatus}.`, 'success')
  } catch (err) {
    showToast(err.message || 'Could not update status.', 'danger')
  }
}

const showConfirmDonationModal = ref(false)
const confirmingRequestId = ref(null)

// Guest Confirmation States
const showGuestConfirmModal = ref(false)
const guestConfirmName = ref('')
const guestConfirmPhone = ref('')
const guestConfirmRequestId = ref('')
const guestConfirmHospital = ref('')
const guestConfirmCity = ref('')
const guestConfirmError = ref('')
const guestConfirmSuccess = ref(false)

/**
 * Handles confirmation click. Displays one-time guest confirmation if not logged in.
 * @param {string} requestId - Request ID to confirm.
 */
async function handleConfirm(requestId) {
  const req = requests.value.find(r => r.id === requestId)
  if (!req) return

  if (!user.value) {
    guestConfirmRequestId.value = requestId
    guestConfirmHospital.value = req.hospitalName || 'Hospital'
    guestConfirmCity.value = req.city || ''
    guestConfirmName.value = ''
    guestConfirmPhone.value = ''
    guestConfirmError.value = ''
    guestConfirmSuccess.value = false
    showGuestConfirmModal.value = true
    return
  }
  confirmingRequestId.value = requestId
  showConfirmDonationModal.value = true
}

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
    guestConfirmSuccess.value = true
    showToast('Availability confirmed successfully.', 'success')
  } catch (err) {
    console.error('Failed to commit guest confirmation:', err)
    guestConfirmError.value = 'Could not confirm. Please check your network and try again.'
  }
}

function handleOpenGuestMaps() {
  const queryText = `${guestConfirmHospital.value}, ${guestConfirmCity.value}, Vietnam`
  const url = `https://maps.google.com/?q=${encodeURIComponent(queryText)}`
  window.open(url, '_blank')
  showGuestConfirmModal.value = false
}

/**
 * Commits the donation confirmation database query.
 */
async function commitConfirmDonation() {
  if (!confirmingRequestId.value || !user.value || !userProfile.value) return
  const reqId = confirmingRequestId.value
  const targetRequest = requests.value.find(r => r.id === reqId)
  try {
    await confirmAvailability(reqId, {
      donorId: user.value.uid,
      donorName: userProfile.value.displayName,
      donorPhone: userProfile.value.phoneNumber || 'N/A',
      bloodType: userProfile.value.bloodType
    })
    
    showToast('Availability confirmed successfully! The board will update live.', 'success')
    if (targetRequest) {
      const mapUrl = buildMapsUrl((targetRequest.hospitalName || 'Emergency Request') + ', ' + (targetRequest.city || ''))
      pendingMapUrl.value = mapUrl
      showMapsConfirmModal.value = true
    }
  } catch (err) {
    showToast(err.message || 'Confirmation failed.', 'danger')
  } finally {
    showConfirmDonationModal.value = false
    confirmingRequestId.value = null
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
        document.querySelectorAll('.emergency-grid-item').forEach(el => {
          el.style.opacity = '1'
        })
      })
    }
  }
})

watch([filterBloodType, filterCity, filterUrgency, filterCompatibleOnly, currentPage, viewMode], () => {
  if (viewMode.value === 'board') {
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      animateCards()
    } else {
      nextTick(() => {
        document.querySelectorAll('.emergency-grid-item').forEach(el => {
          el.style.opacity = '1'
        })
      })
    }
  }
})


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
        document.querySelectorAll('.emergency-grid-item').forEach(el => {
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

<style scoped>
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
  border-radius: 99px;
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
  background-color: var(--ll-wine-red, #8E2435) !important;
  color: #ffffff !important;
  box-shadow: 0 2px 6px rgba(142, 36, 53, 0.25);
}

.emergency-grid-item {
  opacity: 1;
}

</style>
