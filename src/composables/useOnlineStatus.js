/**
 * useOnlineStatus.js
 *
 * Composable to track online/offline status using navigator.onLine
 * and online/offline browser events. Also manages offline operation queue.
 */

import { ref, onMounted, onUnmounted, computed } from 'vue'
import { pendingOperations, processQueue } from '@/utils/offlineHandler.js'

export function useOnlineStatus() {
  const isOnline = ref(navigator.onLine)

  function handleOnline() {
    isOnline.value = true
    // Process any queued operations when coming back online
    processQueue()
  }

  function handleOffline() {
    isOnline.value = false
  }

  const formattedStatus = computed(() => {
    return isOnline.value ? 'Online' : 'Offline'
  })

  const statusMessage = computed(() => {
    if (isOnline.value) {
      return 'You are back online. All features are available.'
    }
    return 'You are currently offline. Some features may be limited.'
  })

  const pendingCount = computed(() => pendingOperations.value.length)

  onMounted(() => {
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
  })

  onUnmounted(() => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  })

  return {
    isOnline,
    formattedStatus,
    statusMessage,
    pendingCount
  }
}
