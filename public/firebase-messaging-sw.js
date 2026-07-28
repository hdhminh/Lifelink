// Firebase Messaging Service Worker for LifeLink Push Notifications

importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: "AIzaSyD-PlaceholderKeyForSw",
  authDomain: "lifelink-f7171.firebaseapp.com",
  projectId: "lifelink-f7171",
  storageBucket: "lifelink-f7171.appspot.com",
  messagingSenderId: "1056581404179",
  appId: "1:1056581404179:web:c67c5155f9c5d0a6234b67"
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload)

  const notificationTitle = payload.notification?.title || '🚨 LifeLink Cảnh báo máu khẩn'
  const notificationOptions = {
    body: payload.notification?.body || 'Có yêu cầu hiến máu khẩn cấp mới phù hợp!',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: payload.data || {}
  }

  self.registration.showNotification(notificationTitle, notificationOptions)
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetUrl = event.notification.data?.url || '/emergency'

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
    })
  )
})
