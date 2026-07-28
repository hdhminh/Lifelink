<script setup>
import { ref, watch } from 'vue'
import { useConfirmDonation } from '@/composables/useConfirmDonation.js'
import { useActiveResponses } from '@/composables/useActiveResponses.js'
import { useToast } from '@/composables/useToast.js'
import LoadingSpinner from './LoadingSpinner.vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  requestId: { type: String, default: '' },
  hospitalName: { type: String, default: '' }
})

const emit = defineEmits(['close', 'updated'])

const { getConfirmationsForRequest, cancelConfirmationByAdmin } = useConfirmDonation()
const { responses } = useActiveResponses()
const { showToast } = useToast()

const confirmations = ref([])
const loading = ref(false)
const cancellingId = ref(null)

async function fetchDonors() {
  if (!props.requestId) return
  loading.value = true
  try {
    confirmations.value = await getConfirmationsForRequest(props.requestId)
  } catch (err) {
    showToast('Failed to load confirmed donors.', 'danger')
  } finally {
    loading.value = false
  }
}

watch(
  () => props.show,
  (newVal) => {
    if (newVal) fetchDonors()
  }
)

function getDonorTracking(donorId) {
  return responses.value.find((r) => String(r.donorId) === String(donorId))
}

async function handleCancel(conf) {
  if (!confirm(`Are you sure you want to cancel confirmation for donor ${conf.donorName || conf.donorId}?`)) return
  cancellingId.value = conf.id
  try {
    await cancelConfirmationByAdmin(conf)
    showToast(`Cancelled confirmation for ${conf.donorName || conf.donorId}.`, 'success')
    emit('updated')
    await fetchDonors()
  } catch (err) {
    showToast(err.message || 'Could not cancel donor confirmation.', 'danger')
  } finally {
    cancellingId.value = null
  }
}
</script>

<template>
  <div v-if="show" class="modal-backdrop-custom" tabindex="-1" role="dialog" aria-modal="true">
    <div class="modal-dialog modal-dialog-centered modal-lg">
      <div class="modal-content shadow-lg border-0">
        <div class="modal-header text-white" style="background-color: #8E2435">
          <h5 class="modal-title font-weight-700">
            <i class="bi bi-people-fill me-2"></i>Confirmed Donors Directory
          </h5>
          <button type="button" class="btn-close btn-close-white" @click="$emit('close')"></button>
        </div>

        <div class="modal-body p-4">
          <div class="mb-3 pb-2 border-bottom d-flex justify-content-between align-items-center">
            <span class="text-slate-600">
              Hospital: <strong class="text-slate-900">{{ hospitalName || 'Emergency Hospital' }}</strong>
            </span>
            <span class="badge text-white" style="background-color: #8E2435">
              {{ confirmations.length }} Donor(s) Confirmed
            </span>
          </div>

          <LoadingSpinner v-if="loading" message="Loading confirmed donors..." />

          <div v-else-if="confirmations.length === 0" class="text-center py-4 text-slate-500">
            <i class="bi bi-info-circle fs-2 d-block mb-2 text-wine"></i>
            No active confirmed donors for this request.
          </div>

          <div v-else class="list-group list-group-flush">
            <div
              v-for="conf in confirmations"
              :key="conf.id"
              class="list-group-item d-flex justify-content-between align-items-center p-3 border rounded mb-2 shadow-xs"
            >
              <div>
                <div class="d-flex align-items-center gap-2">
                  <strong class="text-slate-900 fs-6">{{ conf.donorName }}</strong>
                  <span class="badge bg-danger text-white">{{ conf.bloodType || 'A+' }}</span>
                  <span v-if="conf.isGuest" class="badge bg-secondary">Guest Session</span>
                </div>

                <div class="small text-slate-500 mt-1">
                  <i class="bi bi-telephone me-1 text-wine"></i> {{ conf.donorPhone || 'N/A' }}
                  <span class="ms-3 me-1">|</span>
                  <i class="bi bi-clock me-1 text-wine"></i> Confirmed:
                  {{ conf.confirmedAt ? new Date(conf.confirmedAt.seconds ? conf.confirmedAt.seconds * 1000 : conf.confirmedAt).toLocaleTimeString() : 'Recently' }}
                </div>

                <!-- GPS Signal Telemetry Badges -->
                <div class="mt-2 d-flex align-items-center gap-2">
                  <template v-if="getDonorTracking(conf.donorId)">
                    <span
                      v-if="getDonorTracking(conf.donorId).lastSeenAgo < 15 && getDonorTracking(conf.donorId).signalQuality === 'good'"
                      class="badge bg-success-subtle text-success border border-success-subtle d-inline-flex align-items-center gap-1"
                    >
                      <span class="pulse-dot"></span> LIVE GPS
                    </span>
                    <span
                      v-else
                      class="badge bg-warning-subtle text-dark border border-warning-subtle d-inline-flex align-items-center gap-1"
                    >
                      <i class="bi bi-wifi-off"></i> WEAK GPS ({{ getDonorTracking(conf.donorId).lastSeenAgo }}s ago)
                    </span>

                    <span class="small text-slate-600">
                      ETA: ~{{ getDonorTracking(conf.donorId).etaMins || 1 }} min
                    </span>
                  </template>
                  <span v-else class="badge bg-slate-100 text-slate-500 border">
                    <i class="bi bi-geo-alt me-1"></i>Offline / Awaiting GPS...
                  </span>
                </div>
              </div>

              <div>
                <button
                  class="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1 font-weight-600"
                  :disabled="cancellingId === conf.id"
                  @click="handleCancel(conf)"
                >
                  <i class="bi bi-x-circle"></i>
                  {{ cancellingId === conf.id ? 'Cancelling...' : 'Cancel Donor' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer bg-light">
          <button type="button" class="btn btn-secondary px-4 font-weight-600" @click="$emit('close')">
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop-custom {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1055;
}

.text-wine {
  color: #8E2435 !important;
}

.btn-outline-danger {
  color: #8E2435;
  border-color: #8E2435;
}
.btn-outline-danger:hover {
  background-color: #8E2435;
  color: #ffffff;
}

.pulse-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #198754;
  box-shadow: 0 0 0 rgba(25, 135, 84, 0.4);
  animation: pulse-animation 1.5s infinite;
}

@keyframes pulse-animation {
  0% {
    box-shadow: 0 0 0 0 rgba(25, 135, 84, 0.6);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(25, 135, 84, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(25, 135, 84, 0);
  }
}
</style>
