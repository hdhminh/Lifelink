import { computed, ref } from 'vue'

const STORAGE_KEY = 'lifelink_notification_center'
const MAX_NOTIFICATIONS = 20

const notifications = ref(loadNotifications())

function loadNotifications() {
  if (typeof window === 'undefined') return []
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function persistNotifications() {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.value))
}

export function useNotificationCenter() {
  const unreadCount = computed(() => notifications.value.filter((item) => !item.read).length)

  function addNotification({ title, body, type = 'info', url = '' }) {
    const item = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      title: title || 'LifeLink notification',
      body: body || '',
      type,
      url,
      read: false,
      createdAt: new Date().toISOString()
    }

    notifications.value = [item, ...notifications.value].slice(0, MAX_NOTIFICATIONS)
    persistNotifications()
    return item
  }

  function markAllRead() {
    notifications.value = notifications.value.map((item) => ({ ...item, read: true }))
    persistNotifications()
  }

  function clearNotifications() {
    notifications.value = []
    persistNotifications()
  }

  return {
    notifications,
    unreadCount,
    addNotification,
    markAllRead,
    clearNotifications
  }
}
