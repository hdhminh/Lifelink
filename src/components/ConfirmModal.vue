<template>
  <Teleport to="body">
    <div v-if="show" class="ll-modal-backdrop" @click="emit('cancel')"></div>
    <div
      v-if="show"
      class="modal d-block"
      tabindex="-1"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content ll-modal-content">
          <div class="modal-header ll-modal-header">
            <h5 :id="titleId" class="modal-title">{{ title }}</h5>
            <button type="button" class="btn-close" aria-label="Close" @click="emit('cancel')"></button>
          </div>
          <div class="modal-body">
            <p class="m-0">{{ message }}</p>
          </div>
          <div class="modal-footer ll-modal-footer">
            <button type="button" class="ll-btn-secondary" @click="emit('cancel')">Cancel</button>
            <button type="button" class="ll-btn-danger" @click="emit('confirm')">{{ confirmLabel }}</button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
/**
 * ConfirmModal.vue
 * Confirmation dialog for destructive actions.
 */
import { computed } from 'vue'

const props = defineProps({
  title: { type: String, default: 'Confirm Action' },
  message: { type: String, required: true },
  confirmLabel: { type: String, default: 'Confirm' },
  show: { type: Boolean, default: false }
})

const emit = defineEmits(['confirm', 'cancel'])
const titleId = computed(() => `ll-modal-${props.title.replace(/\s+/g, '-').toLowerCase()}`)
</script>

<style scoped>
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
}

.ll-modal-header,
.ll-modal-footer {
  background: var(--ll-surface-alt);
}
</style>
