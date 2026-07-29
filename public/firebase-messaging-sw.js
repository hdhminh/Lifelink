// Firebase Messaging Service Worker for LifeLink Push Notifications

importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: 'AIzaSyDMvlpr_PcejdILSEwSoPEpzpCU3QN73Vc',
  authDomain: 'lifelink-f7171.firebaseapp.com',
  projectId: 'lifelink-f7171',
  storageBucket: 'lifelink-f7171.firebasestorage.app',
  messagingSenderId: '1054898679327',
  appId: '1:1054898679327:web:d6d73bdae1fc01ad5d2f2a'
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload)

  const notificationTitle = payload.notification?.title || 'LifeLink Emergency Blood Alert'
  const notificationOptions = {
    body: payload.notification?.body || 'A matching emergency blood request is available.',
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
