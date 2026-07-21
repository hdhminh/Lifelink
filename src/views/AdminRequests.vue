<template>
  <div class="ll-page-container">
    <div class="ll-section-header">
      <div>
        <h1 class="ll-section-title"><i class="bi bi-shield-lock me-2 text-danger"></i> Admin Request Management</h1>
        <p class="ll-text-meta mb-0">Create, edit, fulfil, cancel, or delete emergency requests.</p>
      </div>
      <button class="ll-btn-primary" type="button" @click="openCreateForm"><i class="bi bi-plus-lg me-1"></i> New Request</button>
    </div>

    <div class="ll-tabs mb-4" role="tablist" aria-label="Request status filters">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        type="button"
        class="ll-tab-button"
        :class="{ 'll-tab-button--active': selectedStatus === tab.value }"
        @click="selectedStatus = tab.value"
      >
        {{ tab.label }}
      </button>
    </div>

    <LoadingSpinner v-if="loading" message="Loading admin requests..." />
    <AlertMessage v-else-if="error" type="danger" :message="error" :dismissible="false" />

    <section v-else class="ll-card ll-table-card">
      <div class="table-responsive">
        <table class="table align-middle mb-0 ll-admin-table">
          <thead>
            <tr>
              <th scope="col">Hospital</th>
              <th scope="col">City</th>
              <th scope="col">Blood</th>
              <th scope="col">Urgency</th>
              <th scope="col">Status</th>
              <th scope="col">Units</th>
              <th scope="col">Confirmed</th>
              <th scope="col">Created</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="request in filteredAdminRequests" :key="request.id">
              <td>{{ request.hospitalName }}</td>
              <td>{{ request.city }}</td>
              <td><span class="ll-badge-blood">{{ request.bloodType }}</span></td>
              <td><span class="ll-badge" v-highlight-urgency="request.urgency">{{ request.urgency }}</span></td>
              <td>
                <select
                  class="form-select form-select-sm"
                  :value="request.status"
                  :title="`Change status for ${request.hospitalName}`"
                  @change="handleStatusSelect(request, $event.target.value)"
                >
                  <option value="active">Active</option>
                  <option value="fulfilled">Fulfilled</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </td>
              <td>{{ request.unitsNeeded }}</td>
              <td>{{ request.confirmedCount || 0 }}</td>
              <td>{{ formatDate(request.createdAt) }}</td>
              <td>
                <div class="d-flex gap-2">
                  <button class="ll-icon-button" type="button" title="Edit request" @click="openEditForm(request)"><i class="bi bi-pencil-fill"></i><span class="ll-sr-only">Edit request</span></button>
                  <button class="ll-icon-button ll-icon-button--danger" type="button" title="Delete request" @click="handleDelete(request.id)"><i class="bi bi-trash-fill"></i><span class="ll-sr-only">Delete request</span></button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredAdminRequests.length === 0">
              <td colspan="9">
                <div class="ll-empty-state py-4">
                  <div class="ll-empty-state__title">No requests in this status.</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <div v-if="showForm" class="ll-form-overlay">
      <div class="ll-page-container ll-admin-form-container">
        <RequestForm
          :initial-data="editingRequest"
          :is-editing="!!editingRequest"
          @submit="handleFormSubmit"
          @cancel="closeForm"
        />
      </div>
    </div>

    <ConfirmModal
      :show="showDeleteModal"
      title="Delete Request"
      message="Are you sure you want to permanently delete this request? This cannot be undone."
      confirm-label="Delete"
      @confirm="confirmDelete"
      @cancel="showDeleteModal = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth.js'
import { useEmergencyRequests } from '@/composables/useEmergencyRequests.js'
import RequestForm from '@/components/RequestForm.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import AlertMessage from '@/components/AlertMessage.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import { useToast } from '@/composables/useToast.js'

const { user } = useAuth()
const { requests, loading, error, fetchAllRequests, createRequest, updateRequest, deleteRequest } = useEmergencyRequests()
const { showToast } = useToast()

const selectedStatus = ref('all')
const showForm = ref(false)
const editingRequest = ref(null)
const showDeleteModal = ref(false)
const deletingRequestId = ref(null)

const tabs = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Fulfilled', value: 'fulfilled' },
  { label: 'Cancelled', value: 'cancelled' }
]

const filteredAdminRequests = computed(() => {
  if (selectedStatus.value === 'all') return requests.value
  return requests.value.filter(request => request.status === selectedStatus.value)
})

function formatDate(value) {
  if (!value) return '—'
  const date = value.toDate ? value.toDate() : new Date(value)
  return date.toLocaleDateString('en-AU')
}

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
    await fetchAllRequests()
  } catch (err) {
    showToast(err.message || 'Request operation failed.', 'danger')
  }
}

async function handleStatusSelect(request, status) {
  try {
    await updateRequest(request.id, { status })
    showToast(`Request marked as ${status}.`, 'success')
    await fetchAllRequests()
  } catch (err) {
    showToast(err.message || 'Could not update status.', 'danger')
  }
}

function handleDelete(requestId) {
  deletingRequestId.value = requestId
  showDeleteModal.value = true
}

async function confirmDelete() {
  if (!deletingRequestId.value) return
  try {
    await deleteRequest(deletingRequestId.value)
    showToast('Request deleted successfully.', 'success')
    await fetchAllRequests()
  } catch (err) {
    showToast(err.message || 'Could not delete request.', 'danger')
  } finally {
    showDeleteModal.value = false
    deletingRequestId.value = null
  }
}

onMounted(() => {
  fetchAllRequests()
})
</script>

<style scoped>
.ll-tabs {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.ll-tab-button {
  border: 1px solid var(--ll-slate-300);
  background: var(--ll-surface);
  color: var(--ll-slate-700);
  border-radius: var(--ll-radius-sm);
  padding: 0.45rem 0.9rem;
  font-weight: 600;
}

.ll-tab-button--active {
  border-color: var(--ll-crimson);
  background: var(--ll-crimson-light);
  color: var(--ll-crimson-dark);
}

.ll-table-card {
  overflow: visible;
}

.ll-admin-table th {
  color: var(--ll-slate-700);
  font-size: 0.8125rem;
  font-weight: 700;
  background: var(--ll-surface-alt);
  white-space: nowrap;
}

.ll-admin-table td {
  color: var(--ll-slate-700);
  font-size: 0.875rem;
}

.ll-icon-button {
  width: 2rem;
  height: 2rem;
  border: 1px solid var(--ll-slate-300);
  background: var(--ll-surface);
  color: var(--ll-slate-700);
  border-radius: var(--ll-radius-sm);
  font-weight: 700;
}

.ll-icon-button:hover {
  background: var(--ll-slate-100);
}

.ll-icon-button--danger {
  color: var(--ll-error);
  border-color: #FECACA;
}

.ll-admin-form-container {
  max-width: 720px;
  padding-top: 3rem;
  padding-bottom: 3rem;
}
</style>
