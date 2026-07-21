<template>
  <div v-if="visible && message" :class="['ll-alert', `ll-alert--${type}`]" role="alert">
    <span class="d-flex align-items-center gap-2">
      <i :class="alertIcon" aria-hidden="true"></i>
      <span>{{ message }}</span>
    </span>
    <button
      v-if="dismissible"
      class="ll-alert__close"
      type="button"
      aria-label="Close alert"
      @click="visible = false"
    >
      ×
    </button>
  </div>
</template>

<script setup>
/**
 * AlertMessage.vue
 * Reusable success/error/warning/info alert banner with optional dismiss.
 */
import { ref, watch, computed } from 'vue'

const props = defineProps({
  type: { type: String, default: 'info' },
  message: { type: String, required: true },
  dismissible: { type: Boolean, default: true }
})

const alertIcon = computed(() => {
  switch (props.type) {
    case 'success':
      return 'bi bi-check-circle-fill'
    case 'danger':
      return 'bi bi-exclamation-octagon-fill'
    case 'warning':
      return 'bi bi-exclamation-triangle-fill'
    case 'info':
    default:
      return 'bi bi-info-circle-fill'
  }
})

const visible = ref(true)

watch(() => props.message, () => {
  visible.value = true
})

watch(() => props.type, () => {
  if (props.type === 'success') {
    setTimeout(() => {
      visible.value = false
    }, 5000)
  }
}, { immediate: true })
</script>

<style scoped>
.ll-alert__close {
  border: none;
  background: transparent;
  color: inherit;
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;
}
</style>
