<template>
  <Transition name="slide-down">
    <div v-if="!isOnline" class="ll-offline-banner" role="status" aria-live="polite">
      <div class="ll-offline-banner__content">
        <i class="bi bi-wifi-off" aria-hidden="true"></i>
        <span class="ll-offline-banner__text">{{ statusMessage }}</span>
        <span v-if="pendingCount > 0" class="ll-offline-banner__pending">
          <i class="bi bi-clock-history" aria-hidden="true"></i>
          {{ pendingCount }} pending change{{ pendingCount > 1 ? 's' : '' }}
        </span>
      </div>
    </div>
  </Transition>
</template>

<script setup>
/**
 * OfflineIndicator.vue
 *
 * Global banner that displays when the user loses internet connectivity.
 * Automatically hides when back online. Shows pending operation count.
 */
import { useOnlineStatus } from '@/composables/useOnlineStatus.js'

const { isOnline, statusMessage, pendingCount } = useOnlineStatus()
</script>

<style scoped>
.ll-offline-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #6c496e 0%, #8b5a62 100%);
  color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.ll-offline-banner__content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  max-width: 1200px;
  margin: 0 auto;
  flex-wrap: wrap;
}

.ll-offline-banner i {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.ll-offline-banner__text {
  font-size: 0.95rem;
  font-weight: 500;
  text-align: center;
}

.ll-offline-banner__pending {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
  background: rgba(255, 255, 255, 0.2);
  padding: 0.2rem 0.6rem;
  border-radius: 1rem;
}

/* Transition animations */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
</style>
