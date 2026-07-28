<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useConfirmDonation } from '@/composables/useConfirmDonation.js'
import { useActiveResponses } from '@/composables/useActiveResponses.js'
import { useAuth } from '@/composables/useAuth.js'
import { useToast } from '@/composables/useToast.js'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  requestId: {
    type: String,
    default: ''
  },
  hospitalName: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['close', 'updated'])

const { user } = useAuth()
const { showToast } = useToast()
const { getConfirmationsForRequest, cancelConfirmationByAdmin } = useConfirmDonation()
const { responses, startListening, stopListening } = useActiveResponses()

const confirmations = ref([])
const loading = ref(false)
const cancellingId = ref(null)

async function loadDonors() {
  if (!props.requestId) return
  loading.value = true
  try {
    confirmations.value = await getConfirmationsForRequest(props.requestId)
  } catch (err) {
    console.error('Failed to load confirmed donors:', err)
  } finally {
    loading.value = false
  }
}

watch(
  () => props.show,
  (isShowing) => {
    if (isShowing) {
      loadDonors()
      startListening()
    } else {
      stopListening()
    }
  }
)

function getDonorTrackingStatus(donorId) {
  if (!donorId) return { label: 'Chưa có vị trí', class: 'bg-secondary-subtle text-secondary' }
  const active = responses.value.find(
    (r) => (r.donorId === donorId || r.guestSessionId === donorId) && r.requestId === props.requestId
  )

  if (!active) {
    return { label: 'Ngoại tuyến', class: 'bg-secondary-subtle text-secondary border' }
  }

  if (active.latitude != null) {
    return { label: 'Đang di chuyển', class: 'bg-success-subtle text-success border border-success-subtle' }
  }

  return { label: 'Chờ kết nối GPS...', class: 'bg-warning-subtle text-dark border border-warning-subtle' }
}

async function handleCancelDonor(donor) {
  if (!confirm(`Bạn có chắc chắn muốn hủy xác nhận của donor "${donor.donorName || donor.guestName}"?`)) {
    return
  }

  cancellingId.value = donor.id
  try {
    await cancelConfirmationByAdmin(donor.id, props.requestId, user.value?.uid, donor.isGuest)
    showToast('Đã hủy xác nhận của donor thành công.', 'success')
    await loadDonors()
    emit('updated')
  } catch (err) {
    showToast(err.message || 'Không thể hủy xác nhận.', 'danger')
  } finally {
    cancellingId.value = null
  }
}

onMounted(() => {
  if (props.show) {
    loadDonors()
    startListening()
  }
})

onUnmounted(() => {
  stopListening()
})
</script>

<template>
  <div v-if="show" class="modal-backdrop-custom" @click.self="emit('close')">
    <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="donors-list-title">
      <div class="modal-card-header">
        <div class="d-flex align-items-center gap-2">
          <i class="bi bi-people-fill text-wine fs-5"></i>
          <strong id="donors-list-title" class="fs-6 text-wine">
            Danh sách Donors đã xác nhận ({{ confirmations.length }})
          </strong>
        </div>
        <button type="button" class="btn-close-custom" aria-label="Close" @click="emit('close')">&times;</button>
      </div>

      <div class="modal-card-body">
        <div v-if="hospitalName" class="hospital-subtext">
          <i class="bi bi-hospital me-1"></i>{{ hospitalName }}
        </div>

        <div v-if="loading" class="text-center py-4 text-muted">
          <span class="spinner-border spinner-border-sm text-wine me-2" role="status"></span>
          Đang tải danh sách...
        </div>

        <div v-else-if="confirmations.length === 0" class="text-center py-4 text-muted">
          <i class="bi bi-inbox fs-3 d-block mb-2 text-wine opacity-50"></i>
          Chưa có donor nào xác nhận yêu cầu này.
        </div>

        <div v-else class="donor-list">
          <div
            v-for="donor in confirmations"
            :key="donor.id"
            class="donor-item card border shadow-sm p-3 mb-2"
          >
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <div class="d-flex align-items-center gap-2 mb-1">
                  <strong class="donor-name text-dark">
                    {{ donor.donorName || donor.guestName }}
                  </strong>
                  <span class="badge bg-danger-subtle text-wine border border-danger-subtle fw-bold">
                    {{ donor.bloodType }}
                  </span>
                  <span v-if="donor.isGuest" class="badge bg-secondary-subtle text-secondary border">
                    Khách
                  </span>
                </div>

                <div class="small text-muted mb-1">
                  <i class="bi bi-telephone me-1"></i>
                  <a :href="'tel:' + (donor.donorPhone || donor.guestPhone)" class="text-decoration-none text-muted fw-medium">
                    {{ donor.donorPhone || donor.guestPhone }}
                  </a>
                </div>

                <div class="mt-2">
                  <span
                    class="badge"
                    :class="getDonorTrackingStatus(donor.isGuest ? donor.guestSessionId : donor.donorId).class"
                  >
                    <i class="bi bi-geo-alt-fill me-1"></i>
                    {{ getDonorTrackingStatus(donor.isGuest ? donor.guestSessionId : donor.donorId).label }}
                  </span>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  class="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1"
                  :disabled="cancellingId === donor.id"
                  @click="handleCancelDonor(donor)"
                >
                  <span v-if="cancellingId === donor.id" class="spinner-border spinner-border-sm" role="status"></span>
                  <i v-else class="bi bi-x-circle me-1"></i>
                  Hủy xác nhận
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-card-footer">
        <button type="button" class="btn btn-sm btn-secondary" @click="emit('close')">
          Đóng
        </button>
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
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
  padding: 1rem;
}

.modal-card {
  background-color: #ffffff;
  border-radius: 12px;
  width: 520px;
  max-width: 100%;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(142, 36, 53, 0.2);
  border: 1px solid rgba(142, 36, 53, 0.15);
  overflow: hidden;
}

.modal-card-header {
  padding: 1rem 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #FAF5F6;
  background-color: #FAF5F6;
}

.text-wine {
  color: #8E2435 !important;
}

.btn-close-custom {
  background: none;
  border: none;
  font-size: 1.5rem;
  line-height: 1;
  color: #8E2435;
  cursor: pointer;
  padding: 0;
}

.modal-card-body {
  padding: 1.25rem;
  overflow-y: auto;
  flex: 1;
}

.hospital-subtext {
  font-size: 0.85rem;
  color: #718096;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px dashed #E2E8F0;
}

.donor-item {
  border-radius: 8px;
  transition: all 0.2s ease;
}

.donor-item:hover {
  border-color: rgba(142, 36, 53, 0.25) !important;
  background-color: #FAF5F6;
}

.donor-name {
  font-size: 0.95rem;
}

.modal-card-footer {
  padding: 0.85rem 1.25rem;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid #EDF2F7;
  background-color: #F7FAFC;
}
</style>
