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

// Cloud Function Trigger: When a registered donor confirms availability
// Helper: Send FCM Push Notification to all Admins (for closed tabs)
async function sendFcmToAdmins(title, body, url = '') {
  try {
    const db = admin.firestore()
    const adminsSnap = await db.collection('users').where('role', '==', 'admin').where('fcmToken', '!=', null).get()
    const tokens = []
    adminsSnap.forEach((doc) => {
      const token = doc.data().fcmToken
      if (token && typeof token === 'string') tokens.push(token)
    })
    if (tokens.length > 0) {
      await admin.messaging().sendEachForMulticast({
        tokens,
        notification: { title, body },
        data: { url }
      })
      logger.info(`Sent FCM push notification to ${tokens.length} admin(s).`)
    }
  } catch (err) {
    logger.error('Error sending FCM push to admins:', err)
  }
}

// Helper: Send FCM Push Notification to a specific User or Guest (for closed tabs)
async function sendFcmToUserOrGuest(targetId, title, body, url = '') {
  try {
    const db = admin.firestore()
    let token = null

    const userDoc = await db.collection('users').doc(targetId).get()
    if (userDoc.exists && userDoc.data().fcmToken) {
      token = userDoc.data().fcmToken
    } else {
      const guestDoc = await db.collection('guestTokens').doc(targetId).get()
      if (guestDoc.exists && guestDoc.data().fcmToken) {
        token = guestDoc.data().fcmToken
      }
    }

    if (token) {
      await admin.messaging().send({
        token,
        notification: { title, body },
        data: { url }
      })
      logger.info(`Sent FCM push notification to target user/guest ${targetId}.`)
    }
  } catch (err) {
    logger.error(`Error sending FCM push to user/guest ${targetId}:`, err)
  }
}

exports.onConfirmationCreated = onDocumentCreated('confirmations/{confId}', async (event) => {
  const snap = event.data
  if (!snap) return
  const data = snap.data()
  if (!data) return

  const title = 'New Emergency Donor Confirmation'
  const message = `${data.donorName || 'A donor'} (${data.bloodType || ''}) confirmed for emergency request.`

  try {
    const db = admin.firestore()
    await db.collection('notifications').add({
      targetRole: 'admin',
      title,
      message,
      type: 'new_confirmation',
      requestId: data.requestId || '',
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    })
    logger.info(`Cloud Function onConfirmationCreated created admin notification for req ${data.requestId}`)
    await sendFcmToAdmins(title, message, '/#/admin/request-management')
  } catch (err) {
    logger.error('Error in onConfirmationCreated Cloud Function:', err)
  }
})

// Cloud Function Trigger: When a guest donor confirms availability
exports.onGuestConfirmationCreated = onDocumentCreated('guestConfirmations/{confId}', async (event) => {
  const snap = event.data
  if (!snap) return
  const data = snap.data()
  if (!data) return

  const title = 'New Emergency Guest Confirmation'
  const message = `${data.donorName || 'A guest'} (${data.bloodType || ''}) confirmed for emergency request.`

  try {
    const db = admin.firestore()
    await db.collection('notifications').add({
      targetRole: 'admin',
      title,
      message,
      type: 'new_confirmation',
      requestId: data.requestId || '',
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    })
    logger.info(`Cloud Function onGuestConfirmationCreated created admin notification for req ${data.requestId}`)
    await sendFcmToAdmins(title, message, '/#/admin/request-management')
  } catch (err) {
    logger.error('Error in onGuestConfirmationCreated Cloud Function:', err)
  }
})

// Cloud Function Trigger: When admin changes donor confirmation status to cancelled
const { onDocumentUpdated } = require('firebase-functions/v2/firestore')

exports.onConfirmationUpdated = onDocumentUpdated('confirmations/{confId}', async (event) => {
  const beforeData = event.data?.before?.data()
  const afterData = event.data?.after?.data()
  if (!afterData) return

  if (beforeData?.status !== 'cancelled' && afterData.status === 'cancelled') {
    const targetUserId = afterData.donorId
    if (!targetUserId) return

    const title = 'Registration Cancelled'
    const message = 'Your donation confirmation has been cancelled by Admin.'

    try {
      const db = admin.firestore()
      await db.collection('notifications').add({
        userId: targetUserId,
        title,
        message,
        type: 'cancellation',
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      })
      logger.info(`Cloud Function onConfirmationUpdated sent cancellation notification to user ${targetUserId}`)
      await sendFcmToUserOrGuest(targetUserId, title, message, '/#/donor-dashboard')
    } catch (err) {
      logger.error('Error in onConfirmationUpdated Cloud Function:', err)
    }
  }
})

// Cloud Function Trigger: When admin changes guest confirmation status to cancelled
exports.onGuestConfirmationUpdated = onDocumentUpdated('guestConfirmations/{confId}', async (event) => {
  const beforeData = event.data?.before?.data()
  const afterData = event.data?.after?.data()
  if (!afterData) return

  if (beforeData?.status !== 'cancelled' && afterData.status === 'cancelled') {
    const targetUserId = afterData.guestSessionId || afterData.donorId
    if (!targetUserId) return

    const title = 'Registration Cancelled'
    const message = 'Your donation confirmation has been cancelled by Admin.'

    try {
      const db = admin.firestore()
      await db.collection('notifications').add({
        userId: targetUserId,
        title,
        message,
        type: 'cancellation',
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      })
      logger.info(`Cloud Function onGuestConfirmationUpdated sent cancellation notification to guest ${targetUserId}`)
      await sendFcmToUserOrGuest(targetUserId, title, message, '/#/donor-dashboard')
    } catch (err) {
      logger.error('Error in onGuestConfirmationUpdated Cloud Function:', err)
    }
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
