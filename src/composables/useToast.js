/**
 * useToast.js
 *
 * Global toast notification system shared across all routes.
 */

import { ref } from 'vue'

const toasts = ref([])
let toastCount = 0

export function useToast() {
  /**
   * Triggers a new floating toast notification.
   * @param {string} message - Notification text.
   * @param {string} type - 'success', 'danger', 'warning', 'info'
   * @param {number} duration - Milliseconds to stay visible.
   */
  function showToast(message, type = 'info', duration = 4000) {
    const id = ++toastCount
    const newToast = { id, message, type }
    toasts.value.push(newToast)

    setTimeout(() => {
      removeToast(id)
    }, duration)
  }

  /**
   * Manually removes a toast by ID.
   * @param {number} id - Toast ID.
   */
  function removeToast(id) {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  return {
    toasts,
    showToast,
    removeToast
  }
}
