/**
 * useToast.js
 *
 * Global toast notification system shared across all routes.
 */

import { ref } from 'vue'

const toasts = ref([])
let toastCount = 0
const activeTimers = new Map()

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

    const timerId = setTimeout(() => {
      removeToast(id)
      activeTimers.delete(id)
    }, duration)

    activeTimers.set(id, timerId)
  }

  /**
   * Manually removes a toast by ID.
   * @param {number} id - Toast ID.
   */
  function removeToast(id) {
    if (activeTimers.has(id)) {
      clearTimeout(activeTimers.get(id))
      activeTimers.delete(id)
    }
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  /**
   * Clears all active toasts and cancels their timers.
   */
  function clearAllToasts() {
    for (const timerId of activeTimers.values()) {
      clearTimeout(timerId)
    }
    activeTimers.clear()
    toasts.value = []
  }

  return {
    toasts,
    showToast,
    removeToast,
    clearAllToasts
  }
}
