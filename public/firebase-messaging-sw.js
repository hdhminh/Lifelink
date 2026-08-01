// Firebase Messaging Service Worker for LifeLink Push Notifications

importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js')

const urlParams = new URL(location).searchParams
const configString = urlParams.get('firebaseConfig')

if (configString) {
  try {
    const firebaseConfig = JSON.parse(decodeURIComponent(configString))
    firebase.initializeApp(firebaseConfig)
  } catch (error) {
    console.error('[firebase-messaging-sw.js] Error parsing firebaseConfig:', error)
  }
} else {
  console.error('[firebase-messaging-sw.js] No firebaseConfig found in URL parameters.')
}

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload)

  // If payload already contains a 'notification' key, browser Web Push engine displays it automatically.
  // Returning here prevents duplicate (double) notifications.
  if (payload.notification) {
    return
  }

  const notificationTitle = payload.data?.title || 'LifeLink Notification'
  const notificationOptions = {
    body: payload.data?.body || '',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: payload.data || {}
  }

  self.registration.showNotification(notificationTitle, notificationOptions)
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetUrl = event.notification.data?.url || '/#/emergency-board'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(targetUrl)
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl)
      }
      return null
    })
  )
})
