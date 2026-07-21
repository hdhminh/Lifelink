<template>
  <div class="ll-loading" role="status" aria-live="polite">
    <div class="ll-spinner" aria-hidden="true"></div>
    <p class="m-0">{{ message }}</p>
  </div>
</template>

<script setup>
/**
 * LoadingSpinner.vue
 * Reusable loading state indicator for async operations.
 */
defineProps({
  message: { type: String, default: 'Loading...' }
})
</script>

<style scoped>
.ll-spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid var(--ll-slate-200);
  border-top-color: var(--ll-crimson);
  border-radius: 50%;
  animation: ll-spin 0.75s linear infinite;
}

@keyframes ll-spin {
  to { transform: rotate(360deg); }
}
</style>
