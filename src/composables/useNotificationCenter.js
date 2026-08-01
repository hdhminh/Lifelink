import { computed, ref } from 'vue'

const STORAGE_KEY = 'lifelink_notification_center'
const CLEARED_NOTIFS_KEY = 'lifelink_cleared_notification_ids'
const MAX_NOTIFICATIONS = 20

const notifications = ref(loadNotifications())
const clearedIds = ref(loadClearedIds())

function loadNotifications() {
  if (typeof window === 'undefined') return []
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function loadClearedIds() {
  if (typeof window === 'undefined') return new Set()
  try {
    const parsed = JSON.parse(window.localStorage.getItem(CLEARED_NOTIFS_KEY) || '[]')
    return new Set(Array.isArray(parsed) ? parsed : [])
  } catch {
    return new Set()
  }
}

function persistNotifications() {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.value))
}

function persistClearedIds() {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(CLEARED_NOTIFS_KEY, JSON.stringify(Array.from(clearedIds.value)))
}

export function useNotificationCenter() {
  const unreadCount = computed(() => notifications.value.filter((item) => !item.read).length)

  function addNotification({ id, title, body, type = 'info', url = '' }) {
    const notifId = id || `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    // Do not re-add if this notification ID was explicitly cleared by the user
    if (clearedIds.value.has(notifId)) {
      return
    }

    // Prevent duplicate entries by ID
    if (notifications.value.some((n) => n.id === notifId)) {
      return
    }

    const item = {
      id: notifId,
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
    notifications.value.forEach((n) => {
      if (n.id) clearedIds.value.add(n.id)
    })
    persistClearedIds()

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
