/**
 * offlineHandler.js
 *
 * Utility for handling offline operations and providing fallback mechanisms.
 * With Firestore's offline persistence enabled, most data is automatically
 * cached. This utility provides additional offline-aware operation helpers.
 */

import { ref } from 'vue'

// Queue for pending operations when offline
const pendingOperations = ref([])
const isProcessingQueue = ref(false)

/**
 * Wraps an async operation with offline handling.
 * If the operation fails due to network issues, queues it for retry.
 *
 * @param {Function} operation - Async function to execute
 * @param {string} description - Human-readable description for the queue
 * @param {Object} options - Configuration options
 * @returns {Promise<{success: boolean, data?: any, queued?: boolean}>}
 */
export async function withOfflineHandling(operation, description, options = {}) {
  const { showOfflineMessage = true } = options

  try {
    const result = await operation()
    return { success: true, data: result }
  } catch (error) {
    const isNetworkError =
      !navigator.onLine ||
      error.message?.includes('network') ||
      error.message?.includes('offline') ||
      error.message?.includes('unavailable') ||
      error.code === 'unavailable'

    if (isNetworkError) {
      console.warn(`[OfflineHandler] Operation queued: ${description}`)
      pendingOperations.value.push({
        id: Date.now(),
        description,
        operation,
        timestamp: new Date().toISOString(),
        retries: 0,
        maxRetries: 3
      })

      if (showOfflineMessage) {
        // Could trigger a toast notification here
        console.info('[OfflineHandler] Your changes will be saved when you reconnect.')
      }

      return { success: false, queued: true, error: 'Operation queued for offline retry' }
    }

    throw error
  }
}

/**
 * Processes queued operations when coming back online.
 * Called automatically when online status changes.
 */
export async function processQueue() {
  if (isProcessingQueue.value || pendingOperations.value.length === 0) {
    return
  }

  isProcessingQueue.value = true
  console.info(`[OfflineHandler] Processing ${pendingOperations.value.length} queued operations...`)

  const operations = [...pendingOperations.value]
  pendingOperations.value = []

  for (const op of operations) {
    try {
      await op.operation()
      console.info(`[OfflineHandler] Completed: ${op.description}`)
    } catch (error) {
      console.error(`[OfflineHandler] Failed: ${op.description}`, error)
      if (op.retries < op.maxRetries) {
        pendingOperations.value.push({ ...op, retries: op.retries + 1 })
      }
    }
  }

  isProcessingQueue.value = false
}

// Listen for online events to process queue
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    setTimeout(processQueue, 1000) // Small delay to ensure connection is stable
  })
}

/**
 * Gets the count of pending operations.
 * @returns {number}
 */
export function getPendingCount() {
  return pendingOperations.value.length
}

/**
 * Clears all pending operations.
 */
export function clearPendingOperations() {
  pendingOperations.value = []
}

export { pendingOperations, isProcessingQueue }
