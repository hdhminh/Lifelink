const { onDocumentCreated } = require('firebase-functions/v2/firestore')
const { onSchedule } = require('firebase-functions/v2/scheduler')
const logger = require('firebase-functions/logger')
const admin = require('firebase-admin')

admin.initializeApp()

exports.onEmergencyCreated = onDocumentCreated('emergencyRequests/{requestId}', async (event) => {
  const snap = event.data
  if (!snap) return

  const requestData = snap.data()
  const requestId = event.params.requestId

  if (!requestData || requestData.status !== 'active') return

  const bloodType = requestData.bloodType || 'Urgent'
  const hospitalName = requestData.hospitalName || 'Hospital'
  const city = requestData.city || ''

  try {
    const db = admin.firestore()
    const tokens = new Map()

    const usersSnap = await db.collection('users').where('fcmToken', '!=', null).get()
    usersSnap.forEach((doc) => {
      const token = doc.data().fcmToken
      if (token && typeof token === 'string') {
        tokens.set(token, { ref: doc.ref, type: 'user' })
      }
    })

    const guestsSnap = await db.collection('guestTokens').get()
    guestsSnap.forEach((doc) => {
      const token = doc.data().fcmToken
      if (token && typeof token === 'string') {
        tokens.set(token, { ref: doc.ref, type: 'guest' })
      }
    })

    const tokenList = Array.from(tokens.keys())
    if (tokenList.length === 0) {
      logger.info('No FCM tokens registered to notify.')
      return
    }

    const payload = {
      notification: {
        title: `Emergency Blood Need: Type ${bloodType}`,
        body: `${hospitalName}${city ? ` (${city})` : ''} urgently requires ${requestData.unitsNeeded || 1} unit(s) of blood.`
      },
      data: {
        requestId,
        url: `/#/emergency-board?request=${requestId}`
      }
    }

    const BATCH_SIZE = 500
    let successCount = 0
    let failureCount = 0

    for (let i = 0; i < tokenList.length; i += BATCH_SIZE) {
      const batchTokens = tokenList.slice(i, i + BATCH_SIZE)
      const response = await admin.messaging().sendEachForMulticast({
        tokens: batchTokens,
        ...payload
      })

      successCount += response.successCount
      failureCount += response.failureCount

      const cleanupWrites = []
      response.responses.forEach((res, index) => {
        if (res.success) return

        const errCode = res.error?.code
        if (
          errCode === 'messaging/invalid-registration-token' ||
          errCode === 'messaging/registration-token-not-registered'
        ) {
          const badToken = batchTokens[index]
          const tokenRecord = tokens.get(badToken)
          if (!tokenRecord) return

          if (tokenRecord.type === 'guest') {
            cleanupWrites.push(tokenRecord.ref.delete())
          } else {
            cleanupWrites.push(
              tokenRecord.ref.update({
                fcmToken: admin.firestore.FieldValue.delete(),
                fcmUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
              })
            )
          }
        }
      })

      await Promise.all(cleanupWrites)
    }

    logger.info(
      `FCM emergency notification completed for request ${requestId}: ${successCount} sent, ${failureCount} failed.`
    )
  } catch (err) {
    logger.error('Error sending FCM notifications:', err)
  }
})

exports.cleanGhostResponders = onSchedule('every 5 minutes', async () => {
  try {
    const rtdb = admin.database()
    const snap = await rtdb.ref('liveTracking').get()

    if (!snap.exists()) return

    const now = Date.now()
    const ghostTtlMs = 5 * 60 * 1000
    const updates = {}
    let ghostCount = 0

    snap.forEach((child) => {
      const val = child.val()
      const lastSeenMs = val?.lastSeenAt || val?.updatedAt || 0

      if (lastSeenMs && now - lastSeenMs > ghostTtlMs) {
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
