const { onDocumentCreated } = require('firebase-functions/v2/firestore')
const { onSchedule } = require('firebase-functions/v2/scheduler')
const logger = require('firebase-functions/logger')
const admin = require('firebase-admin')

admin.initializeApp()

// 1. Send Push Notification when a new Emergency Request is created
exports.onEmergencyCreated = onDocumentCreated('emergencyRequests/{requestId}', async (event) => {
  const snap = event.data
  if (!snap) return

  const requestData = snap.data()
  const requestId = event.params.requestId

  if (!requestData || requestData.status !== 'active') return

  const bloodType = requestData.bloodType || 'Urgent'
  const hospitalName = requestData.hospitalName || 'Bệnh viện'
  const city = requestData.city || ''

  try {
    const db = admin.firestore()

    // Query user FCM tokens
    const usersSnap = await db.collection('users').where('fcmToken', '!=', null).get()
    const tokens = new Set()

    usersSnap.forEach((doc) => {
      const token = doc.data().fcmToken
      if (token && typeof token === 'string') tokens.add(token)
    })

    // Query guest FCM tokens
    const guestsSnap = await db.collection('guestTokens').get()
    guestsSnap.forEach((doc) => {
      const token = doc.data().fcmToken
      if (token && typeof token === 'string') tokens.add(token)
    })

    const tokenList = Array.from(tokens)
    if (tokenList.length === 0) {
      logger.info('No FCM tokens registered to notify.')
      return
    }

    const payload = {
      notification: {
        title: `🚨 Máu khẩn cấp: Nhóm ${bloodType}`,
        body: `${hospitalName} ${city ? '(' + city + ')' : ''} đang cần khẩn cấp ${requestData.unitsNeeded || 1} đơn vị máu!`
      },
      data: {
        requestId,
        url: `/emergency?request=${requestId}`
      }
    }

    // FCM multicast batching (max 500 per batch)
    const BATCH_SIZE = 500
    for (let i = 0; i < tokenList.length; i += BATCH_SIZE) {
      const batchTokens = tokenList.slice(i, i + BATCH_SIZE)
      const response = await admin.messaging().sendEachForMulticast({
        tokens: batchTokens,
        ...payload
      })

      // Clean up invalid tokens
      response.responses.forEach((res, index) => {
        if (!res.success) {
          const errCode = res.error?.code
          if (
            errCode === 'messaging/invalid-registration-token' ||
            errCode === 'messaging/registration-token-not-registered'
          ) {
            const badToken = batchTokens[index]
            logger.warn(`Removing invalid token: ${badToken}`)
          }
        }
      })
    }

    logger.info(`Successfully sent FCM notification to ${tokenList.length} devices for request ${requestId}`)
  } catch (err) {
    logger.error('Error sending FCM notifications:', err)
  }
})

// 2. Scheduled Cron Job: Clean ghost responders from RTDB liveTracking (> 5 minutes inactive)
exports.cleanGhostResponders = onSchedule('every 5 minutes', async () => {
  try {
    const rtdb = admin.database()
    const snap = await rtdb.ref('liveTracking').get()

    if (!snap.exists()) return

    const now = Date.now()
    const GHOST_TTL_MS = 5 * 60 * 1000 // 5 minutes
    const updates = {}
    let ghostCount = 0

    snap.forEach((child) => {
      const val = child.val()
      const lastSeenMs = val?.lastSeenAt || val?.updatedAt || 0

      if (lastSeenMs && now - lastSeenMs > GHOST_TTL_MS) {
        updates[child.key] = null
        ghostCount++
      }
    })

    if (ghostCount > 0) {
      await rtdb.ref('liveTracking').update(updates)
      logger.info(`Cleaned up ${ghostCount} ghost responders from RTDB liveTracking.`)
    }
  } catch (err) {
    logger.error('Error cleaning ghost responders:', err)
  }
})
