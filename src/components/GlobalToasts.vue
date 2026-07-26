<template>
  <div class="ll-toast-container" aria-live="polite">
    <transition-group name="toast">
      <div
        v-for="(toast, idx) in toasts"
        :key="toast.id"
        :class="['ll-alert', `ll-alert--${toast.type}`]"
        role="alert"
        :style="{ transitionDelay: idx > 0 ? `${idx * 0.05}s` : '0s' }"
      >
        <span class="d-flex align-items-center gap-2">
          <i :class="getAlertIcon(toast.type)" aria-hidden="true"></i>
          <span>{{ toast.message }}</span>
        </span>
        <button
          class="ll-alert__close"
          type="button"
          aria-label="Close notification"
          @click="removeToast(toast.id)"
        >
          x
        </button>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { useToast } from '@/composables/useToast.js'

const { toasts, removeToast } = useToast()

function getAlertIcon(type) {
  switch (type) {
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
}
</script>
