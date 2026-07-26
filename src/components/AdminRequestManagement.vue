<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h5 class="fw-bold mb-0 text-slate-900">
        <i class="bi bi-exclamation-triangle-fill text-wine me-2"></i>Emergency Requests
      </h5>
      <button
        class="ll-btn-primary btn-sm px-3"
        type="button"
        @click="$emit('open-create-request-form')"
      >
        <i class="bi bi-plus-lg me-1"></i> New Request
      </button>
    </div>

    <div class="ll-tabs mb-4" role="tablist" aria-label="Request status filters">
      <button
        v-for="tab in requestStatusTabs"
        :key="tab.value"
        type="button"
        class="ll-tab-button btn-sm py-1 px-3 dashboard-style-30"
        :class="{ 'll-tab-button--active': selectedRequestStatus === tab.value }"
        @click="$emit('update:selectedRequestStatus', tab.value)"
      >
        {{ tab.label }}
      </button>
    </div>

    <div v-if="requestsLoadingState" class="text-center py-4">
      <div class="spinner-border spinner-border-sm text-danger" role="status"></div>
    </div>
    <div v-else class="ll-card ll-table-card">
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
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="req in filteredAdminRequests" :key="req.id">
              <tr>
                <td>
                  <strong>{{ req.hospitalName }}</strong>
                </td>
                <td>{{ req.city }}</td>
                <td>
                  <span class="ll-badge-blood">{{ req.bloodType }}</span>
                </td>
                <td>
                  <span v-highlight-urgency="req.urgency" class="ll-badge">{{
                    req.urgency
                  }}</span>
                </td>
                <td>
                  <select
                    class="form-select form-select-sm"
                    :value="req.status"
                    :title="`Change status for ${req.hospitalName}`"
                    @change="$emit('handle-request-status-select', req, $event.target.value)"
                  >
                    <option value="active">Active</option>
                    <option value="fulfilled">Fulfilled</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
                <td>{{ req.unitsNeeded }}</td>
                <td>{{ req.confirmedCount || 0 }}</td>
                <td>
                  <div class="d-flex gap-2 align-items-center">
                    <button
                      class="ll-btn-secondary btn-sm py-1 px-2 dashboard-style-31"
                      type="button"
                      @click="$emit('toggle-request-expand', req.id)"
                    >
                      <i
                        class="bi"
                        :class="
                          expandedRequestIds.includes(req.id)
                            ? 'bi-chevron-up'
                            : 'bi-people-fill'
                        "
                      ></i>
                      Donors ({{ req.confirmedCount || 0 }})
                    </button>
                    <button
                      class="ll-icon-button"
                      type="button"
                      title="Edit request"
                      @click="$emit('open-edit-request-form', req)"
                    >
                      <i class="bi bi-pencil-fill"></i>
                    </button>
                    <button
                      class="ll-icon-button ll-icon-button--danger"
                      type="button"
                      title="Delete request"
                      @click="$emit('handle-delete-request', req.id)"
                    >
                      <i class="bi bi-trash-fill"></i>
                    </button>
                  </div>
                </td>
              </tr>

              <!-- Expandable Donors Details Row -->
              <tr v-if="expandedRequestIds.includes(req.id)" class="ll-expanded-row">
                <td colspan="8" class="p-3 dashboard-style-32">
                  <div class="card shadow-none border border-slate-100 mb-0">
                    <div class="card-header py-2 bg-slate-50">
                      <span class="small fw-bold text-slate-800"
                        ><i class="bi bi-people-fill text-wine me-1"></i>Confirmed Donors
                        for {{ req.hospitalName }}</span
                      >
                    </div>
                    <div class="card-body p-0">
                      <div
                        v-if="getConfirmationsForRequest(req.id).length === 0"
                        class="text-center py-3 text-slate-400 small"
                      >
                        No donors confirmed for this request yet.
                      </div>
                      <table v-else class="table table-sm align-middle mb-0 small">
                        <thead>
                          <tr class="table-light">
                            <th scope="col" class="ps-3">Name</th>
                            <th scope="col">Phone Number</th>
                            <th scope="col">Blood Type</th>
                            <th scope="col">Confirmed Date</th>
                            <th scope="col">Status</th>
                            <th scope="col" class="text-end pe-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="c in getConfirmationsForRequest(req.id)" :key="c.id">
                            <td class="ps-3">
                              <strong>{{ c.donorName }}</strong>
                            </td>
                            <td>
                              <a
                                v-if="c.donorPhone && c.donorPhone !== 'N/A'"
                                :href="`tel:${c.donorPhone}`"
                                class="text-wine text-decoration-none fw-bold"
                              >
                                <i class="bi bi-telephone-fill me-1"></i>{{ c.donorPhone }}
                              </a>
                              <span v-else class="text-muted">N/A</span>
                            </td>
                            <td>
                              <span class="badge bg-danger">{{ c.bloodType }}</span>
                            </td>
                            <td>{{ formatDateTime(c.createdAt) }}</td>
                            <td>
                              <select
                                class="form-select form-select-sm ll-select-button dashboard-style-33"
                                :value="c.status || 'confirmed'"
                                @change="
                                  $emit('change-confirmation-status', c.id, $event.target.value)
                                "
                              >
                                <option value="confirmed">Confirmed</option>
                                <option value="arrived">Arrived</option>
                                <option value="donated">Donated</option>
                                <option value="completed">Completed</option>
                              </select>
                            </td>
                            <td class="text-end pe-3">
                              <button
                                class="btn btn-sm btn-outline-danger py-0 px-2 dashboard-style-31"
                                type="button"
                                @click="$emit('handle-cancel-confirmation', c.id, req.id, c.donorName)"
                              >
                                <i class="bi bi-x-circle me-1"></i>Cancel Donation
                              </button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
            <tr v-if="filteredAdminRequests.length === 0">
              <td colspan="8" class="text-center py-4 text-slate-500">
                No requests found in this status.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  requestStatusTabs: { type: Array, required: true },
  selectedRequestStatus: { type: String, required: true },
  requestsLoadingState: { type: Boolean, default: false },
  filteredAdminRequests: { type: Array, default: () => [] },
  expandedRequestIds: { type: Array, default: () => [] },
  getConfirmationsForRequest: { type: Function, required: true },
  formatDateTime: { type: Function, required: true }
})

const vHighlightUrgency = {
  mounted(el, binding) {
    const val = binding.value
    if (val === 'critical') {
      el.classList.add('ll-badge-critical')
    } else if (val === 'urgent') {
      el.classList.add('ll-badge-urgent')
    } else {
      el.classList.add('ll-badge-normal')
    }
  }
}

defineEmits([
  'open-create-request-form',
  'update:selectedRequestStatus',
  'handle-request-status-select',
  'toggle-request-expand',
  'open-edit-request-form',
  'handle-delete-request',
  'change-confirmation-status',
  'handle-cancel-confirmation'
])
</script>
